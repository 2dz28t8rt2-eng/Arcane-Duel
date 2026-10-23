# Arcane Duel KI v14.9.27 – Self-Play Generalization, prior Q opponents and validation

## Why the methodology changed
The previous completed v14.9.26 run (#39942452732) trained 3,200 genuine
two-sided strategic duels. Its stage-selected strategy scored +36 TRAIN wins
against the research baseline but **zero net extra wins on the independent
holdout**, revealing poor transfer/generalization.

The new experiment therefore separates training, selection validation,
and untouched holdout into three equal cohorts, uses unfamiliar deck and
game seeds, and tests against both the current strategic TEST AI and
older frozen historical Q/strategy checkpoints.

## Real two-sided test AI
Both players use the same underlying full strategic AI planner for
summoning, fusion selection, combat, Guardian, Soul and lookahead.
No simple enemy-only heuristic is substituted. The opponent's research
Q table and optional historical 3-parameter weights can be frozen to
previous verified checkpoints; this is **not** a full historical engine
snapshot. Per-seat planner calls and strategic decisions are reported.

## Policies being compared
Five policies, each given exactly the same matchup/seat/starter/seeds:

1. `pool-reference` – standard TEST AI with existing current Q.
2. `role-memory` – modest role features, initially seeded from the last
   TRAIN-selected policy within this *new* run.
3. `guardian-soul-board` – increased summoning synergy for Guardians
   protecting Souls and Souls cooperating with Guardians.
4. `fusion-threat` – heavier material-spend penalty and higher penalty
   for unprotected offensive exposure.
5. `counter-risk` – stronger bounded one-action retaliation/risk
   penalty before selecting an attack.

These are research-only **heuristic scoring and visible-board
counterfactual** experiments; the game damage/skills are not changed.
They do not constitute multi-turn offline RL or a new production model.

## Opponent pool
For each phase, even-indexed scenarios use the current validated Q
checkpoint, while odd-indexed scenarios restore an older v14.9.25 Q table
and a frozen train-selected v14.9.26 strategic weights profile.
The *same* opponent profile is used for the reference and every candidate
in each paired matchup; no hidden opponent privileges or RNG advantages.

## Five test phases
- Level 8: identical-deck self-play
- Level 9: identical-deck self-play
- Level 10: identical-deck self-play
- Level 8: cross-role self-play
- Level 10: cross-role self-play

Within a phase: 8 role matchups × 6 scenarios × 2 starters ×
2 player seats × 5 arms = **960 genuine duels**. Across five phases,
**4,800 total games**.

## Three-way data isolation
- TRAIN: scenarios 0–1 = **1,600 matches** across five phases
- VALIDATION: scenarios 2–3 = **1,600 matches**
- HOLDOUT: scenarios 4–5 = **1,600 matches**

A candidate advances within a stage ONLY if:
- at least +4 wins over reference in the 64 matched TRAIN duels,
- at least +2 wins in the 64 matched VALIDATION duels,
- neither split has fewer wins on either player seat,
- reference and candidates use identical paired initial conditions.

Among eligible candidates, VALIDATION wins then TRAIN wins and
deterministic name ordering decide selection. HOLDOUT is never used to
select, fit or promote a candidate. Every stage also includes an
unmodified reference to avoid arbitrary score drift.

Historical tactical Predator Q continues separately, starting from
the latest verified v14.9.26 Q checkpoint and 16 successful
TRAIN-only historical run archives. No silent Q reset is allowed.

## Reporting and strict controls
Stage JSON files and final report record paired win flips, start-player
and seat comparisons, results by deck role, newer-vs-older-Q opponent,
timeouts, legality, and symmetric cases.
Any illegal stance switch or invalid rule action fails the entire
experiment. Arena LP decay remains symmetrically off in this research.
Only test scripts, CI workflow and documents are added on
`development`; production game code and `main` remain unchanged.

## Source files
- `tests/ai-v1527-roles-generalization.cjs`
- `tests/ai-v1527-generalization-aggregate.cjs`
- `tests/ai-v1527-history.cjs`
- `tests/ai-v1527-Q.cjs`
- `.github/workflows/ai-v14927-role-generalization.yml`

## Runtime reliability correction (2026-10-23)
Initial run #39947326174 failed because new deck-generator seeds exceeded
its legitimate 0..9999 integer range. The seed formula was then bounded.
Run #39947677115 passed game-rule, Q checkpoint and history checks but
failed in phase 0 with a Node.js V8 heap OOM (2900 MB; exit 134).
No game-winning conclusions may be drawn from either failed run.

The corrected runner accepts `<stage> <pair>` to simulate exactly 120 duels
in one independent Node.js process (8 role pairs × 120 = 960 games per phase).
`<stage> finalize` separately verifies and merges all eight shard files
in deterministic role-pair order, producing the exact same stage schema
and TRAIN/VALIDATION/HOLDOUT splits. Node processes are isolated; no
cross-shard game-state or RNG mixing occurs. Validation and holdout
action tapes are omitted from shard artifacts, so only TRAIN traces
are available for downstream learning.

The replacement workflow runs five phases as 40 independent bounded
Node simulation processes plus five strict aggregate passes.
The implementation is in `tests/ai-v1527-roles-generalization.cjs` and
`.github/workflows/ai-v14927-role-generalization.yml`.
GitHub run #39963832441 is the corrected restart; as of this note,
the first phase was still running. Do not describe the experiment as
fully complete until the workflow reports success.
