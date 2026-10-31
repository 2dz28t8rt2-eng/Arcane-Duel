'use strict';
/* Deterministic HTTP test double, never loaded by the game or deployed Edge function. */
const {randomUUID,randomBytes}=require('node:crypto');
const rules=require('../../assets/duo-shared-rules-v160.js');
const snapshot=require('../../assets/duo-card-catalog-v160.json');
const economy=require('../../assets/duo-economy-v172.js');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const secret=()=>randomBytes(32).toString('hex');
const copy=v=>structuredClone(v);
function fixture(){
 const profiles=new Map(),rooms=new Map();
 const result=p=>({profile:copy(p),economy:{packs:economy.PACKS,lv1:{},essence:{},maxCardLevel:3,maxChapter:1,maxSagaStage:0,rewards:economy.rewardTable()}});
 const build=p=>({name:p.nickname,deck:p.deck,fusions:p.fusions,upgrades:p.upgrades,enhancements:p.enhancements,essence:p.essenceBinding,lv1:p.lv1Research,portraitId:p.avatarId});
 function handle(b){
  if(b.type==='profileCreate'){
   const token=secret(),p={id:randomUUID(),nickname:b.name,avatarId:b.avatarId||'hero-01',revision:0,xp:0,level:1,essence:400,shards:10,wins:0,clearedChapters:[],ownedMain:[...snapshot.starterMain,0,1],ownedFusions:[...snapshot.starterFusions],deck:[...snapshot.starterMain],fusions:[...snapshot.starterFusions],upgrades:{},enhancements:{},essenceBinding:{},lv1Research:{},chapterCardCredits:0};
   profiles.set(token,p);return {profileToken:token,...result(p)};
  }
  const p=profiles.get(b.profileToken);
  if(['profile','profileName','upgrade','deckReplace'].includes(b.type)){
   if(!p)throw Error('Profil fehlt');
   if(b.type!=='profile'){
    if(b.expectedRevision!==p.revision)throw Error('Profil geändert');
    if(b.type==='profileName')p.nickname=b.name;
    if(b.type==='upgrade'){p.upgrades[b.key]=(p.upgrades[b.key]||0)+1;p.essence-=100;}
    if(b.type==='deckReplace')p[b.zone==='main'?'deck':'fusions'][b.slot]=b.cardId;
    p.revision++;
   }
   return result(p);
  }
  if(b.type==='create'){
   if(!p)throw Error('Profil fehlt');
   const id=randomUUID(),token=secret(),invite=secret(),g=rules.create({roomId:id,hostName:p.nickname,hostDeck:p.deck,hostFusions:p.fusions,enemyDeckA:p.deck,enemyDeckB:p.deck,enemyFusionsA:p.fusions,enemyFusionsB:p.fusions,catalog,randomSeed:221});
   rooms.set(id,{game:g,host:p,hostToken:token,invite});
   return {roomId:id,token,invite,seat:0,state:rules.view(g,0)};
  }
  const r=rooms.get(b.roomId);if(!r)throw Error('Raum fehlt');
  if(b.type==='invitePreview'){if(b.invite!==r.invite)throw Error('Einladung ungültig');return {inviterName:r.host.nickname,chapter:r.game.chapter};}
  if(b.type==='join'){
   if(!p||b.invite!==r.invite||r.guest)throw Error('Einladung ungültig');r.guest=p;r.guestToken=secret();
   r.game=rules.apply(r.game,2,{type:'join',...build(p),deferStart:true},{catalog});
   return {roomId:b.roomId,token:r.guestToken,seat:2,state:rules.view(r.game,2)};
  }
  const seat=b.token===r.hostToken||profiles.get(b.token)===r.host?0:b.token===r.guestToken||profiles.get(b.token)===r.guest?2:-1;
  if(seat<0)throw Error('Keine Berechtigung');
  if(b.type==='action'){
   if(b.expectedRevision!==r.game.revision)throw Error('Spielstand geändert. Bitte synchronisieren.');
   r.game=rules.apply(r.game,seat,b.action,{catalog,humanBuilds:{0:build(r.host),2:build(r.guest)}});
  }
  return {seat,state:rules.view(r.game,seat)};
 }
 return {handle,rooms,profiles};
}
module.exports={fixture};
