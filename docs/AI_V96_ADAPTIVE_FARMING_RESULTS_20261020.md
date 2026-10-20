# Arcane Duel – KI-Training v9.6: adaptives legitimes Freies-Duell-Farming gegen die feste Routine

**Datum:** 20. Oktober 2026 · **Branch:** `development`. **Haupttraining:** [GitHub Actions #39370187053 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187053). **QA:** [Code und Strategie #39370187087 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187087); [Browser Smoke #39370187062 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187062).

**Artefakt:** `arcane-adaptive-farming-v96`, ID **12240664806**, verfügbar bis **19.11.2026**; `artifacts/ai-adaptive-farming-v96.json` enthält individuelle Quellkarrieren, gewonnene Turnierstufen, Kauf- und Ressourcenverläufe, frei ausgespielte Gegner, XP, Gründe und Anzahl jeder adaptiven Farming-Entscheidung sowie echte Ergebnisse je Run.

## Warum dieser Test gemacht wurde

Freies Duell ist im regulären Arcane Duel ausdrücklich vorgesehen. Dass ein Gegner nicht beim ersten Versuch gewonnen wird, ist kein Fehler. Im bisherigen Karriere-Trainingssimulator waren Farming-Wellen nach drei Niederlagen und bis zu **16** Turnierversuche pro Gegner üblich. v9.6 testet eine stärker vorbereitende **adaptive Farming-Routine** und erweitert **für BEIDE Vergleichsarme** die Obergrenze auf **24 Turnierversuche je Tier**. Das ist ausschließlich eine **Offline-Testbegrenzung**, keine Spielregel und kein künstlicher Sieg.

## Versuchsaufbau

- **32 vollständig neue unabhängige Startseeds**, Seed-Offset **56000**, jeder Ursprung zweimal von `freshProfile()` regulär durchgespielt: `fixed-farm` und `adaptive-farm`. Also 64 Karrierearme, **nicht 64 unabhängige Quellen**.
- Die **in v9.4 unabhängig validierte `tempo-board`-Fusionspolitik** läuft in **beiden** Armen **exakt identisch**. Deck-, Shop-, Perk-, Craft-, Splitter- und Reward-Regeln sind identisch. Beide kaufen/erbeuten ihre eigenen Karten und zahlen die echten Preise. `simulateGame` + `rewardMatch` für jedes einzelne freie und jedes Turnierduell.
- Split **16 Trainings-/16 vorher ungesehene Holdout-Ursprünge**; gleicher Karriere-Startseed, ähnliche Duell-Seedfolgen bis Verläufe auseinanderlaufen. Die Karrieren können durch unterschiedliche echte Siege/Verluste rechtmäßig andere Inventare, Belohnungen und weitere Farmmöglichkeiten erhalten.
- **Kontrolle:** vor dem ersten Bosskampf kein Spezialfarming, nach jeweils drei Niederlagen **2–5 freie Duelle**, nach Siegen ebenfalls **2–5**. Die bestehende Farming-Logik bleibt erhalten.
- **Adaptiv:** Boss ebenfalls **erst mindestens einmal real herausfordern**. Ab zwei Niederlagen freie Duelle gegen den höchsten zuvor tatsächlich besiegten Gegner; je Vorbereitung **2–8 Duelle**, abhängig von Tier, sichtbarer Boss-Signatur-ATK, aktueller eigener durchschnittlicher Deck-ATK und dem unveränderten XP-Abschlagsfaktor `farmingXpFactor`. Reguläre Kauf-/Deck-Entscheidungen nach jedem freien Duell. Endlicher zusätzlicher Farm-Budget je Tier: I/II 16, III 24, IV 32, V 40, VI 48 – ausschließlich eine Simulationseingrenzung. Post-Turnier-Sieg-Farming wie in der Baseline.
- **Maximal 24 Turnierversuche in beiden Armen** je Gegner, bis Tier VI. Keine gecheateten Karten, Extra-Siege, XP, Drops, ACEs, NPC-Nerfs, Wirtschafts- oder Game-Engine-Änderungen.
- Der erste technische Versuch [#39370127415](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370127415) endete **ohne durchgeführte Karrieren**, weil eine Skriptvalidierung nur 22 erlaubte Versuche zuließ. Die Validierungsgrenze wurde im **Testskript** auf maximal 30 angehoben, um die gewünschten **24** zuzulassen; der vollständige zweite Versuch wurde danach mit allen Karrieren und QA **SUCCESS** beendet.

## Ergebnis – 32 Quellen zusammen

| Metrik | Feste Farming-Routine | Adaptives Farming |
|---|---:|---:|
| **IV wirklich besiegt** | **29/32** | 28/32 |
| **V wirklich besiegt** | **29/32** | 28/32 |
| **VI wirklich besiegt** | 4/32 | **8/32** |
| Durchschnittlich höchste besiegte Stufe | 4,94 | **5,00** |
| Reguläre freie Duelle | 1.715 | **2.516** |
| Reguläre Turnierduelle | 1.201 | 1.039 |
| **Alle tatsächlich belohnten Karriereduelle** | 3.015 | **3.654** |
| Booster-Käufe | 328 | 353 |
| Verbrauchte Splitter | 3.268 | 4.674 |
| Tatsächliche XP aus freien Duellen gegen Gegner V | 50.559 | **81.614** |
| Mittel Turnierversuche unter **erfolgreichen VI-Karrieren** | 18,75 | **12,13** |
| Mittleres Level bei erster legaler VI-Teilnahme | 6,7 | **7,1** |
| Ø Hauptdeck-Kartenlevel bei erster legaler VI-Teilnahme | 3,06 | **3,28** |

Insgesamt **6.669** reguläre belohnte Duelle in 64 Karrierearmen auf 32 Ausgangsquellen. Die adaptive Variante absolvierte **801 zusätzliche freie Duelle** und **162 weniger Turnierduelle**, insgesamt **639 mehr Kämpfe**. Sie erzielte höhere eigene Level und bessere Decklevel bei VI. Die höhere Effizienz unter **nur erfolgreichen VI-Karrieren** ist als *selektierte Teilstichprobe* zu interpretieren; sie beweist keine allgemeine Reduktion der Versuche für alle Spieler.

## Unabhängiger Vergleich je vorab abgegrenzter Hälfte

| Metrik | Training fest | Training adaptiv | Holdout fest | Holdout adaptiv |
|---|---:|---:|---:|---:|
| IV gewonnen | **15/16** | 13/16 | 14/16 | **15/16** |
| V gewonnen | **15/16** | 13/16 | 14/16 | **15/16** |
| VI gewonnen | 2/16 | **3/16** | 2/16 | **5/16** |
| Höchste durchschnittliche Stufe | **5,00** | 4,81 | 4,88 | **5,19** |
| Gesamte reguläre Duelle | 1.518 | 1.827 | 1.497 | 1.827 |

**Gepaarte Karriere-Endstufen:** Training 2 Ursprünge höher, 3 niedriger, 11 gleich; Holdout **6 besser, 2 schlechter, 8 gleich**. Der VI-Effekt ist im Holdout **+3**, im Training **+1**. Im Training verlierten jedoch zwei Quellen ihren IV- und V-Sieg; im Holdout verbesserte sich IV/V um jeweils eine. Der vorab im Skript festgelegte Promotion-Gate verlangt auch **keine IV-Regression im Training** und **mindestens +2 VI-Siege im Holdout**. Deshalb lautet das korrekte Experimenturteil **`qualified=false`**: trotz belegtem Potenzial **keine Live-Freigabe**.

## Wichtigste Erkenntnisse

1. **Farming funktioniert schon in Arcane Duel und wurde in früheren Trainings stets berücksichtigt**. v9.6 beweist nicht „erst jetzt ist Farming möglich“, sondern quantifiziert eine *alternative adaptive Vorbereitung* unter denselben legalen Spielregeln.
2. **VI ist teilweise eine Vorbereitungshürde:** Durch mehr legal verdiente freie Duelle steigt die VI-Gewinnzahl von 4 auf 8 aus 32 Quellen. Adaptives Farming hilft aber nicht jedem Seed und kostet mehr tatsächliche Duelle/Ressourcen.
3. **Nicht jede frühere Stufe braucht intensives Farming:** Bei IV/V ist die kontrollierte feste Routine insgesamt um je einen Sieg besser. In der Trainingshälfte gingen bei der adaptiven Variante je zwei IV/V-Siege verloren; der alternative RNG-/Lootverlauf kann nach extra Free-Duellen auch schlechtere Decks erzeugen.
4. **Die Zahl erlaubter Boss-Versuche ist nicht die tatsächliche Schwierigkeit:** 24 ist eine rein endliche Testgrenze für beide Arme. Das Live-Spiel bleibt ohne diese neue künstliche Begrenzung.
5. **Die Wirtschaft bleibt ehrlich:** Die adaptive Variante kauft 25 Booster mehr und gibt 1.406 zusätzliche Splitter aus, aber diese Mittel wurden tatsächlich über mehr Kämpfe verdient. Eine höhere Erfolgschance kann gerade *wegen* der notwendigen Investition sinnvoll sein.
6. **Keine künstlichen Buffs und keine NPC-KI-Verbesserung:** Beide Arme benutzen dieselbe Offline-Spieler-`tempo-board`-Kampfpolicy. Der Unterschied liegt ausschließlich in der **Farming-Zeitplanung**, nicht in veränderten Monsterwerten oder in der aktiven Gegner-KI.

## Planung v9.7

- **Nach v9.6 bekannte Holdouts keinesfalls als Trainingsset wiederverwenden.** Auf komplett neuen unabhängigen Ursprüngen einen **selektiven Farming-Controller** prüfen: frühe Stufen (I–IV/V) mit normalem geringerem Farming, verstärkte Vorbereitung erst ab dem hohen Schwierigkeitsübergang zu VI, wenn die KI bereits V legal gewonnen hat. Damit verhindern, dass intensives Farmen an IV/V den Loot-/RNG-Verlauf unnötig verschlechtert.
- **Gewünschter Nachweis:** Echte VI-Siege im unabhängigen Holdout öfter als Baseline, **keine IV/V-Regression**, und mit transparenten echten Free-/Tournament-Duellkosten. Nicht nur die verbesserte VI-Siegzahl isoliert betrachten.
- Gegebenenfalls separate Runden mit gleicher Gesamtkampf-Budgethöhe prüfen, damit die Entscheidung zwischen Aufwand und Fortschritt messbar wird. Auf keinen Fall Monster-Attacken, Dropwahrscheinlichkeiten oder Preise für das Training verändern.
- **Separate NPC-Tests erforderlich**, bevor eine im Spielerautopiloten erfolgreiche Farming- oder Fusionslogik als NPC-KI verkauft wird. Im tatsächlichen Spiel darf eine NPC-KI nicht einfach selbstständig für den Spieler Ressourcen ausgeben, ohne dass dies ein ausdrücklich gewollter Spielmodus wäre.
- **`main`, Live-Gegner-KI, Karten-/ACE-Stats, Loot, Economy und Questfortschritt bleiben unverändert.**

## QA

V9.6 nach der Skriptvalidierungs-Korrektur: [GitHub Actions #39370187053 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187053); **56/56** Game/Deck/Fusion/Economy Tests bestanden und **20/20** zusätzliche KI-Regressionen grün. Separate [Code-/Strategiechecks #39370187087 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187087) und [Browser-Smokes #39370187062 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39370187062).

**Status:** tatsächlich trainiert und vollständig dokumentiert, nachvollziehbarer Gewinn an VI-Fortschritt bei erhöhten echten Farming-Kosten, wegen IV/V-Regression der Trainingshälfte keine Freigabe. Weiter ausschließlich Offline-Testcode auf `development`.
