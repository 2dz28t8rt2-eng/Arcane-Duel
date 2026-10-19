# Arcane Duel – Update 5.5 · KI, Karriere, Lv1-Forschung, Fusionsnutzen und Artwork-Audit

Stand: 2026-10-19 · **nur development**, main unverändert.

## Implementiert

### Strategische KI: Gegner I bis X
| Gegner | Grundstrategie | Stufe | Mindestlevel normaler Deckkarten |
|---|---|---|---|
| I | Angriff / Predator | leicht | 1 (effektive Auswahl im Test: mindestens 3) |
| II | Verteidigung (Wächter + Seelenzehrer) | leicht | 1 (effektiv mindestens 4) |
| III | Fusion / Resonanz | leicht | 2 (effektiv mindestens 7) |
| IV | Angriff | mittel | 3 (effektiv mindestens 9) |
| V | Verteidigung | mittel | 4 (effektiv mindestens 6) |
| VI | Fusion | mittel | 4 (effektiv mindestens 7) |
| VII | Angriff | schwer | 5 (effektiv mindestens 9) |
| VIII | Verteidigung | schwer | 6 |
| IX | Fusion | schwer | 7 |
| X | adaptiver Mix | Finale | 8 (effektiv 10) |

- Vollständige, regelkonforme 40er-Decks mit höchstens drei Exemplaren derselben Karte, ohne schwache Lv3-Füllkarten im Finale.
- ACE-Fokus: Normale ACEs werden bis zu drei Mal im Hauptdeck angeboten; Fusions-ACEs sind sicher im Fusionsdeck. Erlaubte ACE-Fusionen werden mit Vorrang gewählt.
- Sichtbar angekündigte ACE-Vorbereitung sortiert **eine tatsächlich vorhandene** Deckkarte nach vorne; es wird keine zusätzliche Karte erzeugt.
- KI-Bewertung von Beschwörungen nach Angriff/Schutz/Fusion mit angepasster Schwierigkeit, Rollen- und Positionspriorisierung sowie begrenzter Vorausplanung.
- Wächter heilen benachbarte Seelenzehrer in DEF, Seelenzehrer können aktiv Gegnerwerte entziehen, Predator-Schwarm erhält +2 % ATK je weiterem normalem Predator (maximal +8 %).
- Rollenstrategie und Schwierigkeitsgrad stehen in den Gegnerbeschreibungen.

### Level-1-Skill »Verbotene Forschung«
- Die Kapitelherausforderungen geben temporär Floating, anschließend Swarm, dann die Level-1-Spezialfusionen frei.
- Nach bestandenem Finale bleiben alle drei Mechaniken dauerhaft durch **einen** passiven Forschungsskill verfügbar.
- Der Skill startet auf Rang 1 und lässt sich auf Rang 5 gegen Münzen verbessern.
- Rangbonus: +5 ATK / +5 DEF pro Rang auf normale Lv1-Karten. Lumiras besondere feste 111/111-Grundwerte bleiben unberührt.
- Spielstände mit dem historischen boolean `lv1Saga.perk` werden auf mindestens Rang 1 migriert. Gespeicherte Rangfortschritte werden beim Laden zusammengeführt.
- Questdialoge und Ergebnisinszenierung benennen den dauerhaften Skill eindeutig.

### Nischen niedriger Fusionen
- Eine echte, erfolgreiche Fusion Stufe 3–5 erhält einmalig einen unmittelbaren Rolleneffekt:
  - Predator: Bis zu drei reguläre Predatoren erhalten einen kleinen ATK-Impuls.
  - Wächter: Team-LP und DEF eines Seelenzehrers werden regeneriert.
  - Seelenzehrer: LP-Entzug gegen das Gegenteam.
  - Allrounder/Resonator: Eine Karte ziehen oder Schild aufbauen.
- Höhere Fusionen erhalten diese Utility-Effekte nicht. Ihre bisherigen Werte- und Qualitätsboni bleiben bestehen.
- Bestehende Beschreibungen werden **nicht überschrieben**; die besondere Utility wird in der großen Kartenansicht separat beschrieben.

## Offene Arbeiten

### Individuelle Monsterbilder (Artwork-Bereinigung)
Die Bestandsprüfung zeigt diese konkreten offenen Fälle:

| Karte / Gruppe | Derzeitige Datei | Nächster Schritt |
|---|---|---|
| Leerenorakel | `assets/custom-art/wave5-02.webp` | Eigenes neues hochwertiges Original-WebP und Zuordnung zum bestehenden ACE (keine neue Karten-ID) |
| Runengeist der Schwelle | `assets/custom-art/generated-4-1/runengeist-der-schwelle.svg` | Eigene neue Rasterillustration, die bestehende Fusionsvorlage bleibt identisch |
| Zehn Schicksalsmonster, inklusive Nebelkaiser | `ArcaneFateVisuals.artFor()` liefert individuelle, aber synthetische `data:image/svg+xml` Motive | Zehn hochwertige einzigartige WebP-Artworks und Darstellung in regulärer Karte **und** 15s-Schicksalszug-Animation |

**Wichtig:** Die konkreten zehn Fate- und zwei Sonderkartenbilder sind **noch nicht neu als Einzelillustrationen erstellt und in GitHub eingebaut**. Ein existierender Dateipfad oder generierte Konzeptgrafiken sind kein Nachweis hochwertiger, individueller Kartenartworks. Bereits vorhandene Karten dürfen nicht einfach fremde Illustrationen erhalten.

### KI-Endbalance und Inhaltsqualität
- Mehrstündige manuelle Karriere-Tests und tatsächliche Siege/Niederlagen über Gegner I–X, nicht nur simulierte Zuglegalität.
- Neue echte Karteneffekte für weitere niedrige/hohe Fusionsvorlagen, Bossstrategien und AI-Timing bei echten Fähigkeiten.
- Echte browserübergreifende Tests der fünf Skillränge sowie aller Level-1-Questkapitel aus historischen Speicherständen.
- Für Bossgegner spätere Spezialfähigkeiten und weitere ACE-Inszenierung prüfen, keine unfaire versteckte Handinformation.

## Freigabe
Erst nach erfolgreichen Node- und Headless-Chromium-Tests auf dem aktuellen **development**-Head; `main` bleibt bis zur ausdrücklichen Freigabe unberührt.
