# Arcane Duel – KI-Training v14.9.15: Cross-Deck Counter-Rollouts und abgesichertes Q

## Ziel
Der letzte Lauf (v14.9.14, Run 39851537706) zeigte eine Verbesserung der Benchmark-Vielfalt,
aber keine verlässliche Verbesserung der KI. Beide Planungsvarianten waren effektiv gleich
und unbekannte taktische Q-Testdaten wurden bei allen drei Modellen schlechter.

## Forschungsänderungen
1. **Die Angriffsvorausschau ist zweistufig**: Die tiefe Variante simuliert
   zwei legale, aufeinander folgende Gegnerangriffe, sofern möglich, sowohl bei
   der Beschwörungs- als auch bei der Angriffsentscheidung. Die Simulation arbeitet
   ausschließlich mit dem öffentlichen Spielfeld und kann verdeckte Hände nicht einsehen.
   Erste und zweite Attacke werden getrennt gezählt.
2. **Beschwörungs-Vorausschau**: Budget von vier auf acht Prüfungen erhöht;
   relevante Ausführung nach Freigabe des Angriffs und nur gegen ein vorhandenes
   gegnerisches Spielfeld. Das verhindert, dass der Großteil des Budgets
   in der friedlichen Vorbereitungsphase verloren geht.
3. **Abgesichertes Q-Learning**: Bisherige akzeptierte Tabellen werden übernommen,
   genauso wie echte, gültige vorherige TRAIN-Beispiele. Neue Gewichte werden
   nur übernommen, wenn sie auf **zwei disjunkten trainingsinternen 150er-
   Validierungssätzen** jeweils mindestens gleich gut sind wie die
   vorherigen Gewichte. Eine dritte, unabhängige 150er-Holdout-Serie
   wird weiterhin ausschließlich zur Berichterstattung verwendet.
4. **Vollständigere Protokolle**: Die künstliche Kappung bei 48 Aktionen pro
   Trainingsduell wird entfernt. Auch Spielresultate und die taktischen
   öffentlichen Boards werden dokumentiert. Keine Holdout-Aktionsverläufe
   werden als Trainingsdaten gespeichert.
5. **Altdaten werden tatsächlich berücksichtigt**: Die älteren gültigen
   Trainingsbeispiele kommen aus Runs 39803691439, 39843438099,
   39847734409 und 39851537706. Der neueste Q-Checkpoint stammt aus dem
   letzten erfolgreichen v14.9.15-Lauf, ansonsten aus v14.9.14.
   Die 1.920 alten Forschungs-Trajektorien werden außerdem
   zusammengefasst, um bekannte schwierige Matchups transparent zu machen.
   Der Datensatz wird nicht mit fingierten kausalen Aktionslabels trainiert.
6. **Wieder 80/20**: 2.048 Cross-Deck-Duelle plus 512 Mirror-Duelle,
   alle 30 gerichteten Rollenkombinationen sowie zwei zusätzliche
   schwierige Paarungen Predator gegen Guardian und Fusion gegen Guardian.
   Beide Spielerpositionen und Startspieler werden getestet.
   Vier unabhängige Strategiearme, 40 Blöcke zu je 64 Partien,
   je Modell 640 Partien, davon 160 Holdout.

## Qualitätsschutz
- Regel- und Syntaxprüfung vor dem Lauf.
- Smoke-Tests mit unterschiedlichem sowie identischem Deck.
- Die gesamte Auswertung kontrolliert die 80/20-Aufteilung,
  unveränderte identische Deckquellen je Vergleich, symmetrische
  Anfangs-LP und die echten Duellaktionen.
- Wenn der tiefere Planer **keinen einzigen legalen zweiten Gegnerangriff**
  ausführt, scheitert die Qualitätsprüfung ausdrücklich.
- Die vorherige Heuristik bleibt Kontrollgruppe.
- Das Forschungsmodell wird nicht automatisch auf main oder produktiv freigegeben.

## Grenzen
Die tabellarischen Q-Daten lernen noch hauptsächlich die Predator-Entscheidung
Angriff/Passen. Die vollständige, kausale Strategie-Auswertung von Fusion,
Verteidigung, Seelenfähigkeiten, ACE, Gegnerhand-Schätzung und langfristigem
Zerfall benötigt weitere Arbeit. Ein erfolgreicher Workflow allein ist kein
Beweis, dass alle Strategien stärker geworden sind.
