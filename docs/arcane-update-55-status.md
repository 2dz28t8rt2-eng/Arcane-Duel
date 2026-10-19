# Arcane Duel – Update 5.5 · KI, Karriere, Lv1-Forschung, Fusionsnutzen und Artwork-Audit

Stand: 2026-10-19 · **nur development**, main unverändert.

## Implementiert

### Strategische KI: Gegner I bis X
| Gegner | Grundstrategie | Stufe | Zulässige Basiskartenlevel |
|---|---|---|---|
| I | Angriff / Predator | leicht | 1–4 |
| II | Verteidigung (Wächter + Seelenzehrer) | leicht | 1–5 |
| III | Fusion / Resonanz | leicht | 2–6 |
| IV | Angriff | mittel | 3–7 |
| V | Verteidigung | mittel | 4–8 |
| VI | Fusion | mittel | 4–8 |
| VII | Angriff | schwer | 5–9 |
| VIII | Verteidigung | schwer | 6–9 |
| IX | Fusion | schwer | 7–10 |
| X | adaptiver Mix | Finale | 8–10 |

Die Kartenlevel-Tabelle beschreibt die zulässigen Pools, nicht die erforderliche Mindeststufe jedes tatsächlich gezogenen Monsters. Es gibt sowohl eine Leveluntergrenze als auch eine Obergrenze. **Die ersten drei Gegner dürfen keine Endgame-Karten besitzen.**

- Vollständige, regelkonforme 40er-Decks mit höchstens drei Exemplaren derselben Karte, ohne schwache Lv3-Füllkarten im Finale.
- ACE-Fokus: Normale ACEs werden bis zu drei Mal im Hauptdeck angeboten; Fusions-ACEs sind sicher im Fusionsdeck. Erlaubte ACE-Fusionen werden mit Vorrang gewählt.
- Sichtbar angekündigte ACE-Vorbereitung sortiert **eine tatsächlich vorhandene** Deckkarte an das Ziehende (der Spielmotor zieht mit `pop()`); es wird keine zusätzliche Karte erzeugt.
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

## Fortsetzung: Update 5.6 (19.10.2026)

**In development implementiert:**
- `assets/summon-stage-v56.js/.css`: gegliederte Beschwörungszentrale mit separaten Bereichen für Vorschau, einzeln entfernbare Fusionsmaterialien, Qualitätsinformation und fünf Feldzonen. Responsives Layout für Desktop und schmale Displays; Kernregeln unverändert.
- Fusionswerte bleiben vor Ende des Fusionskinos verborgen und werden **nach** dem Ritual, aber **vor** der Zonewahl als echte Karte samt Werten sichtbar; der Headless-Chrome-Regressionsfall bestätigt diese Reihenfolge.
- Wächter-KI darf Seelenzehrer nur noch auf **direkt benachbarten Zonen** heilen; Aktionsausführung validiert den Abstand erneut. Regressionstest vorhanden.
- Beide CI-Workflows erfolgreich auf Commit `f9bea3cb9a18ff8e9055adce213a4aa3bcfa2369`:
  - https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39216937659
  - https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39216937734

**Bildstand (nicht als integriert markiert):** Drei eigenständige Illustrationen zu *Nebelkaiser*, *Leerenorakel* und *Runengeist der Schwelle* wurden im verbundenen externen Bild-Workspace erzeugt, konnten aber in diesem Update noch nicht als lokale WebP-Dateien in das Repository übertragen und getestet werden. Im Spiel bleiben ihre bisherigen Motive. Auch die restlichen neun Schicksalsmonster und weitere offene Artworkfälle brauchen originale Einzelbilder und Bildabnahme.

**Noch offen:** Realer manueller Karriere- und Quest-Durchlauf, Feinbalance, vollständige grafische Prüfung der neuen Beschwörungszentrale, Bildintegration und verbleibende Artworkfälle. Keine Änderungen an `main`.
