# Arcane Duel – v14.9.4: Seelenzehrer-Freigabe und Spielerplatz-Symmetrie

**Datum:** 22. Oktober 2026 · **Branch:** `development` · **Prüflauf:** [#39769013309](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39769013309) (**success**)

**Entscheidung: Research-Regeln angepasst und Einzelmechaniken angeglichen; vollständige Sitzsymmetrie NICHT nachgewiesen. Kein Live- oder `main`-Merge.**

## A. Seelenzehrer werden exakt mit Angriffen freigeschaltet

Die frühere Sperre `soulUnlockTurn=Math.max(7, noAttackTurns+1)` wurde für **den ausdrücklich aktivierten Trainingsmodus** ersetzt durch `Math.max(2, noAttackTurns+1)`.

| Global gesperrte Angriffszüge | Erste mögliche Angriffsausführung | Erste offensive Seelenzehrer-Wirkung |
|---:|---:|---:|
| 0 | 2 | 2 |
| 2 | 3 | 3 |
| 4 | 5 | 5 |
| 6 | 7 | 7 |
| 8 | 9 | 9 |
| 10 | 11 | 11 |

Passive Seelenessenz-Extraktion, LP-Burn, aktiver Seelenraub und Seelenenergie-Aktivfähigkeiten beachten im Trainingsmodus weiterhin dieselbe Freigabeschwelle. Keine Sonder-Bevorzugung der Seelenzehrer während der kampffreien Aufbauphase. Die normale Karriere bleibt unverändert.

**Wichtiger Unterschied:** Das erste Angriffsfester gehört bei `noAttackTurns=0` dem zweiten Spieler (globaler Turn 2), bei geraden aktiven Forschungs-Sperren `2,4,6,8,10` jeweils dem ursprünglichen Starter (Turn `N+1`). Das ist ein **struktureller Initiativeunterschied**, kein automatisch zu entfernender Spielerplatz-Bonus; die Forschung muss beide Starterrichtungen prüfen.

## B. Tatsächlich im PvE vorhandene, vorher übersehene seitenspezifische Regelpfade

Die erste v14.9.3-Arena spiegelte Deck, Starthand, Fusionstock, Startschilde und Macht, aber **nicht alle eigentlichen PvE-Berechnungen**.

Im Forschungsmodus `strategicTraining.symmetricSides===true` werden jetzt speziell neutralisiert/angeglichen:

1. Der klassische Eröffnungsschild-Bonus von 200 wird für beide Seiten **direkt beim Erstellen** des Symmetrie-Spiels auf 0 gesetzt; normale Duelle behalten ihren Schild.
2. Einseitige Level-Zerfallsreduktion, Angriffsermüdungsreduktion, Eröffnungsaegis, Fusionskunde-Qualitätswurf-Boni und personenbezogene Essenzmonster-Aufwertungen werden in dieser Testumgebung nicht erteilt.
3. Besonders wichtig: `assets/evolution.js` entzog bisher dem PvE-Gegner **Poker-Muster-Qualität, Level-Boni und Extra-Würfe beim Fusionieren**. Die Forschungsregel `symmetricSides` schaltet diese NPC-Abwertung aus. Die ursprüngliche Karriereregel bleibt bestehen.
4. Allrounder-/Resonator-Resonanz einschließlich der **Ladungen pro eigenem Zug** funktioniert im Test für beide Spielerplätze (vorher ausschließlich Platz 0).
5. Die Prüfung auf ungültiges Verteidigungs-Umschalten wird in der symmetrischen Forschungsumgebung für beide KI-Sitze ausgeführt.
6. Beide bestehenden Strategie-Trainer v14.9.2 und v14.9.3 verwenden künftig den Symmetrie-Modus. Sie neutralisieren zusätzlich die PvE-Spieler-Upgraderänge ausdrücklich schon vor Spielaufbau.

Dies ist eine **gezielte Forschungs-Egalisierung**, keine globale Aufhebung von Spieler-/NPC-Unterschieden im fertigen Karriere-Spiel.

## C. Technischer Einzelmechanik-Spiegeltest

`tests/strategic-seat-parity-v1494.test.cjs` führt Sitz 0 und Sitz 1 in separat und gleich initialisierten VMs aus und vergleicht:

- Gleiche Fusion, Materialien, Vorlage und RNG-Seed → gleiche gewürfelte ATK, DEF, Qualitätsberechnung
- Gleichwertiger Angriff auf identische Verteidiger → gleicher effektiver Schaden, LP-Gegenschlag, ATK-Ermüdung
- Wächter+Seelenzehrer am Feld beim beginnenden eigenen Zug → gleiche passive Seelenwerte und gegnerische Stat-Abzüge
- Exakt gleiche Seelenzehrerfreigabe unter frühem und spätem Angriffscooldown
- Eröffnungsschilde, Fortschrittsperks und Monsterzerfall

Dieser Einzelmechanik-Test ist im erfolgreichen Actions-Lauf bestanden. Er prüft jedoch nur die ausgewählten, reproduzierbaren Situationen und ist **kein mathematischer Beweis über alle möglichen Spielzustände**.

## D. 360 tatsächliche Spiegelduelle: wichtiges Restproblem!

`tests/ai-v1494-seat-bias-investigation.cjs` vergleicht 5 Strategien (Wächter, Predator, Fusion, Seelenzehrer, Mischdeck) auf je 3 Deck-Varianten, gespiegelt über beide Starter, 0/6/10 Aufbaurunden, einmal mit und einmal ohne Forschungs-Symmetrie. Es wurden sowohl `balanced` gegen `balanced` als auch identische strategische Policies gegeneinander gespielt.

| KI-Mirrortyp | Bedingungen | Sitz 0 gewinnt | Sitz 1 gewinnt | Keine Entscheidung |
|---|---|---:|---:|---:|
| Alte `balanced`-KI | bisherige Seitenregeln | 77/90 | 11/90 | 2 |
| Alte `balanced`-KI | Forschungs-Symmetrie | **69/90** | **20/90** | 1 |
| Neue Strategie-KI | bisherige Seitenregeln | 48/90 | 37/90 | 5 |
| Neue Strategie-KI | Forschungs-Symmetrie | **49/90** | **35/90** | 6 |

Besonders auffällig: Bei `balanced` gegen `balanced` und null zusätzlichen Aufbauzügen gewann in der Forschungs-Symmetrie noch immer **26/30 Mal Spielerplatz 0**, ebenso bei sechs Aufbauzügen. Bei zehn Aufbauzügen war es `17/30` auf Platz 0, `12/30` auf Platz 1 und einmal keine Entscheidung.

Bei der strategischen Selbstspiegelung variiert die Verteilung:
- 0 Aufbauzüge: 11 Siege Sitz 0, 17 Sitz 1, zwei Timeouts
- 6 Aufbauzüge: 16 Siege Sitz 0, 11 Sitz 1, drei Timeouts
- 10 Aufbauzüge: 22 Siege Sitz 0, 7 Sitz 1, ein Timeout

Die Ergebnisse sind **kein Nachweis vollständiger Spielerplatz-Parität**. Die reine **Startspieler**-Siegverteilung ist dagegen bei `balanced`-Spiegeln ausgeglichen (46 Starter, 43 zweite Spieler in 89 entschiedenen Forschungssymmetrie-Matches) und bei Strategie-Spiegeln weniger extrem (46 Starter, 38 zweite Spieler in 84 entschiedenen Matches). Sitzvorteil und Eröffnungsinitiative müssen ausdrücklich getrennt betrachtet werden.

Zudem sind diese 360 Spiele **nicht 360 unabhängige Decks**: Je Szenario werden mehrere gekoppelte Varianten derselben Decks gespielt.

## E. Noch nicht neutrale beziehungsweise gar nicht abgebildete Funktionen

- Der allgemeine PvE-Code enthält weitere absichtlich spieler- oder NPC-spezifische Karriere-, Boss-, Quest- und UI-Aktionspfade. Diese sind **nicht pauschal** durch `symmetricSides` umgeschrieben.
- Der Forschungs-KI-Controller kann die **UI-gebundenen aktiven Seelenraub-Aktionen** nicht über seinen gemeinsamen `applyAiAction`-Aktionssatz auslösen. Beide Spiegelseiten erhalten sie damit im Match **nicht**, obwohl passive Effekte real aktiv sind. Das verhindert zwar einen einseitig eingesetzten Aktiveffekt, macht den KI-Test aber unvollständig gegenüber dem echten Spiel.
- Welche verbliebenen technischen AI-/PvE-Seitenpfade die `balanced`-KI-Sitzasymmetrie verursachen, wurde **noch nicht isoliert**. Keine Behauptung einer vollständigen Korrektur.
- Die ersten Angriffsfenster bleiben wie oben beschrieben absichtlich reihenfolgeabhängig. Diese Initiative ist kein Grund, die Fähigkeit des zweiten Spielers zu attackieren aus dem Produktivspiel zu streichen.

## Nächste Pflichtprüfungen, bevor eine neue KI freigegeben werden darf

1. Vollständiger **Aktionsvergleich am gleichen sichtbaren Brett** für beide Seiten: alle verfügbaren legalen Aktionen, gewählte Aktion, Summon-/Fusion-/Position-/Attack-Ergebnis, Monsterzerfall, Rollen- und Bonus-Layer.
2. Quellen der verbleibenden Sitz-0-Bevorzugung der `balanced`-KI isolieren, auch mit ausgeschalteten Fusions-, Resonanz- und Essence-Modulen als einzelne A/B-Arme.
3. Paritätsfähigkeit für aktive Soul-/Guardian-Fähigkeiten als echte symmetrische KI-Aktionen bereitstellen, bevor aus Strategiedaten Aussagen über diese Fähigkeiten abgeleitet werden.
4. Anschließend ein größerer, *unbekannter* Holdout für beide Sitzrichtungen und Starter; getrennt für `0`, `6`, `10` vorbereitende Duellzüge sowie normale Live-Regeln. Keine Promotion von KI-Parametern aufgrund einer einzigen alten `balanced`-Referenz.

## Reproduzierbarkeit

- [360-Duelle-Audit #39769013309](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39769013309) · **success**
- Code für die Spielregeln: `assets/game.js`, `assets/essence-combat.js`, `assets/evolution.js`, `assets/allrounder-resonance-v41.js`, `assets/fusion-rework-v113.js`, `assets/qa-followup-v51.js`
- Symmetrische Tests: `tests/strategic-seat-parity-v1494.test.cjs`, `tests/strategic-warmup-v1492.test.cjs`
- Spiegelduelle: `tests/ai-v1494-seat-bias-investigation.cjs`

**Freigabe:** Symmetrie der untersuchten Einzelmechaniken ✅, vollständige Forschungs-Sitzsymmetrie ❌, Release-/Main-Merge ❌.
