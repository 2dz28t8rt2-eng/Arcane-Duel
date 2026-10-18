# Rollenwelle I – zehn neue Monsterillustrationen

**Status: VORBEREITET / NOCH NICHT FREIGESCHALTET.**

Die Bilddateien (10 einzelne WebP, 1122 × 1402 px) existieren als separates Artwork-Installationspaket außerhalb dieses Repositories. Es darf kein generisches Ersatzbild automatisch an deren Stelle treten.

Zum Aktivieren:
1. Das ZIP `arcane_duel_role_wave1_artworks.zip` entpacken.
2. Den Inhalt von `assets/role-wave1/` über GitHubs »Add file → Upload files« in exakt diesen Ordner auf **development** hochladen.
3. Verifizieren, dass **alle zehn** Dateien exakt benannt vorhanden sind.
4. `const ASSETS_COMPLETE=false` in `assets/role-wave1-catalog.js` auf `true` ändern. Vorher NICHT aktivieren!
5. Beide CI-Workflows abwarten, Spielstands-/Booster-Tests und Kunstzuordnung kontrollieren; dann auf main.

Die Registrierung in `assets/game.js` ist absichtlich unmittelbar vor `loadProfile()` vorgesehen, um beständige Karten-IDs nicht zu ändern und gespeicherte neue Karten beim Seitenstart zu validieren. Der vorbereitete Code ist momentan ein No-op.

**Karten (je zwei pro Stil):**
- Predator: Flammenjäger Rethar (Lv 4), Schattenklinge Zyrr (Lv 3)
- Verteidiger: Eisenbastion Gorrath (Lv 5), Dornenschild Varuk (Lv 4)
- Wächter: Ewige Wacht Lysar (Lv 6), Runenwacht Aegis (Lv 5)
- Seelenzehrer: Seelenbrut Malgris (Lv 5), Leerenpakt Nythor (Lv 4)
- Allrounder: Sturmschmied Kael (Lv 6), Elementsynthese Orin (Lv 3)

**Rollenkompatibilität:** Verteidiger und Wächter teilen in der bisherigen Engine den mechanischen Tag `guardian`. `roleStyle` unterscheidet beide Spielstile für zukünftige Fähigkeiten; es existiert hier bewusst noch keine ungetestete neue Kernrolle. Allrounder ist `combatant` und verwendet die bestehende Allrounder-Resonanz.

Die Karten werden nach vollständiger Aktivierung als eigenständige normale Karten in den tierabhängigen Boosterpool aufgenommen, ohne neue seltene Sondermonster und ohne Änderungen an vorhandenen Kartennummern.
