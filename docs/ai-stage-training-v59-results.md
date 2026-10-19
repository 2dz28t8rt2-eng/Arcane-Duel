# Arcane Duel – KI-Trainingsrunde v5.9 (19.10.2026)

## Nachweisbarer Stand
- **Development**, produktive Turnier-KI bleibt unverändert. `main` ist unberührt.
- [Erfolgreicher GitHub-Actions-Trainingslauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39237152916)
- **2000 echte Simulationsduelle** mit der aktuellen Engine: 1200 Trainings- und 800 Holdout-Duelle auf disjunkten Zufallsseeds.
- **19/19 Tests** (4 Decktests, 7 Branching-/Sicherheitsprüfungen inklusive ACE-Materialschutz, 8 ältere KI-Tests) bestanden. Separat die Code- und Strategieregressionen ebenfalls grün.
- Die **Stage-Baseline** verwendet die zuletzt trainierten **v5.7-Aktionsgewichte**, NICHT die unveränderte Live-Turnier-KI. Daraus bitte keine falschen Aussagen über die reale Schwierigkeit ableiten.
- Gegen diese **trainierte** Baseline: **+13 Siege** und im Mittel **+237 LP-Differenz** (ungewichteter Mittelwert der zehn Turnierstufen).
- Die per-Stage-Kandidaten wurden nur in Sandboxpartien trainiert und getestet. **Es gab keinen automatischen Rollout**.

## Stufengerechte Testdecks (Wunsch des Nutzers)
Die Decks werden deterministisch durch `tests/helpers/stage-training-decks-v59.cjs` erstellt. Pro Stufe gibt es die Archetypen **Predator/Angriff**, **Wächter/Verteidigung**, **Fusion**, **Allrounder/balanced**, jeweils in **normal** und **investiert**.

Jedes Hauptdeck enthält **exakt 40 Karten** und höchstens **3 Exemplare je ID**. Jedes Fusionsdeck enthält **2 bis 15** legale Fusionskarten. Die Auswahl enthält nur freigeschaltete Starterkarten und Karten von bereits besiegbaren/vorherigen Turnierstufen: `source <= tier-1`. Levelgrenze entspricht der Stufe des **vorherigen Gegners** (bei Turnier I der Trainingsgegner); kein Hardmode, keine ACEs oder spezielle Questkarten.

**Grenze:** Dies sind *synthetisch zusammenstellbare, freischaltquellenkonforme* Testdecks, KEINE simulierten Inventare aus echter Droprate, Münzen, XP, Booster-Öffnungen und Shopkäufen. Für die tatsächliche Karriereschwierigkeit braucht es spätere Tests anhand von erspielten Spielständen.

## Echte Aktionszweige
`assets/ai-branch-trainer-v59.js` bewertet zulässige Beschwörungen, Fusionen, direkte Angriffe, Wächterheilung und Seelenentzug, indem die reale Engine die Aktion in einer eigenen **isolierten Kopie** ausführt und die Position anschließend bewertet. Gegnerische Hand, Hauptdeck, zukünftige Ziehungen und Inventar werden aus der Kopie **entfernt**. Der simulierte Zufallsseed basiert auf bekannten Zustandsmerkmalen und wird in jedem Kandidatensample gleich verwendet, nicht auf der echten zukünftigen Spiel-RNG.

Je nach Gegner werden nur **2–15 Alternativen** in Betracht gezogen, für VII–X zwei deterministische Samples. Bei einer sichtbaren gegnerischen Feldreaktion kann die Engine einen weiteren realen Angriff in der Testkopie durchführen. Diese Folgereaktion beschränkt sich ausdrücklich auf **öffentlich sichtbare Feldkarten**, es handelt sich **nicht** um eine vollständige Minimax-Suche aller zukünftigen Züge oder unbekannten Ziehungen.

**ACE-Fokus:** Legale Signatur-ACEs werden bevorzugt. Eine zusätzliche Materialreservierungsstrafe verhindert, dass die KI kurz vor dem angekündigten ACE-Versuch wertvolle Fusionsmaterialien für andere Spielzüge unnötig verbraucht. Die tatsächliche ACE-Häufigkeit wird separat ausgewertet.

## Ergebnisse des ACE-bewussten v5.9 Holdouts

| Gegner | Neue Siege | LP-Differenz | ACE-Aktionsdifferenz | streng freigabefähiger Testkandidat? |
|---|---:|---:|---:|---|
| I | 0 | −30 | −24 | Nein |
| II | +10 | +1642 | −18 | Nein – Signatur-Strategie rückläufig |
| III | −9 | −1416 | 0 | **Nein – große Verschlechterung** |
| IV | +3 | +421 | 0 | Ja, nur für weitere QA |
| V | +7 | +1472 | +20 | Ja, nur für weitere QA |
| VI | +1 | −168 | −15 | Nein – ACE-Nutzung schlechter |
| VII | 0 | 0 | −9 | Nein |
| VIII | 0 | +190 | +40 | Ja, nur für weitere QA |
| IX | +1 | +261 | 0 | Ja, nur für weitere QA |
| X | 0 | 0 | 0 | Nein – keine Verbesserung |
| **Summe** | **+13** | – | – | **4 Kandidaten** |

Die LP-Differenz ist die Veränderung des durchschnittlichen NPC-minus-Spieler-LP-Abstands gegenüber der trainierten Baseline, **nicht** die tatsächliche Lebenspunktezahl der Karten.

**Nicht live aktivieren:** IV, V, VIII, IX sind nur Kandidaten für **größere unabhängige Kontrollgruppen und reale Karriere-Decks**. Insbesondere Gegner III darf nicht geschwächt werden. Gegner II gewinnt zwar mehr, verletzt aber den gewünschten ACE-Schwerpunkt; mehr Siege alleine genügen hier nicht.

## Nächster sinnvoller Entwicklungsschritt
1. Getrennte realistisch **erspielte** Inventarschnappschüsse aus echter Karriereprogression beschaffen und als härtere Testdecks verwenden, inklusive verschiedener Booster-, Quest- und Ausrüstungspfade.
2. Bei III und VI speziell **ACE-Vorbereitung, Fusionsmaterialaufbewahrung und Eröffnungsentscheidungen** debuggen; keine pauschale Gewichtsoptimierung.
3. Wahrhaft mehrzügige verzweigte Engine-Simulation ermöglichen, ohne zukünftige gegnerische Handkarten zu lesen; mögliche Gegenreaktionen über ein **stochastisches Informationsmodell** abbilden.
4. Größere disjunkte Holdouts mit mehr Seeds, Gegnerstufen und unterschiedlichen Kartenfamilien. Nur dann einzelne Profile kontrolliert auf development aktivieren.

**Details** liegen im für 30 Tage gespeicherten JSON-Artefakt des erfolgreichen Actions-Laufs (Name: `arcane-ai-stage-training-v59`).
