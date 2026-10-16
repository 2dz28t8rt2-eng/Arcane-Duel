# Arcane Duel 4.0.5 – Atmende Elemente und Rolleninsignien

Dieses Update ergänzt eine isolierte CSS-Ebene NACH `card-shell-v404.css`.

- Die alte obere LV-Kapsel entfällt für die modernen Monsterkarten; die Levelscheibe zwischen ATK und DEF bleibt.
- Kartennamen erhalten mehr nutzbare Breite und bis zu zwei Zeilen.
- Elementleiste **innerhalb** der Monsterkarte: ruhiger, elementspezifischer Glühimpuls und kleine CSS-Partikel. In der Großansicht wird nur das Element-Chip animiert.
- Unterhalb der Karten: `Stufe · Element` ist farblich hervorgehoben, aber vollständig statisch.
- Rollenboxen: zentriert, mit je zwei kleinen vektorbasierten und dezent leuchtenden Rolleninsignien.
- Bei `prefers-reduced-motion: reduce` oder `body.ad-motion-disabled` keine Animation.
- Keine Änderungen an Spielmechanik, Statistik, Spielständen, Artwork, Fusionen, Encounter oder PNG-Export.

Tests: `node --test tests/card-v405-polish.test.cjs`. Die endgültige Sichtprüfung erfolgt auf `development`.
