# Arcane Duel 5.6: Erste lernbasierte KI-Trainingsrunde (19.10.2026)

## Technische Umsetzung
- `tests/ai-offline-training-v56.cjs` testet alle 10 Turniergegner mit der originalen `createGame`/`simulateGame`-Engine.
- Kandidaten: `offensive`, `guardian`, `economy`, `balanced`.
- Pro Gegner 4 × 6 = 24 Trainingsduelle; zusammen 240. Davon getrennt zwei Holdout-Gruppen mit jeweils 6 Partien/Gegner = weitere 120 Duelle.
- Feste reproduzierbare Seeds; die Holdout-Samples bestimmen **nicht** die Kandidatenwahl.
- CI: [AI Offline Training v5.6](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39228348906), erfolgreich. JSON-Ergebnis als 30-Tage-Artefakt am Lauf.

## Tatsächliches Ergebnis
**360 erfolgreich simulierte Partien; 0 zusätzliche Holdout-Siege insgesamt** gegenüber den bisherigen Richtlinien. Alle zehn Trainingsreihen bevorzugten `offensive` wegen eines Gleichstands (deterministischer Tie-Break). Das ist **kein Nachweis, dass aggressives Spielen stärker ist**. Die aktuellen `ai-revamp-v55.js`-Entscheidungen erzwingen häufig bereits ihren Archetyp und ignorieren die getesteten niedrigeren Policy-Gewichte. Die vier Szenarien können deshalb gleiche Ergebnisse liefern.

Es wäre irreführend, diesen Vergleich als fertig **lernende** KI oder validierte Trainingsgewichte auszugeben. Daher **keine** automatische Änderung an Turnier-KI oder Kartenstärken.

## Notwendiger nächster Implementierungsschritt
1. Für jede legale Entscheidung eine deterministische, öffentlich beobachtbare Zustands- und Aktionsmerkmalsliste bilden: Deck-/Handressourcen nur des KI-Spielers, Feldkontrolle, Schaden, Support, Angriff/Fusion/ACE-Nähe und Zugphase. Niemals gegnerische verdeckte Karten lesen.
2. Mehrere Kandidaten legaler Aktionen im realen Engine-Modell bewerten. Leichte Gegner nur kurze Vorschau, schwere bis zu 2–3 Züge; Kandidatenwechsel nur bei echten bewerteten Alternativen.
3. Per Simulation Gewichte optimieren (z. B. evolutionäre Parametersuche) **und** Policy-Sensitivität testen, bevor ein Gewinner gekürt wird.
4. Holdout gegen bisherige KI, nicht nur gegen Zufall, bei gleichen Karten, Startvorteilen und Seeds; Resultate je Gegner I–X, Strategie und ACE-Frequenz protokollieren.
5. Erst nach gemessener Verbesserung Spielgewichtungen mit Difficulty-Caps aktivieren. Offizielle Regeln und Spielstände bleiben unverändert.

## Artwork-Transfer-Status
Die Originalzeichnungen (10 Fate und 5 alte QA-Fälle) wurden lokal in 1086 × 1448 Pixel große, verlustarm komprimierte WebPs umgewandelt. Der aktuelle GitHub-Connector konnte die lokalen Dateibytes nicht direkt übertragen; diese neuen WebPs sind daher noch **nicht** auf `development`. Das freigegebene Paket liegt als `Arcane_Duel_15_freigegebene_Artworks.zip` vor. Auf `development` wurde der Fate-Slot-Name in `assets/game.js` und `assets/fate-illustrations.js` zu **Himmlischer Löwenwächter** geändert, die unveränderte alte PNG-/WebP-Pfadzuordnung muss nach erfolgreichem Bildimport aktualisiert werden.
