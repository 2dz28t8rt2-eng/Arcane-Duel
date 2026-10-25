# Arcane Duel — AI research v14.9.42: Visible worst legal reply search

## Motivation
The successful v14.9.41 research run (#40137913164) promoted `fusion-sequence-2ply` under the strict global gated research protocol. It gained +16 TRAIN, +16 VALIDATION wins versus the original champion, passed per-seat and hardest-Level-10 VALIDATION protection but had only +7 overall HOLDOUT wins and hard-Level-10 HOLDOUT decline. The optional LP-decay tempo bonus did not help. We therefore should independently replicate 2-ply and test whether *searching among legal visible defender responses* materially improves the hard matchups rather than add another raw attack/defense weight.

## Frozen baselines and two novel arms (5 × 960 matches, primary)
1. `guardian-champion`: identical v14.9.28 research Guardian/Soul reference.
2. `fusion-postreply-material`: prior v14.9.38 research champion, unchanged.
3. `fusion-sequence-2ply`: prior **v14.9.41 approved research champion**, material policy + `sequenceFusion:0.22`, otherwise unchanged.
4. `fusion-sequence-worst`: arm 3 plus limited legal *worst visible opponent first-attack* search (`sequenceWorst:true`).
5. `fusion-sequence-guardian-worst`: arm 3 plus identical reply search only when a visible opposing Guardian or Soul monster is on the field (`sequenceGuardianWorst:true`).

### What the tactical simulator actually does
The verified research sequence planner already applies a candidate Fusion to a clone, executes up to TWO own legal attacks followed by up to TWO opponent attacks through actual engine combat functions. Under arms 4 or 5, after own attacks and at the point of opponent response, enumerate at most **12 candidate legal opposing attacker/visible defender target choices**. Clone the current game state for every candidate, use the REAL `attack` engine, and take the reply with the **worst board utility for the candidate**. Optionally apply one additional legal planned opponent attack on that clone; compare its utility with the original planner's outcome, and use the more adverse result to evaluate the candidate Fusion.

The helper uses `canAttack`, real `attack`, legal visible field targets, and does NOT read hidden enemy hand contents, alter candidate seat, grant illegal attacks or modify production combat. This is deliberately bounded partial adversarial lookahead, NOT comprehensive full-turn minimax or a learned neural model. Enemy skill activations or nonattack card plays are outside this search.

New counters: `worstReplySearches`, `worstReplyLegalTrials`, `worstReplyMoreDangerous`, `worstReplyGuardianSearches`. Decision changes and matched win flips are more important than number of performed searches. Evaluate high-level Fusion vs Guardian, Predator vs Soul and seat-2 independent of total win rate.

## Experiment / protection
- Same pre-registered 5-stage main benchmark families: L8 mirror, L9 mirror, L10 crossrole, L8 crossrole, hard L10 crossrole. 8 matchup pairs × 6 scenarios × 2 starting seats × 2 candidate seats × 5 strategies × 5 stages = **4,800** main duels.
- Independent fresh deck/RNG seeds per stage; exact mirrored seed + starter + seat pairs across all 5 strategies.
- `TRAIN` 1600, `VALIDATION` 1600, `HOLDOUT` 1600 total; each arm 320/320/320. HOLDOUT never used for selecting the global policy.
- Keep seat parity gates (each seat no TRAIN or VALIDATION regression); require at least +8 TRAIN and +8 VALIDATION wins over original Guardian/Soul, subgroup VALIDATION tolerance -3 and zero hard-Level-10 VALIDATION regression. Both seats use full AI planner; no per-seat buffs.
- Separate *exactly matched* hardest-Level-10 A/B stages: 960 duels with decay off + **same 960** duels with symmetric LP decay ON. Paired key and deck/game seeds automatically checked; these stages are not used for promoting policies or Q training.
- **Total = 6,720** simulated matches. Same immutable v14.9.41 incumbent strategy retained regardless of a one-run negative replication; no change to `main` or productive AI.

## Training replay
Continue verified tactical Q learning from successful run #40137913164 and **31 verified historical TRAIN-only archives** through v14.9.41. Fresh separate Q training/validation/confirmation seeds and independent Q-HOLDOUT; reject negative Q updates. No archival HOLDOUT samples, paired diagnostic stages or live game results are fed into learning.

## Implementation
- `tests/ai-v1542-reply-search-selfplay.cjs`
- `tests/ai-v1542-reply-search-aggregate.cjs`
- `tests/ai-v1542-history.cjs`
- `tests/ai-v1542-Q.cjs`
- `.github/workflows/ai-v14942-reply-search.yml`

GitHub workflow: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40174047771

## Important interpretation
The new branches are experimental and may be overly defensive or simply change CPU cost without outcome benefit. Only paired win flips on independent TRAIN/VALIDATION plus sealed HOLDOUT, hardest-L10 and both candidate seats justify a claim of improvement. Validation successes do not equal production deployment.
