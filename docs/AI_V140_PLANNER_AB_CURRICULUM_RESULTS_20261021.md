# Arcane Duel – KI v14.0: umfangreicher Planer-A/B-Test und Mechanik-Curriculum

**Datum:** 21. Oktober 2026 · **Branch:** `development` · **Status:** GitHub Actions SUCCESS, neues Modell nicht qualifiziert.

- [Vollständiger Lauf #39645002521](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39645002521)
- [Originalberichte, Entscheidungsverläufe, Kandidat](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39645002521/artifacts/12367211909)
- Trainer: `tests/ai-planner-ab-curriculum-v140.cjs`
- Workflow: `.github/workflows/ai-planner-ab-curriculum-v140.yml`
- Geschützter Champion: `models/ai-selfplay-v136.json` (1.920 erfasste v13.5/v13.6-Trainingsduelle).

## Ausgangsfrage

Bringt die Zwei-Aktionen-Vorausschau aus v13.9 **bei identischen Entscheidungsgewichten** tatsächlich bessere Ergebnisse als die bisherige Einzelaktionswahl? Ein früherer Vergleich von zwei verschiedenen trainierten Versionen könnte diese Frage nicht isoliert beantworten.

## Methodik

1. Frühere v13.6–v13.9-Berichte und Entscheidungspaare geladen, aber **nicht** zur Auswahl der späteren unabhängigen Tests verwendet.
2. Aus `development` der echte Spielregel-Resolver; 160 quellenlegal konstruierte Trainingsszenarien gegen verschiedenen Deckarchetypen. Resultat **152** zulässige Paare, beide Fortsetzungen von identischem Entscheidungspunkt. Abweichende Zufallsverbräuche nach einer anderen Aktion bleiben eine Einschränkung.
3. Lernaktualisierungen werden nicht mehr aus isolierten LP-Schwankungen vorgenommen. Eine Aktionsfamilie muss mindestens **8** Fälle, mindestens **5** entscheidende Ausgänge und mindestens **85 %** Übereinstimmung der entscheidenden Fälle erreichen; dann bleibt die Gewichtänderung klein. Dies passierte **2-mal**.
4. Planer-A/B-Test: gleiche 15 Gewichte für beide Duellanten, gleicher Decktyp/Startseed, pro Szenario Sitzwechsel. **Nur die Aktivierung** des Planers unterscheidet die beiden Strategien. Die Engine berechnet bei Beschwörung eine Platzierung und bei Angriff einen möglichen zweiten eigenen Angriff, nicht mehrere vollständige Runden.
5. Weitere unabhängige Holdouts für den neuen gewichteten Planerkandidaten vs. Champion, plus VII/IX/X und drei Strategie-Spezialisten. **Kein Holdout-Fitting**.
6. Original-Regresstests für Soul-Drain/Defender, Allrounder-Resonanz, Fusionsmechaniken, LV1-Sondermechanik und Rollenvererbung sowie allgemeine KI-Prüfungen; **42 Tests bestanden**.

## Ergebnisse

| Messung | Ergebnis | Interpretation |
|---|---:|---|
| Trainingsszenarien | 160 | Mechanische Entscheidungspaare |
| Reproduzierte Gegenproben | **152** | Keine legalen Aktionsfehler |
| Gewichtsupdates nach Evidenz-Gate | **2** | Alte Champion-Gewichte bleiben im Produkt unberührt |
| **Planer EIN vs. AUS mit gleichen Gewichten** | **33/64 Siege (51,6 %)** | Zu geringer Vorsprung für Nachweis einer Verbesserung |
| Planer-Funktionsauswertungen während A/B | **244** | Planer tatsächlich ausgeführt |
| **Trainierter Planer vs. eingefrorener Champion** | **34/64 Siege (53,1 %)** | Kleine, nicht belastbare Differenz |
| VII/IX/X gesamt | **8/32 Kandidat, 10/32 Champion** | Kein Fortschritt im Boss-Benchmark |
| VII | Kandidat **5/11**, Champion **7/11** | Rückschritt |
| IX | Kandidat **2/10**, Champion **2/10** | Gleichstand |
| X | Kandidat **1/11**, Champion **1/11** | Gleichstand |
| Offensiv-Spezialist | **16/28 Siege** | Nicht allein promotionsreif |
| DEF/Support-Spezialist | **16/28 Siege** | Nicht allein promotionsreif |
| Fusion/Material-Spezialist | **19/28 Siege** | Stärkster Spezialistenvergleich |
| Ungültige Aktionen | **0** | Enginekonforme Züge |
| Modellpromotion | **Nein** | Vorheriger Champion geschützt |
| Produktive NPC-KI geändert | **Nein** | Forschung ohne Live-Rollout |

Die **42 bestandenen Mechaniktests** prüfen korrektes Funktionieren bestehender Regeln. Sie bedeuten **nicht**, dass der neue Lerncontroller sämtliche Spezialmechaniken strategisch beherrscht. Direkt im Curriculum geübt wurden Beschwörung/Fusion vs. Alternativen, Angriff vs. Aussetzen sowie unmittelbare legale Folgeaktionen. Feldfusion, komplexe Resonator-/Pokerboni-Kombos, LV1-Quests, Economy und langfristige Gegnerplanung bleiben ungelöste Lernmodule.

## Schlussfolgerung

Die erste **kontrollierte A/B-Messung** liefert *keinen ausreichend sicheren Vorteil* des Zwei-Aktionen-Planers. Auch die leichten Zugewinne in Mirrormatches sind keine Grundlage für die Beförderung, weil die Bossprüfung schlechter ist. Eine höhere Stichprobe würde die Unsicherheit senken; sie ersetzt keine neue strategische Lernfähigkeit.

Die gegenläufigen Ergebnisse legen nahe, dass eine kurzfristige Boardbewertung allein noch nicht genügt: Materialkosten, Rollen, ACE-Drohungen und Gegenspiel über mehrere Züge müssen im Entscheidungsziel besser repräsentiert werden.

## Empfohlene v14.1-Arbeiten

1. **Gezielte Mechanik-Aktionslogs:** Identifizieren, wie häufig Defender, Seelenzehrer, Feldfusion, ACE und Pokerboni tatsächlich legal verfügbar waren und welche Entscheidungen die KI traf. Vorher/Nachher-Werte über den echten Resolver prüfen.
2. **Mehrere unterschiedliche Antwortfortsetzungen:** Für riskante Entscheidungen nicht nur einen Ergebnisvergleich, sondern kontrollierte Szenarios mit anderem RNG und plausiblen Gegnerreaktionen sammeln.
3. **Planer gezielt dort aktivieren, wo sich ein Vorteil zeigt**, statt bedingungslos bei sämtlichen frühen Zügen. Auswahlkriterium nur auf Trainingsdaten entwickeln, mit völlig neuen Holdout-Decks absichern.
4. **2–3-Zug-Folgeplanung** als neues Experiment, ohne dem entscheidenden Agenten private gegnerische Karten oder zukünftige Zufallswürfe zu übergeben.
5. **Langzeitspeicher aufbauen:** Actions-Artefakt rechtzeitig versioniert übernehmen. Momentan ist das ausführliche Replay 90 Tage abrufbar; das Modell im Repository bleibt unverändert.

**Status:** Sichere, regelkonforme Forschung auf `development`. Keine produktive Änderung und keine stille Aufwertung der Gegner-KI.
