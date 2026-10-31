'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');

test('victory menu is never blocked by inline earned-card cinema or an accidental nested navigation',()=>{
 const core=src('assets/game.js'),scene=src('assets/duel-cinematics-v42.js');
 assert.match(core,/function returnToMenu\(\)\{if\(\(busy\|\|aiRunning\)\&\&game\?\.winner===null\)return;/);
 assert.match(core,/\$\('modalMenu'\)\.onclick=returnToMenu/);
 assert.doesNotMatch(scene,/if\(rewardItems\.length\)nextReward\(\);return r;/);
 assert.match(scene,/returnToMenu=function\(\.\.\.args\)\{/);
 assert.match(scene,/if\(leaving\)return;/);
 assert.match(scene,/if\(!leaving\&\&game\?\.finishShown/);
 assert.match(scene,/if\(!\$\('overlay'\)\.classList\.contains\('hidden'\)\)/);
});
test('one field stance button performs both DEF and ATK changes',()=>{
 const core=src('assets/game.js'),polish=src('assets/duel-polish-v197.js');
 assert.match(core,/\$\('switchBtn'\)\.textContent=chosen\?/);
 assert.doesNotMatch(polish,/ad197-switch|quickbar\.insertBefore\(button,next\)/);
 assert.match(polish,/id\('switchBtn'\)\.click\(\)/);
});
test('Soul Bond does not let the 35%-aura boxes overlap their neighbors',()=>{
 const css=src('assets/soul-bond-v206.css');
 assert.doesNotMatch(css,/\.ad206-linked\{[^}]*overflow:visible!important/);
 assert.match(css,/:is\(#duelScreen,#duoBattleArena\) \.monster-slot\.ad206-linked\{overflow:hidden!important/);
 assert.match(css,/\.ad206-bridge\{left:66%;width:30%;max-width:30%/);
 assert.match(css,/\.ad206-mark\{left:3px;right:3px/);
});
test('Eiman Huel enters with normal LP fill and only then draws initial cards',()=>{
 const core=src('assets/game.js'),intro=src('assets/arcane-battle-fx.js');
 const scene=core.slice(core.indexOf('function startShowcaseDuel('),
  core.indexOf('function showcasePanel(){'));
 assert.match(scene,/ad-opening-hand-wait/);
 assert.match(scene,/\$\('showcaseGo'\)\.onclick=async\(\)=>/);
 assert.match(scene,/await window\.ArcaneBattleFX\?\.beginCinema\?\.\(\)/);
 assert.match(intro,/screen\.dataset\.lpPhase='filling'/);
 assert.match(intro,/if\(f<1\)raf=requestAnimationFrame\(frame\);else close\(\);/);
 assert.match(intro,/const close=async\(\)=>\{/);
 assert.match(intro,/await window\.ArcaneHandDraw1161\?\.revealOpeningHand\?\.\(\)/);
});
test('ACE card is only shown after victory and never treated as free loot',()=>{
 const core=src('assets/game.js'),ux=src('assets/solo-playtest-ux-v211.js');
 const result=core.slice(core.indexOf('function showFinished16(){'),
  core.indexOf('function returnToMenu(){'));
 assert.doesNotMatch(result,/TURNIER-FREISCHALTUNG · JETZT IM SHOP KAUFBAR/);
 assert.match(ux,/aceUnlockId=g\.winner===0/);
 assert.match(ux,/post\.aceUnlockId/);
 assert.match(ux,/nicht kostenlos erhalten/);
 assert.match(ux,/Booster-Shop für Essenz gekauft/);
 assert.match(ux,/window\.ArcaneVictoryRewards\?\.active/);
 assert.match(ux,/img\.addEventListener\('load',ready/);
 assert.match(src('assets/solo-playtest-ux-v211.css'),/not\(\.ad211-card-ready\) \.hand-card\{visibility:hidden!important/);
});
test('tournament victory reports the actual trial and level popup states meaningful progression',()=>{
 const expansion=src('assets/expansion.js'),ux=src('assets/solo-playtest-ux-v211.js');
 assert.doesNotMatch(expansion,/Erste Turnierprüfung bestanden!/);
 assert.match(expansion,/Turnierprüfung '\+\(game\.opponentId===10\?'X':game\.opponentId\)\+' bestanden!/);
 assert.match(ux,/Du bist durch deine gesammelte Erfahrung von Level/);
 assert.match(ux,/Bis zur nächsten Spielerstufe fehlen dir noch/);
 assert.match(ux,/Seltenheitsbonus|Chancen auf seltene Karten/);
 assert.match(ux,/VERSTANDEN · ZUM MENÜ/);
});
test('the foe is named Gegner in the turn header, without misleading KI-is-on-turn label',()=>{
 const core=src('assets/game.js');
 assert.match(core,/Gegner ist am Zug/);
 assert.doesNotMatch(core,/\$\('turnName'\)\.textContent=[^\n]*KI ist am Zug/);
});
test('HTML carries updated assets for all seven affected subsystems',()=>{
 const html=src('index.html');
 const version=html.match(/<meta name="arcane-duel-version" content="([^"]+)"/)[1];
 for(const p of ['game.js','expansion.js','duel-cinematics-v42.js',
  'duel-polish-v197.js','solo-playtest-ux-v211.js','solo-playtest-ux-v211.css',
  'soul-bond-v206.css']){
   const shared=['game.js','duel-cinematics-v42.js','duel-polish-v197.js','soul-bond-v206.css'].includes(p);
   assert.ok(html.includes(p+'?v='+(p==='game.js'?version:shared?'shared-presentation-228':'20261031-solo-feedback-v227')),p);
  }
});
