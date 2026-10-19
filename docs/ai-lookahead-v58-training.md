# Arcane Duel – KI-Trainingsrunde 5.8 (19.10.2026)

## Ergebnis (verifiziert)
- **GitHub Actions:** [Erfolgreicher Trainingslauf 39235089086](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39235089086)
- **3340 tatsächliche simulierte Duelle** in der bestehenden Spielengine, keine Ausführungsfehler.
- **15/15 Tests bestanden** (7 Lookahead + 8 bisherige Safety-/Legalitätstests).
- Gegenüber den besten zuvor offline ermittelten **5.7-Gewichten:** **0 zusätzliche Siege** über alle zehn Gegner zusammen, **+14 LP durchschnittlicher Differenz** über die zehn Turnierstufen.
- Drei Stufen mit Verbesserungen in der Holdout-Auswertung: Gegner **II (+9 LP)**, **V (+19 LP, +2 ACE-Aktionen)** und **VIII (+115 LP, +19 ACE-Aktionen)**. Gegner X: **−4 LP**.
- Die resultierenden Konfigurationen wurden **nicht automatisch auf Spielerduelle übernommen**.

| Turniergegner | Prognosehorizont (Züge) | Zusätzliche Siege | LP-Differenz (Holdout) | ACE-Aktionen |
|---|---:|---:|---:|---:|
| I | 1 | 0 | 0 | 0 |
| II | 1 | 0 | +9 | 0 |
| III | 1 | 0 | 0 | 0 |
| IV | 2 | 0 | 0 | 0 |
| V | 2 | 0 | +19 | +2 |
| VI | 2 | 0 | 0 | 0 |
| VII | 3 | 0 | 0 | 0 |
| VIII | 3 | 0 | +115 | +19 |
| IX | 3 | 0 | 0 | 0 |
| X | 3 | 0 | −4 | 0 |

## Was technisch umgesetzt wurde
- `assets/ai-lookahead-v58.js`: isolierte **öffentlich beobachtbare**, deterministische, gewichtete **Prognose über 1 bis 3 Spielzüge**. Kein Zugriff auf verdeckte gegnerische Karten, kein Klonen mit geheimen Handinformationen, keine Änderungen an Spielständen. Dies ist ein **heuristischer Forecast**, keine echte exakte Minimax-/MCTS-Baumsuche über spätere unbekannte Karten.
- Beschwörungen, legale Handfusionen, sichere Angriffe, angrenzende **Wächter-Heilung** und aktive **Seelenzehrer-Extraktion** sind als Aktionsalternativen in den Testplaner integriert. Unveränderte Engine prüft sie weiterhin beim Ausführen.
- Gegner I–III haben nur Prognosetiefe 1, IV–VI Tiefe 2, VII–X Tiefe 3. Die bestehenden Kandidaten- und Fusionsmaterial-Budgets aus `ArcaneAiLearning56` bleiben erhalten.
- Freigeschaltete Signatur-ACEs werden bei legaler Verfügbarkeit weiterhin bevorzugt; die Simulation erfindet keine neuen Karten.
- `tests/ai-lookahead-v58.test.cjs`: Grenzen, Leseschutz verdeckter Karten, benachbarte Wächter-Seelenzehrer-Synergie, Reset des Sandboxes und reale Matches I–X.
- `tests/ai-lookahead-training-v58.cjs`: deterministische Gewichtsoptimierung über mehrere Generationen, disjunkte Trainings- und Holdout-Seeds, Vergleich gegen **zuvor trainierte 5.7-KI**, getrennte Gegner-Stile `balanced`, `offensive`, `guardian`, `economy`. JSON-Detailbericht liegt als Workflow-Artefakt zum Download (30 Tage).

## Interpretation
Die Verbesserung ist zu klein, um die neue Logik für alle Gegner live auszurollen. **Mehrere Tausend Partien** erhöhen die Datenmenge, lösen aber nicht automatisch grundsätzliche Schwächen der Aktionsauswahl. Die Forecasts kennen absichtlich keine zukünftigen verdeckten Handkarten des Spielers; ohne stochastische Unsicherheitsmodelle bleibt die Zukunftsplanung grob. Die ACE-Aktionszahl ist ein Nutzungsindikator, kein Garantiebeleg für gewonnene Matches.

## Sinnvolle Folgeschritte
1. Vergleich legaler **Feldplatzierungen/Feldfusionen** und Unterstützungskombinationen mit einer *stochastischen Sicht* auf unbekannte Gegnerzüge (ohne deren echte verdeckte Hand zu lesen).
2. **Tatsächliche verzweigte Folgezustände** für öffentlich deterministische Aktionen inklusive Kartenverfall und Verteidiger-Effekten auswerten, statt nur Näherungswerte für Angriff/DEF zu verwenden.
3. Taktiken für Level-9/10 und **Eiman Huel Stalker** auf ausreichend harte Gegendecks abstimmen, darunter realistisch erspielbare Karriere-Decks.
4. Danach neue strenge A/B-Holdouts auf **mehreren Decksets**, ACE-Einsatz, Fusion und Überlebenswahrscheinlichkeit je Stufe. Nur erwiesene Verbesserungen selektiv aktivieren.

**Deployment:** Der neue Prognoseplaner ist nur durch `ArcaneAiLookahead58.setSandbox()` während Tests aktivierbar. `main` bleibt unberührt.
