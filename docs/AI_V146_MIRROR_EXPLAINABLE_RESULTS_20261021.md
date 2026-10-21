# Arcane Duel – KI-Prüfbericht v14.6: Spiegelduelle, drei Strategien und erklärbare Entscheidungen

**Datum:** 21. Oktober 2026 · **Branch:** `development` · **Workflow:** SUCCESS · **Champion-Übernahme:** NEIN

- [GitHub Actions #39663274946](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39663274946)
- [Originales Ergebnisartefakt (Report, Entscheidungsbegründungen, Kandidat)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39663274946/artifacts/12376790934)
- Quell-Commit: `5ae158e225227a41f4af2e872e39d511c5b1a051`
- Trainer `tests/ai-mirror-explanations-v146.cjs` und Workflow `.github/workflows/ai-mirror-explanations-v146.yml`.

## 1. Prüfung und Umfang

Der Workflow wurde am **21.10.2026 um 19:42 UTC (21:42 MESZ)** im ersten Versuch erfolgreich abgeschlossen. Alle **86/86 Regel-/Regressionstests bestanden**; Pilot und 84 Trainings- sowie 84 unabhängige Holdout-Szenarien vollständig verarbeitet.

v14.2, v14.3, v14.4 und v14.5 wurden anhand ihrer Original-Actions-Berichte samt erwarteten JSON-Schemata eingelesen. Ihre Schlussfolgerungen bilden das Curriculum, **nicht** rückwirkend optimal gelabelte Züge. Die 15 Gewichte des eingefrorenen Champions `models/ai-selfplay-v136.json` blieben unverändert. Es wurden je Strategie zwei neue Heuristik-Profile auf den **Trainingsszenarien** ausgewählt.

A/B-Mirrors sind paarweise angelegt: gleiche legal konstruierte Haupt- und Fusionsdecks, identischer Start-Seed, gleiche Regeln, Sitzwechsel der beiden Strategien. Anfangszustände sind somit kontrolliert. Unterschiedliche Entscheidungen können nachfolgende Zufallswürfe verschieden verbrauchen, weshalb die Ergebnisse nicht denselben Zufallspfad garantieren.

## 2. Trainingsprofile

| Hauptstrategie | Variante | Siege/Gesamt | Auswahl |
|---|---|---:|---|
| Offensiv (Predator/Tempo) | **predator-balanced** | 24/48 (50,0 %) | Tie-Break |
| Offensiv | predator-attack | 24/48 (50,0 %) | Nein |
| DEF (Guardian/Soul) | guardian-preserve | 24/48 (50,0 %) | Nein |
| DEF | **soul-extract** | 25/48 (52,1 %) | Ja |
| Fusion (Fusion/Allrounder/Hybrid) | fusion-resource | 36/72 (50,0 %) | Nein |
| Fusion | **fusion-invest** | 37/72 (51,4 %) | Ja |

Die geringfügigen Unterschiede erlauben keine belastbare Aussage über strategische Überlegenheit. Es handelt sich um **Policy-Heuristik-Parametertuning**, nicht um allgemeine Verstärkungslern-Fortschritte mit neuen trainierten Gewichten.

## 3. Unabhängige Mirror-Matches

| Strategie | Gegen v14.5 | Gegen Champion (alle Stile zusammen) |
|---|---:|---|
| Offensiv | 24/48 (50,0 %) | Predator-Stil: 13/24, Tempo: 12/24 |
| DEF | 24/48 (50,0 %) | Guardian: 14/24, Soul: 13/24 |
| Fusion | 36/72 (50,0 %) | Fusion: 12/24, Allrounder: 14/24, Hybrid: 13/24 |
| **Gesamt** | **84/168 (50,0 %)** | **91/168 (54,2 %)** |

Alle sieben Deckstile enden gegen v14.5 im A/B-Test mit exakt 50,0 %. Dies ist ein **diagnostisch relevantes Signal** dafür, dass die neuen Profile wenig am eigentlichen Spielverlauf ändern könnten. In den exemplarisch erfassten sechs gespiegelten Szenarien waren **fünf der sechs Aufzeichnungen derselben Spielerposition über beide Varianten hinweg in der Aktionssequenz identisch**. Daher im nächsten Lauf unbedingt **echte Entscheidungsabweichungen zwischen v14.5 und v14.6** messen, nicht nur Siege zählen.

**Unsicherheit:** Ein Vorsprung von 91/168 gegen den alten Champion ist bei diesen Stichproben noch zu klein, um robuste Überlegenheit anzunehmen. Die unabhängigen Resultate sind keine Promotion-Empfehlung.

## 4. Boss-Stresstest

| Boss | v14.6 | v14.5 | Original-Champion |
|---|---:|---:|---:|
| VII | 8/14 | 8/14 | **13/14** |
| IX | **3/14** | 2/14 | 1/14 |
| X | 1/14 | 1/14 | 1/14 |
| **Gesamt** | **12/42** | 11/42 | **15/42** |

Der neue Kandidat ist gegen VII deutlich schwächer als der Champion. Der kleine Gewinn gegen IX ist bei 14 Spielen unsicher. X bleibt bei nur 1/14 Siegen äußerst schwierig.

## 5. Experten-Gegner

| Spezialist | Siege |
|---|---:|
| Offensive | 20/28 (71,4 %) |
| Defense/Support | 20/28 (71,4 %) |
| Fusion/Ökonomie | 22/28 (78,6 %) |

Ermutigend, aber andere Gegner als der direkte 168er Mirror-Vergleich; diese Ergebnisse kompensieren nicht die Stagnation gegen v14.5 und den Bossrückstand.

## 6. Geplante versus tatsächliche Aktionen

Über die unabhängigen Mirror-Holdouts:
- **709** registrierte Folgeaktionsabsichten.
- **709** spätere von der Engine angenommene Aktionen mit gleichem **Aktionstyp** (100 %).
- Nur **513** davon sind ein **exakter JSON-Aktionsmatch**, einschließlich Monster/Fusionsmaterial-UID, Slots und Angriffsziel (**72,4 %**).
- **196** Abweichungen trotz passenden Aktionstyps (**27,6 %**).
- Nach Strategien: Offensive **128/188** exakt (68,1 %); Defensive **161/223** (72,2 %); Fusion **224/298** (75,2 %).

**Einschränkung:** Die geplante Folgeaktion wird in der Trainerwertung gegen irgendeine spätere angenommene Aktion **gleichen Typs, Zugnummer und Sitzes** getestet. Eine exakte Übereinstimmung belegt daher noch nicht, dass die Aktion in derselben Folge-Position vorgenommen wurde, dass der ursprünglich erwartete Nutzen eintrat oder dass die Planung kausal dafür verantwortlich war.

## 7. Neue KI-Rückmeldung: konkret, aber noch nicht durchgehend getreu

Original-Artefakt `decision-explanations.json`: **12** aufgezeichnete Duellperspektiven mit **120** kurzen Entscheidungsnotizen und **216** Vorher-/Nachher-Snapshots tatsächlich durchgeführter Engine-Aktionen (alle angenommen). Die Aufzeichnungen enthalten:
- Ausgewählte Aktion samt Slot, Material-UIDs oder Angriffsziel;
- Gewichtete Policy-Features, einfach interpretierte Regelgründe und konkurrierende Aktionen;
- Öffentlichen sichtbaren Spielzustand und das eigene Hand-/Ressourcenprofil;
- Tatsächliche unmittelbare Veränderungen von Feld, Lebenspunkten, Karten und Fusionsreserve;
- Abweichungen zwischen vorgeschlagener Folgeaktion und tatsächlich gewählter Folgeaktion.

**Wichtige Erklärbarkeitslücke:** **74 von 120** Notizen zeigen `legalCandidate:false`, weil sie z. B. Platzierung, Positionswechsel und Phasen-Fallback statt einer von `choices135` direkt bewerteten Aktion erfassen. Das bedeutet *nicht automatisch illegal*: Die Engine hat alle 216 protokollierten Aktionen angenommen. Die Notizen belegen für diese Fallbacks bloß **keine Score-Zuordnung**.

Bei **24** der 120 Notizen ist der Abstand zwischen gewählter Aktion und der im linearen Score nächstgenannten Alternative negativ. Beispielsweise empfiehlt der weiterführende Planer eine **Normalbeschwörung mit UID 15** (linearer Score 0,6363), während eine angebotene **Fusion mit UIDs 11/12/14** im linearen Teil höher bei **0,6768** liegt. Das ist nicht automatisch ein Logikfehler: Der finale Lookahead darf anders entscheiden als das lineare Ausgangsranking. **Der aktuelle Begründungstext erläutert jedoch nur den linearen Score und nicht vollständig, warum der Lookahead ihn überstimmt.** Für ehrliche, prüfbare KI-Rückmeldungen muss in v14.7 die **tatsächlich verwendete finale Planerwertung** samt Material-/Gegendruck-/Folgeaktionswerten für jede Alternative protokolliert werden.

Beispiel im Original: Der Planer beabsichtigte einen Angriff mit `ai:0,di:2`, tatsächlich gespielt wurde später `ai:0,di:0`. Der Aktionstyp stimmt überein, das Ziel nicht. Genau solche Gegenbeispiele ermöglichen künftig gezieltes Lernen.

**Wahrheitsstandard:** Es sind algorithmisch erzeugte Erklärungen aus messbaren Entscheidungsdaten, keine inneren Gedanken oder emotionalen Selbsteinschätzungen der KI. Ein Score-Abstand ist keine kalibrierte Gewinnwahrscheinlichkeit.

## 8. Fachmechaniken und weitere Grenzen

- Es gibt separate Trainingsklassen für Offensive/Predator-Tempo, DEF/Guardian-Soul und Fusion/Allrounder-Resonator-Hybrid. **86 bestandene Mechaniktests** sichern viele Regeln auf Engine-Ebene ab, sind aber **kein Beweis**, dass die KI jede Spezialkarte/Quest-/Ökonomieregel strategisch beherrscht.
- DEF-Holdout-Aktionszählung (beide Politik-Seiten zusammen): **121 gewählte Soul-Extract-Aktionen**, **17 Wächter-Heilungen**. Fusions-Holdout: **680 gewählte Fusionen**, **94 Soul-Extract**, **16 Wächter-Heilungen**. Diese Werte sind wiederholte Aktionen und keine Matchanzahlen. Angebot-/Wahlkontexte nicht ungeprüft dividieren.
- Bisher keine vollständige mehrzügige Suche mit gegnerischen Erwiderungen, keine langfristig auf echten Karriere-Inventaren gesammelten Zustände und kein eigenständig lernender Online-Agent. Die Reports werden als historische Themenverteilung verwendet.

## 9. Bewertung und nächste Schritte

**GitHub-Workflow erfolgreich, neue Strategie nicht promotionsfähig:** `qualifiesForPromotion:false`, `productionIntegrated:false`. Die v14.6-KI erzielt lediglich **50,0 % gegen v14.5**, **54,2 % gegen Champion** (unter der geforderten 56-%-Schwelle), und **12/42 Bosssiege** gegen **15/42 beim Champion**.

### Konkreter v14.7-Plan
1. **Wirklicher Planer-Abweichungszähler** auf derselben Entscheidung: Wie oft unterscheidet sich v14.6 von v14.5 und von der linearen KI, inklusive genauer UID/Slot/Ziel?
2. **Finale Bewertungsbegründung** statt nur Proxy-Score: pro legaler Alternative Komponenten `postPlacementGain`, `materialCost`, `visibleThreat`, `followupGain`, `decay`, `estimatedCounterplay`, Score und erste tatsächlich gewählte Aktion protokollieren. Im Feedback ehrlich markieren, wenn ein regulärer Fallback griff.
3. **Exakte Folgepfade** mittels Zustands-Hash vor dem geplantem Followup, Legalität und konkreter UID/Ziel sowie tatsächlichem State-Delta überprüfen. Differenzen als Lernaufgaben archivieren.
4. **Gezielte Gegenbeispiele**: dieselben starken/schwachen Zustände paarweise mit mehrfachen Fortsetzungen unter kontrollierten Seeds prüfen. Nicht alte Holdout-Ergebnisse zur Auswahl neuer Gewichte verwenden.
5. **Boss VII und X unabhängig diagnoseorientiert prüfen**, keine für zu schwache Late-Game-Decks unmöglichen Siegesziele als Lektion labeln.
6. Ausgewählte echte Zustands-/Aktionsdaten dauerhaft im Repository versionieren und regelmäßig in neuen Trainingslauf einlesen. Nur nach nachgewiesener Verbesserung ein neues Modell übernehmen.

**Gesamturteil:** Entscheidungsbeobachtung deutlich verbessert, jedoch **strategische Stagnation**. Der produktive Gegner, `main` und die bisherige Championdatei bleiben unverändert.
