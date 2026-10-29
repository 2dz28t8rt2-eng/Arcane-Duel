# v15.83 – Einsatzverzögerung: korrigierte Auswertung und unabhängige Wiederholung

Status: Forschungsdurchlauf, keine Änderungen am produktiven Spiel oder an der 2v2-Kampagne.

## Ursache und Korrektur des Fehlers in v15.82

Alle 16 Forschungsteilgruppen in [v15.82](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40689132703) wurden erfolgreich berechnet; die Schlussauswertung schlug bei `Marker leaked into duel` fehl. Der Grund: `win=0` bei einem Duell ohne Sieger wurde irrtümlich als Sieg des Gegners gewertet. Vier unabhängige Spiegelduelle (acht doppelt markierte Ergebniszeilen) erreichten nach 64 Zügen das Simulationslimit. Die paarweise Prüfung der ersten sechs Züge, Aktionen und Endstände zeigte keine tatsächliche Asymmetrie durch den KI-Marker.

Die korrigierte Auswertung:

- ordnet `timeout` ausdrücklich als **Unentschieden** ein;
- prüft für beide Marker dieselbe Sieger-Identität, dieselbe Timeout-Kennzeichnung und dieselbe Spieldauer;
- zählt Unentschieden getrennt und nimmt sie aus der Gewinnquote entschiedener Partien heraus;
- weist zusätzlich eine Wertung mit 0,5 Punkten je Unentschieden aus;
- führt einen Sperrwert gegen Kandidaten mit mehr als 5 % Unentschieden im TRAIN+VALIDATION-Spiegeltest ein;
- erhält die TRAIN/VALIDATION/HOLDOUT-Trennung und verändert keine Produktivregeln.

Der lokale Wiederherstellungstest bestand vollständig: **6.144 Duellsimulationen**, **3.072 Startspieler-Paare**, **1.536 Markerprüfungen**, **4.608 mechanische Paarvergleiche**.

## Erkenntnisse aus der wiederhergestellten v15.82-Auswertung

Bei gespiegelten Predator-Decks auf Stufe 10 gewann der zweitziehende Spieler:

| Testregel | Siege des Zweitziehenden (entschiedene Duelle) |
| --- | ---: |
| Bisherige Regeln | 68,75 % |
| Einsatzverzögerung ohne Sofortangriff | 16,67 % |
| 50 % Sofortangriff, globale Runde-1-Sperre bleibt | 29,47 % |
| 50 % Sofortangriff, Ausnahme von globaler Runde-1-Sperre | 31,58 % |

Die harte Einsatzverzögerung kehrt den Vorteil stark um, während der freiwillige halbstarke Angriff diesen Effekt nur teilweise abmildert. Kein getesteter Kandidat erfüllte die vordefinierte gemeinsame Balancefreigabe. Bei gespiegelten Fusion-Decks lagen die vier Gesamtquoten zwischen 44,79 % und 54,17 % für den Zweitziehenden.

Diese Resultate kommen aus einem festen, identischen Forschungs-KI-Planer auf beiden Seiten und sind **keine Garantie für menschliches Spiel**.

## Optimierter neuer Durchlauf v15.83

Die statistisch wichtigste offene Frage lautet, ob die Ergebnisse eine Besonderheit der vorherigen Zufallsabfolge sind. Daher werden mit einem unabhängigen Seed-Versatz von **+120.000** dieselben 16 kontrollierten Kohorten erneut ausgeführt:

- Spiegelduelle und Predator/Fusion-Direktduelle, Stufen 9 und 10;
- bisherige Regeln, reine Einsatzverzögerung, die beiden Sofortangriff-Varianten;
- jeweils dieselben legalen 40er-Decks, 5/5 Starthände, Startspielerwechsel, symmetrische Perks und derselbe KI-Planer;
- weiterhin kein dauerhafter ATK-Abzug durch Sofortangriff, identische Kostenregeln;
- neue unabhängige Kampf-Zufallsabfolge, aber identische Seeds in den jeweils gepaarten Varianten;
- 6.144 Simulationen, mit separatem Ausweis von Siegen, Niederlagen und Unentschieden;
- maximal sechs statt vier parallele Forschungsjobs; jeder Teiljob speichert seine Rohdaten auch bei Fehlern.

**Keine Regel wird automatisch in `main` oder `development` übernommen.** Der vollständige v15.83-Prüfbericht dient erst als Grundlage für die Entscheidung zur Einsatzverzögerung.
