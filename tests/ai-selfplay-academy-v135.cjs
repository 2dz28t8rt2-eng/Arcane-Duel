'use strict';
/* v13.5 SELF-PLAY FOUNDATION.
 * Equal source-legal constructed decks on BOTH sides (PvE rules retained).
 * Real state transitions, both start orders, policy league, outcome-based
 * evolution, immutable independent evaluation, replay memory across runs.
 * No production deployment or claims about earned collections.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeBenchmarkDeck,STYLES,roster}=require('./helpers/lategame-ai-decks-v72.cjs');
const catalog=boot({seed:135011}).run(`(()=>({
 cards:CARDS.map(c=>c?({id:c.id,level:c.level,atk:c.atk,def:c.def,
  role:c.role,source:c.source,requiredTier:c.requiredTier,hard:c.hard,
  ace:c.ace,retired:c.retired,enemyOnly:c.enemyOnly,
  essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,
  eventOnly:c.eventOnly,questOnly:c.questOnly,
  legendaryOnly:c.legendaryOnly,fate:c.fate}):null),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({level:o.level,loot:[...o.loot]}))
}))()`);
const modelPath=process.env.ARCANE_SELFPLAY_PRIOR||'';
const fresh={
 schema:'arcane-selfplay-v135',generation:0,
 weights:{attack:1.0,defense:.34,material:.46,cardCost:.27,
 decay:.25,pressure:.48,ace:1.25,risk:1.15,quality:.1,
 kill:1.5,direct:1.0,guard:.4},
 league:[],episodes:0,trainingDuels:0,
 source:'v13.5 independent selfplay foundation'
};
const memory=modelPath&&fs.existsSync(modelPath)?
 JSON.parse(fs.readFileSync(modelPath,'utf8')):fresh;
assert.equal(memory.schema,'arcane-selfplay-v135');
assert.equal(Object.keys(memory.weights).length,12);
const cap=Math.max(2,Math.min(12,Number(process.env.ARCANE_SELFPLAY_CANDIDATES||8)));
const gamesPer=Math.max(1,Math.min(8,Number(process.env.ARCANE_SELFPLAY_REPEATS||3)));
const holdRepeats=Math.max(1,Math.min(5,Number(process.env.ARCANE_SELFPLAY_HOLDOUT_REPEATS||3)));
let state=135135;function rand(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}
const keys=Object.keys(fresh.weights);
const bounds={attack:[.4,1.8],defense:[0,1.2],material:[0,1.6],
 cardCost:[0,1],decay:[0,1.2],pressure:[0,1.4],
 ace:[0,3],risk:[.3,3],quality:[0,.7],
 kill:[.4,3],direct:[.4,2],guard:[0,1.5]};
const pool=[{name:'incumbent',weights:memory.weights}];
if(memory.league?.length)pool.push({name:'historical-champion',
 weights:memory.league[0].weights});
for(let i=pool.length;i<cap;i++){
 const w={...memory.weights};
 for(const k of keys)if(rand()<.55){
  const [lo,hi]=bounds[k];
  w[k]=Math.min(hi,Math.max(lo,w[k]+(rand()*2-1)*(.16+.12*(i%3))*(hi-lo)));
 }
 pool.push({name:'challenger-'+i,weights:w});
}
function build(tier,style,variant,seed){
 const d=makeBenchmarkDeck(catalog,tier,style,variant,seed);
 const allowed=roster(catalog,tier);
 assert.equal(d.deck.length,40);assert.ok(d.fusionDeck.length>=2);
 for(const id of [...d.deck,...d.fusionDeck])assert.ok(allowed.allowed(catalog.cards[id]));
 return d;
}
// Evaluates only visible information and actor's own private hand.
// Do not access the opposite player's hand, deck, future RNG or state.
function selfPlay135(g,w,stats){
 if(g.mode!=='pve'||g.pending||g.winner!==null)return null;
 const me=g.players[g.active],enemy=g.players[1-g.active];
 const hostile=enemy.field.filter(Boolean),own=me.field.filter(Boolean);
 const maxAtk=Math.max(0,...hostile.map(c=>dataOf(c).atk));
 const maxWall=Math.max(0,...hostile.map(c=>dataOf(c)[c.mode==='def'?'def':'atk']));
 const ace=hostile.filter(c=>CARDS[c.id]?.ace);
 if(ace.length)stats.aceSightings++;
 if(g.aiPhase==='summon'&&!g.summoned&&me.field.some(c=>!c)){
  const hand=me.hand.filter(c=>!isFateCard(c)).slice(0,5);
  if(!hand.length)return null;
  let winner=null,options=0;
  function consider(t,parts,isFusion){
   const d=isFusion?{atk:baseStat(t,'atk',me),def:baseStat(t,'def',me),
    level:t.level}:dataOf(parts[0]);
   const penalty=(isFusion?parts.reduce((n,c)=>n+dataOf(c).atk,0)-
    Math.max(...parts.map(c=>dataOf(c).atk)):0)/1000;
   const budget=(isFusion?ASCENSION_DECAY_BY_LEVEL[Math.max(1,Math.min(10,d.level))]:
    creatureDecayRate(g,parts[0],g.active))/100;
   const counter=hostile.some(c=>d.atk>dataOf(c)[c.mode==='def'?'def':'atk']);
   const aceKill=ace.some(c=>d.atk>dataOf(c)[c.mode==='def'?'def':'atk']);
   const score=w.attack*d.atk/1000+w.defense*d.def/1000
    -w.material*penalty-w.cardCost*(parts.length-1)
    -w.decay*budget+w.pressure*Number(counter)
    +w.ace*Number(aceKill)+w.quality*(isFusion?Math.min(4,qualityRolls(parts.map(c=>dataOf(c).level))):0)
    +w.kill*Number(d.atk>maxWall&&hostile.length)
    +w.guard*Number(d.def>=maxAtk);
   if(!winner||score>winner.score){
    winner={score,action:isFusion?{type:'fusion',uids:parts.map(c=>c.uid),choice:t.id}:
     {type:'normal',uid:parts[0].uid}};
   }
   options++;
  }
  for(const c of hand)consider(c,[c],false);
  for(let mask=1;mask<(1<<hand.length);mask++){
   const parts=hand.filter((c,i)=>(mask&(1<<i))!==0);
   if(parts.length<2||parts.length>5)continue;
   const levels=parts.map(c=>dataOf(c).level);
   for(const t of fusionOptions(g,levels,parts)){
    if(me.remainingFusion.includes(t.id)&&canCompleteHandFusion(g,levels,t.id)){
     consider(t,parts,true);stats.legalFusionChoices++;
    }
   }
  }
  stats.summons++;stats.examined+=options;
  if(winner){
   if(winner.action.type==='fusion')stats.fusions++;
   g.aiPhase='positions';return winner.action;
  }
 }
 if(g.aiPhase==='attacks'&&g.turn>1){
  let best=null,score=-Infinity;
  for(let i=0;i<me.field.length;i++){
   const c=me.field[i];if(!c||!canAttack(g,c))continue;
   const legal=hostile.length?
    enemy.field.map((v,j)=>({v,j})).filter(x=>x.v):
    [{v:null,j:null}];
   for(const {v,j} of legal){
    const atk=effectiveAttack(g,c,v);
    const d=v?dataOf(v):null;
    const wall=d?d[v.mode==='def'?'def':'atk']:0;
    const kill=d&&atk>wall;
    const losing=d&&v.mode==='atk'&&atk<=d.atk;
    const direct=!v;
    const s=(direct?w.direct*atk/1000:0)
     +(kill?w.kill*(1+d.atk/2000):0)
     -(losing?w.risk*dataOf(c).atk/1000:0)
     +(kill&&CARDS[v.id]?.ace?w.ace:0)
     +(direct&&atk>=enemy.lp+enemy.shield?100:0)
     -(v&&!kill&&!losing?.25:0);
    if(s>score){score=s;best={type:'attack',ai:i,di:j};}
    stats.examined++;
   }
  }
  if(best&&score>=-.25){stats.attacks++;return best;}
 }
 return null;
}
function newStats135(){return {summons:0,fusions:0,attacks:0,examined:0,
 legalFusionChoices:0,aceSightings:0,invalid:0,actions:0};}
const injection=[selfPlay135,newStats135].map(f=>f.toString()).join('\n');
function duel(deck,seed,a,b,starter){
 const runtime=boot({seed:seed+17,x128Mode:'full'});
 runtime.exec(injection);
 runtime.exec('var SELF_A='+JSON.stringify(a)+';var SELF_B='+JSON.stringify(b)+';');
 const options={mode:'pve',context:'free',opponentId:0,
  seed,starter,deck:deck.deck,fusionDeck:deck.fusionDeck,
  enemy:{deck:deck.deck,fusionDeck:deck.fusionDeck,power:1,flatBonus:0},
  difficulty:'easy'};
 const expr=[
 '(()=>{const g=createGame(',JSON.stringify(options),');',
 'const stats=[newStats135(),newStats135()],old=chooseAiAction,apply=applyAiAction;',
 'const hiddenLeakCheck=()=>true;',
 'chooseAiAction=function(game,style){',
 'if(game!==g)return old(game,style);',
 'const actor=game.active,w=actor===0?SELF_A:SELF_B;',
 'const action=selfPlay135(game,w,stats[actor]);',
 'return action||old(game,style);};',
 'applyAiAction=function(game,action){const actor=game.active,ok=apply(game,action);',
 'if(game===g){stats[actor].actions++;if(!ok)stats[actor].invalid++;}return ok;};',
 'try{simulateGame(g,"balanced","balanced");}finally{chooseAiAction=old;applyAiAction=apply;}',
 'return {winner:g.winner,turns:g.turn,lp:g.players.map(p=>p.lp),',
 'shields:g.players.map(p=>p.shield),stats};})()'
 ].join('');
 const r=runtime.run(expr,240000);
 assert.ok([0,1].includes(r.winner));
 assert.equal(r.stats[0].invalid+r.stats[1].invalid,0);
 return r;
}
function faceoff(d,seed,a,b){
 const r1=duel(d,seed,a,b,0);
 const r2=duel(d,seed,a,b,1);
 const r3=duel(d,seed+500000,b,a,0);
 const r4=duel(d,seed+500000,b,a,1);
 const games=[r1,r2,r3,r4];
 const points=games.reduce((n,r,i)=>n+(r.winner===(i>=2?1:0)?1:0),0);
 return {points,games};
}
const trainStyles=['predator','guardian','fusion','hybrid'];
const trainDecks=trainStyles.map((style,i)=>build(9+(i%2),style,'balanced',1350+i*97));
const holdDecks=['soul','allrounder','tempo'].map((style,i)=>build(9+i%2,style,'specialist',9300+i*89));
assert.ok(!holdDecks.some(d=>trainDecks.some(t=>t.fingerprint===d.fingerprint)));
const training=[];
for(const challenger of pool){
 let earned=0,played=0,fusions=0,attacks=0;
 for(let i=0;i<trainDecks.length;i++)
  for(let rep=0;rep<gamesPer;rep++){
   const r=faceoff(trainDecks[i],135000+i*911+rep*53,
    challenger.weights,memory.weights);
   earned+=r.points;played+=r.games.length;
   fusions+=r.games.reduce((n,g)=>n+g.stats[0].fusions+g.stats[1].fusions,0);
   attacks+=r.games.reduce((n,g)=>n+g.stats[0].attacks+g.stats[1].attacks,0);
  }
 const performance={name:challenger.name,weights:challenger.weights,
  wins:earned,duels:played,rate:earned/played,fusions,attacks};
 training.push(performance);
 console.log('ARCANE_V135_TRAIN '+JSON.stringify({
  name:performance.name,wins:earned,duels:played,winRate:performance.rate,
  fusions,attacks}));
}
training.sort((a,b)=>b.rate-a.rate||b.fusions-a.fusions||a.name.localeCompare(b.name));
const selected=training[0];
const previous=memory.weights;
const comparisons=[];
for(let i=0;i<holdDecks.length;i++)
 for(let rep=0;rep<holdRepeats;rep++){
  const result=faceoff(holdDecks[i],735000+i*1111+rep*59,selected.weights,previous);
  comparisons.push({style:holdDecks[i].style,tier:holdDecks[i].tier,
   variant:holdDecks[i].variant,rep,fingerprint:holdDecks[i].fingerprint,
   candidateWins:result.points,total:4,
   turns:result.games.map(r=>r.turns),
   fusions:result.games.map(r=>r.stats.map(s=>s.fusions)),
   actions:result.games.map(r=>r.stats.map(s=>s.actions))});
 }
const holdoutWins=comparisons.reduce((n,r)=>n+r.candidateWins,0);
const total=comparisons.reduce((n,r)=>n+r.total,0);
const promotionEligible=holdRepeats>=2&&holdoutWins>total/2+
 Math.max(1,Math.floor(total*.05));
const next={
 schema:'arcane-selfplay-v135',
 generation:memory.generation+1,
 weights:promotionEligible?selected.weights:memory.weights,
 league:[{name:'generation-'+(memory.generation+1),weights:selected.weights,
   selectedOnTrainingOnly:true,promotionEligible,independentWins:holdoutWins,
   independentGames:total},...(memory.league||[])].slice(0,12),
 episodes:memory.episodes+training.reduce((n,r)=>n+r.duels,0)+total,
 trainingDuels:memory.trainingDuels+training.reduce((n,r)=>n+r.duels,0),
 source:'continued from v13.5 frozen training archive',
 productionIntegrated:false
};
const report={
 schema:'arcane-v135-selfplay-report',
 result:'completed',method:'real-engine equal-deck mirrored self-play and outcome-ranked strategy mutation',
 trainingMatches:training.reduce((n,r)=>n+r.duels,0),
 holdoutDuels:total,trainedCandidates:pool.length,
 selected: selected.name,selectionOnTrainingOnly:true,
 equalDecksBothSides:true,pairedStartPlayer:true,pairedPolicySideSwaps:true,
 noEnemyPrivateHandRead:true,sourceLegalConstructedNotEarned:true,
 playerAndNpcSamePolicyFunction:true,
 learningFromPriorRun:memory.generation>0,
 priorGeneration:memory.generation,nextGeneration:next.generation,
 holdoutWins,holdoutTotal:total,holdoutRate:holdoutWins/total,
 promotionEligible,championUpdated:promotionEligible,
 trainingLeaderboard:training.map(r=>({name:r.name,wins:r.wins,
  duels:r.duels,rate:r.rate,fusions:r.fusions,attacks:r.attacks})),
 holdoutCases:comparisons,productionIntegrated:false,
 limitations:[
  'Policy updates occur between generations, not continuously within a duel',
  'Only active normal hand summoning, fusion, and attacks scored experimentally; remaining rules use game AI fallback',
  'Mirrored PvE deck loadouts use actual PvE rules; some character-side perks are intrinsically asymmetric and need isolated parity audits',
  'No claim of neural network, complete mastery, perfect opponent modeling or exhaustive game tree search',
  'Persist the archive artifact for the next run, do not select based on holdout'
 ]
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-v135-selfplay-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/ai-v135-selfplay-memory.json',JSON.stringify(next,null,2)+'\n');
console.log('ARCANE_V135_SUMMARY '+JSON.stringify({
 trainingMatches:report.trainingMatches,holdoutDuels:total,
 selected:selected.name,holdoutWins,promotionEligible,
 generation:next.generation,productionIntegrated:false}));
