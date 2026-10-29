# Arcane Duel – KI-Prüfbericht v14.5: Drei Hauptstrategien und Regelkenntnis

**Datum:** 21. Oktober 2026 · **Branch:** `development` · **GitHub Actions:** SUCCESS (1. Versuch) · **Modellpromotion:** NEIN

- [Trainingslauf #39657418644](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39657418644)
- [Originalartefakt – Bericht, Regelcurriculum, Kandidat](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39657418644/artifacts/12371433658)
- Trainer: `tests/ai-three-strategy-curriculum-v145.cjs`; Workflow: `.github/workflows/ai-three-strategy-curriculum-v145.yml`.
- Quell-Commit des Laufs: `d9d6f5e918e05a2012ee9159592f162005168c39`.

## Ausführung

GitHub Actions erfolgreich beendet: 21.10.2026, **19:05 UTC** (21:05 MESZ). Pilot, große Trainings- und Holdoutserie, Archivierung alle erfolgreich. **86 Regeltests bestanden, 0 fehlgeschlagen**. Verwendet wurden 84 neue Trainingsszenarien und 84 unabhängig erzeugte Holdout-Szenarien, jeweils mit gespiegelter Spielerposition, source-legal konstruierten Decks und unterschiedlichen Seeds.

Drei Hauptlehrpläne, jeweils zwei veränderbare Strategie-Konfigurationen; eingefrorene Champion-Gewichte aus `models/ai-selfplay-v136.json` (1.920 zuvor dokumentierte Trainingsepisoden).

## Trainingsergebnisse

| Gruppe | Variante | Siege / Duelle | Befund |
|---|---|---:|---|
| Offensive (24 Szenarien) | **pressure-controlled** | **25/48 (52,1 %)** | Train-only gewählt |
| Offensive | pressure-committed | 25/48 (52,1 %) | Gleichstand; Tie-Break |
| Guardian/Soul (24 Szenarien) | **guardian-stable** | **26/48 (54,2 %)** | Train-only gewählt |
| Guardian/Soul | soul-counter | 26/48 (54,2 %) | Gleichstand; Tie-Break |
| Fusion (36 Szenarien) | **fusion-conserve** | **39/72 (54,2 %)** | Train-only gewählt |
| Fusion | fusion-combo | 38/72 (52,8 %) | Minimal schwächer |

**Methodisch:** Drei auf Trainingsdaten ausgewählte Parameterprofile; **kein** neuer neuronaler oder gradientenbasierter Lernstand, **keine** Aktualisierung des produktiven Champions. Zwei von drei Profilentscheidungen beruhen auf exakt gleichen Trainingssiegen und sind nicht wissenschaftlich als klare Gewinner interpretierbar.

## Unabhängige Duellprüfungen

| Hauptstrategie | Gegen v14.3 | Gegen Original-Champion |
|---|---:|---:|
| Offensive (Predator/Tempo, 24 Szenarien) | 23/48 (47,9 %) | 24/48 (50,0 %) |
| Defensive (Guardian/Soul, 24 Szenarien) | 24/48 (50,0 %) | **27/48 (56,3 %)** |
| Fusion (Fusion/Allrounder/Hybrid, 36 Szenarien) | 32/72 (44,4 %) | 37/72 (51,4 %) |
| **GESAMT** | **79/168 (47,0 %)** | **88/168 (52,4 %)** |

**Interpretation:** Die Strategieaufteilung bringt **keine** verlässliche breite Steigerung. Insbesondere die Fusionsgruppe verliert gegen v14.3. Die Defensive ist gegenüber dem Original-Champion vielversprechender, gegen v14.3 aber nicht klar besser. Kein Gruppenergebnis belegt bereits strategische Meisterschaft.

### Boss VII, IX und X (je 14 Startkonfigurationen)

| Boss | Kandidat v14.5 | Planer v14.3 | Original-Champion |
|---|---:|---:|---:|
| VII | 10/14 | 10/14 | 8/14 |
| IX | 5/14 | 7/14 | 6/14 |
| X | **0/14** | **0/14** | **0/14** |
| **Zusammen** | **15/42** | **17/42** | **14/42** |

Der neue Kandidat ist insgesamt um einen Sieg vor dem Champion, aber zwei hinter v14.3. Gegen IX zeigt er einen Rückschritt. **Gegner X bleibt weiterhin 0/14 bei allen drei Controllern**. Diese Bossläufe sind simulationsbasierte Stressszenarien mit konstruierten Testdecks und kein kompletter menschlicher Karriere-Durchlauf.

### Experten-Kontrolle (28 Matches je Stil)

| Spezialist | Siege v14.5 |
|---|---:|
| Offensiv | 14/28 (50,0 %) |
| Verteidigung/Support | 13/28 (46,4 %) |
| Fusion/Ökonomie | 17/28 (60,7 %) |

Die Fachgegner zeigen keine eindeutige Überlegenheit; gegen DEF/Support liegt die KI knapp unter 50 %. Alle Prozentangaben sind kleine Stichproben und nicht unabhängig vom konkreten Testpool zu verallgemeinern.

## Regeln und tatsächlich geplante vs. ausgeführte Folgeaktionen

- Das Workflow-Curriculum prüfte unter anderem Beschwörung, Hand- und Feldfusion, Resonanz, Rollenvererbung, ACE/LV1, Essenzkampf, Seelenzehrer/Guardian und Ökonomie mittels **86 ausführbaren Regressionstests**. Regelkonforme Durchführung ist **nicht gleich** perfekter strategischer Gebrauch jeder Sondermechanik.
- Planer-vs-v14.3-Holdout: **347 registrierte Folgeaktionsabsichten** (Offensive 100, Defensive 111, Fusion 136) und **346 spätere erfolgreiche Aktionen mit passendem Aktionstyp innerhalb desselben Zuges** (100 / 110 / 136).
- **Messgrenze:** Die Implementierung vergleicht `actor`, `turn` und **Aktionstyp** einer gespeicherten Absicht mit späterem `applyAiAction`-Erfolg. Sie prüft noch **nicht dieselbe konkrete Karte, das Angriffsziel, den Slot oder den Netto-Nutzen der tatsächlichen Handlung**. Das Ergebnis 346/347 ist daher eine Typ-Korrespondenz, **kein** Beleg 346 erfolgreich verwirklichter optimaler Kombos.
- Spielstil-spezifische Diagnosedaten zu gebotenen/gewählten Aktionen im Original-Artefakt. Beispiel Defense: 122 Legal-Angebote für Seelenentzug und 97 gewählte Seelenentzüge; 26 Wächter-Heil-Angebote und 21 Wahlen. Diese Angebot-/Wahl-Zähler können verschiedene Phasen-/Fallbackkontexte haben und sind nicht unbesehen als klinisch exakte Erfolgsquoten interpretierbar.
- **Kein Zugriff auf unbekannte gegnerische Karten** bei der Entscheidung. Verschiedene Aktionen können nachfolgende RNG-Folgen ändern; gepaarte Duelle genügen nicht, um einzelne Züge als kausal optimal zu bewerten.

## Promotionentscheidung

**`passForPromotion:false`, `productionIntegrated:false`.** Die festgelegte Mindestleistung war unter anderem mindestens **56 %** gegen Champion, **53 %** gegen v14.3 und Bossleistung nicht unter Championniveau. Erreicht: **52,4 %** vs. Champion, **47,0 %** vs. v14.3. Der Champion wird nicht ersetzt, `main` und die produktive Gegner-KI bleiben unverändert.

## Lernplan v14.6

1. **Pro Entscheidung echte Handlungs-IDs erfassen**: ursprüngliche Wahl, geplante Folgekarte mit UID/Slot/Ziel, real ausgeführte Folgekarte sowie LP-, ATK-, DEF-, Zerfall-, Monster- und Fusionsreserveänderungen. Nur so ist Strategiekombinationslernen nachweisbar.
2. **Ganze regelkonforme Mini-Lektionen getrennt pro Stil**: Predator (sichere Angriffe/Gegenangriffe/Abnutzung), Guardian/Soul (DEF-Sicherung, Absaug-/Heilentscheidung, Gegenschläge), Fusion (2–5 Materialien, echte Rollen-/Poker-/Resonatorboni, Erbkarten, Kosten, Platzierung und Folgeangriff). Mit gezielten Startzuständen statt bloßer breiter Matchsammlung.
3. **Fusion gegen v14.3 diagnostizieren**: 32/72 Siege ist bislang der größte Rückschritt. Für identische Zustände beide Controller-Aktionen und tatsächliche Folgen vergleichen; insbesondere Materialschonung vs. Qualitäts-/Tempoverlust.
4. **Boss X systematisch untersuchen**: Deck-/Levelverteilung, ACE-Aufbau, LP-Verlust, Materialverfügbarkeit, Zerfall und konkrete erfolglose Züge; mit kleinen reproduzierbaren Stresstests statt ausschließlich neuer zufälliger Matches.
5. **Historische Erfahrungen dauerhaft speichern** als versionierte `Rules commit + public state + own hand + legal options + intended/actual actions + resulting state + game result`-Daten. Alte Berichte nur für Themensetzung, nicht rückwirkend als optimale Einzelaktionslabels.
6. **Mehrfaches Seed-Sampling** und unabhängige Validierung pro Strategie; getrennte Training/Holdout-Daten beibehalten und keinen produktiven Modellwechsel ohne eindeutige Verbesserung.

**Urteil:** Mehr nachvollziehbare Strategietests und deutlich erweiterte Regelabdeckung, aber **kein nachgewiesener stärkerer KI-Champion**. Nächster Fortschritt muss aus echten Mechanikentscheidungen und deren überprüfbaren Auswirkungen kommen, nicht nur aus mehr zufälligen Duellen.
