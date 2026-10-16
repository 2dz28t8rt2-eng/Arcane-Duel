# 4.0.2 – Live-Rahmenfix (Nachbesserung 1)

**Warum?** Der vollständige PNG-Exporter rendert bereits die 20 bestehenden Familien-/Stufenrahmen und die 40 Levelornamente. Im Hauptspiel werden allerdings einzelne Karten vor dem Laden der letzten Template-Skripte erstellt. Sie behalten ohne Nachbearbeitung alte DOM-Klassen. Außerdem lag die zusätzliche Ornamentzeichnung als Hintergrund teils unter den Bild- und Textflächen.

**Fix:** `assets/card-level-runtime-v402.js` ergänzt nur die fehlenden CSS-Klassen an bereits vorhandenen bzw. neu aufgebauten Karten im Hauptspiel (Kartenhand, großes Kartenfenster, Deck-/Sammlungsmenü, Spielfeld, Gegneranzeige). Die Zuordnung erfolgt rein über visuell vorhandene Level- und Kartenfamilienmerkmale. Bei Schicksalskarten erfolgt keine Änderung. `assets/card-level-runtime-v402.css` zeichnet die transparente Levelgravur sichtbar über die Kartenkontur.

**Tests:** Node-Regression `tests/card-level-runtime-v402.test.cjs` und zusätzliche Chrome-Prüfungen in `tests/browser-card-templates.html` für alte und dynamische Karten, ACE, Fusion und Spezialrahmen.

**Strikte Abgrenzung:** Keine Änderung an Bildern, Kartenstatistiken, Spielmechanik, Save-Daten, Kampfserien oder kosmetischer Typografie. Separater Vormerkzettel für spätere, eigenständig zu generierende Artworks: `docs/ARTWORK_NEUGESTALTUNG_VORMERKUNG.md`. Cache-Version der beiden 4.0.1-Rahmenquellen auf 4.0.2 erhöht.
