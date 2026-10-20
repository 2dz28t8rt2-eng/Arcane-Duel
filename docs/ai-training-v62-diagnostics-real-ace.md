# Arcane Duel – KI-Training v6.2: konkrete Entscheidungen und echte ACE-Gegner

Stand 19.10.2026; nur auf **development**. Kein Rollout der experimentellen Policy auf Live-Turnierkämpfe und keine Änderung an `main`.

## Befund: Warum v6.0 besonders III, VI und IX verlor

[Öffentliche Spielzugdiagnose, erfolgreicher Run 39243897983](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39243897983)

Im Testmodul `ArcaneAiBranches59.diagnose(g,5)` werden ausschließlich eigene Handmaterialien, sichtbare gegnerische Feldkarten, legale Beschwörungen/Fusionen und zugehörige simulierte Scores protokolliert. Kein Zugriff auf gegnerische verdeckte Hand, Haupt-/Fusionsdeck oder unbekannte Ziehungen.

**36 komplette Testduelle**, mit insgesamt **252 protokollierten Beschwörungsentscheidungen**. Davon unterschied sich die Branching-Präferenz in 81/84 Fällen für III, 84/84 für VI und 14/84 für IX vom bisherigen Scorer. Besonders problematisch: bei VI häufig **normale Beschwörung statt vorbereiteter, legaler Fusion**. Dies weist auf fehlende langfristige Fusionsmaterial-Bewertung hin, nicht auf einen automatischen Beweis, dass jede Entscheidung schlechter war.

## Technische Verbesserungen

- `assets/ai-revamp-v55.js` stellt die bereits implementierte `prepareAce(g)`-Vorbereitung für Simulatoren bereit. Die ältere KI verschiebt vorhandene ACEs oder passende Materialien durch den **eigenen** Deckstapel, ohne eine Karte zu erfinden.
- `assets/ai-learning-v56.js` und `assets/ai-branch-trainer-v59.js` führen diese Vorbereitung jetzt auch in der Sandbox aus, sodass KI-Testprofile mit und ohne Branching unter denselben ACE-Regeln bewertet werden.
- Die Diagnosefunktion `ArcaneAiBranches59.diagnose` erlaubt die Untersuchung konkreter Fusion-/Normalentscheidungen ohne Live-Spielstandsänderungen.
- Als experimentelle Strategie wurde `fusionPremium` in `setSandbox(...,{guarded:true,margin:...,fusionPremium:n})` ergänzt. Für Fusionsexperten III, VI und IX kann eine normale Beschwörung eine zuvor bevorzugte legale Fusion nur bei deutlich höherem simuliertem Vorteil ersetzen.
- Das Standard-/Live-Verhalten ist weiterhin deaktiviert. Der Parameter ist optional und wird beim Sandbox-Reset auf null zurückgesetzt.

## Fusionsstrategie-Training: nicht automatisch freigeben

[Erfolgreicher Runner 39244373465](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39244373465)

Es wurden **1.500 Mirrormatches** mit echten Spielregeln, stufengerechten besitzbegrenzten Testdecks und vertauschten Startpositionen ausgespielt: **900 Training** und **600 unabhängig gehaltene Kontrollduelle**. Vergleich diesmal gegen die bereits sichere v6.1-Gated-Policy, *nicht* gegen eine willkürliche Zufalls-KI.

| Gegner | Gewählte Trainingsvariante | Neue Siege (Kontrolle) | LP-Differenz |
|---|---|---:|---:|
| III | unveränderte v6.1-Baseline | 0 | 0 |
| VI | unveränderte v6.1-Baseline | 0 | 0 |
| IX | Fusionsschutz-Schwelle 1 | **−2** | **−265** |
| **Gesamt** | | **−2** | **−88 im Stufenmittel** |

Die Fusionsschutz-Variante IX **verschlechterte sich** auf neuen Seeds. Deshalb werden die neuen Parameter ausdrücklich **nicht freigegeben**. Die Fusionspriorität ist eine plausible Technik, in dieser Implementierung jedoch noch nicht durch verbesserte Resultate gedeckt.

## Unabhängiger Boss-ACE-Test statt nur Mirror

[Erfolgreiche echte ACE-Gegner-Runde 39244654238](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39244654238)

`tests/ai-real-boss-ace-v62.cjs` simuliert zusätzlich **360 echte Bossduelle**: pro III, VI und IX jeweils 40 Partien für jede der drei festen Policies `trained-v57`, `gated-v61` und `premium-5-v62`. Anders als im Mirror erhält der NPC sein **tatsächliches kuratiertes Turnierdeck mit Signatur-ACE**; der simulierte Spieler verwendet ein plausibles, stufenberechtigtes, besitzbegrenztes Deck aus früheren Drops. Alle Policies erhalten pro Rolle/Variante die **gleichen Startseeds**. Für jedes Spiel wird technisch bestätigt, dass der NPC das ACE **wirklich besitzt**.

| Gegner | Siege der v5.7-Policy | Siege der v6.1-Policy | Siege der v6.2-Policy | bestätigte ACE-Beschwörungen (v6.1) | Spiele mit bestätigtem ACE (v6.1) |
|---|---:|---:|---:|---:|---:|
| III | 25/40 | 25/40 | 25/40 | 120 | 40/40 |
| VI | 40/40 | 40/40 | 40/40 | 82 | 40/40 |
| IX | 39/40 | 39/40 | 39/40 | 120 | 40/40 |

**ACE-Zählung:** `aceAttempted` zählt Aktionsversuche, `aceConfirmed` zählt nur **eindeutige Karteninstanzen (UID), die tatsächlich auf dem Feld beobachtet wurden**. Die Zählung wurde durch einen Hook nach erfolgreichem `applyAiAction` ergänzt. Mehrere bestätigte ACEs in einer Partie sind möglich; das bedeutet nicht, dass die KI überzählige Karten erfindet. Im vorliegenden Sample stimmten versuchte und bestätigte ACE-Aktionen zahlenmäßig überein.

**Interpretation:** Die ACE-Vorbereitung wird in allen 120 Vergleichspartien der v6.1-Policy ausgelöst und alle Partien der v6.1-Policy enthalten mindestens eine bestätigte ACE-Beschwörung. Dass die NPC-KI bei VI **40/40** und IX **39/40** gewinnt, macht diese Teststärke **ungeeignet, um kleine Verbesserungen allein anhand der Siegrate zu messen** (Deck-/Schwierigkeits-Sättigung). Das kann an unausgereiften synthetischen Spielerdecks, Gegnerwerten oder beiden liegen; **kein Nachweis**, dass die echte Karriere zwingend zu schwer ist. Deshalb auch keine automatischen Gegner-Nerfs.

## Qualität und Einschränkungen

- Diagnose-CI: 14/14 öffentliche Aktions- und ACE-Sicherheitsprüfungen bestanden.
- Fusionsschutz-CI: 7/7 neue und bisherige Gating-Tests bestanden; 1.500 ausgeführte Testduelle.
- Echte ACE-Boss-CI: 360 Testduelle erfolgreich und ACE-Instanzen tatsächlich nachgewiesen.
- Alle Tests sind **offline und deterministisch**; keine Änderung echter Spieler-Spielstände und kein geheimes Gegnerwissen.
- *Die synthetischen Spieler-Decks sind kartensources-/inventarbegrenzt, aber nicht als tatsächliche Karriere-Progressionsgeschichte mit sämtlichen Paketentscheidungen und Dropwahrscheinlichkeiten gespielt worden.*
- Ein gescripteter Simulationsgegner ist kein menschlicher Spieler. Ein exakter Kartensatz-Mirror bedeutet nicht, dass beide Controller identische PvE-Passivregeln haben.

## Konkreter nächster sinnvoller Schritt

1. Den Diagnosereport zur gezielten Reparatur von **Fusion-Aufbau statt Normal-Summon** verwenden, aber **getrennt nach Aktionsphase und verfügbarem ACE-Material** statt eines globalen `fusionPremium`.
2. Authentische **durchgespielte Karriere-Inventare** einschließlich Kartendrops, Fusionen und Boosterentscheidungen als Trainingsdeckquelle erzeugen, statt nur plausible erlaubte Quellen zu verteilen.
3. Für VI/IX stärkere, aber **tatsächlich erspielbare** Konterdecks ergänzen, damit die Siegquoten zwischen 20 und 80 Prozent liegen und AI-Stärken sichtbar werden, ohne Spielwerte heimlich zu ändern.
4. Mehrere unabhängige Seeds mit echten NPC-ACE-Decks und festen Kandidaten gegentesten; nur statistisch stabile Strategien einzeln auf `development` aktivieren.

**Status:** Neue Technik im Repository vorhanden, aber in der spielbaren Turnier-KI weiterhin **nicht aktiviert**. `main` unverändert.
