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
  'Access-Control-Allow-Origin': 'same-origin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// R2 key helpers
const dateKey    = (d) => `markers/${d}.json`;
const indexKey   = 'markers/index.json';
const deletedKey = 'markers/deleted.json';

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

  // Helper to check admin access
  const checkAdmin = async () => {
    const auth = request.headers.get('X-Admin-Pass');
    const ADMIN_PASS = env.ADMIN_PASS || 'jayanuskariddhi';
    return auth === ADMIN_PASS;
  };

  // GET /api/deleted — admin only (shared logs)
  if (path === '/api/deleted' && request.method === 'GET') {
    if (!(await checkAdmin())) return json({ error: 'Unauthorized' }, 401);
    return json(await getDeletedMarkers(bucket));
  }

  // POST /api/restore
  if (path === '/api/restore' && request.method === 'POST') {
    if (!(await checkAdmin())) return json({ error: 'Unauthorized' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { id } = body;
    if (!id) return json({ error: 'Missing ID' }, 400);

    const deleted = await getDeletedMarkers(bucket);
    const idx = deleted.findIndex(item => item.marker.id === id);
    if (idx === -1) return json({ error: 'Marker not found in trash' }, 404);

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

  // GET /api/markers — return all data
  if (path === '/api/markers' && request.method === 'GET') {
    const dates = await getIndex(bucket);
    const result = {};
    await Promise.all(dates.map(async (d) => {
      result[d] = await getDateMarkers(bucket, d);
    }));
    return json(result);
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

    const dates = await getIndex(bucket);
    let foundItem = null;

    for (const d of dates) {
      const markers = await getDateMarkers(bucket, d);
      const idx = markers.findIndex(m => m.id === markerId);
      if (idx !== -1) {
        const [removed] = markers.splice(idx, 1);
        foundItem = { date: d, marker: removed, deletedAt: Date.now() };

        if (markers.length > 0) {
          await saveDateMarkers(bucket, d, markers);
        } else {
          await bucket.delete(dateKey(d));
          const newIdx = dates.filter(x => x !== d);
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

