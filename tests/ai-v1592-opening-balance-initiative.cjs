'use strict';
/* v15.92: isolated opening attacks with the automatic starter shield removed in production.
 * Match-seeded turn-2 effectiveness variants (50/65/80%), immediate attack,
 * and full delay until turn 3, capturing board attrition and Fusion counterplay.
 * Predator/DEF, Swarm and live AI remain unchanged during research.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['baseline','t2atk50','t2atk65','t2atk80','ready2'];
const mode=process.env.ARCANE_V1592_MODE;
const replicate=Number(process.env.ARCANE_V1592_REPLICATE);
assert.ok(modes.includes(mode),'Unknown v15.92 mode');
assert.ok(Number.isInteger(replicate)&&replicate>=0&&replicate<4,'Invalid replicate');
process.env.ARCANE_V1584_MODE='baseline';
const original=fs.readFileSync;
const counts={game:0,essence:0,sim:0,seat:0,role:0};
function once(source,needle,replacement,label){
 assert.equal(source.split(needle).length,2,'v15.92 source drift: '+label);
 return source.replace(needle,replacement);
}

// Inject into the live simulation closure, not the AI's forecast clones.
const rawCausalHooks=String.raw`
inject(' counter.openingBeginning=__openingSnapshot(g);',[
 ' const __v1592Mode="__V1592_MODE__";',
 ' const __v1592OriginalEffectiveAttack=effectiveAttack;',
 ' effectiveAttack=function(game,c,target){',
 '  const raw=__v1592OriginalEffectiveAttack(game,c,target);',
 '  const factor=game.turn!==2?1:__v1592Mode==="t2atk50"?.50:',
 '    __v1592Mode==="t2atk65"?.65:__v1592Mode==="t2atk80"?.80:1;',
 '  return Math.floor(raw*factor);',
 ' };',
 ' if(__v1592Mode==="ready2"){',
 '  const __v1592OriginalCanAttack=canAttack;',
 '  canAttack=function(game,c){return game.turn>2&&__v1592OriginalCanAttack(game,c);};',
 ' }',
 ' counter.openingFieldByTurn1592={};',
 ' counter.actualFusionActionsBySeat1592=[0,0];',
 ' counter.actualFirstFusionTurnBySeat1592=[null,null];',
 ' counter.actualFirstTurnFusionActionsBySeat1592=[0,0];',
 ' counter.actualFusionsUnderPredatorPressureBySeat1592=[0,0];',
 ' counter.actualPredatorThreatTurnsBySeat1592=[0,0];',
 ' counter.actualLastThreatTurnBySeat1592=[-1,-1];',
 ' counter.openingBeginning=__openingSnapshot(g);',
 ' counter.firstAttack1585=null;counter.firstAttackKill1585=null;',
 ' counter.firstOpponentRemoval1585=null;',
 ' counter.realAttackActions1585=[0,0];',
 ' counter.realAttackLPDamage1585=[0,0];',
 ' counter.realAttackSelfDamage1585=[0,0];',
 ' counter.realAttackKills1585=[0,0];',
 ' counter.fusionActionsBySeat1592=[0,0];',
 ' counter.firstFusionTurnBySeat1592=[null,null];',
 ' counter.firstOwnTurnFusionsBySeat1592=[0,0];',
 ' counter.fusionsUnderPredatorPressureBySeat1592=[0,0];',
 ' counter.predatorThreatTurnsBySeat1592=[0,0];',
 ' counter.lastPredatorThreatTurnBySeat1592=[-1,-1];',
 ' counter.firstPredatorPlacementTurnBySeat1592=[null,null];',
 ' counter.fusionPredatorAttacksBySeat1592=[0,0];',
 ' counter.fusionPredatorKillsBySeat1592=[0,0];',
 ' const __v1585Attack=attack,__v1585Apply=applyAiAction;',
 ' attack=function(game,ai,di){',
 '  const real=game===g,owner=game.active,foe=1-owner;',
 '  const actor=real?game.players[owner].field[ai]:null;',
 '  const target=real&&Number.isInteger(di)?game.players[foe].field[di]:null;',
 '  const targetRole=target?(target.roleOverride||CARDS[target.id]?.role||"unknown"):"direct";',
 '  const targetMode=target?.mode||"none";',
 '  const targetEffectiveDEF=target?dataOf(target).def:null;',
 '  const oldEnemy=real?game.players[foe].field.filter(Boolean).map(c=>c.uid):[];',
 '  const enemyPredatorUids=real?game.players[foe].field.filter(c=>',
 '   c&&(c.roleOverride||CARDS[c.id]?.role)==="predator").map(c=>c.uid):[];',
 '  const oldSelf=real?game.players[owner].field.filter(Boolean).map(c=>c.uid):[];',
 '  const foeLP=real?game.players[foe].lp:0,selfLP=real?game.players[owner].lp:0;',
 '  const shieldBefore=real?game.players[foe].shield:0;',
 '  const power=real&&actor?effectiveAttack(game,actor,target):null;',
 '  const result=__v1585Attack(game,ai,di);',
 '  if(real&&result&&actor){',
 '   const enemyNow=new Set(game.players[foe].field.filter(Boolean).map(c=>c.uid));',
 '   const ownNow=new Set(game.players[owner].field.filter(Boolean).map(c=>c.uid));',
 '   const kills=oldEnemy.filter(uid=>!enemyNow.has(uid)).length;',
 '   const ownLosses=oldSelf.filter(uid=>!ownNow.has(uid)).length;',
 '   const dealt=Math.max(0,foeLP-game.players[foe].lp);',
 '   const suffered=Math.max(0,selfLP-game.players[owner].lp);',
 '   counter.realAttackActions1585[owner]++;',
 '   counter.realAttackLPDamage1585[owner]+=dealt;',
 '   counter.realAttackSelfDamage1585[owner]+=suffered;',
 '   counter.realAttackKills1585[owner]+=kills;',
 '   if(actor.fusion){',
 '    if(targetRole==="predator")counter.fusionPredatorAttacksBySeat1592[owner]++;',
 '    counter.fusionPredatorKillsBySeat1592[owner]+=',
 '     enemyPredatorUids.filter(uid=>!enemyNow.has(uid)).length;',
 '   }',
 '   const detail={seat:owner,turn:game.turn,power,targeted:!!target,',
 '    enemyLPDamage:dealt,selfLPDamage:suffered,enemyKills:kills,ownLosses,',
 '    enemyBoardBefore:oldEnemy.length,ownBoardBefore:oldSelf.length,',
 '    targetRole,targetMode,targetEffectiveDEF,',
 '    targetEffectiveATK:target?dataOf(target).atk:null,',
 '    attackerIsFusion:!!actor.fusion,targetIsFusion:!!target?.fusion,',
 '    defenderShieldBefore:shieldBefore,defenderShieldAfter:game.players[foe].shield,',
 '    attackerRole:actor.roleOverride||CARDS[actor.id]?.role||"unknown"};',
 '   if(!counter.firstAttack1585)counter.firstAttack1585=detail;',
 '   if(kills>0&&!counter.firstAttackKill1585)',
 '    counter.firstAttackKill1585=detail;',
 '  }',
 '  return result;',
 ' };',
 ' applyAiAction=function(game,action){',
 '  const real=game===g,owner=game.active,foe=1-owner;',
 '  const before=real?game.players[foe].field.filter(Boolean).map(c=>c.uid):[];',
 '  const enemyHasPredator=real&&game.players[foe].field.some(c=>',
 '   c&&(c.roleOverride||CARDS[c.id]?.role)==="predator");',
 '  if(real&&enemyHasPredator&&',
 '   counter.lastPredatorThreatTurnBySeat1592[owner]!==game.turn){',
 '   counter.lastPredatorThreatTurnBySeat1592[owner]=game.turn;',
 '   counter.predatorThreatTurnsBySeat1592[owner]++;',
 '  }',
 '  const result=__v1585Apply(game,action);',
 '  if(real&&result&&action?.type==="fusion"){',
 '   counter.fusionActionsBySeat1592[owner]++;',
 '   if(counter.firstFusionTurnBySeat1592[owner]===null)',
 '    counter.firstFusionTurnBySeat1592[owner]=game.turn;',
 '   if(game.turn===(game.starter===owner?1:2))',
 '    counter.firstOwnTurnFusionsBySeat1592[owner]++;',
 '   if(enemyHasPredator)',
 '    counter.fusionsUnderPredatorPressureBySeat1592[owner]++;',
 '  }',
 '  if(real&&result&&!counter.firstOpponentRemoval1585){',
 '   const after=new Set(game.players[foe].field.filter(Boolean).map(c=>c.uid));',
 '   const removed=before.filter(uid=>!after.has(uid)).length;',
 '   if(removed)counter.firstOpponentRemoval1585=',
 '    {seat:owner,turn:game.turn,action:action?.type||"unknown",removed};',
 '  }',
 '  return result;',
 ' };',
 ' counter.predatorEvolutionAssignments1592=0;',
 ' counter.predatorEvolutionTicks1592=0;',
 ' counter.predatorEvolutionAttacks1592=0;',
 ' counter.predatorEvolutionAttackAges1592={};',
 ' const __evolutionMode1592="__V1592_MODE__";',
 ' const __evolutionPlace1592=placePending,__evolutionAttack1592=attack;',
 ' placePending=function(game,idx,choice){',
 '  const result=__evolutionPlace1592(game,idx,choice),c=result?.card;',
 '  if(result&&c&&!c.fusion&&game===g&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator"&&',
 '   counter.firstPredatorPlacementTurnBySeat1592[game.active]===null)',
 '   counter.firstPredatorPlacementTurnBySeat1592[game.active]=game.turn;',
 '  if(result&&c&&!c.fusion&&__evolutionMode1592==="atk85"&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator"){',
 '   c.__v1592EvolutionAge=0;',
 '   c.__v1592EvolutionMode=__evolutionMode1592;',
 '   if(game===g)counter.predatorEvolutionAssignments1592++;',
 '  }',
 '  return result;',
 ' };',
 ' attack=function(game,ai,di){',
 '  const c=game.players[game.active].field[ai];',
 '  const evolved=Number.isInteger(c?.__v1592EvolutionAge)&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator";',
 '  const rawBefore=evolved?c.card?.atk:null;',
 '  const fatigueBefore=evolved?(c.attackFatigue||0):0;',
 '  const result=__evolutionAttack1592(game,ai,di);',
 '  if(result&&evolved){',
 '   const fatigue=(c.attackFatigue||0)-fatigueBefore;',
 '   if(fatigue>0&&game.players[game.active].field.includes(c))',
 '    c.card.atk=Math.max(0,rawBefore-fatigue);',
 '   if(game===g){',
 '    counter.predatorEvolutionAttacks1592++;',
 '    const age=c.__v1592EvolutionAge;',
 '    counter.predatorEvolutionAttackAges1592[age]=',
 '     (counter.predatorEvolutionAttackAges1592[age]||0)+1;',
 '   }',
 '  }',
 '  return result;',
 ' };'
]);
inject(' const result=baseAdvance(game);',[
 ' if(game===g&&game.turn<=8){',
 '  counter.openingFieldByTurn1592[game.turn]={turn:game.turn,active:game.active,',
 '   players:game.players.map(p=>({field:p.field.filter(Boolean).length,',
 '    hand:p.hand.length,graveyard:p.graveyard.length,',
 '    fusions:game.totalFusions[p.id],lp:p.lp,shield:p.shield}))};',
 ' }',
 ' const __v1592Owner=game.active;',
 ' const __v1592Deployed=game.players[__v1592Owner].field.filter(c=>',
 '  Number.isInteger(c?.__v1592EvolutionAge));',
 ' const result=baseAdvance(game);',
 ' if(result!==false){',
 '  for(const c of __v1592Deployed){',
 '   if(game.players[__v1592Owner].field.includes(c)){',
 '    c.__v1592EvolutionAge=Math.min(6,c.__v1592EvolutionAge+1);',
 '    if(game===g)counter.predatorEvolutionTicks1592++;',
 '   }',
 '  }',
 ' }'
]);
`;
const causalHooks=rawCausalHooks.replaceAll('__V1592_MODE__',mode);
const realActionPatch1592=[" '  const __v1592ActionSeat=game.active;',"," '  const __v1592ActionTurn=game.turn;',"," '  const __v1592FusionsBefore=game.totalFusions[__v1592ActionSeat];',"," '  const __v1592Threat=game.players[1-__v1592ActionSeat].field.some(c=>',"," '   c&&(c.roleOverride||CARDS[c.id]?.role)===\"predator\");',"," '  const ok=baseApply(game,action);',"," '  if(game===g&&ok){',"," '   if(__v1592Threat&&',"," '    counter.actualLastThreatTurnBySeat1592[__v1592ActionSeat]!==__v1592ActionTurn){',"," '    counter.actualLastThreatTurnBySeat1592[__v1592ActionSeat]=__v1592ActionTurn;',"," '    counter.actualPredatorThreatTurnsBySeat1592[__v1592ActionSeat]++;',"," '   }',"," '   const __v1592Gained=game.totalFusions[__v1592ActionSeat]-__v1592FusionsBefore;',"," '   if(__v1592Gained>0){',"," '    counter.actualFusionActionsBySeat1592[__v1592ActionSeat]+=__v1592Gained;',"," '    if(counter.actualFirstFusionTurnBySeat1592[__v1592ActionSeat]===null)',"," '     counter.actualFirstFusionTurnBySeat1592[__v1592ActionSeat]=__v1592ActionTurn;',"," '    if(__v1592ActionTurn===(game.starter===__v1592ActionSeat?1:2))',"," '     counter.actualFirstTurnFusionActionsBySeat1592[__v1592ActionSeat]+=__v1592Gained;',"," '    if(__v1592Threat)',"," '     counter.actualFusionsUnderPredatorPressureBySeat1592[__v1592ActionSeat]+=__v1592Gained;',"," '   }',"," '  }',"].join('\n');

fs.readFileSync=function(file,...args){
 let source=original.call(this,file,...args);
 if(typeof source!=='string')return source;
 const normalized=String(file).replace(/\\/g,'/');
 if(normalized.endsWith('/assets/game.js')){
  counts.game++;
  source=once(source,'const dataOf=c=>','const __v1592BaseDataOf=c=>',
   'game-only dataOf research alias');
  source=once(source,':live;};',String.raw`:live;};
const dataOf=c=>{
 if(!c?.card||c.fusion||!Number.isInteger(c.__v1592EvolutionAge)||
    (c.roleOverride||CARDS[c.id]?.role)!=='predator')
  return __v1592BaseDataOf(c);
 // DEF remains 100%. Only Predator ATK is lower, late80 slowly regains
 // +2.5% of its reduced base every TWO completed own turns, capped at 86%.
 const age=Math.min(6,Math.max(0,c.__v1592EvolutionAge));
 const multiplier=c.__v1592EvolutionMode==='atk85'?.85:1;
 const copy={...c,card:{...c.card,
  atk:Math.max(0,Math.floor(c.card.atk*multiplier)),
  def:c.card.def}};
 return __v1592BaseDataOf(copy);
};`, 'read-time combat-view evolution; never alter stored base stats');
 }else if(normalized.endsWith('/assets/essence-combat.js')){
  // Deliberately preserve the original DEF and Essence damage/health path.
  counts.essence++;
 }else if(normalized.endsWith('/ai-v1582-deployment-delay.cjs')){
  counts.sim++;
  source=once(source,'const deploymentHooks=String.raw`',
   'const causalHooks='+JSON.stringify(causalHooks)+';\nconst deploymentHooks=String.raw`',
   'causal telemetry declaration');
  source=once(source,'extraHooks+deploymentHooks',
   'extraHooks+deploymentHooks+causalHooks','append observational hooks');
  source=once(source,
   "JSON.stringify(deploymentHooks)+';\\nconst extension=String.raw`'",
   "JSON.stringify(deploymentHooks)+';\\nconst causalHooks='+JSON.stringify(causalHooks)+';\\nconst extension=String.raw`'",
   'carry telemetry into the downstream simulator compiler');
  const marker=' "  \'      emergencyHalfDamageChecks:m.stats.emergencyHalfDamageChecks,\\\\n\'+",';
  const fields=['openingFieldByTurn1592:m.stats.openingFieldByTurn1592,',
   'emergencyHalfDamageChecks:m.stats.emergencyHalfDamageChecks,',
   'firstAttack1585:m.stats.firstAttack1585,',
   'firstAttackKill1585:m.stats.firstAttackKill1585,',
   'firstOpponentRemoval1585:m.stats.firstOpponentRemoval1585,',
   'realAttackActions1585:m.stats.realAttackActions1585,',
   'realAttackLPDamage1585:m.stats.realAttackLPDamage1585,',
   'realAttackSelfDamage1585:m.stats.realAttackSelfDamage1585,',
   'realAttackKills1585:m.stats.realAttackKills1585,',
   'predatorEvolutionMode1592:process.env.ARCANE_V1592_MODE,',
   'predatorEvolutionAssignments1592:m.stats.predatorEvolutionAssignments1592,',
   'predatorEvolutionTicks1592:m.stats.predatorEvolutionTicks1592,',
   'predatorEvolutionAttacks1592:m.stats.predatorEvolutionAttacks1592,',
   'predatorEvolutionAttackAges1592:m.stats.predatorEvolutionAttackAges1592,',
   'fusionActionsBySeat1592:m.stats.fusionActionsBySeat1592,',
   'firstFusionTurnBySeat1592:m.stats.firstFusionTurnBySeat1592,',
   'firstOwnTurnFusionsBySeat1592:m.stats.firstOwnTurnFusionsBySeat1592,',
   'fusionsUnderPredatorPressureBySeat1592:m.stats.fusionsUnderPredatorPressureBySeat1592,',
   'predatorThreatTurnsBySeat1592:m.stats.predatorThreatTurnsBySeat1592,',
   'firstPredatorPlacementTurnBySeat1592:m.stats.firstPredatorPlacementTurnBySeat1592,',
   'fusionPredatorAttacksBySeat1592:m.stats.fusionPredatorAttacksBySeat1592,',
   'fusionPredatorKillsBySeat1592:m.stats.fusionPredatorKillsBySeat1592,',
   'actualFusionActionsBySeat1592:m.stats.actualFusionActionsBySeat1592,',
   'actualFirstFusionTurnBySeat1592:m.stats.actualFirstFusionTurnBySeat1592,',
   'actualFirstTurnFusionActionsBySeat1592:m.stats.actualFirstTurnFusionActionsBySeat1592,',
   'actualFusionsUnderPredatorPressureBySeat1592:m.stats.actualFusionsUnderPredatorPressureBySeat1592,',
   'actualPredatorThreatTurnsBySeat1592:m.stats.actualPredatorThreatTurnsBySeat1592,'];
  const exported=fields.map((f,i)=>' "  \'      '+f+'\\\\n\'+'+
   (i===fields.length-1?'",':'\\n"+\n')).join('');
  source=once(source,marker,exported,'per-duel telemetry export');
 }else if(normalized.endsWith('/ai-v1580-seat-starter-isolation.cjs')){
  counts.seat++;
  source=once(source,
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550;'",
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550+Number(process.env.ARCANE_V1592_REPLICATE)*1000003;'",
   'replicate-specific duel RNG');
 }else if(normalized.endsWith('/ai-v1571-roles-selfplay.cjs')){
  counts.role++;
  source=once(source,
   'const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241;',
   'const seedA=(5351+sameOpponentPair*157+scenario*79+pairedStage*241+Number(process.env.ARCANE_V1592_REPLICATE)*997+939)%10000;',
   'replicate-specific constructed deck A');
  source=once(source,
   'const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231);',
   'const seedB=(5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231)+Number(process.env.ARCANE_V1592_REPLICATE)*1103+1289)%10000;',
   'replicate-specific constructed deck B');
  source=once(source,
   "'  const ok=baseApply(game,action);',\n'  if(ok&&game===g){',",
   realActionPatch1592+"\n'  if(ok&&game===g){',",
   'instrument genuine successful Fusion action inside AI wrapper');
 }
 return source;
};

try{
 let script=original.call(fs,path.join(__dirname,'ai-v1584-initiative-windows.cjs'),'utf8');
 script=once(script,"const modes=['baseline','release3','release4','release5','delay'];",
  "const modes=['baseline','release3'];",'baseline simulator mode independent of evolution research arm');
 script=once(script,"'artifacts/v1584/'+match+'/'+deploymentMode",
  "'artifacts/v1592/r'+process.env.ARCANE_V1592_REPLICATE+'/'+match+'/'+process.env.ARCANE_V1592_MODE",
  'isolated evolution replica folders');
 script=once(script,"'arcane-v1584-'+match+'-'+deploymentMode+'-'",
  "'arcane-v1592-r'+process.env.ARCANE_V1592_REPLICATE+'-'+match+'-'+process.env.ARCANE_V1592_MODE+'-'",
  'unique provenance');
 script=once(script,"once('15730000+','15980000+');",
  "once('15730000+','16950000+');",'new RNG series');
 new Function('require','process','console','__dirname',script)(require,process,console,__dirname);
}finally{fs.readFileSync=original;}
assert.deepEqual(counts,{game:1,essence:1,sim:1,seat:1,role:1},
 'Expected exactly one of each simulator transformation');
