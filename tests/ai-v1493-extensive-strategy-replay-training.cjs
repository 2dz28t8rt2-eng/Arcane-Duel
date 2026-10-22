'use strict';
/* Arcane Duel 14.9.2: actual-role strategic buildup curriculum, NOT live AI.
 * Six staged combat unlocks, honest train / unseen holdout, paired starters and
 * policy seats. Reuse chosen policy only if training evidence beats control.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeBenchmarkDeck,roster}=require('./helpers/lategame-ai-decks-v72.cjs');
const root='artifacts/v1493',stages=[10,8,6,4,2,0],step=Number(process.argv[2]);
if(!Number.isInteger(step)||step<0||step>=stages.length)throw Error('Pass step 0..5');
fs.mkdirSync(root,{recursive:true});
const catalog=boot({seed:1492009}).run('(()=>({cards:CARDS,defaultDeck:RPG_DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:OPPONENTS}))()');
function mixed(tier,seed,ratio){
 const r=roster(catalog,tier),template=makeBenchmarkDeck(catalog,tier,'guardian','balanced',seed);
 const pools={guardian:r.normals.filter(c=>c.role==='guardian'),
  soul:r.normals.filter(c=>c.role==='soul'),
  other:r.normals.filter(c=>!['guardian','soul'].includes(c.role))};
 const chosen=[],counts=new Map();
 const targetSoul=Math.round(40*ratio);
 for(const [role,target] of [['soul',targetSoul],['guardian',40-targetSoul-5],['other',5]]){
  const variants=[...pools[role]].sort((a,b)=>{
   const score=c=>c.atk*.45+c.def*.7+c.level*85+
    ((Math.imul(seed+17,c.id+123)^349139)>>>0)%300;
   return score(b)-score(a)||a.id-b.id;
  });
  for(let i=0;i<target;i++){
   const c=variants.find(c=>(counts.get(c.id)||0)<3);
   if(!c)throw Error('Not enough '+role+' source-legal cards at '+tier);
   chosen.push(c.id);counts.set(c.id,(counts.get(c.id)||0)+1);
  }
 }
 assert.equal(chosen.length,40);
 return {...template,id:'mixed-'+tier+'-'+seed+'-'+ratio,style:'guardian-soul-mixed',
  deck:chosen,meta:{...template.meta,mix:{guardian:chosen.filter(id=>catalog.cards[id].role==='guardian').length,
   soul:chosen.filter(id=>catalog.cards[id].role==='soul').length}},
  fingerprint:require('node:crypto').createHash('sha256').update(JSON.stringify({
   main:[...chosen].sort((a,b)=>a-b),fusion:template.fusionDeck})).digest('hex')};
}
function duel1492(scene){
 profile=freshProfile();profile.guideSeen=true;
 for(const key of Object.keys(profile.upgrades||{}))profile.upgrades[key]=0;
 // The only missing-information exclusion: never inspect enemy hand/deck in AI policy.
 const g=createGame({mode:'pve',context:'free',opponentId:0,difficulty:'hard',
  seed:scene.seed,starter:scene.starter,deck:scene.deck,
  fusionDeck:scene.fusionDeck,
  enemy:{deck:scene.deck,fusionDeck:scene.fusionDeck,enhancements:{},power:1,flatBonus:0},
  strategicTraining:{enabled:true,noAttackTurns:scene.warmup,disableArenaLPDecay:true,symmetricSides:true}});
 g.fateUsed=[true,true];maybeFate=()=>false;
 for(const p of g.players){p.power=1;p.enhancements={};p.flatBonus=0;p.shield=0;}
 // Identical five starting cards, identical remaining deck, identical fusion stock;
 // unique UID identity remains legal for both players.
 const first=g.players[0],second=g.players[1];
 second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));
 second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];
 second.fusionDeck=[...first.fusionDeck];second.remainingFusion=[...first.remainingFusion];
 function opening(p){return JSON.stringify({
  cards:p.hand.map(c=>({id:c.id,atk:c.card.atk,def:c.card.def,level:c.card.level})),
  deck:p.deck,fusion:p.remainingFusion,lp:p.lp,shield:p.shield,power:p.power,
  enhance:p.enhancements});}
 if(opening(first)!==opening(second))throw Error('Unmatched opening');
 if(!g.essenceRules)throw Error('Active Guardian/Soul rules unexpectedly disabled');
 const startLP=g.players.map(p=>p.lp);
 const counter={turns:0,actions:0,differences:0,prebattleOffensiveSouls:0,
  occupiedAtUnlock:null,enemyAtUnlock:null,firstAttackTurn:null,
  firstOffensiveSoulTurn:null,byType:{},examples:[],
  plannedSummons:0,boardRechecks:0,unsafeBaselineAttacks:0,avoidedUnsafe:0,learningSamples:[]};
 const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;
 let learner=scene.candidateSeat;
 function role(c){return c?.roleOverride||CARDS[c?.id]?.role||'combatant';}
 const hasRoom=()=>g.players[g.active].field.some(c=>!c);
 function cardValue(c,roleOverride){
  const dat=dataOf(c),type=roleOverride||role(c);
  // Observable projection: current stats + public level-based natural decay only.
  const delay=Math.max(0,Math.floor((g.strategicTraining.noAttackTurns-g.turn)/2));
  const natural=creatureDecayRate(g,c,g.active);
  const futureAtk=Math.max(0,dat.atk-delay*natural),
        futureDef=Math.max(0,dat.def-delay*natural);
  const threats=g.players[1-g.active].field.filter(Boolean);
  const bestThreat=Math.max(0,...threats.map(t=>dataOf(t).atk));
  const safe=bestThreat?Math.min(1,futureDef/Math.max(1,bestThreat)):1;
  let value=futureAtk*.70+futureDef*(scene.profile.defense*.7+.13)*safe+
   dat.level*40;
  if(type==='guardian')value+=scene.profile.synergy*100;
  if(type==='soul')value+=scene.profile.synergy*110;
  return value;
 }
 function candidateSummon(){
  if(g.pending||g.summoned||g.aiPhase!=='summon'||!hasRoom())return null;
  const own=g.players[g.active],field=own.field.filter(Boolean);
  const guardians=field.filter(c=>role(c)==='guardian').length,
   souls=field.filter(c=>role(c)==='soul').length;
  const ranking=[];
  for(const c of own.hand){
   if(isFateCard(c))continue;
   const type=role(c);
   let score=cardValue(c)+(type==='soul'?guardians*scene.profile.synergy*260:0)+
    (type==='guardian'?souls*scene.profile.synergy*260:0);
   // Later summoning preserves high-level creatures from stat decay.
   const delay=Math.max(0,Math.floor((g.strategicTraining.noAttackTurns-g.turn)/2));
   score-=Math.max(0,delay-1)*creatureDecayRate(g,c,g.active)*scene.profile.waitCost;
   ranking.push({a:{type:'normal',uid:c.uid},score});
  }
  if(own.hand.length>=2){
   const hand=own.hand.filter(c=>!isFateCard(c));
   for(let i=0;i<Math.min(4,hand.length);i++)for(let j=i+1;j<Math.min(5,hand.length);j++){
    const levels=[dataOf(hand[i]).level,dataOf(hand[j]).level];
    const recipes=fusionOptions(g,levels,[hand[i],hand[j]])
     .filter(c=>canCompleteHandFusion(g,levels,c.id))
     .sort((a,b)=>b.level-a.level||b.atk-a.atk).slice(0,2);
    for(const recipe of recipes){
     const t={id:recipe.id,card:{...recipe}};
     const ty=role(t);
     const score=cardValue(t)+(ty==='soul'?guardians*scene.profile.synergy*260:0)+
      (ty==='guardian'?souls*scene.profile.synergy*260:0)-
      (cardValue(hand[i])+cardValue(hand[j]))*scene.profile.materialCost;
     ranking.push({a:{type:'fusion',uids:[hand[i].uid,hand[j].uid],choice:recipe.id},score});
    }
   }
  }
  ranking.sort((a,b)=>b.score-a.score);
  const top=ranking[0];if(!top)return null;
  counter.plannedSummons++;
  if(counter.learningSamples.length<40){
   const card=top.a.type==='normal'?own.hand.find(c=>c.uid===top.a.uid):CARDS[top.a.choice];
   counter.learningSamples.push({phase:'summon',turn:g.turn,kind:top.a.type,
    role:role(card),level:dataOf(card).level,guardians,souls,
    gap:Math.round(top.score-(ranking[1]?.score??top.score)),
    alternatives:ranking.slice(0,3).map(r=>({kind:r.a.type,
      role:r.a.type==='normal'?role(own.hand.find(c=>c.uid===r.a.uid)):CARDS[r.a.choice].role,
      score:Math.round(r.score)}))});
  }
  if(counter.examples.length<10&&g.turn<10)counter.examples.push({
   turn:g.turn,actor:g.active,phase:'summon',
   finalists:ranking.slice(0,3).map(x=>({action:x.a,score:Math.round(x.score)}))});
  g.aiPhase='positions';
  return top.a;
 }
 function candidateAttack(){
  if(g.aiPhase!=='attacks'||g.pending)return null;
  const team=g.players[g.active],foe=g.players[1-g.active];
  const options=[];
  for(let i=0;i<5;i++){
   const attacker=team.field[i];
   if(!attacker||!canAttack(g,attacker))continue;
   const targets=foe.field.some(Boolean)?foe.field.map((c,j)=>c?j:-1).filter(j=>j>=0):[null];
   for(const j of targets){
    const trial=JSON.parse(JSON.stringify(g));
    const oldEnemyLP=trial.players[1-g.active].lp,oldOwnLP=trial.players[g.active].lp;
    const target= j===null?null:trial.players[1-g.active].field[j];
    const targetDef=target?.card?.def||0, targetAtk=target?.card?.atk||0;
    const oldAttacker=trial.players[g.active].field[i];
    let result;
    try{result=attack(trial,i,j)}catch(e){result=null;}
    if(!result)continue;
    const survived=!!trial.players[g.active].field[i],targetAlive=j===null?false:!!trial.players[1-g.active].field[j];
    const damageLP=oldEnemyLP-trial.players[1-g.active].lp;
    const ownLP=oldOwnLP-trial.players[g.active].lp;
    const chip=j===null?0:targetDef+targetAtk-
     (targetAlive?trial.players[1-g.active].field[j].card.def+
      trial.players[1-g.active].field[j].card.atk:0);
    const score=damageLP*scene.profile.aggression+chip*.62+
      (!targetAlive&&target?cardValue(target)*.65:0)-
      (!survived?cardValue(oldAttacker)*1.2:0)-ownLP*.7;
    options.push({a:{type:'attack',ai:i,di:j},score});
   }
  }
  options.sort((a,b)=>b.score-a.score);
  const best=options[0];
  if(!best||best.score<=0){g.aiPhase='guard';return null;}
  if(counter.learningSamples.length<40)counter.learningSamples.push({
    phase:'attack',turn:g.turn,kind:'attack',role:role(team.field[best.a.ai]),
    level:dataOf(team.field[best.a.ai]).level,score:Math.round(best.score),
    gap:Math.round(best.score-(options[1]?.score??best.score))});
  return best.a;
 }
 chooseAiAction=function(game,policy){
  if(game!==g||game.active!==learner||game.pending)return baseChoose(game,policy);
  const phase=game.aiPhase;
  let selected=null;
  if(phase==='summon')selected=candidateSummon();
  else if(phase==='positions'){
   counter.boardRechecks++;
   const p=game.players[game.active];
   const support=p.field.map((c,idx)=>({c,idx})).find(({c})=>c&&
    ['guardian','soul'].includes(role(c))&&c.mode==='atk'&&!c.switched&&!c.attacked);
   if(support){selected={type:'switch',idx:support.idx};
    if(counter.learningSamples.length<40)counter.learningSamples.push({
      phase:'positions',kind:'switch',turn:g.turn,role:role(support.c),
      level:dataOf(support.c).level});}

  }else if(phase==='attacks')selected=candidateAttack();
  if(selected){
   // The reference is inspected on a clone, never mutating real phase or RNG.
   const state=JSON.parse(JSON.stringify(game));
   const legacy=baseChoose(state,policy);
   counter.actions++;
   counter.byType[selected.type]=(counter.byType[selected.type]||0)+1;
   if(JSON.stringify(selected)!==JSON.stringify(legacy))counter.differences++;
   if(counter.examples.length<15&&JSON.stringify(selected)!==JSON.stringify(legacy))
    counter.examples.push({turn:g.turn,phase,selected,legacy,actor:g.active});
   return selected;
  }
  return baseChoose(game,policy);
 };
 advanceTurn=function(game){
  if(game===g&&game.winner===null){
   const outgoing=game.turn;counter.turns++;
   if(outgoing<=g.strategicTraining.noAttackTurns){
    // Never permit pre-battle soul damage (other role effects remain enabled).
    if(game.players.some(p=>p.field.some(c=>c?.essenceCombat?.soul>0)))
     counter.prebattleOffensiveSouls++;
   }
  }
  const result=baseAdvance(game);
  if(game===g&&game.turn===g.strategicTraining.noAttackTurns+1&&
   counter.occupiedAtUnlock===null){
    counter.occupiedAtUnlock=game.players.map(p=>p.field.filter(Boolean).length);
    counter.enemyAtUnlock=game.players.map(p=>p.field.map(c=>c?
     {id:c.id,role:role(c),mode:c.mode,atk:dataOf(c).atk,def:dataOf(c).def}:null));
  }
  return result;
 };
 applyAiAction=function(game,action){
  if(game===g&&action?.type==='attack'&&counter.firstAttackTurn===null)
   counter.firstAttackTurn=game.turn;
  return baseApply(game,action);
 };
 let invalid=0,timeout=false;
 try{
  for(let t=0;t<64&&g.winner===null;t++){
   try{aiTurn(g,g.active===learner?'balanced':'balanced');}
   catch(e){invalid++;throw e;}
  }
  timeout=g.winner===null;
 }finally{chooseAiAction=baseChoose;advanceTurn=baseAdvance;applyAiAction=baseApply;}
 return {winner:g.winner,reason:g.winReason||'unresolved',turn:g.turn,
  timeout,invalid,starter:g.starter,candidateSeat:learner,
  candidateWin:g.winner===learner?1:0,lp:g.players.map(p=>p.lp),
  occupancy:counter.occupiedAtUnlock,
  initialLP:startLP,firstAttackTurn:counter.firstAttackTurn,
  attackUnlockedTurn:g.strategicTraining.noAttackTurns+1,
  soulUnlockedTurn:g.strategicTraining.soulUnlockTurn,
  stats:counter};
}
function sceneResult(deck,warmup,seed,profile,starter,candidateSeat){
 const scene={deck:deck.deck,fusionDeck:deck.fusionDeck,
  seed,profile,warmup,starter,candidateSeat};
 return boot({seed:seed+17}).run('('+duel1492.toString()+')('+JSON.stringify(scene)+')',300000);
}


const crypto=require('node:crypto');
const cases=[
 {style:'mixed',tier:9,ratio:.30},{style:'mixed',tier:9,ratio:.40},
 {style:'mixed',tier:10,ratio:.50},{style:'mixed',tier:10,ratio:.55},
 {style:'guardian',tier:8},{style:'soul',tier:9},
 {style:'predator',tier:9},{style:'fusion',tier:9},
 {style:'allrounder',tier:10},{style:'tempo',tier:8},
 {style:'hybrid',tier:10},{style:'guardian',tier:10}
];
const clamp=(x,a,b)=>Math.round(Math.max(a,Math.min(b,x))*10000)/10000;
const stage=stages[step];
const prior=step?JSON.parse(fs.readFileSync(root+'/stages.json','utf8')):[];
assert.equal(prior.length,step,'All stages must run in order, in same action');
const previous=step?prior[step-1].learned:null;
const fixed=[
 {name:'forecast',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
 {name:'synergy',defense:1.1,synergy:2.2,waitCost:.55,materialCost:.68,aggression:.75},
 {name:'balanced-pressure',defense:.73,synergy:1.4,waitCost:.90,materialCost:.42,aggression:1.38},
 {name:'replay-seed',defense:.98,synergy:1.65,waitCost:.8,materialCost:.58,aggression:1.1}
];
const profiles=step===0?fixed:[previous,
 fixed[0],fixed[1],{...previous,name:'replay-explore',
  synergy:clamp(previous.synergy+.22,.35,3),
  aggression:clamp(previous.aggression+.14,.4,1.8)}];
const encountered=new Set();
function deck(c,i,hold){
 for(let attempt=0;attempt<48;attempt++){
  const seed=(hold?4300:700)+step*420+i*19+attempt*53;
  const d=c.style==='mixed'?mixed(c.tier,seed,c.ratio):
   makeBenchmarkDeck(catalog,c.tier,c.style,
    (i+attempt)%2?'veteran':'balanced',seed);
  assert.equal(d.deck.length,40,'Not a complete 40-card deck');
  const ids=new Map();for(const id of d.deck)ids.set(id,(ids.get(id)||0)+1);
  assert.ok([...ids.values()].every(n=>n<=3),'Invalid triple-limit');
  const hash=crypto.createHash('sha256').update(JSON.stringify({
   main:[...d.deck].sort((a,b)=>a-b),fusion:[...d.fusionDeck].sort((a,b)=>a-b)})).digest('hex');
  if(encountered.has(hash))continue;
  encountered.add(hash);
  return {...d,sourceSeed:seed,analysisStyle:c.style,
   ratio:c.ratio??null,fingerprint:hash,regenerationAttempts:attempt};
 }
 throw Error('Unable to construct unique 40-card benchmark deck: '+c.style+'/'+c.tier);
}
const trainDecks=cases.map((c,i)=>deck(c,i,false));
const holdDecks=cases.map((c,i)=>deck(c,i,true));
const unique=new Set([...trainDecks,...holdDecks].map(x=>x.fingerprint));
assert.equal(unique.size,24,'Holdout deck overlap/duplicate deck');
function mirror(d,profile,withExamples){
 const rows=[];
 for(const starter of [0,1])for(const candidateSeat of [0,1]){
  // Same seed, draw and hand for both policy seats; starter deliberately flipped.
  const seed=14930000+step*35000+d.sourceSeed*19+starter*3;
  const x=sceneResult(d,stage,seed,profile,starter,candidateSeat);
  assert.equal(x.invalid,0);assert.equal(x.stats.prebattleOffensiveSouls,0);
  assert.equal(x.starter,starter);assert.equal(x.candidateSeat,candidateSeat);
  rows.push({...x,style:d.analysisStyle,ratio:d.ratio,
   fingerprint:d.fingerprint,deckId:d.id,
   examples:withExamples?x.stats.examples.slice(0,5):undefined});
 }
 return rows;
}
function evaluate(decks,profile,capture){
 const rows=[];
 for(const d of decks){
  rows.push(...mirror(d,profile,capture));
  if(typeof global.gc==='function'&&rows.length%16===0)global.gc();
 }
 return rows;
}
function summarize(rows){
 const styles={};
 for(const r of rows){
  const x=styles[r.style]||(styles[r.style]={games:0,wins:0,timeouts:0});
  x.games++;x.wins+=r.candidateWin;x.timeouts+=Number(r.timeout);
 }
 return {games:rows.length,wins:rows.reduce((n,r)=>n+r.candidateWin,0),
  timeouts:rows.filter(r=>r.timeout).length,
  actualChangedActions:rows.reduce((n,r)=>n+r.stats.differences,0),
  boardRechecks:rows.reduce((n,r)=>n+r.stats.boardRechecks,0),
  soulViolations:rows.reduce((n,r)=>n+r.stats.prebattleOffensiveSouls,0),
  illegalActions:rows.reduce((n,r)=>n+r.invalid,0),
  fullBoards:rows.filter(r=>r.occupancy?.[0]===5&&r.occupancy?.[1]===5).length,
  starterWins:rows.filter(r=>r.winner===r.starter).length,
  firstAttackViolations:rows.filter(r=>r.firstAttackTurn!==null&&
    r.firstAttackTurn<=stage).length,byStyle:styles};
}
const trials=[];
for(const p of profiles){
 const rows=evaluate(trainDecks,p,false),summary=summarize(rows);
 assert.equal(summary.games,48);
 trials.push({profile:p,summary,rows});
 console.log('ARCANE_V1493_TRAIN '+JSON.stringify({stage,name:p.name,
   wins:summary.wins,games:summary.games,timeouts:summary.timeouts,
   differences:summary.actualChangedActions}));
}
trials.sort((a,b)=>b.summary.wins-a.summary.wins||
 a.summary.timeouts-b.summary.timeouts||
 b.summary.actualChangedActions-a.summary.actualChangedActions||
 a.profile.name.localeCompare(b.profile.name));
const winner=trials[0],signals={defense:0,synergy:0,waitCost:0,
 materialCost:0,aggression:0};
let samples=0,winsLabeled=0,lossesLabeled=0,unknownLabeled=0;
const experience=[];
for(const r of winner.rows){
 const reward=r.timeout?0:(r.candidateWin?1:-1);
 winsLabeled+=Number(reward>0);lossesLabeled+=Number(reward<0);
 unknownLabeled+=Number(reward===0);
 const decisions=r.stats.learningSamples||[];
 for(const a of decisions){
  const v=reward/Math.max(1,decisions.length);
  const pair=(a.role==='guardian'&&a.souls>0)||(a.role==='soul'&&a.guardians>0);
  signals.synergy+=v*(pair?1:0);
  signals.defense+=v*(a.kind==='switch'&&['soul','guardian'].includes(a.role)?1:0);
  signals.materialCost+=v*(a.kind==='fusion'?-1:a.phase==='summon'?.08:0);
  signals.waitCost+=v*(a.phase==='summon'&&a.level>=7&&a.turn<=stage/2?-.7:0.1);
  signals.aggression+=v*(a.kind==='attack'?1:0);
  samples++;
  if(experience.length<150)experience.push({...a,reward,
   starter:r.starter,candidateSeat:r.candidateSeat,
   caveat:'Associative final-outcome label; not verified counterfactual utility'});
 }
}
const bounds={defense:[.4,1.65],synergy:[.35,3],
 waitCost:[.1,1.65],materialCost:[.12,1.1],aggression:[.4,1.8]};
const proposed={...winner.profile,name:'replay-learned'};
for(const [k,v] of Object.entries(signals))
 proposed[k]=clamp(winner.profile[k]+.28*v/Math.max(1,winner.rows.length),...bounds[k]);
const reevaluation=evaluate(trainDecks,proposed,false);
const replayCheck=summarize(reevaluation);
const accepted=replayCheck.wins>winner.summary.wins||
 (replayCheck.wins===winner.summary.wins&&
  replayCheck.timeouts<winner.summary.timeouts);
const chosen=accepted?proposed:winner.profile;
const held=evaluate(holdDecks,chosen,true);
const holdSum=summarize(held);
assert.equal(holdSum.games,48);
assert.equal(holdSum.illegalActions,0);
assert.equal(holdSum.soulViolations,0);
assert.equal(holdSum.firstAttackViolations,0);
assert.ok(holdSum.actualChangedActions>0);
const record={
 schema:'arcane-v1493-strategic-stage',stage,step,
 sourceSha:process.env.GITHUB_SHA||'unknown',
 controls:{rolesEnabled:true,monsterDecayEnabled:true,
  arenaLPDecayDisabled:true,offensiveSoulLockedUntilCombat:true,
  identical40CardDecksAnd5CardHands:true,
  frozenHoldoutNeverUsedInSelection:true,bothPolicySeats:true,
  bothStarters:true,productionActive:false},
 training:{deckFingerprints:trainDecks.map(d=>d.fingerprint),
  byProfile:trials.map(t=>({profile:t.profile,summary:t.summary})),
  outcomeCredit:{samples,winsLabeled,lossesLabeled,unknownLabeled,
   signals,learningRate:.28,previous:winner.profile,proposed,
   replayCheck,accepted,replayOnlyFromTraining:true},
  replayExamples:experience},
 learned:chosen,
 holdout:{deckFingerprints:holdDecks.map(d=>d.fingerprint),
  summary:holdSum,cases:held.map(r=>({deck:r.deckId,style:r.style,
   starter:r.starter,candidateSeat:r.candidateSeat,
   outcome:r.winner,timeout:r.timeout,turn:r.turn,
   candidateWin:r.candidateWin,firstAttackTurn:r.firstAttackTurn,
   occupiedAtUnlock:r.occupancy,
   differences:r.stats.differences,examples:r.examples}))}
};
fs.writeFileSync(root+'/stage-'+step+'.json',JSON.stringify(record,null,2)+'\n');
prior.push({stage,step,learned:chosen,selectedName:chosen.name,
 trainingProfiles:trials.length,trainingMatches:trials.length*48+48,
 replaySamples:samples,holdout:holdSum});
fs.writeFileSync(root+'/stages.json',JSON.stringify(prior,null,2)+'\n');
console.log('ARCANE_V1493_STAGE '+JSON.stringify({
 stage,selected:chosen.name,trainingBest:winner.summary.wins,
 replayUpdated:accepted,replayWins:replayCheck.wins,
 replaySamples:samples,holdout:holdSum}));
if(step===stages.length-1){
 const totals=prior.reduce((p,x)=>{
  for(const k of ['games','wins','timeouts','actualChangedActions','boardRechecks',
   'soulViolations','illegalActions','fullBoards','starterWins','firstAttackViolations'])
   p[k]=(p[k]||0)+(x.holdout[k]||0);return p;
 },{});
 const report={schema:'arcane-v1493-extensive-strategic-replay',
  status:'completed',sourceSha:process.env.GITHUB_SHA||'unknown',
  promotionEligible:false,productionActive:false,championPromoted:false,
  trainingMatches:prior.reduce((n,x)=>n+x.trainingMatches,0),
  holdoutMatches:totals.games,trainingReplaySamples:prior.reduce((n,x)=>n+x.replaySamples,0),
  stageOrder:stages,stages:prior.map(x=>({stage:x.stage,
   selected:x.selectedName,profile:x.learned,holdout:x.holdout})),
  totals,controls:record.controls,finalResearchCoefficients:chosen,
  caveats:['This is evolutionary profile selection plus associative outcome-credit updates; not a trained neural network.',
   'Individual alternative actions are not evaluated as independent counterfactuals.',
   'Training opponents use the frozen legacy balanced policy, not a diverse independent league.',
   'Theoretically source-accessible benchmark decks are not actually earned collections.',
   'Mirrored seats and starters share deck fingerprints and are correlated.',
   'Timeout is not counted as a win; the arena LP decay has been disabled only here.',
   'No production or main-branch AI promotion without broader independent evaluation.']};
 fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('ARCANE_V1493_FINAL '+JSON.stringify({
  trainingMatches:report.trainingMatches,holdoutMatches:totals.games,
  trainingReplaySamples:report.trainingReplaySamples,
  totals,stageScores:report.stages.map(x=>({stage:x.stage,selected:x.selected,
   wins:x.holdout.wins,games:x.holdout.games,timeouts:x.holdout.timeouts}))}));
}
