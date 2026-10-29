# Arcane Duel – Verifizierter Prüfbericht v14.9.3: Umfangreiches Strategietraining

**Stand:** 22.10.2026 · **Branch:** `development` · **Status:** GitHub-Actions erfolgreich, aber keine KI-Promotion.

- [Erfolgreicher Trainingslauf #39761853447](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39761853447) (`success`)
- Commit: `59ba63f665d78fb86e54846ae433e9764f726dd7`
- [Originalartefakt mit report.json, stages.json und sechs vollständigen Einzelberichten](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39761853447/artifacts/12418271883)
- Trainer: `tests/ai-v1493-extensive-strategy-replay-training.cjs`

## Prüfentscheidung

**Technisch bestanden. Strategische Auswahl gegenüber eingefrorener Basis vielversprechend; Replay-Lernen und Sitz-Parität nicht bestanden. Keine Promotion nach `main`.**

- **1.440 Trainingsduelle** inkl. mehrfacher Profilauswahl und Replay-Nachprüfung
- **288 gespiegelte Holdout-Duelle** auf 12 vorher ungesehenen legal konstruierten Decks pro Curriculum-Stufe, je zwei Starter- und zwei KI-Sitzlagen
- **231/288 = 80,21 % Siege** der Teststrategie gegen den eingefrorenen `balanced`-Gegner; 7 Spiele erreichten die Simulationsobergrenze ohne Sieger. Von 281 entschiedenen Partien sind es 231/281 = 82,21 %, wobei die Unentschiedenen nicht als Siege gezählt werden dürfen.
- **8.083 dokumentierte Neubewertungen des Boards** und **5.870 andere ausgewählte Aktionen** gegenüber der alten Vergleichs-KI. Anders heißt nicht automatisch nachweislich besser in jedem Einzelzug.
- **0 ungültige Aktionen**, **0 vorzeitige offensive Seelenzehrer-Vorgänge** und **0 Angriffe vor dem jeweils erlaubten Duellzug**.
- **6.975 outcome-markierte Trainingsentscheidungen**, aber **0/6 vorgeschlagene Replay-Koeffizientenupdates wurden akzeptiert**. Alle sechs Trainingsstufen wählten bereits vorgegebene Profile. Es existiert **kein nachgewiesenes selbstständiges Langzeitlernen**.
- In der 10-globalen-Züge-Aufbauphase hatten **22/48 Matches** beim Kampfbeginn auf beiden Seiten fünf Feldmonster. Dass volle Boards möglich und prüfbar sind, ist bestätigt; sie entstehen nicht garantiert.

## Trainingsstufen

| Global angriffsfreie Züge | Gewählte Strategie | Holdout-Siege / 48 | Siegquote | Timeouts | Unterschiedliche Aktionen |
|---:|---|---:|---:|---:|---:|
| 10 | replay-seed | 33 | 68,75 % | 3 | 952 |
| 8 | replay-seed | 40 | 83,33 % | 0 | 1.032 |
| 6 | forecast | 41 | 85,42 % | 1 | 966 |
| 4 | synergy | 37 | 77,08 % | 2 | 1.018 |
| 2 | forecast | 40 | 83,33 % | 1 | 962 |
| 0 | synergy | 40 | 83,33 % | 0 | 940 |
| **Gesamt** | – | **231/288** | **80,21 %** | **7** | **5.870** |

**Wichtig:** Jede Phase verwendet andere Decks. Die höhere Quote bei 6 gegenüber 10 globalen Zügen ist deshalb **kein kausaler Beleg**, dass 6 besser sind. Und selbst `noAttackTurns=0` bedeutet **nicht** reguläres Produktivspiel: Arena-LP-Zerfall bleibt aus, `soulUnlockTurn=Math.max(7,0+1)=7` verzögert Soul-Offensive, und Schilde/Aufwertungen sind neutralisiert.

## Ergebnis nach Deck-Archetyp (über alle sechs Phasen)

| Trainingstyp | Siege / Matches | Rate | Timeouts |
|---|---:|---:|---:|
| Wächter–Seelenzehrer gemischt | 80/96 | 83,33 % | 2 |
| Reine Wächter | 36/48 | 75,00 % | 5 |
| Reine Seelenzehrer | 22/24 | 91,67 % | 0 |
| Predator | 14/24 | **58,33 %** | 0 |
| Fusion | 22/24 | 91,67 % | 0 |
| Allrounder | 18/24 | 75,00 % | 0 |
| Tempo | 20/24 | 83,33 % | 0 |
| Hybrid | 19/24 | 79,17 % | 0 |

Diese Zahlen messen die *Forschungs-KI gegenüber derselben eingefrorenen alten `balanced`-KI unter verschiedenen konstruierten Decks*. Sie erlauben **keine Aussage, dass reine Seelenzehrer stärkere Decks seien als Wächter-Seelenzehrer-Mischungen**: Deckqualität, Rollenverteilung, Auswahl und nur vier Solo-Soul-Duelle pro Phase sind nicht gleichgesetzt. Die fünf Wächter-Timeouts zeigen Bedarf an verbesserten Endspiel-/Tiebreak-Zielen.

## Sitzplatz-Asymmetrie – wichtiger Gegenbefund

Die angeblich faire Matrix offenbart einen starken Unterschied:

| Forschungs-KI spielt als | Siege / 144 | Siegquote |
|---|---:|---:|
| Sitz 0 / Spieler | **134/144** | **93,06 %** |
| Sitz 1 / Gegner | **97/144** | **67,36 %** |

Demgegenüber sind *Startspieler* als identifizierbares Ereignis in 143/288 Partien Sieger (49,65 % aller Matches, 143/281 = 50,89 % entschiedener Matches). Auch die Forschungs-KI erzielt über beide Starterfälle 114/144 (Starter 0) und 117/144 (Starter 1) Siege. Damit ist die deutliche Platz-0-Differenz **nicht einfach dasselbe wie die Wahl des Startspielers**.

Mögliche Ursachen müssen **vor jeder KI-Promotion** getrennt untersucht werden: PvE-spezifische Spielerseiten-Mechaniken, Seiteneffekte von Fusions- und Rollen-Boni, verschiedene tatsächliche Aktionsmöglichkeiten oder Qualitäten der Referenz-KI. Der vorhandene Test neutralisiert Schilde, Aufwertungen und die Eröffnungsdecks, aber **nicht sämtliche seitenspezifischen PvE-Regelpfade**. Die Ursache ist mit diesem Lauf allein **nicht isoliert bewiesen**. Nächster Test: echte beidseitig identische Berechtigungen und dokumentierte Aktionen/Stats/Bonuseffekte je Sitz.

## Warum die Replay-Anpassungen nicht zu echtem Lernen führten

Pro Phase wurden Entscheidungen nach dem finalen Duellausgang mit +1/-1 bewertet, mit der Anzahl aufgezeichneter Aktionen normalisiert und zu gebundenen Änderungen für `defense`, `synergy`, `waitCost`, `materialCost`, `aggression` zusammengeführt. **Alle 6 daraus resultierenden Kandidaten waren nach Trainingsevaluation schlechter oder gleichwertig ohne Timeout-Vorteil** und wurden deshalb verworfen.

Dieses Replay-Protokoll liefert keinen belastbaren kausalen Kredit für eine bestimmte Aktion: Gute Entscheidungen eines verlorenen Matches erhalten ein negatives Label; Fehler in einem gewonnenen Match positive. Außerdem enthält die aktuelle Strategie bei Angriffen überwiegend unmittelbare Engine-Auflösung, bei Beschwörung eine einfache Verfallsprojektion, **kein vollständiges 3–5-Züge-Gegnerkonter-Suchverfahren**. Die Rahmenidee funktioniert, der Lernalgorithmus muss gezielter werden.

## Empfehlungen: nächste Forschungsstufe

1. **Sitz-Parität isolieren**: In PvE symmetrische Rechte/Boni pro Duellant testweise herstellen; selbe Hand/deck/seed, Rollenstats, RNG, Angriffspfade, Gegner-Controller. Die bereits gespeicherten 134:97-Ergebnisse als Regressionsbasis benutzen.
2. **Echtes Alternativen-Lernen:** Alle legalen Aktionen am identischen Zustand erfassen; je Aktion einen kontrollierten, legalen 1–2-Züge-Rollout samt sichtbar möglicher gegnerischer Gegenreaktion rechnen und *unmittelbare reale Board-/LP-/Überlebensdifferenzen* als Zielwert speichern. Keine unbekannten Handkarten des Gegners als Eingaben. Wiederverwendbare `state, action, outcome`-Trainingsbeispiele mit Fingerprint und Train-/Holdout-Trennung.
3. **Konstruiertes Spezial-Curriculum:** Volle Boards 5v5, gefährliche gegnerische ACE, Wächter–Soul-Gegenschlag, unterlegene Predator-Angriffe, Fusionen bei Materialknappheit, Endspiele mit nicht erreichbarem LP-Kill und konservierter Monsterzerfall. Tausche die Strategien innerhalb desselben Deck- und Kartenniveaus.
4. **Opponent-League statt nur `balanced`:** Gegner aus mehreren eingefrorenen strategischen Policies, dazu aktuelles Produktiv-Verhalten, frühere Champions, aggressive und defensive Controller. Gleiche Regeln, Start- und Sitzspiegelung.
5. **Rigoroser Holdout:** Neue Decks und unbekannte Szenarien für Endprüfung, nie zur Parameterauswahl heranziehen; separate unveränderte Live-Regeln einschließlich Arena-LP-Zerfall und realen Soul-Startfenstern prüfen. Nur bei messbarer Verbesserung und keinen Sitz-/Rollen-Nichtregressionen in den Spielbetrieb überführen.

**Freigabeentscheidung:** `development` enthält nur den isolierten Forschungsmodus und Testcode. Keine automatische Umstellung der Live-KI oder `main`.
