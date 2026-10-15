# Arcane Duel 3.1 – Getrennter Predator-/Wächter-Basistest

**15. Oktober 2026 · Branch `development` · Analyse, keine Werte- oder KI-Änderung.**

## Versuchsaufbau

Reproduzierbarer Test in `tests/fusion31-balance-scenarios.test.cjs` (`runRoleBench`), GitHub Actions: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/38783478058

- 24 gepaarte Seed-Szenarien gegen **IV**, **VII** und **X**; **216 absolvierte Duelle**.
- Drei synthetisch zusammengestellte 40-Karten-Decktypen: **nur Predator**, **nur Wächter/Verteidiger** und **echte 50/50-Mischung**. Bei der Mischung wurden sieben Predator- und sieben Wächterfamilienkarten gewählt, im Deck jeweils maximal drei Kopien.
- Alle Decks nutzen vergleichbare zugelassene Kartenstufen: vor IV maximal LV6, vor VII LV8, vor X LV10. Karten wurden für diese isolierte Studie **nicht wirtschaftlich erspielt**, sondern als ideale, rollenspezifische Vergleichsdecks bereitgestellt.
- Der Spieler darf ausdrücklich **keine einzige Fusion** ausführen; der NPC fusioniert normal weiter. Predator-KI wählt den offensiven, Wächter-KI den Guardian- und Misch-KI den ausgewogenen Modus. Das ist ein erster Vergleich der Rollenidentität, **kein KI-optimierter menschlicher Deckvergleich**.
- Es wird **kein gebundenes Essenzwesen** und keine aktive Essenzschulperk-Stufe simuliert; die normalen PvE-Klassenregeln (insbesondere defensive HP, Gegenwehr, Wächter-/Seeleninteraktionen) bleiben aktiv.
- Mehrere Strategien verwenden dieselben Seeds; kleine Unterschiede bei Siegraten haben keine robuste statistische Aussagekraft.

## Ergebnisse

| Gegner | Predator | Wächter | Gemischt |
|---|---:|---:|---:|
| **IV** – Siege | 23/24 | **24/24** | **24/24** |
| **IV** – Ø Halbzüge | **9,71** | 26,38 | 10,88 |
| **IV** – Ø verbleibende LP | 5.408 | 1.692 | 5.530 |
| **VII** – Siege | **24/24** | **24/24** | **24/24** |
| **VII** – Ø Halbzüge | **7,50** | 19,71 | 7,58 |
| **VII** – Ø verbleibende LP | 7.000 | 5.852 | 7.000 |
| **X** – Siege | 22/24 | **24/24** | 23/24 |
| **X** – Ø Halbzüge | **8,08** | 13,67 | 8,71 |
| **X** – Ø verbleibende LP | 9.157 | 9.804 | 9.315 |

In diesen idealisierten Kämpfen sind Wächter zwar durchweg erfolgreich, aber vor IV fast **2,7×** so langsam wie Predator (26,38 vs. 9,71 Halbzüge) und gehen dabei mit deutlich weniger LP aus dem Kampf. Gegen X sind sie noch 69 % langsamer (13,67 vs. 8,08), besitzen danach jedoch im Mittel etwas mehr LP. Das ist nicht automatisch eine Schwäche: Defensive Strategie darf auf Überleben statt maximale Geschwindigkeit ausgelegt sein.

**Wichtige Einschränkung:** Die Normalmonster-Decks sind sehr stark. Das deutet die extrem hohen Siegquoten gegen VII/X als **Ceiling-Effekt**; ihre Reihenfolge ist noch keine Messung einer perfekt ausbalancierten, tatsächlich erspielten Strategie.

## Folgerungen für das nächste Design

1. **Predator hat bereits eine erkennbare Identität:** schnelle Siege und hoher direkter Druck. Ein großer zusätzlicher Prozent-ATK-Bonus könnte ihn überstärken.
2. **Verteidiger ist funktionstüchtig, aber langsam:** Statt einfach noch mehr DEF zu schenken, eher die bedingte Unterstützung bei gegnerischen Angriffen und taktisch sinnvolle Positionswahl belohnen. Überlebenszeit, Gegenwehr und defensive Siegbedingungen messen.
3. **Gemischte Decks funktionieren:** Gute generelle Kartenstärke kann Rollenboni überdecken. Der nächste Test muss tatsächliche Interaktionen zwischen Predator/Support/Guardian/Seelenzehrer messen.
4. **Rollenperks sauber mit Essenzsystem trennen:** Permanente neue Predator-, Wächter- und Fusions-Perks sollen nur das jeweilige Klassenverhalten verstärken, ohne die einmalig erworbenen Essenzschulperks zu entwerten oder doppelt zu stapeln.
5. **Gegner-KI erst ab IV schrittweise verbessern**, unterschiedliche Ziellogik je Gegner; vor allem keine unrealistische Bonus-Würfelmanipulation.
6. **LV6–10 als einzelne Normalmonster leicht anheben**, nicht die Fusionsreferenz mit anheben. Die Werkstatt verwendet schon `150+30*level²` Gesamtbudget. Eine kleine lineare Normalmonster-Ergänzung erscheint sinnvoller als das Ersetzen dieser Kurve.

**Status:** Kein Gameplay-Code verändert. Tests und Bericht dienen als gemeinsame Ausgangsbasis; `main` bleibt unangetastet.
