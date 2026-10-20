'use strict';
window.addEventListener('DOMContentLoaded',()=>{
 const cards=window.ARCANE_COLLECTION_V3||[],tiers=[
  'Einfache Kreaturen','Stärkere Kreaturen','Gefährliche Monster','Elitewesen',
  'Furchteinflößende Monster','Legendäre Kreaturen','Uralte Wächter','Mythische Entitäten',
  'Höchste Mächte','Transzendente Wesen','Die Ultimativen','Das absolute Maximum'
 ];
 const $=id=>document.getElementById(id);
 const byId=new Map(cards.map(c=>[c.id,c]));
 // Preview gallery uses the same newly generated artworks, once deployed.
 for(const [id,file] of [[41,'funkenwyrm-new.webp'],[45,'waldschlund-new.webp']]){
  const img=new Image(),path='assets/custom-art/generated-4-1/'+file+'?v=artfix-20261017-2';
  img.onload=()=>{const c=byId.get(id);if(c){c.art=path;render();}};
  img.onerror=()=>{}; // Preserve previous image when binary is not deployed.
  img.src=path;
 }
 const state={level:'all',search:'',art:'all',sort:'level'};
 const tierList=$('tierList');
 for(let level=1;level<=12;level++){
  const count=cards.filter(c=>c.level===level).length;
  const b=document.createElement('button');b.type='button';b.className='tier';b.dataset.level=String(level);
  const number=document.createElement('span');number.className='tier-number';number.textContent=String(level).padStart(2,'0');
  const label=document.createElement('span');label.className='tier-label';label.textContent=tiers[level-1];
  const qty=document.createElement('b');qty.textContent=String(count);
  b.append(number,label,qty);tierList.append(b);
 }
 function imageFor(c){const base=c.variantOf!=null?(byId.get(c.variantOf)||c):c;return base.art||window.ArcaneArt.makeArt({id:base.id,kind:base.kind,level:base.level,element:base.element,color:'#b2b8d6',fusionOnly:base.fusion});}
 function render(){
  document.querySelectorAll('.tier').forEach(b=>{const active=b.dataset.level===state.level;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const query=state.search.trim().toLocaleLowerCase('de');
  let visible=cards.filter(c=>(state.level==='all'||c.level===Number(state.level))&&(!query||(c.name+' '+c.element).toLocaleLowerCase('de').includes(query))&&(state.art==='all'||(state.art==='custom' ? !!c.art : !c.art)));
  visible.sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name,'de'):state.sort==='level-desc'?b.level-a.level||a.id-b.id:a.level-b.level||a.id-b.id);
  $('resultCount').textContent=`${visible.length} von ${cards.length} Kartenvorlagen · ${new Set(cards.filter(c=>c.art).map(c=>c.art)).size} individuelle Illustrationsdateien`;
  $('empty').hidden=visible.length>0;
  const frag=document.createDocumentFragment();
  for(const c of visible){
   const article=document.createElement('article');article.className=`monster tier-${c.level} ${c.fusion?'fusion':''}`;
   const frame=document.createElement('div');frame.className='art-frame';
   const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt=c.name;img.src=imageFor(c);
   if(!c.art)img.style.objectFit='contain';frame.append(img);
   const title=document.createElement('h3');title.textContent=c.name;
   const info=document.createElement('div');info.className='meta';info.textContent=`LV ${c.level} · ${c.element} · ${c.fusion?'FUSION':'MONSTER'}`;
   const tag=document.createElement('span');tag.className='tag';tag.textContent=c.variantOf!=null?'Stufenreihe':c.art?'Illustration':'Generator';
   article.append(frame,title,info,tag);frag.append(article);
  }
  $('cards').replaceChildren(frag);
 }
 document.querySelectorAll('.tier').forEach(b=>b.addEventListener('click',()=>{state.level=b.dataset.level;render();}));
 $('search').addEventListener('input',e=>{state.search=e.target.value;render();});
 $('artFilter').addEventListener('change',e=>{state.art=e.target.value;render();});
 $('sort').addEventListener('change',e=>{state.sort=e.target.value;render();});
 $('totalCount').textContent=cards.length;
 $('counter').textContent=cards.length+' Kartenvorlagen';
 window.addEventListener('arcane-lategame-art-ready',render);
 render();
});
