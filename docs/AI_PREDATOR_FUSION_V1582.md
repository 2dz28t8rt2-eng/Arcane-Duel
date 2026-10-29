# Arcane Duel – Forschung v15.82: Einsatzverzögerung statt Zahlen-Patches

## Motivation und Regelentwurf

v15.81 zeigte bei identischen Predator-Decks 68,75 % Siege für den
Zweitziehenden. Das vollständige Verbot seines Angriffs in Zug 2 kehrte den
Vorteil um (33,33 % für den Zweitziehenden). Der Nutzer möchte keine Reihe
künstlicher Dauerwerte-Patches, sondern eine verständliche Beschwörungsregel:

**Jedes neu beschworene Monster benötigt einen eigenen Zug zur Stabilisierung.**
In diesem Beschwörungszug darf es regulär nicht angreifen; beim nächsten
eigenen Zug greift es ohne Abzug normal an.
Diese erste isolierte Forschungsvariante betrifft **Angriffe**. Passive
Rollenboni, das Umschalten der Kampfposition und die Nutzung als Fusionsmaterial
bleiben unverändert. Aktive Spezialfähigkeiten werden nicht zusätzlich gesperrt;
das müsste bei einer späteren allgemeinen Einsatzverzögerungsregel gesondert
entschieden und getestet werden.

Eine freiwillige Forschungsaktion **Sofortangriff (50 %)** ist die einzige
Ausnahme. Die zugrunde liegenden Kartenwerte ändern sich dadurch nicht.
Die normalen Angriffskosten des Spiels bleiben bestehen. Der spätere UI-Button
ist noch nicht Teil des Spiels: In der Testumgebung entscheidet die Test-KI,
ob sie diesen Angriff auswählt; erst nach Balancingprüfung kommt ein Button
für manuelle Duelle in Betracht.

## Vier isolierte Testvarianten

| Variante | Verzögerung | Notangriff 50 % | Altes Angriffsverbot im globalen Zug 1 |
| --- | --- | --- | --- |
| `baseline` | nein | nein | bleibt |
| `delay` | ja | nein | bleibt (praktisch durch Verzögerung abgedeckt) |
| `emergency50-locked` | regulär ja | freiwillig ab Zug 2 | bleibt |
| `emergency50-open` | regulär ja | freiwillig bereits ab Zug 1 | nur für diesen Notangriff aufgehoben |

Die letzte Variante ist eine diagnostische Notwendigkeit: Sonst würde sich
der alte Sonderfall „Spieler 1 darf in globalem Zug 1 nie angreifen“ mit der
neuen Regel vermischen. In `emergency50-open` kann der erste Spieler direkt
in Zug 1 mit 50 % angreifen, sofern eine legale Angriffsaktion gewählt wird.
Dies ist ausdrücklich nur ein **Test**, keine Freigabe dieser Regel.

## Fairness und Qualitätssicherung

- 40-Karten-Decks, 5/5 Startkarten; die sechste Karte bleibt testweise aus.
- Beide Seiten nutzen dieselbe eingefrorene Forschungs-KI.
- Beide Startreihenfolgen, beide Kandidatenmarkierungen, gleicher RNG-Seed.
- `mirror`: identische Deckreihenfolge, Startkarten, Fusionsvorräte.
- `cross`: Predator/Fusion in beiden Rollenanordnungen.
- Keine einseitigen Platzboni und kein Arena-LP-Zerfall in den Hauptstufen.
- Per Aktion wird auf dem **realen** Hauptduell gezählt, ob ein frisch
  beschworenes Monster angreift, ob dies die Notangriffsoption ist und ob
  die temporäre Halbierung von `effectiveAttack()` tatsächlich eintritt.
- Angriffs-/DEF-Werte der Karte werden für 50 % niemals direkt halbiert;
  der Kampf berechnet nur den aktuellen Effektivwert.
- In `delay` sind jegliche Angriffe frisch beschworener Monster ein harter
  Testfehler. Bei beiden Notangriffsvarianten muss jeder solche Angriff
  exakt als 50-%-Aktion nachweisbar sein.
- `TRAIN`, `VALIDATION`, `HOLDOUT` werden wie v15.81 getrennt.
- Die Empfehlung wird nur aus TRAIN + VALIDATION festgelegt; HOLDOUT folgt
  anschließend, ohne rückwirkende Regelanpassung.

Umfang: `2 × 2 × 4 × 8 × 12 × 2 × 2 = 6.144` **vollständige** Duelle.
Es handelt sich um kontrollierte Selbstspiele einer feststehenden Test-KI,
nicht um neuronale Gewichtsanpassung.

## Vorab festgelegte Auswertung

1. Vorliegende v15.81-Baseline muss durch v15.82 wiederholbar sein.
2. Erst prüfen, ob bei `delay` wirklich keine frischen Monster mehr angreifen.
3. Danach den separaten Effekt der alten globalen Zug-1-Sperre isolieren.
4. Predator- und Fusion-Spiegelduelle getrennt nach Zweitziehenden-Siegquote
   vergleichen, anschließend Predator-vs-Fusion und Fusion-vs-Predator.
5. Die ersten sechs Züge einschließlich Feldbestand, LP und ATK bilanzieren.
6. Nur dann einen Folgekandidaten empfehlen, wenn auf TRAIN+VALIDATION
   sowohl Predator als auch Fusion höchstens acht Prozentpunkte vom
   50:50-Ziel abweichen und keine CROSS-Rolle um über zehn Punkte verschoben
   wird. Keine automatische Implementierung in Browser, EXE oder 2v2.
