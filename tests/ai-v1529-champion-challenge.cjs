'use strict';
/* v14.9.24 research-only five-phase dual-test-AI self-play. Runs the REAL game
 * mechanics and exact v14.9.19 verified simulator hooks, not a mock fight. */
const fs=require('node:fs');
const old=fs.readFileSync('tests/ai-v1519-crossdeck-shards.cjs','utf8');
const split=old.indexOf('\nfunction runStudy(){');
if(split<0)throw Error('Cannot find verified simulator scaffold');
const prefix=old.slice(0,split);
const patchLines=[];
function inject(oldText,lines){
 patchLines.push('patch('+JSON.stringify(oldText)+','+JSON.stringify(lines.join('\n'))+');');
}
inject(' let learner=scene.candidateSeat;',[
' let learner=scene.candidateSeat;',
' const defender=g.players[1-learner],fortCount=[1,2,2,2,2,2,0][scene.siegeStage];',
' g.strategicTraining.siegeStage=scene.siegeStage;',
' if(scene.siegeStage<=2)g.strategicTraining.soulUnlockTurn=99999;',
' if(scene.siegeStage<=1)g.strategicTraining.noAttacksCounterOffense=true;',
' const ranked=defender.deck.map(id=>({id,card:CARDS[id]})).filter(x=>x.card)',
"  .sort((a,b)=>(['guardian','soul'].includes(b.card.role)?150000:0)+b.card.def-",
"   ((['guardian','soul'].includes(a.card.role)?150000:0)+a.card.def)||a.id-b.id);",
" if(ranked.length<fortCount)throw Error('Too few legal defender cards in deck');",
' for(let i=0;i<fortCount;i++){',
'  const picked=ranked[i],pos=defender.deck.indexOf(picked.id);',
"  if(pos<0)throw Error('Fortress source card missing from the actual deck');",
'  defender.deck.splice(pos,1);',
'  const c=newInstance(g,picked.id,1-learner);',
"  c.mode='def';c.summonedTurn=g.turn;defender.field[i]=c;",
' }',
" if(defender.field.filter(Boolean).length!==fortCount)throw Error('Invalid fortress field');"
]);
inject(' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',[
' counter.siegeEnemyAttackActions=0;counter.siegeEnemySoulOffense=0;',
' counter.siegeSummons=0;counter.siegeOwnCardLosses=0;',
' counter.siegeOpponentCardRemovals=0;counter.siegeOpponentLPDamage=0;',
' counter.siegeOwnLPDamage=0;counter.siegeEnemyActiveTurn=-1;',
' counter.siegeEnemyActionsThisTurn=0;counter.siegeCounterBlocked=0;',
' counter.finishWindows=0;counter.finishAttacks=0;counter.finishSwitches=0;counter.finishEnds=0;',
' counter.readyDirectOpportunities=0;counter.missedDirectOpportunities=0;',
' counter.selfPlayCallsBySeat=[0,0];counter.selfPlayStrategicBySeat=[0,0];',
' counter.selfPlayActionTypesBySeat=[{},{}];',
' counter.selfPlayIllegalSwitchesBySeat=[0,0];',
' counter.breachSwitches=0;counter.breachAttacks=0;counter.lastDefenderEliminated=0;',
' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;'
]);
inject(' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',[
' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',
' const baseDamagePlayer=damagePlayer,baseAttack=attack;',
' // Training-only switch: suppress defensive LP retaliation in levels 0 and 1.',
' attack=function(game,ai,di){',
'  const d=Number.isInteger(di)?game.players[1-game.active]?.field[di]:null;',
'  const silent=game.strategicTraining?.noAttacksCounterOffense===true&&',
'   game.active===learner&&d?.mode==="def";',
'  if(silent)game.__siegeSilentCounter=true;',
'  try{return baseAttack(game,ai,di);}finally{delete game.__siegeSilentCounter;}',
' };',
' damagePlayer=function(game,id,amount){',
'  if(game.__siegeSilentCounter===true&&game.active===learner&&id===learner){',
'   if(game===g)counter.siegeCounterBlocked++;',
'   return 0;',
'  }',
'  return baseDamagePlayer(game,id,amount);',
' };'
]);
inject(' chooseAiAction=function(game,policy){',[
" chooseAiAction=function(game,policy){",
"  if(game===g&&scene.selfPlay){",
"   scene.finishMode=scene.finishModesBySeat[game.active];",
"   scene.siegeWeights=scene.weightModesBySeat[game.active];",
"   scene.rolePolicy=scene.rolePoliciesBySeat[game.active];",
"   scene.q=scene.qModesBySeat[game.active];",
"   scene.candidateRole=scene.rolesBySeat[game.active];",
"  }",
"  if(game===g&&!game.pending&&['breach','safe'].includes(scene.finishMode)&&",
"    game.winner===null&&game.turn>1&&game.players[1-game.active].field.some(Boolean)&&",
"    (game.aiPhase!=='summon'||game.summoned)){",
"   const self=game.players[game.active],enemy=game.players[1-game.active];",
"   const targets=enemy.field.filter(Boolean);",
"   const available=self.field.some(c=>c&&canAttack(game,c));",
"   if(game.aiPhase==='positions'||game.aiPhase==='guard'||game.aiPhase==='attacks'){",
"    if(!available){",
"     const pool=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode==='def'&&",
"      !x.c.switched&&!x.c.attacked&&dataOf(x.c).atk>0);",
"     let viable=pool.filter(x=>targets.some(t=>effectiveAttack(game,x.c,t)>=dataOf(t).def*(scene.finishMode==='safe'?.95:.72)));",
"     if(scene.finishMode==='safe'){",
"      const enemyPeak=Math.max(0,...targets.map(c=>dataOf(c).atk));",
"      viable=viable.filter(x=>self.lp>Math.max(300,enemyPeak*.55));",
"     }",
"     viable.sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk||a.i-b.i);",
"     if(viable.length){counter.breachSwitches++;return {type:'switch',idx:viable[0].i};}",
"    }",
"    if(scene.finishMode==='focus'&&game.aiPhase==='attacks'){",
"     const ready=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&canAttack(game,x.c));",
"     const scored=[];",
"     for(const x of ready)for(let di=0;di<5;di++){",
"      const target=enemy.field[di];if(!target)continue;",
"      const value=effectiveAttack(game,x.c,target),armor=target.mode==='def'?dataOf(target).def:dataOf(target).atk;",
"      if(value<armor*.8)continue;",
"      const clone=JSON.parse(JSON.stringify(game));",
"      const before=clone.players[learner].lp,prev=clone.players[1-learner].lp;",
"      if(!attack(clone,x.i,di))continue;",
"      const removed=!clone.players[1-learner].field[di];",
"      const paid=before-clone.players[learner].lp,lp=prev-clone.players[1-learner].lp;",
"      const score=(removed?1200:0)+lp*.8-paid*.9+Math.min(value,armor)*.3;",
"      scored.push({ai:x.i,di,score});",
"     }",
"     scored.sort((a,b)=>b.score-a.score||a.ai-b.ai);",
"     if(scored.length&&scored[0].score>180){",
"      counter.breachAttacks++;return {type:'attack',ai:scored[0].ai,di:scored[0].di};",
"     }",
"    }",
"   }",
"  }",
"  if(game===g&&!game.pending&&scene.finishMode&&",
"    game.winner===null&&game.turn>1&&!game.players[1-game.active].field.some(Boolean)){",
"   const self=game.players[game.active];counter.finishWindows++;",
"   if(game.aiPhase!==\"summon\"||game.summoned){",
"    const ready=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&",
"      canAttack(game,x.c)&&effectiveAttack(game,x.c,null)>0);",
"    if(ready.length){",
"     if(scene.finishMode===\"priority\")ready.sort((a,b)=>effectiveAttack(game,b.c,null)-effectiveAttack(game,a.c,null)||a.i-b.i);",
"     counter.finishAttacks++;return {type:\"attack\",ai:ready[0].i,di:null};",
"    }",
"    if(scene.finishMode!==\"direct\"){",
"     const defenders=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode===\"def\"&&",
"       !x.c.attacked&&!x.c.switched&&dataOf(x.c).atk>0);",
"     if(defenders.length){",
"      if(scene.finishMode===\"priority\")defenders.sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk||a.i-b.i);",
"      counter.finishSwitches++;return {type:\"switch\",idx:defenders[0].i};",
"     }",
"    }",
"    counter.finishEnds++;return {type:\"end\"};",
"   }",
"  }",
"  if(game===g&&game.active!==learner&&!game.pending&&!scene.selfPlay){",
'   if(scene.siegeStage===6)return baseChoose(game,policy);',
"   if(scene.siegeStage<=3)return {type:'end'};",
'   const max=scene.siegeStage<5?0:game.turn<10?0:game.turn<20?1:2;',
'   if(game.turn!==counter.siegeEnemyActiveTurn){',
'    counter.siegeEnemyActiveTurn=game.turn;counter.siegeEnemyActionsThisTurn=0;',
'   }',
'   const action=baseChoose(game,policy);',
"   if(['attack','soul-raid','soul-discharge'].includes(action?.type)&&",
'      counter.siegeEnemyActionsThisTurn>=max)',
"    return {type:'end'};",
"   if(action?.type==='switch'&&game.players[game.active].field[action.idx]?.mode==='def')",
"    return {type:'end'};",
'   return action;',
'  }'
]);
inject('  if(scene.summonForecast&&ranking.length>1&&',[
'  if(scene.rolePolicy){',
'   const w=scene.rolePolicy,foe=g.players[1-g.active];',
'   const guardSupport=w.adaptive&&own.field.some(c=>c&&role(c)==="soul")?1.35:1;',
'   const soulSupport=w.adaptive&&own.field.some(c=>c&&role(c)==="guardian")?1.35:1;',
'   const reserveRisk=w.adaptive&&own.field.filter(Boolean).length<=2?1.35:1;',
'   const threat=Math.max(0,...foe.field.filter(Boolean).map(c=>dataOf(c).atk));',
'   const guardian=own.field.some(c=>c&&role(c)==="guardian");',
'   const soul=own.field.some(c=>c&&role(c)==="soul");',
'   for(const opt of ranking){',
'    if(opt.a.type==="fusion"){',
'     const mat=(opt.a.uids||[]).map(uid=>own.hand.find(c=>c.uid===uid)).filter(Boolean);',
'     const consumed=mat.reduce((n,c)=>n+dataOf(c).atk*.55+dataOf(c).def*.45,0);',
'     const fusion=CARDS[opt.a.choice],result=fusion?fusion.atk*.55+fusion.def*.45:0;',
'     opt.score-=w.material*reserveRisk*Math.max(0,consumed*.15-Math.max(0,result-consumed)*.05);',
'    }else{',
'     const c=own.hand.find(x=>x.uid===opt.a.uid);if(!c)continue;',
'     const d=dataOf(c),r=role(c);',
'     if(r==="guardian")opt.score+=w.guardian*guardSupport*Math.min(500,d.def*.14+Math.min(threat,d.def)*.04+(soul?140:0));',
'     if(r==="soul")opt.score+=w.soul*soulSupport*Math.min(550,d.def*.11+(guardian?170:0));',
'    }',
'   }',
'   ranking.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.siegeWeights){',
'   const w=scene.siegeWeights;',
'   for(const opt of ranking){',
"    if(opt.a.type==='fusion')opt.score-=w.reserve*((opt.a.uids?.length||2)-1)*90;",
'    else {',
'     const card=own.hand.find(c=>c.uid===opt.a.uid);',
'     if(card){const d=dataOf(card),r=role(card);',
"      if(['guardian','soul'].includes(r))opt.score+=w.support*d.def*.045;",
"      if(r==='predator')opt.score+=w.breach*d.atk*.032;",
'     }',
'    }',
'   }',
'   ranking.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.summonForecast&&ranking.length>1&&'
]);
inject("  if(scene.q&&scene.decision!=='heuristic'&&options.length){",[
'  if(scene.rolePolicy){',
'   const w=scene.rolePolicy,foe=g.players[1-g.active];',
'   const peak=Math.max(0,...foe.field.filter(Boolean).map(c=>dataOf(c).atk));',
'   for(const opt of options){',
'    const trial=JSON.parse(JSON.stringify(g));',
'    const ownBefore=trial.players[g.active].lp;',
'    if(!attack(trial,opt.a.ai,opt.a.di))continue;',
'    const left=trial.players[g.active].field[opt.a.ai];',
'    const cover=left?dataOf(left)[left.mode==="def"?"def":"atk"]:0;',
'    const risk=(!left?500:Math.max(0,peak-cover)*.22)+',
'      Math.max(0,ownBefore-trial.players[g.active].lp)*.45;',
'    const won=trial.winner===g.active?4200:trial.winner===1-g.active?-4200:0;',
'    const ownLP=g.players[g.active].lp,enemyLP=foe.lp;',
'    const defensivePressure=w.adaptive?(ownLP<enemyLP*.65?1.35:ownLP>enemyLP*1.5?.85:1):1;',
'    const boardPressure=w.adaptive&&foe.field.filter(Boolean).length>=3?1.18:1;',
'    opt.score+=won-w.risk*defensivePressure*boardPressure*risk;',
'   }',
'   options.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.siegeWeights){',
'   const w=scene.siegeWeights;',
'   const enemyStart=g.players[1-g.active].field.filter(Boolean).length;',
'   const allyStart=g.players[g.active].field.filter(Boolean).length;',
'   for(const opt of options){',
'    const trial=JSON.parse(JSON.stringify(g)),enemyLP=trial.players[1-g.active].lp;',
'    if(!attack(trial,opt.a.ai,opt.a.di))continue;',
'    const cleared=enemyStart-trial.players[1-g.active].field.filter(Boolean).length;',
'    const lost=allyStart-trial.players[g.active].field.filter(Boolean).length;',
'    const damage=Math.max(0,enemyLP-trial.players[1-g.active].lp);',
'    opt.score+=w.breach*(cleared*330+damage*.07)-w.reserve*lost*290;',
'   }',
'   options.sort((a,b)=>b.score-a.score);',
'  }',
"  if(scene.q&&scene.decision!=='heuristic'&&options.length){"
]);
inject('      const response=attackPlan(x);',[
'      const response=scene.siegeStage<5?null:attackPlan(x);'
]);
inject('    const response=attackPlan(first);',[
'    const response=scene.siegeStage<5?null:attackPlan(first);'
]);
inject('      if(scene.summonCounterDepth>=2&&x.winner===null){',[
'      if(scene.summonCounterDepth>=2&&x.winner===null&&scene.siegeStage>=5){'
]);
inject('    if(scene.summonCounterDepth>=2&&first.winner===null){',[
'    if(scene.summonCounterDepth>=2&&first.winner===null&&scene.siegeStage>=5){'
]);
inject('  return baseApply(game,action);',[
'  const current=game.active;',
'  const foe=game.players[1-learner],own=game.players[learner];',
'  const enemyN=foe.field.filter(Boolean).length,ownN=own.field.filter(Boolean).length;',
'  const enemyLP=foe.lp,ownLP=own.lp;',
'  if(game===g&&current===learner&&game.turn>1&&!game.pending&&!foe.field.some(Boolean)&&',
'    (game.aiPhase!=="summon"||game.summoned)){',
'   const legal=own.field.some(c=>c&&canAttack(game,c)&&effectiveAttack(game,c,null)>0);',
'   if(legal){counter.readyDirectOpportunities++;',
'    if(action.type!=="attack"||action.di!==null)counter.missedDirectOpportunities++;}',
'  }',
'  const ok=baseApply(game,action);',
'  if(ok&&game===g){',
'   const types=counter.selfPlayActionTypesBySeat[current];',
'   types[action.type]=(types[action.type]||0)+1;',
'  }',
'  if(ok&&game===g){',
'   if(current!==learner){',
"    if(action.type==='attack')counter.siegeEnemyAttackActions++;",
"    if(['soul-raid','soul-discharge'].includes(action.type))counter.siegeEnemySoulOffense++;",
"    if(['attack','soul-raid','soul-discharge'].includes(action.type))",
'     counter.siegeEnemyActionsThisTurn++;',
"    if(['normal','fusion'].includes(action.type))counter.siegeSummons++;",
'   }',
'   if(enemyN>0&&!foe.field.some(Boolean))counter.lastDefenderEliminated++;',
'   counter.siegeOwnCardLosses+=Math.max(0,ownN-own.field.filter(Boolean).length);',
'   counter.siegeOpponentCardRemovals+=Math.max(0,enemyN-foe.field.filter(Boolean).length);',
'   counter.siegeOpponentLPDamage+=Math.max(0,enemyLP-foe.lp);',
'   counter.siegeOwnLPDamage+=Math.max(0,ownLP-own.lp);',
'  }',
'  return ok;'
]);
// CORE SELF-PLAY SWITCH: The true test planner must process BOTH seats.
// The old v14.9.x research harness routed only 'learner' into candidateSummon
// and candidateAttack, while its opponent received the basic AI.
inject('  if(game!==g||game.active!==learner||game.pending)return baseChoose(game,policy);',[
'  if(game===g&&!game.pending)counter.selfPlayCallsBySeat[game.active]++;',
'  if(game!==g||(!scene.selfPlay&&game.active!==learner)||game.pending)return baseChoose(game,policy);'
]);
inject('  if(selected){\n   // The reference is inspected on a clone, never mutating real phase or RNG.',[
'  if(selected){',
'   if(game===g)counter.selfPlayStrategicBySeat[game.active]++;',
'   // The reference is inspected on a clone, never mutating real phase or RNG.'
]);

// Prevent an invalid position command from turning an entire self-play run
// into a research engine crash. Legal positions still go through real switchPosition.
// Never allow pending fusion placements to be masked by this guard.
inject('  const ok=baseApply(game,action);',[
'  if(game===g&&action?.type==="switch"){',
'   const c=game.players[game.active]?.field[action.idx];',
'   if(game.pending)throw Error("Invalid pending fusion switch, no fallback allowed");',
'   if(!c||c.switched||c.attacked){',
'    counter.selfPlayIllegalSwitchesBySeat[game.active]++;',
'    throw Error("Illegal strategic switch: seat="+game.active+" idx="+action.idx+" phase="+game.aiPhase);',
'   }',
'  }',
'  const ok=baseApply(game,action);'
]);

// This function is serialized into the SAME scope as the verified simulator.
function study(){
 const fs=require('node:fs'),assert=require('node:assert/strict');
 const {boot}=require('./helpers/game-runtime.cjs');
 const {makeBenchmarkDeck}=require('./helpers/lategame-ai-decks-v72.cjs');
 const catalog=boot({seed:15290042}).run('({cards:CARDS,defaultDeck:RPG_DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:OPPONENTS})');
 const root='artifacts/v1529';fs.mkdirSync(root,{recursive:true});
 const stage=Number(process.argv[2]);
 assert.ok(Number.isInteger(stage)&&stage>=0&&stage<5);
 const matchups=[['predator','guardian'],['fusion','guardian'],['soul','guardian'],
  ['allrounder','guardian'],['guardian','soul'],['hybrid','guardian'],
  ['predator','soul'],['fusion','soul']];
 const Q=JSON.parse(fs.readFileSync(root+'/training-q-and-examples.json','utf8'));
 const knownQ=Q.find(x=>x.swarm===.02&&x.pierce===.10)?.learnedQ;
 assert.ok(knownQ&&Object.keys(knownQ).length>=160,'Missing prior Q values');
 // Fixed strategies and no stage-to-stage policy inheritance: select only after all five phases.
 const previousQ=JSON.parse(fs.readFileSync(root+'/older-q-checkpoint.json','utf8'));
 const latest=knownQ;
 assert.ok(Object.keys(previousQ).length>=160);
 const prior=JSON.parse(fs.readFileSync(root+'/prior-selfplay-checkpoint.json','utf8'));
 assert.ok(prior.holdoutUsed===false);
 const role=(guardian,soul,material,risk)=>({guardian,soul,material,risk});
 const champion=role(1.15,1.30,.85,.95);
 const profiles=[
  {name:'champion-reference',rolePolicy:champion},
  {name:'guardian-soul-reinforced',rolePolicy:role(1.36,1.48,.85,1.05)},
  {name:'guardian-material-guard',rolePolicy:role(1.15,1.32,1.35,1.45)},
  {name:'counter-guarded',rolePolicy:role(1.10,1.25,.98,1.65)},
  {name:'champion-adaptive',rolePolicy:{...role(1.15,1.30,.95,1.15),adaptive:true}}
 ];
 const shardArg=String(process.argv[3]||'');
 assert.ok(shardArg==='finalize'||/^[0-7]$/.test(shardArg),
  'Supply one pair shard 0..7 or the finalize command');
 const cases=[];
 if(shardArg==='finalize'){
  for(let p=0;p<matchups.length;p++){
   const path=root+'/stage-'+stage+'-pair-'+p+'.json';
   assert.ok(fs.existsSync(path),'Missing pair shard '+p);
   const obj=JSON.parse(fs.readFileSync(path,'utf8'));
   assert.equal(obj.stage,stage);assert.equal(obj.pair,p);
   assert.equal(obj.cases.length,120,'Each independent process must report 120 matches');
   for(const row of obj.cases){
    assert.equal(row.stage,stage);assert.equal(row.pair,p);
    cases.push(row);
   }
  }
 }else{
 const requestedPair=Number(shardArg);
 for(let pair=0;pair<matchups.length;pair++){
  if(pair!==requestedPair)continue;
  const [roleA,roleB]=matchups[pair];
  const tier=stage===0?8:stage===1?9:stage===2?10:stage===3?8:10;
  const foeTier=tier;
  for(let scenario=0;scenario<6;scenario++){
   const seedA=2600+pair*151+scenario*89+stage*541;
   const seedB=4800+pair*163+scenario*97+stage*619;
   const a=makeBenchmarkDeck(catalog,tier,roleA,'balanced',seedA);
   const b=makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);
   assert.equal(a.deck.length,40);assert.equal(b.deck.length,40);
   for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++){
    const matchSeed=15290000+stage*200000+pair*10000+scenario*431+starter*23;
    const mirror=stage<=2;
    const opp=mirror?a:b;
    const first=seat===0?a:opp,second=seat===0?opp:a;
    for(const profile of profiles){
     const foeQ=scenario%2===0?latest:previousQ;
     const foeWeights=null; // Same champion scoring on both sides, only historical Q differs.
     const m=sceneResult({deck:first.deck,fusionDeck:first.fusionDeck,
      deck1:second.deck,fusionDeck1:second.fusionDeck},
      0,matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
      starter,seat,{siegeStage:6,studyStage:stage,selfPlay:true,decision:'lookahead',q:latest,
      summonForecast:true,summonCounterDepth:2,summonThreshold:75,forecastBudget:8,
      roleAware:true,siegeWeights:null,finishMode:null,candidateRole:roleA,
      finishModesBySeat:[null,null],
      weightModesBySeat:seat===0?[null,foeWeights]:[foeWeights,null],
      rolePoliciesBySeat:seat===0?[profile.rolePolicy,champion]:[champion,profile.rolePolicy],
      qModesBySeat:seat===0?[latest,foeQ]:[foeQ,latest],
      rolesBySeat:seat===0?[roleA,mirror?roleA:roleB]:[mirror?roleA:roleB,roleA],
      recordReplay:scenario<2,
      opponentPolicy:'balanced',
      swarm:.02,pierce:.10,
      decayEnabled:false});
     assert.equal(m.invalid,0,'Illegal actions');
     assert.equal(m.initialLP[0],m.initialLP[1],'Unequal initial LP');
     const enemyAttacks=m.stats.siegeEnemyAttackActions||0;
     const enemySoul=m.stats.siegeEnemySoulOffense||0;
     assert.ok(Number.isFinite(enemyAttacks+enemySoul),'Missing opponent action counters');
     assert.deepEqual(m.stats.selfPlayIllegalSwitchesBySeat,[0,0],
      'Illegal switch emitted from strategic AI');
     assert.ok(m.stats.selfPlayCallsBySeat.every(n=>n>0),
      'Both seats MUST use the experimental AI decision planner');
     const reward=m.candidateWin*100+
      Math.min(35,(m.stats.siegeOpponentLPDamage||0)/180)+
      Math.min(15,(m.stats.siegeOpponentCardRemovals||0)*2)-
      Math.min(18,(m.stats.siegeOwnCardLosses||0)*2.5)-
      Math.min(30,m.turn*.45)-(m.timeout?20:0);
     cases.push({stage,arm:profile.name,rolePolicy:profile.rolePolicy,
      foeCheckpoint:scenario%2?'v1527':'latest',symmetric:profile.name==='champion-reference'&&scenario%2===0,
      pair,roleA,roleB:mirror?roleA:roleB,mirror,tier,foeTier,scenario,split:scenario<2?'train':scenario<4?'validation':'holdout',
      starter,seat,seed:matchSeed,seedA,seedB,
      win:m.candidateWin,reason:m.reason,timeout:m.timeout,turn:m.turn,
      enemyOffense:enemyAttacks+enemySoul,enemyAttacks,enemySoul,
      counterSuppressed:m.stats.siegeCounterBlocked||0,
      illegalSwitchesBySeat:m.stats.selfPlayIllegalSwitchesBySeat,
      selfPlayCallsBySeat:m.stats.selfPlayCallsBySeat,
      selfPlayStrategicBySeat:m.stats.selfPlayStrategicBySeat,
      selfPlayActionTypesBySeat:m.stats.selfPlayActionTypesBySeat,
      readyDirectOpportunities:m.stats.readyDirectOpportunities||0,
      missedDirectOpportunities:m.stats.missedDirectOpportunities||0,
      breachSwitches:m.stats.breachSwitches||0,breachAttacks:m.stats.breachAttacks||0,
      lastDefenderEliminated:m.stats.lastDefenderEliminated||0,
      finishWindows:m.stats.finishWindows||0,finishAttacks:m.stats.finishAttacks||0,
      finishSwitches:m.stats.finishSwitches||0,finishEnds:m.stats.finishEnds||0,
      soulDisabled:false,counterDisabled:false,
      enemySummons:m.stats.siegeSummons||0,
      enemiesRemoved:m.stats.siegeOpponentCardRemovals||0,
      ownLost:m.stats.siegeOwnCardLosses||0,
      enemyDamage:m.stats.siegeOpponentLPDamage||0,
      ownDamage:m.stats.siegeOwnLPDamage||0,reward,
      actions:scenario<2?m.stats.actionTape||[]:[]});
    }
   }
  }
 }
 assert.equal(cases.length,120,'One pair shard should have exactly 120 matches');
 fs.writeFileSync(root+'/stage-'+stage+'-pair-'+requestedPair+'.json',
  JSON.stringify({stage,pair:requestedPair,cases})+'\n');
 console.log('ARCANE_V1529_PAIR '+JSON.stringify({stage,pair:requestedPair,games:cases.length,
  splitCounts:Object.fromEntries(['train','validation','holdout'].map(t=>
   [t,cases.filter(x=>x.split===t).length]))}));
 return;
 }
 assert.equal(cases.length,960,'Stage must have 960 matched selfplay games');
 function summary(rows){
  const n=rows.length;assert.ok(n>0);
  return {games:n,wins:rows.reduce((v,r)=>v+r.win,0),
   plannerCallsBySeat:[0,1].map(seat=>rows.reduce((v,r)=>v+r.selfPlayCallsBySeat[seat],0)),
   strategicChoicesBySeat:[0,1].map(seat=>rows.reduce((v,r)=>v+r.selfPlayStrategicBySeat[seat],0)),
   timeouts:rows.filter(r=>r.timeout).length,
   meanTurns:rows.reduce((v,r)=>v+r.turn,0)/n,
   meanReward:rows.reduce((v,r)=>v+r.reward,0)/n,
   totalOpponentOffense:rows.reduce((v,r)=>v+r.enemyOffense,0),
   totalOpponentSummons:rows.reduce((v,r)=>v+r.enemySummons,0),
   meanEnemyDamage:rows.reduce((v,r)=>v+r.enemyDamage,0)/n,
   meanRemoved:rows.reduce((v,r)=>v+r.enemiesRemoved,0)/n,
   bySeat:Object.fromEntries([0,1].map(seat=>{const a=rows.filter(r=>r.seat===seat);return [seat,{games:a.length,wins:a.reduce((v,r)=>v+r.win,0),timeouts:a.filter(r=>r.timeout).length}]})),
   finishing:{directAttacks:rows.reduce((v,r)=>v+r.finishAttacks,0),stanceSwitches:rows.reduce((v,r)=>v+r.finishSwitches,0),
    breachSwitches:rows.reduce((v,r)=>v+r.breachSwitches,0),
    breachAttacks:rows.reduce((v,r)=>v+r.breachAttacks,0),
    readyDirectOpportunities:rows.reduce((v,r)=>v+r.readyDirectOpportunities,0),
    missedDirectOpportunities:rows.reduce((v,r)=>v+r.missedDirectOpportunities,0)} };
 }
 const summaries=profiles.map(profile=>{
  const rows=cases.filter(x=>x.arm===profile.name);
  return {arm:profile.name,rolePolicy:profile.rolePolicy,
   train:summary(rows.filter(x=>x.split==='train')),
   validation:summary(rows.filter(x=>x.split==='validation')),
   holdout:summary(rows.filter(x=>x.split==='holdout'))};
 });
 const baseline=summaries[0];
 const result={schema:'arcane-v1529-stage',stage,
  name:['fixed-policy-l8-mirror','fixed-policy-l9-mirror','fixed-policy-l10-mirror',
   'fixed-policy-l8-crossrole','fixed-policy-l10-crossrole'][stage],
  learningSource:'v14.9.28 validated Guardian/Soul champion against fixed counterfactual challengers',
  controls:{pairedSeeds:true,pairedSeats:true,pairedStarters:true,
   independentTrainValidationHoldout:true,priorQCheckpointOpponent:true,
   holdoutNeverUsedForSelection:true,globalSelectionOnly:true,
   noStageToStagePolicyInheritance:true,
   bothSidesUseChampionRoleScoring:true,championProvenanceRun:39974390088},
  selectionMethod:'NO stage promotion; global five-stage selection after TRAIN and VALIDATION, HOLDOUT diagnostic only.',
  chosenArm:'champion-reference',selectedRolePolicy:champion,
  previousSelectedRolePolicy:null,promoted:false,
  trainCandidate:baseline.train,trainBaseline:baseline.train,
  validationCandidate:baseline.validation,validationBaseline:baseline.validation,
  holdoutCandidate:baseline.holdout,holdoutBaseline:baseline.holdout,
  summaries,allCases:cases.map(({actions,...row})=>row)};
 fs.writeFileSync(root+'/stage-'+stage+'.json',JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(root+'/stage-'+stage+'-train-actions.json',JSON.stringify({
  schema:'arcane-v1529-training-only-actions',stage,
  examples:cases.filter(x=>x.split==='train').map(x=>({
   arm:x.arm,pair:x.pair,roleA:x.roleA,roleB:x.roleB,
   win:x.win,turn:x.turn,reward:x.reward,actions:x.actions
  }))})+'\n');
 console.log('ARCANE_V1529_STAGE '+JSON.stringify({stage,name:result.name,
  winner:'champion-reference',policies:profiles.map(p=>p.name),
  training:baseline.train,validation:baseline.validation,holdout:baseline.holdout,
  baselineHoldout:baseline.holdout,games:cases.length}));
}
const inner='\nnew Function("require","process","console",src+"\\n("+'
 +JSON.stringify(study.toString())+'+")()")(require,process,console);';
new Function('require','process','console',
 prefix+'\n'+patchLines.join('\n')+inner)(require,process,console);
