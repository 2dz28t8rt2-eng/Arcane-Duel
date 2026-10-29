/* Arcane Duel 4.2: presentation queues consume committed combat events only. */
'use strict';
(()=>{
 const motion=()=>animationSpeed!=='instant'&&!document.body.classList.contains('ad-motion-disabled')&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const colors={FEUER:'#ff9864',WASSER:'#76d9ff',ERDE:'#a9e58d',WIND:'#b1f5df',LICHT:'#ffe6a3',DUNKEL:'#cf9dff'};
 // Rendering must remain usable if the optional essence role helper has not
 // loaded (or an older save/module does not expose it). The same resolved role
 // is already available from the instance override and immutable card data.
 const role=c=>window.ArcaneEssenceCombat?.roleOf?.(c)||
  c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const defender=c=>['guardian','soul'].includes(role(c));
 function charge(c){
  const max=c?.essenceCombat?.maxDef,current=c?dataOf(c).def:0;
  return c?.mode==='def'&&defender(c)&&Number.isFinite(max)&&max>0&&current>max?{max,current,extra:current-max}:null;
 }
 function slot(g,owner,index){const viewer=g.mode==='pve'?0:g.active;return document.querySelector('#'+(owner===viewer?'ownRow':'enemyRow')+' [data-'+(owner===viewer?'mine':'enemy')+'="'+index+'"]');}
 function point(node){const r=node?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null;}
 function creatureNode(g,owner,uid,index){const i=g.players[owner].field.findIndex(c=>c?.uid===uid);return slot(g,owner,i>=0?i:index)?.querySelector('.board-creature')||slot(g,owner,index);}
 async function settled(animation,ms,phase){
  if(phase)return phase.animate(animation,ms+60);
  try{await Promise.race([animation.finished?.catch?.(()=>{}),delay(ms+80)].filter(Boolean));}
  finally{try{animation.finish();}catch{animation.cancel();}}
 }
 async function land(g,c,{phase=null}={}){
  if(!motion()||g!==game||uiMode!=='duel')return;
  const owner=g.players.findIndex(p=>p.field.some(x=>x?.uid===c.uid));if(owner<0)return;
  const index=g.players[owner].field.findIndex(x=>x?.uid===c.uid),cell=slot(g,owner,index)?.querySelector('.board-creature');
  if(!cell||typeof cell.cloneNode!=='function')return;
  const r=cell.getBoundingClientRect(),w=cell.offsetWidth||r.width,h=cell.offsetHeight||r.height;
  const ghost=document.createElement('div');ghost.className='ad-summon-ghost';ghost.dataset.owner=String(owner);ghost.dataset.uid=String(c.uid);ghost.setAttribute('aria-hidden','true');
  ghost.style.cssText='left:'+(r.left+r.width/2-w/2)+'px;top:'+(r.top+r.height/2-h/2)+'px;width:'+w+'px;height:'+h+'px;';
  const clone=cell.cloneNode(true);clone.classList.remove('evo-fusion-awaiting','evo-fusion-landed','ad-summon-hidden','summon-anim','ad-titan-impact');ghost.append(clone);
  cell.classList.add('ad-summon-hidden');document.body.append(ghost);
  try{
   const massFusion=(c.materialsUsed||0)>=3;
   const landingMs=massFusion?245:480;
   const animation=ghost.animate([{transform:'scale(4.8)',opacity:.06},{transform:'scale(1.55)',opacity:.6,offset:massFusion?.35:.48},{transform:'scale(1)',opacity:1,offset:massFusion?.79:.84},{transform:'scale(1)',opacity:1}],{duration:landingMs,easing:'cubic-bezier(.55,.02,.7,1)',fill:'forwards'});
   await settled(animation,landingMs,phase);
  }finally{
   cell.classList.remove('ad-summon-hidden');ghost.remove();
   if(game===g&&cell.isConnected){cell.classList.add('evo-fusion-landed');window.ArcaneBattleFX?.landingDust(cell,(c.materialsUsed||0)>=4);setTimeout(()=>cell.classList.remove('evo-fusion-landed'),(c.materialsUsed||0)>=3?460:900);}
  }
 }
 window.ArcaneSummonFX=Object.freeze({land});
 // One normal summon uses the same foreground approach on either side.
 const own=onOwnSlot;
 onOwnSlot=async function(index,...args){
  const g=game,pending=g?.pending,before=g?.players[g.active]?.field[index]?.uid;
  // Sound belongs to the confirmed placement click, not opening the occupied-slot dialog.
  if(pending?.kind==='normal'&&(!g.players[g.active].field[index]||args[0]==='replace'))
   window.ArcaneSfx208?.play?.('summon');
  await own(index,...args);
  const c=g?.players[g.active]?.field[index];
  if(game===g&&pending&&!g.pending&&c&&c.uid!==before&&!c.fusion){
   busy=true;try{await land(g,c);}finally{busy=false;if(game===g)render();}
  }
 };
 // Engine hooks record precise, already applied gains and counterstrikes.
 const queues=new WeakMap(),batches=new WeakMap(),flushing=new WeakMap();
 function enqueue(g,event){if(g!==game||uiMode!=='duel'||!motion())return;let q=queues.get(g);if(!q)queues.set(g,q=[]);q.push(event);}
 function beginTurn(g,owner,defenders){
  if(!defenders.length||g!==game||!motion())return;
  const batch={type:'turn',owner,steps:[],targets:g.players[1-owner].field.map((c,index)=>c?{uid:c.uid,index}:null).filter(Boolean)};
  batches.set(g,batch);enqueue(g,batch);
 }
 function record(g,event){const b=batches.get(g);if(b&&event.type!=='counter')b.steps.push(event);else enqueue(g,event);}
 function endTurn(g){batches.delete(g);}
 function flash(node,color){if(!node||!motion())return;node.style.setProperty('--ad-receive-color',color);node.classList.add('ad-energy-receive');setTimeout(()=>node.classList.remove('ad-energy-receive'),650);}
 function roleStatFloat(node,message,kind){if(!node||!motion()||!message)return;
  const p=point(node);if(!p)return;
  const el=document.createElement('div');el.className='ad-role-stat-float';el.dataset.kind=kind;
  el.textContent=message;el.style.left=p.x+'px';el.style.top=p.y+'px';
  el.setAttribute('aria-hidden','true');document.body.append(el);
  setTimeout(()=>el.remove(),1100);
 }
 async function projectile(from,to,color,kind='soul'){
  if(!from||!to||!motion())return;
  const host=document.createElement('div');host.className='ad-arc-projectile ad-projectile-'+kind;host.style.setProperty('--ad-energy',color);host.setAttribute('aria-hidden','true');
  const dx=to.x-from.x,dy=to.y-from.y,len=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(115,Math.max(42,len*.23));
  const cx=(from.x+to.x)/2-dy/len*bend,cy=(from.y+to.y)/2+dx/len*bend;
  const duration=kind==='counter'?350:860,stagger=kind==='counter'?7:24;
  const frames=[];for(let i=0;i<=24;i++){const t=i/24;frames.push({transform:'translate('+(Math.pow(1-t,2)*from.x+2*(1-t)*t*cx+t*t*to.x)+'px,'+(Math.pow(1-t,2)*from.y+2*(1-t)*t*cy+t*t*to.y)+'px)',opacity:i===0?0:i===24?0:1,offset:t});}
  for(let i=0;i<11;i++){const star=document.createElement('i');star.textContent=i===0?'✦':'✧';host.append(star);}
  document.body.append(host);
  try{await Promise.all([...host.children].map((star,i)=>settled(star.animate(frames,{duration,delay:i*stagger,easing:'ease-in-out',fill:'both'}),duration+i*stagger)));}
  finally{host.remove();}
 }
 async function playEvent(g,event,orbs){
  const node=creatureNode(g,event.owner,event.uid,event.index),color=colors[event.element]||'#d8b5ff';
  if(event.type==='absorb'){
   const paths=event.targets.map(target=>({from:point(orbs?.get(target.uid)||creatureNode(g,1-event.owner,target.uid,target.index)),to:point(node)}));
   await Promise.all(paths.map(p=>projectile(p.from,p.to,event.activeRaid?'#e155ff':color,'soul')));if(game===g){flash(node,event.activeRaid?'#d978ff':color);if(event.gain>0)roleStatFloat(node,'+'+event.gain+' Seele · '+(event.activeRaid?'SEELENRAUB':'Entzug'),'soul');}
  }else if(event.type==='heal'){
   await projectile(point(creatureNode(g,event.owner,event.fromUid,event.fromIndex)),point(node),'#a9e58d','heal');if(game===g){flash(node,'#a9e58d');if(event.amount>0)roleStatFloat(node,'Wächter +'+event.amount+' DEF','guardian');}
  }else if(event.type==='soulBurn'){
   // Soul stored as a shield reflects 50% of consumed soul energy as LP damage.
   // This event precedes the defender's distinct counterstrike, as in the rules.
   const banner=document.getElementById(event.owner===0?'enemyBanner':'myBanner');
   roleStatFloat(banner,'−'+event.amount+' LP · SEELENVERLUST (50 % von '+event.soulLost+' Essenz)','soul-burn');
   flash(banner,'#c881ff');
   window.ArcaneSfx208?.play?.('damage');
  }else if(event.type==='counter'){
   // Explicitly harmful: the red projectile travels from defender TO attacker LP.
   const banner=document.getElementById(event.owner===0?'enemyBanner':'myBanner');
   const goal=point(banner),origin=point(node);
   await projectile(origin,goal,'#ff214c','counter');
   if(game===g){
    flash(banner,'#ff214c');
    banner?.classList.add('ad-counter-damage');
    if(event.amount>0){
     roleStatFloat(banner,'−'+event.amount+' LP · GEGENSCHLAG','counter-damage');
     window.ArcaneSfx208?.play?.('damage');
    }
    const shock=document.createElement('div');
    shock.className='ad-counter-impact';shock.setAttribute('aria-hidden','true');
    if(goal){shock.style.left=goal.x+'px';shock.style.top=goal.y+'px';document.body.append(shock);setTimeout(()=>shock.remove(),480);}
    setTimeout(()=>banner?.classList.remove('ad-counter-damage'),450);
   }
  }
 }
 async function playBatch(g,batch){
  if(!batch.steps.length)return;
  const orbs=new Map();
  try{
   for(const target of batch.targets){
    const p=point(creatureNode(g,1-batch.owner,target.uid,target.index));if(!p)continue;
    const orb=document.createElement('div');orb.className='ad-soul-orb';orb.style.left=p.x+'px';orb.style.top=p.y+'px';orb.setAttribute('aria-hidden','true');document.body.append(orb);orbs.set(target.uid,orb);
   }
   await delay(330);
   for(const step of batch.steps){if(game!==g||!motion())break;await playEvent(g,step,orbs);await delay(110);}
  }finally{for(const orb of orbs.values()){orb.classList.add('ad-orb-dismiss');setTimeout(()=>orb.remove(),280);}}
 }
 function flush(g){
  if(flushing.has(g))return flushing.get(g);
  if(!queues.get(g)?.length)return Promise.resolve();
  const work=Promise.resolve().then(async()=>{const q=queues.get(g)||[];try{while(q.length){const event=q.shift();if(game!==g||!motion())continue;if(event.type==='turn')await playBatch(g,event);else await playEvent(g,event);}}finally{queues.delete(g);flushing.delete(g);}});
  flushing.set(g,work);return work;
 }
 window.ArcaneDefenderFX=Object.freeze({beginTurn,record,endTurn,flush,charge,projectile,pending:g=>(queues.get(g)||[]).map(e=>({...e,steps:e.steps?.map(s=>({...s}))}))});
 const full=fullCardHtml,board=cardHtml;
 fullCardHtml=function(c,attrs='',classes='',badge=''){return full(c,attrs,classes+(charge(c)?' ad-overcharged':''),badge);};
 cardHtml=function(c,...args){
  let html=board(c,...args);const attack=effectiveAttack(game,c,null),defense=dataOf(c).def;
  if(Math.max(attack,defense)>=10000){
   html=html.replace('class="board-creature','class="board-creature ad-compact-values')
    .replace('<b>⚔','<b title="ATK '+attack+'" aria-label="Angriff '+attack+'">')
    .replace('<b>◆','<b title="DEF '+defense+'" aria-label="Verteidigung '+defense+'">');
  }
  const state=charge(c);
  if(state)html=html.replace('class="board-creature','data-overcharge="'+state.extra+'" title="Überladen: '+state.extra+' temporäre DEF über dem regulären Maximum" class="board-creature ad-overcharged');
  return html;
 };
 function ability(c){
  if(!defender(c))return '';
  const state=charge(c);
  return '<section class="ad-defender-ability"><strong>✦ Gegenschlag</strong><p>Im PvE verursacht dieses Monster in Verteidigungsposition nach einem gültigen Angriff 50 % seiner aktuellen ATK als Schaden an den LP des Angreifers – auch wenn es dabei zerstört wird. Ein Schutzschild kann den Schaden abfangen. Während „Letztes Bollwerk“ angriffsimmun macht, wird kein Gegenschlag ausgelöst.</p>'+(state?'<p class="ad-charge-note"><strong>Überladen · +'+state.extra+' DEF</strong><br>Aktuell '+state.current+' / reguläres Maximum '+state.max+'. Die gespeicherte Seelenessenz und verdichtete Essenz bilden temporäre DEF. Das Leuchten endet, sobald kein Überschuss mehr besteht.</p>':'')+'</section>';
 }
 const preview=renderCardPreview;
 renderCardPreview=function(...args){const r=preview(...args),root=$('largeCardPreview');if(!game||!root||root.querySelector('.ad-defender-ability'))return r;const uid=Number(root.querySelector('[data-instance-uid]')?.dataset.instanceUid);const c=game.players.flatMap(p=>[...p.hand,...p.field.filter(Boolean)]).find(c=>c.uid===uid);if(c)root.insertAdjacentHTML('beforeend',ability(c));return r;};
 const detail=cardDetailPanel;
 cardDetailPanel=function(c,...args){const html=detail(c,...args);return c?html.replace('<div class="deck-preview-pills">',ability(c)+'<div class="deck-preview-pills">'):html;};
 const enemy=onEnemySlot;
 onEnemySlot=function(...args){const r=enemy(...args),root=$('modal')?.querySelector('.arcane-enemy-large');if(root&&!root.querySelector('.ad-defender-ability')){const c=game?.players[game.mode==='pve'?1:1-game.active]?.field[args[0]];if(c)root.insertAdjacentHTML('beforeend',ability(c));}return r;};
 // Reward cards get a separate centered scene. Each scene closes independently.
 let rewardScene=null,rewardItems=[],leaving=false;
 const presented=new WeakSet();
 function nextReward(){
  rewardScene?.remove();rewardScene=null;
  const item=rewardItems.shift();if(!item){$('overlay').inert=false;$('modalMenu')?.focus();return;}
  const scene=document.createElement('div');scene.className='ad-card-reward-scene';scene.setAttribute('role','dialog');scene.setAttribute('aria-modal','true');scene.setAttribute('aria-label','Kartenbelohnung');
  const particles=Array.from({length:36},(_,i)=>'<i style="--a:'+(i*10)+'deg;--d:'+(i%9)*-.31+'s;--r:'+(140+i%6*24)+'px">✧</i>').join('');
  scene.innerHTML='<div class="ad-reward-particles" aria-hidden="true">'+particles+'</div><section class="ad-card-reward-panel">'+item+'<button class="btn primary" data-reward-close>WEITER · '+(rewardItems.length?'NÄCHSTE KARTE':'DUELLERGEBNIS')+'</button><small class="ad-reward-dismiss">Klick auf den Hintergrund oder Esc</small></section>';
  scene.addEventListener('click',event=>{if(event.target===scene||event.target.closest('[data-reward-close]')){event.preventDefault();event.stopImmediatePropagation();nextReward();}});
  $('overlay').inert=true;document.body.append(scene);rewardScene=scene;scene.querySelector('[data-reward-close]')?.focus();
 }
 const finish=showFinished;
 showFinished=function(...args){if(game&&presented.has(game))return;const r=finish(...args),g=game;if(!g?.finishShown||g.winner===null||presented.has(g))return r;presented.add(g);const modal=$('modal');modal?.classList.add('ad-result-scroll');
  rewardItems=[...modal.querySelectorAll('.arcane-reward-showcase')].map(node=>{const html=node.outerHTML;node.remove();return html;});
  if(rewardItems.length)nextReward();return r;
 };
 const hide=hideModal;
 hideModal=function(...args){
  if(rewardScene){nextReward();return;}
  if(!leaving&&game?.finishShown&&game.winner!==null&&!$('overlay').classList.contains('hidden')&&$('modal').querySelector('#modalMenu')){
   leaving=true;try{return returnToMenu();}finally{leaving=false;}
  }
  return hide(...args);
 };
 window.ArcaneVictoryRewards=Object.freeze({get active(){return !!rewardScene;},dismiss:nextReward,get remaining(){return rewardItems.length;}});
})();
