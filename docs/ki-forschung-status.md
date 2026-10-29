# Arcane Duel – Stand der Kampfregeln und KI-Forschung

**Aktualisiert:** 2026-10-29 · Branch `development` · Forschungsplanung v17.0

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
| Essenzspeicherung | Aus **tatsächlich abgezogenen** Werten nach normalen Speicher-/Konversionsregeln, ohne zusätzlichen Fusions-Speichermultiplikator | `storeDrainedEnergy` |

Die Werte können von `main` abweichen. Dieses Dokument macht keine Aussage darüber, dass alle übrigen Solo-/2v2-Funktionen bereits vollständig implementiert oder released sind.

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

**Designziel:** Reine Wächter- und reine Seelenzehrer-Decks sollen gegen Predatoren verwundbar sein. Der **reale Wächter-/Seelenzehrer-Bund** soll strategischen Mehrwert haben; Predatoren sollen dagegen gefährlich, aber nicht automatisch überlegen sein. Keine pauschalen Stat-Buffs, nur um ein Zielverhältnis zu erzwingen.

## C. KI-Forschungsstatus

- **v16.9:** 138.240 Duelle, sechs Varianten, GitHub Actions #40917461921 erfolgreich; neu erzeugtes TRAIN-only Endgame-Modell für `predator15Triad90`.
- **v17.0 Basisprüfung:** GitHub Actions #40926000841 erfolgreich.
- **KI-Champion:** `l10-guarded-worst-reply` bleibt eingefrorene Referenz, bis ein Kandidat sämtliche unabhängigen Aufstiegstests erfüllt.
- **v17.0-Trainingslauf gestartet:** GitHub Actions **#40927268085** – **46.080 geplante Selbstspiel-Duelle** (23.040 ohne und 23.040 mit dem TRAIN-only-Endgame-Modell aus v16.9), gleiche 15/90/100/120-Regeln, Seed-, Sitz- und Deck-Szenarien. **Beide Vorprüfungen bestanden.** VALIDATION/HOLDOUT dienen ausschließlich der Bewertung und dürfen weder die KI trainieren noch eine automatische Beförderung auslösen.
- **Ausstehend:** Finaler v17.0-Prüfbericht mit direktem Vergleich und neuen TRAIN-only-Kontextwerten. Vollständiger Lauf und bessere KI-Qualität sind noch nicht bestätigt.
- **Spiel- und KI-Übernahme:** Weder Forschungsergebnisse noch vorgeschlagene KI werden automatisch in das reguläre Spiel geschrieben. Ein separater Patch und dessen Abnahme sind erforderlich.

**Wichtig:** Ein erfolgreich beendeter GitHub-Trainingslauf bestätigt ausschließlich die technische Durchführung, nicht die spielerische Überlegenheit einer KI oder die endgültige Balance.
