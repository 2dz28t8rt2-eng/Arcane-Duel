# Arcane Duel – v10.9: Economy-, Booster- und Perk-Balance-Update

**Stand 20. Oktober 2026 – Branch `development`, `main` bewusst unverändert.** Implementierung nach dem gemeinsam bestätigten [Balance-Design #35](https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/35). Nicht als ungeprüfter Nerf der Turniergegner VII–X verstehen: Deren Stats und KI bleiben unangetastet.

## 1. Genau gewünschte gemischte Fusionspacks

Bestehender einzelner Essenz-Fusionsbooster in `assets/expansion.js` umgebaut in vier Pakete. Jedes Paket liefert **genau** die gewählte Kartenzahl; die hier aufgeführten Fusions-Slots garantieren **echte** verfügbare Nicht-ACE-Fusionsvorlagen, übrige Slots sind **normale Monster** aus dem bereits legal eröffneten Kartenpool. Pro Kauf werden die Karten sofort in die Sammlung übernommen, wie bislang beim Einzelpack.

| Packgröße | Fusionen (garantiert) | Normale Karten (Rest) | Preis: Booster-Siegel |
|---|---:|---:|---:|
| **1** | **1** | 0 | **4** |
| **3** | **1–2** | 1–2 | **10** |
| **5** | **2–3** | 2–3 | **16** |
| **10** | **3–5** | 5–7 | **28** |

Die konkreten Intervallgrößen entsprechen genau dem Nutzerauftrag. Weitere Besonderheiten: Freischaltung gemäß `highestCleared`, kein ACE, keine Quest-, Meilenstein-, fate-/enemyOnly-/essenceMonster-Karten, keine Hard-gesperrten Quellen. Jedes 1er-/3er-/5er-/10er-Pack erhält eine eigene Kaufaktion und eigene Inventarquittung; vorhandener Starterkarten-Neuwurf kann weiterhin nur wirklich freie Startkopien gegen Splitter tauschen.

## 2. Eigene Booster-Siegel statt Essenz für gekaufte Standard-/Fusionsbooster

Neues persistentes optionales Profilfeld `boosterSeals` (ganze Zahl 0 bis 1.000.000.000). Keine Ausgabe von bestehenden Essenz-/Splittervorräten bei Migration. Zusätzliche Siegel **nur nach tatsächlich erfolgreich gebuchtem, noch nicht belohntem PVE-Sieg**: **+2** bei manuellen Siegen, **+1** bei Automatiksiegen, **+5** bei legalem erstem Turniersieg obendrauf. Die originale `rewardLedger`-Prüfung verhindert Mehrfachvergütung desselben Matches.

Standardbooster-Preise, neu in Siegeln: **1er = 2, 3er = 5, 5er = 8, 10er = 14**. Die bestehenden Packinhalte und extrem seltenen ACE-Side-Rolls werden **nicht** künstlich hochgesetzt. Boosterbeschaffung wird weniger von Essenz-Upgrades abhängig und pro regulärem Sieg gut planbar. Separat verdiente **Charakterpacks mit erstem kostenlosen Auswahlslot** und ihre weiteren Essenz-Einzelauswahlen bleiben als eigene Mechanik zunächst bestehen; nicht verwechseln mit neu gemischten Fusionsboosterpaketen.

Das neue Feld und die drei neuen Perkränge werden in alten Spielständen sicher optional ergänzt; die vorherige v3-Save-/Import-/Deckvalidierung bleibt erhalten. Bestehende `coins`, `shards`, `inventory`, `slots`, `enhancements`, `acePurchased`, `lv1Saga` und alle erworbenen Karten bleiben unverändert. Bereits bezahlte historische Essenz-Booster erhalten **keine rückwirkende Umbuchung**, ihre Karten bleiben vollständig im Inventar.

## 3. Kleine Erhöhung der Kampfsplitter; Kartenverwertung ausschließlich Essenz

Pro echter regelkonform gebuchter PVE-Siegbelohnung: zusätzlich **+1 Splitter** für manuelle Siege, beim geboosteten Auto-Sieg zusätzlich **+1**, und beim **ersten Turniersieg weitere +2 Splitter**. Original-Splitter, normale Auto-Belohnung, Sieg-Erstboni und Rollen-/Craftkosten bleiben erhalten. Die neue zusätzlich gewährte Splitttermenge wird im Loot-Objekt und auf dem Profile-Konto gleichzeitig berichtigt.

`salvageCard()` ist für die v10.9-Spielökonomie sicher auf die vorhandene Kopien-/Favoriten-/Slot-bewahrende Essenzverwertung `sellCard()` umgestellt; der geöffnete Verwertungsdialog zeigt jetzt Essenz statt Splitter. Normale Karten **3 Essenz**, Fusionen **8 Essenz** je wirklich überschüssigem Exemplar; geschützte Lieblingskarten und ausgerüstete Deckkopien bleiben unverkäuflich. Die deutlich kostenintensivere allgemeine Splitterfertigung, Forschung und Rerolls bleibt weiterhin aus legalen Kampfbelohnungen finanzierbar, muss aber über weitere echte Karrieresimulationen auf Rate/Ertrag nachgemessen werden.

## 4. Mehr hochwertige normale Karten bei höherem legalen Turnierfortschritt

Der originale Karten-Dropchance-Mechanismus, Auto-Reward-Faktor und seltene/ACE-Dropkategorie bleiben bestehen. **Wenn tatsächlich eine reguläre normale Karte** bei `drawLoot` gewonnen wird, wird innerhalb der **originalen erlaubten `lootPool(source,difficulty)`** Kartenliste künftig mit steigendem `highestCleared()` die Gewichtung höherer **normaler Monsterlevel** verstärkt. Das schaltet keine späteren Gegner frei, vergrößert kein verbotenes Kartenpool und ändert **nicht** die absolute Chance auf einen Karten-Drop/ACE/seltene Fusionsvorlage.

**Großwildjäger (max 3 Ränge):** Auf diesen normal-Karten-Drop wirkt zusätzlich ein stärkerer Gewichtungsbonus für **noch nie in der gesamten Sammlung registrierte** hochwertige Karten gegenüber bereits jemals entdeckten hochwertigen Karten. Persistentes `discoveredCards` erfasst Entdeckung beim tatsächlichen `addCard`-Vorgang, auch wenn das letzte Exemplar später verkauft wurde. Frühere Sammelbestände werden beim Laden zur bekannten Sammlung hinzugerechnet. Kein gezielter hoher Leveldrop aus einer gesperrten Quelle und keine ACE-Ziehgarantie.

## 5. Zusätzliche unterschiedliche Perks

- **Großwildjäger** (max. 3): Nur bei tatsächlich gewonnenen **normalen** Karten; bei hochwertigen noch nicht entdeckten Arten pro Rang stärkere Gewichtung (Faktor **+40 % pro Rang**) als bei bereits bekannten (**+11 % pro Rang**). Die relative Wahrscheinlichkeit ist von der Zusammensetzung des legalen Pools abhängig.
- **Kolossenkraft** (max. 3): Nur **normale** Spieler-Monster LV6–10, **+8 ATK und +8 DEF je Rang und Stufe über LV5**, also bei LV10 +40 je Wert und Rang. Keine Verdopplung durch Fusion, keine ACE-Verstärkung; bestehenden Predator-/Guardian-/Allrounder-Rollen bleiben erhalten.
- **Schwarminstinkt** (max. 3): Nur wirklich **ausgeführte Spielerfusionen** mit **ausschließlich LV1–5-Materialien**. +1,5 % ATK/DEF je Rang bei 2 Materialien, +2 % je Rang bei 3–4 und +2,5 % je Rang bei 5 Materialien; maximal +7,5 %, nach den tatsächlichen Originalwürfeln auf die entstandenen Werte angewandt. Keine kostenlosen Karten, keine weiteren Fusionskopien oder heimlichen Zusatzwürfel. Die vorhandene LV1-Quest-`Verbotene Forschung` und ihre tatsächliche Freischaltung bleiben unabhängig.
- **Künftiger eigener Entwicklungsschritt:** Spezielle aktive/passive **Fusionsfähigkeiten der Zielstufen 5–7** mit eigenem strategischem Spielstil sind bewusst noch **nicht** ohne individuelle KI-/Balanceprüfung aktiv. Hochstufige normale Monster sollen durch rohe Stats, niedrigstufige Materialien durch Synergie punkten.

## Implementation

- `assets/balance-economy-v109.js`: Nach allen bisherigen Game-Skripten geladenes, isoliertes Laufzeitmodul für alte Profile und sichere neue Wallet, aktuelle Gewinne, dynamische echte Normal-Drops, gerollte Fusion-Qualitätsanpassung und drei Ausbauskills.
- `assets/expansion.js`: Originaler Single-Fusionsbooster durch vier **gemischte** Siegelpakete ersetzt; alle Käufe prüfen Währung, gemeinsame aktive Rewards und legalen Kartenpool; im Shop genaue Fusion-Anzahlen.
- `assets/game.js`: Standardbooster-Shop zeigt nun die tatsächlich vom neuen Guthaben abhängigen **Siegel** statt fälschlich Essence und ist nur bei ausreichendem Guthaben klickbar.
- `index.html`: Neues Wirtschaftsmodul per `defer` **nach allen anderen** Spielmodulen eingebunden; kein Zugriff auf undefinierte alte Funktionen während des Ladens.
- `tests/balance-economy-v109.test.cjs`: Original-runtime-basierte Tests für alte Spielstände, Fusionspack-Intervalle, echte Inventar-/Wallet-Deltas, Nicht-Duplikat-Siegvergütung, Hochstufen-Perk und nur erlaubte echte Drops.
- Alte bestehende Testannahmen an neue Währung angepasst, ohne Deckbesitz-/Sparregeln zu lockern: `tests/shard-rework-v77.test.cjs`, `tests/update-balance.test.cjs`, `tests/browser-ui.html`.

## Validierung / Einschränkungen

[**Balance-Economy-v10.9-CI – SUCCESS**](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405412030): alle neuen Pack-/Währungs-/Save-/Perk-/Drop-Tests grün, originale Shard-, Booster-, Deck- und Fusionsregressionen grün. [**Code/Strategie – SUCCESS**](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405411827). Der umfassende Chrome-UI-Smoke hatte auf einem früheren Commit lediglich eine **veraltete Testannahme** (nur Essenz, keine Siegel) und wurde entsprechend repariert; der jüngste [Browser-Run #39405810655](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39405810655) ist zum Zeitpunkt der ersten Berichtserstellung noch nicht vollständig geprüft.

Wichtig: Das ist ein tatsächlich **implementiertes Gameplay-Update auf development**, **noch keine umfassende neue VI→X-Karriere-A/B-Auswertung**. Die genauen Siegelpreise, Dropgewichte und Perk-Zahlen sind die **erste Testbalance** und können sich im unabhängigen Holdout verändern. Die starke Bossprogression soll erhalten bleiben; keine künstliche Erleichterung oder garantierte VII/X-Siege. **`main` und produktive NPC-KI bleiben unverändert.**
