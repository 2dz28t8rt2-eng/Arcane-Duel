# Arcane Duel – v14.9.26: Guardian/Soul self-play training

## Motivation
v14.9.25 (#39937859539) established real strategic TEST-AI-vs-TEST-AI on BOTH sides.
The symmetric reference finished 318/640 (49.69%); offensive variants were
not superior. Soul essence accounted for many wins. The two-sided breach
variant also surfaced 133 position-change fallbacks in 118 games: some
research position decisions were indexed against the original learner
rather than the **currently active seat**.

## Source-level corrections
- The old research override indexed opponent and own cards using
  `learner` even when invoked for the other side. These lookups now use
  `game.active` consistently in the override.
- Legacy direct-finisher and breach switches are disabled across all
  v14.9.26 arms, so they cannot contaminate the new Guardian/Soul test.
- If a proposed switch is illegal, the run fails immediately with an
  explicit index/seat/phase error. It must never silently end the turn
  as the v14.9.25 fallback did.
- Both seats still execute the same full strategic research planner,
  confirmed by separate per-seat action and strategy counters.

## Learning from real prior self-play – observational, bounded
`tests/ai-v1526-fit-priors.cjs` reads the **TRAIN-only**
`stage-0..4-train-actions.json` archives from successful v14.9.25.
It isolates `symmetric-reference` traces to avoid confounding from
the experimental offensive overrides.

For each TRAIN game it computes normalized proportions of:
- Guardian/Soul normal summons and Guardian/Soul field presence
- Fusion decisions among strategic actions
- Attack decisions among strategic actions

It compares their associations with winning vs losing games. The
resulting **bounded** parameters `support`, `reserve`, and `breach`
are recorded in `selfplay-priors.json` with complete provenance.
This is empirical policy initialization, **not evidence that the
correlations cause wins**, and **not a full multistep RL algorithm**.
No HOLDOUT traces are ever read.

## Five arms, all against the strategic TEST AI
1. `symmetric-reference`: identical unchanged AI and policy on both sides
2. `selfplay-adaptive`: winning-policy seed fitted from previous TRAIN traces,
   optionally inherits the *selected* previous phase weights
3. `guardian-soul`: increased reward for Guardian/Soul support and
   slightly more conservation of precious material
4. `material-patient`: larger penalty for consuming Fusion materials;
   lower preference for risky high-ATK attacks
5. `symmetric-adaptive`: the same adapted weights on BOTH seats;
   diagnostic only, excluded from candidate promotion

Weights operate in the real planning/summon/attack action scores,
not by assigning any fake damage or changing the game's rules.

## Five paired full-combat phases
- Levels 8, 9, and 10 on identical 40-card mirrored decks
- Levels 8 and 10 on cross-role decks
- For each phase: 8 role pairs × 4 seed scenarios × 2 starters
  × 2 seats × 5 policy arms = 640 games
- 5 phases: **3,200 total**, **2,400 TRAIN**, **800 HOLDOUT**
- Equal decks and random initial seeds across comparator arms, with
  the same strategic planning core on both seats
- Normal Guardian, Soul, Predator and Fusion effects remain active;
  research-only symmetric arena-LP decay stays off

## Promotion and safeguards
A Challenger can advance only if it achieves **at least four
additional TRAIN wins among 96 matched games** relative to the
symmetric reference **AND no regression for either seat**.
Only the selected research weights are inherited from phase to phase.
The baseline is always available and never overwritten. The
symmetric-adaptive arm cannot be promoted. HOLDOUT only measures
generalization to unseen scenarios.

All three historical tactical Predator Q models are restored from
the latest successful checkpoint v14.9.25, together with valid TRAIN
samples from **15 successful historical runs**. Updates still require
dual validation and cannot silently reset previously learned Q-values.

## Research isolation
Only new test runners, evaluation scripts, training artifacts,
documentation and a GitHub Actions workflow on `development`
are changed. The production AI, real-game rules and `main`
are not silently modified.

## Files
- `tests/ai-v1526-fit-priors.cjs`
- `tests/ai-v1526-selfplay-synergy-training.cjs`
- `tests/ai-v1526-selfplay-aggregate.cjs`
- `tests/ai-v1526-history.cjs`
- `tests/ai-v1526-Q.cjs`
- `.github/workflows/ai-v14926-guardian-soul-selfplay.yml`
