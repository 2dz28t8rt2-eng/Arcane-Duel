'use strict';

// Windows shell is pinned to the privately administered Arcane Duel host.
const GAME_ROOT='https://v2202610436378538039.ultrasrv.de:8443/';
const GAME_ENTRY=new URL('index.html?arcane-desktop=1',GAME_ROOT).toString();
const ROOT=new URL(GAME_ROOT);

function parseSecureUrl(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&url.port==='8443'&&
   url.hostname===ROOT.hostname&&url.origin===ROOT.origin?url:null;
 }catch{return null;}
}
function isGameUrl(value){
 const url=parseSecureUrl(value);
 return !!url&&url.pathname.startsWith('/');
}
module.exports=Object.freeze({GAME_ROOT,GAME_ENTRY,parseSecureUrl,isGameUrl});
