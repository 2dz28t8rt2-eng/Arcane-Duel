# Arcane Duel KI v14.9.35 – Seat-Role Audit and Legal Attacker Counter-Responses

## Motivating verified observations
Successful run #40094049613 (v14.9.34) completed all 4,800 strategic paired duels but no challenger passed global selection. All challengers gained at least +28 TRAIN wins yet gained only +6/+7 VALIDATION wins (requires +8), lost two wins on candidate seat 2 (77 vs incumbent 79), and regressed hardest L10 validation. One tactical Q update improved internal gates but had a small negative independent Q holdout utility; it was still accepted under the earlier non-strict acceptance rule.

This new run does not retroactively promote any model, use former HOLDOUT labels for Q updates, or weaken strategy gates.

## Strategies – 960 matched duels each, all predetermined
1. `guardian-champion`: retained v14.9.28 globally validated champion.
2. `role-economy`: static resource-preservation research reference.
3. `counterfactual-fusion`: unchanged v14.9.33 near-pass research variant, which already evaluates legal cloned enemy attacks after fusion planning.
4. `counterfactual-attack-guard`: same as (3) plus limited legal enemy attack simulation **after a proposed candidate attack** against a board with at least one visible enemy level-9/10 monster.
5. `counterfactual-dual-guard`: same as (4) plus the previously defined selective high-level counterfactual fusion weighting.

After a cloned candidate attack has been legally applied, the simulator changes the cloned active side, resets the cloned enemy's attacked flags, uses existing `attackPlan(trial)` to find a legal enemy attack, and executes it with the actual `attack(trial,...)` rules. Candidate scores receive a capped penalty reflecting own LP loss, lost monsters and board-value loss. At most three attack options per scored decision are explored. This is **one possible legal enemy attack**, not a full opponent turn; there are no opponent hidden-hand reads or invented future draws.

This is a test of an opponent-response tactic, not an automatic indication of higher win rate. Both sides play the full test planner; no unilateral AI downgrade.

## Paired benchmark and fair selection
Five phases unchanged: L8 mirror, L9 mirror, L10 cross-role, L8 cross-role and hard L10 cross-role. Every phase covers 8 role pairings × 6 scenario seeds × 2 starting player choices × 2 candidate seats × 5 fixed strategies = 960 duels. Total **4,800** and three isolated splits of 1,600 each (TRAIN/VALIDATION/HOLDOUT), corresponding to 320 matches per strategy in each split. New deck and match RNG seeds, within supported deck-builder bounds.

Opponent Q/policies alternate between the validated champion and predeclared historical balanced opponent. Opponent and candidate AI are strategic, both candidate seats are tested, equal starting LP and zero illegal stance switches are mandatory.

Strict global promotion conditions, selected only on TRAIN+VALIDATION:
- At least +8 TRAIN wins AND +8 VALIDATION wins over incumbent;
- No TRAIN or VALIDATION regression on either candidate seat;
- No more than -3 subgroup VALIDATION regression in mirror, cross-role and either opponent checkpoint cohort;
- No regression whatsoever in hardest level-10 VALIDATION subgroup.

No promotions within phases. HOLDOUT remains sealed for strategy selection and is only for independent diagnostics. All weights predeclared.

## Seat-role diagnostics and tactical metrics
Per strategy and split, aggregate outcomes for each seat × candidate archetype (Predator, Guardian, Soul, Fusion, Allrounder, Hybrid), and each eight hard-L10 role pairing. The report also stores exact numbers of legal cloned enemy-response checks, successful responses, capped outcome-risk scores, chosen actual actions and fusion-related scoring counts. This allows locating seat-two regressions without using those subgroup results to retroactively select the current holdout winner.

## Tactical Q preservation
Historical TRAIN-only archive transfer includes **24** verified successful GitHub runs (v1511–v1534), with the last accepted v14.9.34 Q checkpoint.
To reduce non-generalizable updates, new Q model acceptance requires **both** independent TRAINING validation utility >= prior+0.5 and TRAINING confirmation utility >= prior+1.0. The Q HOLDOUT remains diagnostic only and cannot approve a model.

## Research constraints
Arena LP decay stays symmetrically disabled in the research simulator, unlike full play. The counterattack follow-up is NOT full-turn adversarial search; future work can consider legal opponent abilities, switching and summons within bounded computation. All changes are restricted to research code, docs and GitHub Workflow on branch `development`; no production/main AI changes.

## Implementation
- `tests/ai-v1535-response-seat-selfplay.cjs`
- `tests/ai-v1535-response-seat-aggregate.cjs`
- `tests/ai-v1535-history.cjs`
- `tests/ai-v1535-Q.cjs`
- `.github/workflows/ai-v14935-response-seat.yml`
