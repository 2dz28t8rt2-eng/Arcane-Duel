# Arcane Duel – Baseline-Audit (15. Oktober 2026)

**Branch:** `development`. Keine Gameplay-Balancing-Änderungen durch diesen Test.
**Gegenstand:** Reale ausführbare Engine aus `game.js`, `expansion.js`, `evolution.js` und `learning.js`.
**Testmodus:** vollständig isoliertes Fenster-/DOM-/Speicher-Dummyprofil, kein Browser-Speicher und keine echten Nutzer-Spieldaten.

## 1. Umfang

- 1.600 vollständige PvE-Duelle: Turniergegner I–X, jeweils vier **synthetische** 40-Karten-Deckvarianten und 40 deterministische Seeds je Variante.
- 360 zusätzliche Startdeck-Duelle: 120 gegen Training, 120 gegen Turniergegner I, 120 gegen Turniergegner II.
- Zusammen **1.960 abgeschlossene Duelle, 0 Laufzeitfehler**.
- Kartenpool bei der isolierten Ausführung: 396 Gesamt-Karteneinträge, 90 Hauptdeck-geeignete Basiskarten, 38 Fusionsvorlagen.
- Die Stufen-Decks wurden nach Kartenquelle gefiltert und nach ATK, DEF, kombinierter Stärke oder niedriger Stufe zusammengestellt. Diese Quellfilter bilden **keinen vollständigen realen Erwerbs- und Ressourcenpfad** ab.
- Automatische KI spielte alle Strategien und fusionierte auch in DEF- und Normalmonster-Decks; daher sind die Winrates **keine vergleichbaren Messungen echter Spezialisierungen oder menschlicher Spieler**.

## 2. Gemessene Winrates der synthetischen Decks

| Turnierstufe | ATK-Deck | DEF-Deck | Ausgewogen | Niedrigstufig |
|---|---:|---:|---:|---:|
| I | 90 % | 100 % | 97,5 % | 100 % |
| II | 92,5 % | 100 % | 100 % | 55 % |
| III | 100 % | 100 % | 100 % | 42,5 % |
| IV | 97,5 % | 97,5 % | 95 % | 5 % |
| V | 95 % | 95 % | 97,5 % | 2,5 % |
| VI | 100 % | 100 % | 100 % | 7,5 % |
| VII | 92,5 % | 97,5 % | 95 % | 2,5 % |
| VIII | 100 % | 100 % | 100 % | 2,5 % |
| IX | 90 % | 87,5 % | 95 % | 5 % |
| X | 95 % | 87,5 % | 95 % | 2,5 % |
| **Durchschnitt (400 pro Deck)** | **95,3 %** | **96,5 %** | **97,5 %** | **22,5 %** |

**Interpretation:** Der niedrigrangige KI-/Deckansatz bricht über die Progression stark ein. Die anderen Ansätze sind unter den verwendeten synthetischen Bedingungen zu stark, um damit die reale Kampfschwierigkeit zu kalibrieren. Da auch das DEF-Deck offensiv fusioniert, lässt sich aus seinen Siegen **nicht** auf einen tragfähigen DEF-Siegplan schließen.

## 3. Unverändertes Startdeck

| Gegner | Siege mit Startdeck (120 Seeds) | Durchschnittliche Halbzüge beider Seiten |
|---|---:|---:|
| Training | 111 / 120 (92,5 %) | 11,8 |
| Turnier I | 117 / 120 (97,5 %) | 12,4 |
| Turnier II | 16 / 120 (13,3 %) | 9,5 |

**Interpretation:** Die ersten Schritte erscheinen für die genutzte automatische Teststrategie erreichbar. Bei Turnier II entsteht mit weiterhin unverändertem Startdeck ein deutlicher Leistungsabfall. Es ist noch offen, ob die vorgesehenen Training-/Turnier-I-Belohnungen und realistische Spielerentscheidungen diese Lücke ausreichend schließen.

## 4. Klar erkennbare Grenzen

1. Keine Progressionssimulation mit realen Drops, Kaufentscheidungen, Kartenfreischaltungen, Element-Synergien, Skills und Ressourcen.
2. Keine echte KI für die separaten Spielstile *nur normale Monster* und *aktive DEF-Strategie*: bestehende KI priorisiert oft Fusionen.
3. Keine Messung des Schadenspotenzials verpasster legaler Spielzüge.
4. Es wurden keine visuellen Browsertests, Multiplayer-Interaktionen oder Import-/Export-Migrationen gemessen.
5. Einige Decks sind bewusst extreme hypothetische Zusammenstellungen; die Quellfilter allein gewährleisten nicht, dass die Karten in dieser Stärke zum jeweiligen Zeitpunkt verfügbar sind.

## 5. Entwicklungsmaßnahmen und Folgeprüfungen

- Einen zugunabhängigen, echten **Progressionssimulator** aufbauen, der Kartenbesitz, Shops, Questbelohnungen und Meilensteine berücksichtigt.
- Getrennte taktische Spieler-KI entwickeln: Normalmonster-fokussiert, Fusions-fokussiert, DEF-fokussiert. Ohne Spezial-KI sind archetypspezifische Siegquoten nicht sinnvoll vergleichbar.
- Verteidigung soll einen **aktiven Weg zum Sieg** erhalten, mit begrenztem Gegenstoß- oder Schildangriffsmechanismus und überprüfbarem Counterplay.
- Niedrigrangige Monster nicht pauschal buffen; ihre kombinatorischen Vorteile und Synergien im realen Deck testen.
- Analytik trennen: kostenlose Fakten über ein Duell, kostenpflichtige detaillierte Tipps und Gegenfaktisches nur auf Basis aufgezeichneter rechtmäßiger Aktionen/Zustände.
- Bestehende Spielstände und alte Funktionen mit Regressionstests schützen.

## 6. Reproduzierbarkeit

```bash
node tests/battle-simulator.cjs --samples 40 --json
node --test tests/strategy-engine.test.cjs
```

Der Balance-Läufer startet die tatsächliche Engine ohne Nutzerprofil. Den wichtigsten Quellstand entsprechend im GitHub-Commit fixieren, bevor künftige Balancewerte direkt mit diesem Bericht verglichen werden.
