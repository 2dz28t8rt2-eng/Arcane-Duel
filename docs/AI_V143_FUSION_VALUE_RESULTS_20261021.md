# Arcane Duel – KI-Prüfbericht v14.3: Ertrag vollständiger Fusionen

**Datum:** 21. Oktober 2026 · **Branch:** `development` · **Status:** GitHub Actions `SUCCESS` · **Keine Modellpromotion, keine produktive KI-Änderung**

- [Ausgeführter Trainingslauf #39650698039](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039)
- [Original-Artefakt mit report.json, placement-examples.json und candidate.json](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039/artifacts/12370645783)
- Umsetzung: `tests/ai-fusion-value-planner-v143.cjs`, Workflow `.github/workflows/ai-fusion-value-planner-v143.yml`.
- Geschützter Champion: `models/ai-selfplay-v136.json` (1.920 frühere Trainingspartien, 15 unveränderte Gewichte).

## Ziel und tatsächlich implementierte Mechanik

Der v14.2-Planer wich in nur **11 von 537** geprüften Situationen von der Baseline ab (2,05 %) und bevorzugte bei zehn davon normale Beschwörung statt Fusion. Zudem ergab die unmittelbare Feldwert-Messung für normale Beschwörungen oft 0 und für Fusionen eine negative Konstante. Die Ursache war zunächst nur vermutet; v14.3 prüft den vollständigen Engine-Zustand nach einer Platzierung.

Die neue Versuchsfunktion `resolvedBranch143` kopiert den Duellzustand und führt über den **echten Game-Resolver** die gewählte normale Beschwörung bzw. Handfusion aus. Entsteht `pending`, simuliert sie mögliche `place`-Aktionen mit der realen Engine, verwirft abgewiesene/unvollständige Auflösungen und bewertet **erst das vollständig platzierte Monster**. Bei belegten Plätzen darf die Engine legale Feldfusionen auflösen. Monster und Fusionsergebnisse werden nicht erfunden.

Der KI-Bewertungswert berücksichtigt:
- Tatsächliche ATK/DEF-Werte einschließlich des real erwürfelten Fusionsergebnisses.
- Verbliebene **eigene** Handmonster und deren alternative Nutzbarkeit; Zusatzmaterial ist nicht kostenlos.
- Verbrauch der verbleibenden Fusionskopien.
- Rolle (Predator/Guardian/Soul/Resonator) und Guardian-Soul-Nachbarschaft.
- Grob geschätzten Zerfall von ATK/DEF über zwei **eigene** Runden.
- Sichtbares gegnerisches Feld, Lebenspunkte und gegnerische ACE-Karten **nur auf dem Feld**.

**Grenze:** Diese Heuristik stellt kein vollständiges Modell zukünftiger gegnerischer Runden, geheimer Handkarten oder aller Poker-/Resonanz-Ketten dar. Die drei Gewichtungen wurden auf einem neuen Trainingssatz verglichen – dies ist eine regelbasierte Parameterabstimmung, **kein vollumfängliches autonomes Lernen aller Fusionsregeln**.

## 1. Technischer Test

Der Workflow [#39650698039](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39650698039) war im **ersten Versuch vollständig erfolgreich**. Sämtliche Schritte waren grün; **42/42 Regressionstests bestanden, 0 fehlgeschlagen**. Pilot und große Testrunde erfolgreich, Originalbericht und experimentelles Kandidatenmodell hochgeladen.

### Training – 42 Szenarien, je zwei Sitze

| Fusionsertragsgewichtung | Siege | Abweichende Planeraktionen | Vollständig aufgelöste Platzierungen | Bewerte Fusionskandidaten |
|---|---:|---:|---:|---:|
| `fusion-aware-balanced` (1,05) | 47/84 (56,0 %) | 173 | 1.000 | 496 |
| `fusion-aware-tactical` (1,65) | 48/84 (57,1 %) | 191 | 1.002 | 498 |
| **`fusion-aware-strong` (2,35)** | **50/84 (59,5 %)** | **200** | **1.002** | **498** |

Nur anhand der Trainingspartien wurde **`fusion-aware-strong`** für die abschließende unabhängige Prüfung ausgewählt. Die Daten der unabhängigen Tests flossen nicht in diese Auswahl ein.

## 2. Unabhängiger Test – 54 neue Szenarien, Sitzwechsel

| Kennzahl | Ergebnis |
|---|---:|
| Planervergleiche (mit Baseline) | **324** |
| Tatsächlich unterschiedliche Aktionen | **241 von 324 = 74,4 %** |
| Bewertete Fusionskandidaten | **620** |
| Bewerte normale Beschwörungskandidaten | **648** |
| Vollständig aufgelöste Vorbereitungen und Platzierungen | **1.268** |
| Vom Planer empfohlene Fusionen im gemessenen Teil | **43** |
| Nicht vollständig auflösbare Simulationszweige | **0** |
| Kandidat gegen Champion (Mirror-Holdout) | **59/108 = 54,6 %** |

Vergleich zu v14.2: Dort war der alte Planer in den **eigenen Trainingsszenarien** nur bei 2,05 % der Aktionsempfehlungen anders; hier sind es im neuen **Holdout** 74,4 %. Die Tests verwenden unterschiedliche Decks/Seeds, daher ist das **kein direkt gepaarter Wirksamkeitsbeweis** der Quote. Der neue Planer verwendet allerdings sichtbar mehr eigenständige Entscheidungen.

### Ergebnisse nach Spielstufe und Deckstil

| Stufe | Siege in 36 gespiegelten Duellen |
|---|---:|
| VII (Tier 7) | **21/36** |
| IX (Tier 9) | **22/36** |
| X (Tier 10) | **16/36** |

| Spielstil (Mirror-Holdout) | Siege |
|---|---:|
| Predator | **14/18** |
| Guardian | **11/18** |
| Fusion | **10/18** |
| Soul | **6/18** |
| Allrounder | **6/12** |
| Tempo | **5/12** |
| Hybrid | **7/12** |

Die geringe Leistung mit Soul-Decks und bei Tier 10 verdient besondere Aufmerksamkeit; die Stichproben pro Deckstil sind jedoch klein.

### Gegen späte Turniergegner

| Gegner | Neuer Kandidat | Bisheriger Champion | Spiele je KI |
|---|---:|---:|---:|
| VII | **6** | 5 | 9 |
| IX | **3** | 0 | 9 |
| X | **0** | 0 | 9 |
| **Gesamt** | **9/27** | **5/27** | **27** |

Das Ergebnis gegen IX ist erfreulich, aber bei nur neun Spielen je Variante kein Beweis allgemeiner Überlegenheit. Gegner X bleibt ungelöst.

### Strategie-Spezialisten

| Gegnerstrategie | Siege des neuen Kandidaten |
|---|---:|
| Offensive | **10/24 = 41,7 %** |
| DEF/Support | **12/24 = 50,0 %** |
| Fusion/Ökonomie | **16/24 = 66,7 %** |

**Promotion:** `false`. Der Mirror-Holdout verfehlte die Schwelle **56 %**, und das Ergebnis gegen Offensiv-Spezialisten liegt unter dem Mindestwert **45 %**. Ein vorschneller Produktions-Rollout wäre nicht gerechtfertigt.

## 3. Erkenntnisse

**Positiv:** Das unmittelbare Nutzenmodell bildet erstmals real aufgelöste Handfusionen samt neuer Monsterwerte und Materialkosten ab. Die Planerempfehlungen unterscheiden sich deutlich häufiger von der Baseline; die unabhängigen Ergebnisse sind gegenüber dem alten Champion in Mirror-Matches leicht und bei den späten Bossen stellenweise besser.

**Offen:** Das Modell ist insbesondere gegen offensive Spezialisierungen, Soul-Decks und Gegner X zu schwach. Außerdem prüft der Planer jeweils nur den nächsten eigenen Handlungs-/Platzierungsabschluss und kein robustes mehrzügiges Duell samt zufälligen gegnerischen Reaktionen. Die aktuellen Vergleichszahlen sind noch statistisch unsicher.

## 4. Empfehlung für v14.4

1. **Fusionserfolg über die erste Aktion hinaus:** Nach real platzierter Fusion einen legalen Angriff bzw. eine unterstützende Wächter-/Seelenzehrer-Aktion einbeziehen, sofern sie regelkonform im selben Zug möglich ist.
2. **Konter gegen Predator/Tempo:** Verlust wertvoller Materialien, drohende gegnerische ATK, freie Angriffsfenster und schwache Feldverteidigung explizit bestrafen.
3. **Soul-/Guardian-Lektionen:** Soul Drain, Guardian-Heilung, DEF-Überladung und Fusionserbe nach echten Engine-Zuständen gezielt schulen.
4. **Boss X als unabhängigen Stress-Test** verstärken, aber den Trainingsplan nicht ausschließlich auf diesen Gegner ausrichten.
5. **Regelstrenge und Championgate beibehalten:** getrennte Trainings-/Holdout-Decks, unterschiedliche Seeds und Sitzwechsel, Verbot gegnerischer verdeckter Informationen. Nur nach reproduzierbarer Verbesserung Integration in NPC-KI erwägen.

**Gesamturteil:** v14.3 ist ein echter technischer und diagnostischer Schritt im Verständnis des Fusionsnutzens; eine **breite, abgesicherte Steigerung der Spielstärke ist noch nicht bewiesen**. Produktiver Gegner, Spielerinventar und `main` blieben unverändert.
