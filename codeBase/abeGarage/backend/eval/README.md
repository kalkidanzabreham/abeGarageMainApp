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
