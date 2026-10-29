/* Arcane Duel v19.6 / desktop 0.1.4 · Licensed music and procedural fallback.
 * Music is locally hosted and credited by the ArcaneTrackCatalog.
 * Audio starts on interaction when the browser's autoplay rules require it.
 */
'use strict';
(()=>{
 if(window.ArcaneSoundscape)return;
 const STORE='arcane-duel-soundscape-v1';
 const read=()=>{try{return JSON.parse(localStorage.getItem(STORE))||{};}catch{return {};}};
 const saved=read();
 const state={enabled:saved.enabled!==false,volume:Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):0.35,scene:'title',running:false,transientMuted:false};
 const bar=(root,chord,melody)=>({root,chord,melody});
 // Each score is an original composition. Notes are MIDI pitches, offsets and
 // durations in beats. Chord movement and thematic contour change by scene.
 const scores={
  title:{bpm:70,beats:3,character:'piano',bars:[
   bar(50,[62,65,69,72],[[0,74,1.25],[1.5,69,.5],[2,72,.75]]),
   bar(48,[60,64,67,71],[[0,71,1],[1.25,72,.65],[2.1,76,.75]]),
   bar(46,[58,62,65,69],[[0,77,1.3],[1.5,74,.5],[2.2,72,.65]]),
   bar(45,[57,62,64,67],[[0,69,1.65],[2,73,.9]]),
   bar(50,[62,65,69,72],[[0,74,.75],[1,77,.6],[2,76,.8]]),
   bar(53,[60,65,69,72],[[0,72,1.3],[1.6,69,.6],[2.35,67,.45]]),
   bar(46,[58,62,65,69],[[0,70,1.4],[1.6,72,.5],[2.2,74,.6]]),
   bar(45,[57,61,64,69],[[0,73,.85],[1.1,69,1.45]])]},
  mystery:{bpm:78,beats:4,character:'mystery',bars:[
   bar(52,[64,67,71,74],[[.5,76,.7],[1.5,79,.9],[3,74,.65]]),
   bar(48,[60,64,67,71],[[0,71,1.1],[2,74,.6],[3,72,.7]]),
   bar(55,[62,67,71,74],[[.5,74,.8],[1.75,81,.6],[3,79,.8]]),
   bar(50,[62,66,69,74],[[0,78,1.35],[2.5,76,.65]]),
   bar(52,[64,67,71,74],[[0,79,.7],[1,76,.5],[2,74,1.2]]),
   bar(57,[64,69,72,76],[[.5,76,.8],[1.5,72,.65],[3,81,.6]]),
   bar(53,[60,65,69,72],[[0,77,1.2],[2,76,.55],[3,72,.8]]),
   bar(52,[64,67,71,76],[[0,76,.65],[1,71,1.2],[3,76,.75]])]},
  duel:{bpm:104,beats:4,character:'pulse',bars:[
   bar(50,[62,65,69,72],[[0,74,1.1],[1.5,77,.7],[2.5,76,.65],[3.25,74,.55]]),
   bar(46,[58,62,65,69],[[0,72,1],[1.6,74,.8],[3,70,.65]]),
   bar(43,[55,58,62,65],[[.25,70,1],[1.75,74,.8],[3,77,.6]]),
   bar(45,[57,61,64,67],[[0,76,.9],[1.5,73,.85],[3,69,.65]]),
   bar(50,[62,65,69,72],[[0,74,.7],[1,77,1.1],[2.5,81,.7]]),
   bar(48,[60,64,67,70],[[0,79,.95],[1.5,76,.75],[3,72,.65]]),
   bar(46,[58,62,65,69],[[0,74,.8],[1.25,70,.6],[2.25,72,.9]]),
   bar(45,[57,61,64,67],[[0,73,1.1],[1.75,69,.6],[2.75,74,.9]])]},
  shadow:{bpm:103,beats:4,character:'shadow',bars:[
   bar(49,[61,64,68,71],[[0,73,1],[1.5,71,.5],[3,68,.5]]),
   bar(45,[57,61,64,69],[[.25,69,.75],[2,73,.8],[3.25,76,.5]]),
   bar(47,[59,62,66,69],[[0,78,1.2],[1.75,76,.5],[3,74,.55]]),
   bar(44,[56,59,63,68],[[0,71,.6],[1,75,.55],[2.5,80,.9]]),
   bar(49,[61,64,68,71],[[.5,76,.8],[2,73,.8],[3.25,71,.4]]),
   bar(52,[59,64,68,71],[[0,80,.8],[1.5,78,.5],[2.5,76,1]]),
   bar(47,[59,62,66,71],[[.25,74,.65],[1.25,78,.75],[3,81,.5]]),
   bar(44,[56,61,64,68],[[0,80,.9],[1.75,75,.6],[3,73,.6]])]}
 };
 let ctx=null,output=null,wet=null,limiter=null,loop=null,current='',nextBarAt=0,barIndex=0,forced='';
 const catalog=window.ArcaneTrackCatalog?.tracks||null;
 let media=null,mediaTrack=null,battleMatch='',battleTheme=null;
 const missingFiles=new Set();
 function bossDialogVisible(){
  const overlay=document.getElementById('overlay');
  return !!overlay&&!overlay.classList.contains('hidden')&&
   !!(overlay.querySelector('#showcaseBegin')||overlay.querySelector('#showcaseGo'));
 }
 function matchId(){
  try{if(typeof game!=='undefined'&&game?.id)return String(game.id);}catch{}
  const duoRoom=document.getElementById('duoRoomId')?.textContent?.trim()||'';
  const duoChapter=document.getElementById('duoChapter')?.value||'';
  return duoRoom?`duo:${duoRoom}:${duoChapter}`:'duel:session';
 }
 function chooseLicensedTrack(scene){
  if(!catalog)return null;
  if(scene==='title')return catalog.title;
  if(scene==='mystery')return catalog.menu;
  if(scene==='boss')return catalog.boss;
  const match=matchId();
  if(!battleTheme||battleMatch!==match){
   battleMatch=match;
   battleTheme=catalog.battle[Math.floor(Math.random()*catalog.battle.length)];
  }
  return battleTheme;
 }
 function muteLicensed(){if(media){media.pause();}}
 function licensedPlayer(){
  if(media)return media;
  if(typeof window.Audio!=='function')return null;
  media=new window.Audio();media.preload='auto';media.loop=true;
  media.addEventListener('error',()=>{
   if(mediaTrack)missingFiles.add(mediaTrack.file);
   media.pause();mediaTrack=null;
   // A missing file never silences the game: the original composed scores remain available.
   if(state.enabled)tick();
  });
  return media;
 }
 function playLicensed(scene){
  const song=chooseLicensedTrack(scene),player=licensedPlayer();
  if(!song||!player||missingFiles.has(song.file))return false;
  if(mediaTrack?.id!==song.id){
   mediaTrack=song;player.pause();player.src=song.file;player.load?.();
   try{window.dispatchEvent?.(new CustomEvent('arcane:music-change',{detail:{...song}}));}catch{}
  }
  player.volume=(!document.hidden&&state.enabled&&!state.transientMuted)?state.volume:0;
  if(state.transientMuted||!state.enabled||document.hidden){player.pause();return true;}
  if(player.paused){try{const promise=player.play();promise?.catch?.(()=>{});}catch{}}
  return true;
 }
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function save(){try{localStorage.setItem(STORE,JSON.stringify({enabled:state.enabled,volume:state.volume}));}catch{}}
 function impulse(audio){
  const seconds=1.55,length=Math.floor(audio.sampleRate*seconds),buffer=audio.createBuffer(2,length,audio.sampleRate);
  let seed=17719;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let ch=0;ch<2;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<length;i++){const fade=Math.pow(1-i/length,2.9);data[i]=(random()*2-1)*fade*0.38;}}
  return buffer;
 }
 function init(){
  if(ctx)return true;
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
  try{
   ctx=new Audio();output=ctx.createGain();output.gain.value=0;
   limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=3.5;
   limiter.attack.value=.009;limiter.release.value=.28;
   const convolution=ctx.createConvolver();convolution.buffer=impulse(ctx);
   wet=ctx.createGain();wet.gain.value=.17;convolution.connect(wet);wet.connect(limiter);
   output.connect(limiter);limiter.connect(ctx.destination);
   state.running=true;return true;
  }catch{return false;}
 }
 function envelope(time,peak,sustain,release,attack=.012){
  const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),time+attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*.48),time+Math.max(.14,Math.min(sustain*.74,1.1)));
  gain.gain.setValueAtTime(Math.max(.0001,peak*.32),time+sustain);
  gain.gain.exponentialRampToValueAtTime(.0001,time+sustain+release);
  gain.connect(output);return gain;
 }
 function note(pitch,when,beats,beat,kind='piano',velocity=.45){
  if(!ctx||!state.enabled)return;
  const duration=Math.max(.12,beats*beat),f=hz(pitch),warm=kind==='pad',bass=kind==='bass',short=kind==='pluck';
  const tail=warm?1.1:(short?0.14:(bass?0.26:0.65));
  const loud=velocity*(warm?0.065:(bass?0.16:(short?0.105:0.13)));
  const env=envelope(when,loud,duration,tail,warm?0.32:0.014);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=warm?1050:bass?670:short?1750:2800;filter.Q.value=.5;
  filter.connect(env);
  const spec=warm?[[1,'sawtooth',.6], [1.003,'triangle',.4]]:bass?[[1,'sine',.92],[2,'triangle',.08]]:short?[[1,'triangle',.8],[2,'sine',.2]]:[[1,'sine',.62],[2,'sine',.26],[3,'sine',.12]];
  for(const [multiple,wave,level] of spec){
   const oscillator=ctx.createOscillator(),mix=ctx.createGain();oscillator.type=wave;oscillator.frequency.setValueAtTime(f*multiple,when);
   mix.gain.value=level;oscillator.connect(mix);mix.connect(filter);oscillator.start(when);oscillator.stop(when+duration+tail+.05);
  }
  if(!bass){const send=ctx.createGain();send.gain.value=warm?0.3:0.2;env.connect(send);send.connect(wet);}
 }
 function noise(time,beat,snare=false){
  if(!ctx||!state.enabled)return;
  const duration=snare?0.12:0.05,buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
  let seed=Math.floor(time*1000)|0;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1103515245)+12345)|0;data[i]=((seed>>>16)/32768-1)*Math.pow(1-i/data.length,1.6);}
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=buffer;filter.type='highpass';filter.frequency.value=snare?1450:4700;
  gain.gain.value=snare?0.025:0.013;src.connect(filter);filter.connect(gain);gain.connect(output);
  src.start(time);src.stop(time+duration);
 }
 function kick(time){
  const os=ctx.createOscillator(),gain=ctx.createGain();os.type='sine';
  os.frequency.setValueAtTime(108,time);os.frequency.exponentialRampToValueAtTime(52,time+.12);
  gain.gain.setValueAtTime(.08,time);gain.gain.exponentialRampToValueAtTime(.0001,time+.17);
  os.connect(gain);gain.connect(output);os.start(time);os.stop(time+.18);
 }
 function schedule(score,index,start){
  const b=score.bars[index%score.bars.length],beat=60/score.bpm,beats=score.beats;
  const battle=score.character==='pulse'||score.character==='shadow';
  if(battle){
   note(b.root,start,1.2,beat,'bass',.9);
   note(b.root,start+2*beat,.9,beat,'bass',.75);
   // Gentle rhythm rather than bright chiptune percussion; keep space for the piano.
   kick(start);kick(start+2*beat);
   for(const offset of [0,2]){
    for(const tone of b.chord.slice(0,3))note(tone,start+offset*beat,1.0,beat,'pad',score.character==='pulse'?0.23:0.28);
   }
   if(score.character==='shadow')note(b.chord[0]-12,start,beats-.3,beat,'pad',.24);
  }else{
   note(b.root,start,beats-.5,beat,'pad',.18);
   if(index%2===0)note(b.root-12,start,beats-.9,beat,'bass',.18);
   for(let j=0;j<4;j++){const offset=(j+.22)*(beats/4),tone=b.chord[(j+index)%b.chord.length];note(tone,start+offset*beat,.7,beat,'pluck',score.character==='piano'?0.16:0.25);}
   for(const pitch of b.chord.slice(0,3))note(pitch,start+.12*beat,beats-.25,beat,'pad',.12);
  }
  for(const [offset,pitch,length] of b.melody){
   note(pitch,start+offset*beat,length,beat,score.character==='mystery'?'pluck':'piano',battle?0.50:0.62);
   if(score.character==='piano'&&offset===0)note(pitch+12,start+offset*beat,length*.8,beat,'pluck',.09);
  }
 }
 function sceneForPage(){
  if(forced)return forced;
  const title=document.getElementById('ad196-title');
  if(title&&!title.hidden)return 'title';
  if(bossDialogVisible())return 'boss';
  const solo=document.getElementById('duelScreen');
  if(solo&&!solo.hidden){
   let tier=0;
   try{if(typeof game!=='undefined'&&game){if(game.showcase)return 'boss';tier=Number(game.opponentId)||0;}}catch{}
   return tier>=7?'shadow':'duel';
  }
  const duo=document.getElementById('duoBattleArena');
  if(duo){
   const room=document.getElementById('duoRoomId')?.textContent?.trim();
   const turn=document.getElementById('duoTurnName')?.textContent?.trim();
   if(room&&room!=='—'&&turn&&turn!=='Noch kein Raum'){
    const chapter=Number(document.getElementById('duoChapter')?.value)||0;
    return chapter>=7?'shadow':'duel';
   }
  }
  return 'mystery';
 }
 function tick(){
  const scene=sceneForPage();state.scene=scene;
  if(!state.enabled){muteLicensed();if(ctx&&output)output.gain.setTargetAtTime(0,ctx.currentTime,.045);return;}
  if(playLicensed(scene)){
   if(ctx&&output)output.gain.setTargetAtTime(0,ctx.currentTime,.045);
   return;
  }
  if(!ctx||ctx.state!=='running')return;
  if(state.transientMuted){output.gain.setTargetAtTime(0,ctx.currentTime,.045);current='';nextBarAt=ctx.currentTime+.2;return;}
  if(scene!==current){current=scene;barIndex=0;nextBarAt=ctx.currentTime+.18;output.gain.setTargetAtTime(0,ctx.currentTime,.06);}
  const volume=(!document.hidden?state.volume:0)*.9;
  output.gain.setTargetAtTime(volume,ctx.currentTime+.25,.2);
  const score=scores[scene]||scores.mystery,barTime=score.beats*60/score.bpm;
  while(nextBarAt<ctx.currentTime+.28){schedule(score,barIndex++,nextBarAt);nextBarAt+=barTime;}
 }
 function start(){
  if(!state.enabled)return false;
  if(!init()&&!catalog)return false;
  try{const result=ctx.resume();if(result&&typeof result.catch==='function')result.catch(()=>{});}catch{}
  if(!loop)loop=setInterval(tick,120);
  tick();return true;
 }
 function setEnabled(value){state.enabled=!!value;save();updateButton();if(!state.enabled){muteLicensed();if(output&&ctx)output.gain.setTargetAtTime(0,ctx.currentTime,.06);}else start();}
 function setVolume(value){state.volume=Math.max(0,Math.min(1,Number(value)||0));save();updateButton();if(state.enabled)start();}
 function setScene(value){forced=value&&scores[value]?value:'';current='';if(state.enabled)tick();}
 function setTransientMuted(value){state.transientMuted=!!value;if(ctx&&output){output.gain.setTargetAtTime(0,ctx.currentTime,.045);}if(state.transientMuted)muteLicensed();else if(state.enabled)tick();}
 let button=null;
 function updateButton(){if(button){button.textContent='♫ Musik: '+(state.enabled?'An':'Aus');button.setAttribute('aria-pressed',String(state.enabled));button.title='Hintergrundmusik '+(state.enabled?'ausschalten':'einschalten');}}
 function installToggle(){
  if(button)return;
  const host=document.querySelector('.mast-actions')||document.querySelector('.ad185-header-nav')||document.querySelector('header.mast');
  if(!host)return;
  button=document.createElement('button');button.type='button';button.id='ad196-music-toggle';button.className='ad196-music-toggle';
  button.addEventListener('click',()=>setEnabled(!state.enabled));host.append(button);updateButton();
 }
 function settings(){return Object.freeze({enabled:state.enabled,volume:state.volume,scene:state.scene,running:!!(media&&!media.paused)||!!ctx&&ctx.state==='running'});}
 function nowPlaying(){return mediaTrack?Object.freeze({...mediaTrack}):null;}
 window.ArcaneSoundscape=Object.freeze({start,setEnabled,setVolume,setScene,setTransientMuted,refresh:tick,getSettings:settings,getNowPlaying:nowPlaying,scores});
 function ready(){
  installToggle();
  // Try to begin during the initial black frame, before the title typography
  // fades in. Ordinary browsers may require the first real user gesture;
  // the dedicated desktop shell explicitly permits this opening music.
  if(state.enabled)start();
  document.addEventListener('pointerdown',()=>{if(state.enabled)start();},{once:true,capture:true});
  document.addEventListener('keydown',()=>{if(state.enabled)start();},{once:true,capture:true});
  document.addEventListener('visibilitychange',tick);
  const overlay=document.getElementById('overlay');
  if(overlay&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{
   if(state.enabled)tick();
  }).observe(overlay,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  // Low-frequency checks also catch combat transitions made by the base game
  // without changing its savegame, networking or combat functions.
  setInterval(()=>{if(ctx||media)tick();},850);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
