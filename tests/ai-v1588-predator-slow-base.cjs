'use strict';
/* v15.88: paired full-duel study of lowered Predator fundamentals and slow progression.
 * Observe real-game first attacks, action-caused removals, and LP changes.
 * Preserve production rules and live Swarm (+2%/Predator), Pierce and AI.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['baseline','base90','late90'];
const mode=process.env.ARCANE_V1588_MODE;
const replicate=Number(process.env.ARCANE_V1588_REPLICATE);
assert.ok(modes.includes(mode),'Unknown v15.88 mode');
assert.ok(Number.isInteger(replicate)&&replicate>=0&&replicate<4,'Invalid replicate');
process.env.ARCANE_V1584_MODE='baseline';
const original=fs.readFileSync;
const counts={game:0,essence:0,sim:0,seat:0,role:0};
function once(source,needle,replacement,label){
 assert.equal(source.split(needle).length,2,'v15.88 source drift: '+label);
 return source.replace(needle,replacement);
}

// Inject into the live simulation closure, not the AI's forecast clones.
const rawCausalHooks=String.raw`
inject(' counter.openingBeginning=__openingSnapshot(g);',[
 ' counter.openingBeginning=__openingSnapshot(g);',
 ' counter.firstAttack1585=null;counter.firstAttackKill1585=null;',
 ' counter.firstOpponentRemoval1585=null;',
 ' counter.realAttackActions1585=[0,0];',
 ' counter.realAttackLPDamage1585=[0,0];',
 ' counter.realAttackSelfDamage1585=[0,0];',
 ' counter.realAttackKills1585=[0,0];',
 ' const __v1585Attack=attack,__v1585Apply=applyAiAction;',
 ' attack=function(game,ai,di){',
 '  const real=game===g,owner=game.active,foe=1-owner;',
 '  const actor=real?game.players[owner].field[ai]:null;',
 '  const target=real&&Number.isInteger(di)?game.players[foe].field[di]:null;',
 '  const oldEnemy=real?game.players[foe].field.filter(Boolean).map(c=>c.uid):[];',
 '  const oldSelf=real?game.players[owner].field.filter(Boolean).map(c=>c.uid):[];',
 '  const foeLP=real?game.players[foe].lp:0,selfLP=real?game.players[owner].lp:0;',
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
 '   const detail={seat:owner,turn:game.turn,power,targeted:!!target,',
 '    enemyLPDamage:dealt,selfLPDamage:suffered,enemyKills:kills,ownLosses,',
 '    enemyBoardBefore:oldEnemy.length,ownBoardBefore:oldSelf.length};',
 '   if(!counter.firstAttack1585)counter.firstAttack1585=detail;',
 '   if(kills>0&&!counter.firstAttackKill1585)',
 '    counter.firstAttackKill1585=detail;',
 '  }',
 '  return result;',
 ' };',
 ' applyAiAction=function(game,action){',
 '  const real=game===g,owner=game.active,foe=1-owner;',
 '  const before=real?game.players[foe].field.filter(Boolean).map(c=>c.uid):[];',
 '  const result=__v1585Apply(game,action);',
 '  if(real&&result&&!counter.firstOpponentRemoval1585){',
 '   const after=new Set(game.players[foe].field.filter(Boolean).map(c=>c.uid));',
 '   const removed=before.filter(uid=>!after.has(uid)).length;',
 '   if(removed)counter.firstOpponentRemoval1585=',
 '    {seat:owner,turn:game.turn,action:action?.type||"unknown",removed};',
 '  }',
 '  return result;',
 ' };',
 ' counter.predatorEvolutionAssignments1588=0;',
 ' counter.predatorEvolutionTicks1588=0;',
 ' counter.predatorEvolutionAttacks1588=0;',
 ' counter.predatorEvolutionAttackAges1588={};',
 ' const __evolutionMode1588="__V1588_MODE__";',
 ' const __evolutionPlace1588=placePending,__evolutionAttack1588=attack;',
 ' placePending=function(game,idx,choice){',
 '  const result=__evolutionPlace1588(game,idx,choice),c=result?.card;',
 '  if(result&&c&&__evolutionMode1588!=="baseline"&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator"){',
 '   c.__v1588EvolutionAge=0;',
 '   c.__v1588EvolutionMode=__evolutionMode1588;',
 '   if(game===g)counter.predatorEvolutionAssignments1588++;',
 '  }',
 '  return result;',
 ' };',
 ' attack=function(game,ai,di){',
 '  const c=game.players[game.active].field[ai];',
 '  const evolved=Number.isInteger(c?.__v1588EvolutionAge)&&',
 '   (c.roleOverride||CARDS[c.id]?.role)==="predator";',
 '  const rawBefore=evolved?c.card?.atk:null;',
 '  const fatigueBefore=evolved?(c.attackFatigue||0):0;',
 '  const result=__evolutionAttack1588(game,ai,di);',
 '  if(result&&evolved){',
 '   const fatigue=(c.attackFatigue||0)-fatigueBefore;',
 '   if(fatigue>0&&game.players[game.active].field.includes(c))',
 '    c.card.atk=Math.max(0,rawBefore-fatigue);',
 '   if(game===g){',
 '    counter.predatorEvolutionAttacks1588++;',
 '    const age=c.__v1588EvolutionAge;',
 '    counter.predatorEvolutionAttackAges1588[age]=',
 '     (counter.predatorEvolutionAttackAges1588[age]||0)+1;',
 '   }',
 '  }',
 '  return result;',
 ' };'
]);
inject(' const result=baseAdvance(game);',[
 ' const __v1588Owner=game.active;',
 ' const __v1588Deployed=game.players[__v1588Owner].field.filter(c=>',
 '  Number.isInteger(c?.__v1588EvolutionAge));',
 ' const result=baseAdvance(game);',
 ' if(result!==false){',
 '  for(const c of __v1588Deployed){',
 '   if(game.players[__v1588Owner].field.includes(c)){',
 '    c.__v1588EvolutionAge=Math.min(6,c.__v1588EvolutionAge+1);',
 '    if(game===g)counter.predatorEvolutionTicks1588++;',
 '   }',
 '  }',
 ' }'
]);
`;
const causalHooks=rawCausalHooks.replaceAll('__V1588_MODE__',mode);

fs.readFileSync=function(file,...args){
 let source=original.call(this,file,...args);
 if(typeof source!=='string')return source;
 const normalized=String(file).replace(/\\/g,'/');
 if(normalized.endsWith('/assets/game.js')){
  counts.game++;
  source=once(source,'const dataOf=c=>','const __v1588BaseDataOf=c=>',
   'game-only dataOf research alias');
  source=once(source,':live;};',String.raw`:live;};
const dataOf=c=>{
 if(!c?.card||!Number.isInteger(c.__v1588EvolutionAge)||
    (c.roleOverride||CARDS[c.id]?.role)!=='predator')
  return __v1588BaseDataOf(c);
 const age=Math.min(6,Math.max(0,c.__v1588EvolutionAge));
 // Starts at 90% of today's Predator ATK/DEF (up from 85% in v15.87).
 // Optional growth: +2.5% of reduced base every TWO completed own
 // turns while deployed, capped after six own turns at 96.75% of today.
 const multiplier=c.__v1588EvolutionMode==='base90'?.90:
  c.__v1588EvolutionMode==='late90'?
   .90*(1+.025*Math.min(3,Math.floor(age/2))):1;
 const copy={...c,card:{...c.card,
  atk:Math.max(0,Math.floor(c.card.atk*multiplier)),
  def:Math.max(0,Math.floor(c.card.def*multiplier))}};
 return __v1588BaseDataOf(copy);
};`, 'read-time combat-view evolution; never alter stored base stats');
 }else if(normalized.endsWith('/assets/essence-combat.js')){
  counts.essence++;
  const old=String.raw`   const baseLoss=Math.min(d.card?.def||0,remaining);
   if(d.card)d.card.def=Math.max(0,d.card.def-baseLoss);`;
  const replacement=String.raw`   // Research-only view-consistent Predator DEF health: the existing
   // Soul/Condensed layers are processed first and left unchanged.
   const __v1588Age=d?.__v1588EvolutionAge;
   const __v1588Mode=d?.__v1588EvolutionMode;
   const __v1588Factor=Number.isInteger(__v1588Age)&&
    (d.roleOverride||CARDS[d.id]?.role)==='predator'?
     (__v1588Mode==='base90'?.90:__v1588Mode==='late90'?
      .90*(1+.025*Math.min(3,Math.floor(Math.min(6,__v1588Age)/2))):1):1;
   const __v1588RawDef=d.card?.def||0;
   const __v1588EffectiveDef=Math.floor(__v1588RawDef*__v1588Factor);
   const baseLoss=Math.min(__v1588EffectiveDef,remaining);
   if(d.card)d.card.def=baseLoss>=__v1588EffectiveDef?0:
    Math.max(0,Math.ceil((__v1588EffectiveDef-baseLoss)/__v1588Factor));`;
  source=once(source,old,replacement,
   'defensive Predator health follows its projected DEF');
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
  const fields=['emergencyHalfDamageChecks:m.stats.emergencyHalfDamageChecks,',
   'firstAttack1585:m.stats.firstAttack1585,',
   'firstAttackKill1585:m.stats.firstAttackKill1585,',
   'firstOpponentRemoval1585:m.stats.firstOpponentRemoval1585,',
   'realAttackActions1585:m.stats.realAttackActions1585,',
   'realAttackLPDamage1585:m.stats.realAttackLPDamage1585,',
   'realAttackSelfDamage1585:m.stats.realAttackSelfDamage1585,',
   'realAttackKills1585:m.stats.realAttackKills1585,',
   'predatorEvolutionMode1588:process.env.ARCANE_V1588_MODE,',
   'predatorEvolutionAssignments1588:m.stats.predatorEvolutionAssignments1588,',
   'predatorEvolutionTicks1588:m.stats.predatorEvolutionTicks1588,',
   'predatorEvolutionAttacks1588:m.stats.predatorEvolutionAttacks1588,',
   'predatorEvolutionAttackAges1588:m.stats.predatorEvolutionAttackAges1588,'];
  const exported=fields.map((f,i)=>' "  \'      '+f+'\\\\n\'+'+
   (i===fields.length-1?'",':'\\n"+\n')).join('');
  source=once(source,marker,exported,'per-duel telemetry export');
 }else if(normalized.endsWith('/ai-v1580-seat-starter-isolation.cjs')){
  counts.seat++;
  source=once(source,
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550;'",
   "'    const matchSeed=15710000+pairedStage*200000+sameOpponentPair*10000+scenario*1550+Number(process.env.ARCANE_V1588_REPLICATE)*1000003;'",
   'replicate-specific duel RNG');
 }else if(normalized.endsWith('/ai-v1571-roles-selfplay.cjs')){
  counts.role++;
  source=once(source,
   'const seedA=5351+sameOpponentPair*157+scenario*79+pairedStage*241;',
   'const seedA=(5351+sameOpponentPair*157+scenario*79+pairedStage*241+Number(process.env.ARCANE_V1588_REPLICATE)*997)%10000;',
   'replicate-specific constructed deck A');
  source=once(source,
   'const seedB=5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231);',
   'const seedB=(5609+sameOpponentPair*151+scenario*91+pairedStage*(stage===7?170:231)+Number(process.env.ARCANE_V1588_REPLICATE)*1103)%10000;',
   'replicate-specific constructed deck B');
 }
 return source;
};

try{
 let script=original.call(fs,path.join(__dirname,'ai-v1584-initiative-windows.cjs'),'utf8');
 script=once(script,"const modes=['baseline','release3','release4','release5','delay'];",
  "const modes=['baseline','release3'];",'baseline simulator mode independent of evolution research arm');
 script=once(script,"'artifacts/v1584/'+match+'/'+deploymentMode",
  "'artifacts/v1588/r'+process.env.ARCANE_V1588_REPLICATE+'/'+match+'/'+process.env.ARCANE_V1588_MODE",
  'isolated evolution replica folders');
 script=once(script,"'arcane-v1584-'+match+'-'+deploymentMode+'-'",
  "'arcane-v1588-r'+process.env.ARCANE_V1588_REPLICATE+'-'+match+'-'+process.env.ARCANE_V1588_MODE+'-'",
  'unique provenance');
 script=once(script,"once('15730000+','15980000+');",
  "once('15730000+','16680000+');",'new RNG series');
 new Function('require','process','console','__dirname',script)(require,process,console,__dirname);
}finally{fs.readFileSync=original;}
assert.deepEqual(counts,{game:1,essence:1,sim:1,seat:1,role:1},
 'Expected exactly one of each simulator transformation');
