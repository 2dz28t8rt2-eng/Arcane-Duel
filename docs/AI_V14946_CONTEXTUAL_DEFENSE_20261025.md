# Arcane Duel – v14.9.46: Situationsabhängige Verteidigung und Offensive

## Grundlage
Aus dem abgeschlossenen v14.9.45-Lauf **#40208816331** mit 7.680 Duellen:
- Die vorab fixierte 260-Punkte-Schwelle reduzierte häufige DEF-Wechsel der Tradeoff-KI von 5.521 auf 2.886 und gewann im regulären Benchmark 484 statt 477 von 960 Partien mit Schwelle 115; besonders HOLDOUT 167 statt 155, aber schlechterer direkter H2H gegen starke 2-Ply-Gegner (82 statt 95 von 192).
- Kein neuer Kandidat erfüllte sämtliche globalen Freigabekriterien. Der v14.9.41-Forschungs-Champion `fusion-sequence-2ply` bleibt unverändert.
- Ein **konstanter** Wechsel-Sicherheitsabstand ist möglicherweise ungeeignet, wenn Gegnermacht, eigene legale offensive Möglichkeiten, LP-Verhältnis und Zerfall variieren.

## Vorregistrierte fünf Strategievarianten
1. `guardian-champion` – ursprüngliche eingefrorene Guardian-/Soul-Benchmarkstrategie
2. `fusion-sequence-2ply` – historisch freigegebener 2-Ply-Champion aus v14.9.41
3. `fusion-sequence-tradeoff` – unveränderte 115-Punkte-Schwelle
4. `fusion-sequence-tradeoff-conservative` – unveränderte 260-Punkte-Schwelle
5. **`fusion-sequence-tradeoff-context`** – neue, situationsabhängige 105–285-Schwelle

Der Material-Champion ist weiterhin über die v14.9.45-Ergebnisartefakte dokumentiert, diesmal aber **kein sechster Simulationsarm**; mit fünf Armen bleibt die Vergleichsstichprobe je Arm und die bisherige globale Freigabestruktur identisch. Kein produktiver Spielcode wird geändert.

## Dynamische, ausschließlich aus sichtbaren Zuständen berechnete Schwelle
Grundwert **185** Punkte. Alle Korrekturen sind **vor** den neuen Testdaten festgelegt:
- mindestens zwei eigene grundsätzlich einsatzbereite ATK-Feldkarten: **+40** Punkte, denn Offensivmöglichkeiten sollen nicht leichtfertig aufgegeben werden
- eigene maximale sichtbare ATK ist mindestens 10 % größer als die sichtbare geringste gegnerische Feldverteidigung: **+35** Punkte
- eigene LP unter `max(2500, 1.5 × höchste sichtbare gegnerische ATK)`: **−55** Punkte, damit bei unmittelbarer Bedrohung rechtzeitige Verteidigung wahrscheinlicher wird
- mindestens drei sichtbare gegnerische und höchstens zwei eigene Feldmonster: **−30** Punkte wegen Unterlegenheit des Boards
- nur wenn der symmetrische LP-Zerfall in den Diagnosephasen aktiv ist: eigene LP unter 5.000 **+30** Punkte wegen Zeitdruck, gegnerische LP unter 2.800 **+40** Punkte wegen realistischer Abschlusschance
- Ergebnis hart begrenzt auf **105–285**. Keine willkürliche Anpassung nach HOLDOUT oder während des Laufs.

Die KI berechnet für den unveränderten Feldzustand und jeden über `applyAiAction` tatsächlich legalen Wechsel dieselbe begrenzte Folge: bis zu zwei eigene legale `attack()`-Angriffe sowie bis zu zwei gegnerische sichtbare `attack()`-Antworten. Ein echter Positionswechsel findet nur statt, wenn seine abgeschätzte Verbesserung die dynamisch berechnete Schwelle übertrifft. Alle Simulationen erfolgen auf Kopien; keine Einbeziehung unbekannter Karten, keine simulierten verbotenen Fähigkeiten.

Neu erfasste Kennzahlen `contextMarginChecks`, `contextMarginTotal`, `contextMarginLow`, `contextMarginHigh`, `contextMarginDecay` plus bestehende `defenseChosen`, `defenseTradeoffOwnAttacks`, `defenseMarginRejected`, Sitzpositions- und Rollenprotokolle.

## Experimentdesign – acht Phasen, 7.680 Duelle
- Phasen 0–4: 4.800 gepaarte reguläre Forschungsduelle auf frischen Spiel-/Deckseeds. 1.600 TRAIN, 1.600 VALIDATION und 1.600 unabhängigem HOLDOUT (320 je Datensatz und Arm). Alle fünf Strategien erhalten identische Paarkonstellationen, Sitzpositionen, Decks und Gegnerpopulationen.
- Phase 5: 960 schwere L10-Duelle ohne LP-Zerfall
- Phase 6: **die exakt identischen** 960 L10-Duelle mit symmetrisch aktiviertem LP-Zerfall (beide Seiten). Zerfall-A/B ist nur diagnostisch, niemals Selektions- oder Q-Trainingsinput.
- Phase 7: 960 direkte Level-10-Duelle gegen den tatsächlich spielenden eingefrorenen 2-Ply-Gegner. 192 je Arm, strikt außerhalb des Freigabegates und Q-Trainings.

## Strenge Freigabeschranken, unverändert
Ausschließlich TRAIN + VALIDATION der Stufen 0–4 bestimmen eine mögliche Forschungsfreigabe: mindestens +8 Siege in **beiden** Datensätzen gegenüber der ursprünglichen Guardian-/Soul-Referenz, keine Verschlechterung auf irgendeiner Spielerseite in TRAIN/VALIDATION, keine Crossrole-Subgruppenverschlechterung unter −3, keine negative schwere L10-VALIDATION. Der HOLDOUT wird erst nach der Entscheidung ausgewertet. Die historische Anerkennung des 2-Ply-Forschungschampions ist unabhängig vom Ausgang dieser Replikation und keine Umstellung der produktiven Gegner-KI.

## Q-Lernen
Fortsetzung mit **35 verifizierten historischen TRAIN-only-Archivläufen** (v1511–v1545 einschließlich erfolgreichem Run **#40208816331**), mit neuen Q-Trainings- und Bestätigungsseeds und Ablehnung schlechter bestätigter Updates. Keine historischen HOLDOUT-Beispiele als Q-Trainingslabels und keine Diagnosestufen 5–7.

## Grenzen der Untersuchung
- Die Vorschau umfasst weder einen vollständigen gegnerischen Zug noch unbekannte gegnerische Karten, Beschwörungen oder alle aktiven Fähigkeiten wie Seelenentzug.
- Die Kontextschwelle basiert auf einer festen transparenten Funktion, nicht auf einem neuronalen Lernmodell. Ein mögliches positives Ergebnis ist in unabhängigem HOLDOUT und späteren Läufen weiter zu bestätigen.
- Der v14.9.38-Material-Champion fehlt bewusst als Arm dieses fünfarmigen Studienprotokolls, bleibt aber historisch dokumentiert.

## Implementierung im development-Branch
- `tests/ai-v1546-contextual-defense-selfplay.cjs`
- `tests/ai-v1546-contextual-defense-aggregate.cjs`
- `tests/ai-v1546-history.cjs`
- `tests/ai-v1546-Q.cjs`
- `.github/workflows/ai-v14946-contextual-defense.yml`

GitHub-Actions-Lauf: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40213192711
