# Arcane Duel – KI-Training v9.9: Gleiche VI-Kampfbudgets und realer Farming-Grenznutzen

**Datum:** 20. Oktober 2026. **Branch:** `development`. **Trainingsworkflow:** [#39376163893 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163893). **Code-/Strategietests:** [#39376163745 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163745). **Browser-Smokes:** [#39376163764 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163764).

**Reproduzierbare Daten:** GitHub Actions Artifact `arcane-equal-budget-farming-v99`, ID **12243059797**, verfügbar bis **19. November 2026**. Vollständige JSON-Datei `ai-equal-budget-vi-farming-v99.json` enthält alle 32 Karriere-Ursprünge, 3 getrennte echte Karrierearme, die tatsächlichen Free-/Turnierevents und vorab festgelegte Train-/Holdout-/Budgettabellen.

**Produktiver Zustand unverändert:** `main`, `assets/game.js`, echte Gegner-NPC-KI, Karten/ACE-/XP-/Loot-Ökonomie, User-Saves, Shop, Skill-/Perk-/Questregeln bleiben unberührt. Nur Offline-Tests auf `development`.

## Versuchsaufbau

- **32 vollständig neue unabhängige Ausgangskarrieren**, Seed-Offset **68000**. Jeder Ursprung wird mit **drei** Varianten separat von `freshProfile()` bis maximal Turnierstufe VI ausgespielt: `fixed-farm` (bisheriges moderates Farming), `vi-focused` (intensiver, bereits in v9.8 erfolgreicher VI-Vorbereitungsmodus) und `vi-budget-roi` (neu, nach tatsächlichem Ertrag dosierte und auf 32 zusätzliche VI-Farmduelle gedeckelte Vorbereitung).
- **96 tatsächliche Karriereläufe**, darunter **8.998 echte regulär belohnte Kämpfe** mit `createGame`, `simulateGame`, `rewardMatch`, normaler Lootchance, originalen Käufen und tatsächlichen Ausgaben. Keine Geschenke, künstlich gewonnene Turniere oder modifizierten Boss-Stats.
- **Identische unveränderte `tempo-board`-Spieler-Fusionspolicy** in allen drei Armen. Shop, Farming bis V, XP, Drops, Splitter, Kartenbesitz, Deckbau und Seelenmechaniken sind gleich geregelt.
- **Exaktes per-Ursprung Event-Assert:** Bis vor dem **allerersten** regulären VI-Turnierduell sind Free-Duelle, Siege, erhaltene Rewards und Investments in allen drei Armen identisch.
- Ein **gemeinsames, tatsächlich erzwungenes VI-Kampfbudget von höchstens 72 Kämpfen** gilt in allen drei Varianten. Gezählt werden nur ab dem ersten VI-Turnierduell: echte `context='tournament'`-VI-Gegnerkämpfe plus echte vorbereitende `context='free'`-Duelle gegen V. Nach dem Sieg absolvierte freie Duelle gegen VI zählen nicht als Versuchsdauer zum VI-Sieg. Ebenso sind die **Zwischenbudgets 35 und 50** aus den tatsächlich chronologisch gespeicherten VI-Kampfereignissen berechnet, keine hochgerechneten Wahrscheinlichkeiten oder geschenkten Siege. Gleichzeitig höchstens 24 Turnierversuche pro Boss im Offline-Test; live keine neue Obergrenze.
- **16** unabhängige Quellen vorab Training / **16** vorher unbenutzte Holdout-Quellen. Die unabhängige Einheit ist der Karriereursprung, **nicht** jeder Kampf oder die drei Ableger desselben Starts.
- Die neue `vi-budget-roi`-Strategie zählt ausschließlich in realen Farming-Wellen erworbene XP, Loot, ausgerüstete ATK-, Hauptdeck-Level-, Player-Level-, Fusionskopien- und Inventarveränderungen. Abhängig vom vorherigen Nettoertrag setzt sie kleinere legale Farmwellen von meist 2–6 Kämpfen bzw. probiert den Boss erneut. Kein verborgenes Gegnerdeck oder künstlicher Multiplikator. Sie ist **eine neue unbestätigte Strategie**, nicht identisch mit der bewährten intensiven.

## Alle 32 Ausgangskarrieren – reale Resultate bis VI

| Ergebnis | Moderate Kontrolle | VI intensiv | VI-Budget-/Ertragsstrategie |
|---|---:|---:|---:|
| **IV tatsächlich gewonnen** | 28/32 | 28/32 | 28/32 |
| **V tatsächlich gewonnen** | 28/32 | 28/32 | 28/32 |
| **VI tatsächlich gewonnen** | 5/32 | **11/32** | 4/32 |
| Höchster durchschnittlich besiegter Gegner | 4,91 | **5,09** | 4,88 |
| Alle echten regulär belohnten Kämpfe | 2.828 | 3.265 | 2.905 |
| Echte freie Duelle | 1.612 | 2.133 | 1.693 |
| Turnierduelle | 1.118 | 1.034 | 1.114 |
| Ausgegebene Splitter | 3.132 | 4.321 | 3.449 |
| Bezahlte Booster | 325 | 344 | 338 |
| Kumulierte VI-Phasenkämpfe | 1.416 | 1.829 | 1.495 |
| VI-Turnierversuche | 641 | 557 | 637 |
| Tatsächlich evaluierte Farmwellen | — | 159 | 188 |
| Budget-/ROI-bedingt übersprungene Wellen | — | 0 | 28 |

**Aufwand:** Die intensive Strategie erfordert im gesamten 32-Quellen-Satz **+521 freie Duelle**, **+437 gesamte Duelle**, **+1.189 ausgegebene Splitter** gegenüber moderat. Dafür gewinnt sie **6 zusätzliche VI-Karrieren**. Das ist ein messbarer Trading-Trade-off, kein universeller Sieg bei gleichem Zeitaufwand. Die Budget-/ROI-Variante kostet im Gesamten lediglich **+81 freie** bzw. **+77 gesamte** Kämpfe, verliert aber sogar **1 VI-Sieg** gegen die Moderate.

## Das neue Kernresultat: VI-Siege bei identischem Kampfbudget

**Alle 32 Quellen; gezählt vom ersten VI-Turnierduell bis einschließlich des betreffenden wirklich gewonnenen VI-Kampfes:**

| Maximal tatsächlich absolvierte VI- und vorbereitende V-Kämpfe | Moderate Kontrolle | VI intensiv | Budget/ROI |
|---|---:|---:|---:|
| **35** | **2** | 1 | 0 |
| **50** | **5** | 3 | 4 |
| **72** | 5 | **11** | 4 |

**Interpretation:** Im Frühfenster von 35/50 Kämpfen hat das moderate Farming in dieser Population mehr echte VI-Siege erzielt. Wer ein längeres Experimentbudget (72 VI-relevante Duelle) ausschöpft, erzielt mit verstärkter legaler Vorbereitung **11 statt 5** Siege. Das zeigt eine vom erlaubten Aufwand abhängige Siegkurve: Ein einfaches allgemeines „intensiveres Farming ist immer besser“ wäre falsch.

## Unabhängiges Training und Holdout

| VI-Siege bei max. 72 VI-Phasenkämpfen | Training (16 Ursprünge) | Holdout (16 Ursprünge) |
|---|---:|---:|
| Fixed | 3 | 2 |
| Intensiv | **5** | **6** |
| Budget/ROI | 1 | 3 |

Detaillierte Budgetkurve:

| VI-Siege | Training Fixed | Training Intensiv | Training ROI | Holdout Fixed | Holdout Intensiv | Holdout ROI |
|---|---:|---:|---:|---:|---:|---:|
| Innerhalb **35** | **2** | 0 | 0 | 0 | **1** | 0 |
| Innerhalb **50** | **3** | 0 | 1 | 2 | **3** | 3 |
| Innerhalb **72** | 3 | **5** | 1 | 2 | **6** | 3 |

**Trainingsbasierte Kandidatenauswahl:** `vi-focused`, weil sie +2 VI-Siege gegenüber Fixed, 2 unabhängige verbesserte und 0 verschlechterte Quellen in der Trainingshälfte hatte; ROI im Training **−2 VI-Siege**.

**Unabhängiger Holdout:** `vi-focused` verbessert sich von **2 auf 6** VI-Siege unter 16 Ursprüngen; **5** Startkarrieren besser, **1** schlechter, **10** gleich. Vor-VI-Erfolge sind identisch (IV und V jeweils **14 von 16** für alle Arme). **Vorab definierte Offline-Qualifikation `qualified=true`**: mind. +2 VI-Siege, mehr verbesserte als verschlechterte Karrieren, keine IV-/V-Regression und Verbesserung innerhalb der 72-Kämpfe-Grenze. Dieses Ergebnis **autorisiert keine produktive NPC- oder Game-Änderung**.

**ROI-Holdout:** `vi-budget-roi` erzielt **3 statt 2** VI-Siege, bei nur **+35 freien Duellen** und **+15 Gesamtkämpfen** in der 16er-Holdout-Hälfte. Das reicht nicht als robuste Verbesserung und stand im Training einem **Rückgang um 2 Siege** gegenüber. **Nicht freigeben.**

## Übergreifende Evidenz und Vorsicht

- v9.7 hatte auf einer **anderen** unabhängig erspielten Holdout-Kohorte noch 2 VI-Siege bei intensivem versus 3 bei Fixed; v9.8 brachte 7 versus 2; v9.9 nun 6 versus 2. Die beiden neuesten Kohorten sind positiv, der übergreifende Effekt variiert mit Ausgangsinventar/RNG. Nicht aus drei Versuchen eine universelle Siegquote ableiten.
- **VI ist ausdrücklich als schwere Progressionshürde gewollt.** Die Ergebnisse fordern **keine** Boss-Nerfs, geschenkte ACEs oder verkürzte Spielerprogression. Farming ist ein vorgesehener legaler Spielweg und soll optional bleiben.
- Diese Tests vergleichen **Offline-Spielerautopiloten gegen dieselben vorhandenen Turnier-NPCs**. Sie sind weder Training eines selbstlernenden Netzes noch ein Beleg für eine bessere **produktive Gegner-KI**. Eine Übernahme der Farmingplanung ins eigentliche Spiel wäre ein eigener gewollter Automatikmodus; eine Übernahme der Fusionsauswahl bei Gegner-NPCs benötigt gesonderte AI-Fairness-Tests.
- **Die neue Budgetkurve ist zugleich eine Einschränkung:** Manche intensive Karriere gewinnt nach 50 Kämpfen noch nicht, nach 72 aber schon. Ein völlig gleiches Budget ist für Vergleichbarkeit wichtig, ersetzt aber nicht den Spielerentscheid, wie viel Zeit ein schwieriger Gegner wert ist.

## Nächste Trainingsaufgabe v10.0

1. **Budget-Pareto-Kurve erweitern:** Neu ausschließlich unberührte Ursprungskarrieren, Kontrollarm moderate Routine und vorab fixierte intensive VI-Vorbereitung; gemessene VI-Siege nach 30/45/60/75 tatsächlichen Kämpfen und zusätzlich die pro tatsächlich erreichtem VI-Sieg nötigen Free-/Turnierduelle getrennt dokumentieren.
2. **Ressourcen-Grenznutzen mit echten erreichten VI-Saves:** *welche* auf legalem Weg verdienten Karten tatsächlich den 40er-Deckwert, die Hand-Fusionswahrscheinlichkeit, Defender-Überlebensfähigkeit oder ACE-Verfügbarkeit verbessern; mehrere Shard-Research-Käufe sind nicht automatisch gutes Investment.
3. **Ein expliziter, bedarfsgerechter Retry/Stop-Controller** aus konkreten realisierten Deck-Fusions-/ATK-Schwellen – nicht lediglich neue Kartenanzahl – gegen den unveränderten intensiven Kontrollarm, **mit festem Zeitbudget**. Neue Hypothesen nur im Trainingssplit tunen.
4. **Verzögerten Nutzen modellieren:** Free-Duell-Belohnungen (XP/Karten/Coins/Shards) können erst nach mehreren Käufen / vollständigen Fusionen Wirkung zeigen; sie sind auch ohne sofortige ATK-Erhöhung legitim. Keine erzwungenen Game-Eingriffe.
5. **Rollout-Schutz:** `main`, Live-NPC AI, Monster-/ACE-Stats, Dropwahrscheinlichkeiten, Shop, Perks, Quest- und Spielewerte unverändert; sämtliche Game/Save/Fusion/Economy- und Browserchecks erneut prüfen.

## Verifizierte technische QA

- [v9.9 Testworkflow #39376163893 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163893): **56/56** Regel-/Game-/Save-/Economy-/Fusiontests und **20/20** zusätzliche KI-Regressionstests bestanden.
- [Allgemeine Code-/Strategiesuite #39376163745 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163745).
- [Browser-Smokes #39376163764 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163764).
- Paired full-result Artifact **12243059797** vor Speicherung des Berichts tatsächlich heruntergeladen und die drei `trainingBudget`-, `holdoutBudget`- und `overallBudget`-Tabellen aus der JSON-Datei geprüft.

**Status:** v9.9 komplett ausgeführt, offen und reproduzierbar dokumentiert; `vi-focused` nur **offline** gemäß vorab fixierter Kriterien positiv validiert; Budget-ROI aktuell klar nicht qualifiziert. Kein produktiver Merge.
