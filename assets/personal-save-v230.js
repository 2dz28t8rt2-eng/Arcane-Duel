/* The singleplayer save is the sole personal source of truth in both modes. */
'use strict';
(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const previousValidate=validateProfile;
 validateProfile=function(raw){
  const p=previousValidate(raw);
  if(raw?.extras230)p.extras230=window.ArcaneCompleteBackup155.validateExtras(raw.extras230);
  if(raw?.onlineLegacy230){
   const credits=raw.onlineLegacy230.chapterCardCredits;
   if(!Number.isSafeInteger(credits)||credits<0||credits>1e9)throw Error('Ungültiges Guthaben aus dem bisherigen Online-Profil.');
   p.onlineLegacy230={chapterCardCredits:credits};
  }
  return p;
 };
 function fromLegacy(old){
  const p=freshProfile();
  p.duelistName=old.nickname;p.avatarId=old.avatar_id;
  p.xp=old.xp;p.coins=old.essence;p.wins=old.wins;
  p.shards=Array(11).fill(0);p.shards[0]=old.shards;
  p.cleared=(old.cleared_chapters||[]).filter(n=>n>=1&&n<=10);
  p.inventory={};for(const id of [...old.owned_main,...old.owned_fusions])p.inventory[id]=(p.inventory[id]||0)+1;
  p.unlocked=Object.keys(p.inventory).map(Number).filter(id=>!CARDS[id]?.fusionOnly);
  p.fusionOwned=Object.keys(p.inventory).map(Number).filter(id=>CARDS[id]?.fusionOnly);
  p.activeDeck=[...old.deck];p.fusionDeck=[...old.fusions];
  p.activeSlot=old.active_deck_slot||0;
  p.slots=old.deck_slots?.length===3?copy(old.deck_slots):Array.from({length:3},(_,i)=>({name:'Deck '+(i+1),main:[...p.activeDeck],fusion:[...p.fusionDeck]}));
  for(const key of Object.keys(p.upgrades))if(Number.isInteger(old.upgrades?.[key]))p.upgrades[key]=old.upgrades[key];
  p.enhancements=copy(old.enhancements||{});
  const e=old.essence_binding||{};
  if(e.chosen!=null)p.essence={...p.essence,intro:3,chosen:e.chosen,school:e.school,rank:e.rank||0};
  const stage=Math.max(0,...(old.cleared_chapters||[]).filter(n=>n>=11).map(n=>n-10));
  p.lv1Saga={...p.lv1Saga,offered:stage>0,met:stage>0,stage,perk:old.lv1_research?.perk===true,skillRank:old.lv1_research?.rank||0};
  p.onlineLegacy230={chapterCardCredits:old.chapter_card_credits||0};
  return validateProfile(p);
 }
 function loadout(raw){
  const p=validateProfile(raw),tier=Math.max(0,...p.cleared),inventory=p.inventory;
  // Combat-only projection: economic upgrades remain in the original save.
  const combatKeys=window.ArcaneDuoRules.PERK_LIMITS;
  const upgrades=Object.fromEntries(Object.keys(combatKeys).map(k=>[k,p.upgrades[k]||0]));
  const present=p.essence?.chosen!=null&&p.activeDeck.includes(p.essence.chosen);
  const saga=p.lv1Saga||{};
  return {nickname:p.duelistName||'Duellant',avatar_id:p.avatarId||'hero-01',xp:p.xp,essence:p.coins,
   shards:p.shards.reduce((n,x)=>n+x,0),wins:p.wins,
   cleared_chapters:[...p.cleared,...Array.from({length:saga.stage||0},(_,i)=>11+i)],
   owned_main:Object.entries(inventory).flatMap(([id,n])=>CARDS[id]?.fusionOnly?[]:Array(Math.min(n,3)).fill(Number(id))),
   owned_fusions:Object.entries(inventory).flatMap(([id,n])=>CARDS[id]?.fusionOnly?Array(Math.min(n,3)).fill(Number(id)):[]),
   deck:[...p.activeDeck],fusions:[...p.fusionDeck],deck_slots:copy(p.slots),active_deck_slot:p.activeSlot,
   upgrades,enhancements:copy(p.enhancements),
   essence_binding:present?{chosen:p.essence.chosen,school:p.essence.school,tier,rank:p.essence.rank}: {},
   lv1_research:{perk:!!saga.perk,rank:saga.perk?Math.max(1,saga.skillRank||0):0},
   chapter_card_credits:p.onlineLegacy230?.chapterCardCredits||0};
 }
 function award({save,state,seat,room}){
  for(const key of Object.keys(window.ArcaneCompleteBackup155.makeBackup().extras))localStorage.removeItem(key);
  for(const [key,value]of Object.entries(save.extras230||{}))localStorage.setItem(key,JSON.stringify(value));
  profile=validateProfile(save);storageConflict=false;storageWritable=true;
  lastStoredProfile=localStorage.getItem(SAVE_KEY);
  const p=state.players[seat],chapter=state.chapter;
  const g=createGame({mode:'pve',opponentId:Math.min(10,chapter),context:'tournament',deck:profile.activeDeck,fusionDeck:profile.fusionDeck});
  g.id='online-'+room+'-'+state.duelNo;g.winner=state.winner;g.turn=state.turn+1;
  g.maxLP=state.maxLP||state.teams[0].maxLP||window.ArcaneDuoRules.duoStartingLp(chapter);
  for(const side of [0,1]){g.players[side].lp=state.teams[side].lp;g.players[side].shield=state.teams[side].shield||0;}
  g.surrendered=state.surrenderedBy!=null;g.log=state.log.slice(-80);g.totalFusions=[p.fusionsPerformed||0,0];
  const metrics=p.soloMetrics;
  if(metrics){g.executedAttacks=[metrics.attacks,0];g.damageDealt=[metrics.damage,0];g.evoStats={normalDamage:metrics.normalDamage,combos:metrics.combos,five:metrics.five,materialsMax:metrics.materialsMax};}
  else delete g.executedAttacks; // Historical rooms have no reliable action history.
  g.essenceTurns=metrics?.essenceTurns||0;g.essenceKills=metrics?.kills||0;
  g.essenceParticipated=p.essence?.chosen!=null;
  if(chapter>=11){
   g.context='free';g.lv1Saga={stage:chapter-10};
   g.lv1SagaProgress=copy(state.questProgress||{floating:0,swarm:0,special:0});
  }
  const reward=rewardMatch(g);profile.activeDuel=save.activeDuel||null;profile.extras230=window.ArcaneCompleteBackup155.makeBackup().extras;
  return {save:validateProfile(profile),reward};
 }
 function claimLegacyCard({save,id}){
  const p=validateProfile(save);if(!(p.onlineLegacy230?.chapterCardCredits>0)||!CARDS[id]||CARDS[id].fusionOnly)throw Error('Keine offene Kapitelbelohnung.');
  p.onlineLegacy230.chapterCardCredits--;p.inventory[id]=(p.inventory[id]||0)+1;
  if(!p.unlocked.includes(id))p.unlocked.push(id);if(!p.unseen.includes(id))p.unseen.push(id);return validateProfile(p);
 }
 window.ArcanePersonalSave230=Object.freeze({fromLegacy,loadout,award,claimLegacyCard});
})();
