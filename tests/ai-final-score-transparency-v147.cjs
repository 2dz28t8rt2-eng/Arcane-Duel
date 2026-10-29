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
const tests=Number(process.env.ARCANE_V147_TRAIN||63);
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
 holdout:Number(process.env.ARCANE_V147_HOLDOUT||63),
 league:Number(process.env.ARCANE_V147_LEAGUE||12)
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
 const seed=(part==='train'?1470000:3470000)+i*173+tier*13;
 const s={tier,style,variant,seed,starter:i%2,
  kind:i%2?'attacks':'summon'};
 // Benchmark generator accepts 0–9999. Re-seed on identical deck
 // fingerprints, keeping train and holdout disjoint by construction.
 for(let attempt=0;attempt<500;attempt++){
  s.deckSeed=((part==='train'?9100:5150)+i*89+attempt*79)%10000;
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

function followup144(g,actor,stats,w){
 if(g.pending||g.winner!==null||g.active!==actor)return {gain:0,kind:'none'};
 const state=JSON.parse(JSON.stringify(g)),before=boardValue139(g,actor);
 // Do not assign aiPhase='attacks': ask the ORIGINAL game controller to
 // progress through its legitimate positions/attacks transitions.
 let next=null,steps=0;
 while(state.active===actor&&state.winner===null&&!state.pending&&steps++<6){
  next=chooseAiAction(state,'balanced');
  if(!next||next.type==='end')return {gain:0,kind:'none'};
  if(next.type==='switch'){
   if(!applyAiAction(state,next))return {gain:0,kind:'none'};
   continue;
  }
  if(!['attack','arcane-guardian-heal','arcane-soul-extract'].includes(next.type))
   return {gain:0,kind:'none'};
  break;
 }
 if(!next||!['attack','arcane-guardian-heal','arcane-soul-extract'].includes(next.type))
  return {gain:0,kind:'none'};
 if(state.aiPhase!=='attacks')return {gain:0,kind:'none'};
 const options=choices135(state,stats).filter(t=>
  ['attack','arcane-guardian-heal','arcane-soul-extract'].includes(t.action.type));
 stats.followupCandidates=(stats.followupCandidates||0)+options.length;
 let best={gain:0,kind:'none'};
 for(const entry of options.slice(0,16)){
  const choice=JSON.parse(JSON.stringify(state));
  let applied=null;
  try{applied=applyAiAction(choice,entry.action)}catch(e){applied=null}
  if(!applied)continue;
  stats.followupLegal=(stats.followupLegal||0)+1;
  const attackPressure=tacticalThreat144(g,actor)-tacticalThreat144(choice,actor);
  const delta=boardValue139(choice,actor)-before+.32*attackPressure;
  if(delta>best.gain)best={gain:delta,kind:entry.action.type,
   action:entry.action};
 }
 if(best.gain>0)stats.followupExecuted=(stats.followupExecuted||0)+1;
 return best;
}
function lookahead145(g,w,st,policy='candidate'){
 if(policy==='baseline')return lookahead143(g,w,st);
 if(policy==='champion')return null;
 if(g.pending||g.winner!==null||g.turn>7||
  !['summon','attacks'].includes(g.aiPhase))return null;
 const options=choices135(g,st).filter(c=>
  ['normal','fusion','attack','end'].includes(c.action.type))
  .map(c=>({action:c.action,base:c.base+
   c.features.reduce((n,f,i)=>n+f*w[i],0)}))
  .sort((a,b)=>b.base-a.base);
 if(options.length<2)return null;
 const chosen=[];
 for(const t of ['normal','fusion','attack','end'])
  for(const x of options.filter(k=>k.action.type===t).slice(0,2))
   chosen.push(x);
 const profile=ARCANE144_PROFILE?.bySide?.[g.active]||ARCANE144_PROFILE||{};
 const start=boardValue139(g,g.active);
 const threat=tacticalThreat144(g,g.active);
 let best=null;
 for(const option of chosen){
  const action=option.action;
  if(action.type==='end'){
   const score=.22*option.base-.08;
   if(!best||score>best.score)best={action,score,follow:null};
   continue;
  }
  const branch=resolvedBranch143(g,action,g.active,st);
  if(!branch)continue;
  const done=branch.game;
  const immediate=boardValue139(done,g.active)-start;
  const defense=threat-tacticalThreat144(done,g.active);
  const follow=(action.type==='normal'||action.type==='fusion')?
   followup144(done,g.active,st,w):{gain:0,kind:'none'};
  const materials=Math.max(0,branch.materialCount-1);
  const economyPenalty=materials*(profile.material??.10)+
   (action.type==='fusion'?.05:0);
  const offensiveBonus=action.type==='attack'?
   .14*(profile.tempo??1):0;
  const score=.22*option.base+2.35*immediate+
   (profile.follow??.60)*follow.gain+
   (profile.defense??.55)*defense-economyPenalty+offensiveBonus;
  if(!best||score>best.score)best={action,score,follow};
 }
 if(!best)return null;
 st.plannerCalls=(st.plannerCalls||0)+1;
 if(best.action.type==='fusion')st.plannedFusions=(st.plannedFusions||0)+1;
 if(best.follow&&best.follow.kind!=='none'){
  st.plannedFollowups=(st.plannedFollowups||0)+1;
  // This intent may or may not be realized by the actual next decision.
  st.followupIntent={actor:g.active,turn:g.turn,kind:best.follow.kind,
   action:best.follow.action};
 }
 return best.action;
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


function explain146(g,action,ranked,pre,weights){
 const selected=ranked.find(x=>JSON.stringify(x.action)===JSON.stringify(action));
 const other=ranked.filter(x=>JSON.stringify(x.action)!==JSON.stringify(action)).slice(0,3);
 const f=selected?.features||null;
 const names=['ATK','DEF','Fusion','Normalbeschwörung','Angriff','Gegnervergleich',
 'Monster-Kill','Letaler Angriff','ACE-Druck','Support','Boarddruck',
 'Fusionsmaterial','Kartenverbrauch','Risiko','Wächter/Soul-Synergie'];
 const components=f?f.map((v,i)=>({
  reason:names[i],raw:+v.toFixed(4),score:+(v*weights[i]).toFixed(4)
 })).filter(x=>Math.abs(x.score)>.03).sort((a,b)=>
 Math.abs(b.score)-Math.abs(a.score)).slice(0,5):[];
 const rules={fusion:'Fusion braucht legales Material und Fusionsvorlage; die platzierte Karte wird bewertet',
 normal:'Beschwörung spart zusätzliche Fusionsmaterialien',
 attack:'Kampfziel, eigener Verlust, gegnerische LP und Ermüdung prüfen',
 'arcane-soul-extract':'Seelenentzug: DEF-Modus und zulässiges gegnerisches Ziel',
 'arcane-guardian-heal':'Heilung: benachbarter Seelenzehrer und fehlende DEF',
 switch:'Positionswechsel kann künftigen Angriff verhindern',
 end:'Zugende statt weiterer riskanter Aktion'};
 const gap=selected&&other[0]?selected.score-other[0].score:null;
 return {explanationType:'mechanical-score-attribution-not-inner-thought',
 action,legalCandidate:!!selected,
 simpleRule:rules[action?.type]||'Phasenabhängige legale Spielaktion',
 contributions:components,
 score:selected?+selected.score.toFixed(4):null,
 runnerUp:other[0]?{action:other[0].action,score:+other[0].score.toFixed(4)}:null,
 scoreGap:gap===null?null:+gap.toFixed(4),
 disclaimer:'Bewertung erklärt Modellmerkmale, nicht tatsächliche spätere Gewinngarantie',
 knownInformation:pre,noOpponentHandRevealed:true};
}
function actorSnapshot146(game,actor){
 const p=game.players[actor],q=game.players[1-actor];
 const cards=x=>x.field.map((c,i)=>c?({
  slot:i,id:c.id,uid:c.uid,atk:dataOf(c).atk,def:dataOf(c).def,
  level:dataOf(c).level,role:dataOf(c).role,mode:c.mode,
  attacked:!!c.attacked,decayAge:c.decayAge||0}):null);
 return {actor,turn:game.turn,phase:game.aiPhase,
  life:[p.lp,q.lp],shields:[p.shield||0,q.shield||0],
  handCount:p.hand.length,ownDeckCount:p.deck.length,
  ownFusionLeft:p.remainingFusion?.length||0,
  graveyardCount:p.graveyard.length,
  ownField:cards(p),enemyField:cards(q),
  winner:game.winner,pending:!!game.pending};
}
// Honest comparison: v14.6 considers engine-resolved next legal option
// and tactics by training archetype; v14.5 is retained as a separate control.
function lookahead139(g,w,st,mode='candidate'){
 if(mode==='baseline')return lookahead143(g,w,st);
 if(mode==='prior145')return lookahead145(g,w,st,'candidate');
 if(mode==='champion')return null;
 if(g.pending||g.winner!==null||g.turn>7||
    !['summon','attacks'].includes(g.aiPhase))return null;
 const options=choices135(g,st).filter(x=>
  ['normal','fusion','attack','end'].includes(x.action.type))
 .map(x=>({action:x.action,base:x.base+
  x.features.reduce((n,v,i)=>n+v*w[i],0)}))
 .sort((a,b)=>b.base-a.base);
 if(options.length<2)return null;
 const shortlisted=[];
 for(const type of ['normal','fusion','attack','end'])
  for(const a of options.filter(x=>x.action.type===type).slice(0,2))
   shortlisted.push(a);
 const own=g.active,start=boardValue139(g,own),threat=tacticalThreat144(g,own);
 const profile=ARCANE144_PROFILE?.bySide?.[own]||{};
 let pick=null;
 const audit=[];
 for(const entry of shortlisted){
  const action=entry.action;
  if(action.type==='end'){
   const score=.22*entry.base-.08;
   audit.push({action,score,raw:{linear:.22*entry.base,immediate:0,
    follow:0,defense:0,materials:0,tempo:0,reserve:0,end:-.08}});
   if(!pick||score>pick.score)pick={action,score};
   continue;
  }
  const branch=resolvedBranch143(g,action,own,st);
  if(!branch)continue;
  const next=branch.game;
  const immediate=boardValue139(next,own)-start;
  const defense=threat-tacticalThreat144(next,own);
  const f=(action.type==='normal'||action.type==='fusion')?
   followup144(next,own,st,w):{gain:0,kind:'none'};
  const materials=Math.max(0,branch.materialCount-1);
  const d=action.type==='attack'?
   .17*(profile.tempo??1):0;
  const score=.22*entry.base+2.35*immediate+
   (profile.follow??.65)*f.gain+
   (profile.defense??.55)*defense-
   (profile.material??.10)*materials-(action.type==='fusion'?.05:0)+d;
  audit.push({action,score,raw:{linear:.22*entry.base,immediate,
    follow:f.gain,defense,materials,
    tempo:action.type==='attack'?1:0,reserve:action.type==='fusion'?1:0,end:0},
   nextAction:f.action||null,
   placement:{completed:branch.placementCompleted,
    slot:branch.placementSlot??null,materials:branch.materialCount}});
  if(!pick||score>pick.score)pick={action,score,follow:f};
 }
 if(!pick)return null;
 if(ARCANE147_TRACE&&ARCANE144_SIDES[own]==='candidate'&&
   st.finalRankedTraces.length<10){
  const oldP=ARCANE144_PROFILE?.oldProfile||profile;
  const scoreAs=(item,p)=>{
   const r=item.raw;
   return r.linear+2.35*r.immediate+(p.follow??.65)*r.follow+
    (p.defense??.55)*r.defense-(p.material??.10)*r.materials+
    .17*(p.tempo??1)*r.tempo-.05*r.reserve+r.end;
  };
  const recomposed=audit.every(x=>Math.abs(scoreAs(x,profile)-x.score)<1e-7);
  if(!recomposed)st.traceIntegrityErrors++;
  const previousRank=[...audit].sort((a,b)=>scoreAs(b,oldP)-scoreAs(a,oldP));
  const oldTop=previousRank[0];
  const changed=JSON.stringify(oldTop.action)!==JSON.stringify(pick.action);
  st.sameStateComparisons++;
  if(changed)st.sameStateOverrides++;
  st.finalRankedTraces.push({turn:g.turn,actor:own,phase:g.aiPhase,
   chosen:pick.action,finalScore:+pick.score.toFixed(7),
   previousV146ActionUnderSameOutcomes:oldTop.action,changed,
   finalScoreReconstructionPassed:recomposed,
   rankings:[...audit].sort((a,b)=>b.score-a.score).map(item=>({
    action:item.action,finalScore:+item.score.toFixed(7),
    linear:+item.raw.linear.toFixed(6),
    postPlacement:+(2.35*item.raw.immediate).toFixed(6),
    legalFollowup:+((profile.follow??.65)*item.raw.follow).toFixed(6),
    visibleThreat:+((profile.defense??.55)*item.raw.defense).toFixed(6),
    materialCost:+(-(profile.material??.10)*item.raw.materials).toFixed(6),
    fusionReserve:+(-.05*item.raw.reserve).toFixed(6),
    tempo:+(.17*(profile.tempo??1)*item.raw.tempo).toFixed(6),
    end:+item.raw.end.toFixed(6),
    previousPolicySameOutcomes:+scoreAs(item,oldP).toFixed(6),
    placement:item.placement||null,
    hypotheticalNextAction:item.nextAction||null
   }))
  });
 }
 st.plannerCalls=(st.plannerCalls||0)+1;
 if(pick.action.type==='fusion')st.plannedFusions=(st.plannedFusions||0)+1;
 if(pick.follow?.action){
  st.plannedFollowups=(st.plannedFollowups||0)+1;
  st.followupIntent={actor:own,turn:g.turn,kind:pick.follow.kind,
   action:pick.follow.action};
 }
 return pick.action;
}

function play(scene,weightsSeat0,weightsSeat1,branchMode='none',
 lessonPhase=scene.kind,track=true,plannerSeat=-1,plannerGate='always',gainWeight=2.35,sideModes=['candidate','baseline'],profile144={},auditCapture=false){
 const vm=boot({seed:scene.seed+99,x128Mode:'full'});
 vm.exec(controller);
 vm.exec(snapState.toString()+'\n'+boardValue139.toString()+'\n'+resolvedBranch143.toString()+'\n'+lookahead143.toString()+'\n'+tacticalThreat144.toString()+'\n'+followup144.toString()+'\n'+lookahead145.toString()+'\n'+lookahead139.toString()+'\n'+explain146.toString()+'\n'+actorSnapshot146.toString()+'\n'+allowPlanner141.toString());
 vm.exec('var ARCANE143_GAIN_WEIGHT='+JSON.stringify(gainWeight)+';');
 vm.exec('var ARCANE144_PROFILE='+JSON.stringify(profile144)+';');
 vm.exec('var ARCANE144_SIDES='+JSON.stringify(sideModes)+';');
 vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');
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
 'actualFollowups:0,exactFollowups:0,plannedFollowups:0,successfulSupport:0,',
 'roleLegal:{},roleChosen:{},ruleSamples:[],',
 'decisionNotes:[],actualEffects:[],changedPlans:[],',
 'finalRankedTraces:[],traceIntegrityErrors:0,',
 'sameStateComparisons:0,sameStateOverrides:0,',
 'actionDeltas:{normal:[],fusion:[],attack:[],arcaneSoul:[]}};',
 'const original=chooseAiAction,resolve=applyAiAction;',
 'chooseAiAction=function(game,mode){',
 'if(game!==g)return original(game,mode);',
 'if(!game.aiPhase)game.aiPhase="summon";',
 'if(',String(!!scene.boss),'&&game.active===1)return original(game,mode);',
 'const side=game.active,weights=side===0?V138_A:V138_B;',
 'const phase=game.aiPhase,pre=snapState(game);',
 'const legal=(game.pending||game.winner!==null)?[]:choices135(game,tally);',
 'for(const l of new Set(legal.map(x=>x.action.type))){',
 'if(["arcane-soul-extract","arcane-guardian-heal","fusion","attack"].includes(l))',
 'tally.roleLegal[l]=(tally.roleLegal[l]||0)+1;',
 '}',
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
 'if('+String(auditCapture)+'&&side===0&&action&&tally.decisionNotes.length<10){',
 'tally.decisionNotes.push({turn:game.turn,phase,',
 'decision:suggested&&ARCANE144_SIDES[side]==="candidate"?',
 '({basis:"final-planner",trace:tally.finalRankedTraces.at(-1)||null}):',
 '({basis:"linear-score-or-engine-fallback",',
 'detail:explain146(game,action,ranked,pre,weights)}),',
 'followupIntent:tally.followupIntent?.action||null});',
 '}',
 'if(action&&["arcane-soul-extract","arcane-guardian-heal","fusion","attack"].includes(action.type))',
 'tally.roleChosen[action.type]=(tally.roleChosen[action.type]||0)+1;',
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
 'const actor=game.active;',
 'const take='+String(auditCapture)+'&&game===g&&tally.actualEffects.length<18;',
 'const before=take?actorSnapshot146(game,actor):null;',
 'const ok=resolve(game,action);',
 'if(take)tally.actualEffects.push({turn:before.turn,actor,action,',
 'accepted:!!ok,before,after:actorSnapshot146(game,actor)});',
 'if(game===g){if(!ok)invalid++;',
 'if(ok&&tally.followupIntent&&tally.followupIntent.actor===game.active',
 '&&tally.followupIntent.turn===game.turn',
 '&&action.type===tally.followupIntent.kind){',
 'tally.actualFollowups++;',
 'if(tally.followupIntent.action&&',
 'JSON.stringify(action)===JSON.stringify(tally.followupIntent.action))',
 'tally.exactFollowups++;',
 'else if(tally.changedPlans.length<8)tally.changedPlans.push({',
 'planned:tally.followupIntent.action,executed:action,turn:game.turn});',
 'tally.followupIntent=null;',
 '}',
 'if(ok&&["arcane-guardian-heal","arcane-soul-extract"].includes(action.type))',
 'tally.successfulSupport++;',
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
















const reports=[
 ['v142','artifacts/history-v142/report.json','arcane-v142-action-override-audit'],
 ['v143','artifacts/history-v143/report.json','arcane-v143-fusion-value-resolution'],
 ['v144','artifacts/history-v144/report.json','arcane-v144-history-driven-followup-training'],
 ['v145','artifacts/history-v145/report.json','arcane-v145-three-strategy-historical-curriculum'],
 ['v146','artifacts/history-v146/report.json','arcane-v146-verified-mirror-explanations']
].map(([name,path,schema])=>{
 const report=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.equal(report.schema,schema,'Original report mismatch '+name);
 return {name,path,schema};
});
const last=JSON.parse(fs.readFileSync('artifacts/history-v146/report.json','utf8'));
assert.equal(last.qualifiesForPromotion,false);
const previous=last.selectedProfiles;
const groups={offense:['predator','tempo'],defense:['guardian','soul'],
 fusion:['fusion','allrounder','hybrid']};
const group=s=>Object.keys(groups).find(k=>groups[k].includes(s.style));
const newPolicies={
 offense:[
  {...previous.offense,name:'transparent-offense-control'},
  {...previous.offense,name:'transparent-offense-safe',
   tempo:previous.offense.tempo-.15,defense:previous.offense.defense+.22}
 ],
 defense:[
  {...previous.defense,name:'transparent-guardian-control'},
  {...previous.defense,name:'transparent-guardian-drain',
   follow:previous.defense.follow+.23,defense:previous.defense.defense+.13}
 ],
 fusion:[
  {...previous.fusion,name:'transparent-fusion-control'},
  {...previous.fusion,name:'transparent-fusion-reserve',
   material:previous.fusion.material+.055,follow:previous.fusion.follow+.15}
 ]
};
function fight(s,m0,m1,p0,p1,capture=false){
 return play(s,model.weights,model.weights,'none','positions',false,
  2,'summon-only',2.35,[m0,m1],{bySide:[p0,p1],
   oldProfile:previous[group(s)]},capture);
}
function duel(s,p,capture=false){
 const old=previous[group(s)];
 const a=fight(s,'candidate','prior146',p,old,capture);
 const b=fight(s,'prior146','candidate',old,p,capture);
 return {a,b,wins:Number(a.winner===0)+Number(b.winner===1)};
}
const training=[],selected={};
for(const g of Object.keys(groups)){
 const selectedScenes=train.filter(s=>group(s)===g);
 assert.ok(selectedScenes.length>=6);
 for(const profile of newPolicies[g]){
  const row={group:g,name:profile.name,wins:0,games:0};
  for(const s of selectedScenes){
   const x=duel(s,profile);
   row.wins+=x.wins;row.games+=2;
  }
  row.rate=row.wins/row.games;training.push(row);
  console.log('ARCANE_V147_TRAIN '+JSON.stringify(row));
 }
 const ranked=training.filter(x=>x.group===g)
  .sort((a,b)=>b.rate-a.rate||a.name.localeCompare(b.name));
 selected[g]=newPolicies[g].find(x=>x.name===ranked[0].name);
}
const holdByGroup={},feedback=[],control={wins:0,games:0};
for(const g of Object.keys(groups)){
 const result={wins:0,games:0,sameStateChecks:0,overrides:0,
  scoreErrors:0,planned:0,kindMatched:0,exactMatched:0,
  perStyle:{}};
 const scenes=holdout.filter(s=>group(s)===g);
 for(let i=0;i<scenes.length;i++){
  const s=scenes[i],capture=i<3;
  const x=duel(s,selected[g],capture);
  result.wins+=x.wins;result.games+=2;
  for(const match of [x.a,x.b]){
   const t=match.tally;
   result.sameStateChecks+=t.sameStateComparisons||0;
   result.overrides+=t.sameStateOverrides||0;
   result.scoreErrors+=t.traceIntegrityErrors||0;
   result.planned+=t.plannedFollowups||0;
   result.kindMatched+=t.actualFollowups||0;
   result.exactMatched+=t.exactFollowups||0;
   if(capture)feedback.push({
    strategy:g,scenario:{seed:s.seed,tier:s.tier,style:s.style,
     fingerprint:s.deck.fingerprint,starter:s.starter},
    winner:match.winner,verifiedRankings:t.finalRankedTraces,
    realActionDeltas:t.actualEffects,
    notes:t.decisionNotes,planMismatches:t.changedPlans});
  }
  const item=result.perStyle[s.style]||{wins:0,games:0};
  item.wins+=x.wins;item.games+=2;
  result.perStyle[s.style]=item;
  const y=fight(s,'candidate','champion',selected[g],{},false);
  const z=fight(s,'champion','candidate',{},selected[g],false);
  control.wins+=Number(y.winner===0)+Number(z.winner===1);
  control.games+=2;
 }
 holdByGroup[g]=result;
}
const bosses={candidate:0,prior146:0,champion:0,games:0,byTier:{}};
for(const s of holdout.filter((_,i)=>i%2===0)){
 const p=selected[group(s)],q=previous[group(s)],sBoss={...s,boss:true};
 const x=play(sBoss,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['candidate','champion'],{bySide:[p,{}]},false);
 const y=play(sBoss,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['prior146','champion'],{bySide:[q,{}]},false);
 const z=play(sBoss,model.weights,model.weights,'none','positions',false,
  -1,'none',2.35,['champion','champion'],{},false);
 const rec=bosses.byTier[s.tier]||
  {candidate:0,prior146:0,champion:0,games:0};
 rec.games++;bosses.games++;
 for(const [name,a] of [['candidate',x],['prior146',y],['champion',z]]){
  const win=Number(a.winner===0);bosses[name]+=win;rec[name]+=win;
 }
 bosses.byTier[s.tier]=rec;
}
const specialists=[];
for(const expert of weightSets.slice(2)){
 let wins=0,games=0;
 for(const s of holdout.slice(0,config.league)){
  const p=selected[group(s)];
  const a=play(s,model.weights,expert.weights,'none','positions',false,
   0,'summon-only',2.35,['candidate','champion'],{bySide:[p,{}]},false);
  const b=play(s,expert.weights,model.weights,'none','positions',false,
   1,'summon-only',2.35,['champion','candidate'],{bySide:[{},p]},false);
  wins+=Number(a.winner===0)+Number(b.winner===1);games+=2;
 }
 specialists.push({expert:expert.name,wins,games,rate:wins/games});
}
const agg=Object.values(holdByGroup),sum={
 wins:agg.reduce((n,x)=>n+x.wins,0),
 games:agg.reduce((n,x)=>n+x.games,0),
 checks:agg.reduce((n,x)=>n+x.sameStateChecks,0),
 overrides:agg.reduce((n,x)=>n+x.overrides,0),
 error:agg.reduce((n,x)=>n+x.scoreErrors,0),
 planned:agg.reduce((n,x)=>n+x.planned,0),
 kind:agg.reduce((n,x)=>n+x.kindMatched,0),
 exact:agg.reduce((n,x)=>n+x.exactMatched,0)
};
assert.equal(sum.error,0,'Final score components are not reconciled');
const eligible=sum.wins/sum.games>=.53&&control.wins/control.games>=.56&&
 bosses.candidate>=bosses.champion&&
 specialists.every(x=>x.rate>=.45)&&
 agg.every(x=>x.wins/x.games>=.45)&&sum.overrides>0;
const report={
 schema:'arcane-v147-final-score-transparent-mirrors',
 status:'completed',headSha:process.env.GITHUB_SHA||'unknown',
 history:reports,training,selectedProfiles:selected,
 mirrorConstraints:{
 sameDeckAndFusionList:true,initialSeedMatched:true,bothPolicySeats:true,
 newHoldoutDeckFingerprints:true,
 oldReportsUsedForLessonSelectionOnly:true,
 futureRngMayDivergeByAction:true
 },independent:holdByGroup,overall:sum,
 vsChampion:control,bosses,specialists,
 proof:{
 finalScoreComponentsCapturedInsideLivePlanner:true,
 scoreReconciliationErrors:sum.error,
 explanationsAreScoresNotThoughts:true,
 previousProfileUsesSameSimulatedActionOutcomes:true,
 allTracesOnSampledNewHoldoutMatches:true,
 fallbackExplanationsLabeledSeparately:true,
 realEngineActionChangesRecordedSeparately:true,
 completeTwoTurnPlanning:false
 },
 promotionEligible:eligible,productionIntegrated:false,
 limits:[
  'Same-state old-profile comparison recomputes scores on shared sampled branch outcomes, not independent future RNG',
  'Exact matches reflect action signatures, not guaranteed correct long-term strategy',
  'Player-earned inventory and hidden opponent draws are not simulated',
  'The frozen production AI and champion weights were not changed'
 ]};
fs.mkdirSync('artifacts/v147',{recursive:true});
fs.writeFileSync('artifacts/v147/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v147/decision-evidence.json',JSON.stringify({
 schema:'arcane-v147-trustworthy-score-feedback',examples:feedback,
 limitation:'The explanation is the exact active planner formula and not subjective reasoning'
},null,2)+'\n');
fs.writeFileSync('artifacts/v147/candidate.json',JSON.stringify({
 schema:'arcane-v147-candidate',weights:model.weights,
 profiles:selected,promotionEligible:eligible,productionIntegrated:false
},null,2)+'\n');
console.log('ARCANE_V147_SUMMARY '+JSON.stringify({
 training,vs146:{wins:sum.wins,games:sum.games},
 vsChampion:control,bosses,specialists,
 explanations:{samples:feedback.length,checks:sum.checks,
  overrides:sum.overrides,scoreErrors:sum.error,
  planned:sum.planned,kind:sum.kind,exact:sum.exact},
 eligible,productionIntegrated:false
}));
