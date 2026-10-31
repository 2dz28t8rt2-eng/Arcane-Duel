# Arcane Duel – Windows-Client für den eigenen Server

Die portable Windows-EXE-Version **0.1.6** lädt die jeweils vom Administrator
freigegebene Arcane-Duel-Spielversion über

**https://v2202610436378538039.ultrasrv.de:8443/**

Der Windows-Client benötigt **weder GitHub noch RawGitHack** und fragt keine
GitHub-Revision ab. Die offizielle Spielversion (zum Zeitpunkt der Umstellung
**1.1.2**) wird vom Server angezeigt. Spiel- und Serverupdates erfordern
keine neue EXE. Beim Start wird nur der HTTP-Cache gelöscht, **nicht**
localStorage, Cookies, IndexedDB oder private Profile.

## Start

Windows 10/11 x64; die portable
`ArcaneDuel-Server-0.1.6-portable.exe` starten. Internet und HTTPS-Port
**8443** müssen verfügbar sein. Bei Ausfall erscheint eine deutschsprachige
Seite mit Wiederholen-Schaltfläche. **F11** schaltet Vollbild ein oder aus.

Die Desktop-Hülle verwendet das eigene Profil
`persist:arcane-duel-selfhost`. Der alte Desktop-Client, Chrome und Edge
haben andere lokale Browser-Speicher. Früher lokal gespeicherte
Singleplayer-Spielstände bei Bedarf über den Spiele-Export und -Import
übertragen. Auf dem Server gespeicherte Profile/Spielstände bleiben erhalten;
es werden keine privaten Schlüssel, SQLite-Daten oder Administratorrechte
mit der EXE verteilt.

## Sicherheit

Der Client erlaubt im Fenster nur den exakten HTTPS-Host samt Port 8443,
verbietet Popups/Webviews und stellt der Webseite **keine nativen Node-APIs**
bereit (`sandbox:true`, `nodeIntegration:false`,
`contextIsolation:true`, `webSecurity:true`). Externe Links werden im
Fenster blockiert. Die Desktop-App verwaltet keine Live-Veröffentlichungen.

## Selbst unter Windows bauen

Mit Node.js 24:

```powershell
cd desktop
npm ci
npm test
npm run dist:portable
```

Die EXE liegt danach in `desktop/dist/`. Bestehende
GitHub-Buildabläufe dienen hier nur einmalig zur Erstellung der
Windows-Binärdatei; für die spätere Nutzung ist GitHub nicht erforderlich.

**Signierung:** Ohne vertrauenswürdig ausgestelltes Code-Signing-Zertifikat
kann Windows SmartScreen die EXE als unbekannten Herausgeber behandeln.
Siehe `SIGNING.md`. Die Windows-Binärversion 0.1.6 ist unabhängig von
der aktuell auf dem Server angezeigten Spielversion.
