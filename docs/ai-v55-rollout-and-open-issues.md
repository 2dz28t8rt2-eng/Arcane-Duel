# Arcane Duel 5.5 – KI-, Forschungs- und Karriere-Update (19.10.2026)

## Umgesetzt auf `development`
- Gegner I–X folgen der vereinbarten Rotation: Predator, Verteidigung, Fusion in leicht/mittel/schwer; Gegner X wählt situationsabhängig anhand der **sichtbaren** Spielerfeldkarten. Kodiert in `assets/ai-revamp-v55.js`.
- Deckkuratierung beachtet die Schwierigkeit, 40 normale Karten und 3 Kopien je Art. Finale hat keine niedrigen Lv3-Füllkarten. Große ACE-Priorisierung einschließlich normaler Beschwörung, Fusionswahl, nachvollziehbarer ACE-Vorbereitung durch Umordnen **bereits vorhandener** Karten im Gegnerdeck.
- Predator-Schwarmbonus: +2 % ATK je weitere normale Predator-Kreatur bis +8 %. Allrounder-/Resonator-Resonanzen unverändert.
- Verteidigungs-KI: Wächter suchen DEF und heilen Seelenzehrer; Seelenzehrer greifen in DEF über drain-ähnliche Fähigkeiten offensiv ein; schwere KI priorisiert das. Keine heimlichen Informationen über die gegnerische Hand.
- Niedrigstufige Fusionen Level 3–5 erhalten je nach Rolle einen einmaligen Utility-Effekt und bleiben damit neben höheren Fusionen taktisch interessant (`assets/fusion-utility-v55.js`).
- Fanatiker: freigeschalteter permanenter Skill **Verbotene Forschung**, mit temporärer Verfügbarkeit der Lv1-Techniken in den passenden Forschungsprüfungen. Nach Finale dauerhafte Freischaltung; aufwertbarer Wertebonus Rang 1–5, +5 ATK und DEF je Rang auf gewöhnliche Lv1-Karten. Lv1-ACE Lumira ist davon ausgenommen (`assets/lv1-saga-v43.js`, `assets/lv1-swarm-v43.js`, `assets/ai-revamp-v55.js`).

## Artwork-Status
- 15 rollenspezifische WebP-Motive sind im GitHub-Repository vorhanden; aktive Monster und Sonderdecks sind durch Artwork-Audit-Tests abgesichert.
- Die Qualitätsforderung »keine generisch aussehenden Monster« ist **nicht** mit Pfad-/Dateiexistenztests beweisbar. Besonders Leerenorakel und die zehn Schicksalsmonster müssen visuell/künstlerisch anhand der tatsächlichen Renderings bewertet und gegebenenfalls durch neue hochwertige Einzelillustrationen ersetzt werden.
- Bereits vorhandene SVG-Schicksalsillustrationen oder schematische Designs dürfen nicht als endgültige hochwertige WebP-Artworks ausgegeben werden. Ihre vollständige Neuerstellung erfordert echte neue Bildassets; der reine KI-/Karriere-Release behauptet dies nicht.

## Testnachweise
- Beide GitHub-Checks erfolgreich auf `631b54203b640fa40aa456ef707b6b65d616b297`:
  - https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39211298387
  - https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39211298372
- `tests/ai-revamp-v55.test.cjs` prüft die Strategierotation, legalen Gegnerdecks, das Lv10-Endgegner-Deck ohne Lv3-Füllkarten, ACE-Vorbereitung, KI-Heilen/DEF-Entscheidungen, Forschungsfreischaltung und KI-Zug-Simulation.

## Noch verifizieren und verbessern
- Ganzer Karriere-Test als menschlicher Spieler mit realistischen Sammel-/Farmmöglichkeiten: CI kann Nicht-Abstürzen prüfen, aber nicht garantieren, dass die Schwierigkeit als angemessen empfunden wird.
- ACE-Frequenzen pro Gegner über Hunderte vollständige simulierte Matches messen, ohne illegale Gratis-Züge.
- **Lv1-Quest-Prolog und besonders Übergang II → III** mit realem Savegame und wiederholtem Laden testen.
- Schicksals- und ACE-Artworks nach Sichtprüfung neu illustrieren; die bloße Umstellung einer Artwork-URL ist kein Qualitätsersatz.
- Niedrig-/hochrangige Fusionseffekte in echten Matches gegeneinander balancieren.

Keine automatische Levelmigration bestehender Karten: Karten behalten ihre feste Stufe.
