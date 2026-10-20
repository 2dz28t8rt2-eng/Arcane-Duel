# Arcane Duel — KI-Trainingsbericht v8.5 + v8.6 (20. Oktober 2026)

## Durchgeführte Läufe

- **v8.5:** [GitHub Actions #39360036179 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360036179), Source-Commit `7df5bdca16198a35233636ae0a18ab3330b90917`. Ergebnisartefakt `arcane-tactical-ai-v85` (ID `12236713555`, Aufbewahrung bis 19.11.2026).
- **v8.6:** [GitHub Actions #39360317647 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360317647), Source-Commit `4bdf15b01cce13a0dbc64e7a94b0bf219d5c719f`. Ergebnisartefakt `arcane-tactical-ai-v86` (ID `12236559429`, Aufbewahrung bis 19.11.2026).
- **v8.5 Code-/Strategiechecks** [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360035805) und [Browser Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360035737).
- **v8.6 Code-/Strategiechecks** [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360317530); [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360317498).

**Unverändert:** `assets/game.js`, die produktiven NPC-/Spielergewichte, Preise, Monsterwerte, Bossbalance, `main`. Alle neuen Strategien sind **rein offline** in neuen v8.5-/v8.6-Testskripten gekapselt. Keine produktive KI-Aktivierung.

## Einheitlicher Versuchsaufbau

- v8.5: **32 neu erspielte unabhängige Karriereursprünge** (neuer Seed-Offset 12000), davon 16 Trainings- und 16 unberührte Holdout-Karrieren; **1.592 echte, regulär belohnte Karriere-Duelle** erzeugten die Vor-IV-Inventare (16/32 Karrieren gewannen IV im realen Karriereverlauf).
- v8.6: **32 weitere, andere unabhängige Karriereursprünge** (Seed-Offset 16000), je 16 Training/Holdout; **1.583 echte, regulär belohnte Karriere-Duelle** (15/32 Ursprünge gewannen IV).
- Je Training 4 Arme auf **identischem verdientem 40-Karten- und Fusionsdeck**, gleicher Gegner IV, zwei feste Matchseeds, beide Startpositionen. Das ergibt **512 Engine-Diagnoseduelle pro Trainingslauf**, insgesamt **1.024** Diagnosekämpfe. Ursprungskarrieren, nicht diese wiederholten Matches, sind die statistisch unabhängigen Stichprobeneinheiten.
- Diagnosekämpfe geben **keine** Lootkarten, XP, Splitter oder Turnierfortschritt: kein `rewardMatch` bei Probe-Duellen; Spielstand vor/nach der Prüfung unverändert. Der KI-Eingriff betrifft nur die **spielerische Beschwörungsentscheidung** für Handmonster und rechtmäßig mögliche Handfusionen mit 2–3 Materialien. Gegner, AI-Phasen außerhalb der Beschwörung, vorhandene Feldfusionen und die restlichen Engine-Regeln bleiben unverändert.
- Entscheidungsauswertung erfasst echte Spielersiege, durchschnittliche LP-Differenz, tatsächliche Fusionen, materialbewertete Auswahl, Anzahl der Beschwörungsentscheidungen und rechtmäßige Fusionsmöglichkeiten.

## v8.5 — Baseline vs. Materialerhalt, Board-Bedrohung und Ein-Zug-Vorausschau

| Strategie | Train (Siege/64) | Unberührter Holdout (Siege/64) | Holdout mittlere Spieler-LP-Differenz | Holdout echte Fusionen (64 Duelle) |
|---|---:|---:|---:|---:|
| Baseline | **4** | **2** | −5.479 | 369 |
| Materialerhalt | 3 | 1 | −5.225 | 418 |
| Bedrohungsbewusst | 2 | 0 | −5.296 | 410 |
| Ein-Zug-Vorausschau | 2 | 1 | −5.372 | 405 |

**Befund:** Mehrere experimentelle Scorer reduzierten den LP-Rückstand, doch **keiner erhöhte die Siege** im Holdout. Der Materialerhalt gewann im Holdout 1 statt 2 Matches, trotz **+254 LP** im Mittel. Die Rollenvariante ist außerdem als Materialerhalt **zu aggressiv bei Fusionen**: Im Holdout 418 echte Fusionen statt 369 bei der Baseline, und 418 aktiv ausgewählte Fusionen bei nur 17 normalen Beschwörungsentscheidungen. Die verwendete Score-Skalierung ist daher ungenügend kalibriert; das Label `material-preserve` allein ist kein Beleg, dass die KI tatsächlich mehr Material bewahrt.

## v8.6 — Strengere Material-, Qualitäts- und Reaktionsregeln auf anderen, frischen Seeds

| Strategie | Train (Siege/64) | Unberührter Holdout (Siege/64) | Holdout mittlere Spieler-LP-Differenz | Holdout echte Fusionen (64 Duelle) |
|---|---:|---:|---:|---:|
| Baseline | 0 | **4** | −5.339 | 377 |
| Strenger Materialschutz | 0 | 0 | −5.493 | 349 |
| Qualitätsprüfung | **1** | 2 | **−4.908** | 456 |
| Reaktive Fusion | 0 | 0 | −5.512 | 336 |

Die Trainingshälfte wählte `quality-gated` nach dem einzigen zusätzlichen Sieg aus (1 gegenüber 0 in 64 Duellen) und nach **826 LP** besserem Mittelwert. Auf der bis dahin unberührten Holdout-Hälfte erreichte sie **nur 2 statt 4 Siege**, auch wenn der LP-Rückstand um **431 LP** besser ausfiel. Die gepaarte Holdout-Auswertung ist: **2 Ursprünge besser, 10 gleich, 4 schlechter; netto −2 Matchsiege.**

**Wichtige Präzisierung:** Der Qualitätsfilter reduzierte das Fusionsverhalten nicht; er erhöhte die tatsächlich ausgeführten Fusionen auf **456 gegenüber 377** und wählte bei 470 eigenen Beschwörungsentscheidungen **453 Fusionen**. Engere Materialvoraussetzungen allein lösen die systematische Übergewichtung von Fusionen in den Scorern nicht. Der strenge Materialschutz reduzierte zwar Fusionen (349 statt 377), verlor aber alle vier Baseline-Holdout-Siege.

## Bewertung des Verbesserungspotenzials

1. **Vorrangig: tatsächliche Kampftaktik nach der Beschwörung.** Sowohl Deckbuilder-Neusortierung (v8.4) als auch Fusionsauswahl (v8.5/v8.6) verändern oft LP-Bilanzen, aber nicht zuverlässig Turniersiege. Der nächste isolierte Test muss Angriffsziel- und Reihenfolge, Position `ATK/DEF`, Verteidiger-Gegenschlag, Seelenentzug/Seelenverzehr und Erhaltung starker Feldmonster untersuchen.
2. **Keine pauschale Fusion-Priorisierung:** Unsere Scorer tendieren bei materiallastigen Taktiken stark zur Fusion. Mehr Fusionen bedeuten keine bessere Siegchance. Ein v8.7-Diagnosegate sollte *Entscheidungsqualität und nachfolgende Board-/LP-Entwicklung* messen, nicht nur Fusionsanzahl.
3. **Siege gegenüber Gegner IV als Freigabekriterium:** Die Einzeltests gewinnen häufig nur 0–4 von 64 IV-Matches in der Holdoutgruppe. Kleine Änderungen des LP-Rückstands dürfen nicht als Fortschritt der kompletten Karriere verkauft werden. Vor einem Einbau müssen neue unabhängige Ursprungskarrieren mehr IV-Siege und anschließend VI-Siege nachweisen.
4. **Rollout-Lock:** Weder v8.5 noch v8.6 ist qualifiziert. Keine Änderung an Live-Gegner-KI, Kartenwerten, Wirtschaft und `main`. Künftige Kandidaten nur nach neuer Train/Holdout-Bestätigung und voller Gameplay-/Save-/Browser-Regression.

## QA und Grenzen

- v8.5: **56/56** vorgeschaltete Wirtschaft-/Save-/Fusions-Regressionen bestanden, **20/20** zusätzliche AI-Regressionstests bestanden.
- v8.6: erneut **56/56** und **20/20** bestanden.
- Die verwendete Spielpolicy ist ein deterministischer, offline trainierter Heuristikvergleich und **kein neuronales Modell** und kein Online-Lernen aus menschlichen Matches.
- Identische Startseeds/Decks garantieren nicht dieselben Zufallsereignisse nach abweichenden Aktionen. Im Holdout werden 16 *Ursprünge* verglichen, nicht 64 statistisch unabhängige Menschen.
- Die untersuchten Handfusionen verwenden 2–3 Materialien. Legal mögliche Spezialkombinationen aus Feld/Hand oder 4–5 Materialien werden im Diagnose-Scorer noch nicht vollständig bewertet. Bestehende Engine-Fusions- und -Aktionsregeln werden nicht überschrieben.

**Fazit:** Zwei umfangreiche Trainingsphasen sind korrekt abgeschlossen, aber eine belastbare Siegverbesserung fehlt. Nächster Schritt: kein ungezieltes Nachkaufen oder reine Score-Schraube, sondern instrumentierte situationsabhängige Kampf- und Feldentscheidungen gegen IV und VI auf echten Inventaren.
