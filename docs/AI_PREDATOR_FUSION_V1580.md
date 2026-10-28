# Arcane Duel – KI-Forschung v15.80: Spielerplatz gegen Startreihenfolge isolieren

## Ausgangsbefund

Die v15.79-Testregel „sechste Startkarte für den tatsächlich Zweitziehenden“
verringerte auf den Gesamtdaten zwar manchen Spielerplatzunterschied, erzeugte
aber widersprüchliche Rollen- und Validierungseffekte. Besonders Fusion-KI und
Predator-KI reagieren unterschiedlich.

Eine nachträgliche Prüfung zeigte eine wichtige Einschränkung: Im bisherigen
Simulator enthielt `matchSeed` den Term `starter * 107`. Beim Wechsel des
Startspielers wurde daher zugleich der Zufalls-Seed verändert. Dadurch waren
„Starter-Effekt“ und „Zufallsverlauf“ bislang nicht strikt getrennt.

## Vorregistrierte v15.80-Testbedingungen

| Kontrollfaktor | v15.80 |
| --- | --- |
| Match-Seed | **Identisch** für Starter 0 und Starter 1; `starter * 107` entfällt |
| Kandidatenplatz | Platz 0 und 1 für alle identischen Szenarien |
| Deckgruppe CROSS | Echte Fusion-gegen-Predator- und Predator-gegen-Fusion-Decks |
| Deckgruppe MIRROR | Auf beiden Seiten **exakt dasselbe geordnete Deck** und derselbe Fusionsvorrat |
| Startkartenvariante 0 | 5 Karten für beide |
| Startkartenvariante 1 | 5 für den Ersten, 6 für den Zweiten – aus dem bestehenden 40er-Deck |
| KI-Entscheidungen | Gleiches Q, gleiche Rollenpolicy auf beiden Seiten |
| Alle Boni | Keine einseitigen Perks, keine Sitzplatzboni |
| Umfang | 2 Gruppen × 2 Startkartenregeln × 2 Rollen × 2.304 = **18.432 vollständige Duelle** |
| Datensplits | TRAIN, VALIDATION, HOLDOUT ohne Holdout-basierte Auswahl |

Alle Ergebnisse werden nach Spielerplatz, tatsächlich Erst-/Zweitziehendem,
Rollenstufe, Deckgruppe und Startkartenregel aufgeschlüsselt.

## Neue Instrumentierung

Im MIRROR-Arm wird **in jedem einzelnen Duell** nachgewiesen:

1. Die ursprünglichen fünf Handkarten beider Spieler sind identisch.
2. Die vollständige Reihenfolge des ursprünglichen 40-Karten-Decks ist identisch.
3. Der Fusionsvorrat ist identisch.
4. Beim sechsten Zugkartenzug bleibt Platz/Starter eindeutig zugeordnet.
5. Beim Startertausch für dieselbe Konstellation bleibt der `matchSeed` gleich.

Zusätzlich werden die tatsächlichen Aktionen der ersten vier Züge nach
Spielerplatz und Aktionsart gezählt. Die ersten fünf Aktionsarten pro Platz
werden erfasst. Die bestehenden Echtkampf-Metriken zu großen Fusionen,
Stomp, Predator-Angriffen und Vernichtungen bleiben erhalten.

### Zusätzliche Kandidatenmarkierungskontrolle

In einem perfekten MIRROR-Duell darf die **bloße Markierung**, welcher
Spieler als „Kandidat“ gezählt wird (`candidateSeat`), das reale Spielergebnis
nicht ändern. Bei identischem Starter, Seed, Deck und KI-Policy vergleicht der
Test deshalb den tatsächlichen Sieger, während `candidateSeat` 0 und 1
durchläuft. Jede Abweichung wird gesondert als mögliche Kandidatenmarkierungs-
Verunreinigung des **Forschungssimulators** protokolliert.

Damit lässt sich unterscheiden, ob der beobachtete Effekt aus echten
Spielmechaniken, festen Sitzplatzannahmen, Anfangsdeckverteilungen,
Zugreihenfolge oder der Forschungs-KI selbst entsteht.

## Entscheidung nach dem Lauf

- **Zuerst** prüfen, ob der Simulator bei reiner Kandidaten-Umetikettierung
  unterschiedliche Sieger erzeugt. Das wäre ein ernstzunehmender Fehler der
  Testmethodik und müsste vor weiteren Balance-Entscheidungen behoben werden.
- **Danach** Sitzplatz- und Startereffekte getrennt auf den identischen
  MIRROR-Decks untersuchen.
- **Erst anschließend** die echten CROSS-Duelle zur Predator/Fusion-Balance
  interpretieren und die sechste Karte beurteilen.
- Keine automatische Übernahme ins Hauptspiel und keine KI-Promotion.

Es handelt sich um kontrollierte, vollständige Simulationsduelle mit fixierten
Forschungs-Policies, **nicht um neuronales Gewichtstraining**.
