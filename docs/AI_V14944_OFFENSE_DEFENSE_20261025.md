# Arcane Duel – v14.9.44: Angriff gegen Verteidigung, gleicher Planungshorizont

## Ausgangslage
Im erfolgreich abgeschlossenen v14.9.43-Forschungslauf #40177267524 (7.680 Duelle) schnitt die allgemeine defensive Positionierungs-KI 26 Siege schlechter als der unveränderte v14.9.41 2-Ply-Forschungschampion ab; die gezielte Verteidigung elf Siege schlechter. Der Hauptgrund könnte methodischer Natur sein: Der bisherige defensive Positionsalgorithmus verglich lediglich den eigenen Schutz gegen zwei gegnerische Angriffe und berechnete auf dem Angriffsweg keine eigenen Angriffe vor der gegnerischen Reaktion. Dadurch wurde möglicherweise die verlorene Angriffschance unterschätzt. Diese v14.9.44-Studie testet **diese konkrete Hypothese** mit sonst festgehaltenen Taktikkonstanten.

## Fünf festgelegte KI-Strategien
1. `guardian-champion`: historischer Guardian-/Soul-Benchmark.
2. `fusion-postreply-material`: bestehender Material-Forschungs-Champion v14.9.38.
3. `fusion-sequence-2ply`: historisch freigegebener 2-Ply-Forschungschampion v14.9.41, weiterhin als Forschungsreferenz geschützt.
4. `fusion-sequence-defense`: die unveränderte, weniger erfolgreiche allgemeine Positionsverteidigung aus v14.9.43 als explizite negative Kontrollgruppe.
5. `fusion-sequence-tradeoff`: **neue** Angriff-gegen-Verteidigung-Bewertung mit identischer legaler Aktionsfolge für beide Möglichkeiten.

## Tatsächliche Änderung im Spielsimulator
Nur wenn die KI in einer legitimen eigenen Positionierungs-/Guard-Phase ist, keine ausstehende Fusion existiert und sichtbare gegnerische Karten vorhanden sind, untersucht sie eigene Angriffskarten, die noch nicht angegriffen oder die Position gewechselt haben.

**Kontrollweg A – keine Positionsänderung:** Der Forschungsalgorithmus klont den Spielzustand und simuliert bis zu ZWEI eigene legale Angriffe via `attackPlan` und der tatsächlichen `attack`-Spiel-API; danach erhält die Gegnerseite eine Angriffsrunde und darf bis zu ZWEI sichtbare legale Angriffe durchführen. Die öffentliche Feld-/LP-Lage wird bewertet.

**Alternativweg B – legale Positionsänderung:** Für jede passende eigene Angriffskarte wird der Positionswechsel zuerst auf einem Klon durch die tatsächliche `applyAiAction({type:'switch',idx})`-API geprüft und ausgeführt. Anschließend werden nach **derselben** Methode bis zu zwei eigene verbleibende legale Angriffe sowie bis zu zwei gegnerische Angriffe bewertet. Wenn der Wechsel den Kontrollweg um mindestens 115 Utility-Einheiten übertrifft, führt die KI ihn als tatsächliche Spielaktion aus. Andernfalls wählt sie weiter durch die unveränderte 2-Ply-Strategie.

Die vorherige zusätzliche lineare Verluststrafe für aufgegebene Angriffsstärke entfällt **nur im neuen Kandidaten**, weil diese Opportunitätskosten jetzt bereits durch die reale auf dem Klon simulierte Angriffsmöglichkeit erfasst werden. Die frühere defensive Strategie bleibt unverändert, damit ein sauberer Vergleich möglich ist.

### Forschungsmetriken
`defenseTradeoffChecks`: Vergleichssituationen;
`defenseTradeoffOwnAttacks`: legal ausgeführte eigene Klonangriffe;
`defenseTradeoffSwitches`: ausgewählte legale Positionswechsel.
Die alten Metriken (`defenseProbes`, `defenseLegalSwitches`, `defenseChosen`, `defenseReplyAttacks`) laufen unverändert weiter.

Ein höherer Zähler bedeutet **nicht**, dass die Strategie besser spielt. Alle realen Siegzahlen, Fehler/legale Aktionen, Rollen- und Sitzpositionen werden unabhängig geprüft.

## Geplantes Experiment: 7.680 Duelle in 8 Phasen
- Phasen 0–4: 4.800 Paarungsvergleiche auf neuen Deck-/RNG-Seeds, 1.600 TRAIN, 1.600 VALIDATION, 1.600 versiegelter HOLDOUT. Alle fünf Strategien bekommen dieselben Deckfamilien und Sitz-/Startpositionen. Der Arena-LP-Zerfall bleibt in diesen Forschungsphasen ausgeschaltet, damit die historischen Schwellwerte vergleichbar bleiben.
- Phase 5: 960 härteste Level-10-Partien mit symmetrischem LP-Zerfall AUS.
- Phase 6: exakt dieselben 960 Kombinationen/Seeds mit symmetrischem LP-Zerfall AN; Ergebniswechsel werden auf Einzelduellebene geprüft.
- Phase 7: 960 zusätzliche Level-10-Duelle gegen die tatsächlich spielende **eingefrorene 2-Ply-Gegnerpolitik**. Diese Phase darf keine Freigabe oder Q-Gewichtsoptimierung beeinflussen.
- Beide Spielerseiten nutzen den strategischen Forschungsplaner. Der ursprüngliche Guardian-/Soul-Champion, die Materialvariante und die 2-Ply-KI bleiben unverändert.

## Unveränderte Forschungsfreigabe
Ein neuer Kandidat muss auf ausschließlich TRAIN und VALIDATION der Phasen 0–4 mindestens +8 Siege in beiden Splits gegenüber dem Guardian-/Soul-Champion erzielen. TRAIN/VALIDATION dürfen sich auf **keiner** Spielerseite gegenüber der ursprünglichen Referenz verschlechtern. Schwieriges Level-10-VALIDATION darf nicht schlechter sein; andere vordefinierte Gruppen tolerieren höchstens -3 Siege. Holdouts, Zerfall-A/B und direkte H2H-Diagnosen bleiben zur Strategieauswahl tabu.

Der v14.9.41-Forschungschampion `fusion-sequence-2ply` (historische Freigabe aus Run #40137913164) bleibt getrennt von der historischen Guardian-/Soul-Benchmark dokumentiert. Selbst ein Scheitern der neuen Replikation ändert nicht rückwirkend eine alte Forschungsfreigabe. **Keine Änderung an `main` oder der produktiven Gegner-KI.**

## Tactical Q
Die 33 bisher erfolgreich abgeschlossenen historischen TRAIN-only-Läufe v1511 bis v1543 dienen als Lernbasis. Neue Q-Daten und unabhängige Validierung/Bestätigung nutzen getrennte frische Zufallsseeds. Kein historisches oder neues HOLDOUT und keine Phase 5–7 wird für Q als Trainingslabel benutzt. Schlechter bestätigte Updates werden verworfen.

## Grenzen
Dies ist eine beschränkte Vorschau mit höchstens zwei sichtbaren legalen Angriffen je Seite nach der Positionierungsentscheidung. Es werden weder unbekannte gegnerische Karten noch der vollständige Fähigkeits-/Beschwörungszug vorausberechnet; etwa Seelenentzug wird nicht als zusätzliche hypothetische eigene Aktion in der Vorschau simuliert. Die H2H-Gegnerstrategie wird im aktuellen Forschungs-Enginebuild rekonstruiert, nicht als unveränderlicher historischer Binär-Build. Die Ergebnisse sind Forschung, nicht Produktivleistung.

## Implementierung
- `tests/ai-v1544-offense-defense-selfplay.cjs`
- `tests/ai-v1544-offense-defense-aggregate.cjs`
- `tests/ai-v1544-history.cjs`
- `tests/ai-v1544-Q.cjs`
- `.github/workflows/ai-v14944-offense-defense.yml`

## Aktueller GitHub-Lauf
https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40193401889
