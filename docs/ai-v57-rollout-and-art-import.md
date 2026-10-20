# Arcane Duel · KI v5.7 und freigegebene Bilder (19.10.2026)

## Aktueller GitHub-Stand
**Entwicklung nur auf `development`; `main` unverändert.**

- Bereits integriert: Name `Himmlischer Löwenwächter` statt `Goldener Phönix` in `assets/game.js` und `assets/fate-illustrations.js`. Gleiche Schicksalsmonster-ID und gleiche Mechanik.
- Neue KI-Analyse: `assets/ai-learning-v56.js` bewertet tatsächlich legale Handbeschwörungen/Fusionen und sichere Angriffe anhand von öffentlichen Zonen und eigener Hand. Nie verdeckte menschliche Karten oder unrechtmäßige Gratisaktionen.
- Turnierbudgets: 2–15 betrachtete Alternativen (Gegner I–X); nur 2 Materialien bei I–V, bis zu 3 bei VI–X; die Fusions-Limits der Spielengine bleiben maßgeblich.
- `ArcaneAiLearning56.setSandbox(...)` aktiviert die neue Entscheidungsauswahl ausschließlich für Offline-Simulationen; vorhandene Live-Spiele verwenden die alte, getestete KI, bis die Validierung der verschiedenen Archetypen abgeschlossen ist.

## Trainingsnachweise
**V5.6 – Seed-Training:** 400 Trainings- und 120 Holdout-Partien. +0 zusätzliche Siege auf der Holdout-Gruppe; unterschiedliche Fusions- und ACE-Frequenz zeigt, dass die Gewichte tatsächlich Aktionen beeinflussen. [GitHub-Run](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39230318561).

**V5.7 – Evolution:** Zwei Gewichtsmutationen/Generationen, zehn Gegner, Holdout in vier Spieler-Strategien (balanced, offensive, guardian, economy), Training/Holdout disjunkt. Insgesamt **1620** Partien. **+12 NPC-Siege** gegenüber bisheriger KI auf den gleichen Holdout-Seeds; mittlerer LP-Vorsprung **+464**. Details einschließlich schlechter Resultate (Gegner IV −1 Sieg) unter `docs/ai-evolved-weights-v57.json`. Keine automatische Freigabe. [GitHub-Run](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39231686016).

- Safetytests: acht Node-Testfälle bestanden; darunter genau zehn Deck-/Budgetstufen, keine verdeckten Karten, legale Fusionspläne, nicht-suizidale Feldangriffe und echte Zugdurchläufe I–X.
- **Interpretation:** Bei Gegner II +6, Gegner V +3, Gegner VII +3 zusätzliche Siege. Das sind *synthetische Vergleichsresultate*, keine garantierten Spieler-Gewinnquoten. Gegner IV war mit den gelernten Gewichten schlechter, so dass ein pauschales Rollout unzulässig wäre.
- Der KI-Kern ist ein **offline optimierter heuristischer Planer**, kein online weiterlernendes neuronales Netz. Die Gewichte verändern sich nicht in Spielerpartien und keine privaten Spielerdaten werden gespeichert.

## Kunst-Import
**Abgeschlossen und überprüft:** Das freigegebene ZIP (`artwork-import/arcane-approved-15.zip`) enthält zehn Schicksalsmonster und fünf Fusionsmonster als individuelle 1086×1448-WebP-Dateien. Der Nutzer hat es am 19.10.2026 hochgeladen. Das ZIP wurde im Repository ohne Änderung des Dateiinhalts auf den erwarteten Pfad umbenannt; der erfolgreiche Import hat alle 15 Bilddateien als lokale Assets angelegt. Dateigrößen und Git-Blob-SHAs wurden für alle 15 Bilder bytegenau mit dem freigegebenen Originalarchiv verglichen.

Folgende vorbereitete Dateien sind nach GitHub committed:
- `tools/import-approved-art-v56.py` prüft und installiert alle 15 Dateien mit genauen Kartenidentitäten und aktualisiert Fate-Cinema, Game und Sammlung.
- `.github/workflows/import-approved-art-v56.yml` verarbeitet das ZIP und committed die Ergebnisse automatisch nach `development`.
- `tests/approved-art-v56.test.cjs` prüft den korrekten Runtime-/Sammlungsbezug nach dem Import.
- `artwork-import/README.md` beschreibt den benötigten Upload.

**Erfolgreicher Import:** [GitHub Actions, Run 39233437669](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39233437669) – exakte Paketprüfung, acht bestehende Artwork-/Sammlungstests und ein neuer 15-Karten-Zuordnungstest bestanden (9/9). Automatischer Commit [`01c3f0b`](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/01c3f0b63b1885134a90956c35791b69770546a6). Der zweite Schicksals-Slot heißt in Fate-, Spiel- und Kinoansicht **Himmlischer Löwenwächter**. Die fünf zusätzlich ersetzten Fusionen behalten ihre IDs 46, 49, 50, 54 und 58.

## Noch offene technische Abnahme
1. Die nun importierten Originalbilder auf reale Spielkarten und mobilem Browser nach Sicht, Ausschnitt und Lesbarkeit prüfen.
2. Trainierte KI gegen manuell gespielte Karriere-/Fusionsstrategien und Lv1-Quest antreten lassen; Archetypen I–X bewahren. Danach selektive Aktivierung für bestätigte Gegner statt unkontrollierter Freigabe.
3. ACE-Häufigkeit, schwierige Lv1-Quest-Übergänge, Spielstandsicherheit und Karriere-Balancing manuell sowie in CI prüfen.
4. Optional `development` nach `main` erst nach ausdrücklicher Freigabe.
