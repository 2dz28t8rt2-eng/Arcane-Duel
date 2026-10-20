# Arcane Duel – 112 zusätzliche KI-Testdecks und Kartenpool-Audit v7.0

**Datum:** 19.10.2026 · **Branch:** `development` · Gegner-Live-KI und `main` unverändert.

## Umsetzung

[Erfolgreiche vollständige Deck-/Match-Evaluation](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39254731976)

- `tests/helpers/diverse-benchmark-decks-v70.cjs`: reproduzierbarer, deterministischer Deckgenerator aus vorhandenen echten Kartendefinitionen und gewöhnlichen früheren Turniergegner-Belohnungen.
- `tests/ai-diverse-deck-bench-v70.cjs`: 112 generierte **40-Karten-Hauptdecks**, jedes mit **2–12 legalen, erreichbaren Fusionsvorlagen**, per Engine-Gültigkeitsprüfung abgesichert.
- **Vier Turnierstufen VII, VIII, IX, X × sieben Strategien × vier Ausbaustufen = 112 Konfigurationen**, davon **111 global unterschiedliche Fingerprints** und **jeweils 28 unterschiedliche Decks pro Stufe**.
- Strategien: Predator, Wächter, Seelenzehrer, Fusion, Allrounder, Tempo, Hybrid. Ausbaustufen: Starter-lastig, ausgewogen, spezialisiert, Veteran.
- **448 echte simulierte Engine-Partien**: Baseline-v5.7-KI versus experimentell confidence-gated Survival, jeweils gleicher Startseed, derselbe Deckinhalt und gleiche Startposition. **Kein Auto-Rollout**.
- JSON-Artefakt: `artifacts/ai-constructed-training-decks-v70.json`, in der erfolgreichen GitHub Action abrufbar. Enthält alle einzelnen Kartennummern, Fusionsdecks, Quellenfilter, Fingerprints und Match-Auswertungen. Der Generator bleibt dauerhaft im Repository; das Artefakt wird nach 30 Tagen von GitHub gelöscht.

**Wichtiger Herkunftshinweis:** Das sind ausdrücklich `CONSTRUCTED_BENCHMARK_NOT_EARNED`-Decks. Es werden potenziell erwerbbare Kopien gewöhnlicher früherer Gegner-Beutekarten kombiniert, **ohne** eine echte Karriere oder Drop-/Booster-Wahrscheinlichkeiten durchgespielt zu haben. Sie werden weder in echten Spielerprofilen freigeschaltet noch als Beweis über erreichbare Inventare dargestellt. Die echte Karriere-Teststrecke aus v6.7–6.9 bleibt davon getrennt.

## Deckpool – effektive Abdeckung

| Turnier | Quellzulässige normale Kartentypen | Quellzulässige Fusionsvorlagen | Verschiedene komplette Testdecks | Höchste tatsächlich erreichbare normale Kartenstufe im Pool |
|---|---:|---:|---:|---:|
| VII | 29 | 15 | 28 | 6 |
| VIII | 29 | 17 | 28 | 6 |
| IX | 29 | 19 | 28 | 6 |
| X | 29 | 21 | 28 | 6 |

Stufengrenzen des Fusionsdecks reichen bei Bedarf höher; der obige Level-6-Wert bezieht sich ausdrücklich **nur auf normale Monsterkarten**, die den strikten vorherige-Turniergegner-Beute-Filter erfüllen.

**Katalog-Audit**: 716 gesamte Kartendefinitionen, darunter 113 normale Karten ohne Hardmode/ACE/Quests/Manifestationen/Sonder-Klassifizierungen. Die normalen Monster verteilen sich nach Level wie folgt:

| Normalmonster-Level | Bestehende verschiedene Karten |
|---|---:|
| 1 | 17 |
| 2 | 14 |
| 3 | 22 |
| 4 | 27 |
| 5 | 20 |
| 6 | 11 |
| 7 | 2 |
| 8 | 0 |
| 9 | 0 |
| 10 | 0 |

Die zwei bereits vorhandenen normalen Level-7-Karten heißen **Mondfluch-Hexe im Mondlicht** und **Gargoyle der Mondfinsternis**. Im gegebenen Quellfilter gehören sie nicht zu gewöhnlichen vorangehenden Gegner-Beutelisten. Daraus folgt **nicht automatisch**, dass sie im gesamten Spiel auf keinem anderen Weg erhältlich sind – Packs, Werkstatt und Sondermechaniken sind hier nicht als Quelle erfasst. Von den 113 definierten normalen Karten entsprechen 84 nicht dem streng eingeschränkten Quellfilter für den früheren Turniergegner-Belohnungspool. **Kartenverfügbarkeit und Kartenmenge sind getrennte Fragen.**

## Ergebnis der 448 KI-Stresstests

Je Stufe **56 Baseline- und 56 Challenger-Partien** (28 Decks × zwei Startpositionen).

| Gegner | Baseline-Siege als NPC | Kandidat-Siege als NPC | mittlere LP-Differenz des Kandidaten gegenüber Baseline |
|---|---:|---:|---:|
| VII | 56 / 56 | 56 / 56 | −3 |
| VIII | 56 / 56 | 56 / 56 | +88 |
| IX | 55 / 56 | 55 / 56 | −2 |
| X | 56 / 56 | 56 / 56 | 0 |

Alle 448 Spielpartien liefen erfolgreich durch und in allen zeigte die Engine eine tatsächliche Signatur-ACE-Beschwörung. Die Gewinnraten sind überwiegend **gesättigt** und deshalb **ungeeignet zur Behauptung, dass die neue KI besser ist**. In dieser Runde wurde folgerichtig kein neues Profil aktiviert.

## Einschätzung: Brauchen wir mehr Karten?

**Nicht für den Ausbau der Testmatrizen**: 112 weitere Decks funktionieren bereits mit vorhandenen Karten. **Ja, mittel- bis langfristig für glaubwürdige Endgame-Normalmonster-Kombinationen**: Nur zwei normale Level-7-Karten und null normale Level-8–10-Karten in den oben betrachteten Standardkategorien bedeuten, dass die hochstufige Normalkarten-Progression gegenüber Fusionen und ACEs dünn ist. Darüber hinaus erreicht nur ein kleiner Teil des bestehenden Pools die streng geprüfte frühere-Turnier-Beuteauswahl.

Empfohlene Reihenfolge:
1. Zunächst vorhandene 113 normalen Monster und tatsächliche **Drop-/Shop-/Crafting-Quellen** prüfen. Zugänglichkeit verbessern, wo die Progression unbeabsichtigt bei Level 6 stagniert, ohne das gesamte Turnier leichter zu machen.
2. Dann gezielt zusätzliche normale Monster Level 7–10 entwickeln, mit Rollensynergien (Predator, Wächter/Seelenzehrer, Allrounder) und stufengerechten Quellen. Als Startumfang etwa **12–20 neue Endgame-Normalkarten**, nicht noch mehr ACEs.
3. Mit stärker diversifizierten und **wirklich erbeuteten** Decks erneut Gegner VII–X prüfen, sonst verdeckt 100%-NPC-Siegrate kleine taktische Verbesserungen.

**Status**: Deckgenerator, automatisierter Match-Test und JSON-Ausgabe dauerhaft auf `development`; die künstlich konstruierten Kartensets sind nur Trainingsdaten. Die regulären Spielkarten und die aktive KI wurden nicht verändert.
