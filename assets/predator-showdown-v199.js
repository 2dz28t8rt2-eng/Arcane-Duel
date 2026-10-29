/* Arcane Duel v19.9: cinematic-only Rudelführer showdown.
 * The battle outcome is always resolved by the game reducer first.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ArcanePredatorShowdown199=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const valid=new Set(['struggle','overthrow','stalemate']);
 let current=null;
 const names={struggle:'MACHTKAMPF',overthrow:'STURZ DES ALTEN',stalemate:'PATT'};
 const subtitles={struggle:'BEIDE VERLETZT · −15 % ATK / DEF',
  overthrow:'DER ALTE RUDELFÜHRER FÄLLT',
  stalemate:'BEIDE ÜBERLEBEN · EIN NEUER KÖNIG'};
 const reduced=()=>typeof window==='undefined'||
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 function node(tag,cls,text,parent){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  if(parent)parent.append(el);
  return el;
 }
 function slashSound(strength=1){
  try{
   const cfg=window.ArcaneSoundscape?.getSettings?.();
   if(cfg&&(cfg.enabled===false||cfg.volume<=0))return;
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return;
   const ctx=new Audio(),now=ctx.currentTime,len=Math.floor(ctx.sampleRate*.23);
   const buffer=ctx.createBuffer(1,len,ctx.sampleRate),channel=buffer.getChannelData(0);
   for(let i=0;i<len;i++)channel[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.7);
   const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   noise.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(2200,now);
   filter.frequency.exponentialRampToValueAtTime(510,now+.2);filter.Q.value=.72;
   gain.gain.setValueAtTime(.0001,now);
   gain.gain.exponentialRampToValueAtTime(.12*strength*Math.min(1.5,cfg?.volume/.35||1),now+.019);
   gain.gain.exponentialRampToValueAtTime(.0001,now+.22);
   noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
   noise.start(now);noise.stop(now+.225);
   setTimeout(()=>ctx.close().catch(()=>{}),420);
  }catch(_){} // Sound must never interrupt a fusion.
 }
 function card(parent,side,info){
  const face=node('div','ad199-face ad199-'+side,undefined,parent);
  const portrait=node('div','ad199-portrait',undefined,face);
  const art=typeof info?.art==='string'?info.art:'';
  if(art){const img=node('img','',undefined,portrait);img.src=art;img.alt='';}
  else node('span','ad199-no-art','✦',portrait);
  node('span','ad199-name',info?.name||'Rudelführer',face);
  node('span','ad199-stats',(Number(info?.atk)||0)+' ATK · '+(Number(info?.def)||0)+' DEF',face);
  const claw=node('div','ad199-claws',undefined,face);
  for(let i=0;i<3;i++)node('i','',undefined,claw);
  return face;
 }
 function blood(layer,count){
  for(let i=0;i<count;i++){
   const speck=node('i','ad199-blood',undefined,layer);
   const angle=2*Math.PI*i/count,dist=70+(i%7)*20;
   speck.style.setProperty('--vx',Math.round(Math.cos(angle)*dist)+'px');
   speck.style.setProperty('--vy',Math.round(Math.sin(angle)*dist)+'px');
   speck.style.setProperty('--delay',(i%4)*.022+'s');
  }
 }
 function play(event){
  if(typeof document==='undefined'||!valid.has(event?.outcome))return Promise.resolve(false);
  current?.stop?.();
  const fast=reduced()||window.animationSpeed==='instant';
  const scene=node('section','ad199-scene'+(fast?' ad199-reduced':''),undefined,document.body);
  scene.setAttribute('role','dialog');scene.setAttribute('aria-label','Kampf der Rudelführer');
  const stage=node('div','ad199-stage',undefined,scene);
  node('div','ad199-kicker','🐾  DIE KRONE FORDERT BLUT  🐾',stage);
  node('h2','ad199-headline','KAMPF UM DAS RUDEL',stage);
  const arena=node('div','ad199-arena',undefined,stage);
  card(arena,'old',event.old);
  card(arena,'new',event.new);
  const dust=node('div','ad199-dust',undefined,arena);
  for(let i=0;i<8;i++)node('i','',undefined,dust);
  const strike=node('div','ad199-strike',undefined,arena);
  for(let i=0;i<3;i++)node('i','',undefined,strike);
  const particles=node('div','ad199-particles',undefined,arena);
  const crown=node('div','ad199-crown','♛',arena);
  const outcome=node('div','ad199-outcome',undefined,stage);
  node('strong','',names[event.outcome],outcome);
  node('span','',subtitles[event.outcome],outcome);
  node('p','ad199-labels','ALTER ANFÜHRER                                 NEUER ANFÜHRER',stage);
  const skip=node('button','ad199-skip','Überspringen',scene);skip.type='button';
  let timeoutIds=[],finish;
  const done=new Promise(resolve=>{finish=resolve;});
  const stop=()=>{
   timeoutIds.forEach(clearTimeout);timeoutIds=[];
   scene.remove();if(current?.stop===stop)current=null;finish(true);
  };
  current={stop};skip.addEventListener('click',stop);
  const later=(fn,ms)=>timeoutIds.push(setTimeout(fn,ms));
  const result=()=>{
   scene.classList.add('ad199-resolved','ad199-'+event.outcome);
   if(event.outcome==='overthrow')blood(particles,34);
   if(event.outcome==='struggle')blood(particles,18);
   if(!fast)slashSound(event.outcome==='stalemate'?.48:1);
  };
  if(fast){result();later(stop,300);return done;}
  later(()=>{scene.classList.add('ad199-clashing');slashSound(.75);},230);
  later(()=>slashSound(.9),650);
  later(()=>slashSound(.8),1000);
  later(()=>slashSound(1),1370);
  later(result,1650);
  later(()=>scene.classList.add('ad199-crowned'),1890);
  later(stop,2950);
  return done;
 }
 return Object.freeze({version:'19.9',play,names});
});
