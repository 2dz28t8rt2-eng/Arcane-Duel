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
const tests=Number(process.env.ARCANE_V144_TRAIN||36);
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
 holdout:Number(process.env.ARCANE_V144_HOLDOUT||48),
 league:Number(process.env.ARCANE_V144_LEAGUE||10)
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
 const seed=(part==='train'?1440000:3440000)+i*173+tier*13;
 const s={tier,style,variant,seed,starter:i%2,
  kind:i%2?'attacks':'summon'};
 // Benchmark generator accepts 0–9999. Re-seed on identical deck
 // fingerprints, keeping train and holdout disjoint by construction.
 for(let attempt=0;attempt<500;attempt++){
  s.deckSeed=((part==='train'?6100:2300)+i*89+attempt*79)%10000;
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


// v14.3: only legal visible state enters the utility. Material cards in OUR hand
// have opportunity cost; opponent hidden hand, deck order and draws do not enter.
function boardValue139(g,actor){
 const own=g.players[actor],other=g.players[1-actor];
 const cardValue=(card,seat)=>{
  const d=dataOf(card),decay=creatureDecayRate(g,card,seat);
  const futureAtk=Math.max(0,d.atk-2*decay);
  const futureDef=Math.max(0,d.def-2*decay);
  const role=d.role||'combatant';
  const roleFactor=role==='guardian'||role==='soul'?1.12:
   role==='resonator'?1.07:role==='predator'?1.10:1;
  const ace=CARDS[card.id]?.ace?120:0;
  const mobility=card.mode==='def'? .14*d.def:.10*d.atk;
  return roleFactor*(.42*d.atk+.31*d.def+
   .18*futureAtk+.09*futureDef+mobility)+ace;
 };
 const field=(p,seat)=>p.field.filter(Boolean).reduce(
  (n,card)=>n+cardValue(card,seat),0);
 const hand=(p)=>p.hand.filter(c=>!isFateCard(c)).reduce((n,c)=>{
  const d=dataOf(c);return n+.17*d.atk+.09*d.def;
 },0);
 const adjacency=(p)=>p.field.reduce((n,c,i)=>{
  if(!c||!['guardian','soul'].includes(dataOf(c).role))return n;
  const right=p.field[i+1];
  return n+(right&&['guardian','soul'].includes(dataOf(right).role)&&
   dataOf(right).role!==dataOf(c).role?120:0);
 },0);
 const ownPower=field(own,actor)+hand(own)+adjacency(own);
 // Never look into enemy hand or deck content.
 const otherPower=field(other,1-actor)+adjacency(other);
 const lp=own.lp+(own.shield||0)-other.lp-(other.shield||0);
 const reserve=Math.min(14,(own.remainingFusion||[]).length)*18;
 return (ownPower-otherPower+reserve)/1250+lp/3200;
}
// Resolve from a true snapshot through the engine's prepare and placement
// steps. Pending material-cost snapshots must NEVER be scored as final outcomes.
function resolvedBranch143(g,action,actor,stats){
 const initial=JSON.parse(JSON.stringify(g));
 let prepared;
 try{prepared=applyAiAction(initial,action)}catch(e){return null}
 if(!prepared)return null;
 const materialCount=action.type==='fusion'?
  (action.uids||[]).length:action.type==='normal'?1:0;
 if(!initial.pending){
  // Attacks may resolve directly. No hidden opponent turns are simulated.
  return {game:initial,placementCompleted:false,materialCount};
 }
 const pending=initial.pending;
 const choices=[];
 const p=initial.players[actor];
 for(let i=0;i<p.field.length;i++){
  // On an occupied field slot, the engine is authoritative on whether a
  // combined field fusion exists. Never create the card by hand.
  const cand=JSON.parse(JSON.stringify(initial));
  let ok=null;
  try{ok=applyAiAction(cand,{type:'place',idx:i})}catch(e){continue}
  if(!ok||cand.pending)continue;
  const beforeCount=g.players[actor].field.filter(Boolean).length;
  const afterCount=cand.players[actor].field.filter(Boolean).length;
  if(beforeCount<5&&afterCount<beforeCount)continue;
  const score=boardValue139(cand,actor);
  choices.push({idx:i,game:cand,score,kind:ok.fused?'field-chain':'placement'});
 }
 if(!choices.length){
  stats.unresolvedBranches=(stats.unresolvedBranches||0)+1;
  return null;
 }
 choices.sort((a,b)=>b.score-a.score);
 const chosen=choices[0];
 if(stats.resolvedSamples?.length<20){
  stats.resolvedSamples.push({action:action.type,
   placedAt:chosen.idx,kind:chosen.kind,
   cardId:chosen.game.players[actor].field[chosen.idx]?.id,
   gain:Number((chosen.score-boardValue139(g,actor)).toFixed(4)),
   pendingCleared:chosen.game.pending===null});
 }
 stats.resolvedPreparations=(stats.resolvedPreparations||0)+1;
 stats.placementsExamined=(stats.placementsExamined||0)+choices.length;
 return {game:chosen.game,placementCompleted:true,
  placementSlot:chosen.idx,materialCount,
  kind:chosen.kind};
}
function lookahead143(g,w,stats){
 if(g.pending||g.winner!==null||g.turn>6||
    !['summon','attacks'].includes(g.aiPhase))return null;
 const own=g.active,options=choices135(g,stats)
  .filter(o=>['normal','fusion','attack','end'].includes(o.action.type))
  .map(o=>({item:o,rank:o.base+o.features.reduce(
   (n,x,i)=>n+x*w[i],0)}))
  .sort((a,b)=>b.rank-a.rank);
 if(options.length<2)return null;
 const shortlist=[];
 for(const kind of ['normal','fusion','attack','end']){
  for(const o of options.filter(x=>x.item.action.type===kind).slice(0,2))
   if(shortlist.length<8)shortlist.push(o);
 }
 if(!shortlist.length)return null;
 const base=boardValue139(g,own);
 const coeff=typeof ARCANE143_GAIN_WEIGHT==='number'?
  ARCANE143_GAIN_WEIGHT:1.4;
 const completed=[],failed=[];
 for(const o of shortlist){
  const action=o.item.action;
  if(action.type==='end'){
   completed.push({o,score:.22*o.rank-.08,finalGain:0});
   continue;
  }
  const resolved=resolvedBranch143(g,action,own,stats);
  if(!resolved){failed.push(action.type);continue}
  const newGame=resolved.game;
  const value=boardValue139(newGame,own)-base;
  // Resolve complete monster stats first, THEN charge extra scarcity/cost.
  const extraMaterials=Math.max(0,resolved.materialCount-1);
  const fusionReserveCost=action.type==='fusion'?.05:0;
  const opportunityCost=.10*extraMaterials+fusionReserveCost;
  const score=.22*o.rank+coeff*value-opportunityCost;
  completed.push({o,score,finalGain:value});
 }
 if(!completed.length)return null;
 completed.sort((a,b)=>b.score-a.score);
 stats.plannerCalls=(stats.plannerCalls||0)+1;
 if(g.aiPhase==='summon'){
  stats.fusionChoiceEvaluations=(stats.fusionChoiceEvaluations||0)+
   completed.filter(o=>o.o.item.action.type==='fusion').length;
  stats.normalChoiceEvaluations=(stats.normalChoiceEvaluations||0)+
   completed.filter(o=>o.o.item.action.type==='normal').length;
 }
 const picked=completed[0];
 if(picked.o.item.action.type==='fusion')
  stats.plannedFusions=(stats.plannedFusions||0)+1;
 if(stats.decisionExamples?.length<14){
  stats.decisionExamples.push({turn:g.turn,phase:g.aiPhase,
   chosen:picked.o.item.action.type,
   shortlist:completed.slice(0,6).map(v=>({
    type:v.o.item.action.type,
    score:+v.score.toFixed(4),
    completedGain:+v.finalGain.toFixed(4)})),
   unresolved:failed});
 }
 return picked.o.item.action;
}


function tacticalThreat144(g,actor){
 const own=g.players[actor],foe=g.players[1-actor];
 const attackers=foe.field.filter(c=>c&&c.mode!=='def');
 const pressure=attackers.reduce((n,c)=>n+dataOf(c).atk,0)+
  (attackers.some(c=>CARDS[c.id]?.ace)?350:0);
 const protection=own.field.filter(Boolean).reduce((n,c)=>{
  const d=dataOf(c);
  return n+(c.mode==='def'?d.def:d.atk)*
   (d.role==='guardian'||d.role==='soul'?.65:.45);
 },0);
 return Math.max(0,(pressure-protection)/1800);
}
function followup144(game,actor,stat){
 if(game.pending||game.winner!==null)return 0;
 const stage=JSON.parse(JSON.stringify(game));
 stage.aiPhase='attacks'; // only move forward within the SAME turn
 const legal=choices135(stage,stat).filter(c=>
  ['attack','arcane-soul-extract','arcane-guardian-heal'].includes(c.action.type));
 stat.followupCandidates=(stat.followupCandidates||0)+legal.length;
 const start=boardValue139(game,actor);
 let best=0,bestType='none';
 for(const candidate of legal.slice(0,16)){
  const copy=JSON.parse(JSON.stringify(stage));
  let result=false;
  try{result=!!applyAiAction(copy,candidate.action)}catch(e){result=false}
  if(!result)continue;
  stat.followupLegal=(stat.followupLegal||0)+1;
  const utility=boardValue139(copy,actor)-start+
   .3*(tacticalThreat144(game,actor)-tacticalThreat144(copy,actor));
  if(utility>best){best=utility;bestType=candidate.action.type;}
 }
 if(best>0)stat.followupExecuted=(stat.followupExecuted||0)+1;
 return best;
}
function lookahead139(g,w,st,policy='candidate'){
 if(policy==='baseline')return lookahead143(g,w,st);
 if(g.pending||g.winner!==null||g.turn>6||
 !['summon','attacks'].includes(g.aiPhase))return null;
 const items=choices135(g,st).filter(c=>
  ['normal','fusion','attack','end'].includes(c.action.type))
  .map(c=>({c,score:c.base+c.features.reduce((n,x,i)=>n+x*w[i],0)}))
  .sort((a,b)=>b.score-a.score);
 if(items.length<2)return null;
 const options=[];
 for(const kind of ['normal','fusion','attack','end'])
  for(const item of items.filter(x=>x.c.action.type===kind).slice(0,2))
   options.push(item);
 const start=boardValue139(g,g.active);
 const threat=tacticalThreat144(g,g.active);
 const profile=ARCANE144_PROFILE||{};
 const followScale=profile.follow??.65,defenseScale=profile.defense??.5;
 let result=null;
 for(const item of options){
  const act=item.c.action;
  if(act.type==='end'){
   const score=.22*item.score-.08;
   if(!result||score>result.score)result={act,score};continue;
  }
  const branch=resolvedBranch143(g,act,g.active,st);
  if(!branch)continue;
  const game=branch.game;
  const gain=boardValue139(game,g.active)-start;
  const afterPressure=tacticalThreat144(game,g.active);
  const follow=(act.type==='fusion'||act.type==='normal')?
   followup144(game,g.active,st):0;
  const materials=Math.max(0,branch.materialCount-1);
  const score=.22*item.score+2.35*gain+followScale*follow+
   defenseScale*(threat-afterPressure)-.10*materials-
   (act.type==='fusion'?.05:0);
  if(!result||score>result.score)result={act,score,follow};
 }
 if(!result)return null;
 st.plannerCalls=(st.plannerCalls||0)+1;
 if(result.act.type==='fusion')st.plannedFusions=(st.plannedFusions||0)+1;
 return result.act;
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
 lessonPhase=scene.kind,track=true,plannerSeat=-1,plannerGate='always',gainWeight=2.35,sideModes=['candidate','baseline'],profile144={}){
 const vm=boot({seed:scene.seed+99,x128Mode:'full'});
 vm.exec(controller);
 vm.exec(snapState.toString()+'\n'+boardValue139.toString()+'\n'+resolvedBranch143.toString()+'\n'+lookahead143.toString()+'\n'+tacticalThreat144.toString()+'\n'+followup144.toString()+'\n'+lookahead139.toString()+'\n'+allowPlanner141.toString());
 vm.exec('var ARCANE143_GAIN_WEIGHT='+JSON.stringify(gainWeight)+';');
 vm.exec('var ARCANE144_PROFILE='+JSON.stringify(profile144)+';');
 vm.exec('var ARCANE144_SIDES='+JSON.stringify(sideModes)+';');
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
 'let branch=null,found=false,invalid=0,records=[],pending=null,appliedSnapshot=null;',
 'const tally={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,',
 'available:{},chosen:{},rolePresence:{},plannerEligible:0,',
 'matchedOffers:{},matchedChoices:{},unmatchedChoices:{},',
 'plannerCompared:0,plannerSame:0,plannerDifferent:0,',
 'plannerDifferByPhase:{},plannerDifferKinds:{},',
 'plannerExamples:[],plannerByTurn:{},',
 'resolvedPreparations:0,placementsExamined:0,',
 'fusionChoiceEvaluations:0,normalChoiceEvaluations:0,',
 'plannedFusions:0,resolvedSamples:[],decisionExamples:[],',
 'followupCandidates:0,followupLegal:0,followupExecuted:0,',
 'actionDeltas:{normal:[],fusion:[],attack:[],arcaneSoul:[]}};',
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
 'let suggested=null,baseline=null;',
 'const enabled=(',String(plannerSeat),'===side||',String(plannerSeat),'===2)&&',
 'allowPlanner141(game,',JSON.stringify(plannerGate),')',
 '&&!game.pending&&game.winner===null;',
 'if(!action&&enabled){',
 'const ref=JSON.parse(JSON.stringify(game));',
 'baseline=decision135(ref,weights,false,null,',
 '{choices:0,bySide:[0,0],support:0,fusions:0,attacks:0})',
 '||original(ref,mode);',
 'suggested=lookahead139(game,weights,tally,ARCANE144_SIDES[side]);',
 'if(suggested){',
 'tally.plannerCompared++;',
 'const same=JSON.stringify(suggested)===JSON.stringify(baseline);',
 'if(same)tally.plannerSame++;else{',
 'tally.plannerDifferent++;',
 'tally.plannerDifferByPhase[phase]=(tally.plannerDifferByPhase[phase]||0)+1;',
 'const label=String(baseline?.type)+"→"+String(suggested.type);',
 'tally.plannerDifferKinds[label]=(tally.plannerDifferKinds[label]||0)+1;',
 'tally.plannerByTurn[String(game.turn)]=(tally.plannerByTurn[String(game.turn)]||0)+1;',
 'if(tally.plannerExamples.length<12)tally.plannerExamples.push({',
 'turn:game.turn,phase,baseline,suggested,',
 'publicBoard:pre.publicEnemyField,ownField:pre.ownField});',
 '}',
 '}',
 '}',
 'if(!action)action=suggested||decision135(game,weights,false,null,tally)',
 '||original(game,mode);',
 'if(side===0){',
 'const type=action?.type||"none";',
 'tally.chosen[type]=(tally.chosen[type]||0)+1;',
 'if(legal.length){',
 'const named=[...new Set(legal.map(x=>x.action.type))];',
 'for(const k of named)tally.matchedOffers[k]=(tally.matchedOffers[k]||0)+1;',
 'if(legal.some(x=>JSON.stringify(x.action)===JSON.stringify(action)))',
 'tally.matchedChoices[type]=(tally.matchedChoices[type]||0)+1;',
 'else tally.unmatchedChoices[type]=(tally.unmatchedChoices[type]||0)+1;',
 '}',
 '}',
 'appliedSnapshot={actor:side,before:pre,type:action?.type||"none",',
 'value:boardValue139(game,side)};',
 'if(',String(track),'){',
 'pending={before:pre,chosen:action,actor:side,',
 'phase,legalActions:ranked.slice(0,24).map(x=>({action:x.action,',
 'features:x.features,score:+x.score.toFixed(4)}))};',
 '}',
 'return action;};',
 'applyAiAction=function(game,action){',
 'const ok=resolve(game,action);',
 'if(game===g){if(!ok)invalid++;',
 'if(ok&&appliedSnapshot&&appliedSnapshot.actor<=1){',
 'const delta=boardValue139(game,appliedSnapshot.actor)-appliedSnapshot.value;',
 'const typ=appliedSnapshot.type;',
 'const group=typ==="arcane-soul-extract"?"arcaneSoul":typ;',
 'if(tally.actionDeltas[group]&&tally.actionDeltas[group].length<20)',
 'tally.actionDeltas[group].push(+delta.toFixed(4));',
 'appliedSnapshot=null;',
 '}',
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










const older=JSON.parse(fs.readFileSync('artifacts/history-v142/report.json','utf8'));
const previous=JSON.parse(fs.readFileSync('artifacts/history-v143/report.json','utf8'));
assert.equal(older.schema,'arcane-v142-action-override-audit');
assert.equal(previous.schema,'arcane-v143-fusion-value-resolution');
assert.equal(previous.selected,'fusion-aware-strong');
const lessonHistory={
 sourceRuns:[39647899323,39650698039],
 schemas:[older.schema,previous.schema],
 usefulFindings:[
  'v142: 10/11 planner overrides chose normal instead of fusion; fix pending-state valuation',
  'v143: completed fusion placement improved planning but was only 10/24 against offensive specialist',
  'v143: opponent X remained 0/9 and soul decks were weaker than predator',
  'v143: independent holdout 59/108; no production promotion'
 ],
 trainingResponse:[
  'Keep fully engine-resolved placed fusion outcome including consumed materials',
  'Evaluate a further actually legal attack or guardian/soul support action when available',
  'Penalize exposed own board against publicly visible offensive threats',
  'Train on new generated deck seeds, keep old holds out of fitting'
 ],
 pastBoss10:previous.holdout.boss.byTier['10'],
 pastOffensive:previous.holdout.league.find(r=>r.name==='offensive-specialist')
};
assert.ok(lessonHistory.pastOffensive.rate<.45);
const candidateSettings=[
 {name:'followup-conservative',follow:.35,defense:.40},
 {name:'followup-balanced',follow:.80,defense:.65},
 {name:'followup-counterattack',follow:1.15,defense:1.05}
];
const training=[];
function duel(scene,modes,setting){
 return play(scene,model.weights,model.weights,'none','positions',false,
  2,'summon-only',2.35,modes,setting);
}
function scorePair(scene,setting){
 const left=duel(scene,['candidate','baseline'],setting);
 const right=duel(scene,['baseline','candidate'],setting);
 return {
  wins:Number(left.winner===0)+Number(right.winner===1),
  games:2,
  followupCandidates:(left.tally.followupCandidates||0)+
   (right.tally.followupCandidates||0),
  followupLegal:(left.tally.followupLegal||0)+
   (right.tally.followupLegal||0),
  followupExecuted:(left.tally.followupExecuted||0)+
   (right.tally.followupExecuted||0),
  proposedDifferent:(left.tally.plannerDifferent||0)+
   (right.tally.plannerDifferent||0)
 };
}
for(const setting of candidateSettings){
 const metrics={setting,wins:0,games:0,
  followupCandidates:0,followupLegal:0,followupExecuted:0,
  proposedDifferent:0};
 for(const s of train){
  const r=scorePair(s,setting);
  for(const [k,v] of Object.entries(r))metrics[k]+=v;
 }
 metrics.rate=metrics.wins/metrics.games;
 training.push(metrics);
 console.log('ARCANE_V144_TRAIN '+JSON.stringify(metrics));
}
training.sort((a,b)=>b.rate-a.rate||
 b.followupExecuted-a.followupExecuted);
const selected=training[0].setting;
const hold={selected,vs143:{wins:0,games:0,
 followupCandidates:0,followupLegal:0,followupExecuted:0,proposedDifferent:0,
 byTier:{}},vsChampion:{wins:0,games:0},boss:{candidate:0,baseline143:0,
 champion:0,games:0,byTier:{}},specialists:[]};
for(const s of holdout){
 const r=scorePair(s,selected);
 for(const [k,v] of Object.entries(r))hold.vs143[k]+=v;
 if(!hold.vs143.byTier[s.tier])hold.vs143.byTier[s.tier]={wins:0,games:0};
 hold.vs143.byTier[s.tier].wins+=r.wins;
 hold.vs143.byTier[s.tier].games+=r.games;
 // Frozen 15-weight champion with no planner.
 const a=play(s,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['candidate','baseline'],selected);
 const b=play(s,model.weights,model.weights,'none','positions',false,
  1,'summon-only',2.35,['baseline','candidate'],selected);
 hold.vsChampion.wins+=Number(a.winner===0)+Number(b.winner===1);
 hold.vsChampion.games+=2;
}
for(const s of holdout.filter((_,i)=>i%2===0)){
 const boss={...s,boss:true};
 const a=play(boss,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['candidate','baseline'],selected);
 const b=play(boss,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['baseline','baseline'],selected);
 const c=play(boss,model.weights,model.weights,'none','positions',false,
  -1,'none',2.35,['baseline','baseline'],selected);
 const win=[a,b,c].map(x=>Number(x.winner===0));
 hold.boss.candidate+=win[0];
 hold.boss.baseline143+=win[1];
 hold.boss.champion+=win[2];
 hold.boss.games++;
 if(!hold.boss.byTier[s.tier])
  hold.boss.byTier[s.tier]={candidate:0,baseline143:0,champion:0,games:0};
 const t=hold.boss.byTier[s.tier];
 t.candidate+=win[0];t.baseline143+=win[1];t.champion+=win[2];t.games++;
}
for(const specialist of weightSets.slice(2)){
 let wins=0,games=0;
 for(const s of holdout.slice(0,config.league)){
  const a=play(s,model.weights,specialist.weights,'none','positions',false,
   0,'summon-only',2.35,['candidate','baseline'],selected);
  const b=play(s,specialist.weights,model.weights,'none','positions',false,
   1,'summon-only',2.35,['baseline','candidate'],selected);
  wins+=Number(a.winner===0)+Number(b.winner===1);games+=2;
 }
 hold.specialists.push({name:specialist.name,wins,games,rate:wins/games});
}
const vs143=hold.vs143.wins/hold.vs143.games;
const versusChampion=hold.vsChampion.wins/hold.vsChampion.games;
const promoted=versusChampion>=.56&&vs143>=.53&&
 hold.boss.candidate>=hold.boss.champion&&
 hold.specialists.every(x=>x.rate>=.45)&&hold.vsChampion.games>=72;
const report={schema:'arcane-v144-history-driven-followup-training',
 status:'completed',ruleCommit:process.env.GITHUB_SHA||'unknown',
 historicalEvidence:lessonHistory,
 training,selection:{...selected,fitOn:'new training seeds only'},
 independentHoldout:hold,
 vs143Rate:+vs143.toFixed(4),
 versusChampionRate:+versusChampion.toFixed(4),
 promoted,productionIntegrated:false,
 limitations:[
  'Chosen followup is legal in the engine and only within the current turn.',
  'Threat uses visible enemy monsters only; no enemy hand/draw access.',
  'Historical audits guide lessons; they do not provide retrospective action-level ground truth.',
  'One seed per outcome is stochastic; result does not establish causal superiority.',
  'This is parameter fitting, not automated multi-turn neural reinforcement learning.',
  'Real career-deck ownership and full next-turn opponent planning are not yet trained.'
 ]};
fs.mkdirSync('artifacts/v144',{recursive:true});
fs.writeFileSync('artifacts/v144/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v144/history-lessons.json',
 JSON.stringify({schema:'arcane-v144-history-lessons',...lessonHistory},null,2)+'\n');
fs.writeFileSync('artifacts/v144/candidate.json',JSON.stringify({
 schema:'arcane-v144-experimental-followup-model',
 weights:model.weights,selected,
 prior:'models/ai-selfplay-v136.json',
 promotionEligible:promoted,productionIntegrated:false
},null,2)+'\n');
console.log('ARCANE_V144_SUMMARY '+JSON.stringify({
 selection:selected.name,
 training:training.map(x=>({name:x.setting.name,wins:x.wins,games:x.games,
 followups:x.followupExecuted})),
 vs143:hold.vs143,vsChampion:hold.vsChampion,
 boss:hold.boss,specialists:hold.specialists,
 promoted,productionIntegrated:false
}));
