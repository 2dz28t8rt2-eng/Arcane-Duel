# Arcane Duel — KI-Training v8.7: Angriffsziel, Feldschutz und Seelenfähigkeiten

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Commit:** [83e172e](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/83e172e1a0be1b901ee79ca1130334a805698155)

**GitHub Actions Training:** [#39363241584 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241584). **Code-/Strategieprüfungen:** [#39363241547 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241547). **Separater Browser-Smoke-Lauf:** [#39363241510 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241510). **Artefakt:** `arcane-tactical-board-v87`, ID `12237829822`, verfügbar bis 19. November 2026. Enthält `ai-earned-preiv-v87.json` und `ai-tactical-v87.json`.

## Versuchsdesign

- **32 vollständig neue und voneinander unabhängige Karriere-Startseeds** (Offset **20000** gegenüber v8.6: 16000), 16 vorher festgelegte Trainingsursprünge und 16 bis zur Auswertung unbenutzte Kontrollursprünge.
- **1.585 reguläre Karriereduelle** zur Erwirtschaftung aller Karten, Währungen und Fusionen: **14 von 32** erspielten Karrieren besiegten Gegner IV innerhalb der vorgesehenen 16 Turnierversuche. 32 gültige Inventar-Snapshots direkt vor Turnierstufe IV aus den tatsächlich verdienten Sammlungen.
- **5 gepaarte Varianten**, je Profil 2 Kampfseeds und beide Startpositionen, auf **demselben** 40-Karten-Hauptdeck und demselben legalen Fusionsdeck: `baseline`, `threat-target`, `survival-defense`, `soul-support`, `hybrid-board`.
- 32 × 5 × 2 × 2 = **640 echte Engine-Diagnosekämpfe**. Die statistisch unabhängige Einheit ist die **Karrierequelle**, nicht jeder der 640 Einzelkämpfe.
- Die Eingriffe betreffen **ausschließlich die gesandboxte Spieler-Aktion im laufenden Duell** (Attack, Switch, bei tatsächlich vorhandenen legalen Bedingungen Soul Drain/Guardian Heal). Live-Gegner, ACE, Kartenwerte, Spielmechanik, Ökonomie, Save, Quest und der produktive Spielcode `assets/game.js` bleiben unverändert.
- Das Ergebnis jedes Testduells wird nach Endzustand der tatsächlichen Spielengine gemessen. **Keine** Auszahlung per `rewardMatch` aus Tests, **keine** direkt zugeschenkten Karten, Splitter, Essenzen oder Turnier-Siege.

## 1. Echte Siege und LP-Bilanz

### Training – 16 unabhängige Ursprünge, 64 Matches pro Variante

| Policy | Sieg/64 | Mittlere Spieler-LP-Differenz | Echte Fusionen | Angriff-Overrides | Defensive Wechsel | Support-Aktionen |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | **3** | −5.315 | 357 | 0 | 0 | 0 |
| Threat Target | **3** | −5.329 | 357 | 28 | 0 | 0 |
| Survival Defense | 1 | −5.479 | 371 | 11 | 134 | 0 |
| Soul Support | 1 | −5.465 | 371 | 0 | 134 | **0** |
| Hybrid Board | 1 | −5.479 | 371 | 11 | 134 | **0** |

### Holdout – 16 andere Ursprünge, 64 Matches pro Variante

| Policy | Sieg/64 | Mittlere Spieler-LP-Differenz | Echte Fusionen | Angriff-Overrides | Defensive Wechsel | Support-Aktionen |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | **3** | −5.379 | 383 | 0 | 0 | 0 |
| Threat Target | **3** | −5.379 | 383 | 26 | 0 | 0 |
| Survival Defense | **4** | **−5.183** | 392 | 31 | 124 | 0 |
| Soul Support | **4** | −5.186 | 392 | 0 | 124 | **0** |
| Hybrid Board | **4** | **−5.183** | 392 | 31 | 124 | **0** |

**Interpretation:** Der gezielte Angriff brachte keinen Sieggewinn und im Holdout im Mittel exakt dieselbe LP-Differenz. Die drei defensiven Varianten waren in ihrer Siegwirkung **nahezu deckungsgleich**, weil sie dieselbe Positionsregel verwendeten. Dass Soul Support und Hybrid ähnliche Ergebnisse liefern, darf **nicht** als Bestätigung gelungener Unterstützungsfähigkeiten missverstanden werden.

## 2. Gepaarte Kontrollanalyse

- `threat-target`: Holdout gegenüber Baseline **0 Karriereursprünge besser / 16 gleich / 0 schlechter**, **0 zusätzliche Siege**, **0 LP** Differenz.
- `survival-defense`: Holdout **1 besser / 15 gleich / 0 schlechter**, **+1 Sieg** und **+195,6 LP** im Mittel. Im **Training** jedoch **0 besser / 14 gleich / 2 schlechter**, **−2 Siege** und **−164,5 LP**. Die Unterschiede kehren also zwischen Train und Holdout ihr Vorzeichen um.
- `soul-support`: Holdout **1 besser / 15 gleich / 0 schlechter**, **+1 Sieg** und **+192,5 LP**. Im **Training** jedoch ebenfalls **−2 Siege** und **−150,7 LP**. Der Support wurde aber **nicht ein einziges Mal aktiviert**.
- `hybrid-board`: im Holdout derselbe Sieg-Effekt wie reine Defensive, im Training derselbe Verlust von 2 Siegen.

**Tatsächlicher Selektionsentscheid:** Keine Variante übertraf die Baseline im vorab bestimmten Trainingssatz. Daher wählte die Version-8.7-Auswertung **`baseline`** als trainingsseitigen Kandidaten; `qualified=false`, und es wurde **keine** der experimentellen Strategien zum Einbau freigegeben. Ein nachträglicher einzelner Holdout-Sieg ist keine legitime Grundlage, die Auswahllogik zu übergehen.

## 3. Erklärungsbefund: verfügbare defensive Synergien

Die Varianten `soul-support` und `hybrid-board` enthielten echte rechtmäßige Prüfungen für Seelenentzug und benachbarte Wächter-Heilung. Dennoch waren in allen 640 Diagnosekämpfen bei den entsprechenden Arms **0** tatsächlich gewählte Supportaktionen zu verzeichnen. Mögliche Ursachen: fehlende Soul-/Guardian-Monster im gerade ausgerüsteten Vor-IV-Deck, zu wenige zufällig entstandene passende Feldzustände, nicht in DEF stehende oder bereits verbrauchte Einheiten, fehlende benachbarte Unterstützung. Der vorliegende Test unterscheidet diese Ursachen **noch nicht** direkt.

Daher beweist v8.7 **weder**, dass die vorhandenen Support-Fähigkeiten schwach wären, **noch**, dass die KI sie sinnvoll nutzen kann. Eine bloße Nachjustierung ihrer Bewertungsgewichte ohne genügend legitime Feldsituationen wäre wissenschaftlich unergiebig.

## 4. Priorisierte Roadmap v8.8

1. **Coverage-Audit vor neuem Training:** Quelle, Rolle und Häufigkeit jedes Soul/Guardian-Monsters im tatsächlich ausgerüsteten Vor-IV-Deck bestimmen. Pro gespieltem Zug messen: Soul vorhanden? in DEF? noch aktiv? legale Ziele? Wächter benachbart? Support-Aktion verfügbar? Jeder Blocker bekommt einen separaten Zähler.
2. **Deck-/Feldtaktik der Defender ohne Cheats testen:** Rollen- und Support-Cards ausschließlich über wirklich erworbene Karten auswählen, keine künstlich geschenkte Fusion/ACE. Erst wenn mindestens mehrere unabhängige Karrieren echte Support-Gelegenheiten besitzen, Support-Wirkung auf Siege/LP prüfen.
3. **Angriffsentscheidungen breiter messen:** Bisher wurden pro Holdout-Variante nur 26–31 Angriffe tatsächlich überschrieben. Zielplanung für stärkste gegnerische Fusion, sichere Attacke, Reihenfolge und Defense-Gegenschlag gezielt auf realen, häufigen Kampfzuständen untersuchen.
4. **Verteidigung vor IV auf neuem, frischen Holdout bestätigen:** Die defensive Positionierungsregel zeigt in einer Hälfte einen negativen und in der anderen einen positiven Effekt. Neue Seed-Kohorten, gepaarte Ausgangsprofile und tatsächliche Karriere-Fortschritte (IV, VI) vor Änderung an Live-Spieler-KI.
5. **Keine Produktionsfreigabe:** v8.7-Strategien verbleiben ausschließlich in Offline-Testskripten auf `development`. Insbesondere nicht die Live-Gegner-KI, Loot- und Splitterregeln, Kartenwerte, `main` oder Karriere-Gegner-Balance verändern.

## QA & Grenzen

- Trainingsworkflow insgesamt **SUCCESS**, Tests: **56/56** initiale Game-/Save-/Fusion-Regressionen sowie **20/20** ergänzende AI-Regressionen grün.
- Die getrennten GitHub Code-/Strategie- und Browser-Smoke-Läufe wurden beide **erfolgreich abgeschlossen**.
- Keine neuronale oder fortlaufend online lernende KI: Diese Versuche vergleichen manuell entworfene und automatisch durchgespielte **Offline-Spieler-Policies** auf echten Game-Engine-Simulationen.
- Pro Arm werden nur 64 Duelle aus 16 unabhängigen Ursprungsprofilen gewertet, daher sind +1 bis −2 Siege insbesondere bei niedrigen Grundsiegquoten kein robuster Sieg-Beleg.
- Alle fünf Varianten benutzen dieselben Ausgangsdecks/Startseeds je Profil, aber ihre Aktionen können den weiteren Zufallszahlen-Verlauf beeinflussen.
- Gegner IV ist hier der einzige in der Diagnosegruppe direkt gespielte Gegner; die Quelle kann im regulären Training Gegner IV schlagen, aber der kontrollierte Test belegt **keinen** besseren kompletten Karrierefortschritt.

**Fazit:** v8.7 wurde erfolgreich ausgeführt; Angriffstargeting liefert keinen reproduzierten Mehrwert und defensive Positionierung ist noch uneinheitlich. Ein priorisierter Coverage-Audit der tatsächlichen Soul-/Guardian-Verfügbarkeit und streng neue Seed-Validierung des defensiven Zugplans haben mehr Erkenntnispotenzial als weitere unisolierte KI-Buffs.
