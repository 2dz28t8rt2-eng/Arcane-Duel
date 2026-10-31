# Arcane Duel 1.1.0 – gemeinsame Spieloberfläche

## Verbindliche Entscheidung

Jeder Spieler verwendet **einen persönlichen Spielstand für Einzelspieler und Online-2v2**. Die Spielstände verschiedener Spieler bleiben getrennt. Das gemeinsame Duell synchronisiert das Spielfeld, nicht die Sammlungen oder Deckbearbeitung der Teilnehmer.

Auf dem eigenen Server ist `index.html` die gemeinsame Anwendung. Die alten Duo-Seiten leiten dorthin weiter, einschließlich Einladungsfragment. `main` und das bisherige Supabase-Hosting werden nicht durch diese Integration veröffentlicht.

## Architektur

Die vollständige ursprüngliche Skriptfolge, Menüoberfläche, Kartenansichten, Handbedienung, Fusionserklärungen, Dialoge, Animationen und Audio-Komponenten bleiben die Grundlage. Es gibt kein zweites nachgebautes Online-Menü. `online-client-v230.js` ergänzt Anmeldung, Gruppe, Einladung und Speicherung; `online-battle-v230.js` überträgt bestätigte Serverzustände in dieselbe Duellansicht. Die internen Dateinamen sind historische Kennungen; die gemeinsame Spielversion lautet 1.1.0.

Online-Eingaben führen authentifizierte Serveraktionen aus. Während einer bestätigten Animation ist die Eingabe gesperrt; die nächste Darstellung wird erst anschließend übernommen. Handkarten besitzen stabile numerische Kennungen, die zu den ursprünglichen Klickhandlern passen. Die Übertragung umfasst zeitlich geordnete Einzelaktionen der Gegner, damit Zwischenanimationen nicht durch die abschließende Zustandsabfrage verschwinden.

Die autoritative 2v2-Regelverwaltung bleibt auf dem Server. Sie verwendet aus dem aktuellen Singleplayer erzeugte Karten- und Gegnerkataloge. Zwei bisher fehlende Kampfverbesserungen, Kolossenkraft und Schwarminstinkt, sind dort ergänzt. Die gemeinsame Oberfläche allein ist kein Beweis für identische Berechnungen jeder seltenen Fähigkeit; dafür bleiben die Regel- und Regressionstests maßgeblich.

## Ablauf und Privatsphäre

1. Jeder kann das Spiel allein öffnen und seinen Fortschritt bearbeiten.
2. Der ursprüngliche Host erzeugt oben links einen Einladungslink. Der Gast wartet auf „Du bist einer Gruppe beigetreten. Warte auf Host.“ und kann die Anwendung noch nicht bedienen.
3. „Fortsetzen“ wird für den Host erst nach dem Beitritt aktiv. Danach öffnen beide das ursprüngliche Hauptmenü mit ihrem jeweiligen Spielstand.
4. Der Host wählt einen gemeinsam freigeschalteten Gegner. Der Gast bestätigt mit Ja oder Nein. Nein lässt beide im bisherigen Menü.
5. Im Duell gibt es sieben gemeinsame Monsterzonen je Team, insgesamt 14, doppelte Team-Lebenspunkte und die Reihenfolge Host → Gegner → Gast → Gegner.
6. Hände und Deckreihenfolgen sind privat. Auch Zwischenbilder der Animationen und noch nicht angenommene Floating-Angebote werden pro Empfänger gefiltert. Feldkarten dürfen vom Team beeinflusst werden. Höherer Fortschritt führt gegebenenfalls zu einem temporären Leihdeck; das gespeicherte Deck bleibt erhalten.
7. Aufgabe nutzt den ursprünglichen Bestätigungs- und Ergebnisdialog und zählt für beide als Niederlage. Belohnungen werden pro Teilnehmer einmalig über die vollständige originale Belohnungskette berechnet.

## Bestehende Spielstände

Die erste Übernahme eines alten Online-Profils zeigt beide bisherigen Fortschritte zur Auswahl. Guthaben werden nicht addiert. Vor der Auswahl werden das alte Serverprofil und der lokale Stand gesichert; die Datenbank enthält dafür `player_save_backups`. Der Browser bewahrt zusätzlich persönliche Sicherungen einschließlich Zusatzdaten auf.

Der ursprüngliche Singleplayer-Spielstand ist anschließend die einzige bearbeitbare Grundlage. Die alten Online-Spalten werden nur als abgeleitete Kampfdaten aktualisiert. Frühere Online-Kapitelkarten-Guthaben können im ursprünglichen Laden eingelöst werden. Gegenstände, Deckplätze, Fortschritt und unterstützte Zusatzdaten werden im originalen Format validiert. Altsystem-Forschungen ohne direkte Entsprechung bleiben im vollständigen Migrationsbackup erhalten; es erfolgt keine erfundene Umrechnung ihrer Kosten.

Der private Wiederherstellungslink öffnet dasselbe persönliche Profil auf einem anderen Gerät. Er darf nicht als Einladung weitergegeben werden. Ältere reine Sitzplatz-Wiederherstellungslinks ersetzen keinen persönlichen Profilzugang; gegebenenfalls den bisherigen privaten Profil-Link verwenden. Bestehende aktive Räume werden beim persönlichen Wiederverbinden wiedergefunden. Historische Räume ohne Animationsverlauf können nur ihren letzten Zustand anzeigen; neu gestartete gemeinsame Duelle liefern die vollständige Aktionsfolge.

Gleichzeitige Änderungen verwenden Revisionsprüfungen. Ein veralteter Stand überschreibt keinen neueren automatisch. Während eines Online-Duells verwaltet der Server den Spielstand. Einzelspieler-Fortschritt funktioniert weiterhin lokal bei Verbindungsunterbrechungen und wird nach Wiederverbindung abgeglichen. Ein Browser-Origin-Wechsel benötigt weiterhin Export/Import oder den privaten Profilzugang.

## Prüfung und Veröffentlichung

- `node --test tests/personal-save-v230.test.cjs tests/shared-client-rules-v230.test.cjs tests/selfhost-v229.test.cjs`: Migration, Sicherungen, getrennte Konten, veraltete Schreibzugriffe, Gruppenfreigabe, private Animationsfolgen, Kartenfähigkeiten, Belohnungen und Servergrenzen.
- `node scripts/verify-shared-client-v230.cjs`: zwei echte Browser mit ursprünglicher Oberfläche; getrennte Menüänderungen, Warteraum, Ja/Nein, 14 Zonen, private Hände, Kartenauswahl, Beschwörung, Fusion, Angriff, Aufgabe und Wiederladen. Bildschirmbilder für Desktop und 410 Pixel Breite.
- `npm test`: vorhandene Gesamtsuite einschließlich Singleplayer-Regressionen und Katalogvergleich. Unter Windows vorhandene Forschungs-Regex-Tests reagieren auf CRLF; die verbindliche vollständige Prüfung läuft zusätzlich unter Linux in CI.
- `python3 -m unittest discover -s tests -p test_release_retention.py -v`: sichere Release-Aktivierung und Aufbewahrung der aktuellen sowie unmittelbar vorherigen erfolgreichen Fassung.

Vor Veröffentlichung den exakten Feature-Commit in CI prüfen, anschließend nach `development` integrieren. Ein GitHub-Merge ist noch kein Server-Deployment. Das Paket muss aus dem geprüften sauberen Stand erzeugt und auf dem eigenen Host mit Datenbanksicherung aktiviert werden. Der privilegierte Installer muss für die neue semantische Versionsnummer separat auf den geprüften Repository-Stand aktualisiert werden. Aetherfall und `main` bleiben unberührt.
