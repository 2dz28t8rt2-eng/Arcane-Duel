# Arcane Duel KI v14.9.36 — Spielerposition 2 und Allrounder-Ursachenanalyse

## Reproduzierbare Ausgangsdaten
v14.9.35, erfolgreicher korrigierter Lauf #40101599017, 4.800 Duelle.

Die beste eingefrorene Forschungsstrategie `counterfactual-fusion` erzielte
in VALIDATION auf Kandidaten-Sitz 0 **92/160** Siege gegenüber dem alten
Guardian/Soul-Champion mit 72/160. Auf Sitz 1 erzielte sie aber **72/160**
gegenüber **76/160**. Sie bestand damit den globalen Freigabe-Gate nicht.

Ein erneutes Nachrechnen der detaillierten Run-Artefakte ergibt für
Allrounder auf Kandidaten-Sitz 1 in VALIDATION **5/20** Siege gegenüber
**10/20** beim Champion. Nach absolutem Startspieler:
- Starter 0: Forschungsstrategie 2/10; Champion 3/10.
- Starter 1: Forschungsstrategie 3/10; Champion 7/10.

In dieser kleinen Stichprobe ist der Nachteil also NICHT einfach nur
„der zweite Spieler beginnt später“; das Ergebnis muss über neue, getrennte
Szenarien bestätigt werden. Es handelt sich um Beobachtungsdaten, **nicht
um die bewiesene Ursache**. Der alte Forschungsstand war in der
schwierigen L10-VALIDATION um +2 besser, so dass die alten L10-Effekte
ebenso geschützt bleiben sollen.

## Ziel: konkrete Ursachen statt Sitznummer-Boni
Das Gewichtungssystem reagiert ausschließlich auf sichtbare eigene
Karten, gegnerische Feldkarten und Runden-/Feldlage. **Kein**
automatischer Buff, nur weil die KI auf Sitz 1 statt Sitz 0 spielt.

Das Testdesign hält die 5 Strategien über alle 5 Phasen fest:
1. `guardian-champion`: unveränderter validierter v14.9.28-Standard.
2. `counterfactual-fusion`: eingefrorener v14.9.33 Kandidat mit
   legally cloned attack response für Fusionsplanung.
3. `allrounder-protection`: gleicher Kandidat plus leichtes,
   begrenztes Risiko bei Angriffen, falls eigene noch vorhandene
   Allrounder auf sichtbare Predator-Gegenangriffe ungeschützt reagieren.
4. `allrounder-opening`: gleicher Kandidat plus geringe,
   situationsabhängige Beschwörungsboni für Allrounder, Wächter und
   Seelenzehrer in den ersten vier Spielzügen, falls wenige eigene
   Feldkarten und vorhandene Allrounder auf Hand/Feld.
5. `allrounder-combined`: beide isoliert getesteten Komponenten.

Die Counterfactual-Fusionsfunktion benutzt bestehende, legal ausgeführte
Gegenangriffe auf kopierten Spielzuständen und ist weiterhin **keine
vollständige gegnerische Zugbaumsuche**.

## 4.800 feste, gepaarte Duelle
5 Phasen: Level-8- und Level-9-Mirror, normales Level-10-Cross-Role,
Level-8-Cross-Role und schwieriges Level-10-Cross-Role.

Pro Phase 8 Rollenpaare × 6 Szenarios × 2 Startspieler × 2
Kandidatensitze × 5 Strategien = 960. Insgesamt 4.800,
davon je 1.600 TRAIN / VALIDATION / neuer versiegelter HOLDOUT;
320 Partien pro Strategie und Split. Frische Deck- und Match-Seeds.

BOTH seats use full experimental strategic AI. Opponents alternate between
historically verified Guardian/Soul champion and frozen balanced policy.
Zero illegal position changes are required.

Die neue zentrale Diagnose wertet **nach getrennten Merkmalen** aus:
- Kandidatensitz × absoluter Startspieler × TRAIN/VALIDATION/HOLDOUT;
- Kandidatensitz × eigene Rolle × absoluter Startspieler;
- Allrounder auf Sitz 1 × Gegnerrolle sowie × Phase;
- Alle acht schwierigsten Level-10-Paarungen;
- tatsächlich gewählte Aktionen, Fusionshäufigkeit,
  Allrounder-Schutz- und Eröffnungsbewertungszähler.

Entscheidend: eine Niederlage bei Starter 0 mit Kandidatensitz 1
bedeutet etwas anderes als Starter 1 mit Kandidatensitz 1. Die
Auswertung darf diese Dimensionen nicht vermischen. Kleine Subgruppen
müssen als **explorativ** interpretiert werden.

## Strenge Freigabe ohne Holdout-„Optimierung“
Es wird nur einmal nach allen Phasen auf TRAIN+VALIDATION ausgewählt,
mit unveränderten v14.9.35 Regeln:
- mindestens +8 TRAIN und +8 VALIDATION gegenüber dem Champion;
- keine TRAIN- oder VALIDATION-Verschlechterung auf irgendeinem
  Kandidatensitz;
- Spiegel/Cross-Role/Champion-Gegner/Balanced-Gegner: mindestens
  -3 VALIDATION-Siege je festgelegter Untergruppe;
- schwierigste Level-10-VALIDATION: keinerlei Verschlechterung.

Nicht bestanden => Champion bleibt. HOLDOUT erst für Bericht nach
globaler Auswahl nutzen. Alte Holdouts werden niemals ins Q-Training
übernommen.

## Historisches Q
25 erfolgreiche, verifizierte GitHub-Runs v1511–v1535. Transfer
letzter freigegebener taktischer Q-Werte aus #40101599017. Neue Q-Werte
nur mit konservativen getrennten TRAIN-internen Validierungs- und
Bestätigungsmargen akzeptieren. Separate neue Q-HOLDOUT-Werte sind
diagnostisch und bestimmen nicht die Lernakzeptanz.

## Einschränkungen
- LP-Zerfall im Benchmark symmetrisch deaktiviert (Research-only).
- Kein Live-AI-Update und keinerlei Änderung an `main`.
- Rollenboni sind interpretierbare, von Hand definierte Forschungsregeln,
  nicht eigenständiges fortlaufendes Reinforcement-Learning.
- Ein positiver Gruppenwert beweist keine generelle Überlegenheit;
  der Sieg muss gegen alle globalen Kriterien geprüft werden.

## Quellcode
- `tests/ai-v1536-seat2-allrounder-selfplay.cjs`
- `tests/ai-v1536-seat2-allrounder-aggregate.cjs`
- `tests/ai-v1536-history.cjs`
- `tests/ai-v1536-Q.cjs`
- `.github/workflows/ai-v14936-seat2-allrounder.yml`
