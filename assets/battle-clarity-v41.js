/* Final presentation-only decorator: adds field energy/cooldown pips after
 * every composed render. Never mutates combat, deck, or saved data. */
'use strict';
(()=>{
 const previous=render;
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 function decorate(){
  const g=game;if(uiMode!=='duel'||!g?.players)return;
  for(const [owner,rowId,key]of [[0,'ownRow','mine'],[1,'enemyRow','enemy']]){
   const row=document.getElementById(rowId);if(!row)continue;
   const field=g.players[owner]?.field||[];
   row.querySelectorAll('[data-'+key+']').forEach(slot=>{
    slot.querySelectorAll(':scope > .ad-soul-field-indicator').forEach(n=>n.remove());
    const c=field[Number(slot.dataset[key])];
    if(!c||roleOf(c)!=='soul'||!c.essenceCombat) return;
    const e=c.essenceCombat,soul=Math.max(0,Math.floor(e.soul||0));
    const cd=Math.max(0,Math.floor(e.cooldown||0)),raid=Math.max(0,Math.floor(e.raidCooldown||0));
    if(soul===0&&cd===0&&raid===0)return;
    const chip=document.createElement('span');
    chip.className='ad-soul-field-indicator';
    chip.dataset.energy=String(soul);
    chip.textContent='✦ '+soul;
    const clocks=[];
    if(cd)clocks.push('V '+cd);
    if(raid)clocks.push('R '+raid);
    if(clocks.length){
     const note=document.createElement('span');
     note.className='ad-soul-wait';note.textContent='⌛'+clocks.join(' · ');
     chip.append(note);
    }
    chip.title='Seelenenergie '+soul+(cd?' · Verdichten in '+cd+' Zügen':'')+(raid?' · Seelenraub in '+raid+' Zügen':'');
    chip.setAttribute('aria-label',chip.title);
    slot.append(chip);
   });
  }
 }
 render=function(...args){
  const result=previous(...args);
  decorate();
  return result;
 };
 window.ArcaneFieldStatus=Object.freeze({version:'4.1',decorate});
 if(uiMode==='duel')decorate();
})();
