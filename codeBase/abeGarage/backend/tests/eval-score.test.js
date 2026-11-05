// The eval's scoring and split check (no model, no database).
const { score, checkSplit, p95 } = require("../eval/run");
const cases = require("../eval/cases.json");

const row = (over) => ({
  id: "x", ok: true, outcome: "ok_strict", latency_ms: 1000, services: [], urgency: "medium", questions: ["q?"],
  expected: { services: [], acceptable_services: [], urgency: "medium" }, ...over,
});

test("cases.json: 60 cases, split matches the rule, 20 dev / 40 test", () => {
  expect(cases).toHaveLength(60);
  expect(() => checkSplit(cases)).not.toThrow();
  expect(cases.filter((c) => c.split === "dev")).toHaveLength(20);
});

test("a case moved to the other split is caught", () => {
  const edited = cases.map((c, i) => (i === 1 ? { ...c, split: "dev" } : c));
  expect(() => checkSplit(edited)).toThrow(cases[1].id);
});

test("precision counts acceptable services as right; recall counts only required ones", () => {
  const m = score([
    row({ services: ["A", "B", "Z"], expected: { services: ["A", "C"], acceptable_services: ["B"], urgency: "high" }, urgency: "high" }),
  ]);
  expect(m.service_precision).toEqual({ hit: 2, of: 3 });
  expect(m.service_recall).toEqual({ hit: 1, of: 2 });
  expect(m.urgency_agreement).toEqual({ hit: 1, of: 1 });
  expect(m.urgency_baseline_always_medium).toEqual({ hit: 0, of: 1 });
});

test("failures count in the failure rate only; questions are checked where required", () => {
  const m = score([
    row({ ok: false, outcome: "failed", reason: "INVALID_JSON", id: "f1", expected: { services: ["A"], acceptable_services: [], urgency: "high", questions_required: true } }),
    row({ outcome: "ok_repaired", questions: [], expected: { services: [], acceptable_services: [], urgency: "medium", questions_required: true } }),
    row({ outcome: "ok_retry" }),
  ]);
  expect(m).toMatchObject({ cases: 3, first_attempt_strict: 0, first_attempt_repaired: 1, ok_after_retry: 1, failed: 1 });
  expect(m.failure_reasons).toEqual(["f1:INVALID_JSON"]);
  expect(m.service_recall).toEqual({ hit: 0, of: 0 });
  expect(m.questions_present).toEqual({ hit: 0, of: 1 });
  expect(m.urgency_baseline_always_medium).toEqual({ hit: 2, of: 3 });
});

test("p95 is nearest-rank", () => {
  expect(p95([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 100])).toBe(19);
  expect(p95([5])).toBe(5);
});
