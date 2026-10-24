# Arcane Duel AI Research v14.9.41 — Legal Two-Ply Fusion Sequencing

## Previous findings
Verified v14.9.40 main Actions run #40128611417 completed 6,720 research duels. Its global research promotion again failed (TRAIN insufficient; separate seat balance). Independent exact matched L10 A/B stage showed the promoted v14.9.38 material policy decline from 96/192 wins without symmetrical LP decay to 91/192 with decay, including seat-2 weakness. All four research Fusion variants behaved nearly identically in the hard-L10 A/B diagnostic, suggesting that generic additional small scoring bonuses are unlikely to solve the underlying decision problem.

## Hypothesis
A limited legal sequence of action -> own legal attacks -> visible enemy legal replies can distinguish good fusion choices from superficially strong fusions more effectively than an isolated ATK/DEF or materials bonus. A further explicit LP-pressure term only when decay is ON can test whether urgency changes the decisions under endgame conditions. This is bounded search, not full game-tree minimax, and no opponent hidden cards are read.

## Fixed policy arms (5 x 960 main matches)
1. `guardian-champion`: frozen globally selected v14.9.28 Guardian/Soul opponent.
2. `counterfactual-fusion`: fixed previously best research strategy with historical counterfactual fusion score .40.
3. `fusion-postreply-material`: selected v14.9.38 research material champion (+.70 risk penalty), unchanged.
4. `fusion-sequence-2ply`: same as #3 + new legal fused-action forecast of up to TWO own attacks followed by TWO enemy attacks (weight .22).
5. `fusion-sequence-decay`: same as #4 + decay-specific urgency evaluation weighted .55, **enabled ONLY in the full-decay stage 6**.

### Simulator implementation
Augments the existing verified `simulate(entry)` in `tests/ai-v1519-crossdeck-shards.cjs`:
- Clone current real game state and apply candidate `fusion` action via `applyAiAction`, including real engine pending fusion placement;
- Select up to two available own attacks through `attackPlan`, and execute each using `attack` (legal attack/turn flags maintained);
- If game unfinished, hand initiative to enemy, reset only enemy attack flags at the new turn, select up to two visible enemy attacks through `attackPlan`, execute via `attack`;
- Compare utility against current pre-existing one-sided enemy two-attack forecast; apply **bounded** counterfactual difference times 0.22. No hidden hand or illegal extra own attacks are granted. The enemy counterfactual isn't a full turn and cannot include every ability.
- If decay enabled (stage 6 only), include limited LP-pressure tempo adjustment calculated from actually simulated life changes, not a guessed buff to seat 2.

New metrics per duel: `sequenceFusionChecks`, `sequenceLegalOwnAttacks`, `sequenceLegalEnemyReplies`, `sequenceUtilityGain`, `decayUrgencyChecks`. Validators confirm new logic actually executes in hard L10 and when decay enabled.

## Pre-registered experiment
The primary benchmark is identical to previous: five independent stages (L8 mirror; L9 mirror; L10 crossrole; L8 crossrole; hardest L10 crossrole), 960 games per stage = 4800. Split into TRAIN 1600, VALIDATION 1600, HOLDOUT 1600 with 320 each per arm and split. Fresh deck and RNG seeds, both seats full strategic planner, same opponent policies and legal game mechanics. Stage 0-4 LP decay symmetrically off for strict compatibility.

Two distinct diagnostic phases also preserved:
- Stage 5: 960 matched hardest L10 games, arena LP decay disabled.
- Stage 6: the **same 960 pairings** (identical deck/hand, seed, starter, seat and policy), arena LP decay enabled.
The aggregator checks exact match on every paired game; produces loss→win / win→loss flips by role, starter, player seat. Both phases excluded from TRAIN/VALIDATION policy selection, and exclude their HOLDOUT from Q updates.

In total 6720 simulated matches.

### Strict selection rules unchanged
Every new variant must exceed baseline by >=8 TRAIN and >=8 VALIDATION wins, cannot regress on any player seat in those splits, no predeclared subgroup VALIDATION regression worse than -3, and NO hard L10 VALIDATION regression. No uses of current HOLDOUT or diagnostic A/B for selecting champion. Existing v14.9.38 promotion remains a historical research champion until separately confirmed. Nothing is deployed to gameplay code or `main`.

## Learning and verification
Resumes latest accepted tactical Q checkpoint from v14.9.40, and replays 30 verified historical TRAIN-only archives through run #40128611417. Independent new-seed Q validation and separate confirmation protect from negative or overfitted updates. No HOLDOUT examples in the training examples. Counterfactual legal moves and exact seat-by-starter audit retained.

## Files
- `tests/ai-v1541-sequence-decay-selfplay.cjs`
- `tests/ai-v1541-sequence-decay-aggregate.cjs`
- `tests/ai-v1541-history.cjs`
- `tests/ai-v1541-Q.cjs`
- `.github/workflows/ai-v14941-sequence-decay.yml`

## GitHub run
Correct run: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40137913164
