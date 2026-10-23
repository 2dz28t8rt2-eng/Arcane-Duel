# Arcane Duel – KI-Forschungsplan v14.9.20

## Strategisches Belagerungstraining

Das Curriculum basiert auf den bisherigen Tests v14.9.15 bis v14.9.19:
- Tiefere Gegenangriff-Simulationen funktionieren, liefern aber nicht automatisch bessere Spielzüge.
- Rollenspezifische Auswertungen haben messbar verändertes Entscheidungsverhalten erzeugt.
- Rein zahlenbasierte Fusionsboni/-strafen waren nicht überzeugend.
- Die tabellarische Q-Lernhistorie bleibt auf lokale Angriff-vs.-Pass-Entscheidungen begrenzt.

Ziel ist eine **echte Aufgabenfolge mit steigender Komplexität**:
Die Forschungs-KI soll zunächst eine Verteidigungsstellung brechen und
anschließend diese Fähigkeit trotz Gegenwehr behalten.

## Die vier Stufen

**0. Statische Festung:** Drei legale Guardian-/Soul-Monster starten in
DEF-Stellung. Der Gegner darf weder beschwören noch angreifen.
Der Spieler muss aktiv Schaden anrichten; passiver Arena-LP-Zerfall
ist deaktiviert. Normale Spielregeln, Monsterzerfall und defensiver
Gegenschlag bleiben aktiv.

**1. Wachsende Festung:** Ein DEF-Monster steht zu Beginn. Der Gegner
darf aus seinem echten 40-Karten-Deck legal ziehen, beschwören, fusionieren
und DEF-orientiert handeln, jedoch keine eigenen Angriffe ausführen.

**2. Verstärkte Festung:** Drei DEF-Monster stehen zu Beginn und der Gegner
baut weiter. Die Forschungs-KI muss hohen defensiven Druck mit
Attacken, Fusionen und Rollenfähigkeiten bewältigen.

**3. Schrittweise Gegenwehr:** Zwei DEF-Monster stehen zu Beginn, der
Gegner baut weiter. Er darf zunächst nicht aktiv angreifen; ab
Runde 10 bis zu einer offensiven Aktion pro Gegnerzug, ab Runde
20 bis zu zwei. Dies ist bewusst noch kein vollständiges
gleichwertiges Self-Play.

Der gesamte Test benutzt echte Karten aus dem Deck, ohne
duplizierte kostenlose Phantomkarten. Vorbesetzte DEF-Slots werden
durch Entnahme derselben realen Karten aus dem Gegnerdeck
finanziert. Die Aufgaben sind dennoch absichtlich asymmetrisch
(sie dienen als offensive Lernprobleme).

## Forschungsprofile

Pro Stufe werden vier Profile gegeneinander geprüft:
- unveränderter bisheriger Rollen-Planer
- aus dem vorherigen Training übernommene Belagerungsgewichte
- stärkeres Brechen des gegnerischen Boards
- geduldigeres Bewahren von Material und eigener Unterstützung

Die Gewichtungsparameter beeinflussen nur die Forschungs-Planung,
nicht Live-Karten oder Spiel-Balance. Der beste Forschungsparameter
wird **ausschließlich aus den Trainingspartien** der jeweiligen
Stufe ausgewählt und in die nächste Stufe übernommen.

Die Gesamtaufgabe enthält 2.048 vollständige Duelle
(je 512 pro Stufe), acht gerichtete Rollenpaarungen,
zwei Startspielerpositionen, beide Sitzplätze und
gepaarte Seeds. Davon sind 512 Partien unabhängige
Holdout-Prüfungen. Gegen Gegner ohne aktive Gegenwehr
werden insbesondere Board-Abbau, LP-Schaden, eigenes
Material, nötige Spielrunden und tatsächliche Siege
erfasst.

## Historisches Q-Learning und Grenzen

Das bisherige taktische Predator-Q-Lernen wird unabhängig
davon aus neun erfolgreichen Runs fortgesetzt, mit zwei
trainingsinternen Validierungssets. Es wird nicht behauptet,
dass diese tabellarische Q-Fortsetzung bereits Fusionen,
Soul-Strategien oder alle Langzeitentscheidungen selbstständig
lernt.

Der neue Belagerungsansatz ist zunächst ein
**trainingsgestütztes Tuning transparenter Strategiegewichte**
mit unabhängigen Prüfduellen, keine vollständige end-to-end
Reinforcement-Learning-Engine und keine automatische
produktive KI-Aktualisierung.

Jede Stufe speichert getrennte TRAIN-Aktionstrajektorien
und Ergebnisdaten; Holdout-Aktionen gelangen nicht in
den Trainingsbestand. Kein Merge nach main, keine
Aktivierung der Live-Gegner-KI ohne weitere Tests.

## GitHub Actions
Workflow: `.github/workflows/ai-v14920-siege-curriculum.yml`
Skripte:
`tests/ai-v1520-siege-curriculum.cjs`,
`tests/ai-v1520-siege-aggregate.cjs`,
`tests/ai-v1520-history.cjs`,
`tests/ai-v1520-Q.cjs`.
