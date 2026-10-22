# Arcane Duel – KI-Prüfbericht v14.8.3: Skills-Off und Start-/Spielerplatzfairness

**Stand:** 22.10.2026, 06:56:17 MESZ · **Branch:** \`development\` · **Workflow:** [GitHub Actions #39723695611](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39723695611) (\`SUCCESS\`) · getesteter Quell-Commit: \`8ec5f329b0292ab1d7fc2e2f0ace8d49cb79f5d4\`.

**[Original-Artefakt (vollständiger Bericht, vier Shards und Startsituationen)](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39723695611/artifacts/12401789872)** · Testskripte: \`tests/ai-neutral-skills-start-fairness-v1483.cjs\`, \`tests/ai-neutral-skills-aggregate-v1483.cjs\`, Workflow \`.github/workflows/ai-neutral-skills-start-fairness-v1483.yml\`.

## Kurzzusammenfassung

**Technisch bestanden, als Fairness-Diagnose äußerst aufschlussreich, kein freigabefähiger stärkerer KI-Kandidat.**

- Alle **86/86** Regressionstests erfolgreich, Pilot und **alle vier separaten 21er Testprozesse** vollständig abgeschlossen; Aggregator bestätigt **84 unterschiedliche unabhängige Holdout-Szenarien** ohne doppelte Seeds und je **vier** Startbedingungen.
- **1.008 unabhängige Testduelle:** pro Szenario und Startbedingung jeweils *ein neutraler v14.7-vs-v14.7-Selbsttest* plus *zwei Sitzplatz-gespiegelte v14.8.2-vs-v14.7-Matches*. Das sind **336** neutrale Selbsttests und **672** KI-Vergleichsduelle.
- Mit deaktivierten Skills/Perks gewinnt **Spielerplatz 0 262/336 = 77,98 %** der **symmetrischen v14.7-Selbsttests**. Es gibt also einen großen, auch ohne Karten-/Perk-Spezialfähigkeiten sichtbaren Sitzplatz-Effekt im Testaufbau/Regelkontext.
- Der **tatsächliche Startspieler** gewinnt dagegen **164/336 = 48,81 %**, praktisch kein allgemeiner „Zug 1 gewinnt“-Effekt.
- Der **Wechsel des Startspielers** änderte das Ergebnis in **21/84 = 25,0 %** der paarweise verglichenen Szenarien. Ein Tausch von **Starthänden plus restlicher Deckreihenfolge** änderte es in **35/84 = 41,7 %**. Beides beeinflusst einzelne Matches, erklärt aber die Sitzplatz-Asymmetrie nicht.
- v14.8.2-Kandidat mit Skills-Off: **333/672 = 49,55 %**, alte v14.7-KI **339/672 = 50,45 %**. **181 verschiedene Aktionen in 3.351 direkt verglichenen Entscheidungspunkten (5,40 %)**; trotzdem in **331/336 = 98,51 %** der Sitzplatz-Mirrorpaare *gleicher Gewinnerplatz*. Damit ist noch keine Stärkeverbesserung bewiesen.
- \`promotionEligible:false\`, \`productionIntegrated:false\`. Main, NPC-/Champion-Gewichte, Spielstände und Fähigkeiten unverändert.

## 1. Testgültigkeit und tatsächliche Deaktivierung

Die Neutralisierung ist ein **temporärer Testschalter**, **kein Löschen der Live-Fähigkeiten**:
- \`scene.neutralSkills=true\`: **alle Ränge** der \`profile.upgrades\` werden auf 0 gesetzt, alle Enhancements neutralisiert (\`power=1\`, leere Verstärkungen, \`flatBonus=0\`), Kartenfelder für \`ability\`, \`role\`, \`soulRank\`, \`essenceSchool\`, \`passive\`, \`skill\`, \`perk\`, \`effect\`, \`roleOverride\` entfernt; Essenz- und Schicksals-Sonderregel deaktiviert.
- Unverändert: **Grundwerte**, reguläres Beschwören, Fusionieren, Angreifen und der normale Startschutz.
- Im ursprünglichen VM waren **474 Karten/Felder mit Fähigkeits-/Rollenmetadaten** vorhanden, nach Neutralisierung **0**; bei neuer Partie mit \`scene.neutralSkills=false\` waren sie wieder da. \`profile.upgrades\` überall 0, Powers \`[1,1]\`, Enhancements \`[0,0]\`. Kein Upgrade/Perk aus realen Profilen wurde verändert.
- Jede Simulation verwendet frische JS-VM mit neu eingelesener Spielengine. Aggregator verlangt die vier korrekt zugeordneten Shards, 84 einzigartige Holdout-Seeds und keine Datenlücken.
- Einschränkung: Das Deaktivieren von Rollen-/Kartenfähigkeiten **verändert absichtlich die Spielstrategie**; dieses Ergebnis ist ein **Fairness-Stresstest**, **kein** Leistungsnachweis mit aktivem Rollen-/Perk-System.

## 2. Startreihenfolge, Handtausch und Sitzplatzvorteil – gleiche KI auf beiden Seiten

Auf allen vier Startbedingungen spielten identische v14.7-Gewichte und dasselbe alte Strategieprofil auf beiden Spielerplätzen. Der gemeinsame Kartenpool war derselbe, aber die Startkarten wurden pro Seite unabhängig gemischt und gezogen.

| Bedingung | Spielerplatz 0 gewinnt | Spielerplatz 1 gewinnt | Siegquote Sitz 0 |
|---|---:|---:|---:|
| Spieler 0 beginnt, originale Starthände/Deckreihenfolge | 62/84 | 22/84 | **73,8 %** |
| Spieler 1 beginnt, originale Starthände/Deckreihenfolge | 63/84 | 21/84 | **75,0 %** |
| Spieler 0 beginnt, Starthände und restliche Deckreihenfolgen getauscht | 67/84 | 17/84 | **79,8 %** |
| Spieler 1 beginnt, Starthände und restliche Deckreihenfolgen getauscht | 70/84 | 14/84 | **83,3 %** |
| **Summe** | **262/336** | **74/336** | **77,98 %** |

**Tatsächlicher Startspieler**: wenn Platz 0 zuerst spielt, gewinnt er 62+67 = **129/168**; wenn Platz 1 zuerst spielt, gewinnt er 21+14 = **35/168**; **164/336 = 48,81 %** Startspieler-Siege insgesamt. Es gibt somit **keinen** pauschalen Siegerstatus für den ersten Zug.

**Innerhalb derselben 84 Startszenarien** verändert der Wechsel des Startspielers (bei ursprünglicher Hand-/Deckzuteilung) **21/84** Gewinner; der Tausch der vollständigen beiden Starthand- **und Restdeckzustände** (bei Starter 0) verändert **35/84** Gewinner. Beides sind *Beobachtungen dieser kontrollierten Eingriffe*, nicht isolierte Schätzungen für alle möglichen Karten/Seeds.

**Einzelfälle aus den Archivbelegen:** Szene \`seed=3480809\` (Guardian) Gewinnerplatz **1** mit ursprünglicher Hand, **0** nach Hand- und Restdecktausch; Szene \`seed=3482885\` (Tempo) Gewinnerplatz **1** bei Startspieler 0, **0** nach Wechsel zu Startspieler 1 und ebenfalls **0** nach Handtausch. Szene \`seed=3480091\` (Predator) gewinnt Spielerplatz 0 in allen vier Varianten, trotz getauschtem ersten Zug und Starthand.

## 3. Neue KI versus eingefrorene v14.7-KI

**672 Positions-Mirrors** über vier Startbedingungen und 84 unabhängige Szenarien:

| Bedingung | Kandidat v14.8.2 | v14.7 | Interne exakt verglichene Aktionen / Abweichungen |
|---|---:|---:|---:|
| Startspieler 0, ursprüngliche Hände | 85/168 | 83/168 | 848 / 33 |
| Startspieler 1, ursprüngliche Hände | 83/168 | 85/168 | 846 / 52 |
| Startspieler 0, getauschte Hände und Restdecks | 83/168 | 85/168 | 825 / 48 |
| Startspieler 1, getauschte Hände und Restdecks | 82/168 | 86/168 | 832 / 48 |
| **Gesamt** | **333/672 = 49,55 %** | **339/672 = 50,45 %** | **3.351 / 181 = 5,40 %** |

**Wichtige Messdifferenz:** Die 181 Abweichungen sind direkte Vergleiche der tatsächlichen alten v14.7-Entscheidung mit der neuen Taktik an identischer Boardkopie. Jede davon ist eine **Entscheidungsänderung**, keine bewiesene **Verbesserung**.

- Von **336 gespiegelten Matchpaaren** ging **331-mal** der Sieg an **denselben Sitzplatz**, obwohl die KI-Versionen die Plätze tauschten.
- Der Kandidat gewann in **1/336 Paaren** auf beiden Sitzplätzen; die alte KI gewann in **4/336 Paaren** auf beiden. Die übrigen **331 Paare** gaben jeder Version einen Sieg.
- Die Gesamtquote liegt dadurch zwangsläufig nahe 50 %, selbst wenn einzelne Aktionsentscheidungen verschieden sind.
- Die alten Championgewichte wurden nicht aktualisiert; die v14.8.3-Serie **erzeugt selbst keine neu erlernten Modellparameter**. Sie dient vor allem zur Klärung des unfairen Ausgangs und der bisherigen Bewertungsschwäche.

## 4. Technischer Vorfall und Korrektur

Der ursprüngliche Großlauf [#39722113328](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39722113328) brach **nach bestandenem Pilot** im Hauptlauf mit **\`JavaScript heap out of memory\`, Exit 134** ab. Er wurde nicht als abgeschlossener 84er-Test verwendet.

Der neueste erfolgreiche Workflow #39723695611 verwendet vier getrennte Node-Prozesse, jeder mit **21 disjunkten Trainings- und 21 disjunkten Holdout-Szenarien**, bei unverändertem Gesamttestumfang. Jeder Teilprozess schreibt eigene JSONs; der Aggregator prüft **vier vollständige Shards**, ihre Herkunft, genaue Szenariozahlen, eindeutige Seeds und vollständige 4×84 Kontrollen. GitHub Actions meldet alle Schritte **SUCCESS**.

## 5. Ursachenbefund und verbleibende Unsicherheit

**Durch Evidenz gestützt:**
1. Der Test zeigt **keinen systematischen Sieg des tatsächlichen Startspielers**.
2. Ein erheblicher **Spielerplatz-0-Vorteil** bleibt nach deaktivierten Skills/Perks im **PvE-basierten Simulator** erhalten (identische KI-Gewichte und gleiche Kartenpools auf beiden Seiten).
3. Einzelne Startkarten-/Deckzuordnungen beeinflussen Resultate, aber sie machen den Sitzplatz-Effekt nicht weg.
4. Die relativ seltenen strategischen Unterschiede zwischen neuer und alter KI drehen das Ergebnis nur in wenigen Mirrorpaaren.

**Noch nicht bewiesen:** *Welche konkrete Engine-Funktion* die Asymmetrie verursacht. Testskripte erzeugen ausdrücklich \`mode:'pve'\`, mit zwei algorithmisch gesteuerten Seiten in den Rollen von Spieler 0 und Gegner 1, obwohl die Live-PvE-Regeln teilweise rollenspezifische Vorbehalte enthalten. Der neutrale Modus deaktiviert Kartenfähigkeiten, **nicht jede fest eingebaute PvE-Unterscheidung und nicht jeden potenziellen Unterschied der Controller-Verzweigung**. Die alleinige Vermutung „alle Karten sind neutral, also muss der Fehler nur im Zugablauf liegen“ wäre falsch.

Ebenfalls offen: Der Tausch beider vollständigen Hand-/Deckzustände kontrolliert das Kartenglück besser, aber ohne detaillierte aufgezeichnete alle Zugentscheidungen, Eingangs-/Ausgangszustände und Niederlagegründe belegt er **nicht**, welche Phase oder Regel den Sieg ausgelöst hat.

## 6. Konkrete Prioritäten für v14.8.4

1. **Spielerplatzabhängigkeiten instrumentieren:** Für beide Plätze und denselben Seed die zugrunde liegenden Stats, Karte-IDs, Handwerte, Deckreihenfolgen, Fusionspools, LP, Schutzschilde, ATK/DEF, Kampf- und Zerfallswerte **vor Runde 1** sowie pro Zug erfassen; Zugentscheidungen und Niederlagegrund nach Platz/Startspieler getrennt zählen.
2. **Neutralen Simulator wirklich symmetrisch machen, ohne Live-Spiel zu verändern:** \`mode:'pve'\`-Spezialpfade und regelinterne \`active===0\`-/\`player.id===0\`-Zweige einzeln als reine Test-Ablation deaktivieren, jeweils **eine** Ursache pro Versuchsgruppe statt alles auf einmal. Eine wirklich symmetrische Kontrollumgebung muss identische KI-Controller und Ressourcen garantieren.
3. **Startbedingungen gekreuzt messen:** Fixe Startdecks und Starthände, *getrennt* den Starter und den Sitzplatz tauschen; zusätzlich eine Kopie der vollwertigen **Player-Identität/-Regelrechte** tauschen. Das verhindert die Gleichsetzung von „Sitz 0“ mit „Spieler 0-PvE-Berechtigungen“.
4. **KI-Differenzen kausal nachtesten:** Die 181 echten neuen Aktionsentscheidungen (keine erfundenen optimalen Labels) als Diagnosepool behandeln, mit mehrfachen Folgeaktionen und frischen Seeds aus demselben Ausgangsboard. Je Predator, Guardian/Soul und Fusion wieder **echte** Vorteile statt nur Scores vergleichen.
5. **Abhängigkeit vom Neutralmodus transparent halten:** Zuerst faire Grundengine validieren, danach Perks/Skills schrittweise je Rolle reaktivieren und den jeweiligen Effekt erneut auf Fairness prüfen.
6. **Keine Änderungen am Live-Balancing anhand dieser Daten:** Kein neues Champion-Modell, kein produktiver NPC-Rollout, kein Main-Merge. Die Testserie untersuchte Bedingungen, unter denen Spielmechaniken bewusst abgeschaltet waren.

**Schlussurteil:** Der neue Hauptlauf ist komplett und technisch gültig. Er erklärt überzeugend, **warum 50-%-Mirror-Siege derzeit keine aussagekräftige KI-Lernmetrik sind**, findet aber noch **keinen abschließend nachgewiesenen einzelnen Bug** für die 78-%-Sitzplatzlast. Der nächste sinnvolle Schritt ist ein **symmetrischer, per-Regelpfad instrumentierter Simulator** statt bloß weiterer Heuristikgewichte.
