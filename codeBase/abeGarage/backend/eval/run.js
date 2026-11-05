#!/usr/bin/env node
// Smart intake eval: runs eval/cases.json through the same pipeline as the
// API (ai/intake.js) and reports the metrics described in eval/README.md.
//
//   node eval/run.js --provider gemini --split dev
//   node eval/run.js --provider ollama --split dev            (slow on CPU)
//   node eval/run.js --provider gemini --split test --final   (once, at the end)
//
// Options: --model <name>  --timeout <ms>  --delay <ms between cases>
//          --cases <ids, comma-separated, dev only>  --out <file>
// Reads the service catalog from the database in backend/.env (DB_*), and
// GEMINI_API_KEY / OLLAMA_URL from there too. Results go to eval/results/.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { runIntake } = require("../ai/intake");
const { PROMPT_VERSION } = require("../ai/prompt");
const { createProvider } = require("../ai/providers");

const CASES_FILE = path.join(__dirname, "cases.json");
const RESULTS_DIR = path.join(__dirname, "results");
const DEFAULTS = {
  gemini: { timeout: 20000, delay: 5000 }, // 5 s apart: ~12 requests/minute even with retries
  ollama: { timeout: 90000, delay: 0 },
  fake: { timeout: 2000, delay: 0 },
};
const BASELINE_URGENCY = "medium";

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`unexpected argument ${a}`);
    const key = a.slice(2);
    if (key === "final") args.final = true;
    else args[key] = argv[++i];
  }
  return args;
};

// The split rule from eval/README.md: within each category, in file order,
// every third case starting with the first is dev.
const checkSplit = (cases) => {
  const seen = {};
  const wrong = [];
  for (const c of cases) {
    const k = (seen[c.category] = (seen[c.category] ?? -1) + 1);
    if (c.split !== (k % 3 === 0 ? "dev" : "test")) wrong.push(c.id);
  }
  if (wrong.length) throw new Error(`split field does not match the rule for: ${wrong.join(", ")}`);
};

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : "n/a");
const ratio = (n, d) => `${n}/${d} (${pct(n, d)})`;
const p95 = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(0.95 * s.length) - 1)];
};

const score = (rows) => {
  const n = rows.length;
  const count = (f) => rows.filter(f).length;
  const drafts = rows.filter((r) => r.ok);
  let suggested = 0, suggestedOk = 0, expected = 0, expectedFound = 0;
  for (const r of drafts) {
    const okSet = new Set([...r.expected.services, ...r.expected.acceptable_services]);
    suggested += r.services.length;
    suggestedOk += r.services.filter((s) => okSet.has(s)).length;
    expected += r.expected.services.length;
    expectedFound += r.expected.services.filter((s) => r.services.includes(s)).length;
  }
  const needQ = drafts.filter((r) => r.expected.questions_required);
  const latencies = rows.map((r) => r.latency_ms);
  return {
    cases: n,
    first_attempt_strict: count((r) => r.outcome === "ok_strict"),
    first_attempt_repaired: count((r) => r.outcome === "ok_repaired"),
    ok_after_retry: count((r) => r.outcome === "ok_retry"),
    failed: count((r) => r.outcome === "failed"),
    failure_reasons: rows.filter((r) => !r.ok).map((r) => `${r.id}:${r.reason}`),
    service_precision: { hit: suggestedOk, of: suggested },
    service_recall: { hit: expectedFound, of: expected },
    urgency_agreement: { hit: drafts.filter((r) => r.urgency === r.expected.urgency).length, of: drafts.length },
    urgency_baseline_always_medium: { hit: count((r) => r.expected.urgency === BASELINE_URGENCY), of: n },
    questions_present: { hit: needQ.filter((r) => r.questions.length > 0).length, of: needQ.length },
    latency_ms: { mean: Math.round(latencies.reduce((a, b) => a + b, 0) / n), p95: p95(latencies) },
  };
};

const report = (m, label) => {
  const lines = [
    `### ${label}`,
    "",
    "| Metric | Result |",
    "|---|---|",
    `| Valid JSON on the first attempt (strict) | ${ratio(m.first_attempt_strict, m.cases)} |`,
    `| Valid after repair (first attempt) | ${ratio(m.first_attempt_repaired, m.cases)} |`,
    `| Valid after the retry | ${ratio(m.ok_after_retry, m.cases)} |`,
    `| Final failure | ${ratio(m.failed, m.cases)}${m.failure_reasons.length ? ` (${m.failure_reasons.join(", ")})` : ""} |`,
    `| Service precision | ${ratio(m.service_precision.hit, m.service_precision.of)} |`,
    `| Service recall | ${ratio(m.service_recall.hit, m.service_recall.of)} |`,
    `| Urgency agreement (drafts) | ${ratio(m.urgency_agreement.hit, m.urgency_agreement.of)} |`,
    `| Urgency baseline: always "medium" (all cases) | ${ratio(m.urgency_baseline_always_medium.hit, m.urgency_baseline_always_medium.of)} |`,
    `| Asked at least one question (questions_required) | ${ratio(m.questions_present.hit, m.questions_present.of)} |`,
    `| Latency per case, mean / p95 | ${(m.latency_ms.mean / 1000).toFixed(1)} s / ${(m.latency_ms.p95 / 1000).toFixed(1)} s |`,
  ];
  return lines.join("\n");
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const providerName = args.provider;
  if (!DEFAULTS[providerName]) throw new Error("--provider must be gemini, ollama or fake");
  if (!["dev", "test"].includes(args.split)) throw new Error("--split must be dev or test");
  if (args.split === "test" && !args.final) {
    throw new Error("the test split is run once, at the end: add --final (see eval/README.md)");
  }
  if (args.split === "test" && args.cases) throw new Error("--cases is for dev only; the test split always runs in full");

  const all = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
  checkSplit(all);
  let cases = all.filter((c) => c.split === args.split);
  if (args.cases) {
    const ids = new Set(args.cases.split(","));
    cases = cases.filter((c) => ids.has(c.id));
  }

  const config = { ...process.env, AI_PROVIDER: providerName, AI_MODEL: args.model || "" };
  const provider = createProvider(config);
  const finalFile = path.join(RESULTS_DIR, `final-test-${provider.name}-${provider.model.replace(/[^\w.-]/g, "_")}.json`);
  if (args.final && fs.existsSync(finalFile)) {
    throw new Error(`the final test run for ${provider.model} already exists (${path.relative(process.cwd(), finalFile)})`);
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME, decimalNumbers: true,
  });
  const [catalog] = await db.query("SELECT service_id, service_name, service_description, service_price FROM common_services ORDER BY service_id");
  await db.end();
  const names = new Set(catalog.map((s) => s.service_name));
  const unknown = all.flatMap((c) => [...c.expected.services, ...c.expected.acceptable_services]).filter((s) => !names.has(s));
  if (unknown.length) throw new Error(`labels name services missing from the catalog: ${[...new Set(unknown)].join(", ")}`);

  const timeoutMs = Number(args.timeout || DEFAULTS[providerName].timeout);
  const delayMs = Number(args.delay ?? DEFAULTS[providerName].delay);
  console.error(`${args.split}: ${cases.length} cases, ${provider.name} ${provider.model}, timeout ${timeoutMs} ms, catalog ${catalog.length} services`);

  const rows = [];
  for (const [i, c] of cases.entries()) {
    if (i > 0 && delayMs) await new Promise((r) => setTimeout(r, delayMs));
    const result = await runIntake({ complaint: c.complaint, provider, catalog, timeoutMs, maxChars: 1000 });
    const row = {
      id: c.id,
      category: c.category,
      ok: result.ok,
      outcome: result.meta.outcome,
      reason: result.ok ? null : result.reason,
      attempts: result.meta.attempts,
      repairs: result.meta.repairs,
      dropped_services: result.meta.dropped_services || [],
      latency_ms: result.meta.latency_ms,
      services: result.ok ? result.draft.suggested_services.map((s) => s.service_name) : [],
      urgency: result.ok ? result.draft.urgency : null,
      questions: result.ok ? result.draft.questions_to_ask_customer : [],
      systems: result.ok ? result.draft.suspected_systems : [],
      confidence: result.ok ? result.draft.confidence : null,
      attempt_errors: result.attempts.filter((a) => !a.ok).map((a) => a.code),
      expected: c.expected,
    };
    rows.push(row);
    console.error(`  ${c.id} ${row.outcome} ${(row.latency_ms / 1000).toFixed(1)}s`);
  }

  const metrics = score(rows);
  const label = `${args.split} (${cases.length} cases), ${provider.name} ${provider.model}, prompt ${PROMPT_VERSION}`;
  const out = {
    run_at: new Date().toISOString(),
    split: args.split,
    final: Boolean(args.final),
    provider: provider.name,
    model: provider.model,
    prompt_version: PROMPT_VERSION,
    timeout_ms: timeoutMs,
    catalog_size: catalog.length,
    metrics,
    cases: rows,
  };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = args.out || (args.final ? finalFile
    : path.join(RESULTS_DIR, `${args.split}-${provider.name}-${provider.model.replace(/[^\w.-]/g, "_")}-${PROMPT_VERSION}${args.cases ? "-partial" : ""}.json`));
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(report(metrics, label));
  console.log(`\nSaved ${path.relative(process.cwd(), file)}`);
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { score, checkSplit, p95 };
