// Google Gemini (hosted), through the generateContent REST endpoint.
// - The API key goes in the x-goog-api-key header, never in the URL, so it
//   can't end up in an error message, a proxy log or our own logs.
// - responseJsonSchema asks Gemini to answer in our JSON shape. Gemini
//   ignores some keywords (string lengths, for example), so the pipeline
//   still validates every answer with zod.
// - temperature 0: the same complaint should give the same draft.
const { PROVIDER_ERROR, providerError, errorDetail } = require("./errors");

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const geminiProvider = ({ apiKey, model = DEFAULT_MODEL, baseUrl = BASE_URL, fetchImpl = fetch }) => {
  if (!apiKey) throw new Error("GEMINI_API_KEY is required for AI_PROVIDER=gemini");

  const generate = async ({ system, messages, jsonSchema, signal }) => {
    const res = await fetchImpl(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          // Flash-Lite doesn't think by default; say so explicitly so a
          // model change can't silently add thinking tokens (cost, latency)
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (res.status === 429) {
      throw providerError(PROVIDER_ERROR.RATE_LIMITED, await errorDetail(res), { retryAfter: res.headers.get("retry-after") });
    }
    if (!res.ok) throw providerError(PROVIDER_ERROR.ERROR, await errorDetail(res));

    const body = await res.json();
    const candidate = body.candidates?.[0];
    if (!candidate) {
      // e.g. the prompt was blocked by a safety filter
      throw providerError(PROVIDER_ERROR.ERROR, `no candidate (${body.promptFeedback?.blockReason || "no reason given"})`);
    }
    const text = (candidate.content?.parts || []).map((p) => p.text || "").join("");
    // MAX_TOKENS etc.: return what we got; the parser repairs or rejects it
    return { text, finishReason: candidate.finishReason, usage: body.usageMetadata };
  };

  return { name: "gemini", model, external: true, generate };
};

module.exports = { geminiProvider, DEFAULT_MODEL };
