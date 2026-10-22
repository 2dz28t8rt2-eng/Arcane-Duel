# Arcane Duel – v14.9: Wächter/Seelenzehrer, Neubewertung nach Beschwörung und Startzug-Zerfall

**Datum:** 22.10.2026 · **Branch:** `development` · **Status:** Forschungsregel technisch implementiert, Tests erfolgreich; noch keine Balancing-Freigabe oder KI-Promotion.

## Korrektur des v14.8.8-Befundes: Seelenzehrer sind keine Solo-Strategie

Der in v14.8.8 gemessene `soul`-Stil gewann 7/24 simulierten Spielen. **Daraus folgt keine notwendige Verstärkung der Seelenzehrer**, weil der Test Skills, Perks und Rollen-Boni beidseitig neutralisierte und folglich die gewollte Wächter-Seelenzehrer-Synergie nicht prüfte.

Nächster valider Curriculum-Vergleich:
- Kontrollgruppe: `guardian`-schwer, `soul`-schwer, jeweils mit legalem 40-Karten-Deck.
- Zielgruppe: Wächter/Seelenzehrer-Mischdecks mit systematisch variiertem Verhältnis (z. B. 60:40 / 50:50 / 40:60, soweit ausreichend reguläre Karten).
- Ergänzende Kontrolle: Predator- und Allrounder-Decks, gleiches Levelbudget, Aufwertungen und Fusionsreserve.
- Fähigkeitenstufen beidseitig aktivieren: erst Rolle und DEF-Gegenschlag, dann Seelenentzug/Heilung, zuletzt Skills/Perks. In jedem Schritt Sitz- und Legalitätsasymmetrien prüfen.
- Metriken: tatsächliche Seelenentzüge, DEF-Heilung und Überleben durch Wächter, Stellung in DEF, Qualität der Fusionen, geerbte Seelenladung, verpasste Aktionen sowie Winrate aus gespiegelt gepaarten Spielen.

## Board-Neubewertung nach abgeschlossener Beschwörung

Im derzeitigen Spiel ruft `runAi` für **jede** Aktion erneut `chooseAiAction` auf. Nach `place` befindet sich die KI in Positions-/Angriffsphasen, und aktuelle Feldbelegung wird neu gelesen. Der Live-Engine-Test im [v14.9-CI-Lauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39753580022) verifiziert, dass die frisch beschworene Karte für Angriffe verfügbar ist und ein später belegtes gegnerisches Feld keinen veralteten Direktangriff erlaubt.

**Noch nicht gelöst:** Dieses erneute Lesen ist **keine hinreichend tiefe taktische Boardanalyse**. v14.8.8 veränderte nur 4 Angriffsentscheidungen und 2 Positionsentscheidungen gegenüber der eingefrorenen KI. Für den nächsten Forschungskandidaten muss **nach der realen Platzierung** zwingend ein eigener legaler Bewertungsdurchlauf folgen:
1. Vollständigen aktuell sichtbaren Boardzustand, Rollen/DEF, ATK, LP, Zerfall, Kampfbereitschaft, Handressourcen und gegnerische Bedrohungen erfassen.
2. Alle legalen positions-/angriffs-/Fähigkeitsoptionen durch die Engine validieren; Angriff-, Positionswechsel-, Seelenraub-, Wächterheilungs- und Endzugoptionen einbeziehen.
3. 1–2 eigene Folgeaktionen und sichtbare gegnerische Antworten kontrafaktisch bewerten; nur eigene bekannte Karten und öffentliches Gegnerfeld verwenden.
4. Explizite Synergiefaktoren für Wächter/Seelenzehrer und Schutz des geladenen DEF-Monsters berücksichtigen; nur tatsächliche, aktivierte Fähigkeiten werten.
5. Den nächstbesten legalen Zug mit erklärbarer Wertzerlegung wählen, nach jeder ausgeführten Aktion **erneut planen**; bei Auswertungslimit/Fallthrough stabile Bestands-KI verwenden.
6. Konkrete Entscheidungsunterschiede, Treffer/Schaden/LP/DEF und Positionen auf identischen Zuständen protokollieren. Keine KI-Promotion ohne unabhängigen Holdout.

## Startzug-Schonfrist: Umsetzung im Experiment

**Vorschlag:** Ein Monster, das im gesamten Duellzug 1 beschworen wird (egal welcher Sitz begonnen hat), erleidet den ersten natürlichen Kreaturen- und Zusatz-Stufenzerfall **erst nach Ende des eigenen Duellzugs 5** statt nach Ende des eigenen Duellzugs 3. Seine gewöhnliche Schonfrist direkt bei der Beschwörung bleibt erhalten. Turn-2-Beschwörungen und spätere Monster bleiben unverändert.

**Umsetzung auf `development`:**
- `assets/game.js`: `createGame({openingDecayGrace:true})` aktiviert den Testschalter nur für PvE. Standard ist `false`. Die ursprüngliche Level-Zerfallsfunktion berücksichtigt den Testschutz.
- `assets/qa-followup-v51.js`: zusätzlicher stufenbasierter Zerfall muss **ebenfalls** die geschützte Runde überspringen; ein erster Regressionstest deckte die fehlende Regel in dieser zweiten Lage auf.
- `tests/opening-grace-postsummon-v149.test.cjs`: Vergleich klassischer und geschützter Versionen, beide Start-Sitze, Turn-2-Karten unverändert, Schutzablauf in Turn 5, PvP ignoriert den experimentellen Flag; Nachbeschwörungs-Boardprüfung.
- `.github/workflows/ai-v149-opening-decay.yml`: [erfolgreicher GitHub-Actions-Lauf #39753580022](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39753580022).

Diese Änderungen **aktivieren den Schutz nicht automatisch in laufenden Duellen** und ändern `main` nicht. Die Forschungsoption ist nicht für gespeicherte Duelle oder produktive PvE-Anwendung freigegeben.

## Was wir noch nicht behaupten dürfen

- **Kein A/B-Winrate-Ergebnis für die Schutzregel vorhanden.** Die technischen Tests beweisen das Timing, aber nicht, dass Spieler 1 und 2 damit ausgeglichen sind.
- Spieler 2 darf schon in Zug 2 angreifen, Spieler 1 in Zug 1 nicht. Der Schutz kompensiert nur eine Zerfallsquelle, nicht zwangsläufig die Angriffstaktung oder Startschutzschilde.
- Die v14.8.8-Zweitzugquote von 116/168 wurde im **alten** symmetrisierten isolierten Modus gemessen. Nicht mit dem Produktivspiel verwechseln.
- Kein selbstlernendes Langzeitmodell, keine tiefere Live-KI und kein neuer KI-Champion wurde allein durch diese Regel implementiert.

## Nächster verpflichtender A/B-Versuch vor einem Produktiventscheid

Beide Arme unter exakt gepaarten Karten, Sitzpositionen, Starterpositionen und RNG-Kontrollen prüfen: `openingDecayGrace=false` gegen `openingDecayGrace=true`. Siegquote tatsächlicher Starter, feste Sitzposition, Monsterüberleben bis Turn 5, Tempo der ersten Angriffe und Zerfallssumme getrennt messen. Zusätzlich mit **Wächter-Seelenzehrer-Mischdecks** und aktivierten Rollenfähigkeiten wiederholen. Nur nach bestandenem Fairness-/Strategie-Gate optional für ein reales Spielupdate vorschlagen.
