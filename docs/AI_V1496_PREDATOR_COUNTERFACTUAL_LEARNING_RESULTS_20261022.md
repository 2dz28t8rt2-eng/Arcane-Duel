# Arcane Duel v14.9.6 – Predator-Rüstungsbrecher und persistierendes Counterfactual-Q-Lernen

**Datum:** 22.10.2026 · **Branch:** `development` · **Status:** Forschung, **kein Live-Buff, keine Produktiv-KI-Promotion**.

**Letzter erfolgreicher, aus dem vorigen Lernstand fortgeführter Trainingslauf:** [#39775209293](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39775209293). [Rohdaten, Q-Tabelle und simulierte Alternativentscheidungen](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39775209293/artifacts).

## Ausgangsdiagnose

Im vorherigen fairen KI-Lauf v14.9.5 gewann die Strategie-KI insgesamt 261/288 Holdout-Duelle, aber Predator-Decks lediglich **15/24**. Daraus allein lässt sich **keine allgemeine Unterlegenheit aller Predator-Karten** beweisen: Die ältere Gegner-KI, Matchups, Decks und das Angriffstiming können ebenfalls Ursache sein. Der bisherige Replay-Trainer belohnte außerdem alle Aktionen eines gewonnenen Duells pauschal und produzierte **0/6** auf den Trainingsdaten bestätigte Gewichts-Updates.

## A. Mechanischer Buff-Kandidat, ausdrücklich nur für den symmetrischen Forschungsmodus

`createGame({strategicTraining:{enabled:true,symmetricSides:true,predatorArmorPierce:0|0.08|0.12,noAttackTurns:...}})`.

In `assets/essence-combat.js` beträgt der Basisschutz von Wächtern und Seelenzehrern im **DEF-Modus** 35 Prozent auf eingehenden Schaden. Ein Predator darf hiervon testweise **0, 8 oder 12 Prozentpunkte** durchdringen. Damit beträgt die Restminderung für den DEF-Treffer 35, 27 oder 23 Prozent. Die Rüstung **anderer Rollen, direkte LP-Angriffe und ATK-Modus-Gegner** bleiben unberührt.

Beispiel 500 effektive Predator-ATK gegen ein ausreichend robustes Wächter-DEF:

| Forschung | Erreichter DEF-Schaden |
|---|---:|
| Ohne Buff | 325 |
| +8 Prozentpunkte Durchdringung | 365 |
| +12 Prozentpunkte Durchdringung | 385 |

Zuerst die Defensive knacken, statt Predator-Karten pauschal mit ATK zu überladen. Getestet mit `tests/predator-armor-pierce-v1496.test.cjs`: gleiche Wirkung für **beide Sitze**, keine versehentlichen LP-/ATK-Gegner-Buffs und **keine Änderung gewöhnlicher PvE-Duelle**.

## B. Echte Gegenfaktik statt Siegeretiketten

`tests/ai-v1496-predator-counterfactual-learning.cjs` legt einen neuen öffentlichen Forschungs-Spielzustand an. Statt eine einzelne gewählte Aktion anhand des späteren Matchsiegs zu labeln, simuliert der echte Engine-Code auf jeweils identischen Kopien **Angriff auf DEF-/ATK-Gegner 1**, **Angriff auf Gegner 2** oder **nicht angreifen**. Danach folgt als begrenzter 1-Ply-Konterschritt ein legaler Angriff aus dem bereits sichtbaren gegnerischen Board, **ohne Kenntnis der gegnerischen Hand oder Deckreihenfolge**.

Aus messbaren eigenen und gegnerischen LP-/ATK-/DEF-Veränderungen wird pro Alternative ein lokaler taktischer Nutzen berechnet. Eine kleine kontextabhängige Q-Tabelle mit **48 tatsächlich belegten Merkmalsschlüsseln** wird inkrementell aktualisiert. Kontext ist insbesondere Zielrolle, Angriffs-/Verteidigungsmodus, ATK-zu-Zielwert-Verhältnis und eigener LP-Zustand. Dies ist **tabellarisches kontextbezogenes Aktionswert-Lernen**, **kein neuronales Modell und kein vollständiger Mehrzug-Minimax**.

Die Q-Tabelle wird als GitHub-Actions-Artefakt versioniert. Neue Läufe stellen ausschließlich die alten **bereits gelernten Werte** wieder her und trainieren sie auf neuen Situationen weiter. **Testdaten des vorigen Laufs werden nicht in den Lernzustand zurückgeschrieben.** Falls ein neuer Updatevorschlag auf den aktuellen Trainingsszenen schlechter ist als die vorherige Q-Tabelle, wird er **abgelehnt**. Eine bisher erfolgreiche Forschungsstrategie wird nicht automatisch verschlechtert.

Je Buff-Variante: **450 neue Trainingsboards + 150 bisher ungesehene Holdout-Boards**. Insgesamt somit je Lauf **1.350 Training + 450 Holdout-Brettbewertungen**; pro Brett mehrere reale Alternativaktionen und ein sichtbarer Konter.

## C. Ergebnisse des zuletzt abgeschlossenen fortgesetzten Lernlaufs

GitHub Actions [#39775209293](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39775209293): `success`; der **erfolgreiche Q-Lernstand aus Run #39775047781 wurde nachweislich wiederhergestellt**. Alle Mechanik-, Modus- und Seitengleichheitstests bestanden.

| Forschung gegen defensive Gegner | Alter Reflex, mittlerer taktischer Testnutzen | Gelernter Entscheidungswert | Beim vollständigen Nutzentest optimale Entscheidungen |
|---|---:|---:|---:|
| Kein Rüstungsbrecher | 0,3687 | 0,6451 | 143/150 |
| **8 Prozentpunkte** | **0,3816** | **0,6471** | **143/150** |
| 12 Prozentpunkte | 0,4035 | 0,6269 | 140/150 |

Die Trainingsevaluation wählte **8 Prozentpunkte**, **ohne die Holdout-Werte bei der Wahl zu verwenden**. Das ist ein Forschungsparameter, **noch keine Freigabe für das Live-Spiel**. Die lokale Modellbewertung (normierte ATK/DEF/LP-Nutzenpunkte) ist **keine Siegquote** und lässt sich nicht als erwartete Veränderung der Matchgewinnrate umrechnen.

**Wichtig:** Beim letzten Lauf wurden 0/3 der neuen Q-Updates angenommen, denn der **aus dem vorigen Lauf wiederhergestellte Q-Lernstand** war im aktuellen Training mindestens genauso gut. Das ist eine sinnvolle Schutzregel gegen schädliche Updates. In früheren Durchläufen wurden bereits nachweislich neue Q-Werte angenommen, und der jeweilige erfolgreiche Stand wurde wiederhergestellt.

## D. Was noch fehlt, bevor „selbstlernende KI“ für Arcane Duel erfüllt ist

1. **Forschung auf 40-Karten-Decks übertragen.** Die gelernte Q-Tabelle wird derzeit anhand gezielt präparierter, aber engine-legaler Predator-Kampfboards trainiert. Sie wird noch **nicht vom vollständigen Produktiv-KI-Controller** als Entscheidungspolicy genutzt. Erst ein vollständig gespieltes Holdout gegen starke und defensiv gemischte Gegner kann nachweisen, ob die Rüstungsbrecherfähigkeit die tatsächliche Winrate verbessert.
2. **Weitere Entscheidungen als Gegenfaktik:** Beschwörung, Fusion, Positionswechsel, aktiver Seelenraub, Auslösen von ACE und Energieverwaltung auf gleichem Brett als legale Engine-Alternativen testen. Dabei Mehrzug-Reaktionen und Kreaturenzerfall sichtbar berücksichtigen. Die Action-Q-Tabelle muss dann rollenspezifische Kontexte unterstützen, nicht nur Predator-Angriff/Pass.
3. **Zeitliche Kreditzuordnung:** Nach jeder Aktion Folgen im eigenen nächsten Zug, im gegnerischen Konter und im nächsten eigenen Zug messen; TD(λ)/n-step-Returns oder konservative Advantage-Updates für langfristige Boardplanung. Die bereits vorhandene episodische Sieg-/Niederlagen-Information bleibt nur ein spätes Zusatzsignal.
4. **Trainingsgegner-Liga:** Nicht nur die ältere `balanced`-KI, sondern getrennte aggressive/defensive/Fusions-/Seelen- und KI-Archiv-Policies. Gegenüberstellung jeder Mutation auf identischen Decks, Seeds, Starter- und Sitzpositionen.
5. **Strikte Promotionskriterien:** Gegnerspiegel-Kontrollen, keine systematischen Sitz-Biases, keine vorzeitigen Soul-Aktionen, keine illegalen Aktionen, niedrige Handlungs-Regret, positive Verbesserung auch auf dem Holdout mit **normalem Arena-LP-Zerfall** und sichtbarem Predator-gegen-Wächter-Matchup. Nur dann moderate Rollen-Buffs und AI-Policy schrittweise ins tatsächliche Spiel übernehmen.

## Relevante Dateien

- Experimentelle Mechanik: `assets/game.js`, `assets/essence-combat.js`
- Mechanikregression: `tests/predator-armor-pierce-v1496.test.cjs`
- Inkrementeller Counterfactual-Trainer: `tests/ai-v1496-predator-counterfactual-learning.cjs`
- Wiederherstellung und Validierung: `.github/workflows/ai-v1496-predator-counterfactual.yml`

**Freigabe:** Forschungs-Prototyp und Q-Gedächtnis ✅ · Predator-8pp-Profil für gezielte Match-Abnahmen **vorgeschlagen** · automatische Match-Policy-Verbesserung ❌ · Live-Buff / `main` ❌.
