// A local model through Ollama's /api/chat. Nothing leaves the machine.
// - format: our JSON schema, so Ollama constrains the output to that shape.
// - temperature 0 for repeatable drafts.
// On a laptop CPU a draft takes 30-70 s (measured with gemma3:4b), so set
// AI_TIMEOUT_MS to about 90000 when using this provider.
const { httpError } = require("./errors");

const DEFAULT_MODEL = "gemma3:4b";

const ollamaProvider = ({ baseUrl = "http://localhost:11434", model = DEFAULT_MODEL, fetchImpl = fetch } = {}) => {
  const generate = async ({ system, messages, jsonSchema, signal }) => {
    const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: jsonSchema,
        options: { temperature: 0 },
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok) throw await httpError(res);
    const body = await res.json();
    return { text: body.message?.content ?? "", usage: { prompt_tokens: body.prompt_eval_count, output_tokens: body.eval_count } };
  };

  return { name: "ollama", model, external: false, generate };
};

module.exports = { ollamaProvider, DEFAULT_MODEL };
