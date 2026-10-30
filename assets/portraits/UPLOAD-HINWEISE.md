# Arcane Duel – Portrait-Uploadplan v21.7

**Status: integriert am 30.10.2026 in `development`.** Alle 28 WebP-Dateien wurden hochgeladen und geprüft. Für das Spiel werden **genau 28 Portrait-Artworks** benötigt, nicht 60 separate Bilder. `portrait-manifest-v215.json` listet sämtliche Dateinamen und Charakterzuordnungen.

## Vorhandene Spiel-Logik

- **16 wählbare Portraits**: Beide Spieler wählen ihr Charakterbild aus `hero-01` bis `hero-16`.
- **Reguläre Solo-Gegner** (Milo bis Aster) erhalten jedes ein anderes, per stabilem Zufall zugeteiltes Portrait aus den übrigen 15 Bildern.
- **Reguläre Duo-Gegner** bekommen zwei verschiedene Bilder aus dem Pool, nachdem **beide** gewählten Spielerbilder ausgeschlossen wurden. Nicht benötigte Bilder bleiben unsichtbar.
- **Eiman Huel Stalker** nutzt immer `story-eiman` – im Solo-Geheimduell und in Duo-Kapitel X. **Hans Ess Kirk** erhält immer `story-hans`.
- **Level-1-Fanatiker A** erhält fünf eigene Artworks `story-fanatiker-a-01` bis `-05`, **identisch im Solo- und Duo-Modus**.
- **Level-1-Fanatiker B** erhält ebenfalls fünf eigene Artworks `story-fanatiker-b-01` bis `-05`; derzeit **ohne eigenes ACE-Monster**.
- Für die Forscher wird in jeder neuen Queststufe das nächste Bild verwendet. **Nach einem bestandenen Abschnitt** wird im Duo auch die Kampfanzeige sofort auf die nächste Stufe aktualisiert. Fehlgeschlagene/unerfüllte Prüfungen verändern das Bild nicht.
- Die Forscherduos und das Magierduo besitzen vierteilige, **abwechselnde Dialoge**. Eiman wird zuerst vorgestellt, Hans nach dem ersten „Weiter“. Alle fünf Forschungsstufen haben jeweils eigene Wortwechsel.

## Artworks

Alle 28 Portraitdateien sind bereits in den vorgesehenen Verzeichnissen enthalten.

### Feste Story-Portraits: 12 Dateien

| Bild | Zuordnung |
|---|---|
| `story-eiman.webp` | Eiman Huel, Solo **und** Duo |
| `story-hans.webp` | Hans Ess, Duo |
| `story-fanatiker-a-01.webp` | Erster Forscher, Prüfung 1, Solo **und** Duo |
| `story-fanatiker-a-02.webp` | Erster Forscher, Prüfung 2, Solo **und** Duo |
| `story-fanatiker-a-03.webp` | Erster Forscher, Prüfung 3, Solo **und** Duo |
| `story-fanatiker-a-04.webp` | Erster Forscher, Prüfung 4, Solo **und** Duo |
| `story-fanatiker-a-05.webp` | Erster Forscher, Prüfung 5, Solo **und** Duo |
| `story-fanatiker-b-01.webp` | Zweiter Forscher, Prüfung 1, Duo |
| `story-fanatiker-b-02.webp` | Zweiter Forscher, Prüfung 2, Duo |
| `story-fanatiker-b-03.webp` | Zweiter Forscher, Prüfung 3, Duo |
| `story-fanatiker-b-04.webp` | Zweiter Forscher, Prüfung 4, Duo |
| `story-fanatiker-b-05.webp` | Zweiter Forscher, Prüfung 5, Duo |

**Bilddateien niemals untereinander tauschen.** Charakteridentität und Stufenwechsel erfolgen ausschließlich über die festen IDs. Beide Spieler erhalten durch eine bestandene Forschungskampagne jeweils dauerhaft den Forschungsrang der entsprechenden Stufe.

Portraits sind rein visuell: Das Aktualisieren der Artworks verändert **keine** Kartendecks, Kampfwerte oder KI-Verhaltensweisen.

## Integration vom 30.10.2026

Alle 16 Spielerportraits und 12 Storyportraits wurden im GitHub-Branch `development` installiert. Pull Request #41 wurde erfolgreich gemergt (Commit `faa0100ff71809db01f09eadbcf5b72e20629087`).

Die Supabase-Datenbankvalidierung ist auf `hero-01` bis `hero-16` erweitert. Der Duo-Server `arcane-duo-v2` wurde auf Version 27 ausgerollt. Die Portrait-/Story-Tests (12/12) und die Strategieprüfungen waren erfolgreich. Separate Smoke-Tests zum Karten-/Monsterkatalog schlagen weiterhin fehl und werden unabhängig überprüft. Eine manuelle Zwei-Spieler-Abnahme ist noch ausständig.

## Weitere Artwork-Updates

Dateien bei Bedarf unter derselben Portrait-ID im jeweiligen Verzeichnis ersetzen; die aktuelle Zuordnung steht im `assets/portrait-manifest-v215.json`. Das Spiel nutzt WebP und kann bei fehlenden Bildern Platzhalter anzeigen.
