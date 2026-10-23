# Arcane Duel – Forschungs-KI v14.9.19: isolierte Fusion- und Soul-Strategien

## Forschungsanlass
Das abgeschlossene v14.9.18-Experiment (GitHub Actions 39904678414)
lieferte 581/640 Siege für den v14.9.17-Rollen-Planer und 574/640 für
die Kombination aus stärkerer Fusion- und Guardian-/Soul-Aufwertung.
Insbesondere Fusion-Decks verloren 9 Siege, Soul gewann 2 hinzu.
Ein gemeinsames Update bietet damit keine verlässliche Evidenz.

## Kontrolliertes Design
- 40 Shards zu je 128 vollständigen Duellen: **5.120** Duelle.
- Acht Forschungsarme, je 640 Matches mit denselben Decks, Starthänden,
  Fusionskarten, Initial-LP, Startspielern und Szenario-Seeds:
  `baseline-heuristic`, `gated-Q`, `Q-one-counter-planner`,
  `Q-two-counter-planner`, **`Q-two-counter-role-aware`** (unveränderte
  beste Referenz), `Q-two-counter-fusion-guard-mild`,
  `Q-two-counter-fusion-guard-strong`, `Q-two-counter-soul-focus`.
- 4.096 verschiedene Rollen-Deckvergleiche (80 %) und 1.024
  Mirrormatches (20 %), darunter alle 30 gerichteten Rollenpaarungen.
- 160 unabhängige Holdout-Partien **je Modell** (insgesamt 1.280),
  deren Aktionsfolgen nicht als Trainingsdaten genutzt werden.
- Gegnerstrategien: offensiv, defensiv/ökonomisch und ausgewogen.
- Der Arena-**LP**-Zerfall ist bei 50 % der matched scenarios für beide
  Seiten aktiviert. Dies ist **kein separater Test des Monsterzerfalls**.

## Die zwei isolierten Fusionsvarianten
Im bisherigen Rollensystem wird eine Fusion anhand ihres aktuellen
ATK-/DEF-Werts zusätzlich belohnt. Die hier getesteten Varianten
reduzieren die Fusionsbewertung um einen Material-Opportunitätswert:
- **Mild**: 7,5 % des kombinierten ATK-/DEF-Materialwerts plus
  Sockelbetrag je zusätzlichem Material; Resthand unter vier Karten
  verursacht einen Knappheitszuschlag. Echte Stärkegewinne reduzieren
  den Abzug.
- **Strong**: dieselbe Rechnung mit 14 % Materialwert, um die
  mögliche Überkorrektur zu erkennen.

Die Forschung variiert **nur** die Bewertung für Fusion-Decks.
Kein Live-Balance- oder Kartenwert wird verändert.

## Der isolierte Soul-Ansatz
Nur bei Soul-Decks wird die Platzierung von Soul-Einheiten in
Abhängigkeit von sichtbaren Guardian-Verbündeten,
DEF-Stärke und bekannten Angriffsbedrohungen neu priorisiert.
Der vorherige Guardian-Sonderbonus wird bewusst nicht übernommen.
Es wird nicht behauptet, dass hieraus bereits kausales
vollständiges Action-Value-Learning entsteht.

## Historische Q-Fortsetzung
Die Q-Tabelle wird aus dem letzten erfolgreich gespeicherten
Checkpoint (initial aus Run 39904678414) wiederhergestellt.
Gültige TRAIN-Beispiele stammen aus den acht erfolgreichen Läufen
39803691439, 39843438099, 39847734409, 39851537706,
39855753529, 39858417967, 39862370629, 39904678414.
Zwei getrennte trainingsinterne Validierungssätze müssen eine
Q-Aktualisierung jeweils bestätigen. Der unabhängige Holdout
wird nie zur Auswahl neuer Q-Gewichte verwendet.

## Strenge Auswertung und Gates
- Beide Sitzpositionen, beide Startspieler und identische RNG-Seeds.
- Spielregeln, 40-Karten-Deck und Fusionsbestand werden überprüft.
- Zweite gegnerische Konterattacken müssen in jedem tiefen Planer
  tatsächlich ausführbar simuliert werden.
- Für alle drei neuen Kandidaten: pro Modell 480 gepaarte
  Trainingstrajektorien sowie 160 Holdout-Ausgänge gegenüber
  dem **unveränderten Rollen-Planer**.
- Zusätzlich wird gezählt, ob tatsächlich andere Aktionen gewählt
  werden; Action-Differences werden nur aus TRAIN-Logs gewonnen.
- Wichtiges Isolation-Gate: Eine Fusion-Änderung darf die
  Sieg-/Niederlage-Ausgänge von Nicht-Fusion-Decks nicht ändern;
  Soul-Fokus darf Nicht-Soul-Decks nicht verändern.
- Kein automatisches Commit der Research-KI in die
  produktive Spiel-KI, kein Merge nach `main`.

## Einschränkungen
Eine Forschungssiegquote gegen einen heuristischen Gegner garantiert
keine Stärke gegen eine gleichwertige lernende KI. Die tabellarische
Q-Fortsetzung erlernt überwiegend Predator Attack-vs-Pass, nicht
vollständige mehrzügige Spielpolitik. Es wird kein permanenter
Self-Play-Trainingszustand oder echtes online RL vorgetäuscht.
