/* A finite reward for a manual win without an executed monster attack.
 * Counts actions, not damage: misses, immunity and losing attacks also count.
 * Passive Soulbrand, counterstrikes and discharge remain allowed. */
'use strict';
(()=>{
 const validCounts=value=>Array.isArray(value)&&value.length===2&&value.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000);
 const oldCreate=createGame,oldSnapshot=validateDuelSnapshot,oldAttack=attack,oldReward=rewardMatch;
 createGame=function(...args){const g=oldCreate(...args);g.executedAttacks=[0,0];return g;};
 validateDuelSnapshot=function(raw){
  const g=oldSnapshot(raw);
  if(raw.executedAttacks!==undefined){
   if(!validCounts(raw.executedAttacks))throw Error('Ungültige Angriffsstatistik.');
   g.executedAttacks=[...raw.executedAttacks];
  }else delete g.executedAttacks; // Earlier duels have no complete attack history.
  return g;
 };
 attack=function(g,...args){
  const owner=g.active,result=oldAttack(g,...args);
  if(result&&Array.isArray(g.executedAttacks))g.executedAttacks[owner]=Math.min(1000000,g.executedAttacks[owner]+1);
  return result;
 };
 function bonusFor(g){
  if(g.mode!=='pve'||g.winner!==0||g.surrendered||g.showcase||g.evolutionMode||g.lessonId||g.essenceTrial||
   !['free','tournament','encounter','challenge'].includes(g.context)||g.executedAttacks?.[0]!==0)return 0;
  const o=OPPONENTS[g.opponentId];if(!o)return 0;
  let base=Math.floor(o.coins*(g.difficulty==='hard'?1.6:1)*(1+.05*(profile.upgrades.loot||0)));
  if(g.context==='encounter')base+=Math.floor(base*.25);
  return Math.floor(base*.1);
 }
 rewardMatch=function(g){
  const result=oldReward(g);if(!result||storageConflict||result.noReward||result.pvp||result.evolution||result.lesson)return result;
  const bonus=Math.min(Math.max(0,1e9-profile.coins),bonusFor(g));
  if(bonus>0){
   profile.coins+=bonus;result.coins+=bonus;result.noAttackBonus=bonus;g.noAttackBonus=bonus;
   if(profile.history[0])profile.history[0].coins+=bonus;
   saveProfile();
  }
  return result;
 };
 try{const raw=JSON.parse(window.localStorage.getItem(SAVE_KEY)||'null');
  if(profile.activeDuel&&raw?.activeDuel?.id===profile.activeDuel.id&&validCounts(raw.activeDuel.executedAttacks))profile.activeDuel.executedAttacks=[...raw.activeDuel.executedAttacks];
 }catch(error){}
 window.ArcaneDuelMerit=Object.freeze({version:'4.1.0',bonusFor});
})();
