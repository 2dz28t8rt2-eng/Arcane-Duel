# Arcane Duel v14.9.9 – Predator 10pp Rüstungsdurchschlag + weiterer Lernlauf

**Datum:** 22.10.2026 · **Branch:** `development` · **Live-Spielregel aktiviert**, `main` nicht verändert.

## 1. Predator-Regel im Hauptspiel

- Der offensive Feld-Schwarmbonus aus v14.9.8 bleibt bestehen: je eigenem, lebendem Predator am Feld **+2 % effektiver Angriffsschaden**, maximal +10 %, einschließlich roleOverride-Predator-Fusionen.
- **Neu:** Greift ein Predator einen **Wächter oder Seelenzehrer in Verteidigungsposition** an, durchdringt er **10 Prozentpunkte der DEF-Schadensreduktion**. Der gewöhnliche 35%-Schutz dieser beiden Rollen sinkt bei diesem Angriff auf **25 %**.
- Beispiel: 1000 effektive Angriffskraft gegen ein gepanzertes Wächter-DEF → bisher 650 DEF-Schaden, jetzt **750 DEF-Schaden**. Dabei gibt es **keinen automatischen zusätzlichen LP-Schaden**; geschützte Seelenenergie-/Verdichtungsschichten werden weiterhin in der regulären Reihenfolge abgebaut, und die 50%-ATK-Gegenschlagmechanik bleibt erhalten.
- **Ein normaler Predator in DEF besitzt keine solche Rüstung**, daher löst der Rüstungsdurchschlag gegen ihn keinerlei Zusatzwirkung aus. Auch gewöhnliche ungerüstete Monster erhalten keine zusätzliche Schadenssteigerung.
- Bei einem einzelnen Predator mit 800 Karten-ATK ergibt die Schwarmberechnung 816 effektive ATK, gegen Wächter-DEF mit 25 % verbleibender Rüstung also 612 DEF-Schaden statt 530 ohne Durchdringung.
- Jagdinstinkt und ATK-lastiger Rollenstempel für Predator-Fusionen bleiben eigene, unveränderte Mechaniken; der frühere zusätzlich multiplizierte v5.5-Rudelbonus wurde schon in v14.9.8 vereinheitlicht, **keine doppelte Stapelung**.
- Der 10pp-Penetrationsbonus wirkt im **PvE-DEF-HP-System**; klassisches lokales PvP besitzt keine solche 35%-Rüstung, deshalb wird die PvP-Kampfregel nicht künstlich verändert.
- Das tatsächliche Kampfprotokoll meldet nun **25 % abgewehrten Schaden** statt der veralteten 35 %, wenn ein Predator ein gepanzertes DEF-Monster trifft.
- Reversibler Forschungsmodus kann mit `strategicTraining.predatorArmorPierce = 0 / 0.08 / 0.10 / 0.12` die Durchdringung kontrolliert deaktivieren, um Vergleichsdaten zu gewinnen. Im regulären PvE ist **.10 Standard**.

## 2. Regression

- `tests/predator-armor-live-v1499.test.cjs`: Guardian und Soul, beide Sitze, ungerüstete Predator-Gegner, nicht-predatorische Angreifer, 1–5 angreifende Schwärme, effektiver LP-/DEF-Schaden
- `tests/essence-combat.test.cjs`: vorhandene Wächter-Rüstungserwartung von 35%-Grundrüstung auf den jetzt tatsächlich vorhandenen Predator-Angriff mit 10pp Bypass aktualisiert.
- `assets/evolution.js` und `assets/essence-progression.js`: Anfängerlexikon und Predator-Rollentext aktualisiert.

## 3. Ausgedehnter neuer Lernlauf v14.9.9

[GitHub Actions #39783738386](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39783738386) führt zuerst die tatsächlichen Regeltests aus.

**Gegenfaktik-Lernen:** Drei Arme (0pp, 2%-Schwarm, 2%-Schwarm + 10pp) mit je 450 trainierten und 150 nicht trainierten taktischen Boards. Alle aktuellen Q-Schlüssel berücksichtigen aktive Predator-Schwarmgröße, Zielrolle, HP-Lage und Angriffsstärke im Verhältnis zur gegnerischen Defensive. Die Engine simuliert legale Alternativangriffe und einen sichtbaren Gegnerkonter, nicht nur Spielsiege.

**Gedächtnis:** Der letzte erfolgreiche v14.9.7-Lernstand wird als Q-Koeffizientenquelle eingelesen. Historische Testbeispiele werden **nicht** zum Trainieren verwendet. Der 10pp-Arm kann aus dem 8pp-Forschungszweig für die Schätzung initialisiert werden, trainiert und validiert dann aber auf eigenständigen Daten; Änderungen werden nur bei nachgewiesen nicht schlechterer Trainingsleistung angenommen.

**Vollkampfvergleich:** 1.152 Duelle mit kompletten 40-Karten-Predator-Decks gegen Guardian-, Soul-, Fusion- und Hybriddecks. Die drei Kampfbeginn-Stufen 0 / 6 / 10, beide Starter und beide KI-Sitze sind gesondert enthalten. Vier Vergleichsarme (Kontrolle, Schwarm, Schwarm+Q, Schwarm+Q+10pp) werden sowohl in normalen Szenarien als auch in **bewusst erschwerten Verteidigungsszenarien** geprüft, in denen zu Beginn zwei tatsächliche Karten aus dem gegnerischen 40-Karten-Deck nach DEF verschoben werden. Das ist ein ausdrücklich benannter, kontrollierter Handicap-Test, **keine Behauptung regulären Startzustands**.

Der Q-Aktionswert-Lerner ist ein ergänzendes strategisches Forschungssystem, nicht die bereits live geschaltete Gegner-KI. Das Produktionsspiel besitzt den nun implementierten Predator-Bonus, der Trainer liefert Lern- und Balancekenntnisse. Eine automatische Übernahme von Q-Gewichten in `main` ist nicht vorgesehen.

**Kriterien:** keine frühen Soul-Effekte, keine ungültigen Aktionen, tatsächliche aktive Q-Aktionswahlen, separater Holdout, Bilanz nach DEF-Stress und beide Sitzpositionen. Daten liegen nach dem tatsächlichen Abschluss im [Trainingsworkflow](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39783738386); hier keine vorab erfundenen Kennzahlen.
