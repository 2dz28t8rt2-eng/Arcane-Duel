/* Private 2v2 deck slots. No solo save or room state is read or changed. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ArcaneDuoDeckSlots222=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const assert=(v,message)=>{if(!v)throw Error(message);};
 const snapshot=p=>({main:[...p.deck],fusion:[...p.fusions]});
 function slots(p){
  const active=p.active_deck_slot??0;
  assert(Number.isInteger(active)&&active>=0&&active<3,'Ungültiger aktiver Deckplatz.');
  const raw=p.deck_slots;
  assert(Array.isArray(raw)&&(raw.length===0||raw.length===3),'Deckplätze sind ungültig.');
  const result=raw.length?raw.map(s=>{
   assert(s&&Array.isArray(s.main)&&Array.isArray(s.fusion),'Deckplatz ist ungültig.');
   return {main:[...s.main],fusion:[...s.fusion]};
  }):Array.from({length:3},()=>snapshot(p));
  result[active]=snapshot(p);
  return result;
 }
 function activeEnhancements(p,main=p.deck,fusion=p.fusions){
  const used=new Set([...main,...fusion]);
  return Object.fromEntries(Object.entries(p.enhancements||{}).filter(([id])=>used.has(Number(id))));
 }
 function owns(deck,collection){
  const counts=new Map();for(const id of collection||[])counts.set(id,(counts.get(id)||0)+1);
  for(const id of deck){const count=counts.get(id)||0;if(!count)return false;counts.set(id,count-1);}
  return true;
 }
 function operation(p,kind,index,catalog,rules){
  assert(Number.isInteger(index)&&index>=0&&index<3,'Ungültiger Deckplatz.');
  assert(['deckSlotSelect','deckSlotCopy'].includes(kind),'Unbekannte Deckaktion.');
  const all=slots(p),active=p.active_deck_slot??0;
  if(kind==='deckSlotCopy'){
   assert(index!==active,'Das aktive Deck ist bereits gespeichert.');
   all[index]=snapshot(p);return {deck_slots:all};
  }
  const next=all[index];
  assert(rules.validDeck(next.main,catalog)&&rules.validDeck(next.fusion,catalog,true)&&
   owns(next.main,p.owned_main)&&owns(next.fusion,p.owned_fusions),
   'Deckplatz enthält nicht mehr verfügbare oder ungültige Karten.');
  const selected=activeEnhancements(p,next.main,next.fusion);
  rules.normalizedBuild(p.upgrades,selected,next.main,next.fusion,catalog,p.essence_binding,p.lv1_research);
  return {deck_slots:all,active_deck_slot:index,deck:[...next.main],fusions:[...next.fusion]};
 }
 return Object.freeze({slots,activeEnhancements,operation});
});
