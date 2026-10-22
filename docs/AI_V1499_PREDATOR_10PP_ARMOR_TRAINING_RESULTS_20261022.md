# Arcane Duel v14.9.9 – Verifizierter Prüfbericht (Predator-10pp-Durchschlag und fortgesetztes Q-Lernen)

**22. Oktober 2026 · Branch `development` · GitHub Actions [#39783738386](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39783738386) · Ergebnis: SUCCESS.**

**Direkter Daten-Download:** [Trainingsdaten #12428290812](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39783738386/artifacts/12428290812).

## 1. Live-Regel auf development

Predatoren erhalten in PvE-Duellen **10 Prozentpunkte DEF-Rüstungsdurchschlag** gegen Wächter und Seelenzehrer in Verteidigungsmodus: Die 35-%-Reduktion sinkt auf 25 %. Die anderen Defender und Predatoren in DEF haben keine solche 35-%-Rüstung, sodass **kein zusätzlicher Durchschlagschaden gegen sie** auftritt. Der vorhandene **+2-%-Schwarmbonus je eigenem aktiven Predator** (maximal +10 %, auch Predator-Fusionen) gilt weiterhin und wird in der effektiven Angriffskraft vor DEF-Rüstung berechnet. Das Kampfprotokoll zeigt die aktuelle 25-%-Minderung.

**Beispiel ohne sonstige Boni:** 1000 effektive ATK → 650 DEF-Schaden gegen 35-%-gerüsteten Defender, mit 10pp Durchschlag → 750 DEF-Schaden. DEF-Gegenschlag und Absorption in Seelen-Schichten bleiben erhalten.

Der 10pp-Durchschlag wirkt in dem PvE-Kampfpfad, in dem die 35-%-DEF-Rüstung definiert ist; im lokalen klassischen PvP existiert diese Rüstungsregel nicht. `main` ist nicht verändert.

## 2. Geprüfte Regeln

`tests/predator-armor-live-v1499.test.cjs` und `tests/essence-combat.test.cjs` prüfen:
- echte DEF-Schadenswerte gegen Guardian und Soul sowie Forschungskontrolle (0pp) bei ansonsten identischem Angreifer;
- dieselbe Wirkung auf Spielerplatz 0 und 1;
- kein Rüstungsbonus gegen einen Predator in DEF sowie keine Penetration für Guardian-Angreifer;
- 1–5 Predatoren im Schwarm, kein doppelt angewendeter Schadensmultiplikator, keine unerwartete direkte LP-Schädigung.

Im live-nahen Einzelbeispiel: 800 ATK × 1,02 Schwarm = 816 effektive ATK. Mit 25 % Rüstungsminderung werden **612 DEF** abgezogen, verglichen mit **530 DEF** bei 35 % Restminderung im kontrollierten Research-Spiel ohne Penetration.

## 3. Umfang des Trainingslaufs

- **1.350** legale Gegenfaktik-Trainingsboards, je experimentellem Arm 450;
- **450 unabhängige taktische Testboards**, je Arm 150;
- **1.152 vollständig ausgespielte 40-Karten-Duelle**, 144 je acht Arme (vier KI-/Buff-Kombinationen × normaler Start oder erschwerter DEF-Start), gegen Guardian-, Soul-, Fusion- und Hybriddecks;
- **0, 6 und 10** globale Aufbauzüge ohne Angriff, auf beiden Spielerplätzen und mit beiden Starter-Richtungen.
- Die schwerere DEF-Situation ist ein kontrolliertes Handicap: **zwei vorhandene Karten des gegnerischen Decks werden schon zu Beginn auf dessen DEF-Feld verschoben und aus dem Deck entfernt**, es werden keine Karten erfunden. Der Startzustand ist daher absichtlich härter als die gewöhnliche Karriere.

## 4. Isolierte taktische Lernresultate (nicht als Matchgewinnrate interpretieren!)

| Forschungsvariante | Gemittelter taktischer Nutzen, trainierte Q-Policy auf neuem Holdout | Alte Heuristik | Von 150 Fällen mit bester messbarer Aktion |
|---|---:|---:|---:|
| Ohne Schwarm/Bypass | 0,4273 | 0,2923 | 131 |
| Nur 2-%-Schwarm | **0,6099** | 0,4138 | **134** |
| 2-%-Schwarm + 10pp-Piercing | 0,5812 | 0,4537 | 132 |

Der Q-Lerner lädt Werte aus dem erfolgreichen v14.9.7-Actions-Artefakt als Ausgangsschätzung. Alle drei neuen Forschungsarme nahmen Trainingsupdates an und speicherten den neuen erlernten Merkmalszustand (je Arm 955 Merkmals-Schlüssel). Die Bewertung verwendet **andere Holdout-Seed-Familien**, deren Labels nicht zur Parameterauswahl zurückgeführt werden.

**Interpretation:** Taktischer Nutzen auf diesem Holdout ist für den reinen Schwarm höher; die 10pp-Kombination wurde ausschließlich auf Basis der höheren **Trainings**-Nutzenfunktion gewählt. Das ist kein Beweis, dass der Rüstungsdurchschlag die gelernte lokale Aktionstabelle verbessert.

## 5. Vollkampf – 1.152 Spiele

| Vergleichsarm | Normale Deckstarts: Siege/144 | Zwei DEF-Karten als Starthandicap: Siege/144 | Gelernte Q-Entscheidungen normal / schwer |
|---|---:|---:|---:|
| Kein Schwarm/Bypass, bisherige Heuristik | 136 | 108 | 0 / 0 |
| +2 % Schwarm, bisherige Heuristik | 139 | **114** | 0 / 0 |
| +2 % Schwarm, gelernte Q-Angriffswahl | 138 | **98** | 740 / 942 |
| +2 % Schwarm +10pp Durchschlag, gelernte Q-Angriffswahl | **140** | **111** | 678 / 891 |

Alle vier Varianten sind nach beiden Spielerplätzen ausgewertet; in sämtlichen acht Gruppen **0 Timeouts**. Die normale Matrix ist mit 136–140/144 Siegen noch stark gesättigt. Die zusätzliche schwere DEF-Matrix ermöglicht sinnvolle, aber auf 144 partiell gekoppelte Szenarien begrenzte Vergleiche.

Wichtiger Vorbehalt: 111 vs. 98 Siege im schweren Szenario vergleichen das **kombinierte Paket** aus 10pp-Rüstungsdurchschlag und einer separat an diese Regeln angepassten Q-Tabelle. Die isolierte Auswirkung ausschließlich des Durchschlags mit derselben eingefrorenen Q-Tabelle wurde damit **nicht** nachgewiesen. Auch die reine Schwarm-Heuristik mit **114/144** ist noch stärker als die gelernte Q-Policy mit Durchschlag (111/144).

## 6. Erkenntnisse / nächste Schritte

1. **Produktive Predator-Rolle:** Die gewünschte 10pp-Rüstungsdurchdringung wurde bewusst jetzt als Spielregel eingebaut und ist nicht von der noch experimentellen Q-KI abhängig.
2. **Q-Lerner benötigt eine Sicherung:** Unter schwierigen Verteidigungssituationen (98/144 vs. 114/144 ohne Q beim selben Schwarm) können isolierte einzügige Werte vollständige strategische Duelle verschlechtern. Keine automatische Übernahme dieser Q-Policy als Live-Angriffscontroller.
3. **Konservative Hybrid-Policy:** In den nächsten Forschungen nur dann den gelernten Q-Wert über die vorhandene Heuristik stellen, wenn dessen Mehrzug-Nutzen nach Gegenreaktion ausreichend groß ist. Beschwörung und Fusion als separate legale Alternativen in den Suchbaum einbauen.
4. **Gezielte stärkere Gegner** und echte Turnierreihenfolge mitsamt Arena-LP-Zerfall testen, bevor eine KI-Promotion stattfindet. Weiterhin Auswertung nach beiden Sitzen und nach defensiven Decktypen.

## Ergebnisstatus

- Predator 10pp Live-PvE: **implementiert** ✅
- Bestehender 2-%-Schwarm und Jagdinstinkt: **beibehalten** ✅
- Widerstandsanzeige / Handbuch: **aktualisiert** ✅
- 1.350 Trainingsboards, 450 Holdout-Boards, 1.152 volle Matches: **abgeschlossen** ✅
- Q-Lernstand als Forschungscheckpoint: **gesichert** ✅
- Gelernte Q-Policy für die Live-KI: **nicht freigegeben** ⚠️
- `main`: **unverändert** ✅

Rohdaten/Modellartefakte enthalten `report.json`, `training-q-and-examples.json`, `fullmatch.json` und `fullmatch-cases.json`.
