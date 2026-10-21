'use strict';
/* Arcane Duel v13.5 experimental on-policy SELF-PLAY.
 * Legal full-engine actions on BOTH seats. Outcomes train a shared tactical
 * policy via REINFORCE; cross-policy games and historical experience replay
 * prevent a purely self-referential training loop.
 * No changes to actual PvE AI, player's collection or economy.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {STYLES,makeBenchmarkDeck,roster}=require('./helpers/lategame-ai-decks-v72.cjs');
const KEY='arcane-v135-selfplay-checkpoint',N=15;
const defaultWeights=[.20,.18,.14,.20,.17,.08,.25,.14,.12,.24,.13,.13,.10,.12,.14];
function validWeights(w){return Array.isArray(w)&&w.length===N&&w.every(x=>Number.isFinite(x)&&Math.abs(x)<=3);}
const catalog=boot({seed:13507,x128Mode:'full'}).run('(()=>({cards:CARDS.map(c=>c?({id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,source:c.source,requiredTier:c.requiredTier,hard:c.hard,ace:c.ace,retired:c.retired,enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,questOnly:c.questOnly,legendaryOnly:c.legendaryOnly,fate:c.fate}):null),defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],opponents:RPG_OPPONENTS.map(o=>({loot:[...o.loot]}))}))()');
const preFile='artifacts/prev/ai-v135-checkpoint.json',repoFile='models/ai-selfplay-v135.json';
const previous=fs.existsSync(preFile)?JSON.parse(fs.readFileSync(preFile,'utf8')):
 fs.existsSync(repoFile)?JSON.parse(fs.readFileSync(repoFile,'utf8')):null;
if(previous){assert.equal(previous.schema,KEY);assert.ok(validWeights(previous.weights));}
const startingWeights=previous?[...previous.weights]:[...defaultWeights];
let weights=[...startingWeights],replay=previous?.replay||[];
assert.ok(Array.isArray(replay)&&replay.length<=120);
const counter={
 resumedFromPriorCheckpoint:!!previous,previousGames:previous?.gamesTrained||0,
 replayEpisodesAvailable:replay.length,episodeCount:0,
 trainingActions:0,replayUpdates:0,supportActions:0,
 mirroredDuels:0,crossArchetypeDuels:0,frozenOpponentDuels:0,
 illegal:0,perSide:{0:0,1:0}
};
function ownedDeck(tier,style,variant,seed){
 const d=makeBenchmarkDeck(catalog,tier,style,variant,seed);
 assert.equal(d.deck.length,40);
 assert.ok(d.fusionDeck.length>=2);
 for(const id of [...d.deck,...d.fusionDeck])
  assert.ok(roster(catalog,tier).allowed(catalog.cards[id]));
 return d;
}
// Runtime-injected functions have no access to Node modules or to trainer
// state. The only information used by choose135 is its OWN hand, both
// PUBLIC boards, both life totals, rules and its legal actions.
function feature135({atk=0,def=0,kind='none',level=0,decay=0,
 enemyPower=0,kill=0,lethal=0,counter=0,ace=0,support=0,
 materialCost=0,extraCards=0,allyGuard=0,risk=0,pressure=0}){
 const clamp=x=>Math.max(-3,Math.min(3,x));
 return [clamp(atk/1400),clamp(def/1400),
  Number(kind==='fusion'),Number(kind==='normal'),Number(kind==='attack'),
  clamp((atk-enemyPower)/2000),Number(kill),Number(lethal),Number(ace),
  clamp(support/150),clamp(pressure),clamp(-materialCost/1500),
  clamp(-extraCards),clamp(-risk/1600),clamp(allyGuard)];
}
function choices135(g,st){
 const side=g.active,p=g.players[side],other=g.players[1-side];
 if(g.winner!==null||g.pending)return [];
 const opponents=other.field.map((c,i)=>({c,i})).filter(x=>x.c);
 const enemyPower=Math.max(0,...opponents.map(x=>dataOf(x.c).atk));
 const all=[],push=(action,features,base)=>all.push({action,features,base});
 if(g.aiPhase==='summon'&&!g.summoned){
  if(p.field.every(Boolean))return [];
  const hand=p.hand.filter(c=>!isFateCard(c)).slice(0,5);
  for(const c of hand){
   const d=dataOf(c);
   const clears=opponents.filter(x=>d.atk>(x.c.mode==='def'?dataOf(x.c).def:dataOf(x.c).atk)).length;
   const adjacentSupport=Number(['guardian','soul'].includes(d.role)&&
    p.field.some(t=>t&&['guardian','soul'].includes(dataOf(t).role)&&dataOf(t).role!==d.role));
   const f=feature135({atk:d.atk,def:d.def,kind:'normal',level:d.level,
    enemyPower,decay:creatureDecayRate(g,c,side),kill:clears>0,
    ace:CARDS[c.id]?.ace,pressure:Math.min(2,clears),allyGuard:adjacentSupport});
   push({type:'normal',uid:c.uid},f,
    d.atk/1800+.25*d.def/1800+.48*Number(clears>0)+.32*adjacentSupport
    -.2*creatureDecayRate(g,c,side)/160);
  }
  const visit=(chosen,start)=>{
   if(chosen.length>=2){
    const levels=chosen.map(c=>dataOf(c).level);
    const options=fusionOptions(g,levels,chosen).filter(c=>
     p.remainingFusion.includes(c.id)&&canCompleteHandFusion(g,levels,c.id));
    for(const card of options){
     const atk=baseStat(card,'atk',p),def=baseStat(card,'def',p);
     const strength=Math.max(...chosen.map(x=>dataOf(x).atk));
     const sacrificed=chosen.reduce((n,c)=>n+dataOf(c).atk,0)-strength;
     const clears=opponents.filter(x=>atk>(x.c.mode==='def'?dataOf(x.c).def:dataOf(x.c).atk)).length;
     const f=feature135({atk,def,kind:'fusion',level:card.level,
      enemyPower,kill:clears>0,ace:card.ace,
      materialCost:sacrificed,extraCards:chosen.length-1,
      pressure:Math.min(2,clears),risk:(ASCENSION_DECAY_BY_LEVEL[card.level]||0)*2});
     push({type:'fusion',uids:chosen.map(x=>x.uid),choice:card.id},f,
      atk/1800+.25*def/1800+.48*Number(clears>0)
      -.28*(chosen.length-1)-.22*sacrificed/1500
      -(ASCENSION_DECAY_BY_LEVEL[card.level]||0)/800
      +Math.min(4,qualityRolls(levels))*.04);
    }
   }
   if(chosen.length>=5)return;
   for(let i=start;i<hand.length;i++)visit([...chosen,hand[i]],i+1);
  };
  visit([],0);
 }else if(g.aiPhase==='positions'){
  const current=p.field.filter(Boolean),guards=current.filter(c=>['guardian','soul'].includes(dataOf(c).role));
  for(let i=0;i<p.field.length;i++){
   const c=p.field[i];if(!c||c.attacked||c.switched)continue;
   const d=dataOf(c),isSupport=['guardian','soul'].includes(d.role);
   if(c.mode==='def'){
    const canBreak=opponents.some(t=>effectiveAttack(g,c,t.c)>(t.c.mode==='def'?dataOf(t.c).def:dataOf(t.c).atk));
    if(canBreak||!opponents.length){
     const f=feature135({atk:d.atk,def:d.def,kind:'attack',enemyPower,
       pressure:Number(canBreak),kill:Number(canBreak),risk:Math.max(0,enemyPower-d.atk)});
     push({type:'switch',idx:i},f,.18+Number(canBreak)*.45-isSupport*.4);
    }
   }else{
    const improves=d.def>d.atk*1.06&&enemyPower>d.atk;
    if(improves){
     const f=feature135({atk:d.atk,def:d.def,kind:'none',enemyPower,
      allyGuard:Number(isSupport),risk:Math.max(0,enemyPower-d.def)});
     push({type:'switch',idx:i},f,.1+Number(isSupport)*.3);
    }
   }
  }
  push({type:'advance-phase'},Array(15).fill(0),.22);
 }else if(g.aiPhase==='attacks'){
  const attackers=p.field.map((c,i)=>({c,i})).filter(x=>canAttack(g,x.c));
  for(const x of attackers){
   const d=dataOf(x.c);
   if(!opponents.length){
    const amount=effectiveAttack(g,x.c,null);
    const lethal=amount>=other.lp+(other.shield||0);
    push({type:'attack',ai:x.i,di:null},
      feature135({atk:amount,def:d.def,kind:'attack',enemyPower:0,
       lethal,pressure:Math.min(2,amount/2000)}),
      amount/1250+Number(lethal)*15);
   }else for(const y of opponents){
    const resistance=y.c.mode==='def'?dataOf(y.c).def:dataOf(y.c).atk;
    const atk=effectiveAttack(g,x.c,y.c),kill=atk>resistance;
    const tie=atk===resistance&&y.c.mode==='atk';
    const unsafe=atk<resistance&&y.c.mode==='atk';
    const defBlock=y.c.mode==='def'&&atk<resistance;
    const ace=!!CARDS[y.c.id]?.ace;
    const risk=unsafe?d.atk:defBlock?resistance-atk:0;
    push({type:'attack',ai:x.i,di:y.i},
      feature135({atk,def:d.def,kind:'attack',enemyPower:resistance,
       kill,tie,ace,support:0,risk,
       pressure:kill?1+.35*dataOf(y.c).atk/1200:0}),
      kill?.95+dataOf(y.c).atk/1500:tie?.10:
      unsafe?-2.8-d.atk/1500:defBlock?-.75-(resistance-atk)/1400:-.1);
   }
  }
  // Rule-validated adjacent guardian/soul healing and Soul-Drain.
  for(let i=0;i<p.field.length;i++){
   const c=p.field[i];
   if(!c||c.mode!=='def'||c.attacked||c.switched)continue;
   const d=dataOf(c);
   if(d.role==='guardian')for(const j of [i-1,i+1]){
    const patient=p.field[j];
    if(!patient||dataOf(patient).role!=='soul')continue;
    const missing=Math.max(0,baseStat(CARDS[patient.id],'def',p)-patient.card.def);
    if(missing<20)continue;
    const gain=Math.min(missing,Math.max(45,Math.round(d.def*.22)));
    push({type:'arcane-guardian-heal',guardian:i,ally:j},
      feature135({kind:'none',def:d.def,support:gain,allyGuard:1,enemyPower}),
      gain/240+.5);
   }
   if(d.role==='soul')for(const y of opponents){
    const stat=y.c.mode==='def'?'def':'atk';
    const amount=Math.min(120,Math.ceil(y.c.card?.[stat]*.10));
    if(amount<1)continue;
    push({type:'arcane-soul-extract',slot:i,target:y.i},
      feature135({kind:'none',def:d.def,support:amount,
        pressure:1,enemyPower,ace:CARDS[y.c.id]?.ace}),
      amount/210+.42);
   }
  }
  push({type:'end'},Array(15).fill(0),-.42);
 }
 return all;
}
function decision135(g,w,explore,trace,stat){
 if(g.pending||g.winner!==null)return null;
 if(!['summon','positions','attacks'].includes(g.aiPhase))return null;
 const choices=choices135(g,stat);
 if(!choices.length)return null;
 const scores=choices.map(c=>c.base+c.features.reduce((n,x,i)=>n+x*w[i],0));
 let chosen=0,probs=null;
 if(explore){
  const temp=.6,peak=Math.max(...scores);
  const values=scores.map(x=>Math.exp(Math.max(-40,(x-peak)/temp)));
  const total=values.reduce((n,x)=>n+x,0);probs=values.map(x=>x/total);
  let r=Math.random();
  for(let i=0;i<probs.length;i++){r-=probs[i];if(r<=0){chosen=i;break;}}
 }else for(let i=1;i<scores.length;i++)if(scores[i]>scores[chosen])chosen=i;
 const item=choices[chosen];
 if(explore&&choices.length>1&&trace){
  const avg=Array(15).fill(0);
  for(let i=0;i<choices.length;i++)for(let k=0;k<15;k++)
    avg[k]+=choices[i].features[k]*probs[i];
  trace.push({side:g.active,turn:g.turn,
    grad:item.features.map((x,k)=>+(x-avg[k]).toFixed(5))});
 }
 stat.choices++;stat.bySide[g.active]++;
 if(item.action.type==='arcane-soul-extract'||item.action.type==='arcane-guardian-heal')
  stat.support++;
 if(item.action.type==='fusion')stat.fusions++;
 if(item.action.type==='attack')stat.attacks++;
 if(item.action.type==='advance-phase'){
  g.aiPhase='attacks';
  return decision135(g,w,explore,trace,stat)||{type:'end'};
 }
 if(item.action.type==='end')g.aiPhase='guard';
 return item.action;
}
const injected=[feature135,choices135,decision135].map(f=>f.toString()).join('\n');
const zeroStat=()=>({choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,invalid:0});
function play(s,seatConfig,{policy=weights,explore=false,trace=false}={}){
 const vm=boot({seed:s.seed+91,x128Mode:'full'});
 vm.exec(injected);
 const ws={current:policy,archived:startingWeights};
 vm.exec('var ARCANE135_WEIGHTS='+JSON.stringify(ws)+';');
 const setting={
  mode:'pve',context:s.kind==='boss'?'tournament':'free',
  opponentId:s.kind==='boss'?s.tier:0,
  seed:s.seed,starter:s.starter,
  difficulty:s.kind==='boss'?'easy':'hard',
  deck:s.left.deck,fusionDeck:s.left.fusionDeck
 };
 if(s.kind!=='boss')setting.enemy={
  deck:s.right.deck,fusionDeck:s.right.fusionDeck,
  power:1,flatBonus:0,enhancements:{}
 };
 const code=[
  '(()=>{profile=freshProfile();profile.guideSeen=true;',
  'const g=createGame(',JSON.stringify(setting),');',
  'if(',String(s.kind!=='boss'),'){g.maxLP=10000;g.players.forEach(p=>p.lp=10000);}',
  'let decisions=[];const tally=',JSON.stringify(zeroStat()),';',
  'const types=',JSON.stringify(seatConfig),';',
  'const oldChoose=chooseAiAction,oldApply=applyAiAction;',
  'chooseAiAction=function(game,mode){',
  'if(game!==g)return oldChoose(game,mode);',
  'const p=types[game.active];if(p==="engine")return oldChoose(game,mode);',
  'const a=decision135(game,ARCANE135_WEIGHTS[p],',String(explore),',',
   String(trace)?'decisions':'null',',tally);',
  'return a||oldChoose(game,mode);};',
  'applyAiAction=function(game,action){const result=oldApply(game,action);',
  'if(game===g&&!result)tally.invalid++;return result;};',
  'try{simulateGame(g,"balanced","balanced");}finally{',
   'chooseAiAction=oldChoose;applyAiAction=oldApply;}',
  'return {winner:g.winner,turns:g.turn,',
   'lp:g.players.map(p=>p.lp),shield:g.players.map(p=>p.shield),',
   'decisions,tally,seed:g.seed};',
  '})()'
 ].join('');
 const r=vm.run(code,240000);
 assert.ok([0,1].includes(r.winner),'No winner');
 assert.equal(r.tally.invalid,0,'Game engine refused policy action');
 return r;
}
const count=Number(process.env.ARCANE_V135_EPISODES||120);
const hold=Number(process.env.ARCANE_V135_HOLDOUT||3);
assert.ok(Number.isInteger(count)&&count>=8&&count<=400);
assert.ok(Number.isInteger(hold)&&hold>=1&&hold<=6);
function trainScenario(i){
 const tier=[7,9,10][i%3],style=STYLES[(Math.floor(i/3)+i)%STYLES.length];
 const variant=['balanced','veteran'][Math.floor(i/21)%2];
 const seed=135000+i*109+tier*101;
 const otherStyle=STYLES[(STYLES.indexOf(style)+2+i)%STYLES.length];
 const kind=i%5===0?'cross':'mirror';
 return {tier,kind,seed,starter:i%2,
  left:ownedDeck(tier,style,variant,1300+(i*13)%3400),
  right:kind==='mirror'?null:ownedDeck(tier,otherStyle,variant,2500+(i*17)%3200)};
}
function evalScenario(i,tier,kind='mirror'){
 const style=STYLES[i%STYLES.length];
 const variant=['starter-heavy','specialist'][Math.floor(i/STYLES.length)%2];
 const seed=835000+tier*1700+i*59+(kind==='cross'?100000:0);
 const left=ownedDeck(tier,style,variant,6200+(i*11)%3000);
 const right=kind==='cross'?ownedDeck(tier,STYLES[(i+3)%STYLES.length],
  variant,7100+(i*19)%2800):left;
 return {tier,kind,seed,starter:i%2,left,right};
}
const trainSet=Array.from({length:count},(_,i)=>{
 const s=trainScenario(i);if(!s.right)s.right=s.left;return s;
});
const trainFingerprints=new Set(trainSet.flatMap(x=>[x.left.fingerprint,x.right.fingerprint]));
const holdSet=[];
for(const tier of [7,9,10])for(const kind of ['mirror','cross'])
 for(let i=0;i<STYLES.length*hold;i++)holdSet.push(evalScenario(i,tier,kind));
assert.ok(!holdSet.some(s=>trainFingerprints.has(s.left.fingerprint)||
 trainFingerprints.has(s.right.fingerprint)),'Training deck leaked into holdout');
function gradientUpdate(ep,rate){
 const score=ep.winner;
 // Normalize by own decisions so long games cannot dominate the model.
 const perSide=[0,0];for(const p of ep.decisions)perSide[p.side]++;
 const grad=Array(N).fill(0);
 for(const d of ep.decisions){
  const reward=d.side===score?1:-1;
  const denom=Math.max(1,perSide[d.side]);
  for(let i=0;i<N;i++)grad[i]+=d.grad[i]*reward/denom;
 }
 for(let i=0;i<N;i++)
  weights[i]=Math.max(-2.5,Math.min(2.5,weights[i]+rate*grad[i]));
 return grad.map(x=>+x.toFixed(5));
}
function replayPrior(){
 // Experience replay is deliberately low-weight because old samples were
 // collected under a different policy (off-policy approximation).
 for(const ep of replay.slice(-40)){
  if(!Array.isArray(ep.grad)||ep.grad.length!==N)continue;
  for(let k=0;k<N;k++)
   weights[k]=Math.max(-2.5,Math.min(2.5,weights[k]+.002*ep.grad[k]));
  counter.replayUpdates++;
 }
}
replayPrior();
const trainExamples=[];
for(let i=0;i<trainSet.length;i++){
 const s=trainSet[i];
 const frozen=i%4===0,seat=frozen?
  (i%2?['archived','current']:['current','archived']):
  ['current','current'];
 const r=play(s,seat,{explore:true,trace:true});
 const grad=gradientUpdate(r,.13/Math.sqrt(1+i/45));
 counter.episodeCount++;counter.trainingActions+=r.decisions.length;
 counter.supportActions+=r.tally.support;
 counter.perSide[0]+=r.tally.bySide[0];counter.perSide[1]+=r.tally.bySide[1];
 if(s.kind==='mirror')counter.mirroredDuels++;else counter.crossArchetypeDuels++;
 if(frozen)counter.frozenOpponentDuels++;
 const ep={grad,winner:r.winner,kind:s.kind,tier:s.tier,actions:r.decisions.length};
 replay.push(ep);if(replay.length>80)replay.shift();
 if(i%20===0||i===trainSet.length-1)
  console.log('ARCANE_V135_TRAIN '+JSON.stringify({
   episode:i+1,of:count,mirrors:counter.mirroredDuels,
   cross:counter.crossArchetypeDuels,learnedActions:counter.trainingActions,
   weights:weights.map(x=>+x.toFixed(3))}));
 if(trainExamples.length<20)trainExamples.push({kind:s.kind,tier:s.tier,
  winner:r.winner,decisions:r.decisions.length,support:r.tally.support,
  fusions:r.tally.fusions,attacks:r.tally.attacks});
}
const frozenWeights=[...weights]; // never adapt on benchmark results
const testResults=[],audits={mirror:0,cross:0,boss:0};
function pushTest(s,mode){
 const a=play(s,['current',mode],{policy:frozenWeights});
 const b=play(s,[mode,'current'],{policy:frozenWeights});
 testResults.push({kind:s.kind,tier:s.tier,style:s.left.style,variant:s.left.variant,
  seed:s.seed,baseline:mode,
  leftWinner:a.winner,rightWinner:b.winner,
  learnedWins:Number(a.winner===0)+Number(b.winner===1),
  total:2,support:a.tally.support+b.tally.support,
  fusions:a.tally.fusions+b.tally.fusions,
  attacks:a.tally.attacks+b.tally.attacks,
  illegal:a.tally.invalid+b.tally.invalid,
  seatDecisions:[a.tally.bySide,b.tally.bySide]});
 audits[s.kind]+=2;
}
for(const s of holdSet)pushTest(s,'archived');
// Complement with PVE career boss tests: no symmetry assumption, do NOT
// interpret boss win rates as mirror-rating evidence.
for(const tier of [7,9,10]){
 for(let i=0;i<STYLES.length*hold;i++){
  const sc=evalScenario(i,tier);
  const boss={...sc,kind:'boss'};
  const a=play(boss,['current','engine'],{policy:frozenWeights});
  const b=play(boss,['archived','engine'],{policy:frozenWeights});
  testResults.push({kind:'boss',tier,style:sc.left.style,
   seed:boss.seed,learnedWins:Number(a.winner===0),baselineWins:Number(b.winner===0),
   total:1,support:a.tally.support,fusions:a.tally.fusions,attacks:a.tally.attacks,
   illegal:a.tally.invalid+b.tally.invalid});
  audits.boss++;
 }
}
const aggregate=(subset)=>{
 const n=subset.length,matches=subset.reduce((s,x)=>s+x.total,0);
 const current=subset.reduce((s,x)=>s+x.learnedWins,0);
 const comparator=subset.filter(x=>x.kind==='boss')
  .reduce((s,x)=>s+(x.baselineWins||0),0);
 return {scenarios:n,matchedDuels:matches,currentWins:current,
  currentWinRate:matches?+(current/matches).toFixed(4):0,
  baselineBossWins:subset.every(x=>x.kind==='boss')?comparator:null,
  support:subset.reduce((s,x)=>s+x.support,0),
  fusions:subset.reduce((s,x)=>s+x.fusions,0),
  attacks:subset.reduce((s,x)=>s+x.attacks,0),
  invalid:subset.reduce((s,x)=>s+x.illegal,0)};
};
const byKind=Object.fromEntries(['mirror','cross','boss'].map(k=>[
 k,aggregate(testResults.filter(x=>x.kind===k))]));
const byTier=Object.fromEntries([7,9,10].map(t=>[
 t,aggregate(testResults.filter(x=>x.tier===t))]));
const bossByTier=Object.fromEntries([7,9,10].map(t=>[
 t,aggregate(testResults.filter(x=>x.kind==='boss'&&x.tier===t))]));
const priorHeld=previous?.evaluation?.byKind?.mirror?.currentWinRate||null;
const mirrorScore=byKind.mirror.currentWinRate;
const crossScore=byKind.cross.currentWinRate;
const safe=Object.values(byKind).every(x=>x.invalid===0)&&
 byKind.mirror.matchedDuels>0&&byKind.cross.matchedDuels>0;
const promotionEligible=safe&&mirrorScore>=.52&&crossScore>=.48&&
 bossByTier[9].currentWins>=bossByTier[9].baselineBossWins&&
 bossByTier[10].currentWins>=bossByTier[10].baselineBossWins;
const evaluation={byKind,byTier,bossByTier,
 validationOnly:true,noHoldoutOptimization:true,
 championBeatsOlderPolicy:mirrorScore>.5&&crossScore>.5,
 promotionEligible};
const report={
 schema:'arcane-v135-selfplay-run',status:'completed',
 method:'two-seat stochastic self-play + terminal-outcome policy-gradient + bounded low-rate experience replay',
 actualGameEngine:true,startingModel:previous?'previous checkpoint':'seed',
 previousModelGames:counter.previousGames,training:counter,
 trainingDeckCount:trainSet.length,
 trainingExamples:trainExamples,
 trainDecksAndEvalDecksDisjoint:true,
 evaluation,heldoutExamples:testResults.slice(0,70),
 learnedParameterCount:N,
 weightsBefore:startingWeights,weightsAfter:frozenWeights,
 permanentModelTrackedInRepository:'models/ai-selfplay-v135.json',
 productionIntegrated:false,
 notes:[
  'Self-play genuinely changes shared policy after each recorded duel.',
  'Both players use same rule-authoritative legal actions; opponent private hand is never read for decisions.',
  'This is a linear policy-gradient bootstrap, NOT a deep perfect-play model.',
  'Mirror duels have symmetric training decks, standard LP, neutral power and alternating starter; PvE-specific role or perk rules can still differ across seats.',
  'All training decks are constructed source-legal configurations, NOT earned inventories.',
  'Historical replay is bounded and downweighted because it is off-policy.',
  'Boss VII/IX/X are separate reference matchups, not mirror tests.',
  'Model checkpoint is experimental and not injected into gameplay unless explicitly promoted.'
 ]};
fs.mkdirSync('artifacts',{recursive:true});fs.mkdirSync('models',{recursive:true});
const checkpoint={schema:KEY,version:'13.5',weights:frozenWeights,
 gamesTrained:counter.previousGames+count,
 replay:replay.slice(-80),evaluation,
 sourceRun:'GitHub Actions',lastTrainingKinds:counter,
 productionActive:false,requiresNpcIntegration:true};
fs.writeFileSync('artifacts/ai-v135-training-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/ai-v135-checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n');
fs.writeFileSync(repoFile,JSON.stringify(checkpoint,null,2)+'\n');
console.log('ARCANE_V135_SUMMARY '+JSON.stringify({
 training:counter,byKind,byTier,bossByTier,
 promotionEligible,modelPersisted:'models/ai-selfplay-v135.json',
 productionIntegrated:false}));
