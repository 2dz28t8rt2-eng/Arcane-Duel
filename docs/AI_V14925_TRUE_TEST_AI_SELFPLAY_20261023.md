# Arcane Duel – KI-Training v14.9.25: Echtes Test-KI-Self-Play

## Ausgangspunkt
Der erfolgreiche Lauf v14.9.24 (#39933155444) zeigte, dass die Test-KI
gegen die ältere, einfachere Gegnerheuristik bereits weit über 90 % ihrer
Kämpfe gewinnt. Diese Messlatte ist für die weitere Optimierung zu schwach.
Der Nutzer hat deshalb explizit **dieselbe aktuelle Forschungs-KI auf
beiden Seiten** verlangt.

## Technische Korrektur
Der bisherige Simulator leitete `candidateSummon()`,
`candidateAttack()`, Q-Angriffsauswertung und sichtbares
Board-Lookahead nur für `candidateSeat` auf den Forschungsplaner um.
Auf der Gegenseite wurde bislang `baseChoose` (einfache Standard-KI)
verwendet.

v14.9.25 hebt die nur eine Spielerseite betreffende Gate-Bedingung
auf. Beide Spieler nutzen jetzt den **identischen strategischen
Planer**: Rollen, Fusion, Q/Lookahead, Verteidigung, Soul und Angriff.
Pro Sitz werden Aufrufe des strategischen Planers, tatsächliche
strategische Auswahlentscheidungen und ausgeführte Aktionstypen
protokolliert. Der GitHub-Workflow scheitert, falls eine Spielerseite
keine tatsächliche strategische Entscheidung ausführt.

## Die fünf Trainingsphasen
0. Level-8-Deck gegen das exakt identische Level-8-Deck
1. Level-9-Deck gegen das exakt identische Level-9-Deck
2. Level-10-Deck gegen das exakt identische Level-10-Deck
3. Verschiedene Level-8-Rollendecks, gleicher Planungsalgorithmus
4. Verschiedene Level-10-Rollendecks, gleicher Planungsalgorithmus

Beide Startspielerpositionen und beide Sitzplätze werden geprüft. Acht
Rollenpaarungen und vier Seedszenarien pro Phase.

## Fünf geprüfte Policy-Kombinationen

| Forschungsarm | Spieler A | Spieler B | Zweck |
|---|---|---|---|
| symmetric-reference | Vollständige Test-KI | **identische** Test-KI | Referenz und Sitz-Bias |
| finish-vs-reference | Test-KI + Abschlusspositionierung | Vollständige Test-KI | Abschlussnutzen |
| breach-vs-reference | Test-KI + proaktiver Durchbruch | Vollständige Test-KI | Durchbruchnutzen |
| safe-vs-reference | Test-KI + vorsichtiger Durchbruch | Vollständige Test-KI | Risikobewertung |
| symmetric-breach | **identische** Test-KI + Durchbruch | **identische** Test-KI + Durchbruch | Spielerseiten-Parität bei verstärkter KI |

Die symmetrischen Gruppen werden **nur diagnostisch** ausgewertet.
In den anderen Gruppen wird exakt derselbe strategische Kern
verwendet; nur die zu prüfende zusätzliche Policy-Funktion variiert.

## Test- und Lernumfang
- 5 Phasen × 8 Rollenpaarungen × 4 Szenarien × 2 Starter × 2
  Sitzplätze × 5 Policy-Kombinationen = **3.200 echte Duelle**.
- **2.400 TRAIN**, **800 unabhängige HOLDOUT**.
- Je Phase und Forschungsarm 96 TRAIN und 32 HOLDOUT.
- Keine Holdout-Ergebnisse werden für Q-Lernen oder Policy-Auswahl benutzt.
- Promotion eines Challenger-Arms nur bei mindestens **+4 TRAIN-Siegen
  je 96 Spiele** gegen die symmetrische Referenz und keinem Sitzpositions-Rückschritt.
- Die symmetrischen Arme selbst werden nicht promotet.
- Der historische Q-Checkpoint aus v14.9.24 wird wiederhergestellt.
  Gültige TRAIN-Beispiele aus 14 früheren Trainingsläufen werden weitergenutzt.
- Bisherige Q-Lerntechnik bleibt weitgehend Predator-Angriff vs. Pass
  und ist **noch kein umfassendes Deep Reinforcement Learning**.

## Kontroll- und Sicherheitsgrenzen
Beide Seiten verwenden echte 40-Karten-Decks, reguläre
Beschwörungen, Fusionen, Guardian-/Soul-Mechaniken und Monsterzerfall.
Der symmetrisch deaktivierte Arena-LP-Zerfall bleibt als
Forschungskontrolle bestehen. Es werden keine automatischen
Regel-/Kartenänderungen im Live-Spiel vorgenommen.
Der `development`-Zweig erhält ausschließlich zusätzliche
Forschungsskripte und CI-Tests; kein Merge nach `main`.

## Implementierung
- `tests/ai-v1525-dual-ai-selfplay.cjs`
- `tests/ai-v1525-selfplay-aggregate.cjs`
- `tests/ai-v1525-history.cjs`
- `tests/ai-v1525-Q.cjs`
- `.github/workflows/ai-v14925-true-test-ai-selfplay.yml`
