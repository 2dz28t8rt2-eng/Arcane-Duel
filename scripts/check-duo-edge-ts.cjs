'use strict';
/* Check the Edge entrypoint as TypeScript, not as plain Node JavaScript.
 * Supabase runs the function in Deno; node --check index.ts will otherwise
 * incorrectly reject valid annotations such as `const patch: any = ...`.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const entry=path.join(__dirname,'../supabase/functions/arcane-duo-v2/index.ts');
const source=fs.readFileSync(entry,'utf8');
if(typeof stripTypeScriptTypes==='function'){
 // Edge imports use URL/npm/JSON specifiers. Remove only complete, single-
 // line import declarations for a body syntax check; the deployed Deno
 // runtime validates actual module resolution. No child process or network.
 const javascript=stripTypeScriptTypes(source,{mode:'strip'});
 const body=javascript.replace(/^\s*import\s+[^\r\n]+;[ \t]*$/gm,'');
 if(/^\s*(?:import|export)\s/m.test(body))
  throw Error('Unrecognized Edge module declaration; use Deno to check this function.');
 new vm.Script(body,{filename:entry});
 console.log('[2v2 Edge] TypeScript body syntax verified (native stripping).');
}else{
 // Node 20 does not expose native TypeScript stripping. Deployment to Deno
 // performs the definitive check. Do not falsely reject valid TypeScript.
 console.warn('[2v2 Edge] TypeScript body check skipped on Node 20 (use Deno check).');
}
