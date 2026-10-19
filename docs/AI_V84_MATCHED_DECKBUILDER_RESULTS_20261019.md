# Arcane Duel — KI-Training v8.4: Vergleich fairer Vor-IV-Deckbuilder

**Datum:** 19. Oktober 2026 · **Branch:** `development` · **Trainingscommit:** [16a69ce](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/16a69ce58ddd7b0457dc31a0c8f45b86bb5db788) · **ausführlicher CI-Lauf:** [#39315082432 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39315082432). **Primärer initialer Lauf:** [#39314789042 — SUCCESS](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39314789042). Das zweite Skript-Commit [3ae4609](https://github.com/2dz28t8rt2-eng/Arcane-Duel/commit/3ae46090c910227e72d596c3aeac466ab81105f2) ergänzte nur die protokollierten Einzelvergleiche. JSON-Artefakt `arcane-v84-owned-decks` (ID `12216348927`, Aufbewahrung bis 18. November 2026).

**Änderungen:** neue ausschließlich offline ausgeführte Tests `tests/ai-earned-preiv-v84.cjs`, `tests/ai-matched-preiv-v84.cjs` und Workflow `.github/workflows/ai-deckbuilder-v84.yml`. **Keine** Änderung an den produktiven Karten-, Wirtschaft-, Gegnerwerten, aktiven KI-Gewichten oder `main`.

## Methodik

- 24 völlig neue, unabhängig gestartete legale Karriereursprünge, eigene Seed-Reihe ab Offset 9000. Die Ausgangsstrategie ist das bisherige `late-shard`, damit keine wirtschaftliche Variante die Deckbuilder-Vergleiche beeinflusst.
- 1.153 tatsächlich gespielte und regulär vergütete Karriere-Duelle zum Erzeugen der Ausgangsinventare; **13 von 24** Ursprungskarrieren gewannen IV im regulären Karriere-Ablauf (mit bis zu 16 Versuchen und erlaubtem Farmen). 24 **tatsächlich erspielte und gespeicherte** Inventarsnapshots direkt vor einem IV-Turnier-Versuch.
- Auf **jedem exakt gleichen Snapshot** vier separate Deckbuilder: Standard `equipBest`, unveränderter `soul-bridge`, neue `role-aware` (Hauptdeck mit Rollen- und Levelwertung) und neue `fusion-aware` (rollenbewusstes Hauptdeck plus an Fusionsmaterial-Erreichbarkeit orientiertes Fusionsdeck).
- Vom Ursprung unabhängige Trainings- und Holdout-Gruppen mit **je 12 Karrieren**. Je Zustand **2 feste Kampfseeds und beide Startpositionen** pro Ausgangsprofil und Variante. **384 kontrollierte reale Engine-Duell-Simulationen**, davon je Strategie 48 Train- und 48 Holdout-Matches. Die 384 Duelle sind **nicht** 384 unabhängige Ursprungskarrieren.
- Keine Käufe oder Belohnungen aus den Diagnose-Duellen und keine erfundenen Karten/Freischaltungen; Besitz- und Deckregeln werden per realer Spiel-API validiert. Gegner IV, Gegnerpolicy und Kampfparameter bleiben konstant, sodass die Deckauswahl direkt verglichen wird.
- Die Bewertung der Fusionsbereitschaft berücksichtigt 2–5 unterschiedliche Materialien in repräsentativen simulierten 5er-Gruppen gemäß PVE-Levelbudget. Das ist nur eine **Näherung an mögliche Kombinationen**, **kein** vollständiger Nachweis ihrer Hand-/Feldverfügbarkeit im Kampf. Tatsächlich zustande gekommene Fusionen werden getrennt direkt aus der Engine erfasst.

## 1. Vergleich der vier Deckbuilder

### Training — 12 unabhängige Ursprungskarrieren, 48 Testduelle je Deckbuilder

| Deckbuilder | Spielersiege | Mittlerer LP-Vorsprung des Gegners | Tatsächlich ausgeführte Fusionen (gesamt) | Deckänderungen (Matches) |
|---|---:|---:|---:|---:|
| Standard / `equipBest` | **2/48** | 5.492 | 230 | 0 |
| Soul-Bridge | **2/48** | **5.476** | 228 | 48 |
| Rollenbewusst | 1/48 | 5.660 | 227 | 44 |
| Fusionsbewusst | 0/48 | 5.818 | 227 | 44 |

Auf Trainingsduellen wird Soul-Bridge als Kandidat gewählt, weil die Siege mit dem Standard gleichauf liegen und sein mittlerer NPC-LP-Vorsprung um 16 geringer ausfällt.

### Vorher nicht zur Auswahl verwendeter Holdout — 12 unabhängige Ursprünge, 48 Testduelle je Deckbuilder

| Deckbuilder | Spielersiege | Mittlerer LP-Vorsprung des Gegners | Tatsächlich ausgeführte Fusionen (gesamt) | Deckänderungen (Matches) |
|---|---:|---:|---:|---:|
| Standard / `equipBest` | **2/48** | 5.494 | 225 | 0 |
| Soul-Bridge | **2/48** | **5.476** | 223 | 48 |
| Rollenbewusst | **2/48** | 5.499 | 224 | 28 |
| Fusionsbewusst | **2/48** | 5.498 | 224 | 28 |

Der im Training ausgewählte Soul-Bridge verbessert den mittleren NPC-LP-Vorsprung um lediglich **18 LP**, gewinnt aber **kein zusätzliches Duell**. Im Holdout gibt es **keinen Sieger** unter den neuen Deckbuildern. Der dokumentierte Freigabestatus ist entsprechend **nicht verbessert / kein Rollout**. Alle Varianten verlieren weiterhin über 95 % der streng gepaarten IV-Diagnoseduelle.

**Zur Einordnung:** Die Summe der Fusionsaktionen liegt je Arm nahe beieinander (im Holdout 223–225, also etwa 4,6–4,7 pro Duell). Mehrfaches Umsortieren der Haupt-/Fusionsdecks führt folglich bislang nicht zu messbar mehr Fusionen und insbesondere nicht zu mehr Siegen. Das sagt noch nichts über die **Qualität** der jeweiligen Fusionen oder ihre Timing-Entscheidungen.

## 2. Wo liegt das tatsächliche Verbesserungspotenzial?

1. **Weniger reines Deck-Ranking, mehr Kampfsituation:** Unsere neu gewichtete Kartenauswahl ändert viele Karten, verbessert aber die IV-Duelle nicht. Der nächste Prüfpunkt sind die Kampfentscheidungen: welche Fusion wann, welche Materialien, Angriff/Verteidigung, Seelenverzehr und gegnerischen ACE-Druck abwägen.
2. **Hand-/Feld- und Fusionsentscheidung protokollieren:** Für jeden Fusionseinsatz Zielmonster, Materialstufen, Qualitäts-/Rollenbonus, Restfeld, verbleibende Angriffe, LP-Änderung und nachfolgende Gefahr erfassen. Zusätzlich verpasste legal spielbare Fusionen und unnötig erfolgte Fusionen identifizieren.
3. **Deckbuilder und Spielpolicy gemeinsam, aber kontrolliert testen:** Zuerst gleiche Inventare plus unveränderte Spielerpolicy, dann gleiche Inventare und Decks plus gezielte, **isolierte** Entscheidungsänderung. Nicht zwei Hebel gleichzeitig ändern und Verbesserungen dem falschen Grund zuschreiben.
4. **Erst danach wirkliche Karriere-Holdouts:** Sobald eine IV-Strategie auf neuen unabhängigen Ursprüngen reproduzierbar siegt, vollständige legal gespielte Karrieren über IV und VI trainieren. Die hier gemessenen **384 matched Kämpfe** sind **keine** 384 vollständigen Karrieren und belegen daher noch keinen verbesserten Progressionspfad.
5. **Keine neuen Boss-Buffs:** Bevor NPC VIII–X weiter verstärkt werden, müssen wir erst die schwache Spielerrate gegen IV unter real erworbenen Startdecks angehen.

## 3. Technische Qualität und Grenzen

- v8.4-Actions-Testlauf: **54/54** Wirtschaft-/Deck-/Save-Regressions und **20/20** ergänzende AI-/Gameplay-Regressionstests bestanden.
- Parallel ausgelöste allgemeine Code- und Browser-Suites werden in ihren jeweiligen Workflow-Läufen unabhängig erfasst; der Erfolg des v8.4-Workflows ersetzt deren separate Prüfung nicht.
- Die Simulator-Spieler verwenden **geskriptete Offline-Strategien**, kein selbstlernendes Live-Modell. Es wird nichts automatisch anhand echter Nutzerduelle trainiert.
- Die Kampfsamen und Startspielerpositionen sind je Deckvergleich identisch, dennoch können unterschiedliche gewählte Aktionen innerhalb eines Kampfes zu abweichendem Verbrauch der Spielzufallszahlen führen.
- 12 unabhängige Ursprungskarrieren je Kohorte sind ein vernünftiger Diagnosebeginn, aber noch keine starke Signifikanzbasis für kleine Siege-Unterschiede.

**Roadmap-Entscheidung:** Die implementierten v8.4-Deckbuilder verbleiben **nur in Testskripten** auf `development`; kein Wechsel der Live-Policy. **Nächste Priorität v8.5:** instrumentierter taktischer Vor-IV-Entscheidungsaudit mit konkret vergleichbarer Fusionsqualität und situationsabhängigem Lookahead; erst nach validiertem Vorteil echter Karriere-A/B-Test und mögliche spätere Freigabe.
