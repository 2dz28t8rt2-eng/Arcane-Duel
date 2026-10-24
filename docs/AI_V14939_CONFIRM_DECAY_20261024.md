# Arcane Duel — v14.9.39 independent replication & full LP-decay stress test

## Purpose
The v14.9.38 GitHub run (#40123309581) first globally promoted research strategy `fusion-postreply-material` using predefined TRAIN+VALIDATION protection. It beat v14.9.28 `guardian-champion` 513 vs 457 in 960 research games, and 171 vs 153 in an independent total HOLDOUT. The additional material scoring versus `counterfactual-fusion` produced only +1 match over 960, however, and the hardest L10 HOLDOUT stayed one match behind baseline (30 vs 31). No production/main AI changed.

**v14.9.39 deliberately freezes the five v14.9.38 strategies and numerical weights** instead of testing new heuristic weights. It is a repeat-confirmation benchmark, not evidence of autonomous continual reinforcement learning or a live game rollout.

## 4,800 fresh-seed replication matches (selection cohort)
The same five roles/policies:
1. `guardian-champion` incumbent Guardian/Soul baseline
2. `counterfactual-fusion` economic role strategy with legal cloned fusion counterplay
3. `fusion-postreply-survival` baseline counterfactual plus 0.50 post-response survival weight
4. `fusion-postreply-material` **already selected research champion v14.9.38**, +0.70 material scarcity weight
5. `fusion-postreply-combined` both effects

Five independent phase families: L8 mirror, L9 mirror, L10 cross-role, L8 cross-role, hardest L10 cross-role. Each: 8 matchup archetypes × 6 new scenarios × 2 absolute starting players × 2 candidate player seats × 5 unchanged policies = 960; 4,800 total.

Separate TRAIN (1,600), VALIDATION (1,600), sealed HOLDOUT (1,600). Each strategy has 320 duels in each partition. Opponents alternate between verified older balanced and latest Guardian/Soul. LP decay symmetrically disabled for comparable historical research. Both player seats execute full strategic planner. Newly sampled deck/match seeds are unseen by previous experiments. The global selection still tests against v14.9.28 reference (same hard protection: +8 TRAIN and +8 VALIDATION, no candidate seat regression, tolerance -3 per named cohort, no hardest L10 validation regression). Selection never accesses HOLDOUT. Prior research champion's selected **historical** status is preserved independently of one experiment; if this run fails replication, report that and investigate, never silently switch or promote main.

## 960 completely separate full LP decay matches
Additional **stage 5** repeats the *hardest* L10 cross-role matchup family, with its OWN unused seed family, both candidate seats and absolute starters, all five unchanged strategies:
8 role pairs × 6 scenarios × 2 absolute starters × 2 candidate seats × 5 policies = 960 games.

This stage passes `decayEnabled:true` into the verified simulator. The underlying runtime maps it to `strategicTraining.disableArenaLPDecay=!scene.decayEnabled`, so the default LP decay mechanism runs symmetrically on both sides. This is a useful gap test, but no proof of exact equivalence to every possible live match condition, game effect or online AI deployment.

**Crucially, stage 5 is never included in the 4,800-duel champion qualification calculations.** It gets standalone per-policy TRAIN/VALIDATION/HOLDOUT diagnostic scorecards, both seats, and Fusion versus Guardian subgroup evidence. Its separate held-out games are not used for selection.

Total = **5,760** games. Main gate still acts on the first 4,800 only.

## Historical protected Q adaptation
Latest successful v14.9.38 run archive is included. 28 verified historical TRAIN-only sources v1511–v1538; Q checkpoint resumed from v1538. Fresh Q sampling seeds used with the prior strictly independent internal validation+confirmation gate. Former holdout results and stage-5 full-decay diagnostics are not eligible training data.

## Telemetry and limitations
Keep all original action mix, forecast-material/survival counters, seat-by-starter, hard L10 and paired matchup audits. Full decay stage outputs `decayEnabled:true` per duel, checked by GitHub CI. The post-reply counterfactual planner still simulates at most two legal enemy attacks, not full hidden-hand adversarial search. It is research-only on `development`, no productive game AI or `main` modifications.

## Code
- `tests/ai-v1539-confirm-decay-selfplay.cjs`
- `tests/ai-v1539-confirm-decay-aggregate.cjs`
- `tests/ai-v1539-history.cjs`
- `tests/ai-v1539-Q.cjs`
- `.github/workflows/ai-v14939-confirm-decay.yml`
