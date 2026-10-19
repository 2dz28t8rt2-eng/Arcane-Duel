# Arcane Duel – KI-Training v6.0: identische Deck-Mirrormatches

**Stand:** 19.10.2026 · **Branch:** `development` · Produktions-Turnier-KI **unverändert** (`main` ebenfalls unverändert).

## Erfolgreicher 5.000-Duelle-Trainingslauf

[GitHub Actions – Stage Deck & Mirror AI v6.0, Run 39239526244](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39239526244)

- **3.000 Trainingspartien** + **2.000 unabhängig ausgespielte Holdout-Partien**
- **10 Turnierstufen** × **5 Archetypen** (Predator, Wächter, Fusion, Allrounder, Seelenzehrer) × **2 Inventarvarianten** × **beide Startreihenfolgen**
- Gleicher Seed, identische Main- und Fusionskarten auf beiden Seiten; normale Shuffles sind eigenständig (gleicher Kartenbestand, nicht gleiche zufällige Hand)
- `tests/stage-owned-decks-v60.test.cjs`: **4/4 Validierungstests erfolgreich**, einschließlich Kartenkopien, Quellenstufe und identischer Deckausrüstung.
- Vergleich: bisher offline trainierter v5.7-NPC versus v5.9 testweise aktivierter Branching-NPC, beide mit derselben Main-/Fusion-Kartenauswahl wie der geskriptete Gegenspieler.
- **Netto −50 Siege** der neuen KI gegen die v5.7-Trainingsbaseline im Holdout, durchschnittlich **−211 LP** zusätzlicher Abstand (über Stufen gleichgewichtet).

| Turnierstufe | Neuer KI-Gewinn (Siege) | LP-Delta | Bester v6.0-Kandidat | vorläufige QA-Zulassung |
|---|---:|---:|---|---|
| I | +13 | +1473 | Field | Ja |
| II | +14 | +803 | Field | Ja |
| III | −27 | −1396 | Tempo | **Nein** |
| IV | −5 | −413 | Field | Nein |
| V | +2 | +217 | Field | Ja – kleiner Vorteil |
| VI | −39 | −1862 | Field | **Nein** |
| VII | 0 | −493 | Field | Nein |
| VIII | +10 | +415 | Field | Ja |
| IX | −25 | −1004 | Field | **Nein** |
| X | +7 | +150 | Field | Ja |
| **Summe** | **−50** | *−211 Mittelwert* | | **5 weitere QA-Kandidaten** |

**Wichtig:** Diese 2.000 Holdout-Partien entsprechen 100 Kandidaten- und 100 Kontrollpartien je Turnierstufe, mit über alle Stufen disjunkten Startseeds; die KI-Kandidatenwahl erfolgte vor dem Holdout. Hieraus folgt noch **keine** Freigabe. Besonders III, VI und IX benötigen überarbeitete Entscheidungsmodelle.

## Was bedeutet „tatsächlich stufengerecht“?

`tests/helpers/stage-owned-decks-v60.cjs` leitet die Sammlung **aus dem echten `freshProfile().inventory`** ab. Für Duell `tier` werden nur nachweislich gewöhnliche Belohnungen der Stufen **0 bis tier−1** ergänzt – keine künftigen Gegner, keine aktuelle Turnier-Belohnung, keine Hardmode-, ACE-, Lv1-Quest-, Manifestations-, Meilenstein- oder sonstige Sonderkarten. Beide Decks erfüllen die realen 40-Karten-/maximal-drei-Kopien- und 2–15-Fusionskarten-Regeln **sowie die simulierten verfügbaren Stückzahlen**.

Eine normalen Sammlung wird **höchstens eine** ausgewählte Belohnung pro vorherigem Turniergegner zugewiesen; die investierte Variante erlaubt **höchstens drei** (angenommene Wiederholungskämpfe). Turnier 0 als Einstieg erhält bis zu zwei bzw. vier simulierte Drop-Auswahlen. Kopien werden nicht frei hinzuerfunden. Das reduziert die frühere Überversorgung mit allen möglichen früheren Beutekarten.

**Einschränkung:** Diese Bestände sind konservative, spielregelkonforme **synthetische Inventare**, nicht tatsächlich durchgespielte Spielerkampagnen. Das Modell kann reale Dropquoten, Packentscheidungen, Kosten, erworbene ACEs, Spielerstufe oder Investitionen nicht vollständig ersetzen. Für eine exakte Aussage über *durchschnittlich tatsächlich erspielte* Decks braucht es Karriere-Runs mit `rewardMatch`, Inventarsnapshots und echten Deckentscheidungen.

## Definition eines Mirrormatches

Die beiden Duellseiten besitzen **identische 40-Karten-Hauptdecks**, **identische Fusionsdecks**, gleiche Start-LP, gleiche Basis-Power, keine Extra-Enhancements und keine einseitigen First-Trial-Power-Boosts. Der Trainingscode prüft diese Eigenschaften vor **jeder** Partie. Er führt jedes Deck zweimal mit vertauschter Startspielerposition und denselben Testseeds aus.

**Nicht identisch:** Die **KI-Controller** sind absichtlich verschieden, denn nur so lässt sich messen, ob die trainierte Entscheidungslogik mit exakt denselben Karten besser spielt als die Baseline. PvE-seitenspezifische Mechaniken und KI-Passive bleiben Teil der echten Engine und sind nicht vollständig symmetrisch. Das ist **ein kontrollierter Karten-Mirror**, kein vollständig regelseitensymmetrisches PvP-Mirror.

## Training ist offline und sicher getrennt

`tests/ai-mirror-training-v60.cjs` erzeugt vollständige Partien im isolierten GitHub-Actions-Spielmotor. Das Branching-Modul `assets/ai-branch-trainer-v59.js` führt nur im aktivierten Trainingssandbox legale Alternativaktionen in einem von verborgenen Spielerkarten bereinigten Klon aus. Es wird **nicht automatisch** in regulären Karrierepartien zugeschaltet; Spielstände und Main-Branch werden nicht verändert.

## Warum wir nicht alle Profile übernehmen

Die Ergebnisse hängen deutlich von den Testdecks ab:

- [Erste Deckquelle, 3.200 Partien](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39238903663): −1 Sieg insgesamt; ältere Deckgenerierung enthielt zu viele potenziell verfügbare Rewards.
- [Besitzbegrenzte Decks, 3.200 Partien](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39239215703): −39 Siege insgesamt.
- [Besitzbegrenzte Decks, größerer Holdout mit 5.000 Partien](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39239526244): −50 Siege insgesamt.

Diese Serien verwenden verschiedene Testbedingungen und sind **nicht** als 11.400 gleichwertige oder unabhängige Duelle zusammenzuzählen.

## Prioritäten der folgenden Iteration

1. **Gegner III, VI und IX:** Warum bevorzugt die Branch-Engine im Mirror schwache Beschwörungen/Fusionen? Normale vs. Fusion-Aktion, Ressourcenverlust, defensiver Angriff und Score-Abstände je Phase protokollieren. Gegen die v5.7-Baseline absichern, bevor neue Gewichtssuche stattfindet.
2. **Echte Inventarsnapshots:** Karriere mit legalen Siegen/Belohnungsabwicklungen/Boostern durchspielen; Deckverteilungen nach Level und Siegeshäufigkeit testen.
3. **ACE-Benchmarks separat:** Mirrordecks ohne spätere Signatur-ACEs dürfen kein Argument für verringerte ACE-Nutzung des regulären Turniergegners sein. Daher echte, nicht identische Boss-Decks als zusätzliche Teststrecke beibehalten.
4. **Zweckspezifischer Rollout:** I, II, V, VIII und X zunächst nur isoliert zur manuellen QA; keine automatische Aktivierung wegen dieser Tests.
