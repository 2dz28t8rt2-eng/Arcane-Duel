'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('tests/ai-v1493-extensive-strategy-replay-training.cjs','utf8');
src=src.slice(0,src.indexOf("\nconst crypto=require('node:crypto');"));
function patch(a,b){assert.equal(src.split(a).length-1,1,'patch failure: '+a.slice(0,80));src=src.replace(a,b);}
patch('step=Number(process.argv[2])','step=0');
patch("const root='artifacts/v1493'","const root='artifacts/v1516'");
patch("enemy:{deck:scene.deck,fusionDeck:scene.fusionDeck,enhancements:{},power:1,flatBonus:0},",
 "enemy:{deck:scene.deck1||scene.deck,fusionDeck:scene.fusionDeck1||scene.fusionDeck,enhancements:{},power:1,flatBonus:0},");
patch("strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:true}});",
 "strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:true,predatorSwarmPercent:scene.swarm,predatorArmorPierce:scene.pierce}});");
patch(" second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));\n second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];\n second.fusionDeck=[...first.fusionDeck];second.remainingFusion=[...first.remainingFusion];",
 [
 " if(scene.deck1){",
 "  for(const [owner,ids] of [[0,scene.deck],[1,scene.deck1]]){",
 "   const p=g.players[owner];",
 "   p.hand=ids.slice(0,5).map(id=>newInstance(g,id,owner));",
 "   p.deck=ids.slice(5);p.originalDeck=[...ids];",
 "   p.fusionDeck=[...(owner===0?scene.fusionDeck:(scene.fusionDeck1||scene.fusionDeck))];p.remainingFusion=[...p.fusionDeck];",
 "  }",
 " }else{",
 "  second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));",
 "  second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];",
 "  second.fusionDeck=[...first.fusionDeck];second.remainingFusion=[...first.remainingFusion];",
 " }"
 ].join('\n'));
patch(" if(opening(first)!==opening(second))throw Error('Unmatched opening');",
 " if(!scene.deck1&&opening(first)!==opening(second))throw Error('Unmatched opening');");
patch(" if(!scene.deck1&&opening(first)!==opening(second))throw Error('Unmatched opening');",
 [
 " if(!scene.deck1&&opening(first)!==opening(second))throw Error('Unmatched opening');",
 " if(scene.defenderLead){",
 "  // Deliberately HARD defender stress arm: move two REAL cards from",
 "  // the opponent's existing deck onto a hard 2-DEF + 1-ATK opening. No duplicates.",
 "  const op=g.players[1-scene.candidateSeat];",
 "  for(let slot=0;slot<3;slot++){",
 "   const ranked=op.deck.map(id=>({id,score:",
 "    (['guardian','soul'].includes(CARDS[id]?.role)?1e6:0)+",
 "    (CARDS[id]?.def||0)})).sort((a,b)=>b.score-a.score);",
 "   const pick=ranked[0];if(!pick)break;",
 "   op.deck.splice(op.deck.indexOf(pick.id),1);",
 "   const monster=newInstance(g,pick.id,1-scene.candidateSeat);",
 "   monster.mode=slot<2?'def':'atk';monster.summonedTurn=0;op.field[slot]=monster;",
 "  }",
 "  op.lp+=2000; // Explicit research-only extra opponent LP handicap.",
 " }"
 ].join('\n'));
patch(" const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length;",
 " const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length,\n   predators=field.filter(c=>role(c)==='predator').length;");
patch("   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);",
 "   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);\n   if(type==='predator'&&scene.swarm)score+=scene.swarm*dataOf(c).atk*(predators+1)*2.2;");
patch("  ranking.sort((a,b)=>b.score-a.score);",["  ranking.sort((a,b)=>b.score-a.score);","  if(scene.summonForecast&&ranking.length>1&&","     g.turn>=Math.max(2,g.strategicTraining.noAttackTurns+1)&&",
"     g.players[1-g.active].field.some(Boolean)&&",
"     (counter.summonForecastChecks||0)<(scene.forecastBudget||8)){","   const actor=g.active,op=1-actor,options=ranking.slice(0,4);","   function utility(x){","    const score=p=>p.lp+p.field.filter(Boolean).reduce((v,c)=>{","     const d=dataOf(c);return v+d.atk*.56+d.def*.52+120;},0);","    const own=x.players[actor],enemy=x.players[op];","    const swarm=own.field.filter(c=>c&&role(c)==='predator').length;","    return score(own)-score(enemy)+swarm*swarm*45;","   }","   function simulate(entry){","    const x=JSON.parse(JSON.stringify(g));","    try{","     if(!applyAiAction(x,entry.a))return -Infinity;","     if(x.pending){","      const place=x.players[actor].field.findIndex(c=>!c);","      if(place<0||!applyAiAction(x,{type:'place',idx:place}))return -Infinity;","     }","     const before=utility(x);","     if(x.winner===null&&g.turn>=g.strategicTraining.noAttackTurns){","      x.active=op;x.turn++;x.aiPhase='attacks';","      for(const c of x.players[op].field)if(c)c.attacked=false;","      const response=attackPlan(x);","      if(response&&Number.isInteger(response.ai)&&attack(x,response.ai,response.di))counter.firstCounterAttacks=(counter.firstCounterAttacks||0)+1;",
"      if(scene.summonCounterDepth>=2&&x.winner===null){",
"       counter.secondCounterChecks=(counter.secondCounterChecks||0)+1;",
"       if(x.players[op].field.some(c=>c&&canAttack(x,c)))counter.secondCounterOpportunities=(counter.secondCounterOpportunities||0)+1;",
"       const second=attackPlan(x);",
"       if(second&&Number.isInteger(second.ai)){",
"        if(attack(x,second.ai,second.di))counter.doubleCounterAttacks=(counter.doubleCounterAttacks||0)+1;",
"       }",
"      }","     }","     counter.summonForecastLegal=(counter.summonForecastLegal||0)+1;","     const future=utility(x);",
"     const own=x.players[actor],foe=x.players[op];",
"     const hostileAtk=foe.field.filter(Boolean).reduce((n,c)=>Math.max(n,dataOf(c).atk),0);",
"     const fragile=own.field.filter(Boolean).reduce((n,c)=>{",
"      const d=dataOf(c),armor=c.mode==='def'?d.def:d.atk;",
"      return n+Math.max(0,hostileAtk-armor)*.12;",
"     },0);",
"     return before*.2+future*.8+entry.score*.2-(scene.riskAware?fragile:0);","    }catch(e){return -Infinity;}","   }","   let selected=options[0],best=simulate(selected);","   for(const item of options.slice(1)){","    const score=simulate(item);","    if(score>best+(scene.summonThreshold||75)){selected=item;best=score;}","   }","   counter.summonForecastChecks=(counter.summonForecastChecks||0)+1;","   if(selected!==options[0]){","    ranking.splice(ranking.indexOf(selected),1);ranking.unshift(selected);","    counter.summonForecastChanges=(counter.summonForecastChanges||0)+1;","    if(selected.a.type==='fusion')","     counter.fusionForecastChanges=(counter.fusionForecastChanges||0)+1;","   }","  }"].join('\n'));
patch("  options.sort((a,b)=>b.score-a.score);",
 [
 "  options.sort((a,b)=>b.score-a.score);",
 "  if(scene.q&&scene.decision!=='heuristic'&&options.length){",
 "  const heuristic=options[0];",
 "  const predators=options.filter(o=>role(team.field[o.a.ai])==='predator');",
 "  const count=team.field.filter(c=>c&&role(c)==='predator').length;",
 "  const band=count===1?'solo':count===2?'pair':count===3?'trio':'pack';",
 "  function qScore(o){",
 "   const t=o.a.di===null?null:foe.field[o.a.di];if(!t)return -Infinity;",
 "   const mode=t.mode==='def'?'def':'atk';",
 "   const kind=['guardian','soul'].includes(role(t))?'defender':'other';",
 "   const defense=Math.max(1,mode==='def'?dataOf(t).def:dataOf(t).atk);",
 "   const ratio=dataOf(team.field[o.a.ai]).atk/defense;",
 "   const bandAtk=ratio<.5?'low':ratio<.85?'mid':ratio<1.1?'near':'high';",
 "   const health=team.lp<2000?'critical':team.lp<5000?'mid':'safe';",
 "   return scene.q[['attack',mode,kind,bandAtk,health,'swarm:'+band].join('|')]?.mean??-Infinity;",
 "  }",
 "  predators.sort((a,b)=>qScore(b)-qScore(a));",
 "  const qOption=predators[0],pass=scene.q['pass|swarm:'+band]?.mean??0;",
 "  const confidence=qOption?qScore(qOption)-pass:-Infinity;",
 "  if(scene.decision==='raw-Q'&&qOption&&confidence>0){",
 "   counter.qDecisions=(counter.qDecisions||0)+1;",
 "   return qOption.a;",
 "  }",
 "  const conservative=qOption&&confidence>=.25&&",
 "   qOption.score>0&&qOption.score>=Math.max(0,heuristic.score-140);",
 "  if(scene.decision==='gated-Q'&&conservative){",
 "   if(qOption!==heuristic)counter.qDecisions=(counter.qDecisions||0)+1;",
 "   return qOption.a;",
 "  }",
 "  // Bounded two-own-turn visible-board rollout. Never inspect a rival hand,",
 "  // future draws or secret fusion stock. Only current ATK actions and one",
 "  // public opponent counterattack are simulated. No privileged information.",
 "  if(scene.decision==='lookahead'){",
 "  const candidates=options.slice(0,3);",
 "  if(conservative&&!candidates.includes(qOption))candidates.push(qOption);",
 "  const actor=g.active,enemy=1-actor;",
 "  function evalBoard(state){",
 "   const side=(p)=>{",
 "    const fs=p.field.filter(Boolean),board=fs.reduce((n,c)=>{",
 "     const d=dataOf(c),ess=c.essenceCombat?.soul||0;",
 "     if(!scene.riskAware)return n+d.atk*.53+d.def*.48+Math.min(300,ess)*.4;",
"     const r=role(c),foe=state.players.find(q=>q!==p),enemy=foe.field.filter(Boolean);",
"     const peak=enemy.length?Math.max(...enemy.map(e=>dataOf(e).atk)):0;",
"     const cover=c.mode==='def'?d.def*(['guardian','soul'].includes(r)?1.35:1):d.atk;",
"     const exposure=Math.max(0,peak-cover)*.20;",
"     const retention=r==='soul'?Math.min(450,ess)*.95:",
"       r==='guardian'&&c.mode==='def'?d.def*.11:0;",
"     const stability=c.mode==='def'?d.def*.64+d.atk*.42:d.atk*.51+d.def*.38;",
"     return n+stability+retention-exposure;",
 "    },0);",
 "    return p.lp+board+fs.length*120;",
 "   };",
 "   return side(state.players[actor])-side(state.players[enemy]);",
 "  }",
 "  const start=evalBoard(g);",
 "  function rollout(opt){",
 "   const first=JSON.parse(JSON.stringify(g));",
 "   if(!attack(first,opt.a.ai,opt.a.di))return -Infinity;",
 "   if(first.winner===null){",
 "    first.active=enemy;first.turn++;first.aiPhase='attacks';",
 "    for(const u of first.players[enemy].field)if(u){u.attacked=false;u.switched=false;}",
 "    const response=attackPlan(first);",
 "    if(response&&Number.isInteger(response.ai)&&attack(first,response.ai,response.di))counter.attackFirstCounters=(counter.attackFirstCounters||0)+1;",
"    if(scene.summonCounterDepth>=2&&first.winner===null){",
"      counter.attackSecondChecks=(counter.attackSecondChecks||0)+1;",
"      if(first.players[enemy].field.some(c=>c&&canAttack(first,c)))counter.attackSecondOpportunities=(counter.attackSecondOpportunities||0)+1;",
"      const nextCounter=attackPlan(first);",
"      if(nextCounter&&Number.isInteger(nextCounter.ai)&&attack(first,nextCounter.ai,nextCounter.di))counter.attackSecondCounters=(counter.attackSecondCounters||0)+1;",
"    }",
 "   }",
 "   if(first.winner===null){",
 "    first.active=actor;first.turn++;first.aiPhase='attacks';",
 "    for(const u of first.players[actor].field)if(u){u.attacked=false;u.switched=false;}",
 "    let best=null,bestValue=evalBoard(first);",
 "    for(let i=0;i<5;i++){",
 "     const atk=first.players[actor].field[i];",
 "     if(!atk||!canAttack(first,atk))continue;",
 "     const targets=first.players[enemy].field.some(Boolean)?",
 "      first.players[enemy].field.map((u,j)=>u?j:-1).filter(j=>j>=0):[null];",
 "     for(const t of targets){",
 "      const next=JSON.parse(JSON.stringify(first));",
 "      if(!attack(next,i,t))continue;",
 "      const v=evalBoard(next);",
 "      if(v>bestValue){bestValue=v;best=next;}",
 "     }",
 "    }",
 "    if(best)first.players=best.players,first.winner=best.winner;",
 "   }",
 "   const win=first.winner===actor?100000:first.winner===enemy?-100000:0;",
 "   return win+(evalBoard(first)-start)+opt.score*.2;",
 "  }",
 "  const initial=rollout(heuristic);",
 "  let chosen=heuristic,chosenScore=initial;",
 "  for(const option of candidates){",
 "   if(option===heuristic)continue;",
 "   const future=rollout(option);",
 "   if(future>chosenScore+(scene.riskAware?65:80)){chosen=option;chosenScore=future;}",
 "  }",
 "  counter.lookaheadChecks=(counter.lookaheadChecks||0)+1;",
 "  if(chosen!==heuristic){",
 "   counter.lookaheadChanges=(counter.lookaheadChanges||0)+1;",
 "   if(chosen===qOption)counter.qDecisions=(counter.qDecisions||0)+1;",
 "   return chosen.a;",
 "  }",
 "  }",
 "  }"
 ].join('\n'));
patch("   try{aiTurn(g,g.active===learner?'balanced':'balanced');}",
"   try{aiTurn(g,g.active===learner?'balanced':(scene.opponentPolicy||'balanced'));}");
patch("function sceneResult(deck,warmup,seed,profile,starter,candidateSeat){",
 "function sceneResult(deck,warmup,seed,profile,starter,candidateSeat,extras={}){");
patch("  seed,profile,warmup,starter,candidateSeat};",
 "  seed,profile,warmup,starter,candidateSeat,...extras};");


// attackPlan returns {ai,di,score}, NOT {type:'attack',ai,di}. Validate attacker index, then apply through the real engine.
// Record only candidate decisions on training cases, never an opponent's hidden hand.
patch("soulActionsBySeat:[0,0]};","soulActionsBySeat:[0,0],actionTape:[]};");
patch(" applyAiAction=function(game,action){",[
" applyAiAction=function(game,action){",
"  if(game===g&&scene.recordReplay&&game.active===learner){",
"   const player=game.players[learner],foe=game.players[1-learner];",
"   const actor=action?.uid?player.hand.find(c=>c.uid===action.uid):",
"    Number.isInteger(action?.ai)?player.field[action.ai]:",
"    Number.isInteger(action?.idx)?player.field[action.idx]:null;",
"   counter.actionTape.push({turn:game.turn,phase:game.aiPhase,type:action?.type||'unknown',",
"    actorRole:actor?role(actor):null,ownLP:player.lp,enemyLP:foe.lp,",
"    ownRoles:player.field.filter(Boolean).map(c=>role(c)),",
"    enemyRoles:foe.field.filter(Boolean).map(c=>role(c)),",
"    ownCount:player.field.filter(Boolean).length,enemyCount:foe.field.filter(Boolean).length});",
"  }"
].join('\n'));
patch(" const startLP=g.players.map(p=>p.lp);",[
" if(scene.deck1){",
"  if(JSON.stringify([...first.hand.map(c=>c.id),...first.deck])!==JSON.stringify(scene.deck))",
"   throw Error('Player 0 deck/hand deviates from assigned source');",
"  if(JSON.stringify([...second.hand.map(c=>c.id),...second.deck])!==JSON.stringify(scene.deck1))",
"   throw Error('Player 1 deck/hand deviates from assigned source');",
"  if(JSON.stringify(first.remainingFusion)!==JSON.stringify(scene.fusionDeck))",
"   throw Error('Player 0 fusion stock deviates');",
"  if(JSON.stringify(second.remainingFusion)!==JSON.stringify(scene.fusionDeck1||scene.fusionDeck))",
"   throw Error('Player 1 fusion stock deviates');",
" }",
" const startLP=g.players.map(p=>p.lp);"
].join('\n'));

function runStudy(){
 const shardIndex=Number(process.argv[2]),shardCount=40;
 assert.ok(Number.isInteger(shardIndex)&&shardIndex>=0&&shardIndex<shardCount);
 const qData=JSON.parse(fs.readFileSync('artifacts/v1516/training-q-and-examples.json','utf8'));
 const models=[
  {label:'baseline-heuristic',decision:'heuristic',forecast:false,depth:1},
  {label:'gated-Q',decision:'gated-Q',forecast:false,depth:1},
  {label:'Q-one-counter-planner',decision:'lookahead',forecast:true,depth:1},
  {label:'Q-two-counter-planner',decision:'lookahead',forecast:true,depth:2},
  {label:'Q-two-counter-risk-aware',decision:'lookahead',forecast:true,depth:2,riskAware:true}];
 const roles=['predator','guardian','soul','fusion','hybrid','allrounder'];
 const pairs=[];
 for(const a of roles)for(const b of roles)if(a!==b)pairs.push([a,b]);
 const mirror=shardIndex>=32;
 const matchup=mirror?[roles[(shardIndex-32)%6],roles[(shardIndex-32)%6]]:
  shardIndex===30?['predator','guardian']:
  shardIndex===31?['fusion','guardian']:pairs[shardIndex];
 const tier=[7,10][shardIndex%2],stage=[0,6,10][Math.floor(shardIndex/2)%3];
 const candidateRole=matchup[0],opponentRole=matchup[1],out=[];
 for(let scenario=0;scenario<4;scenario++){
  const seedA=1200+shardIndex*97+scenario*31;
  const seedB=1700+shardIndex*97+scenario*31;
  assert.ok(seedA<=9999&&seedB<=9999);
  const candidate=makeBenchmarkDeck(catalog,tier,candidateRole,'balanced',seedA);
  const opponent=mirror?candidate:makeBenchmarkDeck(catalog,tier,opponentRole,'balanced',seedB);
  assert.equal(candidate.deck.length,40);assert.equal(opponent.deck.length,40);
  const learned=qData.find(x=>x.swarm===.02&&x.pierce===.10)?.learnedQ;
  assert.ok(learned&&Object.keys(learned).length>=160,'Lost persistent research Q');
  for(const starter of [0,1])for(const seat of [0,1]){
   const matchSeed=15160000+shardIndex*10000+scenario*100+starter*7;
   const deck0=seat===0?candidate:opponent,deck1=seat===0?opponent:candidate;
   for(const model of models){
    const result=sceneResult({deck:deck0.deck,fusionDeck:deck0.fusionDeck,
      deck1:deck1.deck,fusionDeck1:deck1.fusionDeck},
      stage,matchSeed,
      {name:'forecast',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
      starter,seat,{swarm:.02,pierce:.10,decision:model.decision,
       q:model.decision==='heuristic'?null:learned,
       summonForecast:model.forecast,summonCounterDepth:model.depth,
       summonThreshold:75,forecastBudget:8,riskAware:!!model.riskAware,recordReplay:scenario<3,
       opponentPolicy:['guardian','soul'].includes(opponentRole)?'economy':'offensive'});
    assert.equal(result.invalid,0,'Illegal AI action');
    assert.ok(result.initialLP.every(Number.isFinite)&&result.initialLP[0]>0);
    assert.equal(result.initialLP[0],result.initialLP[1],'Unfair starting LP');
    assert.equal(result.stats.prebattleOffensiveSouls,0,'Early Soul extraction');
    if(result.firstAttackTurn!==null)assert.ok(result.firstAttackTurn>stage);
    out.push({arm:model.label,shardIndex,mirror,tier,stage,scenario,starter,seat,
     candidateRole,opponentRole,deckSeedA:seedA,deckSeedB:mirror?seedA:seedB,
     matchSeed,split:scenario===3?'holdout':'train',win:result.candidateWin,
     timeout:result.timeout,initialLP:result.initialLP,
     qMoves:result.stats.qDecisions||0,
     lookaheadChecks:result.stats.lookaheadChecks||0,
     lookaheadChanges:result.stats.lookaheadChanges||0,
     summonChecks:result.stats.summonForecastChecks||0,
     summonLegal:result.stats.summonForecastLegal||0,
     summonChanges:result.stats.summonForecastChanges||0,
     fusionChanges:result.stats.fusionForecastChanges||0,
     doubleCounters:result.stats.doubleCounterAttacks||0,
     firstCounterAttacks:result.stats.firstCounterAttacks||0,
     secondCounterChecks:result.stats.secondCounterChecks||0,
     secondCounterOpportunities:result.stats.secondCounterOpportunities||0,
     attackFirstCounters:result.stats.attackFirstCounters||0,
     attackSecondChecks:result.stats.attackSecondChecks||0,
     attackSecondOpportunities:result.stats.attackSecondOpportunities||0,
     attackSecondCounters:result.stats.attackSecondCounters||0,
     soulActions:(result.stats.soulActionsBySeat||[0,0])[seat],
     chosenActionTypes:result.stats.byType||{},
     actionTape:scenario<3?result.stats.actionTape||[]:[]});
   }
  }
 }
 assert.equal(out.length,80,'Incomplete balanced crossover shard');
 fs.mkdirSync('artifacts/v1516/shards',{recursive:true});
 fs.writeFileSync('artifacts/v1516/shards/part-'+String(shardIndex).padStart(2,'0')+'.json',
  JSON.stringify({schema:'arcane-v1516-crossdeck-shard',shardIndex,shardCount,
   duelsPerShard:80,sourceSha:process.env.GITHUB_SHA||'unknown',cases:out})+'\n');
 console.log('ARCANE_V1516_SHARD '+JSON.stringify({shardIndex,candidateRole,opponentRole,
   mirror,tier,stage,games:out.length,wins:out.reduce((n,x)=>n+x.win,0),
   trainingTapeActions:out.reduce((n,r)=>n+r.actionTape.length,0)}));
}
new Function('require','process','console',src+'\n('+runStudy.toString()+')()')(require,process,console);
