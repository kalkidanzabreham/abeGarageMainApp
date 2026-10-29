const query = require("../config/db.config");
const { wrapAll } = require("../utils/asyncHandler");

const DB_CHECK_TIMEOUT_MS = 2000;

// GET /api/health: is the API up and can it reach the database?
// 200 when both are fine, 503 when the database check fails or is slow.
// Public (for load balancers / uptime checks), so it reveals nothing beyond
// up/down: no versions, hostnames or error details.
const health = async (req, res) => {
  const started = Date.now();
  let db = "ok";
  let timer;
  try {
    await Promise.race([
      query("SELECT 1"),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("db check timed out")), DB_CHECK_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    db = "unreachable";
    req.log.error({ err }, "health check: database unreachable");
  } finally {
    clearTimeout(timer); // don't leave a pending timer per health check
  }
  const ok = db === "ok";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "error",
    db,
    db_check_ms: Date.now() - started,
    uptime_s: Math.round(process.uptime()),
  });
};

module.exports = wrapAll({ health });
