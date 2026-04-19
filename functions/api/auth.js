/**
 * Cloudflare Pages Function — /api/auth
 *
 * POST /api/auth  { pass: string }
 * Validates the admin password against the ADMIN_PASS environment variable
 * set securely in the Cloudflare Pages dashboard (never in source code).
 *
 * To set the env variable:
 *   CF Dashboard → Pages → your project → Settings → Environment variables
 *   Add: ADMIN_PASS = <your secret password>
 */

const CORS = {
  'Access-Control-Allow-Origin': 'same-origin',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export async function onRequest(ctx) {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const ADMIN_PASS = env.ADMIN_PASS || 'jayanuskariddhi';
  const ok = body.pass === ADMIN_PASS;
  return json({ ok });
}
