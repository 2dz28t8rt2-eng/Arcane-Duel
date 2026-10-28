'use strict';
/* v15.77: preserve v15.75 legal 40-card research AI, score modes, frozen
 * opponents, and per-game telemetry, but give stage 9/10 fully natural
 * Fusion-vs-Predator roles (including 3..5-material search on Fusion side).
 * No forced field positions, player perks, borrowed holdout data, or live edits.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const mode=process.env.ARCANE_V1577_MODE,lock=Number(process.env.ARCANE_V1577_LOCK);
assert.ok(['baseline','reply-aware'].includes(mode),'Expected baseline or reply-aware');
assert.ok([0,4].includes(lock),'Predeclared natural or symmetric 4-turn board-building curriculum');
assert.ok(['9','10'].includes(process.argv[2]),'Only the two new matched role stages are permitted');
process.env.ARCANE_V1575_MODE=mode;
const original=fs.readFileSync;
function once(text,needle,replacement,context){
 const parts=text.split(needle);
 assert.equal(parts.length,2,'Research source drift in '+context+': '+needle.slice(0,100));
 return parts.join(replacement);
}
function targetRoles(source){
 const stageNine=`stage===9?[\n   ['fusion','guardian'],['fusion','guardian'],['fusion','guardian'],['fusion','guardian'],\n   ['fusion','soul'],['fusion','soul'],['fusion','soul'],['fusion','soul']\n  ]`;
 const stageTen=`stage===10?[\n   ['predator','guardian'],['predator','guardian'],['predator','guardian'],['predator','guardian'],\n   ['predator','soul'],['predator','soul'],['predator','soul'],['predator','soul']\n  ]`;
 source=once(source,stageNine,`stage===9?[\n   ['fusion','predator'],['fusion','predator'],['fusion','predator'],['fusion','predator'],\n   ['fusion','predator'],['fusion','predator'],['fusion','predator'],['fusion','predator']\n  ]`,'stage 9 true fusion vs Predator');
 source=once(source,stageTen,`stage===10?[\n   ['predator','fusion'],['predator','fusion'],['predator','fusion'],['predator','fusion'],\n   ['predator','fusion'],['predator','fusion'],['predator','fusion'],['predator','fusion']\n  ]`,'stage 10 true Predator vs fusion');
 source=once(source,"   const b=makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);",
  "   const b=stage===10?makeFusionRoleDeck(catalog,foeTier,\n"+
  "    fusionModes[pair]==='predator-swarm'?'fusion-mixed':fusionModes[pair],seedB):\n"+
  "    makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);",
  'real legal opponent fusion deck');
 source=once(source,
  '     const foeRolePolicy=stage===7?guardedL10:scenario%2===0?champion:balancedPolicy;',
  '     const foeRolePolicy=stage===10?{...identityFusions,stompResearchMode:"baseline"}:\n'+
  '      stage===7?guardedL10:scenario%2===0?champion:balancedPolicy;',
  'opponent fusion has legal 3..5-material search');
 source=once(source,
  "      0,matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},",
  "      Number(process.env.ARCANE_V1577_LOCK),matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},",
  'identical natural vs symmetric warmup modes');
 return source;
}
let code=original.call(fs,path.join(__dirname,'ai-v1575-counterplay-selfplay.cjs'),'utf8');
code=once(code,'artifacts/v1575/"+mode+"',
 'artifacts/v1577/"+mode+"-lock'+lock,
 'v15.77 distinct output root');
code=once(code,'arcane-v1575-"+mode+"-',
 'arcane-v1577-"+mode+"-lock'+lock+'-',
 'v15.77 distinct provenance label');
let intercepted=0;
fs.readFileSync=function(file,...rest){
 const value=original.call(this,file,...rest);
 if(String(file).replace(/\\/g,'/').endsWith('/ai-v1571-roles-selfplay.cjs')){
  intercepted++;
  return targetRoles(value);
 }
 return value;
};
try{new Function('require','process','console','__dirname',code)(require,process,console,__dirname);}
finally{fs.readFileSync=original;}
assert.equal(intercepted,1,'Research role substitution must occur exactly once');
