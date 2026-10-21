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
