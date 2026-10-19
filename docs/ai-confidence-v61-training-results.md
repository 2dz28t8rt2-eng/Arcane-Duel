# Arcane Duel – KI-Trainingsrunde 6.1: sichere Entscheidungsübersteuerung

**Stand:** 19.10.2026 · **Nur `development`**. Die spielbare Turnier-KI sowie `main` bleiben unverändert.

## Warum diese Runde?

Die v6.0-Mirrormatches mit strenger Besitz-/Lootbegrenzung ergaben **−50 Netto-Siege** gegenüber dem bisherigen offline trainierten v5.7-Scorer, besonders Gegner III −27, VI −39 und IX −25. Statt pauschal neue Gewichte zu verwenden, wurde ein konservatives Umschaltverfahren eingerichtet.

`assets/ai-branch-trainer-v59.js`: `setSandbox(weights,true,{guarded:true,margin:n})` aktiviert **nur für offline Simulationen** eine Confidence-Gate-Regel:
- Simulierte Beschwörung nur dann übernehmen, wenn ihr Bewertungsabstand zum bewährten v5.6-Scorer mindestens `n` beträgt.
- Wenn die Aktionen übereinstimmen, wird die bisherige KI verwendet.
- Auf anderen Phasen (Angriffe, Support, Positionierung) bleibt die bisherige Steuerung erhalten.
- Legale Signatur-ACEs werden weiter erzwungen. Die Tests prüfen Sandbox-Reset, ungültige Grenzwerte und Kampfphasen.
- Ohne den expliziten neuen dritten `setSandbox`-Parameter ist das alte v5.9-Verhalten im Training gleich geblieben. Außerhalb des Trainings ist beides deaktiviert.

Auch `assets/game.js` verwendet nun `prepareHandFusion(g,a.uids,a.choice)`. **Wichtige Einordnung:** Eine spätere Schicht (`assets/ai-revamp-v55.js`) hatte die explizite Fusionsauswahl im laufenden Turnier bereits umgesetzt. Diese Basis-Änderung vereinheitlicht den Aufruf, darf aber nicht als Nachweis eines zuvor live auftretenden Fusionsfehlers missverstanden werden.

## Versuch A – gezielte Variantenwahl

[GitHub Actions – Focused AI Training 6.1](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39242240907)

- **2.400 simulierte Mirrormatches**: 1.800 Trainings- und 600 separat gehaltene Testpartien.
- 10 stufengerechte Deck-Kombinationen pro Turnierstufe (5 Rollen × 2 Besitzvarianten), beide Startpositionen und auf beiden Seiten exakt gleiches Haupt- und Fusionsdeck.
- **13/13 Tests bestanden**: Sicherheit, Regressionsprüfungen und Fusionsaufruf.
- Ergebnisse gegenüber derselben trainierten Vergleichs-KI:

| Gegner | Vorab ausgewählte Strategie | Siege (Kontrolle) | mittlerer LP-Abstand |
|---|---|---:|---:|
| III | Gated Field, Abstand 2 | 0 | 0 |
| VI | Gated Survival, Abstand 3 | +1 | +54 |
| IX | Gated Survival, Abstand 3 | 0 | +125 |
| **Summe** | | **+1** | **+60 im Stufenmittel** |

Dies war keine hinreichende Grundlage für eine produktive Freigabe.

## Versuch B – echte neue Seeds, vorher fixierte Profile

[GitHub Actions – AI Confirmation Holdout 6.1](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39242548895)

Die drei Profile aus Versuch A wurden **vor dem Bestätigungslauf festgeschrieben**. Es erfolgte **keine neue Auswahl aus diesen Holdout-Seeds**. Die Startseeds unterscheiden sich von sämtlichen im vorigen Versuch eingesetzten Serien.

- **1.680 Duelle gesamt**: 240 Kontroll-/Reproduktionspartien und **1.440 völlig neue Holdout-Partien**.
- **6/6 Sicherheits- und Fusions-Tests bestanden**.
- Je Stufe 480 Holdout-Duelle (240 bisherige Vergleichs-KI und 240 neuer Kandidat); 5 Rollen, 2 Inventarvarianten, beide Startpositionen.

| Gegner | Neues festes Profil | zusätzliche KI-Siege | Änderung mittlerer LP-Differenz | Vorläufiges Urteil |
|---|---|---:|---:|---|
| III | Gated Field, Abstand 2 | 0 | 0 | Kein Fortschritt, aber keine beobachtete Verschlechterung |
| VI | Gated Survival, Abstand 3 | +5 | −68 | Nicht freigeben; trotz Siegen schwächerer LP-Vorsprung |
| IX | Gated Survival, Abstand 3 | +3 | +44 | Vorsichtiger weiterer QA-Kandidat |
| **Summe** | | **+8** | **−8 im Stufenmittel** | **kein allgemeiner Rollout** |

**Interpretation:** Die großen Niederlagen von III/VI/IX aus dem unbeschränkten v6.0-Branching werden mit der Konfidenzschranke auf diesen Seeds nicht wiederholt. Der robuste Zugewinn ist dennoch gering; insbesondere +3 Siege bei 240 bestätigenden Kandidatenspielen von Gegner IX sind statistisch nicht stark genug, eine allgemeine Dominanz zu behaupten.

Die 2.400 und 1.680 Duelle bilden zusammen **4.080 zusätzliche Simulationen**, aber die beiden Ergebnisse sollen **getrennt** ausgewertet werden, weil im ersten die Profile ausgewählt und im zweiten nur bestätigt wurden. Langfristige Trends sind nicht allein daraus ableitbar.

## Grenzen

- Das Verfahren optimiert **regelbasierte Bewertung**, kein selbstlernendes neuronales Modell und kein Online-Lernen in Spielerpartien.
- Die Mirrordecks beruhen auf dem tatsächlichen Starterbestand und plausiblen früheren, begrenzten Belohnungen, aber **nicht** auf vollständig ausgespielten Karriere-Inventaren und Drop-Zufallsverteilungen.
- Die testenden Controller verwenden unterschiedlich gewichtete Policies; trotz identischer Karten sind sie **keine exakt symmetrischen PvP-Regelsimulationen**.
- Turniergegner-ACE-Strategien müssen zusätzlich gegen **authentische Gegnerdecks** getestet werden, denn die identischen Karriere-Spielerdecks enthalten nicht automatisch das eigene gegnerische Signatur-ACE.
- Die allgemeine Browsertest-Pipeline hat in vorigen Commits gelegentlich einen UI-Ritualflug-/Progressionstest nicht bestanden. Diese Schwierigkeit ist von den bestätigten Node-KI-Trainingstests zu unterscheiden.

## Nächste technische Priorität

**Die schädlichen Entscheidungen direkt beobachten, nicht bloß Gewichte erneut auswürfeln:** Im Simulator für III, VI und IX die konkreten Alternativen, Fusionsmaterialien, Schadensrisiken und Handressourcen unmittelbar vor der Auswahl protokollieren. Die Ursachen sollten anschließend mit einer rollen- und phasenabhängigen Aktionsbewertung behoben und auf **neuen Karriere-Inventaren** gegen die v5.7-Baseline und authentische NPC-ACE-Decks validiert werden. Profile bleiben bis dahin ausschließlich Trainingskandidaten.

JSON-Ergebnisse: `artifacts/ai-focused-mirror-v61.json` bzw. `artifacts/ai-confirmation-v61.json` in den jeweiligen Actions-Artefakten, 30 Tage aufbewahrt.
