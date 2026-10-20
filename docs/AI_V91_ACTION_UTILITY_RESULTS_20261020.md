# Arcane Duel – KI-Trainingsbericht v9.1: Action Utility und Angriffserfolg

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Code- und KI-Zustand in Produktion:** unverändert.

**Trainingslauf:** [GitHub Actions #39366160219 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366160219).
**Code/Strategie:** [#39366160141 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366160141).
**Browser-Smoke:** [#39366160181](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366160181) separat zu prüfen; zum Zeitpunkt der ursprünglichen Berichtserstellung noch aktiv.
**Ergebnisartefakt:** `arcane-action-utility-v91` (ID `12239935343`; bis 19.11.2026); enthält vollständige Daten, darunter Ursprungspaare, Train-/Holdout-Statistik und Treffer-/Feldtelemetrie.

## Was tatsächlich ausgeführt wurde

- **32 neue voneinander unabhängige Karriereursprünge**, neuer Seed-Offset **36000**. Keiner dieser Ursprünge wurde in v8.8/8.9/9.0 verwendet.
- Zum Aufbau von 32 legalen Profilen wurden **1.658 reguläre Karriere-Duelle** inklusive echter Belohnungen und echter Kaufentscheidungen gespielt. **10/32** reguläre Karriereursprünge erreichten einen Sieg auf Turnierstufe IV innerhalb der maximalen Wiederholungszahl.
- Darauf aufbauend **896** echte Engine-Matched-Duelle mit **7** Varianten. Pro Variante **64 Trainings- und 64 zuvor nicht eingesehene Holdout-Duelle** aus **16 unabhängigen Ursprungskarrieren je Kohorte**, zwei Kampfseeds und beide Startpositionen pro Ausgangsprofil. Verschachtelte Kämpfe derselben Quelle sind nicht statistisch unabhängig.
- Offline-Strategien: `baseline`, `phase-reference`, `lethal-first`, `threat-removal`, `tempo-preserve`, `soul-utility`, `board-utility`.
- Alle Arms verwenden exakt das tatsächlich erspielte gleiche 40er-/Fusionsdeck, dieselbe Gegnerstufe IV, dieselben Start- und Kampfseeds; keine experimentelle Deckumbau-, Buff-, Loot- oder Bossvariation.
- Die Policy vergleicht ausschließlich **sichtbare Feldwerte** und **rechtmäßig verfügbare Aktionen**, darunter Gegnerschaden, Zielwert inklusive sichtbarer ACE-/Fusion-Markierung, eigenes Risiko sowie Seelen-/Wächter-Support. Nicht sichtbare Karten im Gegnerdeck oder auf seiner Hand werden nicht ausgelesen.
- Diagnosekämpfe gewähren **kein** `rewardMatch` und ändern weder gesammelte Karten, Währung noch Fortschritt. Live-KI, `main`, `assets/game.js`, Gegnerwerte, Monsterwerte und Shop bleiben unangetastet.

## Ergebnis gegen Gegner IV

| Variante | Training (Siege/64) | Training mittlere Spieler-LP-Differenz | Unabhängiger Holdout (Siege/64) | Holdout mittlere Spieler-LP-Differenz |
|---|---:|---:|---:|---:|
| Baseline | **2** | −5.575,8 | **0** | −5.774,2 |
| Phase-reference | 2 | −5.575,8 | 0 | −5.774,2 |
| Lethal-first | 2 | −5.575,8 | 0 | −5.774,7 |
| Threat-removal | 2 | −5.575,8 | 0 | −5.774,7 |
| Tempo-preserve | 2 | −5.575,8 | 0 | −5.774,7 |
| Soul-utility | 2 | **−5.573,2** | 0 | −5.774,7 |
| Board-utility | 2 | **−5.573,2** | 0 | −5.774,7 |

Aus der Trainingshälfte wurde `soul-utility` als Kandidat aufgrund von **+2,6 LP** bei gleicher Siegzahl selektiert. Im zuvor unberührten Holdout war die mittlere LP-Differenz jedoch **−0,5** schlechter und sämtliche 16 Ursprungskarrieren hatten dieselbe Siegzahl wie die Baseline. **`qualified=false`**, explizit **keine** Freigabe.

## Besonders wichtiger Diagnosebefund

Anders als frühere Scorer zählt v9.1 nicht nur „Aktion gewählt“, sondern **tatsächlich angewendete Treffer sowie echte Veränderung von Feldbelegung und LP**. Dies wurde in der Match-Engine direkt um `applyAiAction` herum gemessen:

| Baseline-Telemetrie | Training, 64 Duelle | Holdout, 64 Duelle |
|---|---:|---:|
| Angewendete Spieler-Angriffe | **32** | **6** |
| Gegnerische Karten dabei zerstört | 21 | 6 |
| Eigene Karten beim Angriff verloren | 1 | 0 |
| LP-Schaden am Gegner durch diese Angriffe (Summe) | 11.624 | **499** |
| LP-Schaden am Spieler durch diese Angriffe (Summe) | 0 | 0 |

Im Holdout hatten die 64 IV-Kämpfe damit nur **sechs tatsächliche Spieler-Angriffe**, bei denen Gegnerkarten zerstört wurden. Ein geändertes Angriffsziel kann bei so wenigen Angriffsmöglichkeiten kaum den Verlauf von 64 Duellen retten. Dass die Treffer selten sind, belegt **noch nicht**, ob mangelnde Beschwörungen, zu schwache ATK/DEF, Fusionstiming, Board-Überlegenheit des Gegners, ungünstige Starts oder fehlende Feldpositionen der Hauptgrund sind.

Das trainingsseitige Soul-Utility führte **2** rechtmäßige Unterstützungsaktionen aus und der Holdout **1**. Andere Support-/Board-Gewichte verursachten keine zusätzlichen Siege. In den echten Holdout-Kämpfen waren selbst die zulässigen Attack-Alternativen nahezu identisch: nur sechs angewendete Angriffe über alle 64 Spiele und pro Alternativpolicy.

Die explizite `phase-reference` erreichte **exakt dieselben** Siege, LP-Werte und Angriffszahlen wie die Baseline. Das ist ein weiterer Kontrolldatensatz dafür, dass bloße Trennung der Aktionen nicht unbeabsichtigt Stärke hinzufügt.

## Schlussfolgerung / Roadmap v9.2

**Die größte derzeit plausible Hypothese ist ein Pre-Attack-Bottleneck, keine bewiesene Fehlerursache:** Zu wenige Spielersituationen erreichen überhaupt einen wirkungsvollen Angriff. Die nächsten Experimente müssen daher **vor** der Angriffsziel-Auswahl ansetzen.

1. **Legalitäts-/Coverage-Audit je Zug:** Handkarten, Feldmonster, belegte Slots, Level/ATK/DEF, Material-Verfügbarkeit, legal mögliche Normal-/Feld-/Handfusionen (2–5), Beschwörung und tatsächliche Feldkontrolle protokollieren. Wann und warum entsteht gegen IV kein legaler schlagkräftiger Angreifer?
2. **Matchphasenfehler differenzieren:** Zustände `summon`, `pending`, `positions`, `attacks`, `guard`, `end` und ihre Veränderungen beobachten. Vor jeder Simulation sicherstellen, dass eine ausgeführte Aktion nicht direkt zu `guard/end` springt und dadurch mögliches Tempo verliert.
3. **Isolierte kontrollierte Gegenproben:** Baseline vs. legally strongest normal summon vs. legal targeted fusion vs. material-conserving fusion vs. ACE-reachability policy, stets mit **tatsächlich besessenen Karten** und denselben Bossbedingungen. Pro Profil Gegner-IV-Sieg, Feldstärke und angewendete Angriffe ausweisen. Test-Decks nicht heimlich aufwerten.
4. **Überlebensfähigkeit vor dem ersten Angriff:** frühe gegnerische Bedrohung, Kartenzieh-Risiko, erste drei gespielte Monster, erstes eigenes Feldmonster mit guter ATK, Kampfzeitpunkt und Zeitpunkt des ersten eigenen Angriffes erfassen.
5. **Strenger Train/Holdout und echter Karriere-Check:** erneut 32 andere Ursprungskarrieren auf neuen, nicht wiederverwendeten Seeds, 16 train/16 Holdout. Kandidaten nur nach reproduzierten echten Siegen; später neue vollständige Karriere-A/B bis IV und VI und Save-/Browser-QA.
6. **Keine Produktionsfreigabe oder Boss-Nerfs aus diesen Daten.** Der einzelne Holdout mit 0 Baseline-Siegen weist auf eine harte Hürde bei dieser Seed-Auswahl hin, ersetzt aber keine breite statistische Prüfung und rechtfertigt keine vorschnelle Balanceanpassung.

## QA / Einschränkungen

- v9.1-Workflow und Legalitäts-/Fusion-/Ökonomie-/Speicherprüfungen **56/56 bestanden**; weitere KI-Regressionen **20/20 bestanden**.
- [Code- und Strategiesuite #39366160141](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366160141) erfolgreich.
- Dies ist ein **geskripteter Offline-Spieler-KI-Vergleich**; die reale NPC-KI lernt aus den Duellen nicht selbstständig. Alle neuen Dateien liegen in `tests/` und `.github/workflows/` auf `development`, nicht in produktiven Spieleinstellungen.

**Urteil:** v9.1 wurde vollständig durchgeführt und protokolliert. Keine getestete Änderung erhöht IV-Siege. Die wichtigste neue Messung zeigt die extrem niedrige **Häufigkeit wirksamer Spielerangriffe** gegen IV in diesem unabhängigen Kontrollblock und priorisiert v9.2 vor der Angriffsphase.
