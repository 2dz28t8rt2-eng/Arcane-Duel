# Arcane Duel 3.0 — Lokales Fusion-Cinema & Regelbuch-Update

Status: lokal, **nicht** auf GitHub veröffentlicht. Enthält Normalmonster-Artpack 01.

## Fusionsanimation

- Zeigt die tatsächlich verwendeten Kartenartworks der Handfusion; Feldfusionen zeigen die vorbereitete Karte und das vorhandene Feldmonster.
- Auch KI-Handfusionen übergeben die eingesetzten Materialien an die Animation.
- Sequenz: Materialkarten erscheinen → kreisen → fliegen zusammen → Lichtblitz → neue Fusionskarte erscheint → Wertewürfe → Endwerte.
- Bei aktivierter Option »Sofort« oder reduzierten Betriebssystemanimationen entfällt die Sequenz.
- Rein visuell; verändert keine Duellwerte und keine Fusionskosten.

## Neue Low-Level-Synergie

Pokerkombinationen mit mindestens 3 Materialien erhalten je Lv1-Material +2 Prozentpunkte und je Lv2-Material +1 Prozentpunkt Qualitätsbonus, maximal +8 Prozentpunkte. Keine Aufwertung freier Zweikartenfusionen.

Die Große Straße hat jetzt +26 statt +15 Prozentpunkte Grund-Qualitätsbonus, um ihren größeren Levelabstand auszugleichen.

### Grundboni (ohne Low-Level-Zusatz, ohne Elementharmonie)

| Kombination | Qualitätsbonus | Würfe | Levelbonus |
|---|---:|---:|---:|
| Paar | +4 % | +0 | +0 |
| Paar aus Lv1 | +5,5 % | +0 | +0 |
| Zwei Paare | +12 % | +1 | +1 |
| Zwei Paare mit Lv1-Paar | +17 % | +1 | +1 |
| Drilling | +8 % | +1 | +1 |
| Kleine Straße (3) | +20 % | +1 | +1 |
| Kleine Straße (4) | +22 % | +1 | +1 |
| Große Straße (5) | +26 % | +3 | +2 |
| Full House | +14 % | +2 | +2 |
| Vierling | +13 % | +2 | +1 |
| Fünfling | +18 % | +3 | +2 |

Gleiches Element aller Materialien: +2,5 Prozentpunkte. Finale Qualität = clamp(72 %, 148 %, 100 % + 4,5 % × (Materialzahl − 2) − 7,5 % × Levelspanne + Poker-Qualität + Low-Level-Zusatz + Elementharmonie).

## Regelbuch

- Neues Arcane-Duel-3.0-Regelbuch in acht aufklappbaren Kapiteln.
- Kartenlayout: ATK links, DEF rechts, Level, Element, Normal/Fusion/ACE-Rahmen.
- Bedienung, Decks, Herstellung, Startfusionen, Kampf, Zerfall, Fusionen, Poker-Bonustabelle, Turnier, Quests, Autobattle, Herausforderungen.
- Klarstellung: Fusionsvorlagen im Lexikon/Herstellungsmenü sind nicht automatisch besessen oder direkt als Handkarte spielbar. Die Startfusionen sind Lv2 Funkenwyrm und Lv4 Runengreif.

## Teststatus

- `npm test`: 168/168 bestanden, inklusive neuer Fusionsbonus- und Regelbuchtests.
- Der Browser wurde in dieser Umgebung für lokale HTTP- und file://-URLs blockiert. Eine echte visuelle Browserabnahme ist daher noch offen.
- GitHub/main/development wurden **nicht** verändert.
