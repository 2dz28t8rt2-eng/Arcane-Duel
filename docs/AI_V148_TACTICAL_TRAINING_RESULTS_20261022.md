# Arcane Duel – KI-Prüfbericht v14.8: Neue Taktik blieb wegen Aktivierungsgate ungetestet

**Stand:** 22. Oktober 2026 · **Branch:** `development` · **Workflow:** GitHub Actions `SUCCESS` · **Promotion:** `false`

- [GitHub-Actions-Lauf #39713425902](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39713425902), head `208e098927c1a64d78902f51aa230150205f7fd6`.
- [Originalartefakt `arcane-v148-real-tactical-strategy-mirrors`](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39713425902/artifacts/12397808726): `report.json`, `replays.json`, `candidate.json`.
- [Trainer](../tests/ai-allphase-tactics-v148.cjs) · [Workflow](../.github/workflows/ai-allphase-tactics-v148.yml).
- Die erste Workflow-Ausführung #39713362841 scheiterte bei der Syntaxprüfung wegen fälschlich escapeter Template-Backticks; der korrigierte obige Workflow endete erfolgreich. Sie wird nicht als Trainingslauf gewertet.

## 1. Tatsächlicher technischer Status

- GitHub Actions: vollständig grün, sämtliche Jobs/Schritte erfolgreich einschließlich Pilot, Hauptlauf und Artefakt-Upload. Ende: **2026-10-22 02:54:36 UTC** = **04:54:36 MESZ**.
- **86 bestandene Engine-/Regel-Regressionstests, 0 Fehltests**.
- 63 neue Trainings- und 63 unabhängige Test-Szenarien; jeweils Mirror-Matches auf gleichem Deck/Initial-Seed und mit vertauschten Controller-Sitzpositionen.
- Frühere Originalartefakte v14.2 bis v14.7 wurden geladen/validiert. Die 15 alten Champion-Gewichte und produktive NPC-KI wurden nicht verändert.
- **Kritischer Laufbefund:** Neue Taktik-Auswertung **0-mal** aufgerufen. Es wurden **0 neue Taktik-Proposals, 0 taktische Interventionen, 0 verworfene simulierte Taktikzweige** protokolliert. Somit sind die späteren Duellergebnisse *keine Validierung der beabsichtigten v14.8-Kampftaktik*.

## 2. Drei Strategien: Training und unabhängige Mirror Matches

Alle Trainingsprofile liegen bei genau **50 %**, ein deutliches Indiz für identisches oder praktisch identisches Controller-Verhalten.

| Strategie | Varianten im Training, je gespiegelter Pool | Neues Holdout gegen v14.7 |
|---|---|---:|
| Offensive/Predator/Tempo | `pressure-control` **18/36**; `targeted-aggression` **18/36** | **18/36 (50,0 %)** |
| Defender/Guardian/Soul | `guardian-protection` **18/36**; `soul-drain-counterattack` **18/36** | **18/36 (50,0 %)** |
| Fusion/Allrounder/Hybrid | `fusion-safety` **27/54**; `fusion-offense` **27/54** | **27/54 (50,0 %)** |
| **Insgesamt** | alle gleichauf | **63/126 (50,0 %)** |

Gegen den eingefrorenen ursprünglichen Champion **62/126 = 49,2 %**. Kein Leistungsgewinn nachgewiesen; ebenso wenig eine sinnvolle Prüfung des neuen Kandidaten.

### Boss VII/IX/X, je gleicher Seed/Deck pro Modell

| Boss | v14.8 | v14.7 | Champion | Anzahl je Modell |
|---|---:|---:|---:|---:|
| VII | **7** | 7 | **8** | 11 |
| IX | **2** | 2 | **3** | 10 |
| X | **0** | 0 | **1** | 11 |
| **Gesamt** | **9/32** | **9/32** | **12/32** | 32 |

Experten: Offensive **12/24 (50 %)**; Defense/Support **11/24 (45,8 %)**; Fusion/Ökonomie **16/24 (66,7 %)**. Stärkeres Verhalten der neuen Taktik kann daraus nicht abgeleitet werden, da deren Bewertungsfunktion überhaupt nicht ausgeführt wurde.

## 3. Root-Cause-Analyse – Taktikprogramm vorhanden, aber nicht aktiv

Die v14.8-Datei lädt zur Laufzeit den Quelltext von `tests/ai-final-score-transparency-v147.cjs` und ersetzt im daraus übernommenen `chooseAiAction`-Wrapper die Kandidatenzeile:

```js
suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);
```

Diese neue Funktion war aber weiterhin innerhalb des ursprünglichen Aktivierungsgates:

```js
const enabled=(plannerSeat===side||plannerSeat===2)&&
  allowPlanner141(game,plannerGate)&&
  !game.pending&&game.winner===null;
if(!action&&enabled) {
  suggested=lookahead148(...);
}
```

Alle v14.8-Trainings-/Holdout-Aufrufe übergaben **`plannerGate='summon-only'`**. Die geerbte Funktion `allowPlanner141` lautet:

```js
if(mode==='summon-only') return g.aiPhase==='summon';
```

Damit wurden die neuen v14.8-Funktionen in `attacks` und `positions` **systematisch ausgeschlossen**. Der vom GitHub-Runner archivierte Report bestätigt das durch **0 `evaluations`**, **0 `interventions`** in **Pilot und Hauptlauf**. Die 18 Archiv-Duellperspektiven enthalten zwar echte Aktionseinträge, aber sämtliche neuen `tacticalRankings`-Listen sind leer.

**Das ist ein reproduzierbarer Aktivierungs-/Testabdeckungsfehler, keine Erkenntnis, dass Angriff, Seelenentzug, Wächterheilung oder Positionierung strategisch nicht helfen.**

Weitere Lücke: Das bisherige CI verlangt grüne allgemeine Engine-Regeltests und erfolgreiche Spiele, aber **keinen einzigen bestätigten Aufruf der neuen Funktionszweige**. Deshalb konnte ein kompletter Trainingslauf erfolgreich enden, obwohl das getestete Feature deaktiviert war.

## 4. Korrekturplan v14.8.1 – zuerst Funktionstest, dann umfangreiches Training

1. **Aktivierungsregeln korrigieren:** Den v14.8-Planer in `summon`, `positions` und `attacks` explizit aktivieren (`always` oder gezielt geändertes Gate). Frühere v14.7-Gegner als echte unveränderte Kontrolle erhalten. Keine Modifikation der produktiven NPC-KI.
2. **Smoke-Abdeckung zwingend machen:** CI muss mit Fehler abbrechen, wenn in einem kontrollierten Pilotlauf nicht `combat` und `positions` tatsächlich vom neuen Planer verarbeitet werden. Für Guardian-Heilung/Soul-Drain besonders vorbereitete **wirklich legale** Szenarien bereitstellen und für jede Mechanik mindestens einen ausgewerteten Branch verlangen. Keine „alles grün“-Anzeige trotz `evaluations:0`.
3. **Original-Engine-Aktion konsequent validieren:** Keine gefälschten Legals; Kandidat auf Spielkopie prüfen, anschließend gewählte Aktion im echten Zustand ausführen. Für Positionswechsel, Endphase und DEF-spezifische Fähigkeiten tatsächliche Phase/Reihenfolge respektieren.
4. **Neuen Planer gegen v14.7 separat abgrenzen:** Selbe legal generierte Haupt-/Fusionsdecks, Start-Seeds und vertauschte Spielerrollen; neue, für Trainingsauswahl nicht benutzte Holdout-Decks. Änderungen am Aktions-UID/Slot/Ziel und reale LP-/Feldwertfolgen getrennt zählen.
5. **Wirkung nur mit ausreichend Daten behaupten:** Zunächst kleine reproduzierbare Mechaniklektion und Mikro-A/B mit nachweisbaren Aktionsabweichungen, danach mehrere seeds pro kritischer Situation, dann erst große strategische und Boss-Holdouts.
6. **Archivierung:** Pro Testentscheidung Quell-Commit, Startseed, Deckfingerprint, öffentliche Lage/eigene Hand, legaler Aktionssatz, Bewertungszerlegung, konkrete Wahl, reale Nachherposition und Spielausgang. Historische Reports bilden Lehrziele, kein retrospektiv erfundenes Label.

**Fazit:** v14.8 wurde **technisch erfolgreich ausgeführt, aber fachlich nicht wie vorgesehen getestet**. `promotionEligible:false`, `productionIntegrated:false`; Champion, Main und produktive Gegner unverändert. Vor dem nächsten umfangreichen KI-Training ist die Phase-Gate-Korrektur zwingend.
