# Arcane Duel – Stand der Kampfregeln und KI-Forschung

**Aktualisiert:** 2026-10-29 · Branch `development` · Kausalstudie Wächterheilung v17.4 abgeschlossen

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
