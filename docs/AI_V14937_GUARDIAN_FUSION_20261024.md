# Arcane Duel AI v14.9.37 — Fusion versus Guardian L10 counterstrategy training

## Previous confirmed evidence
Successful v14.9.36 run #40115011119 completed 4,800 duels. Its research `counterfactual-fusion` policy won 519/960 vs 446/960 for the v14.9.28 Guardian/Soul incumbent and passed training/validation thresholds and paired seat parity, but missed the hard L10 validation gate by one game (28 vs 29/64). Exploratory hardest L10 subgroup **Fusion vs Guardian** was especially weak (1/8 vs incumbent 4/8). This is a very small sample, and must not be treated as a proven general weakness.

Allrounder-protection added no measured win benefit. The active validated champion remains unchanged.

## v14.9.37 hypotheses
Instead of a generic increase to fusion rate, test limited score changes conditional on a *visible* guardian on the enemy battlefield. Exactly five fixed predeclared strategy arms:

1. `guardian-champion` – identical existing selected incumbent.
2. `counterfactual-fusion` – identical v14.9.33 +0.40 prior fusion cloned-response research candidate.
3. `guardian-break-fusion` – previous counterfactual policy + score favoring a candidate fusion when its public catalog ATK can overcome the strongest **visible enemy Guardian card in DEF**; penalize otherwise with a small bounded deduction. This is a heuristic, not a full forecast of a successful attack.
4. `guardian-soul-support` – previous counterfactual policy + bounded Soul-role normal summon incentive proportional to own Soul DEF and public opposing Guardian DEF.
5. `guardian-break-combined` – predeclared combination of #3 and #4.

These interventions neither cheat on enemy hands nor give an unconditional player seat 2 buff. Side-2 weaknesses are analyzed by seat and absolute starter, but role policies remain seat-independent.

## Paired benchmark and protection
Same five stages: L8 mirror, L9 mirror, L10 cross-role, L8 cross-role, hardest L10 cross-role. Per stage 8 archetype pairings × 6 scenarios × 2 absolute starters × 2 candidate seats × 5 arms = 960. Total 4,800 duels divided into independent 1,600 TRAIN, 1,600 VALIDATION, 1,600 HOLDOUT (320 per arm and split). New deck and RNG seeds. Both sides use experimental full strategic AI. Arena LP decay disabled symmetrically, unlike live production.

All policies fixed across phases, no per-phase promotions. Existing TRAIN+VALIDATION-only global gate unchanged:
- +8 wins TRAIN and +8 VALIDATION versus retained v14.9.28 Guardian/Soul,
- each candidate seat not below its incumbent on TRAIN and VALIDATION,
- mirror, cross-role, champion-Q and older balanced-Q subgroups no worse than -3 VALIDATION wins,
- hardest L10 cross-role VALIDATION non-regression (0 win loss allowed).

HOLDOUT remains strictly nonselection diagnostic, even if a challenger looks excellent on it. If no arm qualifies, incumbent retained; production game and `main` untouched.

## New introspection
- Score-counter metrics `guardianBreakEvaluations`, `guardianBreakViable`, `guardianSoulEvaluations`, `guardianFacingActions` for visible Guardian-dependent conditions.
- Separate `fusionAgainstGuardian` stats by train/validation/holdout, stage, candidate seat, absolute starter.
- `fusionGuardianActionMix` reports actual action types in hardest L10 Fusion-vs-Guardian subgroup.
- Previous seat/starter/opponent-role and all eight hard L10 pairing diagnostics retained.
- Explicitly treat 8-match subset results as exploratory and do not reselect based on subgroup HOLDOUT.

## Historic Q transfer
26 successful verified TRAIN-only archives from runs v1511–v1536 and newest accepted tactic Q from v1536; stronger TRAIN-only internal confirmation gate continues. Never import old or current HOLDOUT labels into Q learning.

This is a pragmatic hand-defined strategy ablation plus protected Q transfer; not unrestricted self-improving reinforcement learning or full adversarial search. Simulated opponent reply remains a small number of legally applied attacks on cloned state, not enemy hands / full opponent turn.

## Implementation
- `tests/ai-v1537-guardian-fusion-selfplay.cjs`
- `tests/ai-v1537-guardian-fusion-aggregate.cjs`
- `tests/ai-v1537-history.cjs`
- `tests/ai-v1537-Q.cjs`
- `.github/workflows/ai-v14937-guardian-fusion.yml`
