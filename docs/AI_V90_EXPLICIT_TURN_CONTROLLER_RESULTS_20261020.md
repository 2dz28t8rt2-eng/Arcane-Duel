# Arcane Duel — KI-Training v9.0: Explizite Zugphasen und rechtmäßige Soul-/Guardian-Aktionen

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Experiment:** [GitHub Actions #39365570969 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39365570969) · **Initiale Tests:** [Workflow-Commit b0f0a67](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/b0f0a67cc118ba5476a667d6803de81651271a8b).

**Artefakt:** `arcane-explicit-turn-v90` (ID `12238959017`, bis 19.11.2026) mit `ai-earned-preiv-v90.json` und `ai-defender-coverage-v90.json`.

**Produktionsstatus:** Das Training verwendet nur neue Offline-Dateien in `tests/` und `.github/workflows/`. Die aktive Live-KI, die Gegner, `assets/game.js`, Kartenwerte, Fortschritt, Loot und `main` wurden **nicht** geändert.

## Datenqualität und Regeln

- 32 **neue, unabhängige** Karriere-Startseeds mit Offset **32000**, die nicht in v8.8 (24000) oder v8.9 (28000) verwendet wurden.
- **1.525 reguläre, tatsächlich gespielte und belohnte Karriere-Duelle** für Inventarerwerb, 32 vollständige rechtmäßig erspielte IV-Ausgangsprofile, **14/32** haben IV im vorgelagerten Karriereablauf innerhalb des Limits gewonnen.
- Strikte Trennung 16 Trainingsursprünge / 16 zunächst unberührte Holdout-Ursprünge. Pro Profil 2 kontrollierte Kampfseeds × 2 Startpositionen × **7** Strategien = **896** tatsächliche simulierte Game-Engine-Duelle, davon 64 Duelle pro Strategie je Kohorte. Die unabhängige Einheit ist die ursprüngliche Karriere, **nicht** der einzelne wiederholte Kampf.
- Alle Kandidaten bedienen die realen `chooseAiAction`-/`applyAiAction`-Schnittstellen, `attackPlan`, `switchPosition` sowie vorhandene rechtmäßige `arcane-soul-extract`-/`arcane-guardian-heal`-Aktionen. Es werden **keine** Zusatzkarten, versteckte gegnerische Informationen, künstliche Siege, freie Lootauszahlungen oder Extra-Züge vergeben.
- Die explizite Phasenfolge wird nur innerhalb der **spielerbezogenen Match-Testpolicy** aktiviert und ist keine Änderung am Live-Gegner-Verhalten. Die reale Engine validiert alle ausgeführten Aktionen.

## v9.0 Ergebnisse – Training, Gegner IV

| Policy | Siege / 64 | Mittlere LP-Differenz des Spielers | Echte Support-Aktionen | Explizite Phasewechsel | Geplante explizite Angriffe |
|---|---:|---:|---:|---:|---:|
| Baseline | **5** | −5.156,2 | 0 | 0 | 0 |
| `explicit-phases` | 5 | −5.156,2 | 0 | 407 | 74 |
| `explicit-support` | 5 | **−5.134,3** | **10** | 408 | 76 |
| `explicit-safe` | 5 | −5.150,7 | 6 | 407 | 76 |
| `explicit-defense` | 4 | −5.196,0 | 10 | 413 | 62 |
| `role-explicit-support` | 5 | −5.183,2 | 1 | 406 | 81 |
| `role-explicit-defense` | 4 | −5.244,9 | 1 | 411 | 67 |

Die reine explizite Phasentrennung erzielte gegenüber der Baseline **identische** Siege und mittlere LP-Differenz. Das ist ein wertvoller *Kontrollbefund*: Sie kann die realen Aktionen sichtbar machen, ohne den Duellverlauf unbeabsichtigt zu verstärken.

Der Kandidat `explicit-support` wurde nur anhand der Trainingshälfte ausgewählt: gleiche 5/64 Siege, aber eine um **21,9** höhere durchschnittliche LP-Differenz. Der konservative Support-Filter aktivierte 6 statt 10 Fähigkeiten, ohne zusätzliche Siege.

## Unabhängiger Holdout – 16 andere Profile, 64 Duelle je Policy

| Policy | Siege / 64 | Mittlere LP-Differenz des Spielers | Tatsächlich ausgeführter Support | Defensive Wechsel |
|---|---:|---:|---:|---:|
| Baseline | **3** | −5.337,0 | 0 | 0 |
| `explicit-phases` | 3 | −5.337,0 | 0 | 0 |
| `explicit-support` | **3** | −5.339,2 | **2** | 0 |
| `explicit-safe` | 3 | −5.339,2 | 1 | 0 |
| `explicit-defense` | 3 | −5.259,5 | 2 | 132 |
| `role-explicit-support` | 2 | −5.456,3 | 3 | 0 |
| `role-explicit-defense` | 2 | −5.367,5 | 3 | 138 |

**Paired holdout gegen Baseline:**
- `explicit-phases`: keine Ursprünge besser oder schlechter, **0 Siege Delta, 0 LP**.
- `explicit-support`: **0 zusätzliche Siege**, **−2,3 LP** durchschnittlich, obwohl 2 Supportaktionen legal ausgeführt wurden.
- `explicit-defense`: **0 zusätzliche Siege**, **+77,5 LP** im Mittel, aber kein verlässlicher Karrieregewinn.
- `role-explicit-support`: **−1 Sieg** und **−119,3 LP**. `role-explicit-defense`: ebenfalls **−1 Sieg**, trotz vieler Positionswechsel.

Der trainingselektierte `explicit-support` ist im vorab unabhängigen Holdout nicht überlegen. **`qualified=false`: ausdrücklich kein produktiver Rollout.**

## Diagnostische Schlussfolgerungen

1. **Die Phasenlücke ist technisch behoben – als isolierter Test.** Das Aufteilen von `positions` und `attacks` legt der Policy die rechtmäßigen Unterstützungsoptionen offen. Im `explicit-support`-Arm wurden **12 echte Fähigkeiten** ausgeführt (10 Trainingshälfte, 2 Holdout) statt null bei der Baseline. Die reine Phasentrennung hat den Duellverlauf nicht verändert.
2. **Support-Abdeckung bleibt der begrenzende Faktor.** Obwohl die 40er-Decks Soul/Guardian-Karten enthalten, entstehen nur wenige aktionsbereite Situationen, und wenige Supportaktionen ändern den Ausgang gegen IV.
3. **Defense ohne situativen Nutzen ist riskant.** `explicit-defense` erzielte im Holdout durch Positionen einen etwas besseren LP-Stand, aber keine weiteren Siege; rollenbetonte Varianten verloren einen. Die Entscheidungsregel „Wächter bevorzugt DEF“ reicht nicht.
4. **Nächste Priorität:** Nicht weitere Phasentrennung an sich, sondern mehr **lohnende** Entscheidungen an bekannten Phasengrenzen: sichere Angriffsreihenfolge, Stärke des Gegners, Wert der eigenen verbleibenden ATK-Slots, geplanter Seelenentzug vs. direkter Angriff sowie Schutz wichtiger Fusionen/ACE. Zug- und Aktionstelemetrie muss LP-/Board-Delta direkt je gewählter Alternative erfassen.
5. **Bestätigung durch echte vollständige Karriere-A/B nötig**. Ein Verbessern der LP-Bilanz in gezielten IV-Duellen belegt noch keine bessere Progression; bei positivem Signal müssen IV/VI auf frisch erwirtschafteten, komplett durchgespielten Karrieren steigen.
6. **Keine Änderung an `main` oder Live-KI**, solange unabhängige Vorteile fehlen.

## Qualitätssicherung / Grenzen

- v9.0 Training GitHub Actions: **SUCCESS**, Legalitäts-, Rollen-, Fusion-, Save- und Wirtschaftstests **56/56 bestanden**, ergänzende KI-Regressionsprüfungen **20/20 bestanden**.
- Allgemeiner Code-/Strategie-Workflow [#39365570727 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39365570727). Separater Browser-Smoke [#39365570876 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39365570876) ebenfalls vollständig bestanden.
- Bei identischen Startseeds können von Policy-Abweichungen verursachte unterschiedliche RNG-Verbräuche spätere Kämpfe beeinflussen.
- Das ist ein **Offline-Vergleich geskripteter Spieler-KI** gegen bestehende Turniergegner; es ist weder selbstlernende NPC-KI noch ein trainiertes neuronales Modell. Die Stichprobe umfasst pro Kohorte nur **16 statistisch unabhängige Inventarursprünge**, weshalb selbst +1 Siege nicht für eine robuste Freigabe reichen.

**Status:** v9.0-Testlauf und Begleit-QA absolviert, technisch machbarer Phasencontroller bestätigt, keine reproduzierte IV-Siegverbesserung; nur offline auf `development` verfügbar.
