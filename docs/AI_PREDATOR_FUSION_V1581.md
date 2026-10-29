# Arcane Duel – KI-Forschung v15.81: Woher kommt der Zweitziehenden-Vorteil?

## Gesicherter Ausgangspunkt

v15.80: 18.432 vollständige Duelle, identische Starter-Paar-Seeds und 0 Kandidatenmarkierungs-Leaks in 4.608 Kontrollen. Bei vollständig identischen Predator-Decks gewann der tatsächlich zweitziehende Spieler **68,75 %** (5/5), während Fusion-Spiegelduelle fast ausgeglichen waren (**51,56 %**). Die sechste Startkarte war keine verlässliche Lösung und bleibt **deaktiviert**.

### Direkt überprüfbare Regelspur

`assets/game.js` enthält `canAttack(...)`: Ein Angriff ist bei globalem `g.turn===1` unmöglich. Der erste Duellant darf daher in seinem ersten eigenen Zug nicht angreifen, der zweite darf dies schon auf dem globalen Zug 2. In der aktuellen Forschungs-Konfiguration sind die **Arena-LP-Zerfallsrunden ausgeschaltet**, der **Kreaturenzerfall von ATK/DEF** aber eingeschaltet. Es ist daher unzulässig, den v15.80-Effekt schon vor dem Experiment auf Arena-LP-Zerfall zurückzuführen.

## Vorregistrierte kausale Mechanismen-Tests

Alle sechs Varianten benutzen **dieselben ursprünglichen 40-Karten-Decks, fünf Startkarten je Platz, denselben Match-Zufallsstartwert, denselben Starter, dieselben KI-Entscheidungsmodelle auf beiden Seiten und keine einseitigen Perks**.

| Faktor | Test-only Änderung | Welche Ursache wird geprüft? | Einzuplanender Nachteil |
| --- | --- | --- | --- |
| `baseline` | Originale v15.80-Mechanik, 5/5 | Referenz | Enthält alle Effekte |
| `equal-opening-attacks` | Angriffe bis Ende von globalem Zug 2 gesperrt | Vorteil durch sofortigen Angriff des Zweitziehenden | Verändert die Spielflussreihenfolge und die Anfangstaktik |
| `no-creature-decay` | Natürlicher ATK/DEF-Kreaturenzerfall für beide aus | Zerfallsrhythmus pro eigenem Zug | Erhöht langfristig die Haltbarkeit aller Kreaturen |
| `no-attack-stat-loss` | Verlust von ATK/DEF **durch ausgeführte Angriffe** wird nach dem Treffer zurückgenommen | Angriffsverschleiß inklusive Stomp-Ausgaben | Verändert längere Gefechte stark; kein Vorschlag für Live-Spiel |
| `no-predator-swarm` | Symmetrische Predator-Schwarmverstärkung 2 % → 0 % | Schneeballeffekt durch Rudelaufbau | Schwächt Predatoren insgesamt |
| `no-predator-pierce` | Symmetrische Predator-Rüstungsdurchdringung 10 % → 0 % | Einfluss der DEF-Durchdringung | Gegen Predator-Spiegel mit wenigen DEF-Zielen eventuell ohne Effekt |

### Gefährdungen des kausalen Vergleichs

- Keine Änderungen an Produktion, Startkartenregel oder langfristiger KI-Promotion.
- Ein einziger Faktor pro Arm; keine Kombinationen, die die Attribution verwässern.
- Alle Faktoren werden **in echten simulierten Duellen**, nicht nur per alternativer Bewertungsfunktion, angewendet.
- Ein unveränderter Ausgangs-Seed garantiert dieselbe **Ausgangssituation**, aber nicht dieselben späteren Zufallsziehungen, sobald unterschiedliche Entscheidungen erfolgen. Das ist eine echte mechanische Intervention, kein identischer Replay.
- Siegquoten von Cross-Fusion/Predator werden getrennt nach der aktiven Rolle interpretiert, nicht als komplementäre Wahrscheinlichkeiten.
- Kandidatenmarkierung ist bei MIRROR rein eine Beobachtungsvariable; daher werden die **tatsächlichen Sieger des Zweitziehenden** auf eindeutig unterschiedlichen Duellen gezählt, nicht aus den zwangsläufig ausgeglichenen Kandidatenmarkierungs-Winrates abgeleitet.

## Messungen pro der ersten sechs Halbzüge

Für **jedes tatsächlich beendete Halbzug-Ereignis** werden unmittelbar vor dem Zugwechsel die aktuellen öffentlichen Feldinformationen gemessen: LP und Schutzschild, ATK- und DEF-Gesamtsummen, Maximal-ATK, Zahl der Predator-Monster, Feldkarten, Hand- und Deckkarten sowie Angriffsbereitschaft. Nach dem Zugwechsel werden die Werte erneut protokolliert, sodass der **natürliche ATK-/DEF-Zerfall** isoliert sichtbar wird. Zusätzlich werden pro globalem Zug tatsächliche Aktionsarten (`normal`, `fusion`, `attack`, `switch`, `end`, aktive Fähigkeiten) und verfügbare/nicht genutzte Angriffsmöglichkeiten gezählt.

Diese Werte lassen sich eindeutig dem tatsächlichen Erst-/Zweitziehenden zuordnen. Details werden nur aus dem **wirklich gespielten Spielzustand**, nicht aus KI-Gedankenexperimenten/Simulationen von hypothetischen Entscheidungen gelesen.

## Versuchsaufbau

- **Vier Deckkonfigurationen:** Predator-vs-Predator MIRROR, Fusion-vs-Fusion MIRROR sowie Fusion-vs-Predator und Predator-vs-Fusion CROSS.
- **Sechs** mechanische Faktoren = 24 getrennte Matrix-Jobs.
- 8 Deckpaare × 12 Szenarien × 2 Starter × 2 beobachtete Kandidatenplätze × eine feststehende KI-Policy = 384 Duelle pro Matrix-Jobs.
- **9.216 vollständige simulierte Duelle**, davon 7.680 direkte, mit identischen Startbedingungen gepaarte Mechanismenvergleiche zur Basis.
- 4.608 gültige Starterpaarvergleiche, 2.304 Kontrollen gegen Kandidatenmarkierungs-Leaks.
- Pro Konfiguration **128 TRAIN + 128 VALIDATION + 128 HOLDOUT**; die beiden Labels im MIRROR markieren jeweils dasselbe Duell aus unterschiedlicher Sicht, kein zusätzlich unabhängiges Duell.
- Erst mittels TRAIN+VALIDATION wird der Faktor mit dem stärksten Abbau des Predator-Spiegelvorteils unter Kontrolle des Fusion-Spiegels bestimmt. **HOLDOUT bleibt bis nach dieser Entscheidung versiegelt** und testet die gewählte Hypothese unabhängig.

## Entscheidungskriterien

Die Basis-Hypothese „der Angriff auf globalem Zug 2 verursacht den größten Teil des Zweitziehenden-Vorteils“ wird nur dann getragen, wenn die `equal-opening-attacks`-Variante bei gleichen Ausgangsbedingungen den tatsächlichen Predator-Zweitziehenden-Vorsprung klar und reproduzierbar reduziert und das Ergebnis im unabhängigen HOLDOUT wiederkehrt.

Kreaturenzerfall, Angriffsverschleiß, Schwarm und Rüstungsdurchdringung werden auf dieselbe Weise einzeln bewertet. Selbst ein starker Effekt beweist **keine** optimale dauerhafte Balanceregel; diese darf erst nach ausdrücklicher Entscheidung separat umgesetzt werden.

Es handelt sich um **feste Forschungs-KI-Strategien in vollständigen Duellsimulationen**, nicht um neuronales Gewichtstraining.
