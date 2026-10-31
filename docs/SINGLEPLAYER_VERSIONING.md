# Arcane Duel – verbindliche Spiel- und Serverversion

**Neue offizielle Basis: 1.0.0 (31. Oktober 2026).** 
**Exakte Gleichsetzung: Serverversion 1.0.0 = bisheriger Entwicklungsstand v22.9.** 
Dieser Stand vereint Solo v22.7, gemeinsame Präsentation v22.8 und Selfhosting v22.9 (technisches Kürzel v229).
Die bisherigen Nummern v22.7/v22.8/v22.9 sowie 4.1.0-dev.1 sind **nur historische Referenzen**.
Sie sind keine Versionsnummern mehr, werden nicht weitergeführt und sollen nicht als aktuelle Version im Spiel erscheinen.

## Eine Version für beide Spielmodi

**Ein einziges, exaktes Schema:** `MAJOR.MINOR.PATCH`, ohne vorangestelltes `v`, ohne `-dev`,
ohne Versionsnamen/Beinamen wie „Bestiarium“ im Titel oder Menü:
`1.0.0` → `1.0.1` → `1.0.2`, neue Features `1.1.0`, grundlegende Änderungen `2.0.0`.
Die Versionsnummer bezieht sich auf das **gesamte Spielpaket**, also Einzelspieler,
Online-2v2 und den dazugehörigen Server-Code.

`index.html` ist die kanonische Quelle:
`<meta name="arcane-duel-version" content="1.0.0">`.
`duo-campaign-v2.html` und `collection-v3.html` tragen dieselbe Versionsangabe.
`assets/solo-version.js` zeigt die jeweils aktuelle Nummer automatisch auf beiden
Titel-/Menüoberflächen, im Spiel und im Browsertitel.
Die Solo-Navigation `assets/menu-shell-v221.js` und `assets/royal-menu.js` lesen dieselbe
Versionsangabe aus `window.ArcaneDuelRelease.version`; keine getrennten statischen
Versions- oder Generationstitel im Benutzer-Menü.

`package.json` und die zwei Root-Versionsfelder in `package-lock.json` müssen
immer exakt übereinstimmen. `scripts/package-selfhost.py` liest die Version direkt
aus `index.html`, prüft die Duo-Seite, trägt `release.json.version="1.0.0"` ein und
vergibt eine nur technische eindeutige Paket-ID `v1.0.0-<12 Zeichen Commit-SHA>`.
`/api/health` meldet nach erfolgreicher Aktivierung `version: "1.0.0"` und die Commit-Revision.
Die ID und dateiinterne Bezeichner wie `v229` sind **nicht** der angezeigte Spielname.

**Abgrenzung:** Windows EXE `desktop/package.json` (derzeit 0.1.5) bezeichnet
das Installationsprogramm, **nicht** die im Fenster geladene Spielversion.
Das Spielstand-/Profil-Schema `PROFILE_VERSION=3` wird durch Umnummerierung nicht
verändert; alte Profile bleiben erhalten.

## Version bei Updates erhöhen

Jede nachfolgende Änderung am spielbaren Singleplayer, Multiplayer, Assetbestand,
Regel-/Backend-Code oder Server-Release erhält vor gemeinsamer Freigabe eine **neue
höhere Version**. Ein neues Release mit veränderten Spielinhalten darf dieselbe Nummer
nicht weiterverwenden. Die Verknüpfung zu einem exakten Commit-SHA verhindert
Verwechslungen.

`scripts/check-solo-version.cjs` und `.github/workflows/singleplayer-version.yml`
prüfen, ob Spielseiten, Paket- und Sperrdateien exakt denselben Nummernstand tragen,
und verhindern fehlende Erhöhungen bei relevanten Runtime-Änderungen.
Die einzige explizite Ausnahme ist die **einmalige Umstellung** von
`4.1.0-dev.1` auf `1.0.0`, die keine inhaltliche Herabstufung darstellt.

Änderungen gehören auf `development`; `main` bleibt ohne ausdrückliche
Spielabnahme unverändert. Ein GitHub-Commit ist **keine** produktive
Server-Aktivierung.

## Auf dem Server nur zwei Releases behalten

Bei jeder **erfolgreichen** Installation liegen maximal die aktuelle, spielbare
Fassung und die **direkt vorherige erfolgreich gestartete** Fassung auf dem neuen
Server. V1 → V1 aktiv; V2 → V2 aktiv, V1 Rollback; V3 → V3 aktiv, V2 Rollback,
V1 wird nach erfolgreichem Healthcheck entfernt. Das gilt identisch für Solo
und Duo, denn sie stecken in **einem** Releasepaket.
SQL/SQLite-Profile, Saves, Backups und andere Anwendungen werden nie entfernt.

Historisch vorhandene `v229-<SHA>`-Releaseordner werden für den ersten sicheren
Übergang als mögliche **eine** Vorgängerversion anerkannt; erst nach einem weiteren
erfolgreichen Update dürfen sie aus dem Releaseordner entfernt werden.
Der privilegierte Installer auf dem Live-Host muss separat aktualisiert werden,
weil der GitHub-Code nicht automatisch auf dem Server installiert wird.
Näheres: [docs/SELFHOST_V229.md](SELFHOST_V229.md).

## Fortsetzung für andere ChatGPT-Chats

Immer zunächst aktuellen `development`-HEAD, die tatsächlich angezeigte
Nummer, letzte CI-Läufe und gegebenenfalls die reale Server-`/api/health`-Version
prüfen. Für ein nächstes Update die **gleiche neue** Nummer in allen Spielseiten,
`package.json` und `package-lock.json` eintragen und sicherstellen, dass das
Servermanifest sie übernimmt. Alte v22.x/v229-Bezeichnungen nie als neue offizielle
Spielversion verwenden.
