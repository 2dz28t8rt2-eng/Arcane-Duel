# Arcane Duel – Visual Revamp 3.0

## Release-Strategie

- **main:** Alpha 2.5.2, aktueller stabiler Spielstand (Release am 14.10.2026). Die frühere 1.8 ist in `archive/alpha-1.8-before-2.5-release` erhalten.
- **development:** 3.0 Visual Preview 1. Neue Darstellung ohne Eingriffe in Kampflogik, Inventar, Spielfortschritt oder Speicherformat.
- **3.0 stable** wird erst nach einem zusammenhängenden Grafik-, Animations- und UI-Polish sowie praktischen Gerätechecks veröffentlicht.

## Phase 1: Kartenidentität – umgesetzt

- Gemeinsame Fantasy-Metalloptik für Hand, Sammlung, Charakterpacks, Fusionsauswahl, Vorschau und Spielfeld.
- Größere Illustrationsfenster, reduzierte Flächen, ornamentale Ecken, kontraststärkere Titel und ATK/DEF-Plaketten.
- Violette Runenfassung für Fusionen, individuelle ACE-Metallfarben weiterhin exklusiv für die ACE-Karten.
- Responsive Gestaltung und Berücksichtigung von `prefers-reduced-motion`.
- Eigene CSS-Layer `assets/visual-v3.css` hinter bestehenden Stylesheets: vollständig entfernbar, kein Savegame-Migrationsbedarf.

## Phase 2: Geplant (noch nicht umgesetzt)

- Hochwertigere individuelle Monsterillustrationen im gemeinsamen Dark-Fantasy-Stil, zuerst Starter und Gegner I–III, später gesamter Pool.
- Beschwörungs-/Fusionsabläufe mit feineren kurzen Bewegungen, Werten und hochwertigen Partikelakzenten; jederzeit überspringbar.
- Grafikoptionen für Leistung, Animation und reduzierte Bewegung.

## Phase 3: Geplant (noch nicht umgesetzt)

- Gleiche Bildsprache in Shop, Sammlung, Herausforderungen, Tutorial, Quests und Hauptmenü.
- Typografische Hierarchie, mobile Detailansicht, UI-Feedback und finaler Regressionstest.
- Version-3.0-Release erst nach gemeinsamer visueller Abnahme.

## Qualitätssicherung

- `npm test`: automatisierte Regressionstests einschließlich v3 Card-Families.
- Chromium-Sichtprüfung bei 1440×1024 und 390×844: Normal, Fusion, ACE-Normal, ACE-Fusion; alle vier Illustrationen geladen.
- Keine Änderungen an Spielstandschlüssel, Objekt-IDs oder Gegner-Kampflogik.