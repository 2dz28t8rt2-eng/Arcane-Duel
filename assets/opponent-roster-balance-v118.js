/* Arcane Duel v11.8 — targeted tournament roster balance.
 * Enemy loadout changes ONLY. Existing cards, ACE IDs, artwork, player rewards,
 * player progression, fusion rules, shop inventory and permanent saves remain untouched.
 * Normal and hard encounters keep their original power factor.
 */
'use strict';
(()=>{
 const previous=rpgEnemyLoadout;
 const ACE=ACE_CARD_IDS;
 const wanted={6:{main:5,fusions:3},10:{main:5,fusions:3}};
 const allowed=c=>!!c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.hard&&!c.ace&&
   !c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&!c.essenceMonster&&
   !c.trainingReward&&!c.milestoneOnly&&!c.hardOnly&&
   (c.requiredTier==null||c.requiredTier<=c.source+2);
 const copies=(deck,id)=>deck.filter(x=>x===id).length;
 const roleOf=c=>c?.role||'combatant';
 function pool(id,level,fusion,difficulty){
  return CARDS.filter(c=>allowed(c)&&c.level===level&&!!c.fusionOnly===fusion&&
   (c.source==null||c.source<0||c.source<=id)&&
   (difficulty==='hard'||!c.hard)&&(!fusion||c.level>=2))
   .sort((a,b)=>a.id-b.id);
 }
 function replaceOne(deck,index,opponentId,difficulty){
  const original=CARDS[deck[index]];
  if(!original||original.ace||original.level<2)return null;
  const candidates=pool(opponentId,original.level-1,!!original.fusionOnly,difficulty)
    .filter(c=>copies(deck,c.id)<3&&c.id!==deck[index]);
  if(!candidates.length)return null;
  candidates.sort((a,b)=>{
   const score=c=>{
    const sameRole=Number(roleOf(c)===roleOf(original));
    const sameElement=Number(c.element===original.element);
    const sameTheme=Number(c.source===opponentId);
    return sameRole*500+sameElement*120+sameTheme*35+c.level*10+
     Math.round((c.atk+c.def)/100);
   };
   return score(b)-score(a)||a.id-b.id;
  });
  const old=deck[index];deck[index]=candidates[0].id;
  return {from:old,to:candidates[0].id,fromLevel:original.level,toLevel:candidates[0].level};
 }
 function soften(id,deck,count,difficulty,kind){
  const max=Math.max(0,...deck.map(cid=>CARDS[cid]?.level||0));
  const aceId=ACE[id];
  // Only high-rank non-ACE cards may be softened, never an entire random
  // low-level core or an irreplaceable unique template.
  const choices=deck.map((cid,index)=>({cid,index,card:CARDS[cid]}))
   .filter(x=>x.card?.level===max&&x.cid!==aceId)
   .sort((a,b)=>b.card.level-a.card.level||
     (a.card.source===id?1:0)-(b.card.source===id?1:0)||a.index-b.index);
  let changed=0;const details=[];
  for(const choice of choices){
   if(changed>=count)break;
   const r=replaceOne(deck,choice.index,id,difficulty);
   if(r){changed++;details.push(r);}
  }
  return {kind,fromLevel:max,toLevel:max-1,requested:count,changed,details};
 }
 function elevateVII(load,difficulty){
  const id=7,aceId=ACE[id],ace=CARDS[aceId];
  if(!ace||!ace.fusionOnly||ace.level!==10)throw Error('VII ACE should be the unique Lv10 template');
  const stock=load.fusionDeck;
  // Preserve exactly one ACE, remove any other rank-10 copies left by an older
  // generic opponent loadout before promoting exactly two normal rank-10 templates.
  for(let i=stock.length-1;i>=0;i--)if(CARDS[stock[i]]?.level===10)stock.splice(i,1);
  stock.push(aceId);
  const candidates=pool(id,10,true,difficulty)
   .filter(c=>c.id!==aceId)
   .sort((a,b)=>{
     const priority=c=>(['guardian','soul'].includes(c.role)?1000:0)+
       (c.source===7?200:0)+(c.element==='WIND'?100:0)+
       Math.round((c.atk+c.def)/50);
     return priority(b)-priority(a)||a.id-b.id;
   });
  let added=0;
  for(const card of candidates){
   if(added>=2)break;
   if(copies(stock,card.id)>=3)continue;
   // Trade down a real Lv9-or-below fusion, maintain a fixed legal deck size.
   const index=stock.findIndex(cid=>cid!==aceId&&CARDS[cid]?.level<=9);
   if(index<0)break;
   stock[index]=card.id;added++;
  }
  const total=stock.filter(cid=>CARDS[cid]?.level===10).length;
  if(total!==3||copies(stock,aceId)!==1)throw Error('VII must have exactly three Lv10 fusions, including one ACE (got '+total+')');
  return {boss:7,rank10:total,aceCopies:1,nonAceRank10:2};
 }
 rpgEnemyLoadout=function(id,difficulty='easy',stage){
  const source=previous(id,difficulty,stage);
  if(![6,7,10].includes(id))return source;
  const load={...source,deck:[...source.deck],fusionDeck:[...source.fusionDeck]};
  const modifications=[];
  if(id===7)modifications.push(elevateVII(load,difficulty));
  else{
   modifications.push(soften(id,load.deck,wanted[id].main,difficulty,'main'));
   modifications.push(soften(id,load.fusionDeck,wanted[id].fusions,difficulty,'fusion'));
  }
  if(load.deck.length!==40||load.fusionDeck.length<2||load.fusionDeck.length>15||
     load.deck.some(cid=>!CARDS[cid]||CARDS[cid].fusionOnly)||
     load.fusionDeck.some(cid=>!CARDS[cid]?.fusionOnly)||
     [...new Set(load.deck)].some(cid=>copies(load.deck,cid)>3)||
     [...new Set(load.fusionDeck)].some(cid=>copies(load.fusionDeck,cid)>3)||
     (ACE[id]&&copies(load.fusionDeck,ACE[id])!==(id===7?1:copies(source.fusionDeck,ACE[id]))))
   throw Error('v11.8 tournament deck constraints violated for NPC '+id);
  return {...load,roster118:modifications};
 };
 window.ArcaneRosterBalance118=Object.freeze({
  version:'11.8.0',
  targets:Object.freeze({
   6:Object.freeze({...wanted[6]}),
   7:Object.freeze({level10:3,ace:1,nonAce:2}),
   10:Object.freeze({...wanted[10]})
  })
 });
})();
