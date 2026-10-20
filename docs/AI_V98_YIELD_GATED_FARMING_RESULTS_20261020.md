# Arcane Duel – KI-Training v9.8: realer Grenzertrag beim VI-Farming

**Datum:** 20. Oktober 2026 · **Branch:** `development`. **Erfolgreicher Karrieretest:** [GitHub Actions #39374831093](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831093). **Allgemeine Code- und Strategiesuite:** [#39374831042 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831042). **Browser-Smokes:** [#39374831050 – SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831050).

**Artifact:** `arcane-real-yield-farming-v98` ID **12242579248**, verfügbar bis **19. November 2026**, mit `artifacts/ai-yield-gated-vi-farming-v98.json`. Die Datei enthält alle 32 gepaarten Herkunftskarrieren mit drei Armen, tatsächlich ausgezahlten Duellbelohnungen, Metriken für jede Farming-Welle, gewonnene Gegner und Train-/Holdout-Aufteilung.

**Produktionsstatus:** Test-only auf `development`; `main`, aktive NPC-KI, Karten-/ACE-Werte, Preise, Loot, Splitter, Questregeln und Live-Farming unverändert.

## Design und Absicherung

- **32 neue voneinander unabhängige Starts**, Seed-Offset **64000**; jeweils drei separat erwirtschaftete Karrierearme auf **demselben initialen Seed**, mit regulärem `freshProfile()`, `createGame`, `simulateGame`, `rewardMatch`, Käufen und Deckbau. Insgesamt **96 Arm-Karrieren und 10.353 echte regulär belohnte Duelle**. 16 Herkunftskarrieren vorab als Training, 16 als unabhängiger Holdout.
- Identische `tempo-board`-Fusions-/Spielerentscheidung **in allen drei** Armen. Testvergleich beeinflusst ausschließlich die Farming-Entscheidung **nach Beginn echter Gegner-VI-Duelle**.
- **Strikte Frühkarriere-Assertion:** Alle Kampfergebnisse, tatsächlich verdienten Karten, XP und Shop-Entscheidungsfolgen sind für jeden Ursprung bei allen Armen bis **vor dem ersten VI-Turnierkampf** identisch. Damit kein künstlicher Frühfortschritt oder unfaire V-Freischaltung.
- **Kontrolle (`fixed-farm`)** spielt wie bisher 2–5 freie Duelle nach jeweils drei Niederlagen.
- **`vi-focused`** beginnt nach zwei VI-Niederlagen mit größeren legalen freien Duellwellen gegen den zuvor wirklich besiegten Gegner V, begrenzt durch tatsächliche verfügbare Ressourcen und den vorhandenen XP-Abschlag.
- **`vi-yield-stop`** nutzt **dieselbe** Wellenformel, prüft danach aber den tatsächlich realisierten Fortschritt: Nettogewinn der durchschnittlichen ausgerüsteten Deck-ATK von mindestens 10, Deck-Kartenlevelgewinn mindestens 0,08, Spieler-Levelaufstieg, neue Fusionsausrüstung oder mindestens zwei zusätzliche wirklich besessene Karten. Ergibt eine Welle keinen solchen Fortschritt, wird die **nächste** sonst erlaubte VI-Farming-Welle übersprungen und zuerst wieder der echte Boss herausgefordert. XP, Loot, Splitter und Coins werden zusätzlich als echte Resultate protokolliert; sie zählen nicht allein automatisch als nachweisbarer sofortiger Deckbuff. Kein Einblick in verdeckte Gegnerhand.
- Maximal **24 Turnierversuche pro Tier**, VI-Farming-Budget maximal 48 zusätzliche Vorbereitungskämpfe – nur zur Begrenzung des Offline-Experiments, keine Regel im Spiel. Tatsächliche Siege, Karte, XP und Splitter werden niemals erzwungen.

## Alle 32 Ursprungskarrieren

| Metrik | Fixed | VI intensiv | VI-Ertragsbremse |
|---|---:|---:|---:|
| **Gegner IV besiegt** | **31/32** | **31/32** | **31/32** |
| **Gegner V besiegt** | **31/32** | **31/32** | **31/32** |
| **Gegner VI besiegt** | 5/32 | **15/32** | **15/32** |
| Durchschnittlich höchste besiegte Turnierstufe | 5,09 | **5,41** | **5,41** |
| Echte Karriereduelle | 3.169 | 3.592 | 3.592 |
| Darunter freie Duelle | 1.786 | 2.337 | 2.337 |
| Darunter Turnierduelle | 1.287 | 1.159 | 1.159 |
| Booster gekauft | 346 | 363 | 363 |
| Ausgegebene Splitter | 3.707 | 4.975 | 4.983 |
| Im VI-Bereich gemessene intensive Farming-Wellen | — | 169 | 169 |
| Reale nützliche Wellen nach v9.8-Schwelle | — | **158** | 161 |
| Reale schwache Wellen | — | 11 | 8 |
| Explizit übersprungene geplante VI-Wellen | — | 0 | **7** |
| Unmittelbare Loot-Ereignisse bei gemessenen Wellen | — | 378 | 376 |

Die intensivere VI-Vorbereitung benötigt insgesamt **551 zusätzliche freie Duelle** gegenüber Fixed, dabei **128 weniger Turnierduelle**; **423 zusätzliche Gesamtkämpfe** für **10 zusätzliche VI-Siege** über 32 Karrieren. Beide intensiven Varianten bringen auf dieser Kohorte **gleich viele VI-Siege bei gleicher Zahl von Duellen**. Der Ertragsfilter macht sich in sieben echten Entscheidungsfällen bemerkbar, hat die Zahl der anschließend tatsächlich durchgeführten Free-Duelle aber über die vollständigen Karrieren **nicht reduziert**; spätere Farming-Entscheidungen gleichen ausgefallene Wellen aus.

## Vorab unabhängiges Training/Holdout

| VI-Siege aus 16 Herkunftskarrieren | Training | Unabhängiger Holdout |
|---|---:|---:|
| Moderate Fixed-Kontrolle | 3 | 2 |
| `vi-focused` | **8** | **7** |
| `vi-yield-stop` | **8** | **7** |

Bei beiden VI-Varianten: **IV/V im Training 16/16**, im Holdout **15/16**, genau gleich wie Fixed. Im Holdout gibt es beim trainingsseitig ausgewählten `vi-focused` **sechs unabhängige Ursprünge mit besserem Karriereergebnis, einen mit schlechterem und neun unverändert**. Daher erfüllt dieser Arm die vorab festgelegte Offline-Grenze mit mindestens +2 VI-Siegen bei identischem IV/V-Erfolg: **`qualified=true` für v9.8 Offline-Validierung**.

Die Trainingsauswahl wählte `vi-focused` bei völlig **gleichem** VI-Erfolg und gleichen Gesamtduellkosten wie `vi-yield-stop` durch die Reihenfolge der zwei Optionen im Code; sie belegt **keine** bessere Leistung der ungesteuerten Version gegenüber dem Yield-Gate.

## Interpretation mit v9.7 im Blick

Die neue Kohorte ist gegenüber v9.7 sehr viel positiver für intensives VI-Farming. Auf v9.7-Ursprüngen betrug der Holdout für `vi-focused` noch **2/16 vs 3/16** Fixed, auf v9.8 dagegen **7/16 vs 2/16**. Das ist keine völlig konsistente Replikation derselben Erfolgswahrscheinlichkeit; die Wirkung ist offenbar von echten Inventar-/Seedverläufen abhängig. Der neue `qualified=true`-Status ist **kein produktives Rollout-Freigabezeichen** und ersetzt eine weitere unabhängige Stabilitätsanalyse nicht.

**Technisch überprüft:** v9.8 kann tatsächlich beobachten, ob zusätzliche freie Kämpfe die ausgerüstete Kartenstärke erhöhen. In 158 von 169 Wellen bei `vi-focused` erfüllen sie die zunächst formulierten readiness-Schwellen; damit wirkt das Signal **zu selten als echte Sparbremse**. Bloßes Hinzufügen dieser Prüfung war keine eigenständige Verbesserung.

**Nicht belegt:** dass bei einer breiteren Stichprobe immer zehn zusätzliche VI-Siege je 32 Karrieren entstehen oder dass Farming generell optimal ist. Die Statistik hat **32** unabhängige Startquellen, nicht 96 unabhängige Spieler; die besseren Karrierearme sind untereinander paarweise vom selben Ursprung abgeleitet.

## Konkrete Priorität v9.9

1. Den bereits feststehenden `vi-focused`-Kontrollarm **unverändert** auf erneut völlig neue Ursprünge gegenüber `fixed-farm` bestätigen, in denen keine v9.7-/v9.8-Holdout-Ergebnisse als Gewichte verwendet werden.
2. Einen **Budget-/Grenzrendite-fokussierten** Controller statt der zu großzügigen binären Yield-Schwelle testen: *tatsächliche* neu ausgerüstete Karten oder relevante Level-/Fusionsmehrwerte **je legalem Free-Duell** und feste transparente Maximalbudgets mit VI-Retry; nicht lediglich Inventarwachstum durch zwei schwache Karten als Erfolg zählen.
3. Die **kumulative VI-Siegwahrscheinlichkeit pro Duellbudget** auf vorab definierten Budgetstufen (z.B. 50/75/100/125 echte Karriere-Duelle ab VI-Beginn) vergleichen, um Spielbarkeit und Grind-Kosten abzuwägen. Keine rückwirkend erfundenen Sieger.
4. Deck-/Shop-/Shard-/Fusionsökonomie und legale ACE-Verfügbarkeit nur als separate Experimente und niemals durch Extra-Items oder Drop-Nerfs beeinflussen.
5. **Kein Auto-Merge in `main` oder aktive Gegner-KI.** Es handelt sich weiterhin um Offline-Spielerautopiloten gegen vorhandene Turnier-NPCs; vor produktiver NPC-Übernahme unabhängige Fairness- und Schwierigkeitsprüfung.

## Verifizierte Qualitätssicherung

**GitHub Actions #39374831093 – SUCCESS** mit **56/56** Engine-/Save-/Fusion-/Economy-Invariant-Tests und **20/20** KI-Regressionsprüfungen. Separate [Code-/Strategiechecks SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831042) und [Browser-Smokes SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39374831050).

**Fazit:** V9.8 zeigt einen guten neuen unabhängigen VI-Farming-Erfolg der intensiven Vorbereitung, aber keinen Eigenvorteil der neuen Ertragsbremse und noch keine über Kohorten stabile Freigabe für das Live-Spiel. `development` enthält nur Tests, Bericht und Trainingsroadmap.
