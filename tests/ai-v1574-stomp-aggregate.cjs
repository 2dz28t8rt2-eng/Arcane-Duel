'use strict';
/* Preserve ALL frozen champion, seat, defender, holdout and role-safety
 * comparison gates of v15.73. Update only the new research label, seeds and
 * artifact namespace; do not select on HOLDOUT results.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1573-multifusion-aggregate.cjs'),'utf8');
function all(before,after){assert.ok(source.includes(before),'Missing aggregate anchor '+before);
 source=source.split(before).join(after);}
all('artifacts/v1573','artifacts/v1574');
all('arcane-v1573','arcane-v1574');
all('15730000+','15740000+');
all('fusion-v1573-multimaterial','fusion-v1574-stomp-conscious');
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
