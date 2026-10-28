# Arcane Duel – abschließender KI-Balancetest v15.78

## Vorregistrierte Fragestellung

Kann eine **sechste Startkarte ausschließlich für Spielerplatz 1** die
beobachteten Spielerplatzunterschiede verkleinern, ohne Predator- oder
Fusion-Strategien einseitig zu bevorzugen?

Der Test vergleicht zwei ansonsten identische Varianten:

1. **Kontrolle:** Spielerplatz 0 startet mit fünf, Platz 1 mit fünf Karten.
2. **Maßnahme:** Spielerplatz 0 startet mit fünf, Platz 1 mit **sechs** Karten.

Die sechste Karte wird aus dem **eigenen bestehenden 40-Karten-Deck** gezogen;
die Deckgröße bleibt 40. Es wird keine zusätzliche Karte erzeugt und keine
Kartenqualität manipuliert. Beide KI-Seiten erhalten dieselben
Entscheidungsregeln und denselben trainierten Vorzustand; Profile-Boni,
einseitige Verstärkungen und automatische Regelübernahmen bleiben deaktiviert.

Es handelt sich um eine reversible **Testregel**. Das produktive Spiel wird bis
zur Entscheidung des Entwicklers nicht verändert.

## Testablauf

| Dimension | Festlegung |
| --- | --- |
| Kämpfe | Vollständige 40-Karten-Duelle, ohne erzwungenes Angriffsverbot |
| Richtung 1 | Fusion gegen Predator (Stage 9) |
| Richtung 2 | Predator gegen Fusion (Stage 10) |
| Spielerplätze | Beide Plätze; beide Startspieler in jeder Konstellation |
| Kontrolle | Fünf eingefrorene Vergleichsarme und der letzte Fusion-Stomp-Kandidat |
| Kontraste | Vorher/nachher bei identischen Decks, Seeds, Profilen und Szenarien |
| Umfang | 2 Kartenvarianten × 2 Rollenstufen × 2.304 = **9.216** Duelle |
| Kandidat | 1.536 der 9.216 Duelle |
| Daten-Splits | TRAIN, VALIDATION, sealed HOLDOUT |
| Entscheidungsregel | Nur TRAIN und VALIDATION; HOLDOUT wird erst danach ausgewertet |

## Zusätzlich beobachtete Spielmechaniken

- Anzahl tatsächlich gespielter Drei-, Vier- und Fünf-Material-Fusionen.
- Wie häufig und wie lange große Fusionen tatsächlich auf dem Feld stehen,
  stichprobenweise pro gespieltem Zug.
- Echte Predator-Angriffe auf große Fusionen und reale Vernichtungen.
- Predator-Angriffsfenster gegenüber sichtbaren großen Fusionen.
- Tatsächlich ausgeführte Stomps, zusätzliche Treffer und Vernichtungen.
- Siegraten getrennt nach Rolle, Spielerplatz und zusätzlicher Startkarte.

Die Wahrnehmung eines `predator-vs-fusion`-Vorteils aus künstlichen vorbereiteten
Kampfstellungen (v15.76) ist kein direkter Ersatz für Duellsiegraten.
Insbesondere ist die Vernichtungsquote *ausgeführter* Predator-Angriffe kein
Schätzer für die Überlebenswahrscheinlichkeit *aller* großen Fusionen.

## Auswertung und Maßnahme

Berichtet werden der absolute Unterschied zwischen Platz 0 und Platz 1 in
beiden Rollen sowie eventuelle Gegenwirkungen (z. B. dass Platz 1 als Fusion
bereits zuvor im Vorteil war). Wenn die sechste Karte keine klare Verbesserung
erzielt, wird sie **nicht** automatisch ins Hauptspiel übernommen.

**Ziel:** Nach diesem letzten Vergleich anhand der Zahlen eine belastbare
Balancing-Entscheidung treffen, statt unkontrolliert Schaden oder
Fusionsmaterial-Boni zu verändern.
