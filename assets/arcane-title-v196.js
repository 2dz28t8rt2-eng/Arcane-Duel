/* Arcane Duel v19.6 · Cinematic front door; no gameplay or save-state writes. */
'use strict';
(()=>{
 const title=document.getElementById('ad196-title');
 const app=document.getElementById('app');
 if(!title||!app||window.ArcaneTitleGate)return;

 const seenKey='arcane-duel-title-seen-v1';
 const skipKey='arcane-duel-title-skip-intro-v1';
 const nav=title.querySelector('.ad196-nav');
 const options=title.querySelector('#ad196-settings');
 const credits=title.querySelector('#ad208-credits');
 const checkbox=title.querySelector('#ad196-music-enabled');
 const volume=title.querySelector('#ad196-volume');
 const volumeLabel=title.querySelector('#ad196-volume-label');
 const skipCheckbox=title.querySelector('#ad196-skip-intro');
 const resume=title.querySelector('[data-ad196-action="resume"]');
 const buttons=()=>Array.from(nav.querySelectorAll('button:not([hidden])'));
 const read=(store,key)=>{try{return store.getItem(key);}catch{return null;}};
 const write=(store,key,value)=>{try{store.setItem(key,value);}catch{}};
 const reduceMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const audio=()=>window.ArcaneSoundscape;
 const saved=()=>{
  // The royal menu owns the saved-duel format and continues to own Resume.
  const link=document.querySelector('.fm-resume-bar [data-royal="resume"]');
  return !!link;
 };

 let readyTimer=0,closing=false,selection=0,returnButton=null;
 function choose(index){
  const list=buttons();if(!list.length)return;
  selection=(index+list.length)%list.length;
  list.forEach((b,i)=>b.classList.toggle('ad196-selected',i===selection));
 }
 function syncSettings(){
  const settings=audio()?.getSettings?.()||{enabled:true,volume:.35};
  checkbox.checked=!!settings.enabled;
  volume.value=String(Math.round(settings.volume*100));
  volumeLabel.textContent=volume.value+' %';
  skipCheckbox.checked=read(localStorage,skipKey)==='1';
 }
 function syncResume(){resume.hidden=!saved();choose(0);}
 function openSettings(){
  if(credits)credits.hidden=true;title.classList.remove('ad196-credits-open');
  syncSettings();options.hidden=false;title.classList.add('ad196-options-open');
  checkbox.focus({preventScroll:true});
 }
 function closeSettings(){
  options.hidden=true;if(credits)credits.hidden=true;title.classList.remove('ad196-options-open','ad196-credits-open');
  const selected=buttons()[selection];selected?.focus({preventScroll:true});
 }
 function openCredits(){
  options.hidden=true;title.classList.remove('ad196-options-open');
  if(!credits)return;
  credits.hidden=false;credits.scrollTop=0;title.classList.add('ad196-credits-open');
  credits.focus({preventScroll:true});
 }
 function hideThen(callback){
  if(closing)return;
  closing=true;
  window.clearTimeout(readyTimer);
  title.classList.add('ad196-exiting');
  write(sessionStorage,seenKey,'1');
  // Cut the title theme at the click; leave breathing room before the next piece.
  audio()?.setTransientMuted?.(true);
  audio()?.setScene?.('mystery');
  const duration=reduceMotion()?550:2600;
  window.setTimeout(()=>audio()?.setTransientMuted?.(false),reduceMotion()?450:1750);
  window.setTimeout(()=>{
   title.hidden=true;title.classList.remove('ad196-exiting');
   app.inert=false;closing=false;
   if(typeof callback==='function')callback();
   else if(returnButton&&document.contains(returnButton))returnButton.focus({preventScroll:true});
   audio()?.setScene?.('');
  },duration);
 }
 function action(type){
  if(!title.classList.contains('ad196-ready')||closing)return;
  if(type==='settings'){openSettings();return;}
  if(type==='credits'){openCredits();return;}
  if(type==='back'){closeSettings();return;}
  if(type==='duo'){hideThen(()=>window.location.assign('duo-campaign-v2.html'));return;}
  if(type==='collection'){hideThen(()=>window.location.assign('collection-v3.html'));return;}
  if(type==='resume'){
   hideThen(()=>{
    const btn=document.querySelector('.fm-resume-bar [data-royal="resume"]');
    if(btn)btn.click();
   });
   return;
  }
  // Entering solo leaves the existing royal game menu intact; it is the only
  // place where a player deliberately starts a new duel or loads a save.
  hideThen();
 }
 function open({instant=false}={}){
  if(!title.hidden&&!closing)return;
  closing=false;title.hidden=false;title.classList.remove('ad196-exiting');
  title.classList.remove('ad196-reveal','ad196-ready','ad196-options-open','ad196-credits-open');
  options.hidden=true;if(credits)credits.hidden=true;app.inert=true;
  syncResume();audio()?.setScene?.('title');
  // Reflow is intentional: replay the reveal after the player returns to title.
  void title.offsetWidth;
  window.requestAnimationFrame(()=>title.classList.add('ad196-reveal'));
  readyTimer=window.setTimeout(()=>{
   title.classList.add('ad196-ready');
   buttons()[selection]?.focus({preventScroll:true});
  },instant||reduceMotion()||read(localStorage,skipKey)==='1'?100:3700);
 }

 title.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-ad196-action]');
  if(button&&title.contains(button))action(button.dataset.ad196Action);
 });
 nav.addEventListener('pointerover',event=>{
  const button=event.target.closest?.('button');
  const index=buttons().indexOf(button);if(index>=0)choose(index);
 });
 document.addEventListener('keydown',event=>{
  if(title.hidden||closing||!title.classList.contains('ad196-ready'))return;
  if(!options.hidden||(credits&&!credits.hidden)){
   if(event.key==='Escape'){event.preventDefault();closeSettings();}
   return;
  }
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();choose(selection+(event.key==='ArrowDown'?1:-1));
   buttons()[selection]?.focus({preventScroll:true});
  }else if(event.key==='Enter'&&!event.target.closest?.('button')){
   event.preventDefault();buttons()[selection]?.click();
  }
 });
 checkbox.addEventListener('change',()=>audio()?.setEnabled?.(checkbox.checked));
 volume.addEventListener('input',()=>{
  volumeLabel.textContent=volume.value+' %';audio()?.setVolume?.(Number(volume.value)/100);
 });
 skipCheckbox.addEventListener('change',()=>write(localStorage,skipKey,skipCheckbox.checked?'1':'0'));

 function titleButton(){
  const host=document.querySelector('.mast-actions');if(!host)return;
  const button=document.createElement('button');button.type='button';
  button.className='btn ghost tiny';button.id='ad196-back-to-title';button.textContent='✧ Titel';
  button.title='Zum Titelbildschirm zurückkehren';
  button.addEventListener('click',()=>{returnButton=button;open({instant:true});});
  host.prepend(button);
  const refresh=()=>{
   const duel=document.getElementById('duelScreen');
   button.hidden=!!duel&&!duel.hidden;
  };
  refresh();window.setInterval(refresh,850);
 }
 window.ArcaneTitleGate=Object.freeze({open,close:()=>hideThen(),isOpen:()=>!title.hidden});
 titleButton();

 const force=new URLSearchParams(window.location.search).has('show-title');
 if(read(sessionStorage,seenKey)&&!force){title.hidden=true;app.inert=false;}
 else{
  // HTML paints an immediate pure-black frame while deferred game assets load.
  // Hide and reopen within this same task to trigger the reveal animation.
  title.hidden=true;open();
 }
})();
