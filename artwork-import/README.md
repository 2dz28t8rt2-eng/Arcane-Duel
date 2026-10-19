# Freigegebene Arcane-Duel-Artworks (15)

Die 15 originalen Monsterillustrationen sind mit dem Nutzer abgestimmt und in
`Arcane_Duel_15_freigegebene_Artworks.zip` verpackt.

**Einmaliger GitHub-Importschritt:** ZIP als
`artwork-import/arcane-approved-15.zip` auf den Branch
`development` hochladen (im GitHub-Webinterface: `Add file → Upload files`).

Danach führt der Workflow `.github/workflows/import-approved-art-v56.yml`
automatisch folgende Schritte durch:
- Exakte Vollständigkeitsprüfung der 15 Bilder in 1086 × 1448 px WebP.
- Karten/Fate-Cinema: 10 genau zugeordnete Fate-Portraits einschließlich
  des jetzt **Himmlischer Löwenwächter** genannten zweiten Slots.
- Fusions-Artwork-Identitäten: Eibenwächter (46), Eisenzahn (49),
  Bastion Ferrus (50), Rubin-Seraph (54), Waldgeist Veyra (58).
- Sammlung `collection-v3-data.js`, Game-Laufzeit und deren Tests aktualisieren.
- Validierte Änderungen als separaten Commit nach `development` pushen,
  niemals nach `main`.

**Status (19.10.2026): vollständig installiert.** Nach dem Upload wurde das Archiv auf den erwarteten Namen gesetzt. Workflow [39233437669](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39233437669) hat erfolgreich sämtliche 15 WebP-Dateien samt Art-Zuordnung importiert und die Tests bestanden. Commit: [01c3f0b](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/01c3f0b63b1885134a90956c35791b69770546a6). Keine weitere Aktion erforderlich. Die vorhandene ZIP-Datei bleibt als Quellarchiv erhalten; die alten Einzelbilder sind für diesen Kartensatz nicht mehr aktiv referenziert.
