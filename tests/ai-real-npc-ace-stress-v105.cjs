'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const vm=boot({seed:651009});
function experiment(){
 profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
 const baseChoose=chooseAiAction,baseApply=applyAiAction;
 const seeds=64,tiers=[9,10],arms=['current','ace-targeted'];
 const policies=['balanced','offensive','guardian','economy'];
 const scenarios=['mirror-x-easy','mirror-x-hard'];
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
 for(let origin=0;origin<seeds;origin++){
  const split=origin<seeds/2?'train':'holdout';
  const policy=policies[origin%policies.length],
   scenario=scenarios[origin%scenarios.length];
  for(const tier of tiers)for(const arm of arms){
   const deck=rpgEnemyLoadout(10,scenario==='mirror-x-hard'?'hard':'easy');
   const g=createGame({id:'npc-v105-stress-'+origin+'-'+tier+'-'+arm,
    mode:'pve',context:'free',opponentId:tier,
    seed:(650105+origin*28763+tier*10907)>>>0,
    starter:origin%2,deck:[...deck.deck],fusionDeck:[...deck.fusionDeck],
    enhancements:{...deck.enhancements},difficulty:'easy'});
   const m={origin,split,policy,scenario,tier,arm,win:0,turns:0,
    aceFusionStockStart:g.players[1].fusionDeck.filter(id=>CARDS[id]?.ace).length,
    aceHandAtStart:g.players[1].hand.filter(c=>CARDS[c.id]?.ace).length,
    aceInMainDeck:g.players[1].originalDeck.filter(id=>CARDS[id]?.ace).length,
    acePlayableTurns:0,aceLegalCombinations:0,normalLegalOptions:0,
    npcSummonTurns:0,aceChosen:0,acePrepared:0,acePlaced:0,
    normalAcePlaced:0,fusionsPlaced:0,
    policyOverrides:0,invalid:0,attackThenSwitch:0,
    actions:0,npcDamage:0,npcKills:0};
   const counted=new Set(),attacks=new Map();
   chooseAiAction=function(game,policyName){
    if(game!==g||game.active!==1)return baseChoose(game,policyName);
    if(game.aiPhase==='summon'&&!game.summoned&&!game.pending&&!counted.has(game.turn)){
     counted.add(game.turn);m.npcSummonTurns++;
     const info=aceOptions(game);
     m.acePlayableTurns+=Number(info.choices.length>0);
     m.aceLegalCombinations+=info.choices.length;
     m.normalLegalOptions+=info.normalOptions;
     if(arm==='ace-targeted'){
      const alt=proposed(game,info.choices);
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
    if(action.type==='fusion'&&game.pending&&CARDS[game.pending.card.id]?.ace)m.acePrepared++;
    if(action.type==='place'){
     if(pending?.kind==='fusion')m.fusionsPlaced++;
     if(CARDS[r.card?.id]?.ace){
      m.acePlaced++;
      if(pending?.kind==='normal')m.normalAcePlaced++;
     }
    }
    if(action.type==='attack'){
     if(attacker)attacks.set(attacker.uid,game.turn);
     m.npcDamage+=Math.max(0,previousLP-enemy.lp);
     m.npcKills+=(r.destroyed||[]).filter(x=>String(x).startsWith('0:')).length;
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
    npcDamage:sum(subset,'npcDamage'),npcKills:sum(subset,'npcKills'),
    actions:sum(subset,'actions'),invalid:sum(subset,'invalid'),
    attackThenSwitch:sum(subset,'attackThenSwitch')};
  }
 const pairs={};
 for(const split of ['train','holdout'])
  for(const scenario of scenarios)for(const tier of tiers){
   let better=0,worse=0,same=0;
   for(let origin=split==='train'?0:32;origin<(split==='train'?32:64);origin++){
    const a=observed.find(x=>x.origin===origin&&x.scenario===scenario&&x.tier===tier&&x.arm==='current');
    const b=observed.find(x=>x.origin===origin&&x.scenario===scenario&&x.tier===tier&&x.arm==='ace-targeted');
    if(!a||!b)continue;
    better+=Number(b.win>a.win);worse+=Number(b.win<a.win);same+=Number(b.win===a.win);
   }
   pairs[[split,scenario,tier].join(':')]={better,worse,same};
  }
 return {schema:'arcane-npc-ace-stress-v105',originSeeds:64,trainOrigins:32,holdoutOrigins:32,
  tiers,arms,totalMatches:observed.length,
  scenarios:{'mirror-x-easy':'Existing legal opponent X easy deck used as player strength proxy, NOT earned',
   'mirror-x-hard':'Existing legal opponent X hard deck used as player strength proxy, NOT earned'},
  caveats:[
   'ACE IX/X are fusion templates, not ordinary main-deck ACE hand cards.',
   'Counts of eligible combinations are correlated within each NPC turn and match.',
   'No game files, legal decks or opponent hidden information were modified.',
   'Both X mirror decks are diagnostic enemy-derived proxies, NOT earned human progression or human fairness evidence.',
   'This policy is experimental and not active in the shipped NPC.'
  ],groups,pairs,observed};
}
const r=vm.run('('+experiment.toString()+')()',300000);
assert.equal(r.totalMatches,256);
assert(r.observed.every(x=>x.invalid===0&&x.attackThenSwitch===0));
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-real-npc-ace-stress-v105.json',JSON.stringify(r,null,2)+'\n');
console.log('ARCANE_V105_STRESS_SUMMARY '+JSON.stringify({totalMatches:r.totalMatches,groups:r.groups,pairs:r.pairs}));
