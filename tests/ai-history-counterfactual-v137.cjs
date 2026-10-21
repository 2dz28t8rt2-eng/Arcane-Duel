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
const tests=Number(process.env.ARCANE_V137_CASES||12);
assert.ok(Number.isInteger(tests)&&tests>=2&&tests<=24);
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
 const f=locate('artifacts/history','ai-v136-training-report.json');
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
const scenes=Array.from({length:tests},(_,i)=>{
 const tier=[7,9,10][i%3],style=styles[Math.floor(i/3)%styles.length],
  variant=i%2?'specialist':'starter-heavy';
 const s={tier,style,variant,deckSeed:7900+i*83,seed:937000+i*313,
   starter:i%2,kind:i%2?'attack':'summon'};
 return {...s,deck:make(s)};
});
function simulate(scene,mode,firstPolicy,secondPolicy,forcedPhase=null){
 const runtime=boot({seed:scene.seed+99,x128Mode:'full'});
 runtime.exec(controller);
 runtime.exec('var LEG137_POL0='+JSON.stringify(firstPolicy)+';'+
  'var LEG137_POL1='+JSON.stringify(secondPolicy)+';');
 const opt={id:'v137-'+scene.seed,mode:'pve',context:'free',
  opponentId:0,difficulty:'hard',
  seed:scene.seed,starter:scene.starter,
  deck:scene.deck.deck,fusionDeck:scene.deck.fusionDeck,
  enemy:{deck:scene.deck.deck,fusionDeck:scene.deck.fusionDeck,
   power:1,flatBonus:0,enhancements:{}}};
 const code=[
 '(()=>{profile=freshProfile();profile.guideSeen=true;',
 'const g=createGame(',JSON.stringify(opt),');',
 'g.maxLP=10000;g.players.forEach(p=>p.lp=10000);',
 'let branch=null,done=false;',
 'const stat={choices:0,bySide:[0,0],support:0,attacks:0,fusions:0};',
 'const oldChoice=chooseAiAction,oldApply=applyAiAction;',
 'const before=(game)=>{const me=game.players[game.active],foe=game.players[1-game.active];',
 'const card=c=>c?{id:c.id,atk:dataOf(c).atk,def:dataOf(c).def,lv:dataOf(c).level,',
 'mode:c.mode,attacked:!!c.attacked}:null;',
 'return {turn:game.turn,active:game.active,phase:game.aiPhase,',
 'lp:[me.lp,foe.lp],shield:[me.shield,foe.shield],',
 'ownHand:me.hand.map(c=>c.id),',
 'ownField:me.field.map(card),enemyPublicField:foe.field.map(card)};};',
 'chooseAiAction=function(game,policy){',
 'if(game!==g)return oldChoice(game,policy);',
 'if(!game.aiPhase)game.aiPhase="summon";',
 'const w=game.active===0?LEG137_POL0:LEG137_POL1;',
 'const shouldBranch=!done&&game.active===0&&game.aiPhase===',
   JSON.stringify(forcedPhase||scene.kind),
   '&&!game.pending&&(game.aiPhase!=="attack"||game.turn>1);',
 'if(shouldBranch){',
 'const choices=choices135(game,stat).filter(c=>[',
   '"normal","fusion","attack","end"].includes(c.action.type));',
 'const rank=choices.map(c=>({c,s:c.base+c.features.reduce((n,x,i)=>n+x*w[i],0)}))',
   '.sort((a,b)=>b.s-a.s);',
 'if(rank.length>=2){',
 'const top=rank[0],alternative=rank.find(e=>',
  'e.c.action.type!==top.c.action.type)||rank[1];',
 'const obs=before(game);',
 'branch={observation:obs,top:{action:top.c.action,score:+top.s.toFixed(5)},',
  'alternative:{action:alternative.c.action,score:+alternative.s.toFixed(5)},',
  'options:choices.length};',
 'done=true;',
 'if(',JSON.stringify(mode),'==="alternate")return alternative.c.action;',
 'return top.c.action;',
 '}',
 '}',
 'return decision135(game,w,false,null,stat)||oldChoice(game,policy);};',
 'let invalid=0;',
 'applyAiAction=function(game,action){const ok=oldApply(game,action);',
 'if(game===g&&!ok)invalid++;return ok;};',
 'try{simulateGame(g,"balanced","balanced");}finally{chooseAiAction=oldChoice;applyAiAction=oldApply;}',
 'return {winner:g.winner,turns:g.turn,',
 'lp:g.players.map(p=>p.lp),shield:g.players.map(p=>p.shield),',
 'branch,invalid,stats:stat};',
 '})()'
 ].join('');
 const r=runtime.run(code,240000);
 assert.ok([0,1].includes(r.winner));
 assert.equal(r.invalid,0,'Engine rejected supposedly legal action');
 return r;
}
const counterfactuals=[],missingBranch=[];
for(const scene of scenes){
 const original=simulate(scene,'baseline',model.weights,model.weights);
 const alternative=simulate(scene,'alternate',model.weights,model.weights);
 if(!original.branch||!alternative.branch){
  missingBranch.push({scene:scene.seed,phase:scene.kind,style:scene.style});
  continue;
 }
 assert.deepEqual(original.branch.observation,alternative.branch.observation,
  'Different states at paired branch point');
 assert.deepEqual(original.branch.top,alternative.branch.top,
  'Different original actions despite same starting state');
 const deltaLP=(alternative.lp[0]-original.lp[0])-
  (alternative.lp[1]-original.lp[1]);
 const outcome=Number(alternative.winner===0)-Number(original.winner===0);
 counterfactuals.push({seed:scene.seed,deckFingerprint:scene.deck.fingerprint,
  tier:scene.tier,style:scene.style,variant:scene.variant,
  startingSeat:scene.starter,
  phase:scene.kind,observation:original.branch.observation,
  alternativeCount:original.branch.options,
  originalAction:original.branch.top,otherLegalAction:original.branch.alternative,
  originalOutcome:{winner:original.winner,turns:original.turns,lp:original.lp},
  alternativeOutcome:{winner:alternative.winner,turns:alternative.turns,lp:alternative.lp},
  deltaPlayer0Victory:outcome,
  deltaNetLpForPlayer0:deltaLP,
  inference:'Matched observed starting state; one continuation per branch. Does NOT prove universal superiority.'});
 console.log('ARCANE_V137_COUNTERFACTUAL '+JSON.stringify({
  tier:scene.tier,style:scene.style,phase:scene.kind,
  original:original.branch.top.action.type,alternative:original.branch.alternative.action.type,
  outcome,netLP:deltaLP}));
}
assert.ok(counterfactuals.length>=Math.floor(tests*.5),
 'Not enough actual paired legal alternatives were generated');
const leagueResults=[];
for(let n=1;n<weightSets.length;n++){
 const w=weightSets[n];
 const duels=[];
 for(const scene of scenes.filter((_,i)=>i%2===0).slice(0,6)){
  const s1=simulate(scene,'normal',w.weights,model.weights,'positions');
  const s2=simulate(scene,'normal',model.weights,w.weights,'positions');
  duels.push({tier:scene.tier,style:scene.style,seat0Win:s1.winner===0,
   seat1Win:s2.winner===1,
   game1Winner:s1.winner,game2Winner:s2.winner});
 }
 const wins=duels.reduce((n,g)=>n+Number(g.seat0Win)+Number(g.seat1Win),0);
 leagueResults.push({challenger:w.name,opponent:'frozen-champion-v135',
  wins,games:duels.length*2,winRate:wins/(duels.length*2),
  equalDeckSource:true,alternatePolicySeats:true,
  evidence:'Small pilot, not a promotion-grade evaluation',
  cases:duels});
 console.log('ARCANE_V137_LEAGUE '+JSON.stringify({
  challenger:w.name,wins,games:duels.length*2}));
}
const stats={
 comparisons:counterfactuals.length*2,
 pairedCounterfactualStates:counterfactuals.length,
 originalWins:counterfactuals.filter(x=>x.originalOutcome.winner===0).length,
 alternateWins:counterfactuals.filter(x=>x.alternativeOutcome.winner===0).length,
 alternateBetterInWin:counterfactuals.filter(x=>x.deltaPlayer0Victory>0).length,
 alternateWorseInWin:counterfactuals.filter(x=>x.deltaPlayer0Victory<0).length,
 equalWin:counterfactuals.filter(x=>x.deltaPlayer0Victory===0).length,
 missingBranch:missingBranch.length
};
const report={
 schema:'arcane-v137-history-and-counterfactual',
 status:'completed',purpose:'historical failure analysis and actual-action counterfactual curriculum pilot',
 gameEngineReal:true,rulesUnchanged:true,
 originalHistoricStatesReconstructed:false,
 history:{
  startingTrainingGames:model.gamesTrained,
  priorReplayExamples:model.replay.length,
  pastReports:histReports,findings:historicalFindings
 },
 curriculum:{
  measuredLessons:['legal-hand-summon','legal-hand-fusion','attack-target-selection'],
  lessonsPlannedNotYetAssessed:['field-fusion','guardian','soul-drain','counterstrike',
   'allrounder','resonator','poker-bonuses','lv1-quest','decay-lookahead',
   'ace-access','deckbuilding-economy'],
  realActionPairing:stats,
  cases:counterfactuals,unmatchedCases:missingBranch
 },
 league:{frozenChampion:'models/ai-selfplay-v136.json',
  challengerSources:weightSets.map(x=>x.name),results:leagueResults},
 policyUpdated:false,productionIntegrated:false,
 conclusions:[
  'Historical aggregate numbers indicate WHERE training underperforms, not WHICH past specific move would have won.',
  'Fresh experiments reconstruct identical pre-branch visible state and evaluate two legal actions through the real engine.',
  'After a different action the RNG consumption can diverge; require many seeds before generalized or causal claims.',
  'League pilot results are not used to modify model weights or promote any candidate.',
  'Learning from old individual choices requires future decision/state logging; historic gradients cannot recover it.'
 ]
};
fs.mkdirSync('artifacts/v137',{recursive:true});
fs.writeFileSync('artifacts/v137/history-and-counterfactual.json',
 JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V137_SUMMARY '+JSON.stringify({
 oldTrainingGames:model.gamesTrained,oldReplay:model.replay.length,
 historicalGenerations:histReports.length,
 pairs:stats.pairedCounterfactualStates,better:stats.alternateBetterInWin,
 worse:stats.alternateWorseInWin,unchanged:stats.equalWin,
 leagueMatches:leagueResults.reduce((n,x)=>n+x.games,0),
 productionIntegrated:false,policyUpdated:false}));
