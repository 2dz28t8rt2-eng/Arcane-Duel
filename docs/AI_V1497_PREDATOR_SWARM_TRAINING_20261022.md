# Arcane Duel – v14.9.7 Predator-Schwarm und Gegenfaktik-Training

**22.10.2026** · Branch `development` · [laufender GitHub Actions-Trainingslauf #39777758931](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39777758931)

## Neu: Dynamischer Schwarmbonus (+2 % pro eigenem Predator)

In `assets/essence-combat.js` gewähren alle **aktuell besetzten eigenen Spielfeldplätze mit Predator-Rolle** einen gemeinsamen Schadensbonus für **angreifende Predatoren**:

| Eigene Predatoren am Feld | Predator-Angriffsmultiplikator |
|---:|---:|
| 1 | 1,02 |
| 2 | 1,04 |
| 3 | 1,06 |
| 4 | 1,08 |
| 5 | 1,10 |

- Das angreifende Monster zählt sich selbst mit; nur **eigene, aktuell auf dem Feld befindliche Predatoren** zählen, nicht Hand, Deck, Friedhof oder gegnerische Predatoren. Predator-Fusionen sind über ihre tatsächliche Rollenprägung enthalten.
- Ein Predator, der das Feld verlässt, entfernt sofort 2 Prozentpunkte Schwarmbonus.
- Eigene Predatoren in Verteidigungsposition zählen als aktive Feldpräsenz. Die gerade **angreifende Karte selbst** muss Predator sein: andere Rollen profitieren nicht von ihrem Schwarm.
- Der Multiplikator verändert nur **effektive Angriffsleistung**, nicht permanente Karten-ATK; er wirkt im ATK-Kampf, gegen DEF und bei direkten LP-Angriffen. Er wird nicht bei Seelenraub/Heilung, Gegenschlag oder passiven Schadensquellen angewendet.
- Die vorangegangene, versuchsweise eingeführte **8-Prozentpunkte-DEF-Rüstungsdurchdringung** wird **getrennt** als zusätzlicher Faktor getestet, nicht automatisch an den Schwarmbonus gekoppelt.
- Alles ist zunächst **nur im ausdrücklich aktivierten symmetrischen Forschungsmodus** konfigurierbar (`strategicTraining: {enabled:true,symmetricSides:true,predatorSwarmPercent:0.02}`). Normaler PvE- und PvP-Code sowie `main` bleiben unberührt.
- `tests/predator-swarm-v1497.test.cjs` prüft alle fünf Schwellwerte, echten LP-Schaden, Rollenbindung inklusive Fusionen, beide Spielerplätze und deaktivierten Bonus im Live-Modus. Der Vergleich isoliert andere bestehende Angriffsmodifikatoren durch identische Spielsituationen ohne Schwarmbonus.

## Neuer Lernlauf

**Workflow:** `.github/workflows/ai-v1497-predator-swarm-learning.yml`

1. **Lernstand aus v14.9.6:** Q-Werte werden vom letzten erfolgreichen Trainingslauf als **Startschätzung** geladen; alte Testentscheidungen bleiben ausgeschlossen. Ab dem nächsten erfolgreichen v14.9.7-Lauf kann dessen neues Q-Checkpoint weiterverwendet werden.
2. **1.350 Trainingspositionen**: in drei Forschungsarmen je 450 öffentliche Brettsituationen; beide Plätze werden abwechselnd benutzt und fünf unterschiedliche Schwarmgrößen berücksichtigt.
3. **450 ungesehene taktische Tests**: je Arm 150 andere Seeds. Jede legal wählbare Attack- oder Pass-Alternative wird auf einem Spielzustandsklon durch die echte Engine ausgeführt, danach erfolgt eine Reaktion vom sichtbaren gegnerischen Brett. Eine kontextsensitive Q-Tabelle lernt die unmittelbaren Werte statt pauschaler Sieg-/Verlust-Labels.
4. **576 vollständige 40-Karten-Testduelle**: Predatoren gegen Wächter, Seelenzehrer, Fusion und Hybrid, in 0/6/10-Züge-Aufbauphasen; jeweils zwei Starterrichtungen und beide KI-Plätze mit identischer Szenario-Seed-Zuordnung.

### Vier echte Vollkampf-A/B-Arme

| Arm | Schwarmbonus | Rüstungsbrecher | Gelernte Q-Entscheidungen |
|---|---|---|---|
| Kontrolle | Aus | Aus | Nein |
| Nur Schwarm | 2 % / Predator | Aus | Nein |
| Schwarm + Lernen | 2 % / Predator | Aus | Ja |
| Schwarm + Lernen + Rüstungsbrecher | 2 % / Predator | 8 Prozentpunkte | Ja |

Der Vollkampfplaner bewertet besonders das Aufbauen mehrerer Predator-Feldplätze statt ausschließlich einzelne hohe ATK-Werte zu maximieren. Der gelernte Q-Wert darf auf Predator-Angriffe Einfluss nehmen, wenn die aktuelle öffentliche Spielsituation einer tatsächlich trainierten Merkmalsklasse entspricht; Fusionen und andere Rollen bleiben zunächst durch ihre bestehenden Heuristiken gesteuert.

### Auswertungskriterien

- Winrate und Timeout getrennt nach Arm, Gegnerstil, Aufbauphase und KI-Platz
- Nachweis über **tatsächlich verwendete Q-Aktionsentscheidungen**, nicht bloße Rechneraufrufe
- Kontrollierte Attribution: Nur Schwarm vs. Kontrolle; gelerntes Q vs. derselbe Schwarm ohne Q; zusätzlicher Rüstungsbrecher vs. Schwarm+Q
- Keine vorzeitige Seelenzehrer-Offensive, keine illegalen Aktionen, gleiche Spielregeln auf beiden KI-Plätzen
- Nicht automatisch in reguläre Karriere oder `main` übernehmen. Ein neuer Bonus kann gegen starke Wächter noch zu wenig oder gegen schwache Gegner zu stark sein.

## Methodische Grenzen

Das Gegenfaktik-Lernen ist ein begrenzter **einzügiger Aktionswert-Vergleich mit einem sichtbaren Gegnerkonter**, keine ausgereifte Mehrzug-KI. Die Vollkampf-KI verwendet die gelernten Werte **nur in geeigneten Predator-Angriffssituationen**; das Schwarm-Aufstellungsverhalten wird über eine explizite, zusätzliche Wertungsfunktion gestützt. Die generierten Spiele verwenden neutrale Forschungsbedingungen, einschließlich ausgeschaltetem Arena-LP-Zerfall; sie sind nicht identisch mit der Live-Karriere.

**Ergebnisstatus:** finaler numerischer Bericht folgt aus dem oben verlinkten GitHub-Actions-Artefakt; niemals Statistiken vor Abschluss erfinden.
