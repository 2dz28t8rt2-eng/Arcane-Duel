# Arcane Duel – Seelenverzehr, Rollenprägung und Fusionskino

**Stand:** 15. Oktober 2026 · **Branch:** `development` · `main` bleibt unverändert.

## Gameplayänderungen

### Seelenverzehr als defensive Offensive
- Jede Seele in DEF-Position absorbiert beim Beginn ihres eigenen Zuges weiterhin echte ATK/DEF von gegnerischen Feldmonstern.
- Jeder erfolgreiche Entzug löst nun unmittelbar **Seelenbrand** aus: **135 % der tatsächlich entzogenen ATK+DEF**, aber maximal **45 + 42 × Seelenzehrerlevel LP-Schaden je Seelenzehrer und Auslöser**. Der normale Schild-/Schadenspfad gilt; kein Schaden ohne echtes Entzugsmaterial.
- Gespeicherte instabile Seelenenergie verliert beim Zerfall **32 %** (statt 45 %); nur **35 % der verfallenden Energie** wird nun als LP-Burn beim Gegner ausgelöst. Dies reduziert verzögerten passiven Schaden, während direkter Seelenbrand taktisch wichtiger wird. Es handelt sich nicht um Selbstschaden.
- **Aktive Entladung:** Jedem eigenen Seelenzehrer in DEF-Position mit mindestens 40 gespeicherter Energie steht einmal pro eigenem Zug die Entladung zur Verfügung. Der gesamte gespeicherte Wert wird dabei verbraucht und verursacht **110 %** als LP-Schaden. Vorher war diese Aktion auf Elite- oder Wächterkombinationen beschränkt und hatte 85 % Effektivität. Verdichten ist die defensive Alternative.
- Das Benutzerhandbuch und die Schaltfläche wurden angepasst. Änderungen gelten nur für das PvE-Essenzkampfsystem, nicht für klassisches PvP.

### Rollen werden **vor** den Fusionswürfen eingeprägt
- Die bekannte Regel zur Rollenvererbung aus mindestens drei Materialien bleibt erhalten: deutlicher Predator-Überhang → Predator; Verteidigerüberhang → Wächter oder per bekannter, gedeckelter Chance Seelenzehrer; absichtlich gebaute Verteidiger-Feldfusion mit mindestens drei Feldverteidigern → Seelenzehrer.
- Die bisher nachgelagerte **Doppelmodifikation** der Endwerte entfällt. Stattdessen wird schon die durchschnittliche Normalmonster-Referenz vor jedem 88–112-%-Wurf nach Klassenprofil verschoben:
  - Predator: ATK × **1,20**, DEF × **0,75**
  - Wächter/Seelenzehrer: ATK × **0,75**, DEF × **1,25**
  - Andere Rollen: normale Referenz
- Die Qualität der Pokerkombination bleibt als Faktor auf die Wertebasis aktiv. **Der beste gemeinsame ATK+DEF-Wurf gewinnt**; alternative Würfe werden nicht addiert. Danach folgen die realen Material-ATK-/DEF-Boni und der Fusionsermüdungsabzug.
- Das Fusionsvorschau-Modul und die ab Turnier IV verbesserte Gegner-KI berücksichtigen die geprägten Rollenwerte. Materielle Eigenschaften und Würfelwahrscheinlichkeiten werden nicht künstlich verändert.
- Der geerbte Rollentag bleibt **nur auf der konkreten Fusionsinstanz**, nicht im Katalog, und wird bei gespeicherten / fortgesetzten Duellen mit kontrollierter Metadatenvalidierung wiederhergestellt.

## Die neue tatsächliche Fusionsanimation

Die neue Szene ist eine **laufende CSS-/JavaScript-Animation**, keine statische Illustration. Sie läuft bei aktivierten Animationen:
1. Bis zu fünf reale Materialkarten werden im Ring gezeigt und verschmelzen zur gewählten Fusionskarte.
2. Ein schwerer, farblich zur Rolle passender, beschrifteter **Predator- / Wächter- / Seelenzehrer-Stempel** schlägt von oben auf die entstandene Karte.
3. Die tatsächliche **Wertebasis samt Rollenfaktoren** wird angezeigt; jede der bis zu sieben tatsächlich berechneten ATK-/DEF-Würfelpaarungen scrollt mehrere Ziffern durch und wird dann mit einem separaten kleinen Stempel auf ihren gespeicherten Wert fixiert.
4. Die **besten Wurfwerte** werden markiert. Eine echte schriftliche Rechenaufstellung zeigt **Bester Wurf + Materialbonus − Abzug = finale ATK / DEF**. Alternative Würfe werden nicht fälschlich summiert.
5. Die Zahlen werden in die Karte eingezogen, die finalen Werte kurz eingeblendet und die Karte fliegt – wenn ein Ziel auf dem realen Spielfeld vorhanden ist – auf ihre **tatsächliche Feldzone** zu. Anschließend bleibt der kleinere Rollentag in der Kartenansicht sichtbar.
6. Handfusionen zeigen die ganze Enthüllung **nach der Zonenwahl**, gezielte Feldfusionen direkt nach dem bestätigten Zusammenführen. Die alte Vorschau mit endgültigen Werten **vor** der Feldplatzierung bleibt unterdrückt.
7. **Animationen aus** und `prefers-reduced-motion` überspringen die ganze Szene. Die zugrundeliegende Würfelberechnung und Spielstärke bleiben identisch.

Werte-Reels nutzen nur kosmetische Zahlensequenzen **1–9**, nie neue Zufallswürfe der Engine. Die Werte der Zeilen werden aus dem bereits feststehenden `rollTrace` und `rollMath` gelesen. Die Cinematic kann darum keine Duellwerte nachträglich verändern.

## Umfangreiche Tests und vorläufiges Balancing

### Isolierte Klassen-Szenarien
Reproduzierbarer Test in `tests/fusion31-balance-scenarios.test.cjs`: **216 Duelle** (3 Gegner IV/VII/X × je 12 gleiche Seeds × drei Klassen Predator, Wächter/Seelenzehrer, reiner Seelenzehrer × Perkrang 0/5). Keine Spielerfusionen; Idealtestdecks, nicht aus wirtschaftlicher Karriere. Alle drei Varianten nutzen dieselben Seeds.

| Gegner | Predator Rang 5 | Nur Seelenzehrer Rang 5 | Nur Seelenzehrer Rang 0 |
|---|---|---|---|
| IV – Siege | 12/12 | 9/12 | 9/12 |
| IV – Ø Halbzüge | 7,50 | 16,83 | 19,17 |
| VII – Siege | 12/12 | 12/12 | 12/12 |
| VII – Ø Halbzüge | 7,17 | 17,25 | 19,92 |
| X – Siege | 12/12 | 12/12 | 12/12 |
| X – Ø Halbzüge | 7,00 | 17,50 | 21,58 |

Reine Seelenzehrer auf Rang 0 verursachten bei Gegner X in 12 Duellen durch unmittelbaren Seelenbrand insgesamt **31.426 LP** (durchschnittlich ca. 2.619 je Duell). In der vorherigen Fassung mit 90-%-Seelenbrand waren es **21.902 LP**. Das ist rund **43 % mehr direkter LP-Schaden**, aber die Kampfdauer sinkt nur von 22,17 auf 21,58 Halbzüge. **Die Test-KI nutzt die aktive Entladung nicht taktisch**; bewusstes menschliches Spielen könnte stärker sein. Der Vergleich ist nur ein Diagnosehinweis, keine echte menschliche Siegwahrscheinlichkeit.

### Karriereprogression
Die Tests `tests/progression-real-inventory-audit.test.cjs` spielen jeweils **12 komplette erspielte Inventarkarrieren** (normale und auf Rollenperks spezialisierte Investitionsstrategie). Gegenüber der früheren Fusion-3.1-Berechnung verschieben sich die Ergebnisse durch vorgerollte Rollenverteilung und die bessere Gegner-KI deutlich. Im aktualisierten Lauf mit rollenbewusster Gegner-KI erreichten **10/12 allgemeine** und **10/12 spezialisierte** Karrieren Gegner X. Zwei allgemeine Karrieren blieben bei Gegner V beziehungsweise IX hängen; zwei spezialisierte bei Gegner V (je maximal 30 Turnierversuche). Die Karrieren benötigten durchschnittlich **88,3 Duelle** mit allgemeinen beziehungsweise **95,3 Duelle** mit spezialisierten Investitionen. Reproduzierbarer Lauf: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/38793672259

Das bleibt ein wichtiger **offener Balancefehler / Progressionsrisiko**. Keine pauschale Veröffentlichung auf `main` ohne erneute Prüfung. Die 30-Versuche-Schranke und Farmduelle sind Simulationsentscheidungen, keine Spielregel. Normale, auf starken ATK/DEF basierende Auto-Equip-Vorschläge und die begrenzten simulierten Fusionen bilden menschliche Deckstrategien nicht vollständig ab.

### Qualitätssicherung
- Automatisierte Regressionen für Rollenverschiebung vor dem Wurf, exakte Finalwert-Gleichung, würfelsicheres Wiederladen, tatsächliche Seelenbrand-LP-Schäden bei fünf gleichzeitigen Seelenzehrern sowie niedrigstufige Entladung.
- Chromium-Browser-Smoke-Test führt die tatsächliche Stempelanimation im DOM aus und prüft ihre saubere Auflösung.
- Bestehende RPG-Karten-IDs, Profile, PvP-Kampfregeln, Fusionsdeckressourcen und normaler Monsterzerfall bleiben erhalten.

## Offene Punkte
1. **Turnier V und defensive Siegstrategie** gezielt wiederholt testen, da eine bessere Seelenbrand-Stärke den Abstand zu Predatoren im Vergleich nur begrenzt schließt.
2. KI-Steuerung für **gezieltes Entladen** und bewusstes Positionieren defensiver Monster fehlt in den automatischen Karriereverläufen. Die Bedienung ist für menschliche Spieler vorhanden.
3. Die besondere Level-1/2-Deckidee wird erst nach abgeschlossener Fusion-/Rollenbalance besprochen.
4. Die neue Fusionsszene sollte zusätzlich von einem Menschen auf Desktop und Mobilgerät auf Bildausschnitt, Tempo und visuelle Lesbarkeit geprüft werden.

**Keine Veröffentlichung auf `main`.**
