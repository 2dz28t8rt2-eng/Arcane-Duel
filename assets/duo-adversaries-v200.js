/* Independent 2v2 encounters v20.0. Keep the identical module bundled with
 * the Supabase Edge Function: client choices never supply enemy cards. */
(function(root,factory){
 const result=factory();
 if(typeof module==='object'&&module.exports)module.exports=result;
 if(root)root.ArcaneDuoAdversaries200=result;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const LEVELS=[2,4,6,8,8,9,9,10,10,10];
 const isQuest=chapter=>Number.isInteger(chapter)&&chapter>=11&&chapter<=15;
 const duplicateTwenty=ids=>ids.slice(0,20).flatMap(id=>[id,id]);
 const strength=c=>Math.max(c.atk||0,c.def||0)+Math.min(c.atk||0,c.def||0)*.35;
 const allowed=c=>c.playable===true&&!c.fusionOnly&&!c.ace&&!c.essenceMonster;
 function ranked(cards,chapter,seat){
  const cap=LEVELS[chapter-1];
  return cards.filter(c=>allowed(c)&&c.level<=cap&&c.level>=Math.max(1,cap-3)&&
   (c.source===null||c.source<=chapter+2))
   .sort((a,b)=>Math.abs(cap-a.level)*300-Math.abs(cap-b.level)*300||
    strength(b)-strength(a)||a.id-b.id);
 }
 function bosses(cards,seat){
  const pool=cards.filter(c=>allowed(c)&&c.level>=8&&c.level<=10&&
   typeof c.art==='string'&&c.art.startsWith('assets/')&&!c.art.includes('placeholder'));
  // Eiman: guardians, soul control and balanced heavy hitters.
  // Hans: predator pressure, resonators and burst. Both have the same level
  // distribution and the same 1.13 combat multiplier in the reducer.
  const styles=seat===1?{
   10:['guardian','guardian','guardian','soul','soul','soul',
    'combatant','combatant','predator','soul'],
   9:['guardian','guardian','soul','combatant','soul'],
   8:['guardian','soul','combatant','combatant','predator']
  }:{
   10:['predator','predator','predator','predator','combatant','combatant',
    'soul','guardian','guardian','soul'],
   9:['predator','predator','combatant','soul','soul'],
   8:['predator','combatant','combatant','soul','guardian']
  };
  const picked=[];
  for(const level of [10,9,8]){
   for(const role of styles[level]){
    const card=pool.filter(c=>c.level===level&&c.role===role&&!picked.includes(c.id))
     .sort((a,b)=>strength(b)-strength(a)||a.id-b.id)[0];
    if(!card)throw Error('Nicht genug illustrierte '+role+'-Bossmonster auf Level '+level+'.');
    picked.push(card.id);
   }
  }
  if(picked.length!==20||new Set(picked).size!==20)
   throw Error('Unvollständiges Bossdeck für den 2v2-Endkampf.');
  return duplicateTwenty(picked);
 }
 function fanatic(cards,stage,seat){
  const specs=[null,{cap:1,l1:20},{cap:2,l1:16},{cap:4,l1:14},
   {cap:5,l1:5},{cap:7,l1:0}];
  const spec=specs[stage],normals=cards.filter(allowed),picked=[];
  const take=(pool,n)=>{
   for(const c of pool.sort((a,b)=>strength(b)-strength(a)||a.id-b.id)){
    if(picked.length>=20||n<=0)break;
    if(!picked.includes(c.id)){picked.push(c.id);n--;}
   }
  };
  take(normals.filter(c=>c.level===1),spec.l1);
  take(normals.filter(c=>c.level<=spec.cap&&c.level>=Math.max(2,spec.cap-1)),20-picked.length);
  take(normals.filter(c=>c.level<=spec.cap),20-picked.length);
  if(picked.length!==20)throw Error('Nicht genug Karten für Fanatiker-Prüfung.');
  const result=duplicateTwenty(picked);
  if(seat===1&&stage<5){
   // Lumira appears in the first four battles; the last opens after her fall.
   result[0]=714;
  }
  return result;
 }
 const soloEntry=(chapter,solo)=>!solo?null:
  chapter>=11&&chapter<=15?solo.saga?.[chapter-11]:
  chapter>=1&&chapter<=10?(chapter===10?solo.showcase:solo.roster?.[chapter-1]):null;
 const mirrorOrder=deck=>deck.map((_,i)=>deck[(i+Math.floor(deck.length/2))%deck.length]);
 function enemyDeck(chapter,seat,cards,starter,solo=null){
  const original=soloEntry(chapter,solo);
  if(original){
   // Both opponents get EXACTLY the original solo card multiset. Only the
   // second duellant's draw order changes so the two hands are independent.
   return seat===1?[...original.deck]:mirrorOrder(original.deck);
  }
  if(chapter===1)return [...starter];
  if(chapter===10)return bosses(cards,seat);
  if(isQuest(chapter))return fanatic(cards,chapter-10,seat);
  if(!(chapter>=2&&chapter<=9))throw Error('Unbekanntes Gegnerkapitel.');
  const options=ranked(cards,chapter,seat);
  const preferred=seat===1?['guardian','soul']:['predator','resonator'];
  options.sort((a,b)=>{
   const weight=c=>strength(c)+(preferred.includes(c.role)?130:0);
   return Math.abs(LEVELS[chapter-1]-a.level)*350-
    Math.abs(LEVELS[chapter-1]-b.level)*350||weight(b)-weight(a)||a.id-b.id;
  });
  const unique=options.slice(0,20).map(c=>c.id);
  return unique.length===20?duplicateTwenty(unique):[...starter];
 }
 function enemyFusions(chapter,cards,solo=null){
  const original=soloEntry(chapter,solo);
  if(original)return [...original.fusions];
  const cap=isQuest(chapter)?Math.max(2,[1,2,4,5,7][chapter-11]):
   [3,5,7,10,10,10,10,10,10,10][chapter-1];
  const pool=cards.filter(c=>c.playable&&c.fusionOnly&&c.level<=cap&&
   (isQuest(chapter)?c.level>=1:c.level>=2))
   .sort((a,b)=>b.level-a.level||a.id-b.id);
  return pool.slice(0,Math.min(15,pool.length)).map(c=>c.id);
 }
 function enemyPower(chapter,solo=null){return soloEntry(chapter,solo)?.power||1;}
 function enemyNames(chapter,solo=null){
  const original=soloEntry(chapter,solo);
  if(chapter===10)return ['Eiman Huel Stalker','Hans Ess Kirk'];
  if(isQuest(chapter))return ['Der Level-1-Fanatiker','Fanatikers Adept'];
  return original?[original.name,'Verbündeter von '+original.name]:
   ['Gegner A','Gegner B'];
 }
 return Object.freeze({LEVELS,isQuest,enemyDeck,enemyFusions,enemyPower,enemyNames});
});
