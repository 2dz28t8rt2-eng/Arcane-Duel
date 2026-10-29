/* Arcane Duel v18.1 – one presentation for solo, character and 2v2 boosters.
 * Only displays cards already drawn or awarded by the actual game.
 * Purchases, odds, choices and saves remain in their existing handlers.
 */
(function(root,factory){
 const api=factory(root);
 if(root){root.ArcanePackCinema178=api;root.ArcanePackCinema181=api;}
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const FAST_KEY='arcane-pack-cinema-fast-v181';
 const reduced=()=>!!root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  root?.animationSpeed==='instant'||root?.document?.body?.classList.contains('ad-motion-disabled');
 const safeArt=value=>typeof value==='string'&&
  (/^(?:\.?\/?assets\/|data:image\/|https?:\/\/)/i).test(value)?value:'';
 const normalize=cards=>(Array.isArray(cards)?cards:[]).slice(0,30).map(c=>({
  name:String(c?.name||'Unbekannte Karte').slice(0,100),
  level:c?.level!=null&&Number.isFinite(Number(c.level))?Number(c.level):null,
  art:safeArt(c?.art),fusion:!!c?.fusion,ace:!!c?.ace
 }));
 const glowFor=c=>c.ace?'ace':c.fusion&&c.level>=7?'grand':
  c.fusion?'fusion':(c.level>=8?'high':'normal');
 const staggerFor=count=>count<=3?260:Math.max(42,Math.floor(950/Math.max(1,count-1)));
 const fast=()=>{try{return root?.localStorage?.getItem(FAST_KEY)==='true';}catch(_){return false;}};
 const setFast=value=>{try{root?.localStorage?.setItem(FAST_KEY,value?'true':'false');}catch(_){}};
 let active=null;
 function open(cards,{title='ARKANER BOOSTER',subtitle='Deine neuen Karten',selection=false}={}){
  const rewards=normalize(cards);
  if(!root?.document||!rewards.length)return Promise.resolve(false);
  active?.finish();
  const doc=root.document,oldFocus=doc.activeElement,overlay=doc.createElement('section');
  overlay.className='ad178-pack-cinema ad181-pack-cinema';overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Booster öffnen');
  overlay.setAttribute('tabindex','-1');
  const scene=doc.createElement('div');scene.className='ad178-pack-stage';overlay.append(scene);
  const eyebrow=doc.createElement('small');eyebrow.className='ad178-pack-eyebrow';
  eyebrow.textContent='✦ ARCANE DUEL · EIN NEUES GEHEIMNIS ✦';scene.append(eyebrow);
  const heading=doc.createElement('h2');heading.textContent=String(title).slice(0,90);scene.append(heading);
  const status=doc.createElement('p');status.className='ad178-pack-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  status.textContent=String(subtitle||'').slice(0,95)+' · Klicke auf das versiegelte Pack.';
  const pack=doc.createElement('button');pack.type='button';pack.className='ad178-pack';
  pack.setAttribute('aria-label','Magisches Boosterpack öffnen');
  pack.innerHTML='<span class="ad178-pack-face"><span class="ad178-pack-corner">✦</span><span class="ad178-pack-sigil">✧</span><b>ARCANE<br>DUEL</b><em>VERSIEGELT</em><span class="ad178-pack-bottom">✦ ✦ ✦</span></span><i class="ad178-pack-rift"></i>';
  scene.append(pack);
  const sparks=doc.createElement('div');sparks.className='ad178-pack-sparks';
  sparks.setAttribute('aria-hidden','true');
  sparks.innerHTML=Array.from({length:32},(_,i)=>'<i style="--spark:'+(i+1)+';--angle:'+(i*137.5)+'deg"></i>').join('');
  scene.append(sparks,status);
  const results=doc.createElement('div');results.className='ad178-pack-results';
  results.setAttribute('aria-label',selection?'Deine drei Karten zur Auswahl':'Deine neuen Karten');
  scene.append(results);
  const rewardNodes=[];
  for(const [i,item] of rewards.entries()){
   const card=doc.createElement('article');card.className='ad178-reward-card ad178-glow-'+glowFor(item);
   card.style.setProperty('--pack-index',String(i));card.setAttribute('aria-hidden','true');
   const back=doc.createElement('div');back.className='ad178-card-back';
   back.innerHTML='<span>✧</span><b>ARCANE DUEL</b><small>✦</small>';card.append(back);
   const face=doc.createElement('div');face.className='ad178-card-face';
   const art=doc.createElement('div');art.className='ad178-reward-art';
   if(item.art){const img=doc.createElement('img');img.src=item.art;img.alt='';img.loading='eager';art.append(img);}
   else art.textContent='✧';face.append(art);
   const name=doc.createElement('strong');name.textContent=item.name;face.append(name);
   const detail=doc.createElement('small');detail.textContent=(item.level===null?'':`Lv ${item.level}`)+
    (item.ace?' · ACE':item.fusion?' · Fusion':'');face.append(detail);
   card.append(face);results.append(card);rewardNodes.push(card);
  }
  // Reveal rare cards last without moving cards or changing rewards/choices.
  const rarity=card=>card.ace?4:card.fusion&&card.level>=7?3:
   card.level>=8?2:card.fusion?1:0;
  const revealOrder=rewards.map((_,i)=>i).sort((a,b)=>
   rarity(rewards[a])-rarity(rewards[b])||a-b);
  const controls=doc.createElement('div');controls.className='ad178-pack-controls';scene.append(controls);
  const openButton=doc.createElement('button');openButton.type='button';openButton.className='ad178-primary';
  openButton.textContent='✦ Siegel brechen';controls.append(openButton);
  const skip=doc.createElement('button');skip.type='button';skip.textContent='Sofort aufdecken';controls.append(skip);
  const close=doc.createElement('button');close.type='button';close.className='ad178-primary';
  close.textContent=selection?'Zur Kartenauswahl':'Karten ansehen · Schließen';close.hidden=true;controls.append(close);
  const preference=doc.createElement('label');preference.className='ad178-pack-pref';
  const checkbox=doc.createElement('input');checkbox.type='checkbox';checkbox.checked=fast();
  checkbox.addEventListener('change',()=>setFast(checkbox.checked));preference.append(checkbox);
  preference.append(doc.createTextNode('Weitere Packs sofort öffnen'));scene.append(preference);
  let timers=[],finished=false,breaking=false,opened=false,resolve;
  const done=new Promise(r=>resolve=r);
  const later=(callback,ms)=>timers.push(root.setTimeout(callback,ms));
  const clear=()=>{for(const id of timers)root.clearTimeout(id);timers=[];};
  const cinematic=(phase,extra={})=>{
   try{root.ArcanePackExperience195?.onPhase?.(phase,{overlay,scene,pack,
    rewards,rewardNodes,selection,...extra});}catch(_){/* Never block a reward. */}
  };
  const titleEnd=selection?'Wähle jetzt deine Karte aus. Die erste ist kostenlos.':
   'Diese Karten gehören bereits zu deiner Sammlung.';
  function finish(){
   if(finished)return;finished=true;clear();
   cinematic('close');
   doc.removeEventListener('keydown',onKey);overlay.remove();
   if(active?.finish===finish)active=null;
   const choice=selection?doc.querySelector?.('[data-pack-pick]:not([disabled])'):null;
   if(choice?.focus)choice.focus();
   else if(oldFocus?.isConnected&&typeof oldFocus.focus==='function')oldFocus.focus();
   resolve(true);
  }
  function complete(skipped=false){
   if(finished||opened)return;opened=true;clear();
   overlay.classList.add('ad178-pack-dealt','ad178-pack-opened');
   status.textContent=titleEnd;
   for(const card of rewardNodes){card.classList.add('ad178-is-revealed');card.removeAttribute('aria-hidden');}
   cinematic('complete',{skipped});
   openButton.hidden=true;skip.hidden=true;pack.disabled=true;close.hidden=false;close.focus();
  }
  function revealCard(index,position){
   if(finished||opened)return;
   const card=rewardNodes[index];
   card.classList.add('ad178-is-revealed');card.removeAttribute('aria-hidden');
   cinematic('reveal',{index,position,item:rewards[index]});
   if(position===rewardNodes.length-1){
    status.textContent=titleEnd;
    later(complete,420);
   }else status.textContent='Karte '+(position+1)+' von '+rewardNodes.length+' enthüllt …';
  }
  function begin(){
   if(finished||breaking||opened)return;
   breaking=true;pack.disabled=true;openButton.hidden=true;
   overlay.classList.add('ad178-pack-breaking');status.textContent='Das Siegel bricht auf …';
   cinematic('break');
   const spacing=staggerFor(rewardNodes.length);
   later(()=>{overlay.classList.add('ad178-pack-dealt');
    status.textContent='Welche Monster verbergen sich darin?';cinematic('rift');},500);
   revealOrder.forEach((index,position)=>later(()=>revealCard(index,position),
    760+position*spacing));
  }
  function onKey(e){
   if(e.key==='Escape'){
    e.preventDefault();e.stopPropagation();opened?finish():complete(true);return;
   }
   if(e.key!=='Tab')return;
   const choices=[...overlay.querySelectorAll('button:not([hidden]):not([disabled]),input:not([disabled])')];
   if(!choices.length)return;
   const first=choices[0],last=choices[choices.length-1];
   if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}
  }
  pack.onclick=begin;openButton.onclick=begin;skip.onclick=()=>complete(true);close.onclick=finish;
  doc.addEventListener('keydown',onKey);doc.body.append(overlay);active={finish};
  cinematic('ready');
  if(reduced()||fast())complete(true);else pack.focus();
  return done;
 }
 return Object.freeze({version:'18.1',normalize,glowFor,staggerFor,open});
});
