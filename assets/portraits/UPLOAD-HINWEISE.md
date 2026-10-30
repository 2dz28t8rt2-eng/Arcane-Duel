# Arcane Duel – Charakterportraits v21.5

**Nur Bilder hochladen – keine weiteren Codeänderungen nötig.** In `development` existieren bereits die Auswahloberflächen, feste Portrait-IDs, automatisch eingeblendete Gegnerprofile und Platzhalter ohne Bilddateien.

## Hochladen

1. Ein Bild **quadratisch (1:1)** zuschneiden, empfohlen **512 × 512 Pixel**. Motiv: Gesicht/Brustbild mittig, etwas Sicherheitsabstand an den Rändern.
2. Das Bild exakt nach seiner Portrait-ID benennen, z. B. `hero-03.webp`. **WebP** ist empfohlen. **PNG** mit demselben Namen (`hero-03.png`) wird ebenfalls automatisch erkannt.
3. In GitHub unter `development` in den jeweiligen Ordner hochladen:
   - **Spieler:** `assets/portraits/heroes/`
   - **Singleplayer-Gegner:** `assets/portraits/solo/`
   - **Duo-Gegner:** `assets/portraits/duo/`
4. Spielseite neu laden. Fehlende Bilder zeigen weiterhin einen stilisierten, spielbaren Platzhalter.

## Vollständige Bildliste

Die Datei [`portrait-manifest-v215.json`](../portrait-manifest-v215.json) enthält alle **60** benötigten Datei-IDs und die dazugehörigen Gegnernamen:
- **12** frei wählbare Spielerportraits (gleiche Auswahl in Solo und Duo).
- **11** reguläre Singleplayer-Gegner inklusive Training.
- **7** Singleplayer-Sonderplätze für Geheimduellant, Zufallsbegegnungen und Fanatiker I–V.
- **30** Duo-Gegnerplätze (je zwei pro Kapitel 1–15).

**Wichtig:** Die Bilder sind rein kosmetisch. Karten, KI, Fusionsmechanik, Spielfortschritt und Gegnerwerte bleiben unverändert. Bereits vorhandene Spielstände behalten ihre Daten; ohne explizite Wahl wird `hero-01` verwendet.

## Beispiele

- `assets/portraits/heroes/hero-01.webp` – erster auswählbarer Spielercharakter
- `assets/portraits/solo/solo-opponent-02.png` – Akari Hoshino
- `assets/portraits/solo/solo-fanatiker-05.webp` – Fanatiker-Prüfung V
- `assets/portraits/duo/duo-chapter-10-a.webp` – erster Gegner in Kapitel X
- `assets/portraits/duo/duo-chapter-10-b.png` – zweiter Gegner in Kapitel X

Beim Einfügen eines neuen Bildes **keine Änderungen an der JSON-Datei** vornehmen. Diese ist ein Upload-Spickzettel und dient Tests, nicht als Laufzeitkonfiguration. Bestehende Bilddateien durch Upload derselben ID ersetzen und bei Browser-Cache-Problemen hart neu laden.

Aus Datenschutzgründen sind frei wählbare Bilder aus unbeschränkten URLs **nicht** vorgesehen. Alle Portrait-IDs sind fest definiert; Namen werden als Text ausgegeben.
