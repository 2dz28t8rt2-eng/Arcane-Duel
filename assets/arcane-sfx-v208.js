/* Arcane Duel v20.8 · event-based sampled sound design.
 * Audio failure is fail-silent; this layer never mutates combat state.
 */
'use strict';
(()=>{
 if(window.ArcaneSfx208)return;
 const ROOT='assets/sfx-v208/';
 const sounds=Object.freeze({
  orbit:['fusion-orbit.ogg',.64,5.75],summon:['summon.ogg',.47,1.1],
  draw:['draw.ogg',.36,.75],destroy:['destroy.ogg',.66,1.95],
  lose:['lose.ogg',.9,4.4],damage:['damage.ogg',.66,1.8],
  decay:['decay.ogg',.35,1.7],powerup:['powerup.ogg',.33,.42],
  idle:['leader-idle.ogg',.12,3.4],roar:['leader-roar.ogg',.76,1.1],
  menu:['menu.ogg',.40,1.5],win:['win.ogg',.92,4.0],
  calc:['fusion-calc.ogg',.35,.65]
 });
 const live=new Set(),missing=new Set(),last={time:0,outcome:'',scene:''};
 let lastSnapshot=null,duoGame=null,duoSeat=-1,nextIdle=0;
 const timers=new Set();
 const duo=()=>!!document.getElementById('duoSeats');
 const enabled=()=>{
  if(document.hidden)return false;
  if(duo())return window.ArcaneDuoSound194?.isEnabled?.()===true;
  return window.ArcaneSoundscape?.getSettings?.()?.enabled!==false;
 };
 const vol=()=>{
  if(duo())return (window.ArcaneDuoSound194?.getVolume?.()??35)/100;
  return Math.min(1,Math.max(0,window.ArcaneSoundscape?.getSettings?.()?.volume??.35))/.35;
 };
 function schedule(fn,delay){const timer=setTimeout(()=>{timers.delete(timer);fn();},delay);timers.add(timer);return timer;}
 function play(kind,{gain=1,stopAfter=0,startAt=0}={}){
  const spec=sounds[kind];if(!spec||missing.has(kind)||!enabled()||typeof Audio!=='function')return null;
  const a=new Audio(ROOT+spec[0]);a.preload='auto';
  a.volume=Math.min(1,Math.max(0,spec[1]*gain*vol()));
  a.addEventListener('ended',()=>live.delete(a),{once:true});
  a.addEventListener('error',()=>{missing.add(kind);live.delete(a);},{once:true});
  live.add(a);
  const duration=Math.min(spec[2],stopAfter||spec[2]);
  const begin=()=>{if(!enabled()){live.delete(a);return;}try{if(startAt)a.currentTime=startAt;}catch{}
   const p=a.play();p?.catch?.(()=>live.delete(a));};
  if(a.readyState>=1)begin();else{a.addEventListener('loadedmetadata',begin,{once:true});a.load();}
  schedule(()=>{if(!live.has(a))return;const initial=a.volume;let n=0;
   const fade=setInterval(()=>{n++;a.volume=Math.max(0,initial*(1-n/5));
    if(n>=5){clearInterval(fade);a.pause();live.delete(a);}},32);
  },Math.max(100,1000*duration-170));
  return a;
 }
 function result(kind){
  const token=kind+':'+(duo()?duoGame?.roomId+':'+duoGame?.revision:typeof game!=='undefined'?game?.id+':'+game?.turn:'');
  if(last.outcome===token)return;
  last.outcome=token;window.ArcaneSoundscape?.setDuck?.(.16,4300);
  play(kind);
 }
 function leaderPresent(){
  if(duo())return !!duoGame?.players?.some(p=>(p.field||[]).some(c=>c?.predatorLeader));
  try{return typeof game!=='undefined'&&game?.mode==='pve'&&game?.players?.some(p=>(p.field||[]).some(c=>c?.predatorLeader));}catch{return false;}
 }
 // Ambient leader phrases never loop loudly or restart on every render.
 function idleTick(){if(!enabled()||!leaderPresent()||Date.now()<nextIdle)return;
  nextIdle=Date.now()+27000+Math.floor(Math.random()*11000);
  play('idle',{gain:.9,startAt:Math.random()>.5?5.5:0,stopAfter:3.3});
 }
 function snapshot(){
  try{
   if(typeof game==='undefined'||typeof uiMode==='undefined'||!game||
    uiMode!=='duel'||game.mode!=='pve'||game.winner!==null)return null;
   return {id:game.id,turn:game.turn,active:game.active,
    players:game.players.map(p=>({hp:p.hp??p.lp??0,
     hand:(p.hand||[]).length,
     field:(p.field||[]).map(c=>c?{uid:c.uid,atk:c.atk,def:c.def,leader:!!c.predatorLeader}:null)}))};
  }catch{return null;}
 }
 function soloTick(){
  const now=snapshot();if(!now){lastSnapshot=null;return;}
  const old=lastSnapshot;lastSnapshot=now;
  if(!old||old.id!==now.id)return;
  let decayed=0,buffed=false,drawn=false,summoned=false,destroyed=false,damage=false;
  for(let side=0;side<2;side++){
   const a=old.players[side],b=now.players[side];
   if(b.hand>a.hand)drawn=true;
   if(b.hp<a.hp)damage=true;
   const oldCards=new Map(a.field.filter(Boolean).map(c=>[c.uid,c]));
   const newCards=new Map(b.field.filter(Boolean).map(c=>[c.uid,c]));
   for(const [id,card] of newCards){
    if(!oldCards.has(id))summoned=true;
    else{const before=oldCards.get(id);if(card.atk<before.atk||card.def<before.def)decayed++;
     if(card.atk>before.atk||card.def>before.def)buffed=true;}
   }
   for(const id of oldCards.keys())if(!newCards.has(id))destroyed=true;
  }
  const inFusion=!!document.querySelector('.ritual-overlay,.duo-cinema170');
  if(drawn)play('draw');if(damage)play('damage');
  if(!inFusion&&summoned)play('summon');
  if(!inFusion&&destroyed)play('destroy');
  // A whole turn's decay is one global cue, not one per affected monster.
  if(decayed){
   // One cue for global round decay; discrete debuffs have individual cues.
   const count=old.turn!==now.turn?1:Math.min(3,decayed);
   for(let i=0;i<count;i++)schedule(()=>play('decay'),i*155);
  }
  if(buffed)play('powerup');
 }
 function onDuoState(before,after,catalog,seat){
  duoGame=after;duoSeat=seat;
  if(!before||!after||before.roomId!==after.roomId||
   before.revision>=after.revision)return;
  const events=window.ArcaneDuoCinematics167?.describe?.(before,after)||[];
  const logs=window.ArcaneDuoSound194?.linesSince?.(before,after)||[];
  const draws=window.ArcaneDuoCinema170?.observed?.(before,after)||[];
  if(draws.some(x=>x.kind==='draw'&&x.count>0&&x.seat===seat))play('draw');
  // The actual fusion cinema owns the orbit sound. Event sounds here play
  // only for visible confirmed consequences, never speculative actions.
  if(events.some(x=>x.type==='destroy'))schedule(()=>play('destroy'),390);
  if(events.some(x=>x.type==='summon'))schedule(()=>play('summon'),280);
  if(events.some(x=>x.type==='arena')||logs.some(x=>/arena-zerfall/i.test(x)))play('decay');
  if(events.some(x=>x.type==='fate'))play('powerup');
  if(events.some(x=>x.type==='attack')&&logs.some(x=>/direkter Angriff/i.test(x)))
   schedule(()=>play('damage'),410);
  if(before.status!=='finished'&&after.status==='finished'){
   const player=after.players?.find(x=>x.seat===seat);
   if(player)result(player.team===after.winner?'win':'lose');
  }
 }
 function stopAll(){for(const a of live){try{a.pause();}catch{}}live.clear();}
 function listenMenu(){document.getElementById('ad196-title')?.addEventListener('click',event=>{
  if(event.target.closest('[data-ad196-action]'))play('menu');});
 }
 function install(){
  listenMenu();
  // No gameplay overrides: observe the current solo snapshot only.
  setInterval(soloTick,260);setInterval(idleTick,2600);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
 }
 window.ArcaneSfx208=Object.freeze({play,onDuoState,result,leaderPresent,stopAll,sounds});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
