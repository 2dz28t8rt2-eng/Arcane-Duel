# Arcane Duel – KI-Akademie v13.7: Mechanik-Lehrplan, Champion-Liga und historische Gegenproben

**Stand:** 21.10.2026 · **Branch:** `development` · **Bereich:** Offline-Training/Forschung; keine aktive NPC- oder Balanceänderung.

## Ziel
Eine regelkundige, anpassungsfähige KI für das **gesamte Spiel**, nicht ein nur für IX/X optimierter Duellant. Die KI soll alle legalen Optionen kennen, kurzfristige Konsequenzen vergleichen, langfristige Fusionsketten vorbereiten und aus alten Partien nachvollziehbare Verbesserungen ableiten.

## Ausgangszustand – historisch belegbar
- `models/ai-selfplay-v136.json`: **1.920** durchlaufene Trainingspartien, **120** archivierte Replay-*Gradienten*, 15 Entscheidungsgewichte. Letzter **akzeptierter** Champion stammte aus einer früheren v13.5-Generation.
- v13.6, Run [#39637833422](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39637833422): 3 × 400 Trainingsduelle; 3 × 630 unabhängige Vergleiche; alle neuen Kandidaten **nicht** übernommen.
- Archivierte Ergebnisstatistiken aus `arcane-v136-extensive-1200-episode-selfplay` eignen sich zur **Korrelation und Priorisierung** (Boardkontrolle, Rollen, X, Fusion), aber **nicht** zur Rekonstruktion alternativer Entscheidungen: der bisherige Replay-Eintrag speichert nur `grad`, Sieger, Gegnerklasse, Turnierstufe und Aktionszahl. Er enthält **nicht** Spielsituation, legale Alternativen, Seed-/Decknachweis oder vollständige Aktionsfolge.

## Neue Lernarchitektur

### Stufe A – Regel- und Mechanik-Akademie
Jede Lektion ermittelt mit der echten Engine die legalen Optionen, misst unmittelbare Auswirkungen und testet separat, ob sie später im Duell tatsächlich helfen.

| Lehrfach | Kompetenz | Prüfsignal |
|---|---|---|
| Beschwörung, Angriff, DEF | Legale Züge, Schaden, Schutz, Positionen | illegale Aktionen = 0; Board-/LP-Entwicklung |
| Hand- und Feldfusionen | Materialkosten, erreichbares Ziel, Qualitäts-/Pokerboni | legaler Fusionswert, verbleibende Hand, spätere Angriffe |
| Predator, Wächter, Seelenzehrer | Angriffsfenster, Gegenschlag, Soul-Drain, Heilung | echte ATK/DEF-/LP-Änderung nach Engine |
| Allrounder, Resonator, Resonanz | Erbe, Qualitätswurf, Mehrheitslosigkeit | tatsächliche Qualitäts-/Resonanzwirkung |
| ACE und Bosskontrolle | ACE-Zugriff, ACE-Konter und Boardprioritäten | Kontrolle der sichtbaren ACE-Bedrohung |
| Zerfall und Mehrzugplanung | Wert eines Monsters in 1–3 Folgerunden | echte Kartenwerte nach Rundenwechsel |
| LV1-Quest/Spezialfähigkeiten | Geisterslots, LV1-Fusion, Lumira (nur bei freigeschalteten Voraussetzungen) | regelkonforme Spezialaktionen |
| Deckbau, Booster, Schmiede, Ökonomie | legale Progression und Ressourcenmanagement | echte erworbene Ressourcen; keine Gratis-Karten |

**Reifegrad:** v13.7 startet mit beschränktem Taktik-/Fusions-Lehrpilot und Historienanalyse. Die übrigen Module werden **nicht** als fertig oder trainiert ausgegeben, bevor echte Engineprüfungen existieren.

### Stufe B – Strategie-Liga
- Ein eingefrorener Champion, ältere archivierte Gewichtungen und mehrere *unterschiedliche* Spezialisierungen (Offensive, Defensive, Fusion) bilden den Gegnerpool.
- Identische Decks und Startbedingungen werden **für beide Sitze** verglichen; danach zusätzlich verschiedenartige und legitime Stufendecks.
- Ein Kandidat wird nur auf **unbenutzten** Seeds/Decks mit positiver Sieg- und Mechanikbilanz akzeptiert. Vergangenes Champion-Modell nie bei Fehlschlag überschreiben; Auswertung nach Stufe/Deckrolle/Startplatz.
- Nur bei unabhängigen, ausreichend großen Bestätigungstests wird ein Modell für einen **separat freizugebenden** Produktions-PvE-Adapter vorgemerkt.

### Stufe C – Historische Fehleranalyse
**Bisher vorhandene Daten:** v13.5/v13.6-Aggregate, Spielstile, Startbedingungen und Replay-Gradienten; *keine* vollständigen historischen Zustände.

**Neue Datenfelder für künftige Duelle:**
`rulesHash/commit`, `deckFingerprint`, `seed`, `starter`, `seat`, `turn`, `phase`, `publicBoard`, `ownHand`, `legalActions`, `selectedAction`, `stateBefore`, `stateAfter`, `terminalResult`. **Keine gegnerische verdeckte Hand oder Nachziehfolge an das Entscheidungsmodell übergeben.** Original-RNG und Deckreihenfolge dürfen nur in abgeschotteten Experimenten für reproduzierbare Vergleiche genutzt werden.

**Historische Auswertung:** getrennte Tabellen für Mirror-/Cross-Siege, IX/X, erste Angriffsbereitschaft, Deckrolle, Fusion-/ACE-Effekte, Regelverletzungen und Fehlerkategorien; Verlauf über Generationen.

**Gegenprobe („Was wäre besser gewesen?“):** Von einem **reproduzierten identischen Startzustand** ein echtes Duell zunächst mit Aktion A, dann mit anderer *legaler* Aktion B unter gleichen Anfangsbedingungen durchspielen. Abzweigepunkt und Zustand per Fingerabdruck prüfen; gleiche Start-RNG, danach naturgemäß unterschiedliche Zufallsverbräuche möglich. Immer beide realen Ergebnisse nennen; eine einzelne Abzweigung ist noch kein kausaler Beweis oder allgemeingültige Regel. Für belastbare Regeln mehrere Seeds, andere Decks, beide Seiten und unabhängige Kontrollspiele verwenden.

### Stufe D – Trainings- und Promotionsgates
1. **Regeltreue:** keine ungültigen Entscheidungen, keine verdeckten Informationen.
2. **Mechanikabdeckung:** jede Lektion dokumentiert tatsächlich verwendete, überprüfte Mechaniken; Nichtabdeckung klar markieren.
3. **Train vs. Holdout:** keine Deck-/Seed-Überlappung; Gewichte nur am Trainset verändern.
4. **Championliga:** mindestens 50 % + definierte statistische Sicherheitsmarge gegen eingefrorenen Champion bei verschiedenen Decktypen; Schwächen gegen einzelne Rollen gesondert berichten.
5. **IX/X** bleiben ein Benchmark, **nicht** der einzige Trainingstreiber.
6. **Persistenz:** Modell, historische Diagnose, rekonstruierbare Situationen und Berichte versionieren; bei Fehlschlag den Champion schützen.

## Geplante Versionen
- **v13.7 Pilot:** Alte Aggregate und Replay-Grenzen automatisch prüfen, echte Paare von legalen Handlungsalternativen mit identischem Duellbeginn vergleichen, Strategie-Liga starten, Kandidaten/Fehlerbericht archivieren. Spiel bleibt unverändert.
- **v13.8:** Vollständige Zustands-/Aktionsprotokolle und reproduzierbares Action-Replay; gezielte Mechanik-Lehreinheiten je Rolle und Poker-/Resonanz-Mechanik.
- **v13.9:** 2–3-Zug-Lookahead mit exakter Engine-Auflösung und Unsicherheitsbehandlung statt bloßer ATK-Schätzung; Strategie-Liga aus historischen Modellen.
- **v14+:** Karriere-Ökonomie, Deckbau, spezielle Quests und kontrollierte Integration in produktive NPC-KI **nach** unabhaengiger QA und Freigabe.

## Grundsatz
**Mehr simulierte Spiele sind nicht gleich mehr Intelligenz.** Die KI soll alte Misserfolge erklären, regelkonforme Alternativen erneut prüfen, die Erkenntnisse über viele voneinander unabhängige Spiele validieren und nur belastbare Verbesserung als neues Wissen dauerhaft übernehmen.
