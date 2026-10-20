# Arcane Duel – KI v10.7: ACE-Fusion gegen tatsächlich legale Normal- und Nicht-ACE-Alternative

**Datum:** 20. Oktober 2026 · **Branch:** `development`

**Vollständig erfolgreiche und verifizierte GitHub Actions:** [v10.7 Karrieredecks / NPC-Test #39394292548](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292548) · [Code-/Strategieprüfungen #39394292746](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292746) · [Browser-Smokes #39394292508](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292508) – **alle SUCCESS**.

**Rohdaten:** GitHub-Actions-Artefakt `arcane-npc-ace-relative-v107`, ID **12251136286**, Ablauf **19.11.2026**. Originaldateien `ai-earned-player-decks-v107.json` und `ai-npc-ace-relative-v107.json`, ZIP heruntergeladen und beide JSON-Dateien erfolgreich geöffnet. Die angegebenen Zahlen wurden daraus summiert, nicht aus geschätzten Zwischenständen.

## Ziel und Ausgangspunkt

V10.5 zeigte eine reproduzierbare ACE-Auswahllücke bei Gegner X; pauschal erzwungene ACE-Fusionen brachten aber keine besseren NPC-Siege und schädigten teilweise Gegner IX. V10.6 versuchte einen absoluten, materialbewussten ACE-Mindestscore – spielte dennoch **praktisch alle ACEs**.

V10.7 testete eine **andere Entscheidungsregel**: Eine ACE-Fusion darf die reguläre eigene Beschwörungswahl nur ersetzen, wenn sie nach Bewertung derselben legal verfügbaren Hand- und Feldkarten einen deutlichen relativen Mehrwert gegenüber der **besten normalen Beschwörung und besten Nicht-ACE-Handfusion** erwarten lässt.

Die neue Policy:
- Verwendet ausschließlich gerade sichtbare eigene NPC-Handkarten, eigenes Feld und öffentliches gegnerisches Feld.
- Ermittelt legale aktuelle 2-/3-Material-Fusionen mit dem unveränderten originalen `fusionOptions` und `canCompleteHandFusion`; greift keine gegnerischen verdeckten Karten ab.
- Bewertet Normalkarte, nicht-ACE-Fusion und ACE-Fusion anhand verfügbarer ATK/DEF, sichtbarer Feldschwellen, geopferter Handmaterialstärke und noch vorhandener Handkarten. Kein rechnerisch geschenkter Zug und kein echter Fusionswürfel vor der Wahl.
- Verlangt mindestens **15 % des Alternativscores oder 180 Scorepunkte** zusätzlichen angenommenen Nutzen gegenüber der besten legalen Alternative, ehe sie die ursprüngliche NPC-Entscheidung überschreibt; andernfalls übernimmt sie die unveränderte vorhandene NPC-Policy.
- Das ist eine **heuristische Ex-ante-Nutzenabschätzung**, **kein echtes engine-gerolltes kontrafaktisches Duell** und **keine bewiesene optimale Aktion**. Ein `relativeRejected`-Ereignis zählt den Verzicht auf den neuen ACE-Override, nicht zwangsläufig eine im unveränderten NPC-Algorithmus komplett ACE-freie Folgeaktion.

## Studie: Neue Karrieren, gepaarte NPC-Kämpfe und Holdout

**32 neue unabhängige, von allen v10.6-Seeds getrennte, ausschließlich legal erspielte Spielerkarrieren**, Offset **96000**. `freshProfile`, echte reguläre Duelle per `simulateGame`, originales `rewardMatch`, normaler XP-/Coin-/Loot-/Shop-/Shard-/Pack-/Craft-/Fusion-/Deckaufbau. **3.018 vollständig regulär belohnte Karriereduelle**. 30/32 Karrieren erreichten ohne geschenkte Siege die Turnierstufe VI; alle **32/32** ergaben ein rechtmäßig besessenes 40-Karten-Deck samt legalem Fusionsdeck, dessen Kartenzahlen gegen den tatsächlich verdienten Bestand geprüft wurden. Die erschlossenen Spielerkarrieren entsprechen einer IV-/V-/VI-Progression, **nicht** voll erspieltem Gegner-IX-/X-Level.

Mit denselben unabhängigen 32 Game-Seeds pro Ausgangsgruppe wurden **576 vollständige reale PVE-Duelle** gespielt: Gegner **IX und X**, die drei NPC-Entscheidungscontroller **`current`**, **`ace-targeted`** und neu **`ace-relative`**, jedes Mal gegen jeweils drei eigene, separat geprüfte Deckszenarien:

1. **`earned`:** wirklich legal aus den 32 Karrieren erworbene Decks;
2. **`proxy-ix-hard`:** bestehende originale starke Gegner-IX-Deckdefinition als legaler, aber **nicht erspielter** Spieler-Vergleichsproxy;
3. **`proxy-x-hard`:** bestehende originale starke Gegner-X-Deckdefinition als legaler, aber **nicht erspielter** Spieler-Vergleichsproxy.

Pro Szenario, Gegner und Strategie exakt **32 gepaarte Matches**, 16 vorab Trainings- und 16 unabhängige Holdout-Ursprünge. Die NPC-Policies erhalten nur ihre erlaubten eigenen/public Inputs, nicht die verborgene gegnerische Hand. Kein Eingriff in Karten, NPC-Gegnerdecks, Balance, Turnierfreischaltungen, Fusionswürfe oder Testausgänge.

## Die wichtigste neue Messung: wirkliches ACE-Auswahlverhalten

Bei insgesamt **1.014 eigenen NPC-Beschwörungssituationen mit mindestens einer tatsächlich legalen ACE-Fusion** vergleicht `ace-relative` diese Option mit dem besten ebenfalls legalen Normal-/Nicht-ACE-Zug:

- **994 Situationen (98,0 %) abgelehnt**: Die vorhandene ursprüngliche Entscheidung erhält Vorrang.
- **20 Situationen (2,0 %) als ausreichend vorteilhaft bewertet**: Die NPC-Policy wählt aus der aktuellen Hand eine zulässige ACE-Fusion.
- Der stärkste Alternativzug war in diesen erhobenen Situationen **999-mal eine Nicht-ACE-Fusion, 15-mal eine Normalbeschwörung**.
- **Alle 20 ACE-Overrides liegen bei Gegner IX** (3 bei verdienten Decks, 7 gegen IX-hard, 10 gegen X-hard). Beim bisherigen übermächtigen Gegner X wurden **0** ACE-Overrides ausgewählt.
- Diese 1.014 Entscheidungen sind wiederholte Situationen innerhalb teils desselben Spiels, **keine 1.014 unabhängigen Matches**.

**Resultat:** Die v10.7-Policy löst das in v10.6 beobachtete technische ACE-Spam-Problem und weist endlich eine **wirklich selektive** Entscheidung auf, könnte aber gerade bei X **übermäßig konservativ** sein. Dies ist ein Action-Selection- und Diagnostikerfolg, **noch kein Win-Rate-Vorteil**.

### Tatsächliche ACE-Platzierungen je Szenario und Gegner (32 Duelle pro Policy)

| Szenario / Gegner | Bestehende KI | Aggressiver ACE-Fokus | Relative ACE-KI |
|---|---:|---:|---:|
| Ehrlich erspielt / IX | 12 | 96 | **14** |
| Ehrlich erspielt / X | 0 | 96 | **0** |
| IX-hard-Proxy / IX | 27 | 96 | **30** |
| IX-hard-Proxy / X | 0 | 96 | **0** |
| X-hard-Proxy / IX | 38 | 96 | **40** |
| X-hard-Proxy / X | 0 | 96 | **0** |
| **Gesamt ACE-Platzierungen** | **77** | **576** | **84** |

Die 84 unterscheiden sich von exakt 77+20, weil Original- und neue Auswahl andere spätere Hand- und Spielsequenzen hervorrufen; ein Override ist weder notwendigerweise eine zusätzliche ACE-Platzierung noch ein unabhängiges Match.

## Echte Turniersiege (576 unabhängige gepaarte NPC-Vergleiche)

| Spielerdeck-Szenario / NPC-Stufe | Bestehende KI | Aggressive ACE-KI | Relative ACE-KI |
|---|---:|---:|---:|
| Erspieltes V/VI-Deck vs. **IX** | 32/32 | 31/32 | **32/32** |
| Erspieltes V/VI-Deck vs. **X** | 32/32 | 32/32 | **32/32** |
| IX-hard-Proxy vs. **IX** | 32/32 | 32/32 | **32/32** |
| IX-hard-Proxy vs. **X** | 32/32 | 32/32 | **32/32** |
| X-hard-Proxy vs. **IX** | **3/32** | 2/32 | **3/32** |
| X-hard-Proxy vs. **X** | 32/32 | 32/32 | **32/32** |
| **Gesamt je NPC-Policy (192 Duelle)** | **163/192** | 161/192 | **163/192** |

**Unabhängiger Holdout:** Je 16 gesonderte Ursprungsspiele pro Szenario und NPC-Boss. **`ace-relative` hat gegenüber `current` in keinem Holdout-Szenario eine gepaarte Gewinn-/Verluständerung**: jeweils 0 besser, 0 schlechter, 16 gleich. Diese Nichtdifferenz gilt auch auf der Trainingshälfte. Die aggressive Policy verschlechterte jeweils ein zusätzliches Match bei Gegner IX in den härtesten Konstellationen.

**Bewertung:** **`qualified=false` für eine produktive Leistungsverbesserung**. Die v10.7-Auswahl hat gute Zurückhaltung, aber weder einen einzigen zusätzlichen NPC-Gesamtsieg noch ein unabhängiges Holdout-Signal für höheren Spielnutzen. Gleiche Siegzahl kann bei immer fast sicheren X-Siegen zudem keine Fairness belegen.

## Sicherheits- und Qualitätssicherung

- Die Haupt-Action [#39394292548](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292548) lief vollständig durch: **50/50** Regel-/Deck-/Fusions-/Gameplay-Regressionen und **20/20** bestehende KI-Tests.
- Zusätzliche [Code-/Strategie-Action #39394292746](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292746) und [Browser-Smoke #39394292508](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39394292508) ebenfalls **SUCCESS**.
- Alle **576 NPC-Matches** endeten mit den Original-Spielaktionen ohne protokollierte unzulässige Aktionen und ohne einen Angriff→DEF-Wechsel desselben Monsters im selben Zug.
- **`main`, die aktive NPC-Entscheidungsfunktion, Karten-/ACE-Werte, Loot, XP, Shop/Shard/Perks/Quests und vorhandene Spielersaves blieben vollständig unverändert.** Neue Daten, Experimental-AI, Tests und Berichte liegen nur auf `development`.

## Vorschlag für v10.8: Wertigkeit und tatsächliche NPC-Fairness

1. **Alternative nicht nur heuristisch schätzen, sondern exakt gegen echte Zugauflösungen prüfen:** Auf gepaarten **kopierten legalen Game-Snapshots** die identische eigene Hand/Feldlage kontrolliert in ACE-, bestes Nicht-ACE-Fusions- und bestes Normalspiel aufteilen, die **Original-Fusionswürfel** jedes Arms getrennt auflösen und tatsächlichen Boardwert, Lebenspunkte, verbrauchte Materialien und spätere verfügbare Aktionen vergleichen. Das ist ein Forschungs-**Counterfactual außerhalb** der Live-Entscheidung, darf nicht als hellseherisches NPC-Wissen verwendet werden.
2. **ACE-Fokus gegen ACE-Aktivierung abwägen:** Besonders Gegner X spielt unter dem aktuellen relativen Score wieder nie ein ACE. Wenn ein legaler ACE-Zug gegen alternative Fusionen keinen unmittelbaren Vorteil hat, soll NPC dennoch langfristige ACE-Aufbauentscheidungen erwägen dürfen; das muss gegen weitere wirkliche Kämpfe und nicht als geschenkte Stats/Draws getestet werden.
3. **Schwierigkeit tatsächlich kalibrieren:** Unter Original-Rewards erreichten 30/32 Karrieren nur VI, während IX/X gegen IV–VI-Decks praktisch immer gewinnen. **Keine** Behauptung, das sei fair oder unerreichbar; längere echte Fortschrittskarrieren und rollenverschiedene (Predator/Defender/Soul-Drain/Resonator) legal erlangte Decks sind nötig. Beide starken NPC-Proxydecks bleiben ausdrücklich *keine* earned human profiles.
4. **Neuer unabhängiger 16+16-Paar-Holdout** mit unveränderten Kontrollarmen, unveränderten Karten/Shop-/Roll-/ACE-Regeln, echten Sieg- und Materialeffizienz-Zielen und nicht nur ACE-Häufigkeit.
5. **Keine automatische Produktivfreigabe:** Bis ein echter strategischer Nutzen und faire Gegnerstärken gesondert nachgewiesen sind, ist weder `ace-relative` noch der alte `ace-targeted`-Controller für aktive NPCs freigegeben.

**Fazit:** Die ACE-Entscheidung wurde zum ersten Mal relativ zu tatsächlich legalen Alternativzügen geprüft und beherrscht jetzt gezielten Verzicht. **Der strategische Erfolg bleibt jedoch unverändert**; weitere Fusions-Counterfactual- und Fairnesstests sind erforderlich.
