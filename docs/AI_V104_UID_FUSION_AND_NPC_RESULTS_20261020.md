# Arcane Duel — KI-Training v10.4: Instanzgenauer Fusionsnutzen und eigenständiger NPC-Test

**Datum:** 20. Oktober 2026 · **Branch:** `development`

**CI:** [Gemeinsamer Trainingsworkflow #39387587393 – SUCCESS, beide Jobs](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587393). [Allgemeine Code-/Strategie-CI #39387587212 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587212). [Browser-Smokes #39387587249 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587249).

**Rohdaten:** `arcane-fusion-uid-careers-v104` (Artifact **12248675709**) und `arcane-npc-legal-action-audit-v104` (Artifact **12248002346**), beide im Workflow, Ablauf am **19.11.2026**. Beide echten ZIP-Artefakte heruntergeladen und die gespeicherten Daten gelesen; aus `ai-uid-fusion-impact-v104.json` stammen exakt die nachfolgend genannten gepaarten Train-/Holdout- und Budgetzahlen.

**Produktivschutz:** `main`, `assets/game.js`, produktive Gegner-KI, Monster-/ACE-Werte, Dropchancen, Shop, Splitter, Perks, Quests, Spielerprofile und Gameplayregeln **nicht verändert**. Nur eigenständige Offline-Tests und Berichte auf `development`.

## A. Wirklich benutzte Fusionsinstanzen im VI-Karriereversuch

### Stichprobe und Methodik

- **32 neue, unabhängige vollständig legal erspielte Karriereursprünge**, Seed-Offset **88000**, je drei separate `freshProfile()`-Karrierearme: `fixed-farm` (moderat), `vi-focused` (bekannte intensive legale VI-Vorbereitung) und `vi-uid-impact` (neuer Farming-Regler nach Fusionserfolg). Insgesamt **96 getrennt regulär belohnte Karrierevarianten mit 9.744 echten Duellen**, Original-`simulateGame` und `rewardMatch`.
- **16 unabhängige Ursprünge Training / 16 vorab unbenutzte Holdout-Ursprünge.** Statistische Einheit ist ein Karriereursprung, nicht jedes Einzelduell, jede Fusionsinstanz oder jede Hand.
- Alle Arme verwenden **dieselbe** bereits validierte `tempo-board`-Spieler-Combat-/Fusions-KI. Shop, Karten, Upgrade-/Shard-/XP-Regeln, Turniergegner und Fusionwerte bleiben im tatsächlichen Game-Resolver identisch. Ein hartes CI-Assert prüft, dass pro Ursprung die gesamte echte Ereignis- und Belohnungshistorie **bis vor den allerersten echten VI-Bosskampf** zwischen den drei Armen exakt übereinstimmt.
- **Testbudget höchstens 75 echte VI-Phasenkämpfe**, darunter echte VI-Turnierduelle und VI-Vorbereitung durch freie Matches gegen vorher legal besiegten V; 24 Turnierversuche je Gegner nur experimentelle Obergrenze, keine neue Live-Spielregel.
- Mit zwei `applyAiAction`-Beobachtungs-Wrappern wird die **echte UID der nach `place` platzierten Fusionsinstanz** protokolliert. Wenn durch Feldfusion eine neue UID entsteht, wird diese als neue fusionierte Instanz eingetragen, und Material-Herkunft der zuvor verfolgten eigenen Karte wird soweit tatsächlich dokumentiert übernommen.
- Ein späterer eigener Angriff zählt nur dann zum Fusionsschaden, wenn die **tatsächlich angreifende eigene Karten-UID** zur zuvor als Fusion protokollierten Instanz gehört. Gezählt werden wirklicher **NPC-LP-Abzug**, wirkliche durch diese Karte zerstörte gegnerische Feldkarten, eigene ausgeführte Fusionsangriffe, belegte Materialkosten und Verbleib der Fusion auf dem eigenen Feld am eigenen Zugende. **Normale Angreifer werden nicht dem Fusionsschaden zugeordnet.**
- Die neue `vi-uid-impact`-Strategie verringert eine geplante VI-Farming-Welle um bis zu drei Free-Duelle, wenn unter den letzten zwei echten VI-Bosskämpfen eine wirkliche eigene fusionierte Instanz 300 LP Schaden, mindestens eine Gegnerzerstörung oder mindestens zwei protokollierte eigene Feld-Zugenden erreichte. Erstmalige Fusions-Legalität oder allgemeiner Schaden normaler Monster reichen *nicht*.

**Messgrenzen:** Eigene `end`-Ereignisse belegen Feldpräsenz, aber noch keine belastbare kausale DEF-Absorption oder Soul-Drain-Heilwirkung. Bei Feldfusionen summiert die genealogische Kostenschätzung tatsächlich zugerechnete Materialanteile; der Metrikwert ist daher nicht deckungsgleich mit der Rohzahl nur der in `prepareHandFusion` verbrauchten Karten. Einzelaktionen und gesammelte Schäden mehrerer Spiele sind nicht unabhängig und nicht als kontrollierter Monster-Stärkebonus zu interpretieren.

### Ergebnisse: 32 neue Ursprungskarrieren

| Echte Kennzahl | Moderate Kontrolle | VI intensiv | Fusion-UID-Impact |
|---|---:|---:|---:|
| Gegner IV wirklich besiegt | **29/32** | **29/32** | **29/32** |
| Gegner V wirklich besiegt | **29/32** | **29/32** | **29/32** |
| **Gegner VI besiegt** | 5/32 | **9/32** | 5/32 |
| Echte regulär belohnte Karriereduelle | 2.891 | 3.397 | 3.456 |
| Freie Duelle | 1.635 | 2.192 | 2.195 |
| Turnierduelle | 1.159 | 1.108 | 1.164 |
| Booster legal gekauft | 335 | 349 | 346 |
| Splitter ausgegeben | 3.195 | 4.453 | 4.505 |
| Echte VI-Phasenkämpfe | 1.399 | 1.888 | 1.965 |
| Aufgrund des UID-Kampfsignals verkleinerte Farmingwellen | — | — | **273** |

**Kosten:** Intensive VI-Vorbereitung benötigte über alle 32 Ursprungskarrieren **557 mehr echte Free-Duelle, 506 mehr Gesamtkämpfe und 1.258 mehr regulär ausgegebene Splitter** gegenüber Fixed. Dafür ergaben sich **vier weitere VI-Karrieresiege**. UID-Impact kostete gegenüber Fixed **560 mehr freie und 565 mehr gesamte Kämpfe sowie 1.310 weitere Splitter**, erzielte aber **keinen einzigen zusätzlichen Netto-VI-Sieg**. Trotz 273 tatsächlich verkleinerten Farmingwellen war sein kumulierter Duellaufwand sogar höher als bei der unveränderten Intensivkontrolle.

### Tatsächliche UID-Zuordnung von Fusionen und Kampfwirkung

| VI-Phasenereignisse, summiert je 32 Karrieren | Fixed | VI intensiv | UID-Impact |
|---|---:|---:|---:|
| Tatsächlich verfolgte, platzierte oder durch Feldfusion neue Fusion-UIDs | **11.335** | **16.763** | **17.112** |
| Wirklich von diesen Fusions-UIDs ausgeführte Angriffe | 9.957 | 17.238 | 17.871 |
| **Diesen UID-Angriffen zugeordneter echter NPC-LP-Schaden** | 2.311.408 | **4.254.195** | 4.465.848 |
| **Durch genau diese UID-Angriffe zerstörte Gegnerfeldkarten** | 6.047 | **10.182** | 10.247 |
| Gezählt erreichte eigene Zugenden mit noch platzierter Fusion-UID | 22.118 | 34.734 | 35.938 |
| Reale Material-Herkunftskosten mit zusätzlicher Feldfusion zugerechnet | 29.023 | 42.494 | 43.709 |
| Zugeordneter echter Gegner-LP-Schaden je gezähltem Fusionsmaterial | **79,64** | 100,11 | **102,17** |

**Neuer analytischer Befund:** Die UID-verfolgten Fusionen verursachten beim intensiven Arm **4.254.195 von insgesamt 4.362.193** tatsächlich verlorenen NPC-Lebenspunkten durch eigene Angriffe, also etwa **97,5 %**. Auch 10.182 der 10.496 vom Spieler zerstörten Gegnerfeldkarten wurden solchen fusionierten Instanzen zugeordnet. Das zeigt, dass in diesem automatisierten Spielstil **Fusionen fast den gesamten tatsächlichen Angriffserfolg liefern**. Eine Regel „Fusion hat kürzlich echten Schaden gemacht“ ist damit oft ebenfalls positiv und **noch kein brauchbarer diskreter Indikator für Bossbereitschaft oder eine sparsame Farmingstrategie**. Die summierten Werte stammen aus unterschiedlich vielen echten Duellen; keine isolierte Kausalaussage zur Qualität pro Monster oder pro Build.

### Gleiche VI-Kampfbudgets

| Maximale wirklich gespielte VI-Boss- und VI-Vorbereitungskämpfe | Fixed | Intensiv | UID-Impact |
|---|---:|---:|---:|
| **30** | **3/32** | 2/32 | 2/32 |
| **45** | **4/32** | 3/32 | 2/32 |
| **60** | **5/32** | 3/32 | 2/32 |
| **75** | 5/32 | **9/32** | 5/32 |

**Interpretation:** Mehr lange VI-Vorbereitung gewinnt hier zusätzliche Karrieren, aber bis 60 Kampfhandlungen schnitt Fixed in der neuen Population besser ab. Die vier kumulativen Budgets benutzen dieselben 32 Herkunftskarrieren und sind keine vier unabhängigen Studien.

### Strikte unabhängige Train-/Holdout-Auswertung

| Tatsächlich gewonnene VI-Karrieren bis 75 VI-Kämpfe | Training, 16 Ursprünge | Unabhängiger Holdout, 16 |
|---|---:|---:|
| Fixed | 2 | 3 |
| Intensiv | **4** | **5** |
| UID-Impact | 3 | 2 |

- Vorab anhand **nur Training** gewählte Strategie: **`vi-focused`**, 4 vs. 2 echte VI-Siege, bei zwei besseren, null schlechteren Ursprungspaaren.
- Im **vorher unangetasteten Holdout** erlangte sie **5 statt 3** VI-Siege, bei **drei verbesserten, einer verschlechterten und zwölf gleichen Ursprungskarrieren**. Die vorab definierte Offline-Qualifikationshürde `qualified=true` wurde damit **gerade erreicht** (+2, mehr unabhängige Verbesserungen als Verschlechterungen, IV/V in beiden Armen identisch). Das bedeutet **nicht** statistisch sichere Überlegenheit in allen Seeds, nicht automatische NPC-Freigabe.
- UID-Impact: Training 3 statt 2 (+1), Holdout **2 statt 3 (−1)**, drei Verschlechterungen gegenüber zwei Verbesserungen. **Nicht qualifiziert.**
- Frühe Hürden IV und V sind pro Startursprung zwischen allen drei Armen identisch; Training je 15/16, Holdout je 14/16.

**Fazit Karriere:** Instanzgenaue Fusions-Zuordnung ist ein echter Diagnosefortschritt, die daraus abgeleitete Farmingverkürzung aber trotz tatsächlich verkleinerter Wellen **nicht besser**. Die bewährte intensive VI-Vorbereitung erfüllt knapp das aktuelle v10.4-Offline-Gate; über alle bisherigen Kohorten bleibt die optimale Vorbereitung vom Startinventar, Zielhorizont und Ressourcenkosten abhängig.

## B. Echte NPC-Verhaltensprüfung, separat vom Spielerautopiloten

Der unabhängige zweite Workflow-Job verifizierte **120 unveränderte echte NPC-Duelle** gegen ein legales Spieler-Startdeck: **4.148 echte NPC-Aktionen**, 424 Handfusionen, 92 Feldfusionen, 1.562 Angriffe, 204 ACE-Platzierungen und **keine fehlerhaften Aktionen, keinen Angriff-anschließenden DEF-Wechsel desselben Monsters und keinen erschöpften Positionswechsel**. Gegner IX spielte in zwölf Matches nur vier ACEs; Gegner X **null** ACEs und **null** Handfusionen. Das ist eine offene Ursachenfrage (ACE überhaupt gezogen? legal spielbar? Match vorher gewonnen?), kein schon bewiesener AI-Bug.

**[Separater NPC-Detailbericht](AI_V104_REAL_NPC_ACTION_AUDIT_20261020.md)**. Wichtig: NPCs spielten gegen ein Starterdeck und wechselnde fest eingestellte Policy-Parameter; **keine** reale Late-Game-Spieler-Fairness- oder aktives NPC-Lernen belegt. Die KI der tatsächlichen Turniergegner wurde **nicht geändert**.

## Nächste Prioritäten

1. [**NPC-Fokus v10.5 – Issue #30**](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/30): Bei Gegner IX/X unterscheiden, ob ein ACE wirklich im legalen Gegnerdeck vorhanden, auf der eigenen Hand, spielbar, in der Engine-Entscheidung sichtbar und tatsächlich eingesetzt war. Exakte mögliche 2–5-Hand-Fusionen ebenfalls getrennt erfassen. Keine erzwungenen ACE-Draws oder Kartenbuffs.
2. **Echte Late-Game-NPC-Fairness** separat testen: gegen rechtmäßig erworbene, tatsächlich ausgerüstete Karriere-Decks und ihre Strategierollen. Keine Siege gegen schwache Starter als Qualitätsbeleg.
3. Für Fusions-KI eine messbare Qualitätsmetrik **pro einzelner wirklich eingesetzter Karte**: gegnerische aktuelle Feldstärke gegen erhaltene Fusion-ATK/DEF, Materialopportunitätskosten, überlebte NPC-Gegenangriffe, echte Defender-/Soul-Drain-Werte; v10.4 erfasst erst Feldpräsenz und eigene ausgeführte Angriffe.
4. **Keine weitere Farmingregel aufgrund einer oft erfüllten allgemeinen Schwelle** trainieren. Positive UID-Fusionsattacken kamen zu häufig vor, um das optimale Aufhören zu signalisieren. VI-Siegquote bei fair gleichem Realduellbudget und zusätzliches Farming bleiben führende Erfolgskriterien.
5. **Produktive NPC-KI unabhängig und sicher** entwickeln: echte Legality-/Fairness-/Archetypen-Metriken und unberührter Holdout vor jeglicher Live-`development`-Integration; `main` und Gameplay unverändert.

## QA

- [v10.4 Haupt-CI #39387587393 – SUCCESS (beide Jobs)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587393): 56/56 echte Game-/Deck-/Save-/Economy-/Fusiontests, 20/20 bestehende KI-Tests, dazu 120/120 vollständige unabhängige NPC-Kämpfe ohne aufgezeichnete Regelverletzung.
- [Allgemeine Strategie-/Code-CI #39387587212 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587212).
- [Browser-Smokes #39387587249 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39387587249).
- Die beiden originalen Artefakte wurden erfolgreich heruntergeladen und die Karrierebudgets mit `selected='vi-focused'` und `qualified=true` in der tatsächlich geschriebenen JSON-Datei überprüft.

**Endstatus:** v10.4 vollständig ausgeführt, Hauptanalytik und NPC-Baseline auf `development`, produktive Gegner-Entscheidungen/Live-Spielbalance nicht verändert.
