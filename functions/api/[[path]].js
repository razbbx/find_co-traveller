/**
 * Cloudflare Pages Function — /api/markers
 * Binding: env.CARPOOL_BUCKET (R2)
 *
 * GET  /api/markers         → { "YYYY-MM-DD": [marker, ...], ... }
 * POST /api/markers         → body { date, marker } — appends marker
 * DELETE /api/markers/:id   → moves marker to deleted storage
 * GET  /api/deleted         → returns all deleted markers
 * POST /api/restore         → body { id } — restores marker
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pass, X-Carpool-Client',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// R2 key helpers
const dateKey = (d) => `markers/${d}.json`;
const indexKey = 'markers/index.json';
const deletedKey = 'markers/deleted.json';

// In-memory rate limiting map for Cloudflare Worker Isolate
const ipLimits = new Map();
const TURNSTILE_SECRET = '0x4AAAAAADAOslIWACsmOGzFebByluWx2EE';

async function getIndex(bucket) {
  const obj = await bucket.get(indexKey);
  if (!obj) return [];
  return JSON.parse(await obj.text());
}

async function saveIndex(bucket, dates) {
  await bucket.put(indexKey, JSON.stringify([...new Set(dates)].sort()), {
    httpMetadata: { contentType: 'application/json' },
  });
}

async function getDateMarkers(bucket, date) {
  const obj = await bucket.get(dateKey(date));
  if (!obj) return [];
  return JSON.parse(await obj.text());
}

async function saveDateMarkers(bucket, date, markers) {
  await bucket.put(dateKey(date), JSON.stringify(markers), {
    httpMetadata: { contentType: 'application/json' },
  });
}

async function getDeletedMarkers(bucket) {
  const obj = await bucket.get(deletedKey);
  if (!obj) return [];
  return JSON.parse(await obj.text());
}

async function saveDeletedMarkers(bucket, markers) {
  await bucket.put(deletedKey, JSON.stringify(markers.slice(0, 100)), {
    httpMetadata: { contentType: 'application/json' },
  });
}

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const bucket = env.CARPOOL_BUCKET;

  if (!bucket) {
    return json({ error: 'R2 bucket not bound. Add CARPOOL_BUCKET binding.' }, 500);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Basic anti-scraping Origin check for state-changing requests
  if (['POST', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('Origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        // If the origin exists and is not the same host and not localhost, block it.
        // This stops simple form posts from external sites.
        if (originUrl.host !== url.host && !originUrl.host.includes('localhost') && !originUrl.host.includes('127.0.0.1')) {
          return json({ error: 'Invalid Origin' }, 403);
        }
      } catch (e) {
        return json({ error: 'Invalid Origin Header' }, 403);
      }
    }
  }

  // Helper to check admin access
  const checkAdmin = async () => {
    const auth = request.headers.get('X-Admin-Pass');
    const ADMIN_PASS = env.ADMIN_PASS;
    if (!ADMIN_PASS) return false;
    return auth === ADMIN_PASS;
  };

  // GET /api/deleted — admin only (shared logs)
  if (path === '/api/deleted' && request.method === 'GET') {
    if (!(await checkAdmin())) return json({ error: 'Unauthorized' }, 401);
    return json(await getDeletedMarkers(bucket));
  }

  // POST /api/restore
  if (path === '/api/restore' && request.method === 'POST') {
    if (!(await checkAdmin())) return json({ error: 'Unauthorized (Invalid Password)' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { id } = body;
    if (!id) return json({ error: 'Missing ID' }, 400);

    const deleted = await getDeletedMarkers(bucket);
    const idx = deleted.findIndex(item => item.marker.id == id);
    if (idx === -1) return json({ error: `Marker ${id} not found in trash` }, 404);

    const item = deleted.splice(idx, 1)[0];
    await saveDeletedMarkers(bucket, deleted);

    // Add back to active
    const { date, marker } = item;
    const existing = await getDateMarkers(bucket, date);
    existing.push(marker);
    await saveDateMarkers(bucket, date, existing);

    // Update index
    const dates = await getIndex(bucket);
    if (!dates.includes(date)) {
      dates.push(date);
      await saveIndex(bucket, dates);
    }

    return json({ ok: true });
  }

  // GET /api/markers — fetch all markers grouped by date
  if (path === '/api/markers' && request.method === 'GET') {
    // Basic anti-scraping check
    if (request.headers.get('X-Carpool-Client') !== 'true') {
      return json({ error: 'Forbidden' }, 403);
    }

    const isAdmin = await checkAdmin();
    const dates = await getIndex(bucket);
    const result = {};
    await Promise.all(dates.map(async (d) => {
      const dayMarkers = await getDateMarkers(bucket, d);
      if (!isAdmin) {
        dayMarkers.forEach(m => {
          if (m.phone) m.phone = '🔒 Click to Reveal';
        });
      }
      result[d] = dayMarkers;
    }));
    return json(result);
  }

  // POST /api/reveal — fetch unmasked phone number
  if (path === '/api/reveal' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { id, date, token, sessionId } = body;
    if (!id || !date || !sessionId) return json({ error: 'Missing id, date, or session identifier' }, 400);

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const trackerId = sessionId; // Track by browser session, not IP

    const isAdmin = await checkAdmin();
    const ipData = ipLimits.get(trackerId) || { count: 0, lastReq: 0 };
    const timeSince = Date.now() - ipData.lastReq;

    if (!isAdmin) {
      if (ipData.count >= 5) {
        return json({ error: 'Session limit reached (Max 5 reveals). Please try again later.' }, 403);
      }

      if (timeSince < 60000 && ipData.count > 0) {
        if (!token) return json({ error: 'Rate limited', waitMs: 60000 - timeSince }, 429);

        const formData = new FormData();
        formData.append('secret', TURNSTILE_SECRET);
        formData.append('response', token);
        formData.append('remoteip', ip);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData
        });
        const outcome = await verifyRes.json();
        if (!outcome.success) return json({ error: 'Invalid CAPTCHA' }, 403);
      }
    }

    const dayMarkers = await getDateMarkers(bucket, date);
    const mk = dayMarkers.find(m => m.id == id);
    if (!mk) return json({ error: 'Marker not found' }, 404);

    if (ipLimits.size > 10000) ipLimits.clear(); // Prevent memory leak

    ipData.count += 1;
    ipData.lastReq = Date.now();
    ipLimits.set(trackerId, ipData);

    return json({ phone: mk.phone });
  }

  // POST /api/markers — add marker
  if (path === '/api/markers' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { date, marker } = body;
    if (!date || !marker) return json({ error: 'Missing date or marker' }, 400);

    const existing = await getDateMarkers(bucket, date);
    existing.push(marker);
    await saveDateMarkers(bucket, date, existing);

    // Update index
    const idx = await getIndex(bucket);
    if (!idx.includes(date)) {
      idx.push(date);
      await saveIndex(bucket, idx);
    }

    return json({ ok: true });
  }

  // DELETE /api/markers/:id — remove marker by id
  const pathParts = path.split('/').filter(Boolean);
  const markerId = Number(pathParts[pathParts.length - 1]);

  if (request.method === 'DELETE' && markerId) {
    // Basic protection for deletions via dashboard
    if (!(await checkAdmin())) return json({ error: 'Unauthorized' }, 401);

    const targetDate = url.searchParams.get('date');
    const targetTs = url.searchParams.get('ts');
    const dates = targetDate ? [targetDate] : await getIndex(bucket);
    let foundItem = null;

    for (const d of dates) {
      const markers = await getDateMarkers(bucket, d);
      let idx = -1;
      if (targetTs) idx = markers.findIndex(m => m.id == markerId && m.ts == targetTs);
      if (idx === -1) idx = markers.findIndex(m => m.id == markerId); // Fallback
      if (idx !== -1) {
        const [removed] = markers.splice(idx, 1);
        foundItem = { date: d, marker: removed, deletedAt: Date.now() };

        if (markers.length > 0) {
          await saveDateMarkers(bucket, d, markers);
        } else {
          await bucket.delete(dateKey(d));
          const currentIndex = await getIndex(bucket);
          const newIdx = currentIndex.filter(x => x !== d);
          await saveIndex(bucket, newIdx);
        }
        break;
      }
    }

    if (foundItem) {
      const deleted = await getDeletedMarkers(bucket);
      deleted.unshift(foundItem);
      await saveDeletedMarkers(bucket, deleted);
    }

    return json({ ok: !!foundItem });
  }

  return json({ error: 'Method not allowed' }, 405);
}

