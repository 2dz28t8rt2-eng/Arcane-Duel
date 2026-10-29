# Arcane Duel – Stand der Kampfregeln und KI-Forschung

**Aktualisiert:** 2026-10-29 · Branch `development` · Solo-Gegenschlag-Nerf v17.2 / KI-Forschung v17.1

Dieses Dokument trennt **bestätigt im Spiel implementierte Regeln** von **nur simulierten Forschungsregeln**. `development` ist nicht automatisch `main`; eine Übernahme in die veröffentlichte Version muss gesondert geprüft werden.

## A. Im Spielcode hinterlegt (verifiziert in `assets/essence-combat.js`)

| Regel | Implementierter Wert / Zustand | Quelle |
|---|---|---|
| Predator-Rüstungsdurchdringung | Standard **10 Prozentpunkte** gegen Verteidiger in DEF; eine explizite symmetrische Trainingsoption kann separat andere Werte vorgeben | `predatorPierce` |
| DEF-Rüstung einzelner Wächter/Seelenzehrer | **20 %** vor Durchdringung | `mitigation` |
| DEF-Rüstung bei aktivem Wächter-/Seelenzehrer-Bund | **35 %** vor Durchdringung | `soulBonds` / `mitigation` |
| Passiver Seelenentzug | Pro getroffenem Gegner **10 ATK und 10 DEF** als Grundentzug plus levelbasierte 5er-Schritte (gedeckelt durch verbleibende Werte), ohne Predator-/Fusionsrollenbonus | `absorb` |
| Aktiver Seelenraub | Basisbudget `floor((20 + 5 * Level) * 2.5)`, unabhängig vom Zieltyp; dreizügiger Cooldown | `soulRaid` |
| Aktive Seelenfähigkeiten | Nur in **DEF-Position** verfügbar; Forschung beachtet dieselbe Einschränkung | `soulRaid`, `researchSoulAction` |
| **Solo-DEF-Gegenschlag (Wächter/Seelenzehrer)** | **35 % des effektiven ATK-Wertes**, ausschließlich wenn der Verteidiger den Treffer überlebt und nicht angriffsimmun war; zerstörte Monster schlagen **nicht** mehr zurück | `attack` / `attackPlan` in `assets/essence-combat.js` · **seit Solo-v17.2 auf `development`** |
| Essenzspeicherung | Aus **tatsächlich abgezogenen** Werten nach normalen Speicher-/Konversionsregeln, ohne zusätzlichen Fusions-Speichermultiplikator | `storeDrainedEnergy` |

Die Werte können von `main` abweichen. Dieses Dokument macht keine Aussage darüber, dass alle übrigen Solo-/2v2-Funktionen bereits vollständig implementiert oder released sind.

### Solo v17.2 – Gegenschlag-Nerf aus Spielerfeedback

- **Bereits im regulären Solo-Spielcode auf `development` umgesetzt:** 50 % → **35 % ATK** direkter Gegenschlag für Wächter und Seelenzehrer. Voraussetzung: Das Monster überlebt den gegnerischen Angriff; bei Zerstörung **0 Gegenschaden**. Immunität `guardLeft` bleibt von Gegenschlägen ausgeschlossen.
- **Ebenso im Spielcode angepasst:** Der gegnerische KI-Angriffsplaner kalkuliert den reduzierten 35-%-Gegenschlag und keinen Gegenschlag von regulär tödlich getroffenen Verteidigern.
- **Browser-Cache aktualisiert:** `index.html` lädt `assets/essence-combat.js?v=20261029-v2072-counter35`.
- **Unverändert:** Andere aktive Verteidigerfähigkeiten, Soul-Heilung, Verteidigungsrüstung, Fusion, Produktions-Predator-Durchdringung 10 Prozentpunkte und gewöhnlicher Seelenentzug. **2v2** wurde durch diesen gezielten Solo-Patch nicht verändert.
- **Separat weiterhin Forschung:** 15-Prozentpunkte-Predator-Durchdringung, zielabhängiger Seelenentzug 90/100/120 %, reduzierte Wächter-zu-Wächter-Heilung 85/75 % sowie noch nicht beförderte KI-Modelle. Diese Forschungsvarianten werden nicht automatisch in den Solo-Spielcode übernommen.
- **Abnahme:** [Solo-v17.2-Gegenschlag-QA](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40946070508). Die QA prüft überlebende und zerstörte Wächter/Seelenzehrer, Immunität, KI-Bedrohungsbewertung und vorhandene Combat-Regressionen.

## B. Als künftige Spielbalance gewünscht, **derzeit NUR in der Forschung**

**Ausgewählte v17.0-Testkonfiguration:** `predator15Triad90` aus
`tests/helpers/research-role-balance-v169.cjs`, definiert in
`tests/ai-v1700-research-baseline.cjs`.

| Maßnahme | Gewünschter Forschungswert | Produktion |
|---|---|---|
| Predator-Durchdringung | **15 Prozentpunkte** | Nicht übernommen |
| Tatsächlicher Seelenentzug gegen gewöhnliche, nicht fusionierte Predatoren | **90 %** | Nicht übernommen |
| Tatsächlicher Seelenentzug gegen Wächter / Seelenzehrer | **100 %** | Unverändert |
| Tatsächlicher Seelenentzug gegen sonstige gewöhnliche Monster | **100 %** | Unverändert |
| Tatsächlicher Seelenentzug gegen echte Fusionswesen | **120 %** | Nicht übernommen |
| Monster mit `fusion===true` und Predator-Rolle | **Fusion hat Vorrang** → 120 % Entzug | Nur Forschung |
| Speicherung nach Entzug | Keine Zusatzmultiplikation; nur tatsächlich entnommene ATK-/DEF-Werte | Unverändert |
| 55-%-Gegenschlag vs. Fusion | Im v16.7-A/B-Test untersucht, **zurückgestellt** | Nicht übernommen |

### Zusatzexperiment v17.1: Wächter-Heilung nach Empfängerrolle

**Nur Offline-KI-Forschungsumgebung**, kein Patch der produktiven Datei `assets/essence-combat.js`. Die unveränderte Testbasis ist `predator15Triad90` (15 Prozentpunkte Predator-Durchdringung; echter Seelenentzug 90 % Predator, 100 % Verteidiger, 120 % Fusion).

| Empfänger einer Wächterheilung | v17.1 Kontrollgruppe | Mild | Vorzugsvariante |
|---|---:|---:|---:|
| Anderer Wächter in DEF | 100 % | 85 % | **75 %** |
| Seelenzehrer in DEF | 100 % | 100 % | **100 %** |
| Eigener Wächter | Keine Selbstheilung | Keine | Keine |
| Heilungs-Cap / max DEF | Unverändert | Unverändert | Unverändert |

Die bestehende Heilformel `min(150, 25 + Level × 12)` und die effektive Begrenzung durch das verbleibende DEF-Maximum bleiben erhalten. Die Reduktion erfolgt **nur** bei Heilempfängern der Rolle Wächter. Die 75-%-Variante ist eine **Forschungshypothese**, keine bestätigte Spielbalance.

**v17.1 abgeschlossen:** [GitHub Actions #40933610167](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40933610167), **40/40 Jobs erfolgreich**, **69.120 Duelle** (23.040 je Variante). Im gezielten 16-Spiele-VALIDATION-Vergleich (Defender-Survival) gegen Predatoren: reine Wächter **8/16 → 9/16** (100 % → 85/75 % Heilung), gemischt **6/16 unverändert**. Im HOLDOUT gegen Predatoren: reine Wächter **11/16 unverändert**, gemischt **9/16 unverändert**. Gegen Fusionen: reine Wächter VALIDATION **9 → 8/16**, HOLDOUT **8 → 6/16**, gemischt **10/16 VALIDATION und 9/16 HOLDOUT unverändert**. Damit zeigt sich bislang **keine Verringerung der reinen Wächter-Dominanz gegen Predatoren**, aber ein günstigerer relativer Mix gegen Fusionen. Je Fokusvergleich nur 16 Duelle.

**Generelle Defender-Survival-Ergebnisse (Siege von jeweils 512):** 100 % Wächterheilung **270/274/274** (TRAIN/VALIDATION/HOLDOUT), 85 % **274/275/274**, 75 % **273/275/271**. Die 75-%-Variante hat im HOLDOUT **3 Siege weniger** als 85 %, ohne bessere fokussierte Rollenresultate. Die paarweisen Stage-8-Veränderungen bestätigen wirksames, aber kleines Signal: von 2.304 Partien 100 %↔85 % **60** geänderte Sieger, 100 %↔75 % **74**, 85 %↔75 % **34**; bei 85 %↔75 % lagen 29 Änderungen im TRAIN, drei in VALIDATION und zwei im HOLDOUT.

**Kein Champion-Aufstieg:** alle Kandidaten verfehlen die direkten H2H-Hürden und den Nachweis `mixedBeatsBothPure`. Eingefrorener Champion bleibt `l10-guarded-worst-reply`. Frische Modelle aus TRAIN-only je **1.280** Duellen (20/21/17 Kontextwerte). Kein automatischer Regel- oder KI-Import. **Forschungsempfehlung:** 85 % als vorsichtigeren Kandidaten offenhalten, 75 % nicht produktiv übernehmen; künftig tatsächliche Heilungsereignisse, Häufigkeit der Wächter-zu-Wächter-Regeneration, Seelenbund-Vorteile und mehr unabhängige Rollenduelle instrumentieren, statt vorzeitig erneut Werte zu verschieben.

**Designziel:** Reine Wächter- und reine Seelenzehrer-Decks sollen gegen Predatoren verwundbar sein. Der **reale Wächter-/Seelenzehrer-Bund** soll strategischen Mehrwert haben; Predatoren sollen dagegen gefährlich, aber nicht automatisch überlegen sein. Keine pauschalen Stat-Buffs, nur um ein Zielverhältnis zu erzwingen.

## C. KI-Forschungsstatus

- **v16.9:** 138.240 Duelle, sechs Varianten, GitHub Actions #40917461921 erfolgreich; neu erzeugtes TRAIN-only Endgame-Modell für `predator15Triad90`.
- **v17.0 Basisprüfung:** GitHub Actions #40926000841 erfolgreich.
- **KI-Champion:** `l10-guarded-worst-reply` bleibt eingefrorene Referenz, bis ein Kandidat sämtliche unabhängigen Aufstiegstests erfüllt.
- **v17.0-Trainingslauf abgeschlossen:** [GitHub Actions #40927268085](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40927268085), **27/27 Jobs erfolgreich**, **46.080 vollständig ausgewertete Duelle** (je 23.040 `cold` und `learned`), dieselben 15/90/100/120-Testregeln und gepaarte Szenarien.
- **Lernmodell v16.9 nachgewiesen aktiv:** `learned` lud **20 nichtnull Kontextwerte** aus v16.9 TRAIN; z. B. **510 Endgame-Lernwert-Anwendungen** bei `defender-v1700-survival-control`, gegenüber **0** bei `cold`. Dennoch erzielten beide Varianten **dieselben Siegzahlen** in Training, Validierung und Holdout: Defender-Survival **279/278/253 von je 512**, Champion **268/269/243**. Im fokussierten Stage-8-Datensatz (2.304 Partien je Variante) änderte sich **kein Sieger**; die 1.280 TRAIN-only Folgepartien erzeugten identische neue 21-Kontextwert-Modelle.
- **Champion-Prüfung:** Keiner der Kandidaten bestand alle Aufstiegsschranken. Defender-Survival verbessert sich in allgemeiner Validierung um **+9** gegenüber eingefrorenem Champion, scheitert aber u. a. an direktem H2H (**+3 Training** statt mindestens +4, **+2 Validierung** statt mindestens +8) und am Nachweis, dass das gemischte Deck beide reinen Kontrollen übertrifft. `l10-guarded-worst-reply` bleibt Champion.
- **Rollenfokus (Defender-Survival, je 16 Partien):** gegen Predator VALIDATION **gemischt 10 / Wächter 9 / Seelenzehrer 8**, HOLDOUT **gemischt 6 / Wächter 6 / Seelenzehrer 5**. Gegen Fusion VALIDATION **gemischt 12 / Wächter 13 / Seelenzehrer 9**, HOLDOUT **gemischt 8 / Wächter 9 / Seelenzehrer 8**. Verbesserung der Rolle-Mischung ist **nicht durchgehend** nachgewiesen; geringe Fallzahl.
- **Nächster Forschungsschwerpunkt:** Kein weiterer pauschaler Stat-Buff. Stattdessen Messung, **wie Lernwert-Bias konkrete Aktionen/Spielzüge verändert**, gezieltes Training von Seelenbund-Überleben und Synergie gegen Predatoren/Fusionen, stärkere direkte Champion-Konter und größere unabhängige Rollen-Vergleiche. VALIDATION/HOLDOUT bleiben nur Bewertung, niemals Training.
- **Spiel- und KI-Übernahme:** Weder Forschungsergebnisse noch vorgeschlagene KI werden automatisch in das reguläre Spiel geschrieben. Ein separater Patch und dessen Abnahme sind erforderlich.

**Wichtig:** Ein erfolgreich beendeter GitHub-Trainingslauf bestätigt ausschließlich die technische Durchführung, nicht die spielerische Überlegenheit einer KI oder die endgültige Balance.
