# Arcane Duel 5.6 · Beschwörungszentrale (19.10.2026)

Auf `development` neu: gegliederter Beschwörungsbereich mit getrennten Elementen für aktuelle Handkarte, echtes Material (mit UID-basiertem Entfernen), Fusionsqualität/Vorlagen und 5 Monsterzonen.

- Keine Änderung an `createGame`, `prepareHandFusion`, `placePending`, Ressourcen, Rolleneffekten oder Werten.
- Bei noch nicht platzierter Fusion keine Offenlegung der Würfelergebnisse.
- Hand und reguläre Feldmonsterzonen bleiben die einzigen Interaktionsquellen für Beschwörung und Platzierung.
- Desktop: Material und Vorschau nebeneinander. Mobil: untereinander, 5 Zonen gut erkennbar. Tastaturfokus auf Material-Entfernen.
- DOM/VM-Tests prüfen Selection, genau fünf Zonen, Materialanzahl und verdeckte Fusionswerte. Browser-Screenshots als visuelle Abnahme bleiben gesondert zu prüfen.

## Regression Fusionskino (v5.6.1)
Nach dem tatsächlichen Fusionskino setzt der Motor `game.pending.revealed = true`. Die Vorschau zeigt dann `fullCardHtml` samt echter Wurfergebnisse in `.arcane-fusion-ready-card`, **noch vor** der Feldzonenwahl. Vor der Enthüllung bleiben die Werte unsichtbar. Browser-Test `tests/browser-fusion-visual.html` und neuer DOM-Test decken beide Zustände ab.
