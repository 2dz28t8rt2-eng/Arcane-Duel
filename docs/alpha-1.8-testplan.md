# Alpha 1.8 (development) – Spieltest

Diese Version ist **nur im Entwicklungszweig**. Die öffentliche GitHub-Pages-Seite auf `main` bleibt Alpha 1.7. Vor dem Import eines Teststands: bisherigen Spielstand im Tab **Spielstand → Exportieren** sichern.

## Änderungen dieser Runde

- HUD: direkter Dropladungs-Schalter (orange bei aktiv), Erfahrungsbalken mit Rest-XP, Splitter-Gesamtsumme und ?-Erklärung
- Karten: lesbarere Namen, Levelsterne statt dominanter Levelzahl, Großansicht auch bei rechts markierten Fusionsmaterialien
- Training: „Nochmals spielen“ wird im Endbildschirm für Trainingsduelle gesperrt
- Charakterpacks: Seltenheit deutlich reduziert, „Später fortsetzen“ entfernt; eine Wahl ist beim Öffnen nötig
- Booster: 1, 3, 5 und 10 Karten mit fallendem Preis je Karte; Zehner hat zwei besonders starke Slots
- Werkstatt: geringere Kostensteigerung und günstige **Grundausbildung** (+35 ATK/DEF pro Stufe ausschließlich für ursprüngliche Startmonster, 8 Stufen)
- Stufenübersicht: genaue Belohnungen und kumulierter *relativer* Seltenheitsbonus
- Inhalte: alle 11 Duellanten mit Personennamen, 88 Kernmonster mit abwechslungsreichen Namen; Variation der prozeduralen SVG-Bilder nach Kartennummer
- Kartensammlung und Spielstandformat bleiben über **stabile numerische IDs** kompatibel

## Manueller Testplan – PC und iPhone

- [ ] Startseite auf dem PC und in Safari öffnen; Layout prüfen
- [ ] Dropladungen im HUD an/aus schalten; orange Markierung und Speicherstand prüfen
- [ ] Splitter-? und XP-Balken inklusive Fortschrittswert prüfen
- [ ] Zwei Karten per Rechtsklick / Touch-Fusion markieren; Großansicht links muss letzte markierte Karte zeigen
- [ ] Handfusion einmal durchführen und platzieren; danach darf im selben Zug keine weitere Beschwörung möglich sein
- [ ] Feldfusion inklusive Material-/Fusionsvorrat testen; fehlende Kopie muss eine Meldung bringen
- [ ] Trainingsduell beenden: „Nochmals spielen“ muss deaktiviert sein
- [ ] Turnierduell beenden und „Nochmals spielen“ wählen; testen, ob Fusionsvorrat korrekt neu startet und maximal eine Beschwörung je Zug möglich bleibt
- [ ] Charakterpack öffnen: mindestens eine Karte wählen; keine „Später fortsetzen“-Funktion
- [ ] Booster (1/3/5/10) erwerben; Stückpreise vergleichen, Kartenanzahl und Speicherung kontrollieren
- [ ] Grundausbildung kaufen: nur Startkarten sollen bessere Werte zeigen; altes Export-JSON importieren und vergleichen
- [ ] Spielstand exportieren, Seite neu laden und erneut importieren
- [ ] Kartenbild- und Schriftkontrast bei hellen/dunklen Elementen prüfen

## Offene Punkte

Der vom Tester gemeldete mögliche Wiederholen/Fusionsfehler ist **noch nicht zuverlässig reproduziert**. Ein Schutztest prüft die Beschwörungsbegrenzung; für eine vollständige Fehlerbehebung benötigen wir einen reproduzierbaren Ablauf oder einen gespeicherten Duellstand.

Die Kreaturenbilder sind weiterhin **prozedural erzeugt**. Karten haben stärkere Variationen in Pose, Verzierung und Farbe; für wirklich eigenständige 293 Monsterillustrationen braucht es ein separates Artwork-Projekt. Die Schwierigkeit der späteren Turniergegner sollte nach den neuen Werkstattkosten erneut im echten Gameplay geprüft werden.

## Automatik

`npm test` startet die Node-Tests. GitHub Actions prüft jeden Push auf `development`, veröffentlicht aber **nicht** auf `main`.
