# Arcane Duel AI v14.9.34 – Selective Legal Counterattacks and Cautious Fusion Value

## Grounded baseline
Successful v14.9.33 run #40080727988 completed all 4,800 legal selfplay matches. The predeclared counterfactual-fusion challenger exceeded the **current validated** Guardian/Soul champion by +14 TRAIN wins and +12 VALIDATION wins and passed the two-seat criterion. It failed the predeclared hardest-L10-cross-role validation gate by 1 win (34 vs 35 out of 64), so **no strategy was promoted**. The previously attempted broad fusion opportunity bonus nearly doubled fusion actions but reduced performance; do not repeat that policy.

The v14.9.33 candidate remains a **predefined research candidate**, not the current champion. The incumbent remains the v14.9.28 selected policy.

## Four challengers plus unchanged incumbent
The five globally fixed strategies are:

1. `guardian-champion` – exact unchanged v14.9.28 champion policy.
2. `role-economy` – fixed historical economy heuristic, to separate the value of adding more tactics.
3. `counterfactual-fusion` – exact v14.9.33 near-pass policy (0.40 additional weighting of utility before and after legal cloned counterattacks).
4. `counterfactual-selective` – same rule, but scale the additional weight to 0.72× when a level 9/10 opponent monster is visibly present on the simulator board and 1.08× otherwise.
5. `counterfactual-soft-fusion` – same selective response with only a 0.22× capped bonus of 80 points **when** an available fusion adds over 100 value, own occupied field has at most 3 monsters and at least one enemy monster is visible. Unlike the previous overaggressive policy, the material conservation multiplier is left unchanged.

This is an empirical predeclared test of whether being less broadly defensive against strong visible monsters plus a **small contextual** fusion incentive can recover hard-L10 wins while retaining observed seat balance. It might fail; no outcome is assumed.

The tactical forecast uses legally applied real attacks on cloned game states. It is not a complete enemy turn, strategic perfect-information game-tree search, neural agent or unrestricted RL.

## Benchmark and guardrails
Same 5 curriculum stages as v14.9.33: L8/L9 mirror, L10 cross-role, L8 cross-role, hard L10 cross-role. Eight archetype matchups, six scenarios, two starter choices and two candidate seats in every stage; **960 matches per stage, 4,800 total**, 960 per strategy.

Fixed mutually disjoint cohorts: 1,600 TRAIN matches, 1,600 VALIDATION and 1,600 **new untouched HOLDOUT** matches, or 320 per strategy per cohort. Scenarios and decks are matched across candidate and incumbent, with fresh v14.9.34 deck and RNG seeds. Opponent strategies alternate between unchanged champion and a prior predefined balanced checkpoint, both under full strategic AI. Both seats must use the full planner, with equal starting LP and strictly legal actions.

Global promotion requires ALL the predeclared conditions, computed only on TRAIN and VALIDATION:
- +8 TRAIN wins and +8 VALIDATION wins versus incumbent,
- no deficit for either candidate seat on TRAIN or VALIDATION,
- no worse than -3 validation wins across mirror, cross-role, current-champion opponent or older balanced opponent subgroups,
- NO negative validation win difference in hardest level-10 cross-role stage.

Selection is global after all phases, with **no** stage-local promotion and **no** use of current HOLDOUT for promotion. Previous holdouts influenced the new research hypotheses, so only new cohorts can provide independent replication.

## Diagnostics and historic learning
Per duel, record fusion actions and chosen action types, proposed mild fusion bonus evaluations, legal counterattack utility checks, number of selective response checks, the original summon forecast interventions, starter, seat, opponent policy, scenario, and match outcome. The aggregation reports distributions and hard L10 separately.

Incorporate 23 verified historical runs (v1511–v1533) as TRAIN-only examples, including latest accepted tactical Q checkpoint from v14.9.33; reject candidate Q updates failing internal validation/confirmation. Exclude historical holdouts and contaminated examples.

Use 40 isolated processes to avoid Node.js heap pressure. The testing arena runs with symmetrically disabled LP decay, meaning a future full-live-rule verification is still mandatory prior to deploying a candidate.

Branch `development` research only, live game AI and `main` untouched.

## Source paths
- `tests/ai-v1534-contextual-counterfactual-selfplay.cjs`
- `tests/ai-v1534-contextual-counterfactual-aggregate.cjs`
- `tests/ai-v1534-history.cjs`
- `tests/ai-v1534-Q.cjs`
- `.github/workflows/ai-v14934-contextual-counterfactual.yml`
