# Arcane Duel 1.1.4 – integriertes Serverupdate

## Herkunft

Basis ist `development` bei `d2de6da8519330701da9752601161229ed7e8e92`.
Die 27 Quelldateien aus `ArcaneDuel-Komplettupdate-1.1.4.zip` wurden damit
zusammengeführt. SHA256 des gelieferten ZIP:
`7eb307cc533640710ec51f9a615ef10635063d7065a10d3988b7f09af6c167c5`.

Das mitgelieferte Serverarchiv `v1.1.4-2c25aefefaa4.tar.gz` basiert auf
1.1.2 und enthält die zuletzt veröffentlichten Aufgeben-Korrekturen nicht.
Es darf nicht anstelle des neu erzeugten integrierten Releases installiert
werden. Maßgeblich sind dessen Git-Commit, `release.json` und SHA256-Datei.

## Änderungen

- Genau fünf Fusionsmaterialien mit fünf verschiedenen, nichtleeren Elementen
  geben fünf Prozentpunkte zusätzliche Qualität. Elementharmonie und die
  Qualitätsobergrenze bleiben erhalten; Vorschauen und Regeltexte erklären
  den neuen Bonus.
- Natürlicher Seelenzerfall und sein LP-Effekt erfolgen zum eigenen
  Zugbeginn, auch bei Gegnern. Kein zweiter Zerfall am Zugende. Die
  Entzugsanimation bleibt erhalten, wenn der Vorrat durch gleichzeitigen
  Zerfall trotz erfolgreichem Entzug insgesamt sinkt.
- Auch bei sieben belegten Teamzonen kann eine eigene Handkarte gespielt
  werden. Die Zielzone bietet ausdrücklich Abbrechen, Ersetzen und Fusion.
- Eine Handfusion kann nach Bestätigung eine belegte Teamzone ersetzen.
  Die ersetzte Karte ist kein zusätzliches Fusionsmaterial und landet im
  Friedhof ihres tatsächlichen Besitzers.
- Feldfusionen verbrauchen erlaubtes Partner-Material genau einmal.
- Eigene, Partner- und gegnerische Feldkarten bleiben außerhalb des eigenen
  Zuges lesbar. Aktionen bleiben an den aktiven Spieler gebunden.
- Die Inspektor-/Größenänderungen des Pakets für die ältere `duoPage`-Ansicht
  sind enthalten. Die Serverversion nutzt weiterhin die Originaloberfläche
  und deren bestehenden Feldgrößenregler.

## Erhaltene Korrekturen und Daten

- Sichtbarer **Give up**-Button, Bestätigungsdialog, Abbrechen und Schutz vor
  einer Bestätigung aus einem inzwischen anderen Duell bleiben erhalten.
- Duelle bis 60 Züge bleiben gültige Spielstandeinträge. Die frühere Meldung
  „Ungültiger Duelleintrag“ wird nicht wieder eingeführt.
- Ein persönlicher Spielstand je Spieler für Solo und Online; beide Spieler
  behalten getrennte Profile, Decks, Inventare und Fortschritte.
- Sieben gemeinsame Zonen je Team, insgesamt 14; fremde Hände bleiben
  verborgen. Gegnerbegrenzung und Leihdeckregeln bleiben erhalten.
- Keine Datenbankmigration, keine privaten Profile aus dem Paket, keine
  Änderung an Aetherfall oder `main`.
- Dieses Serverrelease erzeugt keine neue Windows-EXE. Die bestehende
  Serveranbindung der Windows-Hülle bleibt erhalten.

## Zusätzliche Integrationskorrekturen

Der echte Zwei-Browser-Test fand eine weitere Sperre in der ursprünglichen
Handkarten-Auswahl: Bei vollem Feld wurde die Auswahl bereits vor dem neuen
Ersatzdialog verweigert. Die Online-Anbindung überbrückt diese Sperre und
behält die serverseitige Bestätigung bei. Außerdem berücksichtigt die
aktuelle Online-Animation den Seelenzerfall vor dem Entzug; die entsprechende
Paketkorrektur betraf zunächst nur die ältere Darstellung. Die Verweise auf
`game.js` und `online-battle-v230.js` wurden auf 1.1.4 aktualisiert.

## Reproduzierbare Prüfungen

- Vollständiges `npm test` mit Node 24, einschließlich der langen
  Wirtschaftssimulation; keine Testdatei wird ausgeschlossen.
- `node scripts/verify-shared-client-v230.cjs`: zwei Browser, Gruppenbeitritt,
  Ablehnen/Annehmen, private Hände, Originalfusionen und Angriffe, mobile
  Aufgeben-Schaltfläche sowie Aufgeben nach 33 Zügen und Neuladen.
- `node scripts/verify-update-v114.cjs`: volles Teamfeld, Abbruch,
  Partnerersatz, Hand-/Feldfusion, Inspektion im Partnerzug und Seelenentzug
  bei negativem Nettovorrat. Ausschließlich lokale Testdaten in einer
  kurzlebigen In-Memory-Datenbank.
- `python3 -m unittest discover -s tests -p test_release_retention.py` unter
  Linux: sieben Tests für sichere Versionsaufbewahrung einschließlich
  Schutz vor Verweisen auf fremde Verzeichnisse.

Vor Aktivierung Live-Version, Datenbankintegrität und Sicherung prüfen. Das
vorhandene Administratorwerkzeug erstellt eine frische Sicherung, aktiviert
ein geprüftes vollständiges Archiv und behält die unmittelbar vorherige
Version. Danach öffentliche Prüfsummen, Solo- und Zwei-Spieler-Abläufe mit
eigenen Testprofilen prüfen. Paketbau und Upload sind kein Nachweis einer
erfolgreichen Veröffentlichung.
