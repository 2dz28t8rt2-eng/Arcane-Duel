# Arcane Duel – KI- und Fusionsdeck-Training v6.6

**Datum:** 19.10.2026 · **Entwicklungszweig:** `development` · **Produktive Turniergegner unverändert**, `main` nicht aktualisiert.

## Wichtige Unterscheidung: Lernen pro Match vs. Offline-Training

Die bestehende Gegner-KI **lernt nicht automatisch in jedem Live-Match dazu**. Es gibt in der laufenden Spielengine keinen aktivierten persistierenden Online-Lernalgorithmus, der seine Taktik durch einzelne Spielerverläufe selbständig optimiert.

Wir betreiben offline reproduzierbare Match-Simulationen, lassen Trainingsvarianten gegeneinander antreten und prüfen ausgewählte Kandidaten auf völlig anderen Seeds. Erst nach erfolgreicher Prüfung und einem späteren bewussten Rollout könnten veränderte feste Regeln oder Gewichtungen die spielbare Version verändern.

Bei v6.6 ist primär die **Trainings-/Testspieler-Deckbau-Strategie** verbessert worden, nicht der produktive Turniergegner.

## Technischer Ansatz

`tests/ai-fusion-deckbuilder-v66.cjs` optimiert das **40-Karten-Hauptdeck zusammen mit dem Fusionsdeck**, ausschließlich anhand der wirklich erworbenen `profile.inventory`- und `profile.fusionOwned`-Bestände aus regulär ausgespielten Karriereverläufen (Version 6.4). Statt ATK/DEF isoliert zu maximieren, bewertet die Variante:
- Materialkarten, deren Stufen rechnerisch zu den **tatsächlich besessenen Fusionsvorlagen** führen können;
- die echte PvE-Levelobergrenze von zwei Materialien (Summe, höchste Stufe +2, max. 12) beim Fusionsdeck;
- erhaltene Kopien, Rollenbeziehungen, Verteidiger-/Seelenzehrer-Stärkung;
- gültige 40er-Deck- und 2–15-Fusionsdeck-Regeln über die echten Spiel-APIs `setActiveDeck` und `setFusionDeck`;
- Unterschiedliche Strategien: `bridge`, `signature`, `soul-bridge`, `predator-bridge`.

**Kein Reward, keine Karte und kein Turniersieg werden für diese Tests erfunden.** Die Erzeugung geschieht ausschließlich in isolierten Profilen im Node-Testmotor.

## Auswahl und erste unabhängige Kontrolle

[Erfolgreicher Fusion-Deckbuilder-Trainingslauf 6.6](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39251559756)

**822 vollständige KI-/Deckbau-Vergleichsduelle** auf 17 besitzgebundenen Spätkarriere-Snapshots, gesammelt aus acht echten simulierten Karrieren.

| Nächster Gegner | echte Inventarsnapshots | vorab aus Training ausgewählt | zusätzliche Spieler-Siege im Holdout | verbessertes Spieler-LP-Delta | Annahmekriterium |
|---|---:|---|---:|---:|---|
| IV | 8 | unveränderte Baseline | 0 | 0 | Keine Änderung |
| V | 5 | **Seelenzehrer-Fusionsbrücke** | **+5** | **+166** | Ja, für weitere QA |
| VI | 4 | Seelenzehrer-Fusionsbrücke | 0 | +181 | Nein, nicht ausreichend |

Auch die Spiele für VI sind wertvoll, rechtfertigen aber allein noch keine aktive Änderung.

## Zweite unabhängig festgelegte Kontrollrunde

[Erfolgreiche Fusions-Deck-Bestätigung v6.6](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39251862895)

Die zuvor bei V ausgewählte Strategie `soul-bridge` wurde **vor Beginn dieser Serie festgelegt**. Keine neue Nachjustierung oder Auswahl anhand der Bestätigungsdaten. Neue und disjunkte Startseeds; dieselben fünf tatsächlich erspielten Karriere-Inventare; zwei Startpositionen.

| Messwert bei Gegner V | Bisheriger Auto-Deckbau | Neue Seelenzehrer-Fusionsbrücke |
|---|---:|---:|
| Spiele | 120 | 120 |
| Gewonnene Spiele | **5** | **17** |
| durchschnittlicher NPC-minus-Spieler-LP-Abstand | 3158 | 2750 |
| unterschiedliche, gegenüber Baseline geänderte Haupt- oder Fusionsdecks | 0 | 120 |
| Duelle mit geändertem Fusionsdeck | 0 | 72 |

**Fazit: +12 Spielersiege und +408 LP bessere Differenz.** Das ist ein eigenständiger, konsistenter Fortschritt für die Trainings-/Testspieler-Deckbildung. Die Gewinnquote steigt von 4,2 % auf 14,2 %. Selbst 14,2 % sind aber noch sehr niedrig; der künstliche Karrierecontroller ist mit echten Spielerfähigkeiten nicht gleichzusetzen.

## Offen und wichtig

- Dies ist **kein autonomes Online-Lernen** in laufenden Spielerpartien.
- Der nachgewiesene Gewinn gilt aktuell nur für die getestete Strategie **gegen Turniergegner V**.
- Der Spieler-Testcontroller selbst (`simulateGame` Policy `balanced` / `offensive` usw.) ist kein vollständiger menschlicher Spielstil.
- Die fünf Inventare stammen aus den acht deterministisch simulierten v6.4-Karrieren. Sie sind keine große heterogene Population echter Nutzer.
- Weiterhin **keine echten durchgespielten Trainingsinventare für VII–X**; die v6.4-Karrieren endeten spätestens vor VI.
- Eine Verbesserung des Deckbaus bedeutet nicht, dass die KI durch jedes einzelne Match zwangsläufig intelligenter wird.
- Der experimentelle Deckbauer wurde **nicht** im Live-UI aktiviert. Die reguläre Karriere- und Turnier-KI bleiben unverändert.

## Nächster sinnvoller Schritt

Die jetzt unabhängige bestätigte Fusionsbrücke als **optionale Offline-Karrierestrategie** in echte, ausführlichere Karriere-Testläufe einhängen. Erst wenn diese Trainierenden Gegner VI wirklich besiegen, echte Deck-Snapshots für VII erhalten. Danach Rollen-/Fusions-Synergien und gezielte AI-Taktik der oberen Gegner trainieren, ohne künstliche Sieg-/Inventar-Freischaltungen.

**Ergebnisdaten:** `artifacts/ai-fusion-deckbuilder-v66.json` und `artifacts/ai-fusion-confirmation-v66.json` in den jeweiligen GitHub-Actions-Artefakten (30 Tage).
