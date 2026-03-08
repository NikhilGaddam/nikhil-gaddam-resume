/**
 * Cloudflare Worker — nikhilgaddam.com analytics
 *
 * Routes:
 *   POST /api/track  — log a visit (called from index.html)
 *   GET  /api/admin  — return analytics JSON (?token=<ADMIN_TOKEN>)
 *
 * Env vars (set in Cloudflare dashboard or wrangler.toml [vars]):
 *   ADMIN_TOKEN  — secret string to protect the admin endpoint
 *
 * D1 binding: DB (see wrangler.toml)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /api/track ─────────────────────────────────────────────────────
    if (url.pathname === '/api/track' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));

        // Cloudflare automatically injects the real client IP and country
        const ip      = request.headers.get('CF-Connecting-IP') || 'unknown';
        const country = request.headers.get('CF-IPCountry')     || '';
        const ua      = request.headers.get('User-Agent')       || '';
        const time    = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO visits (time, ip, country, ua, ref, page, screen, lang)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          time,
          ip,
          country,
          ua,
          body.ref    || '',
          body.page   || '/',
          body.screen || '',
          body.lang   || '',
        ).run();

        return json({ ok: true });
      } catch (err) {
        return json({ ok: false, error: err.message }, 500);
      }
    }

    // ── GET /api/admin ──────────────────────────────────────────────────────
    if (url.pathname === '/api/admin' && request.method === 'GET') {
      const token = url.searchParams.get('token') || '';
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
      }

      const stats = await env.DB.prepare(
        `SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_ips FROM visits`
      ).first();

      const { results: visits } = await env.DB.prepare(
        `SELECT * FROM visits ORDER BY time DESC LIMIT 500`
      ).all();

      return json({ stats, visits });
    }

    return new Response('Not found', { status: 404 });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
