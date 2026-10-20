/* Arcane Duel v6.0 – exact-deck mirror AI training.
 * Both players are controlled by the real match engine.
 * The AI player 1 uses earlier trained weights (control) or the candidate
 * branching scorer. Player 0 uses its established scripted policy.
 * The TWO physical decks, fusion sets, enhancements and power are identical.
 * Every game is paired by identical seed and both opening-player assignments.
 * Focus: opponents III, VI, IX with confidence-gated variations.
 * Not a symmetric-AI test: policies intentionally differ to measure progress.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeStageOwnedDeck,STYLES}=require('./helpers/stage-owned-decks-v60.cjs');
const maxTier=Number(process.env.ARCANE_MIRROR_TIERS||10),
 trainN=Number(process.env.ARCANE_MIRROR_TRAIN_SEEDS||2),
 holdN=Number(process.env.ARCANE_MIRROR_HOLDOUT_SEEDS||3);
if(!Number.isSafeInteger(maxTier)||maxTier<1||maxTier>10||
 !Number.isSafeInteger(trainN)||trainN<1||trainN>8||
 !Number.isSafeInteger(holdN)||holdN<2||holdN>12)
 throw Error('Invalid exact-deck mirror sample budget');
const b=boot({seed:602611});
const meta=b.run(`(()=>{const p=freshProfile();return {cards:CARDS.map(c=>({
 id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
 source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,
 enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
 workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
 milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
 questOnly:c.questOnly,legendaryOnly:c.legendaryOnly
 })),defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({id:o.id,loot:o.loot,level:o.level})),
 initialInventory:p.inventory};})()`);
const earlier=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const focus=[3,6,9].filter(tier=>tier<=maxTier);
const variants=['normal','invested'];
const stylePolicies={predator:'offensive',guardian:'guardian',fusion:'economy',
 balanced:'balanced',soul:'guardian'};
const policies=[
 {name:'field',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10}},
 {name:'survival',weights:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10}},
 {name:'tempo',weights:{material:.5,board:1.5,tempo:2.3,risk:.9,support:.8,future:.35,ace:10}},
 {name:'balanced',weights:{material:.8,board:1.45,tempo:1.1,risk:1.2,support:1.1,future:.6,ace:10}},
 {name:'gated-field-0',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10,__guarded:0}},
 {name:'gated-field-2',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10,__guarded:2}},
 {name:'gated-field-5',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10,__guarded:5}},
 {name:'gated-field-10',weights:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10,__guarded:10}},
 {name:'gated-survival-3',weights:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10,__guarded:3}}
];
const deckPairs=new Map();
for(const tier of focus)for(const style of STYLES)for(const variant of variants){
 const d=makeStageOwnedDeck(meta,tier,style,variant);
 deckPairs.set(`${tier}:${style}:${variant}`,d);
}
let played=0;
function game(tier,style,variant,seed,starter,policy){
 const d=deckPairs.get(`${tier}:${style}:${variant}`);
 const settings=earlier.find(r=>r.tier===tier)?.weights;
 assert.ok(settings);
 const config=policy?Object.fromEntries(Object.entries(policy).filter(([key])=>key!=='__guarded')):null;
 const gate=policy&&Number.isFinite(policy.__guarded)?{guarded:true,margin:policy.__guarded}:null;
 const candidate=config?JSON.stringify(config):'null';
 const code=`(()=>{
 // A fresh isolated training profile controls opponent difficulty boosts:
 // completed tournament tiers remove player-vs-boss first-encounter boosts.
 // This adjustment NEVER changes any real stored user profile.
 profile=freshProfile();profile.cleared=Array.from({length:10},(_,i)=>i+1);
 profile.trainingWins=3;profile.guideSeen=true;
 ArcaneAiLearning56.setSandbox(${JSON.stringify(settings)},true);
 ArcaneAiLookahead58.setSandbox(null);
 ArcaneAiBranches59.setSandbox(${candidate},${!!policy},${JSON.stringify(gate)});
 const items=${JSON.stringify(d.deck)},fusions=${JSON.stringify(d.fusionDeck)};
 const enemy={deck:[...items],fusionDeck:[...fusions],enhancements:{},
  flatBonus:0,power:1};
 const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
  starter:${starter},seed:${seed},difficulty:'easy',
  deck:[...items],fusionDeck:[...fusions],enhancements:{},enemy});
 const sorted=p=>[...p.originalDeck].sort((a,b)=>a-b).join(':');
 const sortedFusion=p=>[...p.fusionDeck].sort((a,b)=>a-b).join(':');
 const exact=sorted(g.players[0])===sorted(g.players[1])&&
  sortedFusion(g.players[0])===sortedFusion(g.players[1])&&
  g.players[0].power===g.players[1].power&&
  g.players[0].lp===g.players[1].lp&&
  JSON.stringify(g.players[0].enhancements)===JSON.stringify(g.players[1].enhancements);
 const mirror={mainEqual:sorted(g.players[0])===sorted(g.players[1]),
  fusionEqual:sortedFusion(g.players[0])===sortedFusion(g.players[1]),
  boost:g.firstTrialBoost||0,starter:g.starter,
  leftPower:g.players[0].power,rightPower:g.players[1].power,exact};
 let error=null,npcAces=0,npcFusions=0,playerFusions=0;
 const prev=chooseAiAction;
 chooseAiAction=function(duel,which){
  const action=prev(duel,which);
  if(duel===g){
   if(action.type==='fusion'){
    if(duel.active===1){npcFusions++;if(action.choice===ACE_CARD_IDS[${tier}])npcAces++;}
    else playerFusions++;
   }
   if(duel.active===1&&action.type==='normal'&&
    g.players[1].hand.some(x=>x.uid===action.uid&&x.id===ACE_CARD_IDS[${tier}]))
    npcAces++;
  }return action;
 };
 try{simulateGame(g,'${stylePolicies[style]}','balanced');}catch(e){error=String(e);}
 chooseAiAction=prev;
 const stats=ArcaneAiBranches59.stats();
 ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
 return {mirror,error,winner:g.winner,turns:g.turn,
  lpMargin:g.players[1].lp-g.players[0].lp,npcAces,npcFusions,
  playerFusions,branchChoices:stats.evaluated};
 })()`;
 const outcome=b.run(code,120000);
 played++;
 if(!outcome.mirror.exact||outcome.mirror.boost)
  throw Error('Non-identical mirror duel at tier '+tier+': '+JSON.stringify(outcome.mirror));
 if(outcome.error||![0,1].includes(outcome.winner))
  throw Error('Mirror battle failed tier '+tier+' '+style+' '+variant+': '+outcome.error);
 return outcome;
}
function pairs(tier,seeds,option,phase){
 const results=[];
 for(const style of STYLES)for(const variant of variants)for(let i=0;i<seeds;i++){
  const base=phase==='train'?1360227:9838127;
  const seed=base+tier*93179+i*3457+STYLES.indexOf(style)*433+
   variants.indexOf(variant)*271;
  for(const starter of [0,1]){
   results.push({style,variant,starter,seed,
    ...game(tier,style,variant,seed,starter,option)});
  }
 }
 return results;
}
function stats(results){
 const n=results.length,byStyle=STYLES.map(style=>{
  const rows=results.filter(x=>x.style===style);
  return {style,games:rows.length,npcWins:rows.filter(x=>x.winner===1).length};
 });
 return {games:n,npcWins:results.filter(x=>x.winner===1).length,
  npcWinPct:+(results.filter(x=>x.winner===1).length*100/n).toFixed(1),
  meanLPMargin:Math.round(results.reduce((s,x)=>s+x.lpMargin,0)/n),
  meanTurns:+(results.reduce((s,x)=>s+x.turns,0)/n).toFixed(2),
  npcAces:results.reduce((s,x)=>s+x.npcAces,0),
  npcFusions:results.reduce((s,x)=>s+x.npcFusions,0),
  playerFusions:results.reduce((s,x)=>s+x.playerFusions,0),
  branchChoices:results.reduce((s,x)=>s+x.branchChoices,0),
  winsByStarter:[0,1].map(starter=>({starter,wins:results.filter(x=>x.starter===starter&&x.winner===1).length,
   games:n/2})),byStyle};
}
const report={schema:'arcane-duel-focused-confidence-mirror-v61',training:true,
 tournamentStageDecks:'source-limited prior stage loot and actual freshProfile inventory quantities',
 rules:'both 40-card main decks, fusion decks, powers and enhancements equal',
 sidePolicies:'human-side scripted baseline policy vs NPC v5.7 or v5.9 branches',
 fairness:'pair both starter assignments on every identical seed; disable first-trial boost inside isolated VM',
 roles:STYLES,variants,trainSeeds:trainN,holdoutSeeds:holdN,
 matches:0,trainingMatches:0,holdoutMatches:0,tiers:[],enabledLive:false,
 caveats:[
 'Deck parity is guaranteed, but the two AI controllers intentionally use different action policies.',
 'Tournament-specific NPC passives may differ by side despite card parity; report results as controlled AI comparisons, not identical rule profiles.',
 'Cards in synthetic inventories are limited to plausible previous rewards, not sampled from actual probabilities.',
 'Early opponent decks cannot legally own future ACEs, so mirror ACE usage is not equivalent to real boss deck usage.',
 'Only accept a later live promotion after real-career test sets and role-specific ACE tests.',
 'Confidence gate is evaluated only on summon; all other phases retain baseline behavior.'
 ]};
for(const tier of focus){
 const trainingBase=stats(pairs(tier,trainN,null,'train'));
 const train=policies.map(p=>({name:p.name,
  weights:p.weights,performance:stats(pairs(tier,trainN,p.weights,'train'))}));
 const ranked=train.map(x=>({...x,
  fitness:(x.performance.npcWins-trainingBase.npcWins)*10000+
  x.performance.meanLPMargin-trainingBase.meanLPMargin}))
  .sort((a,b)=>b.fitness-a.fitness||policies.indexOf(policies.find(x=>x.name===a.name))-
    policies.indexOf(policies.find(x=>x.name===b.name)));
 const selected=ranked[0];
 const baseline=stats(pairs(tier,holdN,null,'hold'));
 const challenger=stats(pairs(tier,holdN,selected.weights,'hold'));
 const winGain=challenger.npcWins-baseline.npcWins;
 const lpGain=challenger.meanLPMargin-baseline.meanLPMargin;
 const robust=winGain>=2&&lpGain>=0&&challenger.byStyle.every((s,i)=>
  s.npcWins>=baseline.byStyle[i].npcWins-2);
 const deckInfo=STYLES.map(style=>variants.map(variant=>{
  const d=deckPairs.get(`${tier}:${style}:${variant}`);
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify({
   main:[...d.deck].sort((a,b)=>a-b),fusion:[...d.fusionDeck].sort((a,b)=>a-b)
  })).digest('hex');
  return {style,variant,sha256:fingerprint,sourceLimit:d.meta.priorLootMaxSource,
   maxLevel:d.meta.mainHighest,ownedCopyLimit:true};
 })).flat();
 report.trainingMatches+=trainingBase.games+train.reduce((s,x)=>s+x.performance.games,0);
 report.holdoutMatches+=baseline.games+challenger.games;
 report.tiers.push({tier,stageLegalDecks:deckInfo,
  baselineTrain:trainingBase,candidates:ranked.map(x=>({name:x.name,training:x.performance,
   fitness:x.fitness})),selected:selected.name,selectedWeights:selected.weights,
  holdout:{baseline,challenger,winGain,lpGain,robust},activateLive:false});
 console.log('FOCUSED_STAGE_V61 '+JSON.stringify({tier,trainGames:trainingBase.games+train.reduce((s,x)=>s+x.performance.games,0),
  holdoutGames:baseline.games+challenger.games,selected:selected.name,winGain,lpGain,
  robust,starterWins:challenger.winsByStarter}));
}
report.matches=played;
report.holdoutNetWins=report.tiers.reduce((v,x)=>v+x.holdout.winGain,0);
report.averageHoldoutLPGain=Math.round(report.tiers.reduce((v,x)=>v+x.holdout.lpGain,0)/report.tiers.length);
report.promotableTiers=report.tiers.filter(x=>x.holdout.robust).map(x=>x.tier);
assert.equal(report.matches,report.trainingMatches+report.holdoutMatches);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-focused-mirror-v61.json',JSON.stringify(report,null,2)+'\n');
console.log('FOCUSED_V61_SUMMARY '+JSON.stringify({matches:report.matches,
 trainingMatches:report.trainingMatches,holdoutMatches:report.holdoutMatches,
 totalWinGain:report.holdoutNetWins,averageLPGain:report.averageHoldoutLPGain,
 qualifiedTiers:report.promotableTiers,
 tiers:report.tiers.map(x=>({tier:x.tier,selected:x.selected,
  winGain:x.holdout.winGain,lpGain:x.holdout.lpGain,
  mirrorDecks:x.stageLegalDecks.length}))}));
