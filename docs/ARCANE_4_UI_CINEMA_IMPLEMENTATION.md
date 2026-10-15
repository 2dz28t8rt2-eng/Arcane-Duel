# Arcane Duel – 4.0 UI/Cinema Phase 1 (development)

**Status:** Experimenteller Entwicklungsstand; kein automatisches Release nach `main`.

## Deck-Kartenportal

Neue Dateien:

- `assets/deck-preview-portal-v4.js`: liest die **tatsächliche Position** der angeklickten Miniaturkarte, wählt bei fehlendem Platz rechts die linke Seite, begrenzt die Karte auf Bildschirmbreite und -höhe und zeigt die Vorschau als Overlay **direkt unter `document.body`**. Damit ist sie nicht an transformierte oder scrollende Menücontainer gebunden.
- `assets/deck-preview-portal-v4.css`: Glassmorphism-Rahmen und kleine responsiv begrenzte Karte; ursprüngliche Dauervorschau in Reihe 1 ausgeblendet.

**Interaktion:** Öffnen = Miniatur wächst als temporärer Karten-„Geist“ zur neuen Karte hin; Schließen = Rückflug zur Miniatur und Entsorgung der temporären Elemente. ESC, Schließen-Symbol, Außenklick sowie Menüwechsel beenden die Vorschau. Tastatureingaben und Deckaktionen werden vom bisherigen Editor gehandhabt. Die bestehende Spiellogik und Speicherfunktion bleiben unverändert. Verringerte Bewegung und `Animationen ausschalten` werden beachtet.

## Fullscreen-Spezialbonus nach dem Rollenstempel

- `assets/fusion-bonus-cinema-v4.js`: zeigt einen Bonus-Stempel **nach** dem Rollentag-Aufprall und **vor** dem ersten echten Zahlenwurf.
- `assets/fusion-bonus-cinema-v4.css`: riesige gravierte Typografie mit kurzem Aufprall, Anflug auf die Kamera, Lichtfunken und langsamem Verschwinden.
- Bonusart und Qualität stammen ausschließlich aus `rollMath.combo`, das `assets/evolution.js` beim bereits berechneten Ergebnis hinterlegt und bei gültigen gespeicherten Duellen wiederherstellt.
- `Paar → ZWILLING`, `Zwei Paare`, `Drilling`, `Kleine/Große Straße`, `Full House`, `Vierling`, `Fünfling` sowie `Elementharmonie` sind berücksichtigt.
- Partikeldichte und Grad der Inszenierung steigen mit Qualitätsprozenten und Kombinationsstufe. Bei fünf Materialien gilt die höchste Prunkstufe, unabhängig davon, ob ein dreiteiliger Bonus numerisch höher ausfällt.
- Die Ansicht nimmt **keinen Einfluss** auf die Werteberechnung und erzeugt weder Würfe noch zusätzliche Boni.

## Assetbibliotheken

- **tsParticles Slim:** die bereits eingebundene Fusion nutzt diese Bibliothek nur im Ritual; der neue große Kombinationsstempel nutzt performante CSS-Funken, damit die Anzahl laufender Particle-Engines nicht steigt. Alle Effekte haben Offline-Fallbacks.
- **Animate.css:** Timing und Aufprall sind eine projektspezifische Anpassung von Bounce-In/Fade-Out; eine neue globale CSS-Bibliothek wird vermieden, damit keine alten Kartenanimationsklassen beeinflusst werden.
- **OpenGameArt:** Kandidaten und Lizenz-Checkliste stehen in `docs/BESTIARIUM_ART_CURATION_20261015.md`. Bestehende Artworks bleiben vorerst unverändert; keine fremden Assets werden ohne klare Lizenz nachgeladen.
- **Shutterstock:** ausschließlich optische Stilreferenz, keine unlizenzierte Übernahme.

## Artwork-Revamp Phase 2

`assets/artwork-revamp-v4.js` und `assets/artworks/README.md` definieren stabile numerische Karten-IDs, vier Art-Kategorien und fünf Stufenklassen. Keine Sammelkarte oder bereits bestehende Illustrationen werden automatisch ausgetauscht oder umbenannt.

## QA / Release-Gates

- [ ] Browser: Karte beliebige Zeile, untere Reihe, linke/rechte Bildschirmseite
- [ ] Browser: 1200 px Desktop und 410 px Mobil – Overlay passt in sichtbaren Bereich
- [ ] Browser: Rückflug, ESC, Klick außerhalb, Laden anderer Karte
- [ ] Browser: Bonusstempel zeigt gesicherte Prozent- und Würfelwerte
- [ ] Node: Alle 8 Kombinationsvarianten, Stufenpriorität, fehlende Bonusmetadaten
- [ ] Node: Alter Spielstand kann weitergeladen werden, `main` unverändert
- [ ] Erst nach positiven CI-Läufen und Freigabe die Änderung nach `main` bringen.

Ergänzende Browserprüfung: `tests/browser-ui4-cinema.html`, Nodeprüfung: `tests/ui4-bonus-artwork.test.cjs`.
