/* Arcane Duel v12.8 — Gegner X balance adjustment only.
 * Effective loadout power = 1.0 (including hard); exact five existing non-ACE
 * Lv10 deck copies are replaced by existing, eligible Lv9 card copies.
 * Other bosses and all global card data remain completely untouched.
 */
'use strict';
(()=>{
 const original=rpgEnemyLoadout,X=10,required=5;
 const count=(deck,id)=>deck.filter(v=>v===id).length;
 const allowed=c=>!!c&&c.rpg&&!c.retired&&!c.ace&&!c.enemyOnly&&
  !c.hard&&!c.hardOnly&&!c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&
  !c.essenceMonster&&!c.trainingReward&&!c.milestoneOnly&&
  !c.workshopOnly&&(c.source==null||c.source<0||c.source<=X)&&
  (c.requiredTier==null||c.requiredTier<=X);
 const rank=(candidate,previous)=>Number(candidate.role===previous.role)*10000+
  Number(candidate.element===previous.element)*1500+
  Number(candidate.source===X)*250+
  Math.round((candidate.atk+candidate.def)/100);
 function replace(deck,kind,aceId,max,changes){
  for(let i=0;i<deck.length&&changes.length<required&&max>0;i++){
   const old=CARDS[deck[i]];
   if(!old||old.level!==10||old.ace||old.id===aceId)continue;
   const candidates=CARDS.filter(c=>allowed(c)&&c.level===9&&
    !!c.fusionOnly===!!old.fusionOnly&&
    c.id!==aceId&&count(deck,c.id)<3)
    .sort((a,b)=>rank(b,old)-rank(a,old)||a.id-b.id);
   const next=candidates[0];
   if(!next)continue;
   deck[i]=next.id;
   changes.push({kind,index:i,from:old.id,to:next.id,fromLevel:10,
    toLevel:9,sameRole:next.role===old.role});
   max--;
  }
 }
 rpgEnemyLoadout=function(id,difficulty='easy',stage){
  const base=original(id,difficulty,stage);
  if(id!==X)return base;
  // In tests ONLY we may isolate the effect of setting power to 1.
  // This never alters production behavior or saves.
  const mode=window.__arcaneX128Mode||'full';
  if(mode==='off')return base;
  if(mode!=='full'&&mode!=='power-only')throw Error('Invalid X v12.8 mode');
  const main=[...base.deck],fusion=[...base.fusionDeck],
   ace=ACE_CARD_IDS[X],changes=[];
  if(mode==='full'){
   // Target three normal and two fusion Lv10 slots first; if a particular
   // kind cannot supply enough, fill from the other kind without weakening ACE.
   replace(main,'main',ace,3,changes);
   const fusionLimit=Math.min(required-changes.length,2);
   replace(fusion,'fusion',ace,fusionLimit,changes);
   if(changes.length<required)replace(main,'main',ace,required-changes.length,changes);
   if(changes.length<required)replace(fusion,'fusion',ace,required-changes.length,changes);
   if(changes.length!==required)throw Error('X v12.8 can replace only '+changes.length+' / '+required+' Lv10 slots');
  }
  const validDeck=(deck,fusionOnly)=>deck.every(cid=>CARDS[cid]&&!!CARDS[cid].fusionOnly===fusionOnly)&&
   [...new Set(deck)].every(cid=>count(deck,cid)<=3);
  if(main.length!==40||fusion.length!==base.fusionDeck.length||
   !validDeck(main,false)||!validDeck(fusion,true)||
   count(main,ace)+count(fusion,ace)!==1)
   throw Error('X v12.8 illegal main, fusion or ACE identity');
  return {...base,deck:main,fusionDeck:fusion,power:1,
   roster128:{mode,previousPower:base.power,effectivePower:1,
    replaced:changes.length,changes}};
 };
 window.ArcaneBossXBalance128=Object.freeze({version:'12.8.0',
   effectivePower:1,replacedLevel10:required,replacementLevel:9,acePreserved:true});
})();
