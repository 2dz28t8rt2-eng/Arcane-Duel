# Arcane Duel – 20 wiederverwendbare Kartenlayouts

**Im Spiel auf dem Branch `development` aktiviert.** Vorschau: [alle 20 Layouts öffnen](../../docs/kartenlayout-galerie.html).

## System

Es gibt **vier Familien mit je fünf Designs**:

| Familie | Stufe 1 · Lv 1–2 | Stufe 2 · Lv 3–4 | Stufe 3 · Lv 5–6 | Stufe 4 · Lv 7–8 | Stufe 5 · Lv 9+ |
| --- | --- | --- | --- | --- | --- |
| Standard | `normal-01` | `normal-02` | `normal-03` | `normal-04` | `normal-05` |
| Fusion | `fusion-01` | `fusion-02` | `fusion-03` | `fusion-04` | `fusion-05` |
| ACE | `ace-01` | `ace-02` | `ace-03` | `ace-04` | `ace-05` |
| Essenz | `essence-01` | `essence-02` | `essence-03` | `essence-04` | `essence-05` |

Es handelt sich um 20 **individuelle, transparente SVG-Rahmen** mit getrennten Farbpaletten und Ausbaustufen. Bei höheren Stufen steigen Gravurdichte, Edelsteine, Glanz und Ornamentik. Ein fünftes Tier erhält langsamen, abschaltbaren Schimmer.

**Wichtig:** Die Spielwerte sind nicht Teil der Rahmen-Dateien. Namen, Monstergrafiken, Level, Rollen, Elemente, Beschreibungen sowie ATK/DEF werden weiterhin aus den Spieldaten eingesetzt. Die bestehende Kartenvorschau, der Deckeditor, das Lexikon, die Hand- und Feldkarten greifen auf dasselbe Kartensystem zurück. Es werden keine Karten-IDs oder gespeicherten Daten geändert. Schicksalskarten behalten ihre individuellen Spezialrahmen.

## Austausch gegen PNG oder neue Rahmen

Jedes Design liegt als transparente Datei unter `assets/card-templates/<familie>-<stufe>.svg`. Die Zuordnung erfolgt über:

- `assets/card-templates-v1.js` – visuelle, automatische Template-Auswahl beim Rendern
- `assets/card-templates-v1.css` – Farben, Außenrahmen, Ornamente, Glanz und die SVG-Asset-Slots
- `assets/card-templates/manifest.json` – maschinenlesbare Übersicht
- `docs/kartenlayout-galerie.html` – visuelle Darstellung aller Varianten

Später genügt beispielsweise diese CSS-Änderung, um einen **transparenten PNG-Rahmen** statt des SVGs einzusetzen:

```css
.ad-template-ace-05 {
  --ad-tpl-frame: url("card-templates/ace-05.png");
}
```

Die transparente PNG-Datei muss dazu unter `assets/card-templates/ace-05.png` liegen. Die übrigen HTML-Komponenten bleiben unangetastet.

## Später neue Monster ergänzen

Jedes Monster wird weiterhin als normale Karte im Kartensystem registriert. Seine Merkmale bestimmen automatisch die Vorlage:

```js
// Beispiel: Die Engine hat bereits die echte Karten-ID, Stats, Rolle und Art.
const template = window.ArcaneCardTemplates.choose({
  id: 123, name: "Ätherwyrm der Kronen", level: 10, ace: true
});
// Ergebnis: ace-05
```

Neue Bilder als separate WebP/PNG-Dateien anlegen. Eigene Layouts werden nicht pro Karte kopiert; eine Änderung am Template wirkt unmittelbar auf **alle** Karten mit der betreffenden Kombination aus Familie und Stufe.

### Lizenz und Assets

Die 20 Vektorornamente wurden als eigenständiges Design für Arcane Duel angelegt. Es wurden **keine** Shutterstock-Dateien übernommen. Künftige OpenGameArt-Dateien sind vor Einbau auf Lizenz, Namensnennung und Eignung zu prüfen.

## Qualitätssicherung

Automatisierte Tests: `tests/card-templates.test.cjs` und `tests/browser-card-templates.html`, ausgeführt durch GitHub Actions bei jedem Commit auf `development`. Geprüft wird die Anzahl der Layouts, SVG-Dateien, automatische Zuweisung, Rendern echter Werte, responsive Galerie und Bildpfade.

**Branch-Policy:** Dieser experimentelle Designstand ist ausschließlich auf `development`. `main` wird erst nach gemeinsamer visueller Freigabe aktualisiert.
