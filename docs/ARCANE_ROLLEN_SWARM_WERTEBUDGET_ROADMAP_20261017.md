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

## Neues Wertebudget 1–10 (nur Vorschlag, NICHT implementiert)
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
