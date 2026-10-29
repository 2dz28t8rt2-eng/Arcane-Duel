# Arcane Duel – KI v13.8: Decision-Replay-Curriculum und Gegenproben

**21.10.2026 · Branch `development` · Ergebnis: vollständiger Workflow SUCCESS, Kandidat nicht qualifiziert.**

- [GitHub Actions #39642462976](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39642462976)
- [Archiv mit allen Entscheidungs- und Ergebnisdaten](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39642462976/artifacts/12365881460)
- Trainingsimplementierung: `tests/ai-curriculum-learning-v138.cjs`
- Workflow: `.github/workflows/ai-curriculum-learning-v138.yml`
- Startchampion unverändert: `models/ai-selfplay-v136.json`.

## Tatsächlich umgesetzt

1. Die drei Originalberichte aus v13.6 und der vollständig belegte v13.7-Historienbericht wurden geladen. Historische Statistiken dienen **nur zur Priorisierung von Lehrinhalten**, da die früheren 120 Gradienten-Replay-Einträge keine exakten Spielsituationen enthalten.
2. Trainings-Szenarien verwenden **echte regelkonforme Engine-Aktionen** mit zwei verschiedenen legalen Entscheidungen aus einem identischen Ausgangszustand. Jede Option wird unabhängig bis zum Duellende ausgespielt.
3. Neue Replay-Einträge enthalten Seed, konstruierte Karten-/Fusionsdecks, Tier, Archetyp, Startspieler, Beobachtung vor der Entscheidung (eigene Hand, sichtbare Boards/LP), Alternativen, Feature-Bewertungen, Ergebnispaar und Stichproben der tatsächlichen Vorher-/Nachher-Zustände. Verdeckte gegnerische Hand-/Deckinhalte werden nicht in die Beobachtung aufgenommen. Die Entscheidungsprotokolle sind in `artifacts/v138/decision-replay.json` gespeichert.
4. Ein **trainingsseitiger paarweiser Update-Schritt** verändert die 15 Gewichte, wenn sich ein alternativer Ausgang ausreichend unterscheidet. Der neue Kandidat wird **vor dem Holdout eingefroren**; Holdoutdaten beeinflussen die Gewichte nicht.
5. 30 neue unabhängige Decks/Seeds mit Seitenwechsel, 15 Boss-Sparringsituationen sowie eine kleine Spezialistenliga prüfen den Kandidaten.

## Abschlusszahlen

| Kennzahl | Ergebnis |
|---|---:|
| Geplante Trainingsszenarien | 84 |
| Tatsächlich paarweise nachgestellte Situationen | **81** |
| Ausgeführte Gewichtsaktualisierungen | **30** |
| Zusätzliche Holdout-Mirror-Duelle | **60** |
| Siege des neuen Kandidaten gegen Champion | **17/60 = 28,3 %** |
| Siege des Champions im direkten Vergleich | **43/60 = 71,7 %** |
| Boss-Holdout mit identischen Szenarien (VII/IX/X gesamt) | **0/15 Kandidat vs. 7/15 Champion** |
| Spezialisten-Liga | Offensiv 11/24; DEF 9/24; Fusion 10/24 |
| Abgelehnte Engine-Aktionen | **0** |
| Produktive Gegner verändert | **Nein** |
| Neues Modell automatisch übernommen | **Nein** |

## Bewertung

**Positiv:** Das Experiment liefert erstmals zusätzliche *neue* reproduzierbare Entscheidungsbelege, nicht nur aggregierte Siegerzahlen. Regeln, legaler Aktionsraum und train/holdout-Trennung sind durch den Testlauf abgesichert.

**Negativ:** Die Gewichtsoptimierung führte zu einer schweren Leistungsverschlechterung. Ein einziger alternativer Matchverlauf ist ein schwaches Trainingssignal: Es können Folgeaktionen, Zufall und Gegenspiel reagieren. Besonders LP-Differenzen trotz unverändertem Sieger wurden als Lernsignal verwendet; daraus folgt nicht, dass die ursprünglich gewählte Aktion objektiv falsch war. Das neue Modell ist nur ein **nicht promoteter Forschungskandidat**.

**Methodische Einschränkung:** Die aufgezeichneten Nachher-Zustände sind Stichproben von bis zu 72 Aktionen pro Match und kein vollständiger chronologischer Replay aller bereits früher gespielten Partien. Die Decks sind quellenkonform konstruierte taktische Benchmarks, **keine** im Karriereverlauf tatsächlich verdienten Inventare. Die Aussagen über IX/X-Bossfähigkeit bleiben entsprechend begrenzt.

## Konsequenz für v13.9

1. **Keine unkontrollierte Gewichtsverschiebung nach einem einzigen Duellpaar.** Alternativen mehrfach über neue Seeds/Verzweigungen prüfen und Unsicherheiten protokollieren. Lehren getrennt nach Beschwörung, Angriff, DEF/Support, Fusion und ACE auswerten.
2. **Engine-basiertes 2–3-Zug-Lookahead** mit nachprüfbarer Folgeplanung gegen Verteidigung/Zerfall/ACE entwickeln. Gegen unbekannte gegnerische Hand nur öffentliche Informationen und regelkonforme Sampling-Simulationen einsetzen.
3. **Lehrplan nach tatsächlicher Abdeckung**: erst echte Fusions- und Positionslehren, dann Wächter/Soul-Drain/Resonanz/Pokerboni und LV1-Sondermechanik. Nicht geprüfte Spezialaktionen nicht als „erlernt“ zählen.
4. **Lernen und Evaluation strikt getrennt**; viele Decktypen, Liga gegen eingefrorenen Champion und unabhängige Bossprüfung. Erst bei belastbarer Verbesserung neues Modell freigeben.
5. Historische Paarentscheidungen **versioniert wiederverwenden**, neue Trainingsdaten exportierbar und mit aktuellem Regel-Commit versehen. Ein GitHub-Actions-Artefakt ist 90 Tage verfügbar; für Langzeitarchivierung künftig einen dedizierten persistierenden Datenspeicher/Repo-Datei-Export planen.

**Status:** Experiment erfolgreich abgeschlossen, Kandidat verworfen, `development`-Spiel, `main` und produktive Gegner-KI unverändert.
