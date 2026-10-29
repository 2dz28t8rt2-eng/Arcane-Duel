'use strict';
/* Arcane Duel v13.7 – historical failure analysis, mechanism curriculum pilot,
 * matched rule-engine counterfactuals, and a frozen-policy specialist league.
 * Research only; never updates production NPC AI, inventory or game balance.
 * Old v13.6 historical aggregates are OBSERVATIONAL, not causal replays.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {STYLES,makeBenchmarkDeck,roster}=require('./helpers/lategame-ai-decks-v72.cjs');
const model=JSON.parse(fs.readFileSync('models/ai-selfplay-v136.json','utf8'));
assert.equal(model.schema,'arcane-v135-selfplay-checkpoint');
assert.ok(model.gamesTrained>=1920&&model.replay.length>0);
assert.equal(model.weights.length,15);
const tests=Number(process.env.ARCANE_V140_CASES||160);
assert.ok(Number.isInteger(tests)&&tests>=2&&tests<=220);
const oldSrc=fs.readFileSync('tests/ai-selfplay-v135.cjs','utf8');
const a=oldSrc.indexOf('function feature135(');
const b=oldSrc.indexOf('const injected=',a);
assert.ok(a>=0&&b>a,'Cannot extract exact v13.5 legal-action controller');
const controller=oldSrc.slice(a,b);
assert.ok(controller.includes('function choices135(')&&controller.includes('function decision135('));
const catalogue=boot({seed:137321,x128Mode:'full'}).run(String.raw`(()=>({
 cards:CARDS.map(c=>c?({id:c.id,level:c.level,atk:c.atk,def:c.def,
  role:c.role,source:c.source,requiredTier:c.requiredTier,
  hard:c.hard,ace:c.ace,retired:c.retired,enemyOnly:c.enemyOnly,
  essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
  questOnly:c.questOnly,legendaryOnly:c.legendaryOnly,fate:c.fate}):null),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({level:o.level,loot:[...o.loot]}))
}))()`);
function locate(root,name){
 if(!fs.existsSync(root))return null;
 const stack=[root];
 while(stack.length){
  const p=stack.pop();
  for(const x of fs.readdirSync(p,{withFileTypes:true})){
   const file=p+'/'+x.name;
   if(x.isDirectory())stack.push(file);
   else if(x.name===name)return file;
  }
 }
 return null;
}
const histReports=[];
for(const generation of ['gen1','gen2','gen3']){
 // Historical source is read from the exact generation directory below.
 // The download can include multiple same-named report files. Match exact
 // generation directory instead of using the first result of locate().
 const direct=[
  'artifacts/history/artifacts/v136/'+generation+'/ai-v136-training-report.json',
  'artifacts/history/'+generation+'/ai-v136-training-report.json',
  'artifacts/history/v136/'+generation+'/ai-v136-training-report.json'
 ].find(fs.existsSync);
 assert.ok(direct,'Missing archived source report for '+generation+
  ' (artifact structure must preserve all three generation directories)');
 const r=JSON.parse(fs.readFileSync(direct,'utf8'));
 assert.equal(r.schema,'arcane-v136-extensive-selfplay-run');
 histReports.push({
  generation,trainingParties:r.training.episodeCount,
  observedTrainingActions:r.training.trainingActions,
  mirroredDuels:r.training.mirroredDuels,
  crossArchetypeDuels:r.training.crossArchetypeDuels,
  bossSparringDuels:r.training.bossSparringDuels,
  storedCandidate:r.checkpointAccepted,
  mirror:r.evaluation.byKind.mirror,
  cross:r.evaluation.byKind.cross,
  boss:r.evaluation.byKind.boss,
  bossIX:r.evaluation.bossByTier[9],
  bossX:r.evaluation.bossByTier[10]
 });
}
assert.equal(histReports.reduce((n,r)=>n+r.trainingParties,0),1200);
const historicalFindings=[
 {id:'CHAMPION_STALLED',kind:'observational',
  observation:'Across all three v13.6 generations no newly learned candidate passed the promotion gate.',
  evidence:histReports.map(r=>({generation:r.generation,accepted:r.storedCandidate,
   mirrorWins:r.mirror.currentWins,mirrorDuels:r.mirror.matchedDuels,
   crossWins:r.cross.currentWins,crossDuels:r.cross.matchedDuels})),
  nextExercise:'Preserve champion; schedule additional cross-policy and unseen-deck checks before changing weights.'},
 {id:'BOSS_X_WEAK',kind:'observational',
  observation:'Candidate wins against boss X remain low and inconsistent despite more mirror training.',
  evidence:histReports.map(r=>({generation:r.generation,wins:r.bossX.currentWins,
    duels:r.bossX.matchedDuels})),
  nextExercise:'Train early board stabilization, ACE threats and realistic fusion availability as distinct curricula.'},
 {id:'REPLAY_MISSING_STATES',kind:'data_gap',
  observation:'Archived replay entries have gradients and match outcomes but no reconstructable pre-action state, legal alternative set or scenario seed.',
  evidence:{replayCount:model.replay.length,examples:model.replay.slice(0,2).map(x=>Object.keys(x)),
   originalActionStateRecoverable:false},
  nextExercise:'Record visible before-state, own hand, action alternatives and seeded source-legal deck for every new counterfactual.'}
];
const srcReader=(path)=>fs.readFileSync(path,'utf8');
const templates=STYLES;
const styles=['predator','guardian','fusion','soul','allrounder','tempo','hybrid'];
const weightSets=[
 {name:'frozen-champion-v135',weights:model.weights},
 {name:'v136-rejected-candidate',weights:model.lastCandidateWeights},
 {name:'offensive-specialist',weights:model.weights.map((v,i)=>v+
   ({0:.35,4:.20,6:.25,10:.22,13:-.10}[i]||0))},
 {name:'defense-support-specialist',weights:model.weights.map((v,i)=>v+
   ({1:.32,9:.40,14:.38,13:.18}[i]||0))},
 {name:'fusion-economy-specialist',weights:model.weights.map((v,i)=>v+
   ({2:.36,11:-.25,12:-.2,6:.15}[i]||0))}
];
assert.ok(weightSets.every(x=>x.weights.length===15&&
 x.weights.every(Number.isFinite)));
function make(s){
 const d=makeBenchmarkDeck(catalogue,s.tier,s.style,s.variant,s.deckSeed);
 assert.equal(d.deck.length,40);
 assert.ok(d.fusionDeck.length>=2);
 const allowed=roster(catalogue,s.tier);
 for(const id of [...d.deck,...d.fusionDeck])
  assert.ok(allowed.allowed(catalogue.cards[id]),'Illegal future card in constructed deck');
 return d;
}
// This is an independent SET OF NEW situations, not a reconstruction of old
// historical decision records (which did not contain adequate snapshots).


// v13.8 research: a new decision-state dataset, controlled alternative
// continuations, outcome-supervised policy update and independent league.
// Reuses v13.7 authentic historical analysis and v13.5 legal-action features.
const config={
 holdout:Number(process.env.ARCANE_V140_HOLDOUT||64),
 league:Number(process.env.ARCANE_V140_LEAGUE||14)
};
assert.ok(config.holdout>=6&&config.holdout<=100);
assert.ok(config.league>=3&&config.league<=24);
const history137Path='artifacts/v137history/history-and-counterfactual.json';
const h137=fs.existsSync(history137Path)?
 JSON.parse(fs.readFileSync(history137Path,'utf8')):null;
if(h137)assert.equal(h137.schema,'arcane-v137-history-and-counterfactual');
const seen=new Set();
function buildScene(i,part='train'){
 const tier=[7,9,10][i%3];
 const style=styles[Math.floor(i/3)%styles.length];
 const variant=(part==='train'?['balanced','veteran']:
  ['starter-heavy','specialist'])[Math.floor(i/21)%2];
 const seed=(part==='train'?1400000:3400000)+i*173+tier*13;
 const s={tier,style,variant,seed,starter:i%2,
  kind:i%2?'attacks':'summon'};
 // Benchmark generator accepts 0–9999. Re-seed on identical deck
 // fingerprints, keeping train and holdout disjoint by construction.
 for(let attempt=0;attempt<500;attempt++){
  s.deckSeed=((part==='train'?2100:7100)+i*89+attempt*79)%10000;
  const deck=make(s);
  if(seen.has(deck.fingerprint))continue;
  seen.add(deck.fingerprint);
  return {...s,deck};
 }
 throw Error('Insufficient independent decks for '+part+' '+style);
}
const train=Array.from({length:tests},(_,i)=>buildScene(i));
const holdout=Array.from({length:config.holdout},(_,i)=>buildScene(i,'holdout'));
const tuning={minWeight:-2.5,maxWeight:2.5,rate:.025,marginCap:4500};
function snapState(game){
 const p=game.players[game.active],opp=game.players[1-game.active];
 const card=c=>c?{id:c.id,lv:dataOf(c).level,atk:dataOf(c).atk,
  def:dataOf(c).def,mode:c.mode,attacked:!!c.attacked,switched:!!c.switched,
  fusion:!!c.fusion}:null;
 return {actor:game.active,turn:game.turn,phase:game.aiPhase,
  life:[p.lp,opp.lp],shield:[p.shield,opp.shield],
  ownHand:p.hand.map(c=>({id:c.id,uid:c.uid})),
  ownFusionCount:p.remainingFusion.length,
  ownField:p.field.map(card),publicEnemyField:opp.field.map(card),
  // Opponent's private cards/deck/order MUST NOT be included here.
  opponentHandSize:opp.hand.length,
  ownDeckSize:p.deck.length,opponentDeckSize:opp.deck.length};
}

function boardValue139(g,actor){
 const self=g.players[actor],enemy=g.players[1-actor];
 const worth=(p)=>p.field.filter(Boolean).reduce((n,c)=>{
  const d=dataOf(c),decay=creatureDecayRate(g,c,p.id);
  return n+.4*d.atk+.3*d.def+.3*Math.max(0,d.atk-2*decay);
 },0);
 return (worth(self)-worth(enemy))/1600+
  (self.lp+(self.shield||0)-enemy.lp-(enemy.shield||0))/3200+
  .05*self.hand.length+.03*self.remainingFusion.length;
}
function lookahead139(g,w,stats){
 if(g.pending||g.winner!==null||g.turn>6||
    !['summon','attacks'].includes(g.aiPhase))return null;
 const choices=choices135(g,stats)
  .filter(c=>['normal','fusion','attack','end'].includes(c.action.type))
  .map(c=>({c,v:c.base+c.features.reduce((n,x,i)=>n+x*w[i],0)}))
  .sort((a,b)=>b.v-a.v);
 if(choices.length<2)return null;
 const shortlist=[choices[0]];
 for(const kind of ['normal','fusion','attack','end']){
  const next=choices.find(c=>c.c.action.type===kind);
  if(next&&!shortlist.includes(next)&&shortlist.length<4)shortlist.push(next);
 }
 const start=boardValue139(g,g.active),actor=g.active;
 let best=choices[0],score=-Infinity;
 for(const item of shortlist){
  const action=item.c.action;
  if(action.type==='end'){
   if(item.v>score){score=item.v;best=item;}continue;
  }
  const clone=JSON.parse(JSON.stringify(g));
  if(action.type==='fusion'||action.type==='normal')clone.aiPhase='positions';
  if(!applyAiAction(clone,action))continue;
  let depth=1;
  if(clone.pending&&clone.winner===null&&clone.active===actor){
   const placement=chooseAiAction(clone,'balanced');
   if(placement?.type==='place'&&applyAiAction(clone,placement))depth++;
  }else if(action.type==='attack'&&clone.winner===null&&clone.active===actor){
   const next=choices135(clone,stats).filter(x=>x.action.type==='attack')
    .map(x=>({a:x.action,v:x.base+x.features.reduce((n,f,i)=>n+f*w[i],0)}))
    .sort((a,b)=>b.v-a.v)[0];
   if(next&&next.v>0&&applyAiAction(clone,next.a))depth++;
  }
  const scoreNow=item.v+.6*(boardValue139(clone,actor)-start)+.03*(depth-1);
  if(scoreNow>score){score=scoreNow;best=item;}
 }
 stats.plannerCalls=(stats.plannerCalls||0)+1;
 return best.c.action;
}

function play(scene,weightsSeat0,weightsSeat1,branchMode='none',
 lessonPhase=scene.kind,track=true,plannerSeat=-1){
 const vm=boot({seed:scene.seed+99,x128Mode:'full'});
 vm.exec(controller);
 vm.exec(snapState.toString()+'\n'+boardValue139.toString()+'\n'+lookahead139.toString());
 vm.exec('var V138_A='+JSON.stringify(weightsSeat0)+
  ';var V138_B='+JSON.stringify(weightsSeat1)+';');
 const opt={id:'v138-'+scene.seed,mode:'pve',
  context:scene.boss?'tournament':'free',
  opponentId:scene.boss?scene.tier:0,
  difficulty:scene.boss?'easy':'hard',
  seed:scene.seed,starter:scene.starter,
  deck:scene.deck.deck,fusionDeck:scene.deck.fusionDeck};
 if(!scene.boss)opt.enemy={deck:scene.deck.deck,
  fusionDeck:scene.deck.fusionDeck,power:1,flatBonus:0,enhancements:{}};
 const code=[
 '(()=>{profile=freshProfile();profile.guideSeen=true;',
 'const g=createGame(',JSON.stringify(opt),');',
 'if(!',String(!!scene.boss),'){g.maxLP=10000;g.players.forEach(p=>p.lp=10000);}',
 'let branch=null,found=false,invalid=0,records=[],pending=null;',
 'const tally={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0};',
 'const original=chooseAiAction,resolve=applyAiAction;',
 'chooseAiAction=function(game,mode){',
 'if(game!==g)return original(game,mode);',
 'if(!game.aiPhase)game.aiPhase="summon";',
 'if(',String(!!scene.boss),'&&game.active===1)return original(game,mode);',
 'const side=game.active,weights=side===0?V138_A:V138_B;',
 'const phase=game.aiPhase,pre=snapState(game);',
 'const legal=(game.pending||game.winner!==null)?[]:choices135(game,tally);',
 'const ranked=legal.map(c=>({action:c.action,features:c.features,base:c.base,',
 'score:c.base+c.features.reduce((n,x,i)=>n+x*weights[i],0)}))',
 '.sort((a,b)=>b.score-a.score);',
 'const targetPhase=',JSON.stringify(lessonPhase),';',
 'const trigger=!found&&side===0&&phase===targetPhase&&!game.pending',
 '&&(phase!=="attacks"||game.turn>1);',
 'let action=null;',
 'if(trigger){',
 'const restricted=ranked.filter(c=>',
 '["normal","fusion","attack","end"].includes(c.action.type));',
 'if(restricted.length>=2){',
 'const top=restricted[0],other=restricted.find(c=>c.action.type!==top.action.type)',
 '||restricted[1];',
 'branch={before:pre,options:ranked.length,top,alternative:other};',
 'found=true;',
 'action=',JSON.stringify(branchMode),'==="alternate"?other.action:top.action;',
 '}',
 '}',
 'if(!action)action=(',String(plannerSeat),'===side?lookahead139(game,weights,tally):null)',
 '||decision135(game,weights,false,null,tally)||original(game,mode);',
 'if(',String(track),'){',
 'pending={before:pre,chosen:action,actor:side,',
 'phase,legalActions:ranked.slice(0,24).map(x=>({action:x.action,',
 'features:x.features,score:+x.score.toFixed(4)}))};',
 '}',
 'return action;};',
 'applyAiAction=function(game,action){',
 'const ok=resolve(game,action);',
 'if(game===g){if(!ok)invalid++;',
 'if(pending&&',String(track),'&&records.length<72){',
 'pending.actionSucceeded=!!ok;',
 'pending.after=snapState(game);',
 'records.push(pending);pending=null;',
 '}}return ok;};',
 'try{simulateGame(g,"balanced","balanced");}',
 'finally{chooseAiAction=original;applyAiAction=resolve;}',
 'return {winner:g.winner,turn:g.turn,',
 'lp:g.players.map(p=>p.lp),shield:g.players.map(p=>p.shield),',
 'branch,invalid,records,tally};})()'
 ].join('');
 const r=vm.run(code,240000);
 assert.ok([0,1].includes(r.winner),'No completed match');
 assert.equal(r.invalid,0,'Invalid game action for '+scene.seed);
 return r;
}


const v139Path='artifacts/history-v139/decision-replay.json';
const past=fs.existsSync(v139Path)?JSON.parse(fs.readFileSync(v139Path,'utf8')):null;
if(past)assert.equal(past.items.length,81,'Expected 81 previous v13.9 paired lessons');
const trainPairs=[],unmatched=[],groups=new Map();
const training={pairs:0,alternativesBetter:0,alternativesWorse:0,drawInWinner:0,
 ownSupport:0,fusions:0,attacks:0,loggedSamples:0,weightUpdates:0,
 undecidableFamilies:0,mechanicFamilies:0};
function resultBrief(r){return {winner:r.winner,turn:r.turn,life:r.lp};}
for(const s of train){
 const a=play(s,model.weights,model.weights,'top',s.kind,true,-1);
 const b=play(s,model.weights,model.weights,'alternate',s.kind,true,-1);
 if(!a.branch||!b.branch){
  unmatched.push({seed:s.seed,style:s.style,phase:s.kind});continue;
 }
 assert.deepEqual(a.branch.before,b.branch.before,'Branch information mismatch');
 assert.deepEqual(a.branch.top,b.branch.top,'Top decision changed across matched pair');
 const outcome=Number(b.winner===0)-Number(a.winner===0);
 const type=[s.kind,a.branch.top.action.type,b.branch.alternative.action.type].join('|');
 const item={seed:s.seed,source:'v140-current-engine',
  style:s.style,tier:s.tier,starter:s.starter,phase:s.kind,
  deckFingerprint:s.deck.fingerprint,deck:s.deck.deck,
  fusionDeck:s.deck.fusionDeck,startingState:a.branch.before,
  actual:a.branch.top,legalAlternative:b.branch.alternative,
  outcome,control:resultBrief(a),alternative:resultBrief(b),
  chosenActionTrace:a.records.slice(0,12),
  alternativeActionTrace:b.records.slice(0,12),
  caveat:'Only paired first-branch starting states; not a proof of per-action causality.'};
 trainPairs.push(item);training.pairs++;
 training.loggedSamples+=a.records.length+b.records.length;
 training.ownSupport+=a.tally.support||0;
 training.fusions+=a.tally.fusions||0;
 training.attacks+=a.tally.attacks||0;
 if(outcome>0)training.alternativesBetter++;
 else if(outcome<0)training.alternativesWorse++;
 else training.drawInWinner++;
 if(!groups.has(type))groups.set(type,[]);
 groups.get(type).push(item);
 if(trainPairs.length%20===0)console.log('ARCANE_V140_LESSONS '+JSON.stringify({
   checked:training.pairs,alterBetter:training.alternativesBetter,
   alterWorse:training.alternativesWorse,unchanged:training.drawInWinner,
   topics:groups.size}));
}
assert.ok(trainPairs.length>=Math.floor(tests*.78),'Too few legitimate paired tactical episodes');
// Prevent noisy single-seed learning: only multiple outcome-changing
// distinct decks produce bounded moves in policy score differences.
const candidate=[...model.weights],lessons=[];
for(const [key,items] of groups){
 const good=items.filter(x=>x.outcome>0).length;
 const bad=items.filter(x=>x.outcome<0).length;
 const decisive=good+bad;
 const reliable=items.length>=8&&decisive>=5&&
  Math.max(good,bad)/decisive>=.85;
 const sign=Math.sign(good-bad);
 let updated=false;
 if(reliable&&sign){
  const delta=Array(15).fill(0);
  for(const t of items)
   for(let i=0;i<15;i++)
    delta[i]+=(t.legalAlternative.features[i]-t.actual.features[i])/items.length;
  const size=Math.sqrt(delta.reduce((v,x)=>v+x*x,0));
  if(size>.05){
   for(let i=0;i<15;i++)
    candidate[i]=Math.max(-2.5,Math.min(2.5,
      candidate[i]+sign*.025*delta[i]/Math.max(1,size)));
   updated=true;training.weightUpdates++;
  }
 }
 if(!updated)training.undecidableFamilies++;
 lessons.push({lesson:key,count:items.length,outcomeChanged:decisive,
  alternateWins:good,alternateLosses:bad,reliabilityGatePassed:reliable,
  weightUpdate:updated});
}
training.mechanicFamilies=groups.size;
// Strictly independent evaluation: never refit weights after this point.
const lockedCandidate=[...candidate];
const abScenes=holdout.slice(0,Math.floor(holdout.length/2));
const challengeScenes=holdout.slice(abScenes.length);
assert.ok(abScenes.length>=12&&challengeScenes.length>=12);
const ab={policyWeightsIdentical:true,plannerOnlyDifference:true,
 matches:0,plannerWins:0,byTier:{},byStyle:{},
 plannerEvaluations:0,pairedScenarios:abScenes.length,
 underlyingDecksAreIdenticalPerPair:true};
for(const s of abScenes){
 const p0=play(s,model.weights,model.weights,'none','positions',false,0);
 const p1=play(s,model.weights,model.weights,'none','positions',false,1);
 const wins=Number(p0.winner===0)+Number(p1.winner===1);
 const calls=(p0.tally.plannerCalls||0)+(p1.tally.plannerCalls||0);
 ab.plannerWins+=wins;ab.matches+=2;ab.plannerEvaluations+=calls;
 for(const [mapping,key] of [[ab.byTier,String(s.tier)],[ab.byStyle,s.style]]){
  if(!mapping[key])mapping[key]={wins:0,duels:0};
  mapping[key].wins+=wins;mapping[key].duels+=2;
 }
}
const validation={candidateWins:0,duels:0,
 plannerCalls:0,bossWinsCandidate:0,bossWinsChampion:0,
 bossGames:0,bossByTier:{},byTier:{}};
for(const s of challengeScenes){
 const p0=play(s,lockedCandidate,model.weights,'none','positions',false,0);
 const p1=play(s,model.weights,lockedCandidate,'none','positions',false,1);
 const wins=Number(p0.winner===0)+Number(p1.winner===1);
 validation.candidateWins+=wins;validation.duels+=2;
 validation.plannerCalls+=(p0.tally.plannerCalls||0)+(p1.tally.plannerCalls||0);
 if(!validation.byTier[s.tier])validation.byTier[s.tier]={wins:0,duels:0};
 validation.byTier[s.tier].wins+=wins;validation.byTier[s.tier].duels+=2;
}
for(const s of challengeScenes){
 const boss={...s,boss:true};
 const a=play(boss,lockedCandidate,model.weights,'none','positions',false,0);
 const b=play(boss,model.weights,model.weights,'none','positions',false,-1);
 validation.bossWinsCandidate+=Number(a.winner===0);
 validation.bossWinsChampion+=Number(b.winner===0);
 validation.bossGames++;
 if(!validation.bossByTier[s.tier])
  validation.bossByTier[s.tier]={candidate:0,champion:0,duels:0};
 const t=validation.bossByTier[s.tier];t.candidate+=Number(a.winner===0);
 t.champion+=Number(b.winner===0);t.duels++;
}
const specialistLeague=[];
for(const specialist of weightSets.slice(2)){
 let wins=0,duels=0;
 for(const scene of challengeScenes.slice(0,config.league)){
  const p0=play(scene,lockedCandidate,specialist.weights,'none','positions',false,0);
  const p1=play(scene,specialist.weights,lockedCandidate,'none','positions',false,1);
  wins+=Number(p0.winner===0)+Number(p1.winner===1);
  duels+=2;
 }
 specialistLeague.push({specialist:specialist.name,wins,duels,
  rate:Number((wins/duels).toFixed(4))});
}
const abRate=ab.plannerWins/ab.matches;
const validationRate=validation.candidateWins/validation.duels;
const abPositive=abRate>=.56;
const promotionEligible=abPositive&&validationRate>=.56&&
 validation.bossWinsCandidate>=validation.bossWinsChampion&&
 specialistLeague.every(r=>r.rate>=.45)&&
 validation.duels>=44;
const report={
 schema:'arcane-v140-planner-ab-mechanic-curriculum',
 status:'completed',
 ruleCommit:process.env.GITHUB_SHA||'not-available',
 training:{
  ...training,unmatched:unmatched.length,
  individualCounterfactualGroups:lessons,
  v138UsedForDiagnosisOnly:true,
  v139HistoricalPairsAvailable:past?.items?.length??0,
  priorChampionTrainedGames:model.gamesTrained
 },
 plannerAB:ab,plannerABWinRate:Number(abRate.toFixed(4)),
 performance:validation,
 candidateAgainstChampionRate:Number(validationRate.toFixed(4)),
 specialistLeague,
 curriculumCoverage:{
  practicedWithEngine:['hand-fusion-vs-normal','attack-vs-pass',
   'normal-and-fusion-placement','second-legal-attack',
   'board-defense-decay-value','all-vs-all-deck-archetype-comparisons'],
  regressionTestedNotAutonomouslyMastered:['guardian-soul-interactions',
   'allrounder-resonance','field-fusion-rework','role-inheritance',
   'lv1-fusion-and-ghost'],
  notYetProven:['two-complete-turn-minimax','poker-bonus-optimality',
   'ACE-specific-planning','owned-career-progression','level1-quest-policy']
 },
 onlyResearchMode:true,sourceLegalDecksNotEarned:true,
 championProtected:true,productionIntegrated:false,
 promotionEligible,
 interpretation:[
  'Planner AB uses the EXACT SAME 15 weights on both sides, differing only in planner activation and both seat positions.',
  'Each scenario is played twice with policy seats swapped, but alternate actions may consume engine RNG differently.',
  'Candidate model is tested only after freezing train-only weight changes; no holdout used to fit.',
  'Only two actions within ONE own turn are searched, never unseen cards or 2-3 complete future turns.',
  'Previously saved individual v13.8/v13.9 examples are diagnostic evidence, not perfect chronological counterfactuals.'
 ]
};
fs.mkdirSync('artifacts/v140',{recursive:true});
fs.writeFileSync('artifacts/v140/training-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v140/decision-history.json',JSON.stringify({
 schema:'arcane-v140-source-legal-counterfactual-replays',
 rulesCommit:process.env.GITHUB_SHA||'not-available',items:trainPairs,
 source:'real-game-engine paired original and alternative',
 forbiddenInterpretation:'not exact replay of historical private game state'
},null,2)+'\n');
fs.writeFileSync('artifacts/v140/candidate.json',JSON.stringify({
 schema:'arcane-v140-experimental-policy',
 previous:'models/ai-selfplay-v136.json',
 weightsBefore:model.weights,weightsCandidate:lockedCandidate,
 planner:'two same-turn actions, experimental',
 trainOnlyWeightUpdates:training.weightUpdates,
 independentPlannerAB:ab,
 independentHoldout:validation,
 promotionEligible,
 productionIntegrated:false
},null,2)+'\n');
console.log('ARCANE_V140_SUMMARY '+JSON.stringify({
 trainedPairs:training.pairs,weightUpdates:training.weightUpdates,
 plannerAB:{wins:ab.plannerWins,duels:ab.matches,rate:abRate,
  planningCalls:ab.plannerEvaluations},
 candidateMirror:{wins:validation.candidateWins,duels:validation.duels},
 bosses:{candidate:validation.bossWinsCandidate,
  champion:validation.bossWinsChampion,total:validation.bossGames,
  byTier:validation.bossByTier},
 specialists:specialistLeague.map(x=>({name:x.specialist,wins:x.wins,games:x.duels})),
 promotionEligible,productionIntegrated:false}));
