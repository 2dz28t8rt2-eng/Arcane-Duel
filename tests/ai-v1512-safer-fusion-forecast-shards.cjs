'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('tests/ai-v1493-extensive-strategy-replay-training.cjs','utf8');
src=src.slice(0,src.indexOf("\nconst crypto=require('node:crypto');"));
function patch(a,b){assert.equal(src.split(a).length-1,1,'patch failure: '+a.slice(0,80));src=src.replace(a,b);}
patch('step=Number(process.argv[2])','step=0');
patch("const root='artifacts/v1493'","const root='artifacts/v1512'");
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
 "   const fusionIds=owner===0?scene.fusionDeck:(scene.fusionDeck1||scene.fusionDeck);",
  "   p.fusionDeck=[...fusionIds];p.remainingFusion=[...fusionIds];",
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
 "  // HARD defender stress arm: move THREE REAL cards from",
 "  // the opponent's existing deck onto their DEF board. No duplicates.",
 "  const op=g.players[1-scene.candidateSeat];",
 "  for(let slot=0;slot<3;slot++){",
 "   const ranked=op.deck.map(id=>({id,score:",
 "    (['guardian','soul'].includes(CARDS[id]?.role)?1e6:0)+",
 "    (CARDS[id]?.def||0)})).sort((a,b)=>b.score-a.score);",
 "   const pick=ranked[0];if(!pick)break;",
 "   op.deck.splice(op.deck.indexOf(pick.id),1);",
 "   const monster=newInstance(g,pick.id,1-scene.candidateSeat);",
 "   monster.mode='def';monster.summonedTurn=0;op.field[slot]=monster;",
 "  }",
 " }"
 ].join('\n'));
patch(" const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length;",
 " const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length,\n   predators=field.filter(c=>role(c)==='predator').length;");
patch("   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);",
 "   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);\n   if(type==='predator'&&scene.swarm)score+=scene.swarm*dataOf(c).atk*(predators+1)*2.2;");
patch("  ranking.sort((a,b)=>b.score-a.score);",["  ranking.sort((a,b)=>b.score-a.score);","  if(scene.summonForecast&&ranking.length>1&&","     (counter.summonForecastChecks||0)<4){","   const actor=g.active,op=1-actor,options=ranking.slice(0,4);","   function utility(x){","    const score=p=>p.lp+p.field.filter(Boolean).reduce((v,c)=>{","     const d=dataOf(c);return v+d.atk*.56+d.def*.52+120;},0);","    const own=x.players[actor],enemy=x.players[op];","    const swarm=own.field.filter(c=>c&&role(c)==='predator').length;","    return score(own)-score(enemy)+swarm*swarm*45;","   }","   function simulate(entry){","    const x=JSON.parse(JSON.stringify(g));","    try{","     if(!applyAiAction(x,entry.a))return -Infinity;","     if(x.pending){","      const place=x.players[actor].field.findIndex(c=>!c);","      if(place<0||!applyAiAction(x,{type:'place',idx:place}))return -Infinity;","     }","     const before=utility(x);","     if(x.winner===null&&g.turn>=g.strategicTraining.noAttackTurns){","      x.active=op;x.turn++;x.aiPhase='attacks';","      for(const c of x.players[op].field)if(c)c.attacked=false;","      const response=attackPlan(x);","      if(response?.type==='attack')attack(x,response.ai,response.di);","     }","     counter.summonForecastLegal=(counter.summonForecastLegal||0)+1;","     return before*.2+utility(x)*.8+entry.score*.2;","    }catch(e){return -Infinity;}","   }","   let selected=options[0],best=simulate(selected);",
"   const safe=scene.safeSummon===true,original=options[0];",
"   const margin=safe?210:75;",
"   for(const item of options.slice(1)){",
"    // Only override a trusted heuristic when the card value and",
"    // the counterattacked public board both support the change.",
"    if(safe&&item.score<original.score-190)continue;",
"    const score=simulate(item);",
"    if(!Number.isFinite(score))continue;",
"    if(score>best+margin){selected=item;best=score;}",
"   }","   counter.summonForecastChecks=(counter.summonForecastChecks||0)+1;","   if(selected!==options[0]){","    ranking.splice(ranking.indexOf(selected),1);ranking.unshift(selected);","    counter.summonForecastChanges=(counter.summonForecastChanges||0)+1;","    if(selected.a.type==='fusion')","     counter.fusionForecastChanges=(counter.fusionForecastChanges||0)+1;","   }","  }"].join('\n'));
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
 "     return n+d.atk*.53+d.def*.48+Math.min(300,ess)*.4;",
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
 "    if(response&&response.type==='attack')attack(first,response.ai,response.di);",
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
 "   if(future>chosenScore+80){chosen=option;chosenScore=future;}",
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
function runStudy(){
 // ONE small shard per fresh Node.js process: V8/VM contexts cannot pile up
 // across 1,536 games. 24 shards x 64 games, no gameplay rule changes.
 const shardIndex=Number(process.argv[2]);
 assert.ok(Number.isInteger(shardIndex)&&shardIndex>=0&&shardIndex<24,
  'Run a shard index 0..23, never all 1536 games in a single Node.js heap');
 const data=JSON.parse(fs.readFileSync('artifacts/v1512/training-q-and-examples.json','utf8'));
 const arms=[
  {label:'baseline-heuristic',swarm:.02,pierce:.10,decision:'heuristic',summonForecast:false,safeSummon:false},
  {label:'gated-Q',swarm:.02,pierce:.10,decision:'gated-Q',summonForecast:false,safeSummon:false},
  {label:'old-fusion-and-attacks',swarm:.02,pierce:.10,decision:'lookahead',summonForecast:true,safeSummon:false},
  {label:'conservative-fusion-and-attacks',swarm:.02,pierce:.10,decision:'lookahead',summonForecast:true,safeSummon:true}
 ];
 const stages=[0,6,10],styles=['guardian','soul','fusion','hybrid'];
 const out=[],stats={};
 for(const defenderLead of [false,true])for(const stage of stages)for(let j=0;j<styles.length;j++){
  const expectedShard=(defenderLead?12:0)+stages.indexOf(stage)*styles.length+j;
  if(expectedShard!==shardIndex)continue;
  for(let i=0;i<4;i++){
  // The source-gated 40-card deck generator accepts integer seeds from 0 to 9999.
  // Keep a distinct study seed family without changing the generator contract.
  const tier=i%2?10:9,seed=4200+stage*43+j*137+i*37;
  assert.ok(Number.isInteger(seed)&&seed>=0&&seed<=9999,
   'Benchmark deck seed outside supported 0..9999 range: '+seed);
  const pred=makeBenchmarkDeck(catalog,tier,'predator','balanced',seed);
  const enemy=makeBenchmarkDeck(catalog,tier,styles[j],'balanced',seed+17);
  for(const arm of arms)for(const starter of [0,1])for(const seat of [0,1]){
   const deck=seat===0?pred.deck:enemy.deck,deck1=seat===0?enemy.deck:pred.deck;
   const fusionDeck=seat===0?pred.fusionDeck:enemy.fusionDeck,
     fusionDeck1=seat===0?enemy.fusionDeck:pred.fusionDeck;
   const matchSeed=15120000+Number(defenderLead)*100000+stage*1000+j*160+i*14+starter*3;
   const opponentPolicy=['economy','economy','offensive','offensive'][j];
   const weights=arm.decision==='heuristic'?null:data.find(x=>x.swarm===arm.swarm&&x.pierce===arm.pierce)?.learnedQ;
   const result=sceneResult({deck,fusionDeck},stage,matchSeed,
    {name:'forecast',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
    starter,seat,{deck1,fusionDeck1,swarm:arm.swarm,pierce:arm.pierce,decision:arm.decision,q:weights,defenderLead,summonForecast:arm.summonForecast,safeSummon:arm.safeSummon,opponentPolicy});
   assert.equal(result.invalid,0,'Illegal AI action');
   assert.equal(result.stats.prebattleOffensiveSouls,0,'Early Soul extraction');
   if(result.firstAttackTurn!==null)assert.ok(result.firstAttackTurn>stage);
   const row={arm:arm.label,defenderLead,stage,opponent:styles[j],opponentPolicy,scenario:i,
    seat,starter,win:result.candidateWin,timeout:result.timeout,
    qMoves:result.stats.qDecisions||0,lookaheadChecks:result.stats.lookaheadChecks||0,
    lookaheadChanges:result.stats.lookaheadChanges||0,
    summonChecks:result.stats.summonForecastChecks||0,summonLegal:result.stats.summonForecastLegal||0,
    summonChanges:result.stats.summonForecastChanges||0,fusionChanges:result.stats.fusionForecastChanges||0};
   out.push(row);
   const key=arm.label+(defenderLead?'-hard-defender':'-normal');
   const x=stats[key]||(stats[key]={games:0,wins:0,timeouts:0,seatWins:[0,0],qMoves:0,lookaheadChecks:0,lookaheadChanges:0,summonChecks:0,summonLegal:0,summonChanges:0,fusionChanges:0,stage:{},opponents:{}});
   x.games++;x.wins+=row.win;x.timeouts+=Number(row.timeout);x.seatWins[seat]+=row.win;x.qMoves+=row.qMoves;x.lookaheadChecks+=row.lookaheadChecks;x.lookaheadChanges+=row.lookaheadChanges;x.summonChecks+=row.summonChecks;x.summonLegal+=row.summonLegal;x.summonChanges+=row.summonChanges;x.fusionChanges+=row.fusionChanges;
   const st=x.stage[stage]||(x.stage[stage]={games:0,wins:0});st.games++;st.wins+=row.win;
   const op=x.opponents[styles[j]]||(x.opponents[styles[j]]={games:0,wins:0});op.games++;op.wins+=row.win;
  }
 }
 }
 // Every shard covers exactly one (defender-start, stage, enemy archetype)
 // combination, four source-valid 40-card deck sets, four AI policies, and
 // both starter/seat configurations. Persist raw cases, not partial totals.
 assert.equal(out.length,64,'Expected exactly 64 duels per fresh heap');
 const shardOut='artifacts/v1512/shards';
 fs.mkdirSync(shardOut,{recursive:true});
 const file=shardOut+'/part-'+String(shardIndex).padStart(2,'0')+'.json';
 const record={schema:'arcane-v1512-predator-fusion-shard',shardIndex,
  shardCount:24,duelsPerShard:64,sourceSha:process.env.GITHUB_SHA||'unknown',
  cases:out};
 fs.writeFileSync(file,JSON.stringify(record)+'\n');
 console.log('ARCANE_V1512_SHARD '+JSON.stringify({shard:shardIndex,
  count:out.length,win:out.reduce((n,x)=>n+x.win,0),
  simulatedSummons:out.reduce((n,x)=>n+x.summonLegal,0),
  qChanges:out.reduce((n,x)=>n+x.qMoves,0)}));

}
new Function('require','process','console',src+'\n('+runStudy.toString()+')()')(require,process,console);
