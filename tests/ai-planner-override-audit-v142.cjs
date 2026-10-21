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
const tests=Number(process.env.ARCANE_V142_TRAIN||70);
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
 holdout:Number(process.env.ARCANE_V142_HOLDOUT||84),
 league:Number(process.env.ARCANE_V142_LEAGUE||12)
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
 const seed=(part==='train'?1420000:3420000)+i*173+tier*13;
 const s={tier,style,variant,seed,starter:i%2,
  kind:i%2?'attacks':'summon'};
 // Benchmark generator accepts 0–9999. Re-seed on identical deck
 // fingerprints, keeping train and holdout disjoint by construction.
 for(let attempt=0;attempt<500;attempt++){
  s.deckSeed=((part==='train'?4100:9100)+i*89+attempt*79)%10000;
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
 'let branch=null,found=false,invalid=0,records=[],pending=null,appliedSnapshot=null;',
 'const tally={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,',
 'available:{},chosen:{},rolePresence:{},plannerEligible:0,',
 'matchedOffers:{},matchedChoices:{},unmatchedChoices:{},',
 'plannerCompared:0,plannerSame:0,plannerDifferent:0,',
 'plannerDifferByPhase:{},plannerDifferKinds:{},',
 'plannerExamples:[],plannerByTurn:{},',
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
 'const enabled=',String(plannerSeat),'===side&&',
 'allowPlanner141(game,',JSON.stringify(plannerGate),')',
 '&&!game.pending&&game.winner===null;',
 'if(!action&&enabled){',
 'const ref=JSON.parse(JSON.stringify(game));',
 'baseline=decision135(ref,weights,false,null,',
 '{choices:0,bySide:[0,0],support:0,fusions:0,attacks:0})',
 '||original(ref,mode);',
 'suggested=lookahead139(game,weights,tally);',
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






const previous='artifacts/history-v141/report.json';
const oldReport=fs.existsSync(previous)?JSON.parse(fs.readFileSync(previous,'utf8')):null;
if(oldReport)assert.equal(oldReport.schema,'arcane-v141-selective-planner-training-report');
const arms=['always','summon-only','attack-only','defense-threat','early-attack'];
const training=[],frozenWeights=[...model.weights];
function combineCounts(dest,src){for(const [k,v] of Object.entries(src||{}))
 dest[k]=(dest[k]||0)+v;}
function initTelemetry(){return {compared:0,same:0,different:0,
 byPhase:{},byKind:{},byTurn:{},examples:[],
 offers:{},chosen:{},unmatched:{},rolePresence:{},
 deltas:{normal:[],fusion:[],attack:[],arcaneSoul:[]}};}
function addTelemetry(to,part){
 to.compared+=part.plannerCompared||0;
 to.same+=part.plannerSame||0;to.different+=part.plannerDifferent||0;
 for(const [key,field] of [['byPhase','plannerDifferByPhase'],
 ['byKind','plannerDifferKinds'],['byTurn','plannerByTurn'],
 ['offers','matchedOffers'],['chosen','matchedChoices'],
 ['unmatched','unmatchedChoices'],['rolePresence','rolePresence']])
 combineCounts(to[key],part[field]);
 for(const e of part.plannerExamples||[])if(to.examples.length<20)to.examples.push(e);
 for(const [k,vs] of Object.entries(part.actionDeltas||{}))
 if(to.deltas[k])to.deltas[k].push(...vs.slice(0,3));
}
for(const gate of arms){
 const telemetry=initTelemetry(),samples=[],winSummary={wins:0,duels:0,
 byTier:{},plannerCalls:0};
 for(const s of train){
  const a=play(s,frozenWeights,frozenWeights,'none','positions',false,0,gate);
  const b=play(s,frozenWeights,frozenWeights,'none','positions',false,1,gate);
  const wins=Number(a.winner===0)+Number(b.winner===1);
  winSummary.wins+=wins;winSummary.duels+=2;
  winSummary.plannerCalls+=(a.tally.plannerCalls||0)+(b.tally.plannerCalls||0);
  addTelemetry(telemetry,a.tally);addTelemetry(telemetry,b.tally);
  const t=s.tier; if(!winSummary.byTier[t])winSummary.byTier[t]={wins:0,duels:0};
  winSummary.byTier[t].wins+=wins;winSummary.byTier[t].duels+=2;
  if(samples.length<8&&(a.tally.plannerDifferent||b.tally.plannerDifferent))
   samples.push({seed:s.seed,style:s.style,tier:s.tier,
    outcome:[a.winner,b.winner],
    changed:a.tally.plannerDifferent+b.tally.plannerDifferent});
 }
 assert.equal(telemetry.compared,telemetry.same+telemetry.different);
 training.push({gate,...winSummary,telemetry,examples:samples,
  overrideRate:telemetry.compared?telemetry.different/telemetry.compared:0,
  winRate:winSummary.wins/winSummary.duels});
 console.log('ARCANE_V142_TRAIN '+JSON.stringify({
  gate,wins:winSummary.wins,duels:winSummary.duels,
  examined:telemetry.compared,overrides:telemetry.different,
  byPhase:telemetry.byPhase,winRate:winSummary.wins/winSummary.duels}));
}
// Select ONLY using train. A plan that never differs from baseline cannot
// justify extra evaluation cost or become the next champion.
const qualified=training.filter(t=>t.duels>=40&&t.telemetry.different>=3&&
 t.winRate>=.53).sort((a,b)=>b.winRate-a.winRate||
 b.telemetry.different-a.telemetry.different);
const selected=qualified[0]?.gate||'none';
const hold={gate:selected,baselineWeightsIdentical:true,
 chosenOnTrainOnly:true,mirror:{wins:0,games:0,byTier:{}},
 bosses:{candidate:0,champion:0,games:0,byTier:{}},
 league:[],mechanics:initTelemetry()};
for(const s of holdout){
 const a=play(s,frozenWeights,frozenWeights,'none','positions',false,0,selected);
 const b=play(s,frozenWeights,frozenWeights,'none','positions',false,1,selected);
 const wins=Number(a.winner===0)+Number(b.winner===1);
 hold.mirror.wins+=wins;hold.mirror.games+=2;
 if(!hold.mirror.byTier[s.tier])hold.mirror.byTier[s.tier]={wins:0,games:0};
 hold.mirror.byTier[s.tier].wins+=wins;hold.mirror.byTier[s.tier].games+=2;
 addTelemetry(hold.mechanics,a.tally);addTelemetry(hold.mechanics,b.tally);
}
for(const s of holdout.filter((_,i)=>i%2===0)){
 const scene={...s,boss:true};
 const a=play(scene,frozenWeights,frozenWeights,'none','positions',false,0,selected);
 const b=play(scene,frozenWeights,frozenWeights,'none','positions',false,-1,'none');
 const ta=Number(a.winner===0),tb=Number(b.winner===0);
 hold.bosses.candidate+=ta;hold.bosses.champion+=tb;hold.bosses.games++;
 if(!hold.bosses.byTier[s.tier])hold.bosses.byTier[s.tier]={candidate:0,champion:0,games:0};
 hold.bosses.byTier[s.tier].candidate+=ta;
 hold.bosses.byTier[s.tier].champion+=tb;hold.bosses.byTier[s.tier].games++;
}
for(const pol of weightSets.slice(2)){
 let wins=0,games=0;
 for(const s of holdout.slice(0,config.league)){
  const a=play(s,frozenWeights,pol.weights,'none','positions',false,0,selected);
  const b=play(s,pol.weights,frozenWeights,'none','positions',false,1,selected);
  wins+=Number(a.winner===0)+Number(b.winner===1);games+=2;
 }
 hold.league.push({name:pol.name,wins,games,winRate:wins/games});
}
const accepted=selected!=='none'&&hold.mechanics.different>=3&&
 hold.mirror.wins/hold.mirror.games>=.56&&
 hold.bosses.candidate>=hold.bosses.champion&&
 hold.league.every(l=>l.winRate>=.45);
const report={
 schema:'arcane-v142-action-override-audit',status:'completed',
 date:'2026-10-21',ruleCommit:process.env.GITHUB_SHA||'unknown',
 priorV141:oldReport?{
  chosenGate:oldReport.chosenGate,
  previousRunStatus:oldReport.status,
  conclusion:'No gate passed last generation; lack of planner actual action-change visibility'
 }:null,
 frozenChampion:'models/ai-selfplay-v136.json',
 trainedOn:train.length,trainScenarios:tests,
 independentHoldout:holdout.length,
 gateTraining:training,
 selectedGate:selected,
 holdout:hold,
 promotionEligible:accepted,
 productionIntegrated:false,
 metricsDefinition:{
  plannerCompared:'Planner returned a candidate on eligible decision; baseline evaluated from a game clone',
  plannerDifferent:'Candidate differs by full action JSON from cloned baseline action',
  matchedOffers:'Legal option families in the same observed decision before chosen action, actor 0 only',
  matchedChoices:'Selected action explicitly included among the same legal options, actor 0 only',
  unmatchedChoices:'Chosen action not present in initial legal set (includes fallbacks, phase transitions); never divide it by offers',
  boardDeltas:'Immediate real-engine after minus before board heuristic, not terminal causal benefit',
  averageRates:'Planner override ratios count all compared decision points; many are correlated within a duel'
 },
 roadmap:[
  'If zero or negligible actual overrides, rework planner utility and action selection, not increase episodes blindly',
  'If overrides occur, stratify improvements/degradations by phase and exact action type before extra curriculum fitting',
  'Implement same-decision offers versus action audit for soul drain, healer, fusion and ACE',
  'Sample multiple continuation seeds only after identifying real alternate action choices',
  'Never promote solely on a 50%-level small mirror edge, and never leak opponent private hand into planning'
 ],
 limitations:[
  'No 2-3 full turn forward search; legacy planner considers at most two own actions in a turn',
  'Constructed, source-legal decks are not verified earned career inventories',
  'Changing action can consume different future RNG, limiting causal claims',
  'Recorded normal / fusion / attack post-action deltas cover only a sample, not every full chronological step',
  'One side opportunity counters exclude actions from fallback and the opposing seat for clearer matched denominators'
 ]};
fs.mkdirSync('artifacts/v142',{recursive:true});
fs.writeFileSync('artifacts/v142/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v142/selector.json',JSON.stringify({
 schema:'arcane-v142-selector',startingWeights:frozenWeights,
 learnedGate:selected,trainOnly:true,
 promotionEligible:accepted,productionIntegrated:false
},null,2)+'\n');
console.log('ARCANE_V142_SUMMARY '+JSON.stringify({
 train:training.map(x=>({gate:x.gate,wins:x.wins,duels:x.duels,
  examined:x.telemetry.compared,changed:x.telemetry.different})),
 gate:selected,holdout:{wins:hold.mirror.wins,games:hold.mirror.games,
 examined:hold.mechanics.compared,changed:hold.mechanics.different},
 bosses:{candidate:hold.bosses.candidate,champion:hold.bosses.champion,games:hold.bosses.games},
 specialist:hold.league.map(x=>({n:x.name,wins:x.wins,duels:x.games})),
 accepted,productionIntegrated:false}));
