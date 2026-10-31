/* Arcane Duel 2v2 v16.6 — read-only choices for the online 2v2 interface.
 * The server remains authoritative for every game action.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ArcaneDuoBattleUI=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function legalChoices(state,seat){
  const p=state?.players?.[seat];
  if(!p||state.status!=='active'||state.activeSeat!==seat||p.kind!=='human')
   return {canAct:false,freeSlots:[],hand:[],attackers:[],targets:[],waiting:[]};
  const ally=state.fieldLayout==='team7'?state.players.find(x=>x.team===p.team&&x.seat!==seat):null;
  const freeSlots=p.field.flatMap((card,slot)=>card||ally?.field[slot]?[]:[slot]);
  const hand=!p.summoned?p.hand.map((item,index)=>({
   id:typeof item==='number'?item:item.id,index,fate:item?.fate===true,
   ...(item?.fate?{atk:item.atk,def:item.def}:{})})):[];
  const attackers=p.field.flatMap((card,slot)=>card&&card.mode==='atk'&&!card.used&&
   !(card.lv1LockedUntil>p.ownTurns)&&card.placedRound<state.round?[{slot,card}]:[]);
  if(p.lv1?.perk)attackers.push(...(p.lv1.ghostSlots||[]).flatMap((card,slot)=>
   card&&card.mode==='atk'&&!card.used&&
   !(card.lv1LockedUntil>p.ownTurns)&&card.placedRound<state.round?
    [{slot,card,area:'ghost'}]:[]));
  const opponents=state.players.filter(player=>player.team!==p.team);
  const targets=opponents.flatMap(player=>player.field.flatMap((card,slot)=>card?
   [{seat:player.seat,slot,card,name:player.name}]:[]));
  targets.push(...opponents.flatMap(player=>(player.lv1?.ghostSlots||[])
   .flatMap((card,slot)=>card?[{seat:player.seat,slot,card,
    name:player.name,area:'ghost'}]:[])));
  const waiting=p.field.flatMap((card,slot)=>card&&card.placedRound>=state.round&&!card.used?[slot]:[]);
  return {canAct:true,freeSlots,hand,attackers,targets,waiting};
 }
 function attackCommand(from,target){
  if(!Number.isInteger(from?.slot))throw Error('Bitte einen Angreifer wählen.');
  if(target===null)return {type:'attack',slot:from.slot,targetSeat:null,targetSlot:null,
   ...(from.area==='ghost'?{area:'ghost'}:{})};
  if(!Number.isInteger(target?.seat)||!Number.isInteger(target?.slot))throw Error('Ungültiges Ziel.');
  return {type:'attack',slot:from.slot,targetSeat:target.seat,targetSlot:target.slot,
   ...(from.area==='ghost'?{area:'ghost'}:{}),
   ...(target.area==='ghost'?{targetArea:'ghost'}:{})};
 }
 function phase(state,seat){
  if(!state)return 'not-created';
  if(state.status==='waiting')return 'waiting';
  if(state.status==='finished')return state.winner===0?'victory':'defeat';
  return state.activeSeat===seat?'my-turn':'other-turn';
 }
 return Object.freeze({version:'15.8',legalChoices,attackCommand,phase});
});
