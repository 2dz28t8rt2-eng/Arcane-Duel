# v15.76 – Seat parity and Predator against real large fusions

## Why this study exists

v15.75 correctly isolated Stomp's actual combat from speculative score estimates,
but had **zero candidate Predator attacks on an enemy large (3–5 material) fusion**.
The candidate's win-rate also varied strongly with absolute seat (`0` / `1`).
This study measures both issues without changing live game rules or promoting AI.

## Study design (predeclared)

- 3, 4, and 5 **real materials**, no synthetic fusion stats: the test selects
  legal catalog cards, supplies a valid 40-card deck and a legal fusion deck,
  runs `prepareHandFusion` and `placePending`, and verifies `materialsUsed`.
- A seeded Predator board is staged from real deck cards to isolate the
  post-Stomp situation. This is a **controlled tactical encounter, not a
  naturally progressed complete duel**; do not compare win rates with v15.75.
- Execute the real Stomp against a real card, account for side hits, kills,
  DEF chip, LP counters, and physical ATK/DEF attack fatigue.
- Mirror the exact state to the opposite seat, with field slots reversed so
  “right from attacking player's perspective” is held constant. Keep RNG,
  stats, roles, hand resources and start conditions identical.
- Compare existing `attackPlan` (`native`) against a frozen research-only
  bounded cloned-attack `reply-aware` scorer. Both use the **real** `attack`
  engine, never invented combat damage. At most three legal followup attacks.
- Predator pressure conditions: (0) slightly weaker, (1) two Guardians mixed
  with Predators, (2) Soul mixed with stronger Predators, (3) high-pressure
  Predator ambush. All use seeded, real card stats without injected buffs.
- Exactly 2,048 different seeds × 3 material counts × 4 pressure patterns =
  **24,576 controlled tactical positions**, **49,152 actual mirrored opening
  attacks**, **98,304 Predator-reply policy continuations** (not 98,304 full
  duels). Multiple attacks within each continuation are explicitly counted.
- Fixed partitions: TRAIN seeds `0..1023`, VALIDATION `1024..1535`, HOLDOUT
  `1536..2047` for **every** material size and pressure condition. No holdout
  tuning or production promotion from this study.

## Seat audit and interpretation

Both seats have neutral profile upgrades, zero initial shields, identical LP,
power and enhancements, `strategicTraining.symmetricSides=true`. We separately
report exact Stomp-rule parity and full downstream AI reply state parity.
The latter can differ even if combat rules match, because an AI scorer may
break equal-score attack alternatives by absolute left-to-right index.

Statistics distinguish the three critical questions:

1. Does the same Stomp cause identical damage and essence loss in both seats?
2. Does either AI actually target and destroy large fusions with a Predator?
3. What fraction of large fusions survive both their own Stomp and an immediate
   bounded enemy Predator response, by material count and Predator pressure?

Historical v15.74 and v15.75 champion scores are preserved without modification.
The experimental `reply-aware` variant is **not** the v15.74 champion and this
targeted study is not evidence of a complete match win-rate improvement.

Workflow: `.github/workflows/ai-v1576-predator-fusion-parity.yml`.
