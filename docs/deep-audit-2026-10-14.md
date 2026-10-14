# Arcane Duel 3.0 — technischer Voll-Audit · 14. Oktober 2026

## Grundlage und Umfang

Die aktuelle Card-Foundry-Veröffentlichung wurde als Ausgangsbasis verwendet, **nicht** der ältere lokale Artwork-Zwischenstand. Alle 60 aktuellen WebP-Illustrationen, die 324 bestehenden Spielkartenvorlagen und die bestehenden Erweiterungsmodule bleiben erhalten. Die Bereinigung konzentriert sich auf Benutzeroberfläche, Zustandswechsel, verdoppelte Handler, Belohnungstexte und rückwärtskompatible Speicherstände. Kernkampfwerte und Card-IDs wurden nicht umnummeriert.

Untersucht: `index.html`, `assets/game.js`, `assets/expansion.js`, `assets/evolution.js`, `assets/art-engine.js`, Karten- und Layout-CSS, Spielstands-/Wirtschaftstests, 60 Bildassets und echte Browserinteraktionen auf Desktop und Smartphone.

## Behobene Fehler und Widersprüche

1. **Deckeditor: falsche Grid-Struktur.** `expansion.js` fügt Kartenfilter als zusätzliche Kachel in `.deck-editor-layout` ein. Dadurch wanderte die Karten-Großansicht aus der geplanten 350-px-Spalte und erreichte im Browser ungefähr 950 px Breite. Mit festen Grid-Areas bleibt die Vorschau korrekt rechts bzw. bei schmalen Displays unterhalb der Filter.
2. **Filter- und Scrollverlust bei Kartenwahl.** Ein Klick auf eine Karte rief `renderMenu()` auf und zerstörte Filtereingabe und aktuelle Listenposition. Die Kartenwahl tauscht nun ausschließlich die Detailvorschau aus und bindet deren Aktionen neu.
3. **Überholte Siegmitteilung.** `expansion.js` versprach beim ersten Turniersieg kostenlose Fusionskarten und deren Gestalt, während `evolution.js` diesen Text erst nachträglich per DOM-Manipulation korrigierte. Nun gibt es nur eine sachlich richtige Erstgewinn-Mitteilung, ohne die zusätzliche Textüberschreibung.
4. **Mehrfachbestätigungen.** Verkauf, Kopienaufstieg, Zerlegen und zusätzlicher Packkauf konnten durch wiederholtes Auslösen des alten Bestätigungs-Handlers mehrfach ausgeführt werden. Die Bestätigung wird jetzt vor der Transaktion deaktiviert und bei fehlgeschlagenen regulären Aktionen gegebenenfalls wieder freigegeben.
5. **Levelrahmen praktisch gleichfarbig.** Die letzte CSS-Schicht überschieb die Farbvarianten normaler Karten mit einem gleichfarbigen Bronzerand. Jetzt gibt es zwölf kräftig unterschiedliche Level-Randfarben; Starter, Fusionen und ACE-Monster behalten eigene Rahmenkonzepte und ACE-Ornamente.
6. **Doppelte Initialbindung.** Eine redundante zweite `manualSaveBtn.onclick`-Zuweisung im Kernmodul wurde entfernt.
7. **Veralteter Regressionstest.** Ein Test erwartete die entfernte Kurzbezeichnung `MONSTER` auf der kleinen Karte, obwohl das aktuelle gewünschte Design ausschließlich das zentrierte Element zeigt. Der Test prüft jetzt die vereinfachte Karte samt Level-Zahl.

## Strukturanalyse

In den geprüften drei Hauptmodulen existieren **keine doppelten gleichnamigen Funktionsdeklarationen innerhalb einer Datei**. In `expansion.js` und `evolution.js` werden mehrere globale Funktionen absichtlich als Erweiterungskette überschrieben (jeweils mit Referenz auf die vorherige Implementierung). Das ist nicht per se ein Fehler, bleibt aber eine Fehlerquelle bei zukünftigen Updates. Deshalb erfolgte **keine risikoreiche Umstellung der gesamten Engine ohne gleichwertige Integrationstests**. Die gefährlichste gefundene Doppelzuständigkeit bei der Erstgewinn-Anzeige wurde bereits beseitigt.

## Durchgeführte Tests

- **135/135** automatisierte Node-Tests (`npm test`, inklusive 8 neuer Audit-Regressionstests).
- **90** zusammenhängende Turnier-Verläufe bis einschließlich Gegner III mit drei KI-Strategien: **88 von 90** schaffen alle drei Gegner innerhalb von 45 Versuchen je Gegner, **2** bleiben bei Gegner III stecken, **0** Programmfehler. Mittelwert der benötigten Kämpfe 18,3 (ausgewogen), 18,6 (offensiv), 19,0 (sparsam). Das zeigt eine merkliche frühe Progressionshürde und ist kein Beweis optimaler Balance.
- **24** zusätzliche zusammenhängende Turnierversuche über alle zehn Gegnerrunden, mit maximal 35 Versuchen je Runde **ohne gezieltes Farming und Booster-Einkauf**. Keiner schaffte in diesem begrenzten Szenario alle zehn Gegner: 23 steckten bei Gegner IV fest, 1 bei III. Es gab **0 Laufzeitausnahmen**. Das ist ein Hinweis auf eine Progressionshürde für Spieler ohne Vorbereitung, aber kein Beleg eines Engine-Bugs.
- **120** Spezialmodus-Simulationen: Verteidigung 36/40 Siege, Burst 22/40, Fusion 39/40; keine Programm-Ausnahmen, in Niederlagen kein unberechtigter Gewinn festgestellt.
- Browser **Desktop 1440 × 900** und **Smartphone 390 × 844**: alle 13 überprüften Menüseiten ohne JS-Ausnahme; Kartenwahl, Suchfilter, Großansicht und Bild-URLs korrekt; keine horizontale Dokument-Überbreite.
- Browser: Normales Monster mit einem Klick auswählen, in eigene Zone beschwören, Spiel-Snapshot erstellen und durch Validator prüfen — auf beiden Bildschirmgrößen erfolgreich.
- Browser: Verkauf/Aufstieg/Zerlegen mit absichtlich doppeltem Aufruf des Bestätigungs-Handlers — jeweils nur eine Transaktion.
- Asset-Check: **60/60** WebP-Dateien vorhanden und bildtechnisch gültig; 60 eindeutige Dateiverweise; alle direkt eingebundenen HTML-Assets vorhanden.
- Alter Spielstand-Schlüssel und Karten-IDs bleiben erhalten; vorhandene Migrationstests wurden erneut ausgeführt.

## Risiken / bewusst nicht behauptet

- Die Vielschicht-Architektur aus globalen Funktionsüberschreibungen sollte in einem zukünftigen gezielten Refactoring durch einzelne Zuständigkeitsmodule ersetzt werden. Ein Komplettumbau bei gleichzeitiger Gameplay-Weiterentwicklung wäre hier riskanter als die konkret vorgenommenen Korrekturen.
- Der Spielfeld-/Menü-Revamp ist überwiegend CSS-basiert. Auf anderen Browser-Engines und beliebigen exotischen Geräten wurden keine vollständigen manuellen Abnahmen durchgeführt.
- Die automatisierten KI-Simulationen sind **kein Ersatz für manuelle Spieltests**. Insbesondere simuliert die zusätzliche Langstrecken-KI keinen vollständigen Wirtschaftskreislauf mit gezieltem Farming, Booster-Einkauf und Kopienverstärkung. Aus ihrem Stillstand bei Gegner IV sollte keine unmittelbare Schwächung des Gegners abgeleitet werden.
- Es sind keine neuen konkreten Abstürze in der geprüften Version bekannt; absolute Fehlerfreiheit lässt sich daraus nicht ableiten.

## Reproduzieren

```bash
npm test
node tests/evolution-journey-run.cjs
node tests/evolution-full-tournament-audit.cjs
node tests/evolution-modes-run.cjs
python tests/browser_audit.py
python tests/browser_duel_smoke.py
python tests/audit_actions.py
```

Die drei optionalen Browser-Skripte benötigen Python, Playwright und Chromium. Sie sind unabhängig von `npm test`.
