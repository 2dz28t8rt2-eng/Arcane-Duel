# Arcane Duel — Progressionsreform (Konzept zur Entscheidung, NICHT aktiv)

## Ziel des Spielers
Aktuell stehen viele Stufenvarianten einer Kreatur als eigene Karten im Sammelpool. Neu sollen **nur die Stufen 1–5 als echte Basiskartenvarianten** eingeführt werden. Im Turnier steigen die Stufen 2–5 um jeweils +5, sodass die Endverteilung **1 / 7 / 8 / 9 / 10** ist. Lv1 bleibt für die Floating-/Schwarm-/Questmechanik dauerhaft Lv1. Der bestehende Fortschritt und das Karteneigentum dürfen bei der Migration nicht verloren gehen.

## Vorschlag für den Aufstieg
Alle nicht-Lv1-Karten profitieren vom individuellen Fortschrittsrang des Accounts; dies ist eine **Option**, nicht beschlossen. Entweder global pro Turnier-Meilenstein oder pro Monsterfamilie/Exemplar durch Nutzung; die Entscheidung muss vor Implementierung erfolgen.

Vorschlag automatischer Meilensteine:

| Gewonnene Turniergegner | Bonus auf Basiskarten Lv2–5 | Wirksame Stufen |
|---|---:|---|
| 0–1 | 0 | 1, 2, 3, 4, 5 |
| 2–3 | +1 | 1, 3, 4, 5, 6 |
| 4–5 | +2 | 1, 4, 5, 6, 7 |
| 6–7 | +3 | 1, 5, 6, 7, 8 |
| 8–9 | +4 | 1, 6, 7, 8, 9 |
| 10 | +5 | 1, 7, 8, 9, 10 |

## Kritische Architekturfragen
1. **Basisidentität statt Stufenkarte:** Attribute wie `baseLevel`, `familyId`, `evolutionRank` müssen getrennt von der bisherigen Karten-ID modelliert werden. Lv1 bekommt niemals einen Rank-Bonus.
2. **Bestandsschutz:** Bereits besessene höherstufige Varianten (und deren Verstärkungen, Favoriten, Fusionsdecks und Deck-Slots) müssen nachvollziehbar in Kopien/Familien-Fortschritt oder Entschädigungen überführt werden. Kein Löschen ohne validierte Migration.
3. **ATK/DEF-Budgets:** Beim Aufstieg nicht blind alte Werte addieren; pro wirksamer Stufe mithilfe des balancierten Rollenbudgets neu berechnen, besondere ACE-/Bossregeln getrennt behandeln. Höhere Stufe verursacht aktuell zusätzlichen Zerfall; neu austarieren.
4. **Fusionen:** `dataOf().level`, Materialstufen, Mustererkennung, Fusionbudget und Qualität müssen überall dieselbe wirksame Level-Berechnung nutzen. Besonders Full House, Drilling, Kleine/Große Straße und Lv1-Spezialfusionen testen.
5. **Gegnerbalance:** NPCs sollten einen eigenen progressionLevel erhalten, statt unbemerkt dieselben aufgestiegenen Stufen wie das Profil zu erben.
6. **Belohnungspool/Deckbau:** Dropraten und Crafting vereinfachen; keine Tausend Varianten derselben Kreatur. Gleichartige Karten nach Identität stapeln, aber bereits gesammelte Karten korrekt umrechnen.
7. **Erhalt der übrigen Spielmodi:** PvP, 2v2-Prototyp, Schicksalskarten und Boss-/ACE-Mechanik zunächst getrennt von der Umbauphase halten.
8. **Tests und Migration:** Vorher/nachher-Persistenztests, gesamte Turnierfolge I–X, Spielstandwiederaufnahme, manuelle/automatische Kämpfe, alle Fusionsmechaniken, 40er-Deck-Legalität sowie Turnier-/Lv1-Progression.

## Beschluss vor Implementierung
Soll ein neu erworbenes Lv2-Monster bei abgeschlossenem Turnier X **sofort Lv7** sein (globaler Aufstieg), oder soll **jedes Exemplar/jede Familie individuelle XP** sammeln und die höheren Stufen selbst freischalten? Die Regel verändert fast alle Dateistrukturen; vor einer Migration braucht es eine eindeutige Entscheidung.

## Fehlerliste aus User-Demo 19.10.2026
Priorität 0: Lv1 Quest 2→3 Fortschritt, vergessene Erstbegegnung/Prolog; Feldfusion Hand+Feld, vorbereitete Fusion+Feld; wahrheitsgemäße Angriffsanimation und abbrechbare Angriffsauswahl.
Priorität 1: Alle generischen ACE- und Schicksalsillustrationen (insbesondere Leerenorakel), angemessene Schicksals-Effekte; Rolleninformation in der Großansicht; »Verteidiger« nur als DEF-Kategorie, Wächter und Seelenzehrer als eigentliche Rollen.
Priorität 2: Obige Levelreform nach Designentscheidung, danach Spielstandmigration und komplettes Balancing.
