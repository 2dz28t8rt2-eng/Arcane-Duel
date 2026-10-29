# Arcane Duel – KI-Prüfbericht v14.8.1: Taktik aktiv, Aktionsqualität stagniert

**22. Oktober 2026 · Branch `development` · GitHub Actions: SUCCESS · Champion-Promotion: NEIN**

- [Original-Workflow #39717386115](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39717386115) · Build `a1706b02074b63b52b87cce94d11ada9f6628171`.
- [Originalartefakt (report.json, replays.json, candidate.json)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39717386115/artifacts/12399956319)
- Code: [Trainer](../tests/ai-activated-tactics-v1481.cjs), [Workflow](../.github/workflows/ai-activated-tactics-v1481.yml), [v14.8-Fehlerbericht](AI_V148_TACTICAL_TRAINING_RESULTS_20261022.md).
- Fertig: **2026-10-22 03:38:44 UTC = 05:38:44 MESZ**.

## 1. Technische Prüfung

**Alle GitHub-Actions-Schritte erfolgreich.** Pilot, Haupttraining und Archivierung liefen bis zum Ende; 86/86 ursprüngliche Spielmechanik-Regressionstests bestanden, 0 fehlgeschlagen. 63 Trainings- und 63 getrennte Holdout-Szenarien, mit gespiegelten beiden Controller-Sitzpositionen, identischen Ausgangsdecks/Fusionslisten und identischem Startseed pro Vergleich.

**Die Root Cause von v14.8 ist behoben:** `plannerGate` stand zuvor auf `summon-only`, womit die neue Taktik in `attacks` und `positions` nie lief. In v14.8.1 steht es auf `always`. Zusätzlich stoppt der neue Pilot durch Assertions, wenn keine Angriffsphase, keine Positionsphase, kein legaler Angriff oder keine Taktikbewertung nachweisbar sind.

**Hauptlauf – tatsächliche Abdeckung der KI-Taktik:**

| Messung | Haupttraining (beide Varianten je Gruppe) |
|---|---:|
| Aufrufe in Angriffsphase | **1.358** |
| Aufrufe in Positionsphase | **102** |
| Registrierte legale Angriffsangebote | **677** |
| Ausgewertete taktische Entscheidungen | **1.388** |
| Geänderte Topaktion gegenüber dem *internen `oldScore`-Ranking bei denselben simulierten Kandidaten* | **5** |

Der Pilot erreichte zuvor 470 Angriffs-, 36 Positions-Aufrufe, 241 legale Angriffsangebote und 476 Taktikbewertungen. Das ist **echte Ausführung** der Taktik, nicht nur erfolgreiche generische CI.

## 2. Trainingsergebnis – drei Hauptstrategien

| Schwerpunkt | Profil | Siege / Spiele | Ausgewertete Taktik | Interne Rangfolge geändert |
|---|---|---:|---:|---:|
| Offensive | `pressure-control` (gewählt) | 18/36 (50,0 %) | 173 | 0 |
| Offensive | `targeted-aggression` | 18/36 (50,0 %) | 173 | 0 |
| Wächter/Soul | `guardian-protection` (gewählt) | 18/36 (50,0 %) | 224 | 1 |
| Wächter/Soul | `soul-drain-counterattack` | 18/36 (50,0 %) | 224 | 0 |
| Fusion/Hybrid | `fusion-safety` (gewählt) | 28/54 (51,9 %) | 297 | 1 |
| Fusion/Hybrid | `fusion-offense` | 27/54 (50,0 %) | 297 | 3 |

Die Profile wurden nur anhand der Trainingsduelle ausgewählt. Unterschiede sind minimal und nicht robust. **Fünf veränderte Topaktionen aus 1.388 Bewertungen** entsprechen ungefähr 0,36 %. Das ist ein Diagnosewert für die Wirkung der taktischen Zuschläge auf dieselben simulierten Kandidaten, **kein** direkter Zähler für tatsächliche Aktionsdifferenzen gegenüber der v14.7-KI.

## 3. Unabhängige gespiegelte Duelle

| Schwerpunkt | Siege v14.8.1 gegen v14.7 |
|---|---:|
| Offensive / Predator / Tempo | 18/36 (50,0 %) |
| Guardian / Soul | 18/36 (50,0 %) |
| Fusion / Allrounder / Hybrid | 27/54 (50,0 %) |
| **Gesamt** | **63/126 = 50,0 %** |

Gegen die ursprüngliche, unveränderte Champion-KI ebenfalls **63/126 = 50,0 %**.

Die unabhängig erfassten neuen Kandidaten-Bewertungen sind **727**, mit **0 internen Rangfolgenänderungen** und **0 abgelehnten Ausführungen** auf Engine-Kopien. Hier ist **kein** belastbarer Sieg- oder Steuerungsvorteil nachgewiesen.

**Methodische Warnung:** Der interne Vergleich `oldScore` gegen `score` berechnet beide Werte *auf denselben neuen Kandidaten und ihren einmalig simulierten Folgezuständen*. Das ist **nicht identisch** mit der tatsächlichen Aktionswahl des vollständigen v14.7-Controllers. Die 50-%-Mirrorquote in jeder Strategie sagt, dass aus dem Gesamtduellvergleich kein klarer Vorteil folgt; sie beweist nicht, dass beide Controller in jedem Zustand identisch entscheiden. Die in neun gesampelten Mirror-Paaren aufgezeichneten Gewinner-Sitzpositionen waren jeweils gleich; ein Sitzwechsel allein erzeugt dann zwangsläufig einen Sieg für jede Policy über das Paar. Für v14.8.2 braucht es den echten Aktionspaarvergleich an demselben Zustand und die überprüfte Häufigkeit *unterschiedlicher Handlungen*.

## 4. Regellegale taktische Aktionen auf neuen Testdecks

Über die unabhängigen Kandidaten-Holdouts:

| Aktionstyp | Legale Angebote | Vom neuen Taktikscorer gewählt |
|---|---:|---:|
| Angriff | **338** | **248** |
| Seelenentzug | **38** | **22** |
| Wächterheilung | **11** | **6** |
| Positionswechsel | **34** | **27** |
| Zugende | **700** | **424** |

**Zählweise:** Angebote/Entscheidungen werden je Position gezählt, keine verschiedenen Duelle; einige Aktionen wurden in wiederholten Zuständen mehrfach angeboten. Die 727 bewerteten Entscheidungen sind die Summe aller gewählten Aktionen. Die `positions`-Phase wurde auch dann erreicht, wenn in einer konkreten Lage keine auswertbare `switch`-Alternative existierte. Die Prüfung zeigt damit **Anwendbarkeit** von Soul-/Guardian-/Positionsmechaniken, nicht bereits optimalen Einsatz.

Aus den 18 archivierten Duellperspektiven in `replays.json` wurden **106 kurze Taktik-Rankings** mit Aktionsalternativen gespeichert, davon: **98** ausgewählte Angriffsphasen-Aktionen (63 End, 35 Attack, 5 Soul – Achtung: das sind rechnerisch 103, siehe Rohverteilung weiter unten) und **3** Positionswechsel. **Verifizierte tatsächliche Rohverteilung** ist **63 End + 35 Attack + 5 Soul + 3 Switch = 106**; davon 103 Aktionen aus `attacks` und drei `positions`. Keine `guardian-heal`-Topentscheidung in diesen ersten 18 archivierten Perspektiven; Heilung ist dagegen im übergreifenden unabhängigen Kandidaten-Counter vorhanden. Hinzu kommen **63 alte Summon-Planer-Rankings** und **324 kurze Engine-Aktions-Snapshots**. Bewertungsbeispiele basieren auf direkter Engine-Ausführung; ihre kurzfristigen Score-Deltas sind keine abgesicherten mehrzügigen Gegenfaktika.

**Konkretes protokolliertes Beispiel:** Der Guardian/Soul-Kandidat wählt eine legale Soul-Extract-Aktion `slot:1,target:0`; Score ungefähr **0,5803** gegenüber einem alternativen Angriff `ai:2,di:0` mit **0,0261**. Das ist eine nachprüfbare Bewertungssumme bei diesem Board, aber noch keine Garantie, dass der Absaugzug über zwei oder mehr gegnerische Züge tatsächlich besser ist.

## 5. Boss-Stress und Spezialisten

| Boss | Kandidat | v14.7-Kontrolle | Frozen Champion | Spiele je Controller |
|---|---:|---:|---:|---:|
| VII | 7 | 7 | **8** | 11 |
| IX | 2 | 2 | **3** | 10 |
| X | **0** | **0** | **1** | 11 |
| **Gesamt** | **9/32** | **9/32** | **12/32** | 32 |

Expertenliga, jeweils 24 Duelle: Offensiv **12/24 (50,0 %)**; Guardian/Soul-Support **11/24 (45,8 %)**; Fusion/Ökonomie **16/24 (66,7 %)**. Der Boss-X-Fehlschlag ist weiterhin nicht gelöst. Der Champion ist unter diesen Boss-Tests stärker. Kleine Stichproben und neue Seeds sollten nicht als direkte Vergleiche mit vergangenen v14.x-Läufen interpretiert werden.

## 6. Historische Prüfberichte und Lerncharakter

Originalberichte v14.2–v14.7 wurden mit Schemacheck aus dem GitHub-Actions-Archiv geladen; der v14.8-Originalbericht mit seinen **0 Taktikbewertungen** wurde zusätzlich als Gegenprobe verifiziert. Die historische Datenreihe informiert über Schwerpunktsetzung und Probleme, aber die KI trainiert hier **keine neu gewichteten neuronalen Parameter** und lernt **nicht autonom jeden Fehlzug aus den Berichten**. Das Ergebnis ist Auswahl von wenigen neuen festen Bewertungsprofilen im aktuellen Szenario-Pool. Die ursprünglichen 15 Champion-Gewichte und die produktive KI wurden nicht überschrieben.

## 7. Urteil und Roadmap v14.8.2

**Promotion `false`, `productionIntegrated:false`.** Das ursprüngliche Aktivierungsproblem ist behoben; damit kann jetzt erstmals auf tatsächlicher Kampf- und Positionslogik aufgebaut werden. Ein stärkerer KI-Champion wurde nicht gefunden.

**Die nächsten sechs Entwicklungsschritte:**

1. **Richtige Baseline:** Bei jeder echten Kandidatenentscheidung zusätzlich den originalen v14.7-Controller auf **derselben unveränderten Boardkopie** ausführen. Aktionen inklusive Monster-UID, Ziel und Slot vergleichen, nicht bloß zwei Scores derselben neuen Vorschlagsmenge.
2. **Mehr als ein guter Aktionsvorschlag:** Zustände sammeln, in denen mindestens zwei legal unterschiedliche Aktionen wirklich plausible Werte haben; `end`, `advance-phase` und Monsterverschiebung vollständig und phasentreu mitbewerten. Einsatz von Soul/Guardian-Heilung in speziell vorbereiteten legalen Mechaniklektionen durch verbindliche Assertions belegen.
3. **Szenario-basierte Gegenproben:** Echte divergierende Aktionspaare mit wiederholten, voneinander unabhängigen RNG-Seeds, Gegnerantworten und vollständiger Wertänderung nach zwei Zügen vergleichen. So lernen wir, ob der größere Kurzzeitscore wirklich besser spielt.
4. **Bewertung nicht nur knapp umparametrisieren:** Score-Gleichstände, hohe Wertabstände und wirkungslose Zusatzkomponenten analysieren. Für Predator, Guardian/Soul und Fusion jeweils echte taktische Entscheidungssituationen bauen. Den Score-Teil `counter` und DEF-Support nicht bloß als gewichtete Bonussumme interpretieren.
5. **Persistente Replays mit überprüfbaren Zuständen:** `seed + Rule Commit + Board + own hand + legal options + old/new scores + exact actions + actual immediate/next-turn outcomes` archivieren; erst danach aus bewiesenen Fehlentscheidungen konkrete Regeln lernen. Alte Holdout-Beispiele nicht zum Optimieren verwenden.
6. **Hartes CI-Gate:** Neben `attacks>0`, `positions>0`, `evaluations>0` auch ausdrücklich dokumentierte Vergleichsaktionen und ausreichende echte Änderungshäufigkeit auf dem Training verlangen, bevor ein mehrstündiger Hauptlauf beginnt. Promotion ausschließlich nach frischem unabhängigen Holdout und Boss-Prüfung.

**Schlussurteil:** v14.8.1 ist ein **technisch valider Trainingslauf mit echter taktischer Evaluation**, aber eine **strategische Stagnation**. Ohne echte unterschiedliche und mehrfach untersuchte Aktionen bleibt mehr Kampf-Simulation allein wenig aussagekräftig.
