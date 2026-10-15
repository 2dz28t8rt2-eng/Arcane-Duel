# Arcane Duel – Monsterrollen & Turnier-Balance-Audit
**Stand:** 15.10.2026 · `development` · reine Prüfung, **keine Kampfwertänderung**

## 1. Fazit
Die Rollen wurden in `assets/game.js` größtenteils nach dem bestehenden Verhältnis ATK/DEF etikettiert und **nicht systematisch neu auf ATK-starke Predatoren bzw. DEF-starke Verteidiger balanciert**. Unterscheidbare Rollentalente sind vorhanden, aber die beiden Nichtfusions-Archetypen funktionieren bislang nicht selbstständig gegen die vorhandene Turnier-KI. Früh-/Mittelturnier ist mit gut zusammengestellten synthetischen Decks häufig gewinnbar; Turniergegner IX und X zeigen einen ausgeprägten Schwierigkeitssprung.

## 2. Aktiver Kartenkatalog

Der gesamte interne Pool enthält 399 Einträge (einschließlich Legacy, Varianten und nicht aktiver Karten); die hier betrachteten **128 aktiven Nicht-Essenzkarten** gliedern sich wie folgt:

| Rolle | Anzahl | Normal | Fusionen | Ø ATK | Ø DEF |
|---|---:|---:|---:|---:|---:|
| Predator | 53 | 32 | 21 | 1.214 | 845 |
| Wächter | 16 | 10 | 6 | 1.015 | 1.184 |
| Seelenzehrer | 13 | 7 | 6 | 948 | 1.034 |
| Allrounder | 38 | 37 | 1 | 482 | 451 |
| Unterstützer | 4 | 4 | 0 | 475 | 445 |
| Jäger | 4 | 0 | 4 | 2.245 | 1.803 |

**Ausnahmen / widersprüchliche Rollenzuordnung:**
- „Phönix Myrra“ (ID 315): Rolle Predator, ATK 740 / DEF 1.250.
- „Schattenlord der Zwischenwelt“ (ID 260): Rolle Seelenzehrer, ATK 2.290 / DEF 1.540.
- Späte Wächter sind oft kaum defensiv spezialisiert, z. B. „Goldener Himmelswyvern“, Lv 12: ATK 3.250 / DEF 3.760. Das sind *hohe ATK und hohe DEF* – nicht die gewünschten niedrigen ATK-Werte.
- Aktive **normale Hauptdeckkarten reichen nur bis Lv 7**; höhere Kartenstufen liegen überwiegend bei den Fusionen. Deshalb sind auch starke gewöhnliche Angreifer spät strukturell benachteiligt.

### Früh verfügbarer theoretischer Pool
Vor Gegner I: 20 normale Karten, davon 7 Predator, 7 Verteidiger einschließlich 2 Seelenzehrer.
Nach Stufe V: 88 normale Karten, davon 32 Predator, 17 Verteidiger einschließlich 7 Seelenzehrer.
Karten mit geeigneter Quellenstufe sind nicht automatisch im tatsächlichen Spielerbesitz.

## 3. Normale KI: 70 Einzelduelle pro Gegner und Decktyp (2.800 Duelle)

Synthetische Decks mit 40 Karten = zwei Kopien der 20 im jeweils **vorher** freigeschalteten Quellenpool nach ATK/DEF/Fusionsrelevanz priorisierten Karten, vor der nächsten Turnierstufe. Gemeinsamer Pool von höchstens 15 freigegebenen Fusionen. Kein realer Drop-/Kauf-/Meilensteinpfad; keine gekauften Upgrades/Essenzbegleiter. Unveränderte Gegner-KI. Die Spieler-KI fusioniert auch in Predator- und DEF-Decks durchschnittlich 3–5-mal pro Duell.

| Gegner | Predator % | DEF % | Fusion % | Ausgewogen % |
|---|---:|---:|---:|---:|
| I | 98,6 | 100,0 | 98,6 | 95,7 |
| II | 64,3 | 75,7 | 81,4 | 87,1 |
| III | 92,9 | 98,6 | 100,0 | 100,0 |
| IV | 82,9 | 91,4 | 92,9 | 94,3 |
| V | 92,9 | 88,6 | 98,6 | 94,3 |
| VI | 88,6 | 97,1 | 98,6 | 97,1 |
| VII | 75,7 | 100,0 | 97,1 | 91,4 |
| VIII | 64,3 | 97,1 | 88,6 | 88,6 |
| IX | 18,6 | 8,6 | 11,4 | 8,6 |
| X | 4,3 | 2,9 | 1,4 | 1,4 |

**Einschränkung:** Seeds unterschieden sich in dieser Pilot-Testreihe je Decktyp. Zahlen demonstrieren die Größenordnung, sind kein vollständig paarweiser Vergleich. Ebenso waren die Decks künstlich optimal aus einer theoretisch zugänglichen Menge zusammengestellt.

## 4. Turnierfolgen (400 Ladder-Versuche)

Je 80 Versuche für Predator, DEF, Fusion, Ausgewogen und unverändertes Starterdeck, ab Gegner I aufsteigend. Für die ersten vier Decktypen wurde nach jedem Sieg eine frische, synthetische 40er-Auswahl aus dem Quellenpool vor dem nächsten Gegner getroffen, **ohne echte Karten-Drops, Währungsfluss oder Kaufentscheidungen**. Ein verlorenes Duell beendet die Folge.

| Ansatz | Durchläufe | Vollständig bis X | Mittlere zuletzt besiegte Stufe |
|---|---:|---:|---:|
| Predator | 80 | 0 | 4,38 |
| DEF | 80 | 0 | 5,96 |
| Fusion | 80 | 0 | 5,88 |
| Ausgewogen | 80 | 0 | 5,76 |
| Unverändertes Startdeck | 80 | 0 | 1,04 |

Die meisten auf stärkere Decks umgestellten Folgen scheiterten spätestens an IX oder X. **Das ist KEIN vollständiger ökonomischer Turnierfortschritts-Simulator**.

## 5. Sondertest: Rollen ohne eigene Fusionen (840 Duelle)

Für diesen Test wurde **ausschließlich in der isolierten Testumgebung** die Spieler-KI verändert: Sie beschwört normale Monster und fusioniert nicht; der DEF-Stil stellt geeignete Monster bevorzugt in DEF. Die reale Gegner-KI und die Kampfregeln bleiben gleich. Pro Gegner/Variante 60 feste Seeds.

| Gegner | Normaler Predator % | Reiner DEF-Stil % |
|---|---:|---:|
| I | 8,3 | 1,7 |
| III | 0,0 | 0,0 |
| V | 1,7 | 0,0 |
| VII | 1,7 | 1,7 |
| VIII | 1,7 | 1,7 |
| IX | 1,7 | 3,3 |
| X | 5,0 | 5,0 |

Bei vielen dieser Duelle gab es nur wenige oder keine Seelenzehrer-Absorptions- und Burn-Ereignisse, obwohl die DEF-KI die Position bevorzugte. Monster werden häufig zu schnell entfernt oder brauchen mehr eigene Fusions-/Schutzunterstützung.

**Wichtige Einschränkung:** Ein spezialisierter Spieler *darf* natürlich dennoch fusionieren. Dieser künstlich strenge Test soll nur den Beitrag der eigenständigen Rollenmechanik abgrenzen; die Tests sind nicht repräsentativ für optimales Spieler-Verhalten.

## 6. Modelliertes Lategame (900 Duelle)

Je 60 Einzelduelle pro Schule gegen Turnierstufe V, VII, VIII, IX und X. Mit passender exklusiver Essenzmonster-Karte im aktiven Deck, modelliertem bereits besiegtem Turnierfortschritt, passenden passiven Boni und **illustrativen Upgrades**, ohne die ökonomische Leistbarkeit oder exakt erspielte Drops zu rekonstruieren. Andere Spielregeln und Gegner-KI unverändert, Spieler fusioniert weiterhin.

| Gegner | Predator % | DEF % | Fusion % |
|---|---:|---:|---:|
| V | 98,3 | 95,0 | 96,7 |
| VII | 86,7 | 98,3 | 98,3 |
| VIII | 51,7 | 91,7 | 88,3 |
| IX | 30,0 | 18,3 | 21,7 |
| X | 18,3 | 16,7 | 16,7 |

**Interpretation:** Der massive Verlust gegen IX/X bleibt selbst unter günstiger angenommenen Bedingungen sichtbar. Da die tatsächliche Wirtschaft nicht mitgerechnet ist, sind dies keine menschlichen Siegchancen.

## 7. Priorisierte Konsequenzen für das nächste Balance-Update

1. **Explizite, kuratierte Monsterrollen** statt überwiegend abgeleiteter ATK/DEF-Labels. Für jede aktive Karte eine tatsächlich passende Rolle mit sinnvoller Wertespanne. Ausnahmefälle mit bewusst besonderer Kraft im Lexikon erklären.
2. **Predator:** hohe absolute ATK, deutlich niedrigere DEF; **Wächter/Seelenzehrer:** signifikante Grund-DEF und moderat niedrige ATK (keine 0er ATK). Wertekurve **je Level und Freischaltstufe** festlegen, nicht nur ein Verhältnis. Fusionen bleiben Premium, ohne Normalmonster unbrauchbar zu machen.
3. Mehr **gewöhnliche Monster oberhalb Level 7** oder andere faire lategametaugliche Progression prüfen, da das bestehende Hauptdeck unter hochstufigen Fusionen leidet.
4. Seelenzehrer müssen **regelmäßig auf dem Feld bleiben und tatsächlich saugen**, ohne ihre Counter-Mechanik zu überskalieren; Wächter-Heilung, DEF-HP und Burn mit eigenen Instrumenten messen.
5. **Dedizierte NPC- und Simulationsstrategien** für Predator, DEF und Fusion; derzeit konvergieren alle auf dieselben Fusionspläne.
6. **Turnier IX/X, 10.000 LP und Gegnersignaturen** unter stufengerechten Karten, realen Upgrades und Essenzmonster-Evolution gesondert balancieren. Die schweren Gegner dürfen schwer bleiben, aber sollen mit mehreren Spielweisen erreichbar sein.
7. Vor Änderung der Karte-Normalwerte stabile Karten-IDs, Fusionsvorlagen, gespeicherte Duelle, Charakterpacks, Booster, PvP und alte Lernherausforderungen mit Regressionstests absichern.
8. Keine allgemeinen Stat-Buffs, bevor ein Stufen-/Rollenbudget und die Ziel-Quoten definiert sind.

## 8. Technisches Testprotokoll

Alle Simulationen liefen mit dem **tatsächlich ausgelieferten JS-Kampfsystem** (`assets/game.js`, `expansion.js`, `evolution.js`, `learning.js`, `essence-combat.js`) in einem isolierten, leeren Browser-Dummy ohne echte Nutzer-Speicherstände. Keine Änderungen an produktiven Regeln und keine Änderung an `main`.

**Zusammenfassung:** 2.800 Einzelduelle (Standard-KI), 400 begonnene Turnierfolgen unterschiedlicher Länge, 840 rollenisolierte Duelle und 900 modellierte Lategame-Duelle. In den durchgeführten Tests wurden keine Ausführungsfehler gemeldet. Alle Prozentwerte als vorläufige Diagnose interpretieren.
