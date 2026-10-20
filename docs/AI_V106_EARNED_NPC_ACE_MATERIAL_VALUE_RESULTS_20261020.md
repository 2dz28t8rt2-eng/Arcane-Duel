# Arcane Duel – KI v10.6: ACE-Materialbewertung gegen ehrlich erspielte Spielerkarrieren

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Live-NPC-KI:** unverändert.

**Abgeschlossene CI-Prüfung:** [v10.6 vollständige Karriere- und NPC-Studie #39392957165 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957165), nach Korrektur eines rein exportbezogenen Zählerfehlers. [Code/Strategie #39392957149 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957149). Die erste technisch erfolgreiche Studie [#39392639829](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392639829) lieferte identische Spielmetriken, hatte jedoch `realEarnedGames=null` gemeldet, weil die Exportdatei einen nicht zurückgegebenen Namen `rewarded` verwendete. Die korrigierte Wiederholung greift auf das tatsächlich dokumentierte Feld `duels` zu; Strategieseeds/Heuristik unverändert. [Browser-Smoke der ursprünglichen v10.6-Testversion #39392639548](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392639548) war noch in Ausführung bei der Erstprüfung; auf dem letztgültigen Codezweig wurden Game-Regressions im Trainingsjob erfolgreich absolviert.

**Originalartefakt:** GitHub Actions `arcane-npc-ace-material-v106` ID **12250631302**, Ablauf **19.11.2026**, ZIP enthält `ai-earned-player-decks-v106.json` und `ai-npc-ace-material-value-v106.json`. ZIP mit beiden Dateien heruntergeladen, auf dem Modellrechner geprüft. Inhalt summiert genau 32 unabhängige Karrierequellen und ihre NPC-Vergleiche.

## 1. Endlich echte verdiente Spieler-Inventare statt ausschließlich NPC-Deck-Proxys

Ein separates v10.6-Skript hat von Grund auf **32 eigene unabhängige `freshProfile()`-Spielerkarrieren** durch das unveränderte Turnier, reguläre kostenlose Farmingduelle, `simulateGame`, `rewardMatch`, Original-Shop-/Pack-/Craft-/XP-/Shard- und Deckprüfung gespielt. **2.862 echte regulär belohnte Karriereduelle**; keine erworbenen Karten, Level oder Siege künstlich gesetzt.

**26/32** erreichten auf regulärem Weg den Zugang zu Turniergegner VI. Alle **32** lieferten ein legitimes, anhand eigener `inventoryOwned`-Kopien nachgeprüftes 40-Karten-Hauptdeck samt tatsächlich besessenen Fusionsvorlagen (bei unerreichtem VI aus dem letzten legal erreichbaren IV-/V-Stand). Keine Karte wurde nur aufgrund von theoretischer Freischaltbarkeit, geänderter Dropchance oder fremdem Fusionspool künstlich hinzugefügt. Das sind **keine** behaupteten vollständig erkämpften IX-/X-Endgame-Decks; die ehrlich erspielte Karriere stößt schon vorher an Hürden.

## 2. NPC-Policy-Experiment mit gleichen tatsächlichen Spielseeds

Drei **reine NPC-Entscheidungscontroller** wurden im Original-Kampfresolver auf gepaarten Seeds getestet:

1. **`current`**: vorhandene unveränderte Gegnerentscheidung.
2. **`ace-targeted`**: legal mögliche ACE-Fusion aus 2–3 echten eigenen Handmaterialien nach der v10.5-Mindestwertprüfung aggressiv spielen.
3. **`ace-value`**: vor der legalen ACE-Fusion konservativ die erwartete ACE-ATK/DEF, Stärke der verbrauchten 2–3 Materialien, stärkste verbleibende Handkarte und die **sichtbare** gegnerische Feldschwelle bewerten; nur bei positivem Scoresignal ACE wählen, sonst Originalentscheidung. Dabei bleibt der tatsächliche ursprüngliche `applyAiAction` inklusive Material-/Fusionskopienverbrauch und Qualitätswürfel allein zuständig.

**32 Startseeds**, je Gegner IX/X, drei NPC-Varianten, pro Ursprung eines von zwei Spielerdeck-Szenarien: **16 ehrliche eigene erspielte Karriere-Decks** und **16 deklarierte X-hard-Gegnerdeck-Proxys**. Das entspricht **192 vollständig ausgespielten NPC-Matches**: pro Szenario/Gegner **16 pro Arm**, in je **8 Train- und 8 unberührte Holdout-Ursprünge** geteilt. Die Ursprungsseeds stammen nicht aus v10.5, und die konkrete Karte/Hand/Statistik der Gegenseite wird von der NPC-Wahlheuristik nicht verdeckt abgefragt. Das zweite Szenario X-hard ist zwar regelkonform, **aber kein erspieltes Spielerprofil**; deshalb deutlich getrennt vom verdienten Inventar ausweisen.

## 3. Echte NPC-Siege

| Szenario (je 16 Matches pro Arm/Gegner) | Bisherige NPC-KI | Aggressive ACE-KI | Materialwert-KI |
|---|---:|---:|---:|
| **IX gegen ehrliche Karriere-Decks** | **16** | 16 | 16 |
| **X gegen ehrliche Karriere-Decks** | **16** | 16 | 16 |
| **IX gegen X-hard-Deck-Proxy** | **2** | 1 | 1 |
| **X gegen X-hard-Deck-Proxy** | **16** | 16 | 16 |

Damit gewinnen X-NPCs **32/32 Matches je Policy** in beiden Deckszenarien, und die IX-NPCs gewinnen **alle 16/16** gegen wirklich erspielte (noch niedrigere) Karrieredecks; **keine** faire Schwierigkeitskalibrierung und **keine** nachweisbare Gewinnsteigerung der neuen ACE-Policy.

**Unabhängiger Holdout auf den schwereren X-Deck-Proxys:** Für Gegner IX erreicht die unveränderte KI **1/8**, die pauschale ACE-Strategie **1/8** und die neue Materialwert-KI **1/8** echte Siege. Ihre gepaarte Differenz gegenüber Original ist **1 Ursprung besser / 1 schlechter / 6 gleich**. In der Trainingshälfte gewinnt Original **1/8**, beide ACE-Policies **0/8**. Gegner X gewinnt in Train und Holdout weiterhin jedes Match. Kein vordefinierter Erfolgsvorteil, deshalb **`qualified=false` für eine Live-Promotion**.

## 4. ACE-Funnel und tatsächlich zugeschriebener Kampfnutzen

Die echten ACEs von IX/X sind **`fusionOnly`** und werden nicht als normale ACE-Handkarten gezogen. Für alle drei Varianten wurden die legitimen eigenen Handmaterialien, `remainingFusion`, originale `fusionOptions`/`canCompleteHandFusion`-Legality und anschließend die tatsächlich erfolgreich **vorbereiteten und platzierten ACEs** gemessen. Die neue Analyse verfolgt die UID des tatsächlich gesetzten ACE-Monsters für dessen **eigene** spätere Angriffe, LP-Schaden und zerstörte Gegnerkarten. Es wird nichts aus dem allgemeinen Schaden normaler Angreifer als ACE-Schaden ausgegeben.

| Tatsächlich ausgeführte ACE-Platzierungen, je 16 Kämpfe | Original | Aggressive Variante | Neue Wertevariante |
|---|---:|---:|---:|
| IX vs erspieltes Deck | 7 | **48** | **48** |
| X vs erspieltes Deck | 0 | **48** | **48** |
| IX vs X-hard-Proxy | 21 | **48** | **48** |
| X vs X-hard-Proxy | 0 | **48** | **48** |

**Auffällig:** Die neue Heuristik hat in allen untersuchten Szenarien **genau dieselbe Anzahl ACE-Entscheidungen und Platzierungen** ausgelöst wie die aggressive Policy. Sie hat zwar Unterschiede in den gewählten Materialien und real erzielten Angriffsresultaten erzeugt, aber ihr absoluter Mindest-Score war unter den vorhandenen ACE-/Handwerten **praktisch nie ein Filter**. Der Score allein ist deshalb noch kein belastbarer relativer Nutzenvergleich.

Im starken X-hard-Szenario wurden dem ausgeführten ACE-Angreifer bei IX **10.930 echte NPC-Angriffs-LP-Schadenspunkte** unter Original, **925** unter aggressiver und **1.025** unter Werte-Heuristik zugeordnet. Materialaufwand **42 vs 96 vs 96** echte Handmaterialien, ACE-Ausspielungen **21 vs 48 vs 48**. Die beiden ACE-Fokus-Varianten erbringen hier also bei höheren Materialkosten erheblich **weniger direkt zugerechneten ACE-Schaden**. Die Werte sind summierte kleine Stichproben, ohne Kontrolle für wechselnde eigene Board-Positionen und Matchdauer: **kein kausaler Beweis**, dass ACE als Karte schwach ist; ein Hinweis, dass die Art und der Zeitpunkt der Fusion ungeeignet sein könnten.

**Regelprüfung:** Alle **192** echten NPC-Duelle endeten regulär, **0 unzulässige NPC-Aktionen, 0 im Test beobachtete Angriff→DEF-Wechsel derselben UID**. Zusätzlich 50/50 Kernregel-/Fusion-/Deckregressionen und 20/20 KI-Regressions im Hauptworkflow bestanden.

## 5. Ableitungen und v10.7-Plan

1. **Vorsichtige Schwelle ist keine echte Opportunitätsrechnung:** Trotz ATK-/DEF-/Materialbewertung wurde ACE in allen hier ersten beobachteten Situationen genauso oft gespielt wie unter pauschalem ACE-Fokus. Statt absolutem statischem ACE-Mindestwert den **besten legalen alternativen Spielzug** im **identischen aktuellen** Hand-/Feldzustand mit ACE konkret vergleichen. Insbesondere Verlust zweier oder dreier starker Karten und die Chance, das ACE sinnvoll auf dem Feld zu platzieren, müssen die Nullhypothese „lieber normale Beschwörung“ schlagen.
2. **Nicht nur Schaden-Summen:** An der **konkreten ACE-UID** messen: wirklich ausgespieltes Board, sofortiger Angriff möglich, gegnerische sichtbare Schwellen, Überleben des nächsten gegnerischen Angriffs und Materialkosten **pro tatsächlich besserer Position**. Keine versteckten Gegnerdeck-/Handinformationen.
3. **Late-Game-Realismus:** Ehrliche V-/VI-Karrieredecks sind gegen IX/X hoffnungslos unterlegen – bislang **alle Siege auf NPC-Seite**. Somit eine neue Pipeline vorbereiten, die echten Spielerverlauf zu VIII/IX ohne Gratis-Progression abbildet; wenn keine Karriere rechtmäßig so weit kommt, diese Lücke transparent als Progressions-/Balance-Erkenntnis berichten. Nicht NPC-X-Siege gegen frühe Decks als faire Schwierigkeitskalibrierung deklarieren.
4. **Kontrollierter nächster Test:** Original-NPC vs. ein relativer ACE-vs.-Normal-/Non-ACE-Fusionsvergleich, *keine erneute bereits gesichtete Holdout-Optimierung*. Neue unabhängige Seeds und weitere alternative Deck-Archetypen (Predator, Defender/Soul Drain, Resonator) über legal verdiente Karten, sofern vorhanden; ein eigenes unberührtes Holdout sowie Deck-/ACE-/Duel-Effizienzmetriken.
5. **Fairness-Gate:** Kein automatischer ACE-Spam und keine unbegründete Schwächung/Übermacht der NPCs. Erst bei höherer echter strategischer Leistung gegen angemessen starke legal erarbeitete Spielerdecks und 0 Regelverstößen darf eine begrenzte Entwicklung für die Live-NPC-AI auf `development` separat geprüft werden; `main`, aktiver KI-Code und komplette Economy bleiben **unverändert**.

## Technischer Status / Reproduzierbarkeit

- [**v10.6 finale Karriere-/NPC-Aktion SUCCESS**](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957165) mit **2.862 regulär belohnten Karriere-Duellen** + **192 echten NPC-Battle-Tests**.
- **50/50** Kernspiel-/Deck-/Fusionsregressionen und **20/20** AI-Tests bestanden; [Code & Strategie #39392957149 SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39392957149).
- Artefakt `arcane-npc-ace-material-v106`, **12250631302**, mit verifizierter echter Datei `ai-earned-player-decks-v106.json` und `ai-npc-ace-material-value-v106.json`. Kein Datensatz wurde als exakter XIX-/X-Endgame-Player-Bestand ausgegeben.
- **Kein Merge** der experimentellen ACE-Heuristik in die aktive KI oder `main`; `development` enthält lediglich neue getrennte Testskripte, Workflow und diese Dokumentation.

**Urteil:** Technisch ein wertvoller Fortschritt (endlich tatsächlich erworbene Karten plus konkrete ACE-Kampfinstanz-Attribution), aber **die aktuelle Werte-Heuristik hat die Ergebnisqualität nicht verbessert** und ist für die produktive Gegner-KI **nicht qualifiziert**.
