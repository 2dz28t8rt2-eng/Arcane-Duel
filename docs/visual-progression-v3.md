# Arcane Duel 3.0 – Visuelle Progression

Diese Fassung implementiert eine **echte 12-stufige Kollektion** auf Basis aller 324 Kartenvorlagen des Spiels. Die Galerie `collection-v3.html` zeigt jede Vorlage, filterbar nach Level, Element-/Namenssuche und Artwork-Typ.

## Wichtig: Konzept vs. fertige Einzelillustrationen

Das freigegebene Poster ist eine **Art-Direction-Referenz**, keine exportierbare Sammlung von 324 hochauflösenden Einzelmotiven. Insbesondere zeigt es nicht 27 individuelle Artworks je Stufe. Die realen Karten sind ungleichmäßig verteilt: 9, 21, 20, 49, 22, 28, 26, 26, 23, 23, 23 und 54 für Level 1 bis 12.

Es gibt aktuell 50 individuell illustrierte Kreaturen; zusätzliche Gestalten verwenden bewusst dasselbe Bild. Die übrigen Karten behalten vorerst ihre generierten Bilder. Diese Version behauptet nicht, alle 324 individuellen Artworks fertiggestellt zu haben.

## Implementiert

- Level 1–12 als Filter mit tatsächlichen Kartenzahlen
- Kartenansicht mit Originalnamen und Original-Leveln
- Neue dekorative Level-11- und Level-12-Effekte auf Handkarten und Feldkarten
- Zehn zusätzliche Illustrationen in `assets/custom-art/wave5-*.webp`, passenden Kartenvorlagen zugeordnet
- Unveränderte Karten-IDs, ATK/DEF, Shop-Regeln und Spielstände
- Alle 324 Karten im Atlas, inkl. korrekter Kennzeichnung neuer vs. generierter Bilder

## Noch offen

- 274 weitere individuelle Artwork-Motive für eine vollständig handillustrierte Sammlung
- Einheitliche Qualitätskontrolle aller 324 Motive in voller Kartengröße
- Optional: eigener ikonischer weißer Drache für einen späten Kartenplatz
- Browser-Abnahme mit tatsächlichem Rendering (automatisierte Node-Tests allein ersetzen dies nicht)

Die Darstellung ist ein lokaler Entwicklungsschritt, noch kein GitHub-Release.
