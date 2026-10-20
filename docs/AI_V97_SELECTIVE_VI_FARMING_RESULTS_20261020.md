# Arcane Duel — KI-Training v9.7: selektives Farming ausschließlich vor Gegner VI

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Erfolgreiche Trainingsrunde:** [GitHub Actions #39371555792](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555792). **Code-/Strategieprüfungen:** [#39371555820 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555820). **Browser-Smokes:** [#39371555797 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555797).

**Ergebnisartefakt:** `arcane-selective-vi-farming-v97`, ID **12242280616**, bis 19.11.2026; `artifacts/ai-selective-vi-farming-v97.json` enthält alle 32 individuellen Ursprungspaare mit drei Armen, tatsächliche Belohnungen und Käufe, Gewinne, Farming-Kosten und getrennte Train/Holdout-Metriken.

**Unverändert:** produktive NPC-KI, `main`, `assets/game.js`, Monster-/ACE-Werte, Splitter-/Shoppreise, Lootchancen, Regeln, reguläre Spielerkarrieren. Alle Änderungen sind nur Offline-Testskripte auf `development`.

## Idee und Versuchsaufbau

Aus v9.6: Frühes verstärktes Farming schadet mitunter der IV-/V-Progression, während langes legales Farming gelegentlich den Gegner VI überwindet. Deshalb wurde v9.7 vorab so angelegt, dass **alle drei Testarme bis zum allerersten Turnierversuch gegen VI exakt identisch** bleiben.

- **32 neue unabhängig erspielte Ausgangsseeds**, Offset **60000**, jeder in **drei getrennten** VMs von `freshProfile()` gestartet. **96 reguläre Karriere-Testarme**, davon 16 unabhängige Ursprünge Training und 16 Holdout. Statistische Einheit ist der Karriere-Ursprung, **nicht** jedes Einzelduell.
- **Identischer v9.2-`tempo-board`-Fusionscontroller** in allen Armen; echte `simulateGame`, `rewardMatch`, originaler Shop, Splitter, XP-Abschlag `farmingXpFactor`, Besitz und Inventarvalidierung. Für alle drei Arme gilt derselbe reguläre frühe Farmingplan mit 2–5 freien Duellen nach drei Turnierniederlagen und denselben Folgefarmen nach Gewinnen.
- **Kontrolle `fixed-farm`:** die moderate Routine läuft auch bei VI weiter.
- **`vi-focused`:** erst nach echt besiegtem V und frühestens zwei **echten** VI-Niederlagen intensivere VI-Vorbereitung durch freie Duelle gegen den bereits legal geschlagenen V-Gegner. Adaptive Welle ca. 4–8 Spiele, abhängig von eigenem durchschnittlichem ATK, gegnerischer sichtbarer Signatur-ATK, XP-Abschlag; maximal 48 zusätzliche VI-Vorbereitungsfarmen für den Versuchshorizont.
- **`vi-efficient`:** gleiche Grenze erst nach zwei VI-Niederlagen, kleinere adaptiv begrenzte Wellen ca. 2–5 Spiele und maximal 24 Zusatzfarmen.
- Beide Strategien nutzen **24** Turnierversuche pro Stufe als reine **Testbudget-Grenze**, nicht als Änderung des Live-Spiels. Siege, Drops, Karten, Ressourcen und Turnierfreischaltungen entstehen ausschließlich über Original-Game-Engine-Kämpfe und `rewardMatch`.
- Zusätzlich prüft ein **striktes Ereignisassert**, dass **alle Ereignisse bis vor den ersten VI-Turnierversuch** zwischen jedem Testarm eines Ursprungs exakt gleich sind; dies schließt Farming und reguläre Belohnungen bis einschließlich V ein. Das wurde im erfolgreichen Lauf für alle 32 Ursprünge erfüllt.

## Gesamtresultat — 32 Ursprünge, 8.992 echte Karriereduelle

| Kennzahl | Festes Farming | VI intensiv | VI sparsam |
|---|---:|---:|---:|
| Gegner IV besiegt | **28/32** | **28/32** | **28/32** |
| Gegner V besiegt | **28/32** | **28/32** | **28/32** |
| Gegner VI besiegt | 4/32 | **6/32** | 5/32 |
| Regulär belohnte Duelle | 2.910 | 3.348 | 2.734 |
| Davon freie Duelle | 1.643 | 2.130 | 1.508 |
| Davon Turnierduelle | 1.171 | 1.122 | 1.130 |
| Ausgegebene Splitter | 3.139 | 4.127 | 2.785 |
| Erworbene Booster | 339 | 346 | 335 |
| Freie Duelle gegen V (auch vor/zu VI) | 881 | 1.360 | 744 |
| XP aus freien Duellen gegen V | 51.344 | **76.409** | 42.717 |
| Ø Level beim erstmaligen Erreichen VI | 6,82 | 6,82 | 6,82 |
| Ø Kartenstufe beim erstmaligen Erreichen VI | 3,06 | 3,06 | 3,06 |

**Mehr Farming ist ein realer Aufwand:** Intensiv spielte **487 zusätzliche freie Duelle** und **438 gesamte Duelle** mehr als die Baseline und gab 988 zusätzliche Splitter aus; der Gewinn war nur **+2 zusätzliche VI-Siege unter 32 Ursprüngen**. Sparsam spielte **135 freie und 176 gesamte Duelle weniger** und gewann insgesamt **einen** zusätzlichen VI-Sieg; aber dieser Effekt ist schwach.

Durch die absichtlich **identische Vor-VI-Vorbereitung** sind Startlevel und Decklevel beim ersten VI-Versuch in allen drei Armen gleich. Hier geht es folglich um im Verlauf des Scheiterns tatsächlich durch weiteres Spielen erzielte Karten/XP, nicht darum, unterschiedlich starke vorgespielte VI-Spielstände einzusetzen.

## Abgesperrte unabhängige Train-/Holdout-Auswertung

| Kennzahl | Training fest | Training intensiv | Training sparsam | Holdout fest | Holdout intensiv | Holdout sparsam |
|---|---:|---:|---:|---:|---:|---:|
| VI wirklich besiegt, je 16 Ursprünge | 1 | **4** | 3 | **3** | 2 | 2 |
| IV wirklich besiegt | 13 | 13 | 13 | 15 | 15 | 15 |
| V wirklich besiegt | 13 | 13 | 13 | 15 | 15 | 15 |
| Echte Karriere-Duelle | 1.461 | 1.613 | 1.328 | 1.449 | 1.735 | 1.406 |
| Freie Duelle | 829 | 1.025 | 738 | 814 | 1.105 | 770 |

**Trainingsseitiger Selektionsschritt:** Der vorab geteilte Trainingsblock wählte `vi-focused`: **+3 VI-Siege**, bei **3 unabhängig besseren Ursprüngen, keinem schlechteren**; `vi-efficient` hatte +2 Siege bei weniger Duellen.

**Unabhängiger Holdout:** `vi-focused` **−1 VI-Sieg** (2 statt 3), **1 Ursprung besser, 2 schlechter, 13 gleich**; dafür **291 zusätzliche freie und 286 zusätzliche Gesamtkämpfe**. `vi-efficient` ebenfalls **−1 VI-Sieg** (2 statt 3), bei **44 weniger freien / 43 weniger Gesamtkämpfen** in der Holdout-Hälfte. Die Sparvariante verbesserte im Holdout **keinen** Ursprung, verschlechterte einen.

**Vorab-Gate `qualified=false`:** Die bereits trainingsseitig festgelegte Siegerpolicy `vi-focused` erfüllt das Holdout-Kriterium von **mindestens +2 echten VI-Siegen und mehr besseren als schlechteren Ursprüngen** ausdrücklich nicht. Es wurde **keine** produktive Strategie aktiviert. IV/V bleiben zwar exakt gleich – der wichtige erste Teil des Ziels ist gelungen –, aber die robuste VI-Verbesserung fehlt.

## Technische Korrektur der Testauditierung

- Erste Workflow-Ausführung [#39371117945 – FAILURE](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371117945) stoppte **nach ausgeführten Karriereberechnungen** beim zusätzlichen strengen frühen Ereignisvergleich. Dieser verglich ursprünglich `events.filter(tier < 6)`, was fälschlich **freie Tier-V-Duelle nach dem Beginn der VI-Vorbereitung** als „frühes Spiel“ behandelte. Genau diese Ereignisse *müssen* sich bei den Farmstrategien unterscheiden dürfen. Daher war die Prüfung zu streng/fehlerhaft, nicht das simulierte Spiel.
- Die Prüfung wurde präzise auf **Ereignisse vor dem ersten tatsächlich gespielten VI-Turnierversuch** umgestellt, der verantwortliche Code ansonsten unverändert beibehalten. Die korrigierte neue [vollständige CI #39371555792 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555792) absolvierte den Train-/Holdout-Test einschließlich der geforderten identischen Frühkarriere-Assertions.
- Erfolgreiche finale CI: **56/56** Spiel-/Save-/Fusion-/Economy-Tests und **20/20** KI-Regressionen, separate Code-/Strategie-CI und Browser-Smokes alle SUCCESS.

## Erkenntnisse und nächste Schritte

1. **Technischer und methodischer Erfolg:** Durch ausschließlich selektives VI-Farming kann das frühe Spiel auf realen Karrieren *exakt* stabil gehalten werden. Die v9.6-Regression bei IV/V ist damit als Risiko erfolgreich isoliert/vermieden.
2. **Der VI-Vorteil ist nicht stabil:** In 16 Ursprüngen hilft intensives Farming sehr (+3 Siege), aber in anderen 16 schadet es (−1). Die gesamte zusätzliche Farmingmenge ist deshalb **noch keine reproduzierte Verbesserung**.
3. **Aufwand/Effizienz:** Sparsamer VI-Plan ist im Mittel günstiger und erzielte insgesamt +1 Sieg. Aber der unabhängige Holdout war ebenfalls schlechter; daraus folgt kein automatisches Default-Rezept. Eventuell bewerten, *ob* nach einem VI-Verlust eine gewisse Free-Duell-Chance überhaupt positive Grenzrendite hat.
4. **V9.8 Hypothesen:** Ressourcenbasierte „Stop Farming / wieder versuchen“-Entscheidungen, sinkende XP-/Drop-Erträge, fehlende Upgrade-/Fusionsoptionen, reale Fortschritte während einer Farming-Welle, Auswahl des zuletzt geschlagenen Bosses versus andere erlaubte freie Duelle – jeweils **als einzelne** Hypothese mit echten legal erspielten Profilen und vorab reserviertem Holdout, nicht in einem unkontrollierten Gewichte-Mix.
5. **ACE- und NPC-Fragen getrennt:** Vor Gegner VI fehlen eigene ACEs in den früheren regulären Karrieremodellen; eine eigene Acquisition-/Freischaltanalyse bleibt unabhängig sinnvoll. Der offline **Spielerautopilot** ist keine selbstlernende produktive **Gegner-KI**.
6. **Kein Live-Rollout:** `main`, NPC-Heuristiken, Monsterwerte, Loot/Shop und normale Progression sind unverändert. Alle v9.7-Daten und der Code befinden sich auf `development`.

**Fazit:** Die frühe Regression wurde methodisch verhindert; die Idee intensives Farming *nur bei VI* ist plausibel, aber im neuen unabhängigen Holdout nicht siegstabil. Das korrekte Freigabeurteil ist **`qualified=false`**.
