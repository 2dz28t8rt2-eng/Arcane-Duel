'use strict';

// Resolve exactly one public branch ref, never an arbitrary URL supplied by
// the online game. The resulting immutable path refreshes the HTML and all
// relative scripts/styles without changing the web origin (and localStorage).
const REVISION_API='https://api.github.com/repos/2dz28t8rt2-eng/Arcane-Duel/git/ref/heads/development';
const SHA=/^[a-f0-9]{40}$/i;

function extractRevision(response){
 const value=response?.object?.sha;
 return typeof value==='string'&&SHA.test(value)?value.toLowerCase():null;
}

async function resolveRevision(fetcher=globalThis.fetch){
 if(typeof fetcher!=='function')return {revision:null,source:'offline'};
 const abort=new AbortController();
 const timeout=setTimeout(()=>abort.abort(),7000);
 try{
  const response=await fetcher(REVISION_API,{
   method:'GET',cache:'no-store',signal:abort.signal,
   headers:{Accept:'application/vnd.github+json','User-Agent':'Arcane-Duel-Desktop'}
  });
  if(!response?.ok)return {revision:null,source:'unavailable'};
  const revision=extractRevision(await response.json());
  return revision?{revision,source:'github'}:{revision:null,source:'invalid-response'};
 }catch{return {revision:null,source:'unavailable'};}
 finally{clearTimeout(timeout);}
}

module.exports=Object.freeze({REVISION_API,extractRevision,resolveRevision});
