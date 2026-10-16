# Arcane Duel · Monster-Artworks – erste Produktionswelle

**Branch:** `development` · **Ziel:** Arcane Duel 4.0 · **Status:** 10 Bilder aktiviert.

## Tatsächlich integrierte Motive

Die zehn Fantasy-Artworks stammen aus der gemeinsam entwickelten Kartentafel. Die Illustration wurde jeweils **ohne aufgedruckte Demo-Stats und ohne Demo-Rahmen** ausgeschnitten, auf 420 × 420 Pixel gebracht und verlustarm als WebP im Repository gespeichert. Die Monsterkarte selbst wird im Spiel weiterhin dynamisch aus Name, Level, Rolle, Element, ATK, DEF und CSS-Rahmen erzeugt.

| Artwork / neuer Kartenname | Zuordnung im Spiel | Bemerkung |
|---|---|---|
| `ascheling.webp` · Ascheling | Original-Starterschablone ID 0 | Stufe 1, Feuer, alle bisherigen Werte erhalten |
| `schattenwolf.webp` · Schattenwolf | Werkstattfamilie „Nachtpirscher“, Stufe 2 | Dunkel-Predator; bestehende Rolle und Stufe erhalten |
| `kristallgolem.webp` · Kristallgolem | Werkstattfamilie „Kristallbastion“, Stufe 3 | Erde-Wächter |
| `nebelwisp.webp` · Nebelwisp | Werkstattfamilie „Seelensumpf-Hydra“, Stufe 4 | Seelenzehrer; Element Wasser statt nicht unterstütztem Eis |
| `dornenschlund.webp` · Dornenschlund | Passende vorhandene normale Stufe-5-Erde-Karte | Falls kein Erde-Predator existiert, gewinnt die Elementtreue vor einer Rollenänderung |
| `seelenspalter.webp` · Seelenspalter | Vorhandene fusionierbare Stufe-6-Karte | Möglichst Dunkel |
| `runenbrut-koloss.webp` · Runenbrut-Koloss | Vorhandene fusionierbare Stufe-7-Karte | Möglichst Erde |
| `blutkrone.webp` · Blutkrone der Verdammnis | Vorhandene fusionierbare Stufe-8-Karte | Möglichst Feuer |
| `aetherwyrm.webp` · Ätherwyrm der Kronen | Bestehendes Endgegner-ACE des Astralfinales | **Echte Spielstufe 10**, nicht die illustrative Stufe 9 der Bildtafel |
| `essenz-unendlichkeit.webp` · Essenz der Unendlichkeit | Bestehendes Essenzwesen der Fusionsschule | **Startstufe 3**, entwickelt sich im bestehenden Essenzsystem; nicht automatisch LV 10 |

Die automatische Auswahl nutzt eindeutige bestehende Karten-IDs und benannte Werkstatt-/ACE-/Essenz-Familien. Der Browser-Test verlangt, dass alle zehn Zuordnungen erfolgreich und ohne ID-Duplikate erfolgen.

## Was sich absichtlich NICHT verändert

- Keine neue Karten-ID, kein Verlust alter Karten oder Decks.
- Keine Freischaltung durch das Artwork, keine Änderung der Kartenverfügbarkeit.
- Kein Eingriff in ATK, DEF, Rolle, Element, tatsächliche Stufe, Spezialfähigkeit oder Fusionswürfe.
- Das Deck, das Lexikon, das Duell, die Gegner-Ansicht und die Kartenvorschauen lesen denselben zentralen CARDS-Katalog und zeigen deshalb die aktuellen Bilder.
- Für alle nicht berührten Monster bleiben Namen und Grafiken unverändert.
- `main` bleibt bis zur visuellen Abnahme und finalen 4.0-Freigabe unverändert.

## Technische Dateien

- `assets/artworks/wave01/*.webp`: 10 eigenständige, lokal gespeicherte WebP-Artworks
- `assets/artwork-revamp-v4.js`: sichere Live-Zuordnung zu alten Spiel-IDs
- `tests/browser-artwave01.html`: lädt alle Bilder, prüft die 10 IDs, echte Spielwerte und Kartenrendering
- `index.html`: cache-gebrochene Aktivierung des Artwork-Katalogs
- `.github/workflows/test.yml`: zusätzlicher Desktop- und Mobil-Browserlauf

**Hinweis zur Auflösung:** Diese erste Welle verwendet aus dem gemeinsamen Kompositionsbild extrahierte Motive. Für eine spätere ultra-hochauflösende Druck-/Fullscreen-Ausgabe sollten wir die Bilder einzeln neu rendern. Die Kartenstruktur lässt dies jederzeit zu.
