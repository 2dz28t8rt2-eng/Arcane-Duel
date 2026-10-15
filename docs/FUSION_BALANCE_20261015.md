# Arcane Duel – Fusionsbalance 3.1: Teststand und Formel

**15. Oktober 2026 – ausschließlich `development`.** Der veröffentlichte `main`-Branch bleibt unverändert.

## Ziel

Fusionen sollen nicht allein aufgrund der hohen alten Fusionsvorlagenwerte alle Normalmonster verdrängen. Ein normales Monster ist ohne Materialaufwand spielbar; Fusionen benötigen mindestens zwei Materialien und eine verfügbare Fusionsvorlage. Ihre zusätzliche Stärke soll erst durch Qualität, Würfel, Rollen und Materialzusammensetzung entstehen.

## Technische Umsetzung

- **Normales Stufenpotenzial:** Für Level 1–10 werden die aktuellen regulären Workshop-Familien der jeweiligen Stufe zusammengefasst. Für ATK und DEF wird jeweils die Mitte aus niedrigstem und höchstem Wert errechnet: `round10((min+max)/2)`. Diese Referenz ist unabhängig von alten, außergewöhnlich hohen Fusionsvorlagenwerten.
- **Beispiel Stufe 10:** Workshop-Budget `150+30*10² = 3.150`. Je nach Rolle variieren Normalmonster bis ungefähr 690–2.390 ATK bzw. 760–2.460 DEF. Die neue Mitte beträgt deshalb ca. **1.540 ATK / 1.610 DEF** vor Spielertraining und weiteren Multiplikatoren.
- **Wertewürfe:** 88–112 % dieser Referenz pro einzelnem ATK-/DEF-Wurf, multipliziert mit bestehender Fusionsqualität (72–148 %). Der Wurf mit dem höchsten gemeinsamen ATK+DEF-Ergebnis gewinnt; Qualität/Würfelzahl hängen weiterhin von Pokerkombination und Materialmix ab.
- **Materialboni:** Bestehende Aufstiegs-/Materialblöcke werden weiterhin zufällig auf ATK oder DEF verteilt, innerhalb ihrer bisherigen Obergrenzen. Rollenmehrheiten mit mindestens drei geeigneten Materialien übertragen wie zuvor Predator bzw. Wächter/Seelenzehrer; dort findet die ATK-/DEF-Verlagerung statt.
- **Wichtig:** Die bisherige garantierte Untergrenze von 95 % des stärksten Materials wird entfernt. Eine ungeeignete Fusion darf schwächer werden; fortgesetztes Fusionieren trägt frühere Höchstwerte nicht automatisch in die nächste Stufe weiter.
- **Monsterzerfall:** Fusionen verlieren zu Beginn **25 ATK und DEF pro überlebtem Zug**, danach 20, dann mindestens 15. Normale Monster behalten zunächst 30, danach 25, mindestens 20. Startkarten behalten ihre eigenen Zerfallswerte. Die Arena-LP-Zerfallsregel ab Runde 10 wurde **nicht** geändert.
- **Geschützt:** Gespeicherte Karten-IDs, Besitz, Werkstattstufen, Fusionsvorlagen, Pokerlevel, Level-11/12-Reservierung und neutrales PvP sind nicht umgeschrieben. Nur das PvE-Fusionsergebnis wird neu ausgewürfelt.
- **UI:** Fusionswerte bleiben bis zur Platzierung im Feld verborgen; Beschreibung und Regelbuch wurden an die neue Berechnung angepasst.

## Automatisierte Qualitätssicherung

- **238/238 Node-Tests bestanden**, plus Chromium-Browser-Smoke-Lauf erfolgreich auf `development` Commit `9e8bafe0ea91bb2e0520520a4fae45c6feac8804`.
- Neue Regressionen prüfen die Referenzwerte jeder Workshopstufe 2–10, tatsächliche Würfe unter und über dem Referenzwert sowie den Wegfall der alten 95%-Material-Untergrenze.
- Frühere Zerfallstests wurden für Fusionen auf 25/20/15 umgestellt. Die Erwartungen für gewöhnliche Monster bleiben unverändert.

CI: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/38779687868

## Erste Turnierdiagnostik – Vorsicht bei Interpretation

In 216 synthetischen Level-10-Duellen (je 24 Seeds gegen VIII/IX/X und drei KI-basierte Decktypen) wurden folgende Ergebnisse gemessen:

| KI-Deck | VIII | IX | X |
|---|---:|---:|---:|
| Predator | 24/24 | 24/24 | 24/24 |
| Wächter/Seelenzehrer | 24/24 | 23/24 | 24/24 |
| Fusionsorientiert | 23/24 | 16/24 | 22/24 |

Bei den Normalmonster-betonten Decks benötigen Siege nun tendenziell **mehr Halbzüge** als in der vorigen Testreihe (z. B. Predator gegen IX durchschnittlich 8,7 statt 5,9). Die KI fusioniert jedoch **bei allen drei Decktypen**. Sie ist deshalb kein sauberer Vergleich echter reiner Normalmonster- gegen Fusionsstrategien.

Im verlängerten Progressionsaudit mit sechs erfundenen, aber regelkonform gespielten Inventar-Karrieren erreichten **fünf von sechs** das Turnierende; eine offensive Karriere blieb bei Gegner IV hängen. Diese kleine Seed-Auswahl misst weder faire menschliche Siegquoten noch vollständig die Wirkung dieser einen Balanceänderung (der Entwicklungsbranch enthält auch andere vorherige Komfort- und Ökonomieänderungen).

## Noch offen vor der endgültigen Balancefreigabe

1. **Manuelle, gezielte Vergleichsduelle**: reine Normalmonster, Zweierfusionen, sorgfältige 3–5-Material-Pokerfusionen und Feldfusionen mit vergleichbarem Ressourcenverbrauch.
2. **Stufen- und Rollenvergleich** für Predator, Wächter, Seelenzehrer. Nicht nur Schadenshöhe, sondern Anzahl Karten, Haltbarkeit auf dem Feld, Qualität der Züge und Fähigkeit zum Deckaufbau.
3. **Zerfalls-Langzeittest** über viele Runden inklusive Stärkeentwicklung nach wiederholten Fusionen und der bestehenden Arena-LP-Zerfallsmechanik.
4. Noch **keine separate Neugestaltung von Level-1/2-Decks**. Dieser Themenblock wird nach gemeinsamer Abnahme der Fusionsbalance wieder aufgenommen.

**Designentscheidung:** Keine pauschale Erhöhung normaler Monsterwerte und keine Verstärkung von Level-1/2-Sonderkombinationen, bis die neue Fusionsbasis getestet und freigegeben ist.
