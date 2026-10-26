/* Arcane Duel 2v2 v16.8 – explicit, private seat recovery links.
 * Bearer links confer full control of ONE human seat for the room lifetime.
 * They are created only after the player presses "Wiederherstellungslink".
 * No service-role credential and no localStorage token persistence.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.ArcaneDuoRecovery168=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const ROOM=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
 const TOKEN=/^[a-f0-9]{64}$/i;
 function parse(hash){
  if(typeof hash!=="string")return null;
  const value=hash.replace(/^#/,"");
  if(value.startsWith("resume=")){
   const raw=value.slice(7);
   const match=/^([a-f0-9-]{36})\.([a-f0-9]{64})$/i.exec(raw);
   if(!match||!ROOM.test(match[1])||!TOKEN.test(match[2]))return null;
   return {kind:"resume",roomId:match[1].toLowerCase(),token:match[2].toLowerCase()};
  }
  if(value.startsWith("room=")){
   const id=value.slice(5);
   return ROOM.test(id)?{kind:"room",roomId:id.toLowerCase()}:null;
  }
  return null;
 }
 function link(base,roomId,token){
  if(typeof base!=="string"||!/^https?:\/\//i.test(base))throw Error("Ungültiger Seitenlink");
  if(!ROOM.test(roomId)||!TOKEN.test(token))throw Error("Ungültiger Raumzugang");
  return base.split("#")[0].split("?")[0]+"#resume="+roomId.toLowerCase()+"."+token.toLowerCase();
 }
 function isConflict(message){
  return /Spielstand geändert|Konkurrierender Zug|synchronisieren/i.test(String(message));
 }
 function pollDelay(failures){
  const n=Number.isInteger(failures)?Math.max(0,Math.min(4,failures)):0;
  return Math.min(30000,2500*Math.pow(2,n));
 }
 return Object.freeze({version:"16.8",parse,link,isConflict,pollDelay});
});
