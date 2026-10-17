/* Arcane Duel · Allrounder resonance (PvE only).
 * A hand Allrounder contributes +4% quality immediately.
 * A REAL field material gets +4% per completed own turn, up to three charges
 * (+16% at 3), capped at +24% across all Allrounder materials.
 * A low-level Allrounder never reduces the existing materials' quality factor.
 * Charges live on instances, never modify permanent card or combat stats.
 */
'use strict';
(()=>{
 const isAllrounder=c=>!!c&&((c.roleOverride||CARDS[c.id]?.role||'combatant')==='combatant')&&!c.fusion;
 const isResonator=c=>!!c&&c.fusion===true&&c.roleOverride==='resonator';
 const charges=c=>Number.isInteger(c?.resonance)?Math.max(0,Math.min(isResonator(c)?2:3,c.resonance)):0;
 function evaluate(g,materials){
  if(g?.mode!=='pve'||g.active!==0||!Array.isArray(materials))return {bonus:0,materials:0,charges:0};
  const field=new Set(g.players?.[g.active]?.field?.filter(Boolean).map(c=>c.uid)||[]);
  let base=0,resonator=0,n=0,rn=0,total=0;
  for(const c of materials){
   const isNormal=isAllrounder(c),isFusion=isResonator(c);
   if(!isNormal&&!isFusion)continue;
   const charge=field.has(c.uid)?charges(c):0;
   if(isFusion){resonator+=10+10*charge;rn++;}
   else{base+=4+4*charge;n++;}
   total+=charge;
  }
  const normalBonus=Math.min(24,base),resonatorBonus=Math.min(60,resonator);
  return {bonus:normalBonus+resonatorBonus,normalBonus,resonatorBonus,
   materials:n+rn,allrounders:n,resonators:rn,charges:total};
 }
 const oldAdvanceTurn=advanceTurn;
 advanceTurn=function(g,...args){
  if(!g||g.mode!=='pve'||g.active!==0||g.winner!==null||g.pending)
   return oldAdvanceTurn(g,...args);
  const start=g.turn,owned=[...g.players[0].field.filter(Boolean)];
  const value=oldAdvanceTurn(g,...args);
  if(value!==false&&g.turn>start){
   for(const c of owned){
    if(!g.players[0].field.includes(c)||!(isAllrounder(c)||isResonator(c))||c.summonedTurn===start)continue;
    c.resonance=Math.min(isResonator(c)?2:3,charges(c)+1);
   }
  }
  return value;
 };
 const oldRender=render;
 function labels(){
  if(!game||game.mode!=='pve'||uiMode!=='duel')return;
  for(const [owner,rowId,key] of [[0,'ownRow','mine']]){
   const row=document.getElementById(rowId);if(!row)continue;
   row.querySelectorAll('[data-'+key+']').forEach(slot=>{
    slot.querySelector(':scope > .ad-resonance-chip')?.remove();
    const card=game.players[owner].field[Number(slot.dataset[key])];
    if(!isAllrounder(card)&&!isResonator(card))return;
    const badge=document.createElement('span');
    badge.className='ad-resonance-chip';
    const charge=charges(card);
    const resonator=isResonator(card),power=resonator?10+charge*10:4+charge*4;
    badge.textContent=(resonator?'✦ ':'◇ ')+power+' %';
    badge.title=(resonator?'Resonator':'Allrounder')+' als Fusionsmaterial: +'+power+' % Fusionsqualität. Gespeicherte Ladungen: '+charge+'/'+(resonator?2:3)+'.';
    badge.setAttribute('aria-label',badge.title);
    slot.append(badge);
   });
  }
 }
 render=function(...args){const res=oldRender(...args);labels();return res;};
 window.ArcaneAllrounder=Object.freeze({version:'1.1',evaluate,charges,isAllrounder,isResonator});
 if(uiMode==='duel')labels();
})();
