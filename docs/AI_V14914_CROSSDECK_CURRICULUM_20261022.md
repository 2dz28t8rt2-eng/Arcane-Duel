# Arcane Duel v14.9.14 – 80 % Cross-Deck / 20 % Mirror Training

## Ziel

Die erfahrungsbasierte Forschungs-KI anhand unterschiedlicher Strategien,
echter Gegenreaktionen und vollständiger Spielausgänge beurteilen.
Die aktuelle Q-Tabelle lernt bislang vorwiegend Predator-Angriffsentscheidungen.
Die vollständige strategische Planung sämtlicher Kartenrollen bleibt ein Entwicklungsziel.

## Strikte Fairness

- **2.560 vollständige Duelle in 40 separaten 64er-Prozessen**
- **32 Prozesse / 2.048 Duelle Cross-Deck (80 %)**: alle 30 gerichteten
  Rollenpaarungen Predator, Guardian, Soul, Fusion, Hybrid, Allrounder,
  plus zwei Wiederholungen bei anderen Testbedingungen
- **8 Prozesse / 512 Duelle Mirror (20 %)** als Positions-Kontrollgruppe
- Je Begegnung 4 Deck-Seeds, **beide Kandidatensitze**, **beide Starter** und
  4 identisch angesetzte KI-Kandidaten. Die Rollen- und Deckzuweisung
  wird mit dem Sitz vertauscht; beide erhalten dieselben realen Regeln.
- Jede Partie besitzt pro Seite ein echtes 40-Karten-Deck, eine eigene
  5-Karten-Starthand, 35 verbleibende Karten und einen rollenspezifischen
  Fusionsvorrat. Das Deck bleibt für alle vier KI-Vergleiche exakt gleich.
- Beide Seiten haben **gleich viele LP** und keinerlei zusätzliche
  Startkarten, Rüstungen, Upgrades, Power- oder Sitzboni. Der Forschungsmodus
  deaktiviert die Arena-LP-Zerfallsregel **beidseitig**.
- 3 Szenarien pro Shard sind Trainingsbeobachtung, ein vierter Seed-Holdout
  dient ausschließlich der unabhängigen Beurteilung.

## Modelle

Heuristik, konservatives Q, Q mit einer Gegnerreaktion, Q mit zwei
Gegnerreaktionen. Die Planungsschwellen bleiben bei beiden Varianten gleich.

## Altes Lernen korrekt einlesen

Die akzeptierte Q-Tabelle aus dem letzten erfolgreichen v14.9.14-Lauf
bzw. initial aus v14.9.13 wird fortgeführt; automatische Resets sind verboten.
Historische Trainingsbeispiele werden aus den erfolgreich verifizierten Läufen
39803691439, 39843438099, 39847734409 übernommen.
Fehlerhafte/nichtfinite Belohnungswerte werden ausgeschlossen.
Frühere Holdout-Ergebnisse fließen nicht in Q-Updates ein.

## Neue langfristig nützliche Daten

In Trainingsszenarien wird für jede Kandidatenaktion der aktuelle öffentliche
Boardzustand, die Rolle, die Aktion, die LP und das spätere Duellergebnis
archiviert. Das ist zunächst ein **Trainingsdaten-Kandidat**, keine kausale
Bewertung einzelner Aktionen. Holdout-Trajektorien werden ausdrücklich
nicht im Trainingsarchiv gespeichert.

Die Auswertung enthält Sitz-/Startereffekte, Siegquoten je Rollengegner,
Mirror/Cross-Trennung, gepaarte Gewinne und Verluste gegenüber der Heuristik,
Aktionsstatistiken und tatsächlich ausgeführte zweite Konter.
**Null zweite Konter** gelten als offene Planungsbaustelle, niemals als Nachweis
einer erfolgreich simulierten zweiten Antwort.

## Änderungsschutz

Keine automatische Freigabe auf main und keine Veränderung der
produktiven KI. Der nächste Schritt nach dem Benchmark ist die
kontrollierte Gewinn- und Verlustzuordnung auf Entscheidungsfolgen
und ein vollständigerer sichtbarer Spielzustand-Rollout.
