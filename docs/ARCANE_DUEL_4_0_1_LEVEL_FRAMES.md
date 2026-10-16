# Arcane Duel 4.0.1 – Kartenrahmen & Element-Lesbarkeit

Aufbauend auf den vorhandenen **20 originalen transparenten SVG-Templates** werden 40 zusätzliche Levelornamente (4 Familien × Level 1–10) über die existierenden Rahmen gelegt, ohne Bilder, Spielregeln oder Werte zu verändern.

- Familien: Standard, Fusion, ACE, Essenz
- Stufen: Level 1–10, mit individuellen Ornamenten und Levelinsignien
- Die Spezialrahmen der Schicksalsmonster bleiben ausgenommen
- Element-Anzeigen Feuer, Wasser, Erde, Wind, Licht und Dunkelheit erhalten deutlich höheren Kontrast, auch in der Großansicht
- `assets/card-level-frames-v401.js` ermittelt Level und Familie zur Laufzeit, `assets/card-level-frames-v401.css` verknüpft die Overlays
- `tools/finished-card-renderer.html` exportiert die bestehenden SVG-Rahmen und neuen Levelornamente gemeinsam
- GitHub Actions rendert Welle 01 separat mit `tools/render-legacy-wave01-frames-v401.py`; die bestehenden Wellen 02–09 werden über die bisherigen Workflows aktualisiert
- Test: `node --test tests/card-level-frames-v401.test.cjs`

Quelle: lokal vorbereitetes 4.0.1-Patchpaket. Änderungen nur auf `development`, Branch `main` unverändert.
