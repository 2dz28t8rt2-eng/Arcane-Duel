# Arcane Duel — Fusion Evolution · Alpha 2.5.2 (Development)

Die stabile Version wird weiterhin über den Branch `main` ausgeliefert. Dieser Entwicklungsstand enthält die spielbare Alpha 2.5, die die bestehenden Spielstände und Karten-IDs berücksichtigt. Vor dem Einspielen bitte einen JSON-Spielstand im Menü exportieren.

## Neue Inhalte

- Gegner I: Burst mit gewöhnlichen Monstern und einer schwachen Fusion. ACE ist eine normale Karte.
- Gegner II: ausgewogener Gegner, defensives ACE und zwei starke Fusionsvorlagen.
- Gegner III: fünf eigene Fusionsvorlagen mit drei Kopien = 15-Karten-Fusionsdeck; ACE ist eine Fusion. Seine neue KI bevorzugt Mehrfachfusionen. Die Stärke wurde anhand zusammenhängender Turniersimulationen angepasst.
- 15 Spezialherausforderungen in drei Kategorien: Verteidigung (Spielerangriffe verursachen keinen LP-Schaden, Gegnerangriffe schon, schnellerer Zerfall), Burst (kein Zerfall und ein Rundenlimit) und Fusion (3 optionale Ziele und risikoreicher Ausstieg). Frühere Herausforderungsmodi bleiben erhalten.
- Einmalige dauerhafte Belohnung für jede vollständig gemeisterte Stufe 5: +3% normale Monster-DEF, +3% normale Monster-ATK oder +1,5% Fusion-ATK/DEF. Davor kleine Essenzprämien nur bei neuen persönlichen Bestleistungen.
- 2–5 echte Fusionsmaterialien statt nur der letzten zwei; Qualitätswertung nach Durchschnittslevel, Materialstreuung, Poker-Kombinationen und Elementharmonie. Eigene Animationen für Fusionen und Kartenplatzierung.
- Zehn eigene ACE-Illustrationen (SVG und WebP) mit thematischen Sonderrahmen; normales ACE und Fusions-ACE eindeutig unterschieden.
- Fusionen tragen einen eigenständigen violett-arkanen Metallrahmen mit Lichtkanten und deutlich markierter Kategorie in Hand, Sammlung, Vorschau und Spielfeld – unabhängig von der Levelrahmenfarbe.
- Alpha 2.5.2: kürzere Wertewurf- und Beschwörungsanimationen, visuelles Kartenausspielen, farblich unterscheidbare Spezialmodi, deutlicher markierte abholbereite Tagesquests. Animationen respektieren „Sofort“ und reduzierte Bewegung.
- Normalmonster per einfachem Linksklick auswählen und durch Klick auf eine eigene freie Zone beschwören.
- 3 passive Quests gleichzeitig, 15 maximal pro lokalem Kalendertag, kleine Essenz- oder Einzelkartenprämien. Zusätzliche Quest- und Challenge-Erklärungen im Spiel.
- Kartenkosten +15%, Booster- und Charakterpackpreise +12% (jeweils auf 5 Essenz aufgerundet).
- Letzte Regeländerungen bleiben erhalten: flachere EXP-Kurve und ACE-Einmalkauf.

## Testen

```bash
npm test
node tests/evolution-journey-run.cjs
node tests/evolution-modes-run.cjs
```

`npm test`: 110 automatisierte Tests, darunter Speichern und Neuladen der Fusions- und Questdaten. Die zusätzlichen Simulationsskripte schreiben JSON-Dateien mit den Ergebnissen in `tests/`.

Zuletzt geprüft: 90 zusammenhängende Turnierläufe I–III mit drei Strategien, 120 Spezialmodus-Simulationen, sowie ein Chromium-Browsertest mit normaler Beschwörung, Challenge-Start und neuer Oberfläche.

## Dateien

- `index.html` startet `assets/evolution.js` nach `assets/game.js` und `assets/expansion.js`.
- `assets/evolution.js` ergänzt Regeln, Moduslogik, Gegner, Quests und GUI als klar abgegrenztes Modul.
- `assets/evolution.css` ergänzt Animationen, Kartendesigns und Challenge-Layout.
- `assets/game.js` enthält einen kleinen Kompatibilitäts-Hook zum späteren Wiederherstellen gespeicherter Alpha-2.5-Duelle.
- `tests/evolution-v25.test.cjs` und `tests/evolution-*-run.cjs` decken Gameplay und Progression ab.

## Visuelle Endprüfung (Alpha 2.5.2)

- Chromium: CSS-Berechnung normaler Rahmen, Fusionsrahmen und ACE-Fusionsrahmen in Hand und Duellfeld überprüft; drei voneinander verschiedene Rahmenfarben und Muster bestätigt.
- Desktop (1440 px) und simuliertes Smartphone (390 px), Herausforderungen, Tagesquests und ACE-Bildpfade sowie animierte Wertewürfe ohne Browserfehler geprüft.
- Funktionaler Browsertest: Gegner-Start, normaler Linksklick auf Handkarte und Platzierung in Monsterzone erfolgreich.

## Bekannte Grenzen

Die Turniersimulationen nutzen drei regelbasierte Testspieler und bilden menschliche Entscheidungen nicht vollständig ab. Ihre Siegraten sind keine Prognose für alle Spieler. Die Fusionsmodus-AI nutzt bisher meist nur das erste der drei Missionsziele, weil sie nicht gezielt auf Quests optimiert. Alle zehn ACEs haben eigene stilisierte SVG-Illustrationen; aufwendige handgemalte Charakterporträts sind noch kein Bestandteil dieser Entwicklungsfassung. Die neue Darstellung wurde mit Chromium auf Desktop- und Smartphone-Breite überprüft. Vor einer öffentlichen Freigabe sollten zusätzlich mobile Geräte und manuelle Mehrfachfusionen ausführlich getestet werden.
