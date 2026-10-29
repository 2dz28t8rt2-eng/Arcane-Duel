# Arcane Duel v14.9.21 – Progressive Siege Curriculum

## Why change the previous curriculum?
GitHub Actions v14.9.20 (successful run 39911997726) proved that a research-only passive fortress can be simulated safely, but stage 0 still yielded many losses from passive enemy Soul effects even though the defender never actively attacked. Several training policies were promoted despite failing to beat the unchanged control's TRAIN wins. The new experiment corrects both issues and includes a direct transfer test.

## Seven cumulative stages
| Stage | Defensive units predeployed | Counterstrike | Soul offense | Opponent summons | Active attacks |
|---|---:|---|---|---|---|
| 0 | 1 | suppressed only in research | suppressed | no | no |
| 1 | 2 | suppressed only in research | suppressed | no | no |
| 2 | 2 | real | suppressed | no | no |
| 3 | 2 | real | real | no | no |
| 4 | 2 | real | real | yes | no |
| 5 | 2 | real | real | yes | gradually |
| 6 | 0 | real | real | yes | fully enabled |

The first two research stages temporarily intercept defensive LP retaliation during a real attack; the third stage restores the normal Guardian counterstrike. The passive and active Soul mechanisms remain disabled through stage 2 via the research-only Soul unlock gate. Natural monster stat decay remains active at every stage. Arena LP decay is disabled so that victory requires actually winning, rather than waiting for automatic LP loss.

Defensive monster deployment is paid for by removing those same cards from the defender's legal 40-card deck. Starting decks, beginning LP, opponent fields, seed, seat and initiative are identical across research-policy arms. Stages intentionally have different difficulties; their win percentages must not be interpreted as an increasing time-series on the same task.

## Training and gating
Four research-policy arms are tested per stage: unchanged role-aware reference; inherited curriculum weights; a stronger board breach; a patient material/Guardian approach.

Each stage contains 512 real-engine games: 384 TRAIN, 128 independent HOLDOUT; each arm gets 96 TRAIN and 32 HOLDOUT cases in eight role matchups with paired starter and seat. Seven stages yield **3,584** games, of which **896** are independent HOLDOUT diagnostics. Only TRAIN results can select weights; Q training cannot access siege HOLDOUT data.

**Fail-closed promotion:** a new curriculum arm is carried forward only if its TRAIN wins STRICTLY exceed the unchanged role-aware reference on the same matched cases. No amount of shaped reward may override a tied or lower TRAIN win count. Shaped reward (victory, board removal, LP damage, material preservation and turns) is used only to break ties between qualifying research candidates.

Stage 6 explicitly removes predeployed garrison units and gives the defender its fully legal action policy, to evaluate transfer to a realistic full-combat matchup. This is still a fixed-reference opponent rather than self-play among jointly training agents.

## Continuity and scope
Historical tactical Q is restored from the successful v14.9.20 artifacts and from ten successful runs (starting v14.9.11) with independent dual validation. The existing Q table is primarily Predator attack-versus-pass and not general action-credit reinforcement learning. The siege trainer adapts hand-written transparent planning scores from train-only win outcomes; it cannot itself prove that the model "understands" all tactics.

All outputs are confined to `development` research scripts and GitHub Actions artifacts. Neither the live AI nor `main` changes automatically.

Sources:
- `tests/ai-v1521-siege-curriculum.cjs`
- `tests/ai-v1521-siege-aggregate.cjs`
- `tests/ai-v1521-history.cjs`
- `tests/ai-v1521-Q.cjs`
- `.github/workflows/ai-v14921-progressive-siege.yml`
