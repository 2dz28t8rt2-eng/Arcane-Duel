# Arcane Duel – KI-Prüfbericht v14.8.4: Absolut identische Starthand / Deckreihenfolge

**22. Oktober 2026 · Laufabschluss 08:04:29 MESZ · `development` · SUCCESS**

**Quellen:** [Originaler GitHub-Actions-Lauf #39729970919](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39729970919) (Commit `09ed5ffcf20b4331493659f897768989b0c2512b`) · [unverändertes Originalartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39729970919/artifacts/12405263994) (11 Dateien: report.json, opening-examples.json, mode-config.json, vier Shard-Reports, vier Shard-Opening-Belege) · `tests/ai-identical-opening-neutral-v1484.cjs` · `tests/ai-identical-opening-aggregate-v1484.cjs`.

## 1. Prüfurteil

**Test technisch vollständig bestanden; verbleibende Spielerplatzasymmetrie ist substantiell und in diesem Modell nicht mit unterschiedlichen Startkarten zu erklären. Eine Verbesserung der KI-Spielstärke wurde nicht festgestellt.**

- 86/86 Spielregel-Regressionstests bestanden, 0 Fehler. Der Pilot verifizierte die Startgleichheit vor Spielbeginn; vier unabhängige 21er-Holdout-Shards erfolgreich, vollständige Aggregation, 84 getrennte unabhängige Szenarien und vier experimentelle Startbedingungen mit jeweils drei Spielen: **1.008 vollständige unabhängige Testduelle**.
- **336 Selbsttestduelle** (gleiche v14.7-KI, gleiche Gewichte/Strategie auf beiden Plätzen) mit gleichgesetzter Fünfer-Starthand, Nachziehreihenfolge, Fusionsstock, LP, Spieler-Power und Skill-Neutralisierung: **Platz 0 gewinnt 283/336 = 84,23 %**, Platz 1 gewinnt 53/336 = 15,77 %.
- Tatsächlicher **Startspieler gewinnt 145/336 = 43,15 %**. Es gibt unter der künstlich schildneutralisierten Versuchsanordnung **keinen pauschalen Vorteil des ersten Zuges**; dabei ist die übliche kompensatorische Eröffnungsschild-Regel absichtlich auf beiden Seiten auf null gesetzt.
- v14.8.2-Vergleichskandidat gegen eingefrorene v14.7: **334/672 Siege = 49,70 %**; die alte KI hat **338/672 = 50,30 %**. Die aufgezeichnete Taktik änderte ihre Wahl bei **128/3.271 = 3,91 %** direkt verglichenen taktischen Entscheidungen. In **332/336 = 98,81 %** der gespiegelten Matchpaare blieb der Siegerplatz gleich.
- **Promotion `false` und `productionIntegrated:false`.** Keine produktive KI, echten Karten/Perks oder `main` verändert.

## 2. Identität vor Spielbeginn – vom Pilot und Aggregator nachgewiesen

In **jeder** experimentellen Partie werden *beide Spielerseiten* aus **einer** Original-Starthand samt identischem Kartenstatus erzeugt, mit **eigener gültiger Karten-UID** pro Kartenexemplar, ansonsten identisch:
- exakt dieselben **fünf Kartennummern in derselben Reihenfolge** inklusive konkreter Anfangs-ATK/-DEF, Level und Eigenschaften;
- exakt dieselben **35 verbleibenden Karten in derselben Nachziehreihenfolge**, ebenfalls dasselbe originale vollständige **40-Karten-Deck**;
- exakt gleicher **Fusionskartensatz und verbleibender Fusionsvorrat**;
- **10.000 LP** auf beiden Seiten, Powerfaktor 1, leere Enhancements, gleicher Grundstat-/Bonusstand und **0 Startschilde auf beiden Seiten**;
- alle registrierten Spieler-Upgraderänge auf null und Karten-/Rollen-/Essenz-/Schicksalsfertigkeiten im **isolierten Test-VM** deaktiviert; ursprüngliche **474** Karten mit Fähigkeitsmetadaten bei deaktiviertem Schalter weiterhin vorhanden und nach Reinitialisierung wieder verfügbar.

Der Auswertungs-Aggregator validierte `allPilotOpeningsEqual:true`, `sampledHoldoutHandsEqual:true`, `priorSkillsRecoverable:true`, vollständige vier Shards und eindeutige Holdout-Seeds. Die archivierten **72 repräsentativen unabhängigen Szenarien × vier** Kontrollbedingungen haben auch einzeln auf beiden Seiten dieselben Handkarten, Nachziehfolgen und Fusionspools.

**Vier Bedingungen:** Der tatsächliche Starter ist Spielerplatz 0 bzw. 1; als Hand-/Deckvorlage dient entweder die ursprünglich für Platz 0 oder die ursprünglich für Platz 1 gezogene vollständige Sequenz. Die jeweilige Vorlage wird **danach beiden Spielern identisch gegeben**. Die Namen `starter0_swapped_hands` und `starter1_swapped_hands` sind aus dem früheren Test übernommen, bedeuten hier **gemeinsame alternative Handvorlage**, nicht unterschiedliche Hände der Gegner.

## 3. Fairness-Selbsttest: dieselbe v14.7-KI auf beiden Spielerplätzen

| Startspieler / gemeinsame Kartenvorlage | Siegerplatz 0 | Siegerplatz 1 | Quote Platz 0 |
|---|---:|---:|---:|
| Starter 0; gemeinsame ursprüngliche Vorlage 0 | 64/84 | 20/84 | 76,19 % |
| Starter 1; gemeinsame ursprüngliche Vorlage 0 | 78/84 | 6/84 | 92,86 % |
| Starter 0; gemeinsame ursprüngliche Vorlage 1 | 66/84 | 18/84 | 78,57 % |
| Starter 1; gemeinsame ursprüngliche Vorlage 1 | 75/84 | 9/84 | 89,29 % |
| **Gesamt** | **283/336** | **53/336** | **84,23 %** |

Der Startspieler gewinnt **64+66+6+9 = 145/336 = 43,15 %**. Zugwechsel bei konstanter gemeinsamer Handvorlage veränderte den Gewinner in **24/84 = 28,57 %** der referenzierten Szenarien; Wahl der alternativen gemeinsamen Kartenvorlage (bei Startspieler 0) in **22/84 = 26,19 %**.

**Interpretation:** Die Spielerplatzlast überlebt selbst die gewollte völlige Gleichheit der Startkarte, Nachziehfolge und des Fusionsvorrats. Damit ist **ungleicher Kartenstart als alleinige Ursache ausgeschlossen**. Gleichzeitig wurde nicht nachgewiesen, welche Regel in der **PvE-basierten** Game-Engine oder welcher Controllerpfad diese große Differenz erzeugt. Die Startspieler-Stichprobe ist zudem in einer **ohne Startschilde** modifizierten Testumgebung und nicht direkt identisch mit einem normalen Live-PvE-Kampf.

**Vergleich mit v14.8.3:** Damals Platz 0 **262/336 = 77,98 %**, jetzt **283/336 = 84,23 %**. Die +6,25 Prozentpunkte sind keine isolierte kausale Veränderung durch die Handangleichung: Neue Szenario-Seeds, zwei auf null gesetzte Schilde und andere Eröffnungskonditionen wurden gleichzeitig verändert. Nur die fortbestehende qualitative Asymmetrie ist robust.

## 4. Neue KI v14.8.2 vs. alte v14.7 unter strenger Eröffnungsgleichheit

| Testbedingung | Kandidat | Alte v14.7 | Direkte taktische Aktionsunterschiede |
|---|---:|---:|---:|
| Starter 0, gemeinsame Vorlage 0 | 85/168 | 83/168 | 25 / 836 |
| Starter 1, gemeinsame Vorlage 0 | 83/168 | 85/168 | 36 / 815 |
| Starter 0, gemeinsame Vorlage 1 | 83/168 | 85/168 | 23 / 816 |
| Starter 1, gemeinsame Vorlage 1 | 83/168 | 85/168 | 44 / 804 |
| **Gesamt** | **334/672 = 49,70 %** | **338/672 = 50,30 %** | **128 / 3.271 = 3,91 %** |

- **332/336 Mirrorpaare** hatten denselben Gewinnerplatz nach KI-Sitztausch; **4/336** wechselten den Siegerplatz.
- **1/336** Paare gewann der neue Kandidat auf beiden Plätzen, **3/336** die alte KI auf beiden Plätzen.
- Auf dem separaten Trainingspool (mit festen ausgewählten Profilen; kein neues Gewichtslernen) **Offensive 24/48**, **Verteidigung 24/48**, **Fusion 36/72**, jeweils 50 %. Das ist keine neue erlernte Spielstärke.
- Trotz 128 dokumentierter unterschiedlicher taktischer Aktionen scheint der Matchausgang primär durch die zugrunde liegende PvE-Spielerplatzbehandlung bestimmt, nicht durch feine Bewertungsgewichte.

## 5. Sind die Siege nur Unentschieden bzw. Tie-Breaker?

Zusätzlich wurden die **72 archivierten unabhängigen Szenarien × vier Bedingungen = 288 Selbsttest-Duelle** anhand der tatsächlichen `winReason`-Ausgaben geprüft:

| Gewinnursache in 288 archivierten Selbsttests | Fälle | Sieger 0 | Sieger 1 |
|---|---:|---:|---:|
| Gegnerische LP durch direkten Kampfschaden auf null | **167** | **150** | **17** |
| LP durch Arena-Zerfall auf null | 96 | 77 | 19 |
| Arena-Zerfall: höhere vorherige LP | 25 | 14 | 11 |
| **Gesamt Stichprobe** | **288** | **241** | **47** |

Die starke Tendenz zugunsten von Platz 0 tritt **auch bei direktem Sieg durch Kampf** auf. Die Gleichstands-/Arena-Zerfallsregel allein ist also keine ausreichende Erklärung. Diese detaillierten Gründe liegen **nur für die 288 aufgezeichneten Baseline-Duelle** vor, nicht für alle 336 Baseline-Duelle; nicht verallgemeinern.

## 6. Offene Ursachen und nächste zwingende Tests (v14.8.5)

1. **PvE-Engine-Asymmetrie isolieren:** Der Test simuliert weiterhin `mode:'pve'`, auch wenn beide Seiten KI-gesteuert sind. Gezielt Verzweigungen nach `g.active===0`, `player.id===0`, `g.opponentId`, Player/Enemy-Sonderfunktionen, Angriffsfähigkeit und KI-Ausführungspfade zählen. Prüfen, welche der beiden Seiten trotz gleicher Ressourcenausstattung andere zugelassene Handlungen oder Stat-Berechnungen bekommt.
2. **Phase-/Zug- und Schadenslog statt nur Endergebnis:** Zu Beginn jeder Phase dokumentieren: aktiver Spieler, Turn, offene LP/Schilde, Feld/Hand/Deck, Startwerte, legale Aktionen, ausgeführte Aktion, erlaubte Fusion, tatsächlichen Schaden, `winReason`, Endzeitpunkt. Die erste Stelle, an der sich die Regeln/Ressourcen unterscheiden, ist gesondert zu markieren.
3. **Symmetrischer Test-Controller:** Beide KI-Instanzen müssen alle Vorrechte und dieselben Fallbacks erhalten. Den Altcontroller als vollständige funktionale Kopie über *beide* Sitzplätze prüfen und sicherstellen, dass keine Planerauswahl für Spieler 0, aber andere KI-Logik für 1 greift. Ebenso nachprüfen, dass jede KI die andere Seite als gültigen Gegner behandelt.
4. **Zwei Regel-Ablationen mit gleicher Kartenbasis:** a) gleiche startende Werte, aber echte PvE-Engine und Standardstartschilde; b) symmetrische Turn-/Kampf-/NPC-Basis ohne produktive Player-only-/Enemy-only-Ausnahmen. Den ersten Zug jeweils separat tauschen. Dadurch kann ein künftiger Report die Kausalursache zwischen **Eröffnungsregeln, Regel-Asymmetrie und KI-Controller** trennen.
5. **Keine weiteren großen Trainingsrunden mit unkontrolliertem Sitzplatzvorteil als Fitnessziel:** Zuerst Testfairness belegen, dann die fehlerhaften Aktionen auf identischem Board mehrfach mit unabhängigen Simulationsfortsetzungen nachtesten; anschließend Skills/Perks auf beiden Seiten wieder einschalten und Chancengleichheit erneut verifizieren.

**Schlussurteil:** Der streng kontrollierte Lauf ist **technisch abgeschlossen und aussagekräftig**. Die große Platz-0-Last ist **nicht** einfach durch stärkere Startkarten bedingt. Offen bleibt, ob die Ursache in der PvE-Regelausführung, im Controller der zweiten Spielerposition oder einem anderen während des Spiels entstehenden Zustand liegt. Keine automatische Änderung an Live-Spielregeln oder Champion.
