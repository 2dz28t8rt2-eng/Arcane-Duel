/* Arcane Duel v12.3 — gentle, narrowly scoped opponent IV adjustment.
 * Changes only IV's loaded NPC deck, never global card levels, user cards,
 * obtained inventory, normal/hard modifiers, rewards, other NPCs or ACE identity.
 * Four main-deck cards and one fusion template go down EXACTLY one level.
 */
'use strict';
(()=>{
 const parent=rpgEnemyLoadout, IV=4, needed={main:4,fusion:1};
 const count=(deck,id)=>deck.filter(n=>n===id).length;
 const valid=c=>!!c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.ace&&
   !c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&!c.essenceMonster&&
   !c.trainingReward&&!c.milestoneOnly&&!c.workshopOnly&&!c.hardOnly&&
   !c.hard;
 const choicesFor=(c,deck,difficulty)=>CARDS.filter(x=>valid(x)&&
   x.level===c.level-1&&!!x.fusionOnly===!!c.fusionOnly&&
   (!x.fusionOnly||x.level>=2)&&
   (x.source==null||x.source<0||x.source<=IV)&&
   (x.requiredTier==null||x.requiredTier<=IV)&&
   (difficulty==='hard'||!x.hard)&&count(deck,x.id)<3)
  .sort((a,b)=>{
   const value=x=>Number(x.role===c.role)*1000+
    Number(x.element===c.element)*200+Number(x.source===IV)*30+
    Math.round((x.atk+x.def)/50);
   return value(b)-value(a)||a.id-b.id;
  });
 function lower(deck,kind,difficulty,number,aceId){
  const details=[],indices=deck.map((id,i)=>({id,i,card:CARDS[id]}))
   .filter(x=>x.card?.level>=2&&x.id!==aceId&&
     (!x.card.fusionOnly||x.card.level>2))
   .sort((a,b)=>b.card.level-a.card.level||a.i-b.i);
  for(const slot of indices){
   if(details.length===number)break;
   const candidate=choicesFor(slot.card,deck,difficulty)[0];if(!candidate)continue;
   deck[slot.i]=candidate.id;
   details.push({from:slot.id,to:candidate.id,fromLevel:slot.card.level,toLevel:candidate.level,
     sameRole:slot.card.role===candidate.role,kind});
  }
  if(details.length!==number)throw Error('IV targeted card adjustment could only replace '+details.length+'/'+number+' '+kind+' cards');
  return {kind,requested:number,changed:details.length,details};
 }
 rpgEnemyLoadout=function(id,difficulty='easy',stage){
  const base=parent(id,difficulty,stage);
  if(id!==IV)return base;
  const main=[...base.deck],fusion=[...base.fusionDeck],
   ace=ACE_CARD_IDS[IV],beforeAce=count(main,ace)+count(fusion,ace);
  const modifications=[
   lower(main,'main',difficulty,needed.main,ace),
   lower(fusion,'fusion',difficulty,needed.fusion,ace)
  ];
  if(main.length!==40||fusion.length!==base.fusionDeck.length||
     count(main,ace)+count(fusion,ace)!==beforeAce||beforeAce!==1||
     main.some(cid=>!CARDS[cid]||CARDS[cid].fusionOnly)||
     fusion.some(cid=>!CARDS[cid]?.fusionOnly)||
     [...new Set(main)].some(cid=>count(main,cid)>3)||
     [...new Set(fusion)].some(cid=>count(fusion,cid)>3))
   throw Error('IV softened roster violates legal NPC deck rules');
  return {...base,deck:main,fusionDeck:fusion,roster123:modifications};
 };
 window.ArcaneOpponentIVBalance123=Object.freeze({
  version:'12.3.0',opponent:IV,mainDownOneLevel:needed.main,fusionsDownOneLevel:needed.fusion,
  ownAceCopies:1
 });
})();
