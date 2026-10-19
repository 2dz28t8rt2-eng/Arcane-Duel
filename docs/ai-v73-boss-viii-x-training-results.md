# Arcane Duel – KI-Training v7.3: VIII Fusionsqualität & X Schwierigkeitsdiagnose

**Status: offline vollständig durchgelaufen; keine Aktivierung der neuen KI im Spiel.** 19. Oktober 2026. Branch `development`; `main`, Kartenbalance, Spielerprofil und Spielengine bleiben unverändert.

## Ausgangslage

Die 16 neuen Endgame-Normalmonster sind echte Spielkarten (IDs 716–731), deren Freischaltbedingungen in v7.2 beim **synthetisch konstruierten** Kartenpool geprüft wurden. Mit diesen Karten verliert die bisher trainierte KI gegen manche Testdecks von VIII; X gewinnt jedoch nahezu alle Partien. Wir unterscheiden:
- **Konstruiert, quellzulässig:** Kopien vorhandener legal freigeschalteter Monster in einem 40er-Testdeck; die Testspieler haben sie NICHT tatsächlich aus einem Karriere-Spielstand erspielt.
- **Echte Karriere:** Durch `simulateGame`, `rewardMatch`, Drops und realen Kartenbesitz entstanden. Der nächste echte VIII-Spielstand muss weiterhin durch regulären Sieg gegen VII entstehen.

## v7.3: Suche auf getrennten Training-/Holdout-Seeds

[Erfolgreicher GitHub Actions-Lauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39274597545)

Das Script `tests/ai-focused-boss-training-v73.cjs` bewertet gegenüber den realen **v5.7-Gewichten** acht Scorer-Profile (inklusive Baseline). Gewichte für ATK, DEF, Tempo, Fusionsqualität, Materialkosten und Bedrohungsabwehr variieren; der **ACE-Parameter bleibt fix**. Bei jedem Kandidaten identische Quelle, Gegnerdecks, Spielerstil, RNG-Seed und Startspieler; Auswahl ausschließlich anhand Training; disjunkte Holdout-Seeds.

**2.352 vollständige Engine-Partien** gegen normale und spiegelgleiche Gegner mit Karten der Level 7–10. Die 56 Konstruktionen sind in **55 verschiedenen Haupt-/Fusions-Deckfingerprints** vertreten.

### Gegner VIII: echte Turniergegner-Karten inklusive Signatur-ACE

| Holdout (168 Partien pro Profil) | Bisherige v5.7-KI | Neues `fusion-precision` |
|---|---:|---:|
| Boss-Siege | 102/168 | **148/168** |
| Gewinnquote | 60,7 % | **88,1 %** |
| Veränderung durchschnittlicher LP-Vorsprung | – | **+2.836** |

Die stärker bewertete Fusionsqualität macht einen großen taktischen Unterschied. Noch nicht auf der Live-KI aktiviert.

### Gegner X: separate Spiegelstrategie UND echter Boss

Zunächst wurde X mit **identischen Decks auf beiden Seiten** geprüft, weil die echte Turnierversion sonst 100 % gewinnt. In diesem Diagnosetest wurde `rapid-pressure` ausgewählt:
- Baseline **55/168** Siege gegen gleich starke, konstruierte Gegnerkarten;
- `rapid-pressure` **79/168** Siege, **+24 Siege**, **+1.843 LP**.
- Spiegeltests nutzen **nicht** das echte Boss-Deck und enthalten nicht zwingend sein ACE. Deshalb sind sie **keine** Freigabeprüfung.

Anschließend wurde die Auswahl wieder gegen den **echten X-Boss samt Signatur-ACE** geprüft:
- Baseline **168/168**, Kandidat ebenfalls **168/168**.
- Mittlerer LP-Vorteil des Kandidaten: **+41**, Boss-ACE in **168/168** Partien bei beiden Profilen beobachtet.
- Kein Unterschied in der Gewinnrate; **kein echtes Boss-KI-Upgrade bestätigt**.

## Unabhängige, fixierte VIII-Bestätigung

[Erfolgreicher Bestätigungslauf](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39274919829)

Das Script `tests/ai-boss-viii-confirmation-v73.cjs` verändert keine Parameter: `fusion-precision` wurde **vor** der Bestätigungsreihe festgelegt. Die Testdecks wurden mit einem **dritten Deckgenerator-Seed 91** neu erzeugt; der Kampf-Seed-Bereich 18.379.571 ist vom Training und ersten Holdout getrennt. Im Gegensatz zur ersten Testserie wurden **alle vier** Deckausbauarten und alle sieben Rollenstile getestet.

| Echte Boss-VIII-Partien | Bisherige v5.7-KI | Fixierte `fusion-precision` |
|---|---:|---:|
| Duelle | 448 | 448 |
| Boss-Siege | **298** | **399** |
| Boss-Gewinnquote | 66,5 % | 89,1 % |
| mittlerer LP-Vorsprung gegenüber Baseline | – | **+2.308 LP** |
| Spiele mit bestätigter Signatur-ACE-Beschwörung | 437 | **447** |

**+101 Siege in einem dritten, unabhängigen Experiment.** Bestätigung: `approvedForFutureConsideration=true`; ausdrücklich **nicht** `productionDeployment=true`.

## Gesamtumfang

**3.248 zusätzliche Duelle** (2.352 Suche und Holdout + 896 unabhängige Bestätigung), sämtlich nach dem aktuellen, 732 Karten umfassenden Katalog. Die 16 Karten selbst wurden für das Training **nicht kopiert oder neu erzeugt**; die synthetischen Decks sind nur lokale Testzustände im Node-VM.

## Keine direkte Aktivierung

Die Fusion-Precision-Policy für VIII hat robuste Verbesserungen gegenüber konstruierten Karten gezeigt; sie könnte VIII aber im regulären Spiel zu schwer machen. Ein verantwortlicher Rollout erfordert:
1. Legitim von Testspielern gewonnene **mehrere unterschiedliche VIII-Spielstände** (also wirkliche Siege gegen VII);
2. Prüfungen der Schwierigkeit mit Käufen, Upgrades, Boostern, Fusionen und aus Drops erhaltenen Karten;
3. gegebenenfalls ein moderierter/beschränkter Fusionsbonus, falls der starke Kandidat gegen echte Durchschnittsdecks zu dominant wäre.

Die experimentelle X-Strategie hat auf echter Boss-Balance **keinen nachgewiesenen Gewinnraten-Vorteil** und wird ebenfalls nicht aktiviert.

**Dateien:** `tests/ai-focused-boss-training-v73.cjs`, `tests/ai-boss-viii-confirmation-v73.cjs`, jeweils dazugehörige CI Workflows. Die kompletten Einzelmetriken stehen als GitHub-Actions-Artefakte 30 Tage bereit.
