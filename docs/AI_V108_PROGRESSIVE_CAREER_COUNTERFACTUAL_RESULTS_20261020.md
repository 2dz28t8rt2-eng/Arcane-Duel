# Arcane Duel – KI-Training v10.8: progressive I–X-Karriere und echter isolierter Beschwörungs-Counterfactual

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **Status:** vollständig ausgeführt; **keine Änderungen an `main` oder aktiver NPC-KI**.

**GitHub Actions:** [Vollständiger Karriere- & Fusionsvergleich #39398666313 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666313), [Code/Strategie #39398666349 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666349), [Browser #39398666297 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666297), [unabhängiger vier-Ursprünge-Funktionssmoke #39398815523 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398815523).

**Rohdaten:** `arcane-progressive-counterfactual-v108`, GitHub-Artifact **12254590517**, läuft am **19. November 2026** ab. Original-`ai-progressive-career-v108.json` und `ai-npc-counterfactual-v108.json` als ZIP heruntergeladen und beide Dateien inklusive jeder unabhängigen Karriere-/NPC-Probe gelesen.

## Design: Turnierschwierigkeit muss bewusst zunehmen

Diese Untersuchung setzt die ausdrückliche Designvorgabe um: **Bei VII, VIII, IX und insbesondere X darf der Spieler mehr rechtmäßig erspielte Vorbereitung als bei VI benötigen.** Nicht die möglichst schnelle Durchmarschquote bis X ist das Ziel, sondern lohnendes, strategisches Farming mit anspruchsvollen, aber erreichbaren späteren Bossen. Niederlagen sind erlaubt. Unbehebbares Stillstehen trotz effektiv genutzter Original-Ressourcen ist gesondert zu untersuchen.

Für den Endgame-Lauf wurden **32 völlig neue, unabhängige Karriereseeds** (Offset **100000**) gepaart unter zwei Farming-Strategien gespielt: (a) bisheriges moderates `fixed-farm` und (b) `tier-progressive`, das ab VI nach tatsächlichen Niederlagen gestaffelt mehr freie Duelle gegen bereits geschlagene Gegner erlaubt, mit zunehmenden – ausschließlich **experimentellen** – Farmbudgets für VII–X. Dieselbe unveränderte `tempo-board`-Spieler-Kampfsteuerung, dieselbe Original-Karten-/Shop-/Shard-/Perk-/XP-/Loot-/Booster-/Fusions-Economy, keine künstlichen Boss-Clears, keine Gratis-ACE, keine veränderten Drops.

Je Ursprung wurden beide Varianten **identisch bis einschließlich des Snapshots direkt vor dem ersten VI-Versuch** gespielt. Harte `assert.deepEqual`-Prüfung erfolgreich. Der initiale Testlauf hatte eine tatsächlich unterschiedliche `chooseAiAction`-Zuordnung der neuen Variant vor VI erkannt und war deshalb **korrekt fehlgeschlagen**; die Zuordnung wurde vor dem vollständigen Erfolgslauf korrigiert. Keine Ergebnisse des ungültigen ersten Versuchs werden zur Bewertung herangezogen. 16 Train-/16 vollständig neue Holdout-Ursprünge.

## Tatsächlich gespielte Karriereergebnisse

**64 unabhängig ausgespielte Arme, insgesamt 7.963 echte Original-`simulateGame`- und `rewardMatch`-belohnte Duelle.**

| Turniergegner tatsächlich besiegt | Moderates Farming | Progressiv verstärktes Farming |
|---|---:|---:|
| I | 32/32 | 32/32 |
| II | 32/32 | 32/32 |
| III | 32/32 | 32/32 |
| IV | 30/32 | 30/32 |
| V | 30/32 | 30/32 |
| **VI** | **6/32** | **10/32** |
| **VII** | 0/32 (6 erreichten VII) | 0/32 (10 erreichten VII) |
| VIII–X | Nicht erreicht | Nicht erreicht |

| Realer Gesamtaufwand über jeweils 32 Startkarrieren | Moderat | Progressiv |
|---|---:|---:|
| Regulär belohnte Duelle | **3.536** | **4.427** |
| Tatsächliche freie Duelle | **1.972** | **2.880** |
| VI-Bossversuche insgesamt | **809** | **672** |
| VI-Siege | **6** | **10** |
| VII-Bossversuche | **180** | **300** |
| VII-Siege | **0** | **0** |

Die progressive Strategie absolvierte insgesamt **891 weitere Duelle, davon 908 zusätzliche freie Duelle** bei 32 gepaarten Ursprüngen und erreichte vier zusätzliche VI-Siege. Die Differenz bei Gesamtkämpfen kann kleiner als die Differenz bei freien Duellen ausfallen, weil insgesamt weniger VI-Bossversuche für einige Siege nötig waren und die Kampffolgen nach VI divergieren.

**Unabhängige Train-/Holdout-Differenz bei VI:** Train moderat **2/16**, progressiv **5/16**; Holdout moderat **4/16**, progressiv **5/16**. Damit ist die VI-Verbesserung in beiden Teilmengen zu sehen, im **unabhängigen Holdout aber nur +1**. Keinesfalls nachträglich eine starke sichere Steigerung oder `qualified=true` behaupten.

### Warum VII jetzt gezielt untersucht werden muss

Die zehn legal bis VII fortgeschrittenen progressiven Karrieren spielten jeweils **30 originale VII-Turnierduelle**, zusammen **300 echte Verluste**, und **680 direkt protokollierte zusätzliche freie VI-Vorbereitungsduelle** in **70 echten Farming-Batches**. Davon waren **50/70** mit dem vorab dokumentierten, aus wirklich ausgerüstetem 40er-Deck und legalen Ressourcen abgeleiteten Deckqualitätssignal positiv.

**Durchschnittlich pro echtem VII-Farming-Batch:** ca. **+12,2 durchschnittliche Deck-ATK**, **+13,1 durchschnittliche Deck-DEF**, **+0,128 durchschnittliche ausgerüstete Kartenstufe**, **+0,87 zusätzliche ausgerüstete Level-4+-Materialkarten**, **+4,41 tatsächlich besessene Kartenkopien**, ca. **538 regulär verdiente XP** und **2,16 echte Loot-Events**. Das sind *Netto-Batch-Durchschnittswerte*, nicht 70 unabhängige Spieler und keine Garantie, dass alle Werte pro Einzelkartentyp steigen. Im selben Vergleich wurden **0 zusätzliche tatsächlich besessene Fusionsvorlagen pro VII-Batch** gemessen (der Fusionsdeckbestand scheint hier nicht weiter zu wachsen). Die vor-VII-Snapshots der zehn progressiven Karrieren hatten trotz legitimer Entwicklung nur ca. **3,52–4,88 durchschnittliche Hauptdeck-Kartenstufe**, deutlich vor Voll-Level-7.

**Interpretation:** Farming erzeugt zwar häufig wirkliche, messbare Verbesserungen, reicht aber innerhalb dieses **expliziten Offline-Testbudgets** bei zehn Karrieren nicht aus, um VII zu besiegen. Die Erklärung kann fehlender Rollenzuschnitt, unzureichende Fusionsziel-/ACE-Verfügbarkeit, Deck-ATK/DEF im Verhältnis zur VII-Signatur, bestehende KI-Fusions-/Angriffsstrategie oder die verbleibende Anzahl zulässiger Farmduelle sein. **Dies beweist weder absoluten Softlock noch zu starke VII-Kartenwerte.** Für einen echten Spielbalance-Befund müssen auch wesentlich längere legale VII-Progression und alternative Farm-/Shop-/Deckstrategien, nicht nur mehr von derselben Ressourcenroutine, überprüft werden.

## Zweite Studie: Tatsächliche Würfelergebnisse auf isolierten NPC-Zugkopien

Zusätzlich **256 vollständige echte Original-NPC-Duelle** auf **32 neuen gepaarten Origins (16 Train/16 Holdout)** gegen IX/X, mit **`current` vs `ace-relative`**. Spielerseite ist entweder ein tatsächlich verdienter und Besitz-kontrollierter `tier-progressive`-Karrieredeckstand oder als Kontrast ein **offengelegter, nicht erspielter** X-hard-NPC-Deckproxy. Das earned Deck ist aufgrund der oben dokumentierten Karrierehürde ein **VI-/VII-Vorbereitungsstand**, **keine** valide Behauptung eines fertig gelevelten X-Human-Decks.

Die Gegner-AI durfte weiterhin **keine** verdeckten Spielerhandkarten oder zukünftige Zufallswürfe kennen. Bei **512 tatsächlichen eigenen NPC-Beschwörungssituationen** (maximal zwei pro Duell, wiederholte korrelierte Spielzüge) wurde derselbe legale Spielzustand einschließlich der ursprünglichen `game.seed`-RNG-Lage unabhängig in JSON kopiert. Auf **jeder getrennten Kopie** wurde eine tatsächlich legale ACE-Fusion, die beste anhand der vorhandenen Vorlagen wählbare Nicht-ACE-Fusion und eine normale Beschwörung mit dem **Original-`applyAiAction` und der wirklichen Platzierung** durchgeführt, soweit legal möglich. Der echte Originalzustand blieb in **512/512** Fällen unverändert; die gerollten Werte wurden **nie** in die echte NPC-Entscheidungsfunktion zurückgespeist.

**Ergebnis der definierten (materialbelasteten) unmittelbaren Boardwertmetrik:**

| Beste tatsächlich separat abgewickelte Beschwörungsalternative | Anzahl aus 512 kopierten eigenen Situationen |
|---|---:|
| **Normale Beschwörung** | **482** |
| **ACE-Fusion** | **30** |
| **Nicht-ACE-Fusion** | 0 |

**Wichtige Einschränkung:** Die Kennzahl ist eine **momentane** ATK + gewichtete DEF + sichtbare Feldüberwindung − tatsächliche Material-Opportunitätskosten auf einer begrenzten Auswahl aus dem aktuellen Zug. Sie berücksichtigt **noch nicht** einen mehrzügigen ACE-Aufbau, gegnerische Folgezugsreaktion, Verteidiger-Seelenraub oder längerfristige Feldfusionen. Null ausgewählte Nicht-ACE-Fusionen bedeutet **nicht**, dass sie im Spiel nutzlos sind. Die 512 Beobachtungen stammen aus nur 256 echten Spielen und sind innerhalb derselben Duelle/Seeds korreliert; daraus darf man keine 94-%-Aussage für unabhängige Spiele bilden.

**Echte NPC-Siege aus jeweils 128 simulierten Spielen pro Policy:** `current` **103/128**, `ace-relative` **103/128**. Bei den **vier separaten 16er-Holdout-Konstellationen** gab es zwischen den beiden Policies **keinen gepaarten Siegunterschied**. Der Kopier-Counterfactual dokumentiert reale Kurzfrist-Handlungswerte, **aber die untersuchte bestehende relative ACE-Auswahl bleibt ohne belegte zusätzliche Siege**. Gegen den X-hard-Proxy gewinnt Gegner IX jeweils **7/32**, gegen die earned VI-/VII-Decks **32/32**. Gegner X gewinnt sämtliche **64/64** Spiele pro Policy; das ist **keine faire X-Spielerkalibrierung**.

## QA und Produktionsschutz

- GitHub Actions [vollständiger v10.8-Workflow #39398666313 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666313): Original-Spiel- und Fusionsregressionen **50/50**, Original-KI-Regressionen **20/20**, alle 64 Karrieren und 256 NPC-Spiele abgeschlossen. Insbesondere Gameplay- und Besitz-Assertions, identische frühe Karrieren und unveränderte Kopierzustände.
- [Code/Strategie #39398666349 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666349); [Browsertests #39398666297 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398666297).
- [Zusätzlicher Kurz-Funktionssmoke #39398815523 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39398815523) mit vier Herkunftskarrieren und insgesamt 457 realen Spielduellen.
- Originalrohdaten: ZIP `arcane-progressive-counterfactual-v108` **ID 12254590517**, beide JSON-Datensätze nach dem vollständigen Test erfolgreich heruntergeladen, jede einzelne Ursprungskarriere, Tier-Versuche, echte Farm-Rewards, X-Level-Grenze und 512 separaten Kopier-Ergebnissen verfügbar.
- **`development`: ausschließlich Experimentskripte/Workflows und Ergebnisberichte. `main`, `assets/game.js`, echte NPC-Gegner-AI, ACE-/Monster-Statistiken, Dropraten, XP, Perks, Splitter-/Shoppreise und echte Spieler-Saves unverändert.**

## Neue Priorität v10.9

1. **Echte VII-Hürde isoliert reproduzieren und untersuchen:** Auf den **rechtmäßig verdienten VI-Sieger-Spielständen** von v10.8 selbst legal weiterspielen, gestaffelte **längere** Vorbereitung statt maximal nur 68 Free-Duelle nach VI, ohne bereits besiegte Gegner zu verschenken oder VII zu nerfen. Alle sieben bis zehn tatsächlich erhaltenen Decks und deren effektive Fusion/ACE-/Rollenverteilung gegen die sichtbaren VII-Feldmonster vergleichen.
2. **Alternativen zum bloß quantitativen Farming testen:** Wo Drops zwar Karten/Level, aber keine neuen hochwertigen Fusionen bringen, andere legitime Quelle, Shop-/Perk-/Craft-Entscheidung und 40er-Deckoptimierung aus vorhandenem Besitz ausprobieren. Mögliches Fusionsvorlagen-Plateau getrennt von gewöhnlichem Monsterkartenwachstum messen.
3. **Progression pro Gegner** mit echten Kurven: zusätzliche freie Kämpfe, XP-/Coin-/Splitter-/ACE-Fusionsbestand, Gegner-Siege und Fehlversuche in größeren VII-Budgetschritten (z.B. weitere +40/+80/+120, vorab fixiert) berichten. Ein längeres VII-Farming ist *gewollt*, aber eine Ressourcen-Sackgasse wäre es nicht.
4. **NPC-ACE-KI-Audit weiterführen, nicht vorschnell releasen:** Die kopierten Kurzfrist-Zugausgänge rechtfertigen noch keine neue aktive NPC-Policy. Mehrzug-Bewertung/Counterfactuals bei **legitimen** Gegnerfeldern und getrennte Fairness-Holdouts; keine verborgenen Karten/Future-Rolls in live Entscheidung.
5. **Alle Ergebnisse nur auf neuen oder explizit als Replikation deklarierten Karriere-Origins** und streng legalen Kartenbeständen prüfen, `main` und produktive Gegner-Economy unverändert.

**Endurteil:** v10.8 liefert eine erste vollständige, korrekt gepaarte **I–X-Progressionsdiagnose** und echte isolierte legal gerollte Beschwörungs-Alternativen. Intensiveres Farming hilft beim Übergang VI, **VII ist in diesem Test klar der nächste ungelöste Engpass**. Die Schwierigkeit ansteigend zu gestalten bleibt ausdrücklich gewollt; die nächste Frage ist, welche **legale, wirksame Ressourcennutzung** VII knacken kann.
