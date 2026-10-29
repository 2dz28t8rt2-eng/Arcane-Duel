# Arcane Duel – KI-Training v14.9.16

## Zweck
Aufbauend auf dem erfolgreichen v14.9.15-Lauf (Run 39855753529) ist der
Ein-Konter-Planer die derzeit stärkste Forschungsreferenz (565/640 Siege);
der technisch funktionierende Zwei-Konter-Planer erreichte 563/640 Siege.
Der Zweck dieses Experiments ist **nicht**, einen Sieg der tieferen
Planung vorauszusetzen, sondern ihren zusätzlichen Nutzen sauber zu testen.

## Neues Forschungsdesign
- 3.200 vollständige Duelle in 40 isolierten Shards mit jeweils 80 Partien.
- 80 % unterschiedliche Archetypen / 20 % Mirror; 30 gerichtete
  Rollenpaarungen plus 2 schwierige Wiederholungs-Matchups.
- Fünf KI-Arme mit denselben Szenario-, Deck- und Start-Seeds:
  Baseline-Heuristik, konservatives Q, 1-Gegnerangriff-Planer,
  2-Gegnerangriffe-Planer und **risikobewusster 2-Gegnerangriffe-Planer**.
- Zwei voneinander unabhängige Sitzpositionen sowie beide Startspieler
  je Kandidaten-Deckliste; maximal realistische 40-Karten-Decks.
- 25 % Holdout über einen komplett ungenutzten Szenario-Seed pro Shard.
  Die Holdout-Partien entscheiden **nicht** über die Q-Aktualisierung.

## Risikobewusste Bewertung
Der zusätzliche Forschungsarm gewichtet DEF-Stellung von Guardian und Soul,
die aktuell vorhandene Soul-Essenz, die Verwundbarkeit gegenüber dem
stärksten sichtbaren Gegnerangriff und die Kosten künftiger Verluste.
Die beiden bekannten Planer bleiben als Kontrollen unverändert.
Die Änderung ist ein experimenteller Bewertungsansatz, keine
produktive Balanceänderung und kein Beweis einer verbesserten KI.

## Historisches Lernen
- Aktueller Q-Checkpoint wird aus dem letzten erfolgreichen v14.9.16-Lauf
  oder initial aus dem erfolgreichen v14.9.15-Lauf übernommen.
- Gültige TRAIN-Beispiele aus den Läufen 39803691439, 39843438099,
  39847734409, 39851537706 und 39855753529.
- Zusätzlich werden die vollständigeren öffentlichen Aktionsfolgen von
  v14.9.15 ausgewertet, ohne gewonnene Duelle zu falschen
  Einzelaktions-Belohnungen umzudeklarieren.
- Neue Q-Tabellen werden nur akzeptiert, wenn zwei voneinander
  unabhängige Trainingsvalidierungen beide mindestens gleich gut ausfallen;
  finale Holdout-Testdaten werden nie zum Update verwendet.

## Qualitätsnachweise
- Syntaxprüfungen, Regeltests und erste Cross-Deck- und Mirror-Smoke-Tests.
- Sowohl der normale als auch der risikobewusste Zwei-Konter-Planer
  **müssen** einen zweiten legalen simulierten Gegnerangriff ausführen.
- Exakt gleiche Testbedingungen je KI-Arm; LP ohne Handicap;
  Paarvergleich auf Gesamt-, Cross-Deck-, Mirror- und Holdout-Ebene.
- Ungeprüfte Modelle werden niemals automatisch in production oder
  auf den `main`-Branch übernommen.

## Bekannte Grenzen
Die bestehende Q-Tabelle behandelt vor allem Predator Attack vs Pass.
Die anderen Rollen nutzen unter anderem festgelegte Planer und Heuristiken,
noch kein durchgängiges kausales Lernen über alle Aktionen. Mehr
Simulationsschritte sind nicht automatisch ein Beweis besseren Spielens.
