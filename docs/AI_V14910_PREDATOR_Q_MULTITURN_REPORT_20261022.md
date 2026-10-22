# Arcane Duel – KI-Prüfbericht v14.9.10: konservatives Q-Lernen und begrenzte Mehrzugplanung

**Datum:** 22. Oktober 2026 · **Branch:** `development` · **Ergebnis:** SUCCESS · **Trainings-Commit:** `a1ee30c03d741ae24a1d6ff20f1218462bf85b08`

- [Vollständig erfolgreicher GitHub-Actions-Lauf #39789451267](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39789451267)
- [Training, Q-Checkpoints und vollständige Duellprotokolle – Artefakt #12431365559](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39789451267/artifacts/12431365559)
- Forschungscontroller: `tests/ai-v1500-conservative-lookahead-duels.cjs`
- Gegenfaktik-Fortsetzung: `tests/ai-v1500-counterfactual-continuation.cjs`
- Workflow: `.github/workflows/ai-v14910-multiturn-predator-learning.yml`

## 1. Fazit

**Technisch sauberer und voll abgeschlossener Forschungsdurchlauf.** Der Erfolg des vorsichtig gesperrten Q-Controllers ist ein realistischer Schritt Richtung dauerhaft weitertrainierbarer KI, aber die numerischen Mehrwerte gegen starke Verteidiger sind weiterhin klein. Eine reguläre Produktiv-KI-Promotion erfolgt **nicht**.

Die neue vorsichtige Q-Regel gewinnt **115/144 schwere DEF-Duelle**, die bisherige Heuristik **113/144**, ungefiltertes Q **111/144**, die zusätzliche begrenzte Zwei-Zug-Bewertung **114/144**. In der normalen Vergleichsserie gewinnen Baseline, vorsichtiges Q und Zwei-Zug-Planung jeweils **139/144**; ungefiltertes Q **138/144**.

**Keine belastbare statistische Überlegenheit** aus jeweils 144 teilweise gepaarten Versuchen ableiten; insbesondere 115 gegenüber 113 Siege ist ein sehr kleiner Effekt.

## 2. Umfang und Kontrollen

- 1.350 neue taktische Gegenfaktik-Trainingssituationen, je drei Bedingungen 450.
- 450 komplett disjunkte taktische Holdout-Brettsituationen, je Arm 150.
- 1.152 ganze Forschungsduelle: vier KI-Policies × zwei Startbedingungen × 144 Duelle.
- Je 144 vollständige Partien: Predator gegen Guardian, Soul, Fusion oder Hybrid; Angriffssperren 0/6/10; Starter und Spielerplätze gespiegelt; identische kontrollierte Setup-Seeds für die Varianten.
- Die **schwere** Ausgangsbedingung setzt zwei vorhandene Karten des gegnerischen 40-Karten-Decks bereits in DEF. Sie werden tatsächlich aus dem Deck genommen. Dies ist ein kontrollierter Stresstest, **kein gewöhnlicher Karrierestart**.
- Keine Arena-LP-Abnahme (isolierter Forschungsmodus); natürlicher Monsterzerfall, Rollen, Schwarmbonus +2 % und Predator-10pp-Rüstungsdurchschlag bleiben Teil des getesteten Motors.
- Training auf öffentlichen Kampfbrettern, unbekannte Gegnerhand/Deckfolge nicht als Suchinformation verwenden.
- Die archivierten Q-Werte aus erfolgreich abgeschlossenem Vorgänger-Lauf **#39783738386** wurden erfolgreich eingelesen. Kein Training auf vorigen Holdout-Labels.

## 3. Kernkennzahlen – vollständige Duelle

| Strategie | Normale Starts (144) | Erschwerter DEF-Start (144) | Kandidatensieg Sitz 0/1, normal | Kandidatensieg Sitz 0/1, schwer |
|---|---:|---:|---|---|
| Bewährte Heuristik | 139 | 113 | 69 / 70 | 56 / 57 |
| Ungefiltertes Q-Lernen | 138 | 111 | 69 / 69 | 55 / 56 |
| **Konservatives/gated Q** | **139** | **115** | 69 / 70 | 57 / 58 |
| Gated Q + sichtbare Zwei-Zug-Bewertung | 139 | 114 | 69 / 70 | 57 / 57 |

**Keine Timeouts in diesen acht Gruppen.**

### Erschwerte Gegner, nach Archetyp (je 36 Duelle)

| Strategie | Guardian | Soul | Fusion | Hybrid |
|---|---:|---:|---:|---:|
| Bewährte Heuristik | 33 | 32 | 22 | 26 |
| Ungefiltertes Q | 33 | 33 | 21 | 24 |
| Gated Q | 33 | 32 | 22 | **28** |
| Gated Q + Zwei-Zug | 33 | **34** | 21 | 26 |

**Wichtige Diagnose:** Der Lerner vermeidet bei vorsichtiger Auswahl schädliche Q-Abweichungen. Der Zugewinn ist aber deckabhängig: Gated Q verbessert in dieser Matrix vor allem Hybrid (+2), die begrenzte Zwei-Zug-Bewertung Soul (+2). Fusion-Gegner bleiben am schwierigsten (nur 21–22/36 bei DEF-Start).

## 4. Echte Lernupdates

Der Trainer setzt die seit v14.9.9 archivierten Merkmals-Aktionswerte fort: **drei von drei neu vorgeschlagenen Q-Updates wurden nach Trainingsvergleich angenommen**, 955 vorliegende Q-Merkmalskombinationen pro Forschungsarm. Im Holdout:

| Taktischer Forschungsarm | Gelernter Q-Nutzen (150 neue Boards, Mittelwert) | Heuristik (gleiche Boards) | Bestmögliche einzelne Aktion nach Suchhorizont |
|---|---:|---:|---:|
| Kontrolle ohne Schwarm und Durchschlag | 0,4471 | 0,2923 | 0,6998 |
| +2%-Schwarm | **0,5886** | 0,4138 | 0,8134 |
| +2%-Schwarm +10pp-Rüstungsdurchschlag | 0,5576 | 0,4537 | 0,8191 |

**Keinen taktischen Nutzen als Gewinnwahrscheinlichkeit auslegen.** Unterschiedliche Arms besitzen absichtlich unterschiedliche Buff-Regeln; ein direkter Vergleich der absoluten Werte ist nicht automatisch kausal. Die neue Lernparameteraufnahme wurde auf Trainingsdaten getroffen; die Holdoutdaten dienten ausschließlich zur Auswertung.

**Tatbestand tatsächlicher Nutzung im Vollmatch:**

| KI-Variante | Aktive Q-Aktionsentscheidungen in 288 Matches | Zwei-Zug-Bewertungen | Von der Heuristik abweichende Zwei-Zug-Wahlen |
|---|---:|---:|---:|
| Baseline | 0 | 0 | 0 |
| Ungefiltertes Q | 1.505 | 0 | 0 |
| Konservatives Q | **110** | 0 | 0 |
| Konservatives Q + Zwei-Zug | 27 | **2.977** | **92** |

Das Q-Gate erfordert einen deutlichen erlernten Vorteil und begrenzt die Verschlechterung gegenüber dem schon bekannten Heuristikscore. Deshalb lässt es relativ wenige Änderungen zu und kann den schädlichen Effekt ungefilterter Bewertungen reduzieren.

## 5. Was die Mehrzug-KI aktuell tatsächlich sieht

Der Suchcontroller simuliert in real geklonten Engine-Spielzuständen:

1. Den eigenen legalen Angriff.
2. Einen legalen Angriff als sichtbare gegnerische Antwort.
3. Einen möglichen eigenen nächsten legalen Angriff.

Auf jeder Stufe werden öffentliche LP, Monsterwerte, Seelenenergie und Feldbesetzung bewertet. Maximal drei besonders hoch bewertete Ausgangsaktionen und bei ausreichender Q-Konfidenz eine zusätzliche Predator-Alternative werden verglichen.

**Das ist ausdrücklich KEIN vollständiger Rundenbaum.** Die Simulation beinhaltet nicht alle Aktivfähigkeiten, Fusionen, Positionswechsel, den Ziehvorgang, alle möglichen Mehrfachangriffe sowie korrekt vollständig fortgeschaltete Spielrunden. Die geplante Zwei-Zug-Suche ist daher nur ein begrenzter, öffentlich sichtbarer Kampfausschnitt und kann falsche Entscheidungen bei komplexen Fusions-/Guardian-/Soul-Gegenstrategien treffen.

## 6. Prüfungen und Release-Sicherheit

- GitHub-Job `train-predator-planning` vollständig **SUCCESS**, keine fehlgeschlagenen Pipeline-Schritte.
- Engine-, Predator-Durchschlags-, Schwarm-, Essence- und Symmetrie-Regeltests vor dem Trainingsstart erfolgreich.
- Trainings-/Holdout-Größen und vollständige 1.152-Spiele-Matrix validiert.
- Beide Starterrichtungen / KI-Plätze pro Variante kontrolliert, jeweils ungefähr gleich verteilte Kandidatensiege.
- Null verlorene Matchprotokolle und null Duell-Timeouts in der dokumentierten Matrix.
- Automatischer Forschungsbericht **erlaubt keinerlei Promotion in die Live-KI**; `main` wurde nicht verändert.

## 7. Empfehlung / nächste Roadmap

1. **Gated Q als bevorzugten Forschungs-Controller führen**; er reduziert schädliche Abweichungen und erzielte hier 115/144 gegen harte Defender. Er darf noch nicht in das Live-Spiel übernommen werden.
2. **Fusion-Gegner gezielt härter trainieren:** Sie sind die auffälligste verbleibende Schwäche der Predator-Angriffe, insbesondere bei schwierigen DEF-Aufstellungen.
3. **Suche von Angriffen auf volle Turn-Transitions erweitern**: Beschwörung, Fusion, Positionen, Soul-Raid und Monsterzerfall in allen Antwortmöglichkeiten. Begrenzte Beam-Suche mit festem Budget und speicherbarem Gegenfaktik-Trace.
4. **Mehrere starke Gegnerprofile** statt nur `balanced` und einen weiteren unabhängigen Holdout über normale Arena-Zerfallsregeln ausprobieren.
5. **Promotionshürde**: Mehrere Wiederholungsläufe mit neuen Seeds, keine Platzverzerrungen und konsistent bessere Matchgewinne, bevor die gelernt-parametrisierte Policy in das reguläre Gegnerverhalten übernommen wird.

**Gesamturteil:** Forschungs-/Trainingslauf erfolgreich ✅. Das konservative Q-Gate ist die derzeit beste getestete Variante gegen harte Verteidiger, aber vollständige strategische Mehrzugplanung und sichere Übertragbarkeit in die Live-KI stehen noch aus.
