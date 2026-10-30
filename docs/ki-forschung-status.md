# Arcane Duel – Stand der Kampfregeln und KI-Forschung

**Aktualisiert:** 2026-10-30 · Branch `development` · Forschungsphase v17.7 erfolgreich abgeschlossen

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
- **Abnahme:** [Solo-v17.2-Gegenschlag-QA](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40946513678) **bestanden**: vier neue Gegenschlag-Tests (Überleben, Zerstörung, Immunität, KI-Bewertung) plus 23 bestehende isolierte Solo-/Seelenbund-Regressionen. Hinweis: Der umfassende Full-UI-Headless-Harness hat separat noch einen `Unexpected token 'else'`-Fehler beim dynamischen Start, obwohl alle indexierten Skripte statisch syntaktisch gültig sind; er bleibt separat zu prüfen.

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

### v17.2 – Gegenschlag-Vergleich nach Spielerfeedback

- **Produktiv im Solo-Code von `development`:** 35 % ATK-Gegenschlag **nur bei überlebendem Verteidiger** (Wächter/Seelenzehrer). Das ist bereits implementiert; **nicht** auf `main` und **nicht** automatisch in 2v2 übernommen.
- **Drei offline experimentelle Vergleichsarme bei konstanten sonstigen Testregeln** (15 Prozentpunkte Predator-Durchdringung, 90/100/120 % entzogenes ATK/DEF): `legacy50` = historischer Gegenschlag 50 % auch bei Zerstörung + volle Wächterheilung; `survivor35` = neuer 35-%-Gegenschlag nur bei Überleben + volle Wächterheilung; `survivor35Heal85` = neuer Gegenschlag + Wächter-zu-Wächter-Heilung 85 %, Wächter-zu-Seelenzehrer-Heilung 100 %.
- **Trainingsdurchgang:** [GitHub Actions #40947684440](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40947684440), **69.120 geplante gepaarte Selbstspiel-Duelle** (23.040 pro Variante), gleiche Seeds, Sitzwechsel und KI-Kandidaten, unveränderte Level-10- und H2H-Champion-Gates. Vorherige nicht validierte Endgame-Lernwerte werden wegen der Regeländerung **nicht** auf die neuen Ergebnisse übertragen; Folge-Lernmodelle entstehen ausschließlich aus aktuellem TRAIN.
- **Forschungsziele:** Verhindert der Survivor-Only-Gegenschlag den Wegwerf-Verteidiger-Exploit? Können Predatoren gegen reine Wächter/Seelenzehrer besser gewinnen, ohne gemischte Decks zu überwältigen? Bringt die 85-%-Heilung unter den neuen Gegenschlagsregeln Vorteile?
- **Status abgeschlossen:** GitHub Actions [#40947684440](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40947684440) **erfolgreich, 40/40 Jobs und 69.120/69.120 Duelle** (je 23.040 in drei gepaarten Forschungsvarianten). **Keine Champion-Beförderung**; `l10-guarded-worst-reply` bleibt eingefroren. **Keine weitere Produktionsänderung**.

**v17.2-Resultat (Defender-Survival, Siege aus jeweils 512 TRAIN/VALIDATION/HOLDOUT-Duellen):** Historisch 50 % `266/251/279`; neuer 35-%-Gegenschlag `264/252/282`; neu mit 85-%-Wächterheilung `263/251/281`. Der neue Gegenschlag verändert nachweislich Duellresultate (im gepaarten Stage-8-Vergleich **131 von 2.304** Siegwechseln, 25 TRAIN / 59 VALIDATION / 47 HOLDOUT); die 85-%-Heilung verändert gegenüber 35 % allein weitere **46 von 2.304** Ergebnisse. Keiner dieser Unterschiede belegt allein eine generelle Überlegenheit.

**Rollenfokus (je 16 Duelle, reine Wächter / gemischt 50:50 / reine Seelenzehrer):** Gegen Predatoren mit neuer 35-%-Regel **VALIDATION 5/9/8 Siege**, **HOLDOUT 10/6/8 Siege**. Gegen Fusionen **VALIDATION 8/8/6**, **HOLDOUT 6/7/8**. Die gemischte Synergie erscheint in der Validierung gegen Predatoren, aber **nicht zuverlässig im unabhängigen Holdout**. Der zusätzliche 85-%-Heilungsnerf ergibt in diesem fokussierten Vergleich keine Validierungsverbesserung.

**Champion-Gates:** Defender-Survival mit 35 % erreicht **+9** allgemeine VALIDATION- und **+6** harte Level-10-Siege gegenüber eingefrorenem Champion, scheitert aber an direktem H2H (**+3 TRAIN statt +4, +0 VALIDATION statt +8**), Guardian-Gate und Sitzparität. Neue Folgemodelle aus **je 1.280 TRAIN-only-Partien** erzeugt (22/21/21 gelernte Kontextwerte bei 50/35/35+85), **noch nicht als neue KI validiert**.

**Forschungsempfehlung:** Solo-Gegenschlag 35 % und Überlebensbedingung auf `development` belassen. 85-%-Heilung vorerst nur Forschungsalternative. Nächstes gezieltes KI-Experiment: Gegnerstärke/Turnier-Exploits mit echten Gegenschlag-Ereigniszählern, separate 40/60-, 50/50- und 60/40-Synergien gegen Predatoren und Fusionen in größeren HOLDOUT-Stichproben, statt weitere pauschale Stat-Anpassungen.

### v17.3 – Aktive Forschungsregel ersetzt den bisherigen 85-%-Heilungsnerf

Die 85-%-Pauschalregel ist **aus dem neuen Forschungsplan gestrichen**. Historische v17.1/v17.2-Befunde bleiben zur Nachvollziehbarkeit archiviert. `assets/essence-combat.js` im regulären Solo-Spiel bleibt zunächst bei **100 % Wächterheilung**; dieser neue Staffelungsversuch wird **ausschließlich im Offline-KI-Simulator** injiziert.

| Wächter gleichzeitig in DEF | `control100` (je aktivem Wächter) | `guardianScale` (je aktivem Wächter) |
|---|---:|---:|
| 1 | 100 % | **100 %** |
| 2 | 100 % | **55 %** |
| 3 | 100 % | **40 %** |
| 4 | 100 % | **33 %** |
| 5 | 100 % | **28 %** |

Die Anzahl umfasst ausschließlich Wächter in **DEF**, die tatsächlich heilen können. Die Staffel gilt für jede Heilung von einem Wächter an einen **anderen Wächter oder Seelenzehrer in DEF**; Selbstheilung bleibt ausgeschlossen. Das ursprüngliche pro-Wächter-Heilbudget `min(150,25+12×Level)` und das DEF-Maximum bleiben bestehen. Erst nach Berechnung des Budgets wird die prozentuale Staffel per `floor` angewandt; effek­tiver Heilempfang hängt weiter von vorhandener DEF-Lücke ab. Wächter in ATK zählen nicht mit.

**Unveränderte Vergleichsbasis:** Aktueller **35-%-Gegenschlag nur bei überlebendem Verteidiger** aus dem regulären Solo-`development`-Code; im Test weiterhin 15 Prozentpunkte Predator-Durchdringung und 90/100/120 % zielabhängiger Seelenentzug.

**v17.3-Trainingslauf abgeschlossen:** [GitHub Actions #40952987191](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40952987191), **27/27 GitHub-Jobs erfolgreich**, **46.080/46.080 volle Duelle** (23.040 unveränderte 100-%-Heilung, 23.040 neue 100/55/40/33/28-%-Heilungsstaffel), gepaarte Seeds, Sitze, KI-Arme, gleiche 35-%-Überlebens-Gegenschlag- und 15/90/100/120-Forschungsregeln. **85-%-Pauschalregel nicht Teil des Laufs.**

**Defender-Survival-KI (je 512 Partien pro TRAIN/VALIDATION/HOLDOUT):** 100-%-Kontrolle **269/271/276 Siege**, Skalierungsstaffel **269/271/278 Siege**. Eingefrorener Champion `l10-guarded-worst-reply` bleibt unverändert. Der Skalierungskandidat erreichte **+10 VALIDATION** gegenüber eingefrorenem Champion, scheiterte jedoch am direkten H2H (**−1 TRAIN statt mindestens +4; +3 VALIDATION statt mindestens +8**) sowie an einem aktiven Zerfalls-Teilgate (**−1**). Keine automatische Champion-Beförderung.

**Fokus Rollenvergleich** (je 16 Partien, reine Wächter / gemischt 50:50 / reine Seelenzehrer): gegen Predatoren **VALIDATION** Kontrolle `7/10/7` vs Staffel `8/9/7`, **HOLDOUT** `9/8/4` vs `8/8/4`; gegen Fusionen **VALIDATION** `5/9/9` vs `7/9/9`, **HOLDOUT** `10/12/11` vs `12/13/12`. In den fokussierten Tests ist **keine zuverlässige Schwächung reiner Wächter** belegt; gegen Fusionen gewinnt die reine Wächtergruppe mit Staffel sogar häufiger. Gemischte Decks halten häufig mit, sind aber gegen Predatoren nicht in beiden Datenteilen überlegen.

**Paarweise Stage-8-Effekte:** Exakt dieselben **2.304 Szenarien** in beiden Varianten; **113 geänderte Gewinner (4,9 %)**, davon TRAIN **34** (26 zugunsten Staffel, 8 zugunsten Kontrolle), VALIDATION **30** (16/14), HOLDOUT **49** (31/18). Der Effekt ist nachweisbar, aber auf die verschiedenen Gegnergruppen verteilt und kein Beweis für das angestrebte Meta. **Kein präziser Zähler für tatsächlich pro Zug geheilte DEF je Wächteranzahl** vorhanden; direkte Ursache einzelner Siege kann daher nicht allein der Staffel zugewiesen werden.

**TRAIN-only-Folgemodelle:** je **1.280 neue TRAIN-Duelle**, **22** gelernte Kontextwerte bei Kontrolle und **23** bei Staffel, **keine HOLDOUT-/VALIDATION-Einspeisung**. Die neuen Folgemodelle sind noch nicht unabhängig als bessere KI evaluiert.

**Fazit und nächster Prüfansatz:** Die Staffel ist technisch korrekt und beeinflusst Spiele, erfüllt aber das Balancingziel „reine Wächter schwächen und gemischte Seelenbund-Decks stärken“ bislang nicht eindeutig. **Noch nicht in das normale Solo-Spiel übernehmen.** Statt blind weitere Werte zu nerfen: tatsächlich ausgeführte Wächter-Heilereignisse und DEF-Regeneration nach Anzahl DEF-Wächter protokollieren, Häufigkeit von 2–5 Wächtern im realen Turnier überprüfen und größere, gepaarte Rollen-/Seelenbund-HOLDOUT-Tests mit verschiedenen Mischungen durchführen.

### Methodischer Nachtrag zur v17.3-Auswertung (geprüft anhand der Original-Artefakte)

Die zunächst kontraintuitiven zusätzlichen Siege durch die 100/55/40/33/28-%-Heilungsstaffel sind **kein Beleg, dass reduzierte Heilung einen Wächter mechanisch stärkt**. Die Heilungsformel reduziert pro Quelle den tatsächlich möglichen Heilbetrag monoton, wenn alle anderen Spielzustände identisch bleiben.

**Vier konkrete Einschränkungen der bisherigen Schlussfolgerung:**

1. **Symmetrischer Eingriff:** Die Forschungs-Heilungsformel wird im Headless-Kampf-VM **bei beiden Spielern** aktiv; auch gegnerische Wächter können weniger heilen. Die Varianten isolieren daher nicht den Nerf nur des betrachteten Verteidigerdecks.
2. **Kleine Fokusgruppen:** Die in der v17.3-Auswertung berichteten Wächter-Siege gegen Fusionen (VALIDATION **5/16 → 7/16**, HOLDOUT **10/16 → 12/16**) stammen jeweils aus **nur zwei Siegerwechseln** in ansonsten unveränderten 16 gepaarten Ergebnissen. Das belegt keinen realen Wächter-Buff. Aktionen und Kampfverlauf ändern sich: Ein Sieg mit der neuen Regel dauerte z. B. **15 statt 50 Züge**.
3. **Fokusdecks und Heilungsreichweite:** `guardian-core` enthält **20 Wächter + 20 neutrale Unterstützer**, nicht 40 Wächter. Die vorhandenen Auswertungen erfassen **keine Zahl gleichzeitig heilender DEF-Wächter** und **keine tatsächlich wiederhergestellten DEF-Punkte**. Die behauptete kausale Wirkung der Staffel kann deshalb nicht anhand der bisherigen Partiedaten verifiziert werden. Ein `soul-core`-Deck mit **0 Wächtern im 20er-Defensivkern** änderte sogar in einem Fusion-HOLDOUT seinen Gewinner; dies zeigt, wie wichtig die Wirkung auf Gegner beziehungsweise Fusionsrollen ist.
4. **Abhängige Auswertungen:** In Stage 8 wurden **2.304** Partien über **sechs KI-Profile** ausgewertet. Die **113** berichteten Gewinnerwechsel beruhen auf nur **28 unterschiedlichen Paar-/Szenario-/Starter-/Sitz-Konfigurationen** mit teilweise mehrfach identischem Effekt über KI-Profile. Sie dürfen **nicht** als 113 unabhängige Experimente interpretiert werden.

Die allgemeine Defender-Survival-HOLDOUT-Verbesserung **276 → 278/512** ist sehr klein und beweist ebenfalls keinen Balancegewinn. Der 35-%-Überlebens-Gegenschlag ist **in beiden v17.3-Gruppen identisch**; er kann diesen Unterschied nicht erklären. Einzelne ältere Läufe verwenden zudem andere Match-Seeds und sind nicht ohne Weiteres direkt gepaart.

**Erforderliche Versuchsverbesserung:** Bei fixierten Seeds und derselben KI sowohl den **eigenen** als auch den **gegnerischen** Heilungsnerf getrennt abtragen (`beide`, `nur eigener Verteidiger`, `nur Gegner`, `keiner`); die **Wächteranzahl je eigener Runde**, Heilungsereignisse, verlorene/gewonnene DEF, Heilausfall durch Max-DEF sowie tatsächlich geänderte KI-Aktionen erfassen; die Auswertung nach **einzigartigen Szenarien** statt nur Profil-Replikaten absichern; auch gezielte 2–5-Wächter-Boards und Turnierkampf-Replays testen. Erst danach Balance-Schlussfolgerungen ziehen. **Keine neue Regel-/Champion-Übernahme.**

### v17.4 – Kausalprüfung der Wächterheilung (gestartet)

**Grund:** Der v17.3-Lauf wendete die neue Wächter-Heilungsstaffel symmetrisch auf beide Seiten an und lieferte nur Siegerzahlen statt tatsächlich geheilter DEF-Werte. Die 113 Siegerwechsel aus 2.304 Profil-/Szenario-Replikaten konnten nicht als 113 unabhängig beobachtete Effekte interpretiert werden.

**Vier getrennte vollständige Forschungsregime, keine pauschale 85-%-Regel:**

- `none`: Unveränderte Wächterheilung auf beiden Seiten, Kontrolle.
- `candidateOnly`: 100/55/40/33/28 % abhängig von 1–5 DEF-Wächtern **ausschließlich für die Kandidaten-KI**.
- `opponentOnly`: Dieselbe Staffel **ausschließlich für die gegnerische KI**.
- `both`: Beide Seiten verwenden die neue Heilungsstaffel, wie in v17.3.

**Feste Regeln für alle vier Arme:** 35 % Gegenschlag ausschließlich nach überlebtem Treffer; 15 Prozentpunkte Predator-Durchdringung; Seelenentzug 90/100/120 % je Zieltyp (Forschungsbaseline). Alle Heilungs-Nerfs werden **nur im Offline-Simulator** injiziert; die normale Solo-Version bleibt unverändert, und bestehende 85-%-Experimente werden weder kombiniert noch eingesetzt.

**Neu gemessene Telemetrie pro echtem Duell:** Anzahl Züge mit jeweils 0–5 aktiven DEF-Wächtern **getrennt je Spieler**, Heilungsauslösungen, tatsächlich wiederhergestellte DEF-Punkte, mögliche DEF-Regeneration ohne Staffel, durch Staffel verhinderte Heilung, an maximalem DEF verpufftes Heilbudget und Aufteilung Wächter- vs Seelenzehrer-Ziele. Die Szenario-/Sitz-/Seed-Zuordnung und paarweisen Gewinneränderungen werden mitgeführt; die Anzahl verschiedener Versuchsaufbauten wird separat ausgewiesen.

**Abgeschlossen:** [GitHub Actions #40958426063](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40958426063), **53/53 Jobs erfolgreich**, **92.160/92.160 Duelle** (4 × 23.040; 11 Phasen pro Arm). Keine automatische Champion-Beförderung und keine Änderung des Solo-Produktionscodes.

**Allgemeine Defender-Survival-KI, Siege je 512 TRAIN/VALIDATION/HOLDOUT-Partien:**

| Regelarm | TRAIN | VALIDATION | HOLDOUT |
|---|---:|---:|---:|
| `none` | 268 | 265 | 267 |
| `candidateOnly` | 278 | 271 | 272 |
| `opponentOnly` | 274 | 267 | 266 |
| `both` | 280 | 272 | 271 |

**Eigene echte Heilung – Fokus-Stage 8, 384 Partien mit Defender-Survival-Profil:**
- 139 Partien mit mindestens einem eigenen Wächter-Heilereignis, aber nur **96 Partien**, in denen mindestens **zwei** eigene DEF-Wächter gleichzeitig als Heiler aktiv waren; 288/384 Partien erlebten daher **keinen eigenen 2+-DEF-Wächter-Heilungsversuch**.
- `candidateOnly`: **253.942 mögliche DEF** bei unveränderter Höhe unter den beobachteten Spielzuständen; **116.378 tatsächlich regeneriert**, **137.564 durch Staffelung verhindert** (54,2 % des hypothetischen Budgets nach Max-DEF-Begrenzung). Vergleich `none`: 239.474 tatsächliche eigene DEF-Regeneration unter anderem Spielverlauf (nicht als 1:1-Behandlungseffekt verrechnen).
- `opponentOnly`: Gegenseite unter beobachteten Spielzuständen **298.540 mögliche**, **129.891 echte**, **168.649 verhinderte DEF**. Gegenseiten-DEF-Erholung ist damit separat gemessen; bei `candidateOnly` wurden auf der Gegenseite **0 DEF durch Staffelung verhindert** (Kontrollbedingung korrekt).

**Gepaarte Gewinnerwechsel (Stage 8, 2.304 Profil-Partien je Regel, 384 einzigartige Szenario-/Sitz-Konfigurationen):**
- `candidateOnly` ↔ `none`: **96 Gewinnerwechsel**, 21 zugunsten Kandidat und **75 zulasten Kandidat**, ausgelöst innerhalb von 22 verschiedenen Szenario-/Sitz-Konfigurationen. **Alle 96** hatten messbare verhinderte Heilung auf der Kandidatenseite, **0** ohne wirksame Staffelungsreduktion.
- `opponentOnly` ↔ `none`: **46 Wechsel**, **31 zugunsten** Kandidat / 15 zulasten, in 17 verschiedenen Szenario-/Sitz-Konfigurationen; alle 46 mit reduzierter Heilung auf Gegnerseite.
- `both` ↔ `none`: **121 Wechsel**, 45 zugunsten / **76 zulasten**, in 32 verschiedenen Konfigurationen; alle mit mindestens einer reduzierten Heilung. Die 2.304 Duelle sind wegen sechs KI-Profilen pro Konfiguration **keine 2.304 statistisch unabhängigen Szenarien**.

**Defender-Survival / pure vs gemischt, jeweils nur 16 Duelle je Rollenpaar:**
- **VALIDATION gegen Predatoren:** reine Wächter `11/16` → `11/16`, 50/50 gemischt `12/16` → `12/16` (Kontrolle → `candidateOnly`).
- **HOLDOUT gegen Predatoren:** reine Wächter `7/16` → **`6/16`**, 50/50 gemischt `7/16` → `7/16`.
- **VALIDATION gegen Fusionen:** reine Wächter `10/16` → **`9/16`**, gemischt `10/16` → `10/16`.
- **HOLDOUT gegen Fusionen:** reine Wächter `6/16` → **`4/16`**, gemischt `7/16` → `6/16`; reine Seelenzehrer `7/16` unverändert.
- Das weist auf eine **relative Schwächung reiner Wächter** in fokussierten Paarungen hin, aber noch nicht auf eine robuste optimale Rolle im gesamten Meta.

**Champion-Hürden:** Kein Kandidat befördert; `l10-guarded-worst-reply` bleibt Champion. Der stärkste Kandidat im Arm `both` liegt bei **+11 VALIDATION** versus eingefrorenem Champion und **+5 direktem H2H-TRAIN**, aber nur **+6 direktem H2H-VALIDATION** statt benötigten **+8**. Neu aus ausschließlich TRAIN generierte Endgame-Folgemodelle mit 20/22/24/22 Kontextwerten (`none`/`candidateOnly`/`opponentOnly`/`both`, je 1.280 TRAIN-Partien) sind **keine automatisch beförderte KI**.

**Entscheidung:** Die 100/55/40/33/28-%-Staffelung erzielt gemessene DEF-Reduktion und reduziert fokussiert reine Wächter, ohne andere Rollen immer vollständig zu schützen. **Noch nicht produktiv übernehmen:** Im echten Turnier sind Kartenzugang, Fortification, KI-Kartenwahl, Häufigkeit von zwei bis fünf Wächtern sowie langfristiger H2H-Effekt gesondert abzunehmen. Mehr unabhängige Matchup-/Turnier-Szenarien statt gleich viele KI-Profil-Replikate testen; **keine weitere pauschale Werteabsenkung**.

### v17.5 – KI-Angriffshäufigkeit bei Wächtern und Seelenzehrern – abgeschlossen

**Lauf:** [GitHub Actions #40964830451](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40964830451), **erfolgreich, 27/27 Jobs, 46.080/46.080 echte Selbstspiel-Duelle** in zwei Armen zu je 23.040: `none` (volle Wächterheilung) und `candidateOnly` (100/55/40/33/28 % ausschließlich für den Kandidaten). 11 Stages je Arm. Der 35-%-Überlebens-Gegenschlag, die Forschungsvorgaben 15/90/100/120 und die bisherigen Champion-Freigabegates sind unverändert. Kein regulärer Spiel-/2v2-Patch und keine automatische Champion-Beförderung.

**Neu und erfolgreich validiert:** Die Rollenstatistik verwendet ausschließlich **echte, vom Spielfeld aus angenommene `attack(game, ai, di)`-Angriffe auf dem tatsächlichen Spielzustand**, also weder Planer-Klone noch passive Gegenschläge. Sie zählt je Spieler eigene Angriffe, direkte Treffer, Angriffe auf Monster, zerstörte Monster, tatsächlich verlorene gegnerische LP, Wechsel nach ATK/DEF und Anteil der Partien mit Angriffen. Alle 23.040 Fälle pro Arm besitzen Attack-Telemetrie; 0 fehlende Protokolle und 0 illegale Wechsel.

| Kandidaten-KI, alle 23.040 Duelle je Variante | Volle Heilung `none` | Staffel `candidateOnly` |
|---|---:|---:|
| Wächter eigene aktive Angriffe | **9.762** | **10.048** |
| Seelenzehrer eigene aktive Angriffe | **3.557** | **3.697** |
| Predator eigene aktive Angriffe | **29.499** | **29.449** |
| Partien mit mindestens einem Wächterangriff | 5.005 / 23.040 (21,7 %) | 5.053 / 23.040 (21,9 %) |
| Partien mit mindestens einem Seelenzehrerangriff | 2.812 / 23.040 (12,2 %) | 2.908 / 23.040 (12,6 %) |
| Partien mit irgendeinem Wächter-/Seelenzehrerangriff | 5.953 / 23.040 (25,8 %) | 6.057 / 23.040 (26,3 %) |
| Wächter Angriffe auf Monster / direkt | **9.742 / 20** | **10.028 / 20** |
| Seelenzehrer Angriffe auf Monster / direkt | **3.550 / 7** | **3.679 / 18** |
| Wächter zerstörte Ziele | **7.351** | **7.631** |
| Seelenzehrer zerstörte Ziele | **2.811** | **2.867** |
| Wächter Wechsel nach ATK / nach DEF | **10.127 / 50.353** | **10.424 / 50.260** |
| Seelenzehrer Wechsel nach ATK / nach DEF | **3.740 / 29.933** | **3.859 / 30.016** |

**Interpretation:** Wächter führen im Testfeld etwa **2,7-mal mehr Angriffe als Seelenzehrer** aus (9.762/3.557). Fast alle eigenen Angriffe beider Verteidigerrollen treffen **Monster statt Spieler-LP**: Wächter 20/9.762 direkt (0,20 %), Seelenzehrer 7/3.557 direkt (0,20 %). Predator greift in 6.192 von 29.499 Fällen direkt an (21,0 %). Die vielen Positionswechsel **nach DEF** zeigen klare Defensivorientierung, sind aber Zählungen über alle Partien/Züge und nicht der Anteil einzelner Karten in DEF. **Wichtig:** Die absolute Angriffszahl nach Rolle ist **nicht nach tatsächlich vorhandenen angreifbaren Monstern, Einsatzzeit oder legalen Angriffschancen normiert**; daraus darf man noch nicht schließen, dass die KI pro Gelegenheit zu passiv/offensiv agiert.

**Wirkung der nur eigenen Heilungsstaffel:** Trotz geringerer Heilung steigen aktive Wächterangriffe im gepaarten v17.5-Lauf von **9.762 auf 10.048** (+286; +2,9 %), Seelenzehrerangriffe von **3.557 auf 3.697** (+140; +3,9 %). In Stage 8 werden **50/2.304 Gewinnerwechsel**, 44 zugunsten Kandidaten und 6 zulasten Kandidaten, aus 384 einzigartigen Szenario-/Sitz-Konfigurationen berichtet. Achtung: Das ist **kein monotoner Heilungs-Buff** und keine sichere allgemeine Kausalaussage; nur die tatsächlichen Resultate geänderter Strategie-/Kampfabläufe. Die geänderten Seeds und Replikationen sind nicht mit v17.4 als derselbe Test zu verwechseln.

**Rollen-Fokus, Defender-Survival, je 16 Duelle gegen einen Gegnertyp:** Gegen Predatoren VALIDATION: Wächter `6→6`, 50/50 `7→7`, Seelenzehrer `3→3`; HOLDOUT: Wächter `5→6`, 50/50 `8→8`, Seelenzehrer `7→7`. Gegen Fusionen VALIDATION: Wächter `9→8`, 50/50 `6→6`, Seelenzehrer `6→6`; HOLDOUT: Wächter `5→5`, 50/50 `6→6`, Seelenzehrer `4→4`. Die kleinen Fokusstichproben liefern **keine eindeutige Meta-Entscheidung**.

**Champion-Gate:** `l10-guarded-worst-reply` bleibt **unverändert**. Bester allgemeiner Kandidat in `candidateOnly` erreicht **+16 allgemeine VALIDATION** und **+10 harte Level-10-VALIDATION** vs eingefrorenem Champion, scheitert aber an direkten H2H-Gates (**+1 TRAIN statt +4, +6 VALIDATION statt +8**) sowie an Deck-Synergiegates. `none` erreicht maximal +15 allgemeine VALIDATION, +9 harte Level-10-VALIDATION sowie H2H +2 TRAIN / +6 VALIDATION. Neue Endgame-Modelle mit je **22 TRAIN-only-Kontextwerten** erzeugt, nicht unabhängig befördert.

**Empfehlung v17.6:** Erst valide **Angriffsgelegenheiten pro Wächter/Seelenzehrer in ATK** und Anteil ungenutzter, sinnvoller Angriffe erfassen, getrennt nach Zeitpunkt und Kampfphase. Dazu einen gezielten kontrollierten Fokus auf 40/60-, 50/50-, 60/40-Decks, direkte LP-Finishfenster versus Monsterangriff und die Opportunitätskosten des Wechsels aus DEF (Heilung, Seelenfähigkeit, Überlebenschance). Aktuell **keine zusätzlichen Rohwerte-/Heilungsänderungen** übernehmen.

### v17.6 – Wächter-Wertepool und ATK/DEF-Gewichtung (abgeschlossen)

**Erfolgreich abgeschlossen:** [GitHub Actions #40970409352](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40970409352), **40/40 Jobs erfolgreich**, **69.120/69.120 Duelle**, 23.040 pro Arm, gleicher eingefrorener Champion und formale TRAIN/VALIDATION/HOLDOUT-Trennung.

**Drei Forschungsarme:** `control` behält normale Wächterwerte; `guardian22` verwendet einen **auf 95 % gerundeten ursprünglichen ATK+DEF-Wertepool** mit maximal 22 % ATK / Rest DEF; `guardian20` ebenfalls 95 % mit maximal 20 % ATK. Historische Wächter mit noch niedrigerer ATK erhalten keinen ATK-Buff. Es betrifft nur normale Wächterkarten Level 1–10, nicht Seelenzehrer, Predatoren, Fusionen, ACE- oder Essenzmonster. Werte werden nach allen Rollen-Erweiterungen ausschließlich in der **Offline-Test-VM** angewandt, nicht in `assets/game.js` oder Solo/2v2.

**Unverändert:** 35-%-Gegenschlag nur bei Überleben, 100-%-Wächterheilung ohne frühere 85-%- bzw. dynamische Staffelung, experimentelle 15 Prozentpunkte Predator-Durchdringung und 90/100/120 %-Seelenentzug. Die getrennte Heilungsstaffel aus v17.3–v17.5 wurde *bewusst nicht mit dem Stat-Nerf kombiniert*.

**Tatsächliche eigene Angriffe pro Forschungsarm, 23.040 Duelle:**

| Messung | `control` | `guardian22` | `guardian20` |
|---|---:|---:|---:|
| Aktive Wächterangriffe | 9.529 | **7.850** (−17,6 %) | **6.815** (−28,5 %) |
| Von Wächtern zerstörte gegnerische Monster | 7.390 | 5.576 | 5.053 |
| Tatsächlich verursachter LP-Schaden durch Wächterangriffe (Summe) | 820.020 | 707.917 (−13,7 %) | 626.813 (−23,6 %) |
| Wächterwechsel nach ATK | 9.877 | 7.977 | 6.989 |
| Wächterangriff in mindestens einer Partie | 4.953 | 4.263 | 3.974 |
| Seelenzehrerangriffe | 3.701 | 3.878 | 3.607 |
| Predator-Angriffe | 30.664 | 29.874 | 30.093 |

Nur tatsächlich ausgeführte aktive Angriffe auf dem echten Spielfeld gezählt, nicht passive Gegenschläge oder Planer-Klone. **Die Summe erlittenen passiven 35-%-Gegenschlagschadens ist nicht direkt als eigene Telemetrie verfügbar**: Die niedrigere Wächter-ATK reduziert den rechnerischen Gegenschlag, aber seine totale Duellwirkung darf nicht aus obigen aktiven Angriffswerten abgeleitet werden. Die reduzierten aktiven Angriffe sind auch eine Folge veränderter Spielfeld- und KI-Entscheidungen, nicht nur der nackten Stat-Formel.

**Fokussierte Stage-8-Rollenvergleiche – `defender-v1760-survival-control`, pro Decktyp und Gegner jeweils 16 VALIDATION-Partien, Siege in der Reihenfolge `control/guardian22/guardian20`:**
- Gegen Predatoren: reine Wächter **10/7/11**, gemischt 50/50 **10/12/12**, reine Seelenzehrer **10/10/10**.
- Gegen Fusionen: reine Wächter **9/8/9**, gemischt 50/50 **8/9/8**, reine Seelenzehrer **7/8/8**.
- Unabhängiger HOLDOUT gegen Predatoren: reine Wächter **10/8/9**, gemischt **7/8/8**, reine Seelenzehrer **8/8/8**.
- Unabhängiger HOLDOUT gegen Fusionen: reine Wächter **7/6/9**, gemischt **8/5/6**, reine Seelenzehrer **6/5/6**.

**Warnung:** Die 22/78-Variante verbessert gemischte Formationen in der Validierung gegenüber reinen Wächtern, aber **nicht konsistent im Holdout**, besonders gegen Fusionen. Die 20/80-Variante zeigt keinen durchgängigen Vorteil gegenüber 22/78. Je Zelle nur 16 Duelle, keine hinreichende statistische Absicherung; die Stat-Nerfs betreffen **beide** Spielfeldseiten, sobald dort gewöhnliche Wächter vorkommen.

**Unabhängiger allgemeiner HOLDOUT, Siege/512 bei drei Profilen:**
- Eingefrorener Champion `l10-guarded-worst-reply`: **263/256/252** (Kontrolle / 22/78 / 20/80).
- Bester neuer Defender-Kandidat: **270/264/260**. Niedrigere Holdout-Siege zeigen, dass der Stat-Nerf nicht automatisch allgemein zu mehr Siegen führt. Die Vergleiche nutzen gepaarte Startbedingungen, verändern gewöhnliche Wächter auf **beiden** Spielfeldseiten und liefern für sich allein keinen Beweis der Balance-Qualität.

**Gepaarte Stage-8-Ablation:** Genau 2.304 Profil-Partien je Arm, 384 unterschiedliche Szenario-/Sitz-Konfigurationen. `guardian22` vs Kontrolle: **390** verschiedene Gewinner (165 Kandidaten-Vorteil, 225 Kandidaten-Nachteil; 143 Wechsel im HOLDOUT, davon 53 Vorteile/90 Nachteile). `guardian20` vs Kontrolle: **447** Gewinnerwechsel (218 Vorteile, 229 Nachteile; 160 HOLDOUT-Wechsel, davon 75/85). Änderungen umfassen dieselben Startkonfigurationen über sechs KI-Profile; **nicht 390 bzw. 447 unabhängige Szenarien**.

**Champion-Gating:** **Kein Kandidat befördert**; `l10-guarded-worst-reply` unverändert. Für `guardian22` etwa +13 allgemeine VALIDATION und +9 harte L10-VALIDATION gegenüber Frozen, H2H-Training **+5** (erforderlich +4), H2H-VALIDATION jedoch nur **+4** (erforderlich +8). `guardian20` H2H ebenfalls **+5/+4**, keine Freigabe. Drei neue TRAIN-only-Kontextmodelle mit **19/20/20 Kontextwerten** (`control` / `guardian22` / `guardian20`), je 1.280 TRAIN-Duelle, ohne HOLDOUT/VALIDATION-Training; noch nicht unabhängig befördert.

**Vorläufige Empfehlung:** **22/78 bei 95 % Gesamtpool als bevorzugte Forschungsvariante weiterverfolgen, 20/80 nicht sofort übernehmen.** Die aktive Wächteroffensive fällt deutlich; gemischte Decks wirken in der Validierung reizvoller, aber der Holdout bestätigt kein robustes allgemeines Meta. Vor Produktivübernahme getrennte reelle Gegenschlags-LP-Verluste, tatsächliche Wächter-DEF-Überlebensdauer, gegnerseitige/spielerseitige Stat-Eingriffe und umfangreichere unabhängige Turnier-/Deckversuche messen. **Keine weitere Kombination mit der Heilungsstaffel ohne eigenes 2×2-Testdesign**. Keine Änderung der regulären Solo-/2v2-Karten und kein Champion-Wechsel.


### v17.7 – Kausaler Wächter-Statvergleich und gemessene Gegenschläge (abgeschlossen)

**Erfolgreicher korrigierter Lauf:** [GitHub Actions #40979349844](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40979349844), **53/53 Jobs erfolgreich, 92.160/92.160 Duelle**, vier gepaarte Forschungsarme à 23.040 Duelle, je elf Stages. Quellcommit `95730af3b33878adf5031f41911d949b913272fb`. Vorlauf [#40978180027](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/40978180027) war durch **veränderlichen statt unmittelbar kopierten Instanzzähler im v17.7-Test** fehlgeschlagen (`[2,0]` statt `[1,0]` bei weiter erzeugten Karten); vor neuem Start korrigiert. Alle vier Vorprüfungen und die gesamten Duelle bestanden.

**Vier kausale Arme – 95 % Wertepool und 22/78 nur auf gewöhnliche Wächterkarten (Level 1–10):**
- `control`: bisherige Werte auf beiden Seiten.
- `both22`: neue Werte bei Kandidat und Gegner.
- `candidate22`: nur Kandidat, Gegner unverändert.
- `opponent22`: nur Gegner, Kandidat unverändert.

**Konstant:** 35-%-Überlebens-Gegenschlag, unveränderte 100-%-Wächterheilung (keine 85-%-Pauschale oder 100/55/40/33/28-Staffel), 15 Prozentpunkte Predator-Pierce, 90/100/120-%-Seelenentzug als Forschungsbaseline. Ausschließlich Offline-Instanzdaten, **keine** reguläre Solo-/2v2-Werteänderung.

**Allgemeine Defender-Survival-KI; Siege aus je 512 TRAIN / VALIDATION / HOLDOUT:**

| Arm | TRAIN | VALIDATION | HOLDOUT |
|---|---:|---:|---:|
| `control` | 278 | 260 | **277** |
| `both22` | 271 | 262 | **282** |
| `candidate22` | 274 | 263 | **279** |
| `opponent22` | 268 | 258 | **277** |

**Reale Wächter-Gegenschläge und Überleben, fokussierte Stage 8 mit 384 Duellen je Arm; Werte der Kandidaten-Seite:**

| Arm | Wächter-Treffer | Überlebt / Zerstört | Gegenschlagsereignisse | Tatsächlich abgezogene gegnerische LP durch Wächter-Gegenschlag |
|---|---:|---:|---:|---:|
| `control` | 481 | 295 / 186 | 215 | **34.754** |
| `both22` | 510 | 323 / 187 | 189 | **27.272** |
| `candidate22` | 510 | 323 / 187 | 215 | **34.674** |
| `opponent22` | 453 | 289 / 164 | 205 | **33.360** |

`both22` reduziert den **summierten** Gegenschlags-LP-Verlust um **21,5 %** gegenüber Kontrolle; die Wächter-Treffer-Überlebensquote beträgt 61,3 % Kontrolle vs 63,3 % beidseitig 22/78. Allerdings bleiben bei `candidate22` **34.674 von 34.754 LP** fast unverändert, obwohl 843 Kandidaten-Wächterinstanzen nachweisbar angepasst wurden (zusammen −73.970 ATK). Die Ursache liegt in verschiedenen Duellverläufen und Verteilungen und ist **noch nicht ausreichend geklärt**. Nicht als mechanischer Schadens-Buff interpretieren. **Side-Isolation überprüft:** `candidate22` 843 eigene / 0 Gegnerinstanzen; `opponent22` 0 eigene / 913 gegnerische; `both22` 859 eigene / 927 Gegnerinstanzen; `control` 0/0. Achtung: Im standardmäßigen Vergleichs-JSON beziehen sich `affected`, `atkDelta`, `defDelta` auf **physische Sitzplätze 0/1**, nicht auf Kandidat/Gegner. Für kausal korrekte Rollensummen wurden die Stage-8-Rohdaten anhand `x.seat` neu gruppiert.

**Aktive eigene Wächterangriffe je 23.040 Duelle:** `control` **9.611**, `both22` **7.925** (−17,5 %), `candidate22` **7.813** (−18,7 %), `opponent22` **9.772**. Wächter-Aktivangriff-LP-Schaden: 851.798 / 720.886 / 686.723 / 920.226 in gleicher Reihenfolge. Passive Gegenschläge nicht in diesen Angriffswerten enthalten.

**Rollen-Fokus `defender-v1770-survival-control`, 16 Duelle je Zelle; Reihenfolge `control/both22/candidate22/opponent22`:**
- Predator VALIDATION: reine Wächter **8/9/8/9**, gemischt 50/50 **8/11/10/9**, reine Seelenzehrer **9/9/9/9**.
- Fusion VALIDATION: reine Wächter **7/6/8/6**, gemischt **7/7/9/6**, reine Seelenzehrer **8/7/8/7**.
- Predator HOLDOUT: reine Wächter **7/6/8/8**, gemischt **9/8/9/9**, reine Seelenzehrer **8/8/8/8**.
- Fusion HOLDOUT: reine Wächter **8/3/7/5**, gemischt **7/6/8/5**, reine Seelenzehrer **8/6/8/6**.

`candidate22` hat in **allen vier** Fokusgruppen mehr Siege mit gemischten als mit reinen Wächterdecks; `both22` besonders gegen Fusion-HOLDOUT **6 vs 3**. Das unterstützt die angestrebte Rollenspezialisierung, ist jedoch wegen **16 Duellen pro Zelle** nicht statistisch robust.

**Gepaarte Stage-8-Vergleiche:** 2.304 Duelle je Arm, nur **384** verschiedene Szenario-/Sitz-Konfigurationen, mehrfach mit sechs KI-Profilen. Gegen Kontrolle: `both22` **267** Siegerwechsel (80 zugunsten Kandidat / 187 zulasten), `candidate22` **137** (69 / 68), `opponent22` **234** (81 / 153). Insbesondere der Kandidatennachteil bei ausschließlich gegnerischer Abschwächung muss in weiteren, unabhängigen Konfigurationen erklärt werden.

**Champion-Gates:** **Kein neuer Champion**. `l10-guarded-worst-reply` eingefroren. `both22` maximal +8 allgemeine Validierung und +6 harte Level-10-Validierung gegen Frozen, aber direkte H2H nur **+1 TRAIN / +2 VALIDATION** statt **+4 / +8**. `candidate22` H2H höchstens **+2 / +3**. Die TRAIN-only-Folgemodelle haben **19/21/20/22** nichtnull Kontextwerte (control / both22 / candidate22 / opponent22) aus jeweils 1.280 Trainingsduellen, **ohne** Beförderung.

**Empfehlung:** **95 % Wertepool / 22:78 weiterhin als beste Forschungsoption, noch nicht produktiv übernehmen.** Für v17.8 echte **gegner-LP-gepaarte Einzelgegenspielzüge** bei identischen HP/DEF/ATK-Zuständen sowie zusätzlichen Fusion-/Predator-/Level-10-HOLDOUT mit **mehr unabhängigen Seeds und Decks** verwenden. Vor Kombination mit der dynamischen Wächterheilung zunächst ungewöhnlich geringe Counter-LP-Reduktion in `candidate22` und den `opponent22`-Effekt aufklären. Keine weiteren pauschalen Wertenerfs.


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
