// Errors a provider may throw. The pipeline turns `code` into the reason
// code that is returned, logged and stored in ai_intake_log.
const PROVIDER_ERROR = Object.freeze({
  TIMEOUT: "PROVIDER_TIMEOUT", // no answer within AI_TIMEOUT_MS
  RATE_LIMITED: "PROVIDER_RATE_LIMITED", // the provider said 429 (quota or rate limit)
  // any other 4xx: bad key, unknown or retired model, invalid request.
  // Retrying can't fix it, so the pipeline doesn't.
  CONFIG: "PROVIDER_CONFIG_ERROR",
  ERROR: "PROVIDER_ERROR", // anything else: network, 5xx, blocked prompt
});

const providerError = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra });

// Read an error body for the message only. Bodies can be large or not JSON;
// we keep at most 200 characters and never the request (which holds the key
// in a header, never in the URL).
const errorDetail = async (res) => {
  let text = "";
  try {
    text = await res.text();
    const json = JSON.parse(text);
    text = json.error?.message || json.error || text;
  } catch {
    // not JSON: keep the raw text
  }
  return `HTTP ${res.status}: ${String(text).slice(0, 200)}`;
};

// The error for a non-2xx response.
const httpError = async (res) => {
  const code =
    res.status === 429 ? PROVIDER_ERROR.RATE_LIMITED
    : res.status >= 400 && res.status < 500 ? PROVIDER_ERROR.CONFIG
    : PROVIDER_ERROR.ERROR;
  return providerError(code, await errorDetail(res), { status: res.status, retryAfter: res.headers.get("retry-after") });
};

module.exports = { PROVIDER_ERROR, providerError, errorDetail, httpError };
