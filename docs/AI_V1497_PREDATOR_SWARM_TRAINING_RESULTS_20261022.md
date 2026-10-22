# Arcane Duel v14.9.7 – Predator-Schwarmbonus und Q-Lernen: verifizierter Prüfbericht

**22.10.2026 · Branch `development` · Status: Forschungsdurchlauf erfolgreich · Keine Promotion in Live-KI / `main`.**

- [Erfolgreicher GitHub-Actions-Lauf #39777758931](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39777758931)
- [Vollständiges Artefakt #12425202652](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39777758931/artifacts/12425202652) mit alten/neuen Q-Tabellen, Tactical-Replays und 576 vollständigen Duellprotokollen
- Aktive Skripte: `tests/ai-v1497-predator-swarm-counterfactual.cjs`, `tests/ai-v1497-swarm-fullmatch-holdout.cjs`

## Regeländerung auf research-only

`strategicTraining:{enabled:true,symmetricSides:true,predatorSwarmPercent:0.02}` aktiviert einen dynamischen Multiplikator auf **effektiven Schaden ausschließlich angreifender Predatoren**. Der Faktor beträgt `1 + 0.02 × Anzahl tatsächlich eingesetzter eigener Predatoren am Feld`: 1 bis 5 → +2, +4, +6, +8, +10 %. Die eigene angreifende Predator-Karte zählt selbst mit, ebenso andere Predator-Monster in DEF und Predator-geprägte Fusionen. **Nicht** gezählt werden gegnerische, Hand-, Deck- oder Friedhofsmonster. Andere Rollen bekommen keinen Bonus. Kein permanenter Kartenstat-Buff; wird bei Feldwechsel sofort neu berechnet. Angriffsschaden sowohl gegen Monster als auch bei direktem LP-Angriff profitiert; Soul-Aktivitäten nicht.

Die bisher separat erforschte optionale Rüstungsdurchdringung von 8 Prozentpunkten gegen DEF von Wächtern/Seelenzehrern wurde im dritten Forschungsarm untersucht. Es gibt **keine automatische Kombination** im echten Spiel, und `main` wurde nicht geändert.

## 1. Gegenfaktische Q-Lernphase

Drei Arme × 450 neue Trainingsboards + 150 disjunkte Holdout-Boards = **1.350 Training / 450 Test**. Auf jedem Board wird die legale Angriffsauswahl gegen zwei offene Gegner oder Pass auf echten Zustandkopien aufgelöst, einschließlich eines anschließenden legalen Gegenangriffs vom sichtbaren Board. Q-Schlüssel berücksichtigen Zielrolle, DEF-/ATK-Modus, relativen ATK-Wert, LP-Status und nun auch **Schwarmgröße solo / pair / trio / pack**.

Das Lernsystem lud den vorherigen erfolgreichen v14.9.6-Aktionswert-Lernstand und transferierte nur dessen trainierte Koeffizienten, **nicht alte Holdout-Labels oder Beispiele**. Das Research-Checkpoint kann in späteren v14.9.7-Läufen weiter aktualisiert werden, sofern das neue Update mindestens so gut auf dem Trainingssatz abschneidet.

| Experimentalarm | Gemittelter taktischer Nutzen neuer Holdouts, gelernt | Alter heuristischer Angriff | Legales Oracle je Testsituation | Optimal ausgewählte Aktionen |
|---|---:|---:|---:|---:|
| Ohne Schwarm und Durchdringung | 0,8915 | 0,5529 | 0,9763 | 144/150 |
| **+2 % je Predator** | **1,0404** | 0,6239 | 1,0732 | **147/150** |
| +2 % je Predator +8pp DEF-Piercing | 1,0445 | 0,6501 | 1,0736 | 147/150 |

Der aus dem **Trainingssatz** gewählte Arm war **Schwarmbonus allein**. Nicht die unbenutzten Holdoutwerte haben diese Wahl bestimmt. Eine gemessene lokale Board-Nutzenänderung ist **keine Duellgewinnratenänderung** und kein Beweis, dass die KI in beliebigen Positionen langfristig optimal handelt.

## 2. Vollständige 40-Karten-Duelle: wichtige Einschränkung!

Vier Arme × 144 Matchkonfigurationen = **576**. Je Arm: 0/6/10 Angriffs-Aufbauzüge, Predator-Decks gegen volle 40-Karten-Guardian-, Soul-, Fusion- und Hybriddecks; beide Starter und beide KI-Sitze.

| Arm | Siege / 144 | Platz 0 / Platz 1 | Echte Q-Aktionswahlen | Timeouts |
|---|---:|---:|---:|---:|
| **Kontrolle ohne Buff/Q** | **143/144** | 71 / 72 | 0 | 0 |
| Nur +2%-Schwarm | 140/144 | 69 / 71 | 0 | 0 |
| Schwarm + gelernte Q-Angriffswahl | 140/144 | 69 / 71 | **515** | 0 |
| Schwarm + Q + 8pp-Rüstungsbrecher | 140/144 | 69 / 71 | **589** | 0 |

**Wichtigste kritische Interpretation:** In den vollständigen Duellen gewinnt der Kontrollarm **bereits 99,3 %**; die Gegner sind in dieser Matrix **zu leicht**, um den Mehrwert des Schwarmbonus fair an tatsächlichen Siegen zu identifizieren. Die Werte **143 vs. 140** sind in dieser kleinen, an der Leistungsobergrenze gesättigten Matrix **kein Beleg für eine stärkere oder eine schwächere vollständige Predator-Policy**. Der aktuelle Q-Lerner hat nachweislich **515 bis 589 Mal aktiv eine Angriffsentscheidung beeinflusst**, aber **keine Verbesserung der Vollkampf-Siegquote** gegenüber demselben Schwarm ohne Q bewiesen. In genau diesem Test wurde der Gegner nur als eingefrorene `balanced`-Policy gespielt.

Ebenfalls: In einzelnen Schwarm-Varianten kann eine schwache Gegner-Fusions-/Hybrid-Policy nahezu immer besiegt werden. Dadurch sind kleine Unterschiede in bis zu vier verlorenen Spielen sehr unzuverlässig. Trotz gespiegeltem Starter und Sitz sind mehrfach aus denselben Decks generierte Szenarien nicht unabhängig. Normaler Arena-LP-Zerfall blieb in den Forschungspartien ausgeschaltet.

## Was bereits funktioniert

- Schwarmbonus 2 % pro aktivem eigenen Feld-Predator bis maximal +10 % ist dynamisch, an Rolle/Feldpräsenz gebunden, seitengleich und nicht im normalen PvE aktiviert.
- Q-Tabelle mit **196 gespeicherten Merkmalsaktionen** im Schwarm-Pool wurde tatsächlich gegen neue öffentliche Konterszenarien getestet.
- Vergangene gelernte Q-Werte wurden wiederverwendet; gewonnene/verlorene **ganze Duelle wurden nicht pauschal als Labels für alle Züge** verwendet.
- In den Vollkampfduellen wurden echte Q-gesteuerte Aktionen aufgezeichnet; keine reine Scheinberechnung.
- Die GitHub-CI für die Mechanik und alle v14.9.7 Studien schloss **erfolgreich** ab, keine illegalen Aktionen bzw. Soul-Sperrverletzungen in den Vollkampf-Samples.

## Konkrete nächsten Schritte vor Live-Freigabe

1. **Stärkeres Gegnerkollektiv:** Mehrere eingefrorene strategische Policies statt nur `balanced`; gleiche Ressourcen nach Level, passende Wächter-Soul-Mischdecks, ACE-/Fusionskonter; Paarung über identische Decks, Seeds und Startpositionen.
2. **Mehr echte Entscheidungsspielräume:** Kritische 5-gegen-5-Boards, Guardian mit hoher DEF/Seelenenergie, ausgehende Predator-ATK nach Zerfall, schwache Predatoren mit hoher Schwarmzahl, langfristige Fusionen. Prüfen, ob einzelne kritische Predator-Angriffe unter Q geringeres regret zeigen.
3. **Abfolgeplanung:** Statt nur ein Angriff + ein Gegnerkonter sollen Beschwörung, Fusion, Positionierung, Angriff und mindestens zwei Gegenzüge im geklonten echten Motor vergleichen werden. Das Q-System muss also für die vollständige Reihenfolge gültiger Aktionen erweitert werden.
4. **Optionale Buff-Kombination zurückhalten:** +8pp Rüstungsbrecher nur aktivieren, wenn ein wirklich starker defensiver Vergleich zeigt, dass +2%-Schwarm allein nicht ausreicht. Gegen einfache Boards zeigt die Kombination bislang keinen überzeugenden Duell-Vorteil.
5. **Produktionsfreigabe gesondert:** Normale Arena-LP-Zerfallsregeln, beide KI-Sitze, echte ACE-/Quest-Sonderfälle und weitere KI-Plausibilität prüfen, bevor überhaupt ein dauerhafter Balance-Patch nach `main` oder in den sichtbaren Karrierecode gelangt.

**Entscheidung:** Technischer Forschungsstand ✅, Weiterlernen Q ✅, 2%-Schwarm als bevorzugter Buff-Kandidat ✅, Wirksamkeit auf schwere komplette Duelle noch unbewiesen ⚠️, automatische Live-Buff-Promotion ❌.
