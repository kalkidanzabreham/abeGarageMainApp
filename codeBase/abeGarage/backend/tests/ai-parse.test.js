// Parser and repair logic, fed deliberately broken model outputs.
const { parseModelOutput, REPAIR, FAILURE } = require("../ai/parse");
const { mapServices } = require("../ai/catalog");

const CATALOG = [
  { service_id: 1, service_name: "Oil change", service_price: 49.99 },
  { service_id: 2, service_name: "Brake pad replacement", service_price: 149 },
  { service_id: 7, service_name: "Diagnostic scan", service_price: 59 },
];
const GOOD = {
  suspected_systems: ["brakes", "tires_wheels"],
  suggested_services: [{ service_id: 2, reason: "grinding when braking" }],
  urgency: "high",
  questions_to_ask_customer: ["Does the noise happen every time you brake?"],
  confidence: 0.8,
};
const goodText = JSON.stringify(GOOD);
const parse = (raw) => parseModelOutput(raw, { catalog: CATALOG });

describe("strict parse", () => {
  test("valid output is accepted with no repairs", () => {
    expect(parse(goodText)).toMatchObject({ ok: true, stage: "strict", repairs: [], draft: GOOD });
  });
});

describe("text repairs", () => {
  test.each([
    ["markdown code fence", "```json\n" + goodText + "\n```", [REPAIR.STRIPPED_CODE_FENCE]],
    ["fence without language", "```\n" + goodText + "\n```", [REPAIR.STRIPPED_CODE_FENCE]],
    ["prose before and after", "Sure! Here is the job card:\n" + goodText + "\nLet me know if you need more.", [REPAIR.EXTRACTED_OBJECT]],
    [
      "trailing commas",
      '{"suspected_systems":["brakes","tires_wheels",],"suggested_services":[{"service_id":2,"reason":"grinding when braking",},],' +
        '"urgency":"high","questions_to_ask_customer":["Does the noise happen every time you brake?",],"confidence":0.8,}',
      [REPAIR.TRAILING_COMMAS],
    ],
    ["smart quotes", goodText.replace(/"/g, "“").replace(/“(?=[,:}\]])/g, "”"), [REPAIR.SMART_QUOTES]],
  ])("%s", (_label, raw, expectedRepairs) => {
    const result = parse(raw);
    expect(result.ok).toBe(true);
    expect(result.stage).toBe("repaired");
    for (const r of expectedRepairs) expect(result.repairs).toContain(r);
    expect(result.draft).toEqual(GOOD);
  });

  test("trailing comma inside a string is left alone", () => {
    const raw = JSON.stringify({ ...GOOD, questions_to_ask_customer: ["front, ]"] }).replace("]}", "],}");
    const result = parse(raw);
    expect(result.ok).toBe(true);
    expect(result.draft.questions_to_ask_customer).toEqual(["front, ]"]);
  });

  test("output cut off mid-string is closed", () => {
    const raw = goodText.slice(0, goodText.indexOf("Does the noise") + 10); // ... "Does the n
    const result = parse(raw.replace('"confidence":0.8', "")); // confidence comes last in GOOD
    // still missing confidence -> no invented values, so this must fail
    expect(result.ok).toBe(false);
    expect(result.repairs).toContain(REPAIR.CLOSED_TRUNCATED_JSON);
  });

  test("output cut off after a complete field is closed and accepted", () => {
    const ordered = JSON.stringify({ confidence: 0.6, urgency: "low", suspected_systems: [], suggested_services: [], questions_to_ask_customer: ["When did it start?"] });
    const raw = ordered.slice(0, -1); // missing final }
    const result = parse(raw);
    expect(result).toMatchObject({ ok: true, stage: "repaired" });
    expect(result.repairs).toContain(REPAIR.CLOSED_TRUNCATED_JSON);
  });
});

describe("value repairs", () => {
  const withChanges = (changes) => JSON.stringify({ ...GOOD, ...changes });

  test("wrapper key is unwrapped", () => {
    const result = parse(JSON.stringify({ job_card: GOOD }));
    expect(result).toMatchObject({ ok: true, draft: GOOD });
    expect(result.repairs).toContain(REPAIR.UNWRAPPED_KEY);
  });

  test("extra keys are dropped", () => {
    const result = parse(withChanges({ notes: "x", estimated_cost: 200 }));
    expect(result).toMatchObject({ ok: true, draft: GOOD });
    expect(result.repairs).toContain(REPAIR.DROPPED_EXTRA_KEYS);
  });

  test("urgency letter case is normalized", () => {
    const result = parse(withChanges({ urgency: " High " }));
    expect(result.draft.urgency).toBe("high");
    expect(result.repairs).toContain(REPAIR.NORMALIZED_URGENCY);
  });

  test("an urgency outside low/medium/high is not guessed", () => {
    const result = parse(withChanges({ urgency: "critical" }));
    expect(result).toMatchObject({ ok: false, code: FAILURE.SCHEMA_MISMATCH });
  });

  test.each([
    [80, 0.8, REPAIR.CONFIDENCE_PERCENT],
    ["0.65", 0.65, REPAIR.CONFIDENCE_STRING],
    ["70%", 0.7, REPAIR.CONFIDENCE_STRING],
  ])("confidence %p becomes %p", (input, expected, code) => {
    const result = parse(withChanges({ confidence: input }));
    expect(result.draft.confidence).toBeCloseTo(expected, 5);
    expect(result.repairs).toContain(code);
  });

  test("confidence above 100 or negative fails", () => {
    expect(parse(withChanges({ confidence: 250 })).ok).toBe(false);
    expect(parse(withChanges({ confidence: -0.2 })).ok).toBe(false);
  });

  test("systems are normalized, synonyms mapped, unknown ones dropped and flagged", () => {
    const result = parse(withChanges({ suspected_systems: ["Brakes", "Tyres", "air conditioning", "flux capacitor"] }));
    expect(result.draft.suspected_systems).toEqual(["brakes", "tires_wheels", "hvac"]);
    expect(result.dropped.systems).toEqual(["flux capacitor"]);
    expect(result.repairs).toEqual(expect.arrayContaining([REPAIR.NORMALIZED_SYSTEMS, REPAIR.UNKNOWN_SYSTEM_DROPPED]));
  });

  test("a single string where a list is expected becomes a list", () => {
    const result = parse(withChanges({ questions_to_ask_customer: "Since when?" }));
    expect(result.draft.questions_to_ask_customer).toEqual(["Since when?"]);
    expect(result.repairs).toContain(REPAIR.STRING_TO_ARRAY);
  });

  test("service ids given as strings or bare numbers are converted", () => {
    expect(parse(withChanges({ suggested_services: [{ service_id: "2", reason: "r" }] })).draft.suggested_services).toEqual([{ service_id: 2, reason: "r" }]);
    const bare = parse(withChanges({ suggested_services: [2, "7"] }));
    expect(bare.draft.suggested_services).toEqual([{ service_id: 2, reason: "" }, { service_id: 7, reason: "" }]);
    expect(bare.repairs).toContain(REPAIR.SERVICES_AS_IDS);
  });

  test("services named instead of numbered are matched to the catalog; unknown names dropped", () => {
    const result = parse(withChanges({ suggested_services: [{ service_name: "oil change", reason: "due" }, { name: "Flux recalibration", reason: "?" }] }));
    expect(result.draft.suggested_services).toEqual([{ service_id: 1, reason: "due" }]);
    expect(result.dropped.services).toEqual([{ value: "Flux recalibration", reason: "unknown service name" }]);
    expect(result.repairs).toContain(REPAIR.SERVICE_MATCHED_BY_NAME);
  });

  test("lists longer than allowed are trimmed", () => {
    const result = parse(withChanges({ questions_to_ask_customer: ["1", "2", "3", "4", "5", "6", "7"] }));
    expect(result.draft.questions_to_ask_customer).toHaveLength(5);
    expect(result.repairs).toContain(REPAIR.TRIMMED_LIST);
  });

  test("a missing required field is not invented", () => {
    const { confidence, ...rest } = GOOD;
    const result = parse(JSON.stringify(rest));
    expect(result).toMatchObject({ ok: false, code: FAILURE.SCHEMA_MISMATCH });
    expect(result.detail).toContain("confidence");
    expect(confidence).toBe(0.8);
  });
});

describe("failures", () => {
  test.each([
    ["empty", "", FAILURE.EMPTY_OUTPUT],
    ["whitespace", "   \n ", FAILURE.EMPTY_OUTPUT],
    ["not a string", null, FAILURE.EMPTY_OUTPUT],
    ["prose only", "I'm sorry, I can't help with that.", FAILURE.NO_JSON_OBJECT],
    ["broken beyond repair", "{ suspected_systems: [brakes], urgency: high }", FAILURE.INVALID_JSON],
    ["array at top level", '[{"a":1}]', FAILURE.SCHEMA_MISMATCH],
    ["too large", "{" + "x".repeat(25000) + "}", FAILURE.OUTPUT_TOO_LARGE],
  ])("%s -> %s", (_label, raw, code) => {
    expect(parse(raw)).toMatchObject({ ok: false, code });
  });
});

describe("catalog mapping", () => {
  test("keeps catalog services with catalog name/price, drops unknown ids and duplicates", () => {
    const { services, dropped } = mapServices(
      [{ service_id: 2, reason: "a" }, { service_id: 99, reason: "b" }, { service_id: 2, reason: "c" }],
      CATALOG
    );
    expect(services).toEqual([{ service_id: 2, service_name: "Brake pad replacement", service_price: 149, reason: "a" }]);
    expect(dropped).toEqual([
      { service_id: 99, reason: "not in the service catalog" },
      { service_id: 2, reason: "duplicate" },
    ]);
  });
});
