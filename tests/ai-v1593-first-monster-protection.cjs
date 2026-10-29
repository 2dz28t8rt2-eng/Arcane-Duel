'use strict';
/* v15.93: matched first-monster anti-destruction opening guard research.
 * Four counterfactuals: one hit vs full turn, Fusion-eligible vs normal only.
 * Damage, attack turns, ATK, DEF, Swarm, Fusion and live rules unchanged.
 * Opening guard is research-only, including in AI decision forecast clones.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['baseline','once','turn2','normalOnly','onceNormal'];
const mode=process.env.ARCANE_V1593_MODE;
const replicate=Number(process.env.ARCANE_V1593_REPLICATE);
assert.ok(modes.includes(mode),'Unknown v15.93 mode');
assert.ok(Number.isInteger(replicate)&&replicate>=0&&replicate<4,'Invalid replicate');
process.env.ARCANE_V1584_MODE='baseline';
const original=fs.readFileSync;
const counts={game:0,essence:0,sim:0,seat:0,role:0};
function once(source,needle,replacement,label){
 assert.equal(source.split(needle).length,2,'v15.93 source drift: '+label);
 return source.replace(needle,replacement);
}

// Inject into the live simulation closure, not the AI's forecast clones.
const rawCausalHooks=String.raw`
inject(' counter.openingBeginning=__openingSnapshot(g);',[
 ' const __v1593Mode="__V1593_MODE__";',
 ' counter.protectedOpeningCard1593=0;',
 ' counter.protectedOpeningCardFusion1593=0;',
 ' counter.openingProtectionHits1593=0;',
 ' counter.openingPreventedKills1593=0;',
 ' counter.openingSavedFusion1593=0;',
 ' counter.openingSavedNormal1593=0;',
 ' counter.openingGuardEvents1593=[];',
 ' counter.openingFieldByTurn1593={};',
 ' counter.actualFusionActionsBySeat1593=[0,0];',
 ' counter.actualFirstFusionTurnBySeat1593=[null,null];',
 ' counter.actualFirstTurnFusionActionsBySeat1593=[0,0];',
 ' counter.actualFusionsUnderPredatorPressureBySeat1593=[0,0];',
 ' counter.actualPredatorThreatTurnsBySeat1593=[0,0];',
 ' counter.actualLastThreatTurnBySeat1593=[-1,-1];',
 ' counter.openingBeginning=__openingSnapshot(g);',
 ' counter.firstAttack1585=null;counter.firstAttackKill1585=null;',
 ' counter.firstOpponentRemoval1585=null;',
 ' counter.realAttackActions1585=[0,0];',
 ' counter.realAttackLPDamage1585=[0,0];',
 ' counter.realAttackSelfDamage1585=[0,0];',
 ' counter.realAttackKills1585=[0,0];',
 ' counter.fusionActionsBySeat1593=[0,0];',
 ' counter.firstFusionTurnBySeat1593=[null,null];',
 ' counter.firstOwnTurnFusionsBySeat1593=[0,0];',
 ' counter.fusionsUnderPredatorPressureBySeat1593=[0,0];',
 ' counter.predatorThreatTurnsBySeat1593=[0,0];',
 ' counter.lastPredatorThreatTurnBySeat1593=[-1,-1];',
 ' counter.firstPredatorPlacementTurnBySeat1593=[null,null];',
 ' counter.fusionPredatorAttacksBySeat1593=[0,0];',
 ' counter.fusionPredatorKillsBySeat1593=[0,0];',
 ' const __v1585Attack=attack,__v1585Apply=applyAiAction;',
 ' attack=function(game,ai,di){',
 '  const real=game===g,owner=game.active,foe=1-owner;',
 '  const actor=real?game.players[owner].field[ai]:null;',
 '  const target=Number.isInteger(di)?game.players[foe].field[di]:null;',
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
 '  const earlyGuard=game.turn===2&&owner!==game.starter&&target&&',
 '   target.__v1593GuardKind&&(target.__v1593GuardKind===\'turn\'||target.__v1593GuardCharges>0);',
 '  const preGuardEssenceKills=game.essenceKills;',
 '  const result=__v1585Attack(game,ai,di);',
 '  if(result&&earlyGuard){',
 '   const defender=game.players[foe];',
 '   const killed=defender.field[di]!==target;',
 '   if(target.__v1593GuardKind===\'once\')target.__v1593GuardCharges=0;',
 '   if(killed){',
 '    if(defender.field[di])throw Error(\'Protection field slot unexpectedly replaced\');',
 '    const ix=defender.graveyard.findIndex(c=>c.uid===target.uid);',
 '    if(ix<0)throw Error(\'Protected target missing in graveyard\');',
 '    defender.graveyard.splice(ix,1);',
 '    defender.field[di]=target;',
 '    if(target.card&&target.card.def<=0)target.card.def=1;',
 '    if(Array.isArray(result.destroyed))result.destroyed=result.destroyed.filter(id=>id!==foe+\':\'+di);',
 '    if(Number.isInteger(preGuardEssenceKills))game.essenceKills=preGuardEssenceKills;',
 '    if(real){',
 '     counter.openingPreventedKills1593++;',
 '     if(target.fusion)counter.openingSavedFusion1593++;',
 '     else counter.openingSavedNormal1593++;',
 '    }',
 '   }',
 '   if(real){',
 '    counter.openingProtectionHits1593++;',
 '    counter.openingGuardEvents1593.push({turn:game.turn,attacker:owner,',
 '      targetFusion:!!target.fusion,preventedKill:killed,',
 '      targetDEFBefore:targetEffectiveDEF,targetDEFAfter:dataOf(target).def});',
 '   }',
 '  }',
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
 '    if(targetRole==="predator")counter.fusionPredatorAttacksBySeat1593[owner]++;',
 '    counter.fusionPredatorKillsBySeat1593[owner]+=',
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
 '   counter.lastPredatorThreatTurnBySeat1593[owner]!==game.turn){',
 '   counter.lastPredatorThreatTurnBySeat1593[owner]=game.turn;',
 '   counter.predatorThreatTurnsBySeat1593[owner]++;',
 '  }',
 '  const result=__v1585Apply(game,action);',
 '  if(real&&result&&action?.type==="fusion"){',
 '   counter.fusionActionsBySeat1593[owner]++;',
 '   if(counter.firstFusionTurnBySeat1593[owner]===null)',
 '    counter.firstFusionTurnBySeat1593[owner]=game.turn;',
 '   if(game.turn===(game.starter===owner?1:2))',
 '    counter.firstOwnTurnFusionsBySeat1593[owner]++;',
 '   if(enemyHasPredator)',
 '    counter.fusionsUnderPredatorPressureBySeat1593[owner]++;',
 '  }',
 '  if(real&&result&&!counter.firstOpponentRemoval1585){',
 '   const after=new Set(game.players[foe].field.filter(Boolean).map(c=>c.uid));',
 '   const removed=before.filter(uid=>!after.has(uid)).length;',
 '   if(removed)counter.firstOpponentRemoval1585=',
 '    {seat:owner,turn:game.turn,action:action?.type||"unknown",removed};',
 '  }',
 '  return result;',
 ' };',
 ' counter.predatorEvolutionAssignments1593=0;',
 ' counter.predatorEvolutionTicks1593=0;',
 ' counter.predatorEvolutionAttacks1593=0;',
 ' counter.predatorEvolutionAttackAges1593={};',
 ' const __evolutionMode1593="__V1593_MODE__";',
 ' const __evolutionPlace1593=placePending,__evolutionAttack1593=attack;',
 ' placePending=function(game,idx,choice){',
 '  const result=__evolutionPlace1593(game,idx,choice),c=result?.card;',
 '  if(result&&c&&game.turn===1&&game.active===game.starter&&',
 '    !game.__v1593StarterOpeningAssigned){',
 '   game.__v1593StarterOpeningAssigned=true;',
 '   const grants=(__v1593Mode===\'once\'||__v1593Mode===\'turn2\'||',
 '    ((__v1593Mode===\'normalOnly\'||__v1593Mode===\'onceNormal\')&&!c.fusion));',
 '   if(grants){',
 '    c.__v1593GuardKind=__v1593Mode===\'once\'||__v1593Mode===\'onceNormal\'?\'once\':\'turn\';',
 '    c.__v1593GuardCharges=c.__v1593GuardKind===\'once\'?1:0;',
 '    if(game===g){counter.protectedOpeningCard1593++;',
 '     if(c.fusion)counter.protectedOpeningCardFusion1593++;}',
 '   }',
 '  }',
 '  if(result&&c&&!c.fusion&&game===g&&',

 '   (c.roleOverride||CARDS[c.id]?.role)==="predator"&&',
 '   counter.firstPredatorPlacementTurnBySeat1593[game.active]===null)',
 '   counter.firstPredatorPlacementTurnBySeat1593[game.active]=game.turn;',
 '  if(result&&c&&!c.fusion&&__evolutionMode1593==="atk85"&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator"){',
 '   c.__v1593EvolutionAge=0;',
 '   c.__v1593EvolutionMode=__evolutionMode1593;',
 '   if(game===g)counter.predatorEvolutionAssignments1593++;',
 '  }',
 '  return result;',
 ' };',
 ' attack=function(game,ai,di){',
 '  const c=game.players[game.active].field[ai];',
 '  const evolved=Number.isInteger(c?.__v1593EvolutionAge)&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator";',
 '  const rawBefore=evolved?c.card?.atk:null;',
 '  const fatigueBefore=evolved?(c.attackFatigue||0):0;',
 '  const result=__evolutionAttack1593(game,ai,di);',
 '  if(result&&evolved){',
 '   const fatigue=(c.attackFatigue||0)-fatigueBefore;',
 '   if(fatigue>0&&game.players[game.active].field.includes(c))',
 '    c.card.atk=Math.max(0,rawBefore-fatigue);',
 '   if(game===g){',
 '    counter.predatorEvolutionAttacks1593++;',
 '    const age=c.__v1593EvolutionAge;',
 '    counter.predatorEvolutionAttackAges1593[age]=',
 '     (counter.predatorEvolutionAttackAges1593[age]||0)+1;',
 '   }',
 '  }',
 '  return result;',
 ' };'
]);
inject(' const result=baseAdvance(game);',[
 ' if(game===g&&game.turn<=8){',
 '  counter.openingFieldByTurn1593[game.turn]={turn:game.turn,active:game.active,',
 '   players:game.players.map(p=>({field:p.field.filter(Boolean).length,',
 '    hand:p.hand.length,graveyard:p.graveyard.length,',
 '    fusions:game.totalFusions[p.id],lp:p.lp,shield:p.shield}))};',
 ' }',
 ' const __v1593Owner=game.active;',
 ' const __v1593Deployed=game.players[__v1593Owner].field.filter(c=>',
 '  Number.isInteger(c?.__v1593EvolutionAge));',
 ' const result=baseAdvance(game);',
 ' if(result!==false){',
 '  for(const c of __v1593Deployed){',
 '   if(game.players[__v1593Owner].field.includes(c)){',
 '    c.__v1593EvolutionAge=Math.min(6,c.__v1593EvolutionAge+1);',
 '    if(game===g)counter.predatorEvolutionTicks1593++;',
 '   }',
 '  }',
 ' }'
]);
`;
const causalHooks=rawCausalHooks.replaceAll('__V1593_MODE__',mode);
const realActionPatch1593=[" '  const __v1593ActionSeat=game.active;',"," '  const __v1593ActionTurn=game.turn;',"," '  const __v1593FusionsBefore=game.totalFusions[__v1593ActionSeat];',"," '  const __v1593Threat=game.players[1-__v1593ActionSeat].field.some(c=>',"," '   c&&(c.roleOverride||CARDS[c.id]?.role)===\"predator\");',"," '  const ok=baseApply(game,action);',"," '  if(game===g&&ok){',"," '   if(__v1593Threat&&',"," '    counter.actualLastThreatTurnBySeat1593[__v1593ActionSeat]!==__v1593ActionTurn){',"," '    counter.actualLastThreatTurnBySeat1593[__v1593ActionSeat]=__v1593ActionTurn;',"," '    counter.actualPredatorThreatTurnsBySeat1593[__v1593ActionSeat]++;',"," '   }',"," '   const __v1593Gained=game.totalFusions[__v1593ActionSeat]-__v1593FusionsBefore;',"," '   if(__v1593Gained>0){',"," '    counter.actualFusionActionsBySeat1593[__v1593ActionSeat]+=__v1593Gained;',"," '    if(counter.actualFirstFusionTurnBySeat1593[__v1593ActionSeat]===null)',"," '     counter.actualFirstFusionTurnBySeat1593[__v1593ActionSeat]=__v1593ActionTurn;',"," '    if(__v1593ActionTurn===(game.starter===__v1593ActionSeat?1:2))',"," '     counter.actualFirstTurnFusionActionsBySeat1593[__v1593ActionSeat]+=__v1593Gained;',"," '    if(__v1593Threat)',"," '     counter.actualFusionsUnderPredatorPressureBySeat1593[__v1593ActionSeat]+=__v1593Gained;',"," '   }',"," '  }',"].join('\n');

fs.readFileSync=function(file,...args){
 let source=original.call(this,file,...args);
 if(typeof source!=='string')return source;
 const normalized=String(file).replace(/\\/g,'/');
 if(normalized.endsWith('/assets/game.js')){
  counts.game++;
  source=once(source,'const dataOf=c=>','const __v1593BaseDataOf=c=>',
   'game-only dataOf research alias');
  source=once(source,':live;};',String.raw`:live;};
const dataOf=c=>{
 if(!c?.card||c.fusion||!Number.isInteger(c.__v1593EvolutionAge)||
    (c.roleOverride||CARDS[c.id]?.role)!=='predator')
  return __v1593BaseDataOf(c);
 // DEF remains 100%. Only Predator ATK is lower, late80 slowly regains
 // +2.5% of its reduced base every TWO completed own turns, capped at 86%.
 const age=Math.min(6,Math.max(0,c.__v1593EvolutionAge));
 const multiplier=c.__v1593EvolutionMode==='atk85'?.85:1;
 const copy={...c,card:{...c.card,
  atk:Math.max(0,Math.floor(c.card.atk*multiplier)),
  def:c.card.def}};
 return __v1593BaseDataOf(copy);
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
  const fields=['protectedOpeningCard1593:m.stats.protectedOpeningCard1593,',
   'protectedOpeningCardFusion1593:m.stats.protectedOpeningCardFusion1593,',
   'openingProtectionHits1593:m.stats.openingProtectionHits1593,',
   'openingPreventedKills1593:m.stats.openingPreventedKills1593,',
   'openingSavedFusion1593:m.stats.openingSavedFusion1593,',
   'openingSavedNormal1593:m.stats.openingSavedNormal1593,',
   'openingGuardEvents1593:m.stats.openingGuardEvents1593,',
   'openingFieldByTurn1593:m.stats.openingFieldByTurn1593,',
   'emergencyHalfDamageChecks:m.stats.emergencyHalfDamageChecks,',
   'firstAttack1585:m.stats.firstAttack1585,',
   'firstAttackKill1585:m.stats.firstAttackKill1585,',
   'firstOpponentRemoval1585:m.stats.firstOpponentRemoval1585,',
   'realAttackActions1585:m.stats.realAttackActions1585,',
   'realAttackLPDamage1585:m.stats.realAttackLPDamage1585,',
   'realAttackSelfDamage1585:m.stats.realAttackSelfDamage1585,',
   'realAttackKills1585:m.stats.realAttackKills1585,',
   'predatorEvolutionMode1593:process.env.ARCANE_V1593_MODE,',
   'predatorEvolutionAssignments1593:m.stats.predatorEvolutionAssignments1593,',
   'predatorEvolutionTicks1593:m.stats.predatorEvolutionTicks1593,',
   'predatorEvolutionAttacks1593:m.stats.predatorEvolutionAttacks1593,',
   'predatorEvolutionAttackAges1593:m.stats.predatorEvolutionAttackAges1593,',
   'fusionActionsBySeat1593:m.stats.fusionActionsBySeat1593,',
   'firstFusionTurnBySeat1593:m.stats.firstFusionTurnBySeat1593,',
   'firstOwnTurnFusionsBySeat1593:m.stats.firstOwnTurnFusionsBySeat1593,',
   'fusionsUnderPredatorPressureBySeat1593:m.stats.fusionsUnderPredatorPressureBySeat1593,',
   'predatorThreatTurnsBySeat1593:m.stats.predatorThreatTurnsBySeat1593,',
   'firstPredatorPlacementTurnBySeat1593:m.stats.firstPredatorPlacementTurnBySeat1593,',
   'fusionPredatorAttacksBySeat1593:m.stats.fusionPredatorAttacksBySeat1593,',
   'fusionPredatorKillsBySeat1593:m.stats.fusionPredatorKillsBySeat1593,',
   'actualFusionActionsBySeat1593:m.stats.actualFusionActionsBySeat1593,',
   'actualFirstFusionTurnBySeat1593:m.stats.actualFirstFusionTurnBySeat1593,',
   'actualFirstTurnFusionActionsBySeat1593:m.stats.actualFirstTurnFusionActionsBySeat1593,',
   'actualFusionsUnderPredatorPressureBySeat1593:m.stats.actualFusionsUnderPredatorPressureBySeat1593,',
   'actualPredatorThreatTurnsBySeat1593:m.stats.actualPredatorThreatTurnsBySeat1593,'];
  const exported=fields.map((f,i)=>' "  \'      '+f+'\\\\n\'+'+
   (i===fields.length-1?'",':'\\n"+\n')).join('');
  source=once(source,marker,exported,'per-duel telemetry export');
 }else if(normalized.endsWith('/ai-v1580-seat-starter-isolation.cjs')){
  counts.seat++;
  source=once(source,
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550;'",
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550+Number(process.env.ARCANE_V1593_REPLICATE)*1000003;'",
   'replicate-specific duel RNG');
 }else if(normalized.endsWith('/ai-v1571-roles-selfplay.cjs')){
  counts.role++;
  source=once(source,
   'const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241;',
   'const seedA=(5351+sameOpponentPair*157+scenario*79+pairedStage*241+Number(process.env.ARCANE_V1593_REPLICATE)*997+939)%10000;',
   'replicate-specific constructed deck A');
  source=once(source,
   'const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231);',
   'const seedB=(5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231)+Number(process.env.ARCANE_V1593_REPLICATE)*1103+1289)%10000;',
   'replicate-specific constructed deck B');
  source=once(source,
   "'  const ok=baseApply(game,action);',\n'  if(ok&&game===g){',",
   realActionPatch1593+"\n'  if(ok&&game===g){',",
   'instrument genuine successful Fusion action inside AI wrapper');
 }
 return source;
};

try{
 let script=original.call(fs,path.join(__dirname,'ai-v1584-initiative-windows.cjs'),'utf8');
 script=once(script,"const modes=['baseline','release3','release4','release5','delay'];",
  "const modes=['baseline','release3'];",'baseline simulator mode independent of evolution research arm');
 script=once(script,"'artifacts/v1584/'+match+'/'+deploymentMode",
  "'artifacts/v1593/r'+process.env.ARCANE_V1593_REPLICATE+'/'+match+'/'+process.env.ARCANE_V1593_MODE",
  'isolated evolution replica folders');
 script=once(script,"'arcane-v1584-'+match+'-'+deploymentMode+'-'",
  "'arcane-v1593-r'+process.env.ARCANE_V1593_REPLICATE+'-'+match+'-'+process.env.ARCANE_V1593_MODE+'-'",
  'unique provenance');
 script=once(script,"once('15730000+','15980000+');",
  "once('15730000+','16950000+');",'new RNG series');
 new Function('require','process','console','__dirname',script)(require,process,console,__dirname);
}finally{fs.readFileSync=original;}
assert.deepEqual(counts,{game:1,essence:1,sim:1,seat:1,role:1},
 'Expected exactly one of each simulator transformation');
