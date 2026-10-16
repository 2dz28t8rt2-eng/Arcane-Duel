'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/card-v405-polish.css'),'utf8');
const meta={FEUER:'#ffb780',WASSER:'#9adfff',ERDE:'#bae99c',WIND:'#a6ece9',LICHT:'#ffe6a0',DUNKEL:'#d9b6ff'};
const icons=['predator-skull','guardian-shield','guardian-sword','soul-spiral','weaver-rune','hunter-arrow','support-star','combatant-swords'];
test('All six inner card element stripes animate with their individual palette',()=>{
 for(const el of Object.keys(meta))assert.ok(css.includes('.hand-card.tc-card[data-element="'+el+'"]'),el);
 for(const part of ['.hand-type:not(.ad-card-traits)::after','.hand-type.ad-card-traits .ad-card-element::after',
  '@keyframes ad405-element-breath','@keyframes ad405-element-motes','ad405-element-breath var(--e-cycle,7.2s)',
  '#duelScreen .hand-card.tc-card[data-element]','#deckSidePreview.ad-deck-portal'])assert.ok(css.includes(part),part);
});
test('Below-card element text has correct STATIC color, never CSS animation',()=>{
 const labelBlock=css.slice(css.indexOf('.collection-actions > span {'),css.indexOf('/* Role banners below'));
 assert.ok(labelBlock.includes('font-weight:800!important'));
 assert.ok(labelBlock.includes('animation:none!important'));
 for(const [el,color] of Object.entries(meta)){
  const line='.collection-item:has(> .hand-card[data-element="'+el+'"]) {--e-meta-color:'+color+';}';
  assert.ok(labelBlock.includes(line),line);
 }
 assert.ok(!labelBlock.includes('--e-meta-color:10.7s'));
});
test('Redundant LV badge hidden without removing real level disc',()=>{
 assert.ok(css.includes('.card-level-badge {'));
 assert.ok(css.includes('display:none!important'));
 assert.ok(css.includes('-webkit-line-clamp:2!important'));
 assert.ok(css.includes('white-space:normal!important'));
 const game=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
 assert.ok(game.includes('class="ad-level-medallion"'));
});
test('Eight heraldic icons and all role layouts are available',()=>{
 for(const icon of icons){
  const file=path.join(root,'assets/card-v405-icons',icon+'.svg');
  assert.ok(fs.existsSync(file),icon);
  const src=fs.readFileSync(file,'utf8');
  assert.ok(src.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(src.includes('viewBox="0 0 24 24"'));
  assert.ok(css.includes(icon+'.svg'));
 }
 for(const role of ['predator','guardian','defender','soul','weaver','hunter','support','combatant'])
  assert.ok(css.includes('.arcane-role-readout.arcane-role-'+role));
 assert.ok(css.includes('grid-template-columns:17px minmax(0,1fr) 17px'));
});
test('Animation preferences are respected and stylesheet is last',()=>{
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('body.ad-motion-disabled'));
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal(index.split('card-v405-polish.css').length-1,1);
 assert.ok(index.indexOf('card-v405-polish.css')>index.indexOf('card-shell-v404.css'));
});
