# Arcane Duel – Entwicklungs- und Forschungsnotizen vom 27.10.2026

## Predator Pack v19.8 – implementiert, Browserabnahme noch offen

Im **development**-Branch ist das Rudelführer-/Jagdsystem implementiert:
- Ein einziger aktiver Rudelführer; die neueste Predator-Fusion ersetzt die alte Führung dauerhaft.
- 2 Materialien: nur die Basis-Aura; 3: eine zufällige kleine Zusatzfähigkeit; 4: zwei verschiedene; 5: alle drei.
- Schimmernde Krone, Jagdmarkierung/Fadenkreuz, Folgeangriffe +5/+10 %, zusätzlicher Impact, Klauenhieb-Zerreißanimation bei markierten Kills.
- Rudelinstinkt (+0,5 Prozentpunkte zur Rudelführer-Aura), Blutspur (+3 % Folgeangriff), Rudelruf (alle drei eigenen Züge ein schwacher Predator-Token).
- Schwacher, angreifender Token mit stufenbezogenen, stark reduzierten Werten. Keine Fusion; zählt für Predator-Schwarm und Jagdmarkierung.
- Rudelführer-Erweckung mit Tatze und Fähigkeiten nach den Wertewürfen im ursprünglichen Kasten, synthetischem Heulen bei vier oder fünf Materialien.
- Spielstand-Validierung und Handbuch aktualisiert. Automatischer Regressionstest #40496733007 erfolgreich; anschließend ergänzter Test #40495327278 ebenfalls erfolgreich.

**Später gezielt abnehmen**: Aussehen, Sound und Timing der Krone, Markierung, Klauenzerreißanimation, Token und Erweckungsinszenierung im echten Browser. Automatisierte Tests ersetzen keine Sichtprüfung.

**Späteres Design-Thema**: Eigenständige, der Verteidiger-Identität entsprechende besondere Fusion für Wächter/Seelenzehrer (Bollwerk/Schutz, Kontrolle, defensive Zusammenarbeit). Erst nach gemeinsamer Ideenfindung ausarbeiten und NICHT mit Predator-Boni gleichsetzen. 2v2-Angleichung separat bearbeiten.

## KI-Forschung v14.9.71 – bewusst vor Predator Pack v19.8

GitHub-Run: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40499008498

23.040 geplante Forschungsduelle in elf Phasen mit unverändertem Champion. Bisherige PvE-Sonderregeln für Alpha/Markierung/Token sind in den symmetrischen Forschungspartien deaktiviert. Ziel ist **nicht**, bereits eingeführte Rudelführer-Spielregeln zu bewerten, sondern die älteren Erkenntnisse kausal besser einzuordnen:

1. Fusionen gegenüber Erhalt mehrerer Monster: Materialkosten und reale Aktionen messen.
2. 3–5-Material-Fusionen: legale Möglichkeiten und tatsächlich gewählte Fusionen getrennt zählen, keine pauschale Statverstärkung.
3. Allrounder-Fusionsfokus: tatsächliche source-legale Allrounder-Verfügbarkeit und Deckanteile protokollieren; nicht erfüllbare Quoten nicht als erfüllt ausgeben.
4. Predator-Schwarm gegen Wächter/Seelenzehrer: dieselbe echte Predator-Rollenstrategie und dieselben Decks, Gegner, Seats/Seeds zwischen Kandidaten; aktiven Schwarm ausdrücklich gegenüber Fusionen erhalten.
5. Resonatoren: ihrer Wirkung durch legale Fusionen nachgehen, ohne Stärke aus bloßer Fusionszahl zu folgern.
6. Wächter + Seelenzehrer: bestehende gemischte Deckprüfungen mit gleichbleibender Strategierollenkennung wiederholen.

Freigabe nur bei TRAIN/VALIDATION-Gates, unabhängigen Sicherheitsprüfungen und ohne HOLDOUT-Auswahl. Keine automatische Übernahme nach `main`.
