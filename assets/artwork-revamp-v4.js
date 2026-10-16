/* Arcane Duel · 4.0 Art Wave 01
 * Ten original illustrations from the approved image-composition.
 * Presentation ONLY: stable card IDs, rarity, class, mechanics, elements,
 * levels, dice, stats, collection and saved duel ownership do not change.
 */
'use strict';
(()=>{
 const tier=level=>level<=2?'initiate':level<=5?'adept':level<=7?'elite':level<=9?'mythic':'sovereign';
 const family=card=>card.essenceMonster?'essence':card.ace?'ace':card.fusionOnly?'fusion':'base';
 const key=card=>family(card)+'/'+tier(Number(card.level)||1)+'/'+String(card.id).padStart(4,'0');
 const overlay=Object.create(null);
 const sourceRoot='assets/artworks/wave01/';
 const wave=Object.freeze([
  {key:'ascheling',name:'Ascheling',desc:'Ein kleiner Geist aus Asche, der selbst in den tiefsten Ruinen weiterglimmt.',select:'starter-fire',element:'FEUER'},
  {key:'schattenwolf',name:'Schattenwolf',desc:'Ein Rudeljäger, der lautlos durch die Zwischenwelt streift.',select:'workshop-schattenwolf',element:'DUNKEL'},
  {key:'kristallgolem',name:'Kristallgolem',desc:'Ein uralter Wächter, in dessen Körper die Kraft vergessener Kristalle pulsiert.',select:'workshop-kristallgolem',element:'ERDE'},
  {key:'nebelwisp',name:'Nebelwisp',desc:'Ein rastloser Geist, der Erinnerungen verschlingt und in Nebel verwandelt.',select:'workshop-nebelwisp',element:'WASSER'},
  {key:'dornenschlund',name:'Dornenschlund',desc:'Ein unersättlicher Pflanzenjäger, der tief im verwunschenen Hain lauert.',select:'earth-five',element:'ERDE'},
  {key:'seelenspalter',name:'Seelenspalter',desc:'Eine verbotene Fusion, die Seelen zerreißt und ihre Kraft für sich nutzt.',select:'fusion-six',element:'DUNKEL'},
  {key:'runenbrut-koloss',name:'Runenbrut-Koloss',desc:'Ein aus uralten Runen und Stein geformter Koloss, der ganze Berge erschüttern kann.',select:'fusion-seven',element:'ERDE'},
  {key:'blutkrone',name:'Blutkrone der Verdammnis',desc:'Eine Fusion aus unzähligen Seelen, die nach ewiger Herrschaft strebt.',select:'fusion-eight',element:'FEUER'},
  {key:'aetherwyrm',name:'Ätherwyrm der Kronen',desc:'Ein uralter Himmelsdrache, der über die Grenzen der Welten wacht.',select:'astral-ace',element:'LICHT'},
  {key:'essenz-unendlichkeit',name:'Essenz der Unendlichkeit',desc:'Ein Wesen jenseits der Zeit, geboren aus reiner arkaner Essenz.',select:'essence-fusion',element:'LICHT'}
 ]);
 function resolve(card){
  if(!card||!Number.isInteger(card.id))return null;
  const value=overlay[card.id];if(!value)return null;
  return {id:card.id,art:value.art,name:value.name,family:family(card),
   tier:tier(Number(card.level)||1),wave:'01'};
 }
 function audit(catalog){
  const rows=catalog.filter(card=>card&&Number.isInteger(card.id));
  const duplicates=rows.length-new Set(rows.map(card=>card.id)).size;
  return {count:rows.length,duplicates,
   missingLevel:rows.filter(card=>!Number.isInteger(card.level)||card.level<1).map(card=>card.id),
   status:duplicates===0?'ready':'duplicate IDs',
   categories:['base','fusion','essence','ace'],
   tiers:['initiate','adept','elite','mythic','sovereign']};
 }
 function candidates(){
  if(typeof CARDS==='undefined'||!Array.isArray(CARDS))return [];
  const playable=CARDS.filter(c=>c&&c.rpg&&!c.retired);
  return playable;
 }
 function pick(select,used){
  const rows=candidates().filter(c=>!used.has(c.id));
  const workshop=(name,level)=>rows.find(c=>c.name===name&&c.level===level&&!c.ace&&!c.essenceMonster&&!c.fusionOnly);
  if(select==='starter-fire')return rows.find(c=>c.id===0);
  if(select==='workshop-schattenwolf')return workshop('Nachtpirscher',2);
  if(select==='workshop-kristallgolem')return workshop('Kristallbastion',3);
  if(select==='workshop-nebelwisp')return workshop('Seelensumpf-Hydra',4);
  if(select==='earth-five'){
   const pool=rows.filter(c=>c.level===5&&!c.fusionOnly&&!c.essenceMonster&&!c.ace&&c.element==='ERDE');
   return pool.find(c=>c.role==='predator')||pool.find(c=>c.kind==='plant')||workshop('Wurzelhüter der Dämmerung',5)||pool[0];
  }
  if(select.startsWith('fusion-')){
   const lv=select==='fusion-six'?6:select==='fusion-seven'?7:8;
   const element=select==='fusion-six'?'DUNKEL':select==='fusion-seven'?'ERDE':'FEUER';
   const pool=rows.filter(c=>c.level===lv&&c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.enemyOnly&&!c.milestoneOnly);
   return pool.find(c=>c.element===element&&c.rarity==='rare')||
    pool.find(c=>c.element===element)||pool.find(c=>c.kind==='golem'&&lv===7)||pool[0];
  }
  if(select==='astral-ace')return rows.find(c=>c.id===(typeof ACE_CARD_IDS!=='undefined'?ACE_CARD_IDS[10]:-1));
  if(select==='essence-fusion')return CARDS[typeof ESSENCE_MONSTER_IDS!=='undefined'?ESSENCE_MONSTER_IDS.fusion:-1];
  return null;
 }
 function apply(){
  const used=new Set(),installed=[],issues=[];
  for(const design of wave){
   const card=pick(design.select,used);
   if(!card){issues.push('Keine passende Karte für '+design.name);continue;}
   // Existing savegame references point to IDs; only human-visible fields change.
   const art=sourceRoot+design.key+'.webp';
   overlay[card.id]={art,name:design.name};
   card.art=art;
   card.customArt=art;
   card.name=design.name;
   card.desc=design.desc;
   card.artWave='01';
   card.artFamily=family(card);
   card.artTier=tier(card.level);
   used.add(card.id);
   installed.push({id:card.id,name:card.name,level:card.level,
    role:card.role,element:card.element,art,category:family(card)});
  }
  return {count:installed.length,cards:installed,issues};
 }
 const result=apply();
 window.ArcaneArtCatalog=Object.freeze({version:'4.1.0',key,tier,family,resolve,audit,
  wave:wave.map(x=>({key:x.key,name:x.name,designElement:x.element})),installed:result});
 if(result.count!==wave.length&&typeof console!=='undefined')console.warn('Arcane Art Wave 01:',result.issues);
 // Initial menu was drawn by game.js before this late presentation layer.
 if(result.count>0&&typeof document!=='undefined'){
  document.addEventListener('DOMContentLoaded',()=>{
   try{
    if(typeof uiMode!=='undefined'&&uiMode==='menu'&&typeof renderMenu==='function')renderMenu();
    else if(typeof render==='function')render();
   }catch(e){console.warn('Artwork refresh skipped:',e);}
  },{once:true});
 }
})();