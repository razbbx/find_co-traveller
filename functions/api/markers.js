/**
 * Cloudflare Pages Function — /api/markers
 * Binding: env.CARPOOL_BUCKET (R2)
 *
 * GET  /api/markers         → { "YYYY-MM-DD": [marker, ...], ... }
 * POST /api/markers         → body { date, marker } — appends marker
 * DELETE /api/markers/:id   → removes marker with given id from all dates
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
const dateKey  = (d) => `markers/${d}.json`;
const indexKey = 'markers/index.json';

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

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const bucket = env.CARPOOL_BUCKET;

  if (!bucket) {
    return json({ error: 'R2 bucket not bound. Add CARPOOL_BUCKET binding.' }, 500);
  }

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // GET /api/markers — return all data
  if (request.method === 'GET') {
    const dates = await getIndex(bucket);
    const result = {};
    await Promise.all(dates.map(async (d) => {
      result[d] = await getDateMarkers(bucket, d);
    }));
    return json(result);
  }

  // POST /api/markers — add marker
  if (request.method === 'POST') {
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
  // The URL will be /api/markers/1234
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const markerId = Number(pathParts[pathParts.length - 1]);

  if (request.method === 'DELETE' && markerId) {
    const dates = await getIndex(bucket);
    let found = false;

    for (const d of dates) {
      const markers = await getDateMarkers(bucket, d);
      const filtered = markers.filter(m => m.id !== markerId);
      if (filtered.length !== markers.length) {
        found = true;
        if (filtered.length > 0) {
          await saveDateMarkers(bucket, d, filtered);
        } else {
          await bucket.delete(dateKey(d));
          const newIdx = dates.filter(x => x !== d);
          await saveIndex(bucket, newIdx);
        }
        break;
      }
    }

    return json({ ok: found });
  }

  return json({ error: 'Method not allowed' }, 405);
}
