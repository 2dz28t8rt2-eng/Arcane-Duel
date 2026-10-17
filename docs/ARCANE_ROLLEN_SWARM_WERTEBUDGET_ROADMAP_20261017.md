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
