# Arcane Duel KI v18.5 – Regelwissensatlas (Stand 30.10.2026)

**Autorität:** Ausgeführte Game-Engine auf `development`. Der Katalog erfindet keine neuen Spielregeln. Er prüft vor dem Training, dass alle genannten Engine-Anker weiterhin vorhanden sind. Jede Aussage bezeichnet eine beobachtbare Mechanik; im Zweifelsfall gilt der echte Funktionsaufruf (und nicht eine nachgerechnete Ersatzformel).

| Bereich | Regelkennung | Implementierung / überprüfbares Wissen | Originaldatei |
|---|---|---|---|
| game | `turn` | Realer Zugwechsel inklusive Ziehen, Reset und Runden-Zerfall; keine künstlichen Gegnerzüge. | `assets/game.js` → `function coreAdvanceTurn(g)` |
| game | `decay` | Arena-Zerfall und Siegerermittlung ausschließlich durch Engine. | `assets/game.js` → `function settleRound(g)` |
| game | `win` | Gewinnstatus nur über Game-State winner oder Engine-Funktion. | `assets/game.js` → `function conclude(` |
| game | `attack-legal` | Angriffsfähigkeit aus exakter Engine, berücksichtigt Einsatzverzögerung und Spezialfälle. | `assets/game.js` → `function canAttack(g,c)` |
| game | `attack-apply` | Angriff über echte Schaden-/Zerstörungsfunktion, auch Gleichstand. | `assets/game.js` → `function attack(g,ai,di)` |
| game | `position` | Positionswechsel muss legal sein und wird im Zustand verbraucht. | `assets/game.js` → `function switchPosition(g,idx)` |
| game | `damage` | Schilde absorbieren Schaden vor LP-Verlust. | `assets/game.js` → `function damagePlayer(g,id,amount)` |
| game | `opening` | Eröffnungsschutz nur bei exakter Engine-Bedingung. | `assets/game.js` → `function openingGuardEligible(g,c)` |
| game | `fatigue` | Angriffserschöpfung ist eine tatsächliche Zustandsänderung. | `assets/game.js` → `a.attackFatigue=(a.attackFatigue//0)+fatigue` |
| game | `predator-growth` | Predator-Entwicklung wird für effektive Angriffsstärke der Engine übernommen. | `assets/game.js` → `function predatorDevelopmentPct(c)` |
| game | `summon` | Normale Beschwörung per offizieller Vorbereitung. | `assets/game.js` → `function prepareNormal(g,uid)` |
| game | `placement` | Feldplatzierung und Feldfusion erfolgen mit legaler Pending-Funktion. | `assets/game.js` → `function corePlacePending(g,idx)` |
| game | `hand-fusion` | Handfusion und Vorlage müssen exakt legal sein. | `assets/game.js` → `function prepareHandFusion(g,uids,choice)` |
| game | `fusion-options` | Vorlagenverfügbarkeit abhängig von realem Fusion-Deck statt angenommener Ergebnisse. | `assets/game.js` → `function fusionOptions(g,levels,materials=[])` |
| game | `ai-action` | Kandidaten nur über tatsächliche Spielaktion validieren. | `assets/game.js` → `function applyAiAction(g,a)` |
| fusion | `level` | Fusionslevel aus Kern-/Abstands-/Material- und Sonderregeln. | `assets/fusion-rework-v113.js` → `function calculate(levels,g,materials=[])` |
| fusion | `core` | Auswahl der Kernkarte und Straßen-Ausnahme. | `assets/fusion-rework-v113.js` → `function coreIndex(levels,materials,g,street)` |
| fusion | `distance` | Gewinn/Verlust durch Abstand der Materiallevel. | `assets/fusion-rework-v113.js` → `function pairGain(core,other)` |
| fusion | `resonator-lineage` | Resonator-Abstammung verhindert mehrfachen Kettenbonus. | `assets/fusion-rework-v113.js` → `function resonatorLineage(materials)` |
| fusion | `quality` | Qualität und Straßenmuster; keine eigenständige Schätzung der Würfe. | `assets/fusion-rework-v113.js` → `math.setQuality(function(levels,elements=[])` |
| fusion | `earned-quality` | Geerbte Qualität und echte Fertigkeitsboni. | `assets/fusion-rework-v113.js` → `math.setTuned(function(g,levels,elements=[],materials=[` |
| fusion | `option-filter` | Überschriebene Live-Fusionsvorschau ist autoritativ. | `assets/fusion-rework-v113.js` → `fusionOptions=function(g,levels,materials=[])` |
| roles | `inheritance` | Rollenvererbung, Specialist-Mehrheit und Neutralfälle. | `assets/arcane-role-fusions.js` → `function inheritance(materials)` |
| roles | `imprint` | Rollenaufprägung und Bedingungen für Seelenzehrer-Erweckung. | `assets/arcane-role-fusions.js` → `function imprint(g,materials)` |
| roles | `soul-odds` | Erweckungschancen aus tatsächlichen Materialien. | `assets/arcane-role-fusions.js` → `function soulOdds(materials)` |
| roles | `bond` | Nur dynamische, benachbarte Wächter-/Seelenzehrer-Paare, jeweils 1:1. | `assets/essence-combat.js` → `function soulBonds(g,owner)` |
| roles | `bond-charge` | Seelenbund-Energie aus echter abgewehrter Schadensmenge und Rundengrenze. | `assets/essence-combat.js` → `function bondCharge(g,owner,pair,original,withBond,pred` |
| roles | `def-armor` | DEF-Rüstung mit tatsächlicher Predator-Durchdringung. | `assets/essence-combat.js` → `const mitigation=isDefender(d)?Math.max(0,(bond?.35:.20` |
| roles | `counterstrike` | Gegenschlag wird nur bei Engine-Überleben ausgeführt. | `assets/essence-combat.js` → `const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35` |
| roles | `soul-absorb` | Passiver Drain/Brand und reale Speicherung; keine erfundenen Schäden. | `assets/essence-combat.js` → `function absorb(g,creature,owner)` |
| roles | `soul-storage` | Tatsächliche Speicherlimits und Konversionsfaktoren. | `assets/essence-combat.js` → `function storeDrainedEnergy(g,creature,owner,earned)` |
| roles | `soul-decay` | Seelenzerfall, Cooldowns und Zustandsvariablen. | `assets/essence-combat.js` → `function soulDecay(g,c,owner)` |
| roles | `soul-active-raid` | Nur die tatsächlich unterstützten Forschungssoul-Aktionen. | `assets/essence-combat.js` → `function researchSoulAction(g,action)` |
| roles | `soul-condense` | Kondensation existiert im Spiel; Forschungskandidaten nicht pauschal erlaubt. | `assets/essence-combat.js` → `function condense(idx)` |
| roles | `soul-discharge` | Forschungsentladung wird ausschließlich über reale Action-Funktion geprüft. | `assets/essence-combat.js` → `if(action.type==='soul-discharge')` |
| roles | `soul-raid` | Forschungs-Seelenraub ist DEF-gebunden und prüft Cooldown/Ziel. | `assets/essence-combat.js` → `if(action.type==='soul-raid')` |
| roles | `guardian-heal` | Tatsächliche Beginn-des-Zugs-Heilung, nicht hypothetisch vorgezogen. | `assets/essence-combat.js` → `for(const guardian of team.filter(c=>roleOf(c)==='guard` |
| roles | `predator-swarm` | Predator-Schwarmwert aus aktiven Feldmitgliedern. | `assets/essence-combat.js` → `const swarm=Math.min(5,deployed)*percent;` |
| research | `training-modes` | Aktuelle symmetrische Forschungsregeln und Schutz vor doppeltem Wächter-Nerf. | `tests/helpers/research-ai-v184.cjs` → `function mode()` |

## Mechanik-Kenntnis in der tatsächlichen Forschungsentscheidung

1. Vor einer Entscheidung liest die KI den **wirklich vorhandenen** öffentlichen Spielzustand (Rollen, Positionen, Feld, LP/Schild, aktive Seelenbünde, Seelenenergie, Cooldowns und Angriffsbereitschaft). Keine Karten aus verdeckten Gegnerhänden.
2. Alle Alternativen werden ausschließlich mit dem Original-`applyAiAction(game, action)` beziehungsweise `attack(game,ai,di)` auf Spielstandkopien getestet. Gültige Vorschau heißt **funktional angewendet**, nicht mathematisch vermutet.
3. Legale Mehrfachangriffe werden nur innerhalb desselben Zuges auf kopierten Zuständen geprüft. Es wird **kein** Gegnerzug vorgetäuscht, kein geheimes Nachziehen simuliert und nicht behauptet, die Zukunft zu kennen.
4. Die strategischen Bewertungen sind als **Hypothesen** (nicht Regeln) markiert. Ein Gewinn mittels `winner` hat Vorrang, anschließend werden reale LP-, Schild-, Karten-, ATK-, DEF- und Seelenbund-Veränderungen abgewogen. Ein sicherer vorhandener Finisher wird nie durch ein anderes gleichwertiges Ziel ersetzt.
5. Die Rolle der Mechaniken über mehrere Runden wird erst nach echte, regelgetreue Turn-Transition und ohne versteckte Information modelliert; diese v18.5-Phase verspricht keine vollständige mehrzügige Zukunftssimulation.

## Abgrenzung und unbekannte Folgen

Dieser atlas deckt **den Solo-PvE-Selbstspiel-/KI-Entscheidungspfad** ab. Er ist kein Beweis für vollständige Gleichheit mit 2v2, Duo-Netzwerkregeln, UI-Animationslogik, Shop-Ökonomie oder ungezählten Kartenspezialfällen. Aktive Kondensation ist eine Spielmechanik, die symmetrische Forschungs-API unterstützt aber derzeit nur `soul-raid` und `soul-discharge`; deshalb werden keine Kondensations-Forschungshandlungen erfunden. Auch die Beschreibung der ausgeführten legalen Aktion allein beweist keine bessere Langzeitstrategie: Das wird über VALIDATION/HOLDOUT und Champion-Gates geprüft.

## Training/Prüfung

Baseline = vollständige optimierte v18.4-Entscheidungslogik, Optimized = v18.5-Wissensadapter. Matching identischer Seeds/Sitze, 23.040 Duelle pro Arm, TRAIN-only-Lernen, HOLDOUT verschlossen, Champion-Evidenzregeln unverändert. Kein Produktiv-Import.
