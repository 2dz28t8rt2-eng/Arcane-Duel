# Menükarten und Korrekturen aus dem Rollentest

Die drei Vorschaukarten im Hauptmenü verwenden jetzt denselben vollständigen Kartenrenderer wie Sammlung und Duell: aktuelles Bild, Name, Rollenanzeige, Werte und Stufensiegel. Nach dem Laden der Grafik- und Rahmenmodule wird die erste Vorschau erneuert. Die ältere Miniatur mit Goldrahmen und zusätzlicher LV-Plakette entfällt. Bildaura, aufhellender Folienfilm und 3D-Vergrößerung werden hier entfernt; der äußere Lichtschein bleibt außerhalb der Kartenfläche. Die Auswahl verwendet aktuelle Illustrationen und lässt ältere prozedurale Platzhalter sowie reine Gegnervorlagen aus. Die drei Karten sind auch bei mobiler Breite sichtbar und lösen keine Spielaktionen aus.

## Korrigierte Mechaniken

1. Wächterheilung folgt der tatsächlichen Instanzrolle. Eine Predator-Vorlage mit geerbter Wächterrolle heilt; eine Wächtervorlage mit Predatorrolle heilt nicht mehr. Das gilt für beide Duellanten. Selbstheilung, Heilung in Angriffsposition und Überschreiten der Grund-DEF-Grenze bleiben ausgeschlossen.
2. Absaugen, Fokuswechsel und Bedienleiste verwenden dieselbe Seelenrangbestimmung. Eine Seelenzehrer-Fusion auf einer ursprünglich anderen Vorlage kann ab effektivem Rang 3 den Fokus wechseln. Die Bedienleiste zeigt ihre Aktionen an; auch der Rollenhinweis der großen Kartenvorschau folgt der geerbten Rolle. Die Begrenzung auf einen Wechsel pro Zug und die DEF-Fokus-Heilung gelten weiterhin.
3. Der beste Rohwurf einer Fusion wird kopiert, bevor Materialboni und Abzüge eingerechnet werden. Die aufgezeichneten Rohwürfe werden dadurch nicht mehr verändert. Bei älteren gespeicherten Fusionen lässt sich die fehlerhafte Aufzeichnung korrigieren, wenn der unabhängig gespeicherte Rohgewinner und die Bonusrechnung diese Korrektur eindeutig belegen. Kampfwerte werden dabei nicht neu ausgewürfelt.

## Nachprüfung

- Acht neue Regressionstests mit allen tatsächlich geladenen Spielmodulen: vorher sieben Fehler und ein erfolgreicher PvP-Abgrenzungstest, nachher acht erfolgreich.
- Vollständige Node-Suite: 307/307 erfolgreich.
- Dieselben 3.840 vorbereiteten Vergleichskämpfe und 48 neuen Karrieren wie im ersten Bericht erneut ausgeführt. Die neuen Karrieren benötigen 1.552 Duelle; zusammen sind das 5.392 vollständige Duelle ohne Laufzeitfehler. Alle 48 Abschlussspielstände sind gültig und alle 1.552 Wiederholungsaufrufe der Belohnungsfunktion bleiben ohne Doppelauszahlung.
- Im Vergleichsblock wurden 18.907 Fusionen ausgeführt. Die Zahl der verfälschten Gewinneraufzeichnungen sinkt von 4.665 auf 0.
- Zusätzliche Browserprüfung: drei aktuelle Karten, erzwungene vordere LV10-Karte, geladenes Bild, kein Bildfilter/Folienfilm, mobile Sichtbarkeit und tatsächlicher Klick auf den geerbten Seelenfokus. Desktop- und Mobilbreite werden in GitHub Actions geprüft.

| Karriereschwerpunkt | X innerhalb des Limits vorher / nachher | Mittlere Duelle vorher / nachher |
|---|---:|---:|
| Predatoren | 12/12 · 12/12 | 33,1 · 33,1 |
| Wächter + Seelenzehrer | 12/12 · 12/12 | 37,6 · 35,2 |
| Fusionen | 11/12 · 11/12 | 32,7 · 32,7 |
| Gemischt | 12/12 · 12/12 | 30,0 · 28,4 |

Die mittlere Verteidigerkarriere verbessert sich, der Median liegt aber bei 33 statt zuvor 32,5 Duellen. Die Korrekturen helfen also nicht jedem Zufallsstart gleich stark. In den vorbereiteten Rang-0-Vergleichen bleiben die Siegzahlen aller vier Strategien unverändert. Der Unterschied zwischen Predatoren und Verteidigergruppe liegt weiterhin vor allem im Tempo: normal etwa 9,0 gegenüber 15,8 Einzelzügen. Das sind Heuristiktests und keine menschlichen Siegprognosen.

Die Fusionskarriere mit Startwert 113 erreicht X weiterhin nicht im Limit von 30 Versuchen je Prüfung. Der ältere verlängerte Lauf zeigte einen Sieg im 32. Versuch an X; dieser einzelne Erfolg ersetzt keine Verbesserung der Progressionshürde. Die aggregierten Vergleichsdaten stehen in [ROLE_MENU_FIXES_20261017.json](ROLE_MENU_FIXES_20261017.json).

## Nächste sinnvolle Balanceversuche

1. **Gleiches Budget vergleichen:** Neben identischen Monsterstufen auch gleich teure Ausbauten, gleich viel verdiente Essenz und mehrere Verhältnisse aus Wächtern und Seelenzehrern vergleichen. Eine feste 20/20-Liste allein beschreibt die gemeinsame Strategie nicht vollständig.
2. **Frühe Zusammenstellung erleichtern:** Eine kleine garantierte Ergänzung aus beiden Verteidigerrollen nach dem Training erproben. Entscheidend ist, dass die Kombination früh tatsächlich spielbar wird; eine zusätzliche hohe DEF-Zahl ohne Seelenwirkung hilft dem Spielplan wenig.
3. **Hürden IV/V und IX gezielt erklären:** Nach wiederholten Niederlagen freiwillig passende Hinweise auf Werkstattgrenzen, Materialstufen, Vorlagen und Rollen-Ausbau anbieten. Erst anschließend prüfen, ob Gegnerstärke oder Kartenangebote geändert werden müssen.
4. **Tempo wirtschaftlich bewerten:** Reale Kampfzeit und Fortschritt pro Spielzeit messen. Falls Verteidiger hier zurückbleiben, zunächst einmalige passende Ziele und Belohnungen oder die Geschwindigkeit eigener Effekte erproben. Belohnungen pro zusätzlicher Runde würden absichtliches Verlängern begünstigen.
5. **Fusionsentscheidungen unterstützen:** Materialverbrauch, erwartete Rolle und erreichbare Vorlagenstufe klar gegenüberstellen. Besonders die Karriere mit Startwert 113 mit anderen legalen Vorlagen-, Ausbau- und Werkstattentscheidungen vergleichen, bevor Fusionsgrundwerte pauschal steigen.

Die aktuelle Änderung stellt die vorgesehenen Mechaniken her. Die genannten Balanceversuche sind Vorschläge für einen folgenden, getrennt messbaren Schritt.
