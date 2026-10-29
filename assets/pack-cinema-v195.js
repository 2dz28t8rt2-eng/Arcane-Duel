/* Arcane Duel v19.5 – a richer, opt-in pack ritual in solo and 2v2.
 * No card generation, prices, selection handlers or save writes.
 */
(function(root,factory){
 const api=factory(root);
 if(root)root.ArcanePackExperience195=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const scenes=new WeakMap();
 const tier=item=>item?.ace?4:item?.fusion&&Number(item.level)>=7?3:
  Number(item?.level)>=8?2:item?.fusion?1:0;
 const label=item=>tier(item)===4?'✦ ACE ENTDECKT':
  tier(item)===3?'✦ MÄCHTIGE FUSION':
  tier(item)===2?'✧ BESONDERE KARTE':
  tier(item)===1?'✧ FUSION':'✧';
 function node(tag,cls,parent,content){
  const el=root.document.createElement(tag);
  if(cls)el.className=cls;
  if(content!==undefined)el.textContent=content;
  parent?.append(el);return el;
 }
 function add(overlay,scene,pack){
  if(scenes.has(overlay))return scenes.get(overlay);
  overlay.classList.add('ad195-pack-cinema');
  const seal=node('span','ad195-sigil-seal',pack,'✦');
  seal.setAttribute('aria-hidden','true');
  const flash=node('div','ad195-seal-flash',scene);
  flash.setAttribute('aria-hidden','true');
  const notice=node('p','ad195-special-notice',scene);
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const audio=root.ArcaneDuoSound194;
  const controls=node('div','ad195-audio-panel',scene);
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Booster-Klänge');
  const toggle=node('button','ad195-audio-toggle',controls);
  toggle.type='button';
  const volumeLabel=node('label','ad195-volume-label',controls,'Lautstärke');
  const slider=node('input','ad195-volume-slider',volumeLabel);
  slider.type='range';slider.min='0';slider.max='100';slider.step='5';
  slider.setAttribute('aria-label','Lautstärke der Booster-Klänge');
  const display=node('output','ad195-volume-value',volumeLabel);
  const sync=()=>{
   const enabled=audio?.isEnabled?.()===true;
   toggle.textContent=enabled?'🔊 Ton an':'🔇 Ton aus';
   toggle.setAttribute('aria-pressed',String(enabled));
   slider.value=String(audio?.getVolume?.()??35);
   display.textContent=slider.value+' %';
   volumeLabel.hidden=!enabled;
  };
  toggle.addEventListener('click',()=>{
   if(!audio?.setEnabled)return;
   audio.setEnabled(!audio.isEnabled());sync();
  });
  slider.addEventListener('input',()=>{
   audio?.setVolume?.(slider.value);sync();
  });
  if(!audio){toggle.disabled=true;toggle.title='Ton derzeit nicht verfügbar';}
  sync();
  const state={overlay,scene,pack,notice,controls,seal,flash,spotlightTimer:null,sync};
  scenes.set(overlay,state);return state;
 }
 function play(kind){
  // The audio engine is unlocked only by an actual user click. Its preference
  // is shared with the existing 2v2 sound setting on pages that offer both.
  root?.ArcaneDuoSound194?.playPreview?.(kind);
 }
 function onPhase(phase,{overlay,scene,pack,rewards=[],rewardNodes=[],index,
   position,item,skipped=false}={}){
  if(!root?.document||!overlay)return;
  if(phase==='ready'){add(overlay,scene,pack);return;}
  const state=scenes.get(overlay);
  if(!state)return;
  if(phase==='break'){
   overlay.classList.add('ad195-seal-breaking');
   play('packBreak');return;
  }
  if(phase==='rift'){
   overlay.classList.add('ad195-pack-rifted');
   play('packOpen');return;
  }
  if(phase==='reveal'){
   const card=rewardNodes[index];if(!card||!item)return;
   card.classList.add('ad195-card-reveal');
   const rarity=tier(item);
   if(rarity){
    card.classList.add('ad195-tier-'+rarity);
    const tag=node('span','ad195-rarity-tag',card,label(item));
    tag.setAttribute('aria-hidden','true');
   }
   if(rarity>=2){
    overlay.classList.add('ad195-special-reveal');
    state.notice.textContent=rarity===4?'Ein ACE! Was für ein Fund!':
     rarity===3?'Eine mächtige Fusion!':'Eine besonders starke Karte!';
    if(rarity===4)overlay.classList.add('ad195-ace-awakened');
    if(state.spotlightTimer!==null)root.clearTimeout(state.spotlightTimer);
    state.spotlightTimer=root.setTimeout(()=>{
     if(scenes.get(overlay)===state)overlay.classList.remove('ad195-special-reveal');
    },1100);
    play(rarity===4?'packAce':'packRare');
   }else if(rarity===1||position===0||rewards.length<=5){
    play('packFlip');
   }
   return;
  }
  if(phase==='complete'){
   overlay.classList.add('ad195-pack-finished');
   if(skipped)overlay.classList.add('ad195-skipped');
   return;
  }
  if(phase==='close'){
   if(state.spotlightTimer!==null)root.clearTimeout(state.spotlightTimer);
   state.spotlightTimer=null;
   scenes.delete(overlay);
  }
 }
 return Object.freeze({version:'19.5.0',tier,label,onPhase});
});
