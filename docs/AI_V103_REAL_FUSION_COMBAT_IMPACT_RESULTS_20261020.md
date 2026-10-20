# Arcane Duel – KI-Training v10.3: tatsächlich ausgeführte Fusionen und beobachteter Kampfnutzen

**Datum:** 20.10.2026 · **Branch:** `development` · **Training:** [Actions #39384673301 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673301) · **Code/Strategie:** [#39384673224 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673224) · **Browser-Smokes:** [#39384673226 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673226).

**Originaldaten:** `arcane-actual-fusion-impact-v103` (Actions-Artifact **12246773067**, Ablauf 19.11.2026), enthält `ai-fusion-impact-v103.json`; das ZIP wurde erfolgreich heruntergeladen und die Rohdaten inkl. Trainings-/Holdout-/Budgettabellen unabhängig geöffnet. **Spielregeln, `assets/game.js`, aktive NPC-KI und `main` blieben unverändert.**

## Ansatz: Ausgeführte Fusion statt nur legales Angebot

Aus v10.2: Eine legale eigene Fusion ist nahezu immer möglich, daher war ein Farming-Stopp nach „Fusion vorhanden“ ein Fehlsignal. V10.3 erfasst nun **an tatsächlich ausgeführten eigenen Aktionen** in realen VI-Kämpfen und Vorbereitungsduellen:

- Erfolgreich vorbereitete **2–5-Material-Handfusionen**, tatsächlich platzierte Handfusionen, tatsächlich ausgeführte zusätzliche Feldfusionen, verbrauchte echte Materialien, effektive resultierende **ATK/DEF nach den echten Engine-Würfen**.
- Ob der ausgeführte Fusionsangriffswert zum Zeitpunkt seiner **Vorbereitung** höher als die stärkste sichtbare gegnerische Feldkarte (ihre aktuelle ATK/DEF je Position) lag. Das ist ein *Potenzialindikator*, **keine** nachgewiesene Zerstörung dieser Karte.
- Tatsächlich ausgeführte eigene **Angriffe**, wirklichen LP-Schaden am NPC und real durch eigene Angriffe zerstörte gegnerische Feldkarten. **Wichtige Einschränkung:** Diese Angriffsmetriken umfassen alle eigenen Angreifer und sind hier **nicht kausal bestimmten fusionierten Monstern zugeordnet**.
- Die neue, isolierte Strategie `vi-impact` verringert eine geplante zusätzliche Farming-Welle typischerweise um drei Duelle **nur dann**, wenn in einem der letzten beiden echten VI-Bosskämpfe eine Handfusion wirklich ausgeführt wurde und zugleich mindestens eines der messbaren Potenz-/Kampfereignisse (stärker als sichtbare Feldschwelle, mindestens 300 realer eigener LP-Schaden, mindestens eine reale Gegnerkartenzerstörung) auftrat. Ansonsten bleibt sie bei der vorher definierten **intensiven VI-Vorbereitung**. Keine wertverändernden Game- oder Shop-Eingriffe, keine automatischen Extra-Karten und kein Blick auf verdeckte NPC-Hände.

**Methodik:** **32 vollständig neue unabhängige Karrierestart-Quellen**, Seed-Offset **84000** (keine alten Holdouts), jeweils drei unabhängig regulär durch `simulateGame` und `rewardMatch` belohnte Arme: `fixed-farm`, unverändert `vi-focused`, neu `vi-impact`. 16 vorab Train/16 unabhängiger Holdout. **10.172 echte regulär belohnte Karriereduelle insgesamt**, also 96 vollständig eigenständig verdiente Arms. Alle benutzen unverändert denselben `tempo-board`-Player-Combat-/Fusions-Controller; Shop/Deck/Shard/XP/Economy sind identisch. **Vor dem ersten echten VI-Bossduell** sind Ereignisse und Rewards innerhalb jedes der 32 Ursprungspaare **exakt gleich**, geprüft mit CI-Assertion. Gemeinsame 75 tatsächliche VI-Phasenkämpfe, 24 Bossversuche pro Tier (ausschließlich endliche Offline-Testgrenzen; keine neuen Live-Spielregeln).

## Vollständige Resultate: 32 unabhängige Quellen

| Metrik | Fixed | VI intensiv | VI nach Kampfnutzen |
|---|---:|---:|---:|
| **Gegner IV gewonnen** | **31/32** | **31/32** | **31/32** |
| **Gegner V gewonnen** | **31/32** | **31/32** | **31/32** |
| **Gegner VI gewonnen** | 6/32 | **9/32** | 5/32 |
| Echte regulär belohnte gesamte Duelle | 3.019 | 3.541 | 3.612 |
| Echte freie Duelle | 1.712 | 2.277 | 2.292 |
| Echte Turnierduelle | 1.210 | 1.167 | 1.223 |
| Gekaufte Booster | 330 | 342 | 342 |
| Regulär ausgegebene Splitter | 3.519 | 4.783 | 4.787 |
| Reale VI-Phasenkämpfe (summiert) | 1.426 | 1.933 | 2.021 |
| VI-Farming-Wellen nach Intensivplan | — | 165 | 237 |
| Davon aufgrund Kampfsignal verkleinerte neue VI-Wellen | — | — | **156** |
| Davon ungekürzte neue VI-Wellen | — | — | **81** |

**Befund:** Die neue `vi-impact`-Heuristik war **nicht effektiver**. Trotz 156 verkleinerten Farming-Wellen erforderte sie gegenüber der intensiven Kontrolle über alle Karrieren **15 zusätzliche freie und 71 zusätzliche Gesamtkämpfe**, benötigte vier weitere VI-Niederlagen in der Endbilanz (5 statt 9 Siege) und sparte weder relevante Gesamtkämpfe noch Splitter. Die unterschiedlichen regulär erhaltenen Belohnungs- und Matchfolgen beeinflussen spätere Kämpfe; man kann nicht jede verkleinerte Farming-Welle 1:1 als Zeitersparnis interpretieren.

## Neue tatsächliche Fusion-/Angriffs-Telemetrie

In den wirklich ausgeführten VI-relevanten Kämpfen (Boss VI + legale freie Gegner-V-Duelle **während** der VI-Phase):

| Tatsächlich beobachtet | Fixed | VI intensiv | VI-Impact |
|---|---:|---:|---:|
| Vorbereitete und anschließend tatsächlich platzierte **eigene Handfusionen** | 11.447 | 16.484 | 17.087 |
| Zusätzliche tatsächlich ausgeführte **Feldfusionen** | 247 | 596 | 570 |
| Tatsächlich verbrauchte eigene **Hand-Fusionsmaterialien** | 28.278 | 40.115 | 41.364 |
| Summe tatsächlicher ATK-Werte der **vorbereiteten** eigenen Fusionsmonster | 4.976.220 | 7.393.270 | 7.637.250 |
| Summe tatsächlicher DEF-Werte derselben Fusionen | 7.579.270 | 11.609.820 | 11.937.320 |
| Ausgeführte Fusionen mit ATK **über stärkster sichtbarer gegnerischer Feldschwelle** | 1.663 | 3.012 | 3.063 |
| **Tatsächlicher LP-Schaden aller eigenen Angriffe** | 2.437.306 | 4.579.780 | 4.629.316 |
| **Tatsächlich zerstörte gegnerische Feldkarten durch alle eigenen Angriffe** | 6.357 | 10.634 | 10.747 |

**Diese Summen dürfen nicht als isolierter Qualitätsvergleich missverstanden werden:** Der Intensiv- und Impact-Arm spielen viel mehr VI-relevante Kämpfe, weshalb sie mehr Fusionen, Angriffe, ATK-Summen und zerstörte Feldkarten kumulieren. Die Summen sind keine *je Duell* normalisierten Kausalbelege, dass ein einzelnes fusioniertes Monster besser ist. **Nicht speziell Fusionseinheiten zugeordnete LP-/Kill-Werte** sind echte Resultate aller Angriffe; für den nächsten Schritt muss deren Verursacher anhand der tatsächlich am Feld platzierten Fusionsinstanz verfolgt werden.

## Faire Budgetkurve: tatsächliche VI-Siege

| Tatsächlich gespielte VI-/Vorbereitungsduelle höchstens | Fixed | VI intensiv | VI-Impact |
|---|---:|---:|---:|
| **30** | **4/32** | 3/32 | 3/32 |
| **45** | **5/32** | 4/32 | 3/32 |
| **60** | **6/32** | **6/32** | 3/32 |
| **75** | 6/32 | **9/32** | 5/32 |

Die Werte sind kumulierte Siege aus denselben 32 Ursprüngen, keine unabhängig randomisierten Studien. Der mögliche Nutzen intensiven Farmings zeigt sich in dieser Kohorte erst bei längerem Budget; die neue Impact-Verkürzung bringt selbst dort keine Verbesserung.

## Echte Training/Holdout-Trennung

| Tatsächliche VI-Siege innerhalb von 75 Kämpfen | Training, 16 | Unabhängiger Holdout, 16 |
|---|---:|---:|
| Fixed | 4 | 2 |
| **VI intensiv** | **6** | **3** |
| Neue VI-Impact-Heuristik | 3 | 2 |

**Trainingsseitig gewählte Option:** `vi-focused`, da +2 VI-Siege gegenüber Fixed, drei bessere/ eine schlechtere Herkunftskarriere im Training. Auf dem vorher völlig unberührten **Holdout** erzielte sie jedoch nur **+1 VI-Sieg (3 statt 2)**, bei drei besseren, zwei schlechteren und elf gleichen Karrieren; tatsächlich **297 zusätzliche freie bzw. 272 zusätzliche Gesamtkämpfe** in den 16 Holdout-Ursprüngen. Die strenge vorher festgelegte Hürde erfordert mindestens **+2 unabhängige VI-Siege**, mehr bessere als schlechtere Startkarrieren, stabile IV/V und gleichen 75-Duell-Horizont. Daher gilt **`qualified=false`**. Die neue `vi-impact` bleibt im Holdout auf **2 statt 2** Siegen, im Training **3 statt 4** und ist schon wegen fehlenden Trainingserfolgs nicht ausgewählt.

**IV/V bleiben überall stabil:** Training 16/16, Holdout 15/16, alle drei Arme pro Quelle mit identischer Vor-VI-Karriere. Keine verringerte oder veränderte Bossstärke.

## Schlussfolgerungen und nächste Phase v10.4

1. **Technischer Fortschritt:** Tatsächlich ausgeführte und platzierte Fusionen lassen sich im Offline-Spielmonitor sauber von *nur möglichen* Fusionen trennen. Echte reale ATK/DEF, Materialanzahl, sichtbare Feldschwellen sowie echte Angriffs-/Killaktionen stehen für weitere Diagnostik zur Verfügung.
2. **Aber kein Strategievorteil:** Die untersuchte grobe Kombinationsregel aus Fusionsvorbereitung und allgemeinem Kampfschaden ist noch **kein tragfähiges Farming-Stoppsignal**. Schon v10.2 scheiterte reine Fusions-Legalität; v10.3 zeigt, dass **bloße Fusion-/Angriffsereignisse** ebenfalls nicht ausreichen.
3. **Nächster notwendiger Audit:** Eine Fusionsinstanz nach `place` anhand ihrer echten **UID** verfolgen und genau deren spätere `attack`-Ergebnisse, Schaden, zerstörte Gegner, Überleben/DEF-Rolle und Effizienz ihrer 2–5 verlorenen Materialien erfassen. Erst dann sagen, wie viel **eine konkrete Fusion** im tatsächlichen Kampf bringt; gegnerische versteckte Hand und Deck bleiben tabu.
4. **Zwei getrennte KI-Ziele:** Diese bisherigen Experimente steuern einen **Offline-Spielerautopiloten**, nicht die **aktive Gegner-NPC-KI**. Für Arcane Duel ist die nächste große potenzielle Verbesserung eine **separate fair begrenzte NPC-Archetypen-Evaluation** (Predator, Defender/Soul Drain, Resonator, ACE-Priorität), die keine illegalen Aktionen erlaubt. Das Thema NPC-Fairness soll nicht mit vollen Farming-Karriere-Experimenten vermischt werden.
5. **Neue unberührte Karriereursprünge** und früh festgelegte Vergleichsmetriken bei weiterer Policy-Entwicklung; keine nachträgliche Holdout-Optimierung, keine Änderung an Loot/Shop/ACE-/Monsterwerten und kein Auto-Merge in `main`.

## QA / Produktionsschutz

- [v10.3 Haupttraining #39384673301 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673301); **56/56** Game-/Economy-/Save-/Fusionchecks sowie **20/20** KI-Regressionen bestanden.
- [Code & Strategie #39384673224 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673224).
- [Browser-Smoke #39384673226 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39384673226).
- Echtes Ergebnisartefakt 12246773067 wurde heruntergeladen; `selected='vi-focused'`, `qualified=false` und Train-/Holdout-/Budgettabellen direkt aus `ai-fusion-impact-v103.json` überprüft.

**Status:** v10.3 auf `development` vollständig durchgeführt und als negatives Strategieergebnis dokumentiert. **Produktive NPC-KI, `main`, Kartenwerte, Drops, Economy, Nutzer-Spielstände unverändert.**
