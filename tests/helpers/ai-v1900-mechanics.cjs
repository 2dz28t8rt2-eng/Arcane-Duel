'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const RULES=Object.freeze([
 {
  "scope": "game",
  "id": "turn",
  "file": "assets/game.js",
  "anchor": "function coreAdvanceTurn(g)",
  "description": "Realer Zugwechsel inklusive Ziehen, Reset und Runden-Zerfall; keine künstlichen Gegnerzüge."
 },
 {
  "scope": "game",
  "id": "decay",
  "file": "assets/game.js",
  "anchor": "function settleRound(g)",
  "description": "Arena-Zerfall und Siegerermittlung ausschließlich durch Engine."
 },
 {
  "scope": "game",
  "id": "win",
  "file": "assets/game.js",
  "anchor": "function conclude(",
  "description": "Gewinnstatus nur über Game-State winner oder Engine-Funktion."
 },
 {
  "scope": "game",
  "id": "attack-legal",
  "file": "assets/game.js",
  "anchor": "function canAttack(g,c)",
  "description": "Angriffsfähigkeit aus exakter Engine, berücksichtigt Einsatzverzögerung und Spezialfälle."
 },
 {
  "scope": "game",
  "id": "attack-apply",
  "file": "assets/game.js",
  "anchor": "function attack(g,ai,di)",
  "description": "Angriff über echte Schaden-/Zerstörungsfunktion, auch Gleichstand."
 },
 {
  "scope": "game",
  "id": "position",
  "file": "assets/game.js",
  "anchor": "function switchPosition(g,idx)",
  "description": "Positionswechsel muss legal sein und wird im Zustand verbraucht."
 },
 {
  "scope": "game",
  "id": "damage",
  "file": "assets/game.js",
  "anchor": "function damagePlayer(g,id,amount)",
  "description": "Schilde absorbieren Schaden vor LP-Verlust."
 },
 {
  "scope": "game",
  "id": "opening",
  "file": "assets/game.js",
  "anchor": "function openingGuardEligible(g,c)",
  "description": "Eröffnungsschutz nur bei exakter Engine-Bedingung."
 },
 {
  "scope": "game",
  "id": "fatigue",
  "file": "assets/game.js",
  "anchor": "a.attackFatigue=(a.attackFatigue||0)+fatigue",
  "description": "Angriffserschöpfung ist eine tatsächliche Zustandsänderung."
 },
 {
  "scope": "game",
  "id": "predator-growth",
  "file": "assets/game.js",
  "anchor": "function predatorDevelopmentPct(c)",
  "description": "Predator-Entwicklung wird für effektive Angriffsstärke der Engine übernommen."
 },
 {
  "scope": "game",
  "id": "summon",
  "file": "assets/game.js",
  "anchor": "function prepareNormal(g,uid)",
  "description": "Normale Beschwörung per offizieller Vorbereitung."
 },
 {
  "scope": "game",
  "id": "placement",
  "file": "assets/game.js",
  "anchor": "function corePlacePending(g,idx)",
  "description": "Feldplatzierung und Feldfusion erfolgen mit legaler Pending-Funktion."
 },
 {
  "scope": "game",
  "id": "hand-fusion",
  "file": "assets/game.js",
  "anchor": "function prepareHandFusion(g,uids,choice)",
  "description": "Handfusion und Vorlage müssen exakt legal sein."
 },
 {
  "scope": "game",
  "id": "fusion-options",
  "file": "assets/game.js",
  "anchor": "function fusionOptions(g,levels,materials=[])",
  "description": "Vorlagenverfügbarkeit abhängig von realem Fusion-Deck statt angenommener Ergebnisse."
 },
 {
  "scope": "game",
  "id": "ai-action",
  "file": "assets/game.js",
  "anchor": "function applyAiAction(g,a)",
  "description": "Kandidaten nur über tatsächliche Spielaktion validieren."
 },
 {
  "scope": "fusion",
  "id": "level",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "function calculate(levels,g,materials=[])",
  "description": "Fusionslevel aus Kern-/Abstands-/Material- und Sonderregeln."
 },
 {
  "scope": "fusion",
  "id": "core",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "function coreIndex(levels,materials,g,street)",
  "description": "Auswahl der Kernkarte und Straßen-Ausnahme."
 },
 {
  "scope": "fusion",
  "id": "distance",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "function pairGain(core,other)",
  "description": "Gewinn/Verlust durch Abstand der Materiallevel."
 },
 {
  "scope": "fusion",
  "id": "resonator-lineage",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "function resonatorLineage(materials)",
  "description": "Resonator-Abstammung verhindert mehrfachen Kettenbonus."
 },
 {
  "scope": "fusion",
  "id": "quality",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "math.setQuality(function(levels,elements=[])",
  "description": "Qualität und Straßenmuster; keine eigenständige Schätzung der Würfe."
 },
 {
  "scope": "fusion",
  "id": "earned-quality",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "math.setTuned(function(g,levels,elements=[],materials=[])",
  "description": "Geerbte Qualität und echte Fertigkeitsboni."
 },
 {
  "scope": "fusion",
  "id": "option-filter",
  "file": "assets/fusion-rework-v113.js",
  "anchor": "fusionOptions=function(g,levels,materials=[])",
  "description": "Überschriebene Live-Fusionsvorschau ist autoritativ."
 },
 {
  "scope": "roles",
  "id": "inheritance",
  "file": "assets/arcane-role-fusions.js",
  "anchor": "function inheritance(materials)",
  "description": "Rollenvererbung, Specialist-Mehrheit und Neutralfälle."
 },
 {
  "scope": "roles",
  "id": "imprint",
  "file": "assets/arcane-role-fusions.js",
  "anchor": "function imprint(g,materials)",
  "description": "Rollenaufprägung und Bedingungen für Seelenzehrer-Erweckung."
 },
 {
  "scope": "roles",
  "id": "soul-odds",
  "file": "assets/arcane-role-fusions.js",
  "anchor": "function soulOdds(materials)",
  "description": "Erweckungschancen aus tatsächlichen Materialien."
 },
 {
  "scope": "roles",
  "id": "bond",
  "file": "assets/essence-combat.js",
  "anchor": "function soulBonds(g,owner)",
  "description": "Nur dynamische, benachbarte Wächter-/Seelenzehrer-Paare, jeweils 1:1."
 },
 {
  "scope": "roles",
  "id": "bond-charge",
  "file": "assets/essence-combat.js",
  "anchor": "function bondCharge(g,owner,pair,original,withBond,predatorPierce)",
  "description": "Seelenbund-Energie aus echter abgewehrter Schadensmenge und Rundengrenze."
 },
 {
  "scope": "roles",
  "id": "def-armor",
  "file": "assets/essence-combat.js",
  "anchor": "const mitigation=isDefender(d)?Math.max(0,(bond?.35:.20)-predatorPierce):0;",
  "description": "DEF-Rüstung mit tatsächlicher Predator-Durchdringung."
 },
 {
  "scope": "roles",
  "id": "counterstrike",
  "file": "assets/essence-combat.js",
  "anchor": "const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);",
  "description": "Gegenschlag wird nur bei Engine-Überleben ausgeführt."
 },
 {
  "scope": "roles",
  "id": "soul-absorb",
  "file": "assets/essence-combat.js",
  "anchor": "function absorb(g,creature,owner)",
  "description": "Passiver Drain/Brand und reale Speicherung; keine erfundenen Schäden."
 },
 {
  "scope": "roles",
  "id": "soul-storage",
  "file": "assets/essence-combat.js",
  "anchor": "function storeDrainedEnergy(g,creature,owner,earned)",
  "description": "Tatsächliche Speicherlimits und Konversionsfaktoren."
 },
 {
  "scope": "roles",
  "id": "soul-decay",
  "file": "assets/essence-combat.js",
  "anchor": "function soulDecay(g,c,owner)",
  "description": "Seelenzerfall, Cooldowns und Zustandsvariablen."
 },
 {
  "scope": "roles",
  "id": "soul-active-raid",
  "file": "assets/essence-combat.js",
  "anchor": "function researchSoulAction(g,action)",
  "description": "Nur die tatsächlich unterstützten Forschungssoul-Aktionen."
 },
 {
  "scope": "roles",
  "id": "soul-condense",
  "file": "assets/essence-combat.js",
  "anchor": "function condense(idx)",
  "description": "Kondensation existiert im Spiel; Forschungskandidaten nicht pauschal erlaubt."
 },
 {
  "scope": "roles",
  "id": "soul-discharge",
  "file": "assets/essence-combat.js",
  "anchor": "if(action.type==='soul-discharge')",
  "description": "Forschungsentladung wird ausschließlich über reale Action-Funktion geprüft."
 },
 {
  "scope": "roles",
  "id": "soul-raid",
  "file": "assets/essence-combat.js",
  "anchor": "if(action.type==='soul-raid')",
  "description": "Forschungs-Seelenraub ist DEF-gebunden und prüft Cooldown/Ziel."
 },
 {
  "scope": "roles",
  "id": "guardian-heal",
  "file": "assets/essence-combat.js",
  "anchor": "for(const guardian of team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def'))",
  "description": "Tatsächliche Beginn-des-Zugs-Heilung, nicht hypothetisch vorgezogen."
 },
 {
  "scope": "roles",
  "id": "predator-swarm",
  "file": "assets/essence-combat.js",
  "anchor": "const swarm=Math.min(5,deployed)*percent;",
  "description": "Predator-Schwarmwert aus aktiven Feldmitgliedern."
 },
 {
  "scope": "research",
  "id": "training-modes",
  "file": "tests/helpers/research-ai-v184.cjs",
  "anchor": "function mode()",
  "description": "Aktuelle symmetrische Forschungsregeln und Schutz vor doppeltem Wächter-Nerf."
 }
]);
const STRATEGY_NOT_RULES=Object.freeze({enemyLP:.26,ownLP:-.59,enemyShield:.14,ownShield:-.22,enemyRemoved:150,ownRemoved:-520,enemyAtkRemoved:.16,enemyDefRemoved:.06,ownAtkDelta:.08,ownDefDelta:.12,soulChange:.15,bondChange:120,bondReserveChange:.18});
function verifySources(root=path.resolve(__dirname,'../..')){
 for(const rule of RULES){const src=fs.readFileSync(path.join(root,rule.file),'utf8');
 assert.ok(src.includes(rule.anchor),'v18.8 unknown/changed mechanic '+rule.id+' at '+rule.file);}
 return {verified: RULES.length,scopes:[...new Set(RULES.map(x=>x.scope))]};
}
const plannerSource="\nconst defenseCfg=scene.rolePolicy;\nif(game===g&&game.active===learner&&game.winner===null&&!game.pending&&\n game.aiPhase===\"attacks\"&&scene.studyStage>=4&&[\"guardian\",\"soul\"].includes(scene.candidateRole)&&\n defenseCfg?.defenderTacticalOverride){\n counter.v1900TacticalChecks=(counter.v1900TacticalChecks||0)+1;\n const me=game.active,op=1-me;\n const own=game.players[me],foe=game.players[op];\n const previous=baseChoose(game,policy);\n if(previous&&[\"attack\",\"soul-raid\",\"soul-discharge\",\"end\"].includes(previous.type)){\n  // Every numeric mechanic result is read from an actual live-engine clone.\n  const roleOf=c=>role(c);\n  const bonds=st=>window.ArcaneEssenceCombat.soulBonds(st,me);\n  const observe=st=>{\n   const a=st.players[me],e=st.players[op];\n   const cards=(p)=>p.field.filter(Boolean);\n   const signature=p=>cards(p).map(c=>({uid:c.uid,mode:c.mode,role:roleOf(c),\n    atk:dataOf(c).atk,def:dataOf(c).def,soul:c.essenceCombat?.soul||0,\n    condensed:c.essenceCombat?.condensed||0,cd:c.essenceCombat?.cooldown||0,\n    raidCooldown:c.essenceCombat?.raidCooldown||0})); \n   const ownCards=signature(a),enemyCards=signature(e);\n   const links=bonds(st).filter(b=>b.guardian?.mode===\"def\"&&b.soul?.mode===\"def\");\n   return {ownLP:a.lp,enemyLP:e.lp,ownShield:a.shield||0,enemyShield:e.shield||0,\n    ownCards,enemyCards,\n    ownAtk:ownCards.reduce((n,c)=>n+c.atk,0),\n    ownDef:ownCards.reduce((n,c)=>n+c.def+c.condensed+c.soul,0),\n    enemyAtk:enemyCards.reduce((n,c)=>n+c.atk,0),\n    enemyDef:enemyCards.reduce((n,c)=>n+c.def+c.condensed+c.soul,0),\n    soulReserve:ownCards.reduce((n,c)=>n+c.soul,0),\n    bondCount:links.length,\n    bondReserve:links.reduce((n,b)=>n+(b.soul?.essenceCombat?.soul||0),0),\n    winner:st.winner};\n  };\n  const start=observe(game);\n  const measure=(st)=>{\n   const s=observe(st);\n   return {s,enemyLP:start.enemyLP-s.enemyLP,ownLP:start.ownLP-s.ownLP,\n    enemyShield:start.enemyShield-s.enemyShield,ownShield:start.ownShield-s.ownShield,\n    enemyRemoved:start.enemyCards.length-s.enemyCards.length,\n    ownRemoved:start.ownCards.length-s.ownCards.length,\n    enemyAtkRemoved:start.enemyAtk-s.enemyAtk,enemyDefRemoved:start.enemyDef-s.enemyDef,\n    ownAtkDelta:s.ownAtk-start.ownAtk,ownDefDelta:s.ownDef-start.ownDef,\n    soulChange:s.soulReserve-start.soulReserve,\n    bondChange:s.bondCount-start.bondCount,\n    bondReserveChange:s.bondReserve-start.bondReserve};\n  };\n  // Explicit strategic hypotheses, NOT invented rule values.\n  const value=(m)=>{\n   const d=m;\n   return d.enemyLP*.26-d.ownLP*.59+\n     d.enemyShield*.14-d.ownShield*.22+\n     d.enemyRemoved*150-d.ownRemoved*520+\n     d.enemyAtkRemoved*.16+d.enemyDefRemoved*.06+\n     d.ownAtkDelta*.08+d.ownDefDelta*.12+\n     d.soulChange*.15+d.bondChange*120+d.bondReserveChange*.18;\n  };\n  const candidates=st=>{\n   const a=st.players[me],e=st.players[op],attackMoves=[],soulMoves=[];\n   const targets=e.field.map((c,i)=>c?i:null).filter(i=>i!==null);\n   if(!targets.length)targets.push(null);\n   for(const [i,c] of a.field.entries()){\n    if(c&&canAttack(st,c))for(const di of targets)attackMoves.push({type:\"attack\",ai:i,di});\n   }\n   if(st.strategicTraining?.symmetricSides){\n    for(const [i,c] of a.field.entries()){\n     if(!c||roleOf(c)!==\"soul\"||c.mode!==\"def\")continue;\n     const layer=c.essenceCombat||{};\n     if(layer.lastSoulAction===st.turn)continue;\n     if((layer.raidCooldown||0)===0){\n      for(const [j,t] of e.field.entries())if(t?.card)\n       soulMoves.push({type:\"soul-raid\",idx:i,target:j});\n     }\n     if((layer.soul||0)>=40&&layer.lastDischarge!==st.turn)\n       soulMoves.push({type:\"soul-discharge\",idx:i});\n    }\n   }\n   // Under a bounded search, preserve all direct finisher candidates and\n   // genuine active Soul options before less urgent monster-target attacks.\n   const direct=attackMoves.filter(m=>m.di===null);\n   const targeted=attackMoves.filter(m=>m.di!==null).sort((x,y)=>{\n     const a=e.field[x.di],b=e.field[y.di];\n     const threat=c=>c?Math.max(0,dataOf(c).atk)+Math.max(0,dataOf(c).def)*.35:0;\n     return threat(b)-threat(a)||x.ai-y.ai||x.di-y.di;\n    });\n   return [...direct,...soulMoves,...targeted];\n  };\n  const inspect=move=>{\n   const z=JSON.parse(JSON.stringify(game));\n   // This is the production research action executor, including active Soul abilities.\n   if(!baseApply(z,move))return null;\n   counter.v1900LegalTrials=(counter.v1900LegalTrials||0)+1;\n   counter.v1900BoardEvaluations=(counter.v1900BoardEvaluations||0)+1;\n   const first=measure(z),isWin=z.winner===me;\n   let score=isWin?1000000:value(first);\n   let seqWin=false,followUpDamage=0,secondMove=null;\n   let bestSecond=-Infinity,sequenceDepth=0,thirdMove=null,thirdChecks=0;\n   if(!isWin&&z.winner===null&&z.active===me){\n    // More legal same-turn continuations only near real, visible LP danger;\n    // never invent a future opponent turn, deck draws, or unrevealed cards.\n    const urgent=z.players[op].lp<=4000||z.players[me].lp<=3000;\n    const threeMoveWindow=z.players[op].lp<=3000;\n    const budget=urgent?16:10;\n    let checks=0;\n    for(const next of candidates(z)){\n     if(checks++>=budget)break;\n     const f=JSON.parse(JSON.stringify(z));\n     if(!baseApply(f,next))continue;\n     counter.v1900SequenceTrials=(counter.v1900SequenceTrials||0)+1;\n     const m=measure(f),won=f.winner===me;\n     let thirdWin=false,thirdAction=null;\n     if(!won&&threeMoveWindow&&f.winner===null&&f.active===me&&\n      (m.enemyLP>0||m.enemyRemoved>0)&&checks<=6&&thirdChecks<12){\n      for(const third of candidates(f)){\n       if(thirdChecks++>=12)break;\n       const h=JSON.parse(JSON.stringify(f));\n       if(!baseApply(h,third))continue;\n       counter.v1900ThirdActionTrials=(counter.v1900ThirdActionTrials||0)+1;\n       if(h.winner===me){thirdWin=true;thirdAction=third;break;}\n      }\n     }\n     const val=won?850000:thirdWin?775000:value(m);\n     if(val>bestSecond){\n      bestSecond=val;seqWin=won||thirdWin;sequenceDepth=won?2:thirdWin?3:0;\n      followUpDamage=m.enemyLP;secondMove=next;thirdMove=thirdAction;\n     }\n    }\n    if(bestSecond>-Infinity)score+=bestSecond*.33;\n   }\n   if(start.bondCount>0||first.bondChange)counter.v1900BondEvaluations=(counter.v1900BondEvaluations||0)+1;\n   if(seqWin)counter.v1900SequenceFinishers=(counter.v1900SequenceFinishers||0)+1;\n   if(sequenceDepth===3)counter.v1900ThreeActionFinders=(counter.v1900ThreeActionFinders||0)+1;\n   const reason=isWin?\"visible-finisher\":sequenceDepth===3?\"three-action-finisher\":seqWin?\"two-attack-finisher\":\n    first.bondChange>0?\"bond-preservation\":first.enemyAtkRemoved>100?\"safe-threat-removal\":\n    first.enemyLP>0?\"lp-pressure\":\"board-control\";\n   return {score,reason,immediateWin:isWin,sequenceWin:seqWin,\n    first,secondMove,thirdMove,sequenceDepth:isWin?1:sequenceDepth||1,followUpDamage};\n  };\n  if(previous.type===\"end\")counter.v1900EndTurnChecks=(counter.v1900EndTurnChecks||0)+1;\n  const original=previous.type===\"end\"?null:inspect(previous);\n  if(original?.immediateWin){\n   counter.v1900SafeFinisherKept=(counter.v1900SafeFinisherKept||0)+1;\n  }else{\n   let best=null,result=null,tries=0;\n   for(const move of candidates(game)){\n    if(tries++>=24)break;\n    const candidate=inspect(move);\n    if(candidate&&(!result||candidate.score>result.score)){\n     result=candidate;best=move;\n    }\n    if(candidate?.immediateWin)break;\n   }\n   if(best&&result){\n    const changed=JSON.stringify(best)!==JSON.stringify(previous);\n    const margin=result.score-(original?.score??-25);\n    const winImproved=result.immediateWin||result.sequenceWin&&!original?.sequenceWin;\n    const threshold=previous.type===\"end\"?150:!original?80:110;\n    const baselineAccept=winImproved||(!original?.sequenceWin&&result.score>=(previous.type===\"end\"?150:40)&&margin>=threshold);\n    // Research-only: do not replace a selected Soul discharge with an\n    // unproven raid, unless a legal cloned outcome confirms victory.\n    const protectSoul=previous.type===\"soul-discharge\"&&best.type!==\"soul-discharge\"&&\n      !result.immediateWin&&!result.sequenceWin;\n    if(changed&&protectSoul)counter.v1900SoulDischargeProtected=(counter.v1900SoulDischargeProtected||0)+1;\n    const safeAttack=previous.type===\"attack\"&&best.type===\"attack\"&&\n      result.first.enemyRemoved>0&&result.first.enemyAtkRemoved>=100&&\n      result.first.ownRemoved===0&&result.first.ownLP<=0&&result.first.bondChange>=0&&\n      (result.sequenceWin||!original?.sequenceWin)&&result.score>=60&&margin>=65;\n    const safeEnd=previous.type===\"end\"&&\n      result.first.ownRemoved===0&&result.first.ownLP<=0&&result.first.bondChange>=0&&\n      (result.first.enemyRemoved>0||result.first.enemyLP>0)&&result.score>=80&&margin>=75;\n    const extraSafeAttack=changed&&!baselineAccept&&safeAttack;\n    const extraSafeEnd=changed&&!baselineAccept&&safeEnd;\n    if(!changed||protectSoul||(!baselineAccept&&!extraSafeAttack&&!extraSafeEnd))\n     counter.v1900RejectedLowValue=(counter.v1900RejectedLowValue||0)+1;\n    if(changed&&!protectSoul&&(baselineAccept||extraSafeAttack||extraSafeEnd)){\n     if(extraSafeAttack)counter.v1900SafeAttackPromotions=(counter.v1900SafeAttackPromotions||0)+1;\n     if(extraSafeEnd)counter.v1900SafeEndPromotions=(counter.v1900SafeEndPromotions||0)+1;\n     if(previous.type===\"end\")counter.v1900EndTurnRescues=(counter.v1900EndTurnRescues||0)+1;\n     counter.v1900TacticalOverrides=(counter.v1900TacticalOverrides||0)+1;\n     counter.v1900FinisherOverrides=(counter.v1900FinisherOverrides||0)+\n       Number(result.immediateWin||result.sequenceWin);\n     counter.v1900ThreatRemoved=(counter.v1900ThreatRemoved||0)+Number(result.first.enemyAtkRemoved>100);\n     counter.v1900SequenceWinChoices=(counter.v1900SequenceWinChoices||0)+Number(result.sequenceWin);\n     const logs=counter.v1900DecisionTraces||(counter.v1900DecisionTraces=[]);\n     if(logs.length<6)logs.push({\n      turn:game.turn,stage:scene.studyStage,role:scene.candidateRole,\n      reason:result.reason,\n      previous:{type:previous.type,ai:previous.ai??null,di:previous.di??null},\n      chosen:best,attackerUid:own.field[best.ai??best.idx]?.uid??null,\n      targetUid:best.di===null?null:foe.field[best.di??best.target]?.uid??null,\n      enemyLP:foe.lp,ownLP:own.lp,score:result.score,\n      priorScore:original?.score??null,priorImmediateWin:original?.immediateWin??false,\n      expectedDamage:result.first.enemyLP,expectedOwnLoss:result.first.ownRemoved,\n      expectedReplyLP:0,expectedReplyLoss:0,expectedVisibleReply:false,\n      expectedImmediateWin:result.immediateWin,expectedSequenceWin:result.sequenceWin,\n      expectedFollowUpDamage:result.followUpDamage,expectedSecondMove:result.secondMove,\n      expectedThirdMove:result.thirdMove,expectedDepth:result.sequenceDepth,\n      expectedBondChange:result.first.bondChange,\n      expectedBoardThreatRemoved:result.first.enemyAtkRemoved,\n      actualMechanics:{enemyShieldDamage:result.first.enemyShield,\n       ownShieldDamage:result.first.ownShield,enemyAttackReduced:result.first.enemyAtkRemoved,\n       soulReserveDelta:result.first.soulChange,bondReserveDelta:result.first.bondReserveChange,\n       ownDefDelta:result.first.ownDefDelta},\n      proof:\"engine-applyAiAction-on-clone\",strategyValuesAreRules:false});\n     return best;\n    }\n   }\n  }\n }\n}\n";
new Function('game','g','learner','scene','counter','baseChoose','baseApply','policy','canAttack','window','dataOf','role',plannerSource);
module.exports={RULES,STRATEGY_NOT_RULES,verifySources,plannerSource,plannerLines:plannerSource.trim().split('\n')};
