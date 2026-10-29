/* Arcane Duel v20.6 – visual Soul Bond, solo PvE. Gameplay stays in essence-combat.js. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),role=c=>c?.roleOverride||CARDS[c?.id]?.role;
 const last=new WeakMap(),seen=new WeakSet();
 const slot=(owner,i)=>$(owner===0?'ownRow':'enemyRow')?.querySelector('[data-'+(owner===0?'mine':'enemy')+'="'+i+'"]');
 const badges='.ad206-mark,.ad206-bridge,.ad206-soul-particle,.ad206-guardian-particle';
 const make=(parent,tag,cls,txt)=>{const e=document.createElement(tag);e.className=cls;if(txt!==undefined)e.textContent=txt;parent.append(e);return e;};
 function pairs(g,owner){return window.ArcaneEssenceCombat?.soulBonds?.(g,owner)||[];}
 function adorn(g){
  if(!g||g.mode!=='pve'||!g.essenceRules||uiMode!=='duel')return;
  const current=new Set(),prior=last.get(g)||new Set(),initial=!seen.has(g);
  seen.add(g);
  for(let owner=0;owner<2;owner++){
   const field=g.players[owner].field,links=pairs(g,owner),taken=new Set();
   field.forEach((c,i)=>{
    const cell=slot(owner,i);if(!cell)return;
    cell.classList.remove('ad206-guard','ad206-soul','ad206-linked','ad206-invite-guardian','ad206-invite-soul');
    cell.querySelectorAll(badges).forEach(e=>e.remove());
   });
   for(const bond of links){
    const key=owner+':'+bond.guardian.uid+':'+bond.soul.uid;current.add(key);
    for(const [i,kind] of [[bond.guardianIndex,'guard'],[bond.soulIndex,'soul']]){
     taken.add(i);const el=slot(owner,i);if(!el)continue;
     el.classList.add('ad206-linked','ad206-'+kind);
     const mark=make(el,'span','ad206-mark','✦ SEELENBUND · 35 %');
     mark.title='Seelenbund: Benachbarter Wächter und Seelenzehrer halten 35 % statt 20 % Angriffsschaden ab.';mark.setAttribute('aria-label',mark.title);
     const icon=kind==='soul'?'☠':'✦';
     for(let n=0;n<2;n++){const fx=make(el,'span',kind==='soul'?'ad206-soul-particle':'ad206-guardian-particle',icon);fx.style.setProperty('--ad206-i',String(n));fx.setAttribute('aria-hidden','true');}
    }
    const first=Math.min(bond.guardianIndex,bond.soulIndex);
    const bridge=slot(owner,first);
    if(bridge){const wave=make(bridge,'span','ad206-bridge');wave.setAttribute('aria-hidden','true');}
    if(!initial&&!prior.has(key)){
     const anchor=slot(owner,bond.soulIndex);
     if(anchor){const pop=make(anchor,'span','ad206-activated','✦ SEELENBUND');setTimeout(()=>pop.remove(),1650);}
    }
   }
   field.forEach((c,i)=>{
    if(!c||taken.has(i)||!['guardian','soul'].includes(role(c)))return;
    const style=role(c)==='guardian'?'guardian':'soul';
    for(const j of [i-1,i+1])if(j>=0&&j<field.length&&!field[j]){
     const target=slot(owner,j);if(!target)continue;
     target.classList.add('ad206-invite-'+style);
     target.title=style==='guardian'?'Hier einen Seelenzehrer platzieren: Seelenbund':'Hier einen Wächter platzieren: Seelenbund';
    }
   });
  }
  last.set(g,current);
 }
 function inspector(g){
  const preview=$('largeCardPreview');if(!preview)return;
  preview.querySelectorAll('.ad206-preview').forEach(x=>x.remove());
  if(!g||g.mode!=='pve'||!g.essenceRules||uiMode!=='duel')return;
  const card=preview.querySelector('.hand-card[data-instance-uid]');
  if(!card)return;
  const uid=Number(card.dataset.instanceUid);
  for(let owner=0;owner<2;owner++){
   const field=g.players[owner].field,i=field.findIndex(c=>c?.uid===uid);
   if(i<0||!['guardian','soul'].includes(role(field[i])))continue;
   const bond=pairs(g,owner).find(b=>b.guardian.uid===uid||b.soul.uid===uid);
   const info=make(preview,'div','ad206-preview');
   make(info,'strong','','🛡 Schutz in DEF: '+(bond?'35 % des Schadens werden abgewehrt · Seelenbund aktiv':'20 % des Schadens werden abgewehrt'));
   if(bond){
    const other=bond.guardian.uid===uid?bond.soul:bond.guardian;
    make(info,'p','','Verbunden mit '+dataOf(other).name+'. Wenn Wächter und Seelenzehrer direkt nebeneinander in DEF stehen, halten sie 35 % statt 20 % des eingehenden Schadens ab.');
    make(info,'small','','25 % des zusätzlich verhinderten Schadens werden als Seelenessenz gespeichert (maximal 50 pro Runde und Bindung).');
   }else make(info,'small','','Tipp: Setze einen Wächter direkt links oder rechts neben einen Seelenzehrer – beide können dann mehr Schaden abwehren.');
   break;
  }
 }
 const originalRender=render;
 render=function(...args){const result=originalRender.apply(this,args);try{adorn(game);inspector(game);}catch(e){console.warn('Seelenbund-Dekoration',e);}return result;};
 const originalPreview=renderCardPreview;
 renderCardPreview=function(...args){const result=originalPreview.apply(this,args);try{inspector(game);}catch(e){console.warn('Seelenbund-Vorschau',e);}return result;};
 window.ArcaneSoulBond206=Object.freeze({version:'20.6',adorn,pairs});
})();