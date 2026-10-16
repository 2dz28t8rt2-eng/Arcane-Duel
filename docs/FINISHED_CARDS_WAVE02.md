# Arcane Duel – fertige Monsterkarten, Produktionswelle 02

- Branch: `development`. Bereits veröffentlichte Welle 01 bleibt unverändert.
- 20 zusätzliche fertig gerenderte Monsterkarten (gesamt 30).
- Pro Monster genau eine bestehende, individuell illustrierte WebP-Datei aus `assets/custom-art/`, kein neues externes oder ungeprüft lizenziertes Material.
- Ausgewählt werden die stabilen existierenden Karten-IDs: 1, 2, 4, 5, 6, 8, 10, 13, 16, 19, 20, 22, 42, 66, 69, 73, 90, 102, 105, 317.
- Level 11 und 12 bleiben reserviert; alle Karten der neuen Serie sind Level 1–10.
- Das HTML-Exportwerkzeug `tools/finished-card-renderer.html?wave=02` liest alle Spielwerte, Namen, Elemente und Rollen direkt aus `CARDS` und wählt einen der 20 bestehenden SVG-Rahmen dynamisch aus.
- Die PNGs (768 × 1224), der Kontaktbogen, ein WebP-Vorschaubild und das Manifest werden durch GitHub Actions unter `assets/finished-cards/wave02/` erzeugt.
- Live-Duelle, Fusionswürfe, Karten-IDs, Besitzstände und Balancing werden nicht verändert. Grafikexports von Fusionen zeigen **nur Grundwerte**, nicht gewürfelte Endwerte.
- Die Galerie `docs/fertige-monsterkarten.html` zeigt beide Wellen mit einer Großansicht und Einzel-Downloads.

Die genannten Asset-Websites (Shutterstock, OpenGameArt, Animate.css, tsParticles) dienen als Inspirations- bzw. spätere Erweiterungsquellen. In dieser Welle werden ausschließlich bereits im Arcane-Duel-Repository vorhandene Monsterillustrationen verwendet; es werden keine zusätzlichen Fremdassets importiert.
