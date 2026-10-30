'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('assets/portrait-manifest-v215.json'));
const scope={};
vm.runInNewContext(read('assets/duelist-portraits-v215.js'),scope);
const portraits=scope.ArcanePortraits215;
const rules=require('../assets/duo-shared-rules-v160.js');
const catalogData=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(catalogData.cards.map(c=>[c.id,c]));
const main=catalogData.starterMain,side=catalogData.starterFusions;
function room(hostPortrait='hero-05'){
 return rules.create({roomId:'portraits-v215-fixture',hostName:'Gastgeber',
  hostDeck:main,hostFusions:side,hostPortrait,
  enemyDeckA:main,enemyDeckB:main,enemyFusionsA:side,enemyFusionsB:side,
  catalog,chapter:1,entry:'new'});
}
test('all 60 preallocated slots match the declared upload manifest without extra setup',()=>{
 assert.equal(manifest.slots,60);
 assert.equal(manifest.items.length,60);
 assert.equal(new Set(manifest.items.map(x=>x.id)).size,60);
 assert.equal(new Set(manifest.items.map(x=>x.path)).size,60);
 assert.deepEqual([...portraits.ids].sort(),manifest.items.map(x=>x.id).sort());
 for(const item of manifest.items){
  assert.equal(portraits.path(item.id),item.path,item.id);
  assert.match(item.path,/^assets\/portraits\/(heroes|solo|duo)\/[a-z0-9-]+\.webp$/);
 }
 assert.equal(portraits.path('../secrets'),null);
 assert.equal(portraits.sanitizeHero('hero-99'),'hero-01');
 assert.equal(portraits.validHero('hero-12'),true);
});
test('solo tournament, secret fight, wanderers and five story opponents have separate slots',()=>{
 for(let i=0;i<=10;i++)assert.equal(portraits.soloOpponent(i),
  'solo-opponent-'+String(i).padStart(2,'0'));
 for(let i=1;i<=5;i++)assert.equal(portraits.soloOpponent(1,false,i),
  'solo-fanatiker-'+String(i).padStart(2,'0'));
 assert.equal(portraits.soloOpponent(8,true),'solo-secret-eiman');
 assert.equal(portraits.soloOpponent(2,false,0,true),'solo-wanderer');
});
test('both unique opponents of every duo chapter are covered without sharing a portrait slot',()=>{
 for(let chapter=1;chapter<=15;chapter++){
  const a=portraits.duoOpponent(chapter,1);
  const b=portraits.duoOpponent(chapter,3);
  assert.notEqual(a,b);
  assert.ok(manifest.items.some(x=>x.id===a&&x.chapter===chapter&&x.seat===1));
  assert.ok(manifest.items.some(x=>x.id===b&&x.chapter===chapter&&x.seat===3));
 }
});
test('separate 2v2 online profiles retain selected portraits on join and next chapter',()=>{
 const initial=room('hero-09');
 assert.equal(initial.players[0].portraitId,'hero-09');
 let joined=rules.apply(initial,2,{type:'join',name:'Partner',deck:main,fusions:side,
  portraitId:'hero-12'},{catalog});
 assert.equal(joined.players[2].portraitId,'hero-12');
 assert.equal(rules.view(joined,0).players[2].portraitId,'hero-12');
 joined.status='finished';joined.winner=0;
 const invited=rules.apply(joined,0,{type:'nextChapter'},{catalog});
 const build={deck:main,fusions:side,upgrades:{},enhancements:{},essence:{},lv1:{}};
 const next=rules.apply(invited,2,{type:'acceptNextChapter'},{catalog,humanBuilds:{
  0:{...build,portraitId:'hero-02'},2:{...build,portraitId:'hero-11'}}});
 assert.equal(next.players[0].portraitId,'hero-02');
 assert.equal(next.players[2].portraitId,'hero-11');
});
test('untrusted 2v2 avatar IDs always fall back to a known built-in slot',()=>{
 assert.equal(room('<img src=x>').players[0].portraitId,'hero-01');
 const joined=rules.apply(room(),2,{type:'join',name:'X',deck:main,fusions:side,
  portraitId:'../../other'},{catalog});
 assert.equal(joined.players[2].portraitId,'hero-01');
});
test('both games load the shared registry before their own visual presenter',()=>{
 const solo=read('index.html'),duo=read('duo-campaign-v2.html');
 assert.ok(solo.indexOf('duelist-portraits-v215.js')<solo.indexOf('game.js?v='));
 assert.ok(solo.indexOf('duelist-portraits-solo-v215.js')>solo.indexOf('game.js?v='));
 assert.ok(duo.indexOf('duelist-portraits-v215.js')<duo.indexOf('duo-parity-v160.js'));
 assert.ok(duo.indexOf('duelist-portraits-duo-v215.js')>duo.indexOf('duo-parity-v160.js'));
 assert.match(solo,/duelist-portraits-v215.css/);
 assert.match(duo,/duoAvatarPicker/);
 assert.match(duo,/duoAvatarEdit/);
 assert.match(read('assets/game.js'),/p\.avatarId='hero-01'/);
 assert.match(read('supabase/functions/arcane-duo-v2/index.ts'),/profileAvatar/);
});
