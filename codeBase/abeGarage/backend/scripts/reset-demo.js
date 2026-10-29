// Restores the demo data (accounts, services, customers, vehicles, orders)
// to the seeded state. Meant to run on a schedule for a public demo, so
// visitors' changes don't pile up:  npm run demo:reset
// Uses the same rules as `npm run seed` (SEED_*_PASSWORD, and
// SEED_ALLOW_PRODUCTION=true in production). Exits non-zero on failure so a
// scheduler can alert.
const knex = require("knex");
const config = require("../knexfile");
const pino = require("pino");

// plain pino (not utils/logger): resetting data shouldn't require the app's
// settings such as JWT_SECRET
const log = pino({ level: process.env.LOG_LEVEL || "info" });

(async () => {
  const started = Date.now();
  const db = knex(config);
  try {
    await db.seed.run();
    log.info({ event: "demo_reset", ok: true, duration_ms: Date.now() - started }, "demo data restored");
  } catch (err) {
    log.error({ event: "demo_reset", ok: false, err }, "demo reset failed");
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();
