# Arcane Duel – KI-Prüfbericht v14.2: Entscheidungsabweichungen und Mechanik-Angebote

**21. Oktober 2026 · `development` · GitHub Actions SUCCESS · Champion geschützt**

[Workflow #39647899323](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39647899323) · [Original-Trainingsartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39647899323/artifacts/12368343231)

**Quelle:** original `report.json` und `selector.json` aus dem GitHub-Actions-Artefakt (keine bloße Schätzung aus der Konsole).

## 1. Technischer Status
- Workflow **abgeschlossen: SUCCESS**, erster Versuch, alle Schritte inkl. Artefakt-Upload erfolgreich.
- **42 Regel-/Regressionstests bestanden, 0 fehlgeschlagen**. Legal-Aktionsprüfung der echten Game-Engine im Pilot und Haupttest erfolgreich.
- Vollständige Phase: 70 Trainings- und 84 Holdout-Szenarien. Fünf Aktivierungsstrategien mit Sitzwechsel; 5 × 140 = **700 Trainingstestduelle** (keine neuen 700 Gewichtstrainings).
- Originalberichte v13.6 und v14.1 erfolgreich als Quellen eingebunden; der bewährte Champion `models/ai-selfplay-v136.json` blieb unverändert. **Kein neues Gewichtstraining in dieser Version**: nur die Auswahl einer Aktivierungsregel sollte auf Train-Daten erfolgen.

## 2. Kernbefund: Der Planer weicht fast nie ab

| Planer-Gate | Vergleichbare Entscheidungen | Tatsächlich abweichend | Anteil | Siege im Training |
|---|---:|---:|---:|---:|
| Immer | 537 | **11** | 2,05 % | 69/140 (49,3 %) |
| Beschwörung | 420 | **10** | 2,38 % | 69/140 (49,3 %) |
| Angriff | 115 | **1** | 0,87 % | 70/140 (50,0 %) |
| Verteidigungs-/ACE-Bedrohung | 47 | **1** | 2,13 % | 70/140 (50,0 %) |
| Frühe Angriffe | 22 | **0** | 0,00 % | 70/140 (50,0 %) |

Bei `always`: **526 von 537** Entscheidungen identisch. Die 11 Abweichungen im Überblick: **10× `fusion → normal` in der Beschwörungsphase**, **1× `attack → end`**.

Die wenigen Overrides erklären, weshalb zusätzliche Rechenarbeit praktisch keine abweichende Duellstrategie erzeugt. Das ist ein Befund über den **jetzigen Zwei-Aktionen-Planer**, kein Beweis, dass vorausschauendes Spielen grundsätzlich unwirksam wäre.

## 3. Qualität des gewählten Gates

Der Trainings-Gate benötigte ≥53 % Siege und wenigstens drei tatsächliche Abweichungen. **Kein Gate qualifizierte sich.** Auswahl: `none`; Aktivierungsregeln und 15 Champion-Gewichte wurden **nicht** verändert.

### Unabhängige Holdouts – unveränderte Kontroll-KI

| Prüfbereich | Ergebnis |
|---|---:|
| Spiegelduelle mit gleichem Champion | **84/168** (50,0 %) |
| VII/IX/X zusammen | **15/42** auf beiden Seiten |
| VII | je **11/14** |
| IX | je **3/14** |
| X | je **1/14** |
| Offensiv-Spezialist | **17/32** |
| DEF-/Support-Spezialist | **19/32** |
| Fusions-Spezialist | **22/32** |

**Methodischer Hinweis:** Weil `none` die Auswahl gewann, liefen die Holdouts *ohne neuen Planer* mit identischem Champion. Sie **bestätigen keine Verbesserung des Planers**. Die Boss- und Ligawerte sind ein Kontroll-Benchmark, kein eigenständiger Beweis für neue strategische Lernfähigkeit.

## 4. Mechanik-Telemetrie: tatsächlich angeboten und gewählt

Im Kontroll-Holdout wurden zusammengehörige Entscheidungspunkte erfasst. Angebote zählen Entscheidungskontexte mit dieser legalen Aktionsfamilie; gewählte Aktionen zählen nur ausgewählte Aktionen, die sich im jeweiligen legalen Angebot wiederfinden (Spielersitz 0).

| Aktion | Legale Angebotspunkte | Passende gewählte Aktionen |
|---|---:|---:|
| Normale Beschwörung | 2.010 | 912 |
| Handfusion | 1.808 | 1.098 |
| Angriff | 1.332 | 1.246 |
| Wächter-Heilung | **22** | **14** |
| Seelenentzug | **82** | **70** |

Weitere **224 Angriffsaktionen** entstammten einer Fallback-/Phasenfolge und wurden separat als nicht mit dem anfänglichen Legal-Set übereinstimmend erfasst. Ein fehlender Match gilt nicht automatisch als illegaler Angriff: Die Initialkandidaten und der tatsächlich spätere Phasenzustand können sich unterscheiden.

Die Telemetrie zeigt, dass Wächterheilung und Seelenentzug nicht völlig ignoriert werden. Häufige Nutzung belegt allerdings weder optimale Zielwahl noch strategisches Verständnis.

## 5. Besondere technische Warnsignale

Im ergänzenden unmittelbaren Board-Differenz-Sample `always` waren die heuristischen Deltas:
- **Normale Beschwörung: 409/409 exakt 0.000**
- **Fusion: 420/420 exakt −0.130**
- **Angriff:** überwiegend nicht-null und sowohl positive als auch negative Auswirkungen
- **Seelenentzug:** kleine überwiegend positive Auswirkungen

Das spricht für eine **potenzielle Messverzerrung durch den Zeitpunkt der Zustandsauswertung**: Bei Normalbeschwörung und Fusion könnte die eigentliche Kartenplatzierung bzw. Fusionsergebnis noch nicht im gemessenen Board-Zustand angekommen sein. Ein konstantes Minus für Fusionen könnte den Planer systematisch davon abhalten, ihren strategischen Mehrwert zu sehen. **Das ist zunächst eine begründete Hypothese, noch kein bestätigter Engine-Bug.**

## 6. Nächste Entwicklungsstufe v14.3

1. **Planer-Resolver/Placement-Audit:** In geklonten Spielzuständen legale Normal- und Fusionsaktionen bis nach Platzierung und vollständiger Zustandsauflösung simulieren. Vorher-/Nachher-Board und eingesetzte Materialien durch echte Enginezustände überprüfen; Assertion für tatsächlichen Fortschritt.
2. **Action-Ranking-Audit:** Für jeden der 11 Overrides alle Kandidaten und Zwischenbewertungen ausgeben; warum `fusion → normal` und `attack → end`?
3. **Gezielte Gegenproben an abweichenden Entscheidungspunkten:** Fälle über andere Decks/Startseeds/Antwortvarianten replizieren und Effekte nach Mechanik statt nur Gesamtsieg analysieren.
4. **Feature-Ausbau:** Materialopfer, Fusionserbe, Qualitätswurf, Resonanz, Zerfall, Defender-Heal, Soul-Drain, ACE-Bedrohung, Boardkontrolle und mehrstufiger Vorteil.
5. Erst danach neue gewichtete Kandidaten und unabhängige Holdouts; **kein** automatischer `main`-Merge oder Live-NPC-Rollout.

**Gesamturteil:** Technisch sauberer Test und erstmals klare Fehlerlokalisierung. **Strategischer Fortschritt: diagnostisch ja, nachweisbar stärkere KI nein.** Das wichtigste nächste Ziel ist die Korrektur und Überprüfung der unmittelbaren Fusions- und Platzierungsbewertung.
