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

The catalog is the 8 demo services from `db/seeds/01_demo_data.js`.

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

Known contamination, recorded before any eval run: three complaints were
used in a provider speed check (3 complaints, before this file existed):
c25 (dev) is the same text; c06 and c56/c57 (test) are close in meaning.
The prompt was not changed after that check.

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
- **Latency**: mean and p95 per case, including retries and failures.

Precision, recall and urgency are computed over the cases that produced a
draft; failures count only in the failure rate.
