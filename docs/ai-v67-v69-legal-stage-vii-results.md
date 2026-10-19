# Arcane Duel – KI-Trainingsfortschritt 6.7–6.9: erster legal erspielter Weg zu VII

**Datum:** 19.10.2026 · **Entwicklungszweig:** `development` · **Main und aktive gegnerische Turnier-KI unverändert.**

Die experimentellen Strategien werden durch reproduzierbare Offline-Matches bewertet; die produktive KI **lernt nicht autonom nach jedem Live-Match**.

## 6.7 – Übernahme des bestätigten Seelenzehrer-Fusionsdeckbaus in echte Karrieren

[Erfolgreicher GitHub-Actions-Lauf v6.7](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39252682610)

- Der exakt aus dem erfolgreichen v6.6-Test extrahierte Soul-Bridge-Deckbauer wurde in eine **separate isolierte Karriere-Teststrategie** eingebaut.
- **8 A/B-Karrierepaare = 16 vollständig simulierte Karriereverläufe**, 72 besitzgebundene Inventar-Snapshots insgesamt.
- A- und B-Lauf verwenden pro Paar identische Anfangsprofile, Strategien, Seeds und die identischen Karriereregeln. Erst **nach einem echten Sieg gegen Gegner IV** darf B seine Decks mithilfe des v6.6-Deckbauers wechseln.
- Der Test vergleicht sämtliche frühen Snapshots bis einschließlich des noch nicht bestrittenen Turniers IV und bricht ab, falls sie zwischen A und B differieren. **8/8 Paarprüfungen bestanden.**
- **0 selbst erstellte Karten, erfundene Siege, manuelle Unlocked-Flags oder Änderungen der Spielwerte.**
- Bei 6 Paaren wurde die neue Strategie nie freigeschaltet, weil die Karriere bereits vor dem Sieg gegen IV stoppte.
- Die zwei weitesten Paare kamen bis zum Versuch gegen Gegner VI, aber keine Variante besiegte ihn im gesamten Kariere-Lauf.
- Ein Paar benötigte unter neuer Deckstrategie **18 Partien weniger**, ein anderes **eine Partie weniger**, um denselben Endpunkt zu erreichen. Das ist kein Beweis für eine höhere Erfolgsquote.

## 6.8 – Training des Testspieler-Kampfstils auf echten Stufe-VI-Inventaren

[Erfolgreicher GitHub-Actions-Lauf v6.8](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39253007287)

Die **2 wirklich erspielten Stufe-VI-Inventare** der Soul-Bridge-Karriere wurden gegen Gegner VI verwendet. Als Testspieler-Entscheidungsstile wurden `balanced`, `offensive`, `guardian`, `economy` getrennt auf Trainingsseeds verglichen.

- **304 echte Engine-Duelle** mit identischem Inventar pro Vergleich und jeweils vertauschter Startspielerposition.
- Training: Bisherige Testspieler-Strategie **0 Siege**, auf Trainingsdaten ausgewählter Stil **offensive 2 Siege**.
- Unabhängiger Holdout: bestehende Teststrategie **1 Sieg**, ausgewählter Offensivstil **0 Siege** und **−402 LP** schlechterer mittlerer Spieler-Vorsprung.
- Der neue Offensivstil **scheiterte** daher an der Holdout-Qualifikation und wird nicht übernommen.
- **Erster wirklich erspielter Gegner-VI-Sieg** unter der bestehenden Strategie: aus genau einem echten gewonnenen Duell wurde `rewardMatch(g)` normal ausgeführt. Anschließend bestätigte `validateProfile` die neue Sammlung und `profile.cleared.includes(6)`. Dadurch **wurde VII regelkonform freigeschaltet**.
- Es existiert in diesem Datenlauf **genau ein** daraus entstandenes, gültiges Stufe-VII-Karriereprofil, nicht etwa acht voneinander unabhängige späte Spielstände.

## 6.9 – Erste echte Gegner-VII-KI-Evaluation

[Erfolgreicher GitHub-Actions-Lauf v6.9](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39253285601)

`tests/ai-earned-stage-vii-v69.cjs` vergleicht die vorhandene trainierte v5.7-Boss-Policy mit drei optionalen, confidence-gated Varianten gegen **denselben einen legal erspielten VII-Spielstand**. Die Testspieler wählen vier unterschiedliche Kampfpolicies. Original-Bossdeck und tatsächliches ACE sind vorhanden und überprüft. Trainings- und Holdout-Seeds bleiben disjunkt.

- **352 simulierte Gegner-VII-Duelle** mit identischem Inventar und separaten Kontrollseeds.
- Auf den Trainingsdaten wurde `gated-survival` ausgewählt; keine automatische Freigabe.
- **Unabhängiger Holdout:** bisherige v5.7-Trainings-KI **96/96 Boss-Siege**; neuer Kandidat ebenfalls **96/96 Boss-Siege**. Die mittlere LP-Differenz gegenüber dem NPC stieg lediglich um **3 LP**.
- Boss-ACE in **96/96** Holdout-Partien beider Varianten auf dem Spielfeld beobachtet.
- Dies ist ein **Sättigungseffekt im Skript-Test**, kein Nachweis, dass reale menschliche Spieler VII nicht besiegen können.
- **Ergebnis: kein verlässlich besseres Profil**, `qualifies=false`. Stufe VII wird aufgrund dieser Versuche weder verschärft noch abgeschwächt.

## Zusammenfassung & Qualität

Die drei erfolgreich abgeschlossenen CI-Läufe ergeben **16 vollständig durchgespielte Karriereverläufe plus 656 separate VI-/VII-Vergleichsduelle** (304+352). Die 16 Karrieren und die Vergleichsduelle sind verschiedene Versuchstypen und werden deshalb **nicht** als eine einheitliche Zahl unabhängiger KI-Trainingspartien zusammengezählt.

**Erreicht:**
1. Erstmals ein tatsächlich **freigeschalteter VII-Karriere-Spielstand**, entstanden durch echten Sieg und `rewardMatch`.
2. Bewährter Soul-Bridge-Deckbau lässt sich rechtssicher auf gespielte Karrieren anwenden, ohne dass A/B vor dem Eingriff auseinanderläuft.
3. Nachweis, dass bloß eine neue Spieler-Policy für VI und weitere NPC-Policy für VII nicht automatisch besser ist.
4. Valide Grundlage für spätere VII–X-Inventare, **sofern die Trainingsspieler echte Siege erzielen**.

**Noch nicht erreicht:**
- Keine überzeugende neue gegnerische KI-Policy für VII.
- Keine repräsentativen mehreren echten VII-Inventare.
- Kein echter Sieg gegen VII in diesen Trainierenden (also keine legitime Freischaltung von VIII).
- Kein im Spiel integriertes selbstständiges Online-Lernen durch jede Partie.

### Nächster Entwicklungsschritt
Die Möglichkeiten für einen **guten Testspieler**, VII legitimerweise zu erreichen, ausbauen: mehr Karriere-Startseeds, sinnvollere Ressourcenentscheidungen nach V, Fusionsmaterial-Kombinationen und gezielte Wächter-/Seelenzehrer-Kampfführung. In den späteren Stufen nur Spielergebnisse mit *wirklich* freigeschalteten Karrierekarten als „echte Inventare“ zählen. Bestehende Turniergegner und `main` bleiben dabei unangetastet.

## Technische Artefakte
- `tests/helpers/earned-soul-bridge-v67.cjs`
- `tests/ai-career-soul-bridge-v67.cjs`
- `tests/ai-stage-vi-pilot-v68.cjs`
- `tests/ai-earned-stage-vii-v69.cjs`
- Workflow-Berichte enthalten JSON `ai-career-soul-bridge-v67.json`, `ai-pilot-stage-vi-v68.json` und `ai-earned-stage-vii-v69.json` (GitHub-Actions-Artefakte, Aufbewahrung 30 Tage).
