# Arcane Duel – KI-Prüfbericht v14.8.6: Drei Fusions-Ablationen und 3.024 Mirror-Duelle

**Stand:** 22. Oktober 2026 · **GitHub Actions:** [erfolgreich abgeschlossener Lauf #39735910182](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39735910182), Commit `47fe878edf17e25abb27ba2f4dd55bc830134e73` · Start 08:45:04 MESZ, Ende 09:53:41 MESZ, Laufzeit 68 Minuten 37 Sekunden.

**Originalquellen:** [Komplettes archiviertes Testergebnis (34 Dateien)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39735910182/artifacts/12410198072). Zentrale JSONs: `comparison.json`, `baseline/report.json`, `neutral/report.json`, `symmetric/report.json`, `*/opening-examples.json`, zwölf unabhängige Shard-Reports und zwölf Opening-Teilarchive. Testquellcode: `tests/ai-v1486-three-arm-symmetric-training.cjs`, `tests/ai-v1486-three-arm-mechanics-gate.cjs`, `tests/ai-v1486-aggregate-arm.cjs`, `tests/ai-v1486-compare-ablations.cjs`.

## Prüfurteil

**Erfolgreicher, methodisch wertvoller Kausallauf. Die feste Sitzplatz-Asymmetrie sinkt von 84,23 % auf 50,89 % Siege für Spieler 0. Der tatsächliche zweite Zug gewinnt in der faireren Vergleichsumgebung 61,61 %. Ein stärkerer KI-Champion konnte noch nicht nachgewiesen werden.**

Der Workflow meldet `success`; sämtliche Pflichtschritte einschließlich allgemeiner Engine-Regressionen, Fusionsmechanik-Gate, aller drei Pilotvarianten, aller zwölf großen Shards, aller drei Shard-Aggregatoren und der finalen A/B/C-Quervergleichskontrolle meldeten `success`. Vorgängerdaten und eingefrorene Modelle wurden anhand der archivierten Originalreports geladen.

## 1. Kontrolliertes Design

- Drei Varianten A/B/C verwenden **identische 84 unabhängige Holdout-Szenarien**, zwei Starterpositionen × zwei *für beide Spieler gleiche* Anfangshand-/Deckvorlagen und pro Konstellation drei vollständige Duelle (eine Selbsttest-Kontrolle alte KI gegen dieselbe KI, zwei Plätze getauschte v14.8.2-v14.7-Mirrors): **84 × 4 × 3 = 1.008 Duelle pro Arm; 3.024 vollständige Testduelle insgesamt**. Dazu kleinere Piloten und Trainingspool-Tests.
- In jeder Partie: identische fünf Starthandkarten samt Anfangswerten, gleiche Reihenfolge der übrigen 35 Deckkarten, vollständiges 40-Karten-Deck, identischer Fusionsvorrat, 10.000 LP, einheitliche Spielerpower und keine Enhancements.
- Alle Perks, Spezialfähigkeiten, Rollen-Effekte und Schicksals-/Essenz-Sondereffekte werden **nur in isolierten KI-Test-VMs** neutralisiert. Die Starter-Schilde wurden für beide Seiten auf 0 gesetzt. Normalspiel-Änderungen: **keine**.
- **A – Baseline:** Bisherige problematische Rollenlöschung, wodurch normale Monster durch einen Fallback fälschlich als Allrounder gelten. Gegnerseitige Poker-Fusionsdrosselung bleibt bestehen.
- **B – Neutral:** Sentinelrolle `__neutral_no_role__` verhindert diese künstliche Allrounder-Resonanz; die Gegnerdrosselung der Poker-Fusionsqualität und Würfe bleibt.
- **C – Symmetrische Fusion:** B plus temporärer beidseitig gleicher Fusions-Qualitätsevaluator im isolierten VM; das Mechanik-Gate prüfte Lv3+Lv3+Lv3 mit **1,125 Qualitätsfaktor / 5 Würfen / Fusionslevel 5** auf beiden Spielerplätzen. Weitere PvE-NPC-Sonderpfade können fortbestehen und sind **nicht** pauschal ausgeschaltet.

## 2. Primärmetrik – gleiche alte KI auf beiden Plätzen

| Gruppe | Spieler-0-Siege | Spieler-1-Siege | Spieler-0-Quote | Abweichung von fairen 50 % |
|---|---:|---:|---:|---:|
| A – Alter Skills-Off-Test | **283/336** | 53/336 | **84,23 %** | +34,23 Prozentpunkte |
| B – Rollen-Fallback beseitigt | **240/336** | 96/336 | **71,43 %** | +21,43 Prozentpunkte |
| C – Beidseitig gleiche Fusionstaktung | **171/336** | 165/336 | **50,89 %** | +0,89 Prozentpunkte |

**Kumulierte Verbesserung:** um **33,34 Prozentpunkte** verringerte Sitzplatz-0-Quote. B gegenüber A: **−12,80 Prozentpunkte**. C gegenüber B: **−20,54 Prozentpunkte**.

**Wichtig:** Das sind 336 Spiele aus 84 Szenarien mit je vier gekreuzten Startbedingungen; die 336 Beobachtungen sind nicht als 336 unabhängige zufällige Deck-/Seed-Stichproben zu verstehen. Durch identische Seeds und Startbedingungen in allen Armen ist der Paarvergleich trotzdem aussagekräftig. Aus 50,89 % folgt keine allgemeine Garantie fairer Live-Partien mit aktivierten Skills.

## 3. Einzelne Startbedingungen der faireren Variante C

| Bedingung | Sieger Spieler 0 | Sieger Spieler 1 |
|---|---:|---:|
| Spieler 0 beginnt, gemeinsame Kartenvorlage A | 30/84 | 54/84 |
| Spieler 1 beginnt, gemeinsame Kartenvorlage A | 55/84 | 29/84 |
| Spieler 0 beginnt, gemeinsame Kartenvorlage B | 36/84 | 48/84 |
| Spieler 1 beginnt, gemeinsame Kartenvorlage B | 50/84 | 34/84 |
| **Gesamt** | **171** | **165** |

Bei der Startspieler-Zählung gilt:
- Starter 0 gewinnt in den entsprechenden Partien **30 + 36 = 66** Mal.
- Starter 1 gewinnt in seinen Startspielen **29 + 34 = 63** Mal.
- **Startspieler insgesamt: 129/336 = 38,39 %**.
- **Zweiter Spieler insgesamt: 207/336 = 61,61 %**.

Unter symmetrischen Fusionen wechselte in **83/84** vergleichbaren Szenarien der Sieger, wenn nur der Startspieler gewechselt wurde (gleiche gemeinsame Kartenvorlage). In der fehlerhaften A-Gruppe waren es nur **24/84**. Das ist der stärkste Hinweis, dass die untersuchte asymmetrische Engine nicht mehr überwiegend durch den festen Sitzplatz entscheidet.

**Interpretationsgrenze:** Der Vorteil des zweiten Zuges könnte aus der Kombination von erlaubtem früherem Angriff, Reaktionsinformationen und den vorher bestätigten ATK-/DEF-Zerfallszeitpunkten stammen. Dies ist **noch keine Einzelmessung des kausalen Beitrags des Zerfalls**. Zudem wurde der normale zweite-Spieler-Startschutz für beide Seiten auf null neutralisiert.

## 4. Gematchte direkte Siege statt bloß aggregierter Quoten

In 72 aufgezeichneten Szenarien × 4 Bedingungen = **288 direkt gepaarten Referenzspielen** lag zusätzlich ein identischer Zustandsvergleich A/B/C vor:

- **A → B:** 60 von 288 Siegerwechseln, darunter **50 von Sitz 0 zu Sitz 1** und **10 umgekehrt**.
- **B → C:** 84 von 288 Siegerwechseln, darunter **69 von Sitz 0 zu Sitz 1** und **15 umgekehrt**.
- **A → C:** 110 von 288 Siegerwechseln, darunter **102 von Sitz 0 zu Sitz 1** und **8 umgekehrt**.

Dies bestätigt, dass die Änderungen tatsächlich viele konkrete Duellausgänge drehen, statt lediglich einer statistischen Schwankung zwischen unterschiedlichen Zufallsdecks zu entsprechen.

## 5. Stabilität in sieben Spielstilen

Je Stil 48 neutrale Selbsttests, Sitz-0-Siegquote unter den drei Regelvarianten:

| Stil | A | B | C |
|---|---:|---:|---:|
| Predator | 81,3 % | 70,8 % | **52,1 %** |
| Tempo | 77,1 % | 64,6 % | **50,0 %** |
| Wächter | 93,8 % | 64,6 % | **50,0 %** |
| Seelenzehrer | 87,5 % | 83,3 % | **52,1 %** |
| Fusion | 85,4 % | 68,8 % | **50,0 %** |
| Allrounder | 91,7 % | 77,1 % | **50,0 %** |
| Hybrid | 72,9 % | 70,8 % | **52,1 %** |

Die Ausgeglichenheit entsteht **nicht** nur durch eine zufällige Überlagerung stark ungleicher Stile: alle sieben landen unter C zwischen 50,0 und 52,1 Prozent.

## 6. Hat die KI taktisch gelernt?

**Nein, nicht in diesem Lauf.** Die in A/B/C eingefrorenen v14.8.2-Kandidatenprofile und die alte v14.7-Referenz wurden unter faireren Bedingungen erneut verglichen, aber **keine Modellgewichte dauerhaft aktualisiert**. So lässt sich der Regelmechanik-Effekt isolieren.

| Variante | v14.8.2-Kandidat | alte v14.7-KI | Echte unterschiedliche Entscheidungen |
|---|---:|---:|---:|
| A | **334/672 = 49,70 %** | 338/672 | **128/3.271** |
| B | **331/672 = 49,26 %** | 341/672 | **116/3.119** |
| C | **332/672 = 49,40 %** | 340/672 | **109/3.113** |

Unter C spielen beide KI-Versionen in **320/336** gespiegelten Matchpaaren so, dass derselbe feste Spielerplatz gewinnt; in 16 Paaren ändert sich der Gewinnerplatz, davon gewann der Kandidat **6/336** auf beiden Plätzen und die alte KI **10/336** auf beiden Plätzen.

Der Kandidat ist damit **nicht** als besserer Champion qualifiziert. Besonders auffällig: Die tatsächlich unterschiedlichen Aktionsentscheidungen machen nur rund 3,5 Prozent der verglichenen Taktikmomente im C-Lauf aus. Das spricht für stärkeren Fokus auf echte Entscheidungspolitik und Spielpläne, nicht für kosmetisch andere Scores bei im Wesentlichen gleichen Zügen.

Im separaten Trainingspool C: Offensive **24/48**, Verteidigung **23/48**, Fusion/Hybrid **35/72** gegen die alte Referenz. Keine überzeugende Verbesserung.

## 7. Technische und methodische Grenzen

- Lauf technisch grün; vollständige **4 Shards × 3 Gruppen**, alle Pilot-Gates bestanden, Originalartefakte mit 34 Dateien verifiziert, gleiche Deckfingerprints/Seeds/Starthände der Archivstichprobe in allen Armen, keine geänderten Hauptregeln.
- Symmetrie gilt für den **isolierten Trainingsmodus**, nicht automatisch für Live-PvE. Die NPC-Poker-Drosselung in der Produktivversion könnte absichtliches Balancing sein.
- Die Testneutralisierung lässt die normalen Kartenrollen-/Essenz-/Skill-Strategien noch deaktiviert und setzt Startschilde beidseitig auf null. Ein vollständig ausgewogener Live-Spielmodus ist damit nicht bewiesen.
- Die Teständerung C gleicht nachgewiesene Fusionseigenschaften an, aber garantiert **nicht** die Symmetrie aller möglicherweise noch vorhandenen id-abhängigen PvE-Codepfade in jedem seltenen Spezialfall.
- Der beobachtete Zweitzugvorteil ist **ein zu untersuchender Mechanik-Effekt**, nicht unmittelbar ein zu „reparierender“ Fehler: Ziel ist nachvollziehbares Balancing bei Einhaltung der eigenen Zerfalls- und Angriffssysteme.
- Für Statistik von KI-Fortschritt getrennt ausweisen: **feste Sitzposition, echter Startspieler, beide KI-Versionen, Gegner-/Deckgruppe, Kampfausgang**. 50 % Mirrorquote allein kann auch jetzt echte Unterschiede verschleiern.

## 8. Empfehlung für v14.8.7

1. **Neuen symmetrischen KI-Kampfmodus dauerhaft nur in der Testumgebung verfügbar machen**, inklusive kontrollierter Fusionen, sauberer Rollen-Neutralisierung, identischen Controllerrechten und deterministischem Replay; bisherige A/B-Varianten als Regressionstests erhalten.
2. **Zugreihenfolge / Zerfall gesondert isolieren:** Spielidentische Duelle mit normalem vs. deaktiviertem Stufenzerfall, getrenntem erstem Angriffsrecht und Startschutzfaktor (0/200) vergleichen. Erst nach echter kausaler Prüfung Änderungsvorschläge für Live-PvP oder Live-PvE ableiten.
3. **KI-Lernverfahren erst jetzt neu angehen:** echte legale Aktionsvergleiche in mehreren Folgezügen (MCTS oder mehrstufiger Suchhorizont), bewertete Angriffs-/Block-/Fusionsentscheidungen, Replays als dauerhaftes Trainingskorpus; trainiert auf symmetrischer Testumgebung und testet mit **unbekannten** Decks/Seeds/Strategietypen. 24/48 und 23/48 sind keine nachgewiesene Verbesserung.
4. **Skills/Perks schrittweise wieder aktivieren:** erst gleiche Rollenmechanik, dann passive Kartenrollen, dann spezielle Skills, schließlich Perks und Charakter-Sonderwerte; dabei nach jeder Gruppe Sitzplatz-Fairness und Taktikstärke separat nachmessen.
5. **Kein Main-Merge und keine automatische Champion-Promotion.** Der laufende Erfolg liegt in korrekter Fairness-Diagnostik, nicht in einer neuen KI-Version mit belegtem Siegquotenvorteil.

**Gesamturteil: sehr wichtiger Durchbruch für die Qualität des zukünftigen Trainings.** Die Fusionsregel-Abweichungen erklären die zuvor sehr hohe Sitzplatzlast weitgehend; die Trainingsumgebung kann jetzt viel besser zwischen Startspieler-Effekt und echter KI-Leistung unterscheiden.
