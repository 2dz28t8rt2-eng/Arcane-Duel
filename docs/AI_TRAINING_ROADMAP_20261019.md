# Arcane Duel – KI-Lernstand und priorisierte Roadmap
**Stand:** 19. Oktober 2026 · **Aktiv:** Arbeitsbranch `development` · **Ziel:** bessere, fairere Karriere-KI aus *rechtmäßig erspielten* Testdeck-Daten · **Status:** Plan und dokumentierte Ergebnisse, noch keine Änderung an Kampfregeln oder Live-KI.

> **Langfristiger Projekt-Merker:** Dies ist die kanonische Referenz für den aktuellen KI-Lernstand und die nächsten Trainingsprioritäten. Bei Folgearbeiten erst diesen Stand und die verlinkten Daten lesen; nach jeder abgeschlossenen Runde hier Resultate und offene Punkte fortschreiben. Keine Behauptung, dass die aktive KI von jedem Live-Match automatisch lernt: Training ist offline und Gewichte werden nur nach ausdrücklicher Freigabe übernommen.

## 1. Bestätigter Ausgangsstand – als erledigt dokumentiert

| Version | Was wir tatsächlich gemessen haben | Schlussfolgerung |
|---|---|---|
| 6.7–6.9 | Echte Turnierkarrieren mit `rewardMatch`, bezahlten Boostern und legalen Inventaren; nur ein zuerst tatsächlich erwirtschaftetes VII-Profil. | Erste rechtmäßig erspielte höhere Stufen möglich, aber zu wenige verschiedene Karriereherkünfte für umfassende Gegnerfreigabe. |
| 7.0 | 112 theoretische Deckkonfigurationen, 448 simulierte Duelle. | Hohe strategische Testvielfalt möglich, aber **konstruierte Kartenkopien sind keine tatsächlich erworbenen Inventare**. |
| 7.1–7.2 | 16 neue Normalmonster Level 7–10, IDs 716–731, mit Originalartworks; in 7.2 insgesamt 672 neue Engine-Duelle und 112 Deckkonfigurationen. | Der Kartenpool wurde real erweitert; Quellenprüfung muss mit echtem Drop-/Shop- und Besitzerfortschritt getrennt erfolgen. |
| 7.3 | VIII: `fusion-precision` gewinnt im unabhängigen konstruierten Kontrolltest 148/168 statt 102/168; in einer **dritten, unabhängigen** Serie 399/448 statt 298/448 (+101). | Taktisch starke Kandidatin für VIII, **nicht freigegeben**, bevor reale Karrierebalance belegt ist. |
| 7.3 | X: offensiveres Profil im gespiegelten konstruierten Deckvergleich +24 Siege; gegen echten X-Boss keine zusätzliche Siegzahl (168/168 vs. 168/168). | Spiegelduelle sind Diagnose, keine echte Gegnerfreigabe. |
| 7.4 | X: 1.456 Engine-Duelle mit 56 stärkeren, aber konstruierten Endgame-Decks und fünf Spielerpolicies; Baseline wie Kandidat 448/448 Boss-Siege im Kontrollsatz. | **Sättigung**: mit diesen Testspielern kaum unterscheidbare KI-Verbesserungen; nicht automatisch auf Menschen übertragen. |
| 7.4 | Nach tatsächlich gewonnenem VI: VI-Farmen mit realen Belohnungen und VII-Duellen, insgesamt 228 Duelle, **zwei legitim gewonnene Freischaltungen von VIII**. | Beide VIII-Snapshots hängen von **einer ursprünglichen Karriere** und einem erfolgreichen Seed ab; noch keine unabhängige Vielfalt. |
| 7.5 | 320 Boss-VIII-Duelle mit den zwei echten VIII-Spielständen; bisherige VIII-KI **160/160**, `fusion-precision` ebenfalls **160/160**. Mittlere Boss-LP-Differenz 6.268 vs. 6.134. | Kein positiver Gewinnnachweis gegen diese *echten* Karrieredecks; Kandidatin nicht aktivieren. |
| 7.5 | Inventaraudit: in beiden VIII-Decks **maximal normales Level 4**, 0 normale Karten ≥7, **0 der 16 neuen Endgame-Monster besessen**. | **Hauptforschungsthema: Unterschiede zwischen verfügbarem, erworbenem, ausgerüstetem und tatsächlich verwendbarem Kartenmaterial.** |

**Wichtige Einschränkung:** Ein früherer umfangreicher realer Progressionstest (siehe `docs/PROGRESSION_AUDIT_20261015.md`) brachte **4 von 6 simulierten Karrieren bis X**, bei stark unterschiedlichen Hürden an IV. Das Problem ist daher **nicht erwiesen als genereller Mangel an allen Endgame-Karten**. Es ist eine Frage des spezifischen Karriereverlaufs, der Erwerbspfade, der Spielerpolicy und der Deckqualität. Die beiden VIII-Snapshots aus 7.5 sind **nicht repräsentativ**.

### Trennung der Lernarten

- **Gegner-Live-KI:** derzeit weiterhin eingefrorene, zuvor freigegebene Werte (v5.7-Kern); kein Online-Lernen aus jedem Nutzermatch.
- **Offline-Trainingsprototypen:** Stage VIII `fusion-precision` und Stage X `rapid-pressure`; beide absichtlich **nicht** in die aktive Turnier-KI übernommen.
- **Konstruierte Benchmarkdecks:** aus tatsächlich im Spiel vorhandenen Karten und gültigen Quellen, aber hypothetisch oft mehrfachen Kartenkopien. Als Stresstest zulässig, **nicht** als erreichte menschliche oder simulierte Karriere ausgeben.
- **Verdiente Karrieredecks:** jede Münze, Karte, Freischaltung und Verstärkung muss aus echten Aktionen, Siegen, Drops, Booster-/Crafting-Kosten und `rewardMatch` stammen; `validateProfile`, Besitz-/40er-Deck- und Fusionsprüfungen verbindlich.

## 2. Prioritätenfolge – höchstes Potenzial zuerst

Die relativen Arbeitsgewichte sind eine **Planungsschätzung**, keine wissenschaftlich ermittelten Gewinnpotenziale: **45 % Progressions-/Deckbau-Diagnose, 30 % Spieler-KI/Strategie, 15 % Karriereschwierigkeit und 10 % Gegner-KI-Feintuning**.

### P0 – Kartenverfügbarkeit, Inventar & Deckbau auseinanderhalten (als Nächstes)

**Ziel:** Präzise erklären, warum ein Spieler VIII mit Level-4-Normalkarten erreicht und warum ein anderer X mit höheren Karten schafft. Nur eine reproduzierte Ursache rechtfertigt eine Änderung am echten Spiel.

**Arbeitsschritte:**
1. Für jede erreichte Turnierstufe I–X aus **vollständigen, unabhängigen** Karrieren erfassen: `availableByTier`, tatsächlich erhaltene Kartendaten samt Source/Level/Rolle, Anzahl Kopien, Level im aktiven 40er-Deck, Fusionskarten/Material-Erreichbarkeit, eingesetzte Karten, Münzen, Booster, kostenlose Charakterpacks, Questbelohnungen, Werkstattaufstiege und tatsächlich gewonnene Duelle.
2. Für alle 16 Endgame-Karten (IDs 716–731) explizit Dropquelle, `requiredTier`, `cardAvailable`, `boosterPools`, `lootWeights`, Charakterpacks, `craftCard`, Besitzlimit und das Equip-Verhalten abgleichen. **Laut vorhandenem Spielcode** sind die Karten bereits im Normalpool/den Gegnerlootlisten registriert; fehlender Erwerb in zwei Testkarrieren beweist **keinen** generell fehlenden Dropweg.
3. Drei klare Fehlerklassen unterscheiden: **(A)** spielmechanisch noch nicht zugänglich; **(B)** zugänglich, aber im untersuchten Seed tatsächlich nicht erhalten bzw. falsch investiert; **(C)** im Inventar, aber nicht sinnvoll ausgerüstet bzw. in Fusion genutzt.
4. Erfolgskriterien: sämtliche Vergleichsdaten ohne direkte Profilmanipulation; keine illegalen oder künstlichen Karten, Seed-Reproduzierbarkeit; dokumentierte Ursachen pro untersuchtem Karriereabbruch.

**Explizit NICHT jetzt:** Karten geschenkt platzieren, Dropraten oder Gegner-LP auf Verdacht ändern.

### P1 – Bessere Testspieler: Economy + echte taktische Deckauswahl

**Ziel:** Die Qualität der **legal** erwerbbaren Karten wirklich nutzen, statt aus `equipBest()` und wenigen defensiven/angreifenden Skriptaktionen eine globale Balanceaussage abzuleiten.

- Ressourcenpolicies getrennt trainieren: früh auf sichere Quests/Upgrades investieren; gezielt stärkere Normalmonster über reale Booster/Charakterpacks/Crafting sammeln; farmen nur wenn das laut Ressourcenbilanz sinnvoll ist.
- Reale **40-Karten-Deckbuilder** mit Besitzlimits; separat legaler Fusionspool (2–15), erreichbare Materiallevel, Rollen/Resonanz, individuelle Bonuskarten, ACE-Synergien; nicht nur stärkste `ATK+DEF` sortieren.
- Verschiedene Spielerpiloten: Predator-/Tempo-Druck, DEF/Seelenzehrer, echte 3–5-Material-/Poker-Fusionspläne, Allrounder/Resonanz, adaptiv nach Deckinventar.
- **A/B-Vergleich** unter gleichem Startseed, gleicher realer Ressourcenkurve und unabhängigem Holdout. Verbesserungen müssen auch bei *nicht ausgesuchten* Startkarrieren wirken, sonst nicht promoten.
- Reproduzierbare, getrennte Quellen für künstliche Benchmarks und `EARNED_PROFILE`-Spielstände.

### P2 – Langzeit-Progression und Boss-Schwierigkeit messbar machen

**Ziel:** Unterschiedliche echte Startkarrieren bis VIII, IX und X prüfen, statt denselben erfolgreichen Seed zigmal anders zu starten.

- **Vorgeschlagene Mindeststichprobe:** mindestens **12 unabhängige Startseeds** mit verschiedenen Rollen/Investitionsplänen als erste Diagnoserunde; später mehr. Mehrere Holdout-Duelle **desselben** Spielstands zählen für Unsicherheit nicht als mehrere unabhängige Karrieren.
- Ab IV die erreichte Turnierstufe, Anzahl Anläufe, tatsächliche Belohnungen, Duelllängen, Abbruchgründe und Maximallevel von Haupt-/Fusionsdeck erfassen. Den bereits bekannten Sprung IV ausdrücklich mitprüfen.
- Besonders bei VIII vergleichen: bisherige v5.7-KI gegen vollständig eingefrorene `fusion-precision`; **bei schon gesättigter Boss-Gewinnquote kein ungeprüftes KI-Buffing**.
- Abnehmbares Balanceziel (Siegquote, Grind-Länge, Schwierigkeits-Spikes) erst nach empirischer Vergleichsreihe **mit Nutzer** entscheiden; nicht willkürlich 50 % Boss-Siege anstreben.
- X erst mit echten Endgame-Inventaren, mehreren Piloten und zusätzlichem Matched-Deck-Diagnosetest bewerten; synthetische 100 % Boss-Siege beweisen keine unbesiegbare Live-KI.

### P3 – Geplante Levels-/Kartenreform als separate Designentscheidung

Es existiert bereits `docs/progression-rework-design-20261019.md`: vorgeschlagen sind dauerhaft sichtbare Basiskarten Level 1–5 mit späterem effektivem **Level 1 / 7 / 8 / 9 / 10**, Level-1-Karten bleiben Level 1. Die Spielerentscheidung **globaler Turnieraufstieg versus individuelle Familien-/Monster-XP** ist noch **offen**. Diese Reform kann langfristig mehr Progression bewirken als neue Karten, darf aber **nicht** nebenher auf Basis der KI-Tests implementiert werden.

Vor Entwicklung: Designentscheidung, Migration ohne Karten-/Spielstandverlust, klare Abgrenzung von Boss-/ACE-/Lv1-/2v2-Systemen, Testplan für `dataOf().level`, Fusionen, Pokerboni und Stufenzerfall. Bis dahin die aktuelle Karten- und Wirtschaftssimulation als Referenz behalten.

### P4 – Erst dann neue Gegnerprofile

- VIII: `fusion-precision` nur nach echter Fairnessbestätigung, gegebenenfalls abgeschwächter/bedingter Einsatz statt pauschalem +27-Prozentpunkte-NPC-Siegquoten-Sprung.
- X: zuerst stärkere **Spieler-Gegenmodelle**, nicht noch aggressivere Bosswerte.
- Besondere NPC-Archetypen/ACE-Fokus respektieren; Originaltestfälle zu angreifenden Verteidigern, Gegenangriffen und rollenbasierten Fusionen weiterhin prüfen.
- **Kein Merge auf `main` oder Live-AI-Update ohne explizite Abnahme.**

## 3. Nächste konkrete Entwicklungsrunde (kurzer Arbeitsauftrag)

**`v7.6 – Real-inventory progression & deckbuilding audit`:** Ein und denselben Karriereseed zuerst mit dem bisherigen Auto-Equip, danach mit drei besseren, ausschließlich real besessene Karten verwendenden Deckbauplänen testen. Vollständig ausgegebene Inventar-/Shop-/Drop-Logs und jeweils eigene Seed-/Karriere-ID. Ergebnisse: *wann* waren Level-7+-Monster theoretisch freigeschaltet, tatsächlich erworben, ausgerüstet und effektiv gespielt? Anschließend mit **mindestens zwölf unabhängig beginnenden Karrieren** reproduzieren. Nichts an Gegnerwerten, Dropquoten oder Live-KI ändern.

## 4. Qualitätsgates

- Nur `development`, jeder Commit: Code-/Strategietests sowie Chromium/Desktop-/Mobil-Smoke, soweit zur Änderung passend.
- Trainings- und Holdout-Seeds strikt getrennt, Entscheidungen **vor** Holdout fixieren.
- Verluste, fehlende Freischaltungen und Simulator-Limits vollständig berichten; kein Überschreiben des Profils mit einem Wunschinventar.
- Code-, Data-/Save- und Game-Engine-Versionen im Report nennen. Änderungen am Spiel selbst erfordern Regression der Turnierkette I–X, Fusionen, ACE und Questfortschritt.
- Entwicklung offen dokumentieren: `docs/ai-v73-boss-viii-x-training-results.md`, `docs/ai-v74-v75-real-career-balance-results.md` und die echten GitHub-Actions-Läufe.

## 5. Andere Projektprioritäten bleiben bestehen

Diese **KI-/Progressions-Roadmap** ersetzt nicht `docs/QA_BACKLOG_20261018.md` (Duell-UX/Fusionsfehler/Lv1-Quest) oder die allgemeine Rollen- und Spiel-Roadmap. Insbesondere reproduzierbare Feldfusion-/Questprogressionsfehler haben unabhängig vom KI-Training hohe Priorität.

---

## Ergänzung 19.10.2026 · v7.6: Kartenbelohnung, Splitternutzen, bestehende Perks erneuern

**Aktuelle Nutzerentscheidung:** Lieber vorhandene Skills sinnvoll **revampen**, statt die Liste um weitere generische ATK-/DEF-Perks zu verlängern. Dieser Punkt wurde ausdrücklich nach dem letzten Progressionsplan ergänzt.

**Verbindliches Arbeitsdokument:** [PROGRESSION_SHARDS_SKILLS_REVAMP_V76.md](PROGRESSION_SHARDS_SKILLS_REVAMP_V76.md). Dort sind die aktuell real implementierten zwölf Upgrades, Kartenerwerb, Boostergewichte, Splitterpreise und konkrete mechanische Rework-Ideen samt Gegenmaßnahmen gegen Stapel-/Speicherstandsfehler festgehalten.

**Warum P0 für Belohnungen zusätzlich relevant ist:** Der vorhandene **5er-Booster hat rechnerisch 4,0 Startkarten im Erwartungswert**; die restlichen durchschnittlich 0,8 Normalkarten und 0,2 Fusionen sind weder garantiert neu noch garantiert stufengerecht. Gewöhnliches Kartenzerlegen ergibt nur 2 Splitter, während der gezielte Einzelkauf 30 Splitter **plus** Essenz benötigt. Das bestätigt einen plausiblen Design-Engpass – aber noch keine pauschal gemessene Kartenrate für menschliche Spieler.

**Neue Reihenfolge innerhalb des P0/P1-Auftrags:**
1. **v7.6-Audit** `tests/ai-real-economy-audit-v76.cjs`: echte Stufenabhängigkeit, erwartete Karten-Neuheit, normal/Starter/Fusionen, Anteil Karten 716–731, realer Drop-/Shop-Crafting-Pfad, Splitter als Rohstoff prüfen. Die neue CI arbeitet ohne Veränderung an Dropquoten, Profilen oder aktiven Perks.
2. **Ein gezielter Splitter- und Booster-Prototyp** *offline*: weniger reiner Starterkartenüberschuss, mehr Auswahl zwischen echten, zuvor freigeschalteten Karten; Splitter als Wahl-/Reroll- oder gezielte-Crafting-Währung. Preise/Deckveränderung durch mehrere echte Karrieren balancieren.
3. **Vorhandene Skills mit Rollenmechanik statt Rohwerten**: zuerst Jagdinstinkt und Schildwall als offensive/defensive Spielstilprägen, dann Fusionskunde und Runenpräzision mit bewusstem Fusionsentscheid; Schutz vor Looping, freiem Material und unendlichem DEF-Aufbau. Die anderen acht bestehenden Verbesserungen in ihrer Rolle überarbeiten statt weitere generische Skills ergänzen.
4. **Spielstand- und Karriere-Abnahme**: bestehende Ränge, bezahlte Essenz und Splitterbestände erhalten. Vor Einführung jeder neuen Perk-Logik 12 unabhängige Karriereseeds, echte Inventare und VIII-/X-Fairness mitspielen. Alte `main` unangetastet.

**Status:** Entscheidungen als Entwurf festgehalten; noch **keine** Revision der tatsächlichen Skill-Effekte und keine aktiven wirtschaftlichen Buffs. Erst Ergebnisse prüfen, dann konkret integrieren. 


## Sprint v7.6 – erster Skill-Rework tatsächlich umgesetzt auf `development`

**Starterperk `Grundausbildung` → `Kartenspürsinn` (Kartenverfügbarkeit statt generischer Startmonster-Rohwerte).** Der persistierte interne Upgrade-Key `starter` und alle 8 Ränge bleiben erhalten. Ein Upgrade-Rang verschiebt die Startkarten-Chance in Boostern um 5 Prozentpunkte zu bereits freigeschalteten Normalmonstern, ohne den seltenen Fusionsanteil oder die Kartenzahl zu erhöhen. 5er-Pack: erwartete Starter **4,0 ohne Perk → 2,0 auf Rang 8**. Bestehender Startmonster-ATK-/DEF-Flachbonus aus Kampfbasiswerten und Vorschau entfernt; keine Gratis-Karten oder Skillpunkte vergeben.

**Abnahme vor `main`:** `tests/perk-card-sense-v76.test.cjs` (Rang-/Save-Migration, alle Boostergrößen, Source-/ACE-Gating, Stat-Gleichheit) und CI `perk-card-sense-v76.yml`; zusätzlich Abgleich tatsächlicher I–VIII-Karriereprogression. Durch den Wegfall des alten Flat-Stats können frühe Startmonster-Decks schwächer werden: Das ist **keine bereits bestätigte Balanceverbesserung**. Falls Karriere-Simulationen regressieren, als Versionierungs- und Tuningproblem behandeln und nicht ungeprüft freigeben.

**Noch offen:** Splitter als sinnvolle Wahlwährung, mehr stufengerechte Drops und der weitere Rollen-Skill-Rework; siehe `PROGRESSION_SHARDS_SKILLS_REVAMP_V76.md`.


## Sprint v7.7 – Splitterwirtschaft implementiert (nur `development`)

Der abgestimmte nächste Progressionsschritt ist **im tatsächlichen Gameplay-Code und Shop** umgesetzt:
- **Gezieltes Normalkarten-Crafting** aus nach Stufen gruppierten, auch nicht besessenen aber bereits freigeschalteten Rezepten. Ausschließlich 10/18/28/40 Splitter nach Level 1–3/4–6/7–8/9–10, keine zusätzliche Essenz; Fusionen behalten vorerst 30 Splitter plus Essenz, ACE-/Quest-/Exklusivkarten bleiben gesperrt.
- **Booster-Neuwurf**, maximal einmal je bezahltem Boosterbeleg: 5 Splitter verbrauchen **eine nicht reservierte** originale Startkarte und ersetzen sie durch genau eine legal zugängliche zufällige Normalkarte. Quelle, Seltenheit und tatsächlich ausgegebenes Inventar werden validiert; bezahlte Quittung bleibt nach Neustart mit verbrauchtem Tausch gespeichert.
- **Rollenforschung**: 12 Splitter für drei verschiedene legale normale Predator-/Wächter-/Seelenzehrer-/Allrounder-Angebote; **eine** Karte auswählen, keine zweifache Belohnung. Forschung und bezahltes Angebot über Neustarts fortsetzbar.

**Implementationsbericht:** [SPLITTER_ECONOMY_V77.md](SPLITTER_ECONOMY_V77.md).  
**QA:** `tests/shard-rework-v77.test.cjs` / Workflow `shard-rework-v77.yml`, plus allgemeine Code-/Chromium-Regression. **CI war beim Einchecken noch in der GitHub-Warteschlange; nicht ohne grünen Lauf als vollständig getestet bezeichnen.** 

**Folgende Designarbeiten bleiben offen:** tatsächliche Karriereschwierigkeit nach Wegfall des Startmonster-Flachbonus, Splitterzuwachs und neue Endgame-Karten über mehrere unabhängige Spielstände; Tests auf zu günstige Rollenforschung in hohen Turnierstufen; die geplanten Rollenperk-Reworks (Jagdinstinkt, Schildwall, Fusionskunde und Runenpräzision). Keine Produktions-KI-Aktivierung, kein Merge nach `main`.


## KI-Runde v7.8 – Spielertraining mit **real erspielten** Splittern gestartet

**Status 19.10.2026:** Trainingsskript `tests/ai-earned-shard-training-v78.cjs` und Workflow `.github/workflows/ai-earned-shard-v78.yml` auf `development` eingecheckt. Die GitHub Actions befanden sich beim letzten Abruf **noch in der Warteschlange**. Deshalb gibt es noch **keine belastbaren neuen Siegquoten**.

**Neue Trainingsfrage:** Wie verändert die wirklich bezahlte Splitterwirtschaft v7.7 die aus echten VII-Siegen hervorgegangenen Spieler-Decks bei VIII?

- Vier getrennte **Spieler-Ökonomiearme** auf denselben verdienten Ausgangsinventaren: `existing` (bisherige Ressourcen nicht verwenden), `craft` (bis zu zwei gezielt bezahlte Normalmonster), `research` (12-Splitter-Rollenforschung und gegebenenfalls ein tatsächlich bezahlter Booster-Tausch), `hybrid` (Crafting plus Forschung/Tausch).
- Keine geschenkten Karten, Splitter, Essenz, Turniersiege oder freien Freischaltungen: jede Karte stammt entweder aus dem Ursprungsprofil oder aus `craftCard`, `beginShardResearch`/`takeShardResearchCard`, `rerollBoosterStarter`. Vor jedem Kampftest werden **40-Karten-Deck, Fusionsdeck, Inventar und Profilvalidierung** geprüft.
- Pro Vorbereitung dokumentiert: Splitterverbrauch, Münzverbrauch, tatsächlich erzeugte Karten, höchstes Hauptdeck-Level, Level-7+-Karten sowie Besitz und Ausrüstung der 16 neuen Endgame-Monster.
- Gegen **die echte VIII-Gegnerliste mit Signatur-ACE** werden die alten trainierten Gewichte v5.7 und die experimentelle, weiterhin deaktivierte v7.3-Fusionspolicy getrennt evaluiert; Spielermodi `balanced`, `offensive`, `guardian`; übereinstimmende Kampfsamen je Herkunft und Spielerstil.
- Spieler-Ökonomievarianten werden zuerst auf Trainings-Samen verglichen, Auswahl vor den **getrennten Holdout-Samen** fixiert. Unabhängige Startkarrieren weiterhin separat zählen: zwei VIII-Profile aus derselben ursprünglichen Karriere gelten nicht als zwei unabhängige Belege.
- **CI-Gate:** Vor den Simulationen müssen die echten Splitterfunktionen, die Skill-/Booster-Kompatibilität und die Kartenquelle-Tests erfolgreich sein. Bei Fehlern weder neue KI-Gewichte aktivieren noch Balanceaussagen ausgeben.

**Nächste Entscheidung nach grünem Lauf:** Wenn bezahlte Splitterausgaben erstmals signifikant stärkere VII/VIII-Spielerdecks ergeben, anschließende vollständige unabhängige Karrieren mit v7.7 durchlaufen und erst danach VIII/X-Policy wieder ernsthaft optimieren. Bei weiterhin zu schwachen Decks zuerst Erwerbsmengen, Source-Locks und Deckausrüstung diagnostizieren, nicht NPC-Bosswerte erhöhen.

**Derzeit unverändert:** Live-Gegner-KI, Kartenwerte, `main`. Die Workflows sind gepusht, das eigentliche Ergebnis noch ausständig.


## Erfolg nach dem v7.8-Reparaturlauf · 19. Oktober 2026

**[Ergebnisbericht](AI_V78_TRAINING_SUCCESS_REPORT_20261019.md) · [Vorgängiger Fehlerbericht](AI_V78_FAILED_RUN_REPORT_20261019.md).**

Die ursprüngliche Action `39285652755` war **vor Beginn des KI-Trainings** am QA-Gate gescheitert. Die echten Ursachen – ACE-Shop überschreibt Kartenspürsinn, Forschung Quelle 0/Save-Validierung, veraltete Shard-/Flat-Buff-Testannahmen – wurden auf `development` behoben.

**Die korrigierte Action [39293814588](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39293814588) ist erfolgreich:** 58/58 vorgeschaltete Tests und **1.280 real simulierte Engine-Duelle**. Fünf rechtmäßig erreichte VIII-Snapshots aus nur **zwei unabhängigen Karriereherkünften**; vier Economy-Arme, echte Inventare und bezahlte Splitter.

Die im Training ausgewählte **Hybrid-Strategie** (gezieltes Crafting + Rollenforschung + vorhandener Booster-Neuwurf) verbesserte im unabhängigen Holdout gegen den echten bisher trainierten VIII-Boss Spielererfolge von **0/120** auf **20/120** und den mittleren Boss-LP-Vorsprung **6.247 → 4.417**. Level-4-Testdecks bekamen bei vorhandenen 80 tatsächlich erwirtschafteten Splittern legal Level-9-Karten. Gegen die experimentelle, bislang nicht aktivierte **Fusion-Precision-VIII-KI** gelangen lediglich **3/120** Spielersiege.

**Verbindlicher Folgeschritt:** keine zusätzliche VIII-Boss-Buffierung; mindestens zwölf unterschiedliche komplette Ausgangskarrieren mit echtem Splitterverdienst, eigenen Deckbauentscheidungen und Vergleich bei VIII–X. Benötigt werden mehrere wirklich eigenständige Karriereherkünfte, da derzeit fünf Snapshots nur zwei ursprüngliche Karrieren abbilden. 12-Splitter-Rollenforschung in hohen Stufen auf potenzielle Übermacht prüfen, aber **Preise nicht ohne belastbare Karriere-Daten verändern**.

**Unabhängige QA:** Code-/Strategietests der Trainings-Commit-Reihe bestanden; ein allgemeiner Chromium-Mobile-Canonical-Card-Shell-Test meldete noch einen separaten Fehler bei 410 px. Bis zur sauberen vollständigen Browserabnahme `main` unverändert lassen. Auch aktive Boss-KI bleibt auf der bisherigen Strategie.


## Folgeschritt v7.9 – unabhängige reale Karrieren (gestartet)

**Status:** Als eigenständiges Offline-Training auf `development` gestartet: [GitHub Actions v7.9](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39296549100). Das Training prüft **12 verschiedene Startseeds**, je zwei gepaarte Karriereverläufe (24 vollständige Karriereversuche), statt fünf korrelierte VIII-Snapshots. Nur tatsächliche Siege und normale `rewardMatch`-Belohnungen werden anerkannt.

**Kontrollierte Varianten:** `soul-bridge` bleibt der bereits erprobte Deckbau; `shard-hybrid` nutzt denselben Deckbau und **ab legitimem Sieg über IV** ergänzend kostenpflichtiges normales Karten-Crafting, 12-Splitter-Rollenforschung und, falls tatsächlich im Inventar vorhanden, den 5-Splitter-Booster-Neuwurf. Jeder Kauf läuft über die echten Spiel-Funktionen und geht aus dem wirklichen Splitter-/Inventarkonto ab.

**Sicherheits- und Beweisregeln:** Beide Varianten starten mit demselben Seed und identischen Bedingungen und müssen vor Eingriff (Turnier I–IV) exakt gleiche Snapshots erzeugen. Zwölf ursprüngliche Startseeds sind zwölf unabhängige Karriereherkünfte, unabhängig von der Anzahl ihrer Duelle. Für jede Herkunft werden erreichte Gegnerstufe, Karte/Level/Deck, bezahlte Splitter, reguläre Belohnungen und der Grund eines eventuellen Karriereendes protokolliert. Die letzte Hälfte der Karriere-Startseeds wird im Report gesondert ausgewiesen; keine Strategie wird anhand dieser Hälfte angepasst.

**Skript:** `tests/ai-independent-shard-careers-v79.cjs`, Workflow `.github/workflows/ai-independent-shard-v79.yml`, Ergebnisdatei `artifacts/ai-independent-shard-careers-v79.json` als CI-Artefakt. Vor dem Spieltraining müssen die aktuellen Splitter-/Kartenspürsinn-/Rollenregressionen erfolgreich bestehen. Keine KI-Parameter, Bosswerte oder `main`-Änderungen.

**Freigabegate:** Keine neue Gegner-KI aktivieren, solange nicht genügend unterschiedliche tatsächlich erspielte VIII–X-Spielstände mit fairem Sieg-/Fortschrittsverlauf getestet wurden. Nach erfolgreicher v7.9-Analyse als nächstes den Rollenperk-Revamp Jagdinstinkt/Schildwall getrennt entwickeln.
