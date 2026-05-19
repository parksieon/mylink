// Cloudflare Worker — Cron trigger for TimeFilm ticket monitor.
// Fires every minute and pokes the Vercel-hosted /api/cron/poll endpoint,
// which does the real work (Interpark polling + FCM dispatch).
//
// Why split this out:
//   Vercel Hobby plan only allows daily cron. Cloudflare Workers free tier
//   supports minute-level triggers with 100k requests/day quota.
//
// Setup (one-time):
//   wrangler secret put CRON_SECRET   # must match Vercel env var
// Then edit wrangler.toml VERCEL_URL and run `wrangler deploy`.

export default {
  async scheduled(event, env, ctx) {
    const url = `${env.VERCEL_URL}/api/cron/poll`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
        cf: { cacheTtl: 0 },
      });
      const body = await res.text();
      const ms = Date.now() - start;
      console.log(`poll status=${res.status} ms=${ms} body=${body.slice(0, 300)}`);
      if (!res.ok) {
        throw new Error(`Upstream ${res.status}: ${body.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`poll failed: ${err.message}`);
      throw err; // surfaces in wrangler tail / Workers metrics
    }
  },
};
