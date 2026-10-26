# Arcane Duel Desktop – Windows-Testversion

Dies ist der Windows-Desktop-Prototyp für Arcane Duel. Die Anwendung
öffnet die aktuelle Version aus dem **`development`-Branch** als eigenes
Fenster. Der Browser bleibt eingebettet und gegen native Node.js-Zugriffe
abgeschottet.

## Was bereits funktioniert

- Einzelspieler, Sammlung und 2v2 verwenden die vorhandene Online-Version.
- Ab Version **0.1.2** fragt die EXE bei jedem Start GitHub nach dem neuesten
  Commit im `development`-Branch und lädt dessen vollständige Spieldateien.
  So verhindert ein veralteter CDN-Cache, dass Titelbildschirm, Musik oder
  andere neue Inhalte in der Desktop-App fehlen. Bei vorübergehenden
  GitHub-API-Ausfällen versucht sie den letzten erfolgreichen Stand.
- Die Adresse bleibt auf `raw.githack.com`; dadurch bleibt der lokale
  Speicher bisheriger Desktop-Spielstände im selben Browserprofil erhalten.
- Der Desktop-Browser speichert seine Sitzung und den lokalen Speicher
  dauerhaft in einem eigenen Profil (`persist:arcane-duel-development`).
- GitHub-Links öffnen sich im normalen Browser; fremde Webseiten werden
  innerhalb der Anwendung blockiert.
- F11 schaltet zwischen Fenster und Vollbild um.
- Bei Verbindungsproblemen erscheint eine deutschsprachige Fehlerseite mit
  einer Schaltfläche zum erneuten Laden.
- Die Windows-Version wird als portable **`ArcaneDuel-0.1.2-portable.exe`**
  erstellt. Es ist keine Installation erforderlich.
- Ein eigenes arkanes Wappen ist als Programmsymbol in der EXE eingebettet
  und erscheint auch am Desktop und in der Taskleiste.

## Wichtige Grenzen dieser ersten Version

- **Internet ist erforderlich.** Die EXE zeigt die aktuelle Online-Version an,
  statt das komplette Spiel offline zu installieren.
- Ein neues **Desktop-Binary** (z. B. 0.1.2 statt 0.1.1) muss weiterhin manuell
  heruntergeladen werden. Die automatische Prüfung betrifft die Spielinhalte,
  nicht das EXE-Programm selbst.
- Der lokale Speicher innerhalb der App ist **nicht identisch** mit dem
  bisherigen lokalen Speicher in Chrome/Edge. Vorhandene reine
  Browser-Spielstände erscheinen daher nicht automatisch in der Desktop-App.
  Import/Export kann als Übergang genutzt werden, wo das Spiel dies anbietet.
- Bereits serverseitig gespeicherte 2v2-Inhalte verwenden dieselben
  bestehenden Online-Dienste. Ein vollständiger gemeinsamer Cloud-Spielstand
  für Einzelspieler und Desktop ist ein eigenständiger Folgeschritt.
- Der `development`-Branch ist nur für Tests gedacht. Für öffentliche
  Veröffentlichungen sollte ein stabiler, geprüfter Build verwendet werden.
- Das erste Test-Build ist nicht digital signiert. Windows kann beim Start
  deshalb eine SmartScreen-Warnung anzeigen.
- Die digitale Signatur kann erst mit einem gültigen, auf den Herausgeber
  ausgestellten Code-Signing-Zertifikat oder einem Cloud-Signierungsdienst
  aktiviert werden. Hinweise zur sicheren Einrichtung stehen in
  [`SIGNING.md`](SIGNING.md).

## Windows-EXE bauen

Auf einem Windows-Rechner mit Node.js 24:

```powershell
cd desktop
npm ci
npm test
npm run dist:portable
```

Die fertige EXE liegt anschließend in `desktop/dist/`.

Alternativ erzeugt der GitHub-Actions-Workflow
`.github/workflows/arcane-duel-desktop-windows.yml` einen herunterladbaren
Windows-Build, sobald Änderungen an `desktop/` in `development` landen.

## Nächste Ausbaustufe

1. Einzelspieler-Spielstände mit Anmeldung sicher online synchronisieren.
2. Browser-Speicherstände kontrolliert in ein Desktop-Profil importieren.
3. Automatische Updates und signierte Veröffentlichung mit verifizierter Herausgeberidentität.
4. Optional später lokale Spieldateien für einen eingeschränkten Offline-Modus.
