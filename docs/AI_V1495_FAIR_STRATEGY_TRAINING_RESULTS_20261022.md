# Arcane Duel v14.9.5 – Prüfbericht: fairer KI-Strategielauf und aktive Seelenzehrer

**22.10.2026** · `development` · GitHub Actions [#39771472698](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39771472698) · **SUCCESS** · Prüf-Commit `ee13c6e9b4e3980c1ad42a9830a9c7c9f6b37c90`.

[Alle Originaldaten (360 Mirror-Matches, 1.440 Training, 288 unabhängige Testduelle)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39771472698/artifacts/12422203803).

## Gesamturteil

**Technische Prüfungen bestanden, alle sechs Curriculum-Stufen fertig, deutlicher Fortschritt der Strategie-KI gegenüber der alten `balanced`-Policy. Keine automatische Produktion-Promotion.**

- **1.440 Trainingsduelle** (vordefinierte Profile, Trainingsneubewertung von Replay-Updates)
- **288 disjunkte Holdout-Duelle** auf 12 anderen, gültig generierten Decks je Stufe, beide Starterrichtungen und beide KI-Plätze
- Zusätzlich **360 Regel- und Sitz-Spiegelduelle** (alte Regeln vs. aktivierter Symmetrie-Modus; `balanced` vs. `balanced` und strategisch vs. strategisch)
- Zusammen **2.088 simulierte Duelle**; davon 261/288 gewonnene Holdout-Duelle der Teststrategie (**90,625 % aller Matches**, 261/287 der entschiedenen = 90,94 %; eine Simulation ohne Sieger)
- Forschungs-KI **131 von 144** Siegen auf Spielerplatz 0 und **130 von 144** auf Spielerplatz 1. Auch die Starterzuordnung ist ausgeglichen: 129 Kandidatensiege bei Starter 0, 132 bei Starter 1.
- **5.793 tatsächlich andere KI-Aktionsauswahlen** gegenüber der eingefrorenen `balanced`-Referenz sowie **7.859 Board-Neubewertungen**
- **1.119 aktive Soul-Aktionen** im unabhängigen Holdout, davon **570** durch Sitz 0 und **549** durch Sitz 1.
- **0 ungültige Aktionen**, **0 vorzeitige Soul-Effekte**, **0 Angriffe vor dem jeweiligen Kampfzug**.
- **13/48** Spiele in der 10-Züge-Stufe begannen mit zwei komplett belegten Fünferfeldern; dieses Ziel ist möglich, aber keineswegs garantiert.

## Stufenvergleich

| Aufbauzüge ohne Angriff | Ausgewähltes KI-Forschungsprofil | Siege/48 | Soul-Aktivaktionen auf Platz 0 / 1 | Platz-0-/Platz-1-Kandidatensiege |
|---:|---|---:|---:|---:|
| 10 | synergy | 37 | 115 / 103 | 18 / 19 |
| 8 | forecast | 44 | 109 / 101 | 21 / 23 |
| 6 | replay-explore | 42 | 99 / 92 | 23 / 19 |
| 4 | replay-explore | 44 | 86 / 81 | 22 / 22 |
| 2 | replay-explore | 48 | 92 / 97 | 24 / 24 |
| 0 | forecast | 46 | 69 / 75 | 23 / 23 |
| **Gesamt** | – | **261/288** | **570 / 549** | **131 / 130** |

Der Fall `0` spiegelt nur das **normale Angriffstiming (Angriffe ab globalem Zug 2)**. Das Forschungsspiel deaktiviert weiterhin den Arena-LP-Zerfall und reduziert Seiten-Progressionsboni; es ist **nicht die komplett unveränderte Live-Karriere**.

**Kein direkter kausaler Vorher/Nachher-Vergleich:** Im v14.9.3-Lauf wurden 231/288 bzw. in einem Zwischenlauf 237/288 Siege erzielt. Die Neufassung nutzt andere Regeln, aktive Soul-Aktionen sowie andere randomisierte Szenarien. Eine höhere aggregierte Zahl beweist allein keine entsprechende reine Lernsteigerung.

## Wirkung der Fairness-Anpassungen

Im eingefrorenen allgemeinen `balanced`-Mirror über je 90 Matches:

| Forschungsbedingungen | Sieger Platz 0 | Sieger Platz 1 | Kein Sieger |
|---|---:|---:|---:|
| Ursprüngliche PvE-Seitenregeln | 77 | 11 | 2 |
| Symmetrisch angeglichene Forschungsregeln | 51 | 38 | 1 |

Im Strategie-vs.-Strategie-Selbstmirror über je 90 Matches:

| Forschungsbedingungen | Sieger Platz 0 | Sieger Platz 1 | Kein Sieger |
|---|---:|---:|---:|
| Ursprüngliche PvE-Seitenregeln | 48 | 37 | 5 |
| Symmetrisch angeglichene Forschungsregeln | 47 | 37 | 6 |

Wichtige Interpretation: **Der grobe systemische Sitzplatz-0-Vorteil der alten Referenz ist stark reduziert**, aber eine perfekte Platzparität ist **nicht nachgewiesen**. Restunterschiede können Zufall, Zuginitiative, Deck-/Seedkopplung oder noch nicht isolierte Seiteneffekte enthalten. Die v14.9.5-Kandidatensitzverteilung von 131/130 spricht für eine deutlich geringere praktische Verzerrung in dieser begrenzten Testmatrix.

Die in `docs/AI_V1495_FAIR_STRATEGY_RESEARCH_20261022.md` beschriebenen Forschungsänderungen betreffen insbesondere fusionierte Rollen-/Pokerqualität, Allrounder-Ladungen, Startschilde, Meta-Upgraderänge ab dem Erzeugen einer Karte, Monsterzerfall, Angriffsermüdung und **identische passive wie aktive Soul-Aktionen**. Außerhalb des opt-in-Modus bleiben die alten Karriere-Sonderregeln bestehen.

## Ergebnisse nach Deckarchetyp (nur unabhängiger Holdout)

| Archetyp | Kandidatensiege | Timeouts |
|---|---:|---:|
| Wächter/Seelenzehrer gemischt | 89/96 | 0 |
| Wächter | 47/48 | 1 |
| Seelenzehrer | 21/24 | 0 |
| Predator | **15/24** | 0 |
| Fusion | 22/24 | 0 |
| Allrounder | 23/24 | 0 |
| Tempo | 21/24 | 0 |
| Hybrid | 23/24 | 0 |

Predator ist weiterhin relativ am schwächsten: Er benötigt bessere Einschätzung mehrzügiger Board- und DEF-Gegnerantworten. Siegquoten verschiedener konstruierten Decktypen sind **keine kontrollierten Matchup-Werte** derselben Kartenressourcen.

## Hat Replay-Lernen funktioniert?

**Nur als Evaluationsmechanismus, nicht als erfolgreiche Koeffizienten-Promotion:** In allen sechs Stufen wurde ein gespeichertes Forschungsprofil aufgrund der **Trainingsduelle** ausgewählt. Es wurden mehrere tausend Verlaufsergebnisse zugewiesen und neue Replay-Gewichte vorgeschlagen. **0 von 6 reinen Outcome-Credit-Koeffizientenupdates bestanden den erneuten Trainingsvergleich.**

Eine siegreiche Partie liefert keinen kausalen Beleg, welche einzelne Aktion zum Sieg führte. Aktuelle Forschungsprofile sind deterministische Regeln mit gewichteter Priorität und Attack-Simulation, **keine neuronal oder tabellarisch durch Duellreplays selbständig trainierte Policy**. Nächste Forschung: legale Alternativen aus derselben Position mit konkreten, begrenzten Simulationshorizonten vergleichen, anschließend die jeweils erwarteten Board-/LP-Veränderungen als direkteres Trainingssignal verwenden.

## Verifizierte und offene Grenzen

1. Der neue `soul-raid`-/`soul-discharge`-KI-Aktionspfad existiert im Forschungsmodus für beide Plätze. Die normalen UI-gebundenen Fähigkeiten im Produktivspiel bleiben separat.
2. Die Sitz-Symmetrie gilt **nicht automatisch** für Spezialduelle, Fanatiker-/Questmechaniken, Boss-Skripte oder Online-PvP; solche absichtlich unterschiedlichen Spiele wurden nicht global vereinheitlicht.
3. Die Ausbildung verwendet eingefrorene `balanced`-KI als Hauptvergleich, **noch keine volle Opponent-League** gegen unterschiedliche starke eigenständige Strategien.
4. Die Holdout-Szenarien sind zwar hinsichtlich Deck-Fingerprints getrennt, aber werden bei Startpositionen und Policy-Sitzen bewusst gespiegelt, also statistisch korreliert.
5. Die 48/48 Siege bei zwei Aufbauzügen sind kein belastbarer Garant der Generalisierung, sondern ein kleines kontrolliertes Szenariosample.

### Nächste Freigabehürde

Für weitere Verbesserung und jede potenzielle Live-Promotion zuerst die verbliebenen einzelnen Seiteneffekte in `balanced`-Mirror-Aktionsprotokollen isolieren, Predator-Zugtiefe prüfen, lernbare Alternativaktionsergebnisse trainieren und eine unabhängige Prüfung **mit vollständigen normalen PvE-Regeln und Gegner-Liga** durchführen.

**Stand:** Forschungszweig grün ✅ · neuer Trainingslauf grün ✅ · aktive Soul-Fähigkeiten auf beiden KI-Seiten ✅ · vollständige universelle Parität / Live-KI-Promotion **nicht behauptet**.
