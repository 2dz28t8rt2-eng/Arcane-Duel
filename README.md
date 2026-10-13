# Arcane Duel – Entwicklungszweig

Die stabile, öffentlich spielbare Version wird von `main` über GitHub Pages ausgeliefert. Dieser `development`-Branch dient der Weiterentwicklung und ist **nicht** die veröffentlichte Version.

## Dateistruktur

- `index.html`: Benutzeroberfläche
- `assets/styles.css`: Layout und Gestaltung
- `assets/game.js`: Spielelogik inklusive lokaler Speicherung
- `tests/smoke.test.cjs`: Node-basierte Regressionstests

## Testen

Node.js 20 oder höher installieren und im Repository `npm test` ausführen. Tests prüfen unter anderem Duellstart, Fusion, gespeicherte Partie und 30 simulierte Duelle.

Zum Spielen im Browser die Dateien über einen lokalen Webserver ausliefern, zum Beispiel `python -m http.server 8000`. Externe CSS-/JS-Dateien müssen zusammen mit der HTML-Datei veröffentlicht werden.

## Spielstände und Veröffentlichung

Das Speicherformat und der `localStorage`-Schlüssel `arcane-duel-rpg-profile-v3` bleiben unverändert. **Vor einem produktiven Update einen JSON-Spielstand exportieren** und Import/Wiederherstellung im Browser testen.

Keine Änderungen automatisch von `development` nach `main` übernehmen. Vor Veröffentlichung: Testlauf, kurzer Browser-/iPhone-Test und bewusste Freigabe.

## Noch offene Arbeit

- Manuelle Touch- und Browsertests, einschließlich Fehlermeldungen
- Weitere Tests für Feldfusion, volle Felder, Game-over, historische Speicherstände und KI-Fehlerfälle
- Schrittweise Entfernung historisch überschriebener Funktionsversionen (nur mit Regressionstests)
- Gegebenenfalls PWA/Offline-Unterstützung als separates Update
