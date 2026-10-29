/* Arcane Duel 20.3 – truthful live card inspector, pack feedback, hand controls.
 * Visual effects only: calculations and tactical rules remain in their owners.
 */
'use strict';
(()=>{
 const id=name=>document.getElementById(name);
 const isPredator=c=>(c?.roleOverride||CARDS[c?.id]?.role)==='predator';
 const shown=g=>g?.mode==='pve'&&!g?.strategicTraining?.symmetricSides;
 const packHistory=new WeakMap();
 const sideState=(g,side)=>{
  const field=g.players[side].field,predators=field.filter(c=>c&&isPredator(c));
  const leader=field.filter(c=>c?.predatorLeader&&c.fusion&&isPredator(c))
   .sort((a,b)=>(b.predatorLeader.bornUid||b.uid)-(a.predatorLeader.bornUid||a.uid))[0]||null;
  const percentage=Math.min(5,predators.length)*(leader?
   (leader.predatorLeader.powers?.includes('swarm')?3.5:3):2);
  return {leader,percentage};
 };
 function boardSlot(side,index){
  const enemy=side===1;
  return id(enemy?'enemyRow':'ownRow')?.querySelector('[data-'+(enemy?'enemy':'mine')+'="'+index+'"]');
 }
 function pulse(slot,label,good){
  const rect=slot?.getBoundingClientRect();if(!rect?.width)return;
  const node=document.createElement('span');node.className='ad203-pack-pulse'+(good?'':' ad203-pack-loss');
  node.textContent=label;node.style.left=rect.left+rect.width/2+'px';
  node.style.top=rect.top+rect.height/2+'px';
  document.body.append(node);setTimeout(()=>node.remove(),1950);
 }
 function decoratePack(g){
  if(!shown(g)||uiMode!=='duel')return;
  const old=packHistory.get(g)||new Map(),next=new Map();
  for(let side=0;side<2;side++){
   const state=sideState(g,side);
   g.players[side].field.forEach((c,index)=>{
    if(!c||!isPredator(c))return;
    const slot=boardSlot(side,index),card=slot?.querySelector('.board-creature');
    if(!card)return;
    const percent=state.percentage,formula='Rudelbonus +'+String(percent).replace('.',',')+' % ATK'+
     (state.leader?' · Rudelführer aktiv':'');
    const badge=document.createElement('span');badge.className='ad203-pack-bonus';
    badge.textContent='+'+String(percent).replace('.',',')+' %';
    badge.title=formula;badge.setAttribute('aria-label',formula);
    card.append(badge);
    const key=side+':'+c.uid;next.set(key,percent);
    const before=old.get(key);
    if(before!==undefined&&before!==percent){
     const delta=percent-before;
     pulse(slot,'Rudel '+(delta>0?'+':'')+String(delta).replace('.',',')+' %',delta>0);
    }else if(before===undefined&&old.size&&percent>0){pulse(slot,'Rudel +'+String(percent).replace('.',',')+' %',true);}
   });
  }
  packHistory.set(g,next);
 }
 function syncInspector(){
  const g=game,preview=id('largeCardPreview');
  if(!g||!preview||uiMode!=='duel')return;
  preview.querySelector('.ad203-live-inspector')?.remove();
  const large=preview.querySelector('.hand-card[data-instance-uid]');
  const uid=Number(large?.dataset.instanceUid);
  if(!large||!Number.isSafeInteger(uid))return;
  for(let side=0;side<2;side++){
   const index=g.players[side].field.findIndex(c=>c?.uid===uid);
   if(index<0)continue;
   const c=g.players[side].field[index],state=shown(g)?sideState(g,side):null;
   const slot=boardSlot(side,index);
   const numberOf=node=>Number((node?.textContent||'').replace(/[^\d]/g,''));
   const attack=numberOf(slot?.querySelector('.board-stats b:first-child'));
   const defense=numberOf(slot?.querySelector('.board-stats b:last-child'));
   const atkField=large.querySelector('.stat.atk .stat-value'),defField=large.querySelector('.stat.def .stat-value');
   if(atkField&&Number.isFinite(attack))atkField.textContent=attack.toLocaleString('de-AT');
   if(defField&&Number.isFinite(defense))defField.textContent=defense.toLocaleString('de-AT');
   large.setAttribute('aria-label',dataOf(c).name+', Feld-Angriff '+attack+', Feld-Verteidigung '+defense);
   if(state&&isPredator(c)){
    const leader=c===state.leader;
    if(leader){const stamp=document.createElement('span');stamp.className='ad203-preview-leader';
     stamp.textContent='♛ RUDELFÜHRER';stamp.title='Aktiver Rudelführer – Werte inklusive Rudelbonus';large.append(stamp);}
    const info=document.createElement('p');info.className='ad203-live-inspector';
    info.innerHTML='<strong>Aktuelle Feldwerte: '+attack.toLocaleString('de-AT')+' ATK / '+defense.toLocaleString('de-AT')+' DEF</strong>'+
     '<span>Grund-ATK '+Math.round(dataOf(c).atk).toLocaleString('de-AT')+' · Rudel +'+String(state.percentage).replace('.',',')+' %'+
     (leader?' · Aktiver Rudelführer':'')+'</span>';
    preview.append(info);
   }
   break;
  }
 }
 const oldPreview=renderCardPreview;
 renderCardPreview=function(...args){const r=oldPreview.apply(this,args);syncInspector();return r;};
 const oldRender=render;
 render=function(...args){const r=oldRender.apply(this,args);try{decoratePack(game);syncInspector();}catch(error){console.warn('Rudelanzeige übersprungen',error);}return r;};

 function toggleHand(){
  if(uiMode!=='duel'||!game)return;
  const screen=id('duelScreen');screen?.classList.toggle('ad203-hand-collapsed');
  const button=id('ad203-hand-toggle'),collapsed=screen?.classList.contains('ad203-hand-collapsed');
  if(button){button.textContent=collapsed?'▴ Hand zeigen [H]':'▾ Hand verbergen [H]';button.setAttribute('aria-expanded',String(!collapsed));}
 }
 const tray=id('hand')?.closest('.cardtray'),bar=tray?.querySelector('.tray-top');
 if(bar&&!id('ad203-hand-toggle')){
  const button=document.createElement('button');button.type='button';button.id='ad203-hand-toggle';
  button.className='btn ghost';button.textContent='▾ Hand verbergen [H]';
  button.setAttribute('aria-controls','hand');button.setAttribute('aria-expanded','true');
  button.addEventListener('click',toggleHand);bar.append(button);
 }
 document.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()!=='h'||event.repeat||event.altKey||event.ctrlKey||event.metaKey||
   event.target?.closest?.('input,textarea,select,[contenteditable]')||
   !id('overlay')?.classList.contains('hidden'))return;
  if(uiMode==='duel'){event.preventDefault();toggleHand();}
 });
 const renderHudBefore=renderHud;
 renderHud=function(...args){const r=renderHudBefore.apply(this,args);
  const toggle=id('hudDropToggle');if(toggle){toggle.hidden=!dropChargesUnlocked();
   toggle.style.display=dropChargesUnlocked()?'':'none';}
  return r;
 };
 const renderMenuBefore=renderMenu;
 renderMenu=function(...args){const r=renderMenuBefore.apply(this,args);
  if(!dropChargesUnlocked()){
   const button=id('menuContent')?.querySelector('button[data-action="boost"]');
   if(button){const note=document.createElement('p');note.className='ad203-drop-lock';
    note.textContent='Dropladungen werden verfügbar, sobald du deinen ersten Gegner für Autokämpfe freigeschaltet hast.';
    button.replaceWith(note);}
  }
  if(profile.dropChargeIntroPending&&!profile.rewardQueue.length&&!profile.openPack&&
   !profile.showcase?.pending){
   profile.dropChargeIntroPending=false;saveProfile();
   openModal(modalHtml('NEU FREIGESCHALTET','✧ Dropladungen!','✧',
    'Du kannst jetzt Autokämpfe verstärken. In manuellen Duellen sammelst du Dropladungen. Aktiviere sie im Freimodus: Dein nächster Autokampf bringt mehr Beute und verbraucht eine Ladung.',
    '', '<button class="btn primary" id="ad203-drop-intro-ok">VERSTANDEN</button>'));
   id('ad203-drop-intro-ok').onclick=hideModal;
  }
  return r;
 };
 window.ArcaneDuelUX203=Object.freeze({version:'20.3',sideState,toggleHand,syncInspector});
})();
