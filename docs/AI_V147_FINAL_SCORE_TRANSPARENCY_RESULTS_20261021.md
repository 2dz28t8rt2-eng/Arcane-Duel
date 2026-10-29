# Arcane Duel – KI-Prüfbericht v14.7: Verifizierte Entscheidungsbegründungen

**Stand:** 21. Oktober 2026, 22:05 MESZ · **Branch:** `development` · **Workflow:** SUCCESS · **Neue Produktion-KI:** NEIN

- [Erfolgreicher Workflow #39666712311](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39666712311) – Commit `f9bda78eac49b444860c608a7ebed96578e89908`
- [Originales GitHub-Artefakt: report.json, decision-evidence.json, candidate.json](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39666712311/artifacts/12378775061)
- Trainer: `tests/ai-final-score-transparency-v147.cjs`, Workflow: `.github/workflows/ai-final-score-transparency-v147.yml`

## 1. Technische Prüfung

GitHub Actions hat den korrigierten Lauf erfolgreich abgeschlossen, einschließlich Pilot, Hauptlauf, historischer Artefaktprüfung und Archivierung. Alle **86/86 Regressionstests bestanden**, keine Fehltests. 63 source-legale Trainingsszenarien und 63 getrennte unabhängige Holdout-Szenarien; dieselben Startbedingungen und Decks mit vertauschter Sitzposition pro Mirror-Paar. Frühere Originalberichte v14.2–v14.6 wurden für das Curriculum eingelesen und anhand ihrer Schemas geprüft. Ihr Holdout wurde nicht als neues Trainingslabel genutzt.

Der erste v14.7-Pilot (#39666416233) war zuvor wegen einer lokalen Referenz auf die nicht definierte Variable `a` abgebrochen; nach Korrektur des Action-Typ-Zugriffs lief der oben verlinkte Workflow vollständig erfolgreich. Der gescheiterte Pilot zählt **nicht** als Trainingsleistung.

## 2. Trainingsphase – drei Hauptstrategien

| Trainingstyp | Variante | Siege |
|---|---|---:|
| Offensive | `transparent-offense-control` | 18/36 (50,0 %) |
| Offensive | `transparent-offense-safe` | 18/36 (50,0 %) |
| DEF/Wächter/Soul | `transparent-guardian-control` | 18/36 (50,0 %) |
| DEF/Wächter/Soul | `transparent-guardian-drain` | 18/36 (50,0 %) |
| Fusion | `transparent-fusion-control` | 27/54 (50,0 %) |
| Fusion | `transparent-fusion-reserve` | **28/54 (51,9 %)** |

Je Gruppe wurde ein Profil **ausschließlich anhand der neuen Trainingsduelle** gewählt: offensiv `transparent-offense-control`, defensiv `transparent-guardian-control` und bei Fusionen `transparent-fusion-reserve`. Die Unterschiede sind überwiegend null; das eine zusätzliche Trainingsmatch beim Fusionsprofil genügt nicht als Nachweis strategischer Überlegenheit.

## 3. Unabhängige Mirror-Matches – gegen v14.6 und Champion

| Hauptstrategie | Siege gegen v14.6 | Quote |
|---|---:|---:|
| Offensive/Predator/Tempo | 18/36 | 50,0 % |
| Defensive/Guardian/Soul | 18/36 | 50,0 % |
| Fusion/Allrounder/Hybrid | 25/54 | **46,3 %** |
| **Gesamt** | **61/126** | **48,4 %** |

Zusätzlich gegen unveränderten ursprünglichen Champion: **72/126 (57,1 %)**. Dieser Vergleich überschreitet isoliert die formale 56-%-Grenze, aber der Kandidat verfehlt die 53-%-Anforderung gegen den vorigen Planer und die Boss-Schwelle. Bei 126 Partien ist auch der 57,1-%-Wert kein hinreichender Beweis für robusten Vorteil.

## 4. Bosse VII, IX und X

| Boss | v14.7 | v14.6-Kontrolle | Champion | Spiele je Controller |
|---|---:|---:|---:|---:|
| VII | 4 | 4 | **5** | 11 |
| IX | 1 | 1 | 1 | 10 |
| X | **0** | **0** | **0** | 11 |
| **Gesamt** | **5/32** | **5/32** | **6/32** | **32** |

Alle Kontrollen spielen identische Szenarien; die neuen Profile schaffen auch hier keine belegbare Verbesserung. Gegner X bleibt ein ernstes Problem. Im Vergleich zu v14.6 sind andere Seeds, Pools und 32 statt 42 Boss-Szenarien verwendet worden; Ergebnisquoten sind nicht unmittelbar als historische Rangverbesserung zu interpretieren.

## 5. Experten-Gegner

| Spezialist | Siege der Kandidaten-KI |
|---|---:|
| Offensiv | **19/24 = 79,2 %** |
| Defense/Support | **20/24 = 83,3 %** |
| Fusion/Ökonomie | **19/24 = 79,2 %** |

Das ist erfreulich, doch handelt es sich um getrennte Gegnertypen mit 24 Duellen je Spezialist. Diese Ergebnisse ersetzen die fehlende Verbesserung in den direkten Mirror-Matches nicht.

## 6. Das neue Transparenz-Audit – wichtigster echter Fortschritt

**Verifizierte Originaldaten:** Das Archiv enthält **18 Duell-Perspektiven** mit **63 finalen Lookahead-Entscheidungsvergleichen** und **240 gerankten Aktionsalternativen**. Im ursprünglichen Planer wird der Score jedes Kandidaten **direkt bei seiner Bewertung** aus folgenden Bestandteilen gebildet:

- Linearer Heuristikscore
- Tatsächlicher Wert nach vollständiger Engine-Platzierung
- Erwarteter Nutzen einer legal möglichen Folgeaktion
- Öffentlich sichtbarer Gegnerdruck
- Verbrauch eigener Fusionsmaterialien
- Verbrauch einer Fusion aus der Reserve
- Tempobonus bei Angriff
- Abzug für Zugende

**Rechenintegrität:** **0 Score-Rekonstruktionsfehler** in den erfassten Prüfungen; die im Archiv auf sechs Dezimalstellen gerundeten Komponenten weichen maximal geringfügig (rund `1,1 × 10⁻⁶`) vom auf sieben Stellen gerundeten Endwert ab.

**Aber entscheidender Befund:** **0 von 63** erfassten gleichen Boardentscheidungen ergeben eine andere Aktion, wenn dieselben simulierten Endzustände und Alternativen mit dem v14.6-Profil gewichtet werden. Das ist ein eingeschränkter **Same-Outcome/gleiche Kandidaten**-Vergleich, kein unabhängiges erneutes v14.6-Engine-Spiel mit garantiert identischem Zufallspfad.

**Unbedingt beachten:** **Alle 63 direkt aufgelösten Score-Vergleiche stammen aus `summon`, nur aus den eigenen ersten sieben Zügen**. **59** gewählte Aktionen sind normale Beschwörungen und **4** sind Fusionen. Derzeit gibt es **keine entsprechend detaillierten finalen Score-Begründungen für `attacks`**, Soul-Drain oder Wächter-Heilung. Diese Lücke darf nicht als vollständige Transparenz aller drei Strategien bezeichnet werden.

### Ein reproduzierbares Beispiel aus dem Originalartefakt

Predator, Tier VII, eigener Zug 1, legal gleiche Hand/gleicher Startseed:

- **Gewählt:** `normal`, Karten-UID `15`, finaler Score `1.8754653`.
- Beiträge: `linear 0.338321`, `postPlacement 1.537144`, übrige Komponenten 0.
- Andere legale Option, **Fusion** `uids [13,15]`, Fusion `choice 65`: finaler Score `1.1725764`, inklusive **Materialabzug −0.13** und **Fusionsreserve −0.05**.
- Unter exakt denselben Kandidaten und Fusionsausgängen würde auch das v14.6-Gewicht die Normalbeschwörung bevorzugen.
- **Interpretation:** Die KI kann nachvollziehbar angeben, warum ihr heutiger Bewertungsalgorithmus in dieser Position eine Normalbeschwörung der Fusion vorzieht. Das beweist nicht, dass dies der langfristig beste Zug war.

## 7. Geplante und tatsächlich umgesetzte Aktionen

Über unabhängige Mirror-Holdouts:

| Kennzahl | Anzahl |
|---|---:|
| Registrierte Folgeaktionsabsichten | **537** |
| Später gleicher Aktionstyp erfolgreich | **533/537 = 99,3 %** |
| Exakt gleiche Aktionssignatur (UID/Ziel/Slot) | **354/537 = 65,9 %** |
| Geplant, aber nicht exakt so umgesetzt | **183/537 = 34,1 %** |

Nicht jede Folgeaktionsabsicht ist eine tatsächlich ausgeführte Folgeaktion; sogar ein exakter Signaturvergleich beweist nicht, dass die geplante taktische Wirkung erreicht wurde. Insbesondere sind unterschiedliche spätere Boardzustände und mehrere Aktionen desselben Typs möglich.

In weiteren **180 kurzen Entscheidungsnotizen** aus den 18 Spielperspektiven waren **25** mit einer finalen Lookahead-Erklärung versehen; **155** wurden ausdrücklich als lineare Bewertung oder Engine-Fallback gekennzeichnet. Die Zahl 63 bezieht sich auf die detaillierten Score-Rankings, nicht auf 63 vollständig über alle Phasen erklärte Duellentscheidungen.

## 8. Bewertung – Transparenz gewonnen, Spielstärke stagniert

**`promotionEligible:false` und `productionIntegrated:false`.** Keine Veränderung an produktiver KI, Main-Branch, Spielbalance oder unveränderten 15 Champion-Gewichten. 86/86 Tests und vollständige Lern-/Quellenarchivierung sind ein technischer Erfolg. Der Spielstärkenvergleich gegen v14.6 ist jedoch **61/126 = 48,4 %**, die Bosse **5/32 vs. 6/32 Champion**, und in 63 genauer geprüften Bewertungssituationen haben die neuen Profile überhaupt keine andere erste Aktion hervorgerufen.

### Empfehlung für v14.8

1. **Echte entscheidungswirksame Änderungen nachweisen:** Nicht mehr nur win-rate oder Scores verändern. Für drei Hauptstrategien getrennt die tatsächlichen **neuen legalen Zugwahlen** gegenüber v14.6 und einer lineareren KI zählen – in Beschwörungs-, Positions- **und** Angriffsphase.
2. **Blindstellen beseitigen:** Den finalen Score und die eigene Alternativenliste auch für **Angriffsziele, Soul-Drain, Heilung, Umschalten in DEF und temporäre Zustände** protokollieren. Kein Erfolg darf aus einem `end/switch`-Fallback ohne Begründung behauptet werden.
3. **Persistente Replay-Lektionen erstellen:** Quell-Commit, Deckfingerprint, Seed, aktives Feld und eigene Hand, vollständiges Legal-Set, alle Scorekomponenten, konkret geplante und wirklich gespielte Aktion, unmittelbar und später beobachtete Zustandsänderung, Gewinner. Nur tatsächliche historische Einzelzustände, keine erfundenen Best-Action-Labels.
4. **Gegenfaktische Prüfungen**: Bei wenigen echten Alternativentscheidungen **mehrere neue Seeds und vollständige Folgepositionen** aus der echten Engine vergleichen, um den Nutzen und die Fehlerursache zu untersuchen. Historische Holdouts sind tabu für das Fitting.
5. **Rollenbezogene Taktik-Lektionen**: Offensiv – Angriffsziele/Risiko; Defensive – Heilung/Seelenentzug/DEF; Fusion – Material- und Tempoertrag, Rollen-/Resonanz-/Zerfallsbonus. Vor jeder weiteren großen Trainingsserie die Wirkung auf die Aktionswahl belegen.
6. **Boss VII und X strukturiert auf Kartenqualität, ACE, Fusionsmöglichkeiten und realistische Levelverteilung prüfen.** Keine Schwäche durch künstliches Zufallssampling oder ungeeignete Testdecks als vermeintlichen Entscheidungsfehler labeln.

**Endurteil:** Das erklärbare Bewertungssystem ist jetzt wesentlich ehrlicher und technisch auditierbar. Die KI ist jedoch weiterhin nicht bewiesenermaßen stärker geworden; ohne **echte alternative Aktionen** führen weitere bloße Profilanpassungen zu wenig Fortschritt.
