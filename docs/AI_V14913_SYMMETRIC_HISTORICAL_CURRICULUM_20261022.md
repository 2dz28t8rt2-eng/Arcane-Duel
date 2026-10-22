# Arcane Duel – v14.9.13, symmetrisches KI-Lernen mit historischen Replay-Beispielen

**Branch:** development. **Status:** Forschungsworkflow, keine Änderung der produktiven KI und kein Merge nach main.

## Forschungsdesign

36 unabhängige Teilprozesse mit jeweils 64 vollständigen Duellen = **2.304 Duelle**.
Sechs Deck-Archetypen: Predator, Guardian, Soul, Fusion, Hybrid und Allrounder,
jeweils auf den Levelstufen 7 und 10 und mit drei beidseitig gleichen
Angriffsfreigaben (Runde 0/6/10). Pro Bedingung vier KI-Strategien, beide
Startreihenfolgen und beide Sitze, außerdem vier feste Deck-Szenarien.

In **jedem** einzelnen Duell: Gleiches 40-Karten-Deck, identische Starthand,
gleicher Reststapel, identischer Fusionsvorrat, identische Lebenspunkte
(8.000 im aktuellen Forschungsmodus), identische Perks/Upgrades (neutral), symmetrische Rollenboni.
Keine einseitige Startkartenaufstellung, kein LP-Handicap.

Forschungsabweichung: Arena-LP-Zerfall ist beidseitig deaktiviert; deshalb
sind Ergebnisse nicht ohne weiteren Test auf reale Karriere-PvE übertragbar.

## Aus historischen Trainingsläufen lernen

Die akzeptierte Q-Tabelle aus v14.9.12 beziehungsweise dem letzten
erfolgreichen v14.9.13-Lauf wird verpflichtend wiederhergestellt. Zusätzlich
werden die erfolgreichen GitHub-Actions-Runs 39803691439 und 39843438099
als überprüfbare historische Quellen geladen. Archivierte Trainingsbeispiele
(replayExamples) erhalten eine kleinere Lernrate von 0,045. Frühere
Holdout- und Testergebnisse werden **nicht** als Trainingslabels verwendet.

Eine bei der Kontrolle entdeckte Datenabweichung: Mehrere archivierte
Trainingsbeispiele enthalten wegen eines alten, undefinierten Soul-Werts
nicht-finite Rewards (in JSON null). Betroffene Datensätze werden
vollständig ausgeschlossen und separat gezählt. Auch der aktuelle
Taktikgenerator wurde gegen undefinierte Soul-Energie abgesichert.

Drei Q-Forschungsarme erhalten jeweils 300 frische Updates,
150 separate Trainingsvalidierungspositionen sowie
150 unabhängige Holdout-Positionen.

## Vergleichsstrategien

1. Klassische Heuristik ohne Q
2. Konservatives Q
3. Q mit Beschwörungs-/Fusionsplanung und einer Gegnererwiderung
4. Q mit erweitertem Planer und zwei Gegenerwiderungen

Beide Planer verwenden dieselbe Entscheidungsschwelle (75), um deren
Tiefe besser isoliert vergleichen zu können. Der Aktions- und
Strategieeinsatz wird pro Archetyp protokolliert.

## Methodische Grenze und Roadmap

Die vorhandene Q-Tabelle lernt primär Predator-Angriffe bzw. Passen.
Guardian, Soul, Fusion, Hybrid und Allrounder werden im Vollspiel
ausgeübt und ausgewertet, aber noch nicht vollständig als eigenständige
Q-Aktionen gelernt. Weiterführende Entwicklung: geschlossene
Aktionsräume für Beschwörung, Fusion, Position, Soul-Effekte und
Angriff; Rollouts über ganze Runden und tatsächlich mögliche
Gegenreaktionen; historische Replay-Speicherung mit verifizierter
Herkunft; reale PvE-Holdouts ohne Arena-Sonderregeln.
Keine automatische Übernahme in die produktive KI.
