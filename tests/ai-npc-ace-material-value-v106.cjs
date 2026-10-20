'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-earned-player-decks-v106.json','utf8'));
const vm=boot({seed:651106});
function experiment(samples){
 profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
 const baseChoose=chooseAiAction,baseApply=applyAiAction;
 const seeds=32,tiers=[9,10],arms=['current','ace-targeted','ace-value'];
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
 function valueAction(game,choices){
  if(!choices.length)return null;
  const own=game.players[1],their=game.players[0];
  const wall=Math.max(0,...their.field.filter(Boolean).map(c=>{
   const t=dataOf(c);return c.mode==='def'?t.def:t.atk;
  }));
  let best=null;
  for(const possible of choices){
   const ace=CARDS[possible.ace];
   const material=possible.uids.map(uid=>own.hand.find(c=>c.uid===uid));
   if(material.some(x=>!x))continue;
   const remaining=own.hand.filter(c=>!possible.uids.includes(c.uid));
   const attacks=material.map(c=>dataOf(c).atk);
   const anchor=Math.max(...attacks);
   const cost=anchor*.53+attacks.reduce((n,x)=>n+x,0)*.12+
    Math.max(0,material.length-2)*180;
   const projected=baseStat(ace,'atk',own)*.96;
   const survive=baseStat(ace,'def',own)*.13;
   const remainingPower=Math.max(0,...remaining.map(c=>dataOf(c).atk));
   const wallPenalty=wall>0&&projected<wall*.90?450:0;
   const score=projected+survive-cost-Math.max(0,remainingPower-anchor)*.10-wallPenalty;
   if(!best||score>best.score)best={...possible,score,projected};
  }
  if(!best)return null;
  const topNormal=Math.max(0,...own.hand.map(c=>dataOf(c).atk));
  if(best.score<Math.max(200,topNormal*.35)||best.projected<topNormal*.90)return null;
  return {type:'fusion',uids:best.uids,choice:best.ace};
 }
 for(let origin=0;origin<seeds;origin++){
  const split=origin<seeds/2?'train':'holdout';
  const policy=policies[origin%policies.length],
   scenario=scenarios[origin%scenarios.length];
  for(const tier of tiers)for(const arm of arms){
   const sample=samples.find(x=>x.run===origin&&x.legitimatelyEarned);
   if(scenario==='earned'&&!sample)continue;
   const deck=scenario==='earned'
    ? {deck:sample.activeDeck,fusionDeck:sample.fusionDeck,enhancements:sample.enhancements}
    : rpgEnemyLoadout(10,'hard');
   const g=createGame({id:'npc-v105-stress-'+origin+'-'+tier+'-'+arm,
    mode:'pve',context:'free',opponentId:tier,
    seed:(710106+origin*30103+tier*13907)>>>0,
    starter:origin%2,deck:[...deck.deck],fusionDeck:[...deck.fusionDeck],
    enhancements:{...deck.enhancements},difficulty:'easy'});
   const m={origin,split,policy,scenario,tier,arm,win:0,turns:0,earnedTier:scenario==='earned'?sample.reached:null,
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
     if(arm==='ace-targeted'||arm==='ace-value'){
      const alt=arm==='ace-value'?valueAction(game,info.choices):proposed(game,info.choices);
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
    const b=observed.find(x=>x.origin===origin&&x.scenario===scenario&&x.tier===tier&&x.arm==='ace-value');
    if(!a||!b)continue;
    better+=Number(b.win>a.win);worse+=Number(b.win<a.win);same+=Number(b.win===a.win);
   }
   pairs[[split,scenario,tier].join(':')]={better,worse,same};
  }
 return {schema:'arcane-npc-ace-material-value-v106',originSeeds:32,trainOrigins:16,holdoutOrigins:16,
  tiers,arms,totalMatches:observed.length,
  scenarios:{'earned':'Actual rewarded V/VI career deck, ownership audited',
   'proxy-x-hard':'Legal X hard NPC deck; not earned by a real player'},
  caveats:[
   'ACE IX/X are fusion templates, not ordinary main-deck ACE hand cards.',
   'Counts of eligible combinations are correlated within each NPC turn and match.',
   'No game files, legal decks or opponent hidden information were modified.',
   'Earned decks came from paid in-game rewards and owned inventory, but are often V/VI decks below IX/X game strength.',
   'This policy is experimental and not active in the shipped NPC.'
  ],groups,pairs,observed};
}
const r=vm.run('('+experiment.toString()+')('+JSON.stringify(earned.samples)+')',300000);
assert.ok(r.totalMatches>=160&&r.totalMatches<=192);
assert(r.observed.every(x=>x.invalid===0&&x.attackThenSwitch===0));
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-npc-ace-material-value-v106.json',JSON.stringify(r,null,2)+'\n');
console.log('ARCANE_V106_SUMMARY '+JSON.stringify({totalMatches:r.totalMatches,groups:r.groups,pairs:r.pairs}));
