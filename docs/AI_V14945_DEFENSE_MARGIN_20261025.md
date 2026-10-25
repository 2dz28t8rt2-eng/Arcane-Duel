# Arcane Duel AI Research v14.9.45 – konservative Verteidigungsschwelle

## Ausgangsbefund
Korrigierter, erfolgreich abgeschlossener v14.9.44-Forschungslauf #40195101551:
- v14.9.41 2-Ply-Champion reproduzierte die strengen Freigabekriterien (+13 TRAIN, +20 VALIDATION, +2 HOLDOUT gegenüber Guardian-/Soul-Referenz).
- Neue tatsächliche Angriff-vs-Verteidigung-Bewertung (115 Punkte Mindestvorsprung) erzielte 475 statt 472 Siege der älteren reinen Verteidigung; gegenüber 2-Ply jedoch 9 weniger.
- Direkt gegen eingefrorene 2-Ply-KI gewann die neue Tradeoff-Variante 103/192 gegenüber 98/192 für 2-Ply, geringe Stichprobe ohne Freigaberecht.
- In 192 exakt gepaarten Zerfall-A/B-Duellen veränderte sich die Tradeoff-Siegzahl von 86 (ohne) auf 95 (mit Zerfall). Auch dies ist rein diagnostisch.
- Bei 24.011 Abwägungen und 34.976 simulierten eigenen Angriffen wurden 5.363 Positionswechsel gewählt. Hypothese: Die bisherige feste 115-Punkte-Schwelle lässt zu viele taktisch ungünstige Positionswechsel zu.

## Exakt 5 Strategiearme, vorab definiert
1. `guardian-champion`: unveränderte ursprüngliche Guardian-/Soul-Referenz.
2. `fusion-postreply-material`: unveränderter historischer Material-Champion.
3. `fusion-sequence-2ply`: unveränderter in v14.9.41 historisch freigegebener Forschungschampion (in v14.9.44 erneut bestätigt).
4. `fusion-sequence-tradeoff`: unveränderte Angriff-gegen-Verteidigung-Strategie aus v14.9.44 (Mindestvorsprung **115** Utility-Punkte).
5. `fusion-sequence-tradeoff-conservative`: dieselbe Strategie **ausschließlich** mit fester Mindestverbesserung **260** Utility-Punkte vor einem legalen Positionswechsel.

Es wird keine andere Rollen- oder Angriffskonstante gezielt für den neuen Kandidaten modifiziert, und keine alternative Schwelle nach Betrachtung der neuen Validierung oder des Holdouts ausgewählt. Dies ist ein einzelner, vorregistrierter Eingriff, kein Grid Search.

## Tatsächliche, begrenzte Spielplanung
In der eigenen Positionierungs-/Guard-Phase werden nur legale Wechsel einer noch angriffsfähigen Karte von ATK auf DEF betrachtet (keine ausstehende Fusion). Für den unveränderten Zustand und für jede legal ausgeführte Wechselalternative wird auf einer Kopie des Spiels derselbe Horizont vorausberechnet:
- bis zu 2 eigene durch die Engine legale Angriffe, danach
- bis zu 2 sichtbare gegnerische legale Angriffe.
Der Positionswechsel wird im echten Spiel nur ausgeführt, wenn sein Bewertungsvorsprung **über 260** (gegenüber 115 beim Kontrollarm) liegt. Kandidaten mit einer Verbesserung nur im Intervall 115–260 werden gezählt, nicht bevorzugt.

Neue Telemetrie:
- `defenseMarginChecks`: tatsächlich gestartete Abwägungen mit neuer Schwelle;
- `defenseMarginRejected`: bei konservativerer Schwelle verworfene, früher möglicherweise bevorzugte Wechsel;
- `defenseMarginAccepted`: unter 260 tatsächlich ausgewählte legale defensive Wechsel.
Bisherige Vergleichstelemetrie `defenseProbes`, `defenseTradeoffOwnAttacks`, `defenseTradeoffSwitches` und unzulässige Wechsel je Spielerseite bleiben erhalten. Ein Zähler >0 belegt Ausführung, nicht automatisch strategischen Nutzen.

## 8 Phasen, zusammen 7.680 simulierte Duelle
- Phasen 0–4: 4.800 Haupttests (960 je Arm), auf **frischen** Deck-/Spielseeds und denselben festen Gegnerpopulationen, die für die historische Guardian-/Soul-Freigabe verwendet wurden. 1.600 TRAIN, 1.600 VALIDATION und 1.600 HOLDOUT, jeweils 320 Spiele pro Strategie und Split.
- Phase 5: 960 schwierigste Level-10-Duelle ohne symmetrischen LP-Zerfall.
- Phase 6: exakt dieselben Level-10-Paarungen mit symmetrischem LP-Zerfall. Identische Seed-, Deck-, Sitzpositions-, Gegner-, Szenario- und Startspielerbedingungen geprüft. 5–6 dienen **nur der A/B-Diagnose**, nicht dem Training oder der Freigabe.
- Phase 7: 960 neue Level-10-Duelle gegen die auf der Gegenseite tatsächlich spielende eingefrorene v14.9.41 2-Ply-Forschungsstrategie (192 je Kandidat). Dies ist ein **zusätzlicher H2H-Vergleich**, nie Teil der Freigabe- oder Q-Optimierung.

## Unveränderte globale Freigabe
Ausschließlich TRAIN und VALIDATION aus Phasen 0–4: Mindestens +8 Siege in beiden Splits gegenüber dem historischen Guardian-/Soul-Champion; keine Verschlechterung auf einer der beiden Spielerseiten in TRAIN oder VALIDATION; keine vorregistrierte Cross-Role-Subgruppenverschlechterung unter -3; kein negativer schwierigster Level-10-VALIDATION-Unterschied. HOLDOUT-Daten sind vor der globalen Auswahl versiegelt. Ein guter direkter H2H- oder Zerfall-Befund ist **kein** Grund zur Umgehung dieser Kriterien.

Der v14.9.41 2-Ply-Forschungs-Champion bleibt als vorher freigegeben dokumentiert, unabhängig von der neuen Replikation. Keine produktive Spiel-KI, kein `main`, keine Gameplay-Regeleinstellungen verändert.

## Q-Learning
34 erfolgreich abgeschlossene historische TRAIN-only-Archive v1511 bis v1544 werden wiederhergestellt; für die unmittelbare Fortsetzung wird ausschließlich das überprüfte erfolgreiche v14.9.44-Artefakt aus **GitHub-Lauf #40195101551** verwendet (nicht der frühere fehlgeschlagene #40193401889). Separate neue Q-Train-/Validierungs-/Bestätigungsseeds; negatives Q-Lernen wird nicht angenommen. Weder historischer HOLDOUT noch Diagnosephasen werden als Q-Trainingslabel verwendet.

## Grenzen
Die klonbasierte Angriffs-/Verteidigungsbewertung ist ein beschränkter Angriffshorizont und kein vollständiger Gegner-Turn, kein minimax über versteckte Hände, kein eigener Skill-/Seelenentzug-Folgezugsplan. Die vorab festgelegte Schwelle 260 wurde ohne Kenntnis der neuen Benchmark-Ergebnisse gewählt. Übertragbarkeit auf die produktive Gegner-KI muss getrennt belegt werden.

## Implementierung auf development
- `tests/ai-v1545-defense-margin-selfplay.cjs`
- `tests/ai-v1545-defense-margin-aggregate.cjs`
- `tests/ai-v1545-history.cjs`
- `tests/ai-v1545-Q.cjs`
- `.github/workflows/ai-v14945-defense-margin.yml`

## GitHub Actions
https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40208816331
