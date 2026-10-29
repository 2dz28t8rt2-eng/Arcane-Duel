/* Arcane Duel v17.8 – reward-only booster cinema, shared by solo and 2v2.
 * It never rolls cards, charges currency, or changes either savegame.
 */
(function(root,factory){
 const api=factory(root);
 if(root)root.ArcanePackCinema178=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const reduced=()=>!!root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  root?.animationSpeed==='instant'||root?.document?.body?.classList.contains('ad-motion-disabled');
 const safeArt=value=>typeof value==='string'&&
  (/^(?:\.?\/?assets\/|data:image\/|https?:\/\/)/i).test(value)?value:'';
 const normalize=cards=>(Array.isArray(cards)?cards:[]).slice(0,30).map(c=>({
  name:String(c?.name||'Unbekannte Karte').slice(0,100),
  level:Number.isFinite(Number(c?.level))?Number(c.level):null,
  art:safeArt(c?.art),fusion:!!c?.fusion,ace:!!c?.ace
 }));
 let active=null;
 function open(cards,{title='ARKANER BOOSTER',subtitle='Deine neuen Karten'}={}){
  const rewards=normalize(cards);
  if(!root?.document||!rewards.length)return Promise.resolve(false);
  active?.finish();
  const doc=root.document,overlay=doc.createElement('section');
  overlay.className='ad178-pack-cinema';overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Booster öffnen');
  const scene=doc.createElement('div');scene.className='ad178-pack-stage';overlay.append(scene);
  const eyebrow=doc.createElement('small');eyebrow.className='ad178-pack-eyebrow';
  eyebrow.textContent='✦ ARCANE DUEL · DEINE BELOHNUNG ✦';scene.append(eyebrow);
  const heading=doc.createElement('h2');heading.textContent=String(title).slice(0,90);scene.append(heading);
  const pack=doc.createElement('div');pack.className='ad178-pack';pack.setAttribute('aria-hidden','true');
  pack.innerHTML='<div class="ad178-pack-face"><div class="ad178-pack-sigil">✧</div><b>ARCANE<br>DUEL</b><span>✦ VERSIEGELT ✦</span></div><i class="ad178-pack-rift"></i>';
  scene.append(pack);
  const status=doc.createElement('p');status.className='ad178-pack-status';
  status.textContent='Das magische Siegel löst sich …';scene.append(status);
  const results=doc.createElement('div');results.className='ad178-pack-results';
  results.setAttribute('aria-label','Erhaltene Karten');scene.append(results);
  for(const [i,item] of rewards.entries()){
   const card=doc.createElement('article');card.className='ad178-reward-card';
   card.style.setProperty('--pack-index',String(i));
   const art=doc.createElement('div');art.className='ad178-reward-art';
   if(item.art){const img=doc.createElement('img');img.src=item.art;img.alt='';img.loading='eager';art.append(img);}
   else art.textContent='✧';
   card.append(art);
   const name=doc.createElement('strong');name.textContent=item.name;card.append(name);
   const detail=doc.createElement('small');detail.textContent=(item.level===null?'':`LV ${item.level}`)+
    (item.ace?' · ACE':item.fusion?' · FUSION':'');card.append(detail);
   results.append(card);
  }
  const controls=doc.createElement('div');controls.className='ad178-pack-controls';scene.append(controls);
  const skip=doc.createElement('button');skip.type='button';skip.textContent='Animation überspringen';
  controls.append(skip);
  const close=doc.createElement('button');close.type='button';close.className='ad178-primary';
  close.textContent='Karten ansehen · Schließen';close.hidden=true;controls.append(close);
  let timer1=0,timer2=0,finished=false,opened=false;
  let resolve;
  const done=new Promise(r=>resolve=r);
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();opened?finish():reveal();}};
  function finish(){
   if(finished)return;finished=true;root.clearTimeout(timer1);root.clearTimeout(timer2);
   doc.removeEventListener('keydown',onKey);overlay.remove();
   if(active?.finish===finish)active=null;
   resolve(true);
  }
  function reveal(){
   if(finished||opened)return;opened=true;root.clearTimeout(timer1);root.clearTimeout(timer2);
   overlay.classList.add('ad178-pack-opened');
   status.textContent=String(subtitle).slice(0,130)+' · '+rewards.length+' Karte'+
    (rewards.length===1?'':'n')+' erhalten';
   skip.hidden=true;close.hidden=false;close.focus();
  }
  skip.onclick=reveal;close.onclick=finish;
  doc.addEventListener('keydown',onKey);
  doc.body.append(overlay);active={finish};skip.focus();
  if(reduced()){reveal();return done;}
  timer1=root.setTimeout(()=>overlay.classList.add('ad178-pack-breaking'),650);
  timer2=root.setTimeout(reveal,1500);
  return done;
 }
 return Object.freeze({version:'17.8',normalize,open});
});
