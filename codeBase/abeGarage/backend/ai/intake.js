// The smart job intake pipeline:
//   cap input -> attempt 1 -> strict parse -> bounded repair
//   -> (if unusable) one retry with feedback -> catalog mapping
//   -> draft for a person to review, or a clean failure.
// Nothing here writes to the database.
const { JOB_DRAFT_JSON_SCHEMA } = require("./schema");
const { parseModelOutput } = require("./parse");
const { mapServices } = require("./catalog");
const { systemPrompt, userMessage, retryMessage, PROMPT_VERSION } = require("./prompt");

const { PROVIDER_ERROR } = require("./providers/errors");

const MAX_ATTEMPTS = 2; // first try + one retry

// Cap the complaint at maxChars characters (code points, so multi-byte
// scripts such as Amharic are never cut in half), preferring a word break.
const capInput = (text, maxChars) => {
  const chars = Array.from(text.trim());
  if (chars.length <= maxChars) return { text: chars.join(""), truncated: false, inputChars: chars.length };
  let cut = chars.slice(0, maxChars).join("");
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.9) cut = cut.slice(0, lastSpace);
  return { text: cut, truncated: true, inputChars: chars.length };
};

const withTimeout = async (fn, timeoutMs) => {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const err = new Error(`no answer within ${timeoutMs} ms`);
      err.code = PROVIDER_ERROR.TIMEOUT;
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([fn(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const runIntake = async ({ complaint, provider, catalog, timeoutMs, maxChars, log }) => {
  const started = Date.now();
  const input = capInput(complaint, maxChars);
  const system = systemPrompt(catalog);
  const messages = [{ role: "user", content: userMessage(input.text) }];
  const attempts = [];

  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    const attemptStarted = Date.now();
    let raw;
    try {
      const reply = await withTimeout(
        (signal) => provider.generate({ system, messages, jsonSchema: JOB_DRAFT_JSON_SCHEMA, signal }),
        timeoutMs
      );
      raw = reply.text;
    } catch (err) {
      const code = Object.values(PROVIDER_ERROR).includes(err.code) ? err.code : PROVIDER_ERROR.ERROR;
      attempts.push({ n, ok: false, code, detail: String(err.message).slice(0, 200), ms: Date.now() - attemptStarted });
      log?.warn({ event: "ai_intake_attempt_failed", attempt: n, reason: code, provider: provider.name }, "provider call failed");
      // the provider is over its quota: a retry now would only fail again
      // and use up more of it, so give up and let the UI say "busy"
      if (code === PROVIDER_ERROR.RATE_LIMITED) break;
      continue;
    }

    const parsed = parseModelOutput(raw, { catalog });
    attempts.push({ n, ok: parsed.ok, stage: parsed.stage, code: parsed.code, repairs: parsed.repairs, ms: Date.now() - attemptStarted });
    if (parsed.repairs.length) {
      log?.info({ event: "ai_intake_repair", attempt: n, repairs: parsed.repairs, ok: parsed.ok, provider: provider.name }, "model output repaired");
    }
    if (parsed.ok) {
      const { services, dropped } = mapServices(parsed.draft.suggested_services, catalog);
      const outcome = n > 1 ? "ok_retry" : parsed.stage === "strict" ? "ok_strict" : "ok_repaired";
      return {
        ok: true,
        draft: { ...parsed.draft, suggested_services: services },
        meta: {
          outcome,
          attempts: n,
          repairs: attempts.flatMap((a) => a.repairs || []),
          dropped_services: [...(parsed.dropped?.services || []), ...dropped],
          dropped_systems: parsed.dropped?.systems || [],
          truncated: input.truncated,
          input_chars: input.inputChars,
          latency_ms: Date.now() - started,
          provider: provider.name,
          model: provider.model,
          prompt_version: PROMPT_VERSION,
        },
        attempts,
      };
    }
    // reason code only: parsed.detail can quote the model's output, which may
    // repeat the complaint, and complaint text is never logged
    log?.warn({ event: "ai_intake_attempt_failed", attempt: n, reason: parsed.code, provider: provider.name }, "model output unusable");
    // show the model what went wrong, then try once more
    messages.push({ role: "assistant", content: raw }, { role: "user", content: retryMessage(parsed) });
  }

  const last = attempts[attempts.length - 1];
  return {
    ok: false,
    reason: last.code,
    meta: {
      outcome: "failed",
      attempts: attempts.length,
      repairs: attempts.flatMap((a) => a.repairs || []),
      truncated: input.truncated,
      input_chars: input.inputChars,
      latency_ms: Date.now() - started,
      provider: provider.name,
      model: provider.model,
      prompt_version: PROMPT_VERSION,
    },
    attempts,
  };
};

module.exports = { runIntake, capInput, MAX_ATTEMPTS };
