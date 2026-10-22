# Arcane Duel – KI-Akademie v13.7: Mechanik-Lehrplan, Champion-Liga und historische Gegenproben

**Stand:** 21.10.2026 · **Branch:** `development` · **Bereich:** Offline-Training/Forschung; keine aktive NPC- oder Balanceänderung.

## Ziel
Eine regelkundige, anpassungsfähige KI für das **gesamte Spiel**, nicht ein nur für IX/X optimierter Duellant. Die KI soll alle legalen Optionen kennen, kurzfristige Konsequenzen vergleichen, langfristige Fusionsketten vorbereiten und aus alten Partien nachvollziehbare Verbesserungen ableiten.

## Ausgangszustand – historisch belegbar
- `models/ai-selfplay-v136.json`: **1.920** durchlaufene Trainingspartien, **120** archivierte Replay-*Gradienten*, 15 Entscheidungsgewichte. Letzter **akzeptierter** Champion stammte aus einer früheren v13.5-Generation.
- v13.6, Run [#39637833422](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39637833422): 3 × 400 Trainingsduelle; 3 × 630 unabhängige Vergleiche; alle neuen Kandidaten **nicht** übernommen.
- Archivierte Ergebnisstatistiken aus `arcane-v136-extensive-1200-episode-selfplay` eignen sich zur **Korrelation und Priorisierung** (Boardkontrolle, Rollen, X, Fusion), aber **nicht** zur Rekonstruktion alternativer Entscheidungen: der bisherige Replay-Eintrag speichert nur `grad`, Sieger, Gegnerklasse, Turnierstufe und Aktionszahl. Er enthält **nicht** Spielsituation, legale Alternativen, Seed-/Decknachweis oder vollständige Aktionsfolge.

## Neue Lernarchitektur

### Stufe A – Regel- und Mechanik-Akademie
Jede Lektion ermittelt mit der echten Engine die legalen Optionen, misst unmittelbare Auswirkungen und testet separat, ob sie später im Duell tatsächlich helfen.

| Lehrfach | Kompetenz | Prüfsignal |
|---|---|---|
| Beschwörung, Angriff, DEF | Legale Züge, Schaden, Schutz, Positionen | illegale Aktionen = 0; Board-/LP-Entwicklung |
| Hand- und Feldfusionen | Materialkosten, erreichbares Ziel, Qualitäts-/Pokerboni | legaler Fusionswert, verbleibende Hand, spätere Angriffe |
| Predator, Wächter, Seelenzehrer | Angriffsfenster, Gegenschlag, Soul-Drain, Heilung | echte ATK/DEF-/LP-Änderung nach Engine |
| Allrounder, Resonator, Resonanz | Erbe, Qualitätswurf, Mehrheitslosigkeit | tatsächliche Qualitäts-/Resonanzwirkung |
| ACE und Bosskontrolle | ACE-Zugriff, ACE-Konter und Boardprioritäten | Kontrolle der sichtbaren ACE-Bedrohung |
| Zerfall und Mehrzugplanung | Wert eines Monsters in 1–3 Folgerunden | echte Kartenwerte nach Rundenwechsel |
| LV1-Quest/Spezialfähigkeiten | Geisterslots, LV1-Fusion, Lumira (nur bei freigeschalteten Voraussetzungen) | regelkonforme Spezialaktionen |
| Deckbau, Booster, Schmiede, Ökonomie | legale Progression und Ressourcenmanagement | echte erworbene Ressourcen; keine Gratis-Karten |

**Reifegrad:** v13.7 startet mit beschränktem Taktik-/Fusions-Lehrpilot und Historienanalyse. Die übrigen Module werden **nicht** als fertig oder trainiert ausgegeben, bevor echte Engineprüfungen existieren.

### Stufe B – Strategie-Liga
- Ein eingefrorener Champion, ältere archivierte Gewichtungen und mehrere *unterschiedliche* Spezialisierungen (Offensive, Defensive, Fusion) bilden den Gegnerpool.
- Identische Decks und Startbedingungen werden **für beide Sitze** verglichen; danach zusätzlich verschiedenartige und legitime Stufendecks.
- Ein Kandidat wird nur auf **unbenutzten** Seeds/Decks mit positiver Sieg- und Mechanikbilanz akzeptiert. Vergangenes Champion-Modell nie bei Fehlschlag überschreiben; Auswertung nach Stufe/Deckrolle/Startplatz.
- Nur bei unabhängigen, ausreichend großen Bestätigungstests wird ein Modell für einen **separat freizugebenden** Produktions-PvE-Adapter vorgemerkt.

### Stufe C – Historische Fehleranalyse
**Bisher vorhandene Daten:** v13.5/v13.6-Aggregate, Spielstile, Startbedingungen und Replay-Gradienten; *keine* vollständigen historischen Zustände.

**Neue Datenfelder für künftige Duelle:**
`rulesHash/commit`, `deckFingerprint`, `seed`, `starter`, `seat`, `turn`, `phase`, `publicBoard`, `ownHand`, `legalActions`, `selectedAction`, `stateBefore`, `stateAfter`, `terminalResult`. **Keine gegnerische verdeckte Hand oder Nachziehfolge an das Entscheidungsmodell übergeben.** Original-RNG und Deckreihenfolge dürfen nur in abgeschotteten Experimenten für reproduzierbare Vergleiche genutzt werden.

**Historische Auswertung:** getrennte Tabellen für Mirror-/Cross-Siege, IX/X, erste Angriffsbereitschaft, Deckrolle, Fusion-/ACE-Effekte, Regelverletzungen und Fehlerkategorien; Verlauf über Generationen.

**Gegenprobe („Was wäre besser gewesen?“):** Von einem **reproduzierten identischen Startzustand** ein echtes Duell zunächst mit Aktion A, dann mit anderer *legaler* Aktion B unter gleichen Anfangsbedingungen durchspielen. Abzweigepunkt und Zustand per Fingerabdruck prüfen; gleiche Start-RNG, danach naturgemäß unterschiedliche Zufallsverbräuche möglich. Immer beide realen Ergebnisse nennen; eine einzelne Abzweigung ist noch kein kausaler Beweis oder allgemeingültige Regel. Für belastbare Regeln mehrere Seeds, andere Decks, beide Seiten und unabhängige Kontrollspiele verwenden.

### Stufe D – Trainings- und Promotionsgates
1. **Regeltreue:** keine ungültigen Entscheidungen, keine verdeckten Informationen.
2. **Mechanikabdeckung:** jede Lektion dokumentiert tatsächlich verwendete, überprüfte Mechaniken; Nichtabdeckung klar markieren.
3. **Train vs. Holdout:** keine Deck-/Seed-Überlappung; Gewichte nur am Trainset verändern.
4. **Championliga:** mindestens 50 % + definierte statistische Sicherheitsmarge gegen eingefrorenen Champion bei verschiedenen Decktypen; Schwächen gegen einzelne Rollen gesondert berichten.
5. **IX/X** bleiben ein Benchmark, **nicht** der einzige Trainingstreiber.
6. **Persistenz:** Modell, historische Diagnose, rekonstruierbare Situationen und Berichte versionieren; bei Fehlschlag den Champion schützen.

## Geplante Versionen
- **v13.7 Pilot:** Alte Aggregate und Replay-Grenzen automatisch prüfen, echte Paare von legalen Handlungsalternativen mit identischem Duellbeginn vergleichen, Strategie-Liga starten, Kandidaten/Fehlerbericht archivieren. Spiel bleibt unverändert.
- **v13.8:** Vollständige Zustands-/Aktionsprotokolle und reproduzierbares Action-Replay; gezielte Mechanik-Lehreinheiten je Rolle und Poker-/Resonanz-Mechanik.
- **v13.9:** 2–3-Zug-Lookahead mit exakter Engine-Auflösung und Unsicherheitsbehandlung statt bloßer ATK-Schätzung; Strategie-Liga aus historischen Modellen.
- **v14+:** Karriere-Ökonomie, Deckbau, spezielle Quests und kontrollierte Integration in produktive NPC-KI **nach** unabhaengiger QA und Freigabe.

## Grundsatz
**Mehr simulierte Spiele sind nicht gleich mehr Intelligenz.** Die KI soll alte Misserfolge erklären, regelkonforme Alternativen erneut prüfen, die Erkenntnisse über viele voneinander unabhängige Spiele validieren und nur belastbare Verbesserung als neues Wissen dauerhaft übernehmen.

## Umsetzung v13.8 – Decision Replay und Curriculum (21.10.2026)

- **[Echter abgeschlossener Trainingsbericht](AI_V138_CURRICULUM_TRAINING_RESULTS_20261021.md)**, [Actions #39642462976](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39642462976).
- Historische v13.6-Generationsberichte und v13.7-Entscheidungsbelege eingebunden; aus früheren Gradienteneinträgen können keine vollständigen früheren Spielsituationen rekonstruiert werden.
- **81** neu rekonstruierte legale Gegenproben, sichtbare Zustände und eigene Hand protokolliert, **30** train-only Gewichtsänderungen.
- Unabhängiger Vergleich ergab nur **17/60 Mirror-Siege**, Boss VII/IX/X **0/15** gegenüber **7/15** beim bisherigen Champion. Kandidat klar abgelehnt, kein produktiver Rollout.
- Lehre für die nächste Version: Eine alternative Aktionsfolge in **einem** Match ist ein zu verrauschtes Signal für Gewichtsupdates. **v13.9 muss Mehrfach-Gegenproben über Seeds, Explizit-Vertrauensmaße, einzelne Mechanikübungen und echtes Lookahead priorisieren.**
- Replay und Kandidat im [v13.8-Trainingsartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39642462976/artifacts/12365881460), 90 Tage auf GitHub Actions; zukünftige Runs müssen Lernmaterial rechtzeitig übernehmen. Veränderte Spielregeln, Spielerinventar und NPC-KI: **keine**.

## Umsetzung v13.9 – konservatives Lern-Gate und Engine-basierte 2-Aktionen-Planung (21.10.2026)

- **[Gesamtergebnis](AI_V139_CONFIDENCE_LOOKAHEAD_RESULTS_20261021.md)** · [Actions #39643785644](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39643785644) **SUCCESS**.
- 84 Trainingsfälle, 81 legale originale Gegenproben und 1 konservativ zugelassene Gewichtsänderung.
- Eigenständiger Planer probiert in einer isolierten Engine-Kopie **bis zu zwei eigene Aktionen innerhalb desselben Zuges** (Beschwörung + Platzierung oder aufeinanderfolgende Angriffe). Er ist ausdrücklich **noch keine** zweirundige Vollsuche.
- Neue Kandidatenleistung **31/60** Mirror-Siege (51,7 %), **7/15** gegen VII/IX/X, Spezialisten jeweils 13/24, 13/24 und 14/24; **keine ungültigen Engine-Aktionen**. Champion unverändert, Produktion nicht angepasst.
- **v14.0 empfohlen:** direkter AB-Test Planer AN/AUS bei identischem Gewichtsstand, danach umfassender Mechaniklehrplan inklusive Feldfusion, Rollen-/Soul-Drain-Skills, Resonanz, Pokerboni, ACE und Zerfall. Unsicherheit durch alternative Zufallsläufe ausweisen; Modelle erst mit unabhängigen Bestätigungsduellen befördern.

## Umsetzung v14.0 – kontrollierter Planer-AN/AUS-Vergleich und umfangreiche Mechanikprüfungen (21.10.2026)

**[Vollständiger Prüfbericht](AI_V140_PLANNER_AB_CURRICULUM_RESULTS_20261021.md)** · [Actions SUCCESS #39645002521](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39645002521) · [Trainingsartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39645002521/artifacts/12367211909).

- **160** Trainingsszenarien, **152** unabhängige legale Entscheidungspaare, **2** nur bei ausreichender gruppierter Evidenz zugelassene kleine Gewichtupdates. **42 Mechanik-/KI-Regresstests bestanden**.
- **Isolierter Planer-A/B-Test mit identischen Gewichten:** Planer **33/64** Siege gegen denselben Controller ohne Planer, jeweils Startseed und Deck gespiegelt. **Kein** Nachweis eines echten generellen Vorteils.
- Neuer Planerkandidat gegen eingefrorenen Champion **34/64** Mirror-Siege, bei Bossen VII/IX/X jedoch nur **8/32** gegen **10/32** Champion; Spezialisten **16/28, 16/28, 19/28**. **Keine Promotion**, keine Änderungen an aktiver Gegner-KI, Balance, `main` oder Spielerdaten.
- Die getestete Vorhersage umfasst nur zwei eigene Aktionen **im gleichen Zug**, nicht zwei bis drei vollständige Runden. Historische Einzeldaten dienen zur Fehleranalyse, nicht als Beweis der idealen Alternativentscheidung.
- **v14.1:** Instrumentierte Mechanikabdeckung, mehrere Folgesimulationen pro schwieriger Entscheidung, gezielte statt pauschaler Planeraktivierung und später regelkonforme Mehrzugplanung. Schwierige Mechaniken wie Feldfusion, ACE-Priorisierung, Soul-Drain, Resonanz und Pokerboni explizit prüfen. Langfristigen versionierten Replay-Speicher vorbereiten.

## Umsetzung v14.1 – selektiver Planer und Mechanik-Telemetrie (21.10.2026)

[Prüfbericht](AI_V141_SELECTIVE_PLANNER_RESULTS_20261021.md) · [Trainingslauf SUCCESS, Attempt 2 #39646196727](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39646196727).

- Fünf Aktivierungsstrategien getestet (immer, Beschwörung, Angriff, frühe Angriffe, Bedrohungs-Erkennung), **je 56/112** Train-Siege. **Keine** Strategie qualifizierte sich gegenüber eingefrorenem Champion.
- Richtiger Fallback `none` (Planer nicht aktiv), unabhängige Spiegel-Duelle **72/144**; Boss VII/IX/X **14/36** identische Kontroll-KI. Daher **kein** neuer nachgewiesener Fortschritt und kein Produktions-Rollout.
- Mechanik-Telemetrie erstmals auch für legal angebotenen Seelenentzug (**13** Entscheidungskontexte) und Wächterheilung (**3**), gewählt **9** bzw. **2** Aktionen. **Nicht direkt als Prozent verrechnen**, da Angebotsfenster/Action-Tally noch nicht je identischem Entscheidungsschritt verbunden sind.
- 42 Mechanik-Regressionstests bestanden. Kein fehlerhafter Legal-Resolver und kein Wechsel des Champions.
- **v14.2 kritischer nächster Schritt:** Pro Entscheidung protokollieren, ob der Planer **tatsächlich eine andere Aktion auswählt**, was davon legal/umgesetzt wurde, und warum (Features, Board-Zustand, Material-, Rollen-/ACE-/Zerfallskosten). Danach Kontroll-A/B über echte Abweichungsfälle und saubere Opportunity-Raten. Erst darauf neues umfangreiches Training aufbauen.

## KI-Training v14.2 – prüfbare Action-Overrides und echte Aktionsangebote

- **Implementierung:** `tests/ai-planner-override-audit-v142.cjs` und `.github/workflows/ai-planner-override-audit-v142.yml`.
- [Aktueller GitHub-Workflow](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39647899323).
- Jede geeignete Planersituation wird **mit der normalen KI-Aktion auf einer geklonten Engine-Position** verglichen; gemessen werden vollständige Aktionsabweichungen, Phase, Zugnummer und konkrete Aktionsarten.
- Die angebotenen und gewählten Aktionen werden **pro identischem Entscheidungspunkt** zusammengeführt. Nicht passende Fallbacks werden separat ausgewiesen, statt fälschlich Nutzungsquoten zu berechnen.
- Neue Trainingsphase mit fünf Planer-Aktivierungsregeln sowie unabhängigem Holdout auf anderen Decks/Seeds und Tests gegen VII/IX/X und Strategieexperten.
- **Keine ungeprüfte Modellübernahme.** Nur Regeln, die im Training reale Overrides und eine messbare Verbesserung erzeugen, gelangen in die Holdout-Prüfung; produktive Gegner-KI bleibt unverändert.
- Status/Bewertung aus dem Workflow und dessen Artefakt ableiten; Start allein gilt **nicht** als Erfolgsnachweis.

## Abschluss v14.2 – tatsächliche Planer-Overrides und neuer v14.3-Fokus (21.10.2026)

[Prüfbericht v14.2](AI_V142_OVERRIDE_AUDIT_RESULTS_20261021.md) · [Actions #39647899323](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39647899323), SUCCESS.

- **42/42 Regressionstests bestanden.** 70 neue Train-Szenarien × fünf Gates × Sitzwechsel; 84 unabhängige Holdout-Szenarien.
- Planer `always` traf nur **11 von 537** tatsächlich andere Entscheidungen (**2,05 %**). **10× Fusion → Normal**, **1× Angriff → Ende**. Train-Siege **69/140**, andere Gates maximal **70/140**.
- Gate-Auswahl `none`; Holdout **84/168** (50 %) und Boss **15/42 auf beiden Kontrollseiten**. Deshalb **keine unabhängige Bestätigung eines neuen Planers**, kein Modellwechsel und keine produktive Integration.
- Mechanik-Angebote an passenden Entscheidungspunkten gemessen: Wächter-Heilung **22 legal/14 passend gewählt**, Seelenentzug **82/70**. Fallback-/Phasentypen separat dokumentiert.
- **Warnsignal:** Nach normalen Beschwörungen war die unmittelbare Board-Heuristik in **409/409 Samples null**; nach Fusionen konstant **−0,130 in 420/420 Samples**. Mögliches Mess-/Placement-Timing-Problem (noch nicht endgültig bewiesen) könnte die ungewöhnlich häufige Fusionsvermeidung des Planers erklären.
- **v14.3 Priorität:** Simulator-Endzustände nach tatsächlich vollendeter Normal- und Fusionsplatzierung prüfen, Legal-Resolver-Fortschritt und Boarddeltas mit Assertions absichern; Fusionsmaterial/Erb-/Rollen-/Resonanzwerte und Zerfall berücksichtigen. Dann gezielte Gegenproben an den echten Override-Situationen statt bloß höhere Duellzahlen.

## Umsetzung v14.3 – Fusionen vollständig auflösen und tatsächlichen Nutzen lernen (21.10.2026)

- **Code:** `tests/ai-fusion-value-planner-v143.cjs`. **Workflow:** `.github/workflows/ai-fusion-value-planner-v143.yml`; [Trainingsrunde #39650698039](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039).
- **Bewertungsfehler behandelt:** Bei Normalbeschwörung und Handfusion auf isolierter Spielkopie zuerst die echte `applyAiAction`-Vorbereitung und anschließend jede real **legale** `place`-Option mit der unveränderten Engine auflösen; nur **nach vollständiger Platzierung** den Feldwert beurteilen. Unvollständige `pending`-Zustände werden nicht als finale Feldbilanz bewertet.
- **Voller Fusionsertrag:** Tatsächliche erwürfelte neue ATK/DEF-Werte, Rolle, Guardian/Soul-Nachbarschaft, geschätzter Zerfall und verbleibende Hand/Fusionsreserve. Keine Ausspähung verdeckter gegnerischer Handkarten und keine erfundenen Fusionsergebnisse.
- **Kosten bleiben sichtbar:** Ein starkes Fusionsmonster soll gut sein, aber das verbrauchte zweite/dritte Handmonster und die aufgebrauchte Fusionskopie sind echte Opportunitätskosten. Die KI darf deshalb auch legal korrekt **gegen** eine Fusion entscheiden.
- **Experimentelles Training:** Drei Gewichtungen des vollständigen Board-Nutzens auf *nur Trainingsdecks*, anschließend eingefrorene Version auf vollständig unabhängigen Holdout-Decks/Seeds, gespiegelten Duellen, VII/IX/X und drei Strategie-Spezialisten. Ausschließlich Forschung, keine aktive Gegner-KI geändert.
- **QA-Bedingungen:** Null ungültige Spielaktionen, echte aufgelöste Platzierungen und dokumentierte Normal-/Fusionsvergleiche. Produktives Modell wird nur nach unabhängigem Leistungsgewinn separat geprüft; `main` und der etablierte Champion bleiben unberührt.
- Der Start allein bedeutet **keinen** nachgewiesenen Leistungsgewinn. Der Prüfbericht folgt aus konkreten GitHub-Laufdaten.

## Abschluss v14.3 – vollständig ausgewertete Fusionen und independent Holdout (21.10.2026)

[Originaler Prüfbericht](AI_V143_FUSION_VALUE_RESULTS_20261021.md) · [Actions SUCCESS #39650698039](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039) · [Archiv mit Modellen und Platzierungsbeispielen](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039/artifacts/12370645783).

- **42/42 Game-Engine-/KI-Regressionstests bestanden**, vollständiger Pilot und Trainingslauf erfolgreich. Simulierte Fusionen werden erst **nach echter Platzierung** bewertet; Fusionswürfe, realisierte ATK/DEF, eigene Material-/Reservekosten, Rollen, Guardian/Soul-Synergien und Zweirunden-Zerfallsschätzung berücksichtigt.
- Bestes **train-only** Fusionsgewicht `fusion-aware-strong`: **50/84** Siege (59,5 %) auf Trainingsszenarien.
- Neues unabhängiges Holdout **59/108** Mirror-Siege (54,6 %). **241/324 (74,4 %) tatsächliche Planeraktionen anders** als Baseline; 1.268 vollständig gelöste Beschwörungs-/Fusionsplatzierungen, 620 bewertete Fusionen, keine unerledigten Simulationszweige. Vorher v14.2 nur 11/537 abweichende Entscheidungen, allerdings unterschiedliche Tests, daher kein direkt gepaarter Kausalvergleich.
- Späte Turniergegner: neuer Kandidat **9/27**, Champion **5/27**; IX **3/9 vs. 0/9**, X **0/9 auf beiden Seiten**.
- Spezialisierte Gegner: Offensiv **10/24 (41,7 %)**, Defender **12/24**, Fusion/Ökonomie **16/24**. **Keine Promotion**, weil Mirror-Test die 56-%-Schwelle und Offensivtest die 45-%-Schwelle verfehlten. Produktiver Champion, `main`, Spielbalance und Spielerinventar unverändert.
- **v14.4 Priorität:** Echte Folgeaktion nach Platzierung, harte Gegenwehr von Predator/Tempo, rollenbezogene Soul/Guardian-Übungen und Konterfähigkeit vs. X. Längere Planungsfolgen nur mit öffentlich beobachtbarer Gegnerinformation und neuen Validierungsseeds.

## KI-Training v14.4 – historische Belege, Folgeaktionen und offensive Gegenwehr (21.10.2026)

[GitHub Actions Trainingslauf #39653165893](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39653165893). Umsetzung: `tests/ai-historical-fusion-followup-v144.cjs`, Workflow: `.github/workflows/ai-historical-fusion-followup-v144.yml`.

- **Wiederverwendung alter Befunde:** Original-Artefakte der erfolgreichen v13.6-Generationen, v14.2-Override-Audit und v14.3-Fusionsbewertung werden automatisch abgerufen und per Schema/Fachbedingungen verifiziert. Die Berichte priorisieren die Trainingsaufgaben; frühere Holdout-Sieger werden nicht in aktuelle Kandidatenfit-Daten umgewandelt.
- **Fach 1:** Nach tatsächlich aufgelöster Normal- oder Fusionsplatzierung prüft die echte Engine legale unmittelbare Folgeaktionen (Angriff, Soul-Drain, Guardian-Heilung). Verfügbarkeit, erfolgreiche Engine-Ausführung und positiver kurzfristiger Boardnutzen werden protokolliert. Kein Zug aus fremder Hand und kein zusätzlicher Gratiszug.
- **Fach 2:** Öffentlich sichtbarer gegnerischer Angriffsdruck – Feldangreifer, ACE am Feld, eigene Abwehr – geht als eigene Bewertungsgröße ein. Der Controller darf weiterhin gegen eine ressourcenintensive Fusion entscheiden.
- **Drei auf aktuellen Trainingsdecks getestete Parameterkombinationen:** konservativ, ausgewogen, Gegenspiel. Eingefrorene Champion-Gewichte bleiben unverändert. Nur der anhand neuer Trainingsduelle bestimmte Kandidat wird auf fremden Decks/Seeds gegen v14.3, Champion, VII/IX/X und Offensive-/DEF-/Fusionsspezialisten geprüft.
- **Regelprüfung:** originale Duell-Engine, kein eigenmächtig erzeugtes Monster, keine ausgedachten Fusionen, keine ausgelesenen verdeckten gegnerischen Karten. v14.4 implementiert noch keinen 2–3-Runden-Minimax-Planer; die Auswertung folgt ausschließlich aus aktuellen GitHub-Reports.
- **Promotiongate:** mindestens 56 % gegen Champion, mindestens 53 % gegen v14.3, Bossleistung nicht schlechter und mindestens 45 % gegen jeden Experten. Andernfalls keine neue KI-Übernahme.
- **Archivierung:** Ausführlicher Report, Historien-Lernplan und Kandidatenparameter im GitHub-Artefakt des Workflows; die praktische produktive Gegner-KI und `main` bleiben bis zur unabhängigen Validierung unverändert.

## Abschluss v14.4 – Folgeaktionen, historische Berichte und Bosskontrolle (21.10.2026)

[Ausführlicher Prüfbericht](AI_V144_HISTORICAL_FOLLOWUP_RESULTS_20261021.md) · [abgeschlossener Workflow #39653165893](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39653165893) · [Original-Artefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39653165893/artifacts/12370433620).

- **GitHub SUCCESS**, 42/42 Regeltests, vollständiger Pilot und Hauptlauf. Originalberichte v13.6, v14.2 und v14.3 validiert.
- Drei neue Folgeaktions-/Kontergewichte auf 36 Trainingsszenarien mit gespiegelten Sitzen. Gewählt `followup-conservative` mit **34/72 Siegen** (47,2 %) – alle drei Varianten bleiben im Train-Test unter 50 %.
- Holdout mit 48 unabhängigen Szenarien: **49/96** Siege (51,0 %) gegen v14.3-Fusionsplaner und **56/96** (58,3 %) gegen den unmodifizierten Champion.
- Boss VII/IX/X: **6/24** neuer Kandidat, **6/24** v14.3, **8/24** Champion. Für X **0/8** beim neuen Kandidaten.
- Spezialisten: Offensiv **10/20**, DEF **11/20**, Fusion/Ökonomie **14/20**.
- Im v14.3-A/B-Holdout **1.802** zusätzliche legale Aktionsexperimente in geklonten Ständen, **619** mit positivem angenommenem Nutzen. Dies sind **Simulationsmöglichkeiten, nicht 619 tatsächlich im Duell gespielte Folgeaktionen**.
- **Keine Promotion**, da direkte v14.3-Schwelle von 53 % verfehlt wurde und Bossleistung nicht mindestens Championniveau erreicht.
- **v14.5 Prioritäten:** realer Phasenablauf nach Fusion (inkl. Positionsphase) vor hypothetischem Folgeangriff, Vergleich von geplanten und tatsächlich ausgeführten Aktionen, mechanikspezifische Nutzungsstatistiken für Soul-Drain/Guardian-Heal, Gegner-X-Stress-Tests und mehrfach gesampelte legale Gegenspiel-Antworten. Historische Dokumentation soll die Lektionen, nicht rückwirkend die optimale Aktion festlegen.

## Implementation v14.5 – Drei Hauptstrategien und Regelkunde (21.10.2026)

[Live-Actions-Workflow #39657418644](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39657418644) · Trainer `tests/ai-three-strategy-curriculum-v145.cjs` · Workflow `.github/workflows/ai-three-strategy-curriculum-v145.yml`.

- **Offensive/Predator:** Attackendruck, direkte LP-Gefahr, Angriffsverschleiß, sichtbare ACE-Risiken und sichere Gegenzüge.
- **Verteidigung/Wächter/Seelenzehrer:** Schutz und DEF, legale Wächter-Heilung, Seelenentzug, Feldwert und Überlebensfähigkeit.
- **Fusion/Materialökonomie:** Wirklich aufgelöste Fusionswürfe und Platzierung, Materialkosten, Synergien, Folgeaktionen und Zerfall.
- Jede Strategie hat zwei unterschiedliche Gewichtsprofile. Auswahl durch auf neue **Trainingsdecks** beschränkte Duelle; alle drei gewonnenen Spezialisierungen anschließend an **unbenutzten Decks/Seeds** mit gespiegelten Starts, Original-Champion, v14.3 und späten Bossen messen.
- **Regelvertrag:** `docs/AI-REGELWERK-V130.md` bleibt Grundlage. CI erweitert die ausführbaren Prüfungen um Fusionen, Essence, Resonanz, Rollenvererbung, ACE/LV1 und Ökonomie. Tests zeigen Korrektheit, aber **nicht**, dass jede komplexe Regel im strategischen Controller autonom gemeistert wird.
- **v14.4-Korrektur:** Eine beurteilte Folgeaktion wird nur über legale Entscheidungen der **originalen** Engine-Phasenlogik erreicht, nicht durch künstliches Umschalten auf `attacks`. Absichten werden unabhängig von tatsächlich ausgeführten Handlungen gezählt.
- **Historische Ergebnisse:** v14.2/v14.3/v14.4 originale Berichte werden geladen und als Lehrziele wiederverwendet; keine alte Holdout-Antwort geht ins Training. Ein versionierter Bericht und drei Strategiekonfigurationen werden nach Lauf archiviert.
- **Grenzen:** Kein garantierter Zugriff auf fremde Karten oder künftige Würfe; kein echtes mehrzügiges vollumfängliches RL und keine Behauptung, alle Sonderquests/economy bereits gelernt zu haben. `main`, Produktivgegner und gespeicherter Champion werden bis zu klarer Validierung nicht verändert.
- Bewertung erst nach abgeschlossenem Workflow und Originalbericht vornehmen.

## Abschluss v14.5 – Hauptstrategien und prüfbare Regelkenntnis (21.10.2026)

[Ausführlicher v14.5-Prüfbericht](AI_V145_THREE_STRATEGY_CURRICULUM_RESULTS_20261021.md) · [erfolgreicher GitHub-Lauf #39657418644](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39657418644) · [Originalartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39657418644/artifacts/12371433658).

- Alle **86 Regeltests** erfolgreich, 84 neue Trainings- und 84 unabhängige Holdout-Szenarien, jeweils nach drei Strategiegruppen und mit Seitenwechseln.
- Train-only ausgewählte Parameter: `pressure-controlled` für Offensiv, `guardian-stable` für Guardian/Soul und `fusion-conserve` für Fusion/Material. Es handelt sich um Parameterprofile bei eingefrorenen 15 Championgewichten, **nicht** um bewiesene vollständige Regelmeisterschaft oder automatisches Recurrent-/RL-Lernen.
- Unabhängige Ergebnisse: **79/168 (47,0 %)** gegen v14.3, **88/168 (52,4 %)** gegen Champion. Besonders Fusion verliert **32/72 (44,4 %)** gegen v14.3; Defensive gegen Champion **27/48 (56,3 %)**.
- Boss VII/IX/X zusammen: **15/42** neuer Kandidat, **17/42** v14.3 und **14/42** Champion. **X: 0/14 alle drei**. Spezialisten: Offensiv **14/28**, DEF **13/28**, Fusion **17/28**.
- V14.5 unterscheidet erstmals beabsichtigte von später ausgeführten Followup-Aktionstypen: **347** Planungsabsichten und **346** später passende Aktionsarten auf erfolgreich gemeldeten Engineaktionen. **Vorsicht:** Noch kein Nachweis identischer Karte/UID/Ziel/Positionswahl oder wirksamen Kombos.
- Kein neues Modell befördert. **v14.6 Prioritäten:** echte Aktions-/UID-/Target-/State-Deltas aufnehmen; je Hauptstrategie isolierte Mechaniklektionen mit legalen Vergleichen, Schwerpunkt Vermeidung von Fusionsrückschritten; konkrete X-Fehleranalyse, persistente versionierte Replay-Daten, mehrfaches unabhängiges Sampling. Bevorzugt nachweisbare Entscheidungen statt bloß erhöhte Anzahl Selbstspielrunden.

## Implementation v14.6 – Drei ehrliche Spiegelstrategien und begründete Entscheidungen (21.10.2026)

[GitHub-Trainingslauf #39663274946](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39663274946) · Trainer `tests/ai-mirror-explanations-v146.cjs` · Workflow `.github/workflows/ai-mirror-explanations-v146.yml`.

- **Genau gespiegelte A/B-Tests**: gleiches legales 40er Hauptdeck, gleiche Fusionsliste und gleicher Startseed, Kandidat/v14.5 übernehmen jeweils beide Sitzpositionen; gesonderte Tests gegen Champion. Gleiches Initialszenario schützt nicht vor unterschiedlichem RNG-Verbrauch durch unterschiedliche Aktionen.
- **Drei Strategien in eigenen Curricula**: Offensiv Predator/Tempo, Guardian/Soul und Fusion/Resonator/Allrounder/Hybrid. Trainingsparameter je Gruppe unabhängig gewählt; komplett neue Deckfingerprints und RNG-Seeds für den Holdout.
- **Bisherige Berichte v14.2–v14.5**: Original-Historienartefakte werden geladen, Schemata verifiziert und gute/schlechte Lektionen berücksichtigt. Alte Holdouts bleiben ausschließlich Diagnosequellen, keine fertigen Optimalzug-Labels.
- **KI-Erklärungen**: Zu ausgewählten echten Aktionen wird protokolliert, welche legalen Vorschläge bewertet wurden, wie sich Score-Beiträge z. B. Angriffskraft, Fusion, Materialkosten, Risiko, Wächter/Soul zusammensetzen und welche Option als Nächstes folgte. `decision-explanations.json` enthält zudem die tatsächlich durch die Engine beobachteten Vorher/Nachher-Zustände. Das sind Interpretationen des Policy-Scores, **keine** inneren Gedanken, Wahrscheinlichkeitsgarantien oder Kausalbeweise.
- **Geplante vs. ausgeführte Folgeaktionen**: bisherige Typ-Übereinstimmung wird jetzt ergänzt durch **exakten Aktionsvergleich inklusive Material-UIDs, Feldslot und Angriffsziel**. Die Erfolgswirkung ist getrennt mit Spielzustands-Deltas zu beurteilen.
- **Breite Regelprüfung**: die Mechanik-Tests zu Angriff und Verschleiß, Guardian/Soul, Fusion/Vererbung/Resonanz, LV1/ACE, Essence und Inventar/Ökonomie bleiben vorgeschaltet. Kein bestandener Regeltest allein ist ein Beweis für vollständiges strategisches Verständnis.
- **Sicherheitsentscheidung**: Keine automatische Live-NPC-Integration und kein `main`-Merge bei einem einfach nur erfolgreich durchgelaufenen Training; positive Ergebnisse müssen gegenüber v14.5, Champion, Bossen und Spezialisten in wirklich getrennten Holdouts bestehen.
- **Konkreter Langzeitspeicher**: Erklärung und tatsächliche Aktionseffekte versioniert mit aktuellem Regel-Commit archivieren; Workflow-Artefakte sind nur zeitlich begrenzt verfügbar.

## Abschluss v14.6 – gespiegelte drei Strategien, exakte Folgeaktionen und KI-Begründungen (21.10.2026)

[Prüfbericht v14.6](AI_V146_MIRROR_EXPLAINABLE_RESULTS_20261021.md) · [GitHub Actions SUCCESS #39663274946](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39663274946) · [Originaldaten und Entscheidungsprotokolle](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39663274946/artifacts/12376790934).

- **86/86 Regressionstests bestanden**, 84 Trainings- und 84 unabhängige Holdout-Szenarien, jeweils gleiches legales Deck, Start-Seed und gespiegelter Spielersitz pro Vergleich.
- Alle drei Spezial-Strategien **exakt 50 %** gegen v14.5: Offensive **24/48**, Guardian/Soul **24/48**, Fusion/Hybrid/Allrounder **36/72**. Gegen Champion **91/168 (54,2 %)**. Es gibt keinen neuen bestätigten spielstarken Kandidaten.
- Boss VII/IX/X: **12/42 v14.6**, **11/42 v14.5**, **15/42 Champion**; bei X v14.6 **1/14**. Gegen Spezialisten Offensiv **20/28**, DEF **20/28**, Fusion **22/28**.
- **Folgeaktionen:** **709** geplante und später nach Aktionstyp ausgeführte Aktionen, aber nur **513 exakte Aktionsmatches (72,4 %)**. Die übrigen **196** haben unterschiedliche Angreifer/Ziele/Slots oder Materialien. Eine exakte Aktion beweist allein keinen besseren Nutzen.
- **Erklärungsnachweis aus dem Artefakt:** 12 erfasste Spielszenarien, 120 Entscheidungsnotizen und 216 Spielaktions-Deltas. Die lineare Feature-Erklärung stimmt mit der finalen Lookahead-Rangfolge nicht immer überein: **24 negative Score-Abstände**; **74** Notizen betreffen nicht im linearen Kandidaten-Set erfasste Phasen-/Fallbackaktionen (`legalCandidate:false` ist **nicht** automatisch eine illegale Aktion).
- **Wichtiges Diagnosesignal:** Genau 50 % gegen v14.5 für sämtliche Deckklassen und in 5/6 gesampelten gespiegelten Perspektiven identische Aktionsreihenfolge. Bevor weitere Trainingsmassen laufen: paarweise tatsächliche Policy-Overrides nach UID/Slot/Ziel messen und prüfen, ob neue Gewichtungen das Handeln überhaupt ändern.
- **v14.7 Priorität:** endgültige `lookahead`-Werte je Alternative protokollieren (nicht nur linearen Score), geplante und tatsächlich ausgeführte Folgeschritte mit Spielzustands-Hash und Ergebnis verknüpfen; echte Gegenproben an unsicheren Situationen; Boss VII/X auf Kartenverfügbarkeit/ACE und legalen Konter untersuchen. Historische Berichte bleiben Lehrplan, kein Testdatenleck.
- **Kein Rollout**: Champion, `main` und produktive Gegner unverändert; `qualifiesForPromotion:false`.

## Umsetzung v14.7 – transparente finale Planerwertung und historisch begründete Lernschritte (21.10.2026)

[Trainingslauf GitHub Actions #39666416233](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39666416233) · `tests/ai-final-score-transparency-v147.cjs` · Workflow `.github/workflows/ai-final-score-transparency-v147.yml`.

- **Historische Grundlagen:** Wiederherstellung und Schema-Prüfung der echten v13.6-, v14.2-, v14.3-, v14.4-, v14.5- und v14.6-Artefakte. Kein Nachtrainieren auf alten unabhängigen Holdout-Ausgängen; die Berichte dienen zur Auswahl der Lernfragen.
- **Echte Erklärungswerte statt Proxy:** Jede nach einem Planner-Ranking untersuchte Beschwörung, Fusion, Angriff oder Zugende erhält (bei den aufgezeichneten Testentscheidungen) die direkt in derselben Berechnung gebildeten Score-Bestandteile: `linearContribution`, `postPlacement`, `legalFollowup`, `visibleThreat`, `materialCost`, `fusionReserve`, `tempo`, `end`. Der aufsummierte Score muss auf maximal `1e-7` mit dem tatsächlichen Ranking übereinstimmen. Fallbacks werden getrennt von finalem Planerranking markiert.
- **Derselbe Zustand als Gegenprobe:** Mit identischen tatsächlich evaluierten Alternativen wird der Score der v14.6-Vorgängerprofile erneut zusammengesetzt. Das zeigt, ob **die Profiländerung bei identischen Aktionsfolgen** eine andere Rangfolge erzeugt. Es ist keine unabhängige Neu-Simulation mit identischen RNG-Fortsetzungen.
- **Drei Strategien bleiben getrennt:** Offensive/Predator-Tempo, Verteidigung/Guardian-Soul und Fusion/Hybrid/Resonator. Je zwei konservative Profilvarianten werden auf neuen Trainingsfällen getestet, dann pro Hauptstrategie auf unbekannten legalen Decks und gespiegelten Sitzplätzen gegen v14.6, Champion, VII/IX/X und drei Experten geprüft.
- **Folgeaktionen:** Plan und tatsächliche Aktion werden wie v14.6 getrennt erfasst, mit Aktionsart und exaktem UID/Slot/Ziel-Match. Die originalen Engine-Aktions-Snapshots bleiben separate Beobachtungen und werden nicht zu behaupteten Gedanken/Wahrscheinlichkeiten umgedeutet.
- **Promotion weiterhin geschützt:** Gleiche vorherige Mindestschwellen für unabhängige Duelle, Boss-Gegner und Experten; ohne bestandenen Vergleich weder produktive NPC-Umstellung noch `main`-Merge oder Änderung des 1.920-Partien-Champions.
- **Forschungsgrenzen:** Kein vollständiger Zwei- oder Dreizüge-Ausblick mit verborgenen gegnerischen Karten. Ein exakt addierter Heuristikscore ist eine **transparente Erklärung**, aber nicht automatisch die richtige Strategie. Der GitHub-Workflow-Status und seine Originaldaten entscheiden über den Prüfbefund.

## Abschluss v14.7 – finaler Score korrekt erklärt, aber kaum neue Entscheidungen (21.10.2026)

[Prüfbericht v14.7](AI_V147_FINAL_SCORE_TRANSPARENCY_RESULTS_20261021.md) · [GitHub Actions SUCCESS #39666712311](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39666712311) · [Originalartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39666712311/artifacts/12378775061).

- Korrigierter v14.7-Workflow am 21.10.2026 um 22:05 MESZ erfolgreich abgeschlossen. **86/86 Regeltests**, 63 Trainings- und 63 unabhängige Holdout-Szenarien, gespiegelte Startbedingungen.
- Trainingsvarianten: Offensiv jeweils 18/36; DEF jeweils 18/36; Fusion 27/54 vs. 28/54. Keine glaubwürdige breite Verbesserung im Training.
- Holdout: **61/126 (48,4 %)** gegen v14.6, **72/126 (57,1 %)** gegen unveränderten Champion. Boss VII/IX/X zusammen **5/32** neuer Kandidat, **5/32** v14.6, **6/32** Champion; X **0/11**. Spezialisten 19/24, 20/24, 19/24. **Promotion nein**; Scheitern an v14.6- und Boss-Schwellen.
- Transparenz: **63 direkt aufgezeichnete finale Planerbewertungen**, **240 legale/aufgelöste Aktionsalternativen**, **0 Rechen-/Rekonstruktionsfehler**, **0 andere Topaktionen** gegenüber v14.6 bei Wiederbewertung derselben simulierter Endzustände. **Alle 63 im `summon`-Abschnitt; 59 normale Beschwörungen, 4 Fusionen.** Angriffs- und aktiven DEF-Fähigkeiten fehlen noch im finalen Audit.
- Aktionsabsichten **537**, Aktionstyp später 533/537 passend, exakt gleiche UID/Ziel/Slot-Signatur **354/537 (65,9 %)**. Signaturgleichheit beweist keine tatsächlich realisierte taktische Wirkung.
- **v14.8 nächste Entwicklung:** Erst echte neue Aktionsentscheidungen nachweisen statt nur Heuristikparameter ändern; finale Score-Rechnungen für `attack`, `switch`, Wächter-Heilung, Soul-Drain und alle Positionsphasen; wiederholbare eigene Replay-Zustände samt Legal-Set, tatsächlich erzieltem Vorteil und historischem Regel-Commit archivieren. Danach gezielte Gegenproben mit mehreren neuen Seeds und unverfälschten Holdouts. Boss VII/X und Def-/Fusionsmechaniken detailliert behandeln.

## Umsetzung v14.8 – Kampfentscheidungen statt kleiner Fusions-Score-Änderungen (22.10.2026)

[GitHub-Actions-Lauf #39713425902](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39713425902) · Trainer `tests/ai-allphase-tactics-v148.cjs` · Workflow `.github/workflows/ai-allphase-tactics-v148.yml`.

- **Aus v14.7 gelernt:** Nur 63 gemessene direkte Entscheidungspunkte, alle Beschwörung und **keine** neuen Topaktionen unter kleinen Score-Änderungen. Deshalb prüft v14.8 erstmals neue einsatzfähige Aktionen während `attacks` und `positions`.
- **Drei neue fokussierte Curricula:** Offensiv/Predator/Tempo mit Angriffsziel, tatsächlichem LP-Schaden und Gegenschlagrisiko; Guardian/Soul mit Seelenentzug, legaler Heilung und DEF-Stabilität; Fusion mit Materialökonomie plus sicherem Angriff nach tatsächlicher Platzierung.
- **Echte Engine statt Scheinauswertung:** Alle taktischen Kandidaten (Attacke, Soul-Drain, Heal, Switch, End) werden zuerst auf Klonen durch `applyAiAction` abgearbeitet. Unzulässige Ergebnisse werden verworfen, Phasenwechsel bleiben bei der originalen KI; der bisherige v14.7-Beschwörungsplaner bleibt Vergleichsreferenz. Die gewählte Aktion wird am echten Spielzustand erneut durch die Engine verarbeitet.
- **Vergleich mit Vorversion:** Vorangegangene v14.2–v14.7-Berichte werden aus Original-Artefakten mit Schema-Validierung gelesen. Die aus älteren Holdouts abgeleiteten Schwachstellen dienen nur als Lehrziele, nicht als neue Aktionslabels.
- **Trainingsmethodik:** pro Hauptstrategie zwei neue Taktikprofile auf 63 frischen Trainingsszenarien (Pilot 21), Auswahl nur auf Trainingsdaten. 63 unabhängige Holdout-Szenarien mit identischen Ausgangsdecks und gespiegelten Spielersitzen gegen v14.7, zusätzlich Original-Champion, VII/IX/X und drei Spezialisten. Geprüft werden neue tatsächlich gewählte Aktionen, nicht bloß Score-Unterschiede.
- **Nachvollziehbarkeit:** Versionsgebundene Spielsituationen mit Deckfingerprint, Seed, beobachteten legalen Alternativen und tatsächlichen Aktionszuständen im GitHub-Actions-Artefakt `artifacts/v148` speichern. Es sind Beispiele für spätere Replays, noch kein automatischer Langzeit-Algorithmus, der jede Spielsituation gelernt hat.
- **Sicherheitsgrenze:** Produktive Gegner-KI, `main` und das 1.920-Partien-Champion-Modell bleiben unverändert, solange der Kandidat die unabhängigen Leistungskriterien nicht besteht. Die erste Workflow-Ausführung (#39713362841) brach in der Syntaxprüfung ab und wurde korrigiert; gültige Testdaten kommen ausschließlich aus einem erfolgreich abgeschlossenen Lauf.

## Abschluss v14.8 – Root Cause: Kampfplaner durch `summon-only` deaktiviert (22.10.2026)

[Ausführlicher Prüfbericht](AI_V148_TACTICAL_TRAINING_RESULTS_20261022.md) · [GitHub SUCCESS #39713425902](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39713425902) · [Original-Report-Archiv](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39713425902/artifacts/12397808726).

- **86/86 Regressionstests bestanden**, voller Pilot und 63 Trainings-/63 Holdout-Szenarien mit Mirror-Positionen abgeschlossen. **Aber das neue Feature wurde 0-mal ausgewertet**: `evaluations=0`, `interventions=0` in Pilot und Hauptserie.
- **Ursache im Trainer:** v14.8 ersetzt zwar den aufgerufenen `lookahead148`, ruft ihn jedoch ausschließlich innerhalb des geerbten `allowPlanner141(..., plannerGate)` auf. Alle Aufrufe nutzen `plannerGate='summon-only'`, das nur `g.aiPhase==='summon'` zulässt. Dadurch gelangt die neue Taktik in `attacks`/`positions` nie zur Ausführung.
- Training sechs Varianten jeweils **50 %**, Holdout gegen v14.7 **63/126 = 50,0 %**, gegen ursprünglichen Champion **62/126 = 49,2 %**. VII/IX/X gesamt **9/32** Kandidat, **9/32** v14.7, **12/32** Champion; X **0/11** Kandidat. **Dies ist keine wirksame Prüfung der neuen Kampf-/DEF-/Soul-Funktionen.**
- Der als `success` abgeschlossene Workflow ist ein **CI-Abdeckungsfehler**: Es fehlte eine zwingende Assertion, dass die neu implementierten Mechanikzweige auch ausgeführt wurden. Ein grüner Lauf beweist nicht, dass das neue Verhalten aktiv war.
- **Nächster Schritt v14.8.1, vor mehr Training:** Phase-Gate korrigieren, im Pilot jeweils `summon`, `positions`, `attacks` nachweisen; gezielt legalen Angriff, legalen Wächter-Heal und Seelenentzug erzeugen; CI mit `assert(v148Evaluations>0)` **und** auswertbaren Phasenzählern absichern; gleiches Regelwerk/gleiche Ausgangsdecks und echte Sitzspiegelung gegen v14.7. Erst danach aus neuen Leistungsdaten einen Kandidaten ableiten.
- Weiterhin keine Produktionseinführung und keine Veränderung am Main-Branch oder eingefrorenen Champion.

## v14.8.1 – Aktivierung der Taktik und verpflichtender Wirksamkeitsnachweis (22.10.2026)

[GitHub-Actions-Workflow #39717121220](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39717121220) · Trainer `tests/ai-activated-tactics-v1481.cjs` · Workflow `.github/workflows/ai-activated-tactics-v1481.yml`.

- **Konkrete Korrektur aus v14.8:** sämtliche A/B-Duell-, Champion-, Boss- und Spezialistenaufrufe verwenden bei v14.8.1 `plannerGate='always'`, damit Angriffs- und Positionsentscheidungen nicht mehr durch `summon-only` übersprungen werden. Der früher eingefrorene v14.7-Controller bleibt unverändert im direkten Vergleich.
- **Fail-closed Pilot statt falsches CI-Grün:** Training bricht vor dem Holdout mit einer expliziten Assertion ab, wenn `attacks` oder `positions` nicht erreicht werden, keine Taktikbewertungen stattfinden oder kein legaler Angriff angeboten wurde. Zu Beginn wird der v14.8-Originalbericht eingelesen und dessen **0 Bewertungen** als reproduzierbarer Root-Cause-Befund nachgeprüft.
- **Lerngegenstand:** tatsächlich legale, auf geklonten echten Engine-Zuständen angewandte Angriffe, Soul-Drain, Guardian-Heilung und Positionswechsel. Für die drei Strategiegruppen je zwei Profile, Auswahl ausschließlich auf neuem Training, anschließend unabhängige Mirror-Matches auf identischen Ausgangsdecks mit getauschten Sitzplätzen.
- **Historische Lernbasis:** v13.6 und v14.2–v14.8 Original-GitHub-Artefakte; keine alten Holdout-Resultate als vermeintliche optimale Zuglabels. Taktik-Traces dokumentieren gewichtete Score-Bestandteile für geprüfte Kandidaten; das unmittelbare Board-Delta ist keine bewiesene mehrzügige Erfolgsprognose.
- **Entscheidung:** Erst Pilot-Wirksamkeitsnachweis und danach unabhängig belegte Siege gegen v14.7, Champion, Boss VII/IX/X und drei Spezialisten. **Kein** produktiver Rollout/Änderung von `main` oder eingefrorenen Champion-Gewichten allein aufgrund grüner CI.

## Abschluss v14.8.1 – Taktik aktiviert, neues Profil ändert Entscheidungen kaum (22.10.2026)

[Verifizierter Prüfbericht](AI_V1481_ACTIVATED_TACTICS_RESULTS_20261022.md) · [GitHub Actions SUCCESS #39717386115](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39717386115) · [Originalbericht und Replay-Archiv](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39717386115/artifacts/12399956319).

- **86/86 Regeltests erfolgreich**, korrigierter Workflow vollständig inklusive Pilot, 63 Training-/63 Holdout-Szenarien und unverfälschten A/B-Seitenwechseln. Der Gate-Fehler aus v14.8 ist **nachweislich korrigiert** (`always` statt `summon-only`).
- Training: **1.358 Angriffsphase-Aufrufe**, **102 Positionsphasen**, **677 legal angebotene Angriffe**, **1.388 taktische Bewertungen**, dabei **5 andere Topaktionen** gegenüber dem alten **internen Score auf denselben Kandidaten** (ca. 0,36 %).
- Unabhängiger Holdout: **727 echte taktische Bewertungen**, **0 interne Rerankings**, **63/126 (50,0 %)** gegen v14.7 und **63/126 (50,0 %)** gegen Original-Champion. Alle drei Strategiebereiche liegen exakt bei 50 % vs. v14.7; kein Promotionskriterium erfüllt.
- Neue Taktik ist echt aktiv: unabhängige Kandidatenzähler beinhalten **338 legale Angriffsoptionen**, **38 Soul-Extract-Optionen**, **11 Guardian-Heal-Optionen**, **34 Positionswechsel-Optionen**. Ausgewählt wurden u. a. **248 Angriffe, 22 Soul-Extract, 6 Heilungen, 27 Switches**. Das beweist Regelfähigkeit/Verwendung, **nicht** beste strategische Wahl.
- Boss VII/IX/X **9/32 Kandidat** vs. **9/32 v14.7** und **12/32 Champion**; bei X Kandidat **0/11**. Spezialisten: Offensiv **12/24**, Support **11/24**, Fusion **16/24**. Produktive KI und Champion bleiben unverändert.
- **Entscheidende Messlücke:** Der `v148Interventions`-Counter vergleicht neuen Gesamtscore vs. reduzierten `oldScore` **innerhalb derselben einmalig simulierten Kandidatenmenge**. Er ist kein direkter Vergleich mit einer realen v14.7-Aktion am selben Ausgangszustand. Auch 50 % in den Mirror Matches belegt keine vollständige Aktionsidentität. Das muss v14.8.2 korrigieren.
- **Nächste Prioritäten:** (1) echten früheren Controller in identischer Boardkopie mitloggen, genaue UID/Ziel-/Slot-Aktionsdifferenzen; (2) getrennte Zwangslektionen für Predator-Angriff, Guardian-Heilung und Soul-Drain mit überprüfter Legalität und Phasenablauf; (3) differierende Entscheidungen mit neuen Seeds und realen Folgen nach mehreren Zügen wiederholen; (4) korrekte Phase-Transitions inklusive `advance-phase` und Zugende; (5) Replays dauerhaft mit Quell-Commit und Game State archivieren; (6) Fail-closed-Pilot für echte Aktionsunterschiede vor größeren Runs.
- **Promotion:** `false`, `productionIntegrated:false`. Keine produktive NPC-Änderung, kein Main-Merge.

## v14.8.2 – Tatsächliche Entscheidungsvergleiche und Sitzplatzvorteil (22.10.2026)

[GitHub Actions #39720256066](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39720256066) · Trainer `tests/ai-true-baseline-mirrors-v1482.cjs` · Workflow `.github/workflows/ai-true-baseline-mirrors-v1482.yml`.

- **Diagnose von v14.8.1:** In allen neun archivierten Mirror-Match-Paaren gewann jeweils dieselbe Sitzposition, obwohl Kandidat und Referenz ihre Plätze wechselten. So ergeben sich auch bei unterschiedlicher Stärke automatisch jeweils ein Sieg/eine Niederlage pro Paar. Die fortgesetzte 50-%-Rate ist deshalb ohne Sitzplatzkontrolle **kein brauchbarer Lernnachweis**.
- **Geprüfte Baseline statt künstliche Score-Gegenprobe:** v14.8.2 ruft den tatsächlichen v14.7-Planer (mit seinem linearen Fallback) auf einem **geklonten, identischen Vorher-Spielzustand** auf. Erfasst werden exakte Aktionsdifferenzen nach Monster, Kartenauswahl, Ziel und Slot, die gegensätzlichen Aktionen und die sichtbare Boardlage. Technische Limitation: stochastische innere Zweige können die RNG-Reihenfolge beeinflussen; ein Klonzustand ist kein vollständiger unabhängiger Paralleluniversum-Rollout.
- **Sitzplatzwirkung getrennt:** Mirror-Paare reportieren gleiche vs. gewechselte Gewinnerposition, Sieg auf beiden Plätzen für Kandidat/Referenz sowie Siege auf Sitz 0. Die frühere pauschale 50-%-Gesamtquote wird nicht als endgültige Aussage über gleich gute Entscheidungen betrachtet.
- **Drei Curricula mit gezielter Variation:** Offensive mit hohem Angriffsdruck und geringerer unmittelbarer Boardgewichtung; Guardian/Soul mit stärkerer DEF-Sicherung/Seelenentzug; Fusion mit defensivem Feldaufbau bzw. Tempofokus. Die alten 15 Championgewichte bleiben eingefroren, es werden nur experimentelle Heuristikprofile verglichen.
- **Umfang:** Pilot 21 Trainings- und 21 Holdout-Szenarien; umfangreich 84 Trainings- und 84 unabhängig erzeugte Holdout-Szenarien (Mirror auf demselben Startdeck mit Sitzwechsel), zusätzliche Boss-/Spezialistenprüfungen. Training profilauswahl ausschließlich aus Trainingsmatches, Originalberichte v13.6/v14.2–v14.8.1 verifiziert.
- **Pilot-Abbruchkriterien:** tatsächliche Angriffs-/Positionsphasen, legaler Angriff, mehr als 0 Taktikbewertungen und echter `v147`-Aktionsvergleich müssen nachgewiesen sein. **Nicht** künstlich veränderte Züge oder erzielte Siege voraussetzen.
- **Wichtige Einschränkung:** Ein anderer Zug ist nicht zwingend ein besserer Zug. Ursachenverständnis erfordert später wiederholte Fortsetzungen mit Gegnerantworten auf unveränderten Ausgangspositionen. Kein automatischer Rollout in `main` oder produktive NPC-KI; keine Promotion ohne robuste externe Verbesserung.

## v14.8.3 – Reversibler Skills-/Perks-Off-Modus und Startfairness (22.10.2026)

[GitHub Actions v14.8.3](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/workflows/ai-neutral-skills-start-fairness-v1483.yml) · Trainer `tests/ai-neutral-skills-start-fairness-v1483.cjs` · Workflow `.github/workflows/ai-neutral-skills-start-fairness-v1483.yml`.

- **Scope:** Nur für isolierte KI-Testpartien über `scene.neutralSkills=true`: setzt alle `profile.upgrades` (Perks) auf null, alle PvE-Spielerverstärkungen auf `power=1`/leere `enhancements`, entfernt Kartenfähigkeiten (`ability`, `role`, `soulRank`, `essenceSchool`, `passive`, `skill`, `perk`, `effect`, `roleOverride`), deaktiviert Essenz- und Schicksals-Sondereffekte. Normale Grundwerte, Beschwörung, Angriff, Fusion und die regulären Starterschutz-Regeln bleiben. Die reguläre Spielversion ist unverändert.
- **Reversibel:** Jede Partie startet einen neuen, unabhängigen JavaScript-VM-Kontext und lädt die Originalscripts. `scene.neutralSkills=false` nutzt unveränderte Mechanik. Pilot prüft, dass Kartenfähigkeiten nach dem Abschalten tatsächlich neutralisiert sind, Upgrades null, PvE-Bonusfaktoren ausgeglichen und das anschließende Spiel ohne Neutralmodus wieder unveränderte Fähigkeitsdaten besitzt. Protokoll `artifacts/v1483/mode-config.json`.
- **Vier faktoriell getrennte Startbedingungen:** Für dieselben neuen Decks und denselben Ausgangsseed sowohl Startspieler 0 und Startspieler 1, jeweils mit ursprünglichen oder vollständig **vertauschten Starthänden inklusive Deckreihenfolge**. Nicht nur KI-Plätze tauschen. 100 % gleiche Kartenpools, aber bewusst verschiedene zufällige Originalstarthände.
- **Kontrollen:** Für jeden dieser vier Fälle zuerst **v14.7 gegen sich selbst** mit identischem KI-Profil und denselben eingefrorenen Gewichten auf beiden Spielerplätzen. Zusätzlich auf denselben Startbedingungen v14.8.2-Kandidat gegen die v14.7-Referenz mit beidseitigem Positionswechsel. Separat wird berichtet, ob der Gewinner nach Starter-/Handtausch wechselt, ob stets dieselbe Position gewinnt und ob der Kandidat trotz Sitzwechsel beide Male siegen kann.
- **Umfang und Erfolgskriterium:** Pilot 21 Trainings-/21 Holdout-Szenarien; ausgedehnter Lauf 84 Trainings- und 84 unabhängige Holdout-Szenarien, mehrere Startbedingungen und deutlich über 1.000 vollständig berechnete Spiele. Historische Originalberichte bis v14.8.2 werden eingelesen und auf korrekte Schemata geprüft. Primär **Ursachendiagnose**, noch kein autonomer Deep-RL-Gewichtsupdate oder verbindlicher Champion-Wechsel.
- **Grenzen:** Die neutralisierten Rolleneffekte machen aus dem Skills-Off-Lauf **keinen** Performance-Nachweis der vollständigen Live-Spielmechaniken. Andere Spielerplatzasymmetrien im PvE-Testcode sind gerade Teil der Untersuchung. Kein `main`-Merge, keine produktive KI-Änderung, keinerlei Löschung gespeicherter Skills/Perks.

## v14.8.3 – Speicherabsturz und Korrektur (22.10.2026)

- **Erster Lauf #39722113328:** `failure` in `Extensive skills-off starter and swapped hand-deck controlled mirror tests`, konkret **`FATAL ERROR: Ineffective mark-compacts near heap limit / JavaScript heap out of memory`**, Exit-Code 134. Alle 86 allgemeinen Engine-Tests und der Pilot mit **21 neutralisierten Holdout-Szenarien / vier kontrollierten Startbedingungen** bestanden zuvor. `ARCANE_V1483_NEUTRAL_PILOT` bestätigte 474 Karten mit Fähigkeitsmetadaten im Original-VM vs. 0 im neutralisierten VM und reversible Wiederherstellung. Im vollständigen Lauf waren die drei Trainings-Strategiegruppen vor dem Speicherabsturz beendet, **nicht** aber alle 84 Holdout-Szenarien. Der Lauf gilt als **abgebrochen** und darf nicht als vollständiger 84er-Prüfbericht verwendet werden.
- **Fix:** Statt im selben Node.js-Prozess alle vier Bedingungen plus alle Mirror-Matches zu simulieren, verteilt der Trainer die 84 Trainings- und 84 unabhängigen Holdout-Szenarien disjunkt nach Index modulo 4. Vier **separate Node-Prozesse**, jeder mit 21 Trainings- und 21 Holdout-Fällen, speichern `artifacts/v1483/shards/report-0.json` bis `report-3.json`. Jeder Teilprozess lädt die Original-Spielengine neu; Spielerprofile, produktive KI und gespeicherte Perks bleiben unverändert.
- **Strenge Zusammenführung:** `tests/ai-neutral-skills-aggregate-v1483.cjs` verweigert einen Endbericht, sofern nicht exakt alle vier Shards derselben Quellrevision und ohne doppelte Holdout-Szenarien vorliegen. Erst danach entstehen `artifacts/v1483/report.json` und `opening-examples.json`, inklusive Startspieler-/Handwechsel-Effekt und Gewinner-Sitzplatzstatistik.
- **Aktuelle erneute Ausführung:** [GitHub Actions #39723695611](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39723695611) mit verbessertem Vier-Prozess-Hauptlauf. Workflow-Concurrency setzt `cancel-in-progress: true`, sodass neue Korrekturen vor veralteten Testversionen priorisiert werden.
- **Wichtig:** Weder ein grüner Pilot noch das Erreichen der Trainingsphase beweist einen erfolgreichen Hauptlauf oder besseren KI-Champion. Weitere Aussagen zu 84 unabhängigen Startszenarien erst nach `success` **und** vollständiger Aggregator-Assertion.

## Abschluss v14.8.3 – 78 % Sitzplatzvorteil trotz Skills-Off (22.10.2026)

[Ausführlicher Prüfbericht](AI_V1483_NEUTRAL_SKILLS_START_FAIRNESS_RESULTS_20261022.md) · [GitHub SUCCESS #39723695611](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39723695611) · [Originaldaten inklusive vier Shards](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39723695611/artifacts/12401789872).

- **86/86 Engine-Tests**, erfolgreicher Skills-Off-Pilot, nach OOM-Korrektur **4/4 abgeschlossene isolierte Node-Prozesse** und korrekt aggregierte **84 unabhängige Holdout-Szenarien**, je **4** kontrollierte Startbedingungen und **3** Testduelle = **1.008** vollständige Testduelle.
- **Neutralisierung verifiziert und vollständig reversibel:** Originalspiel enthält 474 Karten/Fähigkeitsmetadaten, neutralisiertes Test-VM 0; Upgraderänge 0, beide Powerfaktoren 1, keine Enhance-Boni oder Essenz-/Schicksalsfertigkeiten. Neue VM ohne Neutralmodus zeigt originale Fähigkeitsdaten wieder. Main, Live-Skills, Spielprofile und Champion sind unverändert.
- **Symmetrische Selbsttest-Kontrolle (dieselbe alte KI auf beiden Plätzen): Sitzplatz 0 gewinnt 262/336 = 77,98 %.** Aufgeteilt: Startspieler 0/original 62/84, Startspieler 1/original 63/84, Startspieler 0/Hand- und Decktausch 67/84, Startspieler 1/Hand- und Decktausch 70/84. Der tatsächliche Startspieler gewinnt **164/336 = 48,81 %** – **kein allgemeiner Startzugvorteil**.
- Innerhalb der gleichen 84 Szenarien bewirkt Starterwechsel bei unveränderter ursprünglicher Hand-/Deckzuordnung **21/84** andere Gewinner; Tausch beider Hand- und Restdeckzustände bei gleichem Startspieler 0 **35/84** andere Gewinner. Starthand wirkt, beseitigt aber die Sitzplatzlast nicht.
- **v14.8.2 gegen v14.7 in ausgeschalteter Skills-/Perk-Testumgebung:** 333/672 (49,55 %) versus 339/672 (50,45 %), **181 direkte Aktionsabweichungen unter 3.351 verglichenen Entscheidungen**, aber gleiche Gewinnerposition in **331/336** Mirrorpaaren. Kein nachweisbarer Gewinn der strategischen Stärke, kein promotbarer neuer Champion.
- **Schlüsselursache noch offen:** Der Test verwendet weiterhin die originale **PvE-Engine**, in der eine Seite als Spieler 0 und die andere als Gegner 1 behandelt wird. Ein großer Teil der Rollen- und Upgradeeffekte ist zwar deaktiviert, andere feste Engine-/KI-/RNG-Pfade können noch asymmetrisch sein. Nicht behaupten, dass ein konkreter Zugregel- oder Kartendefekt bereits bewiesen wäre.
- **Nächster Schritt v14.8.4:** Beide Startzustände / Spieleridentitäten vor dem ersten Zug vollständig auditieren, Zugausgänge/Angriffs- und Fusionsentscheidungen sowie Niederlagegründe erfassen; getrennte PvE-Zweig-Ablationen und spielerplatzsymmetrische Neutral-Sandbox; Starter/Hand/Deck/Identität jeweils getrennt kontrollieren. Danach echte Aktionsunterschiede mit mehrfachen Fortsetzungen analysieren und erst später Perks/Skills rollenspezifisch wieder zuschalten.
- **Keine** Änderungen am Live-Gameplay, am Main-Branch, am eingefrorenen Champion oder an gespeicherten Spielerfähigkeiten.

## v14.8.4 – Streng identische Starthände und Deckreihenfolge (22.10.2026)

[GitHub Actions #39729295588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39729970919) · Trainer `tests/ai-identical-opening-neutral-v1484.cjs` · Aggregator `tests/ai-identical-opening-aggregate-v1484.cjs` · Workflow `.github/workflows/ai-identical-opening-neutral-v1484.yml`.

**Ausgangsbefund:** v14.8.3 mit deaktivierten Skills/Perks: identischer alter Controller auf beiden Seiten, jedoch 262/336 (=77,98 %) Siege von Spielerplatz 0; tatsächlicher Startspieler gewinnt nur 164/336 (=48,81 %). Unterschiede der getrennt gezogenen Starthände/Deckreihenfolgen waren ein verbleibender Störfaktor.

**Strenger Testmodus (nur im simulierten VM, reversibel):** Beide Seiten erhalten in jedem einzelnen Duell die **exakt gleiche geordnete Fünfer-Starthand**, inklusive identischer tatsächlicher ATK-/DEF-Ausgangswerte, die **identische 35-Karten-Nachziehreihenfolge**, die **identische vollständige 40-Karten-Deckfolge** und **denselben Fusionskarten-/Rest-Fusionsvorrat**. Gleiche LP, Power 1, keine Enhancements, null Upgraderänge, keine Rollen-/Karten-/Essenz-/Schicksalsfertigkeiten. **Beide Eröffnungsschilde werden testweise auf 0 gesetzt**, um die Startressourcen vollständig auszugleichen. Der Gegner erhält eigene Karten-UIDs, aber deck- und handidentische Karten. Tie-Breaker wird für den Datensatz deterministisch verteilt. Alle Gleichheiten werden vor Spielbeginn per Assertion überprüft.

**Vier faire Bedingungen** aus demselben Szenariensatz: Startspieler 0 oder 1 sowie Wahl der ursprünglich aus Platz 0 oder Platz 1 gemischten Hand-/Deckvorlage; die gewählte Vorlage wird danach **auf beide Plätze kopiert**. In jeder dieser vier Bedingungen dieselbe v14.7-KI auf beiden Seiten sowie zwei echte Sitzplatz-Mirrors der neuen gegen die alte KI. Damit **84 unabhängige Holdout-Szenarien × 4 Bedingungen × 3 Duelle = 1.008 Holdoutduelle**, zusätzlich Trainingsfälle. Eigene Test-Seed-Reihe, unverfälschte getrennte 84er-Holdouts. Vier unabhängige Node-Prozesse mit jeweils 21 Holdout-Szenarien verhindern den v14.8.3-Speicherüberlauf; ein Aggregator prüft alle Shards und die strenge Identität der archivierten Stichproben.

**Fragestellung:** Bleibt die Sitzplatzlast bestehen, wenn wirklich gleiche Starthand, Nachziehreihenfolge und Anfangsressourcen garantiert sind? Falls ja, sitzt die Ursache wahrscheinlich in späteren, spielerplatzabhängigen PvE-Engine- oder Controllerpfaden; ein genereller Vorteil des ersten Zuges ist separat aus den Startspielerwechseln zu erkennen. Die vollständige Live-PvE-Semantik ist auch mit gleichen Anfangsressourcen nicht automatisch auf beiden Seiten identisch: hartkodierte Spieler-0-/Gegner-1-Verzweigungen können weiter bestehen. Ein Testresultat ist deshalb **keine automatische Regeländerung oder Champion-Promotion**.

**Keine Live-Änderung:** Main, echte Spielstände, reguläre Skills und Perks sowie produktive KI/Champion unverändert. Pilot mit Pflichtprüfung vor Vollserie. Ergebnisse erst nach GitHub-Actions `SUCCESS` und erfolgreicher 4-Shard-Aggregation.

**Pilotkontrolle:** Im ersten v14.8.4-Test wurden alle strikten Identitäts-Assertions erfolgreich ausgeführt. Der anschließende JSON-Export scheiterte an einem fehlenden Ausgabeordner (ENOENT). Ausgabeordner korrigiert; maßgeblicher neuer Lauf: [#39729970919](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39729970919).
