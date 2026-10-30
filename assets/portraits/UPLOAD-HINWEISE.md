# Arcane Duel – Portrait-Uploadplan v21.7

Die vollständige Bildintegration ist vorbereitet. Für das Spiel werden **genau 28 Portrait-Artworks** benötigt, nicht 60 separate Bilder. `portrait-manifest-v215.json` listet sämtliche Dateinamen und Charakterzuordnungen.

## Vorhandene Spiel-Logik

- **16 wählbare Portraits**: Beide Spieler wählen ihr Charakterbild aus `hero-01` bis `hero-16`.
- **Reguläre Solo-Gegner** (Milo bis Aster) erhalten jedes ein anderes, per stabilem Zufall zugeteiltes Portrait aus den übrigen 15 Bildern.
- **Reguläre Duo-Gegner** bekommen zwei verschiedene Bilder aus dem Pool, nachdem **beide** gewählten Spielerbilder ausgeschlossen wurden. Nicht benötigte Bilder bleiben unsichtbar.
- **Eiman Huel Stalker** nutzt immer `story-eiman` – im Solo-Geheimduell und in Duo-Kapitel X. **Hans Ess Kirk** erhält immer `story-hans`.
- **Level-1-Fanatiker A** erhält fünf eigene Artworks `story-fanatiker-a-01` bis `-05`, **identisch im Solo- und Duo-Modus**.
- **Level-1-Fanatiker B** erhält ebenfalls fünf eigene Artworks `story-fanatiker-b-01` bis `-05`; derzeit **ohne eigenes ACE-Monster**.
- Für die Forscher wird in jeder neuen Queststufe das nächste Bild verwendet. **Nach einem bestandenen Abschnitt** wird im Duo auch die Kampfanzeige sofort auf die nächste Stufe aktualisiert. Fehlgeschlagene/unerfüllte Prüfungen verändern das Bild nicht.
- Die Forscherduos und das Magierduo besitzen vierteilige, **abwechselnde Dialoge**. Eiman wird zuerst vorgestellt, Hans nach dem ersten „Weiter“. Alle fünf Forschungsstufen haben jeweils eigene Wortwechsel.

## Upload

1. Bilder quadratisch exportieren, idealerweise **512 × 512 Pixel**, als **WebP** oder **PNG**.
2. Dateien mit den festen IDs benennen, z. B. `hero-03.webp`, `story-eiman.png`, `story-fanatiker-a-01.webp`.
3. Im **`development`-Branch** nach `assets/portraits/heroes/` oder `assets/portraits/story/` hochladen.
4. Spielseite neu laden. **Keine Codeänderung erforderlich.** Fehlende Bilddateien werden durch einen neutralen Platzhalter ersetzt.

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

## Benutzer-Archiv vom 30.10.2026

Das gelieferte Archiv enthält 16 benannte Spielerportraits, Eiman Huel, Hans Ess
sowie je fünf Entwicklungsbilder für Forscher A (Professor mit Brille) und
Forscher B (blonder Höhlenforscher): insgesamt **28 Bilddateien**.

Die Bilder wurden als eigenständiges, uploadfertiges ZIP mit 28 korrekt
benannten **512×512-WebP-Dateien** im exakten Repo-Pfad
`assets/portraits/` vorbereitet. **Der GitHub-Connector kann lokale Binärdateien
nicht direkt aus einem Chat-Upload übernehmen.** Für die Veröffentlichung
müssen die WebP-Dateien aus diesem ZIP ausgepackt und in GitHub hochgeladen
werden; nur das ZIP allein ins Repository zu kopieren reicht nicht.

Die Auswahl von `hero-13` bis `hero-16` setzt aktualisierte Solo-/Duo-
Validierungsregeln und eine aktualisierte Datenbank-Constraint voraus.
SQL-Migration und Edge-Deployment gemeinsam freigeben.
