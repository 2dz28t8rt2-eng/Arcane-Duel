'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot}=require('./helpers/game-runtime.cjs');
const pack=require('../assets/duo-card-catalog-v160.json');
const source=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function views(){const scope={};scope.window=scope;vm.runInNewContext(source('assets/card-view-v221.js'),scope);vm.runInNewContext(source('assets/menu-shell-v221.js'),scope);return scope;}

test('every exported board card has the canonical solo art, mode, level and effective values',()=>{
 const view=views().ArcaneCardView221;
 for(const card of pack.cards){
  for(const mode of ['atk','def']){
   const html=view.board(card,{frame:view.frame(card),mode,attack:12345,used:true});
   assert.ok(html.includes('src="'+view.safe(card.art)+'"'),card.name);
   assert.ok(html.includes('data-level="'+card.level+'"'),card.name);
   assert.ok(html.includes('aria-label="Angriff 12345">12345</b>'));assert.ok(html.includes('ad-compact-values'));
   assert.equal(html.includes(' defense'),mode==='def');
   assert.ok(html.includes(' exhausted'));
   assert.ok(html.includes(view.safe(card.name)));
  }
 }
 const escaped=view.board({name:'<img onerror="bad">',art:'x" onerror="bad',level:1,atk:1,def:1});
 assert.ok(!escaped.includes(' onerror="bad'));
});

test('solo board renderer and menu call the canonical component, without changing profile state',()=>{
 const solo=boot();
 const before=solo.run('JSON.stringify(profile)');
 solo.run('(()=>{game=createGame("pve",0);window.__boardCalls=0;window.ArcaneCardView221={...ArcaneCardView221,board:(card,options)=>{window.__boardCalls++;return "<div class=\\"board-creature\\">shared</div>";}};return true;})()');
 assert.match(solo.run('cardHtml({id:0,mode:"def",uid:123},0)'),/shared/);
 assert.equal(solo.run('window.__boardCalls'),1);
 assert.equal(solo.run('JSON.stringify(profile)'),before);
});

test('card explanations and menu content escape user data and share exact markup',()=>{
 const {ArcaneCardView221:cards,ArcaneMenuShell221:menu}=views();
 assert.match(cards.defenderAbility('guardian'),/35 %/);
 assert.equal(cards.defenderAbility('predator'),'');
 assert.match(cards.bondInfo('Partner <script>'),/Partner &lt;script&gt;/);
 const hero=menu.hero({group:'Deck',title:'<Hallo>',description:'Text',utility:'<select></select>'});
 assert.match(hero,/&lt;Hallo&gt;/);assert.match(hero,/fm-hero-utility/);
 const perk=menu.perk({name:'Training',description:'Stärker',rank:2,max:4,button:'<button>Kaufen</button>'});
 assert.equal((perk.match(/class="filled"/g)||[]).length,2);
 assert.equal((perk.match(/<i /g)||[]).length,4);
});

test('both entrypoints load one shared presentation before their adapters',()=>{
 for(const file of ['index.html','duo-campaign-v2.html']){
  const html=source(file),scripts=[...html.matchAll(/<script[^>]*src="([^"?]+)/g)].map(m=>m[1]);
  assert.equal(scripts.filter(s=>s==='assets/battle-presentation-v228.js').length,1);
  for(const name of ['special-presentation-v228.js','bestiary-view-v228.js'])assert.equal(scripts.filter(s=>s==='assets/'+name).length,1);
  assert.ok(scripts.indexOf('assets/battle-presentation-v228.js')<scripts.indexOf(file==='index.html'?'assets/arcane-battle-fx.js':'assets/duo-solo-shell-v221.js'));
  for(const css of ['arcane-battle-fx.css','duel-cinematics-v42.css','duel-polish-v197.css'])assert.ok(html.includes('assets/'+css));
 }
 const shared=source('assets/battle-presentation-v228.js');
 assert.doesNotMatch(shared,/localStorage|sessionStorage|fetch\(|\.send\(|\.hand\b/,'presentation has no persistence, actions or hand access');
});

test('common bestiary descriptions use only supplied inventory and escape names',()=>{
 const scope=views();vm.runInNewContext(source('assets/bestiary-view-v228.js'),scope);
 const card={id:42,name:'<Unknown>',art:'a.png',role:'guardian',level:2,element:'ERDE',atk:100,def:200,desc:'<story>'};
 const owned=scope.ArcaneBestiaryView228.detail(card,{inventory:{42:3},deck:[42,42],fusions:[]});
 assert.match(owned,/&lt;Unknown&gt;/);assert.match(owned,/&lt;story&gt;/);
 assert.match(owned,/Besitz: <b>3/);assert.match(owned,/Hauptdeck: <b>2/);
 const guest=scope.ArcaneBestiaryView228.detail(card);
 assert.match(guest,/Besitz: <b>0/);assert.match(guest,/Hauptdeck: <b>0/);
});

test('confirmed Guardian healing across both players produces a public event, never speculative gains',()=>{
 const window={};vm.runInNewContext(source('assets/duo-abilities-cinema-v193.js'),{window,document:{},console});
 const analyze=window.ArcaneDuoAbilitiesCinema193.analyze;
 const guardian={id:1,uid:1,role:'guardian',mode:'def',def:200},soul={id:2,uid:2,role:'soul',mode:'def',def:40};
 const before={roomId:'r',chapter:1,revision:1,log:[],players:[{seat:0,team:0,ownTurns:1,field:[guardian]},{seat:1,team:1,ownTurns:1,field:[]},{seat:2,team:0,ownTurns:1,field:[soul]}]};
 const after=structuredClone(before);after.revision++;after.players[0].ownTurns++;after.players[2].field[0].def=100;
 const catalog={1:{name:'Wächter'},2:{name:'Seele'}};
 assert.equal(analyze(before,after,catalog).length,0,'no event without server log');
 after.log=['Wächter stärkt Seele um 60 DEF.'];
 const events=analyze(before,after,catalog);assert.equal(events.length,1);
 assert.equal(events[0].kind,'heal');assert.equal(events[0].where.seat,2);assert.equal(events[0].from.seat,0);assert.equal(events[0].amount,60);
 assert.equal(analyze(after,after,catalog).length,0,'polling cannot replay healing');
});
