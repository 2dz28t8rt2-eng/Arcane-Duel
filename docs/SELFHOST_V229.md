# Arcane Duel auf dem eigenen Server – Spielversion 1.0.0

**Offizielle Version ab 31.10.2026: 1.0.0 = bisheriger Entwicklungsstand v22.9 (historisches Technik-Kürzel v229).** Die Nummern v22.x/v229 werden nicht als neue Spielversion weitergezählt. Der sichtbare Spielname und alle Menüs verwenden ausschließlich die aktuelle Nummer im Format `1.0.0`, `1.0.1`, `1.1.0`; Singleplayer und Multiplayer teilen sich **eine Versionsnummer**.

**Wichtig:** Die Umstellung ist im GitHub-Branch `development` vorbereitet. Sie bestätigt **nicht**, dass Version 1.0.0 schon auf der produktiven Website aktiviert wurde. Dazu muss der Serveradministrator das geprüfte Deployment-Programm auf dem Host installieren und die Veröffentlichung durchführen.

## Ziel und Trennung

Einzelspieler und Online-2v2 werden von demselben Arcane-Duel-Paket ausgeliefert. Das gemeinsame Online-Duell läuft vollständig mit Node.js 24 und einer privaten SQLite-Datenbank auf dem eigenen Server. Für Spielen, neue Profile, Einladungen, Deckänderungen, Wiederbeitritt und Belohnungen ist Supabase nicht erforderlich.

Veröffentlichte Adresse: `https://v2202610436378538039.ultrasrv.de:8443/`. Der eigene HTTPS-Port bildet eine andere Browser-Origin als Aetherfall auf Port 443. Die Dateien, Datenbank, Dienstbenutzer und Sicherungen sind getrennt. Beide Anwendungen teilen Serverhardware und Caddy; deshalb darf der Aetherfall-Block der Caddy-Konfiguration nicht überschrieben werden.

## Änderungen gegenüber v228

- `server/main.cjs`: eigener HTTP-Dienst auf `127.0.0.1:8777`, begrenzte Anfragen, Prüfung der Browser-Origin und ausdrücklich begrenzte öffentliche Dateien.
- `server/duo-handler.cjs`: führt den vorhandenen autoritativen Handler und dieselben vier Regelmodule aus. Bekannte Importe werden explizit auf lokale Dateien und den Speicheradapter abgebildet; unbekannte Importe verhindern den Start. Keine nachgebaute vereinfachte Duelllogik.
- `server/sqlite-store.cjs`: private Profile/Räume, atomare Revisionen und Transaktionen, dauerhafte Datenbank außerhalb der Spielversion. Übernahme der bestehenden Belohnungslogik: Erstabschluss, drei Wiederholungszahlungen pro Kapitel/UTC-Tag, eigene Belohnungen je Spieler und Duellnummer, Fanatiker-Ziele und Freischaltungen.
- Die Oberfläche wählt auf diesem Server `/api/duo`; GitHub-Hosting behält den bisherigen Endpunkt. Auf dem eigenen Server führen ältere 2v2-Einstiegsseiten zum aktuellen 2v2-Modus.
- Eigene Systemdienste, Speicherbegrenzung, tägliche geprüfte Datenbanksicherung und begrenzter SFTP-Uploadbereich.
- Geprüfte Veröffentlichungspakete mit SHA256-Manifest, atomarer Umschaltung, Sicherung vor Updates und automatischem Rückwechsel, falls der neue Dienst nicht startet.
- Optionaler, ausdrücklich ausgelöster Import eines bestehenden Online-Profils anhand seines privaten Profil-Links. Dabei werden ausschließlich vom bisherigen Server bestätigte Daten übernommen. Bereits übernommene Profile werden nie überschrieben.
- Zusätzliche Serverprüfungen sowie parametrisierbare Browserprüfung gegen einen echten eigenen Server.
- Die beiden öffentlichen Desktop-Symboldateien sind ausdrücklich im Paket enthalten; das Startmenü verwendet `desktop/build/icon.png`. Andere Desktop-Quelldateien bleiben gesperrt.

Die gemeinsamen Darstellungen, Sounds und Animationen aus v228 bleiben erhalten. Siehe `DUO_SHARED_PRESENTATION_V228.md` für den tatsächlichen Umfang. Diese Veröffentlichung behauptet keine vollständige Angleichung der noch unterschiedlichen Werkstatt- und Fortschrittssysteme. Keine neue Windows-EXE wird durch das Serverpaket gebaut.

Im bisherigen Repository fehlt `assets/sfx-v208/win.ogg`. Die bestehende gemeinsame Audiofunktion spielt bei diesem fehlenden Sample ihre synthetische Ersatzmelodie. Diese Veröffentlichung fügt keine neue Siegaufnahme hinzu und behauptet keine vollständige Sammlung aller ursprünglich vorgesehenen Audiodateien.

## Unveränderte Spielvorgaben

Zwei unabhängige Spielerprofile, eigene Decks und private Handkarten. Gemeinsame sieben Monsterzonen pro Team (14 insgesamt). Öffentliche Partnerkarten dürfen nach den vorhandenen Regeln beeinflusst werden. Der ursprüngliche Host lädt ein und wählt das Duell. Der niedrigere Fortschritt begrenzt die Auswahl; der fortgeschrittene Spieler erhält ein temporäres Leihdeck. Gespeicherte eigene Decks werden dadurch nicht ersetzt. Zugreihenfolge: Host, Gegner 1, Gast, Gegner 2.

## Bestehende Spielstände

Die neue Browseradresse hat ihren eigenen lokalen Speicher. Einzelspieler: auf der bisherigen Seite unter Spielstand/Einstellungen exportieren, auf der neuen Seite importieren. Bestehende Daten auf der bisherigen Adresse werden nicht gelöscht.

Online: auf der bisherigen Seite den **privaten Profil-Link** sichern. Auf der neuen 2v2-Seite bei „Bestehendes Online-Profil übernehmen“ einfügen. Das ist keine Einladung und der Link darf nicht geteilt werden. Laufende alte Räume werden nicht übertragen; eine neue Gruppe bilden. Zwei Spieler übertragen jeweils ihr eigenes Profil. Die bisherigen Supabase-Daten werden nicht verändert. Der einmalige Import benötigt die Erreichbarkeit des bisherigen Servers; normales Spielen danach nicht. Der Import ist mit `ARCANE_LEGACY_IMPORT=0` abschaltbar.

Die privaten bisherigen Belohnungsbelege stehen der öffentlichen Profil-API nicht zur Verfügung. Deshalb ist das Wiederholungslimit für bereits abgeschlossene Kapitel am Importtag vorsorglich ausgeschöpft; ab dem nächsten UTC-Tag gilt das normale Limit. Es wird kein vorhandenes Guthaben abgezogen. Ein vollständiger automatischer Import sämtlicher bisheriger Nutzer ohne deren Profilzugang wurde nicht durchgeführt.

## Veröffentlichung durch den Entwickler

1. Repository `https://github.com/2dz28t8rt2-eng/Arcane-Duel` verwenden. Änderungen auf eigenem Feature-Branch testen und nach `development` integrieren. `main` unverändert lassen.
2. Sauberen, geprüften Stand auschecken. Node.js 24 und Python 3 verwenden.
3. `npm test`, `node --test tests/selfhost-v229.test.cjs`, vorhandene Browserprüfungen ausführen. Der neue Server hat keine zusätzlichen npm-Laufzeitabhängigkeiten.
4. Paket erzeugen: `python scripts/package-selfhost.py --output ../arcane-release`. Nur bestätigte saubere Stände veröffentlichen; `--allow-dirty` ist ausschließlich für lokale QA und wird vom Server nicht aktiviert.
5. SFTP: Host `v2202610436378538039.ultrasrv.de`, Port `22`, Benutzer `arcane-upload`, privater Schlüssel `arcane_duel_upload_ed25519`. Archiv und `.sha256` nach `/uploads` übertragen. Einen temporären Dateinamen verwenden und erst nach vollständigem Upload umbenennen.
6. Administrator aktiviert mit `/usr/local/sbin/arcane-duel-release /srv/arcane-duel-upload/uploads/DATEI.tar.gz SHA256`. Dieses geprüfte Administratorwerkzeug wird getrennt vom hochgeladenen Spielcode verwaltet. Änderungen daran müssen separat geprüft und installiert werden. Der Uploadbenutzer hat absichtlich keine Shell und keine Aktivierungsrechte.
7. `/api/health`, Einzelspieler und ein echtes Zwei-Spieler-Duell unter der öffentlichen Adresse prüfen. Bei Änderungen der Datenstruktur auch Rückwärtskompatibilität und Sicherung/Rückkehr prüfen.

Schlüssel und Zugangspakete gehören niemals ins Repository oder Spielarchiv. Der vorhandene Aetherfall-Administratorzugang wird nicht an Arcane-Duel-Mitwirkende weitergegeben.

## Verbindliche Zwei-Versionen-Regel (Solo und Multiplayer)

**Maximal zwei geprüfte Spielpakete auf dem neuen Server:** Das aktuell aktive Release und sein unmittelbar vorheriges funktionierendes Release. Jedes Release enthält Singleplayer **und** Multiplayer; beide stammen immer aus derselben freigegebenen Revision **und haben die gleiche offizielle Versionsnummer**. Keine zwei getrennten Webstände pro Spielmodus verwenden.

**Beispiel:** Nach v1 nur v1; nach v2 v1 + v2, v2 aktiv; nach erfolgreich aktivierter v3 nur v2 + v3, v3 aktiv. v1 wird erst gelöscht, **nachdem** v3 gestartet wurde und der Gesundheitscheck dieselbe freigegebene GitHub-Revision bestätigt hat.

Das Administrationsskript `server/deploy-release.py` übernimmt die Bereinigung nach erfolgreichem Health-Check: aktuelle Releases im technischen Schema `v1.0.0-<12 hex>` (danach höhere nummerierte Releases) und – für einen sicheren ersten Rollback – bestehende alte `v229-<12 hex>`-Releases unter `/opt/arcane-duel/releases`, zusätzlich ihre jeweils passenden alten Upload-Archive und SHA256-Dateien unter `/srv/arcane-duel-upload/uploads`. Die Benutzeranzeige bleibt ohne `v` und ohne Commit-SHA: **1.0.0**. Andere Verzeichnisse, Uploads, private SQLite-Daten, WAL/SHM-Dateien, Profil-Links, Wiederherstellungsdaten, andere Websites (Aetherfall), Systemdienste und Backups werden **nie** als alte Versionen gelöscht. Staging-Dateien werden nicht als freigegebenes Release gezählt. Ein erfolgloser Build wird zurückgerollt und nicht als neue aktive Spielversion behalten.

**Wichtig:** `server/deploy-release.py` liegt als geprüfte Vorlage im Repository und wird im Releasepaket ausgeliefert, aber der tatsächlich ausgeführte privilegierte Befehl `/usr/local/sbin/arcane-duel-release` ist bewusst **separat** installiert. Eine GitHub-Codeänderung aktiviert die neue Löschregel nicht automatisch. Der Serveradministrator muss die geprüfte Vorlage mit gesichertem Rückweg separat installieren, bevor die Zwei-Versionen-Regel auf dem produktiven Host verbindlich automatisiert ist. Ohne Zugriff auf den Host keine erfolgreiche Installation oder physische Löschung behaupten.

**Prüfung:** `python3 -m unittest discover -s tests -p test_release_retention.py -v`; GitHub-Workflow `selfhost-v229.yml` führt diese Prüfung ebenfalls aus. Vor dem ersten produktiven Cleanup aktuelle Verzeichnisliste, `current`-Symlink, vorhandene Backups und laufenden Dienst kontrollieren; nach Aktivierung erneut prüfen, dass genau die aktive und ihre unmittelbar vorige Release-ID vorhanden sind. Bei erfolgreichem v3 dürfen keine alten v1-Releaseordner/-Archive übrig bleiben.

## Betrieb und Wiederherstellung

- Dienst: `arcane-duel.service`; Benutzer: `arcane-duel`.
- Versionen: `/opt/arcane-duel/releases/`; aktive Version: `/opt/arcane-duel/current`.
- Datenbank: `/var/lib/arcane-duel/arcane.sqlite`, inklusive WAL/SHM während des Betriebs.
- Umgebung: `/etc/arcane-duel.env`; keine Supabase-Service-Schlüssel erforderlich.
- Caddy-Zusatz: `/etc/caddy/arcane-duel.caddy`.
- Firewall-Zusatz: `/etc/nftables.d/arcane-duel.nft`; erlaubt TCP/UDP 8443 in der vorhandenen zentralen Server-Firewall. Bestehende Regeln/Ports bleiben erhalten.
- Sicherungen: `/var/backups/arcane-duel/`; `arcane-duel-backup.timer` täglich, 30 Sicherungen aufbewahrt. Es sind Sicherungen auf demselben Server, noch keine externe Katastrophensicherung.
- Manuelle Sicherung: `systemctl start arcane-duel-backup.service`.
- Protokolle: `journalctl -u arcane-duel.service`. Keine Profile, Kartenhände oder Zugangstoken protokollieren.
- Bei Rückkehr zu einer früheren Spielversion: nur den Arcane-Duel-Versionslink umschalten und `arcane-duel.service` neu starten. Datenbank nur bei erforderlicher Datenrücksetzung aus einer geprüften Sicherung wiederherstellen; vorher Dienst anhalten und den aktuellen Stand sichern. Niemals Aetherfalls Dienste oder Datenbanken verwenden.

## Lokale Prüfung

`ARCANE_DATABASE` auf eine separate Testdatei setzen, `ARCANE_ORIGIN=http://localhost:8757`, `ARCANE_PORT=8757`; anschließend `node server/main.cjs` starten. Für den bestehenden Zwei-Browser-Test: `DUO_QA_BASE_URL=http://localhost:8757`, `DUO_QA_ENDPOINT=http://localhost:8757/api/duo`, dann `node scripts/verify-duo-browser-v221.cjs --live`. Dafür ausschließlich neue Testprofile verwenden. Die normale Produktionsgrenze von fünf neuen Profilen pro IP/Stunde gilt auch hier.

Technische Primärquellen: [Node.js SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html), [Node.js TypeScript-Stripping](https://nodejs.org/docs/latest-v24.x/api/module.html#modulestriptypescripttypescode-options), [Caddy-Adressen](https://caddyserver.com/docs/caddyfile/concepts#addresses), [OpenSSH](https://man.openbsd.org/sshd_config).
