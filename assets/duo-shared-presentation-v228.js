/* Online adapters expose the original ritual's presentation hooks, without solo rules. */
'use strict';
(()=>{
 function cell(where){
  if(!where||!Number.isInteger(where.seat)||!Number.isInteger(where.slot))return null;
  const select=seat=>document.querySelector('#duoSeats .seat[data-seat="'+seat+'"] '+(where.area==='ghost'?'.duo-ghost-reserve .duo-ghost-cell':'> .field > .field-cell')+'[data-slot="'+where.slot+'"]');
  const own=select(where.seat);
  // The two owners retain separate data containers, but share one physical row.
  // After a death the visible empty zone may belong to the other seat container.
  if(where.area!=='ghost'&&own?.classList.contains('ad221-shared-hidden'))return select(where.seat^2)||own;
  return own;
 }
 window.ArcaneDuoPresentation228=Object.freeze({cell});
 window.ArcanePredatorPack=Object.freeze({POWERS:window.ArcaneSpecialPresentation228.POWERS,
  cinemaReveal:window.ArcaneSpecialPresentation228.cinemaReveal});
 window.ArcaneSummonFX=Object.freeze({land:async(g,c,{phase=null}={})=>{
  const player=g.players.find(p=>p.field?.some(x=>x?.uid===c.uid));
  if(!player)return false;
  const slot=player.field.findIndex(x=>x?.uid===c.uid),node=document.querySelector('#duoSeats [data-seat="'+player.seat+'"]>.field>[data-slot="'+slot+'"] .board-creature');
  return window.ArcaneBattlePresentation228.land(node,{owner:player.team,uid:c.uid,
   materials:c.materialsUsed||c.fusion?.materials?.length||c.materials?.length||c.fusion?.materialCount||0,phase,
   valid:()=>{const current=window.ArcaneDuoParty218?.state().game;return current?.roomId===g.roomId&&current?.chapter===g.chapter&&current?.duelNo===g.duelNo&&current?.status==='active';}});
 }});
})();
