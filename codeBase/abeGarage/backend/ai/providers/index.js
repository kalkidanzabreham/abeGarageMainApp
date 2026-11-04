// Provider interface used by the intake pipeline:
//   { name, model, generate({ system, messages, jsonSchema, signal }) -> { text } }
// - system: instructions; messages: [{ role: "user"|"assistant", content }]
// - jsonSchema: the expected output shape, for providers that can constrain
//   decoding to it (the pipeline validates the result either way)
// - signal: AbortSignal, fired when the request times out
// The pipeline never depends on a specific provider, so switching is a
// config change (AI_PROVIDER).
const { keywordProvider } = require("./fake");

const createProvider = (config) => {
  switch (config.AI_PROVIDER) {
    case "fake":
      return keywordProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER "${config.AI_PROVIDER}"`);
  }
};

module.exports = { createProvider };
