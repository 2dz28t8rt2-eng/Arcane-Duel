/* Arcane Duel – Monsterwerkstatt, isolated from combat fusions.
 * Inventory-safe, tournament-gated and exact conservation of level points.
 * Conversion never changes an active deck/slot or a running duel.
 */
'use strict';
(()=>{
 const esc=v=>escapeHtml(String(v));
 const roots=[...new Set([...ARCANE_STAGE_IDS.keys()].map(k=>Number(k.split(':')[0])))];
 const stage=(root,lv)=>ARCANE_STAGE_IDS.get(root+':'+lv);
 const levelCap=()=>highestCleared()>=7?10:highestCleared()>=5?8:highestCleared()>=3?6:4;
 let chosenRoot=null,combineLevel=2,splitLevel=2,combineText='',splitText='';
 const usedCopies=id=>Math.max(0,...profile.slots.map(s=>s.main.filter(x=>x===id).length),
  profile.activeDeck.filter(x=>x===id).length);
 const free=id=>Math.max(0,(profile.inventory[id]||0)-usedCopies(id));
 const available=root=>Array.from({length:10},(_,i)=>i+1).filter(lv=>stage(root,lv)!=null);
 function parseRecipe(value){
  if(!/^\s*\d+(?:\s*[+,]\s*\d+)*\s*$/.test(String(value||'')))return null;
  const parts=String(value).split(/[+,]/).map(n=>Number(n.trim()));
  return parts.length>=1&&parts.length<=10&&parts.every(n=>Number.isInteger(n)&&n>=1&&n<=10)?parts:null;
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
   const parts=String(value||'').trim()?parseRecipe(value):[Math.floor(level/2),Math.ceil(level/2)];if(!parts||parts.length<2||parts.reduce((a,b)=>a+b,0)!==level||parts.some(n=>n>=level||n>levelCap()))return null;
   return {input:[level],output:parts};
  }
  if(level>levelCap())return null;
  const parts=String(value||'').trim()?parseRecipe(value):findComposition(root,level);
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
   if(!UPDATE_B_SET.has(id)||!ARCANE_WORKSHOP_IDS.includes(id)||CARDS[id]?.fusionOnly||CARDS[id]?.essenceMonster||CARDS[id]?.ace||['rare','essence','legendary','mythic'].includes(CARDS[id]?.rarity))return {ok:false,message:'Nur gewöhnliche Monster dürfen umgewandelt werden.'};
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
  if(uiMode!=='menu'||menuTab!=='workshop')return;
  const target=$('menuContent');if(!target)return;
  let root=chosenRoot;
  if(!roots.includes(root))root=roots.find(r=>available(r).some(lv=>free(stage(r,lv))>0))||roots[0];
  chosenRoot=root;
  const cap=levelCap();
  const stages=available(root),owned=stages.filter(lv=>free(stage(root,lv))>0);
  const rootCards=roots.map(id=>({card:CARDS[id],available:available(id).reduce((n,lv)=>n+free(stage(id,lv)),0)}))
   .sort((a,b)=>b.available-a.available||a.card.name.localeCompare(b.card.name,'de'));
  if(!free(stage(root,splitLevel)))splitLevel=owned.find(lv=>lv>=2)||2;
  const plan=findComposition(root,Math.max(2,Math.min(cap,combineLevel)));
  const area=document.createElement('section');area.className='menu-panel arcane-forge';area.id='arcaneMonsterForge';
  area.innerHTML='<div class="arcane-forge-header"><span>✦ MONSTERWERKSTATT</span><h2>Verbinden & Zerlegen</h2>'+
   '<p>Verwandle normale Monster <b>derselben Familie</b> in andere Stufen. Die Summe der Levelpunkte bleibt gleich; Karten in Deckplätzen werden niemals heimlich verbraucht.</p></div>'+
   '<div class="arcane-forge-family"><img src="'+esc(CARDS[root].art)+'" alt="" loading="lazy">'+
   '<div><strong>'+esc(CARDS[root].name)+'</strong><span>32 Monsterfamilien · Verbinden und Zerlegen ohne Levelverlust</span>'+
   '<small>Nur freie Exemplare; Karten in Decks und geschützte Favoriten bleiben erhalten.</small></div></div>'+
   '<label>Monsterfamilie <select id="arcaneForgeRoot">'+rootCards.map(entry=>'<option value="'+entry.card.id+'" '+
   (entry.card.id===root?'selected':'')+'>'+esc(entry.card.name)+' · '+entry.available+' freie Karten</option>').join('')+'</select></label>'+
   '<div class="arcane-forge-inventory"><strong>Deine freien Monster dieser Familie:</strong> '+
   (owned.map(lv=>'LV '+lv+' × '+free(stage(root,lv))).join(' · ')||'Noch keine freien Exemplare')+'</div>'+
   '<div class="arcane-forge-grid"><div><h3>✧ Verbinden</h3><label>Zielstufe (max. LV '+cap+')'+
   '<select id="arcaneForgeCombineLevel">'+Array.from({length:cap-1},(_,i)=>i+2).map(lv=>'<option value="'+lv+'" '+(lv===combineLevel?'selected':'')+'>LV '+lv+'</option>').join('')+'</select></label>'+
   '<label>Eigene Levelaufteilung (optional)<input type="text" id="arcaneForgeCombineRecipe" value="'+esc(combineText)+'" placeholder="'+(plan?plan.join(' + '):'z. B. 1+1+2')+'"></label>'+
   '<p>Ohne Eingabe sucht die Werkstatt automatisch passende freie Exemplare. Beispiel: 7 × LV 1 → LV 7.</p>'+
   (plan?'<p class="arcane-forge-proposal">Automatisch vorgeschlagen: <b>'+plan.join(' + ')+' → LV '+combineLevel+'</b></p>':
   '<p class="arcane-forge-proposal">Noch kein passendes freies Material für diese Zielstufe gefunden.</p>')+
   btn('combine','Monster verbinden',!plan&&!combineText.trim())+'</div>'+
   '<div><h3>↯ Zerlegen</h3><label>Zu zerlegende Karte<select id="arcaneForgeSplitLevel">'+
   stages.filter(lv=>lv>=2).map(lv=>'<option value="'+lv+'" '+(lv===splitLevel?'selected':'')+' '+(!free(stage(root,lv))?'disabled':'')+'>LV '+lv+' · '+free(stage(root,lv))+' frei</option>').join('')+'</select></label>'+
   '<label>Gewünschte niedrigere Stufen (optional)<input type="text" id="arcaneForgeSplitRecipe" value="'+esc(splitText)+'" placeholder="Leer lassen = in zwei ungefähr gleiche Stufen teilen"></label>'+
   '<div class="arcane-forge-presets"><button class="btn" type="button" data-forge-preset="halves">In 2 Monster teilen</button>'+
   '<button class="btn" type="button" data-forge-preset="ones">Alles in LV 1 zerlegen</button></div>'+
   '<p>Ohne Eingabe zerlegt die Werkstatt automatisch möglichst gleichmäßig, z. B. LV 7 → LV 3 + LV 4. Du kannst auch 3+3+1 oder 1+1+1+1+1+1+1 eingeben. Die Summe muss exakt stimmen.</p>'+
   btn('split','Monster zerlegen',!owned.some(lv=>lv>=2))+'</div></div>'+
   '<p class="arcane-forge-limit">Stufenbegrenzung durch den Turnierfortschritt. Level 10 ist die maximale Monsterstufe im regulären Turnier. Level 11 und 12 erscheinen erst in einer späteren Erweiterung. Essenzmonster, ACE- und Fusionskarten sind ausgeschlossen.</p>';
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
  const preset=event.target.closest('[data-forge-preset]');
  if(preset){
   const area=$('arcaneMonsterForge');if(!area)return;
   const level=Number(area.querySelector('#arcaneForgeSplitLevel')?.value)||2;
   const parts=preset.dataset.forgePreset==='ones'?Array(level).fill(1):
    [Math.floor(level/2),Math.ceil(level/2)];
   const input=area.querySelector('#arcaneForgeSplitRecipe');
   input.value=parts.join('+');splitText=input.value;input.focus();return;
  }
  const b=event.target.closest('[data-forge-action]');if(!b)return;
  const area=$('arcaneMonsterForge');if(!area)return;
  combineLevel=Number(area.querySelector('#arcaneForgeCombineLevel').value);
  splitLevel=Number(area.querySelector('#arcaneForgeSplitLevel').value);
  combineText=area.querySelector('#arcaneForgeCombineRecipe').value;
  splitText=area.querySelector('#arcaneForgeSplitRecipe').value;
  const action=b.dataset.forgeAction,level=action==='combine'?combineLevel:splitLevel;
  const recipe=action==='combine'?combineText:splitText,plan=recipeParts(chosenRoot,action,level,recipe);
  if(!plan){toast('Ungültige Levelaufteilung. Prüfe die Summe und deine freien Karten.');return;}
  const verb=action==='combine'?'Verbinden':'Zerlegen';
  openModal(modalHtml('✦ MONSTERWERKSTATT',verb+' bestätigen','✧',
   'Dieser Vorgang verändert dauerhaft deine freien Karten, ohne ihre gesamte Levelsumme zu verändern.',
   '<div class="arcane-forge-confirm"><strong>'+esc(CARDS[chosenRoot].name)+'</strong>'+
   '<p>LV '+plan.input.join(' + LV ')+' → LV '+plan.output.join(' + LV ')+'</p>'+
   '<small>Deine ausgerüsteten Decks und Favoriten bleiben unverändert.</small></div>',
   '<button class="btn" id="arcaneForgeCancel">ABBRECHEN</button>'+
   '<button class="btn primary" id="arcaneForgeConfirm">JA · '+verb.toUpperCase()+'</button>'));
  $('arcaneForgeCancel').onclick=hideModal;
  $('arcaneForgeConfirm').onclick=()=>{
   const confirmed=transact(action,chosenRoot,level,recipe);
   hideModal();toast(confirmed.message);
   if(confirmed.ok){combineText='';splitText='';renderMenu();}
  };
 });
 window.ArcaneMonsterForge=Object.freeze({version:'1.2.0',levelCap,parseRecipe,findComposition,transact,stage});
 if(uiMode==='menu')show();
})();
