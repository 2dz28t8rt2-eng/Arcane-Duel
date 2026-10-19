# Arcane Duel — KI-Training v8.2: isolierte Deck-/Splitterwirtschaft

**Stand:** 19.10.2026 · **Branch:** `development` · **Commit:** [4fd9125](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/4fd9125a7d9a9930160553251c816552ee39623c).

**Primärer Lauf:** [GitHub Actions #39309315915](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39309315915), **SUCCESS**. Zusätzlich [Strategie-/Codeprüfungen #39309315720](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39309315720) und [Browser-Smoke #39309315648](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39309315648), beide **SUCCESS**. Trainingsartefakt: `arcane-economy-isolated-v82`, Artifact-ID `12215605093` (bis 18.11.2026 verfügbar).

## Versuchsdesign und Beweiskraft

- 20 voneinander unabhängig gestartete **Ausgangskarrieren**; je fünf gepaarte Varianten, insgesamt **100 vollständige simulierte Karriereversuche**. Diese sind **nicht** 100 unabhängige Ursprünge.
- Pro Variante reguläre Einführung, tatsächlich simulierte Kämpfe, `rewardMatch`, bezahlte Booster/Craftings/Rollenforschung und unveränderte Loot-/Ressourcenregeln. Keine manipulierten Siege, Ressourcengeschenke, künstlichen Level oder importierten Endgame-Decks.
- Referenz `late-shard`: ungesteuertes Investieren nach geschlagenem IV. Vergleichsreferenz `early-shard`: dieselbe Kaufmechanik ab geschlagenem II.
- Jeweils **nur ein zusätzlicher Hebel** gegenüber `early-shard`: `value-shard` (Crafting nur bei prognostiziertem realem Deckwertgewinn), `reserve-shard` (20 Splitter Rücklage bei Crafting/Forschung/Neuwurf), `no-reroll-shard` (keine bezahlten Booster-Neuwürfe).
- Die zwei Hälften (10/10 Ausgangsseeds) sind getrennt ausgewiesen. Varianten wurden nicht anhand der Holdout-Daten umprogrammiert. Da die Abschluss-Empfehlung jetzt anhand dieser Resultate formuliert wird, ist anschließend ein **neuer, unberührter** Bestätigungs-Holdout erforderlich.
- Die tatsächliche Gegner-KI, Kartenwerte, Preise und der Branch `main` wurden nicht geändert.

## 1. Durchschnittlicher realer Karrierefortschritt

| Strategie | Train (10) | Holdout (10) | Gesamt (20) | Bezahlte Splitter | Craftings | Forschungen | Neuwürfe |
|---|---:|---:|---:|---:|---:|---:|---:|
| late-shard (erst nach IV) | 4,30 | 3,70 | 4,00 | 751 | 37 | 10 | 33 |
| early-shard (ab II) | 3,70 | 3,60 | 3,65 | 2.587 | 161 | 22 | 93 |
| value-shard | 4,40 | 3,90 | 4,15 | 2.861 | 116 | 69 | 93 |
| reserve-shard | 4,60 | 4,00 | **4,30** | **1.197** | 64 | 4 | 73 |
| no-reroll-shard | 4,30 | **4,30** | **4,30** | 2.782 | 177 | 59 | **0** |

Die Gesamt-Ausgaben sind **nicht pro gewonnenem Level normiert**: Ein Arm kann mehr ausgeben, weil er in längeren Karrieren häufiger Investitionsgelegenheiten erreicht. `reserve-shard` spart gegenüber `early-shard` dennoch bei gleichem Ursprungsset rund 54 % der tatsächlich bezahlten Splitter und erzielt im Mittel 0,65 zusätzliche gewonnene Stufen.

**Gepaarte Fortschrittsvergleiche vs. early-shard (20 Ursprünge):**
- `late-shard`: 6 besser / 11 gleich / 3 schlechter; Holdout +0,10 Stufen.
- `value-shard`: 4 besser / 16 gleich / 0 schlechter; Holdout +0,30 Stufen.
- `reserve-shard`: 6 besser / 12 gleich / 2 schlechter; Holdout +0,40 Stufen.
- `no-reroll-shard`: 8 besser / 10 gleich / 2 schlechter; Holdout **+0,70 Stufen** (4 besser, 6 gleich, 0 schlechter).

**Interpretation:** Zu frühes breit gestreutes Geldausgeben schadet. Das gezielte Streichen von Routine-Neuwürfen ist das stärkste Ergebnis der getrennt ausgewiesenen Holdout-Hälfte. Eine moderate Splitterreserve bietet einen ähnlich hohen Gesamtfortschritt bei deutlich weniger Ausgaben. Die Experimente belegen **keine** additive Wirksamkeit einer Kombination beider Ansätze; diese muss separat getestet werden.

## 2. Engpass: Turniergegner IV und VI

| Strategie | IV betreten | IV gewonnen | VI gewonnen | VII gewonnen | VIII gewonnen |
|---|---:|---:|---:|---:|---:|
| late-shard | 20 | 10 | 2 | 0 | 0 |
| early-shard | 19 | 7 | 0 | 0 | 0 |
| value-shard | 19 | 10 | 3 | 1 | 0 |
| reserve-shard | 20 | 11 | 3 | 1 | 0 |
| no-reroll-shard | 19 | **12** | 2 | **2** | 0 |

Vor dem Versuch gegen IV lagen die **durchschnittlichen Level der 40 ausgerüsteten Karten** je nach Strategie lediglich zwischen **2,48 und 2,73**. Die tatsächlich gespeicherten Fusionsdecks umfassten durchschnittlich etwa **9,9–11,3 Karten**; ihre bloße Anzahl beweist aber **nicht**, dass zum richtigen Zeitpunkt spielbare Materialkombinationen oder günstige Fusionen verfügbar sind. Durchschnittlich verfügbare Splitter vor IV: spät 28,6; früh 3,8; Wert 3,8; Reserve 20,2; kein Neuwurf 5,4.

**Karriereprogressionsbefund:** IV bleibt die erste große Schranke, VI die nächste. Zwei no-reroll-Ursprungskarrieren gewannen VII und erreichten VIII, doch **keine** Variante gewann VIII. Gegner IX/X lassen sich daher weiterhin nicht seriös aus genügend *tatsächlich erspielten* Karriere-Endgame-Decks bewerten.

## 3. Qualitätssicherung

Die v8.2-Action absolvierte die vorgeschaltete Wirtschafts-/Save-Regression mit **55 bestandenen Tests, null Fehlern** und die ergänzende KI-Regression mit **23 bestandenen Tests, null Fehlern**. Außerdem waren der unabhängige allgemeine Strategie-Workflow und die Browser-Smoke-Suite auf dem zugehörigen v8.2-Commit grün. 508 dokumentierte Vorspiel-Snapshots wurden erstellt.

**Keine Live-AI-Aktivierung**: Dieser Lauf testet programmierte Offline-Spielerpolitiken und ihre Kaufentscheidungen, kein neuronales Modell und kein Online-Lernen aus Nutzermatches. Je Arm können sich die Zufallsverläufe nach den ersten unterschiedlichen Einkäufen auseinanderentwickeln; die Paarvergleiche kontrollieren identische Ursprünge, aber nicht jeden einzelnen späteren Zufallsausgang.

## 4. Empfehlungen und nächster Trainingsauftrag v8.3

1. **Neuer Bestätigungs-Holdout:** 24–40 bislang unbenutzte unabhängige Ursprungskarrieren, unveränderte Kaufregeln, Varianten `early-shard`, `reserve-shard`, `no-reroll-shard` und **Kombination** aus Reserve plus keinem Routine-Neuwurf. Kombinierte Effekte als eigenes Experiment behandeln; keine Gameplay-Preise ändern.
2. **Vor-IV-Deckbau als Haupthebel:** Auf identischen legalen Vorspielinventaren `equipBest()` vs. Rollen-/Fusionsstrategie prüfen. Messen: 40 tatsächlich ausgerüstete Monsterstufen, echte Hand-/Feld-Materialkombinationen für im Fusionsdeck liegende Karten, Qualität der gespielten Fusion, Abbruchgrund und Druck auf LP.
3. **Taktische Spielerentscheidungen:** Mehr Fusions-Vorausschau und Deck-/Rollenplanung vor IV/VI, ohne die NPC-Parameter mitzuziehen. Nicht bloß `ATK+DEF` maximieren; Rollenstrategie, Seelenverzehr, ACE-Zugänglichkeit und Ressourcen-/Kartensynergien berücksichtigen.
4. **Getrennte Bestätigung im Endgame:** Erst nach legal erspielten VII-Siegen ausreichende VIII-Profile aufbauen. IX/X nur auf tatsächlich erspielten Decks plus klar separat gekennzeichneten synthetischen Stresstests untersuchen.
5. **Rollout-Gate:** Erst bei reproduzierbarer Verbesserung im *neuen* Holdout, stabilen Deck-/Save-Regressions und voll grüner Browserprüfung die Spielerpolicy für eine spätere Integration vorschlagen. `main`, Boss-KI und globale Balance ohne Freigabe unverändert lassen.

**Gesamturteil:** v8.2 erfolgreich ausgeführt; **Routine-Booster-Neuwürfe vermeiden** und **Reserve als eigenständige Strategie** auf neuen Seeds bestätigen. Der nächste größte Entwicklungshebel ist echter rollen- und fusionsorientierter **Deckbau vor IV**. 
