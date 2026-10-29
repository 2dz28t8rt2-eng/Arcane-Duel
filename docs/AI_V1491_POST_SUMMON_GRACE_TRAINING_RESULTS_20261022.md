# Arcane Duel – KI-Trainingslauf v14.9.1: geprüfter Abschlussbericht

**Datum:** 22. Oktober 2026
**Actions-Lauf:** [#39755628662](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39755628662)
**Quellcommit:** `41151f4c4d8ea5203750a4dc4a12fd144fb5eecf`
**GitHub-Aktionsstatus:** `completed / success`
**Vollständige Originaldaten:** [arcane-v1491-postsummon-grace-matched-training, Artifact 12414953881](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39755628662/artifacts/12414953881) (`report.json`, `selection.json`).
**Code:** `tests/ai-v1491-postsummon-opening-grace-training.cjs`, isolierte Forschungsumgebung auf `development`.

## Prüfentscheidung

**Technisch bestanden. Strategische KI-Promotion abgelehnt. Startzug-Schonfrist nicht freigeben.**

Die neue nachbeschwörungsbasierte Analyse bewertet tatsächlich legale Aktionsalternativen, erzeugt aber **keine einzige Auswahländerung** relativ zum bisherigen v14.8.8-Entscheider. Die beiden getesteten Counterplay-Gewichte verhalten sich im Training identisch. Die Turn-1-Zerfalls-Schonfrist verändert die Gesamt-Siegquote der Kandidatenpolitik geringfügig, **aber nicht die Startergewinnrate**. Die echte Wächter-Seelenzehrer-Rollenmechanik funktioniert in einem gesonderten Kontrollzustand; die neutralisierten Matches sind **kein Nachweis für die Stärke eines echten gemischten Wächter-Seelenzehrer-Decks**.

## Datenumfang und Training

Zwei Parameter für die gewichtete Auswertung von sichtbaren Gegnerantworten:

| Antwortgewicht | Siege / Partien | Trainingsquote | Boardprüfungen nach Beschwörung | Vertiefte Bewertungen | Tatsächlich andere Aktionen gegenüber v14.8.8 |
|---:|---:|---:|---:|---:|---:|
| 0,25 | 18/28 | 64,29 % | 110 | 14 | 0 |
| 0,80 | 18/28 | 64,29 % | 110 | 14 | 0 |

**Auswahl:** `0.25`, nach vorab festgelegtem Tie-Break; **nicht** aufgrund nachgewiesener Überlegenheit.

28 Partien je getesteter Einstellung sind wiederholte Paarungen der gleichen Trainingsszenarien; insgesamt 56 ausgewertete Trainingsdurchläufe.

## Getrennter unabhängiger Holdout

Jeweils 84 Matches für die beiden Regelarme: 21 andere Decks × beide Starter × beide Kandidatensitze. Zusätzlich 84 alte-KI-gegen-alte-KI-Matches als Baseline (42 pro Regelarm).

| Messung | Schonfrist aus | Schonfrist an |
|---|---:|---:|
| Kandidatensiege / 84 | 40 (47,62 %) | 44 (52,38 %) |
| Starter siegt / 84 | 22 (26,19 %) | 22 (26,19 %) |
| Festes Spielfeld-Sitzplatz-0 gewinnt / 84 | 42 (50,00 %) | 42 (50,00 %) |
| Board-Neubewertungen nach Beschwörungen | 357 | 352 |
| Legale vertiefte Aktionen bewertet | 56 | 62 |
| Kandidat wählt andere Aktion als v14.8.8 | **0** | **0** |
| Insgesamt betrachtete Handlungsalternativen | 124 | 140 |
| Ungültige Aktionen | 0 | 0 |

**Gesamt:** 84/168 = 50 % für neue KI gegen die eingefrorene v14.7-Referenz, vermischt über die zwei **verschiedenen** Regelarme. Diese 50 % sind **nicht direkt** mit dem v14.8.8-Ergebnis 90/168 aus anderer Szenarienkohorte vergleichbar.

Die scheinbare Verbesserung um 4 Siege zwischen den Regelarmen darf nicht als KI-Lerneffekt interpretiert werden, weil **die neue zusätzliche taktische Bewertungslogik 0 andere Aktionen erzeugt**. Die Änderung könnte mit den Regelvarianten zusammenhängen; kleinere Sample-/RNG- und Simulationsbesonderheiten sind nicht ausgeschlossen.

## Startspieler-Kontrolle (Referenz gegen sich selbst)

| Startspieler gewinnt | Schonfrist aus | Schonfrist an |
|---|---:|---:|
| Baseline in 42 Matches | 10 (23,81 %) | 12 (28,57 %) |

Der Unterschied ist **2 von 42 Matches** und nicht robust. In Kandidat-gegen-Referenz-Matches bleibt die Quote **exakt 22/84 (26,19 %) in beiden Armen**. Das starke Zweitzugsignal bleibt bestehen. Unabhängig davon gewann der fixe Sitz 0 42/84 Matches und ist damit ausgeglichen.

### Mögliche andere Ursachen

- **Erste Angriffsmöglichkeit:** Die echte Engine verbietet Angriffe in globalem `g.turn===1`, erlaubt sie aber ab `g.turn===2`. Spieler 2 bekommt dadurch zuerst eine Angriffsmöglichkeit. Der Zerfalls-Schalter greift hier nicht.
- Die Testarena setzt anfängliche Schutzschilde bei beiden Seiten auf 0 und neutralisiert Spezialfähigkeiten; das unterscheidet sich von gewöhnlichen PvE-Duellen. Sie prüft daher nicht pauschal die Live-Karriere-Balance.
- Eröffnungsposition, Beschwörungslimit, Fusions-Zufall und Reihenfolge der Nachziehaktionen können zusätzlich relevant sein; aus dieser Testserie lässt sich ihre jeweilige Ursache nicht isoliert quantifizieren.

## Wächter und Seelenzehrer: positive mechanische Kontrolle

Bei aktivierten Rollen und `essenceRules=true` wurden in einem gezielt präparierten, verletzten Seelenzehrer-Zustand gemessen:

| Ausgangszustand: Seelenzehrer DEF 10 | Nächster Wert | Nettogewinn |
|---|---:|---:|
| Ohne Wächter | DEF 10 | +0 |
| **Mit Wächter daneben** | **DEF 47** | **+37** |

Dieser Test bestätigt eine **tatsächliche Wächter-Heilwirkung auf den Seelenzehrer** in dieser Situation und beachtet die echten aktiven Rolleffekte. **Es war kein vollständig ausgespieltes Mischdeck-Duell**, kein normaler Kampfverlauf und kein vollständiger Erfolgsnachweis der gesamten Seelenraub-, Gegenschlag- und Skillkombo.

Der Katalog hatte im Test ausreichend echte Rollen-Karteneinträge (101 Guardian-, 63 Soul-Karten, Fusionen/ACE ausgenommen), aber ihre tatsächliche Besitzbarkeit bzw. Turnier-Stufe muss für spätere Deckvergleiche gesondert geprüft werden.

## Fehlerfreiheit und Nachvollziehbarkeit

Der Job und alle Schritte, darunter validierte Regeltests, unveränderte historische Referenzdaten, Training, Holdout-Gates und Report-Upload, endeten mit `success`. Keine illegalen Aktionen in 168 Holdout-Duellen. Ein anfänglicher Workflowversuch war wegen eines ungünstig vorbereiteten DEF-Probeszenarios fehlgeschlagen; der korrigierte Lauf #39755628662 ist der **bestanden geprüfte finale Lauf**.

## Empfehlungen für v14.9.2

1. **Boardplaner zur echten Verhaltensänderung bringen:** Harte nachbeschwörungsbasierte Konfliktzustände und manuell überprüfte Alternativaktionen integrieren: Angriffsreihenfolge, gefährliche Wächter in DEF, Seelenraub als Initiative, Schutz der geladenen DEF-Träger, gegnerischer ACE und Endzug. Messwert muss mindestens eine **korrekte und vorteilhafte** Kandidatenabweichung auf unabhängigem Holdout sein; reine Planeraufrufe genügen nicht.
2. **Aktive Mischdecks:** Vollständige 40-Karten-Konstruktionen mit zulässigen Wächter/Seelenzehrer-Anteilen (z. B. 60:40, 50:50, 40:60), gleichen legal verfügbaren Ressourcen und aktivierten Skills/Perks gegeneinander. Nicht wieder aus isolierten Soul-Benchmarks auf Rollenbalance schließen.
3. **Starterursache getrennt untersuchen:** 2×2- oder 2×3-Faktoriell-A/B: Zerfalls-Schonfrist × erste Angriffsmöglichkeit/Anfangsschild, gepaart auf Deck, Starter, Zugreihenfolge, Fusion-RNG; keine ungültige Vorabänderung der normalen Spielregeln.
4. **Leistungsnachweis:** Nicht nur Gesamt-Winrate, sondern per Aktion objektiv gemessene LP/DEF/ATK, verlorene Ressourcen, Boardüberleben, Fehler und echte Counterfactual-Winrate verwenden. Erst nach mehreren neuen unabhängigen Seeds/Decks und Nichtregression pro Stil an eine Promotion denken.
5. **Aus vergangenen Runs lernen:** Gewählte Aktion, alle legalen Alternativen, korrekt sichtbaren Zustand, Folgeaktionen und Ausgang als wiederverwendbare Trainingsdaten speichern. Frühere aggregierte Reports ohne rekonstruierbare Aktionszustände sind für Replay-Lernen ungeeignet.

**Freigabe:** Keine automatische `main`-Integration; `openingDecayGrace` bleibt standardmäßig **aus**. Die neue Forschungspolitik ersetzt nicht den Produktiv-Champion. Weitere Forschung soll auf einem neuen Protokoll erfolgen, das tatsächliche Entscheidungsverbesserungen ausweist.
