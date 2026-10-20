# Arcane Duel – KI-Training v9.2 und unabhängige Bestätigung v9.3

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Live-KI / `main` / Kartenwerte / Loot / Wirtschaft:** unverändert.

## Durchgeführte GitHub-Trainingsläufe

| Runde | Training | Quellkarrieren | Reguläre Karriereduelle zum Kartenerwerb | Diagnoseduelle |
|---|---|---:|---:|---:|
| v9.2 Kandidatenvergleich | [GitHub Actions #39366870349 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366870349) | 32 neue unabhängige Quellen, Seed-Offset 40000 | **1.541** | **768** |
| v9.3 vorab festgelegte Replikation | [GitHub Actions #39367079885 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39367079885) | 32 nochmals neue unabhängige Quellen, Seed-Offset 44000 | **1.563** | **256** |
| **Gesamt** | | **64** | **3.104** | **1.024** |

Je Runde: Ursprünge werden **vor der Analyse** in 16 Trainings- und 16 unabhängige Holdout-Karrieren aufgeteilt; je Ursprung zwei Kampfseeds und beide Startspielerpositionen. Spiele aus demselben Ursprung sind statistisch korreliert; **64 Duelle pro Policy und Kohorte sind keine 64 unabhängigen Karrierequellen**.

Echte Kartensammlung, Shopkäufe und andere Ressourcen werden ausschließlich durch den bestehenden legalen Karriere-Simulator erwirtschaftet. Die Matched-Diagnosekämpfe benutzen dieselben rechtmäßig vorhandenen 40er-Hauptdecks und Fusionsdecks, dieselben Gegner-IV-Werte und dieselben Ausgangsseeds. In diesen Diagnosekämpfen wird **kein `rewardMatch`** aufgerufen. Die Offline-Policies ändern nur Entscheidungen des Spielers in einem Match; sie vergeben keine Gratis-Monster, Essenzen, ACE-Karten, Splitter oder Turniererfolge.

## v9.2 – sechs vergleichbare Policies und tatsächliche Angriffstelemetrie

Anstatt die Angriffsauswahl nachträglich zu ändern, bewertet v9.2 **legal mögliche Beschwörungen vor der Angriffsphase**. Aus aktuellen Handkarten werden Kombinationen mit 2 bis 5 Materialien durchlaufen. Jedes Kandidatenziel wird anhand der tatsächlichen `fusionOptions`, des verbleibenden Fusionsdecks und von `canCompleteHandFusion` kontrolliert. Die Engine setzt gewählte Fusionen und normale Karten unverändert um; Würfelergebnisse werden nicht erzwungen.

Die Ansätze sind: unveränderte Baseline, stärkste normale Handkarte, höchstwertige erreichbare Fusion, materialsparende Fusion, sichtbare Feldstärke/Tempo und stärkere Berücksichtigung von ACE-/hochstufigen Fusionen.

| Strategie | Training – Siege aus 64 | Holdout – Siege aus 64 | Holdout wirkliche Angriffe | Holdout zerstörte Gegnerkarten |
|---|---:|---:|---:|---:|
| Baseline | **5** | 2 | 55 | 36 |
| Normal-best | 0 | 0 | 4 | 4 |
| Fusion-peak | 3 | 7 | 266 | 186 |
| Fusion-conserve | 3 | 9 | 244 | 161 |
| **Tempo-board (trainingsseitig ausgewählt)** | **5** | **9** | **271** | **170** |
| ACE-reach (explorativ) | 3 | 12 | 318 | 200 |

Die v9.2-Trainingsauswahl war **`tempo-board`**, weil sie gegenüber der Baseline gleich viele Siege bei **+786,1 LP** mittlerer Differenz erreichte. Im danach unabhängig ausgewerteten Holdout erzielte Tempo-board **+7 Siege** (2 → 9) und **+1.815,4 LP** im Mittel; **6 unabhängige Ursprungskarrieren besser, 10 gleich, keine schlechter**. Die interne v9.2-Qualifikationsregel (`winsDelta>=3`) meldete deshalb `qualified=true` **für diesen Holdout**.

Die ACE-reach-Variante erreichte explorativ **12 statt 2** Holdout-Siege, wurde aber im Training **nicht** gewählt (3 statt 5 Siege). Sie darf daher **nicht nachträglich als Gewinner des unabhängigen Holdouts deklariert** oder unbestätigt produktiv aktiviert werden.

**Mechanistischer Befund:** Der Spielercore wählt in vielen Situationen eine Fusion mit den ersten zwei nach Level sortierten Karten. Das legalitätsgesicherte Ranking alternativer Materialien und erreichbarer Fusionsziele ist in diesen Testfällen deutlich wirkungsvoller. Nur normale Karten zu beschwören (ohne die wertvollen Fusionen) schadet erheblich. Es ist somit plausibler, die **Qualität des Fusionsentscheidungsprozesses** zu verbessern als Fusionen pauschal zu unterdrücken.

**Audit-Einschränkung:** Die `fusionOffers`-Metrik wird vom experimentellen Evaluator erhoben. Der Baseline-Arm durchläuft diese Kandidatenaufzählung nicht und zeigt in diesem speziellen Zähler **0**, obwohl er **tatsächlich Hunderte Fusionen ausführt**. Dieser Nullwert darf keinesfalls als fehlende Baseline-Fusionsmöglichkeiten dargestellt werden. Auch die tausenden Kandidaten zählen Kombination × Ziel × wiederholte Zustandserhebung und sind keine statistisch unabhängigen Fusionschancen.

## v9.3 – vollständig neue, vorab registrierte Bestätigung

Es wurde **vor dem neuen Lauf** festgelegt, ausschließlich `baseline` gegen **`tempo-board` mit exakt demselben v9.2-Auswahlcode** zu vergleichen. Die v9.2-ACE-Holdout-Ergebnisse flossen ausdrücklich **nicht** in die neue Policy ein. 32 weitere, unabhängig erwirtschaftete Karriere-Inventare (Seed-Offset 44000); 1.563 reguläre Karriereduelle; 256 kontrollierte IV-Diagnoseduelle.

| Kennzahl | Training – Baseline | Training – Tempo | Holdout – Baseline | Holdout – Tempo |
|---|---:|---:|---:|---:|
| **Siege aus 64** | 0 | **1** | 2 | **4** |
| Mittlerer Spieler-LP-Rückstand | 5.670,0 | **4.727,4** | 5.478,2 | **4.275,4** |
| Tatsächlich ausgeführte Angriffe | 10 | **127** | 42 | **200** |
| Gegnerkarten zerstört | 10 | **99** | 27 | **137** |
| Gesamtschaden gegen Gegner-LP aus Attacken | 572 | **21.574** | 13.481 | **42.903** |
| Durchschnittlich beste ausgespielte ATK pro Kampf | 470,2 | **672,0** | 493,5 | **685,2** |

Die gepaarte v9.3-Auswertung lautet: **+1 Sieg im Training**, **+2 Siege im unabhängigen Holdout**. Im Holdout wurden **3 Ursprungskarrieren besser, 11 gleich und 2 schlechter**. Trotz großem, erneut sichtbarem Vorteil bei LP und wirksamen Angriffen bleibt die strikt **vorab festgelegte v9.3-Qualifikationsgrenze von mindestens +3 Holdout-Siegen unerfüllt** (`qualified=false`). Die Daten sind eine echte **teilweise Replikation des stärkeren Feldaufbaus**, aber noch keine ausreichende Bestätigung eines robusten Karriere-Siegzuwachses.

## Gesamtinterpretation

- v9.2 und v9.3 zusammen zeigen auf **unterschiedlichen legalen Ursprungspopulationen** einen **deutlich besseren realen Feldaufbau, mehr tatsächlich ausgeführte Angriffe und eine bessere LP-Bilanz** mit `tempo-board`. Dies ist wesentlich informativer als die erfolglosen Attack-Ziel-/Soul-Gewichtungen von v9.1.
- Die Siegverbesserung reproduziert **die Richtung**, aber nicht die frühere Stärke: vorab unabhängiger Holdout v9.2 +7/64, neuer unabhängiger Holdout v9.3 **+2/64**; außerdem verliert v9.3 Tempo-board bei 2 von 16 Quellen einzelne Baseline-Erfolge.
- Die numerisch höhere v9.2-ACE-reach-Holdout-Leistung ist **explorativ**, nicht methodisch freigegeben.
- Ein guter Offline-Player-Controller ist **keine automatisch aus PvP-/Nutzermatches lernende Gegner-KI**. Die NPCs und die produktiven KI-Policies bleiben unverändert.

## Priorisierte Entwicklung nach v9.3

1. **Mehr unabhängige Bestätigung, keine weitere Holdout-Nachoptimierung:** Vorab festgelegtes `tempo-board` vs. unveränderte Baseline auf einer größeren Anzahl neuer Ursprungskarrieren. Aus der tatsächlichen Gewinnvarianz eine belastbare Evaluation ableiten, nicht bloß „+2“ als neuen Balance-Erfolg zählen.
2. **Karriere-A/B als nächste notwendige Prüfung:** Die Trainingspolicies im regulären Karriere-Simulator als **isolierten Offline-Player-Aktionscontroller** einsetzen; gleiche Startseeds, echte Deckentwicklung und eigene reguläre Rewards je Arm. Primäre KPI: **tatsächlich erreichte Turnierstufen IV und VI**, benötigte Anläufe und Ressourcenverbrauch. Die bisherigen gepaarten einmaligen IV-Duellen ersetzen das nicht.
3. **Fusion-/ACE-Diagnose sauber trennen:** `tempo-board` (bestätigter Kandidat) und `ace-reach` (explorative Folgeidee) jeweils **ohne neue Regeländerungen** auf wirklich neuen Kohorten prüfen. Mit geringeren Fusions-Opportunity-Auditkosten nur Kandidatenzähler bei relevanten spielbaren Handzuständen bilden.
4. **Keine produktive Änderung an `main`, NPC-KI, Ökonomie oder Kartenwerten**, solange echte Karriereprogression und unabhängige Siegverbesserung nicht ausreichend bestätigt sind. Erst dann umfassende Combat-/Save-/Role-/Fusion-/ACE-/Browser-Tests und separater Freigabeentscheid.

## CI / Reproduzierbarkeit

- v9.2 [Trainingsworkflow](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366870349) **SUCCESS**, interne Tests **56/56** Legalitäts-/Save-/Ökonomie-/Fusions-Tests und **20/20** zusätzliche KI-Regressionstests bestanden. Separate [Code-/Strategie-Checks SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366870229) und [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366870242).
- v9.3 [Trainingsworkflow](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39367079885) **SUCCESS**, erneut **56/56 + 20/20** Tests bestanden; [Code-/Strategie-Checks SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39367079815). [Browser-Smoke-Lauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39367079868) separat abschließend prüfen.
- JSON-Aktionsartefakte v9.2: `arcane-pre-attack-v92` ID `12238994403`; v9.3: `arcane-tempo-confirmation-v93` ID `12240011138`, beide bis **19. November 2026** verfügbar.

**Freigabestatus: Training abgeschlossen, positiver technischer Fortschritt, `main` und Live-KI unverändert. Nach neuer strenger v9.3-Grenze keine volle Produktivqualifikation.**
