/* Each click completes exactly one presentation phase. No battle state is touched. */
'use strict';
(()=>{
 function create(root,delay=ms=>new Promise(r=>setTimeout(r,ms))){
  let current=null,closed=false;
  const button=document.createElement('button');button.type='button';button.className='ad-phase-skip';
  root.append(button);
  function skip(){if(!current||current.skipped)return false;current.skipped=true;current.release();return true;}
  function click(event){event.preventDefault();event.stopImmediatePropagation();skip();}
  root.addEventListener('click',click,true);
  async function wait(ms,clock=delay){
   const token=current;if(closed||token?.skipped)return;
   await Promise.race([clock(ms),token?.signal||new Promise(()=>{})]);
  }
  async function run(name,action){
   if(closed)return;
   let release;const token={name,skipped:false,signal:new Promise(r=>{release=r;})};token.release=release;
   current=token;root.dataset.cinemaPhase=name;button.textContent='Phase überspringen · '+name;
   try{return await action();}finally{if(current===token)current=null;}
  }
  async function animate(animation,duration){
   try{await Promise.race([animation.finished?.catch?.(()=>{}),wait(duration,ms=>new Promise(r=>setTimeout(r,ms)))] .filter(Boolean));}
   finally{try{animation.finish();}catch{animation.cancel();}}
  }
  function close(){closed=true;skip();root.removeEventListener('click',click,true);button.remove();delete root.dataset.cinemaPhase;}
  return {run,wait,animate,skip,close,get phase(){return current?.name||null;}};
 }
 window.ArcaneCinemaPhases=Object.freeze({create});
})();
