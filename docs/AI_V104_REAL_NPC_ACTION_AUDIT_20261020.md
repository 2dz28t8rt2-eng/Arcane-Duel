# Arcane Duel – v10.4: Erste unabhängige Auditierung der produktiven NPC-Aktionen

**20. Oktober 2026 · Branch `development`** · [Echter NPC-Test: GitHub Actions #39387587393, NPC-Job SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587393). Rohartefakt `arcane-npc-legal-action-audit-v104`, GitHub-Artifact **12248002346** (bis 19.11.2026), `artifacts/ai-real-npc-audit-v104.json`.

## Methode

- **120 vollständig simulierte echte PVE-Duelle**: 10 reale Gegnerstufen **I–X**, 12 neue feste Spielseeds pro Tier. Original `createGame`, `simulateGame`, `chooseAiAction`, `applyAiAction` und unveränderte NPC-Decks; keine vorweggenommenen Siege oder Gratis-Monster. Unterschiedliche NPC-Policy-Parameter (`balanced`, `offensive`, `guardian`, `economy`) rotieren als **kontrollierte Offline-Vergleichsbedingungen** – sie sind keine trainierte neue Live-KI.
- Gegenseite: dasselbe reale regelkonforme **Startdeck**, also **kein** abgestimmter Late-Game-Gegner mit Level-10-ACE-Deck, und keine vollständige Karriere-Ressourcenökonomie. Daraus keinesfalls faire Late-Game-Siegraten behaupten.
- Jede NPC-Aktion bleibt unverändert und durchläuft den originalen Spielresolver. Der Wrapper protokolliert nur nach erfolgreicher Aktion: normale Beschwörung, Hand-/Feldfusion, Angriff, Positionswechsel, ACE-Platzierung, echten LP-Schaden und durch tatsächliche NPC-Angriffe zerstörte eigene Feldkarten.
- Der Test sucht gezielt Regelverstöße, insbesondere die früher berichtete Sequenz **Angriff → Wechsel desselben Monsters in DEF innerhalb desselben Zuges**, sowie das Schalten eines bereits erschöpften Angreifers. Der NPC darf weder Gegnerhand-/Deckkarten sehen noch den Resolver umgehen.

## Beobachtete Ergebnisse

| Tatsächlich beobachtet | Resultat |
|---|---:|
| Echte abgeschlossene NPC-Testduelle | **120** |
| Gewonnene Matches des NPC (gegen die Startdecks) | **90** |
| Echt durch den Resolver ausgeführte NPC-Aktionen | **4.148** |
| Handfusionen | **424** |
| Zusätzliche Feldfusionen | **92** |
| NPC-Angriffe | **1.562** |
| ACE-Platzierungen (Ereignisse, nicht Unique-Karten) | **204** |
| Ungültige NPC-Aktionen | **0** |
| Regelwidrige DEF-Wechsel nach Angriff im selben Zug | **0** |
| Wechsel eines bereits verbrauchten Angreifers | **0** |

**Gegnerstufen und tatsächliche ACE-Ereignisse, jeweils 12 Matches:**

| NPC-Turnierstufe | NPC-Siege | ACE-Platzierungen | Handfusionen |
|---|---:|---:|---:|
| I | 0 | 11 | 0 |
| II | 1 | 2 | 16 |
| III | 7 | 21 | 146 |
| IV | 12 | 36 | 60 |
| V | 11 | 36 | 56 |
| VI | 12 | 26 | 51 |
| VII | 11 | 36 | 48 |
| VIII | 12 | 32 | 22 |
| IX | 12 | 4 | 25 |
| **X** | **12** | **0** | **0** |

**Interpretation:**
1. Der berichtete Angriff-anschließend-DEF-Fehler wurde in diesen 120 vollständigen Duellen **nicht reproduziert**. Das beweist keine absolute Fehlerfreiheit bei anderen Handlungen oder Spezialeffekten; lediglich das beobachtete Sample war vollständig regelkonform.
2. Beim Gegner **IX** (4 ACE-Platzierungen), besonders bei **X** (0 ACE-Platzierungen und 0 Handfusionen) erscheint ACE-/Fusionsnutzung potenziell verbesserungsfähig. Untersuchen, ob das Gegnerdeck tatsächlich ACE-Karten auf der Hand zieht und unter legalen Bedingungen spielen kann, ob die Strategie diese Aktionen priorisiert, oder ob ein Kampf schon vorher endet. **Null Ausspielungen ist noch kein Nachweis eines KI-Bugs oder eines sicheren ACEs auf der Hand.**
3. Die Zahl der im Rohbericht gezählten ACE-`deck/hand/fusion pool slots` kann über mehrere Kartenspeicherstellen und Wiederholungen dieselbe Instanz umfassen. Sie ist **nicht** die Zahl einzigartiger spielbarer ACE-Handkarten. Die Folgerung muss über Handdraw-/Legalitäts- und konkreten Entscheidungs-Audit erfolgen.
4. Die realen NPC-Wins 90/120 hängen stark vom schwächeren Starter-Gegendeck ab. Sie sind kein brauchbarer Fairnesswert für voll erspielte IV–X-Karrieredecks.

## Eigenständiger nächster NPC-Trainingsauftrag

- Für IX/X **ACE-Draw-Funnel** separat tracken: wirklich im Deck → wirklich auf der Hand → legal spielbar → angeboten/ausgewählt → tatsächlich platziert. Anzahl eigener Fusionshand-Optionen vs. tatsächlich ausgeführt, ohne verstecktes Spielerwissen. Konkrete Ursachen für null ACEs bei X ermitteln, bevor sich die NPC-Policy ändert.
- Für faire Schwierigkeit NPC gegen echte von Spielern regulär erspielte Late-Game-Decks testen, nicht gegen bloßes Startdeck. Variation der Rollen (Predator/Defender/Soul-Drain/Resonator) und Spielstile, Identität der Kampfstufe und echte wirtschaftliche Erwerbbarkeit kontrollieren.
- In einer *separaten*, unveröffentlichten AI-Testoption danach legalen ACE-/Fusion-Aufbau vergleichen, Vorher-/Nachher-Policy fair paaren und erst bei reproduziertem Vorteil sowie fehlender Gegnerübermächtigkeit produktiv evaluieren.

**Wichtig:** Diese v10.4-NPC-Auswertung hat die **produktive NPC-KI nicht verändert oder selbstlernend gemacht**. `main`, `assets/game.js`, ACE-Werte, Loot, Deckfreischaltungen und Spielbalance bleiben unangetastet.
