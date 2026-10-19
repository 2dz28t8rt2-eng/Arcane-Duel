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

**Status:** Der Installer ist eingecheckt. Das 9,2-MB-Archiv selbst konnte aus
der isolierten ChatGPT-Umgebung bisher nicht über den GitHub-Connector
übertragen werden; der Workflow wird erst nach dem ZIP-Upload ausgelöst.
Die alten Bilddateien bleiben bis dahin unverändert.
