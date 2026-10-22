# Arcane Duel – Strategisches KI-Lernen ab v14.8.7

**Stand:** 22. Oktober 2026 · **Arbeitsbranch:** development · **Status:** erster Gegenreaktions-Pilot implementiert, Auswertung nur nach erfolgreichem CI-Artefakt.

## Ausgangsbasis: verifizierter Fairnesslauf v14.8.6

Der abgeschlossene A/B/C-Lauf mit 3.024 Duellen ist in
[AI_V1486_THREE_ARM_FUSION_FAIRNESS_RESULTS_20261022.md](AI_V1486_THREE_ARM_FUSION_FAIRNESS_RESULTS_20261022.md)
dokumentiert. Im streng gematchten alten KI-Selbstvergleich fiel die Sitz-0-Siegquote unter symmetrischen Testfusionen auf **171/336 = 50,89 %**; zweiter Zug **207/336 = 61,61 %**. Die v14.8.2-KI gewann dagegen gegen die v14.7-Referenz in Arm C nur **332/672 = 49,40 %**, bei **109/3.113** unterscheidbaren Taktikentscheidungen. Die alte Test-KI bleibt deshalb Referenz. Ein fairerer Simulator allein macht sie nicht klüger.

Der isolierte Test deaktiviert Perks, Fähigkeiten und Rollen-Synergien, setzt gleiche fünf Startkarten/35 weitere Deckkarten/volle Fusionsvorräte und gleiche Startschilde für beide Plätze und gleicht Fusionsqualität an. **Produktive PvE- und Karriere-Regeln wurden nicht verändert.** Diese Vergleichsumgebung ist unsere Basis zur Trennung von *KI-Stärke* und *Regel-/Sitzplatzvorteil*.

## Etappe 1: v14.8.7 – sichtbare Gegenangriffe und Zweischritt-Bewertung

**Implementiert:** [Trainer](../tests/ai-v1487-two-ply-training.cjs) und
[Workflow](../.github/workflows/ai-v1487-two-ply-pilot.yml).

Der isolierte Kandidat kann in Positions- und Angriffsphasen die folgenden Faktoren bewerten:
1. Die unmittelbare legale Engine-Wirkung einer Aktion.
2. Bis zu eine weitere eigene Angriffs-/Supportaktion, soweit vom aktuellen Board legal.
3. Nach einem regelkonformen Zugwechsel bis zu zwei gegnerische Angriffe mit **bereits sichtbaren** Feldmonstern. Die gegnerische Hand, der Ziehstapel und hypothetische Beschwörungen sind keine Eingaben des Gegenspieler-Bewerters.
4. LP, Monsterverlust, Verteidigungswert, angriffsbedingte Ermüdung, direkten Sieg, sichtbares Konterrisiko und Stufenzerfall über die vorhandene Boardbewertung.
5. Erklärbare Komponenten: alter linearer Score, Brettwert, eigener Folgezug, Verteidigungsentlastung, Gegenangriffsrisiko, terminale Bewertung.

Drei Risiko-Gewichtungen werden nur anhand der **Trainingsdecks** gegeneinander getestet. Die beste Trainingsvariante tritt auf neuen, unangetasteten Holdout-Decks mit vertauschten KI-Plätzen und Starterpositionen gegen die eingefrorene v14.7-Referenz an. Der Pilot archiviert Aktionsbeispiele, differenzierte Ergebnisse und den vollständigen Report. **Keine automatische Promotion.**

**Grenze:** Dies ist kein vollständiges Minimax, kein Monte-Carlo-Tree-Search, keine Erwartungswertberechnung von verdeckten Karten und noch keine echte langfristige Modelloptimierung. Die Fusions-/Beschwörungsbewertung bleibt vorerst beim bisherigen Planer.

## Etappe 2: Mechanik-Curriculum statt nur globaler Siegquote

Die folgenden Lernmodule sollten jeweils mit eigenen deterministischen Aufgaben, legalen Aktionen und Engine-Assertions eingeführt werden:

| Modul | Konkrete Fähigkeit | Fehler-/Erfolgsmaß |
|---|---|---|
| Angriffsreihenfolge | Opferwahl, sichere Eliminierungen, Direktangriff, Mehrfachaktionen | LP-Differenz, wichtige eigene Einheiten erhalten, verpasste sichere Abschlüsse |
| DEF & Seelenzehrer | Defensive Stellung, Gegenschlag, Seelenentzug, Heilung | konkrete DEF-/LP-Änderung, Return-Damage, Einsatz legaler Fähigkeiten |
| Fusion/Poker | Normale und Feldfusionen, Materialwert, Pokerbonus, Resonanz | vollständige Platzierung und Materialverbrauch, Wert *nach* Fusion, verbleibende Reserve |
| Zerfall/Tempo | Früh handeln oder aufbauen, Monster-Halbwertszeit | Nutzen nach ein bis zwei echten eigenen Zugwechseln |
| ACE/Jagd | ACE vorbereiten, geschützten ACE angreifen, gegnerisches ACE beseitigen | tatsächlich beschworene ACEs, Überlebensdauer, bezahlte Opportunitätskosten |
| LV1/Sonderregeln | Geisterslots, Spezialfusion, Storyfähigkeiten | Feature-gated Legalität, Sieg ohne Phantomaktionen |

Bei den Fähigkeiten erfolgt eine gestufte **beidseitige** Reaktivierung: erst passive Rollen, dann aktive Rollenaktionen, dann spezielle Skills, Perks und zuletzt die Charakter-Sondermechaniken. Jede neue Stufe braucht einen eigenen Fairness-/Legalitäts-Gate; keine pauschale Freischaltung mit unbemerkten Platz-Asymmetrien.

## Etappe 3: echte mehrzügige Planung und wiederverwendbares Lernen

**Datensatzvertrag pro Entscheidung:**
- Engine-/Regelversion, Szenario-/Deckfingerprint, Train/Holdout-Split, Seed und Starter.
- Sichtbarer Zustand aus Spielerperspektive (inklusive öffentlicher Gegneraktionen), keine gegnerische verdeckte Hand.
- Vollständige *tatsächlich legale* Aktionsmenge, Vorhersage und Auswahl.
- Gültiger Engine-Folgezustand, wirklicher Material-/LP-/DEF-/ATK-/Zerfallseffekt.
- Eigene nächste Aktion, beobachtete Gegenreaktion, späteres Duellresultat.
- Erklärbare Bewertungskomponenten und tatsächliche Alternative: nicht bloß später behauptete „beste“ Züge.

**Suchverfahren:** zunächst begrenzte Beam Search mit maximaler Tiefe und Knotenbudget, Engine-Replays und Rückfall auf die alte KI bei Zeit-/Legalitätsproblemen. Danach nur bei belegtem Zusatznutzen stochastic rollouts/MCTS über **plausibel gezogene** Gegnerhände und Fusionswürfe. Nicht einfach die versteckte RNG-/Deckreihenfolge des perfekten Simulationsklons zur Entscheidung nutzen.

**Lernverfahren:** Gegenüberstellung alternativer Aktionen in denselben vorigen Zuständen, auswertbare neue Erfahrungspaare, optional kleine Q-/Ranking-Modelle pro Mechanik. Versionierte Modell-/Replay-Dateien nur aus dem Trainingssplit schreiben, niemals die Holdout-Daten zum Tuning wiederverwenden. Vergangene v13.6-Aggregate liefern Hypothesen, aber keine rückwirkend erfundenen optimalen Einzelentscheidungen.

## Etappe 4: Freigabe nur mit externen Kontrollen

Eine neue KI wird *nicht* durch häufigeres Wählen anderer Aktionen automatisch besser. Minimal erforderlich:
- Sitzposition und wirklichen ersten Zug getrennt messen; gematchte beidseitige Spiele.
- Ungesehene Seeds, Decks, Rollenkombinationen, Karrieregegner und Skillstufen testen.
- Legalitätsfehler **0**; fehlgeschlagene Beschwörungs-/Fusionsplatzierung **0**.
- Kandidat vs eingefrorene Referenz und gegen Spezialisten statt nur Selfplay.
- Mindestens ein klarer und statistisch hinreichend abgesicherter Fortschritt in den unabhängigen Holdouts; schwierige Boss-/ACE-Szenarien nicht signifikant verschlechtern.
- Aktionsabweichung, begründete Score-Zerlegung und gemessene Langzeitfolgen archivieren.
- Kein automatischer Merge nach main, keine Änderung produktiver Gegner oder Spielerprofile ohne separaten Beschluss.

## Nächste Aktion nach v14.8.7

1. CI-Artefakt und Kennzahlen des Piloten prüfen (insbesondere Anzahl wirklich bewerteter Konter und veränderte Entscheidungen).
2. Bei ungültiger Engine-/Legalitätsprüfung den Planner korrigieren, nicht einfach seinen Score anheben.
3. Danach ein größeres, geschichtetes Mirror-/Holdout-Experiment mit allen sieben Strategien in **getrennten Speicher-Shards**.
4. Erst anschließend Fusionen und verbrauchte Handkarten mit ehrlichen erwarteten Ergebnissen in einen begrenzten Mehrzug-Planer integrieren; Skills/Perks schrittweise reaktivieren.
