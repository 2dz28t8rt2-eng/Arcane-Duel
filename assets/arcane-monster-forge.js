/* Arcane Duel – Monsterwerkstatt, isolated from combat fusions.
 * Inventory-safe, tournament-gated and exact conservation of level points.
 * Conversion never changes an active deck/slot or a running duel.
 */
'use strict';
(()=>{
 const esc=v=>escapeHtml(String(v));
 const roots=[...new Set([...ARCANE_STAGE_IDS.keys()].map(k=>Number(k.split(':')[0])))];
 const stage=(root,lv)=>ARCANE_STAGE_IDS.get(root+':'+lv);
 const levelCap=()=>highestCleared()>=8?12:highestCleared()>=7?10:highestCleared()>=5?8:highestCleared()>=3?6:4;
 let chosenRoot=roots[0],combineLevel=2,splitLevel=2,combineText='',splitText='';
 const usedCopies=id=>Math.max(0,...profile.slots.map(s=>s.main.filter(x=>x===id).length),
  profile.activeDeck.filter(x=>x===id).length);
 const free=id=>Math.max(0,(profile.inventory[id]||0)-usedCopies(id));
 const available=root=>Array.from({length:12},(_,i)=>i+1).filter(lv=>stage(root,lv)!=null);
 function parseRecipe(value){
  if(!/^\s*\d+(?:\s*[+,]\s*\d+)*\s*$/.test(String(value||'')))return null;
  const parts=String(value).split(/[+,]/).map(n=>Number(n.trim()));
  return parts.length>=1&&parts.length<=12&&parts.every(n=>Number.isInteger(n)&&n>=1&&n<=12)?parts:null;
 }
 function findComposition(root,target){
  const caps=available(root).filter(lv=>lv<target).map(lv=>({lv,available:free(stage(root,lv))})).filter(x=>x.available);
  // Exact bounded knapsack; use higher levels first to minimize consumed copies.
  let dp=new Map([[0,[]]]);
  for(const {lv,available:count} of caps.sort((a,b)=>b.lv-a.lv)){
   const next=new Map(dp);
   for(const [sum,parts] of dp)for(let n=1;n<=Math.min(count,Math.floor((target-sum)/lv));n++){
    const out=[...parts,...Array(n).fill(lv)],total=sum+n*lv,old=next.get(total);
    if(!old||out.length<old.length)next.set(total,out);
   }
   dp=next;
  }
  return dp.get(target)||null;
 }
 function recipeParts(root,action,level,value){
  if(!Number.isInteger(root)||!Number.isInteger(level))return null;
  const id=stage(root,level);if(id===undefined)return null;
  if(action==='split'){
   if(free(id)<1)return null;
   const parts=parseRecipe(value);if(!parts||parts.length<2||parts.reduce((a,b)=>a+b,0)!==level||parts.some(n=>n>=level||n>levelCap()))return null;
   return {input:[level],output:parts};
  }
  if(level>levelCap())return null;
  const parts=value.trim()?parseRecipe(value):findComposition(root,level);
  if(!parts||parts.length<2||parts.reduce((a,b)=>a+b,0)!==level||parts.some(n=>n>=level))return null;
  return {input:parts,output:[level]};
 }
 function transact(action,root,level,value){
  if(storageConflict||!storageWritable||profile.activeDuel||game&&game.winner===null)return {ok:false,message:'Schließe zuerst dein laufendes Duell oder löse den Speicherkonflikt.'};
  if(!roots.includes(root))return {ok:false,message:'Unbekannte Monsterfamilie.'};
  const plan=recipeParts(root,action,level,value);if(!plan)return {ok:false,message:'Ungültige Levelaufteilung oder nicht genügend freie Monsterkarten.'};
  const debit=new Map(),credit=new Map();
  for(const lv of plan.input){const id=stage(root,lv);debit.set(id,(debit.get(id)||0)+1);}
  for(const lv of plan.output){const id=stage(root,lv);if(id===undefined)return {ok:false,message:'Diese Monsterstufe existiert nicht.'};credit.set(id,(credit.get(id)||0)+1);}
  const all=[...new Set([...debit.keys(),...credit.keys()])];
  for(const id of all){
   if(!UPDATE_B_SET.has(id)||CARDS[id]?.fusionOnly||CARDS[id]?.essenceMonster||CARDS[id]?.ace||CARDS[id]?.rarity!=='common')return {ok:false,message:'Nur gewöhnliche Monster dürfen umgewandelt werden.'};
   if(profile.favorites.includes(id)&&debit.has(id))return {ok:false,message:'Eine geschützte Karte ist ausgewählt. Entferne zuerst ihren Favoritenstatus.'};
   if((debit.get(id)||0)>free(id))return {ok:false,message:'Zu wenige freie Kopien. In Deckplätzen verwendete Karten sind geschützt.'};
   const after=(profile.inventory[id]||0)-(debit.get(id)||0)+(credit.get(id)||0);
   if(!Number.isSafeInteger(after)||after<0||after>999999)return {ok:false,message:'Bestandsgrenze erreicht.'};
  }
  const inTotal=plan.input.reduce((a,b)=>a+b,0),outTotal=plan.output.reduce((a,b)=>a+b,0);
  if(inTotal!==outTotal)throw Error('Monsterwerkstatt: Level conservation invariant violated');
  const oldInventory={...profile.inventory},oldUnlocked=[...profile.unlocked],oldUnseen=[...profile.unseen];
  for(const id of all){
   profile.inventory[id]=(profile.inventory[id]||0)-(debit.get(id)||0)+(credit.get(id)||0);
   if(profile.inventory[id]>0&&!profile.unlocked.includes(id))profile.unlocked.push(id);
   if((credit.get(id)||0)>0&&!profile.unseen.includes(id))profile.unseen.push(id);
  }
  if(!saveProfile()){
   profile.inventory=oldInventory;profile.unlocked=oldUnlocked;profile.unseen=oldUnseen;
   return {ok:false,message:'Speichern fehlgeschlagen. Die Umwandlung wurde zurückgenommen.'};
  }
  return {ok:true,message:'Umwandlung abgeschlossen: '+plan.input.join(' + ')+' → '+plan.output.join(' + ')+'. Alle Levelpunkte bleiben erhalten.'};
 }
 const btn=(action,label,disabled=false)=>'<button type="button" class="btn '+(action==='combine'?'primary':'')+'" data-forge-action="'+action+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
 function show(){
  if(uiMode!=='menu'||menuTab!=='collection')return;
  const target=$('menuContent');if(!target)return;
  let root=chosenRoot;
  if(!roots.includes(root))root=roots[0];
  const cap=levelCap();
  const stages=available(root),owned=stages.filter(lv=>free(stage(root,lv))>0);
  const rootCards=roots.map(id=>CARDS[id]);
  const plan=findComposition(root,Math.max(2,Math.min(cap,combineLevel)));
  const area=document.createElement('section');area.className='menu-panel arcane-forge';area.id='arcaneMonsterForge';
  area.innerHTML='<div class="arcane-forge-header"><span>✦ MONSTERWERKSTATT</span><h2>Verbinden & Zerlegen</h2>'+
   '<p>Verwandle normale Monster <b>derselben Familie</b> in andere Stufen. Die Summe der Levelpunkte bleibt gleich; Karten in Deckplätzen werden niemals heimlich verbraucht.</p></div>'+
   '<label>Monsterfamilie <select id="arcaneForgeRoot">'+rootCards.map(c=>'<option value="'+c.id+'" '+(c.id===root?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+
   '<div class="arcane-forge-inventory"><strong>Deine freien Monster dieser Familie:</strong> '+
   (owned.map(lv=>'LV '+lv+' × '+free(stage(root,lv))).join(' · ')||'Noch keine freien Exemplare')+'</div>'+
   '<div class="arcane-forge-grid"><div><h3>✧ Verbinden</h3><label>Zielstufe (max. LV '+cap+')'+
   '<select id="arcaneForgeCombineLevel">'+Array.from({length:cap-1},(_,i)=>i+2).map(lv=>'<option value="'+lv+'" '+(lv===combineLevel?'selected':'')+'>LV '+lv+'</option>').join('')+'</select></label>'+
   '<label>Eigene Levelaufteilung (optional)<input type="text" id="arcaneForgeCombineRecipe" value="'+esc(combineText)+'" placeholder="'+(plan?plan.join(' + '):'z. B. 1+1+2')+'"></label>'+
   '<p>Ohne eigene Angabe nutzt die Werkstatt automatisch deine freien Karten. Beispiel: 7 × LV 1 → LV 7.</p>'+btn('combine','Monster verbinden')+'</div>'+
   '<div><h3>↯ Zerlegen</h3><label>Zu zerlegende Karte<select id="arcaneForgeSplitLevel">'+
   stages.filter(lv=>lv>=2).map(lv=>'<option value="'+lv+'" '+(lv===splitLevel?'selected':'')+' '+(!free(stage(root,lv))?'disabled':'')+'>LV '+lv+' · '+free(stage(root,lv))+' frei</option>').join('')+'</select></label>'+
   '<label>Gewünschte niedrigere Stufen<input type="text" id="arcaneForgeSplitRecipe" value="'+esc(splitText)+'" placeholder="z. B. 3+3+1"></label>'+
   '<p>Beispiele für eine LV-7-Karte: 3+3+1, 2+2+2+1 oder siebenmal 1. Alle Summen müssen exakt aufgehen.</p>'+
   btn('split','Monster zerlegen')+'</div></div>'+
   '<p class="arcane-forge-limit">Stufenbegrenzung durch den Turnierfortschritt. Bis LV 12 erst nach Turniergegner VIII. Essenzmonster, ACE- und Fusionskarten sind ausgeschlossen.</p>';
  target.prepend(area);
 }
 const oldMenu=renderMenu;
 renderMenu=function(){oldMenu();show();};
 $('menuScreen')?.addEventListener('change',event=>{
  const t=event.target;if(t.id==='arcaneForgeRoot'){chosenRoot=Number(t.value);combineLevel=2;splitLevel=2;combineText='';splitText='';renderMenu();}
  if(t.id==='arcaneForgeCombineLevel')combineLevel=Number(t.value);
  if(t.id==='arcaneForgeSplitLevel')splitLevel=Number(t.value);
  if(t.id==='arcaneForgeCombineRecipe')combineText=t.value;
  if(t.id==='arcaneForgeSplitRecipe')splitText=t.value;
 });
 $('menuScreen')?.addEventListener('click',event=>{
  const b=event.target.closest('[data-forge-action]');if(!b)return;
  const area=$('arcaneMonsterForge');if(!area)return;
  combineLevel=Number(area.querySelector('#arcaneForgeCombineLevel').value);
  splitLevel=Number(area.querySelector('#arcaneForgeSplitLevel').value);
  combineText=area.querySelector('#arcaneForgeCombineRecipe').value;
  splitText=area.querySelector('#arcaneForgeSplitRecipe').value;
  const action=b.dataset.forgeAction,level=action==='combine'?combineLevel:splitLevel;
  const result=transact(action,chosenRoot,level,action==='combine'?combineText:splitText);
  toast(result.message);
  if(result.ok){combineText='';splitText='';renderMenu();}
 });
 window.ArcaneMonsterForge=Object.freeze({version:'1.0.0',levelCap,parseRecipe,findComposition,transact,stage});
 if(uiMode==='menu')show();
})();
