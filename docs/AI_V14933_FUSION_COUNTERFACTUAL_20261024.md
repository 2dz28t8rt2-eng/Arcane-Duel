# Arcane Duel AI v14.9.33 – Tactical Fusion Recovery via Real Cloned Counterattack Simulation

## Last confirmed evidence
Successful v14.9.32 GitHub run #40076895921 completed 4,800 full two-sided strategic-AI matches, yet all tested Material Economy variants LOST on unseen holdout versus Guardian/Soul champion (148–150 vs 155/320). Their training advantages did not satisfy validation or seat-parity checks. The prior fusion-risk proxy was evaluated ~98,842 times without changing even one observed outcome; economy also produced substantially fewer fusion actions (1,665 vs 2,773 for champion).

The appropriate response is NOT to promote economy or simply increase defensive weights. Investigate whether fusions are being overpenalized and use already-existing, legally executed simulator counterattacks in selecting between alternatives.

## Predefined strategy comparison
Exactly five frozen arms (960 paired matches each):

1. `guardian-champion`: unchanged globally selected v14.9.28 Guardian/Soul champion (frozen).
2. `role-economy`: unchanged material-economy research profile; diagnostic reference only.
3. `fusion-opportunity`: Material Economy with reduced fusion material aversion and a public-data upgrade bonus favoring genuinely stronger fusion outcomes.
4. `counterfactual-fusion`: Material Economy with a contribution from utility changes after EXISTING cloned, legally executed opponent counterattacks in the summon-forecast scorer.
5. `fusion-recovery`: combination of 3 and 4.

The encounter simulator already clones a proposed summon, executes it, performs up to two legal opponent attacks when available, and measures `before` and `future` utility. The counterfactual policy reuses **those** values, rather than another fictitious power-gap proxy. It is NOT a full turn tree or opponent hidden-hand search. The same actual combat rules, not approximate mock combat, are used.

The stronger fusion choice rule uses visible catalog stats and the actual candidate fusion materials. No unknown opponent hand, deck order, or hidden cards are used by these additional weights.

## Benchmarks and strict failure gate
Five phases: L8 mirror, L9 mirror, L10 cross-role, L8 cross-role, hard L10 cross-role.
Each phase: 8 deck role matchups × 6 scenarios × 2 starting choices × 2 candidate seats × 5 fixed strategies = 960 games. Total 4,800 games split TRAIN/VALIDATION/HOLDOUT into three independent disjoint 1,600-match cohorts (320 matches per strategy per cohort).

Both sides use the full strategic test AI. Each strategy plays the same pairwise conditions, with new seed values different from all earlier runs. Opposing roles alternate between validated Guardian/Soul champion and the previously defined balanced research strategy. No per-phase reselection or incorporation of HOLDOUT.

Global promotion uses TRAIN+VALIDATION ONLY and must pass ALL:
- at least +8 TRAIN and +8 VALIDATION wins vs the incumbent;
- no seat-specific TRAIN or VALIDATION win regression;
- no worse than -3 validation wins in each mirror/cross-role/opponent subgroup;
- no validation loss in the hardest L10 cross-role phase.
Otherwise keep the v14.9.28 incumbent.

HOLDOUT is diagnostic only after selecting. Retrospective study of earlier holdout experiments motivated these predefined arms, but the NEW v14.9.33 holdout remains sealed.

## Diagnostics
Each match records how many fusion opportunities were scored, how many fusion variants were scored by the actual counterfactual simulator, forecast changes, fusion forecast changes, game length, seat, action types, roles, and outcome. Training-only action tapes are kept separate from validation/holdout. The aggregated report exposes these counts and the hard L10 stage separately.

## Historic learning, reproducibility and limitations
Transfer accepted tactical Q checkpoint from v14.9.32 and TRAIN-only examples from 22 verified historical GitHub runs (v1511–v1532). Each new Q proposal is subject to internal independent validation. The role policy weights are predefined rules, NOT continuously self-updating AI parameters. 40 separate Node processes manage peak memory and protect the batch against monolithic Node OOM.

Arena LP decay remains symmetrically OFF for these research benchmarks. Before changing production opponents, full-live-rule testing will still be required.

Changes are restricted to research scripts, workflow and documentation under `development`. The product AI and `main` remain unchanged.

## Paths
- `tests/ai-v1533-fusion-counterfactual-selfplay.cjs`
- `tests/ai-v1533-fusion-counterfactual-aggregate.cjs`
- `tests/ai-v1533-history.cjs`
- `tests/ai-v1533-Q.cjs`
- `.github/workflows/ai-v14933-fusion-counterfactual.yml`
