// POST /api/ai/intake and GET /api/ai/status, with the no-model fake
// provider (AI_PROVIDER=fake in tests/testEnv.js) or a scripted one.
const request = require("supertest");
const { api, db, loginAll, closeDb } = require("./helpers");

let tokens;
const intake = (role, complaint) =>
  api().post("/api/ai/intake").set("x-access-token", tokens[role]).send({ complaint });

beforeAll(async () => {
  tokens = await loginAll();
});
afterAll(closeDb);

describe("permissions and validation", () => {
  test("Manager gets a draft with catalog services only", async () => {
    const res = await intake("manager", "Grinding noise when I brake and the car shakes at 80");
    expect(res.status).toBe(200);
    const catalog = await db("SELECT service_id, service_name, service_price FROM common_services");
    const byId = new Map(catalog.map((c) => [c.service_id, c]));
    expect(res.body.draft.suggested_services.length).toBeGreaterThan(0);
    for (const s of res.body.draft.suggested_services) {
      expect(byId.get(s.service_id)).toMatchObject({ service_name: s.service_name, service_price: s.service_price });
    }
    expect(res.body.draft.suspected_systems).toContain("brakes");
    expect(res.body.meta).toMatchObject({ outcome: "ok_strict", provider: "fake", truncated: false });
  });

  test("Demo may use it (it saves nothing); Mechanic may not; no token is 401", async () => {
    expect((await intake("demo", "battery is dead")).status).toBe(200);
    expect((await intake("admin", "battery is dead")).status).toBe(200);
    expect((await intake("mechanic", "battery is dead")).status).toBe(403);
    expect((await api().post("/api/ai/intake").send({ complaint: "x" })).status).toBe(401);
  });

  test("Demo is still read-only everywhere else", async () => {
    const res = await api().post("/api/customers").set("x-access-token", tokens.demo).send({ customer_email: "a@example.com", customer_first_name: "A" });
    expect(res.status).toBe(403);
  });

  test("empty or oversized complaints are a 400", async () => {
    expect((await intake("manager", "   ")).status).toBe(400);
    expect((await intake("manager", "x".repeat(5001))).status).toBe(400);
    expect((await api().post("/api/ai/intake").set("x-access-token", tokens.manager).send({})).status).toBe(400);
  });

  test("text over AI_MAX_INPUT_CHARS is truncated and flagged", async () => {
    const res = await intake("manager", "brakes grinding ".repeat(150));
    expect(res.status).toBe(200);
    expect(res.body.meta.truncated).toBe(true);
    expect(res.body.meta.input_chars).toBe(2399);
  });

  test("status shows the feature as available", async () => {
    const res = await api().get("/api/ai/status").set("x-access-token", tokens.demo);
    expect(res.body).toMatchObject({ enabled: true, available: true, provider: "fake", external: false });
  });
});

describe("usage log", () => {
  test("every request is logged with outcome and timing, but not the complaint text", async () => {
    const marker = `unique-marker-${Date.now()}`;
    await intake("manager", `brakes squeal ${marker}`);
    const [row] = await db("SELECT * FROM ai_intake_log ORDER BY id DESC LIMIT 1");
    expect(row).toMatchObject({ provider: "fake", outcome: "ok_strict", attempts: 1, truncated: 0 });
    expect(row.reason_code).toBeNull();
    expect(JSON.stringify(row)).not.toContain(marker);
  });
});

// A separate copy of the app with different settings or a scripted provider.
const isolatedApp = (env, providerOutputs) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  let app;
  let pool;
  jest.isolateModules(() => {
    if (providerOutputs) {
      jest.doMock("../ai/providers", () => {
        const { scriptedProvider } = jest.requireActual("../ai/providers/fake");
        return { createProvider: () => scriptedProvider(providerOutputs, { name: "scripted" }) };
      });
    }
    app = require("../app");
    pool = require("../config/db.config").pool;
  });
  // doMock stays registered after isolateModules; remove it so the next
  // isolated app gets the real providers
  if (providerOutputs) jest.dontMock("../ai/providers");
  process.env = saved;
  return { app, close: () => pool.end() };
};

describe("limits and switches", () => {
  test("the daily cap pauses the feature with a clear message", async () => {
    await db("DELETE FROM ai_intake_log");
    const { app, close } = isolatedApp({ AI_DAILY_CAP: "2" });
    try {
      const post = () => request(app).post("/api/ai/intake").set("x-access-token", tokens.manager).send({ complaint: "brakes" });
      expect((await post()).status).toBe(200);
      expect((await post()).status).toBe(200);
      const capped = await post();
      expect(capped.status).toBe(503);
      expect(capped.body).toMatchObject({ code: "AI_DAILY_CAP_REACHED", message: "Smart intake has reached today's limit. Please fill in the order manually." });
      const status = await request(app).get("/api/ai/status").set("x-access-token", tokens.manager);
      expect(status.body).toMatchObject({ enabled: true, available: false, reason: "DAILY_CAP_REACHED" });
    } finally {
      await close();
    }
  });

  test("the per-user limit applies per employee, not globally", async () => {
    const { app, close } = isolatedApp({ AI_USER_LIMIT: "2" });
    try {
      const post = (role) => request(app).post("/api/ai/intake").set("x-access-token", tokens[role]).send({ complaint: "brakes" });
      expect((await post("manager")).status).toBe(200);
      expect((await post("manager")).status).toBe(200);
      const limited = await post("manager");
      expect(limited.status).toBe(429);
      expect(limited.body.code).toBe("AI_RATE_LIMITED");
      expect((await post("admin")).status).toBe(200);
    } finally {
      await close();
    }
  });

  test("AI_ENABLED=false removes the feature entirely", async () => {
    const { app, close } = isolatedApp({ AI_ENABLED: "false" });
    try {
      expect((await request(app).get("/api/ai/status").set("x-access-token", tokens.admin)).status).toBe(404);
      expect((await request(app).post("/api/ai/intake").set("x-access-token", tokens.admin).send({ complaint: "x" })).status).toBe(404);
      const docs = await request(app).get("/api/openapi.json");
      expect(Object.keys(docs.body.paths).some((p) => p.startsWith("/api/ai"))).toBe(false);
    } finally {
      await close();
    }
  });

  test("a model that never returns usable JSON: 502 with a clear message, logged as failed", async () => {
    const { app, close } = isolatedApp({}, ["I think it's the brakes.", "{ broken"]);
    try {
      const res = await request(app).post("/api/ai/intake").set("x-access-token", tokens.manager).send({ complaint: "brakes" });
      expect(res.status).toBe(502);
      expect(res.body).toMatchObject({ code: "AI_DRAFT_FAILED", message: "Couldn't produce a usable draft. Please fill in the order manually." });
      expect(res.body.details).toEqual([{ reason: "INVALID_JSON" }]);
      const [row] = await db("SELECT outcome, reason_code, attempts FROM ai_intake_log ORDER BY id DESC LIMIT 1");
      expect(row).toEqual({ outcome: "failed", reason_code: "INVALID_JSON", attempts: 2 });
    } finally {
      await close();
    }
  });

  test("the provider's own rate limit (429): 503 AI_BUSY, try again shortly, logged", async () => {
    const busy = Object.assign(new Error("HTTP 429: Quota exceeded"), { code: "PROVIDER_RATE_LIMITED" });
    const { app, close } = isolatedApp({}, [busy]);
    try {
      const res = await request(app).post("/api/ai/intake").set("x-access-token", tokens.manager).send({ complaint: "brakes" });
      expect(res.status).toBe(503);
      expect(res.headers["retry-after"]).toBe("60");
      expect(res.body).toMatchObject({ code: "AI_BUSY", message: "Smart intake is busy right now. Please try again in a minute, or fill in the order manually." });
      const [row] = await db("SELECT outcome, reason_code, attempts FROM ai_intake_log ORDER BY id DESC LIMIT 1");
      expect(row).toEqual({ outcome: "failed", reason_code: "PROVIDER_RATE_LIMITED", attempts: 1 });
    } finally {
      await close();
    }
  });

  test("AI_GLOBAL_RPM limits all users together per minute with AI_BUSY", async () => {
    const { app, close } = isolatedApp({ AI_GLOBAL_RPM: "2" });
    try {
      const post = (role) => request(app).post("/api/ai/intake").set("x-access-token", tokens[role]).send({ complaint: "brakes" });
      expect((await post("manager")).status).toBe(200);
      expect((await post("admin")).status).toBe(200);
      const busy = await post("demo");
      expect(busy.status).toBe(503);
      expect(busy.body.code).toBe("AI_BUSY");
    } finally {
      await close();
    }
  });

  test("with Gemini configured, the key is never in a response", async () => {
    const key = "AIza-test-key-must-not-leak";
    const { app, close } = isolatedApp({ AI_PROVIDER: "gemini", GEMINI_API_KEY: key });
    try {
      const status = await request(app).get("/api/ai/status").set("x-access-token", tokens.manager);
      expect(status.body).toMatchObject({ provider: "gemini", model: "gemini-2.5-flash-lite", external: true });
      const docs = await request(app).get("/api/openapi.json");
      for (const res of [status, docs]) expect(JSON.stringify(res.body)).not.toContain(key);
    } finally {
      await close();
    }
  });
});
