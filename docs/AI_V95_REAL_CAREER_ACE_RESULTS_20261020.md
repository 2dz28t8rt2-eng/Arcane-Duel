# Arcane Duel – KI-Training v9.5: ACE-Fusionsfokus gegen Tempo auf vollständigen legalen Karrieren

**Datum:** 20. Oktober 2026 · **Branch:** `development` · **GitHub Actions:** [V9.5 Karriere-/Training-Suite SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087337) · [Code- und Strategieprüfungen SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087345) · [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39369087268).

**JSON-Artefakt:** `arcane-real-career-ace-v95`, GitHub Actions Artifact **12240518191** (Ablauf: 19.11.2026). Enthält alle 32 einzeln zuordenbaren legalen Karrierepaare mit Matchhistorie, Inventar-/Deck-Snapshots bei erreichten Turnierstufen, Belohnungen und vollständigen Metriken.

## Aufgabe, fairer Aufbau und Vorab-Gate

32 **neue** unabhängige Ursprungsseeds, Offset **52000**. Jeder Ursprung wird mit identischen Startbedingungen, eigenem `freshProfile()` und identischen Shop-/Splitter-/Farm-/Deckbau-Regeln gespielt:
- **Kontrolle:** exakt dieselbe in v9.2 ausgewählte und in v9.4 vollständigen Karrieren validierte Policy `tempo-board` aus `tests/helpers/ai-pre-attack-v92.cjs`.
- **Experiment:** `ace-reach`, die unveränderte explorative Variante **aus derselben v9.2-Policy**. Sie bevorzugt ACE-markierte Fusionsziele, sofern sie legal aus echten selbst besessenen Deckkopien erreichbar sind, und gewichtet zusätzlich höhere Fusionsstufen.
- 16 Ursprünge vorher als Training und 16 als unabhängiger Holdout festgelegt; **64 vollständig ausgespielte Karriere-Arme** (32 statistisch unabhängige Ursprungspaare) über reguläre echte `simulateGame`-/`rewardMatch`-Kämpfe bis VI oder regulär gescheitert. Alle Kartenzieh-, Shop-, Fusion-, Quest-, Reward- und KI-Regeln des produktiven Game-Cores blieben unverändert.
- Mit fortschreitender eigener Karriere dürfen sich Inventare in beiden Armen durch *echte Siege und Belohnungen* auseinanderentwickeln. Die Experimentsteuerung beeinflusst ausschließlich die **Spielerentscheidung bei legaler Normal-/Handfusion im Offline-Carriermodus**; kein künstliches Hochleveln, Gratis-ACE, Bonus-Splitter oder geschenktes Turnier.
- Vorab festgelegte Freigabeschwelle: ACE gewinnt mindestens **einen zusätzlichen VI-Sieg in beiden unabhängigen Gruppen**, verliert weder IV noch V im Holdout, und verbessert mehr Ursprungskarrieren als er verschlechtert. Keine nachträgliche Anpassung anhand des Holdouts.

## Ausführung

**4.211 echte regulär belohnte Karriereduelle**:
- 2.114 in 32 `tempo-board`-Karrieren;
- 2.097 in 32 `ace-reach`-Karrieren.

Der Workflow beendete **56/56** Regel-/Speicher-/Fusions-/Economy-Tests und **20/20** KI-Regressionsprüfungen ohne Fehler. Separat wurden Code-/Strategie-Checks und Browser-Smokes ebenfalls **SUCCESS**.

## Fortschritt bis VI – beide Hälften zusammen

| KPI | Tempo-Kontrolle, 32 Quellen | ACE-Fokus, 32 Quellen |
|---|---:|---:|
| Tatsächlich Gegner IV besiegt | **21/32** | 19/32 |
| Tatsächlich Gegner V besiegt | **21/32** | 18/32 |
| Tatsächlich Gegner VI besiegt | 1/32 | 1/32 |
| Durchschnittliche höchste besiegte Stufe | **4,34** | 4,19 |
| Tatsächlich ausgeführte Spieler-Attacken | 22.315 | 22.524 |
| Reguläre Booster-Käufe | 243 | 242 |
| Ausgegebene Splitter | 1.831 | 1.694 |

**Training, je 16 legal erspielte Karrieren:** Tempo IV **10**, V **10**, VI **1**; ACE IV **10**, V **10**, VI **0**.

**Unabhängiger Holdout, je 16 legal erspielte Karrieren:** Tempo IV **11**, V **11**, VI **0**; ACE IV **9**, V **8**, VI **1**. Der einzelne ACE-VI-Sieg im Holdout darf **nicht** zur erfolgreichen ACE-Freigabe umgedeutet werden: Im Training verlor ACE einen VI-Sieg, im Holdout verlor es **zwei IV- und drei V-Siege**, und fünf der 32 gepaarten Ursprünge endeten mit geringerem Karrierefortschritt versus nur zwei mit höherem.

**Paired Urteil:** Training 1 besser / 2 schlechter / 13 gleich; Holdout 1 besser / 3 schlechter / 12 gleich. Gesamt 2 besser / 5 schlechter / 25 gleich; `qualified=false`.

## Wesentliche Diagnose: Keine einzige Spieler-ACE-Karte in legalen VI-Saves

In den **bei VI angekommenen** Karrieren waren beim ersten regulären VI-Turnierversuch über beide Arme hinweg:
- **0 Karrieren mit einer eigenen ACE-Karte im Gesamtinventar.**
- **0 Karrieren mit einem ACE-Fusionstemplate im Fusionsdeck.**
- **0 gewählte oder ausgeführte ACE-Fusionen im gesamten Training.** Das galt gleichermaßen für `tempo-board` und `ace-reach`.
- **0 beobachtete Spielerfeld-Züge mit ACE-Monster.**
- Bei Gegner VI wurden jedoch beim jeweiligen Beginn des Spielerzuges **1.132 (Tempo) bzw. 1.037 (ACE) Beobachtungen mit mindestens einem gegnerischen ACE auf dem Feld** erfasst. *Das sind beobachtete Spielerzugzustände, nicht 1.132 verschiedene ACEs und auch keine verschiedenen unabhängigen Kämpfe.*

Die eigene ACE-Armut ist im Code plausibel begründet: `cardAvailable(id)` setzt für ACE voraus, dass die Karte **bereits besessen** ist; die normale Splitter-Craft-Funktion sperrt ACE-, Quest- und Essence-Karten. Zudem hat die festgelegte `late-shard`-Karriere-/Shop-Policy keinen separaten ACE-Erwerb. Daraus folgt nicht, dass ACEs im ganzen Spiel grundsätzlich unerreichbar sind. Es folgt **nur**, dass die untersuchte legale v9.5-Progressionsstrategie vor VI keine beschaffen konnte.

**Konsequenz:** Der beobachtete Effekt von `ace-reach` ist **nicht der ACE-Bonus**, weil nie ein ACE zum Zug kam, sondern die veränderte übrige Fusions-Rangliste (höheres Gewicht für Level und geringere Materialstrafe). Der frühere v9.2-Explorationsvorsprung der ACE-bezeichneten Policy war folglich noch kein Nachweis für echte ACE-Nutzung. Weiteres reines ACE-Bewertungsgewicht-Tuning wäre auf diesem Datenbestand unergiebig.

## Warum Gegner VI gerade eine andere Hürde ist

Daten nur aus den **wirklich durch einen Sieg über V erreichten** VI-Spielständen:
- Tempo: **21** Karrieren bis VI freigeschaltet, davon **1** Karriere mit VI-Sieg; ACE: **18**, davon **1** mit VI-Sieg.
- Durchschnittliche **Deck-Kartenstufe bei erstem VI-Versuch**: Tempo **3,02**, ACE **3,07**.
- Durchschnittlicher **Spielerlevel bei erstem VI-Versuch**: Tempo **6,6**, ACE **6,8**.
- Durchschnittlich zu Beginn **4,3** (Tempo) beziehungsweise **4,3** (ACE) verfügbare Splitter.
- Die zugbeginnbezogene im Kampf **sichtbare eigene Spitzen-ATK** lag im Schnitt bei Tempo **89,8**, ACE **101**; die gegnerische lag bei **830,4** bzw. **823,0**. Der Wert ist ein *Durchschnitt von Spielerzug-Snapshots vor der Beschwörung* und enthält daher leere/zerstörte Felder; **keine** direkte Gegenüberstellung zweier gleichstarker bereits beschworener Monster.

**Interpretation:** Der VI-Engpass ist nicht durch höhere ACE-Priorisierungsgewichte allein zu beheben. Es fehlt in den tatsächlich erreichten Karrieren an ausreichendem frühem Level-/Inventaraufbau, eigener ACE-Verfügbarkeit und vor allem an beständigem Feldtempo unter gegnerischem ACE-Druck. Diese Aussagen sind **plausible Hypothesen** aus Messung und Mechanik – ein separater kausaler Test ist nötig, um den jeweiligen Beitrag zu quantifizieren.

## Konsequenzen und Roadmap v9.6

1. **`tempo-board` als bestätigte Offline-Kontrolle beibehalten**, `ace-reach` nicht ausrollen; das v9.5-Gate wurde klar verfehlt. Keine Live-KI-/Monsterbalanceänderung auf `main`.
2. **Rechtmäßigen ACE-Erwerb gesondert auditen:** Wann kann der Spieler ACEs im unveränderten Regelwerk tatsächlich erwerben, welche Shops, Drops oder Belohnungen erfordern welchen Turniererfolg, und warum hat der bisherige reguläre Karriereplan bis VI null? Nicht durch geschenkte Karten, Unlocks, Forced-Ace-Drops oder geänderte Erfolgswahrscheinlichkeiten künstlich nachhelfen.
3. **VI-Ressourcen-/Deckbau-Hypothesen isolieren**: späteres legal erworbenes Fusionsdeck, Erhalt passender LV-3+ Materialien, echte Fusion gegen vorhandenes Gegner-ACE, zielgerichtete nach-V Farm- und Kaufentscheidungen. Auch Untersuchung von Ressourcen-Unterschieden pro Gewinn und Käufen statt der bloßen absoluten Anzahl.
4. **Neuer vollständiger 32+-Quellen-Karriere-A/B bis VI**, gleiche `tempo-board`-Kampfpolicy; nur eine rechtmäßige Investitions-/Deckbau- oder Farm-Priorität gegen die bisherige Economy austauschen. Training/Holdout separat, keine Änderung der Deck-Besitzvalidierung; primäres Gate: wirklich mehr VI-Siege ohne IV-/V-Regression.
5. **NPC-KI als eigenständiges Entwicklungsziel:** Dass der Offline-Spielercontroller bestimmte Gegner häufiger besiegt, beweist nichts über einen fairen oder nützlichen NPC-Buff. Vor NPC-Produktivübernahme Attack-/Fusion-/ACE-Fairness auf unabhängigen KI-Gegnerdecks prüfen.

**Status:** v9.5 tatsächlich vollständig ausgeführt und technisch grün, `qualified=false` bezüglich ACE-Fokus. Alle neuen Skripte/Reports ausschließlich auf `development`; `main`, `assets/game.js` und produktive NPC-KI unverändert.
