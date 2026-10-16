# Arcane Duel 4.0.4 · Isolierter Kartenkörper + Levelmedaillon

## Was das Update repariert

Die alten 3.0-Bronzeplatten für Titel, Artwork und ATK/DEF ließen die neuen modularen SVG-Rahmen im **Live-Spiel** weitgehend wie die früheren Karten aussehen. Das 4.0.3-Rahmen-Cleanup entfernte doppelte Außenornamente, nicht jedoch die alten inneren Gehäusebauteile.

**4.0.4** verwendet den originalen SVG-Rahmen und genau ein Levelornament, aber gestaltet den Inhalt klarer und flacher:
- 4 Familien und 5 Rahmenstufen bleiben bestehen (benachbarte Level dürfen dieselbe Rahmenstufe haben)
- rechteckigere Titel- und Artworkbereiche, flaches dunkles Wertefeld; alte Bronzepolster und dicke Innenkonturen nur bei Template-Karten außer Schicksalskarten deaktiviert
- ATK · **rundes Levelmedaillon** · DEF sind drei gleichberechtigte DOM-/Grid-Zellen
- kontrastreiche komplementäre Medaillonfarben: Standard–Türkis, Fusion–Grüngold, ACE–Blau, Essenz–Koralle
- Größen für Duell-Handkarten (22 px), gewöhnliche Karten (27 px), Großansichten (35 px), und Feldminiaturen (20 px)
- zusätzliche kleine Levelanzeige am Kartenkopf bleibt bestehen
- `tools/finished-card-renderer.html` zeichnet dieselbe Levelplakette für die **exportierten PNGs**, Wellen 01–09 können regeneriert werden

## Umfang

`assets/card-shell-v404.css` gilt nur für Karten mit `ad-template ad-level-frame`. Es ist bewusst die *letzte* Stylesheet-Quelle. Die alte CSS-Architektur wird für andere Spiel- und Schicksalskarten nicht global entfernt.

`assets/game.js`: nur zwei HTML-Rendertemplates, `fullCardHtml` und `cardHtml`, ergänzt. Monster-IDs, Bestandswerte, ATK/DEF-Berechnungen, Spielstände, Fusionen, Encounter, sonstige Animationen und Illustrationen bleiben unverändert.

Tests: `tests/card-shell-v404.test.cjs` und neuer isolierter Chrome-Browsertest `tests/browser-card-shell-v404.html`, Desktop + Mobil. Der Browsertest misst **berechnete CSS-Werte und Geometrie**, nicht bloß das Vorhandensein einer CSS-Klasse.

**Getrennte Warteliste:** `docs/ARTWORK_NEUGESTALTUNG_VORMERKUNG.md`. Die Monsterillustrationen werden nicht geändert. Element-Glow, Partikel, Smart-Zoom und Encounter sind nicht Teil dieses Updates.
