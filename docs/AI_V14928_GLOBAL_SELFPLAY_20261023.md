# Arcane Duel – v14.9.28 Global fixed-strategy and adaptive-board selfplay

## Why the v14.9.27 outcome demands a new selection process
The latest successful v14.9.27 run #39963832441 (4,800 strategic
TEST-AI-vs-TEST-AI matches) showed cross-condition advantages for
fixed candidate policies, including the counterattack-risk policy
(171/320 unseen holdout wins vs baseline 145/320).
However, the existing **per-phase promotion algorithm** chose only
two policies and its stage-composite HOLDOUT won 144 vs 145 for the
reference. That is a clear empirical generalization problem.

## v14.9.28 design
Use the same matched-seat-and-starter, older/current Q adversary
pool and five-level curriculum, with NEW deck and RNG seeds to
avoid re-testing historical HOLDOUT cases.
Every candidate is FIXED for all five phases; there is no
stage-local promotion or inherited decision weights.

Five strategic action-scoring policies:
1. `pool-reference`: same full strategic TEST AI on both sides, no
   extra role-policy score applied to candidate
2. `guardian-soul-board`: previous positive Guardian/Soul support weights
3. `fusion-threat`: material preservation and target-risk weighting
4. `counter-risk`: defensive threat and counterstrike-aware attacks
5. `board-adaptive`: NEW board-dependent risk evaluation. When a Guardian
   has Soul support or a Soul has Guardian support, score the combination
   higher; protect rare Fusion material when the field has fewer cards;
   assess enemy board crowding and own/enemy LP ratio before attacks

The game rules are unchanged; these are **research-only features in
the action scoring functions**, not genuine end-to-end self-learning
or any full multi-ply reinforcement-learning model.

## Data split and globally selected promotion
5 phases × 8 role pairs × 6 disjoint scenarios × 2 starter settings ×
2 player seats × 5 policies = **4,800 duels**:
- 1,600 TRAIN
- 1,600 VALIDATION
- 1,600 untouched HOLDOUT

Each fixed policy completes **320 TRAIN**, **320 VALIDATION**, and
**320 HOLDOUT** paired games across all five phases.

The GLOBAL promotion gate, checked only after all five phases,
requires **at least 12 more TRAIN wins**, **10 more VALIDATION wins**,
no regression on either seat in either split, and no validation loss
worse than 4 duels in any of:
- mirrored decks (stages 0–2)
- cross-role decks (stages 3–4)
- current-Q opponent scenarios
- historical-Q opponent scenarios

Eligible policies are ranked by their TOTAL VALIDATION wins, then
TRAIN wins. If none passes, keep `pool-reference`.
HOLDOUT is never a selector and its results are only read for reporting
after the candidate has been selected.

## Historic knowledge, Q preservation, and adversaries
Restore tactical Q from successful v14.9.27 run #39963832441,
together with 17 verified past runs of train-only examples.
All tactical Predator Q updates remain subject to protected validation.
The opponent pool includes the current Q and a previous frozen Q+weights
checkpoint, but not a separate full historical engine binary.

## Reliable simulation and validation
Five phases each contain eight isolated 120-game Node.js processes
to prevent the 2.9GB heap crash encountered earlier.
All process outputs must be present, uniquely paired and legal
before phase or run completion. The 3-cohort split is preserved
end-to-end. Both seats execute the full strategic TEST AI.
A fail-fast illegal position change is never silently converted
into turn ending. Symmetric arena LP decay remains off as a
research-only control.

Only new research scripts, workflow and documentation are created
on `development`. The production AI and `main` are not modified.

## Files
- `tests/ai-v1528-global-policy-selfplay.cjs`
- `tests/ai-v1528-global-policy-aggregate.cjs`
- `tests/ai-v1528-history.cjs`
- `tests/ai-v1528-Q.cjs`
- `.github/workflows/ai-v14928-global-policy-selection.yml`
