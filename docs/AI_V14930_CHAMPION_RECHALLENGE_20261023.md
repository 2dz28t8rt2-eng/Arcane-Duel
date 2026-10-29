# Arcane Duel — v14.9.30: Guardian/Soul Champion Rechallenge

## Motivation and verified preceding results

v14.9.28 (#39974390088) selected a Guardian/Soul research champion,
based on TRAIN and VALIDATION only: role policy
`{guardian:1.15,soul:1.30,material:0.85,risk:0.95}`.
The independent v14.9.28 HOLDOUT confirmed a measured +27 wins against
the previous research reference in 320 matched games.

v14.9.29 (#39983397260) ran successfully against this champion but kept
it unchanged: none of four challengers passed the strict train and
validation promotion gate. In this exploratory historical evaluation,
the candidate named guardian-soul-balanced achieved 184/320 HOLDOUT
wins vs champion 158/320, and guardian-adaptive 181/320. These are
past results, **not fresh proof** of generalizable superiority.
They inform new research hypotheses, and v14.9.30 uses entirely new
deck and match seeds.

## Two-sided strategic AI and champion opponents

The actual Arcane Duel simulation is used, not mock damage.
**Both** seats use the complete research strategic planner for
summoning, fusion, role assessment, defense, soul and attack.
The opponent ALWAYS uses the validated champion's role scores;
the Q table alternates between current v14.9.29-continued tactical
Q and a verified older v14.9.28 Q checkpoint. In particular,
the previous odd-scenario opponent fall-back to a weak role heuristic
is deliberately REMOVED for v14.9.30.
Both starting seat and starting player are matched between strategies.
Normal full-combat abilities and creature decay remain active;
the arena LP decay is symmetrically disabled for research as before.

## Policies compared — fixed across all five stages

1. `guardian-champion` — validated incumbent; no automatic promotion
2. `balanced-confirmation` — re-evaluate v14.9.29 balanced adaptive
   approach (guardian 1.22, soul 1.38, material 1.30, risk 1.42)
3. `adaptive-confirmation` — re-evaluate previous adaptive approach
   (1.15, 1.30, 1.10, 1.24)
4. `balanced-risk-guard` — a new, more conservative adaptive variation
   (1.23, 1.40, 1.33, 1.62)
5. `guardian-soul-stable` — a new non-adaptive variation
   (1.27, 1.40, 1.14, 1.20)

These policies modify research action-scoring weights only, not game rules
or the production opponent AI. Adaptive variations respond to visible
board Guardian/Soul support, resource availability and current LP/threat
balance. They are **not** trained full-stack reinforcement learners.

## Self-play, independent generalization and gated promotion

Five stages: mirror decks at levels 8, 9 and 10, followed by cross-role
decks at levels 8 and 10. Each stage has 8 role matchups, 6 scenarios,
both starter conditions, both seat positions and all 5 candidates:
**960 games per stage, 4,800 in total**.

Of these: 1,600 TRAIN, 1,600 VALIDATION, and 1,600 separate HOLDOUT.
Every candidate completes 320 matched games per split across five stages.
The entire fixed-policy comparison is repeated on new seeds and decks.

Only after all five stages, a challenger is eligible if it gains at
least +8 TRAIN and +8 VALIDATION wins against the incumbent, regresses
on neither seat in either split and falls behind by no more than 3
VALIDATION wins in any group: mirror, cross-role, modern-Q or older-Q.
Eligible strategies are ranked by VALIDATION then TRAIN outcomes.
HOLDOUT is never used for selection; it is measured only afterward.
If no challenger qualifies, the champion remains.

## Validated historical learning state and reliability

Tactical Predator Q resumes from the successful v14.9.29 research
checkpoint, with TRAIN-only examples from **19 successful runs**.
Any Q update must pass its own protected validation, avoiding silent
reset of past Q knowledge. Historical HOLDOUT game outcomes are not
used as TRAIN data.

Each 960-game stage is divided into eight separate 120-game Node
processes to preserve the v14.9.27 memory fix. Every shard is checked,
merged deterministically and audited for pairing, legality, seat
position, starter and cohort isolation. Illegal moves fail fast.
Previous HOLDOUT insights motivate new strategies but the current
v14.9.30 HOLDOUT remains completely unseen during selection.

Research scripts and this workflow are on `development`. No changes
to `main`, production AI or game balancing have been promoted.

## GitHub

- Workflow: `.github/workflows/ai-v14930-champion-rechallenge.yml`
- Duel runner: `tests/ai-v1530-champion-generalization.cjs`
- Aggregation: `tests/ai-v1530-champion-generalization-aggregate.cjs`
- Historical TRAIN replay: `tests/ai-v1530-history.cjs`
- Tactical Q continuation: `tests/ai-v1530-Q.cjs`
- Run: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40003331538
