# Arcane Duel 3.0 – Realinventar-Progressionsanalyse I–X
**Stand:** 15. Oktober 2026 · **Ausgangsversion:** veröffentlichter Release \`main\` / \`8d3315f73068685113466c1ae26607b52cd2f8c0\` mit 227 zuvor bestandenen Regressionstests. **Analysewerkzeug:** ausschließlich \`development\`, keine Änderungen an Gameplay- oder Balancing-Werten.

## Kernaussage

Unter den getesteten regelbasierten Spielerentscheidungen ist **Gegner IV / Der Gezeitenfürst** die erste deutlich ausgeprägte Fortschrittshürde, nicht primär Gegner IX oder X. Der Engpass ist **nicht deterministisch unüberwindbar**: 4 von 6 längeren, inventargebundenen Testkarrieren beendeten das vollständige Turnier, während 2 trotz 30 Versuchen gegen IV dort festhingen. Die Resultate belegen damit **stark streuende Durchläufe**, nicht eine allgemein unlösbare Kampfsituation.

## Testmethode (reproduzierbar)

Quelle: \`tests/progression-real-inventory-audit.test.cjs\`. Ausgeführt in GitHub Actions mit den tatsächlich veröffentlichten JS-Modulen \`game.js\`, \`expansion.js\`, \`evolution.js\`, \`learning.js\`, \`essence-combat.js\`, \`arcane-role-fusions.js\` und \`arcane-monster-forge.js\`. Jede Karriere erhält ein separates neues \`profile\` im virtuellen Speicher. Die Duelle werden mit \`createGame\`, \`simulateGame\` und \`rewardMatch\` tatsächlich abgeschlossen und abgerechnet.

**Keine erfundenen Ressourcen:** Training wird ausgespielt, Turnierfreischaltungen müssen gewonnen werden. Booster und Herstellung verwenden normale Kauf-, Inventar-, Splitter- und Coins-Prüfungen; Werkstattfusionen unterliegen dem tatsächlich gültigen Levelcap, Rezepten und Deckreservierungen. Die Deckzusammenstellung nutzt die vorhandene \`equipBest()\`-Funktion. Milestone-Angebote werden tatsächlich eingelöst. Die verlängerte Serie beansprucht außerdem regulär verdiente Quests und die erste kostenlose Karte aus gewonnenen Charakterpacks.

**Explizite Modellgrenzen:**
- Eine regelbasierte Duell-KI ist **kein Mensch**. Die verwendeten KI-Policies \`balanced\`, \`offensive\`, \`economy\` treffen sehr ähnliche Entscheidungen und führen auch in Nicht-Fusionsstilen regelmäßig Fusionen durch.
- Der Simulator perfektioniert keine Poker-Muster, geplante Feld-/Mehrfachfusionen, Bewachung, aktive Seelenzehrer-Züge oder manuelle Gegenstrategien.
- Keine aktiv gespielten Spezial- und Lernherausforderungen, keine verpflichtende Essenzbindung inklusive Lehrduellen, keine gezielte ACE-Sammler- oder PvP-Strategie, keine echten mehreren Kalendertage mit Quest-Refresh.
- Keine reale Zeit-/Aufmerksamkeitskosten-Messung. Freie Farmduelle werden ohne Wartezeit simuliert.
- Nur **zwei unabhängige RNG-Seeds** in der Pilotreihe und drei Seeds in der längeren Reihe. Jeweils mehrere Policies mit denselben Seeds: **gepaarte, stark korrelierte Vergleiche**, keine unabhängigen 12 bzw. 6 Spieler.
- Die 12-Versuch- und 30-Versuch-Grenzen sind **Analyseabbruchregeln**, keine Spielgrenzen.

## Testreihe A – Früher Verlauf und Ressourceninvestitionen

**12 Testkarrieren:** je zwei Seed-Varianten, drei KI-Policies und zwei Investitionspläne. Höchstens **12 Duelle je Turniergegner**, bei wiederholten Niederlagen bis zu **8 Farmduelle** gegen vorherige Gegner.

| Kennzahl | Ergebnis |
|---|---:|
| Trainingsfolge vollständig abgeschlossen | 12 / 12 |
| Turniergegner I besiegt | 12 / 12 |
| Turniergegner II besiegt | 12 / 12 |
| Turniergegner III besiegt | 12 / 12 |
| Gegner IV in höchstens 12 Versuchen besiegt | **0 / 12** |
| Gesamte abgeschlossene Duelle | **330** |
| Höchster normaler Kartenlevel am Abbruch | LV 3–6 |
| Engine-/Save-Validierungsfehler | **0** |

Dazu zählen bewusst sowohl sparsame Deckpflege als auch Investitionen in Booster, Upgrades, Herstellung und Werkstatt. Der bewusst begrenzte Vorbereitungsaufwand reichte bei keiner getesteten Kombination für IV.

## Testreihe B – Längerer Aufbau, echte Quests und Charakterpacks

**6 Karrieren:** Seeds 11, 37, 83; jeweils \`balanced\` und \`offensive\`; aktives Ressourceninvestment; maximal **30 Turnierversuche je Stufe** plus **zwei freie Farmduelle nach jeweils drei Fehlversuchen**. Gewonnene Quests werden beansprucht; verfügbare Charakterpacks geöffnet und ihre kostenlose Karte gewählt. **380 vollständige Duelle, null Engine-/Save-Validierungsfehler.**

| Seed / KI | Höchster Sieg | Gesamte Duelle | Versuche gegen IV | Versuche gegen V | Versuche gegen X | Max. normales Kartenlevel |
|---|---|---:|---:|---:|---:|---:|
| 11 / ausgewogen | X | 60 | 14 | 1 | 6 | 10 |
| 11 / offensiv | X | 73 | 14 | 1 | 13 | 10 |
| 37 / ausgewogen | III | 57 | **30 (kein Sieg)** | – | – | 6 |
| 37 / offensiv | III | 57 | **30 (kein Sieg)** | – | – | 6 |
| 83 / ausgewogen | X | 73 | 9 | 19 | 2 | **9** |
| 83 / offensiv | X | 60 | 19 | 6 | 2 | 10 |

Die beiden bei IV festgefahrenen Karrieren hatten bis zum Abbruch bereits regulär 4–5 Booster, 5–6 permanente Upgrades, 6–7 Werkstattumwandlungen, eine Kartenherstellung, 3–4 abgeschlossene Quests und 3–4 kostenlose Charakterpackkarten genutzt. **Das Problem ist also nicht allein fehlendes Kaufverhalten**.

Bei den vier erfolgreich abgeschlossenen Karrieren trat die erste normale Level-10-Karte frühestens nach dem 42. Duell auf und erst **nach Gegner VIII**. Eine komplette Karriere wurde **ohne eine einzige normale Level-10-Karte** gewonnen. Hinweis: Für die Aussage „normale Karte“ sind Fusionsvorlagen ausgeschlossen.

Die jeweils beiden KI-Varianten desselben Seeds folgen oft fast denselben Spielen/Belohnungen. Die Effektivität von Predator-/Wächter-/Fusionsrollen darf aus dieser Reihe nicht abgeleitet werden.

## Warum IV besonders auffällt

1. **LP-Sprung:** Turnier I–III startet mit je 4.000 LP, Turnier IV–VI mit 6.000 LP. Das sind **50 % mehr LP** auf beiden Seiten.
2. **Stufen-Asymmetrie:** Gegner IV ist auf **LV 7** ausgelegt. Nach Sieg über III erlaubt die Werkstatt jedoch erst **LV 6**. LV 7/8 werden erst nach Sieg über V freigeschaltet; LV 9/10 nach Sieg über VII.
3. **Stärkestreuung:** Im langen Test konnten manche Karrieren bei IV mit normalem Level-6-Material schließlich bestehen, andere trotz gleicher Werkstattgrenze nicht. Die Art und Verfügbarkeit der Fusionsvorlagen, Reserven und Zugentscheidungen müssen als mögliche Ursachen getrennt gemessen werden.
4. **Siegfolge statt gleichmäßiger Kurve:** Manche Gewinner überwanden Gegner V–VIII nach nur 1–3 Versuchen, obwohl IV 9–19 Versuche benötigte. Gegner X benötigte in vier Gewinnkarrieren 2–13 Versuche.
5. **Frühes Farm-Softcap allein erklärt die Hürde nicht:** Bei Gegner III und besiegter Stufe III setzt \`farmingLevelCap(3)\` den vollen XP-Bereich bis Spielerlevel 15, während die festgefahrenen Profile nur Level 6 erreichten. Unter diesen Bedingungen war die frühe Reduktion von Farm-XP **nicht** der direkte Sperrmechanismus.

## Technische/inhaltliche Nebenbeobachtungen

- Die Grund-KI verwendet beim Beschwören oft nur die ersten zwei Handkarten als Fusionsmaterial, weshalb die vorgesehenen 3–5-Material-Pokersynergien im Progressionstest **systematisch unterrepräsentiert** sind.
- Das ältere Regelbuch in \`assets/evolution.js\` nennt für Turnier IX–X **8.000 LP**, die aktuell aktive Funktion \`duelStartingLP\` in \`assets/game.js\` setzt jedoch **10.000 LP**. Das ist eine konkret überprüfbare, korrigierbare Dokumentationsabweichung; **nicht** Teil dieses reinen Balance-Audits.
- Die frühere synthetische LV10-Balanceprobe zeigte starke Spielweisen, die sehr schnell gegen VIII–X gewinnen. Sie darf nicht mit den nun gemessenen, vom Start weg wirklich erspielten Inventaren gleichgesetzt werden.

## Priorität vor Balanceeingriffen

**P0: Engpass IV reproduzieren und Ursachen isolieren.** Erfolgreiche und festgefahrene Seed-37/11-Inventare unmittelbar vor IV vergleichen: Anzahl und Verteilung der Fusionskopien, verfügbare Fusionslevel, Leih-/Belohnungskarten, rohes ATK-/DEF-Budget, tatsächliche sinnvolle Fusionszüge, Werkstattreserve, XP-/Coins-Protokoll. Simulation nicht nur mit \`equipBest\`, sondern mit taktisch optimierten, dennoch rechtmäßig erworbenen Decks.

**P1: Progressions-KI verbessern.** Drei getrennte Spielerpolitiken: Normal-/Predator-Druck, DEF/Seelenzehrer-Schutz und aktive Feld- und Poker-Fusion. Dann erneute Turnierketten I–X auf mehreren unabhängigen Seeds und mit kontrolliertem Ressourcenbudget.

**P2: Erwartete Grind-Länge und Lernkurve definieren.** Zielkorridore (als Designentscheidung) für Duellversuche je Gegner, freie Farmduelle, Kartenerwerb, Fruststellen und alternative Lösungswege. Erst danach konkrete Werteänderungen (Gegner-IV-LP, Deckkurve oder zugängliche Konter) erwägen.

**P3: Dokumentation/Browsertests.** IX–X-LP-Text korrigieren; eigene reale Touch- und Save-Abnahme ergänzen.

### Bewertung

**Keine pauschale Abschwächung empfohlen.** Die neuen Ergebnisse verschieben den Fokus von „Gegner VIII–X sind offensichtlich unfair“ auf **„wie verlässlich kommen Spielende mit legal erhältlichen Mitteln über die erste große Hürde bei IV?“** Die Endgegner bleiben relevant, aber die Gelegenheit, auf ihnen zu spielen, hängt von diesem vorherigen Engpass ab.

**Quellcodebasis und Testlauf:** GitHub Branch \`development\`, Testdatei \`tests/progression-real-inventory-audit.test.cjs\`; zwei Testreihen, **710 simulierte Duelle**; durchgelaufene Node-Tests inkl. vollständiger Regressionssuite. `main` blieb unverändert.
