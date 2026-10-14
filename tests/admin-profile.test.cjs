'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('Only the normal player entrypoint is shipped',()=>{
 assert.equal(fs.existsSync(path.join(root,'admin.html')),false);
 assert.equal(fs.existsSync(path.join(root,'index.html')),true);
 const js=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
 assert.match(js,/const SAVE_KEY='arcane-duel-rpg-profile-v4-reborn'/);
 assert.doesNotMatch(js,/ArcaneAdminMode|seedAdminProfile/);
});
