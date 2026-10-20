/* Arcane Duel – economy/roles rebalance v10.9.
 * Loaded AFTER existing gameplay modules. Preserves the original resolver and
 * v3 save format while migrating new optional profile properties safely.
 */
(function(){
'use strict';
const int=(x,max=1e9)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
const safeSeals=p=>int(p?.boosterSeals)?p.boosterSeals:0;
const perkRanks=['grosswildjaeger','kolossenkraft','schwarminstinkt'];
const perkSpecs={
 grosswildjaeger:{name:'Großwildjäger',desc:'Höherstufige noch unentdeckte normale Monster werden bei regulären Kartenfunden deutlich bevorzugt. Bereits bekannte hochwertige Monster erhalten einen kleineren Bonus. Nur freigeschaltete Drops.',base:260,max:3},
 kolossenkraft:{name:'Kolossenkraft',desc:'Nur normale Monster der Stufen 6–10: je Rang +8 ATK und +8 DEF pro Stufe über 5. Keine Fusionen oder ACE-Monster.',base:350,max:3},
 schwarminstinkt:{name:'Schwarminstinkt',desc:'Fusionen mit 2–5 Materialmonstern der Stufen 1–5: je Rang +1,5 % ATK/DEF (bei mindestens 3 passenden Materialien +2 %, bei mindestens 5 +2,5 %). Maximal +7,5 %. Keine neuen Würfe, keine stärkeren ACE-Drops.',base:320,max:3}
};
Object.assign(UPGRADES,perkSpecs);
function hydrate(p,raw=p){
 if(!p||typeof p!=='object')return p;
 if(raw?.boosterSeals!==undefined&&!int(raw.boosterSeals))
  throw Error('Ungültiger Booster-Siegel-Bestand.');
 p.boosterSeals=raw?.boosterSeals??0;
 const first=[...(raw?.unlocked||[]),...(raw?.fusionOwned||[])];
 const discovered=raw?.discoveredCards;
 if(discovered!==undefined&&(!Array.isArray(discovered)||discovered.length>20000||
  discovered.some(id=>!Number.isInteger(id)||id<0||!CARDS[id])))
  throw Error('Ungültiger Entdeckungsverlauf.');
 p.discoveredCards=[...new Set(discovered||first)].filter(id=>!!CARDS[id]);
 p.upgrades=p.upgrades||{};
 for(const key of perkRanks){
  const val=raw?.upgrades?.[key]??0;
  if(!int(val,UPGRADES[key].max))throw Error('Ungültiger Perkrang: '+key);
  p.upgrades[key]=val;
 }
 return p;
}
const originalFresh=freshProfile,originalValidate=validateProfile,originalAdd=addCard;
freshProfile=function(){return hydrate(originalFresh());};
validateProfile=function(raw){
 if(!raw||typeof raw!=='object')return originalValidate(raw);
 // Core profile compatibility: new upgrade keys were not part of historical
 // required fields. Provide zero-ranked defaults *only for core validation*.
 const projected={...raw,upgrades:{...(raw.upgrades||{})}};
 for(const key of perkRanks)if(projected.upgrades[key]===undefined)projected.upgrades[key]=0;
 return hydrate(originalValidate(projected),raw);
};
try{
 const stored=lastStoredProfile?JSON.parse(lastStoredProfile):{};
 hydrate(profile,stored);
}catch(error){
 // Existing saves are never deleted or rewritten on migration failure.
 // The player can export or restore; avoid applying malformed currency data.
 console.warn('Booster-Siegel-Migration abgebrochen:',error);
 profile.boosterSeals=0;
 profile.discoveredCards=[...new Set([...profile.unlocked,...profile.fusionOwned])];
 for(const key of perkRanks)profile.upgrades[key]=0;
}
addCard=function(id){
 const had=originalAdd(id);
 if(!profile.discoveredCards.includes(id))profile.discoveredCards.push(id);
 return had;
};
// One shared card-exchange action: both historical Sell and Salvage now award
// essence, not shards. Keep card-copy/favorite/equipped protection in both UIs.
const originalSell=sellCard;
salvageCard=function(id){return originalSell(id);};
showSalvage=function(id){
 openModal(modalHtml('KARTE IN ESSENZ UMWANDELN',CARDS[id].name,'✦',
  'Dieses überschüssige Exemplar wird aus deiner Sammlung entfernt. Ausgerüstete und geschützte Karten bleiben erhalten.',
  '<p>Ertrag: <b>'+sellPrice(id)+' Essenz</b>. Splitter verdienst du künftig etwas häufiger direkt im Duell.</p>',
  '<button class="btn" id="salvageCancel">ABBRECHEN</button><button class="btn" id="salvageConfirm">UMWANDELN</button>'));
 $('salvageCancel').onclick=hideModal;
 $('salvageConfirm').onclick=()=>{
  if($('salvageConfirm').disabled)return;
  $('salvageConfirm').disabled=true;
  if(salvageCard(id)){hideModal();renderMenu();}
  else $('salvageConfirm').disabled=false;
 };
};
// Normal booster prices now use Booster-Siegel; affordable from actual wins.
const sealPrices={1:2,3:5,5:8,10:14};
boosterPrice=function(tier=highestCleared(),count=10){
 return sealPrices[count]??Infinity;
};
buyBooster=function(count=10){
 if(![1,3,5,10].includes(count)||storageConflict||profile.rewardQueue.length||
    profile.shardResearch||profile.openPack||safeSeals(profile)<boosterPrice(highestCleared(),count))
  return false;
 const tier=highestCleared();
 const cards=rollBooster(tier,{seed:rng(0xffffffff)||1},count);
 profile.boosterSeals-=boosterPrice(tier,count);
 cards.forEach(addCard);
 profile.lastBooster={tier,cards,rerolled:false};
 saveProfile();
 return true;
};
// Explicitly keep the original real-game reward call (including anti-double-
// claim ledger) and only then issue independently capped currency/shards.
const originalReward=rewardMatch;
rewardMatch=function(g){
 const ret=originalReward(g);
 if(!ret||ret.pvp||ret.surrendered||!g||g.mode!=='pve')return ret;
 if(g.winner===0){
  const first=ret.first===true,automatic=g.context==='auto';
  const seals=(automatic?1:2)+(first?5:0);
  profile.boosterSeals=Math.min(1e9,safeSeals(profile)+seals);
  // Salvaging no longer grants shards: small +1 manual / occasional auto
  // and +2 first clear, preserving old win ratio and shared-shard logic.
  const shards=(automatic?(g.boosted?1:0):1)+(first?2:0);
  if(shards){
   const source=Math.max(0,Math.min(10,g.opponentId||0));
   profile.shards[source]=Math.min(1e9,profile.shards[source]+shards);
   if(ret.loot)ret.loot.shards+=shards;
  }
  ret.boosterSeals=seals;
  ret.extraShards=shards;
  saveProfile();
 }
 return ret;
};
const originalRoleBonus=normalRoleBonus;
normalRoleBonus=function(c,stat,owner=0,upgrades=profile?.upgrades){
 const prior=originalRoleBonus(c,stat,owner,upgrades);
 if(owner!==0||!c||c.fusionOnly||c.ace||c.essenceMonster||!c.rpg||c.level<6)
  return prior;
 return prior+(upgrades?.kolossenkraft||0)*8*(Math.min(10,c.level)-5);
};
// Level-gated quality on actually performed legal low-level material
// combinations only; no additional templates, material copies or RNG rolls.
const originalFused=fusedInstance;
fusedInstance=function(g,instances,levels){
 const out=originalFused(g,instances,levels);
 if(!out||g.mode!=='pve'||g.active!==0||!Array.isArray(levels))return out;
 const rank=profile.upgrades.schwarminstinkt||0;
 if(!rank||levels.length<2||levels.length>5||!levels.every(l=>l>=1&&l<=5)||
    !out.card)return out;
 const bonus=Math.min(.075,rank*(levels.length>=5?.025:levels.length>=3?.02:.015));
 out.card.atk=round10(out.card.atk*(1+bonus));
 out.card.def=round10(out.card.def*(1+bonus));
 out.swarmInstinctBonus=bonus;
 return out;
};
// Dynamically favor higher NORMAL monster levels, never new card tiers,
// rare drop slots, ACEs, or the original win/drop probability.
const originalDrawLoot=drawLoot;
function eligibleNormalDrop(id,tier){
 const c=CARDS[id];
 return !!(c&&c.rpg&&!c.fusionOnly&&!c.ace&&!c.milestoneOnly&&!c.questOnly&&
  !c.enemyOnly&&!c.trainingReward&&!c.workshopOnly&&!c.fateOnly&&
  (c.requiredTier==null||c.requiredTier<=tier)&&
  (c.source==null||c.source<0||c.source<=tier));
}
drawLoot=function(g,source,difficulty='easy',pack=false){
 const original=originalDrawLoot(g,source,difficulty,pack);
 const originalCard=CARDS[original],tier=highestCleared();
 if(!originalCard||originalCard.fusionOnly||originalCard.ace||pack||tier<2)
  return original;
 const pool=lootPool(source,difficulty).filter(id=>eligibleNormalDrop(id,tier));
 if(!pool.length)return original;
 const wild=Math.max(0,Math.min(3,profile.upgrades.grosswildjaeger||0));
 const high=Math.min(10,Math.max(2,tier+1));
 const weights=pool.map(id=>{
  const c=CARDS[id],advantage=Math.max(0,c.level-2);
  const gated=1+advantage*Math.min(.16,.025*tier);
  const notable=c.level>=Math.max(4,high-2);
  const known=profile.discoveredCards.includes(id);
  const discovery=notable?(1+wild*(known?.11:.40)):1;
  return Math.max(1,Math.round(gated*discovery*1000));
 });
 const total=weights.reduce((a,b)=>a+b,0);
 let roll=randomInt(g,total);
 for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<0)return pool[i];}
 return pool.at(-1);
};
// UI overlays: core shop + already-registered extension market. Replacements
// are wording-only; actual purchase path validates Booster-Siegel separately.
const originalHud=renderHud;
renderHud=function(){
 originalHud();
 const hud=$('profileHud');
 if(hud)hud.insertAdjacentHTML('beforeend',
  '<span title="Verdient durch gewonnene Duelle; für normale und Fusionsbooster.">◈ <b>'+
  fmt(safeSeals(profile))+'</b> Booster-Siegel</span>');
};
const originalShop=shopMarkup;
shopMarkup=function(){
 return originalShop().replaceAll(' Essenz/Karte',' Siegel/Karte')
  .replaceAll(' Essenz</b><br><small>',' Siegel</b><br><small>')
  .replace('Kartenspürsinn erhöht','Kartenspürsinn erhöht')
  .replace('Booster-Shop</h2>','Booster-Shop</h2><p>◈ '+fmt(safeSeals(profile))+
   ' Booster-Siegel verfügbar. Siege in echten Duellen bringen neue Siegel.</p>');
};
const originalMenu=menuAction;
menuAction=function(d){
 if(d.action==='booster'&&safeSeals(profile)<boosterPrice(highestCleared(),Number(d.count||10))){
  toast('Zu wenig Booster-Siegel. Gewinne freie Duelle oder Turniersiege.');
  return;
 }
 return originalMenu(d);
};
window.ArcaneBalanceV109={
 sealPrices,perkSpecs,
 normalPackCount:()=>[1,3,5,10],
 getSeals:()=>safeSeals(profile),
 validate:()=>validateProfile(JSON.parse(JSON.stringify(profile)))
};
})();