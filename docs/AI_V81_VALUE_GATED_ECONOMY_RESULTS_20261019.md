# Arcane Duel – KI-Trainingsbericht v8.1: wertorientierte Splitterkäufe

**Datum:** 19.10.2026 · **GitHub:** [erfolgreiche Action 39303077605](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39303077605) · Branch `development`. **Trainings-Experiment, kein Live-KI-Rollout und kein Merge auf `main`.**

## Anlass und Ausgangsbefund

Der ursprüngliche [fehlgeschlagene v7.8-Test 39285652755](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39285652755) wurde repariert und durch einen [erfolgreichen v7.8-Lauf 39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588) ersetzt. In v7.8 konnten legal verdiente Splitter einen teilweise drastischen Sprung der Deckqualität ermöglichen (20 statt 0 Spielersiege in 120 VIII-Holdout-Duellen; allerdings nur zwei unabhängige Karriereursprünge). Daraufhin zeigten v7.9 und v8.0 anhand zwölf unabhängig gestarteter Karrieren, dass weder spätes pauschales Kaufen noch frühes massenhaftes Kaufen zuverlässig genug über den frühen IV-Engpass hilft.

Daher testet v8.1 die Hypothese: **Vor jedem Kauf echte Einsetzbarkeit in das besessene 40-Karten-Deck bewerten und genügend Ressourcen für spätere Turnierstufen zurücklegen.**

## v8.1: tatsächlich ausgeführtes Experiment

**Testskript:** `tests/ai-deck-value-shards-v81.cjs` · **Workflow:** `.github/workflows/ai-deck-value-shards-v81.yml` · **Ergebnisdatei:** `artifacts/ai-deck-value-gated-shards-v81.json` (Github-Actions-Artefakt; 30 Tage Aufbewahrung).

- Zwölf voneinander unabhängige Karriere-Startseeds; je zwei mit gleichem Ursprungsseed gestartete vollständige Versuchskarrieren; identische Spielstände bis zur ersten möglichen Splitterinvestition (24 komplette Versuche).
- **Kontrolle:** bekannte `late-shard`-Strategie aus v8.0, investiert erst nach Sieg über IV.
- **Kandidat:** `selective-shard`, darf schon nach Sieg über II einkaufen, aber nur, wenn eine real erreichbare Karte in der vorausberechneten 40er-Deckaufstellung landen und den gewichteten ATK/DEF-/Level-/Rollennutzen erhöhen würde. Dazu kleinere Limits pro Turnierstufe, 20–30 Splitter Reserve, Forschung nur ab IV mit mehreren potenziell nützlichen Angeboten; keine routinemäßigen Booster-Neuwürfe.
- Sämtliche Käufe über echte `craftCard`/`beginShardResearch`/`takeShardResearchCard`-Aktionen mit dem vorhandenen Profilkonto; **keine** geschenkten Karten/Splitter/Turniersiege, keine pauschale Erhöhung der Dropchancen oder NPC-Werte.
- Vor dem neuen Test grünes Splitter-/Perk-/Inventar-QA-Gate; GitHub-Workflow wurde nach einem initialen YAML-Formatfehler korrekt neu gestartet und **erfolgreich** beendet.

## Ergebnis

| Zwölf unabhängige Startkarrieren je Arm | `late-shard` | `selective-shard` |
|---|---:|---:|
| Durchschnittlich gewonnene Turnierstufe | **4,08** | 3,67 |
| Karrieren mit Sieg über VII (VIII erreichbar) | 0 | 0 |
| Splitter tatsächlich bezahlt | 465 | 204 |
| Normalkarten durch Splitter-Crafting erworben | 24 | 16 |
| Gezielte Rollenforschungen | 6 | 1 |
| Booster-Neuwürfe | 21 | 0 |

**Unabhängiger zweiter Halb-Stichprobenabschnitt (je sechs Startseeds):** durchschnittlich gewonnene Turnierstufe **3,67** (Kontrolle) gegenüber **3,17** (selektive Käufe). Kein Hinweis auf robuste Überlegenheit des Kandidaten.

**Paaranalyse:** In drei Ursprungskarrieren schlechteres Turnierergebnis mit selektiven Käufen (−1, −1, −3 Turnierstufen), neun gleichauf, null besser. Das ist keine Aussage über menschliche Spielstärke, sondern ein Test des scripted Piloten. Die Karriereteilnehmer haben nach dem ersten Unterschied im Inventar abweichende weitere RNG-Verläufe; isolierter Effekt einer einzigen Karte ist deshalb aus dieser Studie nicht eindeutig ableitbar.

## Interpretation

Der getestete **Ausgaben-Stopp anhand von 40er-Deck-Nutzen, strenger Mindestrechnung und Splitterreserve** war zu konservativ, um den komplexen Karriereverlauf zuverlässiger zu unterstützen. Das Experiment verändert **mehrere** Schalter gleichzeitig (Kaufentscheidung, Kaufmenge, Forschungsbereitschaft, Neuwurf-Verzicht). Daher ist nicht belegt, welcher einzelne Schalter für die schwächere Leistung verantwortlich ist.

Die v7.8-Messung bleibt gültig: Auf bereits erspielten, eigentlich verfügbaren VIII-Profilen können bezahlte Level-7–9-Karten die Spielersiege deutlich verbessern. Vor VIII scheitern viele **unabhängige** frühe Karrieren jedoch am IV-Engpass; die reine Einkaufsmenge löst das nicht.

## Verbindlicher nächster Forschungsplan v8.2

1. **Einzelne Stellschrauben isolieren**: gleiche Kaufstrategie mit/ohne Splitterreserve, mit/ohne 5-Splitter-Neuwurf, unterschiedliche Level-/Fusions-Deckscore-Schwellen als getrennte Trainingsarme. Nicht mehrere Änderungen als ein Paket und das Ergebnis einer Einzelursache zuschreiben.
2. **Deckbau statt nur Einzelkarte**: testen, ob tatsächlich vorhandene stärkere Karten in den 40 Hauptslots landen und ob Fusionen für diese Rollen im Fusionsdeck verfügbar sind. Für den Gegner IV nicht nur höchsten ATK-Wert, sondern real spielbare drei-Feld-/Fusionstaktik prüfen.
3. **Karriere-Stopper IV gezielt diagnostizieren**: Verlustgrund, Kartenanzahl und Stufen, Karten auf Hand/Feld, Einhaltung der Rollenstrategie, Quest-/XP-Belohnungen und Ressourcen unmittelbar vor dem gescheiterten Turniermatch protokollieren; Kaufvorschläge aufgrund des fehlenden Decktyps und nicht aufgrund von Rohstärke ableiten.
4. Mindestens zwölf unabhängige Startseeds, echte `rewardMatch`-Progression, strikt getrennte Trainings- und Holdout-Gruppe. Nur deutlich bestätigte Verbesserungen in der unabhängigen zweiten Hälfte der Karrieren als Kandidaten für eine spätere Spielerpolicy verwenden.

**Nicht verändern:** live verwendete Boss-KI v5.7, experimentelles VIII-Fusion-Precision-Profil weiterhin aus, ACE-Fokus, Kartenwerte, Preise und `main`. 
