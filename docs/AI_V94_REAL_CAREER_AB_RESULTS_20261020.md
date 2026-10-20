# Arcane Duel — KI-Training v9.4: vollständige legale Karriere-A/B bis Turnierstufe VI

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Experiment:** [GitHub Actions #39368041630 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041630). **Version des Testcontrollers:** die zuvor in v9.2 ausgewählte unveränderte `tempo-board`-Fusionsstrategie aus `tests/helpers/ai-pre-attack-v92.cjs`. **Produktive KI, `main`, Game Engine, Gegnerwerte, Karten, Loot und Economy:** unverändert.

**Zusätzliches QA:** Code-/Strategieprüfungen [#39368041570 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041570); separat ausgelöster Browser-Smoke [#39368041596 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041596) wurde ebenfalls erfolgreich abgeschlossen.

**Artefakt:** `arcane-real-career-ab-v94`, GitHub Actions Artifact-ID **12240082378**, bis **19. November 2026**. Enthält alle 32 source-gepaarten realen Karriereergebnisse, tatsächliche Rewards/Turnierduelle, Fusions-/Shop-Wirtschaft, Einzelsiege und Verlaufskontexte.

## Versuchsplan und Legalität

Es wurden **32 neue unabhängige Startkarrieren** mit Seed-Offset **48000** und den fixierten, in früheren v9.2/v9.3-Kohorten *nicht* benutzten Seeds gestartet. Jeder Startpunkt wurde **zweimal von `freshProfile()` aus** gespielt – einmal `baseline`, einmal `tempo-board`. Das sind **64 vollständig ausgespielte Karriere-Arme**, nicht 64 unabhängige Ursprungseinheiten.

**Wesentliche Kontrollen:**
- Dasselbe feste frühe Investment (`late-shard`), dieselbe vorab bestimmte Deck-/Shop-/Splitter-/Perk-/Craft-/Farming-Logik, dieselben anfänglichen Seeds und dieselbe Reihenfolge der Gegner- und Startpositionen. Unterschied nur in der **legalen Beschwörungs- und Fusionstarget-Wahl** des Offline-Spielercontrollers. Die NPC-KI ist identisch. Die Teams beeinflussen sich nicht gegenseitig; jeder Arm verdient seine Karten selbst.
- Original-Engine `createGame`, `simulateGame` und **`rewardMatch`** wurden in *jedem* realen Kampf verwendet. Die Simulation prüft reale Fortschrittsfreischaltungen und Save-Gültigkeit. Keine künstlich geschenkten Karten, zusätzlichen Lootkisten, ACEs, Splitter, Kämpfe oder gewonnene Turniere.
- Maximal **16 Turnierversuche je Tier** bis einschließlich **VI**, mit echten Farming-Runden bei wiederholten Niederlagen. Nach Siegen wird regulär weitergefarmt.
- Abweichende Ergebnisse dürfen zu **unterschiedlichen Ressourcenständen und Collections** führen. Diese Divergenz ist erwünschter Teil des gemessenen Karriereeffekts, nicht ein Defekt des Experiments; sie bedeutet aber, dass die Arme nicht in jedem späteren Match identische Decks besitzen.
- Die Split-Zuordnung der **ersten 16 unabhängigen Quellen für Training**, der **anderen 16 als unberührter Holdout** wurde im Code vor der Ausführung fixiert.
- Vorab definierte Gate: im Training mindestens **+2 IV-Siege**, im Holdout mindestens **+3 IV-Siege**, mehr Quellen verbessert als verschlechtert und **keine Verschlechterung der VI-Siegzahl**. V9.4 meldete **`qualified=true` für das Offline-Experiment** – nicht die Freigabe der produktiven Gegner-KI oder der Hauptversion.

## Echte Karriereergebnisse – beide Kohorten zusammen

| KPI | Baseline – 32 Karrieren | Tempo-board – 32 Karrieren |
|---|---:|---:|
| **Turniergegner IV besiegt** | 11 | **22** |
| **Turniergegner V besiegt** | 6 | **22** |
| **Turniergegner VI besiegt** | 1 | **4** |
| Durchschnittlich höchste besiegte Turnierstufe | 3,56 | **4,50** |
| Reguläre, belohnte Karriere-Duelle | 1.942 | **2.184** |
| Turnierduelle | 768 | 831 |
| Farm-Duelle | 1.076 | 1.256 |
| Siege / Niederlagen (über alle regulären Duelle) | 977 / 965 | **1.165 / 1.019** |
| Bezahlte Booster-Käufe | 191 | 255 |
| Shards ausgegeben | 628 | 1.784 |
| Eigene angewendete Attack-Aktionen | 22.544 | 23.071 |

**Total:** **4.126 echte, regulär belohnte Karriereduelle** aus 32 unabhängigen Startpunkten mit zwei kausal verglichenen Spielerstrategien. Das Erreichen weiterer Stufen erzeugt legitimerweise zusätzliche Farmkämpfe, Belohnungen, Booster und Shard-Ausgaben. Deshalb sind die absoluten Economy- und Attack-Summen **nicht pro Duel normalisiert**; sie dürfen **nicht isoliert** als Effizienzbeweis interpretiert werden.

## Trainings- und unabhängiger Holdout-Vergleich (je 16 Ursprungskarrieren pro Arm)

| Ergebnis | Training Baseline | Training Tempo | Holdout Baseline | Holdout Tempo |
|---|---:|---:|---:|---:|
| **IV gewonnen** | 4 / 16 | **12 / 16** | 7 / 16 | **10 / 16** |
| **V gewonnen** | 3 / 16 | **12 / 16** | 3 / 16 | **10 / 16** |
| **VI gewonnen** | 0 / 16 | **2 / 16** | 1 / 16 | **2 / 16** |
| Durchschnittlich höchster Sieg | 3,44 | **4,63** | 3,69 | **4,38** |
| Echte Karriere-Duelle | 931 | 1.157 | 1.011 | 1.027 |
| IV-Versuche insgesamt | 204 | 169 | 187 | 155 |
| VI-Versuche insgesamt | 48 | 190 | 35 | 150 |

**Paaranalyse nach unabhängigem Ursprung:**
- **Training:** IV-Siegdifferenz **+8**, VI-Siegdifferenz **+2**. **10** Ursprünge mit höherer Endstufe, **1** mit niedrigerer, **5** unverändert. Bei IV **9** neu erfolgreich, **1** bisher erfolgreicher Ursprung verloren.
- **Holdout:** IV-Siegdifferenz **+3**, VI-Siegdifferenz **+1**. **10** Ursprünge mit höherer Endstufe, **2** mit niedrigerer, **4** unverändert. Bei IV **5** neu erfolgreich, **2** bisher erfolgreiche Ursprünge verloren.
- **Gesamt:** IV **+11**, VI **+3**, **20** Ursprünge besser, **3** schlechter, **9** identisch.

**Bewertung:** Im Unterschied zu v9.2/v9.3 zeigen die Fusionsentscheidungen nun auch in einem vollständigen eigenständig belohnten Karrieresystem den entscheidenden Progressionsgewinn. Das holdoutseitig vorab festgelegte **+3 IV**-Gate ist genau erreicht. **IV/V stark**, **VI weiterhin schwierig**: 4/32 Tempo-Saves gewinnen VI, trotz 22/32 Erfolgen auf V. Dies ist die zentrale nächste Balance-/Strategiegrenze.

## Was der Test belegt – und was nicht

1. **Replizierte Live-Game-Engine-Karriereverbesserung des Spielercontrollers:** Die Änderung verwendet echte 2–5-Material-Fusionsoptionen, wählt ein legales erreichbares Ziel und führt es in der unveränderten Engine aus. Sie vermeidet das pauschale „die ersten zwei höchsten Handkarten verschmelzen“, das in früheren Matchtests einen schwachen Spielaufbau erzeugte.
2. **Reale Belohnungsketten verstärken den Effekt:** Wer IV und V gewinnt, schaltet neue Farm- und Kaufoptionen legal frei; eine reine Einzelduell-LP-Analyse kann diesen langfristigen Effekt nicht erfassen.
3. **Keine Garantie für jeden Spieler:** Bei 3 von 32 gepaarten Karrieren war die bisherige KI am Ende erfolgreicher, bei 9 gleich. Die ursprungsbasierte Stichprobe ist sinnvoll, aber noch keine präzise universelle Gewinnwahrscheinlichkeit.
4. **Nicht gleichbedeutend mit besserer gegnerischer NPC-KI:** Das Experiment trainiert ausschließlich den **Offline-Spielerautopiloten**, der gegen die aktuelle Turnier-KI antritt. Werden dieselben Heuristiken für NPCs übernommen, ist ein *separater* NPC-Test erforderlich – insbesondere bezüglich unfairen Einblicken, Spielsicherheit und dem richtigen Schwierigkeitsgrad.
5. **Keine vollständige Karriere bis Gegner X:** Es wurde nur bis VI getestet. Für späte Gegner, ACE-Nutzung, Lv1-Quest, Multiplayer und menschliche Spieler liegen aus diesem Test **keine** direkten Daten vor.
6. **Kein produktiver Merge:** Testcode und die CI-Datei liegen ausschließlich auf `development`. `assets/game.js`, aktive NPC-KI, `main`, Monsterwerte und Economy blieben unverändert.

## Roadmap: Nächste AI-Runde v9.5

1. **VI-Hürde unter realen Bedingungen analysieren:** Gesonderte Diagnose bei den wirklich erreichten V-/VI-Spielständen, insbesondere Material-/ACE-Verfügbarkeit, Besetzung der fünf Slots, Fusionen pro Runde, Überleben von Predator/Soul/Guardian, Angriffskraft und Gegner-ACE. Nur **tatsächlich** durch gewonnene V-Karrieren legitim erreichte VI-Saves untersuchen.
2. **V9.4-Fusionspolitik als festen, vorab validierten Kontrollarm erhalten**. Neuen defensiven Schutz oder ACE-Zielpriorisierung nur isoliert auf **neuen Ursprungskarrieren** testen, ohne bekannte Holdout-Daten als Training zu benutzen.
3. **Fairness und Wirtschaft:** XP-, Shard-, Booster- und Craft-Kosten pro erreichter Stufe sowie realen Zeit-/Matchbedarf auswerten. Entstehende spätere Unterschiede sind im vollständigen Karriereverlauf unvermeidlich, aber ihre Größe sollte transparent bleiben.
4. **ACE-Fokus nicht rückwirkend freigeben:** Der v9.2-`ace-reach`-Holdout war explorativ und rechtfertigt noch keinen Live-Einbau. Ein eigener, gesperrter neuer Trainings-/Holdout-Satz muss die ACE-Variante gegen `tempo-board` testen.
5. **Produktionsschritt nur gesondert:** Nach zusätzlicher Sicherung kann die reine legale Player-Autopilot-Heuristik optional zur Spielintegration vorgeschlagen werden. Eine Übertragung auf die NPC-KI erfordert **eigene** Testreihen und Schwierigkeits-Balanceprüfung. Dabei alle Combat-/Save-/Fusion-/Role-/ACE-/Browser-Checks nochmals ausführen.

## Verifizierte QA

- V9.4 [Karriere-CI SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041630).
- **56/56** Legalitäts-/Fusion-/Save-/Economy-Regressionen und **20/20** AI-Regressionsprüfungen bestanden.
- [Allgemeine Code-/Strategieprüfungen #39368041570 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041570).
- [Browser-Smoke #39368041596 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041596) vollständig bestanden.

**Fazit:** `tempo-board` ist erstmals **in unabhängigen vollständigen Karriereverläufen bis VI erfolgreich validiert**, nicht nur im Einzelduell; die vorab festgelegte Offline-Promotion wurde erreicht. Mit echten belohnten Karrieren auf zwei unabhängigen Quellenhälften belegt der Versuch einen erheblichen Progressionsvorteil. Produktions-/NPC-Übernahme bleibt eine **separate, nicht erfolgte Entscheidung**.
