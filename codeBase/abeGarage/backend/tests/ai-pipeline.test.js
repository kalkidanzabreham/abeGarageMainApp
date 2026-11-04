// The intake pipeline with a scripted provider (no model).
const { runIntake, capInput } = require("../ai/intake");
const { scriptedProvider } = require("../ai/providers/fake");

const CATALOG = [
  { service_id: 1, service_name: "Oil change", service_description: "Engine oil and filter", service_price: 49.99 },
  { service_id: 2, service_name: "Brake pad replacement", service_description: "Pads per axle", service_price: 149 },
];
const GOOD = JSON.stringify({
  suspected_systems: ["brakes"],
  suggested_services: [{ service_id: 2, reason: "grinding" }],
  urgency: "high",
  questions_to_ask_customer: ["Every time you brake?"],
  confidence: 0.8,
});
const run = (provider, complaint = "grinding noise when braking", options = {}) =>
  runIntake({ complaint, provider, catalog: CATALOG, timeoutMs: 200, maxChars: 1000, ...options });

test("valid first answer: ok_strict, one call, catalog name and price attached", async () => {
  const provider = scriptedProvider([GOOD]);
  const result = await run(provider);
  expect(result.ok).toBe(true);
  expect(result.meta).toMatchObject({ outcome: "ok_strict", attempts: 1, repairs: [], truncated: false });
  expect(result.draft.suggested_services).toEqual([
    { service_id: 2, service_name: "Brake pad replacement", service_price: 149, reason: "grinding" },
  ]);
  expect(provider.calls).toHaveLength(1);
  expect(provider.calls[0].system).toContain("2: Brake pad replacement");
  expect(provider.calls[0].messages[0].content).toBe("<complaint>\ngrinding noise when braking\n</complaint>");
  expect(provider.calls[0].jsonSchema.required).toContain("suggested_services");
});

test("repairable first answer: ok_repaired, still one call", async () => {
  const result = await run(scriptedProvider(["Here you go:\n```json\n" + GOOD + "\n```"]));
  expect(result.meta).toMatchObject({ outcome: "ok_repaired", attempts: 1 });
  expect(result.meta.repairs).toContain("STRIPPED_CODE_FENCE");
});

test("unusable first answer: one retry that tells the model what was wrong", async () => {
  const provider = scriptedProvider(["Sorry, I cannot do that.", GOOD]);
  const result = await run(provider);
  expect(result.meta).toMatchObject({ outcome: "ok_retry", attempts: 2 });
  const retry = provider.calls[1].messages;
  expect(retry).toHaveLength(3);
  expect(retry[1]).toEqual({ role: "assistant", content: "Sorry, I cannot do that." });
  expect(retry[2].content).toContain("NO_JSON_OBJECT");
});

test("timeout on the first call, success on the retry", async () => {
  const slow = scriptedProvider([GOOD], { delayMs: 500 });
  let call = 0;
  const provider = { ...slow, name: "mixed", generate: (req) => (call++ === 0 ? slow.generate(req) : Promise.resolve({ text: GOOD })) };
  const result = await run(provider);
  expect(result.meta).toMatchObject({ outcome: "ok_retry", attempts: 2 });
  expect(result.attempts[0]).toMatchObject({ ok: false, code: "PROVIDER_TIMEOUT" });
});

test("two unusable answers: clean failure with the last reason, never more than 2 calls", async () => {
  const provider = scriptedProvider(["{ not json", '{"urgency":"high"}', GOOD]);
  const result = await run(provider);
  expect(result.ok).toBe(false);
  expect(result.reason).toBe("SCHEMA_MISMATCH");
  expect(result.meta).toMatchObject({ outcome: "failed", attempts: 2 });
  expect(provider.calls).toHaveLength(2);
  expect(result.draft).toBeUndefined();
});

test("provider errors twice: PROVIDER_ERROR", async () => {
  const result = await run(scriptedProvider([new Error("connect ECONNREFUSED"), new Error("connect ECONNREFUSED")]));
  expect(result).toMatchObject({ ok: false, reason: "PROVIDER_ERROR" });
});

test("services not in the catalog are dropped and reported", async () => {
  const draft = JSON.parse(GOOD);
  draft.suggested_services.push({ service_id: 42, reason: "made up" });
  const result = await run(scriptedProvider([JSON.stringify(draft)]));
  expect(result.draft.suggested_services.map((s) => s.service_id)).toEqual([2]);
  expect(result.meta.dropped_services).toEqual([{ service_id: 42, reason: "not in the service catalog" }]);
});

test("long input is cut to the limit and flagged", async () => {
  const provider = scriptedProvider([GOOD]);
  const result = await run(provider, "word ".repeat(400), { maxChars: 100 });
  expect(result.meta.truncated).toBe(true);
  expect(result.meta.input_chars).toBe(1999);
  const sent = provider.calls[0].messages[0].content.replace(/<\/?complaint>|\n/g, "");
  expect(sent.length).toBeLessThanOrEqual(100);
});

test("capInput counts characters, not bytes, and never splits an Amharic character", () => {
  const amharic = "መኪናዬ ፍሬን ሲይዝ ድምጽ ያወጣል ".repeat(10);
  const { text, truncated } = capInput(amharic, 50);
  expect(truncated).toBe(true);
  expect(Array.from(text).length).toBeLessThanOrEqual(50);
  expect(text).not.toMatch(/�/);
  expect(capInput("short", 50)).toEqual({ text: "short", truncated: false, inputChars: 5 });
});
