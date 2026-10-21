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


## Abgeschlossene Folgeexperimente v7.9 / v8.0 – 19.10.2026

**[Vollständiger Bericht mit den Erfolgs-/Fehlversuchen](AI_V79_V80_INDEPENDENT_CAREER_FINDINGS_20261019.md)** · GitHub Actions [v7.9 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39296549100) und [v8.0 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39296938808).

- **v7.9:** 12 wirklich unabhängige Karriere-Startseeds, je ein Paar (24 vollständige Versuche), nach IV Splitter-Hybrid versus bisheriger Deckbau: durchschnittlich tatsächlich gewonnene Turnierstufe **3,92 → 4,08**, zwei zusätzliche Karrieren gewannen VI, aber noch **keine** VII. **Sechs von zwölf** schon bei IV gescheitert und damit vor der erstmaligen Hybridinvestition.
- **v8.0:** dieselben 12 Ausgangsseeds, vollständig gepaart, früher Splittereinsatz nach Sieg über **II** versus erst nach **IV**. Verbrauch **1.521 gegen 465 Splitter**, durchschnittliche gewonnene Stufe **3,75 gegen 4,08**: einfaches sehr frühes und häufiges Kaufen ist **keine belastbare Verbesserung**. Die Änderungen halfen in drei Karrieren, schadeten in vier anderen, in fünf blieb die gewonnene Stufe unverändert.
- Beide Experimente bestanden ihre tatsächlichen Engine-, Ressourcen-, Besitz-, Qualifikations- und QA-Gates. **Keine** Bosswerte, normalen Kartenwerte, aktiven KI-Entscheidungsgewichte, Splitterpreise oder `main` geändert.

**Neue Priorität v8.1:** Den **Kaufentscheidungsalgorithmus** der Spieler-KI trainieren, nicht bloß die Kaufrate: nur kaufen, wenn eine regulär verfügbare Karte gegenüber dem tatsächlichen 40er-Deck und passenden Fusionen einen klaren qualitativen Zugewinn bietet; Splitterbudget und spätere Freischaltungen mitbewerten. Besonders die erste große Hürde bei Turnierstufe IV prüfen. Neue KI-Gegner-Verbesserungen erst nach fairer, wirklich erspielter VIII–X-Progression aktivieren.

**Status der ursprünglichen Fehler:** v7.8 QA-Gate bereits repariert, v7.8-Trainingslauf 39293814588 erfolgreich (1.280 Duelle), v7.9 und v8.0 sind zusätzliche bestätigte Folgeexperimente. Dieser Abschnitt ersetzt frühere Roadmap-Notizen, die v7.8 noch als ausständig bezeichneten.


## Trainingsfortsetzung v8.1 – gezielte Deckverbesserung vor Splitterausgaben

**Status 19.10.2026:** Neues Offline-Trainingsskript `tests/ai-deck-value-shards-v81.cjs`, Workflow `.github/workflows/ai-deck-value-shards-v81.yml` auf `development`. [GitHub Actions – v8.1](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39303077605) prüft zwölf unabhängige, gepaarte Karriere-Startseeds; Ergebnis erst nach Abschluss als gemessen bezeichnen. Ein anfänglicher YAML-Fehler im Workflownamen wurde behoben und der Job läuft inzwischen durch sein QA-Gate.

**Gegenüberstellung:** Vorhandene v8.0-`late-shard`-Kontrolle (einfaches Kaufen ab geschlagenem IV) versus `selective-shard` (potenziell ab geschlagenem II), die Kaufabsichten gegen das tatsächlich besessene 40-Karten-Deck **vorab** prüft. Nur Karten, die in einer möglichen legalen Deckaufstellung einen messbaren Werte-/Rollenbeitrag leisten, rechtfertigen Kauf; maximal 1 früher bzw. 2 spätere Craftings pro erreichte Turnierstufe, 20–30 Splitter Rücklage, erwartete Verbesserung als Kaufschwelle. Forschung ab IV nur dann, wenn mehrere der real angebotstauglichen Rollenkarten eine potenzielle Verstärkung sind. Unter dieser Strategie werden keine blinden 5-Splitter-Neuwürfe ausgeführt. Früh investierte Karten kosten unverändert die realen Spielressourcen.

**Offene Beweisfrage:** Gegenüber dem bloßen Frühkaufen aus v8.0 tatsächlich mehr unterschiedliche Karrieren bis IV, VI und VII bringen, ohne hohen Splitterverbrauch. Beide Arme beginnen mit identischem Startseed und regulären Duellen. Als Erfolg zählt die erreichte Turnierstufe, nicht nur dass viele Karten gekauft wurden. Keine direkten Profil-Eingriffe, keine Boss-Buffs und kein Merge auf `main`.

**Voraussetzung für einen KI-Rollout:** Ein gewonnener Testlauf bedeutet nur, dass das neue *Offline-Spielermodell* validiert wurde. Gegner VIII/X werden erst neu trainiert, wenn genügend eigenständige, legal erspielte Endgame-Decks entstanden sind.


### Abschluss v8.1 · Experiment bestanden, selektive Kauflogik nicht verbessert

[Ausführlicher v8.1-Bericht](AI_V81_VALUE_GATED_ECONOMY_RESULTS_20261019.md) · [GitHub Action 39303077605: SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39303077605).

Das value-gated Kaufexperiment mit **12 unabhängigen Startkarrieren je Arm** und legalen bezahlten Craftings/Forschungen wurde erfolgreich ausgeführt. Die streng selektive Methode sparte Splitter (204 statt 465), senkte die durchschnittlich gewonnene Stufe jedoch von **4,08 auf 3,67**. In der unabhängigen zweiten Hälfte der Karriereursprünge **3,17 statt 3,67**. Keine Variante gewann VII. Die übervorsichtige policy wurde **nicht** übernommen; schon gar kein neuer Gegner-Buff.

**Nächste Priorität v8.2:** Die isolierte Wirkung von Deck-Score-Schwelle, Reserve und Booster-Neuwurf in eigenen Testarmen untersuchen, vor allem das **tatsächlich besessene/ausgerüstete 40-Karten-Deck und mögliche legale Fusionsmaterialien** vor Gegner IV. Nicht mehrere Hebel gemeinsam verändern und danach eine Einzelursache unterstellen. Mindestens zwölf eigene Karriereherkünfte und ein separater Holdout als Freigabegate. **main, Boss-KI, Kartenwerte und Splitterpreise unverändert.**


## Trainingsfortsetzung v8.3 — abgeschlossen: frische Seeds, kombinierte Wirtschaft und früher Soul-Bridge

**Action:** [v8.3 SUCCESS (39312236368)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236368), [vollständiger Bericht](AI_V83_EARLY_FUSION_ECONOMY_RESULTS_20261019.md); auch [Code-/Strategie-QA](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236274) und [Browser-Smoke](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39312236297) **SUCCESS**. 24 völlig neue Karriereursprünge × 7 gepaarte Varianten = **168 vollständig simulierte Karriereverläufe**, 12 Train-/12 Holdout-Ursprünge.

**Wichtigster Gegenbefund:** Vor Turnier IV erzwungener Soul-Bridge ist **keine** Verbesserung: `early-bridge-shard` 3,38 statt 3,92 mittlere gewonnene Stufen (`early-shard`); IV gewonnen 6 von 22 statt 11 von 23 erreichten Karrieren; tatsächlich 937 frühe Hauptdeck-, aber nur 19 Fusionsdeckänderungen. Kombinierte Reserve/Neuwurf-Verzicht/Früh-Bridge 3,79. `late-shard` bleibt bei **4,54** führend und hatte als einzige Variante einen Spieler, der X erreichte (ohne X-Sieg; nur eine Karriere, **keine** repräsentative Endgame-Evidenz).

**Wirtschaftsbefund:** v8.2 zeigte starkes Holdout-Signal für `no-reroll`, aber dieses reproduzierte sich nicht auf den neuen v8.3-Ursprüngen (v8.3 Holdout 3,25 gegen `early-shard` 3,83). Deshalb **keine** Produktivempfehlung, Splitterneuwürfe global zu streichen oder den frühen Deckbuilder zu aktivieren.

**Nächste Roadmap-Priorität v8.4:** [Issue #12](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/12) — unabhängig gepaarter Vergleich mehrerer rollenangepasster **Hauptdeck + Fusionsdeck**-Builder auf **identisch tatsächlich verdienten Vor-IV-Inventaren**, fairen Combat-Seeds und echter Materialspielbarkeit. Danach auf neuen unabhängigen echten Karrieren IV/VI bestätigen. Erst dann wieder VIII–X und mögliche Boss-KI-Änderungen prüfen. `main`, Live-Gegner-KI, Karten- und Splitterpreise bleiben unverändert.


## Abgeschlossenes KI-Training v8.4 — gepaarter Deckbuilder-Vergleich vor IV

**GitHub Actions:** [v8.4 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39315082432). [Vollständiger Bericht](AI_V84_MATCHED_DECKBUILDER_RESULTS_20261019.md), [Issue #12](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/12).

24 neue legal erspielte und voneinander unabhängig gestartete Karriereursprünge (1.153 echte Karriere-Duelle); 24 Profil-Snapshots vor IV und 384 fair gepaarte Testduelle mit vier Offline-Deckbuildern. Training/Holdout strikt nach je 12 unabhängigen Ursprungskarrieren getrennt; beide Starter und zwei Kampfseeds pro Inventar/Variante.

| Holdout-Ergebnis vor Turniergegner IV | Standard | Soul-Bridge | Role-aware | Fusion-aware |
|---|---:|---:|---:|---:|
| Spielersiege aus 48 Duellen | 2 | 2 | 2 | 2 |
| Mittlerer Boss-LP-Vorsprung | 5.494 | 5.476 | 5.499 | 5.498 |
| Tatsächlich ausgeführte Fusionen | 225 | 223 | 224 | 224 |

**Fazit:** Keine Variante steigert die Siegzahl. Die 18-LP-Verbesserung durch Soul-Bridge hat keine ausreichende praktische Evidenz. Die neuen Decksortierstrategien sind **nicht** für die Live-KI freigegeben. Tests und Vor-IV-Inventare bleiben auf `development`, `main` sowie Live-Gegner-KI/-Balance unverändert.

**Neue Priorität v8.5:** [Issue #13](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/13). Auf realen Vor-IV-Inventaren **tatsächliche Material-, Fusions- und Zugentscheidungen** erfassen, darunter 2–5 reale Hand-/Feldmaterialien, Fusionstarget, Quality Roll, Folgeschaden, Verteidigung/Seelenverzehr/ACE, Priorisierung sinnvoller Angriffe und Lookahead. Getrennte faire Trainings- und Holdout-Matches; erfolgreiche Kandidaten danach mit vollständig gespielten neuen Karrieren gegen IV/VI bestätigen. Keine Boss-/Kartenbuffs, Loot-/Preisänderungen oder Merge auf `main` ohne ausdrückliche Prüfung.


## KI-Trainingsupdate 20.10.2026 — v8.5 und v8.6 abgeschlossen

**Training:** [v8.5 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360036179), [v8.6 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39360317647). [Vollständiger Analysebericht](AI_V85_V86_TACTICAL_FUSION_RESULTS_20261020.md).

- Zwei strikt getrennte neue Ursprungspopulationen mit **32** unabhängig erspielten Karrieren pro Version, je **16/16** Train/Holdout-Ursprünge; 1.592 + 1.583 = **3.175 legitime Karriereduelle** zum Aufbau der vorhandenen Decks, danach **1.024** gepaarte reale Engine-Diagnoseduelle (keine Gratisbelohnungen).
- **v8.5 Holdout** (64 Duelle pro Arm): bisherige KI 2 Siege, vermeintlicher Materialerhalt 1, Bedrohungsanalyse 0, Ein-Zug-Vorausschau 1. Alle Experimente teils mit besserer LP-Bilanz, aber ohne Sieggewinn. Materialerhalt löst zudem *mehr* Fusionen aus als die Baseline.
- **v8.6 Holdout** auf vollständig anderen Seeds: bisherige KI **4/64**, strenger Materialerhalt 0/64, Qualitätsregel 2/64, reaktive Fusion 0/64. Qualitätsregel reduzierte den LP-Rückstand um ca. 431, bevorzugte aber 453 Fusionen bei 470 eigenen Auswahlentscheidungen. Auch der gute Trainings-LP-Wert qualifiziert damit keinen Kandidaten.
- Alle experimentellen Aktionen waren Match-sandboxed, rechtmäßig und wurden **nicht** in `assets/game.js` oder der produktiven KI übernommen. Ökonomie-, Save-, Rollen-, Gegner- und Browser-Regressionen der jeweiligen Versionen bestanden.

**Folgerung:** Deckbau und Fusionsauswahl allein beheben die IV-Hürde nicht reproduzierbar. Priorität v8.7 ist [Issue #14](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/14): Angriffsziel, Gegenschlag, Position, Seelenentzug, ACE und Zugfolge instrumentieren, auf realen Inventaren in unabhängig gepaarten Train-/Holdout-Kämpfen messen und danach mit vollständigen echten Karrieren IV/VI bestätigen. `main`, Live-NPC-KI, Kartenwerte und Splitterpreise bleiben gesperrt.


## KI v8.7 abgeschlossen (20.10.2026) – Board-Taktik und Defender-Coverage

**Testergebnis:** [v8.7 GitHub Actions SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241584), [Code-/Strategie-Checks SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241547), [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39363241510). [Vollständiger Abschlussbericht](AI_V87_BOARD_TACTICS_RESULTS_20261020.md), [Trainingsauftrag #14](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/14).

**Unabhängige Datenbasis:** 32 neue legale Karriereursprünge (Seed-Offset 20000), 1.585 regulär gespielte und vergütete Duelle zur Erzeugung tatsächlicher Kartenbestände, 640 gepaarte IV-Diagnoseduelle für 5 Strategiesimulationen (16 Trainings- und 16 vorab zurückgehaltene Kontroll-Ursprünge).

**IV-Siege Training / Holdout pro 64 Kämpfe:** Baseline **3 / 3**, gezielte Bedrohungsattacke **3 / 3**, defensive Positionierung **1 / 4**, Seelenunterstützung **1 / 4**, Hybrid **1 / 4**. Defensive Wechsellogik war im Trainingssatz schlechter, im Holdout geringfügig besser; dies ist **keine belastbare Freigabe**. Der größte Befund: in den Unterstützungsvarianten **0 wirklich ausgeführte Soul-/Guardian-Aktionen**. Ergebnis bei Soul Support entsteht ausschließlich durch defensive Positionswechsel. Es ist noch unbekannt, ob wegen der niedrigen Rollen-Coverage, Feldkonstellation oder Aktionsrestriktionen kein Soul-Skill zustande kommt.

**Freigabe:** `qualified=false`, Trainingsauswahl = `baseline`, keine produktive KI-Änderung oder Merge auf `main`.

**Nächste Roadmap-Priorität v8.8:** [Issue #15](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/15) – ernsthafte Coverage-Messung vorhandener Soul-/Guardian-Karten in legal ausgerüsteten Vor-IV/V/VI-Karrieren sowie Zähler für tatsächlich verfügbare und genutzte DEF-, Seelenentzug-/Wächteraktionen; defensive Wechsel unabhängig mit brandneuen Holdout-Seeds bestätigen, dann erst Karriere-IV/VI-Progression prüfen.


## KI-Fortsetzung 20.10.2026 — v8.8 und v8.9 abgeschlossen

**Ergebnisse:** [detaillierter v8.8/v8.9-Bericht](AI_V88_V89_DEFENDER_PHASE_TRAINING_RESULTS_20261020.md). [v8.8 korrigierte Coverage-Simulation: SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364183073), [v8.9 unabhängiger Phase-aware-Kontrollversuch: SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39364487467). Bei beiden Testständen zusätzliche Code-/Strategie-, Save-/Fusion-/Ökonomie-Regressionen und Browser-Smokes **erfolgreich**.

**Datenbasis:** v8.8 erzeugte 32 völlig neue legitime Karriereursprünge aus **1.642** echten Karriereduellen und verglich 7 Offline-Strategiearme in **896** gematchten IV-Duellen. Die zuerst als null gemeldete `soulFieldTurns`-Metrik beruhte teilweise auf einem zu eng angelegten Audit-Phasenfenster. Der nachgeschärfte Audit sah in regulären Baseline-Matches **35 / 29 Spielzüge mit Soul-Monster auf dem Feld** (Train/Holdout) und **82 / 93** mit Wächter. Alle 32 Quell-Decks enthielten Soul und Guardian. Die tatsächliche Bereitschaft für Seelenentzug war jedoch selten; der KI-Core übersprang häufig die separat beobachtete `attacks`-Phase. **0 Supportaktionen**, `qualified=false`; der im Training gewählte Defense-Arm gewann im Holdout keine zusätzliche Partie (je 1/64 gegenüber Baseline).

**v8.9** wurde deshalb **getrennt auf 32 neuen Ursprungskarrieren** (1.611 echte Karriereduelle, **768** matched Diagnosekämpfe, 16/16 Train/Holdout) geprüft. Ein phasenbewusster Spielercontroller brachte **2 tatsächliche erfolgreiche Soul-/Guardian-Aktionen** in der Trainingshälfte und **3** im unabhängigen Holdout der unveränderten Hauptdeck-Variante zustande. Die Baseline hatte 0. Aber **keine zusätzliche Partie gewonnen**: Baseline vs. Phase Support im Holdout **2/64 vs 2/64**. Die im Training gewählte Kombination Rollen-Deck + Phasenunterstützung + defensive Stellung verlor im Holdout **1 statt 2 Spiele gewonnen**, also **−1 Sieg**. Damit **keine** Freigabe.

**Nächste Roadmap-Phase v9.0:** [Issue #16](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/16) – den KI-Aktionsphasenablauf **rechtmäßig und beobachtbar** zwischen Beschwörung, Position, optionaler Soul-/Guardian-Fähigkeit, Angriff und Zugende aufteilen, dann mit legal verdienten IV-/VI-Karrieren und brandneuen unabhängigen Seeds trainieren. Die Anforderung ist **mehr echte Siege**, nicht nur endlich 2–3 Supportaktionen oder kleine LP-Differenzen.

**Produktions-Lock:** `main`, aktive Live-Gegner-KI, Game Engine, Kartenwerte, Loot/Preise und Questfortschritt unverändert. Alle v8.8/v8.9-Heuristiken befinden sich nur im Offline-Testcode von `development`. Diese Trainingsläufe sind kein selbstlernendes Neuronennetz aus echten Nutzermatches.


## Fortsetzung KI v9.0 — 20.10.2026 abgeschlossen

**[Trainings-Workflow erfolgreich](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39365570969).** [Detaillierter Bericht](AI_V90_EXPLICIT_TURN_CONTROLLER_RESULTS_20261020.md), [vorheriger Auftrag #16](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/16).

**Methode:** neuer Seed-Offset **32000**, 32 regulär erspielte voneinander unabhängige Karrieren (1.525 echte belohnte Karriereduelle), je 16 Trainings- und Holdout-Quellen; **896** echte Engine-Diagnosekämpfe: 7 Strategiesimulationen × 2 feste Kampfseeds × 2 Startspielerpositionen × 32 Ursprünge. Jeder Arm startet mit exakt denselben rechtmäßig besessenen Profil-/Kartendaten. Der Unterschied kommt allein aus den Match-sandboxed, legalen Spieler-Aktions-Policies und bei ausdrücklich benannten Varianten aus dem legal umsortierten Hauptdeck.

**Ergebnisse Gegner IV (Training/Holdout, Siege aus 64 je Arm):** Baseline **5/3**, reiner expliziter Phasencontroller **5/3** mit **identischen** LP-Bilanzen, phasenbewusste Unterstützung **5/3**, sichere Unterstützung **5/3**, defensive Unterstützung **4/3**, Rollen-Deck+Support **5/2**, Rollen-Deck+defensive Unterstützung **4/2**. Der beste Trainingskandidat `explicit-support` führte 10 legale Supportaktionen in der Trainingshälfte und 2 im ungesehenen Holdout aus (Baseline 0), **ohne Siegsteigerung**; Holdout-LP im Mittel −2,3 schlechter. Defensive Support-Variante senkte im Holdout den LP-Rückstand um 77,5, gewann aber keine weitere Partie.

**QA:** workflowintern **56/56** Legalitäts-/Spiel-/Rollen-/Speicher-/Economy-Tests und **20/20** ergänzende KI-Tests grün. Allgemeine Code-/Strategiechecks auf dem Trainingscommit ebenfalls erfolgreich; Browser-Smoke separat dokumentiert.

**Urteil:** Die als Offline-Test implementierte explizite Zugphasensteuerung kann das normale Verhalten reproduzieren und rechtmäßige Seelenfähigkeiten aktivieren. **Keine** getestete Variante ist auf unabhängigen Ursprüngen reproduzierbar siegfähiger. `qualified=false`; keine Änderung an aktiver KI, Quest, `assets/game.js`, `main`, Preisen oder Monsterwerten.

**Nächste Priorität v9.1:** [Issue #17](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/17) — echte individuelle Aktionen auf der Spielengine nach tatsächlicher Angriffs-, LP-, Gegner-/ACE-/Fusion-Wirkung instrumentieren. Sichere Angriffsreihenfolge, Materialerhalt und gegebenenfalls Soul-Heilung gegen Lethal jeweils als isolierte Hypothese auf unabhängigen neuen Karrierequellen prüfen. Nach positiven Erfolgen zusätzlich vollständige Karriere-A/B-Tests bis IV/VI, ansonsten keine Produktivfreigabe.


## KI-Training v9.1 – 20.10.2026 abgeschlossen

**[Training erfolgreich](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366160219)**, [detaillierter v9.1-Bericht](AI_V91_ACTION_UTILITY_RESULTS_20261020.md), [v9.1 Issue #17](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/17).

- 32 völlig neue unabhängige, regulär erspielte Karriereursprünge (Seed-Offset **36000**) aus 1.658 tatsächlich absolvierten Karriereduellen; anschließend 896 matched IV-Spielengine-Diagnosekämpfe mit sieben isolierten Attack-/Lethal-/Tempo-/Threat-/Soul-Feld-Utilities (16 Ursprungskarrieren Training, 16 Holdout; je 2 Kampfseeds und beide Starterpositionen). **Kein** künstlicher Loot/Sieg/Deckbesitz und **keine** Spiele-/NPC-Balanceänderung.
- Alle sieben Arms gewannen in der Trainingshälfte **2/64**, in der ungesehenen Holdout-Hälfte **0/64**. Die ausgewählte `soul-utility` hatte **+2,6 LP** Training, aber **−0,5 LP** im Holdout im Vergleich zur Baseline. **Nicht** qualifiziert, `main` und Live-KI nicht aktualisiert.
- Neu instrumentiert: Tatsächlich **angewendete** Angriffsergebnisse. Baseline: Training 32 angewendete Angriffe, 21 besiegte Gegnerkarten und 11.624 LP-Damage über 64 Duelle; Holdout nur **6 angewendete Angriffe, 6 besiegte Gegnerkarten und 499 LP-Damage über 64 Duelle**. Die KPIs erklären, warum neue Zielgewichtungen kaum wirksam werden; der vorgelagerte Engpass ist damit **beobachtet, aber noch nicht kausal erklärt**.
- QA: Trainingsinterna **56/56** Legalitäts-/Spiel-/Economy-Tests und **20/20** weitere AI-Checks bestanden, Code-/Strategie-CI erfolgreich; Browser-Smoke separat final prüfen.

**Priorität v9.2: [Issue #18](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/18)**. Den tatsächlichen Aufbau eines schlagkräftigen Feldes vor dem ersten Spielerangriff auf **neuen legal erspielten** Karrieren messen: Beschwörbarkeit, legale Normal-/Hand-/Feldfusionen, genutzte/freie Slots, Handqualität, Ziel-ATK und Gegnerschwelle, Wert der Materialreserve, ausgewählte ACE/Fusionsziele, Überleben bis zur Attacke, Phasentransitionen. Nur nach reproduzierten unabhängigen IV-Siegen weitere echte vollständige Karriere-Simulation IV/VI und optionaler, separat freizugebender Live-Implementierungsschritt. Monsterwerte, Boss-Schwierigkeit, Splitter/Shop, Produktions-KI und `main` bleiben unberührt.


## KI v9.2 und v9.3: Feldaufbau-Kandidat und unabhängige Bestätigung (20.10.2026)

**[Vollständiger Bericht](AI_V92_V93_PRE_ATTACK_FUSION_RESULTS_20261020.md)** · [v9.2 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39366870349) · [v9.3 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39367079885). **32 völlig neue legitime Karrieren je Runde**, Quellen-Offsets **40000** und **44000**, insgesamt **3.104 tatsächlich regulär gespielte Karriereduelle** zum Aufbauen der Kartensammlungen, danach **768 + 256 = 1.024** faire Spielengine-Vergleichsduelle. Beide Kohorten 16 Train-/16 Holdout-Karrieren, zwei Matchseeds × beide Startpositionen. Keine künstliche Karte, Extra-Sieg, Reward in Diagnosekampf oder Boss-Nerf.

**V9.2:** Erstmalig legal verfügbare 2–5-Handmaterialien und mögliche Fusionsziele an der Beschwörungsphase tatsächlich vergleichen. Der **trainingsseitig** gewählte Ansatz `tempo-board` wählte bessere erreichbare Fusionen und Materialgruppen; im Holdout **9 statt 2 Siege / 64** und **271 statt 55 echte Angriffe**, durchschnittliche LP-Differenz **+1.815**. Stärkstes normales Monster ohne Fusion verlor alle IV-Duelle; gezielte Fusionen sind grundsätzlich erforderlich. Die im v9.2-Holdout besonders starke `ace-reach`-Variante mit 12/64 ist **explorativ** und wurde NICHT trainingsseitig gewählt.

**V9.3 unabhängige vorab feste Replikation:** Exakt derselbe v9.2-`tempo-board`-Code, aber komplett neue legal erspielte Ausgangskarrieren. **Training 1 statt 0 Siege**; Holdout **4 statt 2 Siege / 64**, Angriffe **200 statt 42**, LP-Differenz **+1.203**. Der Feldaufbau-/Angriffsvorteil wiederholt sich klar, Siegverbesserung zwar in dieselbe Richtung, aber schwächer: Das **vorab** definierte v9.3-Gate von +3 Holdout-Siegen wurde bei **+2** verfehlt (`qualified=false`). Keine produktive Freigabe.

**QA:** Für beide Läufe die 56/56 Game-/Save-/Fusion-/Economy-Regressionen und 20/20 zusätzlichen AI-Checks erfolgreich, Code-/Strategie-CI und Browser-Smokes erfolgreich. Nuance: `fusionOffers` ist nur bei heuristischen Alternativen berechnet, daher Baseline=0 dort **kein** Beleg für fehlende Fusionen. Tatsächliche Baseline-Fusionen sind zahlreich.

**Roadmap v9.4:** [Issue #19](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/19) – nach erfolgreicher Offline-Diagnose neue **vollständige legale Karriere-A/B**, `tempo-board` gegenüber Baseline mit regulären Rewards pro Arm und neuen ungesehenen Seeds. Primäre KPIs: wirklich IV/VI besiegt, erreichter Turnierfortschritt, Ressourcen- und Anlaufskosten. Zusätzlich ein vollständig getrenntes, neues Training für den in v9.2 explorativ starken ACE-Fokus. `main`, Live-Gegner-KI, Loot, Splitter-/Perk-Balance und Kartenwerte bleiben bis strenger Validierung unverändert.


## KI v9.4 — vollständige Karriere-A/B bis Turniergegner VI, 20.10.2026

**[Kompletter Ergebnisbericht](AI_V94_REAL_CAREER_AB_RESULTS_20261020.md)** · [GitHub Actions SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39368041630) · [Auftrag #19](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/19).

**Reale Karriere-Ausführung statt matched einzelner IV-Duelle:** 32 **völlig neue** unabhängige Ursprungskarrieren ab Seed-Offset **48000**, je zwei separat neu gestartete, eigenständig wirtschaftende Arme mit identischer `late-shard`-Wirtschaft, Farm-, Deck-/Shop-/Perk-/Shard-Routine und identischen initialen Kampfseeds. Insgesamt **4.126 tatsächlich ausgespielte und mit `rewardMatch` belohnte** Kampfbegegnungen, davon Baseline 1.942 und v9.2-`tempo-board` 2.184. Bis max. Tier VI und maximal 16 echte Versuche je Tier. Alle Karten und Ressourcen pro Arm tatsächlich erwirtschaftet; keine synthetischen Saves, Extrakarten oder NPC-Buffs. Quellen vorab aufgeteilt: 16 Train, 16 Holdout.

**Ergebnisse alle 32 Ursprünge:** `baseline` vs `tempo-board`: IV **11 → 22 Siege**, V **6 → 22**, VI **1 → 4**, durchschnittlich höchste besiegte Turnierstufe **3,56 → 4,50**. Holdout 16 Ursprünge: IV **7 → 10**, V **3 → 10**, VI **1 → 2**; **10** Karrierepaare verbesserten Endfortschritt, **2** verschlechterten sich, **4** blieben gleich. Das **vorab definierte Offline-Gate** (IV Train +2, Holdout +3, mehr Ursprünge besser als schlechter, keine VI-Rückschritte) ist **erreicht: `qualified=true`**. Dies ist der bisher deutlichste reale Vorteil bei Fortschritt; einzelne spätere Ressourcenstände differieren jedoch durch den gewonnenen oder verlorenen Fortschritt. Die 64 Arme bilden **32 statistisch unabhängige Quellenpaare**, nicht 64 unabhängige Ursprünge.

**Qualität:** 56/56 Gameplay-/Save-/Ökonomie-/Fusions-Checks, 20/20 KI-Regressionstests bestanden; getrennte allgemeine Code-/Strategiechecks erfolgreich. V9.4-Browser-Smoke separat abschließend prüfen.

**Nächste Priorität v9.5: [Issue #20](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/20)** – Das Hauptproblem verschiebt sich zum Boss **VI** (nur 4/32 neue KI-Karrieren gewinnen, obwohl 22/32 V gewinnen). Mit wirklich erspielten V-Saves die VI-Fusionen, ACE-Reichweite, Ressourcen und Defensiv-Synergien analysieren. Zusätzlich unveränderte `tempo-board`-Policy vs explorative `ace-reach` auf neuer unabhängiger Train/Holdout-Kohorte vergleichen; echte Karrieren und Legalitäts-/Save-/Economy-Gate beibehalten.

**Produktionsschutz:** Die v9.4-Policy bleibt offline ausschließlich in Testdateien auf `development`. **Keine** automatische Übernahme in `assets/game.js`, produktive NPC-Gegner-KI oder `main`. Ein Offline-Spielercontroller, der besser gegen die NPCs gewinnt, beweist noch nicht, dass eine NPC-Übernahme fair oder spielerisch sinnvoll wäre.


## KI v9.5 – vollständige ACE-/Tempo-Karrieretests (20. Oktober 2026)

**[Vollständiger Abschlussbericht](AI_V95_REAL_CAREER_ACE_RESULTS_20261020.md)** · [v9.5 Actions: SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087337). Beide separaten [Code-/Strategiechecks](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087345) und [Browser-Smokes](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087268) erfolgreich.

**Methodik:** 32 neue unabhängig regulär erspielte Ausgangskarrieren (Seed-Offset **52000**), **64 getrennte Karrierearme**, 16 vorher bestimmte Trainings- und 16 Holdout-Ursprünge. Vergleich ausschließlich der beiden **unveränderten v9.2-Entscheidungsregeln** `tempo-board` und exploratives `ace-reach`. Beide Arme verdienen ihre Karten, XP, Splitter und Shop-Käufe eigenständig im Original-Game durch **4.211 echte `simulateGame`-/`rewardMatch`-Duelle** bis maximal VI, ohne Bonus-Drops, künstliche Siege oder NPC-Änderungen.

**32 Karrieren insgesamt:** Tempo **IV 21/32, V 21/32, VI 1/32**, ACE **IV 19/32, V 18/32, VI 1/32**. Unabhängiger Holdout: Tempo **IV 11/16, V 11/16, VI 0/16**; ACE **IV 9/16, V 8/16, VI 1/16**. Trainingshälfte VI Tempo **1/16**, ACE **0/16**. **Keine Freigabe:** train- und holdoutseitige Wirkung nicht stabil; ACE-Fokus verliert relevante IV/V-Fortschritte (`qualified=false`).

**Wichtigste Ursache für unergiebigen ACE-Test:** Bei keinem der rechtmäßig bei VI angelangten Profile war ein **eigenes ACE** im Inventar oder Fusionsdeck. **0 eigene ACE-Fusionen** im gesamten Training. Ein hoher ACE-Zielwert im Policy-Scorer kann daher keine tatsächlich nicht vorhandene ACE-Karte beschwören. `cardAvailable` erfordert für ACE vorhandenen Besitz; reguläres Splitter-Crafting sperrt ACEs. Die getestete `late-shard`-Karrierestrategie brachte keine eigenen ACEs vor VI hervor – daraus folgt nicht, dass sie global unerreichbar wären.

**VI-Hürde:** Erreichte VI-Saves haben im Mittel eine Hauptdeckstufe **ca. 3,0**, Spielerlevel **ca. 6,7**, verfügbare Splitter **ca. 4,3**. Gleichzeitig steht ein gegnerisches ACE beim Beginn sehr vieler eigener VI-Spielzüge auf dem Feld. Der nächste größere Potenzialbereich ist **legaler stärkender Late-Game-Karten-/Ressourcenaufbau**, nicht weitere ACE-Bewertungsgewichte.

**Nächster Entwicklungsauftrag v9.6:** [Issue #21](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/21). ACE-Verfügbarkeit in Shops/Booster/Unlocks exakt auditieren; danach den bereits bewährten `tempo-board`-Controller in beiden Armen unverändert lassen und ausschließlich eine rechtmäßige Deckbau-/Kauf-/Farming-Priorität auf neuen 16/16 unabhängigen Karriere-Kohorten mit echten VI-Siegen vergleichen. Vor NPC-Produktivsetzung gesonderte KI-Fairness-/Schwierigkeitskontrolle. Bis dahin **`main`, aktive Gegner-KI, Monster-/ACE-Werte, Lootchancen und Preise unangetastet**.


## KI v9.6: Adaptives Freies-Duell-Farming in vollständig legitimen Karrieren (20.10.2026)

**[Trainingsbericht](AI_V96_ADAPTIVE_FARMING_RESULTS_20261020.md)** · [Karriere-Workflow SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187053) · [Code-/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187087) · [Browser SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187062).

**32 neue unabhängige Startseeds** (Offset 56000), je zwei separate echte regulär erspielte Karrierearme (gleicher `tempo-board`-Fusionscontroller, gleiche Shop-/Craft-/XP-/Loot-/Shard-Regeln, eigener Inventarerwerb via `rewardMatch`). **6.669 tatsächlich belohnte Duelle**, 16 Train-/16 Holdout-Ursprünge. Beide mit bis 24 Turnierversuchen je Stufe als **ausschließlicher Offline-Testbegrenzung**, keine Veränderung des Live-Spiels. Alte Routine: 2–5 freie Duelle nach 3 Niederlagen; Alternative: 2–8 freie Duelle nach 2 Niederlagen, je nach Progressionsstufe, öffentlicher Gegner-Angriffskraft, eigener Deckstärke und echter `farmingXpFactor`-Abschwächung.

**Resultat 32 Startquellen (fix vs adaptiv): IV 29/32 vs 28/32, V 29/32 vs 28/32, VI 4/32 vs 8/32.** Im unabhängigen Holdout VI **2/16 → 5/16**. Kosten: **801 zusätzliche freie Kämpfe**, 162 weniger Turnierversuche, **639 tatsächliche Duelle mehr**. Im legalen Startprofil beim Gegner VI waren Spiellevel **6,7 → 7,1**, mittlerer Hauptdeck-Kartenlevel **3,06 → 3,28**. Adaptives Farming kann echten VI-Fortschritt bringen; ein Boss muss nicht beim ersten Versuch fallen.

**ABER `qualified=false`:** In der Trainingshälfte regredierte IV/V um jeweils 2 (15/16 → 13/16), obwohl der unabhängige Holdout dort +1 erreichte. Früh zu intensives Farming und divergierender Loot-/RNG-Verlauf können tatsächlich Karrieren verschlechtern. Mehr freies Farmen ist nicht automatisch effizienter; alle Match- und Ressourcenaufwände müssen miteinberechnet werden. Beide technischen Testgruppen 56/56 Gameplay/Economy und 20/20 KI-Regressionen erfolgreich; getrennte Code-/Strategie-/Browser-QA erfolgreich. Ein erster reiner Test-Konfigurationsfehler (alte max. 22 statt 24) wurde korrigiert und der vollständige Lauf danach nachweislich abgeschlossen.

**Nächste Phase v9.7: [Issue #22](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/22).** Die bewährte moderate Routine bis IV/V lassen und ein **selektives intensiveres Farming erst nach regulär besiegtem V** gegen VI auf komplett frischen 16+16 Quellen testen. Erfolg nur mit unabhängiger IV/V-stabiler VI-Verbesserung und transparenten echten Duell-/Booster-/Shard-Kosten. Die bisher validierte Fusions-KI bleibt konstant, sodass die Wirkung des Farmings isoliert wird. Keine automatische Live-KI-/Game-/`main`-Änderung.


## KI v9.7 – exklusives VI-Farming auf drei echten Karrierearmen, 20.10.2026

**[Detaillierter Bericht](AI_V97_SELECTIVE_VI_FARMING_RESULTS_20261020.md)** · [Trainingsworkflow SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555792) · [Code-/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555820) · [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39371555797).

**32 vollständig neue unabhängig erspielte Ursprungskarrieren**, Seed-Offset **60000**, je drei eigenständig belohnte Arms (96 Karrierearme): moderate bestehende `fixed-farm`, intensive `vi-focused`-Farmwellen und sparsame `vi-efficient`-VI-Vorbereitung, jeweils mit exakt derselben bereits validierten `tempo-board`-Beschwörungs-/Fusionspolicy. Insgesamt **8.992 echte `simulateGame`-/`rewardMatch`-Duelle**, keine künstlichen Karten/Siege, 16 Ursprünge Training und 16 vorab unberührte Holdout. Die komplette echte Karriere inklusive Free-Duellen, Kampfereignissen und Rewards wurde pro Ursprung **bis vor dem ersten VI-Turnierversuch** durch programmatisches Assert als **identisch zwischen allen drei Arms** verifiziert – daher IV/V bei allen **28/32**, ohne frühe Regressionsgefahr.

**VI gesamt:** fix **4/32**, VI-intensiv **6/32**, VI-sparsam **5/32**. **Training:** fix 1/16, intensiv 4/16, sparsam 3/16; trainingsseitige Auswahl `vi-focused`. **Unabhängiger Holdout:** fix **3/16**, intensiv **2/16**, sparsam **2/16**, somit **kein reproduzierter VI-Siegvorteil (`qualified=false`)**. Intensiv erforderte gegenüber fixen Wellen **487 zusätzliche freie Duelle, 438 zusätzliche Gesamtkämpfe und 988 mehr ausgegebene Splitter** für +2 aggregierte Siege; im Holdout allein **291 zusätzliche Free-Duelle bei einem VI-Sieg weniger**. Sparsam benötigte zwar **135 weniger freie / 176 weniger gesamte Duelle** bei +1 aggregiertem Sieg, aber Holdout negativ – nicht selektieren.

**Lerneffekt:** Die v9.6-Vermutung, dass das aggressive Farming den frühen Verlauf verändert, konnte in v9.7 testtechnisch vollständig eliminiert werden; trotzdem bleibt die VI-Farmwirkung stark seedabhängig. Die nächste entscheidende Frage ist **nicht „wie viele Duelle zusätzlich?“**, sondern **„wann bringt das nächste legale freie Duell überhaupt eine relevante Verbesserung?“**

**Nächster Auftrag v9.8: [Issue #23](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/23).** Der Realertrag einzelner VI-Farming-Wellen (nachgewiesener XP-/Deck-/Fusions-/Shard-Zuwachs) soll das STOP/RETRY-Verhalten steuern. Gleiches real besessenes Inventar und Original-Wirtschaftsregeln, neue unabhängige Train/Holdout-Karrieren; VI-Sieg und zusätzlicher Grind gemeinsam bewerten. Keine produktive Spielerautomatik-/Gegner-KI-/Monsterwert-/Loot-/`main`-Änderungen. QA endgültig 56/56 Game-/Economy-Checks, 20/20 KI-Checks und separate Browser-/Strategietests grün. Erster Workflow scheiterte an falsch breit definiertem Frühspiels-Assert (Tier-V-Free-Duelle nach VI-Beginn erfasst); dieser **Testfehler** wurde vor erfolgreicher vollständiger Ausführung korrigiert.


## KI v9.8 – tatsächlich belohntes VI-Farming mit Yield-Stop und unabhängiger Kontrolle (20.10.2026)

**[Vollständiger Bericht](AI_V98_YIELD_GATED_FARMING_RESULTS_20261020.md)** · [GitHub Actions SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831093) · [Code-/Strategiechecks SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831042) · [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831050).

**32 neue unabhängige Ursprünge** (Seed-Offset **64000**), 3 getrennt regulär erspielte Karrierearme pro Ursprung, also **96 Arme mit 10.353 tatsächlich `rewardMatch`-belohnten Duellen**. Train/Holdout 16/16 Ursprünge, unveränderte `tempo-board`-Beschwörungs-/Fusionspolicy und legaler Besitz/Wirtschaft. Die Frühkarrieren sind bis **vor dem ersten VI-Turnierkampf** pro Ursprung eventweise nachweislich identisch.

**Ergebnis:** IV und V in allen drei Armen **31/32**; VI Fixed **5/32**, VI-focused **15/32**, neu eingeführter `vi-yield-stop` **15/32**. Training VI Fixed **3/16**, intensiv und Yield **8/16**. Unabhängiger Holdout Fixed **2/16**, beide VI-Alternativen **7/16**. `vi-focused` trainingsseitig nach Regel bei Gleichstand selektiert; Offline-`qualified=true`. Aber unterschiedliche v9.7-Holdout-Kohorte zeigte **−1** statt +5 VI-Siege. Die Erfolgshöhe ist daher **nicht über alle Karrieren stabil repliziert**, ausdrücklich kein produktiver Live-Rollout.

**Grenzertragsaudit:** Jede durchgeführte intensive Free-Duell-Welle protokolliert echtes verdientes XP/Loot, Nettogewinn von ausgerüsteter ATK und Kartenlevel, Player-Level, Inventarkopien, Fusions-Slots und Coins/Shards. **158/169** VI-focused-Wellen erreichten mindestens eines der noch groben Verbesserungskriterien. Yield-stop übersprang **7** weitere geplante Wellen, doch VI-Siege und Gesamtduellmenge sind **identisch** mit VI-focused (**15 Siege, 3.592 Duelle, darunter 2.337 freie Duelle** je Arm). Damit ist das Ertragsinstrument brauchbar, die Stoppschwelle aber **noch keine nachgewiesene Zeit-/Ressourceneinsparung**. VI-focused / Yield jeweils **551 mehr freie und 423 mehr gesamte Kämpfe** als Fixed.

**Neuer Auftrag v9.9: [Issue #24](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/24)** – Echten Grenznutzen neuer ausgerüsteter Karten/Fusionen pro Farm-Batch und **Fortschritt bei gleicher Duellbudgethöhe** gegen ein strikt fixiertes Kontrollregime auf wiederum neuen legalen unabhängigen Startkarrieren messen. Nicht allein mehr XP/Inventarwachstum als nützlichen Fortschritt einstufen; keine nachträgliche Gewichtewahl aus Holdout-Daten. Die frühe Progression und Live-Spielbalance bleiben unverändert. **56/56** Game-/Economy-/Save- und **20/20** KI-Regressionen sowie separate Browser-/Strategie-CI vollständig bestanden.


## KI v9.9 – faire VI-Kampfbudgets und wirklicher Grenzertrag (20. Oktober 2026)

**[Vollständiger Trainingsbericht](AI_V99_EQUAL_BUDGET_VI_FARMING_RESULTS_20261020.md)** · [GitHub Actions SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163893) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163745) · [Browser SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39376163764).

**Experiment:** 32 vollständig neue regulär erspielte Ursprünge (Seed-Offset **68000**), je 3 getrennte echte Karrierearme (Fixed, `vi-focused`, `vi-budget-roi`), 16 vorab unabhängige Training-/16 Holdout-Ursprünge. **8.998 tatsächlich durch `rewardMatch` belohnte Duelle**; pro Ursprung alle Events und Belohnungen bis vor dem ersten VI-Bosskampf **identisch**. Identische bereits validierte Fusions-/Spieler-KI `tempo-board` in allen Arms. **Gemeinsame harte Offline-Obergrenze von 72 echten Kämpfen ab dem ersten VI-Turnierduell** (VI-Turniere plus vorbereitende freie V-Kämpfe) in allen Armen; zusätzlich retrospektive, aus echten Kampf-Events abgeleitete **35/50-Kampf-Budgets**. Keine Gratis-Loot-/Karten-/Sieg-/Boss-Änderungen.

**VI-Siege aus 32 Startkarrieren bei gleichem VI-Kampfbudget:** `fixed-farm` **2/5/5**, `vi-focused` **1/3/11**, `vi-budget-roi` **0/4/4** bei **35/50/72** echten VI-Phasenkämpfen. **IV/V in allen Arms jeweils 28/32**, frühere Regression ausgeschlossen. Intensives VI-Farming hilft hier **vor allem bei längerem Vorbereitungshorizont**, nicht beim schnellen Sieg: Beim 50-Kampf-Budget gewinnt Fixed **5**, Intensiv nur **3**.

**Unabhängiger Holdout bei 72 VI-Kämpfen:** Fixed **2/16**, Intensiv **6/16**, Budget-ROI **3/16**. Train Fixed 3, Intensiv 5, ROI 1. Nach Vorabkriterien wird der trainingsseitig selektierte `vi-focused`-Arm **offline `qualified=true`** (4 zusätzliche echte Holdout-VI-Siege, mehr Ursprünge besser als schlechter, IV/V unverändert). **Echte Kosten:** Intensiv +521 freie bzw. +437 gesamte Karriereduelle und +1.189 Splitter gegenüber Fixed über 32 Karrieren, für **+6 zusätzliche VI-Siege**; ROI reduziert Grind deutlich, verliert jedoch insgesamt **1 VI-Sieg** gegenüber Fixed und ist nicht validiert.

**Interpretation:** v9.7 hatte auf unabhängigen Seeds noch einen negativen Holdout-Effekt für intensive VI-Vorbereitung, v9.8 und v9.9 positive. Somit ist der Nutzen stark zeitbudget-, Ausgangskarten- und seedabhängig; kein Universalgewinn, kein Boss-Nerf empfohlen und keine Produktivfreigabe für Spielerautomatik/NPCs.

**Nächste Aufgabe v10.0 [Issue #25](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/25):** neu erspielte 16/16-Ursprünge, tatsächliche VI-Erfolge bei explizit festem Kampfzeitbudget, konkrete ausgerüstete Karten-/Fusionstemplate-Verbesserung je regulärem Farm-Batch statt bloßem Inventarwachstum und kontrollierte sparsame Retry-Policy. Die bewährte `tempo-board`-Fusionspolicy bleibt konstant. **QA 56/56 Game-/Economy-/Fusion und 20/20 AI, Browser und Strategie vollständig grün.** `main`, aktive Gegner-KI, Monster/ACE/Shop/Loot und Live-Karriere unangetastet.


## KI v10.0: Deckqualität statt Kartenmenge, gleiches VI-Kampfbudget (20.10.2026)

**[Bericht](AI_V100_QUALITY_BUDGET_VI_FARMING_RESULTS_20261020.md)** · [GitHub Actions Karriere-CI SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042543) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042446) · [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39378042355).

**32 völlig neue unabhängige Ursprünge** (Seed-Offset **72000**), je 3 getrennte legal erspielte Karrierearme auf `freshProfile()`, **9.283 tatsächlich regulär belohnte Kämpfe**, ursprüngliches `rewardMatch` und realer Karten-/Shop-/Splitter-/Fusionsbesitz, unveränderter `tempo-board`-Spielercontroller in allen Arms. 16 Training/16 unabhängiger Holdout. Frühes Spiel **bis zum ersten VI-Turnierkampf** zwischen Arms pro Ursprung exakt identisch, durch Assert bestätigt. Alle Arms erhalten identische höchstens **75 echte VI-relevante Kämpfe** und 24 Turnierversuche pro Tier als ausschließliche **Offline-Testgrenzen**.

**Turniersiege gesamt:** IV/V alle **29/32**. VI Fixed **7/32**, intensiv **10/32**, neue Deckqualitäts-Farmingpolicy **8/32**. Im vorab unabhängigen Holdout VI Fixed **3/16**, intensiv **5/16**, Qualität **4/16**. Der trainingsseitig vorab ausgewählte `vi-focused` gewinnt bei 75 VI-Kämpfen +2 Holdout-Karrieren, 2 verbesserte/0 verschlechterte unabhängige Ursprünge, frühes IV/V nicht schlechter. Nach dem streng fixierten v10.0-Gate **`qualified=true` ausschließlich offline**; die neue Qualitätspolitik ist **nicht** zur vollständigen VI-Siegoptimierung qualifiziert.

**Neue aussagekräftige Budgetkurve (echte VI-Siege aus 32 bei 30/45/60/75 echten VI-/Vorbereitungsduellen):** Fixed **1/5/7/7**; intensiv **2/4/5/10**; Qualität **3/6/8/8**. Im **kurzen/mittleren Budget** kann eine ressourcenschonende Qualitätspolitik besser sein, bei langem Farming gewinnt die intensive Strategie. Das ist eine **explorative budgetabhängige Beobachtung**, kein bereits auf neuen Karrieren abgesicherter Hybrid.

**Reale Kosten:** Fixed **2.911 Duelle, davon 1.645 frei**; intensiv **3.348, davon 2.156 frei** (+437 Gesamt/+511 frei, +1.071 ausgegebene Splitter); Qualität **3.024, davon 1.820 frei** (+113 Gesamt/+175 frei, +463 Splitter). Die neue Farming-Metrik zählt neben ATK und Deckkartenlevel auch **wirklich ausgerüstete DEF, Level-4+-Fusionsmaterialien und legal besessene Fusionstemplates**, statt XP-/Inventarwachstum automatisch als Kampfverbesserung auszugeben. Die Anzahl besessener Templates ist jedoch noch kein Beweis für echte Hand-Fusionstauglichkeit.

**Nächste Runde v10.1: [Issue #26](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/26).** **Vorab** fixierte Kombination: bis zu einem echten VI-Kampfhorizont stärker qualitätsorientiert / Boss-Retry, danach bei weiterhin verlorenen Kämpfen legal intensiver farmen; auf komplett neuen unabhängigen 16+16 Karrieren gegen unveränderte Fixed-/Intensiv-Kontrollen validieren. Insbesondere echte `canCompleteHandFusion`-Zieloptionen statt nur Fusiontemplate-Besitz und Kosten pro tatsächlichem VI-Sieg messen. Hauptschwierigkeit VI bleibt gewollt; keine Gratis-Karten oder Live-Spielbalance-Änderungen.

**QA:** 56/56 Regel-/Economy-/Save-/Fusions-Tests, 20/20 KI-Regressionen plus separate Code-, Strategie- und Browsertests erfolgreich. `main`, Live-NPC-KI und Spielwirtschaft bleiben unverändert.


## KI v10.1: echter Hybrid-Farming-Kontrollversuch auf unabhängigen Karrieren (20.10.2026)

**[Abschlussbericht](AI_V101_HYBRID_VI_FARMING_RESULTS_20261020.md)** · [Actions SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346766) · [Code & Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346678) · [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39379346962).

**32 neue unabhängige Ausgangsursprünge (Seed-Offset 76000)**, je drei getrennte echte, regulär belohnte Karrierearme, 16 train/16 abgesperrter Holdout: **9.839 vollständige `simulateGame`-/`rewardMatch`-Duelle**. Alle Arme haben die gleiche v9.2-`tempo-board`-Fusion und denselben normal legalen Karten-/Shop-/Shard-/Perk-/Lootaufbau; pro Ursprung alle frühen Events **bis vor dem ersten VI-Bosskampf identisch**. Nur ab VI unterschiedliches Free-Duell-Farming. Gemeinsame rein experimentelle VI-Phasenobergrenze **75 echte Duelle**; zusätzlich kumulierte 30/45/60-Duell-Budgets.

**Vorab-Forschungsfrage:** Fixed (2–5 Free-Duelle nach drei Bossniederlagen) vs. unveränderte intensive VI-Vorbereitung vs. **Hybrid: qualitätsorientiertes Farming vor VI-Duell 45, danach intensive Vorbereitung**. Der Hybrid wurde real ausgeführt: **166 sparsame Qualitätswellen und 47 intensive spätere Wellen**, in **24/32** Hybridkarrieren kam der spätere Übergang zustande; 25 Farming-Wellen zugunsten Boss-Retry übersprungen.

**Ergebnisse VI, 32 Ursprünge:** Fixed **3/32**, Intensiv **12/32**, Hybrid **10/32**. IV und V für alle **30/32**; frühere Progression unverändert. **Unabhängiger Holdout** VI Fixed **1/16**, Intensiv **6/16**, Hybrid **5/16**. Trainingsgruppe Fixed 2, Intensiv 6, Hybrid 5. Aufgrund vorher definierter Selektionsregel blieb `vi-focused` der trainingsseitig gewählte Kandidat und besteht mit **+5 echten VI-Siegen im Holdout**, 5 besseren/0 schlechteren Ursprüngen das **Offline-`qualified=true`-Gate**. Aber die 32 Ursprünge sind kleine und wertmäßig variierende Stichprobe; keine Live-Gegner-KI-Freigabe.

**Erstmals echter Hybrid-Zeitbudgetvergleich 30/45/60/75 VI-relevante Kämpfe:** Fixed **1/2/3/3**, Intensiv **2/2/4/12**, Hybrid **2/4/6/10** (alle 32 Ursprünge). Der Hybrid wirkt bei **45–60** Kämpfen eher schneller, während Intensiv bei **75** mehr VI-Siege liefert. Noch **keine unabhängige Qualifikation** des Hybrids gegenüber dem intensiven Arm. Seine tatsächlichen Kosten: Fixed **2.983 gesamt / 1.690 frei**, Intensiv **3.462 / 2.261**, Hybrid **3.394 / 2.184**. Hybrid spart gegenüber Intensiv nur 68 gesamte und 77 freie Duelle bei 2 VI-Siegen weniger.

**Folgephase v10.2: [Issue #27](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/27).** Die bisherige Qualitätsmessung betrachtet tatsächlich erworbene und ausgerüstete Monster/Level-4+-Materialien/Fusionsvorlagen, **aber noch nicht echte legal verfügbare Fusionsoptionen für eine konkrete Hand**. Mit den vorhandenen Originalfunktionen `fusionOptions(g,levels,materials)` und `canCompleteHandFusion(g,levels,choice)` auf realen eigenen Spielzuständen die tatsächliche Fusion-Reife und Effizienz je Farm-Batch messen; gegen beide festen Kontrollen auf neuen 16/16 unabhängigen Karriere-Ursprüngen validieren, echtes Duellbudget beibehalten. NPC-Fairness getrennt, keine Änderung an `main`, aktiver NPC-KI, Monsterwerten, Loot-/Shard-/Shop-Ökonomie und Questregeln.

**QA:** 56/56 Game-/Save-/Fusions-/Economy- und 20/20 KI-Checks, separate Code-/Strategie- und Browserchecks vollständig erfolgreich. Vollständiges heruntergeladenes Artefakt `arcane-hybrid-vi-farming-v101` (GitHub Actions Artifact 12244493037; Ablauf 19.11.2026) enthält jede geprüfte echte Karriere und Budget-/Holdout-Ergebnisse.


## KI v10.2: reale Hand-Fusionslegalität in echten Karriere-NPC-Duellen (20.10.2026)

**[Vollständiger Ergebnisbericht](AI_V102_REAL_HAND_FUSION_READINESS_RESULTS_20261020.md)** · [v10.2 echte Karriere-Action SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802697) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802735) · [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802581).

**32 vollständig neue unabhängig regulär erspielte Quellkarrieren**, Seed-Offset **80000**, drei eigenständig mit echten `simulateGame`-/`rewardMatch`-Belohnungen ausgespielte Arms pro Ursprung, **8.077 tatsächlich belohnte Duelle**. 16 Train/16 unabhängiger Holdout, gleiche unveränderte `tempo-board`-Offline-Spieler-Kampf- und Fusionsentscheidung. Alle echten frühen Events vor erstem VI-Turnierkampf **pro Ursprung vollständig identisch** (CI-Assertion). VI-Testbudget 30/45/60/75 echte VI-Phasenduelle, maximum 24 Turnierattempts nur im Test. Kein Gratis-ACE oder Karten-/Drop-/XP-/Boss-Änderungen.

**Echte Resultate:** IV/V alle drei Arms **25/32**. VI Fixed **8/32**, Intensiv **7/32**, neuer `vi-fusion-ready` **2/32**. Holdout VI Fixed **5/16**, Intensiv **5/16**, Ready **1/16**. Train Fixed 3/16, Intensiv 2/16, Ready 1/16. Trainingsauswahl **Fixed**, **`qualified=false`**, weder intensives Farming noch Fusions-Ready auf diesem neuen Datensatz besser. Die insgesamt früheren positiven v9.8–v10.1-Holdouts belegen damit **keine** von Zufall, Ausgangsdeck oder Zeitbudget unabhängige universelle Farmingoptimalität.

**Neu instrumentiert:** Die echte Engine `fusionOptions(g,levels,materials)` und `canCompleteHandFusion(g,levels,choice)` prüften in realen Spieler-Beschwörungssituationen **alle 2–5-Material-Kombinationen aus den tatsächlich vorhandenen eigenen Handkarten und eigenen Fusionskopien**, ohne verborgene NPC-Hand. **10.009 von 10.220 (97,9 %)** Fixed-Arm-Hand-Situationen in VI-Duellen oder echten Vorbereitungsduellen hatten bereits eine legale mögliche Fusion; Beobachtungen sind **nicht** unabhängig. Damit ist das reine Legality-Signal nahezu permanent positiv. Die neue KI übersprang **283** geplante VI-Farmingwellen, spielte **null** eigene intensive VI-Vorbereitungswellen und verlor **6 VI-Erfolge** gegenüber Fixed. Das ist eine methodisch aussagekräftige **negative Bestätigung**: **Legal fusionierbar heißt noch lange nicht spielstark, gegnerresistent oder taktisch sinnvoll.**

**Budgetkurve VI aus 32 Ursprüngen bei 30/45/60/75 Kämpfen:** Fixed **3/7/8/8**, Intensiv **1/2/2/7**, Fusion-Ready **2/2/2/2**. Aktuell ist nicht weiteres blinde Farming oder das Vorliegen irgendeiner Fusion der Qualitätsindikator, sondern der **belegte tatsächliche Fusions-/Angriffs-/Verteidigungsnutzen auf dem Feld**.

**Nächster Auftrag v10.3 [Issue #28](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/28):** Tatsächlich legal durchgeführte eigene Fusionen mit realisierten ATK/DEF, Rollenstempeln, Materialkosten, Feld-/Monsterüberleben und Schaden gegen den sichtbaren gegnerischen Zustand instrumentieren, eine isolierte Nutzen-Heuristik auf wieder neuen unabhängigen 16/16-Karrieren untersuchen. Das separate Fernziel **produktive NPC-KI tatsächlich trainieren und fair validieren** darf nicht länger mit verbessertem Offline-Spielerautopilot gleichgesetzt werden. Keine Änderungen an `main`, aktiver Gegner-NPC-KI, Karte-/ACE-/Shop-/Shard-/Lootregeln.

**QA:** 56/56 Spiel-/Economy-/Fusion-/Save-Tests, 20/20 KI-Regressions, Browser und Code/Strategie vollständig erfolgreich. Original-Artifact `arcane-real-fusion-readiness-v102`, GitHub ID **12245635409**, bis 19.11.2026, heruntergeladen und echte Budget-/Train-/Holdout-Tabellen unabhängig verifiziert.


## KI v10.3: tatsächlicher Fusionskampfnutzen erstmals instrumentiert (20.10.2026)

**[Vollständiger Bericht](AI_V103_REAL_FUSION_COMBAT_IMPACT_RESULTS_20261020.md)** · [Karriere-CI SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673301) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673224) · [Browser-Smoke SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673226).

**Experiment:** 32 vollständig neue eigenständig regulär erspielte Karriere-Startursprünge (Seed-Offset **84000**), je drei getrennt verdiente Arme (Fixed, unverändertes VI-Intensiv, neu VI-Impact), **10.172 echte belohnte Duelle**, 16 Trainings-/16 zuvor unbenutzte Holdout-Ursprünge. Identische `tempo-board`-Spieler/Fusions-KI in allen Armen, unveränderte Spielregeln und Wirtschaft; frühe echte Rewards/Events bis vor VI pro Ursprung **identisch** (Assertion). Maximales Offline-VI-Kampfbudget **75 reale Kämpfe**.

**IV/V bei allen 31/32. VI gesamt:** Fixed **6/32**, VI intensiv **9/32**, neue Impact-Farmingheuristik **5/32**. Unabhängiger Holdout VI Fixed **2/16**, intensiv **3/16**, Impact **2/16**. Im Training Fixed 4/16, intensiv 6/16, Impact 3/16. Gewählter Intensivarm verbessert den unberührten Holdout nur um **+1**, nicht um geforderte +2; **`qualified=false`**. Kein produktiver NPC-/Main-Rollout. Der neue Impactarm kürzte tatsächlich **156** Farm-Wellen, erzielte aber **vier weniger VI-Siege und 71 mehr gesamte Duelle** als Intensiv; kürzere Einzelwellen garantieren keine echte Zeitersparnis.

**Fusionsaudit:** In echten VI-/Vorbereitungs-Matches Instrumentierung von *tatsächlich vorbereiteten* und *platzierten* eigenen Fusionen, konkret verwendeten 2–5 Materialien, realisierten ATK-/DEF-Werten, weiteren echten Feldfusionen und der sichtbaren Gegner-Feldschwelle. VI-Intensivarm: **16.484 tatsächlich platzierte Handfusionen**, **596 tatsächliche Feldfusionen**, **40.115 verbrauchte Materialien**. Die zugleich gemessenen Angriffs-Kills und LP-Damage summieren jedoch **alle eigenen Angriffe**, sind **noch nicht genau fusionierten Monsterinstanzen zugeordnet**; die sichtbare `wallBreaks`-Schwelle beweist keinen Kill. Echte Fusionsaktionen und Fusionswirkung dürfen nicht verwechselt werden. Metriksummen unbedingt auf Kampf-/Kartenzahl normalisieren.

**Budgetkurve VI-Siege bei 30/45/60/75 echten relevanten Kämpfen aus 32 Quellen:** Fixed **4/5/6/6**, Intensiv **3/4/6/9**, Impact **3/3/3/5**. Intensiv bringt in dieser Kohorte nur beim langen Zeitfenster einige weitere echte Siege; Wirkung bleibt seed-/ausgangsinventarabhängig. Die ertragsgekürzte neue Impact-Policy war unabhängig **nicht besser**.

**Priorität v10.4 [Issue #29](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/29):** Originale **UID fusionierter Feldinstanzen** durch reale Platzierung und Angriffe verfolgen, um wirklich Fusionsmonstern zuordenbaren LP-Schaden, Gegnerzerstörungen, Überlebens-/Defender-Effekte und Nutzen pro geopfertem Material zu messen. Erst dann isolierte Verbesserung auf neuen unabhängigen Karrieren. Separat echtes **NPC-KI-Training/-Fairness** für ACE-Priorität, Defender/Soul-Drain, Predator-/Resonator-Fusion und legale Positionierung anstoßen; die bisherigen Offline-Spielerautopilot-Trainings haben bislang **nicht** die aktive KI der Turniergegner verändert. Keine Anpassung an `main`, Spielbalance, Loot, Shop oder Spielstände.

**QA:** 56/56 Spiel-/Fusion-/Economy-, 20/20 KI-Tests sowie Code-/Strategie-/Browser-Smokes SUCCESS. Original-Artifact `arcane-actual-fusion-impact-v103`, ID **12246773067**, bis 19.11.2026, heruntergeladen und Ergebnis-/Budgettabellen geprüft.


## KI v10.4 – instanzgenaue Fusionszuordnung UND echter separater NPC-Aktionstest (20.10.2026)

**[Vollständiger UID-/Karrierebericht](AI_V104_UID_FUSION_AND_NPC_RESULTS_20261020.md)** · **[eigener NPC-Verhaltensbericht](AI_V104_REAL_NPC_ACTION_AUDIT_20261020.md)** · [Hauptworkflow mit beiden Jobs SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587393) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587212) · [Browser SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587249).

**Karriere-Training:** 32 neue unabhängig legal erspielte Startkarrieren (Seed-Offset **88000**), je 3 getrennte `rewardMatch`-belohnte Arme, **9.744 echte Duelle**. 16 Training / 16 abgesperrter Holdout, pro Ursprung **alle echten Ergebnisse/Belohnungen bis vor dem ersten VI-Bossduell identisch**. Dieselbe `tempo-board`-Spieler-Fusions-KI und Originalwirtschaft in allen Armen, nur Farming nach VI verändert. Offline-Kampfbudget max. 75 echte VI- und legal vorbereitende V-Kämpfe.

**Echte IV/V Siege:** 29/32 in allen drei Arms. **VI-Siege:** Fixed **5/32**, unverändertes VI-Intensiv **9/32**, neue instanzgenaue Fusionsnutzenstrategie **5/32**. Im unabhängigen Holdout Fixed **3/16**, Intensiv **5/16**, UID-Impact **2/16**. Training Fixed 2, Intensiv 4, UID 3. Unverändertes `vi-focused` nach vorab gesetzter Auswahl **offline `qualified=true`** (+2 Holdout-VI-Karrieren, 3 bessere/1 schlechtere unabhängige Quellen); **neue UID-Farmingpolicy nicht qualifiziert** und trotz **273 verkleinerten Wellen** bei **59 mehr Gesamtduellen als Intensiv** vier VI-Siege schlechter. Intensiv hat +557 echte freie/+506 gesamte Karriereduelle und +1.258 zusätzliche ausgegebene Splitter gegenüber Fixed; VI gewinnt +4. Mehr Grinden ist eine legitime, aber kostenpflichtige Spielerentscheidung, kein universelles Default.

**Wichtige technische Neuerung:** `applyAiAction` misst nun tatsächliche auf dem Feld gesetzte Fusionen mit **originaler UID**, verfolgt UID-Wechsel durch Feldfusionen, schreibt tatsächlichen eigenen Angriffs-NPC-Schaden und echte zerstörte Gegnerfeldkarten dem jeweiligen fusionierten Angreifer zu. Im Intensivarm **16.763 echte Fusionsinstanzen, 17.238 instanzzugeordnete Angriffe, 4.254.195 echte NPC-LP-Schadenspunkte und 10.182 zerstörte Gegnerfeldkarten** über sämtliche 32 Karrieren und 1.888 VI-relevanten Kämpfe, zusätzlich 34.734 beobachtete eigene Feld-Zugenden und 42.494 genealogisch zugeordnete Fusionsmaterialkosten. **Etwa 97,5 % aller eigenen tatsächlich verursachten NPC-LP-Verluste kamen von verfolgten Fusionsinstanzen**; daher sind auch »Fusion hat Schaden gemacht« oder »zwei Züge überlebt« keine ausreichend seltenen, differenzierenden Farming-Stopp-Signale. Die Summen sind durch Duellmenge und Zusammensetzung verzerrt, kein kausaler Einzelkarten-Stärkebeleg.

**Unabhängige produktive NPC-Baseline:** Der zweite, eigenständig erfolgreiche CI-Job prüfte **120 tatsächliche Matches (I–X, je 12)** und **4.148** Original-NPC-Aktionen; 424 Handfusionen, 92 Feldfusionen, 1.562 Angriffe, 204 ACE-Platzierungen, **0 ungültige Aktionen / 0 Angriff→DEF-Schalter im selben Zug**. Gegner IX hatte **4 ACE-Platzierungen**, X **0 ACE- oder Handfusionen** in den 12 Runs; **nicht** voreilig als Logikfehler interpretieren, da die Gegenseite nur ein normales Starterdeck war, das Match vor Draw enden kann und ACE-Besitz ≠ ACE auf Hand ≠ legal spielbares ACE.

**Nächster Schwerpunkt:** [**v10.5 Issue #30 – NPC IX/X ACE-Zieh-/Auswahl-Funnel und faire Late-Game-Gegenspieler**](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/30). Hier erstmals an der **tatsächlichen NPC-KI** und deren legalen ACE-/Fusionentscheidung isoliert arbeiten; nach vollständigem Draw-/Legalitäts-Audit und realen erlaubten Gegnerdecks gegebenenfalls eine neue KI-Heuristik auf unberührtem Holdout vergleichen. **Keine** Gratis-ACE-/Loot-/Monsterstat-/Bossbuffs oder Eingriff in `main`/laufende Saves.

**QA / Status:** 56/56 Regel-/Save-/Economy-/Fusionchecks und 20/20 KI-Tests bestanden; Code-/Strategie-/Browser-Smokes grün. Original-Artefakte `arcane-fusion-uid-careers-v104` ID **12248675709** und `arcane-npc-legal-action-audit-v104` ID **12248002346** gespeichert und heruntergeladen. Alle v10.4-Quellcodeänderungen betreffen **nur Offline-Testskripte**; produktive Gegner-NPC-KI und `main` unverändert.


## KI v10.5: tatsächlicher NPC IX/X ACE-Fusions-Funnel und stärkerer Kampfstresstest (20.10.2026)

**[Abschlussbericht mit Original-Rohdaten](AI_V105_REAL_NPC_ACE_FUNNEL_RESULTS_20261020.md)** · [Primär-NPC-KI-Test, 256 echte Duelle – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257302) · [Explorativer stärkerer Decktest, 256 neue Duelle – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390491229) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257104) · [Browser SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257107).

**Gezielt NPCs statt Offline-Spielerautopilot untersucht.** Insgesamt **512 wirkliche komplette PVE-Duelle**, zwei Studien je 256, in jeder 64 Ursprungseeds * zwei Gegnertiers (IX/X) * zwei gepaarte NPC-Policies. 32 Training/32 eigenständiger Holdout je Studienpopulation; neu ergänzter starker Decktest nach Kenntnis der Primärresultate ist **explorativ, nicht präregistrierte Bestätigung**.

**Klarer Mechanikbefund:** Die ACEs von Gegner IX/X sind **Fusionsvorlagen**, nicht normale Handkarten. Die produktive `chooseAiAction`-NPC-Policy lässt viele legal mögliche ACE-Fusionen ungenutzt. Die experimentelle neue ACE-Policy prüfte ausschließlich wirklich gezogene eigene 2–3-Material-Handkombinationen, unveränderte `fusionOptions`/`canCompleteHandFusion`, verfügbare Fusionskopien und das sichtbare Feld, ohne Cheats oder Veränderungen an Werte-/Drop-Regeln. Im ursprünglichen 256er-Test steigen **IX-ACE-Platzierungen von 74 auf 192, X von 0 auf 192**, ohne illegale Aktionen. Aber beide Versionen gewinnen **sämtliche 256 Duelle** gegen Starter und rechtmäßige, aber **nicht erarbeitete** Level-VIII-Gegnerdeck-Proxys; keine Siegverbesserung beweisbar.

**Nachgeschaltete stärkere 256-Match-Studie:** Gegner IX gewinnt mit aktueller NPC-Policy gegen X-easy- und X-hard-Deck-Proxys zusammen **7/64**, mit pauschalem ACE-Fokus nur **5/64**. Bei Gegner X beide Varianten **64/64** trotz ACE-Events **1 → 192**. Wieder **keine** unfairen/illegalen Aktionen, aber deutlich **kein überzeugender Sieg-/Balancevorteil**. Auch stärkerer X-Deck-Proxy ist **kein legitimes erspieltes menschliches Late-Game-Profil**. **Der technische ACE-Funnel funktioniert; die getestete neue Taktik qualifiziert nicht für die Live-KI.** ACE-Frequenz ist keine optimierbare Siegkennzahl.

**Nächster Auftrag [v10.6 – Issue #31](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/31):** Tatsächlichen **ACE-Kampfnutzen pro legal aufgegebenem Fusionsmaterial** und übriger Hand-/Feldstärke, ATK/DEF und Rollenbonus messen; intelligente NPC-Policy, die ACE *nur bei erkennbarem Mehrwert* spielt, auf **regulär verdienten unterschiedlichen Spieler-Late-Game-Decks** in neuen gepaarten unabhängigen NPC-A/B-Duellen prüfen. Die derzeitige KI des Gegners X gewinnt sogar gegen starke NPC-Proxys zu häufig, echtes Fairnessbenchmark vor Produktivoptimierung notwendig. Keine Änderung von `main`, produktiver Gegner-KI, ACE-Werten, Shop-/Loot-/Perk-/Shard- und Questregeln.

**QA:** Beide v10.5-Kampfsimulationsworkflows SUCCESS; normale Code-/Strategie-/Browser-Suite grün, original gespielte Matches mit null illegalen NPC-Aktionen. Vollständige Artefakte `arcane-npc-ace-funnel-v105` GitHub **12249391070** und `arcane-npc-ace-stress-v105` **12249133583** bis 19.11.2026 heruntergeladen. Alle neuen Scripte/Workflows/Berichte nur auf `development`; `main` unverändert.


## KI v10.6: Erstes echtes Gegner-KI-Training gegen regulär erworbene Spielerdecks (20.10.2026)

**[Vollständiger Bericht und Rohdatennachweis](AI_V106_EARNED_NPC_ACE_MATERIAL_VALUE_RESULTS_20261020.md)** · [Korrigierte Original-CI SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957165) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957149).

**Spielerdecks jetzt wirklich verdient:** **32 unabhängige neue Karrieren** aus `freshProfile`, Original-`simulateGame`/`rewardMatch`, reale XP-/Loot-/Drop-/Shard-/Craft-/Shop- und Deckregeln, **2.862 tatsächlich erspielte Duelle**, **26/32** erreichen VI ohne künstliche Progression. Für alle 32 40er-Hauptdecks und Fusionsdecks den echten eigenen Card-Inventar-Kopienbestand nachgewiesen. Diese V/VI-Karrieredecks sind ausdrücklich **nicht** IX/X-Endgame-Spielstände.

**192 unabhängige echte NPC-Matches**: 32 neue Ursprungsseeds; je Szenario (wirklich verdientes Spielerkarrieredeck oder starkes, aber ausdrücklich nur legales X-hard-NPC-Proxydeck), Gegner IX/X, 3 Policies; **8 Training/8 unabhängiger Holdout** pro Szenario/Tier. Gleiches Spieler-Deck/Seed und originale NPC-Decks je Policy. Kontrollarme unveränderte `current`, aggressive `ace-targeted` aus v10.5, neu `ace-value`, die legal vorhandene ACE-2–3-Material-Handfusion anhand realer Vorlagen-ATK/DEF, Kosten geopferter Handmonster, stärkster verbleibender Hand und sichtbarem Gegnerfeld bewertet. Originalresolver führt alle Moves inkl. Fusionswürfe und Materialverbrauch aus, ohne Cheats oder verdeckte Gegnerinformationen.

**Echte Siege:** IX und X gewinnen gegen ehrlich verdiente V-/VI-Karrieredecks je **16/16 pro Policy**. Gegen X-hard-Proxy gewinnt IX **2/16 Original, 1/16 aggressiv, 1/16 wertorientiert**; X **16/16 in allen Varianten**. Die neue Materialwert-Heuristik **nimmt genau gleich oft die ACE-Fusion wie der aggressive Arm** (je **48 tatsächliche ACE-Platzierungen pro Gegner/Szenario**, Original **7/0/21/0**). ACE-UID-Ereignisse mit realem Angriffsschaden und echten Monsterkills gesondert auditiert. **0 illegale NPC-Aktionen und keine beobachteten Angriff→DEF-Positionsverstöße**. Damit **kein** echter strategischer Vorteil im unabhängigen Holdout; neue `ace-value`-Policy **nicht qualifiziert**. Ein ACE-Spam trotz Materialscore zeigt, dass eine **absolute ACE-Mindeststärke** die Opportunitätskosten eines möglichen **besseren konkreten Zuges** noch nicht abbildet.

**Rohdaten/QA:** Original-Artifact `arcane-npc-ace-material-v106`, GitHub **12250631302**, zwei JSON-Dateien für erworbene Decks + alle NPC-Samples. 50/50 Game-/Fusion-/Deck-/Economy- und 20/20 AI-Regressions bestanden. Neutraler Exportfehler bei Spieldaten-Zähler `rewarded` → korrekt `duels` repariert; **2.862** regulär gespielte Karriere-Duelle sind nun exakt protokolliert und unabhängig in CI geprüft. `main`, produktive Gegner-AI, Karten/ACE-Werte und gesamte Game-Ökonomie **unverändert**.

**Weiter mit v10.7: [Issue #32](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/32).** Die KI muss **ACE gegen beste wirklich legale normale und andere Fusionsalternative im selben eigenen Hand-/Feldzustand** antreten lassen, statt ein pauschales ACE-Prädikat zu erzwingen. Gegner IX darf nicht durch Materialverschwendung schwächer werden, Gegner X nicht unfair mächtiger, echte bis VII/IX regulär erlangbare Late-Game-Decks weiterhin untersuchen. Neues unabhängiges 16+16-Holdout; keine nachträgliche Anpassung an die bereits genutzte v10.6-Holdoutmenge und keine unbewertete Produktivintegration.


## KI v10.7: ACE gegen beste echte legale Alternative – Auswahlproblem deutlich reduziert (20.10.2026)

**[Vollständiger Ergebnisbericht](AI_V107_NPC_ACE_BEST_LEGAL_ALTERNATIVE_RESULTS_20261020.md)** · [Hauptworkflow SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292548) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292746) · [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292508).

**Regulär erworbene Spielerkarrieren:** **32 neue voneinander unabhängige `freshProfile()`-Ursprünge**, Seed-Offset **96000**, **3.018 echte von Original-`rewardMatch` belohnte Duelle**; 30/32 erreichten durch reguläre Turniere VI, alle 32 40-Karten-Decks + eigene Fusionskartenvorlagen gegen original verdientes `inventoryOwned` kontrolliert. Kein künstlicher IX/X-Fortschritt, keine Gratis-Karten.

**NPC-Experiment:** **576 echte PVE-Matches**, drei Strategien * drei Deckszenarien (wirklich verdientes V/VI-Spielerdeck, **nur** legales IX-hard-Gegnerdeck als Proxy, **nur** legales X-hard-Deck als Proxy) * IX/X Boss * 32 identisch gepaarte neue Game-Seed-Ursprünge, 16 vorab Train / 16 unbenutzter Holdout. Nur NPC-Entscheidungs-Override, unveränderter Originalresolver. Neue `ace-relative` vergleicht vor jeder ACE-Entscheidung den geschätzten ATK/DEF-, Hand-/Material-/sichtbaren Boardnutzen des ACEs gegen **beste gleichzeitig tatsächlich legale Normalbeschwörung und beste Nicht-ACE-Fusion aus genau der eigenen gezogenen Hand**. Mindestnutzen: 15 % des Alternativscores oder 180 zusätzliche Scorepunkte. Keine verdeckte Spielerhand, kein kontrafaktisches reales Würfeln in der Live-Entscheidung.

**Erste wirklich selektive ACE-KI:** **1.014** reale ACE-legale Beschwörungssituationen aus eigener NPC-Hand analysiert, **994 (98,0 %) nicht übersteuert**, nur **20** eindeutige positive ACE-Overrides. Das ist endlich ein deutlicher Unterschied gegenüber v10.6, das sämtliche ACEs erzwang. Gegner X: **0** Overrides, eventuell noch zu restriktiv. ACE-Platzierungen je NPC-Policy in 192 Matches: Original **77**, v10.6 aggressiv **576**, neu relativ **84**.

**Echte Siegquoten** Original **163/192**, aggressiv **161/192**, neu relativ **163/192**. Gegen legal erworbene V/VI-Spielerdecks IX und X in der Regel **32/32** je Arm; X auch gegen harte NPC-Deck-Proxys **32/32**. Besonders schwere Konstellation IX vs X-hard: Original **3/32**, v10.6 aggressiv **2/32**, neue v10.7 relativ **3/32**. **In jedem unabhängigen 16er-Holdout-Szenario 0 bessere/0 schlechtere Ursprungssiege zwischen Original und neuer KI.** Daher **`qualified=false` als neue bessere NPC-Policy**, auch wenn ACE-Spam verhindert wurde.

**Unveränderte Spielbalance / Code:** Game/Save/Economy/Fusion **50/50**, AI **20/20**, separate Code-/Strategie- und Browsertests bestanden, sämtliche 576 originalen NPC-Aktionen ohne aufgezeichnete Regelverletzung. `main`, `assets/game.js`, aktive Gegner-AI, ACE-/Monsterwerte und Shop-/Shard-/Loot-Mechaniken unverändert.

**v10.8 [Issue #33](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/33):** Auf legalen **kopierten** konkreten NPC-Zug-Snapshots echten ACE-, Nicht-ACE-Fusions- und Normalzug per Originalresolver getrennt ausspielen und tatsächliche Feld-/Material-/Schadeneffekte bewerten; das ist **reine Offline-Forschung, kein Wissen der späteren NPC-AI**. Besonders X-ACE-Aufbau (alle legitimen ACE-Overrides derzeit blockiert) und echte fair erspielte VII/VIII-/IX-Spielerdecks untersuchen. Vorab definierte neue 16/16 unabhängige Karriere- und NPC-Holdouts, nachweisbare reale Win-/Fairnessverbesserung statt ACE-Quote als KPI; keine Produktivübernahme ohne Erfolg.

**Artefakt:** `arcane-npc-ace-relative-v107` GitHub-ID **12251136286**, in ZIP `ai-earned-player-decks-v107.json` und `ai-npc-ace-relative-v107.json`; beide Rohdaten verifiziert (3.018 + 576), Ablauf 19.11.2026.

## Verbindliches Designprinzip: progressive Farming- und Turnierschwierigkeit (v10.8 und danach)

**Designprinzip:** Arcane Duel soll absichtlich nicht auf allen Turnierstufen in derselben Zahl von Versuchen zu bestehen sein. Je höher der Gegner (insb. **VI → VII → VIII → IX → X**), desto mehr **rechtmäßig erspielte** Karten, Splitter/Essenz, Booster, angepasster Deckbau, Perks und effektiv genutzte Fusionen darf und soll der Spieler benötigen. **X darf erheblich mehr Farming/Optimierung als VI voraussetzen.** Der Test darf das nicht fälschlich als KI- oder Gamebalance-Fehler zählen.

**Künftige v10.8-Tests und Auswertung:**
1. **Volle echte Karriere und Tier-Übergänge statt „V/VI-Deck vs X = unfaire KI“:** Nur Gegner X anhand von Spielern bewerten, die IX auf normalem Weg bewältigt und dabei legale X-Vorbereitungsmöglichkeiten tatsächlich genutzt haben. Niedrigstufige earned Decks vs X bleiben ausdrücklich ein Stress-/Entwicklungsindikator, *keine Fairnessreferenz*. Bei fehlenden legitimen X-Profilen eine Progressions-Lücke dokumentieren, nicht X pauschal abschwächen.
2. **Farming ist gewolltes legales Werkzeug:** In freien Duellen absichtlich XP, Karten/Booster, Splitter, Essenz und Ressourcen erwerben. Je Turnierstufe Farmdauer, echte Duellzahl, Fehlversuche, gewählte eigene Decklisten, Shop-/Shard-/Perk-Kosten und Veränderungen der Karten-/Fusionsqualität erfassen. Farm-/Deckbuilding-Verhalten dem Controller ermöglichen; **nicht künstlich ohne Vorbereitung von VI zu X durchmarschieren lassen**.
3. **Schwierigkeit an sinnvollem Fortschritt messen:** Fehlschläge und steigende Kosten sind legitim; aber ein *Softlock* oder nahezu unüberwindbare Ressourcen-Barriere trotz effizienter legaler Verbesserungswege ist ein echtes Problem. Pro Tier den Ertrag zusätzlicher Free-Duelle, echte Siegchancen nach Upgrades und mögliche Verbesserungspfade prüfen. Nicht allein die rohe Niederlagenzahl optimieren.
4. **Budget je Turnierstufe adaptiv/transparent statt identischer Grenzwert für VI bis X:** Die längeren X-Farmfenster müssen ausdrücklich erlaubt sein. Zum fairen A/B-Vergleich **innerhalb einer Stufe** erhalten Test-Policies dasselbe angemessene Maximalbudget bzw. dieselbe gestaffelte Budgetkurve; konkrete Schwellen erst auf neuen Trainingsseeds bestimmen und dann auf einem getrennten Holdout einfrieren. Keine Gratisgewinne/garantierten Drops.
5. **Erwartung qualitativ progressiv, keine erfundene Zahl:** IV/V frühe Lernhürden, VI mittlere Hürde, VII–IX verstärkte Deckoptimierung und X Endgameprüfung. Echte Ziel-/Median-/Perzentilwerte erst aus regulären Full-Career-Daten ableiten, nicht willkürlich „X mindestens 100 Duelle“ behaupten. Schwierigkeitsprogression ist ein Designziel, keine harte Forderung, dass jeder einzelne Zufallsseed monotone Mehrversuche aufweisen muss.
6. **NPC-Training getrennt vom Farming:** ACE-Politik weiterhin ausschließlich unter denselben fair vorbereiteten Spieler-Decks und erlaubten eigenen sichtbaren NPC-Karten/öffentlichen Felddaten testen. Ein ACE-Spam oder eine NPC-Schwächung zur Erzwingung fixer 50-%-Winrates ist nicht das Ziel. Aktive NPC-KI, Shop/Reward-/Drop-/Monsterwerte, `assets/game.js` und `main` bis zu gesonderter erfolgreicher Freigabe unverändert.

**Messpaket zur nächsten Trainingsrunde:** pro Stufe (a) erstmaliges Erreichen, (b) reale Free-Duelle bis Sieg, (c) Turnierversuche, (d) Ressourcen-/Deck-/Fusionsentwicklung, (e) echtes Boss-Ergebnis in Budgetstufen, (f) Anteil tatsächlich nachhaltig weiterentwickelbarer und softgelockter Karrieren; unabhängige Train-/Holdout-Aufteilung. Ziel: ansteigende, aber **faire und lohnende** Late-Game-Herausforderung, keine möglichst schnellen X-Siege.


## KI v10.8: komplett regulärer progressiver Turnier-Test I–X plus echter NPC-Fusions-Counterfactual (20.10.2026)

**[Vollständiger Abschlussbericht und Rohdaten](AI_V108_PROGRESSIVE_CAREER_COUNTERFACTUAL_RESULTS_20261020.md)** · [Haupt-CI SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666313) · [Code/Strategie SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666349) · [Browser SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666297).

**Neue Designprämisse verifiziert:** Gegner X soll und darf **deutlich mehr gezieltes Farming als VI** verlangen. Das KI-Training bewertet nicht mehr bloß die Geschwindigkeit des Durchmarschs, sondern wirksam verdiente Ressourcen und steigende, aber grundsätzlich überwindbare Turnierhürden. Ohne legitime Erreichbarkeit von X **keine** Fairnessurteile auf Basis schwacher VI-Spieler.

**Legitime Progressionsstudie:** **32 unabhängig neue Seeds (100000 ff.)**, je zwei I–X-Karriere-Strategien, **7.963 originale `simulateGame`-/`rewardMatch`-belohnte Matches** (64 Arme), 16 Train/16 abgesperrter Holdout, identischer Kampf-/Belohnungszustand bis vor erstem VI-Versuch (harte Assertion). Moderates bisheriges Farming vs. ab VI zunehmend längere legale Vorbereitung; **kein** Live-Gameplay-Tuning, keine Gratis-Clears, Drops, Shop- oder ACE-Buffs.

**Echte Siege IV/V bei beiden 30/32; VI Fixed 6/32 und gestaffelt 10/32** (Train 2 vs 5, unabhängiger Holdout 4 vs 5; letztere Differenz nur **+1**, keine gesicherte allgemeine Policy-Verbesserung). **VII 0 Siege** trotz Erreichen durch sechs Moderate- bzw. zehn Progressive-Karrieren; VIII–X ohne Freischalt-Cheat nicht erreicht. Progressive-Variante über alle Karrieren 4.427 echte Gesamtduelle / 2.880 freie, Fixed 3.536 / 1.972.

**Entscheidender neuer Engpass VII:** Zehn legitime VII-Spielstände absolvieren **300 reale VII-Turnierduelle ohne Sieg** plus **680 tatsächlich legal belohnte freie VI-Vorbereitungsduelle in 70 Wellen**, **50/70 mit positivem ausgerüstetem Deckqualitätssignal**. Pro Batch etwa +12,2 ausgerüstete Durchschnitts-ATK, +13,1 DEF, +0,128 Kartenstufe und +4,4 legitime Kartenkopien; **null zusätzliche legal besessene Fusionsvorlagen im Batchdurchschnitt**. Echte Karten-/Levelverbesserung findet statt, aber bisher kein Bossdurchbruch. **Kein Beweis eines allgemeinen Softlocks**: längere/anders strategische Farming-, Deck- und ACE-/Fusion-Reifewege müssen erst geprüft werden.

**Neue NPC-Forschung mit Originalaktionen:** Auf **256 echten IX/X-Duellen** (unveränderte vs relative ACE-Politik auf legitimen earned VII/VIII-**Vorbereitungs**decks oder explizitem nicht-verdienten X-hard-Proxy) wurden **512 eigene echte NPC-Beschwörungssituationen** dreifach auf **getrennten legalen Game-Kopien** mit originalem Resolver und RNG gerollt: ACE, beste Nicht-ACE-Handfusion, Normalbeschwörung. Originalseed und eigene Hand blieben 512/512 unverändert, Forschungswürfel nie in NPC-Livewahl zurückgespeist. Nach materialbelasteter *momentaner* Boardmetrik Normal **482/512**, ACE **30/512**, Nicht-ACE **0/512** am besten; **keine** Aussage über langfristige Fusions-/Soul-Drain-/ACE-Synergien. Echte NPC-Siege **103/128 vs 103/128**, alle vier 16er Holdout-Szenarien 0 bessere/schlechtere Siege; neue NPC-KI nicht qualifiziert.

**QA:** Original 50/50 Game-/Fusion-/Save-/Economy- plus 20/20 KI-Tests, Code-/Strategie-/Browser SUCCESS. Erster Progressionstest hatte **korrekt einen unterschiedlichen Player-Combat-Controller vor VI entdeckt und abgebrochen**, dann Fix zu identischer `tempo-board`-Steuerung, vier-Ursprungs-Regression [SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398815523) und vollständiger finaler CI-RUN SUCCESS. Rohartefakt `arcane-progressive-counterfactual-v108` ID **12254590517** mit echten Karriere-/NPC-Daten heruntergeladen, Ablauf 19.11.2026.

**Nächste KI v10.9: [Issue #34](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/34).** Reale VII-Spielstände weitertrainieren und längere gestaffelte Vorbereitung gegenüber alternativer legitimer **Ressourcenverwendung/40er-Deck-/Fusionsdeck-/Rollenstrategie** vergleichen. Konkret messen, ob das Fusionsvorlagenwachstum stagniert und welche legalen neuen Karten-/Perk-/ACE-Quellen VII überwinden lassen. Die höhere Difficulty ausdrücklich nicht durch künstliche Siege oder generelles Nerfen verschwinden lassen. `main`, aktive Gegner-KI, Spielbalance vollständig unverändert.

## Progression-/Economy-Balance-Rework: Booster-Siegel, Fusionsbooster und drei Rollen-Perks (20.10.2026)

**[Ausführliche, implementierungsreife Design-Spezifikation – Issue #35](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/35)**. Vom Nutzer als nächstes zusammenhängendes Balance-Update begrüßt; **noch kein Live-Gameplay-Commit**. Verknüpft mit der VII-Farming-/Fusionsreife-Diagnose aus [v10.9 Issue #34](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/34).

**Originalzustand bestätigt:** `assets/expansion.js` bietet bereits `buyFusionPack()` mit genau **1 garantierten legalen Nicht-ACE-/Nicht-Meilenstein-Fusionsvorlage** an, Essenzpreis `ceil(boosterPrice(highestCleared(),10)*1.8/10)*10`. Nicht mit dem separaten Charakterpack (3 Angebote, erstes gratis, niedriger seltener Slot) verwechseln. `assets/game.js` besitzt bereits `coins` (Essenz), `shards` (Splitter), Skill `Kartenspürsinn` und zwei alternative Kartenverwertungen (`sellCard` zu Essenz, `salvageCard` zu Splittern).

**Neues Zieldesign:** Fusionspacks als **1er-/2er-/5er-/10er-Pack mit jeder einzelnen garantierten echten, regelkonform freigeschalteten Fusion**, fairen Volumenrabatten, niemals ACE/Quest-/Meilenstein-Sonderkarten. **Eigene Booster-Siegel-Währung** aus realen Kämpfen/Turnieren/Meilensteinen, Essenz künftig auf Kampfausbau konzentrieren. Bestehende Spielstände unbedingt sicher migrieren und Essenz-/Splitterbestand schützen. Überflüssige Karten perspektivisch nur gegen Essenz verkaufen; vollständige Shard-Crafting-/Forschung-Ersatzversorgung vor Entfernung von `salvageCard` zwingend prüfen.

**Dynamische Drops:** Mit höchstem legal gewonnenen Turniergegner zunehmend hoher Anteil **höherstufiger, aktuell freigeschalteter normaler Karten** in der vorhandenen Dropchance; getrennt ausweisen, ob Dropquote, Level-Gewichtung oder Fusionsseltenheit geändert wird. **Großwildjäger** bevorzugt *wirklich noch nie gesammelte* hochwertige Karten stärker als bereits bekannte (nicht durch Verkauf ausnutzbar); kein vorzeitiges Freischalten. **Kolossenkraft / Hochstufen-Perk** verstärkt hohe **normale** Monster (ca. LV6–10) in ATK/DEF unter harter Begrenzung gegen vorhandene Rolle-/Monstertraining-Boni. **Schwarminstinkt** legt den Schwerpunkt auf **LV1–5 als eigene Fusionsmaterialien**, Poker-/Kombos und begrenzte Fusionsqualität statt rohe Stats; mit bestehender LV1-`Verbotene Forschung` abgestimmt. Künftige spezielle **Ziel-Fusionslevel 5–7**-Fähigkeiten sind **vorgemerkt**, aber noch nicht Bestandteil der ersten Economy-Promotion.

**Balancing-Absicherung:** Zuerst individuelle Tests auf realen legal verdienten Karrieren, dann kombinierter Economy-Test: unbeänderte Baseline vs dynamische Drops vs Pack/Siegel-System vs 3 Perks vs Kombi; pro Arm neue 16 Train-/16 Holdout-Herkunftsseeds, echte Belohnungen, genaue Karten-/Fusionsneuheiten und ausgerüsteten Deckqualitätsgewinn, Splitter-/Siegel-/Essenz-Wirtschaft, karrieretierbezogene Herausforderung, echte VII-Erreichbarkeit und spätere VIII–X-Fortschritte, keine künstliche Boss-Schwächung. **Gewollt steigender Farmingbedarf** von VI nach X bleibt fester Designgrundsatz. Produktive Gegner-AI, `main`, vorhandene Spielerdaten und Loot-/Shopwerte unverändert, bis gesondert genehmigter und per CI nachgewiesener Balance-Rollout.


## Balance-Release v10.9 auf development: alle gemeinsam geplanten Packs/Währungen/Perks implementiert (20.10.2026)

**[Technische Übersicht](BALANCE_ECONOMY_V109_IMPLEMENTATION_20261020.md)** · [Issue #35 mit Umsetzungsbericht](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/35).

**Tatsächliche Spieländerungen:** Fusionsbooster 1 Karte **1 Fusion**, 3 Karten **1–2 Fusionen**, 5 Karten **2–3 Fusionen**, 10 Karten **3–5 Fusionen**; **der Rest immer legale normale Monster**, nie ACEs/Quests/Milestones. Preise **4/10/16/28 Booster-Siegel**. Neue vom Essenzguthaben entkoppelte **Booster-Siegel**: Standardbooster kosten 2/5/8/14 Siegel, Gewinne erzeugen echte Siegel (+2 manuell / +1 Auto, +5 erste Turnierclear), kein mehrfaches Matchclaiming. Bei Siegen +1 Splitter manuell oder geboostet Auto, plus +2 erster Turnierclear als kleiner Ersatz für entfallende Shard-Salvage-Quelle. Kartenverwertung per bisheriger Sale- und Salvage-Aktion bringt nur Essenz, alte Deckkopien und Favoriten werden geschützt.

**Dynamische Dropwahrscheinlichkeiten:** Nur innerhalb des bereits vorhandenen legalen Original-Normal-Droppools verändert sich die **Level-Gewichtung** mit dem höchsten tatsächlich bezwungenen Turniergegner. Globale Kartendropchance und ACE-Rare-Quote bleiben unverändert. Drei neue echte upgradebare Perks: **Großwildjäger** (mehr Gewicht für bisher unentdeckte hochwertige Normalkarten), **Kolossenkraft** (nur normale Level 6–10 mehr rohe ATK/DEF), **Schwarminstinkt** (nur echte Level-1–5-Material-Kombofusionen, bis 7,5 % Qualität). Die **später geplanten speziellen LV5–7-Fusionsfähigkeiten** sind bewusst nur als zukünftiges System vorgemerkt.

**Save-Sicherheit:** V3-Profilversion, alte Karten, Coins, Splitter, Erfolge, besondere Lv1-Quests und gekaufte Monster unverändert. Optional migrationsfähiges Feld `boosterSeals`, entdeckte Monster-Timeline und neue Perkränge; kein Reset bestehender Nutzer-Spielstände. Alle neuen Käufer verwenden tatsächliche Wallet-/Pool-/Duplikatsprüfungen.

**QA/Status:** [Booster+Perk-CI SUCCESS #39405412030](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405412030); [vollständige Gameplay/Chrome-Browser QA SUCCESS #39405810655](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405810655); [Code/Strategie SUCCESS #39405810668](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405810668). **Entwicklungsbranch aktualisiert, `main` nicht verändert, aktive Gegner-NPC-KI unangetastet.**

**Als nächstes:** Wirkliche neue VII-/VIII-/IX-/X-Farming-Karrieren mit dem neuen Wirtschaftsmodell und Dropgewichten simulieren; pro Tier legal gezogene Neu-Karten, Fusionsinventar und effektives Deckwachstum, farm Duellzahlen, Siegel-, Shard- und Essenzsaldo prüfen. Training/Holdout mit eingefrorenen neuen Parametern. Die stärkere Endgame-Vorbereitung ist gewollt – nur echte Ressourcen-Softlocks gelten als Problem.

## KI-Akademie v13.7 – Kurswechsel zu historischem Lernen, Gegenproben und Experten-Liga (21.10.2026)

**Neue maßgebliche Roadmap:** [AI_TRAINING_ROADMAP_V137.md](AI_TRAINING_ROADMAP_V137.md) · **Pilot:** [Actions #39641190561](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39641190561).

**Abgelöst wird das reine „noch mehr Self-Play-Duelle“-Paradigma.** Hauptziel ist das systematische Erlernen der gesamten Arcane-Duel-Mechanik – legaler Spielzustand, Hand-/Feldfusion, Rollen- und Resonanzsynergien, ACE, Zerfall, Pokerspezialboni, Verteidigung/Seelenentzug, LV1-Quests, Wirtschaft und 2–3-Zug-Planung. Jeder Themenblock braucht separate, echte Engineprüfungen und spätere Transfer-Tests.

**Historie wirklich berücksichtigt:** v13.5/v13.6-Champion mit 1.920 erfassten Spielen; die drei vollständigen v13.6-Reports aus originalem GitHub-Artefakt geladen und ihre Leistungsverläufe geprüft. Die 120 alten Replay-Einträge enthalten **nur verkürzte Gradienten und Matchergebnisse**, keine reproduzierbaren Entscheidungen. Historisch *konkrete* optimale Alternativaktionen lassen sich daraus nicht behaupten.

**Gegenproben-Pilot:** in `tests/ai-history-counterfactual-v137.cjs` 18 Startfälle mit tatsächlichen PvE-Regeln, gleichen Decks/Startpositionen/Spielzuständen bis zur Verzweigung. Jeweils zwei verschiedene legale Beschwörungs-, Fusions- oder Angriffsentscheidungen zu Ende simuliert: In 3/18 Fällen verschlechterte die Alternative das Siegergebnis, in 15/18 änderte es sich nicht; in 0/18 verbesserte es sich. LP-Differenzen werden separat erfasst. **Nur Illustrationen einzelner Seeds, keine generalisierbare Rangliste oder perfekter Counterfactual** (Zufallsverbrauch kann nach alternativen Zügen divergieren). 48 zusätzliche Expert-League-Duelle gegen den eingefrorenen Champion; keine Testpolitik wurde promoviert.

**Künftige Umsetzung:** v13.8 persistente regelversionsgebundene Entscheidungs-Snapshots und legale Alternativen; v13.9 curriculum-gesteuertes Lernen aus bewerteten Gegenproben statt bloßem terminalen Sieg-Bonus, Multi-Step-Brettsuche mit Engine; neue und alte Experten regelmäßig gegeneinander, mit unabhängiger Holdout-Promotion. Kein Berühren von `main`, Live-Gegnern oder Spielerdaten bis zu einer separat verifizierten Integration.
