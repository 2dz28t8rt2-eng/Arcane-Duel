# Zugelieferter Entwicklungsstand 1.1.3 – Elementvielfalt, 2v2-Inspektor und große Arena

Diese Notizen stammen aus dem externen Updatepaket. Dessen Nummerierung ist
nicht identisch mit dem veröffentlichten Serverrelease 1.1.3
(`8413b3a0bf7d40740e836c4313c17e9fd2a54e80`, Give-up-Button und Validierung
bis 60 Züge). Beide Entwicklungslinien werden in 1.1.4 zusammengeführt.
Änderungen an `duoPage` betreffen die ältere Ansicht; der eigene Server
verwendet weiterhin die gemeinsame Singleplayer-Oberfläche.

## Änderungen

- **Neue Fusion: Elementvielfalt:** Genau fünf ausgewählte Materialien mit **fünf verschiedenen, nichtleeren Elementen** geben **+5 Prozentpunkte Fusionsqualität**. Kombinationen mit 2–4 Materialien oder mehrfach vorkommenden Elementen erhalten diesen Bonus nicht. Die bisherige Elementharmonie (**+2,5 Prozentpunkte bei identischen Elementen**) bleibt bestehen. Die normale Qualitätsbegrenzung bleibt erhalten. Anzeige in den Fusionsvorschauen, beiden Regelhilfen und Fusionsanimationen aktualisiert.
- **Große Karte links im 2v2:** Ein Klick auf eine belegte Feldzone (auch das Feld eines Teammitglieds oder Gegners) aktualisiert die große Kartenansicht. Der Klick wird bereits in der Capture-Phase ausgewertet, damit konkurrierende Spielfeldinteraktionen die Anzeige nicht verhindern. Die Kartenansicht öffnet sich automatisch.
- **Seelenzehrer-Fähigkeiten:** Bei eigenen Seelenzehrern in **DEF** und nur **im eigenen Zug** erscheinen Verdichten, Seelenstoß, Seelenraub und gegebenenfalls Entzugsfokus jetzt auch **direkt in der linken großen Kartenansicht**. Das bisherige Popup verwendet dieselbe Sicherheits-/Aktionslogik. Aktionen werden ausschließlich durch den bestehenden Server-Handler verarbeitet; fremde Handkarten/Partnerfähigkeiten bleiben geschützt.
- **Größere 2v2-Arena:** Mehr Raum für das Spielfeld und die beiden gemeinsamen Siebener-Reihen, Karten relativ zur Zone vergrößert, Platz- und Kartentexte lesbarer. Auf kleineren Displays bleiben die sieben Zonen in horizontal scrollbar angeordnet. Individuelle Spielfeldvergrößerung jetzt 80–140%, standardmäßig 110% in einem neuen lokalen, rein visuellen Einstellungsbereich.

## Versionsstand und Betrieb

- Offizielle Spiel-/Serverversion **1.1.3**; vorher **1.1.2**.
- Diese Version betrifft Solo, 2v2 und serverseitige Fusionsregeln. Originalmonster/-grafiken/-sounds bleiben unverändert vorhanden.
- Onlineprofile, Spielstände, SQLite-Datenbank, bestehende Belohnungen und die Anwendung Aetherfall **nicht** in das Releasepaket kopieren oder verändern.
- Keine Änderung an der Datenbankstruktur und keine Neuanlage von Benutzerprofilen.
- Uploads erfolgen ausschließlich über den bisherigen Administratorfreigabeweg; das Release wird **nicht automatisch aktiviert**.
- Bei Freigabe exakt den Namen und SHA256 der neu erzeugten Release-Datei aus `release.json` bzw. `.sha256` verwenden; das Administratorwerkzeug prüft Archiv und Datenbank und verwaltet die zwei neuesten funktionierenden Spielversionen.
- Aktiver Serverstand muss vor Installation separat per `/api/health` geprüft werden. Live-Aktivierung und öffentliche Zwei-Browser-Tests erfordern den Administrator.
- **Desktop-Hinweis:** Die bisherige Windows-Hülle **0.1.6** verwendet den eigenen Server, aber leert bei jedem Start den HTTP-Cache. Die Vorgabe *Assets nur bei neuer Serverversion laden* ist in dieser Windows-Version noch nicht implementiert. Sie erfordert ein separates, getestetes Desktopupdate; dieses Server-Release behauptet keine Änderung an der EXE.

## Tests

Neue gezielte Regressionstests: `node --test tests/update-v113-element-inspector-board.test.cjs`.

Weitere relevante Suiten: `tests/duo-parity-v160.test.cjs`, `tests/duo-soul-condense-v176.test.cjs`, `tests/duo-parity-20261030.test.cjs`, `tests/duel-usability-v2071.test.cjs`, `tests/selfhost-v229.test.cjs`, `tests/personal-save-v230.test.cjs`, `tests/shared-client-rules-v230.test.cjs` sowie `python -m unittest discover -s tests -p test_release_retention.py`.

Für reale End-to-End-Tests nach Administratorfreigabe: zwei unabhängige Testprofile, eigene/Partner-/Gegner-Feldmonster anklicken; links muss jeweils die richtige Karte erscheinen. Nur bei eigenem Seelenzehrer in DEF und eigenem Zug aktive Buttons prüfen. Unterschiedliche fünffarbige Fusionsmaterialien und die Kartenansicht auf Desktop und schmalen Bildschirmen testen.
