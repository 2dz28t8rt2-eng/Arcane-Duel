/* Arcane Duel 4.0 – position-aware deck preview portal.
 * Visual layer only; the native editor still controls stats, buttons, copies and saves.
 */
'use strict';
(()=>{
 let anchor=null,anchorRect=null,activePanel=null,closing=false;
 const allowed=()=>uiMode==='menu'&&(menuTab==='collection'||menuTab==='fusions');
 const motion=()=>animationSpeed!=='instant'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pause=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const shell=()=>document.getElementById('deckSidePreview');
 function sourceRect(){
  if(anchor?.isConnected)return anchor.getBoundingClientRect();
  if(allowed()){
   const id=editorPreviewIds[menuTab];
   const b=[...document.querySelectorAll('#menuScreen [data-preview-card]')].find(x=>Number(x.dataset.previewCard)===id);
   if(b){anchor=b;return b.getBoundingClientRect();}
  }
  return anchorRect;
 }
 function position(panel){
  const from=sourceRect(),vw=window.innerWidth,vh=window.innerHeight,gap=13;
  const width=Math.min(354,vw-20),height=Math.min(700,vh-24);
  const right=from?from.right+gap:vw/2-width/2,left=from?from.left-width-gap:vw/2-width/2;
  const x=from&&vw-right>=width?right:from&&left>=10?left:clamp(from?from.left+(from.width-width)/2:(vw-width)/2,10,vw-width-10);
  const y=clamp(from?from.top-28:vh/2-height/2,12,vh-height-12);
  panel.style.setProperty('--ad-portal-left',Math.round(x)+'px');
  panel.style.setProperty('--ad-portal-top',Math.round(y)+'px');
  panel.style.setProperty('--ad-portal-width',width+'px');
  panel.style.setProperty('--ad-portal-height',height+'px');
 }
 function ghost(from,to){
  if(!from||!to||!motion())return;
  const card=anchor?.isConnected?anchor:null;if(!card)return;
  const clone=card.cloneNode(true);
  clone.removeAttribute('data-preview-card');clone.removeAttribute('data-preview-kind');
  clone.querySelectorAll('[data-preview-card],[data-preview-kind]').forEach(e=>{e.removeAttribute('data-preview-card');e.removeAttribute('data-preview-kind');});
  clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;
  clone.classList.add('ad-deck-ghost');
  clone.style.left=from.left+'px';clone.style.top=from.top+'px';
  clone.style.width=from.width+'px';clone.style.height=from.height+'px';
  document.body.append(clone);
  const sx=Math.max(.2,to.width/Math.max(1,from.width)),sy=Math.max(.2,to.height/Math.max(1,from.height));
  const anim=clone.animate([
   {transform:'translate(0,0) scale(1,1)',opacity:1,filter:'brightness(1.5) drop-shadow(0 0 12px #f4cd83)'},
   {transform:'translate('+(to.left-from.left)+'px,'+(to.top-from.top)+'px) scale('+sx+','+sy+')',
    opacity:.12,filter:'brightness(1.15) drop-shadow(0 0 17px #a6c5ed)'}
  ],{duration:430,easing:'cubic-bezier(.18,.75,.18,1)',fill:'forwards'});
  anim.onfinish=()=>clone.remove();anim.oncancel=()=>clone.remove();
  setTimeout(()=>clone.remove(),600);
 }
 function close(immediate=false){
  const panel=activePanel;if(!panel)return;
  activePanel=null;
  const target=sourceRect();
  const preview=panel.querySelector('.deck-preview-card .hand-card');
  const large=preview?.getBoundingClientRect();
  if(!immediate&&motion()&&target&&large){
   ghost(large,target);
   const anim=panel.animate([
    {opacity:1,transform:'translateY(0) scale(1)'},
    {opacity:0,transform:'translateY(-8px) scale(.94)'}
   ],{duration:330,easing:'ease-in',fill:'forwards'});
   anim.onfinish=()=>{if(panel.isConnected){panel.classList.remove('ad-deck-portal');panel.style.cssText='';}};
   setTimeout(()=>{if(panel.isConnected&&!activePanel){panel.classList.remove('ad-deck-portal');panel.style.cssText='';}},400);
  }else{panel.classList.remove('ad-deck-portal');panel.style.cssText='';}
  panel.setAttribute('aria-hidden','true');
  anchor=null;anchorRect=null;
 }
 function show(){
  if(!allowed())return;
  const panel=shell();if(!panel)return;
  activePanel=panel;closing=false;
  panel.classList.add('ad-deck-portal');
  panel.removeAttribute('aria-hidden');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','Kartendetails und Deckaktionen');
  position(panel);
  const oldClose=panel.querySelector('.ad-deck-close');if(oldClose)oldClose.remove();
  const closeBtn=document.createElement('button');
  closeBtn.type='button';closeBtn.className='ad-deck-close';closeBtn.textContent='×';
  closeBtn.setAttribute('aria-label','Kartenvorschau schließen');
  closeBtn.onclick=(event)=>{event.stopPropagation();close();};
  panel.prepend(closeBtn);
  const current=anchorRect||sourceRect();
  const preview=panel.querySelector('.deck-preview-card .hand-card');
  if(motion()&&current&&preview){
   ghost(current,preview.getBoundingClientRect());
   panel.animate([{opacity:0,transform:'translateY(11px) scale(.95)'},{opacity:1,transform:'none'}],
    {duration:470,easing:'cubic-bezier(.18,.8,.2,1)'});
  }
 }
 const native=updateDeckPreview;
 updateDeckPreview=function(fusion,id){
  // Save the thumbnail before any engine-controlled markup replacement.
  if(!anchor?.isConnected){
   anchor=document.querySelector('#menuScreen [data-preview-card="'+id+'"]');
   anchorRect=anchor?.getBoundingClientRect()||null;
  }
  native(fusion,id);
  show();
 };
 document.getElementById('menuScreen')?.addEventListener('click',event=>{
  const btn=event.target.closest('[data-preview-card]');
  if(!btn||!allowed())return;
  anchor=btn;anchorRect=btn.getBoundingClientRect();
 },true);
 document.addEventListener('pointerdown',event=>{
  if(!activePanel||event.target.closest('#deckSidePreview,[data-preview-card]'))return;
  close();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&activePanel){event.preventDefault();close();}});
 document.addEventListener('scroll',event=>{
  if(!activePanel||event.target.closest?.('#deckSidePreview'))return;
  if(anchor?.isConnected){
   const r=anchor.getBoundingClientRect();
   if(r.bottom<0||r.top>innerHeight){close(true);return;}
  }
  position(activePanel);
 },true);
 window.addEventListener('resize',()=>{if(activePanel)position(activePanel);});
 const beforeMenu=renderMenu;
 renderMenu=function(...args){
  close(true);
  return beforeMenu(...args);
 };
 window.ArcaneDeckPortal=Object.freeze({version:'4.0.0',close:()=>close(),reposition:()=>activePanel&&position(activePanel)});
})();