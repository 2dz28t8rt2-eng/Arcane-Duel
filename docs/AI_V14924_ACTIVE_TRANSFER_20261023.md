# Arcane Duel – KI-Training v14.9.24

## Forschungsziel
Die vorangegangene Studie v14.9.23 erzielte bessere Ergebnisse gegen statische
DEF-Felder, konnte aber im voll aktiven Gegnervergleich keinen ausreichenden
Vorteil nachweisen. Dieses Experiment trainiert und evaluiert daher ausnahmslos
unter **vollständigen Duellbedingungen**: reale Hand, Deck, Fusion, Guardian,
Soul, Predator, aktiver Gegnerzug, natürliche Monsterstat-Zerfallsregeln.
Arena-LP-Zerfall bleibt auf beiden Seiten symmetrisch deaktiviert, um den
Einfluss automatischer Siegpunkte zu isolieren.

## Fünf aktive Lern- und Prüfphasen
0. Tier-8-Herausforderer vs Tier-10-Veteran mit Guardian-Verhalten
1. Tier-9-Herausforderer vs Tier-10-Veteran mit Economy-Verhalten
2. Tier-10-Paarungen mit wechselnden Gegnerstrategien balanced/economy/guardian
3. Exakte Deck-Mirrors mit Tier 8 (Spieler und Gegner gleiche Kartenauswahl)
4. Exakte Deck-Mirrors mit Tier 10, weiterhin unterschiedliche KI-Policies

Je Phase 512 Duelle: 8 Rollenpaarungen, 4 Szenarien,
je zwei Startspieler- und Sitzpositionszuweisungen, vier Forschungsarme.
Insgesamt 2.560 Duelle, davon 1.920 TRAIN und 640 unabhängig ausgewertete
HOLDOUT-Duelle. Identische Szenario-Seeds, Decks, Startspieler und Sitzplätze
werden über alle vier Strategien hinweg gepaart.

## Vier Strategieprofile
- role-reference: Original-Rollenheuristik (unverändert)
- finish-stance: bewährtes Abschlussverhalten durch Direktangriff +
  legale DEF-zu-ATK-Umstellung
- breach-ready: frühe DEF-zu-ATK-Umstellung, wenn eine erkennbare
  gegnerische Verteidigung überwunden werden kann
- breach-safe: vorsichtigeres Durchbruchverhalten; erfordert
  mindestens 95 % der Ziel-DEF als Angriffspotenzial und ausreichend
  eigene LP vor einem offensiven Stellungswechsel

Das historische Q-Modell wird aus dem letzten abgeschlossenen Lauf
v14.9.23 geladen und mit den gesammelten gültigen **TRAIN**-Beispielen
aus 13 abgeschlossenen Läufen fortgeführt. Die dortige Q-Logik bewertet
überwiegend Predator-Angriff-vs.-Pass; es handelt sich nicht um
vollständiges End-to-end-Reinforcement-Learning.

## Auswahl und Kontrollregeln
- Die unveränderte Rollen-KI bleibt in jeder Phase die unabhängige
  Vergleichsbasis.
- Es werden ausschließlich TRAIN-Siege für Strategieauswahl verwendet.
- Eine neue Policy muss **mindestens drei zusätzliche TRAIN-Siege**
  (von 96) erreichen, ohne auf einer der zwei Sitzpositionen zu
  verlieren; andernfalls wird die Referenz gewählt.
- HOLDOUT ist ausschließlich zur Evaluation, nie für Gewichtsanpassung,
  Policy-Selektion oder Q-Training.
- Ergebnisse getrennt nach Tier, Gegnerstrategie, Sitzposition,
  Startspieler und gespiegelt identischem Deck prüfen.
- Erfasst werden tatsächliche Angriffsmöglichkeiten bei leerem Feld,
  verpasste Direktangriffe, vorzeitige Stellungswechsel, Siege,
  Runden und Timeouts.

## Forschung vs. produktiver Einsatz
Alle Änderungen betreffen nur research-only Tests auf
`development`. Es werden keine Live-Spielregeln verändert,
keine Karten ersetzt und nichts nach `main` gemergt.
Die starken Unterschiede zwischen Sitzpositionen in früheren
Belagerungs-Tests können auch ein Effekt der asymmetrischen
Übungsbedingungen sein. Diese Studie prüft deshalb anspruchsvollere
Kämpfe und Deck-Mirrors, aber **keine echte gleiche-Policy-Self-Play-KI**.

## Relevante Dateien
- `tests/ai-v1524-full-combat-transfer.cjs`
- `tests/ai-v1524-full-combat-aggregate.cjs`
- `tests/ai-v1524-history.cjs`
- `tests/ai-v1524-Q.cjs`
- `.github/workflows/ai-v14924-active-transfer.yml`
