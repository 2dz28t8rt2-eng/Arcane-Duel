# Arcane Duel – KI-Trainingsrunde v7.4–v7.5: echte VIII-Progression und Boss-X-Sättigung

**Datum:** 19. Oktober 2026 · Zweig: `development` · Produktions-KI, `main`, Kartendefinitionen und Balance **nicht** geändert.

## Kurzfazit

Die zuvor bestätigte Fusions-KI für Gegner VIII erzielt gegen hypothetisch kombinierte Endgame-Decks deutlich mehr Siege. Aber **gegen durch reale Belohnungen erworbene Karrieredecks ist bereits die bisherige VIII-KI zu stark für unsere geskripteten Testspieler**. Eine Freigabe des stärkeren VIII-Modells wäre deshalb derzeit nicht gerechtfertigt.

### 7.4 – Boss X mit legalen, anspruchsvolleren konstruierten Decks

[Erfolgreiche GitHub Action](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39276459577)

Das Skript `tests/ai-x-adversarial-v74.cjs` simulierte **1.456 echte Engine-Duelle** mit 56 verschiedenen Endgame-Deckkonfigurationen (Quellen/Level/Fusionen auf normalen Kartenregeln, jedoch **theoretischer Besitz**) und fünf Spieler-Kampfstilen. Die Training-Seeds wählten den für den Boss stärksten Spieler-Stil, Holdout-Seeds verglichen die bisherige Boss-KI mit der zuvor diagnostizierten offensiveren X-Variante.

| Echte Boss-X-Partien | Bisherige v5.7-KI | Experimentelles Rapid Pressure |
|---|---:|---:|
| Kontrollpartien | 448 | 448 |
| Siege von Boss X | **448** | **448** |
| Boss-Signatur-ACE auf dem Feld | 448 | 448 |
| Veränderung durchschnittlicher NPC-LP-Differenz | – | **+75 LP** |

Auch die fünf Piloten hatten auf Trainingsseeds jeweils 0 Siege in 112 Partien. **Kein messbarer Siegquoten-Vorteil; Modell nicht aktiviert.** Dies ist eine Sättigungsdiagnose, keine Behauptung, X sei für Menschen unbesiegbar.

### 7.4 – Reguläre Erschließung von Turnierstufe VIII

[Erfolgreiche GitHub Action mit echten Belohnungen](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39276778489)

`tests/ai-earned-stage-vii-v74.cjs` führt die echte Spielökonomie fort: Startpunkt ist ein durch realen Sieg und `rewardMatch` freigeschalteter VII-Spielstand aus der v6.8-Strecke. Die Testspieler dürfen **0 / 8 / 20** weitere normale VI-Freiduelle absolvieren, die regulären Belohnungen erhalten, Booster nur mit vorhandenen Münzen kaufen, Crafting nur bei Ressourcenverfügbarkeit nutzen und anschließend ausschließlich aus ihrem echten Inventar Decks ausrüsten. Jeder Versuch gegen VII wird gespielt. **Nur ein real gewonnener und belohnter Kampf kann `profile.cleared.includes(7)` setzen und VIII freischalten.**

- **228 neue Duelle**, einschließlich VI-Farmen und VII-Strategie-Vergleichen.
- Aus **einer** echt verdienten VII-Herkunft entstanden drei Ressourcen-/Farmvorbereitungen.
- Zusätzliches Farmen: In 8 VI-Duellen 0 Siege, in 20 VI-Duellen 2 Siege, jeweils mit tatsächlich gebuchten Belohnungen.
- Auf den VII-Trainingsseeds sah `offensive` besser aus, scheiterte aber am unabhängigen Holdout.
- **Unabhängiger Holdout:** bestehende Spielerstrategie 2 Siege, Offensivstil 0.
- Die beiden legitimen Siege gegen VII ergeben **zwei gültige VIII-Spielstände**, jedoch aus **derselben ursprünglichen Karriere**, mit denselben Kartendaten und nur **einem erfolgreichen Seed**. Dies sind keine zwei unabhängigen repräsentativen Endgame-Karrieren.

### 7.5 – Echter Gegner-VIII-KI-Fairnesscheck

[Erfolgreiche, von Beginn bis VIII vollständig reproduzierte GitHub Action](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39277241365)

Das Skript `tests/ai-earned-viii-fairness-v75.cjs` baut zunächst die VII-/VIII-Spielstände mit normalen Belohnungen erneut auf, lädt sie in die echte Duellengine, überprüft ihre Inventarlegalität und vergleicht mit festen, **vor dem Holdout definierten** Gewichten: v5.7 versus `fusion-precision`. Pro Modell **160 Duelle**, vier Spielerstile, identische Seeds/Startpositionen und das echte Turniergegnerdeck mit Signatur-ACE.

| Kontrollwert | Bisherige VIII-KI | Frozen Fusion Precision |
|---|---:|---:|
| Gewonnene Duelle | 160 / 160 | 160 / 160 |
| Player-Siege | **0** | **0** |
| Spiele mit echter Boss-ACE-Beschwörung | 160 | 160 |
| Mittlerer NPC-LP-Vorsprung | **6.268** | **6.134** |

Unabhängig hiervon liefert die **Inventarprüfung** den kritischen Befund: **Beide VIII-Spielstände haben 40 Hauptdeckkarten, maximal normales Monsterlevel 4, null Level-7+-Normalmonster, null neue Late-Game-Karten in Besitz oder Deck**, mit jeweils 20 unterschiedlichen Hauptdeckkarten und 6 unterschiedlichen Fusionsvorlagen. Die geskripteten Spieler erreichen VIII in diesem Seed daher deutlich früher als sie eine konkurrenzfähige Normalmonster-Sammlung aufbauen.

Keine Freischaltung von IX in diesen Spielen. `eligibleForLiveDeployment=false`.

## Was daraus folgt

Die schlechte Leistung unserer künstlichen Spieler ist **kein Beweis**, dass menschliche Spieler bei VIII zwingend scheitern. Die verwendeten Piloten sind begrenzt und die legalen Karrieren stammen nur aus einem ursprünglichen Seed. Auch der neue Kartenpool ist grundsätzlich größer geworden: die **Beschaffung und sinnvolle Ausrüstung** war hier der Engpass. Unsere vorherige Analyse mit theoretischen Decks und die neue mit realen Inventaren liefern bewusst unterschiedliche Aussagen.

**Empfohlene nächste KI-Trainingsstrecke:** die simulierte Spielerentwicklung verbessern (wirtschaftlich sinnvolle Booster-/Crafting-Auswahl, frühes Farmen schon vor VII, Fusionen mit passendem Material, verschiedene Ausgangsseeds), dann mehrere eigenständige, wirklich verdiente VIII-Spielstände aufbauen. Erst danach erwägen, eine abgeschwächte oder situativ geschützte `fusion-precision` in die Live-Turnier-KI zu übernehmen. Für X neue Testspieler mit einer echten späten Sammlung erschließen, statt weiter 100%-Siege als KI-Erfolg zu werten.

**Dateien:** `tests/ai-earned-stage-vii-v74.cjs`, `tests/ai-earned-viii-fairness-v75.cjs`, `tests/ai-x-adversarial-v74.cjs`, die drei zugehörigen GitHub-Workflows, JSON-Ergebnisse in CI-Artefakten (30 Tage Aufbewahrung).

**Zusätzliche Prüfungen:** 1.456 X-Duelle + 228 VII-Vorbereitung/Duelle + 320 VIII-Duelle = **2.004 zusätzliche Kampf-Simulationen** dieser Versionen, ohne erneut durchgeführte v6.7/v6.8-Reproduktionsvorbereitungen mitzuzählen.
