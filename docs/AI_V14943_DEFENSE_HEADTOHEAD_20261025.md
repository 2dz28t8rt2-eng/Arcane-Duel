# Arcane Duel KI-Forschung v14.9.43 – legale Positionsverteidigung und direkter 2-Ply-Vergleich

## Anlass / geschützte Erkenntnisse
Der abgeschlossene Forschungsworkflow v14.9.42 (#40174047771) zeigte nur einen einzigen, negativen Ergebniswechsel durch die vertiefte gegnerische Angriffssuche. Der frühere 2-Ply-Forschungschampion v14.9.41 (#40137913164) blieb als historisch freigegebene Forschungsstrategie erhalten, konnte die globalen Freigabekriterien auf den neuen v14.9.42-Decks aber nicht reproduzieren. Die Schwachpunkte umfassen schwieriges Level 10 und wechselnde Vor- und Nachteile auf beiden Spielerpositionen.

**v14.9.43 untersucht erstmals real ausführbare eigene Positionsentscheidungen** statt einer rein hypothetischen Verbesserung der Fusionsbewertung und vergleicht die neuen Kandidaten zusätzlich unmittelbar mit einem Gegner, der die eingefrorene 2-Ply-Strategie spielt.

## Fünf vorab definierte Strategievarianten
1. `guardian-champion`: eingefrorene Guardian-/Soul-Benchmarkstrategie v14.9.28.
2. `fusion-postreply-material`: Material-Forschungsstrategie, unverändert.
3. `fusion-sequence-2ply`: historisch freigegebene Forschungsstrategie v14.9.41, unverändert.
4. `fusion-sequence-defense`: dieselbe 2-Ply-Strategie mit einer zusätzlichen **legalen eigenen Positionsentscheidung**, die höchstens zwei nachfolgende sichtbare gegnerische Angriffe einkalkuliert.
5. `fusion-sequence-defense-guardian`: diese Positionsprüfung nur dann, wenn der Gegner einen **sichtbaren Wächter oder Seelenzehrer** auf dem Feld hat.

Keiner der bisherigen Grundboni oder Strategiekonstanten wurde für die neue Studie nachträglich anhand des Holdouts optimiert.

## Wie die tatsächliche Verteidigungsentscheidung geprüft wird
Die zusätzliche Kandidatenprüfung findet nur während der vorhandenen eigenen `positions`-/`guard`-Phase statt. Voraussetzung: keine ausstehende Fusionsplatzierung, mindestens ein sichtbares gegnerisches Feldmonster und eine eigene bislang nicht angegriffene oder bereits gewechselte Angriffskarte.

Für bis zu fünf Feldpositionen wird auf einem **geklonten echten Spielzustand** geprüft, ob die originale Spiel-API `applyAiAction({type:'switch',idx})` den Wechsel rechtlich akzeptiert. Nur erfolgreiche echte Wechsel zählen als legale Kandidaten.

Anschließend wird die Gegnerseite auf dem Klon aktiviert; die vorhandene `attackPlan`-Logik darf bis zu zwei echte Angriffe über `attack` ausführen. Ein solcher Wechsel wird nur dann *tatsächlich in der Partie ausgeführt*, wenn diese geschützte Bewertung den unveränderten Ausgangszustand hinreichend übertrifft (Puffer mindestens 115 Bewertungseinheiten plus ein vorsichtiges Kostenmaß für aufgegebene Angriffsstärke).

Die Suche erfindet ausdrücklich keine neuen Fähigkeitsparameter. **Aktiver Seelenentzug und sonstige Spezialfähigkeiten werden hier noch nicht als eigenständige Folgeaktionen simuliert**. Dieser Test isoliert legale Positionswechsel und ihre unmittelbare Konsequenz bei Angriffen.

Zähler: `defenseProbes`, `defenseLegalSwitches`, `defenseChosen`, `defenseReplyAttacks`. Es wird nicht behauptet, dass die gewählte Verteidigungsaktion besser ist, bevor die Siege durch echte Self-Play-Spiele bestätigt sind.

## Saubere Trennung von Freigabe und zusätzlichen Diagnosen
- **Phasen 0–4:** 4.800 standardisierte, neue gepaarte Self-Play-Partien, fünf Studienvarianten, die bekannten fünf Deckkategorien. Aufgeteilt in 1.600 TRAIN, 1.600 VALIDATION und 1.600 verschlossene HOLDOUT-Partien. Identische Seeds/Decks/Startpositionen pro Kandidat. Gegner: historisch eingefrorene Guardian-/Soul- und Balanced-Varianten. Symmetrischer LP-Zerfall ausgeschaltet wie in den bisherigen Kernstudien.
- **Phasen 5–6:** 960 identische schwerste Level-10-Szenarien jeweils **ohne** und **mit** symmetrischem LP-Zerfall. Exakte Einzelpaarprüfung. Keine Auswahl oder Q-Lernen auf Basis dieser Diagnosen.
- **Phase 7 (NEU):** zusätzliche 960 Level-10-Self-Play-Duelle. Auf der Gegenseite agiert diesmal tatsächlich die eingefrorene **2-Ply-Forschungs-KI** statt des historischen Guardian-/Soul-Gegners. Jede der fünf Kandidatenstrategien spielt 192 Duelle mit gepaarten Startpositionen, Decks und Szenarien. Alle fünf Varianten einschließlich 2-Ply gegen sich selbst werden verglichen. Der Gegner-Checkpoint heißt `two-ply-v1541`. **Diese direkte Vergleichsphase wird ausdrücklich weder zur Strategieauswahl noch für Q-Trainingsupdates herangezogen.**

Gesamt **7.680 simulierte Duelle**.

Die globale Freigabe bleibt vollständig unverändert: nur TRAIN + VALIDATION aus Phasen 0–4; mindestens +8 Trainingssiege und +8 Validierungssiege gegenüber der historischen Guardian-/Soul-Referenz, keine der beiden Kandidat-Spielerseiten darf in TRAIN/VALIDATION zurückfallen, keine vordefinierte Gruppenverschlechterung unter -3, und kein negativer Level-10-Hard-VALIDATION-Unterschied. Der Holdout bleibt versiegelt bis zur Auswertung.

## Geschütztes Q-Learning
Die 32 erfolgreich bestätigten historischen **TRAIN-only**-Archive v1511 bis einschließlich v1542 werden wiederhergestellt. Frische unabhängige Q-Daten/Validierung/Bestätigung mit neuen Seeds. Weder historische HOLDOUT-Daten noch die beiden Zerfall-A/B-Phasen oder die neue direkte 2-Ply-Diagnose dienen als Trainingslabels.

## Grenzen und praktische Interpretation
- Die Verteidigungssuche prüft nur bislang legal wechselbare Karten während der passenden Positionierungsphase und gegnerische **sichtbare Angriffe**, keinen kompletten gegnerischen Zug oder unbekannte Handkarten.
- Der direkte 2-Ply-Gegner ist die reproduzierte eingefrorene Strategie in der aktuellen Engine, nicht notwendigerweise derselbe exakte alte Binär-Engine-Build.
- Keine Änderung der produktiven KI oder des Branches `main`.

## Dateien
- `tests/ai-v1543-defense-headtohead-selfplay.cjs`
- `tests/ai-v1543-defense-headtohead-aggregate.cjs`
- `tests/ai-v1543-history.cjs`
- `tests/ai-v1543-Q.cjs`
- `.github/workflows/ai-v14943-defense-headtohead.yml`

## GitHub
https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40177267524
