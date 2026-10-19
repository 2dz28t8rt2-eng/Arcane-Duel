# Arcane Duel 5.6 · Beschwörungszentrale (19.10.2026)

Auf `development` neu: gegliederter Beschwörungsbereich mit getrennten Elementen für aktuelle Handkarte, echtes Material (mit UID-basiertem Entfernen), Fusionsqualität/Vorlagen und 5 Monsterzonen.

- Keine Änderung an `createGame`, `prepareHandFusion`, `placePending`, Ressourcen, Rolleneffekten oder Werten.
- Bei noch nicht platzierter Fusion keine Offenlegung der Würfelergebnisse.
- Hand und reguläre Feldmonsterzonen bleiben die einzigen Interaktionsquellen für Beschwörung und Platzierung.
- Desktop: Material und Vorschau nebeneinander. Mobil: untereinander, 5 Zonen gut erkennbar. Tastaturfokus auf Material-Entfernen.
- DOM/VM-Tests prüfen Selection, genau fünf Zonen, Materialanzahl und verdeckte Fusionswerte. Browser-Screenshots als visuelle Abnahme bleiben gesondert zu prüfen.
