# Arcane Duel – Balance- & Fehlerprüfung nach dem Verteidiger-Update

**Datum:** 17. Oktober 2026  
**Basis:** \`development\`, Gameplay-Stand \`af4cd803a363d6ad4c59d189a4420856c80c4eea\`. Danach nur QA-Skripte und Workflow ergänzt, keine Änderungen an Kampfwerten oder Spiellogik.  
**CI / Nachweise:** [Vollständige Runtime mit 480 Duellen und 18 Karrieren](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39036180496) · [Aktiver Seelenraub A/B-Test](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39036462444) · [Browser- und Node-Tests](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39036180462).

## Ergebnisse 1: 480 Einzelduelle (vollständige Runtime)

Je 12 festgelegte Seeds pro Stufe I–X und Spielweise, synthetisches stufenbezogenes Deck mit bis zu 20 verschiedenen normalen Monsterarten und bis zu 15 Fusionen:

| Ansatz | Siege / 120 | Ø Spielzüge | Ø eigene Fusionen |
|---|---:|---:|---:|
| Angriff | 120 | 4,85 | 1,03 |
| Ausgewogen | 120 | 5,32 | 1,60 |
| Verteidigung | 120 | 6,73 | 3,41 |
| Seelenzehrer | 120 | 6,42 | 3,20 |

- **0 Runtimefehler** oder illegale LP/Kartenstatistik in diesen 480 Kämpfen.
- Defensive Strategie rund **39 % länger als Angriff**, benötigt gut **3,3-mal** so viele Fusionen.
- **0 aktive Seelenraub-Anwendungen** durch die eingebaute Standard-KI: Die Fähigkeit ist spielbar, aber die automatische KI entscheidet nicht darüber.
- **Interpretation:** Alle verwendeten Decks sind bereits sehr stark. 100 % Siege sind kein Beleg für einen zu leichten menschlichen Durchlauf und erlauben keinen Unterschied zwischen alten und neuen Verteidigerwerten.

## Ergebnisse 2: 18 zusammenhängende Turnierkarrieren

Drei Seeds (31/47/89), drei KI-Strategien (balanced/guardian/offensive), zwei Ressourcenschemata (minimal/invest), maximal 22 Versuche je Turnier, echtes Startinventar, echte Belohnungsfunktionen, echtes Ausrüsten. Im vereinfachten Invest-Schema werden Booster, Upgrades und Crafting verwendet; **keine vollständige Quest-/Meilenstein-/Charakterpack-Optimierung**.

| Ressourcenplan | Karrieren | I–X komplett | Stopp bei III | IV | V | VIII |
|---|---:|---:|---:|---:|---:|---:|
| Minimal | 9 | 0 | 2 | 7 | 0 | 0 |
| Investitionen | 9 | 0 | 0 | 7 | 1 | 1 |

- Erfolgreichste Karriere: **bis VII abgeschlossen**, Scheitern bei VIII.
- Minimalplan: im Mittel 27,9 Niederlagen; Investitionsplan im Mittel 34,4 (unterschiedliche erreichte Stufen, daher nicht direkt als Effizienzvergleich geeignet).
- **0 Runtime-Ausnahmen**, **0 ungültige gespeicherte Profile**.
- Diese Ergebnisse dürfen **nicht** gegen die früheren 9/12 vollständigen, intensiver optimierten 30-Versuchs-Progressionskarrieren ausgespielt werden. Unterschiedliche Ressourcenstrategie und maximale Versuchsanzahl erklären einen großen Teil des Unterschieds.
- **Festgelegte Designentscheidung:** Schwierigkeitswerte IV, V und IX bleiben vorerst unberührt.

## Ergebnisse 3: Aktiver Seelenraub im Paarvergleich (128 Duelle)

Vier Stufen (III, V, VII, IX), je 16 identische Seeds **mit** und **ohne** aktiven Seelenraub. Beide Seiten verwenden dieselbe einfache, menschenähnliche Einstellung: Seelenzehrer werden gezielt in DEF gebracht. Das Modell besitzt bereits starke, künstlich ausgewählte Karten aus vorherigen Turnierstufen.

| Stufe | Passiv Siege | Aktiv Siege | Aktiv eingesetzt | Tatsächlich entzogene ATK+DEF |
|---|---:|---:|---:|---:|
| III | 16/16 | 16/16 | 5 | 636 |
| V | 16/16 | 16/16 | 8 | 1.135 |
| VII | 16/16 | 16/16 | 14 | 2.244 |
| IX | 16/16 | 16/16 | 16 | 2.800 |
| **Gesamt** | **64/64** | **64/64** | **43** | **6.815** |

- Durchschnittlicher Kampf: passiv ca. 10,33 Spielzüge, aktiv ca. 10,25 Spielzüge. Die geringe Änderung ist angesichts der saturierten Siege **nicht statistisch als Balancegewinn belastbar**.
- **0 Laufzeitfehler**. Der aktive Seelenraub verringert tatsächlich Gegnerwerte; in diesen starken Testdecks ist er nicht ausschlaggebend für Sieg/Niederlage.
- Noch kein Nachweis, wie die aktive Fähigkeit gegen annähernd gleichstarke Gegner oder mit knappem Budget performt.

## Fehler- und Risikoanalyse

1. **Funktionslücke / hohe Testpriorität:** Die Standard-KI nutzt \`ArcaneEssenceCombat.soulRaid\` nicht. Ihr gemessener Soul-Winrate-Wert beurteilt damit **nicht** den neuen aktiven Spielstil. Das ist keine Einschränkung für manuelle Spieler, aber eine methodische Blindstelle für Balanceentscheidungen.
2. **Progressionsengpass:** Echte Startdecks plus geringe Investitionen erzeugen bei IV lange Verlustserien. Bei schon starken Decks treten diese Engpässe nicht auf. Empfehlung: Progressionshinweise und Ressourcenpfade *sichtbar und verständlich* machen, **nicht** Gegner IV/V/IX ohne gesonderte Entscheidung nerfen.
3. **Effizienzgefälle:** Trotz 1,35× DEF-Fusionsfaktor benötigen defensive Decks deutlich mehr Spielzüge und Fusionen. Das kann eine gewünschte Identität sein; gesondert prüfen, ob die Belohnung für langes, kontrolliertes Spielen ausreichend attraktiv ist.
4. **Offene Testlücke:** Die neuen Seelenfähigkeits-Buttons einschließlich Zielauswahl auf echten Touch-Geräten wurden durch diese Simulationen nicht manuell getestet. Normale automatisierte Browser-Smokes sind grün, ersetzen aber keine Touch-/Timingprüfung der neuen Bedienung.
5. **Offene Testlücke:** Die Feldfusion mit bereits geladener Seele ist durch Unit-/Speicherregressionen abgesichert, kommt in automatisierten Karriere-KIs aber nicht gezielt als Strategie vor. Also aus dem fehlenden Messvorteil **keine** Änderung der 30-%-Vererbungsquote ableiten.
6. **Keine bestätigten Runtime-Bugs** in den 608 neu simulierten Duellen, 18 Karrieren und 340 automatisierten Node-Tests. Fehlerfreiheit außerhalb dieser Stichprobe ist damit nicht bewiesen.

## Konkrete Empfehlungen für das nächste Balance-Labor

- Einen **spezialisierten Verteidiger-Bot** bauen, der je nach Gegnerdruck zwischen Raub, Verdichten, Entladen und Feldfusion mit geladener Seele entscheidet.
- Mit **real erreichbaren Decks** vor und nach jeder Turnierfreischaltung testen, statt maximal zulässige synthetische Decks zu verwenden. Den Einfluss von kostenlosen Charakterpacks/Quests separat ausweisen.
- Gegnerwerte IV/V/IX **unverändert lassen**, solange der Nutzer dies wünscht. Stattdessen den vorhandenen Hilfepopup im Browser ausprobieren (Navigation zu Freiduellen, Werkstatt und Ausbau).
- Ohne Daten über längere/gleichstarke Duelle **noch keinen weiteren DEF- oder Seelenbrand-Buff** vornehmen.
- Bei Gelegenheit 410px-Touch-Akzeptanztest für aktive Seelenfähigkeiten und die Feldfusion hinzufügen.

**Auditdateien:** \`tests/qa-balance-current.cjs\`, \`tests/qa-soul-active-comparison.cjs\` und der bestehende komplette Regressionstestbestand.
