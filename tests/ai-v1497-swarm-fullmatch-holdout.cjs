'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('tests/ai-v1493-extensive-strategy-replay-training.cjs','utf8');
src=src.slice(0,src.indexOf("\nconst crypto=require('node:crypto');"));
function patch(a,b){assert.equal(src.split(a).length-1,1,'patch failure: '+a.slice(0,80));src=src.replace(a,b);}
patch('step=Number(process.argv[2])','step=0');
patch("const root='artifacts/v1493'","const root='artifacts/v1497'");
patch("enemy:{deck:scene.deck,fusionDeck:scene.fusionDeck,enhancements:{},power:1,flatBonus:0},",
 "enemy:{deck:scene.deck1||scene.deck,fusionDeck:scene.fusionDeck,enhancements:{},power:1,flatBonus:0},");
patch("strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:true}});",
 "strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:true,predatorSwarmPercent:scene.swarm,predatorArmorPierce:scene.pierce}});");
patch(" second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));\n second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];\n second.fusionDeck=[...first.fusionDeck];second.remainingFusion=[...first.remainingFusion];",
 [
 " if(scene.deck1){",
 "  for(const [owner,ids] of [[0,scene.deck],[1,scene.deck1]]){",
 "   const p=g.players[owner];",
 "   p.hand=ids.slice(0,5).map(id=>newInstance(g,id,owner));",
 "   p.deck=ids.slice(5);p.originalDeck=[...ids];",
 "   p.fusionDeck=[...scene.fusionDeck];p.remainingFusion=[...scene.fusionDeck];",
 "  }",
 " }else{",
 "  second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));",
 "  second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];",
 "  second.fusionDeck=[...first.fusionDeck];second.remainingFusion=[...first.remainingFusion];",
 " }"
 ].join('\n'));
patch(" if(opening(first)!==opening(second))throw Error('Unmatched opening');",
 " if(!scene.deck1&&opening(first)!==opening(second))throw Error('Unmatched opening');");
patch(" const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length;",
 " const guardians=field.filter(c=>role(c)==='guardian').length,\n   souls=field.filter(c=>role(c)==='soul').length,\n   predators=field.filter(c=>role(c)==='predator').length;");
patch("   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);",
 "   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+\n    (type==='guardian'?souls*scene.profile.synergy*260:0);\n   if(type==='predator'&&scene.swarm)score+=scene.swarm*dataOf(c).atk*(predators+1)*2.2;");
patch("  options.sort((a,b)=>b.score-a.score);",
 [
 "  if(scene.learnQ&&scene.q){",
 "   const mine=options.filter(o=>role(team.field[o.a.ai])==='predator');",
 "   const count=team.field.filter(c=>c&&role(c)==='predator').length;",
 "   const band=count===1?'solo':count===2?'pair':count===3?'trio':'pack';",
 "   function scoreQ(o){",
 "    const t=o.a.di===null?null:foe.field[o.a.di];if(!t)return -Infinity;",
 "    const mode=t.mode==='def'?'def':'atk';",
 "    const kind=['guardian','soul'].includes(role(t))?'defender':'other';",
 "    const defense=Math.max(1,mode==='def'?dataOf(t).def:dataOf(t).atk);",
 "    const ratio=dataOf(team.field[o.a.ai]).atk/defense;",
 "    const bandAtk=ratio<.5?'low':ratio<.85?'mid':ratio<1.1?'near':'high';",
 "    const health=team.lp<2000?'critical':team.lp<5000?'mid':'safe';",
 "    const key=['attack',mode,kind,bandAtk,health,'swarm:'+band].join('|');",
 "    return scene.q[key]?.mean??-Infinity;",
 "   }",
 "   mine.sort((a,b)=>scoreQ(b)-scoreQ(a));",
 "   const passQ=scene.q['pass|swarm:'+band]?.mean??0;",
 "   if(mine[0]&&Number.isFinite(scoreQ(mine[0]))&&scoreQ(mine[0])>passQ){",
 "    counter.qDecisions=(counter.qDecisions||0)+1;",
 "    return mine[0].a;",
 "   }",
 "  }",
 "  options.sort((a,b)=>b.score-a.score);"
 ].join('\n'));
patch("function sceneResult(deck,warmup,seed,profile,starter,candidateSeat){",
 "function sceneResult(deck,warmup,seed,profile,starter,candidateSeat,extras={}){");
patch("  seed,profile,warmup,starter,candidateSeat};",
 "  seed,profile,warmup,starter,candidateSeat,...extras};");
function runStudy(){
 const data=JSON.parse(fs.readFileSync('artifacts/v1497/training-q-and-examples.json','utf8'));
 const arms=[
  {label:'control',swarm:0,pierce:0,learnQ:false},
  {label:'swarm',swarm:.02,pierce:0,learnQ:false},
  {label:'swarm-plus-Q',swarm:.02,pierce:0,learnQ:true},
  {label:'swarm-pierce-Q',swarm:.02,pierce:.08,learnQ:true}
 ];
 const stages=[0,6,10],styles=['guardian','soul','fusion','hybrid'];
 const out=[],stats={};
 for(const stage of stages)for(let j=0;j<styles.length;j++)for(let i=0;i<3;i++){
  const tier=i%2?10:9,seed=2300+stage*7+j*133+i*31;
  const pred=makeBenchmarkDeck(catalog,tier,'predator','balanced',seed);
  const enemy=makeBenchmarkDeck(catalog,tier,styles[j],'balanced',seed+17);
  for(const arm of arms)for(const starter of [0,1])for(const seat of [0,1]){
   const deck=seat===0?pred.deck:enemy.deck,deck1=seat===0?enemy.deck:pred.deck;
   const matchSeed=14977000+stage*1000+j*160+i*14+starter*3;
   const weights=arm.learnQ?data.find(x=>x.swarm===arm.swarm&&x.pierce===arm.pierce)?.learnedQ:null;
   const result=sceneResult({deck,fusionDeck:pred.fusionDeck},stage,matchSeed,
    {name:'forecast',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
    starter,seat,{deck1,swarm:arm.swarm,pierce:arm.pierce,learnQ:arm.learnQ,q:weights});
   assert.equal(result.invalid,0,'Illegal AI action');
   assert.equal(result.stats.prebattleOffensiveSouls,0,'Early Soul extraction');
   if(result.firstAttackTurn!==null)assert.ok(result.firstAttackTurn>stage);
   const row={arm:arm.label,stage,opponent:styles[j],scenario:i,
    seat,starter,win:result.candidateWin,timeout:result.timeout,qMoves:result.stats.qDecisions||0};
   out.push(row);
   const x=stats[arm.label]||(stats[arm.label]={games:0,wins:0,timeouts:0,seatWins:[0,0],qMoves:0,stage:{},opponents:{}});
   x.games++;x.wins+=row.win;x.timeouts+=Number(row.timeout);x.seatWins[seat]+=row.win;x.qMoves+=row.qMoves;
   const st=x.stage[stage]||(x.stage[stage]={games:0,wins:0});st.games++;st.wins+=row.win;
   const op=x.opponents[styles[j]]||(x.opponents[styles[j]]={games:0,wins:0});op.games++;op.wins+=row.win;
  }
 }
 const report={schema:'arcane-v1497-predator-swarm-fullmatch',status:'completed',
  sourceSha:process.env.GITHUB_SHA||'unknown',totalMatches:out.length,stages,opponents:styles,
  controls:{roleActive:true,researchOnly:true,freezeOpponent:'balanced',seatsMirrored:true,startersMirrored:true,arenaLPDecayDisabled:true,QWeightsFromSeparateTraining:true,productionEnabled:false},
  arms:arms.map(a=>({...a,qKeys:a.learnQ?Object.keys(data.find(x=>x.swarm===a.swarm&&x.pierce===a.pierce)?.learnedQ||{}).length:0,...stats[a.label]})),
  limitations:['Q values trained only on separate tactical public-board situations.',
   'Full 40-card Predator decks versus 40-card opponent archetype decks, both seats and starter directions.',
   'Different archetype decks have different hands. No artificial matching of cross-role hands.',
   'The frozen balanced opponent is not a full league of independent strong champions.',
   'Arena LP decay disabled only for research; no production promotion.']};
 assert.equal(report.totalMatches,576);
 for(const arm of report.arms){assert.equal(arm.games,144);if(arm.learnQ)assert.ok(arm.qKeys>0);}
 fs.writeFileSync('artifacts/v1497/fullmatch.json',JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync('artifacts/v1497/fullmatch-cases.json',JSON.stringify(out,null,2)+'\n');
 console.log('ARCANE_V1497_FULLMATCH '+JSON.stringify({matches:out.length,arms:report.arms}));
}
new Function('require','process','console',src+'\n('+runStudy.toString()+')()')(require,process,console);
