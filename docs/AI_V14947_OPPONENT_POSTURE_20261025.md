# Arcane Duel KI-Forschung v14.9.47 – legale gegnerische Positionsantworten

## Begründung
Der erfolgreiche abgeschlossene v14.9.46-Forschungsworkflow #40213192711 hatte 7.680 Duelle. Die situationsabhängige Angriffs-/Verteidigungs-KI erreichte 495/960 Siege, gleich viel wie die 2-Ply-KI. Sie scheiterte jedoch knapp an der globalen Freigabe (Validierung, Spielerseite 2: 80 statt 81 Siege der ursprünglichen Guardian-/Soul-Referenz), zeigte im zusätzlichen schweren H2H-Test gegen den eingefrorenen 2-Ply-Gegner keinen robusten Vorsprung (88/192 statt 92/192) und schloss im Holdout knapp schwächer ab.

Zwei der drei geschützten Q-Lernkandidaten wurden im vorherigen Forschungsworkflow akzeptiert; die Historie der erfolgreichen 36 Läufe bildet die Ausgangsbasis. Diese Kandidaten dürfen nicht ohne unabhängige weitere Tests für die produktive Gegner-KI übernommen werden.

## Gezielte Hypothese
Die bisherigen Entscheidungsprognosen simulieren legale eigene Angriffe und sichtbare gegnerische Angriffe, aber **nicht**, ob der Gegner während **seines nächsten eigenen Zuges**, vor dessen Angriffen, eine legale Feldkarte von ATK auf DEF dreht. Besonders Wächter-/Seelenzehrer-Rollen könnten davon profitieren. Wir testen, ob eine tatsächliche Simulation dieser legalen gegnerischen Folgestellung zu robusteren Entscheidungen auf beiden Spielerseiten führt.

## Fünf vorab festgelegte Forschungsarme
1. `guardian-champion`: unveränderte historische Guardian-/Soul-Benchmarkstrategie für das globale Freigabegate.
2. `fusion-sequence-2ply`: unveränderter historisch freigegebener v14.9.41 Forschungs-Champion.
3. `fusion-sequence-tradeoff-context`: unveränderte kontextabhängige Strategie aus v14.9.46 (105–285 defensive Utility-Punkte).
4. `fusion-sequence-context-enemy-posture`: dieselbe Kontext-KI, zusätzlich beschränkte Evaluierung legaler **gegnerischer ATK-zu-DEF-Wechsel im nächsten Gegnerzug**.
5. `fusion-sequence-context-guardian-posture`: identische Vorschau, wobei die alternativen gegnerischen DEF-Wechsel **nur bei sichtbaren Wächter- oder Seelenzehrer-Feldkarten** evaluiert werden.

Die alte feste Schwelle 115/260 bleibt als historische Vergleichsserie dokumentiert; beide werden in diesem fünfarmigen Lauf nicht erneut als separate Strategie getestet. Das sichert 960 gepaarte Primärduelle pro Arm.

## Legale Abfolge der neuen Gegnerprognose
Für jede Bewertung werden zunächst auf einem Klon wie bisher höchstens zwei eigene `attack()`-Aktionen mit den tatsächlichen Spiel-APIs legal simuliert. Anschließend wird der nächste Gegnerzug auf dem Klon aufgerufen (gegnerischer aktiver Spieler und Zugnummer erhöht, nachgeführte Angriffsflags).

Neben der bisherigen Referenz ohne gegnerischen Positionswechsel werden bis zu **drei sichtbare gegnerische ATK-Feldpositionen** als hypothetische DEF-Wechsel geprüft. Für jeden Kandidaten darf die Engine nur in der **gegnerischen Positionsphase** `baseApply({type:'switch',idx})` legal ausführen. Illegale Kandidaten werden verworfen. Danach werden wie bisher höchstens zwei sichtbare gegnerische legale `attack()`-Aktionen geprüft.

Die ausgewählte gegnerische Antwort ist die **schlechteste für uns** unter der unveränderten Referenz und den legalen neuen Positionsantworten. Die eigene Stellung wird wie zuvor nur geändert, wenn die eigene klonbasierte Verteidigungsentscheidung mit der bereits v14.9.46 vorregistrierten, sichtbaren kontextabhängigen 105–285-Schwelle den unveränderten eigenen Zustand übertrifft.

**Keine Sonderfähigkeiten oder Kartenwechsel während eines falschen Spielzuges werden erfunden.** Diese begrenzte Bewertungsvariante simuliert weder eine vollständige Gegnerzug-Reihenfolge mit Handkarten/Beschwörungen noch aktive Seelenentzug-Skills; das ist eine bewusste Einschränkung, nicht als vollständige KI-Zugplanung zu interpretieren.

## Neue Telemetrie
- `enemyPostureSearches`: Evaluierungen mit vorgeschalteter Suche nach gegnerischen legalen nächstzügigen Positionswechseln
- `enemyPostureCandidates`: höchstens drei gegnerische Feldpositionen pro Suchaufruf geprüft
- `enemyPostureLegal`: tatsächlich durch die Engine legitim akzeptierte simulierte gegnerische DEF-Wechsel
- `enemyPostureWorse`: wie oft eine simulierte gegnerische Stellung eine schlechtere eigene Bewertung erzeugt
- `enemyPostureGuardianSearches`: wie oft eine fokussierte Wächter-/Seelenzehrer-Suche gestartet wurde

## Studiendesign und Schutz vor Überanpassung
- **Phasen 0–4:** 4.800 reguläre Self-Play-Duelle mit fünf KI-Varianten, frischen gepaarten Deck-/Spielseeds, identischen Deck-/Start-/Sitzpositionsbedingungen und denselben historischen Guardian-/Soul- bzw. Balanced-Gegnerpopulationen. 1.600 TRAIN, 1.600 VALIDATION, 1.600 versiegelte HOLDOUT-Fälle (320 pro Kandidat/Split).
- **Phase 5:** 960 zusätzliche harte L10-Duelle mit symmetrischem LP-Zerfall AUS.
- **Phase 6:** Exakt dieselben 960 Duellkonstellationen mit symmetrischem LP-Zerfall AN. Rein diagnostisch, nie freigaberelevant.
- **Phase 7:** 960 zusätzliche Duelle gegen eine **tatsächlich spielende, eingefrorene 2-Ply-Forschungs-KI** auf der Gegenseite (192 je Variante). Rein diagnostisch, kein Q-Trainingsinput und keine direkte Freigabebasis.

Die globale Forschungsfreigabe bleibt unverändert und nutzt nur die vorregistrierten TRAIN-/VALIDATION-Daten aus Phasen 0–4. Mindestens +8 Siege je Split gegenüber der Guardian-/Soul-Referenz, keine Verschlechterung auf Spielerseite 1 oder 2 in Training/Validierung, keine Cross-Role-Gruppe unter −3 und kein Rückschritt im schwierigen Level-10-Validierungsblock. Erst danach wird der Holdout eingesehen. Die ältere historische 2-Ply-Freigabe bleibt als solche erhalten, auch wenn sie in neuen Testläufen nicht immer revalidiert.

## Geschütztes Q-Learning
Verwendet 36 erfolgreich abgeschlossene historische **TRAIN-only**-Archive v1511–v1546 einschließlich #40213192711. Fortsetzung der akzeptierten v14.9.46-Q-Modelle als Vorwissen. Neue Q-Trainings-, Bestätigungs- und Holdoutseeds. Historische oder neue HOLDOUT-Spiele sowie Diagnosestufen 5–7 werden nicht als Q-Trainingslabels verwendet. Schlechter bestätigte Q-Updates werden nicht angenommen.

## Dateien
- `tests/ai-v1547-opponent-posture-selfplay.cjs`
- `tests/ai-v1547-opponent-posture-aggregate.cjs`
- `tests/ai-v1547-history.cjs`
- `tests/ai-v1547-Q.cjs`
- `.github/workflows/ai-v14947-opponent-posture.yml`

Produktive Gegner-KI und `main` bleiben unverändert.

GitHub-Lauf: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40216471016
