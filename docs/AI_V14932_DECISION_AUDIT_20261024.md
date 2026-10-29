# Arcane Duel – KI v14.9.32: Action audits and visible one-response risk ablations

## Why v14.9.32 exists
Run [v14.9.31 #40073805406](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40073805406)
completed 4,800 legal strategic self-play matches with 20 historical
TRAIN-only sources. The fixed `role-economy` research policy won
173/320 holdout matches vs 150/320 for the v14.9.28 validated
Guardian/Soul champion, but no policy met the predeclared
TRAIN+VALIDATION promotion gate. The hardest level-10 cross-role
holdout remained weak for economy (28/64 vs champion 30/64).

We **do not promote** the economy policy based on old HOLDOUT wins.
This run tests its tactical choices on completely new seeds,
with fixed ablations predefined before seeing any v14.9.32 matches.

## Five role-scoring policies: a controlled experiment
1. `guardian-champion`: unchanged v14.9.28 globally validated model.
2. `role-economy`: unchanged v14.9.31 material-economy model.
3. `economy-fusion-reply`: economy plus visible-board counter-threat
   and card-strength penalty when proposed fusion spends scarce
   material on a monster the strongest visible enemy might defeat.
4. `economy-attack-reply`: economy plus a **one-opponent-response
   proxy** based on visible attackers and survivors after a *real
   cloned attack* in the simulator.
5. `economy-both-replies`: tests both additions together.

No hidden hand/deck details are read from the opponent.
The attack-reply penalty is a **static, single-response public-board
risk estimate, not an exact legal opponent turn simulation, full
game tree, neural network, or true multistep reinforcement learning**.
This distinction is essential for honest interpretation.

## Action diagnostics
Per duel the research artifact records the actual candidate action
mix (`normal`, `fusion`, `attack`, stance changes, etc.),
public-board risk evaluation counts for fusion and attack scoring,
turn count, outcomes, candidate and opponent damage,
friendly card losses, enemy cards removed, and seat/starter role.
Summaries also aggregate the hardest L10 cross-role phase separately.

The evaluation-count telemetry describes score evaluations (the
planner may score multiple options); it does not claim that each
scored option became a chosen action. This lets later analysis
identify whether the extra caution produces too little offense
or too few fusions, and distinguish an ineffective subcomponent.

No validation or holdout action tapes are written. Training-only
action traces are archived separately.

## Benchmark and reproducibility
Five phases: L8 and L9 matched-deck mirrors; standard L10 cross-role,
L8 cross-role, and especially hard L10 cross-role deck pairings.
Each phase has eight role pairs, six separate scenarios, two
starter choices, two seats and five policies = **960 legal matches**.
Total: **4,800** (1,600 TRAIN / 1,600 VALIDATION /
1,600 HOLDOUT), exactly 320 in each split per policy.

All fixed policies and the historical champion share deck/RNG seeds
and opponent type within each pair and split. Opponents are the
globally selected Guardian/Soul champion and the previously
predefined balanced checkpoint, both using the full strategic AI.
Both player positions must execute the strategic planner.

**Global promotion gate**, checked without examining HOLDOUT:
- At least +8 TRAIN wins and +8 VALIDATION wins over champion;
- No TRAIN or VALIDATION regression on either player seat;
- No more than 3 fewer VALIDATION wins in mirrored, cross-role,
  current-champion-opponent or prior-balanced-opponent categories;
- No negative win difference in the hardest L10 cross-role
  VALIDATION group. No stage-local promotion.

If all fail the champion is retained. The separate HOLDOUT data
are attached for diagnostic reporting only after selection.

## Transfer and safety
Restore the latest accepted tactical Q tables from successful
v14.9.31 and **21** validated historical TRAIN-only archives.
New tactical Q updates are guarded by internal independent
validation. Restart no model weights from scratch.

40 independent 120-game Node processes prevent historical
monolithic Node heap crashes. Legal move validation and both-seat
strategic engagement are mandatory. LP decay remains symmetrically
disabled under this research benchmark, so a future full-rule
validation is necessary before deployment.

Only research scripts, documentation and GitHub Action on the
`development` branch are touched; live AI and `main` remain
unmodified.

## Files
- `tests/ai-v1532-decision-audit-selfplay.cjs`
- `tests/ai-v1532-decision-audit-aggregate.cjs`
- `tests/ai-v1532-history.cjs`
- `tests/ai-v1532-Q.cjs`
- `.github/workflows/ai-v14932-decision-audit.yml`
