# Smart intake evaluation

`cases.json` holds 60 customer complaints with the answer a service writer
would expect. The eval runs them through the same pipeline as the API
(`ai/intake.js`: same prompt, parser, repair, retry and catalog mapping)
and reports how often the model's draft is usable and how close it is.

## The cases

| Category | Cases | What it tests |
|---|---|---|
| `clear` | 12 | One clearly described problem |
| `vague` | 9 | "weird noise", "feels off": should ask questions, not guess |
| `multi` | 9 | Two or three problems in one complaint |
| `typos` | 9 | Misspellings ("breaks squeek", "chek engne lite") |
| `short` | 9 | One or two words ("brakes", "noise") |
| `irrelevant` | 6 | Not about a vehicle problem, including one prompt injection |
| `amharic_mixed` | 6 | Amharic, or Amharic mixed with English; `note` has a translation |

Each case has:

- `expected.services`: catalog services the draft **should** suggest (by
  name, because ids differ between databases). Can be empty when nothing
  in the catalog fits or the complaint is too vague to pick one.
- `expected.acceptable_services`: services that are reasonable but not
  required (e.g. a diagnostic scan for an engine complaint). Suggesting
  them is not counted as wrong; leaving them out is not counted as missed.
- `expected.urgency`: `low`, `medium` or `high`, using the definitions in
  the prompt (`ai/prompt.js`): high = may be unsafe to drive (brakes,
  steering, wheels, smoke, overheating, flashing warning light); medium =
  should be looked at soon; low = maintenance, comfort, or not a vehicle
  problem.
- `expected.questions_required: true` (vague complaints, and short ones
  that name a symptom rather than a service): the draft must include at
  least one question for the customer.

The catalog is the 18 demo services from `db/seeds/01_demo_data.js`.

### Labelling rules

Applied to every case against the 18-service catalog:

- A symptom that points to one part is labelled with that repair
  (grinding brakes -> Brake pad replacement); the matching inspection is
  acceptable.
- A symptom that points to a system but not a part is labelled with that
  system's inspection (soft brake pedal -> Brake system inspection;
  overheating -> Cooling system inspection); likely repairs are acceptable.
- Starting and battery symptoms -> Battery and charging test; Battery
  replacement is acceptable (a garage tests before replacing).
- Warning lights and running problems -> Diagnostic scan.
- Too vague to point at a system, or points at several -> nothing
  required; plausible inspections are acceptable, and questions are
  required.

Rule numbers below refer to this list (1-5).

Why bare "won't start" (c41) is rule 5 but "won't start, just clicks"
(c32) is rule 3: a click when turning the key is the classic sign of a
battery too weak to turn the starter, so the complaint points at one
system and the battery and charging test is the right first job. "Won't
start" alone could be the battery, the starter, fuel, ignition or an
immobiliser; nothing is required, the battery test, a diagnostic scan and
spark plugs are acceptable, and the draft must ask questions (does it
crank? any click? any warning lights?).

## Dev / test split

The split was fixed when the cases were written, before any model was run
on them or any prompt was tuned:

> Within each category, in file order, cases 1, 4, 7, 10 (every third,
> starting with the first) are **dev**; all others are **test**.

That gives 20 dev and 40 test cases, with every category in both. The rule
is stored in each case's `split` field, and the eval script checks that the
field still matches the rule, so the split can't drift when cases are
edited.

- **dev** (20): used to look at outputs and change the prompt or repair.
- **test** (40): not looked at and not tuned on. Run once, at the end, and
  the numbers are reported as they come out. The script refuses to run the
  test split without `--final`.

Contamination, and what was done about it: three complaints were used in
a provider speed check before this file existed. c25 (dev) is the same
text and stays, since dev cases may be looked at. c06, c56 and c57 (test)
were close in meaning, so they were reworded on 2026-11-05, before any
eval run, keeping their category, split and labelling rule:

| Case | Before | After |
|---|---|---|
| c06 | Check engine light came on yesterday, car drives normally. | The orange engine symbol on the dash has stayed lit since I filled up last week; it drives the same as before. |
| c56 | መኪናዬ ጠዋት አይነሳም, just clicks | ባትሪው ደካማ ነው, the engine turns over very slowly |
| c57 | check engine light በርቷል ከትላንት ጀምሮ | ዳሽቦርዱ ላይ ቢጫ መብራት ታየ after the car wash |

The catalog was then expanded from 8 to 18 services and every case was
relabelled against it with the rules above, also before any eval run.

## Metrics

Reported separately for dev and test, and per provider, as counts and
percentages (e.g. 37/40):

- **Valid on first attempt**: the first answer parsed strictly (no repair).
- **Valid after repair**: the first answer needed a repair, but no retry.
- **Valid after retry**: the second attempt produced a usable draft.
- **Final failure**: no usable draft after the retry (or timeout, provider
  error).
- **Service precision**: of all services suggested, how many are in
  `services` or `acceptable_services` (summed over cases).
- **Service recall**: of all `services` expected, how many were suggested.
- **Urgency agreement**: drafts whose urgency equals `expected.urgency`.
- **Questions present**: of the cases with `questions_required`, drafts
  with at least one question.
- **Latency**: mean and p95 per case, including retries and failures.

Precision, recall and urgency are computed over the cases that produced a
draft; failures count only in the failure rate.

## Running it

```
node eval/run.js --provider gemini --split dev               # tuning loop
node eval/run.js --provider ollama --split dev --timeout 300000
node eval/run.js --provider gemini --split test --final      # once per model
```

Results are written to `eval/results/` (one JSON file per run, with every
case's draft and the metrics). The catalog comes from the database in
`backend/.env`, so seed it first (`npm run seed`).

## Tuning log (dev only)

Gemini 3.1 Flash-Lite, 20 dev cases. The prompt was frozen at v3 before
the test split was run.

| Prompt | Recall | Urgency | Precision | Change |
|---|---|---|---|---|
| intake-v1 | 13/16 | 17/20 | 26/26 | first version |
| intake-v2 | 14/16 | 19/20 | 27/27 | part-specific symptom -> the repair (grinding brakes -> pads); any brake symptom is high; unexplained noise is medium |
| intake-v3 | 15/16 | 20/20 | 25/25 | pad rule also inside multi-problem complaints; vibration at speed is medium |

## Results: held-out test split (40 cases), run once on 2026-11-05

| Metric | Gemini 3.1 Flash-Lite, prompt v3 | Keyword rules (no model) |
|---|---|---|
| Valid JSON on the first attempt | 39/40 (97.5%) | 40/40 |
| Valid after repair | 0/40 | 0/40 |
| Valid after the retry | 1/40 (2.5%) | 0/40 |
| Final failure | 0/40 | 0/40 |
| Service precision | 48/48 (100%) | 29/31 (93.5%) |
| Service recall | 33/37 (89.2%) | 19/37 (51.4%) |
| Urgency agreement | 34/40 (85.0%) | 16/40 (40.0%) |
| Urgency baseline, always "medium" | 27/40 (67.5%) | 27/40 (67.5%) |
| Asked a question where required | 10/10 | 10/10 (it always asks one) |
| Latency mean / p95 | 2.5 s / 4.7 s | ~0 |

The keyword rules are the 7 regexes of the `fake` provider, written for
the UI tests before these cases existed. They do well on dev (recall
14/16) but fall to 19/37 on test, so dev is an easy split for keywords.

What the test misses were (looked at only after the final run):

- Urgency (6 misses): 3 starting/charging complaints (c12, c32, c41)
  marked high instead of medium; 2 vague complaints (c14, c18) marked low
  instead of medium; "alignment" (c44) medium instead of low.
- Recall (4 misses): c39 ("breaks squeek and petal pulses") got only the
  brake inspection; c09 missed disc resurfacing; c15 ("isn't running
  right") got no service where the label asks for a diagnostic scan.
- The one retry (c41) was a 20 s timeout, recovered by the retry. Across
  all Gemini runs (3 x 20 dev + 40 test = 100 cases) there were 3 such
  timeouts, all recovered; the machine was heavily loaded by unrelated
  services during the runs, so part of that may be local.

Dev numbers after tuning (v3: urgency 20/20) are optimistic by
construction; the test numbers above are the ones to quote.
