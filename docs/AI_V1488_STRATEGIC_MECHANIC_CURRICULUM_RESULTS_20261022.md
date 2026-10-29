# Arcane Duel – Prüfbericht v14.8.8: strategisches Mechanik-Curriculum

**Prüfdatum:** 22. Oktober 2026  
**Branch:** `development`  
**Commit:** `c94eb0005c9e1487e2905cd257b6f74379411e03`  
**Ausführung:** [GitHub Actions #39749496289](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39749496289) – **success**  
**Originalartefakt:** [arcane-v1488-strategic-curriculum-full, ID 12413421346](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39749496289/artifacts/12413421346) – `report.json`, `selection.json`, drei Trainings- und drei Holdout-Shards.

## Kurzurteil

**Technischer Test vollständig erfolgreich.** Sieben Strategien, drei Trainingsparameter, unabhängige Holdout-Szenarien, beide Sitzplätze und Starterkonstellationen getestet. **Taktischer Vorteil angedeutet, noch nicht statistisch überzeugend.** 90 von 168 unabhängigen Holdout-Partien (53,57 %) gegen die eingefrorene v14.7-Referenz gewonnen. Keine illegalen Aktionen, aber **keine Produktivpromotion**, kein dauerhaft fortgeschriebenes KI-Modell und keine Änderungen an `main`.

## Versuchsanordnung und Kontrollen

- Neutralisierte Skills und Perks **nur innerhalb des Forschungssimulators**.
- Fusionsmechanik im Test symmetrisiert, identische vollständige Kartenreihenfolge und Startkarten je gespiegelt gematchtem Spiel, beide Startpositionen, null Startschilde.
- 21 Trainingsszenarien in drei unabhängigen Shards. Drei Parameter `materialCost` jeweils 84 Matches.
- Beste Variante ausschließlich nach Train-Winrate gewählt und vor Holdout eingefroren.
- 21 neue, von Trainings-Seeds verschiedene Holdout-Szenarien × vier Startbedingungen × beide Sitzrollen = **168** Matches.
- Sieben Stile: `predator`, `guardian`, `fusion`, `soul`, `allrounder`, `tempo`, `hybrid` (je 24 Duelle).
- Legale Beschwörungs-/Platzierungsfolgen über `resolvedBranch143`; sichtbare Gegnerfeld-Kontermöglichkeiten, kein Gegnerhandorakel. Verdeckte Karten, Ziehfolge und hypothetische Gegnerbeschwörungen werden nicht durch einen vollständigen Mehrzugplaner vorhergesagt.
- Die Vergleichspolitik bleibt die eingefrorene v14.7-KI. `productionIntegrated=false`, `championPromoted=false`, `promotionEligible=false`.

## Trainingsdaten (84 Duelle pro Parameter)

| Zusätzlicher Materialkostenfaktor | Siege | Rate | Echte Wahlsituationen | Abweichende Aktionen |
|---:|---:|---:|---:|---:|
| 0,05 | 46 | 54,76 % | 373 | 78 |
| 0,15 | 46 | 54,76 % | 370 | 82 |
| **0,35 (Train-Sieger)** | **49** | **58,33 %** | **365** | **114** |

Die Unterschiede sind klein und an dieselbe 21er-Szenariogruppe gebunden. Der Parameter 0,35 ist **trainingsseitig bevorzugt**, nicht als kausal überlegen belegt.

## Holdout-Ergebnis

| Kennzahl | Messwert |
|---|---:|
| Siege neue KI / Matches | **90 / 168** |
| Siegquote | **53,57 %** |
| Siege fixer Sitz 0 | **86 / 168 = 51,19 %** |
| Siege des tatsächlichen Startspielers | **52 / 168 = 30,95 %** |
| Siege des zweiten Spielers | **116 / 168 = 69,05 %** |
| KI-Entscheidungspunkte | 1.900 |
| Mit mindestens zwei unterscheidbaren Aktionen | 763 |
| Davon anders als alter Snapshot-Planer entschieden | **127 = 16,64 %** |
| Abweichungen Beschwörung/Fusion | **121** |
| Abweichungen Positionswechsel | **2** |
| Abweichungen Angriffe / aktive Unterstützung | **4** |
| Bewertete vollständig platzierte Varianten | **5.580** |
| Bewertete sichtbare Antwort-/Gegenangriffszweige | **5.509** |
| Ungültige Aktionen | **0** |

Der Anteil abweichender Entscheidungen ist eine **Verhaltensmetrik**, kein eigener Nutzenbeweis. 121/127 = 95,28 % aller Unterschiede liegen bei Beschwörung/Fusion. In der Positions- und Angriffsphase ist die Strategie nahezu identisch zur bisherigen. Bei 1.900 Entscheidungen gab es lediglich 763 Situationen mit einer echten Wahl.

**Statistik:** Eine rein spielbasierte zweiseitige Binomialprobe gegen 50 % ergibt für 90/168 ungefähr `p=0,396`, Wilson-95%-Intervall der Siegquote etwa **46,0–60,9 %**. Diese Näherung überschätzt tendenziell die Evidenz, weil 168 Spiele aus nur 21 eigenständigen Holdout-Szenarien mit Spiegelungen/Startvarianten stammen und deshalb nicht unabhängig sind. **Keine nachgewiesene Gesamtüberlegenheit.**

## Ergebnisse pro Stil

| Stil | Siege von 24 | Quote | Abweichende Entscheidungen |
|---|---:|---:|---:|
| Fusion | 16 | 66,67 % | 14 |
| Predator | 14 | 58,33 % | 10 |
| Allrounder | 14 | 58,33 % | 10 |
| Tempo | 14 | 58,33 % | 4 |
| Hybrid | 13 | 54,17 % | 20 |
| Guardian | 12 | 50,00 % | 42 |
| **Soul** | **7** | **29,17 %** | **27** |

Die kleine Fallzahl von 24 pro Stil verhindert belastbare Einzelaussagen. Die auffällig negative Soul-Teilgruppe ist ein **gezielter Regressionsverdacht**, kein bewiesener ursächlicher KI-Fehler. Wichtig: In dieser kontrollierten Umgebung waren Rollenfähigkeiten/Skills neutralisiert; sie prüft die vollständige Live-Seelenzehrer-Mechanik ausdrücklich **nicht**.

## Fairness / Startereffekt

Sitz 0 liegt bei 86/168 (51,19 %), also nahe einem ausgeglichenen festen Sitzplatz. Dagegen gewinnen tatsächliche Startspieler nur 52/168 (30,95 %). Diese ausgeprägte Zweitzugtendenz ist relevant, muss aber gegen kontrollierte Matches der eingefrorenen Referenz **unter denselben** exakt gleichen Decks und Starterkonfigurationen evaluiert werden, bevor sie einer KI-Änderung oder der Engine zugeschrieben wird. Sie passt qualitativ zur vorher beobachteten Zweitzugtendenz von v14.8.6, ist jedoch **nicht** direkt über unterschiedliche Testkohorten vergleichbar.

## Technische Durchführung und Randbedingungen

- GitHub Actions erfolgreich inklusive Engine-/Regeltests, Restore/Prüfung historischer v13.6- und v14.7-Referenzen, Train/Select/Holdout, Schema-/Legalitäts-Gate und gespeichertem Report.
- Drei frühere Startversuche schlugen wegen fehlender Variablen in der isolierten JS-Ausführungsumgebung fehl; der korrigierte Lauf unter Commit `c94eb000` bestand vollständig.
- Der Forschungsplaner behandelt im Bereich der eigenen Beschwörungs-/Fusionsphase tatsächlich abgeschlossene Platzierungen mit den bestehenden Engine-Regeln; zufällige Fusionsausgänge wurden pro Entscheidung **gesampelt**, nicht statistisch über viele mögliche Würfe gemittelt.
- Der Gegenplaner modelliert schon auf dem Feld sichtbare gegnerische Angriffe, **nicht** die unbekannte Hand, zukünftige Beschwörungen oder vollständige mehrzügige Antwortbäume.
- Der Scope ist durch die bisherige Planner-Architektur zeitlich und mechanisch begrenzt; keine umfassende Karriere-/ACE-/Quest-Validierung.
- `materialCost` wurde als eine feste Score-Gewichtung **über diese Trainingsspiele gewählt**. Es existiert kein Nachweis für kontinuierliches Online-Lernen, echtes Reinforcement Learning oder eine aus vergangenen Matches aktualisierte langfristige Policy.

## Handlungsempfehlung für v14.8.9

1. **Soul-Sonderprüfung:** Gepaarte identische Situationen mit und ohne v14.8.8-Beschwörungsplaner, Handlungsscores, tatsächlich ausgespielte Fusionen, Survivor-Werte und den nächsten Zug untersuchen. Später Skills/Perks beidseitig stufenweise reaktivieren; nicht allein eine globale Soul-Bonuszahl hochsetzen.
2. **Echte Kausalität pro Aktion:** In *identischer* Ausgangslage alte vs. neue Wahl jeweils bis zum Ende der nächsten Gegnerantwort auswerten; Siegquote der Tests um konkrete Folgen auf Brett, ATK/DEF, LP und Ressourcen erweitern.
3. **Konterplaner stärker nutzen:** Für Angriffs- und Positionsphase explizite taktische Konfliktszenarien schaffen, weil v14.8.8 dort insgesamt nur 6 abweichende Entscheidungen bewirkte.
4. **Zweitzugvorteil isolieren:** Beide alten/neuen Policies auf demselben Testdeck als Starter vs. Zweiter mit gleicher Fusion RNG untersuchen, damit Engine-Tempoeffekte und Policy-Faktoren getrennt werden.
5. **Variabler Fusionswert statt pauschalem Kostenscore:** Unterscheide Materialrollen, ACE-Chancen, Zerfall, Nachziehwert und Resonanz; viele RNG-Varianten gegensampeln, kein perfekte-Hand-/Deck-Orakel.
6. **Größerer präspezifizierter Holdout:** Mehr unabhängige Decks/Seeds pro Stil und Gegner sowie absolute Fail-Closed-Gates gegen Soul-Rückschritt und illegale Aktionen; keine Promotion allein aufgrund von 53,6 %.

**Freigabe:** Kein Update der produktiven KI und kein Merge nach `main` empfohlen. Der Forschungstrainer auf `development` bleibt erhalten.
