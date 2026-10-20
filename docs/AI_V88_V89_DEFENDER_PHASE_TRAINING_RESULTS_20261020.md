# Arcane Duel — KI-Training v8.8 und v8.9: Defender-/Soul-Coverage und phasenbewusste Aktionen

**Datum:** 20. Oktober 2026 · **Branch:** `development`. **Produktive KI / `main` / Game-Balance:** unverändert.

## Tatsächliche Ausführung und Artefakte

- **v8.8 Rohtraining:** [Workflow #39363960934 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363960934); Commit [e9b27eb](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/e9b27eb4a8859708ca2428e03b4b6bb3feaed6e1). V8.8 Rohdaten hatten einen zu eng auf die Angriffsphase beschränkten Coverage-Zähler, weshalb die Nullwerte für „auf dem Feld“ **nicht** als Beweis der Rollenabwesenheit verwendet werden.
- **v8.8 korrigierte Phasendiagnose:** [Workflow #39364183073 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364183073), Instrumentierungscommit [2406633](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/2406633780b182193fc828b30f41c1372de5b794); v8.8-JSON-Artefakt `arcane-defender-coverage-v88` (ID **12239146047**).
- **v8.9 phasenbewusster Kontrollversuch:** [Workflow #39364487467 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364487467), Startcommit [f6b7a9a](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/f6b7a9a261cd4fbd6528d9e2643687e7d295d67e), korrigierter Test-Import [ecafa7c](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/ecafa7c97894d855ea73fa92ab9c50f565f4c860). JSON-Artefakt `arcane-phase-aware-v89` (ID **12239206387**).
- **QA v8.8:** Regression **56/56 + 20/20**, allgemeine Code-/Strategiechecks [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364183084), Browser-Smokes [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364183144).
- **QA v8.9:** Regression **56/56 + 20/20**, Code-/Strategiechecks [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364487482); separater Browser-Smoke [#39364487475](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364487475) lief bei initialer Niederschrift noch und muss getrennt final geprüft werden.
- Der erste v8.9-Versuch [#39364398459](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364398459) **schlug technisch fehl**, weil das Script einen alten Dateinamen des Import-Helpers referenzierte. Es wurden daraus **keine** Trainingsergebnisse verwendet. Die Korrektur führte zum oben genannten erfolgreichen Voll-Lauf mit allen 768 Duellen.

## Versuchsmethodik

v8.8 erzeugte **32 neue und unabhängige** regulär verdiente Vor-IV-Inventare auf Seed-Offset **24000**, verteilt auf 16 Trainings- und 16 bisher ungenutzte Holdout-Ursprünge. Dafür wurden **1.642 echte Karriere-Duelle** mit regulären Belohnungen absolviert; in **11/32** Karrieren wurde Gegner IV innerhalb der gewählten Versuchsgrenze bewältigt. Die darauf folgenden **896** matched Diagnoseduelle testen **7** Varianten auf gleicher zu Versuchsbeginn tatsächlich besessener Kartensammlung, zwei Matchseeds und beide Starter pro Ursprung. Die role-deck-Arme ändern ausschließlich die **legal aus dem Besitz auswählbaren** Karten, nicht die Besitzdaten.

v8.9 verwendet **32 nochmals neue Ursprünge** mit Seed-Offset **28000**, **1.611** echten regulär belohnten Karriere-Duellen (IV in **12/32** vollständigen Karrierequellen gewonnen) und **768** neuen Diagnosekämpfen mit **6** Varianten. Trainingsauswahl ausschließlich aus 16 neuen Ursprungskarrieren, Kontrolle auf den übrigen 16. Die Varianten verwenden bestehende rechtmäßige Seelenfähigkeiten und ändern nur den **offline simulierten Spieler-Aktionsplan**. Ein phasenbewusster Kandidat kann den internen AI-Zustand von `positions` auf `attacks` wechseln, um eine bereits gemäß echter Game-API verfügbare Unterstützungsaktion auszuführen, bevor der normale `chooseAiAction`-Fallback einen Switch/Attack wählt. Keine Belohnungen aus Probe-Duellen und keine Änderungen an der offiziellen Game-Engine.

**Statistische Einheit ist ein ursprünglich unabhängig verdienter Karriere-Save**, nicht jedes der 896/768 verschachtelten Duelle. Anfangsdecks und Seeds bleiben innerhalb jedes Arms gleich, doch abweichende Aktionen können die weitere Engine-RNG-Abfolge verschieben.

## v8.8 – korrigierter Coverage-Audit und sieben Strategien

### Siegzahlen (je 64 Diagnosekämpfe pro Kohorte/Variante)

| Variante | Training | Unabhängiger Holdout |
|---|---:|---:|
| Baseline, Standarddeck | 2 | **1** |
| Defensive Positionierung, Standarddeck | 2 | 1 |
| Nur Soul Support, Standarddeck | 2 | 1 |
| Defensive + Support, Standarddeck | 2 | 1 |
| Nur legal erworbenes Rollen-Deck | 2 | 2 |
| Rollen-Deck + Support | 2 | 2 |
| Rollen-Deck + Defensive + Support | 2 | 1 |

Die Trainingswahl war `defense-only` (gleiche 2 Siege, **+83,4** mittlere LP-Differenz), im Holdout jedoch **keine** zusätzliche Partie gewonnen und nur **+72,8** LP-Differenz. Das Rollen-Deck allein gewann im Holdout **einen** Sieg mehr (2 statt 1), hatte aber im Training keinen Vorteil – zudem nur **1/16** unabhängige Quellen besser. Keine Promotionsqualifikation (`qualified=false`).

### Diagnose – Rollen sind vorhanden, auf dem Feld selten, Aktionen nur sehr kurz verfügbar

- **Alle 32 Ursprungskarrieren** führten im ausgerüsteten Baseline-Deck mindestens ein Soul- und Guardian-Monster.
- Im 16-Sources-Trainingsblock enthielten die Base-Decks zusammengerechnet **85 Soul- und 148 Guardian-Kopien**; im anderen 16-Sources-Block **85 und 155**. Der Vorschlag, fehlende Soul-Karten einfach zu verschenken, ist somit sachlich unbegründet.
- Die erste Zählweise erfasste nur ausdrücklich als `attacks` markierte Einstiegsmomente und berichtete **fälschlich null** Soul/Guardian-`fieldTurns`. Nach Korrektur der Phasenmessung waren die Einheiten sehr wohl im Kampf: Training Baseline **35 Spielzüge mit Soul auf dem Feld**, **82 mit Guardian**; Holdout Baseline **29** bzw. **93**. `soulDefAnyTurns` training 26, holdout 21, jedoch `soulReadyAnyTurns` 1 bzw. 0.
- Über **64 Holdout-Baseline-Kämpfe** sah die äußere AI-Wrapper-Logik nur **14 vor dem Entscheid explizit im Status `attacks`** gestartete Aufrufe (gegenüber 742 `positions`-Aufrufen). Der bestehende Core kann innerhalb eines einzigen `chooseAiAction`-Aufrufs von `positions` unmittelbar über Angriffe zu `guard` fortschreiten, ohne dass ein dazwischenliegender `attacks`-Hook eine Supportpolicy aktivieren kann.
- Im v8.8-Holdout kamen phasenübergreifend mindestens vereinzelte Vorbedingungen zusammen (`legalHealAnyCalls` Baseline 4, Rollen-Deck 4; im Rollen-Deck zudem `legalDrainAnyCalls` 8). **Keine einzige Unterstützungsaktion wurde gewählt oder ausgeführt**, weil der Policy-Hook nur im engen extern sichtbaren `attacks`-Fenster lag. Diese Werte zählen **potenzielle Feldgelegenheiten ohne Phasengate**, nicht legal vollzogene Akte in beliebigen Phasen.
- Ein einfacher, früherer Rollen-Deckbuilder konnte die tatsächlich gewonnenen Hauptdecks nur bei **6/16 Trainings- und 7/16 Holdout-Quellen** verändern. Er ersetzt deshalb weder einen zuverlässigen Defender-Karriereplan noch garantiert er Support-Tempo.

**Daraus folgt:** Das ursprüngliche „0 Support“ war vor allem eine Kombination aus **falsch eng platzierter Beobachtung, sehr selten spielbereiten Souls und intern übersprungenen AI-Phasengrenzen**. Die Rollen existieren. Ihr mechanisch erlaubter Einsatz ist unter realen frühen Turnierzuständen aber selten.

## v8.9 – neu und fair isoliert: Phase-aware legal Support

### Siegzahlen (je 64 Kämpfe pro Arm)

| Strategie | Training | Unabhängiger Holdout | Holdout mittlere Spieler-LP-Differenz |
|---|---:|---:|---:|
| Standard-Baseline | 0 | **2** | −5.492,9 |
| Phase-aware Support | 0 | 2 | −5.490,5 |
| Phase-aware + Defense | 0 | 2 | −5.440,9 |
| Legales Rollen-Deck | **1** | 2 | −5.501,8 |
| Rollen-Deck + Phase-aware Support | **1** | 2 | −5.500,6 |
| Rollen-Deck + Phase-aware Support + Defense | **1** | 1 | −5.570,9 |

**Kausal aussagekräftige technische Erkenntnis:** Bei **unverändertem Deck** hat `phase-support` in der Trainingshälfte **2 tatsächlich erfolgreiche** Supportaktionen ausgelöst und im getrennten Holdout **3 tatsächlich erfolgreiche**, zusammen **5 über 128 Duelle dieser EINEN Variante**. In der unveränderten Baseline waren es 0. Für denselben Rollen-Deck-Besitz änderte sich die Siegzahl dadurch nicht (Training 0/64 → 0/64, Holdout 2/64 → 2/64), die LP-Differenz jedoch geringfügig. Das beweist den technischen Steuerpfad, **nicht** den strategischen Sieg-Vorteil.

Unter den auf der Trainingshälfte zulässigen Varianten wurde `role-phase-defense-support` als Sieger gewählt: ein statt null Siege und +265,7 LP-Differenz. Der unabhängige Holdout widerlegte diese Auswahl mit **1 statt 2 Baseline-Siegen**, **−78,1 LP** schlechterer mittlerer Differenz und Paarung **0 besser / 15 gleich / 1 schlechter**. Somit `qualified=false`, **keine** Kandidatenfreigabe.

## Schlussfolgerung für die nächste Entwicklung

1. **Phase-aware Support-Steuerung ist technisch machbar**, ohne reale Spielmechanik oder Inventar zu verletzen; der bisherige KI-Hook verpasst Möglichkeiten, wenn `chooseAiAction` die Phasen intern überspringt.
2. **Die Situationen bleiben zu selten**, um aus 2/64 bzw. 3/64 technischen Aktionen einen messbaren Karrieresieg-Vorteil abzuleiten. Ein Effekt auf LP ist nicht automatisch ein Vorteil gegenüber Boss IV.
3. **Vorrang vor neuen KI-Gewichten:** echten Turn-Ablauf in klar getrennte Aktionen zerlegen: Positionierung → optionale Guardian-Heilung/Seelenentzug → legale Angriffe → Guard → End, ohne neue Züge oder doppelte Aktionen zu schenken; `switched`/`attacked` beachten. Zuerst im Offline-Player-Pilot implementieren und testbar machen.
4. **Legale Rollen-Karrieren später prüfen:** Frühstufe IV allein zeigt nur sehr wenige bereitstehende Souls. V/VI nur mit wirklich regulär erspielten Saves hinzufügen, kein künstliches Weiterstufen oder zusätzliche Karten.
5. **Dann echte vollständige Karriere-A/B**, wenn taktischer Candidate auf neuen unbenutzten Seeds mehr IV- und VI-Siege erzielt, und erst dann Review einer optionalen echten Engine-/KI-Änderung.
6. **Live-Rollout bleibt gesperrt:** keine Änderung an `main`, NPC-Gewichten, Monsterwerten oder Splitterwirtschaft. Neues Code-Training ist keine neuronale Online-KI.

**Fazit:** v8.8 und v8.9 belegen einen konkreten **Zugphasen-Planungsengpass** und demonstrieren die technische Behebung bei seltenen Support-Gelegenheiten. Eine robuste Kampf-Sieg-Verbesserung ist noch nicht nachgewiesen. Nächste Priorität: **sauberer Aktionsphasen-Controller und bessere Early-/Midgame-Rollenverfügbarkeit** statt weiterer pauschaler Fusion-Buffs.
