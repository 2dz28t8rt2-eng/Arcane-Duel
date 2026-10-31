'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module'),{webcrypto}=require('node:crypto');
// Load the exact existing, tested handler, without installing Supabase or Deno.
// Imports are an explicit allowlist; unrecognized future imports fail at startup.
function createHandler(store,{root=path.resolve(__dirname,'..'),origins=[]}={}){
 const dir=path.join(root,'supabase/functions/arcane-duo-v2');
 const dependencies=['duo-rules.js','duo-economy-v172.js','duo-adversaries-v200.js','duo-deck-slots-v222.js'];
 const expected=new Set(['import {createClient} from "npm:@supabase/supabase-js@2";',
  'import snapshot from "./catalog.json" with {type:"json"};',
  'import soloOpponents from "./opponents.json" with {type:"json"};',...dependencies.map(f=>`import "./${f}";`)]);
 const source=fs.readFileSync(path.join(dir,'index.ts'),'utf8').replace(/^import[^\r\n]+$/gm,line=>{
  if(!expected.delete(line))throw Error('Unrecognized authoritative handler import');return '';
 });
 if(expected.size)throw Error('Authoritative handler dependencies changed');
 let handler;
 const context=vm.createContext({crypto:webcrypto,TextEncoder,Response,structuredClone,console,
  snapshot:JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'),'utf8')),
  soloOpponents:JSON.parse(fs.readFileSync(path.join(dir,'opponents.json'),'utf8')),
  createClient:()=>store,Deno:{env:{get:k=>k==='ARCANE_DUO_ORIGINS'?origins.join(','):''},serve:fn=>{handler=fn;}}});
 for(const file of dependencies)new vm.Script(fs.readFileSync(path.join(dir,file),'utf8'),{filename:file}).runInContext(context);
 new vm.Script(stripTypeScriptTypes(source,{mode:'strip'}),{filename:'authoritative-duo-handler'}).runInContext(context);
 if(typeof handler!=='function')throw Error('Duel handler did not start');
 return handler;
}
module.exports={createHandler};
