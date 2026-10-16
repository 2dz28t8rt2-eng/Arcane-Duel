# Arcane Duel – Fusion 3.1: vollständiger Balanceaudit

**Datum:** 15.10.2026 · **Geprüfter Developmentstand:** Commit `4856af5b89d0d14ab56cb21a0036cabab52ab43c`. **Keine Änderungen an Kampf-, Karten- oder Belohnungswerten.** Der produktive `main`-Branch blieb unberührt.

## Zusammenfassung

Die neue Fusionsformel erzeugt tatsächlich Risiken für schlechte Materialkombinationen und lohnende Boni für bewusste Pokerkombinationen. **Normale Monster können starke, synthetisch zusammengestellte Turnierdecks ohne jede Fusion zum Sieg führen.** Aber die alte Test-KI fusioniert weiterhin übermäßig oft, weil sie teilweise nach den alten Fusionsvorlagenwerten statt nach der tatsächlich neuen Erwartung auswählt.

**Gegner IV bleibt der auffälligste Progressions-Engpass**, während Turnier VI–VIII bei den getesteten Inventar-Karrieren häufig nach 1–3 Anläufen gewonnen werden. Gegen X reichten bei vielen Karrieren 1–2 Versuche. Der hohe Aufwand bei IV darf nicht automatisch als reines Problem der Fusionswerte interpretiert werden.

## A. 12 vollständige Turnierkarrieren mit regulärer Ökonomie

Quelle: `tests/progression-real-inventory-audit.test.cjs`, neuer Test `Fusion 3.1 fresh full tournament careers with actual acquired inventories`.

- **6 neue Zufalls-Seeds** (101, 103, 107, 109, 113, 127) × **2 KI-Policies** (ausgewogen, offensiv) = 12 Simulationen. Die Policies teilen dieselben Seeds und sind deshalb **nicht unabhängig**.
- Jede Karriere startet mit dem tatsächlichen Startprofil, spielt das Training selbst, nutzt Duellbelohnungen, gekaufte Booster, reguläres Herstellen, Werkstattumwandlungen, Quests, Charakterpackkarten und das vorhandene `equipBest()`.
- Abbruchlimit: bis zu **30 Turnierversuche je Gegner**, nach drei Niederlagen zwei kostenlose Farmduelle gegen einen bereits besiegten Gegner. Das ist eine Testgrenze, **keine** Spielregel.
- Die KI optimiert weder gezielte Pokerfusionen noch komplexe Rollenfähigkeiten oder manuelle Feldfusionen. Sie nutzt häufig die alten Entscheidungskriterien bei der Wahl einer Fusion.

| Kennzahl | Neuer Test |
|---|---:|
| Turnierkarrieren, die Gegner X besiegen | **12 von 12** |
| Simulierte Duelle gesamt (Training, Turnier, Farmen) | **741** |
| Duelle je Karriere, Mittelwert | **61,75** |
| Bandbreite je Karriere | **45–86** |
| Freie Farmduelle insgesamt | **192** |
| Ausgeführte Spielerfusionen insgesamt | **4.065** |
| Durchschnittliche Spielerfusionen je Duell | **5,49** |
| Karrieren ohne jemals erworbene normale LV10-Karte | **5 von 12** |
| Engine-/Savevalidierungsfehler | **0** |

### Aufwand der zehn Gegner

| Turniergegner | Ø Turnierversuche bis zum Sieg | Min.–Max. | Erfolge |
|---|---:|---:|---:|
| I | 2,50 | 1–4 | 12/12 |
| II | 2,83 | 1–10 | 12/12 |
| III | 5,83 | 1–11 | 12/12 |
| **IV** | **12,67** | **5–24** | **12/12** |
| V | 5,50 | 1–11 | 12/12 |
| VI | 2,42 | 1–7 | 12/12 |
| VII | 2,08 | 1–5 | 12/12 |
| VIII | 1,83 | 1–6 | 12/12 |
| IX | 4,17 | 1–10 | 12/12 |
| X | 1,92 | 1–5 | 12/12 |

**Interpretation:** Gegner IV erfordert bei dieser KI im Schnitt über **sechsmal so viele Versuche** wie VIII oder X. Dort gelingt der Fortschritt letztlich, aber teilweise erst nach sehr langem Grinden. Das deckt sich nicht automatisch mit der Spielererfahrung einer taktisch planenden Person.

## B. 162 Einzelduelle: drei Strategien mit identischen Karten und Zufalls-Seeds

Quelle: `tests/fusion31-balance-scenarios.test.cjs`, Funktion `runAuditDuels`.

- **18 gleiche Seeds pro Gegner und Strategie**; Gegner III, VI, IX; jeweils auf die durch den zuvor erreichten Turnierfortschritt erlaubte Werkstattstufe beschränkt (LV4/LV8/LV10).
- **Normal-only:** Die Spieler-KI darf **keine** Fusion einsetzen. Gegner fügen weiterhin ihre Fusionen aus.
- **Default:** Die bestehende Spiel-KI arbeitet unverändert.
- **Fusion-seeking:** Eine ausdrücklich für den Audit ergänzte KI sucht auf der Hand Kombinationen mit zwei bis fünf Materialien und bevorzugt bessere Qualität. Diese künstliche Strategie ist **nicht** im Spiel implementiert.
- **Alle drei Varianten verwenden exakt dasselbe synthetische, absichtlich starke Haupt- und Fusionsdeck pro Gegner.** Diese Karten mussten **nicht** durch eine echte Karriere erspielt werden; daher sind die Siegraten **nicht** als natürliche Turnier-Siegquoten zu verwenden.

| Gegner | Normal-only | Default-KI | Gezielte Pokerfusionen |
|---|---:|---:|---:|
| III | **18/18** | 16/18 | **18/18** |
| VI | 17/18 | **18/18** | **18/18** |
| IX | **18/18** | 17/18 | **18/18** |
| **Gesamt** | **53/54 (98,1 %)** | **51/54 (94,4 %)** | **54/54 (100 %)** |

### Dauer und Fusionsnutzung

| Gegner | Normale Monster: Ø Halbzüge | Default-KI: Ø Halbzüge / Fusionen | Gezielte Fusion: Ø Halbzüge / Fusionen |
|---|---:|---:|---:|
| III | 11,1 | 20,8 / 5,89 | 12,2 / 5,72 |
| VI | 8,0 | 7,5 / 3,50 | 7,4 / 3,94 |
| IX | 9,6 | 8,7 / 3,22 | 8,4 / 4,44 |

Besonders bei **III** verlängert die Default-KI mit ziellosem Fusionieren die Kämpfe massiv. Ihr Siegverhältnis fällt gleichzeitig auf 16/18. Die KI für geplante Fusionen gewinnt zwar alle 18 Duelle, benötigt aber deutlich mehr Materialien; das ist keine gratis Leistungssteigerung.

**Wichtige Methodeinschränkung:** Nach Gegner VIII/I X kommt es bei diesen extrem starken Vorabdecks zu einem **Deckstärke-Ceiling** (nahezu alle Varianten gewinnen). Deshalb sind die 0–2 verlorenen Duelle je Variante kein belastbarer numerischer Maßstab für die Feinbalance.

## C. 280 tatsächliche Fusionswürfe (40 je Rezept)

Quelle: `tests/fusion31-balance-scenarios.test.cjs`, Funktion `runAuditFusions`. Jede Probe nutzt den echten `fusedInstance`-Pfad inklusive Rollen- und Materialboni. Der Prozentsatz bezieht sich auf **ATK+DEF relativ zur Mitte eines gewöhnlichen Monsters derselben Zielstufe**, nicht auf die höchste Angriffsleistung eines Predator-Monsters.

| Materialrezept | Ø ATK+DEF relativ zu normaler Mitte | Spannweite | Unter Referenz |
|---|---:|---:|---:|
| Unpassend 4+2, freie Fusion | **87,5 %** | 78,9–94,4 % | **40/40** |
| Paar 3+3 | 107,1 % | 96,7–115,4 % | 2/40 |
| Kleine Straße 1+2+3 | 116,6 % | 108,5–123,9 % | 0/40 |
| Drilling 3+3+3 | 118,7 % | 108,9–126,0 % | 0/40 |
| Große Straße 1+2+3+4 | 118,1 % | 108,8–124,2 % | 0/40 |
| Große Straße 1+2+3+4+5 | 120,9 % | 111,0–125,2 % | 0/40 |
| Vierling 3+3+3+3 | **128,9 %** | 119,6–136,2 % | 0/40 |

*Hinweis:* Der Auswertungswert ist die **Summe** ATK+DEF; der Rollenbonus kann die Verteilung stark verschieben. Eine Predator-Fusion kann daher hohen Angriff bei schlechterer Verteidigung bekommen, ohne dass ATK+DEF proportional steigt.

**Interpretation:** Die 3.1-Formel erreicht das gewünschte Risiko einer schlechten Materialkombination. Allerdings liegt ein normales **Paar** in dieser Stichprobe bereits in 38/40 Fällen über der allgemeinen Referenz, und **alle** getesteten Drillinge, Straßen und Vierlinge sind stärker. Für gute Pokerrezepte kann das gewollt sein; die Frage ist, ob der zusätzliche Verbrauch von 3–5 Karten ausreichend eingepreist ist.

## D. Probleme, offene Fragen und sinnvolle nächste Schritte

1. **P0: KI-Fusionsentscheidung korrigieren (späteres, gesondertes Gameplay-Update).** Der vorhandene `chooseAiAction`-Code schätzt Fusionsstärke teilweise mit `baseStat(template,'atk',p)` – also den **alten, hohen Fusionsvorlagen-ATK**, obwohl die echte 3.1-Fusion aus `fusionReferenceStats` würfelt. Das führt zu unvernünftigem Fusions-Spam in Simulationen. **Noch nicht behoben**, um die ursprüngliche Formel unbeeinflusst zu testen.
2. **P1: Ressourcenpreis für starke Pokerkombinationen prüfen.** Ein Vierling liegt im Mittel bei ca. +29 % zur normalen Referenz; werden vier Karten, die Wahl der passenden Rollen und der Fusionsvorrat in echten Duellen angemessen kompensiert?
3. **P2: Schwierigkeitsspitze bei Gegner IV untersuchen.** Durchschnittlich 12,67 Versuche, Maximum 24; spätere Gegner oftmals deutlich leichter. Eine Verbesserung der strategischen KI sollte der **erste Kontrollversuch** sein, bevor wir Gegner IV abschwächen.
4. **P3: Direkten Vergleich fairer Rollen-Decks** aus realistisch erreichbaren Inventaren konstruieren, inklusive Predator- und Wächter-/Seelenzehrer-Spezialisierung, echter Feldfusionen und Korrelieren mit Spielerressourcen.
5. **P4: Längere Kampf- und Zerfallsdauer** sowie wiederholte Fusionen von bereits fusionierten Monstern testen. Der verminderte Fusionszerfall (25/20/15) ist technisch korrekt, aber für das resultierende Langzeit-Meta noch nicht gesondert ausbalanciert.
6. **Level 1/2 bleibt ausdrücklich ausgespart:** Die besondere neue Nutzeridee für Low-Level-Decks wird **erst nach Abschluss der Fusionsbalance** besprochen.

## Releaseentscheidung

**Fusionsbalance 3.1 ist technisch stabil, aber als finales Balancing noch nicht freigegeben.** Die Test-Suite ist auf `development` umgestellt; `main` bleibt unverändert. Zuerst die KI-Entscheidungslogik und die künstliche Anfälligkeit für unnötige Fusionen gesondert untersuchen, dann echte Vergleichsdecks und ggf. die Turnierkurve anpassen.

**Reproduzierbare Tests:** `npm test`. Letzter erfolgreicher Lauf: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/38781037537
