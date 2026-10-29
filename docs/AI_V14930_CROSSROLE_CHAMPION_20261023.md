# Arcane Duel – v14.9.30: Reproducibility and expanded cross-role AI learning

## Context
Successful v14.9.29 #39983397260 finished 4,800 actual two-sided strategic
AI matches. The globally selected benchmark stayed v14.9.28
`guardian-soul-board` with policy
`{guardian:1.15,soul:1.30,material:0.85,risk:0.95}`.
The v14.9.29 **predefined** `guardian-soul-balanced` candidate
won 184/320 unseen HOLDOUT games compared to champion 158/320, yet
failed the independently prescribed TRAIN+VALIDATION gate (validation
only +1). Its favorable HOLDOUT is exploratory evidence only, NOT
a formally promoted checkpoint. Previous HOLDOUT results explicitly
motivated the new study and cannot count as independent validation
of its design. New seeds/cohorts are mandatory.

## Goals and fixed candidates
The incumbent is unchanged. Four candidate policies are fixed
before any v14.9.30 scores are observed:

1. `guardian-champion` – verified v14.9.28 incumbent
2. `balanced-retest` – exact, previously defined v14.9.29
   `guardian-soul-balanced` candidate, retested rather than promoted
3. `enemy-role-aware` – balanced scoring plus observable opponent
   Predator / Soul / Guardian composition, changing summon, fusion
   reserve and counterattack-risk evaluations
4. `role-defensive` – visible opponent role awareness with stronger
   guarding and combat-risk preservation
5. `role-economy` – role awareness emphasizing Soul cooperation and
   retaining useful Fusion material

Visible public boards and current LP only are used to adjust scores.
No deck/hand lookahead and no change to live monster abilities.

## More varied opponent pool and decks
For even scenarios the opposing full strategic test-AI plays the
strong v14.9.28 incumbent; for odd scenarios it plays the predefined
v14.9.29 balanced research policy, with older tactical Q table.
Both candidate and baseline face EXACTLY the same opponent choices
on the same matchup and starting RNG seeds. Both seats run the
strategic AI planner, not a basic opponent algorithm.

Five benchmark phases:
- Mirror (same decks): Lv8, Lv9, Lv10
- Cross-role (different deck archetypes): Lv8 and Lv10

For cross-role phases, new matchups specifically include enemy
Predator, Fusion, Allrounder and Hybrid deck archetypes in addition
to Guardian and Soul. This addresses a blind spot in older studies
whose second deck often used only Guardian or Soul.

## Quantities and protection
5 phases × 8 role matchups × 6 independent scenario groups ×
2 starter assignments × 2 candidate seats × 5 fixed policies
= **4,800 games**, of which:
- 1,600 TRAIN,
- 1,600 distinct VALIDATION,
- 1,600 completely independent HOLDOUT.

Global promotion only after all five phases, on TRAIN+VALIDATION,
**not on HOLDOUT**:
- At least +8 TRAIN wins and +8 VALIDATION wins over incumbent across
  the five phases for a given candidate (320 per split and strategy).
- No seat regression in TRAIN or VALIDATION.
- No worse than −3 VALIDATION wins in the mirror, cross-role,
  champion-opponent or balanced-opponent subgroups.
- If no strategy meets these requirements, retain the incumbent.

HOLDOUT is reported only after the selection. Note the former
v14.9.29 holdout inspired the candidate set, whereas the
**v14.9.30 holdout** remains untouched.

## Data integrity, memory efficiency, and reuse
Restore tactical Predator Q from successful v14.9.29 and all
19 validated historic TRAIN-only sources. Other Q updates remain
guarded by independent internal confirmation.
Use 40 isolated Node.js processes of 120 matches, with eight
deterministically merged shards per phase. All actions must be
legal and both seats must use the full planner. The arena LP decay
feature remains intentionally disabled on BOTH seats in
research-only experiments, as before.

No live-game AI source files, the production game rules,
or the `main` branch are modified.

## New source paths
- `tests/ai-v1530-crossrole-champion-selfplay.cjs`
- `tests/ai-v1530-crossrole-champion-aggregate.cjs`
- `tests/ai-v1530-history.cjs`
- `tests/ai-v1530-Q.cjs`
- `.github/workflows/ai-v14930-crossrole-champion.yml`
