# Arcane Duel – KI-Prüfbericht v14.4: Historische Lernberichte, Fusions-Folgeaktionen und Counterplay

**Stand:** 21.10.2026 · **Branch:** `development` · **Workflow:** `SUCCESS` · **Neuer Champion:** nein.

[GitHub-Actions-Lauf #39653165893](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39653165893) · [Originales Ergebnisartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39653165893/artifacts/12370433620)

## 1. Technische Prüfung

- Workflow erster Versuch: erfolgreich vollständig abgeschlossen um **18:33 UTC** (20:33 MESZ), alle Schritte einschließlich des Artefaktuploads erfolgreich.
- **42 bestandene**, **0 fehlgeschlagene** Regel-/Regressionstests. Pilot und umfangreiche Hauptserie bestanden.
- Historische Originaldaten aus v13.6, v14.2 und v14.3 geladen und überprüft. Historische **Lernziele**, keine Verwendung älterer Holdout-Sieger zur Optimierung aktueller Parameter.
- Experimenteller Code: `tests/ai-historical-fusion-followup-v144.cjs`; Workflow: `.github/workflows/ai-historical-fusion-followup-v144.yml`.
- Für die neue Auswahl bleiben die **15 Champion-Gewichte unverändert**. Die drei v14.4-Varianten unterscheiden sich in der Gewichtung hypothetisch legaler Folgeaktionen und offen sichtbarer gegnerischer Angriffsdrohungen. Dies ist **Parametertuning**, kein Gradiententraining und keine automatische langfristige KI-Gedächtnisaktualisierung.

## 2. Historische Erkenntnisse wiederverwendet

1. **v14.2:** Der alte Planer wich kaum von der Baseline ab und bevorzugte häufig normale Beschwörung statt Fusion. Ursache möglicherweise Bewertung im noch unvollständig aufgelösten Zustand.
2. **v14.3:** Reale Auflösung von Handfusion, Platzierung und Materialien in isolierter Engine-Kopie verbesserte die Entscheidungsvariation. Aber die 59/108 Mirror-Siege waren nicht promotionsreif.
3. **v14.3:** Nur 10/24 Siege gegen offensiven Spezialisten; Boss X wurde in 0/9 gewonnen. Daraus entstanden die neuen Lektionen: Angriffsdruck berücksichtigen und legale Fusions-Folgeaktion vorab bewerten.

Die Reports liefern **Kandidaten für Verbesserungen** und sind keine gespeicherten vollständigen historischen optimalen Züge.

## 3. Trainingsserie

**36 neue Trainingsszenarien**, je Kandidat mit Seitenwechsel: 72 Duelle pro Variante.

| Strategie | Siege | Quote | Positiv beurteilte hypothetische Folgeaktionen |
|---|---:|---:|---:|
| **Konservativ** (Folgeaktion 0,35 / Verteidigung 0,40) | **34/72** | **47,2 %** | 481 |
| Ausgewogen (0,80 / 0,65) | 33/72 | 45,8 % | 481 |
| Gegenangriff (1,15 / 1,05) | 33/72 | 45,8 % | 481 |

**Gewählter Kandidat:** `followup-conservative`, ausschließlich auf den neuen Trainingsszenarien. Kein Kandidat erreichte im Training 50 % oder mehr gegen die v14.3-basierte Vergleichsstrategie.

## 4. Unabhängige Tests – 48 neue Szenarien, Seitenwechsel

| Messgröße | Ergebnis |
|---|---:|
| v14.4 vs. v14.3, gleiche alte Gewichte | **49/96 Siege (51,0 %)** |
| v14.4 vs. unmodifizierter Champion ohne Planer | **56/96 Siege (58,3 %)** |
| Unterschiedliche Aktionsvorschläge im Vergleich zur linearen Standardwahl | **444** |
| Auf den Spielkopien geprüfte Folgeaktionen | **1.802** |
| Vom echten Resolver auf Spielkopien akzeptierte Folgeaktionen | **1.802** |
| Hypothetische Auswahl einer positiven Folgeaktion | **619** |

**Definition:** `followupExecuted` erhöht sich im Trainer, wenn beim **Bewerten eines Kandidaten auf einer geklonten Spielposition** ein positiver Folgeaktionswert gefunden wurde. Diese 619 Ereignisse sind **nicht** die Zahl zusätzlich tatsächlich gespielter Angriffe, Heilungen oder Soul-Drain-Aktionen in den Duellen. Der Planer wählt weiterhin zunächst nur die ursprüngliche Aktion; den weiteren Zug führt die normale Spielmechanik aus.

Die große Zahl legaler Kandidaten belegt eine tatsächlich benutzte Simulationsfunktion, aber noch nicht deren strategischen Mehrwert. Die Quote von 58,3 % aus 96 Spielen ist angesichts der Stichprobengröße nicht hinreichend, um einen stabilen Vorteil gegen viele Decktypen anzunehmen.

### Boss-Sparring VII, IX und X (8 Szenarien pro Gegner)

| Gegner | v14.4 | v14.3-Planer | Unveränderter Champion |
|---|---:|---:|---:|
| VII | 4/8 | 4/8 | **5/8** |
| IX | 2/8 | 2/8 | 2/8 |
| X | 0/8 | 0/8 | **1/8** |
| **Gesamt** | **6/24** | **6/24** | **8/24** |

Der v14.4-Planer ist im Boss-Vergleich **nicht besser** als v14.3 und insgesamt etwas schwächer als der geschützte Champion. Boss X bleibt eine deutliche Schwachstelle.

### Test gegen Spezialisten

| Gegnerstil | v14.4-Siege |
|---|---:|
| Offensive | **10/20 (50,0 %)** |
| Defense / Support | **11/20 (55,0 %)** |
| Fusion / Ökonomie | **14/20 (70,0 %)** |

Verglichen mit früheren Generationen ist dies gegen Offensiv-Spezialisten ermutigend, aber die jeweiligen Stichproben und Testdecks unterscheiden sich. Ein exakter generationsübergreifender Leistungsgewinn ist dadurch nicht erwiesen.

## 5. Technische und wissenschaftliche Grenzen

- `followup144` stellt die **Kopie** der Position zum Kandidatenvergleich auf die Angriffsphase; die Kandidaten werden mittels originalem `applyAiAction` geprüft. Für eine starke Legitimitätsaussage muss künftig zusätzlich die vollständige reale Phasenfolge inklusive Positionswechsel nachgestellt werden, statt direkt zur Angriffsphase umzuschalten.
- Es wird jeweils nur **eine unmittelbare eigene Folgeaktion** bewertet – keine Planung mehrerer kompletter Runden und keine tatsächliche Vorwegnahme unbekannter gegnerischer Handkarten.
- 444 unterschiedliche Vorschläge beziehen sich auf Vergleiche zur linearen Grundentscheidung, nicht zwingend auf 444 Veränderungen **gegenüber dem v14.3-Planer**. Die v14.3-Gewichtung ist separat im direkten Duellvergleich gegenübergestellt.
- Ein anderer erster Zug kann die folgenden Zufallswürfe und die Reaktion des Gegners verändern. Eine einzelne gepaarte Partie zeigt keine allgemein optimale Alternative.
- Kein neuer modellinterner Langzeitspeicher und keine aktualisierten Champion-Gewichte; die Reports werden als historische **Curriculum-Information** genutzt.
- `development`-Test und `main`/produktive Gegner sind getrennt. **Keine** Integration oder Beförderung erfolgte.

## 6. Prüfurteil und Empfehlung für v14.5

**Durchführung erfolgreich, Promotion-Gate nicht bestanden.** Besonders relevant: Das festgelegte Tor verlangt mindestens **53 % gegen v14.3** und mindestens die Champion-Bossleistung. Erreicht wurden nur **51,0 %** gegen v14.3 und **6/24 Boss-Siege** gegenüber **8/24** beim Champion. Gegen den einfachen Champion ist 56/96 positiv, kompensiert aber die anderen Tests nicht.

**Nächste Maßnahmen:**
1. **Phasengetreue Simulation:** Nach Fusion/Platzierung Positionsphase und Angriff regulär voranschreiten lassen; kein künstlicher Phasenwechsel für vermeintliche Gratisaktionen. Ermitteln, ob die späteren Kandidaten tatsächlich im echten Folgezustand legal bleiben.
2. **Tatsächlich ausgeführte Aktion protokollieren:** Auswahl eines positiven hypothetischen Followups, spätere tatsächlich gewählte Aktion und Zustandswirkung auseinanderhalten.
3. **Einzelmechaniken prüfen:** Angriffsziele, Soul-Drain, Guardian-Heal, DEF-Überladung sowie erhaltene Fusionserbe-/Rollen-/Pokerboni separat beurteilen.
4. **Erfolg gegen Boss X und Offensiv-Gegner gezielt messen**; gleicher Trainings-/Holdout-Split, mehrere verschiedene Seed-Fortsetzungen und weitere Deckfamilien.
5. **Historienarchiv fortführen:** Neue Prüfberichte und wiederholbare Entscheidungssituationen mit Regel-Commit erhalten, ohne alte Tests als Trainset zu missbrauchen.
6. **Promotionsgrenzen beibehalten**, bis ein Kandidat gegenüber altem Champion und v14.3 unabhängig überzeugt.

**Abschluss:** Experiment gelungen, aber **noch kein nachgewiesenes neues strategisches Niveau**. Der vorherige Champion und die produktive Gegner-KI bleiben unverändert.
