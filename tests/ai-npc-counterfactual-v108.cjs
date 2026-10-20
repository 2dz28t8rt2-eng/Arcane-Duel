'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-progressive-career-v108.json','utf8'));
const vm=boot({seed:651108});
function experiment(samples){
 profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
 const baseChoose=chooseAiAction,baseApply=applyAiAction;
 const seeds=32,tiers=[9,10],arms=['current','ace-relative'];
 const policies=['balanced','offensive','guardian','economy'];
 const scenarios=['earned','proxy-x-hard'];
 const observed=[],sum=(rows,key)=>rows.reduce((a,x)=>a+(x[key]||0),0);
 function combos(cards){
  const out=[];
  for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
   out.push([cards[i],cards[j]]);
   for(let k=j+1;k<cards.length;k++)out.push([cards[i],cards[j],cards[k]]);
  }
  return out;
 }
 function aceOptions(g){
  const p=g.players[1],hand=p.hand.filter(c=>!isFateCard(c));
  const choices=[],aceStock=p.remainingFusion.filter(id=>CARDS[id]?.ace).length;
  const handAce=hand.filter(c=>CARDS[c.id]?.ace).length;
  let normalOptions=0;
  if(p.field.some(c=>!c)){
   for(const cards of combos(hand)){
    const lv=cards.map(c=>dataOf(c).level);
    const possible=fusionOptions(g,lv,cards).filter(c=>canCompleteHandFusion(g,lv,c.id));
    normalOptions+=possible.length;
    for(const c of possible)if(c.ace)
      choices.push({ace:c.id,level:c.level,atk:c.atk,uids:cards.map(c=>c.uid)});
   }
  }
  return {choices,aceStock,handAce,normalOptions};
 }
 function proposed(g,choices){
  if(!choices.length)return null;
  choices.sort((a,b)=>b.level-a.level||b.atk-a.atk||a.uids.length-b.uids.length);
  const c=choices[0],p=g.players[1];
  const strongest=Math.max(0,...p.hand.map(x=>dataOf(x).atk));
  if(c.atk<strongest*.75)return null;
  return {type:'fusion',uids:c.uids,choice:c.ace};
 }
 function relativeAction(game,choices,audit){
  if(!choices.length)return null;
  const self=game.players[1],opponent=game.players[0];
  const hand=self.hand.filter(c=>!isFateCard(c));
  const visibleThreat=Math.max(0,...opponent.field.filter(Boolean).map(c=>{
   const stat=dataOf(c);return c.mode==='def'?stat.def:stat.atk;
  }));
  // All candidate branches are estimates of identical legal current-turn
  // actions; NO actual rolls, hidden player cards or future draws are used.
  function exposedScore(atk,def){
   const breaks=visibleThreat>0&&atk>=visibleThreat;
   const deficit=visibleThreat>0&&atk<visibleThreat*.95;
   return atk+def*.17+(breaks?180:0)-(deficit?180:0);
  }
  function fusionValue(template,material){
   const atk=baseStat(template,'atk',self),def=baseStat(template,'def',self);
   // Material opportunity costs: strongest lost attacker and total
   // stats of the other cards; the hand loses ALL these card copies.
   const strengths=material.map(x=>dataOf(x));
   const strongest=Math.max(0,...strengths.map(x=>x.atk));
   const lost=strengths.reduce((n,x)=>n+x.atk*.32+x.def*.07,0)+
    strongest*.36+(material.length-2)*155;
   const hold=Math.max(0,...hand.filter(x=>!material.some(y=>y.uid===x.uid))
    .map(x=>dataOf(x).atk));
   return exposedScore(atk,def)-lost+hold*.07;
  }
  let bestAlternative=-Infinity,alternativeKind='none',bestAce=null;
  // Only own drawn and legally normal-playable cards are candidates.
  // Normal play saves every other hand card for future turns.
  if(self.field.some(x=>!x)){
   for(const c of hand){
    const st=dataOf(c);
    const score=exposedScore(st.atk,st.def)+
     Math.max(0,...hand.filter(x=>x.uid!==c.uid).map(x=>dataOf(x).atk))*.07;
    if(score>bestAlternative){bestAlternative=score;alternativeKind='normal';}
   }
   // Compare against all accessible NON-ACE 2/3 hand fusion alternatives
   // with the exact same original resolver and remaining fusion copies.
   for(const materials of combos(hand)){
    const levels=materials.map(x=>dataOf(x).level);
    for(const template of fusionOptions(game,levels,materials)){
     if(template.ace||!canCompleteHandFusion(game,levels,template.id))continue;
     const score=fusionValue(template,materials);
     if(score>bestAlternative){bestAlternative=score;alternativeKind='fusion';}
    }
   }
   for(const c of choices){
    const materials=c.uids.map(uid=>hand.find(x=>x.uid===uid));
    if(materials.some(x=>!x))continue;
    const template=CARDS[c.ace];
    const score=fusionValue(template,materials);
    if(!bestAce||score>bestAce.score)bestAce={...c,score};
   }
  }
  if(!bestAce)return null;
  audit.relativeConsidered++;
  audit.relativeBestAceScoreSum+=Math.round(bestAce.score);
  audit.relativeBestAlternativeScoreSum+=Math.round(bestAlternative);
  if(alternativeKind==='normal')audit.relativeAlternativeNormal++;
  if(alternativeKind==='fusion')audit.relativeAlternativeFusion++;
  // 15% score margin plus fixed opportunity buffer. If the best legal
  // normal or non-ACE fusion holds comparable value, keep original policy.
  const margin=Math.max(180,Math.abs(bestAlternative)*.15);
  const takeAce=bestAce.score>bestAlternative+margin;
  if(audit.relativeAuditSamples.length<8)
   audit.relativeAuditSamples.push({bestAce:Math.round(bestAce.score),
    bestLegalAlternative:Math.round(bestAlternative),
    alternativeKind,margin:Math.round(margin),takeAce});
  if(!takeAce){audit.relativeRejected++;return null;}
  audit.relativeAccepted++;
  return {type:'fusion',uids:bestAce.uids,choice:bestAce.ace};
 }
 function inspectCounterfactual(game,aceChoices,audit){
  // Offline diagnostic ONLY. Independently copied pure data game objects
  // begin with the same RNG seed and identical own visible hand / field.
  // Never feed future rolled results back to live NPC decision logic.
  const beforeSeed=game.seed,beforeHand=game.players[1].hand.map(c=>c.uid).join(',');
  const p=game.players[1],hand=p.hand.filter(c=>!isFateCard(c));
  const free=p.field.findIndex(c=>!c);
  if(free<0)return;
  let normal=null,nonAce=null,ace=null;
  for(const c of hand){
   const v=dataOf(c).atk+dataOf(c).def*.15;
   if(!normal||v>normal.value)normal={type:'normal',uid:c.uid,value:v};
  }
  for(const mats of combos(hand)){
   const levels=mats.map(c=>dataOf(c).level);
   for(const target of fusionOptions(game,levels,mats)){
    if(!canCompleteHandFusion(game,levels,target.id))continue;
    const o={type:'fusion',uids:mats.map(c=>c.uid),choice:target.id,
     value:baseStat(target,'atk',p)+baseStat(target,'def',p)*.15};
    if(target.ace){if(!ace||o.value>ace.value)ace=o;}
    else if(!nonAce||o.value>nonAce.value)nonAce=o;
   }
  }
  if(!ace||!normal)return;
  function runReal(originalAction,materials){
   const clone=JSON.parse(JSON.stringify(game));
   const approved=baseApply(clone,originalAction);
   if(!approved||!clone.pending)return null;
   const installed=baseApply(clone,{type:'place',idx:free});
   if(!installed)return null;
   const c=dataOf(installed.card),enemy=clone.players[0];
   const threat=Math.max(0,...enemy.field.filter(Boolean).map(x=>
    x.mode==='def'?dataOf(x).def:dataOf(x).atk));
   const score=c.atk+c.def*.15+(threat&&c.atk>threat?180:0)-
    materials.reduce((n,x)=>n+dataOf(x).atk*.22,0);
   return {score:+score.toFixed(2),atk:c.atk,def:c.def,
    materials:materials.length,copiesLeft:clone.players[1].remainingFusion.length,
    handLeft:clone.players[1].hand.length};
  }
  const actions=[['ACE',ace,hand.filter(x=>ace.uids.includes(x.uid))],
   ['normal',normal,hand.filter(x=>x.uid===normal.uid)]];
  if(nonAce)actions.push(['nonACE',nonAce,
   hand.filter(x=>nonAce.uids.includes(x.uid))]);
  const tested={};
  for(const [kind,action,mats] of actions)tested[kind]=runReal(action,mats);
  if(!tested.ACE||!tested.normal)return;
  if(game.seed!==beforeSeed||game.players[1].hand.map(c=>c.uid).join(',')!==beforeHand)
   throw Error('Counterfactual mutated original game');
  const ranked=Object.entries(tested).filter(([,v])=>v)
    .sort((a,b)=>b[1].score-a[1].score);
  const winner=ranked[0][0];
  audit.trials++;audit.clonedSeedUnchanged++;
  audit.aceCompared++;
  audit.aceWinsBoardValue+=Number(winner==='ACE');
  audit.normalWinsBoardValue+=Number(winner==='normal');
  audit.nonAceWinsBoardValue+=Number(winner==='nonACE');
  audit.hypotheticalAceAtk+=tested.ACE.atk;
  audit.hypotheticalNormalAtk+=tested.normal.atk;
  audit.hypotheticalNonAceAtk+=(tested.nonACE?.atk||0);
  audit.trialSnapshots.push({turn:game.turn,
   ranked:ranked.map(([label,v])=>({label,...v})),
   originalRngState:beforeSeed});
 }
 for(let origin=0;origin<seeds;origin++){
  const split=origin<seeds/2?'train':'holdout';
  const policy=policies[origin%policies.length];
  for(const scenario of scenarios)for(const tier of tiers)for(const arm of arms){
   const sample=samples.find(x=>x.run===origin&&x.legitimatelyEarned);
   if(scenario==='earned'&&!sample)continue;
   const deck=scenario==='earned'
    ? {deck:sample.activeDeck,fusionDeck:sample.fusionDeck,enhancements:sample.enhancements}
    : rpgEnemyLoadout(scenario==='proxy-ix-hard'?9:10,'hard');
   const g=createGame({id:'npc-v108-'+origin+'-'+scenario+'-'+tier+'-'+arm,
    mode:'pve',context:'free',opponentId:tier,
    seed:(880108+origin*39217+tier*19001)>>>0,
    starter:origin%2,deck:[...deck.deck],fusionDeck:[...deck.fusionDeck],
    enhancements:{...deck.enhancements},difficulty:'easy'});
   const m={origin,split,policy,scenario,tier,arm,win:0,turns:0,
    earnedTier:scenario==='earned'?sample.reached:null,
    trials:0,aceCompared:0,aceWinsBoardValue:0,normalWinsBoardValue:0,
    nonAceWinsBoardValue:0,sameBoardValue:0,
    hypotheticalAceAtk:0,hypotheticalNormalAtk:0,hypotheticalNonAceAtk:0,
    clonedSeedUnchanged:0,trialSnapshots:[],
    relativeConsidered:0,relativeAccepted:0,relativeRejected:0,
    relativeAlternativeNormal:0,relativeAlternativeFusion:0,
    relativeBestAceScoreSum:0,relativeBestAlternativeScoreSum:0,
    relativeAuditSamples:[],
    aceFusionStockStart:g.players[1].fusionDeck.filter(id=>CARDS[id]?.ace).length,
    aceHandAtStart:g.players[1].hand.filter(c=>CARDS[c.id]?.ace).length,
    aceInMainDeck:g.players[1].originalDeck.filter(id=>CARDS[id]?.ace).length,
    acePlayableTurns:0,aceLegalCombinations:0,normalLegalOptions:0,
    aceAttacks:0,aceAttackDamage:0,aceAttackKills:0,aceMaterialSpent:0,
    npcSummonTurns:0,aceChosen:0,acePrepared:0,acePlaced:0,
    normalAcePlaced:0,fusionsPlaced:0,
    policyOverrides:0,invalid:0,attackThenSwitch:0,
    actions:0,npcDamage:0,npcKills:0};
   const counted=new Set(),attacks=new Map(),activeAce=new Set();
   chooseAiAction=function(game,policyName){
    if(game!==g||game.active!==1)return baseChoose(game,policyName);
    if(game.aiPhase==='summon'&&!game.summoned&&!game.pending&&!counted.has(game.turn)){
     counted.add(game.turn);m.npcSummonTurns++;
     const info=aceOptions(game);
     m.acePlayableTurns+=Number(info.choices.length>0);
     m.aceLegalCombinations+=info.choices.length;
     m.normalLegalOptions+=info.normalOptions;
     if(info.choices.length&&m.trials<2)
      inspectCounterfactual(game,info.choices,m);
     if(arm==='ace-targeted'||arm==='ace-relative'){
      const alt=arm==='ace-relative'?relativeAction(game,info.choices,m):proposed(game,info.choices);
      if(alt){
       m.policyOverrides++;m.aceChosen++;
       game.aiPhase='positions';
       return alt;
      }
     }
    }
    return baseChoose(game,policyName);
   };
   applyAiAction=function(game,action){
    if(game!==g||game.active!==1)return baseApply(game,action);
    const p=game.players[1],enemy=game.players[0],
     pending=game.pending,attacker=action.type==='attack'?p.field[action.ai]:null,
     switcher=action.type==='switch'?p.field[action.idx]:null,previousLP=enemy.lp;
    const r=baseApply(game,action);m.actions++;
    if(!r){m.invalid++;return r;}
    if(action.type==='fusion'&&game.pending&&CARDS[game.pending.card.id]?.ace){
      m.acePrepared++;m.aceMaterialSpent+=action.uids?.length||0;
     }
    if(action.type==='place'){
     if(pending?.kind==='fusion')m.fusionsPlaced++;
     if(CARDS[r.card?.id]?.ace){
      m.acePlaced++;activeAce.add(r.card.uid);
      if(pending?.kind==='normal')m.normalAcePlaced++;
     }
    }
    if(action.type==='attack'){
     if(attacker)attacks.set(attacker.uid,game.turn);
     const damage=Math.max(0,previousLP-enemy.lp);
     const kills=(r.destroyed||[]).filter(x=>String(x).startsWith('0:')).length;
     m.npcDamage+=damage;m.npcKills+=kills;
     if(attacker&&activeAce.has(attacker.uid)){
      m.aceAttacks++;m.aceAttackDamage+=damage;m.aceAttackKills+=kills;
     }
    }
    if(action.type==='switch'&&switcher&&attacks.get(switcher.uid)===game.turn)m.attackThenSwitch++;
    return r;
   };
   try{simulateGame(g,'balanced',policy);}
   finally{chooseAiAction=baseChoose;applyAiAction=baseApply;}
   if(g.winner===null||m.invalid||m.attackThenSwitch)throw Error('Illegal NPC: '+JSON.stringify(m));
   m.win=Number(g.winner===1);m.turns=g.turn;
   observed.push(m);
  }
 }
 const groups={};
 for(const split of ['train','holdout','overall'])
  for(const scenario of scenarios)for(const tier of tiers)for(const arm of arms){
   const subset=observed.filter(x=>(split==='overall'||x.split===split)&&x.scenario===scenario&&x.tier===tier&&x.arm===arm);
   const k=[split,scenario,tier,arm].join(':');
   groups[k]={matches:subset.length,wins:sum(subset,'win'),
    aceFusionStockStart:sum(subset,'aceFusionStockStart'),
    aceHandAtStart:sum(subset,'aceHandAtStart'),
    acePlayableTurns:sum(subset,'acePlayableTurns'),
    aceLegalCombinations:sum(subset,'aceLegalCombinations'),
    npcSummonTurns:sum(subset,'npcSummonTurns'),
    aceChosen:sum(subset,'aceChosen'),acePrepared:sum(subset,'acePrepared'),
    acePlaced:sum(subset,'acePlaced'),normalAcePlaced:sum(subset,'normalAcePlaced'),
    fusionsPlaced:sum(subset,'fusionsPlaced'),
    counterfactualTrials:sum(subset,'trials'),
    rolledAceBest:sum(subset,'aceWinsBoardValue'),
    rolledNormalBest:sum(subset,'normalWinsBoardValue'),
    rolledNonAceBest:sum(subset,'nonAceWinsBoardValue'),
    isolatedSeedsUnchanged:sum(subset,'clonedSeedUnchanged'),
    rolledAceAtk:sum(subset,'hypotheticalAceAtk'),
    rolledNormalAtk:sum(subset,'hypotheticalNormalAtk'),
    relativeConsidered:sum(subset,'relativeConsidered'),
    relativeAccepted:sum(subset,'relativeAccepted'),
    relativeRejected:sum(subset,'relativeRejected'),
    relativeAlternativeNormal:sum(subset,'relativeAlternativeNormal'),
    relativeAlternativeFusion:sum(subset,'relativeAlternativeFusion'),
    relativeBestAceScoreSum:sum(subset,'relativeBestAceScoreSum'),
    relativeBestAlternativeScoreSum:sum(subset,'relativeBestAlternativeScoreSum'),
    aceMaterialSpent:sum(subset,'aceMaterialSpent'),
    aceAttacks:sum(subset,'aceAttacks'),
    aceAttackDamage:sum(subset,'aceAttackDamage'),
    aceAttackKills:sum(subset,'aceAttackKills'),
    npcDamage:sum(subset,'npcDamage'),npcKills:sum(subset,'npcKills'),
    actions:sum(subset,'actions'),invalid:sum(subset,'invalid'),
    attackThenSwitch:sum(subset,'attackThenSwitch')};
  }
 const pairs={};
 for(const split of ['train','holdout'])
  for(const scenario of scenarios)for(const tier of tiers){
   let better=0,worse=0,same=0;
   for(let origin=split==='train'?0:16;origin<(split==='train'?16:32);origin++){
    const a=observed.find(x=>x.origin===origin&&x.scenario===scenario&&x.tier===tier&&x.arm==='current');
    const b=observed.find(x=>x.origin===origin&&x.scenario===scenario&&x.tier===tier&&x.arm==='ace-relative');
    if(!a||!b)continue;
    better+=Number(b.win>a.win);worse+=Number(b.win<a.win);same+=Number(b.win===a.win);
   }
   pairs[[split,scenario,tier].join(':')]={better,worse,same};
  }
 return {schema:'arcane-npc-ace-counterfactual-v108',originSeeds:32,trainOrigins:16,holdoutOrigins:16,
  tiers,arms,totalMatches:observed.length,
  scenarios:{'earned':'Genuinely earned deck from last legally reached tournament tier; NOT necessarily IX/X strength',
   'proxy-x-hard':'Legal tier X hard NPC-derived diagnostic stress deck, not earned'},
  caveats:[
   'ACE IX/X are fusion templates, not ordinary main-deck ACE hand cards.',
   'Counts of eligible combinations are correlated within each NPC turn and match.',
   'No game files, legal decks or opponent hidden information were modified.',
   'Earned decks came from real in-game rewards and owned inventory, but are usually V/VI and underpowered against IX/X; both IX/X hard decks are declared non-earned proxies.',
   'The LIVE choice does not see counterfactual rolled results: cloned game states are observational only and use original action resolver with same initial RNG seed.',
   'This policy is experimental and not active in the shipped NPC.'
  ],groups,pairs,observed};
}
const playerDecks=earned.raw.filter(r=>r.treatment==='tier-progressive').map(r=>({
 run:r.run,legitimatelyEarned:r.earnedDeck.legitimatelyEarned,
 reached:r.earnedDeck.reached,
 activeDeck:r.earnedDeck.activeDeck,fusionDeck:r.earnedDeck.fusionDeck,
 enhancements:r.earnedDeck.enhancements,inventoryOwned:r.earnedDeck.inventoryOwned}));
const r=vm.run('('+experiment.toString()+')('+JSON.stringify(playerDecks)+')',300000);
assert.equal(r.totalMatches,256);
assert(r.observed.every(x=>x.invalid===0&&x.attackThenSwitch===0));
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-npc-counterfactual-v108.json',JSON.stringify(r,null,2)+'\n');
console.log('ARCANE_V108_SUMMARY '+JSON.stringify({totalMatches:r.totalMatches,groups:r.groups,pairs:r.pairs}));
