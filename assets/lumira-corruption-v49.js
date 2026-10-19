/* Arcane Duel v4.9: Lumira's Fall — mandatory first-turn hand fusion and cinematic. */
(function lumiraCorruption(){
 'use strict';
 const saga=window.ArcaneLv1Saga,swarm=window.ArcaneLv1Swarm;
 if(!saga||!swarm)return;
 const PURE=swarm.ids.ace,FALL=saga.corruptedId;
 const angel='assets/custom-art/lumira-angel-v49.webp';
 const fallen='assets/custom-art/lumira-fallen-v49.webp';
 CARDS[PURE].art=CARDS[PURE].customArt=angel;
 CARDS[FALL].art=CARDS[FALL].customArt=fallen;
 CARDS[FALL].desc='Die durch Verrat korrumpierte Lumira. Exklusive Level-5-Predator-Bossfusion: Lumira selbst und zwei bis vier frei wählbare weitere Monster als Fusionsmaterial; ohne zusätzliche Sonderfähigkeiten.';
 const isFinal=g=>!!g&&g.mode==='pve'&&g.active===1&&g.lv1Saga?.stage===5;
 const livingCard=c=>!!c&&!c.fate&&!c.lv1Ghost&&Number.isInteger(c.uid);
 function recipe(g,materials){
  if(!isFinal(g)||g.lv1FanaticCorruptPlayed||!Array.isArray(materials)||
   materials.length<3||materials.length>5)return false;
  const uniques=new Set(materials.map(c=>c?.uid));
  return uniques.size===materials.length&&materials.every(livingCard)&&
   materials.filter(c=>c.id===PURE).length===1&&
   materials.every(c=>g.players[1].hand.some(h=>h.uid===c.uid&&h.id===c.id));
 }
 const oldOptions=fusionOptions;
 fusionOptions=function(g,levels,materials=[]){
  const normal=oldOptions(g,levels,materials).filter(c=>c.id!==FALL);
  // The engine validates the real hand recipe with materials, but its inner
  // fusedInstance16() calls fusionOptions(g, levels) without passing them.
  // Permit that inner lookup ONLY during an already verified boss recipe.
  if((recipe(g,materials)||g?.lv1FallRecipeValidated===true)&&
     g.players[1].remainingFusion?.includes(FALL))
   normal.push(CARDS[FALL]);
  return normal;
 };
 const oldFuse=fusedInstance;
 fusedInstance=function(g,materials,levels){
  if(g?.fusionChoice!==FALL)return oldFuse(g,materials,levels);
  if(!recipe(g,materials))return null;
  g.lv1FallRecipeValidated=true;
  try{return oldFuse(g,materials,levels);}
  finally{delete g.lv1FallRecipeValidated;}
 };
 const oldAiChoice=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(isFinal(g)&&!g.pending&&!g.summoned&&!g.lv1FanaticCorruptPlayed&&
   !g.lv1FanaticCorruptPending&&g.winner===null&&g.players[1].field.some(c=>!c)){
   const hand=g.players[1].hand,lumira=hand.find(c=>c.id===PURE&&c.uid===g.lv1FanaticAce?.uid);
   if(lumira){
    // Lumira is always first: up to four other freely selectable hand monsters.
    const extras=hand.filter(c=>c.uid!==lumira.uid&&livingCard(c)).slice(0,4);
    for(let count=Math.min(5,extras.length+1);count>=3;count--){
     const chosen=[lumira,...extras.slice(0,count-1)];
     if(recipe(g,chosen)&&g.players[1].remainingFusion.includes(FALL)){
      g.lv1FanaticCorruptIntent=true;
      return {type:'fusion',uids:chosen.map(c=>c.uid)};
     }
    }
   }
  }
  return oldAiChoice(g,policy);
 };
 // The original saga tracks the boss reveal after placement. This marks the
 // original Lumira as deliberately sacrificed, not ordinarily summoned.
 const oldPlace=placePending;
 placePending=function(g,idx,choice){
  const result=oldPlace(g,idx,choice);
  if(result&&isFinal(g)&&result.card?.id===FALL){
   if(g.lv1FanaticAce)g.lv1FanaticAce.played=true;
   g.lv1FallAwaitingReveal=true;
  }
  return result;
 };
 function dialogue(title,body,note,art){
  return new Promise(resolve=>{
   if(typeof document==='undefined'||typeof openModal!=='function'){resolve();return;}
   openModal(modalHtml(title,'DER LETZTE FUNKE','✦',body,
     '<div class="lumira-dialogue-art"><img src="'+art+'" alt="Lumira"><p>'+note+'</p></div>',
     '<button class="btn primary" id="lumiraProceed">WEITER</button>'));
   const next=document.getElementById('lumiraProceed');
   if(next)next.onclick=()=>{hideModal();resolve();};
   else{hideModal();resolve();}
  });
 }
 async function beforeAiAction(g,action){
  if(!isFinal(g)||g.lv1FallPreShown||action?.type!=='fusion')return;
  const hand=g.players[1].hand;
  if(!recipe(g,action.uids?.map(uid=>hand.find(c=>c.uid===uid))))return;
  g.lv1FallPreShown=true;
  await dialogue('LUMIRAS LETZTES LICHT',
   'Lumira ... ich habe dich all diese Zeit angebetet. Doch dein Licht hat mich nie erwählt. Wenn du mir deine Macht nicht freiwillig gibst, werde ich sie mit meinen eigenen Händen aus dir herausreißen!',
   'Der Fanatiker hält seine geliebte ACE-Karte hoch. Doch diesmal will er sie nicht beschwören. Er will sie zerbrechen.',angel);
 }
 function fullVisual(id){
  const c=CARDS[id];
  // Use the actual game's card layout, enlarged; no alternative painted card frame.
  if(typeof fullCardHtml==='function')return fullCardHtml({id,card:{level:c.level,atk:c.atk,def:c.def}},'','lumira-cinema-frame');
  return '<img src="'+c.art+'" alt="'+c.name+'">';
 }
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function play(g,card){
  if(!isFinal(g)||card?.id!==FALL||typeof document==='undefined')return;
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const instant=typeof animationSpeed!=='undefined'&&animationSpeed==='instant';
  const layer=document.createElement('div');
  layer.className='lumira-corruption-cinema';
  layer.setAttribute('role','status');layer.setAttribute('aria-label','Lumiras Verwandlung zur verderbten Flamme');
  const particles=Array.from({length:64},(_,i)=>{
   const a=(i*137.5)*Math.PI/180,r=100+(i%7)*17,dx=Math.round(Math.cos(a)*r),dy=Math.round(Math.sin(a)*r);
   return '<i class="lumira-flame-particle" style="--n:'+i+';--a:'+a+'rad;--dx:'+dx+'px;--dy:'+dy+'px;--sz:'+(2+i%6)+'px"></i>';
  }).join('');
  layer.innerHTML='<div class="lumira-corruption-vignette"></div><div class="lumira-corruption-flash"></div>'+
   '<div class="lumira-corruption-runes" aria-hidden="true">✧ ⟐ ✦ ◇ ✧</div>'+
   '<div class="lumira-corruption-particles" aria-hidden="true">'+particles+'</div>'+
   '<div class="lumira-corruption-card lumira-corruption-original">'+fullVisual(PURE)+'</div>'+
   '<div class="lumira-corruption-orb" aria-hidden="true"><div class="lumira-orb-core"></div></div>'+
   '<div class="lumira-corruption-card lumira-corruption-fallen">'+fullVisual(FALL)+'</div>'+
   '<div class="lumira-corruption-title">LUMIRAS FALL <small>DIE VERDERBTE FLAMME</small></div>'+
   '<button class="lumira-corruption-skip" type="button">ANIMATION ÜBERSPRINGEN</button>';
  document.body.append(layer);
  let skip=false,interrupt=null;
  layer.querySelector('.lumira-corruption-skip').onclick=()=>{skip=true;interrupt?.();};
  const wait=async ms=>{
   if(skip)return;
   await new Promise(resolve=>{
    let resolved=false;
    const timer=setTimeout(()=>{if(!resolved){resolved=true;interrupt=null;resolve();}},(reduced||instant)?Math.min(ms,140):ms);
    interrupt=()=>{if(!resolved){resolved=true;clearTimeout(timer);interrupt=null;resolve();}};
   });
  };
  try{
   const phases=[
    ['lumira-stage-angel',1300],['lumira-stage-fracture',1050],
    ['lumira-stage-spiral',1550],['lumira-stage-orb',1700],
    ['lumira-stage-burst',800],['lumira-stage-fallen',1750],
    ['lumira-stage-land',720]
   ];
   for(const [name,duration] of phases){
    if(skip)break;
    layer.className='lumira-corruption-cinema '+name;
    if(typeof sound==='function'&&['lumira-stage-fracture','lumira-stage-burst','lumira-stage-fallen'].includes(name))
     sound(name==='lumira-stage-fallen'?'summon':'attack');
    await wait(duration);
   }
  }finally{layer.remove();}
 }
 window.ArcaneLumiraCorruption=Object.freeze({version:'4.9.1',id:FALL,pureId:PURE,recipe,beforeAiAction,play});
})();