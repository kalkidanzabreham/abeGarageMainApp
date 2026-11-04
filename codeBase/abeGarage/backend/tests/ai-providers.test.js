// The Gemini and Ollama providers against a stubbed fetch: request shape,
// error mapping, and that the API key stays out of URLs and error messages.
// No real model or network is used.
const { geminiProvider } = require("../ai/providers/gemini");
const { ollamaProvider } = require("../ai/providers/ollama");
const { JOB_DRAFT_JSON_SCHEMA } = require("../ai/schema");

const KEY = "test-key-do-not-leak-123";
const REQUEST = {
  system: "You draft job cards.",
  messages: [
    { role: "user", content: "<complaint>\nbrakes grind\n</complaint>" },
    { role: "assistant", content: "{ broken" },
    { role: "user", content: "Reply again." },
  ],
  jsonSchema: JOB_DRAFT_JSON_SCHEMA,
};

// a fetch that records the call and answers with the given status and body
const stubFetch = (status, body, headers = {}) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(text, { status, headers });
  };
  return { fetchImpl, calls };
};

describe("gemini", () => {
  test("sends system, roles, JSON schema and temperature 0; the key only in a header", async () => {
    const { fetchImpl, calls } = stubFetch(200, {
      candidates: [{ content: { parts: [{ text: '{"a":' }, { text: "1}" }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 120 },
    });
    const provider = geminiProvider({ apiKey: KEY, fetchImpl });
    const reply = await provider.generate(REQUEST);

    expect(reply.text).toBe('{"a":1}');
    expect(provider).toMatchObject({ name: "gemini", model: "gemini-2.5-flash-lite", external: true });
    const [call] = calls;
    expect(call.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent");
    expect(call.url).not.toContain(KEY);
    expect(call.init.headers["x-goog-api-key"]).toBe(KEY);
    expect(call.body.systemInstruction).toEqual({ parts: [{ text: "You draft job cards." }] });
    expect(call.body.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(call.body.generationConfig).toMatchObject({
      temperature: 0,
      responseMimeType: "application/json",
      responseJsonSchema: JOB_DRAFT_JSON_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    });
  });

  test("429 is PROVIDER_RATE_LIMITED", async () => {
    const { fetchImpl } = stubFetch(429, { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Quota exceeded" } }, { "retry-after": "30" });
    const err = await geminiProvider({ apiKey: KEY, fetchImpl }).generate(REQUEST).catch((e) => e);
    expect(err).toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfter: "30" });
    expect(err.message).toBe("HTTP 429: Quota exceeded");
  });

  test("other HTTP errors are PROVIDER_ERROR, and the message never contains the key", async () => {
    const { fetchImpl } = stubFetch(400, { error: { message: "API key not valid. Please pass a valid API key." } });
    const err = await geminiProvider({ apiKey: KEY, fetchImpl }).generate(REQUEST).catch((e) => e);
    expect(err.code).toBe("PROVIDER_ERROR");
    expect(err.message).toBe("HTTP 400: API key not valid. Please pass a valid API key.");
    expect(err.message).not.toContain(KEY);
  });

  test("a blocked prompt (no candidates) is PROVIDER_ERROR with the block reason", async () => {
    const { fetchImpl } = stubFetch(200, { promptFeedback: { blockReason: "SAFETY" } });
    const err = await geminiProvider({ apiKey: KEY, fetchImpl }).generate(REQUEST).catch((e) => e);
    expect(err).toMatchObject({ code: "PROVIDER_ERROR", message: "no candidate (SAFETY)" });
  });

  test("a non-JSON error page is cut to 200 characters", async () => {
    const { fetchImpl } = stubFetch(502, "<html>" + "x".repeat(1000));
    const err = await geminiProvider({ apiKey: KEY, fetchImpl }).generate(REQUEST).catch((e) => e);
    expect(err.message.length).toBeLessThanOrEqual("HTTP 502: ".length + 200);
  });

  test("refuses to start without a key", () => {
    expect(() => geminiProvider({ apiKey: "" })).toThrow("GEMINI_API_KEY is required");
  });
});

describe("ollama", () => {
  test("sends the schema as format, temperature 0, system first", async () => {
    const { fetchImpl, calls } = stubFetch(200, { message: { content: '{"a":1}' }, prompt_eval_count: 500, eval_count: 100 });
    const provider = ollamaProvider({ baseUrl: "http://ollama:11434/", fetchImpl });
    const reply = await provider.generate(REQUEST);
    expect(reply.text).toBe('{"a":1}');
    expect(provider).toMatchObject({ name: "ollama", model: "gemma3:4b", external: false });
    const [call] = calls;
    expect(call.url).toBe("http://ollama:11434/api/chat");
    expect(call.body).toMatchObject({ model: "gemma3:4b", stream: false, format: JOB_DRAFT_JSON_SCHEMA, options: { temperature: 0 } });
    expect(call.body.messages.map((m) => m.role)).toEqual(["system", "user", "assistant", "user"]);
  });

  test("an error (e.g. model not pulled) is PROVIDER_ERROR with Ollama's message", async () => {
    const { fetchImpl } = stubFetch(404, { error: 'model "gemma3:4b" not found, try pulling it first' });
    const err = await ollamaProvider({ fetchImpl }).generate(REQUEST).catch((e) => e);
    expect(err).toMatchObject({ code: "PROVIDER_ERROR", message: 'HTTP 404: model "gemma3:4b" not found, try pulling it first' });
  });
});

describe("configuration", () => {
  const loadEnv = (vars) => {
    const saved = { ...process.env };
    Object.assign(process.env, vars);
    try {
      let env;
      jest.isolateModules(() => {
        env = require("../config/env");
      });
      return env;
    } finally {
      process.env = saved;
    }
  };

  test("AI_PROVIDER=gemini without a key stops startup with a clear message", () => {
    expect(() => loadEnv({ AI_ENABLED: "true", AI_PROVIDER: "gemini", GEMINI_API_KEY: "" })).toThrow(
      "GEMINI_API_KEY: is required when AI_PROVIDER=gemini"
    );
  });

  test("createProvider picks the provider and model from config", () => {
    const { createProvider } = require("../ai/providers");
    expect(createProvider({ AI_PROVIDER: "gemini", GEMINI_API_KEY: KEY })).toMatchObject({ name: "gemini", model: "gemini-2.5-flash-lite" });
    expect(createProvider({ AI_PROVIDER: "ollama", OLLAMA_URL: "http://x:1", AI_MODEL: "llama3.2:3b" })).toMatchObject({ name: "ollama", model: "llama3.2:3b" });
  });
});
