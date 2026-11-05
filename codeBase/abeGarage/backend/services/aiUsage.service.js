const query = require("../config/db.config");

// Requests made since midnight UTC (all users), for the daily cap.
const countToday = async () => {
  const [row] = await query(
    "SELECT COUNT(*) AS n FROM ai_intake_log WHERE created_at >= UTC_DATE()"
  );
  return row.n;
};

const record = async (employeeId, meta, reasonCode) => {
  await query(
    `INSERT INTO ai_intake_log
      (employee_id, provider, model, prompt_version, outcome, reason_code, repairs, attempts,
       latency_ms, input_chars, truncated, dropped_services, dropped_systems)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employeeId, meta.provider, meta.model ?? null, meta.prompt_version ?? null, meta.outcome,
      reasonCode ?? null, (meta.repairs || []).join(",").slice(0, 500) || null, meta.attempts,
      meta.latency_ms, meta.input_chars, meta.truncated ? 1 : 0,
      (meta.dropped_services || []).length, (meta.dropped_systems || []).length,
    ]
  );
};

module.exports = { countToday, record };
