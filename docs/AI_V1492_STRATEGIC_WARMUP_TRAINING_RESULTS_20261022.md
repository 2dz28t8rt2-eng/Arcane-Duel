# Arcane Duel v14.9.2 – Strategischer Boardaufbau mit gesperrter Kampfphase

**Stand:** 22.10.2026 · **Branch:** development · **Run:** [#39760289724](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39760289724) (`success`) · **Originale Trainingsdaten:** [Artifact #12418170256](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39760289724/artifacts/12418170256)

## Ziel

Statt kurzfristige Aktionen in normalen Kämpfen isoliert zu bewerten, trainieren wir den Aufbau eines konkurrenzfähigen Boards vor der ersten Offensive. Die Dauer der symmetrischen Aufbauphase wird stufenweise von **10 über 8, 6, 4, 2 bis 0 globale Duellzüge** verkürzt. Ein voller 5er-Boardaufbau ist bei 10 globalen Zügen vor dem Kampf möglich, und bei normalen Beschwörungen entstehen so fünf eigene Aufbauturns pro Seite.

## Forschungsspezifische Regeln, ausschließlich per `createGame({ strategicTraining: {...} })`

- `enabled: true`, `noAttackTurns` ausschließlich 0, 2, 4, 6, 8 oder 10 und `disableArenaLPDecay: true`, **nur PvE**. Normale Spiele und PvP erhalten keine dieser Regeln.
- Normale Monsterangriffe bleiben bis Ende des angegebenen *globalen* Duellzugs gesperrt. Außerhalb dieses Modus bleibt das vorhandene Angriffsfenster (ab globalem Zug 2) **unverändert**.
- Der Arena-Zerfall auf Spieler-LP wird nur im isolierten Modus ausgeschaltet. **Monsterzerfall bleibt aktiv**; eine frühe starke Beschwörung hat deshalb reale Kosten.
- **Offensive Wächter/Seelenzehrer-Fairness:** Alle aktiven und passiven Seelenzehrer-Angriffe, statbasierter Seelenentzug und daraus resultierender LP-Burn bleiben aus, bis *beide Spieler drei eigene Züge* absolviert haben **und** die Kampffreigabe erreicht ist. `soulUnlockTurn=Math.max(7, noAttackTurns+1)`. Dies betrifft zusätzlich `condense`, `discharge`, `soulRaid` und `chooseDrain`. Wächter-Heilung bleibt im Test verfügbar.
- Starter und Politiksitze werden auf identischen 40-Karten-Decks, identischen fünf Starthandkarten und identischem verbliebenen Deck sowie Fusionsvorrat gespiegelt. Eröffnungsschilde und Aufwertungen sind neutral; **die regulären Rollen samt aktiver Defensiv-/Seelenzehrer-Mechanik bleiben aktiviert**.
- Kein Anfassen von `main`, kein automatischer KI-Champion-Wechsel.

## KI: neue echte Verhaltenswahl statt reiner Rechenkontrolle

In `tests/ai-v1492-strategic-warmup-curriculum.cjs` vergleicht der Kandidat mehrere eigene legale Beschwörungen sowie real erreichbare Fusionen, schätzt ATK/DEF einschließlich des absehbaren regulären Kreaturenzerfalls und berücksichtigt Wächter–Seelenzehrer-Kombinationen. Beim Aufstellen versucht die KI Unterstützer in DEF zu bringen. Bei möglichen Angriffen simuliert sie die Folgen auf geklonten Spielzuständen, bewertet gegnerische Stat-/LP-Verluste, eigene Verluste und mögliche Angriffsrisiken. Informationen aus verdeckten Gegnerkarten werden nicht zur Aktionswahl verwendet.

Zwei vordefinierte Forschungsprofile (`forecast`/ `synergy`) werden pro Curriculum-Stufe auf unabhängigen Trainingsdecks verglichen und **nur anhand der Trainingspartien** ausgewählt. Die gewählte Strategie wird anschließend auf separaten, bis dahin unbekannten Decks in beiden Starter- und beiden Politiksitzen geprüft. Das gewählte Profil und die Szenarioaufzeichnungen werden als JSON für eine mögliche spätere Lernschleife aufbewahrt. **Keine neuronale Netzaktualisierung, keine automatische Übernahme in produktive KI.**

## Technisch bestätigter Pilotlauf

Die Training/Prüfung einschließlich Regressionstests und CI-Gates wurde auf GitHub vollständig und erfolgreich abgeschlossen.

| Angriffsfreie globale Züge | Trainingswahl | Holdout-Kandidatensiege | Tatsächlich andere Entscheidungen | Beide Boards voll beim Freigabezeitpunkt | Unentschiedene/abgebrochene Duelle |
|---:|---|---:|---:|---:|---:|
| 10 | forecast | 4/8 | 92 | 8/8 | 1 |
| 8 | forecast | 6/8 | 128 | 0/8 | 0 |
| 6 | forecast | 6/8 | 138 | 0/8 | 0 |
| 4 | forecast | 7/8 | 187 | 0/8 | 1 |
| 2 | synergy | 6/8 | 148 | 0/8 | 1 |
| 0 | forecast | 7/8 | 157 | 0/8 | 0 |
| **Summe** | – | **36/48 (75 % aller Matches)** | **850** | – | **3** |

*Die 3 Simulationen ohne Sieger bei der maximalen Duelllänge zählen **nicht** als Siege. Unter den 45 abgeschlossenen Partien entspricht dies 36/45 = 80 %, darf wegen winziger Stufen-Stichproben nicht als generalisierte Siegquote interpretiert werden.*

In den 48 Holdout-Duellen wurden **1.334** Nachbeschwörungs-/Boardprüfungen protokolliert, **0 ungültige KI-Aktionen**, **0 offensive Seelenzehrer-Effekte vor Kampf-Freigabe**, und in der 10-Züge-Stufe **8/8 vollständig besetzte Boards auf beiden Seiten** beobachtet.

Die 850 Abweichungen sind **tatsächliche Aktionsauswahlunterschiede gegenüber dem bestehenden Referenzplaner**, nicht zwingend 850 nachgewiesen bessere Einzelaktionen. Der Erfolg der Gesamtpartien macht den Ansatz ermutigend; ein ausführlicher kausaler Mehrzug-Audit steht noch aus.

## Grenzen

- Nur **zwei eigenständige, separate Holdout-Decks je Stufe**, je 4 gepaarte Match-Konfigurationen. Deshalb sind Siegquoten von beispielsweise 7/8 **nicht robust**. Zusätzlich muss zwischen strategischer Überlegenheit und Schwächen der gewählten alten `balanced`-Vergleichs-KI unterschieden werden.
- Die gespiegelten 40-Karten-Konstruktionen sind **theoretische, quellbasierte Benchmark-Decks**, nicht Nachweise vorhandenen Spielerinventars.
- Der beabsichtigt ausgeschaltete Arena-LP-Zerfall verlängert manche Spiele; drei erreichten ohne Sieger das gesetzte Limit.
- Fusionen haben Zufallswürfe und lebende Mischdeck-Synergien; deterministische Einschätzungen können deren Erwartungswert nicht vollständig abbilden.
- Training bewertet Auswahl mehrerer *fester* Strategieprofile, speichert aber noch **keine aus sämtlichen Aktionsreplays selbstständig angepassten Gewichte**. Der nächste Schritt sollte deshalb eine echte Nutzen-/Q-Wert-Update-Schleife mit größerer, völlig getrennter Schlussprüfung sein.

## Folgeplan

1. Für alle six Stufen Trainings- und Holdout-Deckzahl stark erhöhen; zusätzlich Guardian/Soul 40:60, 50:50, 60:40, Predator, Fusion und Allrounder, mehrere Kartenniveaus und Boss-Gegner.
2. Bei jedem Beschwören die 1–2 folgenden eigenen Aktionen **und** gegnerische Antwortmöglichkeiten auf bekanntem Board auswerten, inklusive Vorzug durch DEF-Heilung und späteren Seelenraub.
3. Speichern: sichtbarer Zustand, rechtlich mögliche Alternativen, prognostizierte Folge und tatsächlich erzielte Board-/LP-Werte; daraus trainierbare Gewichte ableiten.
4. Frühzeitigen Seelenraub weiterhin separat auf Regel-Level überprüfen; niemals künstlich ein bisher nicht erlaubtes Soul-Fenster offenlassen.
5. Keine Promotion ohne unabhängigen größeren Holdout gegen mehrere eingefrorene ältere Politiken sowie Nichtregression in regulären Duellen.

**Fazit:** Der Stufenmodus führt tatsächlich zu vollem Feldaufbau bei 10 Zügen und zu deutlich verändertem KI-Verhalten ohne vorzeitige Soul-Offensive. Der Pilot ist ein Erfolg des Forschungsdesigns, aber noch kein Freigabebeleg für produktive KI-Regeln.
