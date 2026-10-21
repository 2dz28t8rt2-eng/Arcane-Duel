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
const tests=Number(process.env.ARCANE_V138_CASES||72);
assert.ok(Number.isInteger(tests)&&tests>=2&&tests<=180);
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
 holdout:Number(process.env.ARCANE_V138_HOLDOUT||24),
 league:Number(process.env.ARCANE_V138_LEAGUE||10)
};
assert.ok(config.holdout>=6&&config.holdout<=70);
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
 const deckSeed=(part==='train'?7100:871000)+i*89;
 const seed=(part==='train'?1380000:2838000)+i*173+tier*13;
 const s={tier,style,variant,deckSeed,seed,
  starter:i%2,kind:i%2?'attacks':'summon'};
 const deck=make(s);
 assert.ok(!seen.has(deck.fingerprint),'Train/holdout deck collision');
 seen.add(deck.fingerprint);
 return {...s,deck};
}
const train=Array.from({length:tests},(_,i)=>buildScene(i));
const holdout=Array.from({length:config.holdout},(_,i)=>buildScene(i,'holdout'));
const tuning={minWeight:-2.5,maxWeight:2.5,rate:.22,marginCap:4500};
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
function play(scene,weightsSeat0,weightsSeat1,branchMode='none',
 lessonPhase=scene.kind,track=true){
 const vm=boot({seed:scene.seed+99,x128Mode:'full'});
 vm.exec(controller);
 vm.exec(snapState.toString());
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
 'if(!action)action=decision135(game,weights,false,null,tally)||original(game,mode);',
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
const candidate=[...model.weights];
const pairs=[],missing=[],trainSummary={winsChanged:0,better:0,worse:0,
 tied:0,adjusted:0,summon:0,attacks:0,totalDecisionsLogged:0};
function compact(r){return {winner:r.winner,turn:r.turn,lp:r.lp};}
function scoreDelta(a,b){
 const win=Number(b.winner===0)-Number(a.winner===0);
 const d=((b.lp[0]-b.lp[1])-(a.lp[0]-a.lp[1]));
 const marginal=Math.max(-1,Math.min(1,d/tuning.marginCap));
 return {victory:win,lp:d,learningTarget:Math.max(-1.5,Math.min(1.5,win+.16*marginal))};
}
function learn(row){
 const y=row.effect.learningTarget;
 if(Math.abs(y)<.025)return false;
 // B-alternative better -> score it above A, and vice versa.
 const featuresA=row.actions.base.features,featuresB=row.actions.alternative.features;
 assert.equal(featuresA.length,15);
 assert.equal(featuresB.length,15);
 const oldMargin=featuresB.reduce((n,v,i)=>n+(v-featuresA[i])*candidate[i],0);
 const sign=Math.sign(y);
 if(sign*oldMargin>0.6)return false;
 const step=tuning.rate*y/(1+Math.abs(oldMargin));
 for(let k=0;k<15;k++){
  const grad=featuresB[k]-featuresA[k];
  candidate[k]=Math.max(tuning.minWeight,
   Math.min(tuning.maxWeight,candidate[k]+step*grad));
 }
 return true;
}
for(const s of train){
 const a=play(s,model.weights,model.weights,'top');
 const b=play(s,model.weights,model.weights,'alternate');
 if(!a.branch||!b.branch){
  missing.push({seed:s.seed,phase:s.kind,style:s.style});
  continue;
 }
 assert.deepEqual(a.branch.before,b.branch.before,'Not identical choice state');
 assert.deepEqual(a.branch.top,b.branch.top,'Rank mismatch between paired histories');
 const delta=scoreDelta(a,b);
 const item={
  seed:s.seed,deckFingerprint:s.deck.fingerprint,deck:s.deck.deck,
  fusionDeck:s.deck.fusionDeck,starter:s.starter,style:s.style,tier:s.tier,
  targetLesson:s.kind,
  origin:'new-v138-match-replay',reproducibleMatchSeed:true,
  before:a.branch.before,
  actions:{base:a.branch.top,alternative:a.branch.alternative},
  legalAlternativeCount:a.branch.options,
  original:compact(a),alternate:compact(b),effect:delta,
  firstActionTraceA:a.records.slice(0,12),firstActionTraceB:b.records.slice(0,12),
  actionTraceSampleLimited:true,
  inference:'One paired actual-engine continuation is suggestive, not causal certainty.'};
 pairs.push(item);
 trainSummary.totalDecisionsLogged+=a.records.length+b.records.length;
 trainSummary[s.kind]++;
 if(delta.victory>0)trainSummary.better++;
 else if(delta.victory<0)trainSummary.worse++;
 else trainSummary.tied++;
 trainSummary.winsChanged+=Math.abs(delta.victory);
 if(learn(item))trainSummary.adjusted++;
 if(pairs.length%12===0)console.log('ARCANE_V138_CURRICULUM '+
  JSON.stringify({paired:pairs.length,updated:trainSummary.adjusted,
   alternateBetter:trainSummary.better,alternateWorse:trainSummary.worse,
   sameWinner:trainSummary.tied}));
}
assert.ok(pairs.length>=Math.floor(tests*.80),
 'Could not capture sufficient legal decision pairs');
assert.ok(trainSummary.totalDecisionsLogged>0);
const frozenCandidate=[...candidate]; // strictly freeze BEFORE independent evaluation
const evalDetails=[],holdoutStats={mirrorWins:0,mirrorMatches:0,
 bossWinsCandidate:0,bossWinsChampion:0,bossMatches:0};
for(const s of holdout){
 const player0=play(s,frozenCandidate,model.weights,'none','positions',false);
 const player1=play(s,model.weights,frozenCandidate,'none','positions',false);
 const wins=Number(player0.winner===0)+Number(player1.winner===1);
 holdoutStats.mirrorWins+=wins;
 holdoutStats.mirrorMatches+=2;
 evalDetails.push({type:'mirrored-holdout',seed:s.seed,style:s.style,tier:s.tier,
  starter:s.starter,candidateWins:wins,duels:2,
  rawOutcomes:[player0.winner,player1.winner]});
}
const bossCases=holdout.filter((_,i)=>i%2===0);
for(const s of bossCases){
 const boss={...s,boss:true};
 const a=play(boss,frozenCandidate,model.weights,'none','positions',false);
 const b=play(boss,model.weights,model.weights,'none','positions',false);
 holdoutStats.bossWinsCandidate+=Number(a.winner===0);
 holdoutStats.bossWinsChampion+=Number(b.winner===0);
 holdoutStats.bossMatches++;
 evalDetails.push({type:'boss-holdout',seed:s.seed,tier:s.tier,
  style:s.style,candidateWin:a.winner===0,championWin:b.winner===0,
  candidateLP:a.lp,championLP:b.lp});
}
const pilotLeague=[];
for(const pol of weightSets.slice(2)){
 let wins=0,total=0;
 for(const s of holdout.slice(0,config.league)){
  const a=play(s,frozenCandidate,pol.weights,'none','positions',false);
  const b=play(s,pol.weights,frozenCandidate,'none','positions',false);
  wins+=Number(a.winner===0)+Number(b.winner===1);
  total+=2;
 }
 pilotLeague.push({opponent:pol.name,wins,duels:total,
  winRate:+(wins/total).toFixed(4)});
}
const mirrorRate=holdoutStats.mirrorWins/holdoutStats.mirrorMatches;
const valid=mirrorRate>=.56
 &&holdoutStats.mirrorMatches>=36
 &&holdoutStats.bossWinsCandidate>=holdoutStats.bossWinsChampion
 &&pilotLeague.every(x=>x.winRate>=.45);
const promotionCandidate=valid;
// Save separate candidate and raw replay (do NOT modify old champion model).
const next={
 schema:'arcane-v138-curriculum-counterfactual-candidate',
 priorSource:'models/ai-selfplay-v136.json',
 priorGamesTrained:model.gamesTrained,
 trainedOnPairs:pairs.length,trainingWeightUpdates:trainSummary.adjusted,
 weightsBefore:model.weights,weightsAfter:frozenCandidate,
 selectedOnTrainOnly:true,holdoutUsedForFitting:false,
 promotionCandidate,productionIntegrated:false,
 nextRequired:'independent multi-seed confirmation and playable NPC-side adapter'
};
const report={
 schema:'arcane-v138-curriculum-report',status:'completed',
 method:'engine-resolved paired action continuation + train-only contrastive weighted choice update',
 previousTrainingGames:model.gamesTrained,
 previousHistoricalCases:h137?.curriculum?.realActionPairing?.pairedCounterfactualStates??null,
 historicalLimit:'Old gradients without full state cannot be replayed; historical records inform lesson priorities only.',
 observedLossesFrom136:histReports.map(r=>({
  generation:r.generation,bossXWins:r.bossX.currentWins,duels:r.bossX.matchedDuels,
  championAccepted:r.storedCandidate})),
 mechanismCoverage:{trained:['hand-normal','hand-fusion','attack-vs-end','attack-target'],
  notYetTrained:['field-fusion','poker-bonus','resonator','allrounder-resonance',
    'level1-quest','gear-and-economy','multi-turn-search']},
 sourceLegalDecksOnly:true,earnedCareerSimulated:false,
 originalRuleEngine:true,legalActionAssertionPassed:true,
 replayAudit:{capturedTrainingPairs:pairs.length,
  loggedStepRecords:trainSummary.totalDecisionsLogged,
  completeChronologicalTrace:false,
  limitedSamplesPerMatch:72,
  reproductionIngredientsIncluded:true,
  observationExcludesOpponentPrivateHand:true,
  trainingAndHoldoutDecksDisjoint:true},
 training:trainSummary,holdout:holdoutStats,
 holdoutWinRate:+mirrorRate.toFixed(4),
 bossWinRateCandidate:+(holdoutStats.bossWinsCandidate/holdoutStats.bossMatches).toFixed(4),
 bossWinRateChampion:+(holdoutStats.bossWinsChampion/holdoutStats.bossMatches).toFixed(4),
 specialistLeague:pilotLeague,
 acceptedForPromotion:promotionCandidate,
 productionIntegrated:false,trainingModelSavedWithoutChangingChampion:true,
 holdoutExamples:evalDetails.slice(0,60),missingBranches:missing,
 caveats:[
  'Effects of changing actions depend on subsequent RNG consumption and opponents; one branch pair is not causal identification.',
  'Terminal outcomes and LP margins are only weak signals for deciding which initial move was best.',
  'Only replay samples up to 72 decisions per match are kept, not every action from all historical runs.',
  'This is a 15-weight linear policy and is not general mastery or full reinforcement learning.',
  'Training/holdout never share deck fingerprints; only independent holdouts can support a promotion candidate.',
  'PvE perk asymmetries persist even with mirrored source-legal decks.',
  'No playable NPC AI or progression system is changed.'
 ]};
fs.mkdirSync('artifacts/v138',{recursive:true});
fs.writeFileSync('artifacts/v138/decision-replay.json',JSON.stringify({
 schema:'arcane-v138-reproducible-decision-pairs',sourceRun:'GitHub Actions',
 rulesCommit:process.env.GITHUB_SHA||'unknown',items:pairs,
 remarks:'Includes own hand but not opponent hidden hand; do not expose entire state to real-time opponents.'
},null,2)+'\n');
fs.writeFileSync('artifacts/v138/curriculum-report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v138/candidate-model.json',JSON.stringify(next,null,2)+'\n');
console.log('ARCANE_V138_SUMMARY '+JSON.stringify({
 cases:tests,actualPairs:pairs.length,trainWeightUpdates:trainSummary.adjusted,
 candidateMirrorWins:holdoutStats.mirrorWins,
 mirroredDuels:holdoutStats.mirrorMatches,
 bossWins:[holdoutStats.bossWinsCandidate,holdoutStats.bossWinsChampion],
 bossMatches:holdoutStats.bossMatches,
 specialists:pilotLeague.map(p=>({opponent:p.opponent,wins:p.wins,duels:p.duels})),
 promotionCandidate,productionIntegrated:false}));
