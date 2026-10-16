# Arcane Duel 4.0 – Artwork-Revamp vorbereiten

Diese Entwicklungsstufe enthält **keine stillschweigenden Änderungen an bestehenden Monsternamen oder Kartenwerten**. Die technische Vorbereitung erfolgt über `assets/artwork-revamp-v4.js`.

## Stabile Schlüssel

Jede existierende Karte behält ihre **numerische ID** und sämtliche spielrelevanten Eigenschaften. Artworks werden später über diese ID ersetzt, nicht über den angezeigten Namen, da dieser sich ändern darf.

- `base/initiate/0001` – einfache Wesen, Level 1–2
- `base/adept/...` – reguläre Kreaturen, Level 3–5
- `fusion/elite/...` – mächtige Fusionen, Level 6–7
- `fusion/mythic/...` – hochrangige Fusionen, Level 8–9
- `ace/sovereign/...` – einzigartige Boss-, ACE- und Level-10-Wesen
- `essence/...` – exklusive Essenzmonster mit eigenem Stil

Kategorien: `base`, `fusion`, `essence`, `ace`. Stufenklassen: `initiate`, `adept`, `elite`, `mythic`, `sovereign`.

## Spätere Dateiverteilung

```text
assets/artworks/
  base/        # normal beschwörbare Monster, nach Familien geordnet
  fusion/      # echte Fusionsmonster
  ace/         # besonders ikonische Signaturewesen
  essence/     # Essenz-Exklusivwesen
  placeholders/# temporäre grafische Platzhalter
```

Artworks künftig vorzugsweise als einheitlich beschnittene, optimierte WebP-Dateien ablegen. Transparente Einzelrahmen bleiben unabhängig in `assets/frames`; Karte, Bild und Name dürfen nicht zu einer einzigen statischen Grafik verschmelzen.

## Freigabe einer neuen Monsterfamilie

1. Motive mit geklärten Lizenzen auswählen (z. B. OpenGameArt CC0 oder CC-BY mit sauberer Attribution); keine Shutterstock-Dateien ohne gekaufte Nutzungsrechte.
2. Stufe/Größe/Komplexität des Monsters abstimmen: klein und schlicht bei Lv1, immer imposanter bis Lv10.
3. Für jede Karte passende Namen, Element, Rolle, Stufe und visuelle Familienkennung festlegen.
4. Original-IDs und sämtliche Speicherstände wahren. Art-, Namens- und Layoutvorschau mit dem Katalog überprüfen.
5. Mit Bild- und Regressionstests, Ladezeiten und Größenvergleich Desktop/Mobil veröffentlichen.

Ein späteres eigenes weiß-blaues Drachenwesen sollte im Endgame eine ikonische Rolle spielen, **ohne** die konkrete geschützte Blue-Eyes-White-Dragon-Karte oder deren charakteristische Darstellung zu kopieren.

Die bestehenden OpenGameArt-Kandidaten und Lizenzangaben sind in `docs/BESTIARIUM_ART_CURATION_20261015.md` dokumentiert. `main` erhält diese vorbereitenden Dateien erst im gesonderten 4.0-Release nach Nutzerfreigabe und vollständigen Tests.
