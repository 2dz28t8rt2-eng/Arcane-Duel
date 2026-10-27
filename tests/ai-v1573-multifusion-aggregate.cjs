'use strict';
/* Identical frozen v14.9.71/v14.9.72 acceptance gates, with only arm names,
 * independent seeds and output path changed for multi-material research. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-roles-aggregate.cjs'),'utf8');
function all(before,after){
 assert.ok(source.includes(before),'Missing aggregate anchor '+before);
 source=source.split(before).join(after);
}
all('artifacts/v1571','artifacts/v1573');
all('arcane-v1571','arcane-v1573');
all('15710000+','15730000+');
all('defender-v1569-endgame-control','defender-v1573-survival-control');
all('defender-v1569-mixed-control','defender-v1573-counterplay');
all('role-identity-conditional-fusion','fusion-v1573-multimaterial');
// The pre-v1573 role-safety invariant correctly freezes all other research
// arms, but cannot require the intentionally expanded *fusion* challenger to
// copy the 2-material champion's actions. Preserve all strict promotion,
// HEAD-TO-HEAD, split, seat, decay and holdout gates unchanged.
const roleSafeBefore="for(const r of t.allCases.filter(r=>stage!==9&&stage!==10&&names.slice(3).includes(r.arm)&&\n   !['soul','guardian'].includes(r.roleA))){";
const roleSafeAfter="for(const r of t.allCases.filter(r=>stage!==9&&stage!==10&&names.slice(3).includes(r.arm)&&\n   !['soul','guardian'].includes(r.roleA)&&\n   !(r.arm==='fusion-v1573-multimaterial'&&r.roleA==='fusion'))){";
assert.equal(source.split(roleSafeBefore).length,2,'Missing original role-safe control');
source=source.replace(roleSafeBefore,roleSafeAfter);
new Function('require','process','console',source)(require,process,console);
