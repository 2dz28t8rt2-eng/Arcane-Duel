# Arcane Duel – KI-Training v10.0: echter Deckqualitäts-Nutzen und gleiche VI-Kampfbudgets

**20. Oktober 2026** · `development` · [Training #39378042543 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042543) · [Code & Strategie #39378042446 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042446) · [Browser-Smoke #39378042355 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042355).

**Vollständige Rohdaten:** GitHub-Actions-Artefakt `arcane-quality-budget-farming-v100`, ID **12244183022**, Ablauf **19.11.2026**; enthalten: `ai-quality-budget-vi-farming-v100.json`. Artefakt heruntergeladen und Train-/Holdout-/Gesamtbudgettabellen aus der tatsächlichen JSON-Datei geprüft.

**Produktive Versionen und Game-Regeln blieben unverändert:** `main`, echte NPC-KI, Monster-/ACE-Werte, Shop/Shard-/XP-/Dropchancen, Quests und Nutzer-Spielstände. Die experimentelle Entscheidungslogik ist nur ein **Offline-Spielercontroller** auf `development`.

## Versuchsaufbau

- **32 komplett neue, voneinander unabhängige Karriere-Startseeds**, Offset **72000**, je **3** vollständig eigenständig mit realem `rewardMatch` erwirtschaftete Arms: `fixed-farm` (moderate bisherige Free-Duell-Routine), `vi-focused` (bekannte intensive Vorbereitung) und `vi-quality` (NEU: auf tatsächliche Deckqualität gestütztes VI-Farming). **96 Karrierearme und 9.283 regulär belohnte echte Engine-Duelle.**
- Vorherige Zuordnung: **16 Ursprünge Training, 16 vollständig unabhängiger Holdout**. Statistische Einheit ist der Karriere-Ursprung, nicht 96 isolierte Spieler oder einzelne Duelle.
- Alle verwenden die **unveränderte v9.2 `tempo-board`-Kampf-/Fusionspolitik**, dieselbe echte Economy, dieselben freien Gegner, Deck-/Shop-/Splitter-/Perkentscheidungen. Für jeden Ursprung sind alle Ereignisse und Rewards bis **vor dem ersten legalen VI-Turnierkampf** zwischen den drei Arms **per CI-Assert exakt identisch**.
- Boss VI wird mindestens einmal wirklich versucht. Nur im VI-Bereich dürfen sich Free-Duell-Entscheidungen unterscheiden. Maximal **24 Turnierversuche je Tier** und **75 echte VI-Phasenkämpfe** (VI-Turnierduelle und während VI zur Vorbereitung gespielte freie Kämpfe gegen legal besiegten V) für alle Arms – **ausschließlich endliche Offline-Testgrenzen, keine Live-Spielregeln**.
- Zwischenauswertung der wirklich gespielten VI-Kampfereignisse bei Budgets **30 / 45 / 60 / 75**. Keine interpolierten oder geschenkten Siege; ein Sieg zählt nur, wenn der entsprechende VI-Gegner wirklich durch die Original-Engine geschlagen wurde.
- `vi-quality` bewertet **ausschließlich realisierte** Veränderungen: durchschnittliche ATK und DEF der aktuell **ausgerüsteten 40 Hauptdeckkarten**, durchschnittliche Kartenstufe, Anzahl ausgerüsteter Level-4+-Materialien und Anzahl **wirklich besessener** Fusionstemplates im Fusionsdeck. Schwellen sind vor der Testausführung festgelegt: ATK-Delta mindestens 15, DEF mindestens 20, Kartenlevel mindestens 0,10, zusätzliches Level-4-Material, zusätzlich legal besessene Fusion oder Levelaufstieg mit gleichzeitigem Kartengewinn. Nur nach schwachem Ergebnis wird ein geplantes erneutes Farm-Batch zunächst zugunsten eines echten Boss-Retry ausgelassen. **Bloßes Inventarwachstum, Coins und XP allein gelten nicht als sofortige Deckverbesserung.** Die Schwellen sind heuristische Hypothesen, keine vom Spiel automatisch bewiesene optimale Entscheidung.

## Ergebnis – 32 legitime Karrieren pro Arm

| Metrik | Fixed | VI intensiv | VI nach Deckqualität |
|---|---:|---:|---:|
| **IV tatsächlich besiegt** | **29/32** | **29/32** | **29/32** |
| **V tatsächlich besiegt** | **29/32** | **29/32** | **29/32** |
| **VI tatsächlich besiegt** | 7/32 | **10/32** | 8/32 |
| Tatsächlich belohnte Karriere-Kämpfe | 2.911 | 3.348 | 3.024 |
| Freie Duelle | 1.645 | 2.156 | 1.820 |
| Turnierduelle | 1.169 | 1.095 | 1.107 |
| Ausgegebene Splitter | 3.352 | 4.423 | 3.815 |
| Gekaufte Booster | 324 | 343 | 332 |
| Tatsächlich gespielte VI-relevante Kämpfe | 1.421 | 1.846 | 1.531 |
| VI-Vorbereitungs-Wellen | — | 158 | 167 |
| Davon nach Qualitätsgrenze relevante Deckwellen | — | 124 | 124 |
| Gemessene, ausschließlich mit legalem Besitz erreichte zusätzliche Fusionstemplate-Kopien | — | 28 | 27 |
| Wegen schwachem Deckfortschritt übersprungene weitere Farming-Wellen | — | 0 | **35** |

**Kosten:** Intensiv erfordert gegenüber Fixed insgesamt **+511 freie, +437 alle Duelle und +1.071 Splitter** für **+3 VI-Siege**. `vi-quality` kostet **+175 freie, +113 Gesamtkämpfe und +463 Splitter** für **+1 VI-Sieg**. Gegenüber Intensiv spart die Qualitätsvariante **336 freie Duelle, 324 gesamte Duelle und 608 Splitter**, verliert aber **2 VI-Siege** im vollen Beobachtungszeitraum.

## Der wichtigste neue Blick: Siege *innerhalb* desselben VI-Kampfbudgets

| Tatsächlich ausgespielte VI-relevante Kämpfe | Fixed | Intensiv | Qualität |
|---|---:|---:|---:|
| **30** | 1/32 | 2/32 | **3/32** |
| **45** | 5/32 | 4/32 | **6/32** |
| **60** | 7/32 | 5/32 | **8/32** |
| **75** | 7/32 | **10/32** | 8/32 |

**Hinweis:** Das sind kumulierte Siege bis zu diesen Horizonten aus **denselben 32 Karrieren**, keine vier unabhängig randomisierten Studien. Der frühe Qualitätsvorsprung (bei 30/45/60) ist explorativ, keine eigenständig gepowerte statische Hypothesenprüfung. Die gemischte Budgetwirkung spricht für einen möglicherweise variablen Farming-/Retry-Horizont, nicht automatisch für die Live-Implementation eines Hybrid-Controllers.

## Unabhängige Analyse je 16 Karriere-Ursprünge

| VI-Siege innerhalb echter Kämpfe | Training Fixed | Training Intensiv | Training Qualität | Holdout Fixed | Holdout Intensiv | Holdout Qualität |
|---|---:|---:|---:|---:|---:|---:|
| **30** | 1 | 1 | 1 | 0 | 1 | 2 |
| **45** | 3 | 2 | 3 | 2 | 2 | 3 |
| **60** | 4 | 2 | 4 | 3 | 3 | 4 |
| **75** | 4 | **5** | 4 | 3 | **5** | 4 |

Vorab anhand der Trainingshälfte ausgewählter Arm **`vi-focused`** (VI 5/16 statt 4/16 Fixed; Qualität ebenfalls nur 4/16). Im **unangetasteten Holdout bei max. 75 VI-Kämpfen** erzielt dieser Arm **5/16 vs 3/16**, also +2 tatsächliche VI-Siege. Paired: **2 Quellen besser, keine schlechter**, 14 gleich. **IV und V in beiden Hälften exakt gleich**; Train 14/16, Holdout 15/16. Das v10.0-Skript bewertet daher **`qualified=true` rein nach der vorab festgelegten Offline-Hürde**; mit nur +1 Trainings- und +2 Holdout-Siegen ein deutlich kleinerer Vorteil als in v9.8/v9.9.

Die `vi-quality`-Variante erreicht im Holdout **4/16 statt 3/16** mit nur **+93 freien / +51 gesamten Duellen** in dieser Hälfte, im Training **4/16 statt 4/16**. Sie **besteht kein strenges Sieg-Gate**, auch wenn ihre frühe Budgetkurve interessant ist.

## Erkenntnisse

1. **Einheitliche Kampfbudgets zeigen unterschiedliche Gewinner:** Intensiveres Farming liefert hier im langen Beobachtungsfenster die meisten Siege; die Qualitätsstrategie erreicht **kleinere**, frühere Vorteile mit deutlich weniger zusätzlichem Grind. Voreilige universelle Aussagen sind falsch.
2. **Wesentliche Lernung zur Datenqualität:** Eine tatsächlich erhaltene neue Karte ist noch nicht gleich eine bessere Karte im aktiven Deck. Wir messen den ausgerüsteten 40er-Deck-ATK-/DEF-/Level-Fortschritt, Level-4+-Materialverfügbarkeit und besessene Fusionsziele getrennt; die neuen Qualitätswellen sind echte beobachtete Veränderungen, keine geschätzten Karten.
3. **Ertragsheuristik nicht als kausale Wahrheit verwechseln:** Die angegebene Anzahl legal besessener Fusionsvorlagen beweist nicht, dass eine passende 5er-Hand jedes Ziel beschwören kann. Dafür wäre ein getrennter echter `fusionOptions`-/`canCompleteHandFusion`-Test nötig.
4. **Über Kohorten besteht noch Variabilität:** v9.7 brachte auf anderem Holdout sogar Rückschritte mit intensivem Farming. v9.8/v9.9 und jetzt v10.0 waren im längeren Budgetfenster positiver. Mehr kostenpflichtig regulär erspieltes Farming ist ein Spielerentscheid, keine pauschale Vorgabe. Ein schwieriger VI-Gegner bleibt gewollt.
5. **Kein automatisches Lernen der Live-NPCs:** Alle Ergebnisse beschreiben einen **Offline-Spielercontroller gegen reale unveränderte NPCs**. Die bereits erfolgreiche Fusionstaktik und Farming-Experimente sind noch nicht in aktive Gegnerentscheidungen übernommen worden.

## Folgetest v10.1

- **Vorab fixierte Hybrid-Hypothese:** Im Frühfenster eher ressourcen-/qualitätsorientiert farmen bzw. den Boss erneut versuchen, bei gesetztem Langzeitziel nach einer klaren Anzahl echter VI-Kämpfe in die intensive Vorbereitung wechseln – ohne vergangenen Holdout nachzutunen. Gegen die zwei bereits definierten festen Kontrollarme auf **vollständig neuen unabhängigen 16+16 Karrieren** prüfen.
- **Eigene Legitimitäts- und Hand-Fusionsprüfung:** Aus dem aktuellen ausgerüsteten 40er Deck **echte reproduzierbare Hand-Konfigurationen** und mit dem unveränderten Fusionresolver tatsächlich verfügbare Fusionsziele bewerten. Keine Gratisfusionen, ACES oder geheime NPC-Handdaten.
- **Drei klar getrennte KPIs**: IV/V erhalten, VI-Siege binnen 30/45/60/75 reeller Kämpfe, zusätzliche Kämpfe und Ausgaben je gewonnenem VI-Kampf. Bei marginalen Effekten weiterer unabhängig reservierter Holdout.
- **Produktionssperre bleibt:** `main`, Live-NPC, Kartenwerte, ACE-Verfügbarkeit, Loot- und Shardregeln nicht verändern, bevor eine getrennte NPC-Fairness- und Schwierigkeitsprüfung vorliegt.

## Verifizierte QA

- [v10.0 CI #39378042543 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042543): **56/56** Game-/Save-/Economy-/Deck-/Fusion- und **20/20** zusätzliche AI-Tests bestanden.
- [Code/Strategie #39378042446 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042446).
- [Browser-Smokes #39378042355 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042355).

**Status:** echte Trainingsrunde vollständig durchgeführt, Daten und Rohartefakt verifiziert. `vi-focused` als Offline-Kandidat erneut positiv (kleiner Holdoutvorsprung), neue Qualitätspolitik im frühen Zeitbudget interessant, aber nicht allgemein qualifiziert. Live-Gegner-KI und Main unverändert.
