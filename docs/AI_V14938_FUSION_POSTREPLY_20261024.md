# Arcane Duel KI – v14.9.38: Post-Reply Fusion Survival and Material Conservation

## Confirmed history and experimental rationale
Verified v14.9.37 Github run #40118499997 completed 4,800 games and did NOT promote any candidate. Global incumbent remains v14.9.28 Guardian/Soul. The fixed `counterfactual-fusion` research challenger won 505 vs incumbent 456 games, but lost 2 VALIDATION seat-2 wins and 3 hardest-L10 validation wins. The proposed visible Guardian ATK-break bonus scored 52,125 evaluations, yet did not improve hardest-L10 VALIDATION or the Fusion-vs-Guardian subgroup. Hence: testing a raw ATK-vs-DEF bonus again would be unlikely to help. Shift attention to actual cloned fight outcomes plus resource commitment.

## Predeclared strategies (5 x 960 games)
1. `guardian-champion`: identical v14.9.28 globally selected research policy.
2. `counterfactual-fusion`: preserved v14.9.33 research challenger with fusion counterfactual utility adjustment +0.40.
3. `fusion-postreply-survival`: #2 plus a **bounded** score from actual fusion survival, candidate-vs-opponent LP damage, and whether the legally simulated Guardian counterattack(s) destroyed the newly fused monster. Applied only when an opposing Guardian was publicly visible before the action; risk coefficient 0.50.
4. `fusion-postreply-material`: #2 plus bounded resource-use penalty scaled to number of fused materials and remaining player hand after the actual cloned fusion; larger penalty if fused card dies. Again only with a publicly visible enemy Guardian; coefficient 0.70.
5. `fusion-postreply-combined`: #3 + #4 predeclared.

The implementation reuses the existing `simulate(entry)` call in verified `tests/ai-v1519-crossdeck-shards.cjs`: clone the real game, apply the candidate fusion with legal pending placement, calculate utility, apply up to two legally chosen enemy attacks through the engine's `attack()`, then inspect real resulting field, LP and hand. It does not infer enemy hand contents, predict a full enemy turn, activate every possible ability, or run an unconstrained minimax search.

### Telemetry
`postReplyFusionChecks`, `postReplyFusionSurvivors`, `postReplyFusionLosses`, `postReplyMaterialChecks`, chosen actions and paired actual wins. Strongest-L10 Fusion-vs-Guardian subgroup broken out by seat and starter. A high intervention count alone is NOT evidence of an improved win rate.

## Paired randomized experiment
Identical 5-stage curriculum: L8 mirror, L9 mirror, ordinary L10 cross-role, L8 cross-role, difficult L10 cross-role.
Every stage: 8 role pairings × 6 seed scenarios × 2 starter positions × 2 candidate seats × 5 arms = 960. 4,800 total, 320 TRAIN + 320 VALIDATION + 320 sealed HOLDOUT duels per arm. All challengers and reference fight on matched new deck/match seeds; both sides use the full strategic AI. Benchmark uses symmetrically disabled LP decay, unlike full game.

Global selection only after 5 stages:
- at least +8 TRAIN **and** +8 VALIDATION wins versus champion;
- no deficit on either candidate seat within TRAIN or VALIDATION;
- no VALIDATION mirror/crossrole/current-champion/older-balanced cohort regression below -3 wins;
- no regression in hardest L10 VALIDATION at all.

The held-out 320 games/arm are never used for strategy selection. No stage-local promotions and no changes to the live AI or main branch. The historical v1537 holdout inspired the design but is not training input; current unseen v1538 HOLDOUT stays sealed until final reporting.

## Historical Q transfer
27 verified successful Q TRAIN-only archives (v1511-v1537), plus newest previously accepted Q checkpoint; use new tactical validation/confirmation seed families. Retain the existing conservative double-validation Q selection rule. Reject contaminated training examples and never learn from any archived HOLDOUT example.

## Code / automation
- `tests/ai-v1538-fusion-postreply-selfplay.cjs`
- `tests/ai-v1538-fusion-postreply-aggregate.cjs`
- `tests/ai-v1538-history.cjs`
- `tests/ai-v1538-Q.cjs`
- `.github/workflows/ai-v14938-fusion-postreply.yml`
