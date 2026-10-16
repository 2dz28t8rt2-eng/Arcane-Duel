# Arcane Duel · Rahmen und FX (Bestiarium, 2026-10-15)

## Verbindliche Asset-Slots

Die Rahmen und Kartengründe verwenden lokale CSS-Verläufe. **Mittlerweile sind transparente PNG-Rahmen für ACE und Essenz auch tatsächlich installiert**: `assets/frames/ace-regalia.png` sowie `assets/frames/essence-aegis.png` (je 240 × 368 RGBA), ergänzt durch eigene SVG-Ornamente mit denselben Namen. Keine externe Netzverbindung oder Stock-Lizenz erforderlich.

Statt HTML-Monsterbilder zu überschreiben, lassen sich künftig **transparente PNG-Rahmen** über Klassen und CSS-Variablen zuweisen:

```css
/* Beispiel: unter assets/frames/ eigene oder lizensierte PNG-Dateien ablegen. */
.hand-card.tc-card.tc-ace.evo-ace-tier-10,
.board-creature.tc-card.tc-ace.evo-ace-tier-10 {
  --ad-frame-png: url("frames/ace-tier-10.png");
  --ad-overlay-png: url("frames/ace-tier-10-ornament.png");
}
.hand-card.tc-card.tc-essence,
.board-creature.tc-card.tc-essence {
  --ad-frame-png: url("frames/essence-frame.png");
  --ad-overlay-png: url("frames/essence-ornament.png");
}
#menuScreen.atlas-screen {
  --ad-menu-panel-png: none;
}
```

Die Grafik darf nur Randdekor/Goldeinlagen enthalten. Die **inneren Monsterbilder** bleiben eigene HTML-`<img>`-Elemente, damit bei Materialwahl und Spielgeschehen keine Texte oder Werte verdeckt werden. Für 9-Slice-Grafiken wie Kenney kann künftig `border-image` statt Ganzseiten-Overlay sinnvoll sein.

## Recherche OpenGameArt – geprüfte freie Kandidaten

1. [Kenney – Fantasy UI Borders](https://opengameart.org/content/fantasy-ui-borders): Lizenz **CC0**, 130+ einzelne PNG-Sprites und Vektorquelle, besonders für Menüs, Ornamente und 9-Slice-Rahmen. Quellenangabe optional (Kenney.nl).
2. [Mumu – 40x56 Card Frames](https://opengameart.org/content/40x56-card-frames-without-the-art): Lizenz **CC0**; eher als Ausgangspunkt für kompakte Miniaturkarten wegen der niedrigen Auflösung.
3. [System G6 – RPG UI](https://opengameart.org/content/rpg-ui-1): Lizenz **CC0**; Fenster-/HUD-/Rahmenelemente, geeignet für Menüs und Bedienelemente.

Die OpenGameArt-Originale wurden **noch nicht importiert**. Stattdessen sind zwei eigens gezeichnete, transparente PNG-Layer im Spiel eingebaut und durch austauschbare CSS-Variablen gekoppelt. Bei neuen Quellen prüfen wir vor Übernahme sowohl die Auflösung als auch die jeweilige Lizenz. Shutterstock ist nur Stilreferenz: Ohne passende Lizenz keine Bilder aus dem Angebot übernehmen.

## Partikel und Animationen

- [tsParticles Slim](https://github.com/tsparticles/tsparticles): punktuelle Fusionseffekte, 26 Partikel für die erste Szene / 58 bei der zweiten, beschleunigten Feldfusion. Bei ausfallendem CDN sind CSS-Sparks verfügbar.
- [Animate.css](https://animate.style/): Referenz für Bounce- und Fade-Timing. Wir nutzen projektinterne Keyframes statt einer zusätzlichen globalen Bibliothek.
- Hauptmenü: Level 8 = erste Goldfolien-Effekte, Level 9 = zusätzliches Sternlicht, Level 10 = heller Doppelrahmen, magische Aura, intensiveres Licht. Bei reduzierter Bewegung und deaktivierten Animationen pausieren die Effekte.

## QA

Prüfen: (1) große ATK-/DEF-Zahlen 15–17 px, bei fünfstelligen Zahlen 12 px, (2) alle kleinen Karten halten ihre Werte innerhalb des Randes, (3) zwei gleiche Rollen vererben ihren Tag vor den Würfen, (4) Erstfusion endet in der Beschwörungsübersicht und (5) Feldfusion auf belegter Zone startet die zweite kurze Animation.

## Update Schaukasten, Leihdecks und Kampf-FX
- Die zentrale Level-10-Karte ist vorne positioniert; goldene Lichtlinien und eigener Schein werden am Rahmen erzeugt.
- Unterrichts-/Essenzprüfungen verwenden weiterhin Leihdecks. Gesehene Leihkarten erscheinen im Lexikon, werden aber nicht in den persönlichen Deckeditor aufgenommen.
- `assets/arcane-battle-fx.css/js` ergänzen die Kampfeinführung mit hochzählenden LP, Ergebnisinszenierungen, Kartensterben mit Glut, und Staub-/Erschütterungseffekte für 4–5 Materialien.
- `docs/BESTIARIUM_ART_CURATION_20261015.md` enthält die passenden OpenGameArt-Pakete und Lizenzdetails für künftige Kartenfamilien.
