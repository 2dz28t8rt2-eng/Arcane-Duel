# Arcane Duel – KI-Regelwissen und Trainingsvertrag (v13.0)

**Gültigkeitsbereich:** Aktueller PvE-Karrierestand auf `development` (Spielregeln des jeweils geladenen Builds). Dies ist keine neue Spielmechanik. Maßgeblich bleiben ausführbare Prüfungen des Engines, **nicht** die Zahlen in diesem Text. Insbesondere dürfen Werte, die später per Skript überschrieben werden, nicht aus einem frühen Quelltextstand geraten werden.

## 1. Ablauf, legale Aktionen und Siegesziel

- Zwei Duellanten, eigene und gegnerische Lebenspunkte (LP), Nachziehstapel, Hand, Friedhof und je **fünf Feldplätze**.
- Das **Hauptdeck besteht aus 40 Karten**; das separate Fusionsdeck enthält **2–15** Vorlagen und höchstens drei Kopien derselben Karte. Die Start-/Ziehlogik arbeitet mit einer Hand bis fünf Karten. **Keine zusätzlichen Karten oder Ressourcen erfinden.**
- Aktionen sind phasenabhängig: Beschwörung/Fusion, Platzieren, Positionswechsel, Angriffe, weitere Fähigkeiten und Zugende. Manche Spezialfähigkeiten beanspruchen den Angriff oder die Aktion eines Monsters.
- Pro Zug nur legale Beschwörungen und Karteneffekte; alle Aktionen müssen durch die tatsächlichen Engine-Funktionen `prepareNormal`, `prepareHandFusion`, `placePending`, `canAttack`, `attack` bzw. `applyAiAction` akzeptiert werden.
- **Erster Spielzug:** Angriffe sind durch `canAttack` untersagt. Ein direktes Angriffsziel ist nur legal, wenn auf der Gegenseite kein Monster steht. Siege erfolgen gemäß tatsächlicher Engine; ein bloßer hoher Boardwert zählt nicht als Sieg.
- **Deckausgang, Unentschieden und Spezialduelle:** von `advanceTurn`/`conclude` entscheiden lassen. Nicht nachträglich Gewinner erraten.

## 2. Angriff, DEF, Positionswechsel und Feldkontrolle

- **ATK gegen ATK:** Das schwächere Monster wird entfernt; bei Gleichstand können beide fallen. Die ATK-Differenz kann LP-Schaden verursachen.
- **ATK gegen DEF:** Bei ATK oberhalb der gegnerischen DEF wird der Verteidiger zerstört; ein erfolgloser Angriff kann eigenen LP-Schaden verursachen. Die exakte Spezial-/Gegenschlagsbehandlung ist in später geladenen Regeln hinterlegt und muss durch die Engine berechnet werden.
- **Kein blinder Angriff:** Zuerst prüfen: legitimes Ziel, Siegchance, eigener Verlust, wichtige gegnerische Bedrohung, Reaktion des Gegners im nächsten Zug.
- **Positionswechsel** nur, wenn das Monster noch nicht gehandelt hat und der Wechsel nach den Regeln legal ist. Ein Wechsel kann spätere Angriffe blockieren. DEF ist nicht automatisch passiv: Wächter und Seelenzehrer können DEF-Synergien besitzen.
- **Angriffsverschleiß:** Ein normaler Angriff kann ATK reduzieren (Grundmechanik −30, mit Spielboni modifizierbar). Füge den Verlust in die Bewertung des nächsten Zuges ein.
- Nicht bloß Anzahl der eigenen Karten bewerten: gefährliche Zielmonster, Schlagreichweite, freie Plätze, überlebende Angreifer und direkte LP-Bedrohung sind entscheidend.

## 3. Beschwörungen und Fusionen

- Für reguläre Handfusionen kommen **2–5 Materialien** in Frage. Nur tatsächlich vorhandene Materialien benutzen; legale Fusionsvorlagen müssen noch im Fusionsdeck verfügbar sein.
- Die Spiel-Engine prüft erreichbare Level, Materialkombinationen und die Möglichkeit, eine vorbereitete Fusion legal auf dem Feld zu platzieren. **Nie eine Vorlage allein nach hohem Level auswählen, ohne `fusionOptions` und `canCompleteHandFusion` zu prüfen.**
- Eine **Feldfusion** kann eine bereits liegende Einheit als Material verbrauchen. Das verändert vorhandene Feldstärke, Materialkosten, Angriffsverbrauch und kommende Züge. Dies darf nicht mit einer Beschwörung auf einen freien Platz gleichgesetzt werden.
- Fusionswert ist nicht nur ATK: **ATK/DEF, Qualität, Spezialboni (Pokerkombinationen), vererbte Rollen, Resonanz, Materialkosten, Boardraum, ACE-Synergien, erreichbare Angriffe sowie Verschleiß** bewerten. Qualitätswürfe können unsicher sein; nicht so tun, als wäre ein Zufallsergebnis bekannt.
- **Rollen:** Predator betont Angriffe; Wächter und Seelenzehrer haben Verteidigungs-/Absaugsynergien; Allrounder unterstützen Qualitäts-/Resonanzketten; Resonator kann aus mehrheitslosen Fusionen entstehen. Die realen Stempel-/Rollenregeln stehen in `arcane-role-fusions.js`.
- **Resonanz:** Allrounder und Resonatoren können materielle Qualitätsboni aufbauen. Wo das aktuelle Regelmodul Bedingungen, Laufzeit und Obergrenzen festlegt, diese live lesen statt alte Prozentzahlen aus Trainingsberichten zu übernehmen.
- **LV1-Sonderregeln**, Lumira, Essenzwesen, ACE-Beschwörungen, Fusionen aus Hand, Geisterslots sowie spezielle Quests sind eigene Mechaniken. Nur anwenden, wenn ihre Voraussetzungen wirklich aktiv sind; diese besonderen Regeln nicht für Standardkämpfe verallgemeinern.

## 4. Zerfall, Zeitdruck, Skills und Perks

- Die aktuelle PvE-Logik kennt levelabhängigen **Kreaturenzerfall**. Höhere Level können erheblich schneller an ATK/DEF verlieren; aktuelle Tabelle und Ausnahmen aus `creatureDecayRate` lesen. Der erste eigene Zug einer frisch beschworenen Einheit ist geschützt.
- Überlebenszeit, die nächsten zwei Kampfzüge und Zerfall gehören zur Boardbewertung. Eine teure Fusion, die zu spät angreifen darf, ist oft schlechter als eine schnellere sichere Aktion.
- **Wächter-Heilung und Seelenentzug** sind echte, bedingte Aktionen; sie brauchen geeignete Rollen/Positionen/Ziele und verbrauchen Handlungsrechte. Die genaue **Erfolgsprüfung** muss tatsächliche ATK-/DEF-Änderungen kontrollieren (ein „verarbeiteter“ Aktionsrückgabewert ist nicht immer gleich wirksam).
- Passive **Perks** (u. a. Jagdinstinkt, Schildwall, Widerstand, Fusionseffekte) niemals als manuell aktivierte Skills zählen. Rangwerte und Kosten aus `UPGRADES`/`normalRoleBonus` lesen.
- Beim Gegner darf die KI nur **sichtbare Feldinformationen** und öffentlich bekannte Regeln verwenden, nicht dessen verdeckte Hand, Nachziehreihenfolge oder künftige Zufallswürfe.

## 5. Wirtschaft und Karriere

- Booster, Fusionspacks, Splitter, Münzen, Schmiedeprodukte und Perks kosten reale Ressourcen. Die KI muss sie **ehrlich erwerben**.
- Größere Fusionspacks können mehr *Gesamtkarten*, aber weniger *Fusionskarten pro Siegel* liefern. Kaufentscheidungen daher an der benötigten Deckqualität und am tatsächlichen Packinhalt ausrichten, nicht an einem universellen „10er ist immer am besten“.
- Die Schmelze/Schmiede tauscht vorhandene Karten/Ressourcen und liefert kein kostenloses Material. Vor jeder Zahlung prüfen, ob sie spätere Fusionen und die Deckeignung verbessert.
- Charakter-Bosse I–X besitzen unterschiedliche Rollen, Strategien, ACE-Ziele und Deckschwerpunkte. Lernen darf deren Regelkonformität nicht umgehen. **Gegner X bleibt bei effektiver Grundstärke 1,0 und derzeitigem v12.8-Kartenbestand.**

## 6. Was die KI lernen soll

1. **Legale Aktionsmenge bestimmen:** tatsächliche Engine-Funktionen statt erfundener Auswege.
2. **Vorherige Entscheidung diagnostizieren:** sichtbaren Zustand, verfügbare Aktionen, gewählte Aktion und tatsächlich eingetretene Änderungen erfassen.
3. **Kurzfristige Folgen:** LP, Monsterverluste, Verteidigung, Angriffsverschleiß, mögliche weitere Aktionen.
4. **Langfristige Folgen:** Ressourcenverbrauch, Überlebenswahrscheinlichkeit, Gegenschlagsrisiko, Zerfall, nächste Fusionsmöglichkeiten, ACE und Siegchance.
5. **Gegnerreaktionen nicht vorauswissen:** lediglich plausible Antworten von sichtbaren Monstern berechnen; verdeckte Karten nur probabilistisch mit aus echten Trainingsdaten kalibrierten Schätzungen einbeziehen.
6. **Aus vergangenen Duellen lernen:** versionierte Erfahrungen `Regelversion + Zustand + legale Alternativen + gewählte Aktion + tatsächliche Folgewirkung + Sieg/Niederlage`; zunächst nur Training, niemals freihändig Kartenlevel oder Spielregeln ändern.
7. **Bewertungen validieren:** dieselben Trainingsdaten dürfen nicht gleichzeitig Beweis für den Erfolg sein. Mindestens 16 unabhängige Holdout-Starts, identische Startbedingungen, vergleichbare Boss-/Ökonomie-Regeln, keine stillen Regeländerungen.
8. **Rückfallregel:** solange die neue KI im Holdout (insbesondere IX) schlechter ist oder legale Aktionen überspringt, bleibt die bisherige Tempo-KI maßgeblich.

## 7. Historische Runs – richtig und falsch wiederverwenden

- Bestehende v11.7–v12.9-Artefakte enthalten überwiegend **Karriere- und Kampfaggregate**, keine vollständigen `Zustand → alle legalen Aktionen → tatsächliche Folgewirkung`-Datensätze. Man kann daraus **Strategie-Vorwissen**, wirtschaftliche Hypothesen und bekannte Fehlermuster gewinnen, **aber keine konkreten optimalen Einzelzüge rekonstruieren**.
- Vergleiche ausschließlich Strategien **innerhalb derselben Experimentversion**, nicht Siegquoten aus unterschiedlich starken Gegnern als gleichwertig. Training und Holdout stets getrennt aufbewahren.
- Für echtes erfahrungsbasiertes Lernen müssen künftige Simulationsläufe zusätzliche **Aktions- und Folgezustandsprotokolle** erzeugen. Das Modell wird auf Trainingsdaten fit gemacht und gegen unangetastete neue Seeds evaluiert.
- Nach erfolgreich geprüfter Modellverbesserung können Gewichte **versioniert** in GitHub gespeichert und beim nächsten Trainingslauf geladen werden. **Ein GitHub-Artifact allein ist noch kein dauerhaft lernendes Modell**, wenn der nächste Lauf es nicht tatsächlich lädt.

## Maßgebliche Engine-Quellen

`assets/game.js`, `assets/essence-combat.js`, `assets/fusion-rework-v113.js`, `assets/arcane-role-fusions.js`, `assets/allrounder-resonance-v41.js`, `assets/lv1-saga-v43.js`, `assets/balance-economy-v109.js`, `assets/ai-learning-v56.js`, `assets/ai-lookahead-v58.js`, `assets/ai-branch-trainer-v59.js`, `assets/opponent-x-balance-v128.js`.
