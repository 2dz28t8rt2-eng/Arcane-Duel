'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');

test('Researcher requires genuine tournament progress, not XP or starter cards',()=>{
 const story=read('assets/lv1-saga-v43.js');
 assert.match(story,/return highestCleared\(profile\)>=3/);
 assert.doesNotMatch(story,/randomInt\(g,100\)<chance/);
});

test('No debuff sound plays at turn transition; victory and result fade are separate',()=>{
 const fx=read('assets/arcane-sfx-v208.js'),music=read('assets/arcane-soundscape-v196.js'),
  finale=read('assets/duel-polish-v197.js');
 assert.match(fx,/if\(kind==='decay'\)return null/);
 assert.doesNotMatch(fx,/play\('decay'\)/);
 assert.match(fx,/play\(kind,\{gain:kind==='win'\?1\.35:1\}\)/);
 assert.match(music,/fadeOutForResult\(ms=5300\)/);
 assert.match(music,/musicScale\(scene\)\*resultScale\(\)/);
 assert.match(finale,/fadeOutForResult\?\.\(5300\)/);
 const a=finale.indexOf("result?.(victory?'win':'lose')");
 const b=finale.indexOf('document.body.append(announcement)');
 assert.ok(a>=0&&b>a,'result sound must lead the large title');
});

test('Training wins and losses both receive exactly one extra XP',()=>{
 const game=read('assets/game.js');
 assert.match(game,/if\(g\.opponentId===0&&\['free','auto'\]\.includes\(g\.context\)\)xp\+=1/);
 assert.match(game,/inkl\. \+1 Trainings-XP/);
});

test('Soul abilities, DEF welcome cue, essence loss, leader onboarding and menu rewards are surfaced',()=>{
 const ui=read('assets/solo-playtest-ux-v211.js'),style=read('assets/solo-playtest-ux-v211.css'),
  bond=read('assets/soul-bond-v206.js');
 assert.match(ui,/data-essence-combat="condense"/);
 assert.match(ui,/data-essence-combat="discharge"/);
 assert.match(ui,/data-essence-target/);
 assert.match(ui,/Seelenessenz −/);
 assert.match(ui,/SEELENSCHUTZ/);
 assert.match(ui,/RUDELFÜHRER/);
 assert.match(ui,/postRewards\.set\(g/);
 assert.match(ui,/setTimeout\(show,reduce\(\)\?450:2150\)/);
 assert.match(ui,/await sleep\(reduce\(\)\?800:1500\)/);
 assert.match(style,/#ad211-board-tools/);
 assert.match(style,/#ad211-board-zoom/);
 assert.match(bond,/SEELENBUND · 35 %/);
});

test('Booster opens with light and gradual card fade, while reduced-motion users skip it',()=>{
 const cinema=read('assets/pack-cinema-v181.js'),css=read('assets/pack-cinema-v195.css');
 assert.match(cinema,/1210\+position\*spacing/);
 assert.match(cinema,/Ein Licht erscheint/);
 assert.match(css,/ad195-reveal-light/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(cinema,/rollBooster|profile\.inventory/);
});

test('Strategy and deck tool copy explains outcomes without technical jargon',()=>{
 const docs=['assets/strategy-experience-v120.js','assets/strategy-suite-v121.js','assets/strategy-evolution-v122.js'];
 for(const p of docs){
  const text=read(p);
  assert.doesNotMatch(text,/Ressourcenorientiert/);
  assert.match(text,/Vorausschauend/);
 }
 const opt=read('assets/strategy-evolution-v122.js');
 assert.match(opt,/eine Karte zum Austauschen/);
 assert.match(opt,/Mal beginnst du, mal dein Gegner/);
 assert.match(read('assets/progression-support-v41.css'),/ad-progress-help-featured/);
});

test('Stomp delays visual destruction to actual staggered secondary impacts',()=>{
 const js=read('assets/fusion-stomp-v200.js'),css=read('assets/fusion-stomp-v200.css');
 assert.match(js,/190\+order\*55/);
 assert.match(js,/stompDoomed/);
 assert.match(css,/ad-stomp-card-shatter/);
 assert.match(css,/\.ad-stomp-visual-destroy/);
});

test('New menu-zoom, booster and controls are linked after their required runtime modules',()=>{
 const html=read('index.html');
 for(const asset of ['solo-playtest-ux-v211.js','solo-playtest-ux-v211.css',
  'fusion-stomp-v200.js','pack-cinema-v195.css'])
  assert.ok(html.includes('assets/'+asset));
 assert.ok(html.indexOf('solo-playtest-ux-v211.js')>html.indexOf('soul-bond-v206.js'));
});
