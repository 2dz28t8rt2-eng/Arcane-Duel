# Arcane Duel – KI v14.9.29: Champion-vs-challenger self-play

## Why the new baseline is stronger
Verified v14.9.28 completed 4,800 role-aware research matches and selected
`guardian-soul-board` (Guardian 1.15, Soul 1.30, material 0.85, risk 0.95)
using TRAIN plus VALIDATION, without using its HOLDOUT to select.
On unseen holdout the selected arm won 176/320, versus 149/320 for the old
`pool-reference`. The goal is now to beat the **selected champion**, not
repeatedly beat that weaker original reference.

## Training arms (five, fixed across every phase)
1. `guardian-champion`: unchanged, validated v14.9.28 policy (incumbent)
2. `guardian-material`: stronger Guardian/Soul synergy and material reserve
3. `guardian-counter`: stronger guard and counterattack risk aversion
4. `guardian-adaptive`: dynamic board- and LP-aware adaptation
5. `guardian-soul-balanced`: combination of stronger Guardian/Soul
   values, material conservation and context-dependent risk

All five are research-only role/action-scoring policies inside the
existing strategic test AI. These are not independent neural agents
and do not modify live card rules. The new challenger policies do
not consume v14.9.28 HOLDOUT matches to fit their weights.

## Opponent pool
- Even scenarios: **same fully strategic test AI running the selected
  v14.9.28 Guardian/Soul champion policy** and latest verified tactical Q.
- Odd scenarios: previous verified tactical Q and v14.9.26
  historical research weights; not a fully frozen engine binary.
- Both seats always use the strategic TEST-AI, not one test AI and one
  weak default AI. Seed and card pairing are held constant between arms.
- Symmetric incumbent-vs-incumbent matches offer additional seat-bias
  measurement.

## Independent testing
Five phase tiers: Level-8, Level-9 and Level-10 identical-deck mirrors;
Level-8 and Level-10 cross-role deck benchmarks.

Each phase: 8 role matchups × 6 scenarios × 2 starters × 2 candidate
seats × 5 fixed strategies = 960 paired legal matches.

Entire run: **4,800 duels**, in three equal disjoint splits:
- TRAIN: 1,600
- VALIDATION: 1,600
- HOLDOUT: 1,600 (sealed until global selection ends)

The *global* gate compares a challenger to the reigning champion
across all five phases (320 TRAIN and 320 VALIDATION per policy):
- At least 8 additional TRAIN wins.
- At least 8 additional VALIDATION wins.
- No TRAIN or VALIDATION regression on either player seat.
- No more than 3 fewer VALIDATION wins within any of these groups:
  mirror decks, cross-role decks, current champion opponent, legacy-Q
  opponent.
- HOLDOUT remains excluded from selection, promotion, and parameters.
- If no challenger qualifies, the champion remains the selected policy.
- No stage-local selection or inherited weight changes.

## Historical Q and execution safety
Restore protected tactical Q values from completed v14.9.28
and 18 successful historical run archives containing TRAIN-only
examples. Tactical Q proposals still require independent validation
before acceptance.

Five phases are split into **40 isolated Node.js match subprocesses**,
120 games each, then strictly merged and checked. Illegal gameplay
or missing strategic decisions on either seat must fail the workflow.

The symmetric arena LP-decay feature remains switched off in research,
as in prior benchmark runs. Do not interpret these results as live-game
performance without separate full-rule validation.

## Files
- `tests/ai-v1529-champion-transfer-selfplay.cjs`
- `tests/ai-v1529-champion-transfer-aggregate.cjs`
- `tests/ai-v1529-history.cjs`
- `tests/ai-v1529-Q.cjs`
- `.github/workflows/ai-v14929-champion-transfer.yml`

Changes are confined to additional research scripts, CI and
documentation on the `development` branch; `main` and live-game
AI logic are unchanged.
