# Rollenwelle 1 + 2 – vollständig installiert

**Status: AKTIV auf development.** 15 neue individuelle Monsterbilder sind direkt im Repository gespeichert, und `assets/role-wave1-catalog.js` registriert die Karten beim Start **vor** der Spielstandprüfung. Bestehende Karten-IDs bleiben unverändert.

Pro Rolle drei neue Monster: Predator, Verteidiger, Wächter, Seelenzehrer und Allrounder. Alle 15 Bilder liegen als originale WebP-Dateien unter `assets/role-wave1/` und sind durch ihre Git-Blob-Hashes unabhängig prüfbar. Kein generisches Ersatzbild ist erforderlich.

Verteidiger und Wächter teilen sich momentan aus Kompatibilitätsgründen den technischen Grundrollentyp `guardian`, werden aber im Handkartenmenü separat bezeichnet (`roleStyle`). Allrounder verwenden weiterhin `combatant`.

Die Karten sind normale Sammlerkarten und gehören zu den regulären Karten-/Boosterpools. Die Sondermonster-Erweiterung folgt später.

**Tests:** `node --test tests/role-wave1-catalog.test.cjs`, übrige CI-Code- und Headless-Browsertests. Erst nach erfolgreichen Tests zu `main` übernehmen.

**Wichtig:** Der früher vorgesehene manuelle ZIP-Upload ist nicht mehr nötig. Die Bilder wurden bereits direkt auf GitHub übertragen; der automatische ZIP-Importer bleibt als historischer Fallback ungenutzt.
