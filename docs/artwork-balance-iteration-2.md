# Alpha 1.8 DEV – Art & Balancing, zweiter Durchgang

## Grundsatz

Diese Änderungen liegen ausschließlich im Branch `development`. `main` und die öffentliche Version bleiben unverändert. Der gemeldete **mögliche Fehler nach „Wiederholen“ bei Turnierfusionen** wurde bewusst nicht bearbeitet. Lebenspunkte (4.000 im Normalmodus) und Kreaturenzerfall bleiben unverändert, da sie im Spieltest positiv bewertet wurden.

## Artwork 2.0

- 12 Grundarten mit je 3 eigenständig aufgebauten SVG-Silhouetten: **36 Körperentwürfe**, einschließlich Vögel und Flugwesen
- Unterschiedliche Umgebungen je Element (Feuer, Erde, Wasser, Wind, Licht, Dunkel)
- Zusätzliche Unterschiede je Karten-ID: Ausstattung, Komposition, Größe, Elite-Rahmen, Partikel, Szenendetails
- Tatsächliche Kataloggröße nach Initialisierung: **314 Kartenarten**, nicht die früher angenommene Zahl 293
- Bilder sind lokal im Browser gerendert. Keine externen Bilder oder neue Anforderungen an den Spielstand
- Artwork-Vergleich: [art-gallery.html](../art-gallery.html). Die Galerie verändert keine Spielstände.

**Einschränkung:** Trotz 314 unterschiedlicher SVG-Datenbilder sind das noch **keine 314 individuell gemalten Illustrationen**. Manche Karten teilen sich eine der 36 handgestalteten Grundsilhouetten. Der Fokus dieser Runde ist, Gruppen auf dem Spielfeld optisch besser unterscheiden zu können.

## Balancing der Charakterpacks

- Drei **unterschiedliche** Karten statt bis zu drei gleichen Angeboten
- Rare-Entscheidung einmal pro Pack, mit **8–26 %** Wahrscheinlichkeit abhängig vom Gegner, Schwierigkeit und Levelbonus; höchstens eine seltene Gestalt
- Nicht seltene Angebote stammen aus dem Charakterpool. Wo er nur zwei gewöhnliche Karten hat, kann eine einfache Startkarte desselben Elements als dritte Wahl erscheinen
- Beim Öffnen steht die konkrete Rare-Chance direkt im Dialog
- Eine Wahl muss direkt erfolgen; spätere Auswahl bleibt nur für den Fall einer unterbrochenen Sitzung gespeichert
- Bereits gespeicherte Packs mit der bisherigen Kartenauswahl bleiben beim Import lesbar
- Erhalt der normalen Karten-Dropchance von 40/12/20 % je nach manueller, automatischer oder geboosteter Partie
- **Kein Eingriff** in LP, Kartenzufall im Duell oder Zerfall

## Texte und Charaktere

- Die elf Duellanten bekamen eigene kurze Persönlichkeitsbeschreibungen
- Karten- und Monsterkatalog, Turniereinleitung, Werkstatt, Trainingsbereich und Loot-Informationen sind lesbarer formuliert
- Unterscheidung zwischen **Chance auf einen Kartendrop** und der **Seltenheit der Kartenart** wird sichtbarer
- Alte Beschriftung „Alpha 1.7“ in den Menüs wurde auf den DEV-Stand angepasst

## Automatische Checks und verbleibende Tests

`npm test` prüft Syntax, SVG-Erzeugung und -Variation, 314 Bildidentitäten, 1.980 Packkonstellationen, Spielstandvalidierung, 130 simulierte Duelle, Beuteregeln, Fusionen und Grundmechaniken. GitHub Actions muss vor jedem Merge auf `main` erfolgreich sein.

### Manuell zu prüfen

- [ ] Artwork-Galerie öffnen: 36 Grundformen voneinander unterscheidbar?
- [ ] iPhone-Safari: Kartenbilder laden ohne Ruckler und beschädigte SVGs
- [ ] Karten im Duell rasch unterscheiden (Name, Bild, Levelsterne, Werte)
- [ ] Einen Charakterpack-Dialog mit sichtbarer Rare-Chance öffnen und bis zur Auswahl abschließen
- [ ] Alten JSON-Spielstand importieren, auch wenn ein Pack bereits offen ist
- [ ] Spielbalance bei Turniergegner 2–4 mit normalem Spielstand gegenprüfen
- [ ] Gewinn/Niederlage durch Kreaturenzerfall weiterhin nachvollziehbar

Der mögliche Fusionsfehler nach „Wiederholen“ bleibt explizit ein **späterer, separater Testfall**.
