# Arcane Duel – KI-Balancing v15.79: Zweitziehender statt Spielerplatz 1

## Fragestellung und Testregel

Der vorherige Versuch v15.78 zeigte, dass eine sechste Startkarte auf dem
**festen Spielerplatz 1** keine zuverlässige Verbesserung erzielte. Fusionen
profitierten je nach Konstellation anders als Predatoren. Spielerplatz und
tatsächliche Zugreihenfolge müssen getrennt analysiert werden.

Die nun vereinbarte Maßnahme wird zunächst **ausschließlich im Forschungsduell**
aktiviert: Wer tatsächlich **als Zweiter am Zug ist**, erhält beim Start seine
sechste Karte aus dem **eigenen 40-Karten-Deck**. Die Spielerkarten werden
nicht erschaffen oder manipuliert. Der erste Spieler behält fünf Karten.

- `starter=0`: Platz 0 zieht zuerst (5 Karten), **Platz 1 erhält 6**.
- `starter=1`: Platz 1 zieht zuerst (5 Karten), **Platz 0 erhält 6**.
- Kontrolle: bei beiden Zugreihenfolgen je 5 Karten.

Dieser Unterschied wird unabhängig vom `candidateSeat` gesetzt. Es gibt
keinen Spielerplatzbonus, keinen Talent-/Perk-Vorteil und keinen versteckten
Profilbonus. Das Hauptspiel bleibt bis zur Auswertung unverändert.

## Umfang und Kontrollgruppen

| Parameter | Messung |
| --- | --- |
| Duelle | 2 Kartenvarianten × 2 Rollenausrichtungen × 2.304 = **9.216** |
| KI-Kandidat | 1.536 vollständig simulierte Duelle |
| Rollen | Fusion gegen Predator; Predator gegen Fusion |
| Startspieler | 0 und 1, für alle Szenarien |
| Kandidatenplatz | 0 und 1, für alle Szenarien |
| Behandlungsgruppe | sechste Karte nur für Spieler `1 - starter` |
| Kontrolle | fünf Karten auf beiden Plätzen |
| Decks | tatsächliche legale 40-Karten-Decks; gleiche Decks/Seeds je Testpaar |
| KI | beide Seiten gleiche Regeln, Q und Forschungs-Policy |
| Split | TRAIN / VALIDATION / unberührter HOLDOUT |

Die bisherigen Forschungsvorgaben und 3–5-Material-Fusionen bleiben aktiv.
Es werden echte Treffer, Fusionen, Stomps, Gegenschläge und Predator-Angriffe
gezählt – keine fingierten Ausgangsbretter.

## Vorab festgelegte Auswertung

Vier eindeutige Fälle pro Deckausrichtung werden separat berichtet:

1. **Platz 0, zieht zuerst** (`seat=0, starter=0`)
2. **Platz 0, zieht als Zweiter** (`seat=0, starter=1`)
3. **Platz 1, zieht zuerst** (`seat=1, starter=1`)
4. **Platz 1, zieht als Zweiter** (`seat=1, starter=0`)

Zusätzlich: Siegraten nach Fusion/Predator und tatsächlichem Ziehplatz,
gepaarte Gewinne/Verluste derselben Szenarien und harte
Stomp-/Predator-/Fusion-Telemetrie. Kontrolliert wird, ob ein scheinbarer
Sitzplatzvorteil nach Aufschlüsselung nach Zugreihenfolge verschwindet.

Als vorab registriertes Kriterium für die **weitere Prüfung** muss auf der
VALIDATION die Summe der Spannweiten der vier Platz/Starter-Zellen über beide
Rollen um mindestens drei Prozentpunkte fallen, ohne dass eine Rollenausrichtung
mehr als zwölf Siege von 128 VALIDATION-Duellen verliert. Die bereits
abgetrennten HOLDOUT-Ergebnisse werden **erst danach** in den Bericht
übernommen. Keine automatische Regelübernahme oder KI-Promotion.

### Interpretationsgrenzen

- Dies sind vollständige Simulationsduelle einer fixierten Forschungs-KI,
  kein autonomes Training neuronaler Gewichte.
- Vier Untergruppen haben auf der VALIDATION jeweils nur 32 Kandidatenduelle;
  Einzelwerte können deshalb deutlich schwanken.
- Eine hohe Vernichtungsquote der **ausgeführten** Predator-Angriffe bedeutet
  nicht, dass Predatoren allgemein jede große Fusion vernichten können.
- Ein höherer Sieganteil einer Rolle sagt allein noch nichts über den Vorteil
  von Sitzposition oder Ziehreihenfolge aus.

**Entscheidung nach Bericht:** Erst wenn aus beiden Rollen und dem HOLDOUT
ersichtlich ist, dass der tatsächliche Zweitziehende zuverlässig profitiert,
wird eine produktive sechste Karte oder eine andere Regeländerung empfohlen.
