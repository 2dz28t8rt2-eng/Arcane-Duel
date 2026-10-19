# Arcane Duel: vereinbarte Rollen- und Balance-Roadmap

Stand 17. Oktober 2026. Implementierung und Vorschläge getrennt.

## Implementiert auf development
- Allrounder-Fusionsresonanz (PvE): 4 Prozentpunkte pro Allrounder aus der Hand. Auf dem Feld nach jedem abgeschlossenen eigenen Zug +4 Punkte, maximal 3 Ladungen (+16 % pro Karte), maximal +24 % gesamte Resonanz je Fusion.
- Zusätzliche Allrounder dürfen bestehende Materialketten weder im Qualitätsfaktor, im Komborollenbonus, in Zusatzwürfen noch in der maximal zugänglichen Fusionsstufe verschlechtern. Pokerkombos und Straßen bleiben möglich. UI zeigt Resonanz; Instanzladung und echte Fusionswerte werden gespeichert.
- Generische neutrale Level-3-Startfusion „Runengeist der Schwelle“ mit eigener Grafik und neuer stabiler ID. Je zwei Kopien für neue Profile und einmalig für ältere Profile, ohne Fortschrittsreset.

## Zu diskutieren: Level-1-Schwarm (NICHT implementiert)
- Level-1-Monster bleiben zu Beginn ganz normal; ein gesonderter Level-1-Perk weckt später das besondere Potenzial durch kleine Geschichte und Lernkämpfe.
- Floating/Swarming, zusätzliche beschränkte Geisterslots, eigene exklusive Level-1-Fusionen und 10–20 neue Monster oder Fusionen.
- Alle derzeitigen Rollen müssen für Level 1 ausreichend durch sinnvolle Karten für ein spielbares 40-Karten-Deck abgedeckt werden.
- Ein perfekter Schwarm soll gegen einen perfekten Level-10-Wächter/Seelenzehrer eine echte Siegchance besitzen, aber keine Endlosschleifen oder vollständige Defensivignoranz.
- Offene Entscheidungen: Wer darf floating nutzen; wie viele Geisterslots; Rückkehr, Kettenlimits und Kontereffekte.

## Zu diskutieren: rollenfreie allgemeine Fusionsvorlagen (NICHT implementiert)
- Der Spieler möchte feste Rollen bei generischen Fusionsvorlagen entfernen, sodass nur die eingesetzten Materialien die resultierende Rollenprägung bestimmen. Spätere thematische Sonderfusionen können ausgenommen werden.
- Bereits heute überschreibt klare Materialmehrheit die Vorlage. Offene Entscheidung: Bei gemischten Rollen ohne Mehrheit neutrale Allrounder-Rolle oder anderer Ausgleich? Wie zählen Allrounder bei der Rollenmehrheit?

## Gewünschte Archetypen
- Predator: direkter Angriff, wenige individuell wertvolle Fusionen.
- Verteidiger: Wächter, Absorption, Gegenangriff; ebenfalls weniger, aber individuelle Fusionen.
- Fusionsdeck: mehr bewusst getimte Fusionen für wenige starke Monster.
- Allrounder: flexible Fusionsverbindungsstücke, Resonanz durch Einsatz von Hand und Feld; beachten, dass reines DEF-Camping nicht dominant wird.
- Level 1: schnelle Schwärme, Floating und Kombinationen.

## Neues Wertebudget 1–10 (auf development implementiert; Fine-Tuning und Bossprüfung offen)
Gewöhnliche Monster: gemeinsames ATK+DEF-Budget; alte Werkstattformel 150 + 30×Level². Vorschlag:
Level | bisher | vorgeschlagen
1 | 180 | 180
2 | 270 | 270
3 | 420 | 420
4 | 630 | 630
5 | 900 | 810
6 | 1230 | 1030
7 | 1620 | 1270
8 | 2070 | 1530
9 | 2580 | 1830
10 | 3150 | 2150

Ab Level 5 gerundet nach 630 + 170×(L−4) + 14×(L−4)². Nur Vorschlag für allgemeine Grundwerte, nicht bereits existierende spezifische Karten, Bossboni oder Fusionskarten. Rollen verteilen und modifizieren Werte. Vor Anpassung alle Level 1–10, Aufstiege, NPCs und Fusionen simulieren.

## Später: Gegner-KI und Arkanschmiede (NICHT implementiert)
- Turnier-KI erst nach Abschluss von Rollen und Wertebudget. Gegner I–III generisch, später spezialisierte zur Rolle passende Decks mit zunehmend gutem Einsatz.
- Eiman Huel: lernende KI mit Profil „Kontrolle und Verteidigung“.
- Mögliches Zerlegen überflüssiger Karten für Arkanschmiede-Ressourcen und zufällige Karten aus klaren Levelbereichen; genaue Preise und Sicherheitsregeln fehlen.
- Schwierigkeit IV, V und IX nicht ohne erneute Abstimmung ändern.
- main nicht ohne Freigabe aktualisieren.


## Status Update 18. Oktober 2026: neue 4.2-Balance auf development implementiert

### Rollenfreies Fusionssystem
- Allgemeine PvE-Fusionsvorlagen erhalten keine verbindliche Rollenprägung mehr; ihre gespeicherten alten Rollen-Metadaten sind nur noch Altdaten, der Fusionsablauf berechnet die Rolle ausschließlich anhand der eingesetzten Materialien.
- Eindeutiger Spezialistenüberhang vererbt Predator beziehungsweise Verteidiger (Wächter und Seelenzehrer zählen für die Mehrheit zusammen); reine Seelenzehrer-Kombination ergibt Seelenzehrer.
- Bei Gleichstand der Spezialisten oder ausschließlich neutralen Materialien wird das **Fusionsmonster** zum **Resonator**. Normale Allrounder werden nie als Resonator umbenannt.
- Allrounder/Resonatoren sind bei der **Mehrheit neutral** und nehmen spezialisierten Materialien niemals ihre bestehende Rollenmehrheit weg.
- Der Resonator erhält **keine ATK-/DEF-Gewichtungsverschiebung**, sondern die neutrale Verteilung ×1/×1 vor echten Würfen; seine reale Fusionsinstanz führt den Role-Override auch im gesicherten Duell.
- Als später verbrauchtes Feldmaterial verleiht ein Resonator +10 % Qualitätsbonus, nach einer überstandenen eigenen Runde +20 %, nach zwei +30 %. Neutrale normale Allrounder gelten weiterhin +4/+8/+12/+16 %. Maximal gemeinsam +24 % für normale Allrounder plus +60 % für Resonatoren (Maximalqualität gesamt begrenzt), kein Resonanzbonus für klassisches PvP.
- Resonanzmaterialien wirken weiterhin nur positiv auf Kombofaktor, Würfelbonus und erreichbares Ziellevel. Kein Erwerb von Rollen- oder Seelenfähigkeiten durch Resonator.

### Wertebudget auf development aktiviert
Neues gemeinsames ATK+DEF-Budget gewöhnlicher PvE-Kreaturen:
180, 270, 420, 630, 810, 1030, 1270, 1530, 1830, 2150 (Level 1–10).
Rolle verteilt Grundwerte. Seltene und ACE-Karten erhalten weiterhin bewusst kleinere Seltenheitsaufschläge. Die alten klassischen PvP-Startkartentemplates (ID < 20), Essenz-Schulmonster und reine Fusionsvorlagen werden nicht direkt überschrieben, um deren eigene Mechaniken nicht zu beschädigen. Die PvE-Fusionsreferenz übernimmt automatisch die neuen Normalmonster-Mittelwerte. Alte Kartennummern und Speicherstände bleiben stabil.

### Noch NICHT implementiert
1. Level-1-Schwarmperk mit Geschichte/Schulungsduellen, Floating, Geisterslots, exklusiven Level-1-Fusionen, 10–20 Spezialkarten, Kontrolle der 40er-Deck-Verfügbarkeit und gezielten Anti-Endgame-Optionen.
2. Langzeit-Rollenbalance und High-Level-Boss-/Drop-Ökonomie, einschließlich der Bewertung der neuen Budgetkurve in echten Decks.
3. Individuelle Offline-trainierte KI-Profile und Rollen-Decks für Turniergegner IV–X (I–III generisch). Eiman Huel: **Kontrolle und Verteidigung**.
4. Ausbau der Werkstatt zum sicheren Karten-Zerlegen und Material-Crafting inklusive Chancen und Ressourcenpreisen.
5. Weitere aktive Rollenfähigkeiten und gezielte Status-/Cooldown-Anzeigen je neuer Mechanik.

Diese Punkte nacheinander abstimmen und implementieren; main bleibt bis zur Freigabe unverändert.


---

## Nachtrag 19. Oktober 2026 – KI-Lernstand v7.5 und nächste Prioritäten (aktiv als Plan, NICHT als KI-Buff)

**Dauerhafte Detail-Roadmap:** [AI_TRAINING_ROADMAP_20261019.md](AI_TRAINING_ROADMAP_20261019.md)  
**Letzte vollständig dokumentierte Trainingsreihe:** [v7.4–v7.5 echte Karriere & Balance](ai-v74-v75-real-career-balance-results.md).

**Bestätigt:**
- 16 neue echte Normalmonster-Level-7–10-Karten (IDs **716–731**) sind im `development`-Spielkatalog registriert; in getrennten künstlich zusammengestellten Testdecks nutzbar.
- Der eingefrorene v7.3-Scorer `fusion-precision` verbesserte VIII auf konstruierten Testdecks unabhängig reproduziert um **101 Siege/448**, blieb aber **experimentell**.
- Die 7.4-Karriere-Engine lieferte zwei legitim freigeschaltete VIII-Spielstände aus nur **einer** ursprünglichen Karriere. Beide enthielten trotz VII-Sieg **keine neuen Endgame-Monster** und im Hauptdeck **maximal normale Level-4-Karten**.
- Auf diesen echten VIII-Inventaren gewann **bereits die bisherige VIII-KI 160/160**, die stärkere Test-KI ebenfalls 160/160. Ein KI-Buff wäre vor diesem Hintergrund ohne robuste Progressionsevidenz nicht gerechtfertigt.
- X gewann den neu aufgesetzten echten Boss-Gegentest gegen stärkere konstruierte Endgame-Decks **448/448 sowohl vorher als auch nachher**. Das ist **Sättigung des verwendeten Testspielermodells** und kein Nachweis, dass menschliche Spieler die Karriere nicht schaffen. Ein separater historischer Test hatte vier von sechs Karrieren komplett erfolgreich simuliert.

**Neue verbindliche Reihenfolge für KI-/Progressionsentwicklung:**
1. **P0 – Erwerbs-/Inventar-/Decklogik untersuchen:** legal verfügbares ≠ tatsächlich durch Loot/Shop/Crafting erworbenes ≠ ausgerüstetes Material. Insbesondere neue Monster 716–731 und Autobuilder `equipBest` vergleichen; zunächst keine willkürlichen Drop- oder Kampfwertaenderungen.
2. **P1 – Karriere-Testspieler aufwerten:** ökonomisch sinnvolle Ressourceninvestition, reale 40-Karten- und Fusionsdecks, Predator/Wächter/Seelenzehrer/Allrounder sowie echte Fusionsentscheidungen; ausschließlich gespeicherte, rechtmäßig verdiente Karten.
3. **P2 – unabhängige Karrieren messen:** mindestens 12 voneinander verschiedene Startseeds als erste Stichprobe, alle IV–X-Spikes und reale Stufenfreischaltungen; Training und Holdout getrennt. Mehrfachduelle desselben Inventars gelten nicht als unabhängige Karrieren.
4. **P3 – umfangreiche Levelreform NUR nach Designentscheidung:** das bereits vorliegende [Progressionskonzept](progression-rework-design-20261019.md) (Basiskarten Lv1–5, effektive Levels bis 10) bleibt **nicht aktiviert**; Frage globaler Aufstieg versus individuelle Familien-XP und vollständige Spielstandmigration vor Implementierung klären.
5. **P4 – Gegner VIII/X feintrainieren:** Erst wenn echte Inventare faire, aussagekräftige Vergleiche ermöglichen; starke VIII-KI darf nicht die zuvor mögliche Karriereprogression zerstören.

**Unverändert:** Die aktuell spielbare Gegner-KI lernt nicht autonom aus Live-Duellen; aktive Gewichte sind unverändert. Experimentelle Scorer werden nicht automatisch übernommen. `main` bleibt ohne Nutzerfreigabe unangetastet.

**Konkreter nächster Schritt:** `v7.6 – Real-inventory progression & deckbuilding audit`; messbarer Erwerb/Ausrüstung und drei legale Spieler-Deckbuilder gegen bestehende Strategien vergleichen, bevor Drop-/Level-/KI-Balance angepasst wird. 
