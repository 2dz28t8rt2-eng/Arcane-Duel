# Arcane Duel — v8.3: Frische Karrieren, Splitter-Kombinationen und früher Soul-Bridge

**Datum:** 19.10.2026. **Branch:** `development`. **Trainings-Commit:** [da7b1b0](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/da7b1b00f2b5bb54188c752fd12e12a920365084). **Trainerfolg:** [GitHub Actions #39312236368](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236368) **SUCCESS**. **Smoke/Code-Strategie:** [#39312236297](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236297) und [#39312236274](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236274) **SUCCESS**. JSON-Artefakt: `arcane-economy-early-fusion-v83`, ID `12217455279`, verfügbar bis 18.11.2026.

## Versuchsaufbau

- **24 wirklich neue, voneinander unabhängig gestartete Karriereseeds** (Seed-Offset 5000, ohne Überschneidung mit den 20 v8.2-Ursprüngen). **7 gepaarte Strategiearme = 168 vollständig simulierte Karriereverläufe**, **822 gespeicherte Pre-Tournament-Snapshots**. Nicht als 168 unabhängig rekrutierte Spieler interpretieren.
- Zwei vorab festgelegte Kohorten zu je 12 Ursprüngen (Training und separater Holdout), identische Ausgangsbedingungen bis zum ersten zugelassenen Eingriff, danach dürfen Aktionen und Zufallszahlen naturgemäß auseinanderlaufen.
- Jede Variante spielt Einführung, echte normale Turnier- und Farmduelle mit `simulateGame`, erwirbt Karten über die tatsächlichen Funktionen und verarbeitet `rewardMatch` ohne gefälschte Belohnungen, Free-Clears, Freischaltungen oder Inventarerhöhungen. Alle bestehenden Gegner-, Karten-, Loot- und Preisregeln bleiben unverändert.
- `late-shard`: bestehende gewohnte Splitterwirtschaft erst nach Sieg über IV; `early-shard`: früh investieren ab Sieg über II; `reserve-shard`: ab II plus 20-Splitter-Minimum; `no-reroll-shard`: ab II ohne 5-Splitter-Booster-Neuwurf; `reserve-no-reroll-shard`: beide Wirtschaftsmaßnahmen; `early-bridge-shard`: ab II vorhandenen legalen Soul-Bridge-Deckbuilder auch **vor IV** anwenden; `reserve-no-reroll-early-bridge-shard`: alle drei Maßnahmen.
- Die Fusion-Auswahl wird nur über bestehende `setActiveDeck`/`setFusionDeck`-Regeln verändert. **Kein** neuer aktiver KI-Code und **kein** Merge auf `main`.

## 1. Ergebnis – durchschnittlich tatsächlich gewonnene Turnierstufen

| Spielerpolicy | Training 12 | Holdout 12 | Alle 24 | Splitter ausgegeben | VIII erreicht | IX erreicht | X erreicht |
|---|---:|---:|---:|---:|---:|---:|---:|
| late-shard (Referenz) | 4,50 | **4,58** | **4,54** | 1.324 | 1 | 1 | 1 |
| early-shard | 4,00 | 3,83 | 3,92 | 3.268 | 1 | 1 | 0 |
| reserve-shard | 4,00 | 4,17 | 4,08 | 1.458 | 0 | 0 | 0 |
| no-reroll-shard | 4,17 | 3,25 | 3,71 | 3.042 | 0 | 0 | 0 |
| reserve-no-reroll-shard | 3,67 | 4,00 | 3,83 | 1.218 | 1 | 0 | 0 |
| early-bridge-shard | 3,50 | 3,25 | **3,38** | 2.958 | 0 | 0 | 0 |
| reserve-no-reroll-early-bridge-shard | 3,92 | 3,67 | 3,79 | 1.202 | 1 | 0 | 0 |

**Kein einziger Arm hat Gegner X geschlagen.** `late-shard` erreichte X in **nur einer der 24 Karrieren**, also weder ein belastbarer Endgame-Nachweis noch repräsentativ für den allgemeinen Karriereverlauf. Je nach Begünstigung eines einzelnen Seeds kann ein Mittelwert stärker schwanken.

Die v8.2-Holdout-Tendenz für „keine Neuwürfe“ wurde **nicht reproduziert**: Im v8.3-Holdout sank die durchschnittliche gewonnene Turnierstufe bei `no-reroll-shard` gegenüber `early-shard` von **3,83 auf 3,25**. Die Kombination Reserve + Neuwurf-Verzicht erreichte **4,00** im Holdout, lag aber unter `late-shard` (**4,58**). Folglich **keine Freigabe** für eine der Wirtschaftskombinationen.

## 2. Kontrollierte Paaranalyse

Alle paarweisen Vergleiche stammen aus jeweils denselben 24 neuen Karriere-Startursprüngen.

| Kandidat vs. early-shard | Besser / Gleich / Schlechter (24) | Holdout-Mitteldifferenz |
|---|---|---:|
| late-shard | 11 / 11 / 2 | +0,75 |
| reserve-shard | 8 / 11 / 5 | +0,33 |
| no-reroll-shard | 3 / 15 / 6 | −0,58 |
| reserve-no-reroll-shard | 4 / 16 / 4 | +0,17 |
| early-bridge-shard | 3 / 13 / 8 | −0,58 |
| reserve-no-reroll-early-bridge-shard | 5 / 12 / 7 | −0,17 |

**A/B-Erkenntnis für frühen Deckbuilder:** `early-bridge-shard` ist auf diesen neuen Seeds klar schwächer als seine eigene Wirtschaftsreferenz `early-shard`. Die Paarung `reserve-no-reroll-early-bridge-shard` gegenüber `reserve-no-reroll-shard` bringt **5 bessere / 12 gleiche / 7 schlechtere** vollständige Karrieren, mit durchschnittlich **−0,04 Turnierstufen** insgesamt und **−0,33** im Holdout. Die Behauptung „früherer Soul-Bridge ist immer besser“ ist damit **nicht** haltbar.

**Aktivierungsnachweis:** Der frühe Soul-Bridge-Arm rief die Auswahl **960-mal** im Lauf vieler Spielvorbereitungen auf, änderte dabei **937-mal** das 40er-Hauptdeck und nur **19-mal** das Fusionsdeck. In der kombinierten Variante waren es **895 Aufrufe**, **874 Hauptdeckänderungen** und **167 Fusionsdeckänderungen**. Somit wurde der neue Trainingszweig **tatsächlich ausgeführt**; sein Misserfolg ist nicht durch eine nie erreichte Bedingung erklärbar. Die Zahlen sind Änderungen *pro Vorbereitung*, nicht 937 eigenständige Deckideen oder Karrieren.

## 3. Wo die Karrieren scheitern

| Strategie | IV betreten | IV gewonnen | VI gewonnen | VII gewonnen | VIII gewonnen | IX gewonnen |
|---|---:|---:|---:|---:|---:|---:|
| late-shard | 24 | **16** | 3 | 1 | 1 | 1 |
| early-shard | 23 | 11 | 2 | 1 | 1 | 0 |
| reserve-shard | 24 | 12 | 3 | 0 | 0 | 0 |
| no-reroll-shard | 22 | 9 | 2 | 0 | 0 | 0 |
| reserve-no-reroll-shard | 24 | 10 | 2 | 1 | 0 | 0 |
| early-bridge-shard | 22 | **6** | 0 | 0 | 0 | 0 |
| Kombination + early-bridge | 23 | 10 | 2 | 1 | 0 | 0 |

**Vorsicht bei 40er-Deckqualität:** Direkt vor IV liegen die gemessenen mittleren Level aller 40 ausgerüsteten normalen Karten im Bereich **2,47–2,77**. Frühzeitiger Soul-Bridge senkte die durchschnittliche Levelzahl gegenüber `early-shard` (**2,57 statt 2,77**); das kann eine Erklärung sein, ist aber noch **keine kausal isolierte Diagnose**. Außerdem kann ein höheres Kartenlevel durch sinnvollere Rollen-/Fusionskombinationen teilweise kompensiert werden. Die Anzahl im Fusionsdeck ist nicht gleichbedeutend mit tatsächlich spielbaren 3–5-Material-Fusionen.

Der IV-Engpass bleibt für alle Varianten relevant, danach folgt der VI-Engpass. Kein Grund, einfach die Gegner abzusenken oder ihre Werte weiter zu erhöhen, bevor wir die Deckentscheidung auf identischem Inventar direkt in Kämpfen verglichen haben.

## 4. QA, Grenzen und Entscheidung

- **55/55 Wirtschafts-/Save-Regressions** und **23/23 zusätzliche AI-Regressionstests** bestanden; die große Code-/Strategie-Suite und die Browser-Smoke-Action waren ebenfalls **erfolgreich**.
- Die Steuerung ist eine **geskriptete Offline-Spielerpolicy** mit frischen Seeds, **kein selbstlernendes neuronales Netz** und kein an Nutzermatches angepasstes Live-Modell.
- Nach Intervention verändert die Deck-/Ökonomiewahl die zukünftige RNG-Verwendung. Ausgangskarrieren sind gepaart; dieselben späteren Kämpfe sind deshalb nicht zwingend mit exakt gleichem Zufall durchlaufen worden.
- Der kleine Holdout von 12 Ursprüngen und die nachträgliche Betrachtung vieler Testarme schließen robuste kausale Schlussfolgerungen über menschliche Erfolgswahrscheinlichkeiten aus.
- **Produktionsentscheidung:** **Keinen** der v8.3-Kandidaten ausrollen. Bisherige Live-Gegner-KI, Bosswerte, Loot- und Splitterpreise sowie `main` unverändert lassen. Der ursprüngliche frühe Soul-Bridge wurde **nur** im Trainingsskript erprobt.

## 5. Nächster sinnvoller Entwicklungsschritt (v8.4)

1. **Matched-Inventory-Turnier-IV-Deckbuilder-A/B**, unabhängig von Karriere-RNG: vor IV aus legal erworbenen identischen Profil-Snapshots `equipBest()`, bisherigen `soul-bridge`, rollenangepassten Deckbuilder und fusionsverfügbarkeitsbewussten Builder direkt gegeneinander testen. Dieselben NPC-, Startspieler- und Kampfseeds, keine Rewards aus reinen Diagnoseduellen.
2. **Ursachenanalyse der Fusionen:** dokumentieren, wie viele der 40 Hauptdeck-Karten für jedes vorhandene Fusionsmonster eine tatsächlich legal spielbare Materialkombination liefern, wie oft beim simulierten Spielen Fusionen zustande kommen, welche Karten/Level die Deckbuilder ersetzen, und wie oft der Hand-/Feldzustand eine Kombination blockiert.
3. **Rollenplanung nicht ausschließlich Soul-Bridge:** je nach `policy` andere Ziele für Predator, Guardian/Soul, Resonator/Allrounder und Spezial-ACE. Den Soul-Builder nicht standardmäßig vor IV erzwingen.
4. **Economy** bis zu neuer Evidenz konservativ behandeln: v8.3 zeigt, dass der pauschale Neuwurf-Verzicht nicht stabil überzeugt. Splitterreserve allenfalls als experimentellen separaten Hebel weiterverfolgen.
5. Erst nach reproduzierbaren Gewinnen auf **neuen, unberührten Karriereseeds** und voller Regression einen Kandidaten für späteren Live-Pilot erwägen.

**Fazit:** v8.3 ist technisch erfolgreich, strategisch ein sinnvoller **Gegenbefund**. Unser größtes nächstes Potenzial liegt in **echter Fusionstaktik und rollenabhängigem Deckbau auf identischen pre-IV-Inventaren**, nicht in bloß frühem Erzwingen des bisherigen Soul-Bridge-Deckbuilders.
