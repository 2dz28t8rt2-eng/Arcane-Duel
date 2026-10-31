# Arcane Duel – verbindliche Singleplayer-Versionierung

**Beginn:** 31.10.2026, offizieller Entwicklungsstand **v4.1.0-dev.1** auf `development`.

## Eine verbindliche Versionsnummer

Die offizielle Spielversion steht in `index.html` unter
`<meta name="arcane-duel-version" content="…">`.
`assets/solo-version.js` übernimmt sie in das **Titelmenü**, unter
**Optionen**, in die **Spieloberfläche** und in den **Browsertitel**.
Auch `package.json` sowie die beiden Versionsstellen von
`package-lock.json` müssen exakt übereinstimmen. Der automatische
Versionscheck prüft das.

Die **Modul- und Arbeitsständenamen** wie `v22.7`, `v22.8`, `v22.9`,
`v21.2` oder `v186` sind **keine** globalen Spielversionsnummern.
`4.1 · BESTIARIUM` bleibt der Name der Spielgeneration.
Die **Desktop-EXE** hat weiterhin ihre eigene Binärversion (derzeit 0.1.5).
Die Profil-/Spielstand-Schema-Version `PROFILE_VERSION` ist ebenfalls
unabhängig davon und wird durch reine Spielupdates **nicht** erhöht.

## Nummernschema

- Entwicklungsstand: `MAJOR.MINOR.PATCH-dev.N`, z. B. `4.1.0-dev.2`.
- Stabilisierte Freigabe: `MAJOR.MINOR.PATCH`, z. B. `4.1.0`.
- Fehlerkorrektur nach Freigabe: `4.1.1`, größere Ergänzung `4.2.0`.
- Keine Wiederverwendung einer schon veröffentlichten Versionsnummer für
  geänderte Singleplayer-Spielinhalte.
- Ein neuer getesteter Inhalt auf `development` erhält **vor dem Merge**
  seine neue Versionsnummer. Ein Release auf `main` wird erst nach
  ausdrücklicher Abnahme durchgeführt.

## Änderungen und Prüfung

Beim Ändern von `index.html` oder `assets/**` (außer ausschließlich
duo-spezifischen Modulen) muss das Team die drei Versionsstellen
aktualisieren: Meta-Tag, `package.json` und `package-lock.json`.
Der GitHub-Workflow `singleplayer-version.yml` prüft auf Push und
Pull Request, dass die deklarierte Version übereinstimmt und gegenüber
dem verglichenen Branch-Stand **steigt**, sobald der relevante
Singleplayer-Runtime-Code verändert wurde.

Der Verlauf ist anhand von Versionsnummer und GitHub-Commit nachvollziehbar.
Die sichtbare Versionsnummer dokumentiert den Spiel-Build, **nicht**
den Zeitpunkt des letzten Speicherns oder eine neuere Form des
Spielstandformats. Die Anzeige erfordert keine Datenspeicherung,
kein Token und keinen Netzwerkzugriff.

## Erste zugeordnete Version

`v4.1.0-dev.1`: Arcane Duel 4.1 Bestiarium, einschließlich
Solo-Überarbeitung v22.7, geteilter Präsentation v22.8 und
Hosting-/Startmenüintegration v22.9.
