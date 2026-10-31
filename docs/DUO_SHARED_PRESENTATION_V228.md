# Gemeinsame Darstellung von Einzelspieler und Online-2v2

Die Darstellung wird an denselben Komponenten geändert, die der Einzelspieler tatsächlich verwendet. Die Online-Adapter übergeben bestätigte öffentliche Werte und die eigene private Hand. Sie führen weder Einzelspieler-Regeln auf dem gemeinsamen Duell aus noch schreiben sie den Spielstand des Partners.

## Gemeinsame Komponenten

| Bereich | Gemeinsame Implementierung |
| --- | --- |
| Hand- und Feldkarten, Rahmen, große Werte, Überladung, Verteidiger- und Seelenbund-Erklärungen | `card-view-v221.js` |
| Menügruppen, Aufklappen, Überschriften, Menükopf und Verbesserungsanzeigen | `menu-shell-v221.js` |
| Monsterlexikon, Suche, Filter, Seiten und Kartenbeschreibungen | `bestiary-view-v228.js` |
| Duellstart, LP-Aufbau, Beschwörung, Staub, Auflösung, Sternenprojektile, Orbs, Gegenschlag und Ergebnisankündigung | `battle-presentation-v228.js` |
| Rudelführer-Enthüllung, Blutspur, Stomp, LP-Schaden und Menü-/Duellübergang mit Musikbeschriftung | `special-presentation-v228.js` |
| Seelenstoß | `soul-burst-v207.js` |
| Fusionsritual und überspringbare Phasen | bestehende `fusion-cinema-ritual.js` und `cinema-phase-v42.js` |
| Kartenflug beim Ziehen, Angriff, Musik und Samples | bestehende gemeinsame Module `hand-draw-v1161.js`, `attack-impact-v113.js`, `arcane-soundscape-v196.js`, `arcane-sfx-v208.js` |

`duo-shared-presentation-v228.js` verbindet die öffentlichen Online-Felder mit diesen Komponenten. Nach einer Zerstörung kann das sichtbare leere Teamfeld im Datencontainer des Partners liegen; Effekte müssen deshalb `ArcaneDuoPresentation228.cell()` benutzen. Es gibt weiterhin sieben physische Monsterzonen je Team, insgesamt vierzehn.

Das Lexikon erhält die Sammlung des jeweiligen Spielers. Eine Suche, Detailansicht oder Animation darf weder dessen Profilversion noch den Spielstand des Partners ändern. Die lokale Einzelspieler-Speicherung wird ebenfalls nicht überschrieben. Serverdaten bleiben auch während einer übersprungenen oder abgebrochenen Animation maßgeblich.

## Prüfung

- `npm test`: vorhandene Regeln, Regressionen, Kataloggleichheit und neue Prüfungen der gemeinsamen Karten und Erklärungen.
- `npm run test:duo-dom`: bestehende Prüfung der Online-Oberfläche.
- `npm run test:duo-browser`: zwei isolierte echte Chromium-Kontexte mit kontrollierter Servernachbildung; Desktop und Mobilansicht, Einladungen, getrennte Decks und Menüs, verdeckte Partnerhand, vierzehn Zonen, Aufgabe, Ergebnis, Wiederbeitritt und gemeinsame Darstellungen.
- `npm run test:duo-browser -- --live`: derselbe autorisierte Ablauf mit neu angelegten Testprofilen am vorhandenen Server; tatsächliches Duell, Belohnungen, Wiederbeitritt und gemeinsame Feldfusion. Kein bestehender Spielstand wird dafür benutzt. Der Leihdeck-Fall ist nur abgedeckt, wenn das erste Testprofil im Test tatsächlich einen höheren Fortschritt verdient; das Ergebnisprotokoll weist dies ausdrücklich aus.
- `tests/browser-cinematics-v42.html`: echter Einzelspieler, einschließlich Orb-Folge, Fusionsphasen, Angriffe, Gegenschlag, Ergebnis und Rückkehr zum Menü; 1200 und 410 Pixel.

Die GitHub-Prüfungen laufen vor der Integration in `development`. `main` ist kein Ziel dieser Änderung. Die generierten Kataloge ändern durch die zusätzlichen gemeinsamen Skripte nur `scriptCount`; Kartenwerte, Gegner und Kampfregeln bleiben unverändert.

## Grenze dieses Abgleichs

Gemeinsame Darstellung ist keine Behauptung vollständiger Funktionsgleichheit sämtlicher historischer Erweiterungen. Online-Werkstatt, Freischaltungen und persönliche Belohnungen besitzen weiterhin eigene Server-Datenadapter; das Einzelspieler-Menü hat zusätzlich lokale PvP- und Lernangebote. Für eine vollständige Zusammenführung dieser Funktionen müssen deren Regeln und Speicherung separat abgeglichen werden. Keine nicht vorhandene Belohnung oder Werkstattfunktion darf durch identische Texte vorgetäuscht werden.
