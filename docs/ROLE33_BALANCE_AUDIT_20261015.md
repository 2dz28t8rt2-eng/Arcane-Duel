# Arcane Duel 3.3 · Wächter-, Predator- und KI-Balanceaudit

**Erstellt:** 15. Oktober 2026 · **Branch:** `development` · **Stabiler Branch `main`: unverändert**.

## Implementierte Regeln

1. **Wächter und Seelenzehrer:** Sämtliche normal beschworenen Karten mit der registrierten Rolle `guardian` oder `soul` erhalten **+9 % des regulären Level-Wertebudgets als zusätzliche DEF**. Der Bonus wird hinzuaddiert und nicht vom ATK-Wert abgezogen. Fusionen und Essenzwesen erhalten diesen flachen Grundbonus nicht; ihre bestehenden Eigenmechaniken bleiben separat.
2. **Jagdinstinkt:** maximal fünf käufliche Ränge; je Rang **ATK = 15 + 8 × Monsterlevel**, **DEF = 5 + 2 × Monsterlevel** ausschließlich für normale Predatoren.
3. **Schildwall:** maximal fünf käufliche Ränge; je Rang **DEF = 20 + 8 × Monsterlevel**, **ATK = 5 + 2 × Monsterlevel** ausschließlich für normale Wächter und Seelenzehrer. Diese ATK verstärkt gleichzeitig den Gegenschlag.
4. **Gegenschlag:** Ein in DEF-Stellung angegriffener Wächter/Seelenzehrer fügt dem Angreifer 50 % seiner **aktuellen, auf dem Feld vorhandenen ATK** als LP-Schaden zu – auch bei seiner Zerstörung. Schutzschilde können diesen Schaden auffangen. Die alte Berechnung aus dem unveränderlichen ATK-Kartenwert wurde entfernt. Vorhandene Spezialregeln bei Angriffsimmunität bleiben erhalten.
5. **Normale Levelprogression:** Ab Level 6 zusätzlich je Level **20 ATK und 20 DEF**, kumuliert bis zu +100/+100 auf Level 10. Keine Weitergabe als Grundlage der 3.1-Fusionswürfe.
6. **Monstertraining:** statt maximal +185 ATK/DEF gibt es maximal **+110/+110**; Verteilung auf die zehn Ränge: +35/+25/+15/+10/+8/+6/+4/+3/+2/+2. Bereits gekaufte Ränge bleiben erhalten. Altspeicherstände erhalten eine einmalige Erstattung von **40 % ihrer früheren Monstertraining-Essenzausgaben**; fehlende neue Perk-Felder werden sicher auf Rang 0 migriert.
7. **Gegner-KI ab Turnier IV:** Bewertet aus der aktuellen Fusionsreferenz tatsächlich erwartbare ATK/DEF und berücksichtigt den Preis zusätzlicher Materialien. IV prüft Zweier-, ab V bis Dreier-, ab VII bis Vierer- und ab IX bis Fünferfusionen. NPC-Poker-Qualitätsboni und Zufallswürfe werden nicht künstlich verbessert.
8. **Deckvorschlag:** Bleibt eine neutrale Sortierung nach normalen Basisgesamtwerten. Temporär getestete automatische Klassenquoten erwiesen sich als deutlich progressionsschädlich und wurden **verworfen**. Spieler können Klassen gezielt manuell ausrüsten. Die neuen Klassenperks sind im Fortschritts-/Ausbau-Menü kaufbar und werden für die tatsächlichen Kampfwerte und Kartenansicht berücksichtigt.

## Zahlenbeispiele – normale Stufenmodelle ohne allgemeines Monstertraining

| Level | Predator ATK (ohne Spezialperk) | Wächter DEF (+9 % und Stufenbonus) | Predator ATK mit Jagdinstinkt Rang 5 | Wächter DEF mit Schildwall Rang 5 |
|---:|---:|---:|---:|---:|
| 4 | ca. 480 | ca. 530 | ca. 715 | ca. 790 |
| 6 | ca. 950 | ca. 1.050 | ca. 1.265 | ca. 1.390 |
| 8 | ca. 1.630 | ca. 1.800 | ca. 2.025 | ca. 2.220 |
| 10 | ca. 2.490 | ca. 2.740 | ca. 2.965 | ca. 3.240 |

Diese gerundeten Beispielwerte gelten für typische aus der Werkstatt erzeugte Karten mit den jeweiligen Rollen; bereits existierende individuelle Kartenvarianten können abweichen. Seelenzehrer haben durch ihre 22/78-Verteilung noch mehr Grund-DEF, aber weniger ATK als Wächter.

## Test A: 432 echte Einzelduelle – Rollen und Perkstufen

Quelle: `tests/fusion31-balance-scenarios.test.cjs` / `runRolePerkMatrix`.

Drei **künstlich stark zusammengestellte und kontrollierte** Decktypen (nur Predator, nur Wächter/Seelenzehrer, ausgewogen) gegen IV, VII und X; jeweils 16 gepaarte Seeds bei Rang 0, 3 und 5. **Keine Spielerfusionen**, Gegner dürfen weiterhin fusionieren. Die gemischte Variante verteilt ihr vergleichbares Upgrade-Budget auf beide Spezialisierungen.

| Gegner | Deck/Rang | Siege | Ø Halbzüge | Ø restliche LP | Ø eigene Monster am Ende |
|---|---|---:|---:|---:|---:|
| IV | Predator 0 | 16/16 | 9,88 | 5.702 | 4,94 |
| IV | Predator 5 | 16/16 | 7,50 | 5.802 | 4,00 |
| **IV** | **Verteidiger 0** | **16/16** | **26,25** | **1.525** | **1,81** |
| **IV** | **Verteidiger 5** | **16/16** | **26,38** | **1.828** | **3,25** |
| VII | Predator 0 | 16/16 | 8,00 | 6.837 | 4,00 |
| VII | Predator 5 | 16/16 | 7,63 | 6.838 | 3,81 |
| VII | Verteidiger 0 | 16/16 | 18,94 | 5.938 | 4,44 |
| VII | Verteidiger 5 | 16/16 | 12,44 | 6.723 | 5,00 |
| X | Predator 0 | 16/16 | 7,50 | 9.820 | 4,00 |
| X | Predator 5 | 16/16 | 7,13 | 9.830 | 3,81 |
| X | Verteidiger 0 | 16/16 | 15,19 | 9.240 | 5,00 |
| X | Verteidiger 5 | 16/16 | 12,06 | 9.696 | 5,00 |

Die Siegquoten sind wegen **starker Idealvergleichsdecks** nahezu ausgeschöpft und deshalb kaum trennscharf. Kampfdauer, restliche LP und Überleben der Karten sind hier die nützlicheren Messwerte.

### Der Gegenschlag wurde tatsächlich gemessen

Pro 16 Duelle gegen IV verursachten Verteidiger ohne Schildwall insgesamt **54.370 LP-Gegenschlag aus 412 Treffern**, mit Schildwall-Rang 5 insgesamt **40.784 LP aus 259 Treffern**. Weniger Gesamt-Gegenschlag bedeutet hier **nicht**, dass der Perk die Fähigkeit schwächt: Die Gegner konnten gegen die stärkeren Verteidiger weniger erfolgreiche bzw. überhaupt auslösende Angriffe machen. Die **durchschnittliche Höhe je Gegenschlag** stieg von rund 132 auf rund 157 LP.

Auf VII verringerten sich die Gesamtschläge von 115 auf 85, während die Duellzeit von 18,94 auf 12,44 Halbzüge sank. Auf X sank die Zeit von 15,19 auf 12,06 Halbzüge.

**Wichtige Diagnose:** Auf IV bleibt der rein defensive Spielstil trotz Rang 5 knapp **2,7-mal so langsam** wie Predator; Rest-LP sind vergleichsweise niedrig. Verteidiger überleben mit Schildwall zwar in größerer Zahl, setzen ihren Vorteil aber noch nicht schnell genug in LP-Druck um. Das stützt die Nutzervermutung, dass **eine weitere gezielte defensive Verbesserung oder bessere Defensiv-KI** später notwendig werden könnte. Keinesfalls daraus blind eine weitere pauschale DEF-Erhöhung folgern.

## Test B: 12 längere Karrieren mit legalen Ressourcen

Quelle: `tests/progression-real-inventory-audit.test.cjs`; sechs neue Seeds (101,103,107,109,113,127) × offensiver/ausgewogener KI-Stil.

- Start mit echten Startkarten, drei Trainingssiegen, Turnier I–X; erspielte Coins, Splitter, Booster, Kartenfunde, Level, Werkstatt, Quests und Packbelohnungen.
- Spezialisiertes Einkaufsverhalten investiert bei `offensive` in Jagdinstinkt und bei `balanced` in Schildwall, zusätzlich in allgemeine Perks; 30 Versuche je Gegner, Farmduelle zur Vorbereitung.
- **Bewährte neutrale Deckautomatik** für die Vergleichbarkeit beibehalten. Sie optimiert nicht automatisch für Rollensynergien. Die KI fusioniert weiterhin häufig und beherrscht nicht alle menschlichen taktischen Strategien.
- Vorübergehend getestet und dann verworfen: Auto-Equip anhand ausschließlich hoher neuer DEF oder starrer Rollenquoten. Hierdurch gingen bei einigen Seeds notwendige Kartenkombinationen verloren, und nur 9–10/12 statt 12/12 Testkarrieren kamen bis X. **Diese fehlerhafte Automatik wurde nicht übernommen.**

Die folgende Referenz stammt vom erfolgreichen Teststand **vor diesen verworfenen Auto-Equip-Experimenten**. Nach Rückkehr zu unveränderter Deckautomatik sind die Gameplay-Dateien wieder auf dieser Basis; vor einer Release-Freigabe ist der abschließende vollständige Lauf auf dem HEAD-Commit entscheidend.

| Kennzahl | Generische Ausbaustrategie | Klassenspezifischer Ausbau |
|---|---:|---:|
| Vollständige Karrieren bis X | 12/12 | 12/12 |
| Gesamte Duelle (inkl. Farmduelle) | 1.259 | 1.308 |
| Ø Duelle pro Karriere | 104,9 | 109,0 |
| Ø Versuche Turnier IV | 16,17 | 15,50 |
| Ø Versuche Turnier V | 12,42 | 13,92 |
| Ø Versuche Turnier VII | 8,83 | 8,25 |
| Ø Versuche Turnier IX | 7,58 | 9,33 |
| Ø Versuche Turnier X | 4,83 | 5,17 |

**Erheblicher Progressionsbefund:** Obwohl alle zwölf Testkarrieren das Turnier abschlossen, sind durchschnittlich etwa 100–110 Duelle bis X mit zahlreichen Farmkämpfen ein hoher Aufwand. IV und V bleiben **überproportional harte Engpässe**, VII und IX können ebenfalls kippen. Die Klassenperks verbessern die Resultate **nicht überall**: Spezialisiertes Einkaufen benötigt teilweise mehr statt weniger Duelle. Ursache ist nicht eindeutig nur die Upgradeformel; KI, Kartendrops, Deckzusammenstellung und der Preis spezialisierter Perks interagieren.

## Test C: Regressionen und Spielstandschutz

Getestet werden statische und dynamische Rollenwerte, der Ausschluss von Fusionsvorlagen aus Normalmonsterperks, unveränderte Normalmonster-Fusionsreferenz, Gegenschlag mit abgenutzten tatsächlich vorhandenen ATK, alte Spielstandschemas ohne neue Perkfelder, einmalige 40-%-Essenz-Kompensation, kein erneuter Refund, Upgrade-Kaufkosten, Level-Cap, komplette Duellspielbarkeit sowie Darstellung im Lexikon.

Browser- und vollständige Nodeprüfungen werden über `npm test` und GitHub Actions im Entwicklungszweig ausgeführt.

## Empfehlung vor Veröffentlichung auf `main`

**Implementierung technisch sinnvoll, Balance noch nicht endgültig freigeben.** Entscheidend:

1. Turniergegner IV/V und IX auf **faire Progression** prüfen. Schwierigkeit soll ab IV ansteigen, aber nicht in 15–25 Versuche plus Farmen pro Gegner ausarten.
2. Wiederholte Feldfusionen und die bisherige Test-KI weiter untersuchen: etwa fünf bis sechs Spielerfusionen pro Duell in synthetischen Karrieren, was nicht einem gezielt trainierten Menschen entspricht.
3. Verteidiger sollen nicht nur ein langes LP-Rennen gewinnen: insbesondere **Gegenschlagdruck, DEF-Puffer und Positionslogik** gegen Gegner IV testen. Potenziell ein besseres defensives Angriffskonzept statt weitere DEF.
4. Stärkere Aussage erst mit realistisch handgebauten Predator-, Wächter- und Seelenzehrerdecks sowie gemischten Strategien treffen.
5. Die geplante besondere Mechanik für Level 1 und 2 **erst nach Abschluss und Freigabe der Fusions-/Klassenbalance** aufgreifen.

**Änderungen bleiben ausschließlich in `development`.**
