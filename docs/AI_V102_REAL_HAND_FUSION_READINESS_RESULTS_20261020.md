# Arcane Duel – KI-Training v10.2: tatsächliche legale Hand-Fusionen gegen VI

**Abschluss:** 20. Oktober 2026 · **Branch:** `development` · [Vollständiger Workflow #39380802697 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802697). [Code & Strategie #39380802735 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802735) und [Browser-Smoke #39380802581 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802581).

**Beweismaterial:** vollständiges [GitHub-Actions-Artefakt `arcane-real-fusion-readiness-v102`](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802697) (ID **12245635409**, Ablauf **19. November 2026**) mit `ai-real-fusion-readiness-v102.json`; heruntergeladen und Budget-Train/Holdout-Resultate aus JSON geprüft.

## Studiendesign

- **32 neue unabhängige Quellen** (Seed-Offset **80000**), je drei komplett separat ausgespielte echte Karrieren auf regulärem `freshProfile()`, insgesamt **96 Karrierearme und 8.077 echte mit `rewardMatch` belohnte Duelle**. Vorab Training/Holdout jeweils **16 unabhängige Ausgangskarrieren**, keine Wiederverwendung früherer Quellen.
- **Identische** v9.2-`tempo-board`-Offline-Spielerentscheidung in allen drei Armen sowie vollständige Originalmechaniken für Deck, Fusionen, Geld, Booster, XP, Shards, AI-Opponents, Sieg/Niederlage und Dropchancen. Strikte Assertion: pro Ursprung gesamte echte Karriere bis **vor dem ersten VI-Turnierkampf identisch**. Keine geschenkten ACEs, Cards oder Ressourcen.
- Nur Farming nach dem tatsächlich erreichten Turniergegner VI variiert: (1) **Fixed** moderate freie Duelle nach drei Niederlagen, (2) **vi-focused** intensive Vorbereitung nach zwei Niederlagen, (3) neue **vi-fusion-ready**: misst konkrete **wirklich legale 2–5-Hand-Karten-Fusionen** in ausgeführten Kämpfen und probiert bei mehrfach legal möglicher Fusion den VI-Boss erneut anstatt zusätzliche kostenlose Free-Duell-Rewards zu farmen.
- Jede Legalitätsmessung erfolgt unmittelbar **bei eigenen real gezogenen Handkarten** vor der Spieler-Beschwörung, mit tatsächlich vorhandenem eigenem Feld und `remainingFusion` über den unveränderten Spielresolver **`fusionOptions(game,levels,materials)` und `canCompleteHandFusion(game,levels,choice)`**. Keine Veränderung von Handkarten, Monsterwerten oder verborgenen NPC-Daten. Jede einmalige Beobachtung zählt separat (mehrere Beobachtungen desselben Kampfes **nicht** unabhängig).
- Experimentbudget maximal **75 echte VI-Phasen-Duelle** (VI-Turnierduelle plus Vorbereitungs-Free-Duelle gegen den zuvor wirklich besiegten V) und maximal 24 Turnierversuche je Tier, beides **nur für den endlichen Offline-Test** und kein neues Live-Spiel-Limit.
- Vorab definiertes Siegkriterium: train-basierte Auswahl, mindestens **+2 VI-Siege im unabhängigen Holdout** bei gleicher maximaler Spielzeit, keine IV/V-Regression und mehr Karriereursprünge besser als schlechter. Ohne stabile externe Replikation keine Live-Promotion.

## Endergebnisse über 32 unabhängige Startquellen

| Echte Resultate | Fixed | VI intensiv | Neu: Fusionsbereitschaft |
|---|---:|---:|---:|
| IV besiegt | 25/32 | 25/32 | 25/32 |
| V besiegt | 25/32 | 25/32 | 25/32 |
| **VI besiegt** | **8/32** | 7/32 | 2/32 |
| Gesamte legal belohnte Duelle | 2.754 | 3.231 | 2.092 |
| Echte freie Duelle | 1.578 | 2.056 | 887 |
| Echte Turnierduelle | 1.079 | 1.078 | 1.108 |
| Im VI-Bereich beobachtete reale Beschwörungshände | 10.220 | 15.115 | 2.819 |
| Davon Hand-Situationen mit mindestens einer legalen eigenen Fusion | **10.009** | 14.915 | 2.772 |
| Hand-Situationen **ohne** legale eigene Fusion | 211 | 200 | 47 |
| Aus realen Materialkombinationen legal verfügbare eindeutige Fusionsziel-Optionen, über alle Beobachtungen summiert | 55.292 | 81.745 | 17.720 |
| In der neuen Variante wegen Hand-Fusionsbereitschaft **übersprungene Farming-Wellen** | — | — | **283** |
| In der neuen Variante tatsächlich ausgeführte intensive VI-Farming-Wellen | — | — | **0** |

**Wesentliche Einschränkung:** Die Legality-Zählung erfasst *mögliche Fusionen*, nicht ob ein Fusionszug gegenüber normaler Beschwörung gut ist, tatsächlich ausgeführt wurde oder ob die fusionierte Karte stärker ist als der gegnerische ACE. Der gleiche Match kann mehrere oft ähnliche Hand-Situationen liefern; aus 10.220 Beobachtungen darf keine Erfolgsrate von 10.220 unabhängigen Spielern abgeleitet werden.

**97,9 %** (10.009/10.220) aller im Fixed-Arm beobachteten eigenen relevanten Hand-Situationen verfügten bereits über mindestens ein legales Fusionsziel. Das bedeutet **nicht**, dass die entsprechenden Fusionsmonster stark genug sind. Die neue Strategie interpretierte nahezu jede vorhandene Fusionsmöglichkeit als hinreichende Vorbereitung, sodass sie **praktisch jedes weitere VI-Farming unterdrückte**. Die Zahl der echten eigenen VI-Vorbereitung-Free-Duelle gegen V sank im Vergleich Fixed von **766 auf 96**, die echten VI-Fortschritte sanken aber von **8 auf 2**. Somit ist die reine Fusion-Verfügbarkeit ein **schlechtes Stoppsignal** für Farming; `vi-fusion-ready` fällt beim unabhängigen Test durch.

## Gleiche echte VI-Kampfbudgets, 32 Startquellen

| Maximal reale VI-Phase-Kämpfe | Fixed | VI intensiv | Fusion-Ready |
|---|---:|---:|---:|
| **30** | **3** | 1 | 2 |
| **45** | **7** | 2 | 2 |
| **60** | **8** | 2 | 2 |
| **75** | **8** | 7 | 2 |

Diese Werte sind kumulative Endresultate innerhalb der Budgetgrenze, nicht vier unabhängige Studien. In dieser Kohorte war Fixed besonders bis Kampf 60 effizient. Erst am Ende der langen VI-Vorbereitungsphase holte Intensiv von zwei auf sieben VI-Siege auf, erreichte Fixed aber nicht.

## Training und vollständig unabhängiger Holdout

| Echte VI-Siege bei 75 Kämpfen | Training, 16 Karrieren | Holdout, 16 Karrieren |
|---|---:|---:|
| **Fixed** | **3** | **5** |
| VI intensiv | 2 | **5** |
| Fusion-Ready | 1 | 1 |

IV/V: Training **11/16** bei allen drei, Holdout **14/16** bei allen drei. Der auf dem Trainingsblock **vorab gewählte Kandidat ist `fixed-farm`** (er übertraf beide Experimente bereits vor Holdout). Die vollständige Auswertung bestätigt **`qualified=false`**; der neue Fusion-Ready-Arm verliert im Holdout **vier** VI-Karriere-Erfolge gegenüber Fixed, verbessert keinen einzigen gepaarten Ursprung. Intensiv gewinnt im Holdout **gleich viele** VI-Karrieren wie Fixed (5/16), benötigt dort aber **311 zusätzliche freie und 313 weitere gesamte Duelle**, mit zwei verbesserten und zwei verschlechterten Ursprungskarrieren.

## Was diese Runde beweist – und was nicht

1. **Der eigene Fusionsresolver ist messbar, ohne Cheat.** Die Legalität der tatsächlich gezogenen Materialkombinationen lässt sich mit `fusionOptions` und `canCompleteHandFusion` im echten Kampf vollständig prüfen. Das ist für künftige Engine- und KI-Instrumentierung nützlich.
2. **Fusion möglich ≠ Fusion sinnvoll.** Legalität ist zu oft gegeben, um ein brauchbares Stop-/Weiterfarm-Signal zu sein. Künftige Tests müssen die **Qualität und den realen Kampfeffekt** messen: ausgeführte Fusionen, deren tatsächliche ATK/DEF, Vergleich mit gefährlichen gegnerischen Karten, erhaltene/verworfene Materialien, Feld-/Tempo-/Überlebenswirkung und ACE-Abwehr.
3. **Selektion gegen Overfitting:** v9.8–v10.1 zeigten auf anderen Herkunftskarrieren wiederholt mehr VI-Siege bei intensivem Farming; v9.7 und jetzt v10.2 aber nicht. Intensive Vorbereitung kann sich für Spieler lohnen, **ist jedoch keine garantierte universelle optimale Vorgabe**. Es ist kein Anlass, absichtlich den Turniergegner VI zu nerfen.
4. **Alle Kontrollen bis VI unverändert:** Jede Karriere muss Kartenzuwachs, XP, Shops und Fusionen rechtmäßig spielen; Gegner IV/V bleiben echte Hürden und wurden in allen drei Armen auf denselben 25 Ursprüngen besiegt.
5. **Offline-Spielerautopilot ≠ trainierte Live-NPC-KI:** Das bisherige Curriculum optimiert KI-Entscheidungen des Spieler-Autopiloten gegen produktive unveränderte Gegner-NPCs. Die aktiven Gegner selbst wurden **nicht** in diesen Runden verbessert, und ein Agent lernt nicht aus echten Spielern automatisch weiter.

## v10.3: hochwertige Fusionen statt bloß legaler Fusionen

- In **echten VI-Kämpfen** jede tatsächlich ausgeführte eigene Fusion instrumentieren (nicht nur angebotene Ziele): exakte realisierte ATK/DEF, Fusion-Level, verbrauchte Karten, echte Rolle, Board-Situation vor/nach Fusion; optional tatsächlich erfolgreiche Angriffe und zerstörte gegnerische Monster.
- Qualität gegenüber dem **sichtbaren gegnerischen Feld** und den bekannten eigenen Ressourcen bewerten; keine geheimen NPC-Hände/Decks, keine generischen Extra-Monster, keine Gratis-Stats.
- Neue unabhängige 16/16 Karrierequellen mit unverändertem `fixed-farm` und `vi-focused`; neue isolierte spielerische Fusion-Nutzenheuristik als dritte Variante; **70–75 reale VI-Duellen als Kostenkontrolle**.
- Entscheidend ist nicht mehr nur ob nach Farming eine Fusion möglich ist, sondern ob eine **verbesserte tatsächlich verwendete Fusion** höhere echte Gegner-VI-Siege bei vertretbar mehr Free-Duellen liefert.
- Separater strategisch wichtiger Schritt: **NPC-spezifische KI-/Fairness-Tests** nach all diesen Spielerautopilot-Experimenten, damit `Arcane Duel` selbst auch spielbar anspruchsvollere Gegner bekommt. Kein automatischer Live-KI-/Main-Merge.

## QA und Status

- [Training v10.2 GitHub Actions – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802697): **56/56** Game-/Economy-/Save-/Fusiontests und **20/20** KI-Regressionen bestanden.
- [Code & Strategie – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802735).
- [Browser-Smoke – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39380802581).
- Original-JSON-Artefakt 12245635409 heruntergeladen, Budget-/Train-/Holdout-Kurven und `selected='fixed-farm'`, `qualified=false` unabhängig geprüft.
- `development` enthält neue v10.2-Offline-Tests und -Dokumentation; **`main`, Live-NPC, Game-Assets, Kartensets, ACE-/Loot-/Shop-/Shard-Balance und Benutzerprofile unverändert**.

**Urteil:** v10.2 technisch vollständig erfolgreich, **neue Fusionsbereitschaftspolicy fachlich klar durchgefallen**. Wichtigste Erkenntnis: Es fehlen keine legal möglichen Fusionen, sondern bei der schweren VI-Hürde oft effektive strategische Antworten und die richtige Investitionsentscheidung.
