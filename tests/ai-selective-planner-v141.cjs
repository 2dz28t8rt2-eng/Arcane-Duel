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
const tests=Number(process.env.ARCANE_V141_TRAIN||56);
assert.ok(Number.isInteger(tests)&&tests>=2&&tests<=160);
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
 holdout:Number(process.env.ARCANE_V141_HOLDOUT||72),
 league:Number(process.env.ARCANE_V141_LEAGUE||15)
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
 const seed=(part==='train'?1410000:3410000)+i*173+tier*13;
 const s={tier,style,variant,seed,starter:i%2,
  kind:i%2?'attacks':'summon'};
 // Benchmark generator accepts 0–9999. Re-seed on identical deck
 // fingerprints, keeping train and holdout disjoint by construction.
 for(let attempt=0;attempt<500;attempt++){
  s.deckSeed=((part==='train'?3100:8100)+i*89+attempt*79)%10000;
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


function allowPlanner141(g,mode){
 if(mode==='none')return false;
 if(mode==='always')return true;
 if(mode==='summon-only')return g.aiPhase==='summon';
 if(mode==='attack-only')return g.aiPhase==='attacks';
 if(mode==='early-attack')return g.aiPhase==='attacks'&&g.turn<=3;
 if(mode==='late-attack')return g.aiPhase==='attacks'&&g.turn>=4;
 if(mode==='defense-threat'){
  const enemy=g.players[1-g.active].field.filter(Boolean);
  return g.aiPhase==='attacks'&&enemy.some(c=>c.mode==='def'||
   CARDS[c.id]?.ace);
 }
 throw Error('Unknown planner activation mode '+mode);
}

function play(scene,weightsSeat0,weightsSeat1,branchMode='none',
 lessonPhase=scene.kind,track=true,plannerSeat=-1,plannerGate='always'){
 const vm=boot({seed:scene.seed+99,x128Mode:'full'});
 vm.exec(controller);
 vm.exec(snapState.toString()+'\n'+boardValue139.toString()+'\n'+lookahead139.toString()+'\n'+allowPlanner141.toString());
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
 'const tally={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,',
 'available:{},chosen:{},rolePresence:{},plannerEligible:0};',
 'const original=chooseAiAction,resolve=applyAiAction;',
 'chooseAiAction=function(game,mode){',
 'if(game!==g)return original(game,mode);',
 'if(!game.aiPhase)game.aiPhase="summon";',
 'if(',String(!!scene.boss),'&&game.active===1)return original(game,mode);',
 'const side=game.active,weights=side===0?V138_A:V138_B;',
 'const phase=game.aiPhase,pre=snapState(game);',
 'const legal=(game.pending||game.winner!==null)?[]:choices135(game,tally);',
 'if(side===0){',
 'const set=new Set(legal.map(x=>x.action.type));',
 'for(const t of set)tally.available[t]=(tally.available[t]||0)+1;',
 'for(const c of game.players[side].field.filter(Boolean)){',
 'const role=dataOf(c).role||"unknown";',
 'tally.rolePresence[role]=(tally.rolePresence[role]||0)+1;',
 '}',
 'const enemyAce=game.players[1-side].field.some(c=>c&&CARDS[c.id]?.ace);',
 'if(enemyAce)tally.available.visibleEnemyAce=(tally.available.visibleEnemyAce||0)+1;',
 '}',
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
 'if(!action)action=(',String(plannerSeat),
 '===side&&allowPlanner141(game,',JSON.stringify(plannerGate),')',
 '?lookahead139(game,weights,tally):null)',
 '||decision135(game,weights,false,null,tally)||original(game,mode);',
 'if(side===0){',
 'const type=action?.type||"none";tally.chosen[type]=(tally.chosen[type]||0)+1;',
 '}',
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




const oldV140='artifacts/history-v140/training-report.json';
const prior=fs.existsSync(oldV140)?JSON.parse(fs.readFileSync(oldV140,'utf8')):null;
if(prior)assert.equal(prior.schema,'arcane-v140-planner-ab-mechanic-curriculum');
const gates=['none','always','summon-only','attack-only','early-attack','defense-threat'];
// Gate selection is learned ONLY from new v14.1 training scenarios. The
// frozen weights do not change. Historical v14.0 tests are diagnostic only.
const gateTraining=[],gateResults=[];
for(const gate of gates){
 let won=0,total=0,plannerCalls=0,telemetry=null,byTier={};
 for(const s of train){
  if(gate==='none')continue; // explicit control policy, no gate selection needed
  const a=play(s,model.weights,model.weights,'none','positions',false,0,gate);
  const b=play(s,model.weights,model.weights,'none','positions',false,1,gate);
  const w=Number(a.winner===0)+Number(b.winner===1);
  won+=w;total+=2;
  plannerCalls+=(a.tally.plannerCalls||0)+(b.tally.plannerCalls||0);
  if(!byTier[s.tier])byTier[s.tier]={wins:0,games:0};
  byTier[s.tier].wins+=w;byTier[s.tier].games+=2;
  if(!telemetry)telemetry=a.tally;
 }
 const score=total?won/total:0.5;
 gateTraining.push({gate,wins:won,games:total,score,
  plannerCalls,byTier,representativeTelemetry:telemetry?{
   available:telemetry.available,chosen:telemetry.chosen,
   rolePresence:telemetry.rolePresence}:null});
 console.log('ARCANE_V141_GATE_TRAIN '+JSON.stringify({
  gate,wins:won,games:total,rate:score,plannerCalls}));
}
// Conservative selection: against a 50%-expectation mirror baseline,
// a gate needs >55% on train AND sufficient action usage.
// Reject expensive lookahead when its gain is unproven.
const ranked=gateTraining.filter(x=>x.gate!=='none'&&x.games>=32&&
 x.plannerCalls>=5&&x.score>=.55)
 .sort((a,b)=>b.score-a.score||a.plannerCalls-b.plannerCalls);
const chosenGate=ranked[0]?.gate||'none';
const selectedByTrainingOnly=true;
const holdoutStats={gate:chosenGate,policyWeightsIdentical:true,
 noHoldoutFitting:true,mirror:{wins:0,games:0,byTier:{},byStyle:{}},
 boss:{candidateWins:0,championWins:0,games:0,byTier:{}},
 league:[],overallTelemetry:{
  available:{},chosen:{},rolePresence:{},plannerCalls:0}};
function aggregate(to,from){
 for(const [k,v] of Object.entries(from||{}))to[k]=(to[k]||0)+v;
}
for(const s of holdout){
 const a=play(s,model.weights,model.weights,'none','positions',true,0,chosenGate);
 const b=play(s,model.weights,model.weights,'none','positions',false,1,chosenGate);
 const w=Number(a.winner===0)+Number(b.winner===1);
 holdoutStats.mirror.wins+=w;holdoutStats.mirror.games+=2;
 for(const [table,key] of [[holdoutStats.mirror.byTier,s.tier],
  [holdoutStats.mirror.byStyle,s.style]]){
  if(!table[key])table[key]={wins:0,games:0};
  table[key].wins+=w;table[key].games+=2;
 }
 for(const [k,src] of [['available',a.tally.available],
  ['chosen',a.tally.chosen],['rolePresence',a.tally.rolePresence]]){
  aggregate(holdoutStats.overallTelemetry[k],src);
 }
 holdoutStats.overallTelemetry.plannerCalls+=(a.tally.plannerCalls||0)+
  (b.tally.plannerCalls||0);
}
for(const s of holdout.filter((_,i)=>i%2===0)){
 const boss={...s,boss:true};
 const a=play(boss,model.weights,model.weights,'none','positions',false,0,chosenGate);
 const b=play(boss,model.weights,model.weights,'none','positions',false,-1,'none');
 const winA=Number(a.winner===0),winB=Number(b.winner===0);
 holdoutStats.boss.candidateWins+=winA;
 holdoutStats.boss.championWins+=winB;
 holdoutStats.boss.games++;
 if(!holdoutStats.boss.byTier[s.tier])holdoutStats.boss.byTier[s.tier]={
  candidate:0,champion:0,games:0};
 const tt=holdoutStats.boss.byTier[s.tier];
 tt.candidate+=winA;tt.champion+=winB;tt.games++;
}
for(const specialist of weightSets.slice(2)){
 let wins=0,games=0,plannerCalls=0;
 for(const s of holdout.slice(0,config.league)){
  const a=play(s,model.weights,specialist.weights,'none','positions',
   false,0,chosenGate);
  const b=play(s,specialist.weights,model.weights,'none','positions',
   false,1,chosenGate);
  wins+=Number(a.winner===0)+Number(b.winner===1);
  games+=2;plannerCalls+=(a.tally.plannerCalls||0)+(b.tally.plannerCalls||0);
 }
 holdoutStats.league.push({specialist:specialist.name,wins,games,
  plannerCalls,rate:+(wins/games).toFixed(4)});
}
const mirrorRate=holdoutStats.mirror.wins/holdoutStats.mirror.games;
const valid=chosenGate!=='none'&&mirrorRate>=.56&&
 holdoutStats.boss.candidateWins>=holdoutStats.boss.championWins&&
 holdoutStats.league.every(x=>x.rate>=.45)&&
 holdoutStats.mirror.games>=80;
const out={
 schema:'arcane-v141-selective-planner-training-report',
 status:'completed',source:'real engine rules and v136 frozen champion',
 oldV140:{reportedPriorAB:prior?.plannerAB||null,
  use:'historical diagnosis only; never fitted selector from prior holdout'},
 priorGamesTrained:model.gamesTrained,
 gateTraining,chosenGate,selectionOnTrainingOnly:selectedByTrainingOnly,
 independentHoldout:holdoutStats,
 comparison:{
  holdoutMirrorWins:holdoutStats.mirror.wins,
  holdoutMirrorGames:holdoutStats.mirror.games,
  rate:+mirrorRate.toFixed(4),
  identicalWeights:true,policyDifferenceOnlyGate:true,
  onlySourceLegalConstructedDecks:true,
  trainingDeckHoldoutDeckOverlap:false
 },
 measuredMechanisms:{
  actualLegalAvailability:holdoutStats.overallTelemetry.available,
  actualChosenActions:holdoutStats.overallTelemetry.chosen,
  observedOwnFieldRolePresence:holdoutStats.overallTelemetry.rolePresence,
  empiricalSkillsCovered:['hand-fusion','normal-summon','positions',
   'attack','arcane-guardian-heal','arcane-soul-extract'],
  regressionTestedNotAutonomouslyMastered:['defender-soul','role-inheritance',
   'resonance','fusion-rework','lv1-fusion-and-ghost'],
  unproven:['poker-bonus-strategy','field-fusion-optimality',
   'ACE-formation-planning','2-3-full-turn-foresight','earned-progression']
 },
 promotionEligible:valid,productionIntegrated:false,
 excludedPrivateOpponentInformation:true,
 limitations:[
  'Gate is selected on train scenarios and independently evaluated on unseen seeds and source-legal constructed decks.',
  'Selected gate is not evidence of robust causal effect if it fails holdout.',
  'The current engine-resolution planner considers at most two same-turn own actions.',
  'Every changed decision can consume random numbers differently, and opponent responses matter.',
  'Telemetry counts legal offers per policy decision (not unique turns) and chosen actions; role presence counts repeated decision observations.',
  'Mechanics tests demonstrate engine behavior, not learned strategic mastery.',
  'No production NPC, players inventory or game balance was changed.'
 ]
};
fs.mkdirSync('artifacts/v141',{recursive:true});
fs.writeFileSync('artifacts/v141/train-gate-selection.json',
 JSON.stringify({gateTraining,chosenGate,selectionOnTrainingOnly:true},null,2)+'\n');
fs.writeFileSync('artifacts/v141/report.json',JSON.stringify(out,null,2)+'\n');
fs.writeFileSync('artifacts/v141/candidate.json',JSON.stringify({
 schema:'arcane-v141-research-gated-planner',
 weights:model.weights,priorModel:'models/ai-selfplay-v136.json',
 activationGate:chosenGate,
 gateSelection:'training only',independentEval:true,
 promotionEligible:valid,productionIntegrated:false
},null,2)+'\n');
console.log('ARCANE_V141_SUMMARY '+JSON.stringify({
 trainedGates:gateTraining.map(x=>({gate:x.gate,wins:x.wins,games:x.games,
 plannerCalls:x.plannerCalls})),
 chosenGate,
 holdoutMirror:{wins:holdoutStats.mirror.wins,games:holdoutStats.mirror.games},
 boss:{candidate:holdoutStats.boss.candidateWins,
  champion:holdoutStats.boss.championWins,games:holdoutStats.boss.games},
 league:holdoutStats.league.map(x=>({name:x.specialist,
  wins:x.wins,games:x.games})),
 telemetry:holdoutStats.overallTelemetry,valid,productionIntegrated:false}));
