# Arcane Duel v14.9.40 — Randomized paired LP-decay A/B and seat-two failure diagnosis

## Motivation / previous verified facts
v14.9.38 GitHub #40123309581 formally promoted research strategy `fusion-postreply-material` with +12 TRAIN and +26 VALIDATION wins over frozen v14.9.28 Guardian/Soul, all prior global gates satisfied. v14.9.39 GitHub #40125493030 finished 5,760 matches: 4,800 new-seed primary games and 960 hard-L10 games with full LP decay. In the new-seed primary, research champion still won more matches (480 vs 437/960) but *failed* strict seat-2 and hard-L10 gates, while decay-only matches showed 101 vs 84 wins. **These were different seed sets**, so not a causal decay-on/off comparison.

Goal is explicit: isolate the effect of symmetric arena LP decay while observing seat-specific L10 loss modes. Do **not** invent or optimize additional policy coefficients against the most recent HOLDOUT.

## Frozen policies / primary gate
All five strategies and scoring coefficients are exactly those of v14.9.38/v14.9.39:
1. `guardian-champion`: v14.9.28 Guardian/Soul incumbent.
2. `counterfactual-fusion`: previously best fusion candidate.
3. `fusion-postreply-survival`: +0.50 capped forecast-survival heuristic.
4. `fusion-postreply-material`: *previously selected v14.9.38 research champion*, +0.70 capped post-reply material-usage heuristic.
5. `fusion-postreply-combined`: both research heuristics.

The first five full self-play phases retain the exact standard global five-stage qualification: Level 8 mirror, Level 9 mirror, Level 10 cross-role, Level 8 cross-role, hard Level 10 cross-role. Each has 8 predeclared archetype pairs × 6 scenarios × 2 absolute starters × 2 candidate seats × 5 policies = 960 matches; primary total 4,800. Each arm has 320 TRAIN + 320 VALIDATION + 320 sealed HOLDOUT games. All first-five-stage games have arena LP decay off for compatibility with historical benchmark. Global selection uses **ONLY TRAIN and VALIDATION** from those first five phases with unchanged gates: +8 TRAIN, +8 VALIDATION, no per-seat regression in either split, no subgroup regression worse than -3, no hard-L10 VALIDATION regression. HOLDOUT is reported only after selection. Prior v14.9.38 historical promotion is separately preserved even if another replication fails.

## EXACT matched L10-decay A/B
Two NEW dedicated phases, *both completely excluded from promotion, Q training and optimization*:

**Stage 5 (control)**: 960 hardest-L10 duels, symmetric LP decay disabled.
**Stage 6 (treatment)**: the precise 960 stage-5 duels with symmetric LP decay enabled.

For each pair of stage-5 and stage-6 matches, the runner uses identical:
- both deck-builder seeds, both 40-card deck sequences and corresponding first five cards;
- target role pair, attacker and opponent L10, fusion pools and fixed strategies;
- scenario, frozen opponent Q checkpoint and role policy;
- game random seed, candidate seat, absolute starting seat, and gameplay configuration except the decay switch.

The simulator's verified runtime uses `strategicTraining.disableArenaLPDecay = !scene.decayEnabled`, so no opponent gets a unilateral advantage. The matcher asserts seed, deck seeds, role pair, scenario, opponent checkpoint, starter and candidate seat equality for **each of all 960 A/B pairs**, and requires the switch off/on as intended.

There are 960 independent *scenario pairs* (the same duel run twice), 1,920 executed A/B duels. Therefore complete run = **4,800 + 960 + 960 = 6,720 duels**. A/B subsets are further divided into 320 TRAIN, 320 VALIDATION and 320 HOLDOUT **per split across five arms**; each arm is in 192 A/B duel pairs (64 per split). Even the A/B holdout is **diagnostic only**.

The A/B audit reports:
- exact outcome flips `loss→win`, `win→loss`, and net, rather than comparing unmatched raw win rates;
- by player seat, *absolute* starter, candidate role and hard-L10 opponent-pair ID;
- separate public-field losses, LP damage and turn count;
- decision/action tape for `fusion-postreply-material` in all A/B scenarios to enable seat-2 case-study review without opponent hidden-hand information.

Both seats execute the same fully strategic AI engine; seat ID itself never grants a policy buff. Existing research caveat persists: counterfactual post-fusion opponent search is limited to up to two real, legally applied attacks, NOT a complete AI opponent turn or hidden-information planning.

## Historical tactical Q
Restore **29 verified successful historical TRAIN-only** archives through v14.9.39 run #40125493030; Q warm start from newest checkpoint. Continue strict independent TRAIN-internal confirmation with a fresh tactical seed family. Do not train on archived holdouts or the new dedicated A/B stages.

## Interpretation
If the same paired duel flips solely because the decay toggle changes, the switch matters **for this exact engine state**. A difference in this research emulator does not automatically imply live deployment benefits, because the emulator has training-only setup and constrained forecast depth. Subgroup samples are small and exploratory; retain primary five-stage global gate. Nothing on `main` nor the production AI is modified.

## Source
- `tests/ai-v1540-paired-decay-selfplay.cjs`
- `tests/ai-v1540-paired-decay-aggregate.cjs`
- `tests/ai-v1540-history.cjs`
- `tests/ai-v1540-Q.cjs`
- `.github/workflows/ai-v14940-paired-decay.yml`

## GitHub Actions
Corrected run: #40128611417. Obsolete initial workflow run #40128578613 was started before fixing the diagnostic stage-6 matching enumeration and should not be used as authoritative evidence.
