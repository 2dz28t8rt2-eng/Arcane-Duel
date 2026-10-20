/* Arcane Duel 6.2 – AUTHENTIC opponent ACE test, separate from identical-deck mirror.
 * Player draws legal stage-owned 40-card decks. Opponent uses the actual
 * curated RPG tournament deck, including the real signature ACE and fusion.
 * Do not mutate user's profile; all profiles are created in a headless VM.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeStageOwnedDeck,STYLES}=require('./helpers/stage-owned-decks-v60.cjs');
const n=Number(process.env.ARCANE_ACE_BOSS_SEEDS||4);
if(!Number.isInteger(n)||n<2||n>15)throw Error('ACE boss seeds 2–15');
const runtime=boot({seed:620090});
const meta=runtime.run(`(()=>{const p=freshProfile();return {
 cards:CARDS.map(c=>({id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
  source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,
  enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
  questOnly:c.questOnly,legendaryOnly:c.legendaryOnly})),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({id:o.id,loot:o.loot,level:o.level})),
 initialInventory:p.inventory};})()`);
const learned=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const focus=[3,6,9],variants=['normal','invested'];
const styles={predator:'offensive',guardian:'guardian',fusion:'economy',
 balanced:'balanced',soul:'guardian'};
const existing={
  3:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10,margin:2},
  6:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10,margin:3},
  9:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10,margin:3}
};
const modes=['trained-v57','gated-v61','premium-5-v62'];
const rows=[];
for(const tier of focus)for(const style of Object.keys(styles))
 for(const variant of variants)for(let i=0;i<n;i++){
 const d=makeStageOwnedDeck(meta,tier,style,variant);
 const cfg=existing[tier],weight=learned.find(x=>x.tier===tier).weights;
 const seed=1909331+tier*9341+i*1187+Object.keys(styles).indexOf(style)*231+
  variants.indexOf(variant)*411;
 for(const mode of modes){
  const gated=mode==='trained-v57'?null:{...cfg,guarded:true,
   fusionPremium:mode==='premium-5-v62'?5:0};
  const weights=gated?Object.fromEntries(Object.entries(gated).filter(([k])=>!
   ['margin','guarded','fusionPremium'].includes(k))):null;
  const options=gated?{guarded:true,margin:gated.margin,
   fusionPremium:gated.fusionPremium}:null;
  const expr=`(()=>{
   profile=freshProfile();profile.cleared=Array.from({length:10},(_,i)=>i+1);
   profile.trainingWins=3;profile.guideSeen=true;
   ArcaneAiLearning56.setSandbox(${JSON.stringify(weight)},true);
   ArcaneAiLookahead58.setSandbox(null);
   ArcaneAiBranches59.setSandbox(${JSON.stringify(weights)},${!!gated},
    ${JSON.stringify(options)});
   const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
    seed:${seed},starter:${i%2},difficulty:'easy',
    deck:${JSON.stringify(d.deck)},fusionDeck:${JSON.stringify(d.fusionDeck)}});
   const aceId=ACE_CARD_IDS[${tier}],p=g.players[1],ace=CARDS[aceId];
   const authentic=!!ace&&!!(ace.fusionOnly?p.remainingFusion.includes(aceId):
    p.originalDeck.includes(aceId));
   let aceActions=0,normalActions=0,fusionActions=0,prepped=false,err=null;
   const committedAceUIDs=new Set();
   const previousApply=applyAiAction;
   applyAiAction=function(battle,action){
    const applied=previousApply(battle,action);
    if(battle===g&&applied)for(const card of g.players[1].field){
     if(card&&card.id===aceId)committedAceUIDs.add(card.uid);
    }
    return applied;
   };
   const previous=chooseAiAction;
   chooseAiAction=function(duel,policy){
    const a=previous(duel,policy);
    if(duel===g&&g.active===1){
     if(duel.arcaneAceCue)prepped=true;
     if(a.type==='normal')normalActions++;
     if(a.type==='fusion')fusionActions++;
     if(a.type==='fusion'&&a.choice===aceId||
      a.type==='normal'&&p.hand.some(c=>c.uid===a.uid&&c.id===aceId))aceActions++;
    }
    return a;
   };
   try{simulateGame(g,'${styles[style]}','balanced');}catch(e){err=String(e);}
   chooseAiAction=previous;applyAiAction=previousApply;
   const counters=ArcaneAiBranches59.stats();
   ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
   return {authentic,aceId,prepped,aceActions,confirmedAceSummons:committedAceUIDs.size,normalActions,fusionActions,
    win:g.winner===1,lpMargin:p.lp-g.players[0].lp,turns:g.turn,
    valid:[0,1].includes(g.winner),error:err,branches:counters.evaluated};
  })()`;
  const result=runtime.run(expr,120000);
  assert.ok(result.authentic,'Stage '+tier+' authentic boss must actually own its ACE');
  assert.equal(result.error,null,'tournament '+tier+' '+result.error);
  assert.equal(result.valid,true);
  rows.push({tier,style,variant,mode,seed,...result});
 }
}
const data={schema:'arcane-authentic-ace-boss-holdout-v62',
 matches:rows.length,focus,playerVariants:variants,
 notes:['Boss uses real curated tournament loadout with real ACE',
  'Player uses conservative synthetic stage-owned deck, not boss mirror',
  'Compared policies use same seed/deck; limited scripted human strategies',
  'ACE attempted actions are not the same as confirmed summons; both metrics recorded.',
  'No training weights automatically promoted into development gameplay'],
 groups:focus.map(tier=>({tier,byPolicy:modes.map(mode=>{
  const sample=rows.filter(x=>x.tier===tier&&x.mode===mode),N=sample.length;
  return {mode,games:N,npcWins:sample.filter(x=>x.win).length,
   meanLP:Math.round(sample.reduce((s,x)=>s+x.lpMargin,0)/N),
   aceAttempted:sample.reduce((s,x)=>s+x.aceActions,0),
   aceConfirmed:sample.reduce((s,x)=>s+x.confirmedAceSummons,0),
   gamesWithConfirmedAce:sample.filter(x=>x.confirmedAceSummons>0).length,
   acePrepared:sample.filter(x=>x.prepped).length,
   fusions:sample.reduce((s,x)=>s+x.fusionActions,0),
   simulations:sample.reduce((s,x)=>s+x.branches,0)};
 })}))};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-real-boss-ace-v62.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_REAL_BOSS_ACE_V62 '+JSON.stringify(data));
