# Arcane Duel – KI-Training v14.9.29: Champion challenge

## Background
v14.9.28 (#39974390088) confirmed its GLOBAL selection of
`guardian-soul-board` against the older research reference.
Its independent holdout was **176/320**, versus **149/320**
for the previous reference, or +27 wins (+8.44 percentage points).
The next goal is to improve THIS stronger policy, not exploit the older
and weaker research opponent.

## Current incumbent and candidate policies
The old global winner becomes the unchanged **research champion** on
the candidate seat: Guardian 1.15, Soul 1.30, material penalty .85,
risk .95. Its full underlying planning engine and current tactical Q
are unchanged.

Four fixed candidates compete against this champion:
- `champion-counter-risk`: same Guardian/Soul support, higher defensive
  exposure penalty (1.45)
- `champion-fusion-reserve`: same Guardian/Soul support, conserve scarce
  Fusion materials more (1.40)
- `champion-board-adaptive`: same Guardian/Soul foundation, but context
  boosts for a Guardian supporting Souls or vice versa; LP ratios,
  opposing board crowding and material scarcity guide decisions
- `champion-soul-offensive`: stronger Soul synergy, slightly lower
  defensive risk penalty to test the opposite tactical direction

Each opponent also uses **the strategic TEST AI with the champion
Guardian/Soul scoring policy**, not the default game opponent.
On alternate scenarios it uses a frozen earlier tactical Q and
bounded previous-strategy weights, for broader opponent coverage.
The historical opponent Q table is a checkpoint; the entire
underlying game engine is not an independently frozen version.

## Five complete-game phases
- Equal-card mirror on level 8
- Equal-card mirror on level 9
- Equal-card mirror on level 10
- Cross-role level 8
- Cross-role level 10

5 phases × 8 role matchups × 6 novel scenarios × 2 starters ×
2 seats × 5 profiles = **4,800 actual full strategic selfplay matches**.

TRAIN, VALIDATION, and HOLDOUT consist of 1,600 disjoint scenarios each;
every fixed profile has 320 matches per split. The random deck and
match seeds are new and independent from v14.9.28.

## Promotion gate
Only once ALL five phases are simulated does the global aggregator
select a fixed candidate based on:
- at least 12 additional TRAIN wins against the guardian/soul champion
- at least 10 additional VALIDATION wins against the same champion
- no overall decrease on either seat on TRAIN or VALIDATION
- no validation loss worse than four duels in matched mirror,
  cross-role, older-Q and newest-Q subsets

If no candidate qualifies, keep the v14.9.28 champion as incumbent.
The HOLDOUT is NEVER used for selection or Q-learning and is inspected
only after a global candidate is selected.

## Historical and safety controls
Tactical Predator Q resumes from the successful v14.9.28 checkpoint
(#39974390088), using 18 successful historic TRAIN archives.
All Q updates are protected by two internal validations. There is
no silent Q reset.

The same test AI strategic engine runs on both seats. All legal action
and combat checks must pass; illegal position switches abort the test.
The arena LP decay is symmetrically disabled as a research control.

The 4,800-match simulation is divided into 40 isolated processes,
120 duels each, with strict deterministic shard merging. Every duel
has paired seeds, starter, deck and seat across the five profiles.

Only research files and GitHub Actions on `development` are changed.
The production game AI, live game rules and `main` remain untouched.

## Source files
- `tests/ai-v1529-champion-selfplay.cjs`
- `tests/ai-v1529-champion-aggregate.cjs`
- `tests/ai-v1529-history.cjs`
- `tests/ai-v1529-Q.cjs`
- `.github/workflows/ai-v14929-champion-selfplay.yml`
