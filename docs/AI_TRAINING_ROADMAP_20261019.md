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
