# Arcane Duel KI v14.9.22 – Endgame Finisher & Sitzpositions-Parität

## Anlass und Hypothese
Der erfolgreiche Forschungs-Lauf v14.9.21 (39919243971) endete mit einem stark asymmetrischen
Verhalten in den frühen Belagerungsstufen. Bei einer passiven Festung gewann die Referenz-KI
auf Sitzplatz 0 47/64, auf Sitzplatz 1 aber nur 6/64 Duelle. In festgefahrenen TRAIN-Trajektorien
wechselte die KI häufig die Kampfstellung, obwohl das gegnerische Feld bereits leer war.

Wir messen, ob eine **research-only direkte Schlussangriffs-Policy** dieses Problem mildert,
ohne die Stärken in normalen Duellen aufzugeben.

## Vier gepaarte Policies
- `role-reference`: unveränderte rollenbewusste Forschungspolitik, kein Override
- `finish-direct`: nach der Beschwörungsphase bei freiem Gegnerfeld legalen direkten Angriff vorziehen
- `finish-stance`: wie direct; zusätzlich geeignete eigene DEF-Monster legal in ATK umstellen
- `finish-priority`: wie stance; stärkste legal angreifende Einheit und stärksten DEF-Umstellkandidaten priorisieren

Overrides verwenden die reale Engine für `canAttack`, `effectiveAttack`, `attack` und
`switchPosition`. Es gibt weder neue Karten noch künstlichen Schaden.
Wenn bei leerem gegnerischen Feld keine sinnvolle Aktion mehr legal ist, beendet
die Policy den Zug statt nutzlos weiter Stellung zu wechseln.

Wichtig: Der Override tritt erst nach dem ersten Beschwörungsversuch des
aktiven eigenen Zuges in Kraft und lässt ausstehende Fusionen und Kartenplatzierungen
unberührt.

## Sieben Curriculum-Stufen
Wie v14.9.21: (0) ein Verteidiger ohne Gegenschlag/Soul,
(1) zwei Verteidiger ohne Gegenschlag/Soul,
(2) Guardian-Gegenschlag,
(3) Soul-Mechaniken,
(4) wachsende Festung,
(5) schrittweise aktiver Gegner,
(6) voller Kampf ohne vorplatzierte DEF-Verteidiger.

Pro Stufe 512 reale, gepaarte Duelle mit acht Rollenpaarungen,
zwei Sitzpositionen, zwei Startspielern und vier verschiedenen Policy-Armen.
Gesamt 3.584 Duelle; TRAIN 2.688, separater HOLDOUT 896.
Der Holdout darf nicht zur Strategieauswahl verwendet werden.

## Messgrößen und Schutzregeln
- Siege, Niederlagen und Timeouts nach Sitzposition
- direkte Abschlussangriffe, DEF→ATK-Wechsel und zurückgehaltene End-Zug-Entscheidungen
- tatsächlich verursachter LP-Schaden, vernichtete Gegner, verlorene Einheiten, Züge
- Kontrollgruppe unverändert; alle Varianten mit derselben Deckliste und denselben RNG-Seeds
- neue Variante nur übernehmen bei STRICT mehr TRAIN-Siegen gegenüber der Referenz
  **UND** ohne Abfall auf **irgendeiner** Sitzposition
- die Auswahlentscheidung basiert niemals auf HOLDOUT
- abschließender Transfer auf voll aktiven Gegner ohne DEF-Start-Handicap
- kein Live-AI-Commit, kein Merge nach main; keine automatische Produktivübernahme

## Taktische Q-Historie
Der Q-Lernstand aus v14.9.21 wird aus den GitHub-Artefakten restauriert.
TRAIN-only Beispiele aus elf früheren erfolgreichen Läufen werden genutzt.
Das tabellarische Q-Lernen ist weiterhin primär auf Predator ATTACK-vs-PASS
begrenzt. Das neue Curriculum testet bewusst Regel- und Planungslogik, kein
vollständiges Ende-zu-Ende-Reinforcement-Learning.

## Quellen
- `tests/ai-v1522-finisher-seat-curriculum.cjs`
- `tests/ai-v1522-finisher-seat-aggregate.cjs`
- `tests/ai-v1522-history.cjs`
- `tests/ai-v1522-Q.cjs`
- `.github/workflows/ai-v14922-finishers-seat-parity.yml`
