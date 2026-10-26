'use strict';

// Keep the desktop preview tied to our own development build. The online
// scripts run in Electron's sandbox, never with Node.js privileges.
const GAME_ROOT='https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/';
const GAME_ENTRY=new URL('index.html?arcane-desktop=1',GAME_ROOT).toString();
const GITHUB_ROOT='https://github.com/2dz28t8rt2-eng/Arcane-Duel';

function parseSecureUrl(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&
   !url.port?url:null;
 }catch{return null;}
}

function isGameUrl(value){
 const url=parseSecureUrl(value),base=new URL(GAME_ROOT);
 return !!url&&url.origin===base.origin&&url.pathname.startsWith(base.pathname);
}

function isRepositoryUrl(value){
 const url=parseSecureUrl(value),base=new URL(GITHUB_ROOT);
 return !!url&&url.origin===base.origin&&
  (url.pathname===base.pathname||url.pathname.startsWith(base.pathname+'/'));
}

module.exports=Object.freeze({GAME_ROOT,GAME_ENTRY,isGameUrl,isRepositoryUrl});
