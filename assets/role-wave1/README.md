# Rollenwelle I – zehn neue Monsterillustrationen

**Status: VORBEREITET / NOCH NICHT FREIGESCHALTET.**

Die Bilddateien (10 einzelne WebP, 1122 × 1402 px) existieren als separates Artwork-Installationspaket außerhalb dieses Repositories. Es darf kein generisches Ersatzbild automatisch an deren Stelle treten.

## Aktivierung mit einem einzigen ZIP-Upload

1. Das von ChatGPT erhaltene `arcane_duel_role_wave1_artworks.zip` **nicht entpacken**.
2. GitHub-Branch `development` auswählen.
3. Zum bestehenden Ordner `assets/role-wave1/` navigieren; `Add file → Upload files`.
4. Die ZIP-Datei hier hochladen und committen (genauer Pfad: `assets/role-wave1/arcane_duel_role_wave1_artworks.zip`).
5. Der GitHub-Workflow `Install Role Wave 1 Artworks` prüft sämtliche SHA256-Prüfsummen und die WebP-Signaturen, installiert genau die zehn Einzelbilder, entfernt das ZIP aus dem Git-Branch und aktiviert die Karten.
6. Die Node-/Artwork-Tests und die beiden regulären Workflows prüfen; erst danach nach `main` übernehmen.

Weder die Bildnamen noch den Archivnamen verändern! `ASSETS_COMPLETE` bleibt bis zum erfolgreichen Import bewusst `false`. Der Importworkflow setzt ihn erst nach erfolgreicher Validierung aller zehn Dateien auf `true`.

Die Registrierung in `assets/game.js` ist absichtlich unmittelbar vor `loadProfile()` vorgesehen, um beständige Karten-IDs nicht zu ändern und gespeicherte neue Karten beim Seitenstart zu validieren. Der vorbereitete Code ist momentan ein No-op.

**Karten (je zwei pro Stil):**
- Predator: Flammenjäger Rethar (Lv 4), Schattenklinge Zyrr (Lv 3)
- Verteidiger: Eisenbastion Gorrath (Lv 5), Dornenschild Varuk (Lv 4)
- Wächter: Ewige Wacht Lysar (Lv 6), Runenwacht Aegis (Lv 5)
- Seelenzehrer: Seelenbrut Malgris (Lv 5), Leerenpakt Nythor (Lv 4)
- Allrounder: Sturmschmied Kael (Lv 6), Elementsynthese Orin (Lv 3)

**Rollenkompatibilität:** Verteidiger und Wächter teilen in der bisherigen Engine den mechanischen Tag `guardian`. `roleStyle` unterscheidet beide Spielstile für zukünftige Fähigkeiten; es existiert hier bewusst noch keine ungetestete neue Kernrolle. Allrounder ist `combatant` und verwendet die bestehende Allrounder-Resonanz.

Die Karten werden nach vollständiger Aktivierung als eigenständige normale Karten in den tierabhängigen Boosterpool aufgenommen, ohne neue seltene Sondermonster und ohne Änderungen an vorhandenen Kartennummern.
