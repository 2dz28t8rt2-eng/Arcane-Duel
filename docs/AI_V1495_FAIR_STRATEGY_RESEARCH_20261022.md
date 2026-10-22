# Arcane Duel v14.9.5 – Fairer Strategietest mit aktiven Seelenzehrer-Fähigkeiten

**22.10.2026 · Branch `development` · Release:** ausschließlich isolierte Forschung, **keine KI-Promotion nach `main`**.

**Trainingsworkflow:** [Arcane Duel – v14.9.5 Fair Strategic Learning and Seat Audit](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/workflows/ai-v1495-fair-strategic-training.yml)

## Ziel

Identische Decks und Starthände genügen nicht für ein faires KI-Mirror-Match. Dieses Experiment neutralisiert auch die tatsächlich im Motor verbliebenen einseitigen PvE-/NPC-Mechaniken, die zuvor den Sitzplatz beeinflussten, und behandelt die **offensiven** Seelenzehrer-Fähigkeiten analog zur normalen Angriffssperre.

## Tatsächlich geänderte Spielregeln – nur bei `strategicTraining: {enabled:true,symmetricSides:true,...}`

- Eröffnungsschilde werden auf beiden Seiten entfernt; Arena-LP-Zerfall kann explizit ausgesetzt werden, Kreaturenzerfall bleibt erhalten.
- Forschungs-Cooldown `soulUnlockTurn=Math.max(2,noAttackTurns+1)`: 0 → 2; 2 → 3; 4 → 5; 6 → 7; 8 → 9; 10 → 11. Kein passiver Seelenentzug, LP-Burn oder aktive Seelenraub-Aktion davor.
- Passive Wächter-Heilung, Seelenzehrer-Rollen, DEF-Gegenschlag, Fusionen und Monsterzerfall bleiben auf **beiden** Plätzen aktiv.
- Identische Poker-/Fusionsqualität samt Resonanz und Levelbudget für beide Plätze; kein opponent-only Entfernen der Qualitätsboni.
- Gleiche Angriffsermüdung und Zerfallsraten; keine einseitigen Fusionskunde-, Resilienz-, Kampfdisziplin- oder aktiven Essenzbonus-Effekte.
- Forschungs-Spieler tragen `researchSymmetric`; dadurch greifen bereits **bei der initialen Kartenerstellung** keine Spieler-0-Perks aus `normalRoleBonus` oder dem Wirtschaftssystem. Zusätzlich nullt der Studien-Trainer alle Spieler-Upgraderänge.
- **Neu:** `assets/essence-combat.js` erlaubt dem Forschungs-KI-Controller für **beide Plätze** die realen Aktionsarten `soul-raid` und `soul-discharge`, mit echtem gegnerischem Stat-Verlust, aufgebauter Seelenenergie, 3-eigene-Züge-Raid-Cooldown, genau einem aktiven Seelen-Effekt pro Monster und Zug sowie gemeinsamem Freigabefenster. Die benutzergebundenen Live-UI-Funktionen sind davon vollständig getrennt.
- **Neu:** `attackPlan` in `essence-combat.js` erlaubt defensive Zielauswahl, Last-Bastion-Ausweichen und sicheren DEF-Chip auch auf Platz 0 statt nur auf Platz 1. Eine zusätzliche AI-Gegner-Sonderplanung in `assets/game.js` ist im Forschungs-Symmetrie-Modus abgeschaltet.
- Die Forschungs-Strategie-KI lässt aktive Soul-Aktionen nicht mehr versehentlich durch ihre normale Attack-Suche verschwinden. Beide Plätze verwenden dieselbe verfügbare Aktionsmenge.

Normale PvE-Karriere, PvP, Menü und echte Benutzereingaben erhalten weiterhin ihre vorhandenen Regeln. Der Forschungsmodus lässt sich durch Weglassen des Optionsobjekts reversibel deaktivieren.

## Vergangene nachgewiesene Sitzplatz-Artefakte

Vor den letzten Korrekturen des symmetrischen Angriffplaners gewann der alte `balanced`-Mirror auf Forschungs-Sitz 0 insgesamt 69 zu 20 entschiedene Spiele. Die gezielte Gleichstellung des DEF-Chips reduzierte diese Asymmetrie auf 51 zu 38 (ein zusätzlicher Timeout; 90 Matches). Das ist der eindeutige Hinweis, dass **Aktionsverfügbarkeit/Policy** ebenso relevant war wie Fusionstats oder Skills.

Die Messungen in diesem Abschnitt beziehen sich auf vergangene Versionen. Sie beweisen **nicht**, dass im neuen Stand vollständige Sitzparität besteht; erst der neue v14.9.5-Lauf liefert eine erneute Paarprüfung.

## Neue automatisierte Tests

- `tests/strategic-seat-parity-v1495.test.cjs` validiert aktiven Seelenraub von beiden Forschungs-Sitzen vor und nach exakt derselben Sperre; identische Energie, Statabzüge, Cooldown und erneute Nutzungssperre.
- `tests/strategic-seat-parity-v1494.test.cjs` vergleicht Fusion, LP-/DEF-Angriff, passive Rollenfähigkeiten und Zerfall mit zwei gleich initialisierten Spielinstanzen.
- `tests/ai-v1494-seat-bias-investigation.cjs` führt **360 Mirror-Matches** durch: Starterrichtung, 0/6/10 Aufbauzüge, bisherige vs. symmetrische Forschungsregeln, alte `balanced`- und neue Strategie-Policy. Die vollständigen Resultate werden als JSON gespeichert.
- `tests/ai-v1493-extensive-strategy-replay-training.cjs` führt anschließend sechs Stufen (10, 8, 6, 4, 2, 0) mit je 12 separaten Trainings- und 12 unbekannten Holdout-Decks durch. Je Stufe werden in 4 Varianten beide Starterrichtungen und KI-Sitze gespiegelt. Insgesamt **1.440 Trainings- und 288 Holdout-Spiele**.
- Training aktualisiert die Koeffizienten auf Trainingspartien, bewertet neue Vorschläge erneut auf Trainingsdaten und lässt unbekannte Holdout-Decks ausschließlich zur finalen Evaluation zu. Die Daten speichern nun **wirklich gespielte aktive Soul-Aktionen nach Spielerplatz**.
- Der neue v14.9.5-Workflow erzeugt einen zusammengefassten Bericht samt vollständigen Daten nur dann, wenn alle Regelaudits, das ausgewiesene Sitz-Bias-Kriterium, die 288 Holdouts, die beiden Soul-Aktionsnachweise und die Null-Fehler-Prüfungen bestanden sind.

## Grenzen / ehrliche Freigabebewertung

**Die Spielstärke einer KI und vollständige Symmetrie aller möglichen Spielzustände sind nicht bewiesen.** Der Mirror-Lauf prüft begrenzte Deck-/Seedkombinationen. Manche Herausforderungen, Boss- und Quest-Skripte besitzen ausdrücklich seitenspezifische Sonderregeln und gehören nicht zu diesen freien Forschungsduellen; sie werden nicht umgeschrieben.

Die Attack-Initiative ist inhärent an die wechselnde Zugfolge gekoppelt: Spieler 2 darf im normalen Duellzug 2 zuerst angreifen; bei einer geraden Forschungs-Aufbausperre tritt das Gegenfenster erst ab Zug N+1 ein. Das ist kein versteckter Sitzbonus und darf nicht künstlich gestrichen werden.

Das Replay-Verfahren bleibt explorative **episodische Ergebniszuordnung**, kein nachgewiesenes kausales Lernen aus Alternativzügen. Die produktive Gegner-KI bleibt unangetastet; ihre Übernahme wird separat entschieden.

**Freigabe:** Fusions- und Kampfregel-Spiegelung kontrolliert ✅, beide aktiven Seelenraub-Spielaktionen automatisiert testbar ✅, vollständige spielerplatzübergreifende Generalisierung und Live-KI-Promotion **nicht behauptet**.
