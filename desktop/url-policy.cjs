'use strict';

// Keep the desktop preview tied to our own development build. The online
// scripts run in Electron's sandbox, never with Node.js privileges.
const GAME_ROOT='https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/';
const GAME_ENTRY=new URL('index.html?arcane-desktop=1',GAME_ROOT).toString();
const GITHUB_ROOT='https://github.com/2dz28t8rt2-eng/Arcane-Duel';
const REVISION_PATTERN=/^[0-9a-f]{40}$/i;

function gameRootFor(revision='development'){
 if(revision==='development')return GAME_ROOT;
 if(typeof revision!=='string'||!REVISION_PATTERN.test(revision))throw new TypeError('Invalid Arcane Duel revision');
 return GAME_ROOT.replace('/development/','/'+revision.toLowerCase()+'/');
}

function entryForRevision(revision='development'){
 return new URL('index.html?arcane-desktop=1',gameRootFor(revision)).toString();
}

function parseSecureUrl(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&
   !url.port?url:null;
 }catch{return null;}
}

function isGameUrl(value,revision='development'){
 let base;try{base=new URL(gameRootFor(revision));}catch{return false;}
 const url=parseSecureUrl(value);
 return !!url&&url.origin===base.origin&&url.pathname.startsWith(base.pathname);
}

function isRepositoryUrl(value){
 const url=parseSecureUrl(value),base=new URL(GITHUB_ROOT);
 return !!url&&url.origin===base.origin&&
  (url.pathname===base.pathname||url.pathname.startsWith(base.pathname+'/'));
}

module.exports=Object.freeze({GAME_ROOT,GAME_ENTRY,REVISION_PATTERN,gameRootFor,entryForRevision,isGameUrl,isRepositoryUrl});
