// Provider interface used by the intake pipeline:
//   { name, model, external, generate({ system, messages, jsonSchema, signal }) -> { text } }
// - system: instructions; messages: [{ role: "user"|"assistant", content }]
// - jsonSchema: the expected output shape, for providers that can constrain
//   decoding to it (the pipeline validates the result either way)
// - signal: AbortSignal, fired when the request times out
// - external: true when complaint text leaves our servers (the UI says so)
// - errors carry a `code` from ./errors (PROVIDER_RATE_LIMITED, ...)
// The pipeline never depends on a specific provider, so switching is a
// config change (AI_PROVIDER).
const { keywordProvider } = require("./fake");
const { geminiProvider } = require("./gemini");
const { ollamaProvider } = require("./ollama");

const createProvider = (config) => {
  switch (config.AI_PROVIDER) {
    case "fake":
      return keywordProvider();
    case "gemini":
      return geminiProvider({ apiKey: config.GEMINI_API_KEY, model: config.AI_MODEL || undefined });
    case "ollama":
      return ollamaProvider({ baseUrl: config.OLLAMA_URL, model: config.AI_MODEL || undefined });
    default:
      throw new Error(`Unknown AI_PROVIDER "${config.AI_PROVIDER}"`);
  }
};

module.exports = { createProvider };
