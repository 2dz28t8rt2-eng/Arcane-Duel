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
const P=scope.ArcanePortraits215;
const scenesScope={ArcanePortraits215:P,document:{}};
vm.runInNewContext(read('assets/duo-story-dialogues-v216.js'),scenesScope);
const story=scenesScope.ArcaneDuoStory216;
const rules=require('../assets/duo-shared-rules-v160.js');
const snap=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snap.cards.map(c=>[c.id,c]));
const main=snap.starterMain,side=snap.starterFusions;
function room(hostPortrait='hero-05'){
 return rules.create({roomId:'portraits-v216-test',hostName:'Host',
  hostDeck:main,hostFusions:side,hostPortrait,
  enemyDeckA:main,enemyDeckB:main,enemyFusionsA:side,enemyFusionsB:side,
  catalog,chapter:1,entry:'new'});
}
test('exactly 28 image assets: 16 selectable heroes and 12 unique, locked story artworks',()=>{
 assert.equal(manifest.assetsRequired,28);
 assert.equal(manifest.items.length,28);
 assert.equal(P.ids.length,28);
 assert.equal(P.heroIds.length,16);
 assert.equal(P.storyIds.length,12);
 assert.equal(new Set(manifest.items.map(x=>x.id)).size,28);
 assert.equal(new Set(manifest.items.map(x=>x.path)).size,28);
 assert.deepEqual([...P.ids].sort(),manifest.items.map(x=>x.id).sort());
 for(const item of manifest.items){
  assert.equal(P.path(item.id),item.path,item.id);
  assert.match(item.path,/^assets\/portraits\/(heroes|story)\/[a-z0-9-]+\.webp$/);
 }
 assert.equal(P.path('../secrets'),null);
 assert.equal(P.sanitizeHero('hero-99'),'hero-01');
});
test('solo non-story opponents use every remaining hero image exactly once',()=>{
 const chosen='hero-08';
 const used=Array.from({length:11},(_,i)=>P.visualSolo({id:i,selected:chosen}));
 assert.equal(new Set(used).size,11);
 assert.equal(used.includes(chosen),false);
 assert.deepEqual(used,Array.from({length:11},(_,i)=>P.visualSolo({id:i,selected:chosen})));
 for(const img of used)assert.ok(P.heroIds.includes(img));
});
test('ordinary duo enemies use distinct portraits excluding both humans, stable per chapter',()=>{
 const humans=['hero-02','hero-07'];
 for(let chapter=1;chapter<=9;chapter++){
  const a=P.visualDuo({chapter,seat:1,selected:humans});
  const b=P.visualDuo({chapter,seat:3,selected:humans});
  assert.ok(P.heroIds.includes(a));
  assert.ok(P.heroIds.includes(b));
  assert.notEqual(a,b);
  assert.ok(!humans.includes(a)&&!humans.includes(b));
  assert.equal(a,P.visualDuo({chapter,seat:1,selected:humans}));
 }
});
test('Eiman is the same fixed portrait in single/duo; Hans is separate and never randomized',()=>{
 assert.equal(P.soloOpponent(8,true),'story-eiman');
 assert.equal(P.duoOpponent(10,1),'story-eiman');
 assert.equal(P.duoOpponent(10,3),'story-hans');
 for(const selected of [['hero-01'],['hero-04','hero-09'],[]]){
  assert.equal(P.visualDuo({chapter:10,seat:1,selected}),'story-eiman');
  assert.equal(P.visualDuo({chapter:10,seat:3,selected}),'story-hans');
 }
});
test('three research histories: first fanatic shares five artworks between modes, second has five unique images',()=>{
 const first=new Set(),second=new Set();
 for(let stage=1;stage<=5;stage++){
  const a=P.storyFanatic(1,stage),b=P.storyFanatic(2,stage);
  assert.equal(a,P.soloOpponent(1,false,stage));
  assert.equal(a,P.visualDuo({chapter:stage+10,seat:1}));
  assert.equal(b,P.visualDuo({chapter:stage+10,seat:3}));
  assert.notEqual(a,b);
  first.add(a);second.add(b);
 }
 assert.equal(first.size,5);assert.equal(second.size,5);
 assert.equal([...first].some(id=>second.has(id)),false);
 assert.equal(P.storyFanatic(2,6),null);
});
test('Eiman/Hans introduction alternates voices and each of five research chapters contains its own alternating dialogue',()=>{
 assert.equal(story.scene(10).length,4);
 for(let chapter=10;chapter<=15;chapter++){
  const entries=story.scene(chapter);
  assert.equal(entries.length,4);
  assert.deepEqual([...entries].map(e=>e.seat),[1,3,1,3]);
  assert.ok(entries.every(e=>e.text.length>25));
 }
 assert.notEqual(story.scene(11)[0].text,story.scene(15)[0].text);
 assert.equal(story.scene(9).length,0);
});
test('2v2 player portraits are separate, validated and preserved through chapter transitions',()=>{
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
 assert.equal(room('<img src=x>').players[0].portraitId,'hero-01');
});
test('both games load portrait registry and duo story before game state handlers',()=>{
 const solo=read('index.html'),duo=read('duo-campaign-v2.html');
 assert.ok(solo.indexOf('duelist-portraits-v215.js')<solo.indexOf('game.js?v='));
 assert.ok(solo.indexOf('duelist-portraits-solo-v215.js')>solo.indexOf('game.js?v='));
 assert.ok(duo.indexOf('duelist-portraits-v215.js')<duo.indexOf('duo-parity-v160.js'));
 assert.ok(duo.indexOf('duo-story-dialogues-v216.js')<duo.indexOf('duo-parity-v160.js'));
 assert.match(duo,/duo-story-dialogues-v216.css/);
 assert.match(duo,/duoAvatarPicker/);
 assert.match(read('assets/duo-parity-v160.js'),/storyChapter=game\.entry==='quest'/);
 assert.match(read('assets/game.js'),/p\.avatarId='hero-01'/);
 assert.match(read('supabase/functions/arcane-duo-v2/index.ts'),/profileAvatar/);
});


test('2v2 uses every remaining portrait before reuse across ordinary chapters',()=>{
 const chosen=['hero-02','hero-07'],available=P.heroIds.filter(id=>!chosen.includes(id));
 const seen=[];
 for(let chapter=1;chapter<=7;chapter++)
  for(const seat of [1,3])
   seen.push(P.visualDuo({chapter,seat,selected:chosen}));
 assert.equal(new Set(seen).size,available.length);
 assert.deepEqual([...seen].sort(),[...available].sort());
 assert.equal(P.visualDuo({chapter:8,seat:1,selected:chosen}),seen[0]);
 assert.equal(P.visualDuo({chapter:8,seat:3,selected:chosen}),seen[1]);
});
test('portrait galleries present one researcher per stage and update on progression',()=>{
 const solo=read('assets/duelist-portraits-solo-v215.js');
 const duo=read('assets/duelist-portraits-duo-v215.js');
 assert.match(solo,/saga\.met\|\|saga\.offered\|\|cleared>0/);
 assert.doesNotMatch(solo,/for\(let stage=1;stage<=5;stage\+\+\)/);
 assert.match(duo,/function visibleChapters\(\)/);
 assert.match(duo,/const current=R\.QUESTS\.find/);
 assert.match(duo,/updateProfile\(profile\)/);
 assert.match(read('assets/duo-parity-v160.js'),/updateProfile\?\.\(duoProfile\)/);
});
test('first completed Fanatiker quest grants Level-1 research to both teammates on the server',()=>{
 const sql=read('supabase/migrations/202610270001_arcane_duo_v2_ten_chapters_fanatic_saga.sql');
 assert.match(sql,/for v_profile in[\s\S]*?new\.host_profile_id,new\.guest_profile_id/);
 assert.match(sql,/v_chapter >= 11 and \([\s\S]*?questPassed/);
 assert.match(sql,/lv1_research=case when v_chapter=11 and v_first then/);
 assert.match(sql,/p\.lv1_research\|\|'\{"perk":true\}'::jsonb/);
});

test('hero portraits 13–16 validate consistently in solo, duo and Edge',()=>{
 for(let i=13;i<=16;i++){
  const id='hero-'+i;
  assert.equal(P.sanitizeHero(id),id);
  assert.equal(P.path(id),'assets/portraits/heroes/'+id+'.webp');
  assert.equal(manifest.items.find(x=>x.id===id)?.type,'player-choice');
 }
 assert.equal(P.heroNames[12],'Arkanmechanikerin');
 const initial=room('hero-16');
 assert.equal(initial.players[0].portraitId,'hero-16');
 const joined=rules.apply(initial,2,{type:'join',name:'Partner',deck:main,fusions:side,
  portraitId:'hero-15'},{catalog});
 assert.equal(joined.players[2].portraitId,'hero-15');
 for(const path of ['assets/game.js','supabase/functions/arcane-duo-v2/index.ts',
  'supabase/functions/arcane-duo-v2/duo-rules.js']){
  assert.ok(read(path).includes('1[0-6]'),path);
 }
});
