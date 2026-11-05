const env = require("../config/env");
const { createProvider } = require("../ai/providers");
const { runIntake } = require("../ai/intake");
const aiUsage = require("../services/aiUsage.service");
const serviceService = require("../services/service.service");
const { AppError } = require("../utils/AppError");
const { wrapAll } = require("../utils/asyncHandler");

const provider = createProvider(env);

const BUSY_MESSAGE = "Smart intake is busy right now. Please try again in a minute, or fill in the order manually.";

const capReached = async () => (await aiUsage.countToday()) >= env.AI_DAILY_CAP;

// GET /api/ai/status: lets the UI show the feature, or why it's paused
const status = async (req, res) => {
  const usedToday = await aiUsage.countToday();
  res.json({
    enabled: true,
    available: usedToday < env.AI_DAILY_CAP,
    reason: usedToday < env.AI_DAILY_CAP ? null : "DAILY_CAP_REACHED",
    provider: provider.name,
    model: provider.model,
    // true when complaint text is sent to a third-party service (the UI
    // tells the user so)
    external: Boolean(provider.external),
    max_input_chars: env.AI_MAX_INPUT_CHARS,
  });
};

// POST /api/ai/intake: complaint text -> draft job card for a person to review
const intake = async (req, res) => {
  if (await capReached()) {
    throw new AppError(503, "AI_DAILY_CAP_REACHED", "Smart intake has reached today's limit. Please fill in the order manually.");
  }
  const catalog = await serviceService.getAllServices();
  const result = await runIntake({
    complaint: req.body.complaint,
    provider,
    catalog,
    timeoutMs: env.AI_TIMEOUT_MS,
    maxChars: env.AI_MAX_INPUT_CHARS,
    log: req.log,
  });
  await aiUsage.record(req.user.employee_id, result.meta, result.ok ? null : result.reason);
  req.log.info(
    { event: "ai_intake_result", outcome: result.meta.outcome, reason: result.ok ? null : result.reason, attempts: result.meta.attempts, latency_ms: result.meta.latency_ms, provider: result.meta.provider },
    "smart intake finished"
  );
  if (!result.ok && result.reason === "PROVIDER_RATE_LIMITED") {
    res.set("Retry-After", "60");
    throw new AppError(503, "AI_BUSY", BUSY_MESSAGE);
  }
  if (!result.ok) {
    throw new AppError(502, "AI_DRAFT_FAILED", "Couldn't produce a usable draft. Please fill in the order manually.", [{ reason: result.reason }]);
  }
  res.json({ draft: result.draft, meta: result.meta });
};

module.exports = { ...wrapAll({ status, intake }), BUSY_MESSAGE };
