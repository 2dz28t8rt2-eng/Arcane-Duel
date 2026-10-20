# Konzept – Turnierevolution statt zehn separater Sammelstufen

**Status: ENTWURF, NICHT implementieren ohne Freigabe.** Das bisherige Levelsystem und sämtliche vorhandenen Saves bleiben bis zu einem beschlossenen Migrationspfad unverändert.

## Zielbild
Normale Monster werden künftig grundsätzlich als **Lv 1/2/3/4/5** gesammelt. Lv1 bleibt wegen Floating/Schwarm/Ressourcenmechaniken immer bei Lv1. Die übrigen vier Basisränge entwickeln sich turnierweit in fünf Stufen weiter und erreichen nach dem zehnten Gegner **Lv 7/8/9/10**.

| Turnierabschluss | ursprüngliche Lv1 | Lv2 | Lv3 | Lv4 | Lv5 |
|---|---:|---:|---:|---:|---:|
| Start | 1 | 2 | 3 | 4 | 5 |
| II | 1 | 3 | 4 | 5 | 6 |
| IV | 1 | 4 | 5 | 6 | 7 |
| VI | 1 | 5 | 6 | 7 | 8 |
| VIII | 1 | 6 | 7 | 8 | 9 |
| X | 1 | 7 | 8 | 9 | 10 |

**Vorgeschlagene Ableitung:** `effectiveLevel = baseLevel===1 ? 1 : Math.min(10,baseLevel+Math.min(5,Math.floor(highestTournamentCleared/2)))`. Es handelt sich um eine **globale Freischaltung** der bereits gesammelten Monsteridentitäten, nicht um zusätzliche Kartenkopien. Die Spielerstufe/EXP darf dafür nicht als zweiter Modifikator missbraucht werden.

## Kritische Regeln vor Umsetzung
- Die **Karten-ID** bleibt die Monsteridentität. Das neue effektive Level ist ein berechnetes Attribut, nicht eine neue Karte. Dazu braucht es migrationssichere Stamm-/Varianten-IDs.
- ATK/DEF müssen dem **neuen Levelbudget** und dem Rollentag entsprechend neu skaliert werden. Alte Upgrades, Qualitätswürfe und Power-Perks müssen separat und nur einmal gerechnet werden.
- Ein Duell speichert sein effektives Startlevel samt Werteschicht; ein erneuter Browserstart darf ein bereits begonnenes Duell nicht rückwirkend stärker machen.
- Pokerfusionen erhalten einen klaren Levelbudget-Plan: Sollen nur normale Monster wachsen? Sollen aus Basislevel 5 vorbereitete Fusionen auch automatisch wachsen? Was passiert mit vorab gespeicherten/ausgerüsteten Lv6–10-Fusionen? Das ist vor einer produktiven Migration zu entscheiden.
- Gegner entwickeln sich pro Turnierkapitel unabhängig von bereits gegrindetem Spielerfortschritt; ein Sieg auf Stufe X soll nicht jede frühere Begegnung trivialisieren.
- Booster enthalten **Monsteridentitäten**, nicht die bisher mehrfach existierenden Lv2–10-Varianten. Es dürfen keine erworbenen höheren Karten/Verstärkungen/Decks ohne Erstattung und klare Zuordnung verschwinden.
- Lv1-Quest, Lv1-only-Fusionen, Geisterfelder und Lumiras Fähigkeiten bleiben vom allgemeinen Entwicklungsbonus ausgeschlossen.
- ACE-/Schicksals-/Essenzkarten bleiben zunächst gesondert definiert. Keine globale Stufe-+5, bevor sie explizit balanciert wurden.

## Entscheidung zur Besprechung
1. **Globales Turnierniveau** (alle bereits gesammelten normalen Monster entwickeln sich bei Turniersieg II/IV/VI/VIII/X) oder individuelles Monstertraining pro Karte?
2. Entwickeln sich **Fusionen/ACEs** ebenfalls automatisch oder nur normale Monster?
3. Sollen bereits gesammelte Stufenvarianten als Sammler-/Verbesserungskopien angerechnet oder in eine Ressourcenrückerstattung umgewandelt werden?

## Empfohlene Umsetzung in Phasen
1. Simulator/Balance-Matrix mit Gegner I–X und Spieler-Basiskarten Lv1–5. Mindestens 1.000 Duelle nach Rollen-/Deckmix, Verteidigerseelen-Synergien und Fusionskombos simulieren.
2. Legacy-Saves exportierbar und Migration reversibel; keine bestehende Card-ID löschen.
3. Optionale Entwicklung zunächst hinter einem Entwicklungs-Featureflag; 1v1-Turnier, Lv1-Fanatiker und 2v2 ohne Rückwirkungen.
4. Kunst-/Kartenvorschau zeigt **Basislevel → aktuelles Entwicklungslevel** und die verbleibenden Turniermeilensteine.
5. Erst nach geprüften Migrations-/E2E-Tests in main übernehmen.
