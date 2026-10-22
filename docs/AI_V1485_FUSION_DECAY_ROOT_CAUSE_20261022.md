# Arcane Duel – v14.8.5 Mechanik-Diagnose: Spielerplatz 0 vs. 1

**22. Oktober 2026 · Kontrolllauf [#39733963147](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39733963147) · SUCCESS · Branch development · Nur Testdateien**

**Ausgangsfrage:** Warum gewinnt in v14.8.4 der feste Spielerplatz 0 **283/336 (84,23 %)** trotz identischer fünf Startkarten, identischer 35er-Nachziehreihenfolge, identischem Fusionsdeck, gleicher LP und deaktivierter Skills/Perks? Könnte der zweite **Zug** wegen des Zerfalls eigentlich vorteilhaft sein?

## 1. Wichtig: Spielerplatz ist nicht Startspieler

Im v14.8.4-Selbsttest gewann der **tatsächliche Startspieler 145/336 = 43,15 %**, der feste **Spielerplatz 0 dagegen 283/336 = 84,23 %**. Die Ergebnisse dürfen nicht als „erster Zug schlägt zweiten Zug“ gelesen werden. In diesem speziellen Skills-Off-Test waren zudem beide anfänglichen Schutzschilde absichtlich 0.

## 2. Nachweisbare Engine-Asymmetrie 1: Fusionsqualität und Würfe

**Quellcode:** [assets/evolution.js, Zeilen 145–208](https://github.com/2dz28t8rt2-eng/Arcane-Duel/blob/development/assets/evolution.js#L145-L208).

Die PvE-Regel für `g.active===1` setzt Poker-Kombinationsqualität und Zusatzwürfe ausdrücklich zurück:

- `f.rollBonus = 0`, `f.levelBonus = 0`, `f.qualityBonus = 0` und `f.hasCombo = false`.
- `f.factor` wird ohne den Pokerbonus neu berechnet.
- Die Level-Budget-Regel berücksichtigt `f.levelBonus` ausdrücklich nur für den anderen Spielerplatz (`g?.active===1?0:f.levelBonus`).

Das ist im **normalen PvE absichtlich eine NPC-Einschränkung**, aber **kein fairer Zweier-KI-Vergleich**. Genau derselbe Code bleibt auch mit deaktivierten Skills und Perks wirksam.

## 3. Nachweisbare Testverfälschung 2: Deaktivierte Rollen werden zu Allroundern

**Quellcode:** [assets/allrounder-resonance-v41.js, Zeilen 10–27](https://github.com/2dz28t8rt2-eng/Arcane-Duel/blob/development/assets/allrounder-resonance-v41.js#L10-L27). In den v14.8.3/14.8.4-Skills-Off-Testpartien wurden Rollen-Attribute der Karten **gelöscht**. Die Runtime interpretiert jedoch eine fehlende Rolle durch `CARDS[c.id]?.role||'combatant'` als **Allrounder**, also nicht als „keine Rolle“. Der Resonanzrechner gibt den Bonus ausschließlich für `g.active===0`. Das erzeugt einen **künstlichen Vorteil von Spieler 0 in einem eigentlich neutralen Test**, den die Skills-Off-Assertions bislang nicht bemerkten.

Im neuen isolierten Mechaniktest wurde beides voneinander getrennt: (A) Rollen *gelöscht* wie zuvor; (B) Rollen durch `__neutral_no_role__` neutralisiert, sodass keine fälschliche Allrounder-Erkennung erfolgt. Bestehende produktive Rollen-/Kartendaten bleiben unverändert.

## 4. Kontrollierte Messung mit identischen Fusionsmaterialien

**CI:** [Erfolgreicher mechanischer Kontrolltest v14.8.5](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39733963147) · [JSON-Originalartefakt](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39733963147/artifacts/12406133275) · [Testskript](../tests/ai-v1485-fusion-side-audit.cjs).

| Dieselben Fusionsmaterialien | Spieler 0 Qualitätsfaktor | Spieler 1 Qualitätsfaktor | Spieler 0 Würfe | Spieler 1 Würfe |
|---|---:|---:|---:|---:|
| Lv3+Lv3+Lv3, **alte** Rollen-Löschung | **1,245** | **1,045** | **5** | **4** |
| Lv3+Lv3+Lv3, **sauberes** Rollen-Neutral | **1,125** | **1,045** | **5** | **4** |
| Lv1+Lv2+Lv3, **alte** Rollen-Löschung | **1,395** | **0,895** | **3** | **2** |
| Lv1+Lv2+Lv3, **sauberes** Rollen-Neutral | **1,275** | **0,895** | **3** | **2** |
| Lv2+Lv2+Lv2+Lv2, **alte** Rollen-Löschung | **1,420** | **1,090** | **6** | **4** |
| Lv2+Lv2+Lv2+Lv2, **sauberes** Rollen-Neutral | **1,260** | **1,090** | **6** | **4** |

Die **falsche Allrounder-Resonanz** beträgt bei drei Materialien **12 Prozentpunkte** für Spieler 0 versus **0** für Spieler 1. Nach Neutralisierung dieses Fehlers bleibt wegen des **expliziten NPC-Poker-Nachteils** eine erhebliche Qualitäts-/Wurf-Asymmetrie erhalten. Neun reproduzierbare Materialkombinationen wurden geprüft; die Test-Assertions sind erfolgreich. Diese Werte sind **Qualitätsfaktoren vor den ATK-/DEF-Wertewürfen**, nicht die fertigen Schadenswerte.

## 5. Zerfall auf beiden Spielerplätzen gleich – echte Zeitlinie

**Quellcode:** [assets/game.js, Zeilen 215–227](https://github.com/2dz28t8rt2-eng/Arcane-Duel/blob/development/assets/game.js#L215-L227) und [assets/qa-followup-v51.js, Zeilen 6–11 und 61–81](https://github.com/2dz28t8rt2-eng/Arcane-Duel/blob/development/assets/qa-followup-v51.js#L61-L81).

Eine Testkarte auf **Level 4** startete auf **beiden Seiten mit 320 ATK**. Die Grundregel berechnet **40 Punkte eigenen Zugzerfall**, der zusätzliche Stufenzerfall aus v5.1 **8 Punkte**, zusammen **48 ATK und 48 DEF** pro relevantem eigenen Zugende.

Kontrolliert für **Starter 0 und Starter 1**:

| Zeitpunkt | Monster des Starters | Monster des zweiten Spielers |
|---|---:|---:|
| Beide haben ihre erste Beschwörung ausgeführt | 320 | 320 |
| Nach Zug 3 (Starter hat seinen zweiten eigenen Zug beendet) | **272** | **320** |
| Nach Zug 4 (zweiter Spieler hat seinen zweiten eigenen Zug beendet) | **272** | **272** |

Die Simulation prüfte beide Startspieler-Anordnungen, und die Zerfallsmengen waren jeweils **48/48**. Der frisch beschworene Spieler ist in seinem ersten eigenen Zug zerfallsgeschützt. Der zweite Spieler besitzt daher im angezeigten Zeitraum tatsächlich ein um 48 Punkte frischeres Monster, **aber keine bessere Zerfallsregel**. Größere, systematische Fusionswerte zugunsten von Spieler 0 können diesen temporären Vorteil überwiegen. Eine vollständige Ursachenzuordnung aller gewonnenen Duelle ist damit noch nicht erbracht.

## 6. Weiterer Forschungsbedarf / sinnvolle nächste kontrollierte Partie-Serie

**Nicht** sofort Produktiv-PvE ändern. Das benachteiligte NPC-Fusionsregelwerk könnte ein beabsichtigtes PvE-Balancing sein; es ist aber unzulässig, es als faire Gleichstellung von zwei KI-Spielern auszugeben.

Nächste kontrollierte A/B-Messung mit *denselben* Seeds, identischen Startkarten und beiden Starterpositionen, ohne neue Champion-Gewichte:

1. **Kontrollgruppe:** v14.8.4-Mechanik unverändert (einschließlich bisheriger fehlerhafter Rollen-Löschung).
2. **Ablation A:** neutrale Rollen erhalten einen nicht als Allrounder erkennbaren Sentinel, aber NPC-Poker-Regel unverändert.
3. **Ablation B:** Sentinel-Neutralisierung + symmetrische Poker-Fusionsqualität, Anzahl Würfe und Fusionslevel-Budget für beide Spieler; Züge und Kreaturenzerfall unverändert.
4. **Ablation C:** Spieleridentität/Sitzplatz bei gleichem Anfangszustand konsequent vertauschen, *erst dann* verbleibende PvE-Zweig-Asymmetrien untersuchen.

Für jede Gruppe: Siegquoten Spielerplatz 0, tatsächlicher Starter, Fusionsanzahl/-stats, erste Divergenz der Boardwerte und Gewinngrund. Keine Promotion ohne unabhängigen Holdout. Normalspiel, `main`, produktiver NPC und Champion unverändert.

**Fazit:** Wir haben eine direkt reproduzierbare Fusionsmechanik-Ungleichheit gefunden und den Test-Neutralisierungsfehler isoliert. **Die 84-%-Quote ist damit plausibel erklärbar, aber noch nicht vollständig kausal zerlegt.**
