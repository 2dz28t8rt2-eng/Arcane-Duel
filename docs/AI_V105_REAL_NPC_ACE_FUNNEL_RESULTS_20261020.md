# Arcane Duel – KI-Training v10.5: Tatsächlicher NPC-ACE-Funnel bei IX und X

**Datum:** 20. Oktober 2026 · **Zweig:** `development` · **Live-NPC-Code:** unverändert.

**GitHub Actions:**
- [Primäre ACE-Studie #39390257302 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257302)
- [Zusätzlicher stärkerer Deck-Stresstest #39390491229 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390491229)
- [Code-/Strategie-Suite #39390257104 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257104)
- [Browsertests #39390257107 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257107)

**Unveränderte Gameplay-Dateien:** `assets/game.js`, `main`, ACE-/Monsterwerte, RNG und alle Drop-/XP-/Shop-/Shard-/Perk-/Questregeln. Die neue ACE-Priorität ist **nur ein experimenteller NPC-Aktionscontroller**, nicht in den tatsächlichen Gegnern eingebaut.

## Der zentrale Regelbefund

Bei den Turniergegnern IX und X handelt es sich bei den ACEs um **Fusionsvorlagen (`fusionOnly`)** und nicht um normale Handmonster. Ein ACE kann zwar dreimal im Fusionsdeck vorhanden sein, aber nie als normale Handkarte erscheinen; es benötigt legitim gezogene **normale Materialkarten**. Der originale Fusionsresolver entscheidet über `fusionOptions(g,levels,materials)`, `canCompleteHandFusion(...)` und `remainingFusion`.

Die bekannte KI `chooseAiAction(g,policy)` wählt bei der Beschwörung entweder die stärkste Normalkarte oder die beiden hochstufigsten Materialien mit einer allgemeinen Fusionsregel. Im Experiment nutzt die neue Policy ausschließlich **gerade vorhandene eigene Handmaterialien, Fusionskopien und öffentliches Gegnerfeld**. Sie untersucht 2–3-Material-Kombinationen, ruft den unveränderten Resolver auf, priorisiert eine **wirklich zulässige** ACE-Fusion nur, wenn ihr Vorlagen-ATK mindestens 75 % der stärksten eigenen Handkarte erreicht, und lässt alle Folgeaktionen dem Originalresolver. Sie erzeugt keine Handkarten, keine ACEs, keine Shopkäufe, keine Sonderregeln.

## A. Vorab durchgeführte Primärstudie: 256 echte PVE-Duelle

- **64 unabhängige Startseeds**, je identische Ausgangssituation für bestehende NPC-Policy gegen experimentelle ACE-Policy, Gegner IX und X. Die ersten 32 Seeds Training, die letzten 32 unabhängiger Holdout. Pro Ursprung wurden beide NPC-Varianten mit genau demselben Game-Seed und demselben Spielerstart verglichen.
- Zwei Spielerdecks: tatsächliches legales `freshProfile()`-Startdeck und ein legaler **Proxy aus der bestehenden Gegner-VIII-Deckdefinition**. Der Proxy ist **keine regulär erspielte menschliche Karriere** und deshalb ausdrücklich kein realistischer Late-Game-Fairnessnachweis.
- Insgesamt **256 vollständige Original-`createGame`/`simulateGame`-Duelle**, 128 pro NPC-Policy, keine invaliden Aktionen oder Angriff→DEF-Regelverstöße.
- Die ACE-Ziehfolge erfasst gesondert: vorhandene ACE-Fusionskopien, ACE auf regulärer Hand (wegen `fusionOnly` im Normalfall null), tatsächliche eigene Beschwörungszüge mit nach Fusionsresolver legaler ACE-Option, vom Controller wirklich getroffene ACE-Entscheidung, erfolgreich vorbereitete Fusion und anschließend **tatsächlich platzierte** ACE-Karte. Materialkombinationen und eigene Spielzüge sind nicht statistisch unabhängig voneinander.

### Tatsächlich platzierte ACEs

| NPC, je 64 Duelle pro Policy | Original NPC | Neue ACE-Policy |
|---|---:|---:|
| **IX** | **74** | **192** |
| **X** | **0** | **192** |
| ACEs gesamt | **74** | **384** |

Ein ACE konnte pro Duell mehrfach als eigene tatsächlich verbrauchte Kopie platziert werden. Die 192 sind keine eindeutigen Karten-IDs, sondern echte **Platzierungsereignisse**.

**Spannender Befund:** Bereits beim unveränderten Gegner X wurden in den realen Handsituationen **zahlreiche legale ACE-Materialkombinationen** gefunden: Bei 32 X-Duellen gegen das Startdeck waren es **130 eigene Beschwörungszüge mit einer legalen ACE-Fusionsmöglichkeit**; beim Gegner-VIII-Proxy **179** solche Züge. Die originale NPC-Auswahl platzierte in beiden Szenarien dennoch **0** ACEs. Der durch den unveränderten Spielresolver geprüfte alternative Controller konnte tatsächlich **je 96** ACE-Platzierungen in beiden X-Tests erreichen. **ACE-Nichtnutzung ist damit eine NPC-Prioritäts-/Auswahlproblematik, nicht generell fehlende legale Materialien oder fehlende Fusionskopien.**

**Erfolgslimit:** Die NPCs gewannen in dieser primären Kohorte **alle 256 Duelle** (beide Policies gleich). Daraus lässt sich **keine** bessere Siegquote oder Fairness der ACE-Policy ableiten.

## B. Nach Sichtung der Primärdaten ergänzter separater stärkerer Deck-Stresstest

Um den vollständigen Siegdecken-Effekt zu prüfen, wurde **zusätzlich, erst nach dem ersten Ergebnis** ein zweiter Test mit **völlig neuen Seeds** durchgeführt. Er ist **explorativ/post hoc**, also **keine vorab reservierte Replikation der Wirksamkeit**.

- Wieder 64 neue Seed-Ursprünge und exakt gepaarte NPC-Kontrolle vs. ACE-Policy bei IX/X, also weitere **256 komplette echte Originalduelle**. Das ergibt **512 vollständige Duelle über beide Studien**, aber die Studien haben unterschiedliche Schwierigkeitsbedingungen und sind nicht einfach zu einer Siegquote aggregierbar.
- Diesmal zwei starke legale **NPC-X-abgeleitete Vergleichsdecks**, `rpgEnemyLoadout(10,'easy')` und `rpgEnemyLoadout(10,'hard')`, als feste Spieler-Gegendecks. Solche NPC-Proxydecks sind **nicht** legitim aus Spielerbelohnungen erspielt, deswegen **keine** finale reale Spieler-Schwierigkeitskalibrierung.
- **0 ungültige NPC-Aktionen und 0 Angriff→DEF-Schalter**. Die experimentelle Policy kann ACEs weiterhin legal spielen.

### Zusätzlicher Kampfvergleich mit stärkeren Decks

| Gegner, je 32 Duelle pro Policy und Szenario | Original NPC – echte Siege | ACE-Priorität – echte Siege |
|---|---:|---:|
| IX gegen Gegner-X-Proxy einfach | **5/32** | 4/32 |
| IX gegen Gegner-X-Proxy schwer | **2/32** | 1/32 |
| X gegen Gegner-X-Proxy einfach | **32/32** | **32/32** |
| X gegen Gegner-X-Proxy schwer | **32/32** | **32/32** |

**Zusammen:** Bei IX fällt die Gewinnzahl durch die erzwungene frühe ACE-Fusion von **7/64 auf 5/64**. Im unabhängig gesetzten 16/16-Untergruppen-Holdout waren es **3 zu 2 Siege** über die beiden harten IX-Szenarien; in der Trainingshälfte 4 zu 3. Bei Gegner X gewinnen auch unter den stärkeren Proxy-Szenarien beide Policies **alle 64 Duelle**; seine ACE-Ausspielungen steigen trotzdem von **1 auf 192**. Auch die stärkeren Vergleichsdecks konnten X **noch nicht in eine ausgeglichene Spielsituation bringen**.

Die neue Policy ist damit **technisch durchführbar, aber nicht als bessere NPC-Kampftaktik qualifiziert**. Die Ergebnisse widerlegen die unzulässige Behauptung „mehr ACE-Ausspielungen führen zwangsläufig zu mehr Siegen“. Eine ACE-Fusion kann vorzeitigen Karten- und Materialverbrauch erzwingen oder bereits starke normale Einzelkarten ersetzen. Die konkreten Material-, Rollen- und Kampfwert-Trade-offs müssen separat gemessen werden. Kein Live-Rollout.

## Unabhängige QA

- Erstes 256-Match-Experiment **SUCCESS**, zusätzliche 256-Match-Studie **SUCCESS**.
- Die Original-Game-/Fusion-/Deck-/Economy-Regressionen und AI-Regressions in der v10.5-Haupt-CI zeigen **0 Fehlschläge**. Allgemeine Strategie-/Codechecks vollständig erfolgreich.
- [Browser-Smoke #39390257107 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39390257107). Die stärkere Stressstudie hatte getrennte Browser-/Codechecks; der isolierte Stressjob bestand.
- Rohartefakte `arcane-npc-ace-funnel-v105` GitHub-ID **12249391070** und `arcane-npc-ace-stress-v105` ID **12249133583**, Ablauf jeweils **19. November 2026**, enthalten die 512 tatsächlichen Fight-Historien und alle statistischen Summen.

## Empfehlungen für v10.6

1. **ACE-Nutzwert statt ACE-Quote maximieren**: Materialkosten (2–5 Karten), erreichbare Vorlagen-ATK/-DEF nach tatsächlichen Würfen, ursprüngliche Hand-ATK, nach dem Fusionieren verbleibende eigene Hand und offene Feldplätze vergleichen. Sichtbares Gegnerfeld und ACE-Rollentag berücksichtigen, niemals versteckte Spielerhand auswerten.
2. **Gegner IX prüfen:** Die zu frühe ACE-Ausspielung verschlechterte in den stärkeren Szenarien eher die Siege. Der Wert eines ACE muss **über den Opportunitätskosten** des dafür geopferten Materials liegen; 75-%-Handstärke war offensichtlich keine ausreichende Entscheidungsschwelle.
3. **Gegner X kalibrieren:** Selbst gegen starke X-Proxydecks gewinnen bestehende X-NPCs 100 %. Deshalb zuerst **tatsächlich regulär erspielte Spieler-Late-Game-Decks** und unabhängige Rollen-/Archetypen verwenden. Keine künstliche Schwächung und keine pauschale ACE-Prioritätssteigerung ohne echte Balance-Daten.
4. **Getrennte Offline-NPC-Policy-A/B-Tests**, Training und unabhängige Holdout-Decks/Seeds. Erfolgskriterium: bessere legale Strategie, aber keine unfaire Übermacht und keine Kartendoping-Effekte; auch ACE-getriebene Siegzeit und Karteneffizienz prüfen.
5. **Keine Änderungen an produktiver Gegner-AI oder `main`**; alle neuen Studien bislang nur Tests auf `development`. ACE-Funnel-Lücke bei X ist reproduziert, die untersuchte Lösung aber **nicht freigegeben**.

**Fazit:** Die aktive NPC-KI schöpft legale ACE-Fusionsmöglichkeiten in X nachweislich nicht aus. Eine aggressive pauschale ACE-Priorität behebt optisch und regelkonform die Unterbenutzung, **verbessert aber die tatsächliche Kampfleistung nicht** und kann IX sogar schaden. Die nächsthöhere Trainingsrunde muss *ACE-Wert, Materialeffizienz und Fairness* optimieren statt die reine Zahl ausgespielter ACEs.
