# Arcane Duel – KI-Trainingsbericht v7.8 (erfolgreiche Wiederholung)

**Datum:** 19.10.2026 · **Branch:** `development` · **CI-Lauf:** [39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588) – **SUCCESS**.  
**Vorher fehlgeschlagener Lauf:** [39285652755](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39285652755). Ursachen und Reparaturen: [Fehlerbericht](AI_V78_FAILED_RUN_REPORT_20261019.md).

## 1. Ablauf und geprüfte Daten

- Die neue Splitterwirtschaft v7.7 und die dazugehörigen Spielstand-/Perk-/Karten-Regressionstests bestanden das vorgeschaltete Training-Gate: **58/58 Tests bestanden**.
- Anschließend wurden echte Karriere-Spielstände durch normale Simulator-Duelle und `rewardMatch` bis zur Turnierstufe VIII aufgebaut – **ohne Gratis-Karten, Gratis-Splitter oder künstlichen Turnierfortschritt**.
- Unter den gültigen Testresultaten waren fünf unterschiedliche VIII-Spielstand-Snapshots aus **nur zwei voneinander unabhängigen Ausgangskarrieren**. Die fünf Snapshots sind korreliert, keinesfalls fünf unabhängige Spieler.
- Jedes echte Ausgangsinventar wurde in vier Zuständen wiederholt: `existing` (nicht investieren), `craft` (bezahlte normale Karten herstellen), `research` (12-Splitter-Rollenforschung und bei verfügbaren echten Boosterbelegen ein 5-Splitter-Tausch), `hybrid` (kombinieren).
- Drei von vier Spieler-Kampfstilen werden explizit berücksichtigt? Im Skript gelten die **vier** Piloten `balanced`, `offensive`, `guardian`, `economy`; pro Startseed beide Startspielerpositionen. Acht Wirtschaftsprofile waren innerhalb der Testsetzung stärker, einige hatten nicht genügend Ressourcen für alle geplanten Käufe.
- Ziel: echter Turniergegner VIII mit seiner kuratierten Signatur-ACE-Karte; bisherige v5.7-Bossgewichte und separat die eingefrorene experimentelle v7.3-`fusion-precision`-KI, **beide nicht geändert/aktiviert**.
- **1.280 Duellsimulationen** v7.8. Trainings-Samen wurden zur Vorauswahl eines Wirtschaftsplans verwendet, der unabhängige Holdout-Samensatz nur zur Kontrolle.

## 2. Tatsächliches Resultat

**Im Training wurde `hybrid` als erfolgversprechendste Spieler-Wirtschaftsstrategie vor dem Holdout ausgewählt.**

| Unabhängiger Holdout (120 VIII-Duelle je Arm/Bossprofil) | Alte v5.7 VIII-KI | Experimentelle v7.3 Fusion Precision |
|---|---:|---:|
| Spieler ohne zusätzliche Splitterinvestition | **0/120 Siege** | Nicht als Freigabekriterium heranziehen |
| Spieler nach Hybridinvestition | **20/120 Siege** | **3/120 Siege** |
| Hybrid-Spielersiegquote | **16,7 %** | **2,5 %** |
| Durchschnittlicher VIII-Boss-LP-Vorsprung bei Hybrid | **4.417** | **5.683** |

Vor der Investition gegen den echten v5.7-Boss betrug der gemessene mittlere NPC-LP-Vorsprung **6.247**; nach Hybridinvestition **4.417**: Verbesserung für den Spieler **um 1.830 LP**, in derselben kontrollierten Population. Die Hybrid-Strategie erzielte alle 20 Sieges-Freischaltungen rechtmäßig für Turnierstufe IX; der experimentelle Boss gestattete nur drei.

**Wichtig:** Dies sind Simulator-Spieler mit vorgegebenen Strategien, keine Menschen. Die beiden zugrunde liegenden Karrieren sind nicht repräsentativ. Der Unterschied in Siegquoten belegt eine erhebliche Verbesserung *innerhalb dieses Vergleichs*, aber keine statistisch unabhängige Stichprobe von 120 einzelnen Karrieren.

## 3. Kartenprogression durch bezahlte Splitter

- Es wurden insgesamt **20 Wirtschaftsvarianten** getestet (fünf reale VIII-Snapshots × vier Strategien).
- Zwei frühe VIII-Snapshots hatten zuvor nur **Level-4-Normalmonster** und keine der 16 neuen Endgame-Monster. Bezahlt mit **80 Splittern** erhielten sie jeweils zwei hergestellte Kopien einer Level-9-Karte; mit weiteren bezahlten **17 Splittern** in der Hybridvariante (Forschung + Neuwurf) erreichten diese Decks **Level 9** und teils **zwei verschiedene neue Endgame-Monster** im Inventar.
- Bei weiteren Spielständen war schon vor Investition ein Level-7-Karte verfügbar, die mit **28 Splittern** auf Level-8-Varianten erweitert wurde.
- Wo weniger Splitter vorhanden waren, waren Forschung und Crafting entsprechend begrenzt; die Simulation hat keine Ressourcen hinzugefügt.
- Forschung allein war weniger wirksam als gezieltes Crafting, wenn die vorhandene RNG-Auswahl keinen großen Stufensprung ermöglichte. Das ist ein Hinweis, nach dem ersten Update die Rollenforschung auf *Nützlichkeit statt nur Zufallsvielfalt* zu überprüfen.

## 4. Schlussfolgerung und Roadmap

**Ein zentraler Progressionsengpass ist jetzt reproduzierbar adressiert:** Man kann mit regulär verdienten Splittern gezielt stufengerechte Monster erwerben und VIII merklich konkurrenzfähiger begegnen.

Die stärkere `fusion-precision`-KI würde bei diesen Spieler-Decks dagegen die Siegquote von 16,7 % auf 2,5 % reduzieren. **Nicht aktivieren.** Die bisherige VIII-KI bleibt vorerst Referenz.

**Nächste begrenzte Stufen:**
1. Die Korrekturen an Kartenspürsinn, ACE-Booster-Erweiterung, Crafting- und Forschungs-Save vollständig durch allgemeinen Browser-Smoke bestätigen; ein aktueller Mobile-Canonical-Card-Shell-Test ist getrennt als **failure** protokolliert und noch abzuklären. Nicht alles pauschal als grün melden.
2. Mindestens zwölf voneinander unabhängig startende vollständige Karriereverläufe mit bezahlten Splitterkäufen, unterschiedlichen Rollen und Einkaufsplänen ausprobieren. Ergebnisse nach *Karriereherkunft*, nicht nur nach Anzahl Duelle, vergleichen.
3. Danach die Balance der Splitter-Economy untersuchen: 12 Splitter Forschung kann im Endgame sehr günstig sein; vorsichtiger Preisschritt/Max-Tier-Regeln nur nach Daten. Keine automatische Kostenänderung.
4. Gegner IX und X erst mit tatsächlich erspielten High-Level-Decks trainieren; keine künstlichen Level-10-Spielerstände als echte Karriere verkaufen.

**Änderungsumfang:** `development` enthält korrigierte `assets/game.js`-Quelle-0-Forschung, `assets/expansion.js`-Boosterüberschreibung, neue Tests und aktualisierte v7.8-Workflow-Gates. **`main` und Live-KI unverändert.**
