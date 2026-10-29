# Arcane Duel – Prüfbericht v14.8.7: Erster Engine-basierter Gegenreaktionsplaner

**Datum:** 22.10.2026 · **Branch:** `development` · **Status:** GitHub Actions erfolgreich, neue KI **nicht** als überlegen bestätigt.

## Verifizierte Originalquellen

- [Erfolgreicher kompletter GitHub-Actions-Lauf #39746615742](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39746615742)
- [Originales JSON-Reportartefakt #12410979636](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39746615742/artifacts/12410979636)
- [Trainer `tests/ai-v1487-two-ply-training.cjs`](../tests/ai-v1487-two-ply-training.cjs)
- [Workflow `.github/workflows/ai-v1487-two-ply-pilot.yml`](../.github/workflows/ai-v1487-two-ply-pilot.yml)
- Commit mit korrigiertem Trainer `03914049eb1ed3902761ad36c8bcdebb52efc4cd`.

Der zunächst gestartete Lauf [#39746501567](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39746501567) schlug beim ersten KI-Vergleich fehl, weil der sichtbare Gegenspieler-Bewerter in der isolierten Node-VM nicht bereitgestellt war (`ReferenceError: visibleReply1487 is not defined`). Im oben genannten Commit wurde die Funktion in den VM-Quellcode eingebunden; die anschließende Actions-Runde bestand alle vorgeschriebenen Tests, die Quellvalidierung, Simulation, Schemaprüfung und den Artefakt-Upload.

## Was tatsächlich implementiert wurde

- **Legale Folgeaktionen:** Die Kandidatenpolicy bewertet Position und Attacke mit echten `applyAiAction`-Folgezuständen; bei erlaubtem Angriff wird eine zweite legal erscheinende eigene Angriffs- oder Supportaktion geprüft.
- **Sichtbare Gegenreaktion:** Nach regelkonformem Zugwechsel kann der Gegner mit schon sichtbaren, angreifenden Feldkarten bis zu zwei Mal reagieren; ein Gegnerhand- oder Nachziehstapel-Orakel ist ausdrücklich nicht Teil der Auswahl.
- **Wertfunktion:** Eigener Boardgewinn, linearer Erfahrungs-Score, eigene Folgeaktion, Verteidigungsentlastung, Gegenangriffsverlust und unmittelbarer Duellsieg werden getrennt ausgewiesen.
- **Kontrolle:** Wie in v14.8.6 symmetrische Fusionen **ausschließlich in isolierten Test-VMs**, gleiche vollständige 40er-Decks/Startkarten und gleiche Fusionsreserven je Sitz; Skills/Perks neutralisiert.
- **Trennung Training/Holdout:** Drei Risiko-Gewichte wurden auf ausschließlich Trainingsszenarien getestet; nur das train-seitig ausgewählte Profil wurde auf anderen Szenarien evaluiert. Keine Änderung von `main`, Spielregel-Engine oder produktivem KI-Champion.

## Prüfdaten

### Train: je 24 Duelle pro Gewicht

| Gewicht Gegenrisiko | Kandidat gewinnt | Planer-Auswertungen | Ausgewertete Angriffsantworten |
|---:|---:|---:|---:|
| 0,20 | 12/24 = **50,0 %** | 344 | 180 |
| 0,65 | 12/24 = **50,0 %** | 343 | 158 |
| 1,10 | 12/24 = **50,0 %** | 341 | 158 |

**Train-Entscheid:** 0,20 ausschließlich durch den festgelegten Tiebreak (alle Profile erreichten 50,0 %). Kein Nachweis, dass dieses Gewicht wirksamer ist.

### Unberührter Holdout: 6 neue Szenarien × 4 Startbedingungen × 2 Sitzbelegungen

| Kennzahl | Ergebnis |
|---|---:|
| Kandidatensieg gegen alte v14.7-Referenz | **24/48 = 50,0 %** |
| Siege fixer Platz 0 | **24/48 = 50,0 %** |
| Siege des tatsächlichen Startspielers | **8/48 = 16,7 %** |
| Aufrufe des neuen Planers | **697** |
| Bewertung von sichtbaren gegnerischen Angriffsvarianten | **387** |
| Promotion in das Spiel | **Nein** |

Nur die Stile Predator und Guardian waren in diesem kleinen Holdout vertreten (je 24 Duelle, je 12 Siege der Kandidaten-KI). Es wurden keine Siege aufgrund illegaler Aktionen als Erfolg gewertet, und der GitHub-CI-Lauf mit seinem Simulations-Assertion-Gate ist erfolgreich.

Die **16,7 % Startsiege** sind ein Befund dieses schmalen Szenario-Samples mit wiederverwendeten Deckkonstellationen, **keine neue allgemeine Fairnessschätzung** und insbesondere kein Widerspruch zum wesentlich breiteren v14.8.6-Fairnessbericht. Ebenso beweisen 50 % Sitzquote nicht, dass Starterposition, angegriffene Felder oder einzelne Styles im Live-Modus fair sind.

## Wichtige Interpretation

**Technischer Meilenstein erreicht: Die zusätzliche Konter-Logik läuft in der echten Engine-Simulation, archiviert erklärbare Entscheidungsbeispiele und bleibt testisoliert. Lernmeilenstein noch nicht erreicht: 50 % gegen die eingefrorene KI zeigen keinerlei taktische Überlegenheit.**

Es wurde weder ein vollständiges Minimax/MCTS implementiert noch neue Gewichte auf einem zustandsbasierten Erfahrungskorpus trainiert. Insbesondere bewertet die zusätzliche Gegensimulation **keine hypothetischen gegnerischen Beschwörungen**, und die Strategie bei eigenen normalen und Fusion-Beschwörungen bleibt beim bestehenden flacheren Planer.

Die Holdout-Traces dokumentieren viele Endzug-Situationen mit nur einer legalen Kandidatenaktion. Für den nächsten Lauf müssen daher *tatsächliche Entscheidungskonflikte* gesondert erfasst werden: mehrere legale Aktionen, andere gewählte Aktion als unter v14.7, und nachgewiesene bessere resultierende Zustände. Zunehmende Planer-Aufrufe allein sind keine Leistungsmetrik.

## Folgerung und priorisierte nächsten Schritte

1. **Echte Aktionsdivergenz messen:** Snapshot der identischen Ausgangslage, Entscheidung v14.7 versus v14.8.7, gültige Alternativen, tatsächliche Unterschiede, daraus entstehende Endzustände und Nachwirkungen. Ein-Zug-Enden ohne Alternativen getrennt zählen.
2. **Mechanik-Curriculum aufbauen:** isolierte taktische Tests für Angriffsreihenfolge, Verteidigung/Seelenentzug, Fusionsmaterial, Poker/Resonanz, Zerfall, ACE und Sonderregeln. Alle Module zunächst im symmetrischen, neutralisierten Trainingsmodus.
3. **Mit echten Alternativ-Folgen lernen:** versionierte legale Zustand-Aktion-Folgezustand-Beobachtungen für Training, danach begrenzte Mehrzug-Suche einschließlich eigener Fusionen und wahrscheinlicher statt allwissender Gegnerreaktionen.
4. **Erneuter größerer Vergleich:** getrennte Speicher-Shards, alle sieben Strategietypen, neue Seeds, beide Sitze/Starter, getrennte Train/Holdout-Auswertung. Anschließend Skills/Perks schrittweise auf beiden Seiten reaktivieren und Sitz-/Regelkontrollen wiederholen.
5. **Keine Champion-Promotion**, bevor der Kandidat gegen v14.7 mit unabhängigem Vorteil und ohne signifikante Verschlechterung von ACE/Boss-/defensiven Spezialfällen besteht.

Siehe auch [Strategische Trainingsroadmap ab v14.8.7](AI_STRATEGIC_TRAINING_FROM_V1487_20261022.md).
