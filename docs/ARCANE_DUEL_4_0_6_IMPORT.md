# Arcane Duel 4.0.6 – Import der zehn hochwertigen Monsterbilder

**Historischer Importweg:** Die aktuellen zehn Bilder wurden mit dem neueren 4.1-Integrationspaket direkt eingebaut; siehe [GENERATED_ARTWORKS_4_1.md](GENERATED_ARTWORKS_4_1.md). Ein Upload des älteren ZIPs ist dafür nicht erforderlich. Die aktualisierten Namen und Beschreibungen sind im neuen Integrationsbericht dokumentiert.

Die Importautomatik ist vorbereitet. Sie aktiviert sich, sobald die geprüfte Datei **Arcane-Duel-4.0.6-Artwork-Integrationspaket.zip** im **Root des Branches development** nach GitHub hochgeladen wird.

Einmaliger Schritt: GitHub → Branch development → Add file → Upload files → ZIP hochladen und committen. Diese Datei ist im Chat als Download verfügbar.

Die Automation überprüft das unveränderte ZIP per SHA-256 und außerdem die zehn enthaltenen Bilder. Sie übernimmt die WebP-Dateien, aktualisiert die Karten und ihre Namen, rendert Wave09 neu und veröffentlicht die Bilder anschließend als normale GitHub-Dateien. Zum Schluss entfernt sie das temporäre ZIP automatisch.

Drei Kreaturen erhalten passendere Namen:
- 74: **Areon, Himmlischer Sturmwyrm**
- 260: **Schattenwyrm der Zwischenwelt**
- 316: **Sylvan, Wächter des Urwalds**

Die übrigen sieben Namen (Aschenwolf, Korallenfürstin, Schattenwolf Lyra, Morgenflügel, Phönix Myrra, Aschewyrm Rakh und Himmelskrone) bleiben erhalten, da sie bereits zu den neuen Motiven passen. IDs, Level, Rollen, Elemente, Kampfwerte, Regeln und Speicherstände bleiben unverändert.

**Inzwischen ebenfalls neu gestaltet:** Argentum-Koloss (314) und Nox-Albtraum (319), als direkte Ergänzung des 4.1-Updates. Siehe [Artwork-Ergänzung](ARGENTUM_NOX_ARTWORKS_4_1.md).

Nur development wird aktualisiert. main bleibt unverändert bis zur späteren Freigabe.
