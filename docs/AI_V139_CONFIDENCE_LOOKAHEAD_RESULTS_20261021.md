# Arcane Duel – KI v13.9: Konservatives Lernen und 2-Aktionen-Planung

**Stand 21.10.2026 · Entwicklung `development` · GitHub Actions SUCCESS.**

[Abgeschlossener Trainingslauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39643785644) · [Originalartefakt mit Replay, Bericht und Kandidatengewichten](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39643785644/artifacts/12366512147)

## Aufgabe

Die verworfene v13.8-Trainingsstrategie hatte beim unabhängigen Champion-Mirror-Test nur 17/60 und beim Boss-Test 0/15 gewonnen. v13.9 ersetzt Gewichtsupdates aus isolierten LP-Schwankungen durch **konservativ gruppierte Gegenproben über mehrere Situationen** und ergänzt eine **Engine-gesteuerte Vorausschau für maximal zwei eigene Aktionen im selben Zug**.

## Umsetzung
- Wiederverwendung des bewährten Champions aus `models/ai-selfplay-v136.json`, historische v13.6-/v13.7-Berichte und Abruf der v13.8-Entscheidungsartefakte.
- **84** Trainingsszenarien, davon **81** legale Gegenproben mit identischer Beobachtung am Abzweigpunkt, aber alternativen legalen Aktionen.
- Lernfamilien werden nach Phase und Aktionspaar gruppiert. Parameter nur dann verändern, wenn mindestens sechs vergleichbar klassifizierte Situationen sowie drei entscheidende Ergebnisse vorhanden sind und mindestens 80 % der entscheidenden Fälle übereinstimmen. **Nur eine** train-only Parameteränderung hat dieses Gate passiert.
- Neue Kandidatenbewertung führt eine legale erste Aktion auf einer isolierten Engine-Spielkopie aus. Sie kann anschließend eine notwendige Platzierung oder den nächsten legalen Angriff im **selben Zug** testen; sie simuliert **keine vollständigen folgenden Spielzüge und kein gegnerisches verborgenes Blatt**.
- Auf neuen Seeds/Decks getrennte Mirror-, Boss- und Strategieexperten-Vergleiche. `main`, Spielerbestände, Gegner-KI und Balance unverändert.

## Ergebnis

| Kennzahl | v13.9 |
|---|---:|
| Geprüfte Trainingsszenarien | 84 |
| Echte Entscheidungspaare | **81** |
| Konservativ zugelassene Gewichtsaktualisierungen | **1** |
| Unabhängiger Champion-Mirrorvergleich | **31/60** Siege = **51,7 %** |
| Boss VII/IX/X zusammen | Kandidat **7/15**, Champion **7/15** |
| Gegen offensiven Spezialisten | **13/24** |
| Gegen DEF-/Support-Spezialisten | **13/24** |
| Gegen Fusions-/Material-Spezialisten | **14/24** |
| Ungültige Engine-Aktionen | **0** |
| Kandidat automatisch übernommen | **Nein** |
| Produktive Gegner geändert | **Nein** |

**Bewertung:** Technisch erfolgreicher Trainingslauf und ausgeglichene Leistung gegen den Champion. Ein robust positiver Effekt ist mit nur 31/60 Siegen nicht nachgewiesen; ein neues Modell wird **nicht** promoviert. Die höhere Quote gegenüber v13.8 ist ein Vergleich unterschiedlicher Experimente, **kein** direkter gepaarter A/B-Kausalnachweis.

## Wissenschaftliche Grenzen
- 81 Entscheidungspaare basieren auf einmaligen echten Fortsetzungen; eine veränderte Aktion kann späteren Zufallsverbrauch verändern.
- Gleiche **Aktionsfamilie** bedeutet nicht denselben identischen Ausgangszustand. Gruppiertes Lernen reduziert Rauschen, beweist aber keine optimale Aktion.
- Der Planer sieht maximal **zwei eigene legale Aktionen innerhalb desselben Zuges**, nicht zwei bis drei vollständige Runden. Gegnerische Hand und zukünftige Deckreihenfolge dürfen bei realer Entscheidung nicht ausgeleitet werden.
- Decks sind regelkonforme theoretisch konstruierte Stress-Testdecks, keine garantiert erspielbaren konkreten Sammlungen.
- Der v13.8-Historienabruf wurde in der Workflow-Abstammung geprüft; alte Fehlerstatistik dient weiterhin vorrangig zur Themenpriorisierung.

## Nächste Prüfung – v14.0
1. **Direkter A/B-Planer-Test:** gleiche eingefrorene Gewichte, einmal mit und einmal ohne 2-Aktionen-Planung, gepaart über dieselben Startseeds und Decks.
2. **Mechanikcurriculum erweitern:** Verteidiger-/Seelenzehrer-Heilung, Feldfusion, Pokerboni, Resonanz, ACE, Rollen und Zerfall jeweils mit echten Regelassertionen.
3. **Mehrere unabhängige Folge-Simulationen statt Einzelausgang:** unsichere Signale nicht direkt belohnen; kontrollierte Unsicherheitsintervalle und abgebrochene Plansuche sauber dokumentieren.
4. **Echter 2–3-Runden-Planer** später, ausschließlich auf erlaubter Information über unbekannte gegnerische Züge.
5. **Langfristige Speicherstrategie:** Trainingsbelege rechtzeitig aus Actions-Artefakten übernehmen und versionieren.

**Fazit:** Die sichere Lern-Infrastruktur und eine konkrete 2-Aktionen-Planung wurden getestet; die neue KI spielt im unabhängigen Test etwa so stark wie der Champion. Keine überhastete Übernahme.
