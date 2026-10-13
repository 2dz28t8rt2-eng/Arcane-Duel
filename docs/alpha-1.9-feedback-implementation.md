# Arcane Duel — Alpha 1.9 DEV: Spielgefühl und Progression

Diese Iteration liegt **nur im Branch `development`**. Die öffentliche GitHub-Pages-Seite auf `main` bleibt auf Alpha 1.8, bis der Nutzer eine Freigabe erteilt.

## Belohnungen und Gegnerkarten

- Erster Turniersieg über einen noch unbesiegten Gegner: Dropladungen auf maximale Kapazität auffüllen; Wiederholung gibt weiterhin nur die normale Belohnung.
- Freie Duelle: Charakterkarten zeigen aktuelle Automatik-Beute und die erwartete Kartenchance; bei aktivierter Ladung orangener, dezent animierter Rand. Die Anzeige reagiert direkt auf den HUD-Schalter.
- Direkt in der Gegnerkarte: Anzahl verfügbarer Charakterpacks und Schnellöffnung eines Packs.
- Erst-Turniersieg: auffällige zusätzliche Ergebnisbox erklärt die beiden bisher garantierten Spezialkarten (Fusion und normal beschwörbare Gestalt), zusätzliche Splitter, Essenz, volle Ladungen und den Ace-Shop.
- Nach erster Turnierniederlage: grobe ATK-Schätzung des gegnerischen Acemonsters; optional ein zusätzlicher Essenz-Hinweis.

## Ace-Karten

- Ein eigener, sichtbar abgesetzter Bereich im Booster-Shop schaltet sich pro besiegtem Turniergegner frei.
- Pro Gegner **eine einmalige Direktkaufmöglichkeit** einer schwächeren, normal beschwörbaren Ace-Karte.
- Die Preise sinken mit dem Spielerlevel; die Karte ersetzt nicht die bestehende kostenlose Fusion beim Turniersieg.
- ACE-Bonuskarte erscheint **erst nach dem ersten Kauf** in käuflichen Boostern, je Slot mit 0,35 % Wahrscheinlichkeit.
- Die zehn neuen Karten-IDs werden **vor** der Profilvalidierung angelegt. Vorhandene IDs 0–313 bleiben unverändert.
- Spielstände speichern gekaufte ACEs, Hinweise, Niederlagen und den Handbuchstatus im bestehenden lokalen JSON-Format.

## Einsteigerführung, Texte und Fusion

- Acht visuelle Kapitel im Duellantenhandbuch, mobil als scrollbare Einzelseiten; beim ersten Start offen und später im Lexikon erneut erreichbar.
- Kleine Hilfe-Popups mit Schließen über ESC; Hover-/Fokus-Hinweise für Dropladungen.
- Menüs: „Freie Duelle“, „Skills & Perks“, mehr lesbare Beschreibungen, „Fusionskarten“ statt „Fusionskopien“, Bestandssprache in Spieleransichten.
- Fusionsvorschau: Verstärkte ATK/DEF-Basiswerte, 94–106 %-Bereich **pro Wurf**, Anzahl Versuche und Best-of-Regel. Materialboni werden in 20-Punkte-/10-Punkte-Blöcken sowie mit Zufallsverteilung erklärt.
- Auf der Vorschaukarte selbst steht eine **als solche gekennzeichnete Werteschätzung**, nicht nur der unverstärkte Ausgangswert.
- Leertaste startet ein Duell, wenn der Startdialog aktiv ist und keine Eingabe bearbeitet wird.

## Balancing und Kampfgefühl

- Anfänger-XP-Bonus, der bis Spielerlevel 10 graduell auf null fällt. Die quadratischen Levelgrenzen bleiben kompatibel.
- Trainingsroutine: Stufenpreise 100 / 180 / 300 / 480 Essenz.
- Neuer automatischer Zerfall: Fusionen beginnen bei −50 ATK/DEF, pro überlebtem eigenen Zug sinkt die Rate um 5 bis mindestens −20. Gewöhnliche Monster beginnen bei −30, Startkarten bei −20.
- Jeder überlebte ausgeführte Angriff führt zusätzlich zu −30 ATK. Diese Ermüdung wirkt **nach** der bereits berechneten Schadensausführung.
- Visuelle Trefferpartikel, fliegende Schadenszahlen, Schütteln beim Einschlag und magische Fusionskreise. „Sofort“-Animationen und reduzierte Bewegungen werden berücksichtigt.
- Die 4.000 LP im Normalmodus und bestehende Turniergegner-Schwierigkeiten wurden ansonsten bewusst nicht verändert.

## Qualitätssicherung

Die Tests umfassen Node-Regressionsprüfungen, 130 simulierte Duelle, 1.980 Charakterpack-Konstellationen, echten Chrome-Kartenlayout-Test (Desktop/Mobil), Erststart-Handbuch-Rendering und einen interaktiven Chrome-Test für Handbuch, Boostschalter, Pack-Schnellöffnung, ACE-Kauf sowie Leertaste.

**Unverändert offen:** Der gelegentlich gemeldete Endlosfusionsfehler nach einem wiederholten Turnierduell wurde auf ausdrücklichen Wunsch noch nicht gezielt untersucht. Bei der kommenden manuellen Testrunde gesondert reproduzieren.

## Manuelle Prüfliste

- [ ] Alten Spielstand als JSON sichern und in DEV importieren; auch danach erneut laden
- [ ] Freie Duelle: Dropladung an/aus, Effekt und Beutezahlen prüfen
- [ ] Packs direkt öffnen und nach einem Neuladen wiederfinden
- [ ] Erst-Turniersieg: Zusammenfassung und voller Ladungsvorrat
- [ ] Nach einer Niederlage: Acemonster-Hinweis und optionaler kostenpflichtiger Hinweis
- [ ] Ace-Karte einmal kaufen, im Deck ausrüsten, nach Neustart noch besitzen
- [ ] Fusion: Prognose und danach tatsächlich ausgewürfelte ATK/DEF vergleichen
- [ ] Neuer Zerfall bei langen Duellen und zusätzliche ATK-Ermüdung nach Angriff
- [ ] Kampfanimationen auf iPhone Safari und Desktop testen, einschließlich ESC und Leertaste
- [ ] Handbuch vollständig durchblättern, schließen und im Lexikon erneut öffnen
