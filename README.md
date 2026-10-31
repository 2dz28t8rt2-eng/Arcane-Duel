# Arcane Duel 1.0.0

**Offizielle Spiel- und Serverversion: 1.0.0 = bisheriger interner Stand v22.9.** Keine neuen v22.x-Arbeitsversionsnummern, keine `-dev`-Beinamen in der Oberfläche. Die stabile ältere Version liegt auf Branch `main`; der aktuelle Entwicklungsstand wird auf `development` geprüft. Versionskonzept: [docs/SINGLEPLAYER_VERSIONING.md](docs/SINGLEPLAYER_VERSIONING.md). **Das reguläre Turnier I–X ist auf LV 10 begrenzt.** Level 11/12 bleiben für eine spätere Post-Turnier-Erweiterung zurückgehalten und sind in den derzeitigen aktiven Karten- und Werkstattpools nicht zugänglich. Technische ID-Reservierungen bleiben zur Konsistenz bestehen. Vor großen Updates empfiehlt sich ein JSON-Spielstandexport.

**Historischer QA-Stand (15.10.2026):** 227 automatisierte Node-Tests grün, beide GitHub-Workflows erfolgreich und 216 synthetische Level-10-Vergleichsduelle gegen VIII–X. Dieser ältere Prüfstand ist kein aktueller KI-/Progressionsbericht. Die vollständige mobile Touch-Abnahme ist weiterhin separat zu prüfen.

Siehe [Turnier-LV10- und QA-Bericht](tests/TOURNAMENT_LEVEL10_QA_20261015.md) für Änderungen, Testmethodik, Siege nach Spielweise und verbleibende Aufgaben.


## Aktueller KI-Lernstand und nächste Schritte (19.10.2026)

Der KI-Trainingsstand **v7.5**, die offenen Fairnessfragen bei Gegner VIII/X und die geplanten nächsten Arbeiten sind versioniert dokumentiert:

- **[Priorisierte KI- und Progressions-Roadmap](docs/AI_TRAINING_ROADMAP_20261019.md)** – v7.5-Lernstand, Messwerte, rechtmäßig erspielte Karrieren, Voraussetzungen für weiteres Training und Auftrag für v7.6.
- [Gesamte Arcane-Duel-Roadmap](docs/ARCANE_ROLLEN_SWARM_WERTEBUDGET_ROADMAP_20261017.md) – inklusive P0–P4 KI-Prioritäten.
- [Designentwurf zur Levelreform](docs/progression-rework-design-20261019.md) – **Konzept, nicht aktiv**, Entscheidung globaler Levelaufstieg versus individuelle Erfahrung offen.

**Nächste Priorität:** tatsächlich erworbene Karten von legal freigeschalteten und ausgerüsteten Karten unterscheiden, danach bessere, vollständig eigentumslegale Karriere-Deckbuilder und mehrere unabhängige Karrieren trainieren. Die experimentelle stärkere VIII-KI ist aus Fairnessgründen **nicht freigegeben**; die Gegner-KI lernt nicht automatisch aus Live-Matches. `main` wird ohne Abnahme nicht verändert.

---

## Historische Versionsnotizen: Fusion Evolution · Alpha 2.5.2

Die folgenden Abschnitte dokumentieren frühere Entwicklungsstände und Testergebnisse; sie ersetzen nicht den oben verlinkten aktuellen QA-Bericht.

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

Historischer Stand: damals 110 automatisierte Tests. Der aktuelle 3.0-Stand umfasst 227 Tests; siehe verlinkten QA-Bericht. Die zusätzlichen Simulationsskripte schreiben JSON-Dateien mit den Ergebnissen in `tests/`.

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


## 3.0 Artwork-Integration · 60 Motive

Die Development-Vorschau beinhaltet 60 eigens erstellte Monsterillustrationen aus sechs Produktionswellen, als kompakte WebP-Dateien. Weitere Karten nutzen weiterhin den prozeduralen SVG-Generator. Die vorhandenen 324 Karten-IDs und Kampfwerte sind unverändert; Manifest-Gestalten teilen dieselbe Illustration. Die neue Galerie ist über den Link »Monsterlexikon 3.0« im Spiel erreichbar. Der weiße Drache ist für den späteren Ausbau vorgesehen.
