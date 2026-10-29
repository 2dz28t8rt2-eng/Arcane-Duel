# Arcane Duel AI v15.84 – Wer bekommt das erste Angriffsfenster?

## Anlass und bisherige Evidenz

Der unabhängig replizierte v15.83-Durchlauf zeigte im Predator-Mirror einen
deutlichen Richtungswechsel. Unter der vorhandenen globalen Erstrunden-Sperre
gewann der zweite Spieler 69,79 % der entschiedenen Spiele. Mit einer
persönlichen Einsatzverzögerung gewann er nur 20,43 %; die beiden untersuchten
50-%-Notangriffvarianten ergaben 25,00 % und 26,04 %. Bei Fusionen waren die
Abweichungen kleiner. Es ist daher notwendig, die Reihenfolge des **ersten
erlaubten Angriffs** von der Zahl der Aufbauzüge und dem Monsteralter zu
trennen. Die beobachteten Werte sind keine Aussage über ein endgültiges
balanciertes Regelwerk.

## Forschungsfrage / Hypothesen (vor Ausführung festgelegt)

1. **Initiative-Effekt:** Der Vorteil folgt bei sonst gleichen Regeln dem
   Spieler, der als Erster einen wirksamen Angriff beginnen darf.
2. **Aufbau-Effekt:** Die Zeit vor dem Kampf verändert zusätzlich die Stärke
   der Boards, unabhängig davon, wer zuerst angreift.
3. **Rollen-Effekt:** Predator-Mirror und Fusion-Mirror reagieren verschieden;
   daher dürfen aus einem Matchup keine universellen Boni abgeleitet werden.

## Fünf gleichwertig kontrollierte Versuchsarme

| Forschungsarm | Globale Züge ohne reguläre Angriffe | Erste Gelegenheit | Besonderheit |
| --- | --- | --- | --- |
| baseline | 1 | Zug 2: Zweitspieler | Unveränderter bisheriger Angriffsbeginn |
| release3 | 1–2 | Zug 3: Erstspieler | Beide erhalten je einen Aufbauzug |
| release4 | 1–3 | Zug 4: Zweitspieler | Erstspieler hat zwei Aufbauzüge |
| release5 | 1–4 | Zug 5: Erstspieler | Beide erhalten je zwei Aufbauzüge |
| delay | persönliche Beschwörungsrunde | abhängig vom Alter des Monsters | Referenz: ein eigener Zug Einsatzverzögerung |

In den `release`-Armen dürfen gerade beschworene Monster ab dem festgelegten
globalen Zug regulär angreifen. Die einzige zusätzliche Sperre ist die
globale Freigabe. In `delay` bleibt die persönliche Einsatzverzögerung aktiv.
Das ist **keine** kombinierte Untersuchung beider Sperren und auch kein
50-%-Notangriffsversuch.

## Design und Ausschluss von Störfaktoren

- 2 Matchtypen (`mirror`, `cross`) × 2 Stufen (9, 10) × 5 Varianten.
- Je Variante 8 Paare × 12 Szenarien × 2 vertauschte Starter × 2 KI-Marker:
  **384 Datensätze**, insgesamt **7.680 Duell-Datensätze**.
- 3.840 Starter-Swap-Paare; 1.920 KI-Marker-Kontrollen im Mirror;
  6.144 paarweise Vergleiche gegen die passende Baseline.
- Identische Decks, Starthandbedingungen, KI-Politik, Seeds und Baselines
  innerhalb jedes Paares; keine einseitigen Sitzplatz-Boni; keine sechste
  Startkarte; identische 5-Karten-Hand für beide Seiten.
- TRAIN/VALIDATION/HOLDOUT vollständig getrennt. Vorauswahl nur anhand
  TRAIN und VALIDATION; HOLDOUT erst danach berichten.
- Simulations-Limit = unentschieden. Statistik trennt Winrate entschiedener
  Partien von Score inklusive halbem Punkt für Remis.
- ATK, DEF, Schaden, Essenz, Stomp-Boni, Zerfall, Decks und KI-Regeln bleiben
  unverändert. Experiment nur im GitHub-Actions-Testlabor; keine Übernahme in
  Singleplayer oder 2v2.
- Gegenüber v15.83 verwenden wir eine neue, unabhängige RNG-Serie
  (`15980000+` statt `15860000+` im Forschungs-Seed-Anker).

## Vorab festgelegte Auswertung

1. Welche Sitzposition gewinnt bei `release3` versus `release4`? Folgt der
   Vorteil weiterhin dem ersten Angriff, obwohl die Aufbauzeit wechselt?
2. Unterschied `release3` → `release5`: gleiche Angriffsinitiative, aber
   längerer gemeinsamer Aufbau. Unterschied `baseline` → `release4`:
   gleiche Angriffsinitiative, aber längerer Aufbau.
3. `delay` als Mechanismus-Referenz: Hat das Monsteralter einen eigenen
   Effekt über die globale Angriffsreihenfolge hinaus?
4. Gewichte Ergebnisse je Predator-/Fusion-Mirror und direkten Cross-Roles,
   getrennt für Trainings-, Validierungs- und Holdout-Daten.
5. Dokumentiere für die ersten sechs Züge die Anzahl Angriffe sowie
   Boardzahl, ATK und LP vor der jeweiligen Aktion. Prüfe, dass vor jeder
   globalen Freigabe wirklich **kein** Angriff durchgeführt wurde.

Die Rangfolge möglicher Folgetests minimiert den maximalen Abstand der
Predator- und Fusion-Mirror-Second-Winrate von 50 %. Als vorläufige, rein
diagnostische Kriterien gelten höchstens 8 Prozentpunkte Mirror-Abweichung,
10 Prozentpunkte Cross-Rollen-Verschiebung und 5 % Remisrate. Der Report darf
eine weitere Untersuchung vorschlagen, **niemals** selbst Regeln übernehmen.

## Technische Artefakte

- Workflow: `.github/workflows/ai-v1584-initiative-windows.yml`
- Simulation: `tests/ai-v1584-initiative-windows.cjs`
- Kontrolle: `tests/ai-v1584-initiative-aggregate.cjs`
- Nach Abschluss: `artifacts/v1584/analysis/report.json`
