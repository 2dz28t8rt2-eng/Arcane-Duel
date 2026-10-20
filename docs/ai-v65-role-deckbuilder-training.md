# Arcane Duel – KI- und Deckbau-Training v6.5

**Datum:** 19. Oktober 2026. **Branch:** development. Main und reguläre Turnier-KI unverändert.

## Was getestet wurde

Die v6.4-Karriereautomation hat acht vollständig erspielte Charakterentwicklungen mit echten Trainingssiegen, regulären Turnierkämpfen und authentischen Belohnungen, kostenpflichtigen Boostern, Crafting, Rollen-Upgrades und Farmkämpfen gegen zuvor besiegte Gegner simuliert. Die 41 gültigen Inventar-Snapshots verteilen sich wie folgt:

| Vor Turniergegner | Anzahl tatsächlich erspielter Profile |
|---|---:|
| I | 8 |
| II | 8 |
| III | 8 |
| IV | 8 |
| V | 5 |
| VI | 4 |
| VII–X | 0 |

**Nicht behaupten**, dass Menschen VII–X nicht schaffen könnten: Die Skriptspieler verfügen über begrenztes strategisches Deckbuilding. Keine fiktiven Siege oder Karten wurden verteilt.

## KI-Training gegen IV bis VI

[GitHub Actions v6.4 – 2.004 Duelle, erfolgreich](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39248541233)

| Gegner | Deck-Snapshots | Vorab gewählter KI-Testkandidat | Zusätzliche Siege im neuen Holdout | LP-Vorsprung gegenüber Vergleich |
|---|---:|---|---:|---:|
| IV | 8 | Bestehende v5.7-AI | 0 | 0 |
| V | 5 | Gated Survival | −5 | −191 |
| VI | 4 | Gated Survival | +1 | +28 |

Keiner erfüllte die Freigaberegeln. Unveränderte Engine, unveränderte produktive KI.

## Neues Rollendeck-Training v6.5

[GitHub Actions v6.5 – 616 Duelle, erfolgreich](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39248999165)

Das Script tests/ai-role-deckbuilder-v65.cjs erstellt Predator-, Wächter-, Seelenzehrer-, Fusions- und Allrounder-Decks ausschließlich aus tatsächlich vorhandenen Karten mit echter Besitzanzahl und max. drei Kopien; es prüft jede neue Auswahl durch die Spiel-Funktion setActiveDeck gegen die gültigen Deckregeln. Der eigene, echte Boss-Gegner bleibt unverändert.

Zuerst wurde die Deckbauvariante auf Trainingsseeds gewählt, danach auf unabhängigen Holdout-Seeds mit beiden Startspielern gegen die vorhandene automatische equipBest-Deckauswahl getestet.

| Gegner | Deck-Snapshots | Beste Trainingsvariante | Zusätzliche Spieler-Siege im Holdout | Spieler-LP-Verbesserung | qualifiziert? |
|---|---:|---|---:|---:|---|
| IV | 8 | unverändertes equipBest | 0 | 0 | Nein |
| V | 5 | Seelenzehrer | +1 | +678 | Nein, zu wenige zusätzliche Siege |
| VI | 4 | Allrounder | 0 | −1 | Nein |

**Ergebnis:** 616 komplette Trainings- und Vergleichsduelle ohne Laufzeitfehler. Zusammen mit v6.4 wurden 2.620 KI- und Deckbau-Vergleichsduelle ausgeführt. Die acht Karrieren wurden in beiden GitHub-Läufen reproduziert; nicht als 16 unabhängige Verläufe gezählt.

## Fazit

Die neue KI wird auf keinem höheren Turniergegner automatisch aktiviert. Der Seelenzehrer-Deckbau hat auf Stufe V einen interessanten, aber noch zu kleinen Effekt gezeigt. Ein genereller rein ATK-/DEF-basierter oder global rollenbevorzugter Deckbau löst die Karte- und Fusionsprogression nicht ausreichend.

Für die nächste Runde: echte Workshop-Fusionen, bessere Fusionsmaterialplanung und wirtschaftlich sinnvolle Ressourcenentscheidungen in Karrieren einbauen; erst nach legitimen Siegen bis VII–X die letzten Gegner mit real erspielten Decks trainieren. Zurzeit **kein experimentelles KI-Profil freigegeben**.

## Dateien und Berichte

- tests/ai-career-optimized-v64.cjs
- tests/ai-career-optimized-holdout-v64.cjs
- tests/ai-role-deckbuilder-v65.cjs
- docs/ai-v64-career-optimized-results.md
- Die jeweiligen JSON-Reports werden in den zwei erfolgreichen Actions-Läufen 30 Tage als Artefakte aufbewahrt.
