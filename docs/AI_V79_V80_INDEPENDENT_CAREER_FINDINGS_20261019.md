# Arcane Duel – Folgetraining v7.9 / v8.0: unabhängige Karrieren und Splitter-Timing

**Stand:** 19.10.2026 · Branch: `development` · **nur Trainingsskripte und Dokumentation**, keine Änderung an aktiver Gegner-KI, Kartenwerten, Splitterpreisen oder `main`.

## Ausgangspunkt: tatsächliche Behebung der v7.8-Fehler

- Fehlgeschlagener ursprünglicher [v7.8-Lauf 39285652755](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39285652755): Scheitern im Qualitätstest, daher keine damals ausgeführte KI-Simulation.
- Korrigierter [v7.8-Lauf 39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588): **Erfolg**, 58/58 vorgeschaltete Tests, 1.280 Duelle. Quellenvalidierung für Forschungs-Karten aus Stufe 0 vereinheitlicht, tatsächliche ACE-Booster-Überschreibung um Kartenspürsinn ergänzt, alte Testannahmen an die absichtlich geänderten Skill-/Crafting-Regeln angepasst.
- Allgemeine [Code-/Strategieprüfungen](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39294394683) und [Smoke-Tests](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39294394622): beide **erfolgreich** auf dem geprüften Branchstand.

### v7.8 als Ausgangswert

Die **Hybrid**-Wirtschaftsstrategie aus legal bezahltem Crafting, Forschung und bereits gekauftem Booster-Neuwurf erhöhte in einem unabhängigen VIII-Holdout die Siege geskripteter Spieler **von 0/120 auf 20/120** (gegen den bisherigen VIII-Boss), bei einem reduzierten durchschnittlichen Boss-LP-Vorsprung von 6.247 auf 4.417. **Nur zwei unabhängige Karriereursprünge** lagen den fünf tatsächlich freigeschalteten VIII-Profilen zugrunde. Die experimentelle Fusion-Precision-VIII-KI gewann in 117/120 dieser Duelle; deshalb nicht aktivieren.

## v7.9 – 12 wirklich voneinander unabhängig startende Karrieren

[GitHub-Actions-Ergebnis: SUCCESS 39296549100](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39296549100)

**Testquelle:** `tests/ai-independent-shard-careers-v79.cjs`. Je **12 unterschiedliche Karriere-Startseeds** werden in **zwei gepaarten Varianten** bis zum tatsächlichen Fortschrittsende durchgespielt (24 vollständige Versuche), mit normalen Kämpfen und `rewardMatch`, echten Münzen/Splittern und Inventarprüfungen. Die beiden Varianten sind **vor dem Eingriff identisch**, ab Sieg über IV darf die neue `shard-hybrid`-Variante weitere kostenpflichtige Crafting-/Rollenforschungs-/Booster-Neuwurfentscheidungen treffen, die Baseline bleibt beim bisherigen Soul-Bridge-Deckbau.

| Erreichter Fortschritt | Bisheriger Soul-Bridge-Deckbau | Splitter-Hybrid nach IV |
|---|---:|---:|
| unabhängige Herkunftsseeds | 12 | 12 |
| mittlere tatsächlich gewonnene Turnierstufe | 3,92 | **4,08** |
| Anzahl Karrieren mit Sieg über VI | 0 | **2** |
| Anzahl Karrieren mit Sieg über VII / Freischaltung VIII | 0 | 0 |
| zusätzliche, legitim ausgegebene Splitter | 0 | 465 |
| tatsächlich bezahlte Zusatz-Craftings | 0 | 24 |
| bezahlte Forschungsaktionen | 0 | 6 |
| echte Booster-Neuwürfe | 0 | 21 |

**6/12 Ursprungskarrieren scheitern spätestens beim Turniergegner IV**, bevor das zusätzliche Splitterbudget in der Hybridvariante erstmals investiert werden darf. Es handelt sich bei den Zählungen nicht um unabhängige Siege pro Kampf, sondern zwölf voneinander unabhängig gestartete Karriereverläufe.

Interpretation: Splitter-Hybrid kann helfen (+1 Turnierstufe bei zwei Karrieren), behebt aber die frühe IV-Hürde allein noch nicht.

## v8.0 – Splitterzeitpunkt nach Sieg über II versus nach Sieg über IV

[GitHub-Actions-Ergebnis: SUCCESS 39296938808](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39296938808)

**Testquelle:** `tests/ai-early-shard-careers-v80.cjs`. Wieder zwölf verschiedene Startseeds, zwei gepaarte vollständige Karriereverläufe je Seed. Diesmal haben **beide Varianten denselben Soul-Bridge-Deckbau**, unterscheiden sich aber darin, ob echtes Splitter-Crafting, Forschung und Tausch **ab gewonnenem II** oder **erst ab gewonnenem IV** erfolgen. Alle früheren Spielstände müssen vor dem ersten Eingriff identisch sein (CI bestätigt). Keine Schenkungen und kein Bypass von Kartenquellen.

| Erreichter Fortschritt | Erst nach IV investieren | Schon nach II investieren |
|---|---:|---:|
| unabhängige Herkunftsseeds | 12 | 12 |
| mittlere gewonnene Turnierstufe | **4,08** | 3,75 |
| tatsächlich bezahlte Splitter | 465 | **1.521** |
| zusätzlich gekaufte Normalmonster | 24 | **97** |
| Forschungen | 6 | **11** |
| Booster-Neuwürfe | 21 | **55** |
| VIII freigeschaltet | 0 | 0 |

**Gegenbefund:** Früh investieren ist nicht automatisch strategisch besser. In drei der zwölf Paare stieg die zuletzt gewonnene Stufe um zwei, in vier Paaren sank sie um zwei oder drei; die übrigen Karrieren erreichten dieselbe Stufe. Der frühe Verbrauch brachte also einige starke Einzelverläufe, verschlechterte aber den mittleren Fortschritt. Die verschiedenen Folgepartien laufen nach dem Eingriff mit veränderter Sammlung und damit teilweise unterschiedlicher RNG-Nutzung; beobachtete Stufenunterschiede sind kontrollierte Simulationseffekte, **kein** Beweis für eine menschliche Spieler-Gewinnwahrscheinlichkeit.

## Empfehlung: Nächster echter Trainingsgegenstand

**v8.1: ressourcensparender, rollenpassender Spieler-Deckbuilder** statt nur der Option „ab Turnierstufe X ausgeben“.

1. **Bewertung vor Kauf:** Für jede zulässige Karte prognostizieren, ob sie eine schwache der tatsächlich 40 ausgerüsteten Karten ersetzt, passende Rollen-/Fusionsmaterialien ergänzt oder nur eine weitere unnötige Kopie darstellt.
2. **Budget-Caps:** Pro Turnierstufe begrenzte Käufe, Mindestreserven und Nachkauf nur nach echtem Deckgewinn. Gleiche Startseeds, keine Gratisressourcen.
3. **Gezielte Forschung erst bei Nutzen:** Eine Rollenforschung darf nur starten, wenn mindestens drei wirklich legale Optionen verfügbar sind und die Strategie sie gegenüber direktem Crafting rechtfertigt.
4. **Zuerst die IV-Hürde** auf echten Karriere-Spielständen prüfen, erst dann VIII–X. Die v7.8-Hybridstrategie wird nicht automatisch zur allgemeinen Empfehlung, weil sie auf spätere schon freigeschaltete VIII-Spielstände konditioniert war.
5. **QA:** Keine neuen Gegner-KI-Gewichte, Skill-/Kartenwertänderungen oder Änderungen an `main`, bis die unabhängigen Karrieren und die weiterführende Gameplay-Regression dafür sprechen.

**Lernstand dauerhaft festhalten:** Beide Folgeexperiment-Skripte, CI-Workflows und die JSON-Ergebnisse werden im GitHub-Repository beziehungsweise als 30-Tage-CI-Artefakte aufbewahrt. `main` blieb unverändert.
