/* ARCANE DUEL 3.0 · Schicksalsglanz: cinematic Fate summon.
   Loaded AFTER evolution.js and BEFORE learning.js so discovery tutorial is preserved. */
'use strict';
(()=>{
const visuals=window.ArcaneFateVisuals;
if(!visuals||typeof fateAnimation!=='function')return;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
fateAnimation=async function(g){
 const event=g?.fateEvent;
 if(!event)return;
 const ids=Array.isArray(event.cards)?event.cards:[];
 const indices=ids.map(id=>FATE_CARD_IDS.indexOf(id)).filter(i=>i>=0);
 const dominant=visuals.entries[indices[0]??0]||visuals.entries[0];
 const instant=animationSpeed==='instant'||reduced();
 const layer=document.createElement('div');
 layer.className='fate-royal-scene'+(instant?' fate-royal-short':'');
 layer.style.setProperty('--fate-light',dominant.primary);
 layer.style.setProperty('--fate-accent',dominant.accent);
 layer.style.setProperty('--fate-deep',dominant.deep);
 layer.setAttribute('role','dialog');
 layer.setAttribute('aria-modal','true');
 layer.setAttribute('aria-label','Schicksalszug – fünf Schicksalsmonster erscheinen');
 const particles=Array.from({length:instant?12:52},(_,n)=>{
  const i=(n+1)*13.41,variation=(n*31)%100;
  const symbolSets=[['✦','✧','⋆','✺'],['✺','✶','✴','·'],['◆','◇','❖','✧'],['⌛','◇','·','✧'],['❁','✺','✦','❋'],['✧','⋆','✶','◆'],['☾','·','✧','☁'],['☄','✶','✦','·'],['✥','◇','✧','✦'],['◈','✦','⋆','✧']];
  const artIndex=indices[n%Math.max(1,indices.length)]??0;
  const kind=symbolSets[artIndex][n%4];
  return '<span class="fate-royal-particle" aria-hidden="true" style="color:'+visuals.entries[artIndex].primary+';--px:'+(variation)+'%;--py:'+((n*53)%100)+'%;--delay:'+(-n*.137).toFixed(2)+'s;--drift:'+((n*19)%80-40)+'px;--size:'+(n%7===0?19:8+n%8)+'px">'+kind+'</span>';
 }).join('');
 const cards=indices.map((idx,i)=>{
  const item=visuals.entries[idx];
  return '<article class="fate-royal-card" style="--i:'+i+';--fate-light:'+item.primary+';--fate-accent:'+item.accent+';--fate-deep:'+item.deep+'">'+
   '<div class="fate-royal-card-inner"><div class="fate-royal-card-back" aria-hidden="true"><span>'+item.symbol+'</span></div>'+
   '<div class="fate-royal-card-front"><img alt="'+escape(item.name)+'" src="'+visuals.artFor(idx)+'"><div class="fate-royal-card-info"><span>✦ SCHICKSAL</span><strong>'+escape(item.name)+'</strong></div></div></div></article>';
 }).join('');
 layer.innerHTML='<div class="fate-royal-space" aria-hidden="true"></div>'+
 '<div class="fate-royal-particles" aria-hidden="true">'+particles+'</div>'+
 '<div class="fate-royal-sigil" aria-hidden="true"><div class="fate-royal-sigil-inner">✧</div></div>'+
 '<div class="fate-royal-ceremony"><div class="fate-royal-eyebrow">✦ DIE VORSEHUNG ENTSCHEIDET ✦</div>'+
 '<h2>DAS SCHICKSAL ERWACHT</h2><p class="fate-royal-intro">Duellant '+(event.owner+1)+' erhält eine zweite Chance.</p>'+
 '<div class="fate-royal-cards">'+cards+'</div><p class="fate-royal-foot">Fünf Erscheinungen · Nicht fusionierbar · Nur in diesem Duell</p></div>'+
 '<button class="fate-royal-skip" type="button" aria-label="Schicksalsanimation überspringen">Animation überspringen →</button>';
 document.body.append(layer);
 try{sound('summon');}catch(_){}
 await new Promise(resolve=>{
  let settled=false,timer;
  function finish(){
   if(settled)return;settled=true;clearTimeout(timer);
   layer.removeEventListener('click',onClick);
   document.removeEventListener('keydown',onKey);
   layer.remove();resolve();
  }
  function onClick(e){if(e.target.closest('.fate-royal-skip'))finish();}
  function onKey(e){if(e.key==='Escape'||e.key==='Enter'&&document.activeElement?.classList.contains('fate-royal-skip'))finish();}
  layer.addEventListener('click',onClick);
  document.addEventListener('keydown',onKey);
  timer=setTimeout(finish,instant?700:4200);
 });
 if(g.fateEvent===event)g.fateEvent=null;
};
window.ArcaneFateCinema={version:'royal-1',monsterCount:visuals.entries.length};
})();