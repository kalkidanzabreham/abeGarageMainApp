// "New problems only" lint for the frontend.
// The template-based frontend has many existing ESLint problems. Rather than
// ignore lint entirely, CI compares problem counts per (file, rule) with the
// committed eslint-baseline.json and fails if any count goes up. Fixing
// problems is always allowed; regenerate the baseline afterwards with
//   npm run lint:baseline
// Line numbers are not part of the key, so unrelated edits don't trip it.
import { ESLint } from "eslint";
import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";

const BASELINE = new URL("../eslint-baseline.json", import.meta.url);
const update = process.argv.includes("--update");

const eslint = new ESLint();
const results = await eslint.lintFiles(["."]);

const counts = {};
for (const r of results) {
  const file = relative(process.cwd(), r.filePath);
  for (const m of r.messages) {
    const key = `${file} :: ${m.ruleId ?? "parse-error"}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
}
const total = Object.values(counts).reduce((a, b) => a + b, 0);

if (update) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Baseline written: ${total} existing problems in ${Object.keys(sorted).length} file/rule pairs.`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const added = Object.entries(counts).filter(([k, n]) => n > (baseline[k] ?? 0));
const baselineTotal = Object.values(baseline).reduce((a, b) => a + b, 0);

console.log(`ESLint: ${total} problems now, ${baselineTotal} in the baseline.`);
if (added.length > 0) {
  console.error("\nNew lint problems (not in eslint-baseline.json):");
  for (const [k, n] of added) console.error(`  ${k}: ${n} (baseline ${baseline[k] ?? 0})`);
  const formatter = await eslint.loadFormatter("stylish");
  const files = new Set(added.map(([k]) => k.split(" :: ")[0]));
  console.error(await formatter.format(results.filter((r) => files.has(relative(process.cwd(), r.filePath)))));
  process.exit(1);
}
if (total < baselineTotal) console.log("Fewer problems than the baseline: run `npm run lint:baseline` to lock in the improvement.");
console.log("No new lint problems.");
