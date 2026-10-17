# Duellansichten und Verteidigereffekte · 4.2

Die drei dekorativen Hauptmenükarten zeigen keine ATK-/DEF-Boxen mehr. Hand,
Sammlung und große Kartenansicht behalten ihre Werte. Große Werteboxen sind
blickdicht. Gegenschlag wird in den eigenen und gegnerischen großen Ansichten
sowie im Deckdetail erklärt: 50 % der aktuellen ATK als LP-Schaden nach einem
Angriff auf einen Verteidiger in DEF, einschließlich Zerstörung, ohne Auslösung
während der Angriffsimmunität. Die Beschreibung nennt den PvE-Geltungsbereich.

Feldzonen haben einen kreuzförmigen Einsatz und genug Platz für beide
Ausrichtungen. Verteidigung dreht die Karte tatsächlich um 90°. Rollen unter der
Handkarte pulsieren in ihrer Farbe. Liegt die effektive DEF eines Verteidigers
über seinem bei Beschwörung festgehaltenen Maximum, färbt sich seine DEF-Box
violett und erhält ein zurückhaltendes Partikelleuchten. Die große Ansicht
zeigt den Überschuss und erklärt die temporären Essenzschichten. Ohne Überschuss
endet der Status automatisch. Es wird kein zusätzlicher Wert oder Buff vergeben.

Beschwörungen beider Seiten benutzen dieselbe Platzierung: eine große,
durchscheinende Karte rast aus der Blickrichtung auf ihre endgültige Position.
Der Mittelpunkt der Karte bleibt dabei auf der Zielzone; die Tiefe wird über
Skalierung und Deckkraft dargestellt. Aufprall, Staub und Leuchten folgen am
Ziel. Der bereits abgeschlossene Fusionsflug wird nicht ein zweites Mal gespielt.
Auch eine gegnerische Handfusion erhält das vollständige Ritual.

Das Fusionsritual hat sieben einzeln überspringbare Phasen: Materialrotation,
Enthüllung, Rollenprägung, Spezialbonus, Werteberechnung, fertige Karte und
Platzierung. Ein Klick oder die eingeblendete Schaltfläche schließt nur die
aktuelle Phase. Die folgenden Phasen laufen normal. Endwerte und echte Würfe
sind bereits vor der Darstellung festgelegt. Der Spezialbonus bleibt abhängig
von seiner Stufe insgesamt 2,0 bis 2,4 Sekunden sichtbar und wandert im letzten
Teil zum zugehörigen Duellanten, während er verblasst.

Die Kampfengine meldet tatsächlich angewandte Regeneration, Absorption und
Gegenschläge an eine separate Darstellungswarteschlange. Nach dem Kartenziehen
entsteht bei vorhandenen Verteidigern höchstens ein Orb pro gegnerischer Karte.
Diese Orbs bleiben für alle Effekte der eigenen Seite bestehen. Regeneration
und danach jede Absorption laufen in der tatsächlichen Reihenfolge ab. Die
gebogenen Projektile besitzen einen moderat schnellen Sternenschweif. Der
Empfänger leuchtet kurz in seiner Elementfarbe auf. Orbs verschwinden nach der
ganzen Folge. Reine Simulationen und fremde Spielinstanzen erzeugen keine Effekte.
Die Darstellungswarteschlange verändert weder Zufallsfolge noch Kampfwerte.

Tatsächlich erhaltene Karten und ACE-Shopfreischaltungen erscheinen als eigene,
zentrierte Kartenpräsentationen mit Partikeln. Die Beschriftung unterscheidet
Besitz und Kaufvorschau. Jedes Kartenfenster lässt sich separat schließen;
danach bleibt das Duellergebnis sichtbar. Esc im Duellergebnis führt ins Menü.
Ausstehende Levelbelohnungen bleiben erhalten und werden anschließend im Menü
angeboten. Erneutes Aufrufen des Abschlusses vergibt keine zweite Belohnung und
öffnet keine zweite Präsentation.

Reduzierte Bewegung und ausgeschaltete Animationen unterdrücken neue
Daueranimationen und Projektile; Statusfarbe, Werte und Bedienung bleiben da.

Die Regressionstests prüfen echte Absorptionsmengen, gemeinsame Orb-Batches,
Gegenschläge nach Zerstörung, Überschussgrenzen und unveränderte Kampfresultate.
Die Browserprüfung `tests/browser-cinematics-v42.html` prüft außerdem 90°-Geometrie,
Einzelphasensprünge, Gegnerbeschwörung, Orb-Lebensdauer, getrennte Dialoge und den
Esc-Rückweg bei 1200 und 410 Pixeln sowie mit reduzierter Bewegung.

Die neuen Illustrationen und die aktualisierte externe Kollektion sind in
`artwork-coverage-20261017.md` und im Promptmanifest der Bilddateien dokumentiert.
