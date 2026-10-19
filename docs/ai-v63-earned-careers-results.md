# Arcane Duel · KI-Training v6.3 – tatsächlich erspielte Karriere-Inventare

**Stand:** 19.10.2026 · Branch **development**, `main` unverändert · Keine experimentelle KI automatisch aktiviert.

## Warum diese Runde
Die bisherigen Mirror-Decks waren regelkonform, aber die Besitzerlisten wurden synthetisch aus möglichen früheren Beutekarten modelliert. Nun erzeugt `tests/ai-real-career-snapshots-v63.cjs` die Trainingsdecks durch echte Engine-Aktionen:
- Spielbeginn mit `freshProfile()`, echter Trainingsreihe (3 Siege), anschließend tatsächlichen Turnierkämpfen;
- tatsächliche `simulateGame`-Züge und `rewardMatch`-Belohnungen nach **jedem** Kampf, inklusive Niederlagen und Beute;
- aus dem echten Bestand bezahlte `buyBooster(3)`, Charakterpacks und `finishMilestone`-Auswahlen, anschließend `equipBest()`;
- **vor** jedem freigeschalteten Turniergegner ein `validateProfile`-geprüfter Schnappschuss mit genau den `inventory`-Kopien, dem ausgerüsteten 40er Deck, Fusionen, Upgrades und Coins;
- nach ausgeschöpften Versuchen **kein** künstlicher Turniersieg, keine Karte geschenkt, keine zusätzliche Freischaltung.

Diese sind **wirklich simulierte Karriereverläufe** unter geskripteten Spielstrategien, nicht tatsächliche Menschen und nicht zwingend eine repräsentative durchschnittliche Nutzerpopulation.

## Tatsächlich erreichter Fortschritt

[Sechs vollständige Karriereversuche + KI-Training, Run 39246126507](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39246126507) – **erfolgreich**

| Eingangs-Turnierstufe | Echte Inventar-Schnappschüsse |
|---|---:|
| I | 6 |
| II | 6 |
| III | 6 |
| IV | 4 |
| V | 2 |
| VI | 2 |
| VII–X | 0 |

**26** tatsächliche Inventar-Snapshots. Keine der sechs geskripteten Karrieren hat Turnier VI gewonnen; zwei haben es mit regulärem Inventar erreicht. In den anderen vier endete die Karriere früher. Eine spätere Aussage über Endgegner VII–X muss deshalb ausdrücklich offenbleiben.

Die durchgespielten Strategien waren `balanced`, `offensive`, `guardian` und `economy`, kombiniert mit konservativer oder investierender Boosterpolitik (Booster wurden **nur bei ausreichenden Coins** gekauft). **4/4** Karten-/Inventar-Konsistenztests bestanden.

## Trainieren auf diesen Decks

`tests/ai-career-policy-holdout-v63.cjs` verwendet diese gespeicherten **vollständigen tatsächlichen Profile** beim echten `createGame`-Duell, einschließlich erworbener Upgrades. Gegner spielen ihr authentisches kuratiertes PvE-Deck mit Signatur-ACE; der simulierte Spieler verwendet das tatsächlich erreichte Deck. Vier KI-Policies werden in Trainingspartien verglichen, aber die Wahl der Variante erfolgt **vor** einem separaten Test mit bislang unbenutzten Zufallsseeds. Beide Seiten des KI-Vergleichs erhalten identisches Spielerprofil, Testdeck und Startseed; unterschiedliche KI-Regeln sind beabsichtigt.

**4.320 ausgeführte KI-Testpartien.** Vergleichsbasis sind die zuvor trainierten `v5.7`-Entscheidungsgewichte; die Kandidaten sind `gated-field`, `gated-survival` und `fusion-preservation`. Die Regeln für echte Boss-ACE-Vorbereitung gelten im Training ebenfalls.

| Gegner | Snapshots | Aus Training ausgewählt | Zusätzliche Siege im unabhängigen Holdout | mittleres NPC-minus-Spieler-LP-Delta |
|---|---:|---|---:|---:|
| I | 6 | Gated Field | 0 | +85 |
| II | 6 | **Gated Field** | **+18** | **+362** |
| III | 6 | Baseline v5.7 | 0 | 0 |
| IV | 4 | Baseline v5.7 | 0 | 0 |
| V | 2 | Baseline v5.7 | 0 | 0 |
| VI | 2 | Baseline v5.7 | 0 | 0 |

In Stufe II: **288 Kontrollpartien Baseline** und **288 Kandidatenpartien**, also 576 Holdout-Duelle. Das automatische Qualifikationskriterium (+3 Siege, kein negativer LP-Vorsprung, nicht schlechtere bestätigte ACE-Partien) war **nur für II** erfüllt. Eine Live-Freigabe ist damit **nicht** gleichzusetzen.

## Unabhängiger dritter Kontrolllauf mit festem Gegner-II-Profil

[GitHub Actions – Earned Deck Confirmation v6.3, Run 39246451250](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39246451250) – **erfolgreich**

Das Profil `gated-field` für II wurde **vorab fixiert** und erneut mit einer weiteren, gegenüber Trainings- und erstem Holdout disjunkten Zufallsseed-Gruppe geprüft. Keine Auswahl anhand dieser Bestätigungsdaten.

- **864 Duelle**: 432 Baseline und 432 Kandidat, gleiche Seeds, drei Spieler-Policies, beide Startpositionen
- **6 unterschiedliche Deck-/Upgrade-Fingerprints**, obwohl die sechs Karrieren nicht als sechs vollständig unabhängige menschliche Spielstrategien gelten dürfen
- **171/432 Siege** (trainierte v5.7-Baseline) versus **208/432 Siege** (`gated-field`)
- **+37 Siege**, durchschnittliches **+526 LP**-Delta
- In Spielen mit **bestätigt beschworenem ACE**: **414/432** (Baseline) versus **432/432** (Kandidat), also **+18 Partien**
- Alle Duelle waren echte Engine-Spiele; gescriptete Spielerpolitik bleibt eine Begrenzung.

Dieser zweite positive Holdout erhöht das Vertrauen in eine spezifische Verbesserung bei **Gegner II**; keine pauschale Aussage über alle Gegner oder ein gleich starkes PvP-Regelsystem.

## Bewusst offene Grenzen und nächste Entscheidung
1. **Noch keine KI-Freigabe**: Gated Field für II als Kandidat im Trainingsartefakt behalten und in manuellen Karriere-Sessions auf ACE-Telegraphie, Defensivverhalten und Spaß/Schwierigkeitsgrad prüfen.
2. **Echte Karrieren zu VII–X weiterentwickeln**: Legales, besseres Deckbuilding mit angemessenen Rollen-Synergien, erworbenen Packkarten, Werkstatt und Upgrades testen, ohne Gratiskarten/Story-Freischaltungen zu erfinden. Ein dominanter Gegner ist ein Balancing-Signal, keine Erlaubnis zur Fälschung.
3. Weitere unabhängige Spielerpolitik-Varianten testen, weil die Scriptpolicies nicht menschliche Kreativität/Fehler abdecken.
4. Nur wenn tatsächliche Karriere-Stichproben bis X reichen, weitere ACE-Gegner und Late-Game-Balance auf Basis dieser Inventare bewerten.

**GitHub-Dateien:** `tests/ai-real-career-snapshots-v63.cjs`, `tests/ai-career-policy-holdout-v63.cjs`, `tests/ai-earned-confirmation-v63.cjs`; Detail-JSONs unter `artifacts/ai-real-careers-v63.json`, `artifacts/ai-earned-policy-holdout-v63.json`, `artifacts/ai-earned-confirmation-v63.json` als Workflow-Artefakte für 30 Tage.
