# Arcane Duel – Kartenbelohnungen, Splitter und Skills · Rework-Entwurf v7.6
**Stand:** 19. Oktober 2026 · **Entwurf / Testplan, KEINE Live-Spielmechanik umgestellt.** Auf `development` dokumentiert.

## Nutzerentscheidung

Statt immer mehr generische Skills oder Perks einzubauen, sollen **bestehende Upgrades spielerisch unterschiedliche Identitäten** bekommen. Mehr echte Kartenauswahl und sinnvoller Splitterverbrauch sind Teil **derselben** Progressionsreform. Die bisherige 12-Skill-Tabelle soll nicht unnötig größer werden; bestehende Skillpunkte, Spielstände und Investitionen dürfen nicht verloren gehen.

## 1. Faktische Ausgangslage im aktuellen Spielcode

**Bestehende 12 reguläre Upgrades** (Quelle: `assets/game.js`, `UPGRADES`): 
`power` Monstertraining, `loot` Beutestudien, `learning` Werkzeugkunde, `tempo` Trainingsroutine, `starter` Grundausbildung, `fusionLore` Fusionskunde, `resilience` Standhaftigkeit, `fusionPrecision` Runenpräzision, `combatDiscipline` Kampfdisziplin, `openingAegis` Vorhut-Schutz, `jagdinstinkt` Jagdinstinkt, `schildwall` Schildwall.

**Bereits vorhanden:** eigene Essenzwesen-/Schulperks (Jäger/Fusion/Verteidigung) mit spezifischen aktiven Schulmechaniken. Diese nicht versehentlich zu normalen Einheits-Upgrades degradieren; ihre Spezialisierung dient als Vorbild für das restliche System.

**Booster 5 Karten (konkrete `rollBooster`-Verteilung):**
- Slots 1–4: je **85 % Startkarte**, **13 % allgemeine Normalmonster**, **2 % Fusion**.
- Slot 5: **60 % Startkarte**, **28 % allgemeine Normalmonster**, **12 % Fusion**.
- Erwartungswert daher **4,0 Startkarten**, **0,8 Karten aus dem normalen Pool**, **0,2 Fusionskarten**. "Allgemeiner Normalpool" ist nicht dasselbe wie eine garantiert neue oder aktuelle hohe Karte. Das erklärt, warum ein bezahltes Paket trotz fünf Karten häufig keine brauchbare neue Deckoption liefert.
- Der **10-Karten-Booster** hat eine andere Slotstaffel; kein fixer aktueller-Level-Garant im bestehenden Kaufpfad.

**Splitter (Quellen):** `sharedShards` vereinigt elf alte Quellen; `craftCard` verlangt **30 Splitter plus reguläre Essenz-Kartenkosten**. `salvageCard` liefert **2 Splitter** je gewöhnlichem und **4** je Fusionsduplikat, darf aber keine reservierten Kopien oder Favoriten verwenden. Ein gewonnener manueller Freikampf liefert als Basis **3 Splitter**, ein verlorener einen. Nachgewiesene weitere Belohnungs-/Questquellen bleiben erhalten. Die Rohbalance des Splitter-Erwerbs sagt nichts über das gefühlte Nutzenverhältnis aus; Crafting benötigt zusätzlich Coins und Source-Freischaltung.

**Aktuelle Beutekarten:** manueller gewonnener Freikampf erzeugt *vor Farm-Softcap* einen Wurf mit 40 % Kartenchance, plus weitere Packfortschritte. Dropgewichte für neue Monster, boosterbedingte Verwässerung und reale Upgrades müssen mit einem eigenen Katalogaudit quantifiziert werden: `tests/ai-real-economy-audit-v76.cjs` und Workflow `ai-economy-audit-v76.yml`.

## 2. Spielerisches Ziel statt statischer Prozentwerte

Jeder relevante Perk soll **einen erkennbaren Auslöser, ein taktisches Ziel, sichtbares Feedback und klare Limits** haben. Keine unbeschränkten Endlosschleifen, unsterblichen DEF-Felder oder permanente Werteskalierung.

| Vorhandener Skill | Bisher primär | Überarbeitung **VORSCHLAG, NICHT AKTIV** |
|---|---|---|
| **Jagdinstinkt** (Predator) | ATK/DEF-Flachbonus nach Rolle/Stufe | **Beutezeichen:** Ein Predator markiert nach erfolgreichem Angriff maximal ein Ziel pro Zug. Der nächste Predator auf dieses Ziel erhält einmalig einen kleinen Angriffsvorteil; nur bis Ende der nächsten eigenen Runde, keine endlosen Stapel. So entsteht ein offensiver Kombostil, nicht nur höherer ATK-Wert. |
| **Schildwall** (Wächter) | Flat DEF-/ATK-Bonus auch für Soul | **Schutzlinie:** Ein Wächter schützt direkt benachbarte Verbündete bei genau einem Treffer pro gegnerischem Zug teilweise. Seelenzehrer sollen ihre eigenständige Seelen-/DEF-Offensive behalten, aber nicht automatisch denselben Schutzlinien-Effekt erhalten. Schutz, Abstand und Cooldown sichtbar. |
| **Fusionskunde** | +1 Qualitätswertewurf bei erster Fusion | **Vorbereitete Fusion:** Bei 3–5 verschiedenartigen Materialien kann ein Spieler einmal pro Duell bewusst einen kleinen Materialqualitätsvorteil auslösen. Vorhandenen zusätzlichen Würfelwurf nicht ohne Budgetprüfung zusätzlich stapeln. |
| **Runenpräzision** | +1,5 Prozentpunkte Qualität pro Stufe ab 3 Materialien | **Gezieltes Nachwürfeln:** bei einer komplexen Fusion darf genau ein schlechter Qualitäts-/Statwurf einmal gezielt neu gewürfelt werden, mit echtem Auswahlmoment und einem klaren Verbrauchslimit. Kein rückwirkendes Verändern gespeicherter Werte. |
| **Standhaftigkeit** | universell −3/−6 Zugzerfall | **Haltungstreue:** reduzierte Abnutzung nur beim konsequenten Halten einer ATK-/DEF-Position über mehrere Runden. Positionswechsel setzt den Rhythmus zurück. Werteboni gegen flache Bonuslast prüfen. |
| **Kampfdisziplin** | lediglich −2 ATK-Angriffsmüdigkeit je Rang | **Kampfkombo:** einmal pro Runde einen Teil der Angriffsmüdigkeit des nächsten eigenen Angreifers reduzieren, nachdem ein anderes Monster erfolgreich Schaden verursacht hat; keine freie zweite Attacke, keine mehrfache Auslösung durch Gegenangriff. |
| **Grundausbildung** | fester +35/+35-Bonus auf alte Startmonster | **Ausbildungsrolle:** Starter können im Midgame verlässliche Fusionsmaterialien bilden; gezielte Material-/Resonanz-Hilfe mit klarer Leistungsobergrenze statt permanente Pflicht-Stats für 20 Altmonster. |
| **Vorhut-Schutz** | +25 Schild beim Start je Stufe | **Frontlinie:** einmaliger frühzeitiger Schutzimpuls auf die erste eigenständig platzierte Karte, mit gut sichtbarem Signal; stärkt Entwicklung im Feld statt nur unsichtbare Start-LP. |
| **Monstertraining** | lineare ATK/DEF-Verbesserung über 10 Ränge | **Universeller Einstieg** darf absichtlich einfach bleiben, aber später nicht bessere Rollenperks verdrängen. Optional auf niedrigere Stufen konzentrieren, nicht heimlich schwächen. |
| **Beutestudien** | +5 % Essenz nach Kampf | **Fundkenntnis:** erkennbare Wahl-/Duplikatschutzmechanik bei bestimmten *rechtmäßig freigeschalteten* Belohnungen, statt nur mehr Essenz. Keine unbegrenzte Kartenproduktion. |
| **Werkzeugkunde** | XP +10 % und Crafting −5 % pro Rang | **Werkstatt-Spezialisierung:** sichtbare Einsparung und zusätzliche Optionen für die Auswahl aus erlaubten Karten; keine Umgehung der Turnierstufen oder Ressourcenkosten. |
| **Trainingsroutine** | automatische Wartezeit 6→3 Sekunden | Das ist eher **Komfort** als Charakter-Skill. Langfristig in eine separate QoL-Kategorie übernehmen, aber bezahlte Ränge beim Umbau vollständig anerkennen / erstatten. |

Die Tabelle ist ein bewusst **noch nicht balancierter Mechanikentwurf**. Insbesondere können die Schutz-/Fusions-Vorschläge bekannte Regeln (Gegenschlag, Ressourcensystem, Position, Pokerwürfe, Seelenraub und Zerfall) berühren. Keine dieser Regeln wird vor gezielten Regressionstests überschrieben.

## 3. Splitter: drei sinnvolle Ausgabemöglichkeiten statt einer Doppelgebühr

**Priorität A – Gezieltes Kartencrafting vereinfachen:** nicht automatisch weiter 30 Splitter **plus** Essenz verlangen, wenn der Spieler die Karte sowieso schon über die Turnierquelle freigeschaltet hat. Designoptionen im A/B-Test: kostenmäßig begrenzter **nur-Splitter-Kauf** einer normalen Karte mit progressionsgerechtem Stufenpreis, oder ein **Essenz-oder-Splitter-Wahlkauf**. Die 40-Karten-/maximal-drei-Kopien-/Profil-Sicherheitsregeln bleiben.

**Priorität B – Splitter als Auswahlkontrolle beim Booster:** z. B. Splitter bezahlen, um *eine* unpassende Startkarte aus einem bereits bezahlten Pack in eine zufällige, zur bereits erreichten Turnierstufe passende Normalmonsterkarte umzuwandeln. Duplikatslimit und Auswahl im echten Shop prüfen; kein kostenloser Endgame-ACE oder Zugriff auf ungeklärte Bossdrops.

**Priorität C – Rollenfokussierte Forschung:** Splitter ausgeben, um eine erhaltene oder auswählbare Karte aus **bereits freigeschalteten** Predator-, Wächter-, Seelenzehrer- oder Allrounder-Kandidaten zu priorisieren. Immer eine Wahl, keine versteckten Seltenheitsboni.

**Wirtschaftsgate:** Preise erst nach Simulation mit echten Karriereseeds festlegen. Splitter dürfen nicht wertlos bleiben, aber unendlich duplizierte Level-10-Monster oder permanente Essenz-/Shard-Arbitrage müssen unmöglich bleiben. Kostengutschriften bei altem Perk-Respec/ Migration exakt abrechnen.

## 4. Kartenbelohnungen verbessern – nicht nur die absolute Kartenmenge

1. Zunächst prüfen, wie viele **nutzbare, neue und stufengerechte** Karten ein Echtgeld-freier gewöhnlicher Spielpfad pro 10 / 25 / 50 gewonnene Duelle liefert (d.h. Deckpotenzial, nicht nur Kopienanzahl).
2. *A/B nur im Test:* Booster-Mix mit garantiertem zur freigeschalteten Stufe passenden Normalmonster-Slot **anstatt** noch mehr Startkarten-Kopien. Nicht jede Karte muss selten sein; strategische Auswahl soll zunehmen.
3. Bei Charakterpacks ein attraktiveres Auswahlgefühl bewahren: drei verschiedene, legal verfügbare Optionen; duplizierte oder sehr niedrige Karten sichtbar kennzeichnen.
4. Neue Level-7–10-Artworks/Karten dürfen nicht ausschließlich theoretisch existieren: tatsächlichen Erwerb via Drop, Booster, Crafting und Level-Aufstieg getrennt beweisen.
5. Zuerst die neue Simulator-Steuerung `v7.6` evaluieren, dann nur dort echten Shop und Perks ändern, wo nachweisliche Engpässe vorliegen.

## 5. Umsetzungsreihenfolge und Abnahme

- **Phase 1 (jetzt)**: die vorhandene Karten-, Booster- und Splitterökonomie instrumentieren; reproduzierbare Erwerbs-/Deckbau-Simulationen erstellen; den v7.5-Lernstand als Ausgangspunkt erhalten.
- **Phase 2**: getrennte Mechanik-Prototypen, zuerst Jagdinstinkt und Schildwall als Identitätstreiber, danach Fusionskunde/Runenpräzision; gegen 7.5-KI und echte Karrieredecks vergleichen. Stärke-Caps, UI, PvE-/PvP-Abgrenzung und Saves testen.
- **Phase 3**: selektiver Splittershop und überarbeitete Booster nur nach Balance-/Kostenprobe; keine Pity-/Loot-Migration ohne Prüfung bestehender Spielstände.
- **Phase 4**: volle unabhängige Karrieren (mindestens 12 Startseeds) und mobile Nutzertests; erst danach stabile KI und Skills auf Produktionszweig zur Freigabe vorlegen.

**Keine Änderung an `main`, bestehenden Kartendaten, Skill-Rängen, Bossgewichtungen oder Live-Belohnungen ohne getestete Implementierung und ausdrückliche Zustimmung.** Die Level-1-Saga, die separat vorgeschlagene Levelreform (Basis 1–5, effektive Levels 7–10), die Allrounder-/Resonator-Synergie und alle Spezialquests bleiben eigenständige Systeme.
