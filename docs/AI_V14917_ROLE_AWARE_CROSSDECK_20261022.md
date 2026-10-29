# Arcane Duel – Forschungs-KI v14.9.17: Rollenspezifischer Trainingslauf

## Motiv und Forschungsfragen
v14.9.16 (erfolgreicher GitHub-Lauf 39858417967) demonstrierte 3.200
symmetrisch kontrollierte Vergleiche. Der neue allgemeine Risikowert
veränderte zwar einige Aktionen, aber keines der 640 Endergebnisse.
Insbesondere bei Fusion/Guardian entstanden teils Rückschritte.
Die hier neu trainierte und getestete Bewertungsvariante misst, ob
konkrete **rollenspezifische** Werte die Entscheidungen verbessern.

## Studienarme
1. baseline-heuristic
2. gated-Q
3. Q-one-counter-planner
4. Q-two-counter-planner (unveränderte Planungsreferenz)
5. Q-two-counter-role-aware (neuer Forschungsarm)

Jeder Arm absolviert 640 vollständige Duelle in exakt denselben
Szenarien (zusammen 3.200). Es gelten unveränderte Decklisten,
Fusionsvorräte, LP, Startspieler, Startpositionen und Spielregeln.
Der gegnerische 40-Karten-Archetyp bleibt gleich je gepaartem
Fall. 32 von 40 Shards nutzen unterschiedliche Decks; acht
verwenden Mirrormatches; alle 30 gerichteten Archetypenpaarungen
sowie zwei schwierige Zusatzbegegnungen bleiben enthalten.

## Gegner-Strategie und Holdout
Die drei Trainingsszenarien pro Shard enthalten je eine
offensive, wirtschaftliche/defensive und ausgewogene Gegnerpolitik.
Ein eigener, unbenutzter Seed mit der ausgewogenen Politik
dient als Holdout. Die Holdout-Spiele trainieren weder die Q-Tabelle
noch wählen sie eine neue Planungsvariante aus.

## Neuer Bewertungsarm
- Bei Guardian erhalten DEF-Stellung und DEF-Stärke mehr Wert.
- Bei Soul werden Seelenressourcen und DEF längerfristig berücksichtigt.
- Predator erhält eine sichtbare eigene ATK- und Schwarmkomponente.
- Bestehende Fusionen erhalten einen Stufen-/Qualitätsbeitrag,
  neue Fusionen im Fusionsdeck werden in der Beschwörungsauswahl
  stärker nach ATK/DEF bewertet.
- Resonator/Allrounder erhalten einen Feldpräsenzbeitrag.
- Öffentlich beobachtete Bedrohungen werden als Risiko abgezogen.
- Keine gegnerischen Hände oder geheimen Fusionskarten werden
  für die Bewertung gelesen.

Die Werte sind ein neuer zu prüfender Forschungsansatz, keine
automatische Freigabe. Der bisherige Zwei-Konter-Arm bleibt unverändert
und ist die maßgebliche Vergleichsgruppe.

## Direkt sichtbare Verhaltensunterschiede
In 480 Trainingsduellen werden echte Aktionsfolgen des bisherigen
Zwei-Konter-Planers und der neuen rollenspezifischen Variante
paarweise verglichen. Die öffentliche Aktionsprotokollierung
enthält u.a. Karten-ID, Angreifer-Slot, Ziel-Slot, Zielkarte
und Fusionswahl, soweit die Information für den handelnden
Spieler legal sichtbar ist. Abweichungen werden nach Rolle
und Gegenstrategietyp gezählt; ein kleiner Ausschnitt der
Abweichungen wird zur Diagnose archiviert. Für Holdout-Partien
werden **keine** Aktions-Trajektorien gespeichert.

## Q-Lernhistorie und Qualitätsgates
Wiederherstellung aus dem letzten erfolgreichen Checkpoint
und ausschließlich bisherigen gültigen TRAIN-Beispielen aus
den erfolgreichen Läufen 39803691439, 39843438099,
39847734409, 39851537706, 39855753529, 39858417967.
Zwei voneinander unabhängige trainingsinterne
Validierungssets müssen neue Q-Werte jeweils bestätigen.
Unabhängige Q-Holdouts dienen nur der Ergebnisdiagnose.

## Grenzen
Die volle Q-Tabelle bleibt auf überwiegend Predator Attack-vs-Pass
beschränkt. Die neue Rollenbewertung ist forschungsbasierte
Heuristik mit Engine-Rollouts, **kein** eigenständig trainiertes
neuronales Modell. Gesamtspiel-Siege gegen eine feste Referenz
und alternative Gegnerpolitiken sind kein automatischer
Beweis für eine produktive Qualitätssteigerung. Kein
Merge in main und keine Aktivierung der Spiel-KI.
