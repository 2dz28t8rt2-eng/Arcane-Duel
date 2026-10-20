# Arcane Duel – KI-Training v10.1: zeitabhängige Hybrid-VI-Farmingstrategie auf echten Karrieren

**Datum:** 20. Oktober 2026 · **Branch:** `development`. **Abgeschlossener Workflow:** [v10.1 #39379346766 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346766). **Code/Strategie:** [#39379346678 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346678). **Browser-Smokes:** [#39379346962 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346962).

**Reproduzierbares Artefakt:** `arcane-hybrid-vi-farming-v101`, ID **12244493037**, gültig bis **19. November 2026**. Originaldatei `ai-hybrid-vi-farming-v101.json`: alle echten unabhängigen Karriere-Startquellen und jeweils drei gesondert belohnte Fortschrittsverläufe, Train-/Holdout-Resultate, Budgetkurven und reale Hybrid-Phasentransitionen. Das ZIP wurde heruntergeladen, die echten Budgettabellen im JSON geöffnet und abgeglichen.

**Produktiver Spielzustand:** `main`, Live-Gegner-KI, `assets/game.js`, Monster-/ACE-Werte, Gegnerdecks, Shop-/Loot-/Splitterregeln, Quests und User-Saves **unverändert**. Der Test ist ein Offline-*Spieler*-Autopilot gegen die regulären vorhandenen Turniergegner, **kein** selbstlernender NPC.

## Vorab-Experiment mit neuer, unabhängiger Ursprungskohorte

- **32 neue unabhängige Karriereursprünge**, Seed-Offset **76000**, jeweils separat `freshProfile()` und mit Original-`createGame`, `simulateGame`, `rewardMatch` ausgespielt. **96 eigenständig legal belohnte Karrierearme, 9.839 echte Duelle**, ohne erfundene ACEs, Loot, Siege oder zusätzliche Ressourcen.
- Vorab festgelegt: **16 Trainings- und 16 komplett neue Holdout-Quellen**. Die unabhängige Einheit ist ein Startursprung mit drei gepaarten Strategien, nicht jeder der 9.839 Kämpfe.
- Unveränderte `tempo-board`-Spieler-Fusions-Autopilot-KI und identische Deck-/Shop-/Craft-/Splitter-/XP-/Rewardregeln in allen drei Armen. Exakt identische Ereignisse **pro Ursprung bis vor dem ersten legitimen VI-Turnierduell**, im Testprogramm per Assertion bestätigt.
- **Kontrolle `fixed-farm`:** moderate reguläre freie Duelle nach jeder dritten Boss-Niederlage.
- **Kontrolle `vi-focused`:** ab zwei tatsächlichen VI-Niederlagen intensivere freie Duelle gegen den zuvor legal besiegten Gegner V; die bisherige erfolgreiche Heuristik ist **unverändert**.
- **Neuer `vi-hybrid`:** vor dem Schwellenwert 45 VI-relevanter Kämpfe qualitätsorientiertes Batch-Farming mit deckbezogener Erfolgskontrolle und Boss-Retry nach unproduktiven Wellen; **ab der nächsten Farming-Entscheidung nach Überschreiten von 45** Übergang auf die unveränderte intensive VI-Vorbereitung. Dies ist eine vor dem v10.1-Holdout festgelegte neue Hypothese, **keine** rückwirkend aus v10.0-Ergebnissen behauptete Erfolgskurve.
- Alle drei maximal **75 tatsächliche VI-Phasenkämpfe** und höchstens 24 reguläre Turnierversuche pro Tier, allein **Offline-Testbudget**, keine Einschränkung im Spiel. VI-Phasenkämpfe sind nur echte VI-Turniergegner-Duelle oder während VI vorbereitende freie V-Kämpfe. Zwischenresultate bei **30 / 45 / 60 / 75** tatsächlichen solchen Kämpfen werden anhand der echten chronologischen `events` gezählt.
- Die qualitätsbezogenen Änderungen nutzen **wirklich ausgerüstete** Deck-ATK/DEF/Level, Anzahl ausgerüsteter Level-4+-Monster und im **Besitz** befindliche Fusionsvorlagen. Nur neu tatsächlich erhaltene Karten/Erträge; keine Einsicht in verborgene Gegnerhand oder künstliche Beschwörbarkeit. Ein besessenes Fusionstemplate ist **noch kein Nachweis**, dass eine konkrete 2–5-Karten-Hand legal fusionieren kann – siehe Folgeauftrag.

## Gesamtergebnis

| Kennzahl (je 32 Karrieren) | Fixed | VI intensiv | Hybrid |
|---|---:|---:|---:|
| IV besiegt | 30/32 | 30/32 | 30/32 |
| V besiegt | 30/32 | 30/32 | 30/32 |
| **VI besiegt** | 3/32 | **12/32** | **10/32** |
| Tatsächliche gesamte Karriere-Duelle | 2.983 | 3.462 | 3.394 |
| Freie Duelle | 1.690 | 2.261 | 2.184 |
| Turnierduelle | 1.197 | 1.105 | 1.114 |
| Booster gekauft | 338 | 352 | 350 |
| Splitter ausgegeben | 3.468 | 4.694 | 4.650 |
| VI-relevante Kämpfe (alle 32 addiert) | 1.519 | 1.963 | 1.906 |
| Tatsächliche Farming-Wellen | — | 170 | 213 |
| Davon Hybrid-Sparphase | — | — | 166 |
| Davon Hybrid-Intensivphase | — | — | 47 |
| Hybridkarrieren mit tatsächlich durchgeführter Intensivphase | — | — | **24 von 32** |
| Tatsächlich übersprungene weitere Farmingwellen | — | — | 25 |

**Vorsicht zur Aufwandsinterpretation:** Gegenüber der Baseline erfordert VI-Intensiv **571 zusätzliche freie und 479 zusätzliche Gesamtkämpfe**, für neun zusätzliche VI-Siege auf dieser Kohorte. Hybrid **494 zusätzliche freie und 411 zusätzliche Gesamtkämpfe** für sieben zusätzliche VI-Siege. Der Hybrid spart gegenüber VI-Intensiv nur **77 freie bzw. 68 gesamte Duelle**, erzielt aber zwei VI-Siege weniger. Ein eindeutiger Effizienzvorsprung des Hybrids ist nicht belegt.

## Zeitbudget: tatsächlich besiegte VI-Karrieren

**Alle 32 legitimen Startursprünge:**

| VI-Kampfbudget | Fixed | Intensiv | Hybrid |
|---|---:|---:|---:|
| 30 tatsächliche VI-Vorbereitungs-/Turnierkämpfe | 1 | 2 | 2 |
| 45 | 2 | 2 | **4** |
| 60 | 3 | 4 | **6** |
| 75 | 3 | **12** | 10 |

Der Hybrid besitzt in dieser Kohorte einen **explorativen** frühen/mittleren Horizontvorteil, der intensive Arm den besseren Endhorizont. Dieselben 32 Ursprünge werden mehrfach kumulativ bei unterschiedlichen Budgets ausgewertet – das sind keine voneinander unabhängigen Stichproben.

**Unabhängiger Holdout mit 16 Ausgangsursprüngen:**

| VI-Budget | Fixed | Intensiv | Hybrid |
|---|---:|---:|---:|
| 30 | 1 | 1 | 1 |
| 45 | 1 | 1 | **2** |
| 60 | 1 | 3 | 3 |
| 75 | 1 | **6** | 5 |

**Training mit 16 Ausgangsursprüngen:**

| VI-Budget | Fixed | Intensiv | Hybrid |
|---|---:|---:|---:|
| 30 | 0 | 1 | 1 |
| 45 | 1 | 1 | **2** |
| 60 | 2 | 1 | **3** |
| 75 | 2 | **6** | 5 |

**Selektionsdisziplin:** Der im Trainingsblock nach vorab bestehender Regel gewählte Kandidat ist **`vi-focused`**, nicht `vi-hybrid`, weil er bei Budget 75 **6 statt 2** Baseline-VI-Siege erreicht, gegenüber Hybrid **5 statt 2**. Auf dem vorab reservierten Holdout gewinnt `vi-focused` **6 statt 1** (fünf bessere unabhängige Ursprungskarrieren, null schlechtere, elf gleich). Das v10.1-Offline-Gate lautet **`qualified=true`**. Der Hybrid ist ebenfalls positiv relativ zu Fixed (Holdout **5 statt 1**, vier bessere, null schlechtere) – im direkten Vergleich verliert er jedoch **einen VI-Sieg** gegenüber der intensiven Kontrolle. **Kein Hybrid-Rollout.**

Das VI-Resultat ist auf dieser Kohorte deutlich stärker als v10.0, aber frühere v9.7-Ergebnisse zeigten geringere oder negative Effekte des Intensivfarmings auf anderen Quellen. Nicht als universelle Gewinnwahrscheinlichkeit interpretieren.

## Was zusätzlich gelernt wurde

1. **Der Phasenwechsel ist echt**, keine Attrappe: In 24/32 Hybridläufen wurden intensive Batches nach der frühen Qualitätsphase gespielt, zusammen **47** intensive und **166** qualitätsorientierte Wellen. 25 mögliche weitere VI-Farmwellen wurden wegen schwachen beobachteten Ertrags zugunsten eines Boss-Retry übersprungen.
2. **IV und V bleiben schwierig, aber nicht künstlich leichter:** Alle drei Optionen gewinnen IV und V auf exakt denselben 30/32 Quellen. Der Hybrid verändert erst nach dem echten ersten VI-Versuch seine Strategie.
3. **Langfristig funktioniert einfaches intensiveres legales Farming weiterhin am besten** in dieser Kohorte. Der unter 45/60 Kämpfen beobachtete Hybrid-Vorteil kann aber eine spätere **spielerwählbare Zeitbudgetoption** rechtfertigen, falls er auf weiteren neuen Ursprüngen unabhängig bestätigt wird.
4. **Noch offene Fusionstauglichkeitslücke:** v10.1 erfasst rechtmäßig besessene Fusionstemplates und höhere Kartenlevel, aber nicht die legalen Fusionoptions pro konkreter gezogener 2–5-Hand. Die echte Engine bietet bereits `fusionOptions(g,levels,materials)` sowie `canCompleteHandFusion(g,levels,choice)`. Eine künftige Diagnose soll diese Funktionen an **tatsächlich legalen eigenen Spielsituationen** auswerten, ohne geheime Gegnerinformationen oder synthetische Hilfskarten.
5. **Wichtige Zieltrennung:** Die getestete KI ist der Offline-*Spielerautopilot*. Ein stärkerer Spieler gegen bestehende Bots beweist **nicht**, dass es sinnvoll oder fair wäre, die produktive Gegner-KI zu verstärken; ein solcher Übertrag benötigt gesonderte NPC-vs.-Spieler-/Archetypen-Validierung.

## Qualitätssicherung

- [v10.1 Trainings-CI – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346766): **56/56** Game-/Economy-/Save-/Deck-/Fusionchecks und **20/20** zusätzliche KI-Regressionstests grün.
- [Code-/Strategie-CI – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346678).
- [Browser-Smokes – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346962).
- Trainings-/Holdout-/Budgetergebnisse und `selected='vi-focused'`, `qualified=true` im tatsächlich heruntergeladenen JSON-Workflow-Artefakt geprüft.

## Prioritäten v10.2

- **Konkrete eigene Fusion-Fähigkeit im laufenden Match messen**: reale 2–5-Karten-Handkombinationen, `fusionOptions` und `canCompleteHandFusion` aus originalem Runtime. Keine erfundenen Karten/Fusionen, keine versteckten NPC-Deck-/Handdaten. Auswirkung von neu erspielten Karten auf tatsächliche Fusionchancen statt nur Template-Besitz.
- **Qualitäts- vs. Intensivphasen unabhängig validieren**: Hypothese vor neuen Seeds klar festschreiben; bevorzugt keine willkürliche universelle 45er-Wechselmarke, sondern vorher definiertes echtes Vi-Feld-/Fusionsreife-Signal, das eine neue Kohorte bestehen muss.
- **Echte Spieler-Zeitbudgetoption diskutieren**, nicht einfach schwere Turniergegner nerfen. Unveränderte Konstante `tempo-board`-Entscheidungen und normaler Loot, XP, Booster-/Shard-Kosten; neue 16/16 Herkunftskarrieren, begrenztes VI-Budget und individuelle Erfolgskosten.
- **NPC-KI-Fairness separat** prüfen, bevor der Spielerautopilot in aktive Turniergegner integriert wird. Keine Änderungen an `main`, aktiver NPC-Politik, Karten-/ACE-Werten, Shop-/Loot-/Quest-/Perk-Balance.

**Status:** v10.1 durchgeführt, vollständige Rohdaten und Test-Roadmap auf `development`. Intensive VI-Vorbereitung besteht erneut Offline-Holdout-Gate, Hybrid mit frühem/mittlerem Budgetvorteil, aber bislang ohne endgültige Überlegenheit.
