# Arcane Duel – Entwicklungszweig

Die stabile, öffentlich spielbare Version wird von `main` über GitHub Pages ausgeliefert. Dieser `development`-Branch dient der Weiterentwicklung und ist **nicht** die veröffentlichte Version.

## Dateistruktur

- `index.html`: Benutzeroberfläche
- `assets/styles.css`: Layout und Gestaltung
- `assets/game.js`: Spielelogik inklusive lokaler Speicherung
- `tests/smoke.test.cjs`: Duellstart, Profil, Handfusion und 30 KI-Duelle
- `tests/regression.test.cjs`: Feldfusionen, Fusionsressourcen, Kampfregeln, Zerfall, Speicherstände, 100 KI-Duelle
- `tests/architecture.test.cjs`: Keine doppelten Funktionsdefinitionen, stabile Dateiverweise und Spielstandschlüssel

## Testen

Node.js 20 oder höher installieren und im Repository `npm test` ausführen. Die Testsuite umfasst aktuell 22 automatisierte Prüfungen. Sie kontrolliert unter anderem Hand- und Feldfusionen, volle Monsterfelder, 130 simulierte Duelle, Angriffe, Kartenzerfall, Spielstände und Konfliktschutz.

Zum Spielen im Browser die Dateien über einen lokalen Webserver ausliefern, zum Beispiel `python -m http.server 8000`. Externe CSS-/JS-Dateien müssen zusammen mit der HTML-Datei veröffentlicht werden.

## Spielstände und Veröffentlichung

Das Speicherformat und der `localStorage`-Schlüssel `arcane-duel-rpg-profile-v3` bleiben unverändert. **Vor einem produktiven Update einen JSON-Spielstand exportieren** und Import/Wiederherstellung im Browser testen.

Keine Änderungen automatisch von `development` nach `main` übernehmen. Vor Veröffentlichung: Testlauf, kurzer Browser-/iPhone-Test und bewusste Freigabe.

## Codebereinigung

32 historisch überschriebene globale Funktionsdeklarationen wurden in zwei kleinen Commits entfernt (18 Kern-/Sammlungsfunktionen, 14 UI-/Duellfunktionen). Erhalten bleiben jeweils die zuletzt wirksamen Definitionen; die Spielregeln sind bewusst unverändert. Ein Architekturtest verhindert, dass solche doppelten Deklarationen unbemerkt zurückkehren.

## Noch offene Arbeit

- Manuelle Touch- und Browsertests auf dem iPhone und Desktop, einschließlich Fehlermeldungen und Kartenbedienung
- Integrationstests für vollständige UI-Abläufe und alte exportierte Spielstanddateien
- Weitere Grenzfälle rund um volle Felder, Game-over und KI-Unterbrechungen
- Optional: PWA/Offline-Unterstützung als separates Update
