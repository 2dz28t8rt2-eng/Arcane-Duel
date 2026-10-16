'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/card-v405-polish.css'),'utf8');
const icons=['predator-skull','guardian-shield','guardian-sword','soul-spiral','weaver-rune','hunter-arrow','support-star','combatant-swords'];
test('Only inner element card bars and element chips receive CSS animations',()=>{
 for(const element of ['FEUER','WASSER','ERDE','WIND','LICHT','DUNKEL'])
  assert.ok(css.includes('hand-card.tc-card[data-element="'+element+'"]'));
 assert.match(css,/.hand-type:not(.ad-card-traits)::after/);
 assert.match(css,/.hand-type.ad-card-traits .ad-card-element::after/);
 assert.match(css,/@keyframes ad405-element-breath/);
 assert.match(css,/@keyframes ad405-element-motes/);
 assert.match(css,/#duelScreen .hand-card.tc-card[data-element]/);
 assert.match(css,/#deckSidePreview.ad-deck-portal/);
});
test('Below-card summary is static and palette-mapped',()=>{
 assert.match(css,/.collection-actions > spans*{/);
 assert.match(css,/font-weight:800!important/);
 assert.match(css,/animation:none!important/);
 for(const el of ['FEUER','WASSER','ERDE','WIND','LICHT','DUNKEL'])
   assert.ok(css.includes('.collection-item:has(> .hand-card[data-element="'+el+'"])'));
});
test('Top badge hidden and long card titles enlarged',()=>{
 assert.match(css,/.card-level-badges*{s*display:none!important/);
 assert.match(css,/-webkit-line-clamp:2!important/);
 assert.match(css,/white-space:normal!important/);
});
test('Eight role icons exist and every role gets a left/right icon',()=>{
 for(const icon of icons){const file=path.join(root,'assets/card-v405-icons',icon+'.svg');assert.ok(fs.existsSync(file));const source=fs.readFileSync(file,'utf8');assert.match(source,/viewBox="0 0 24 24"/);assert.ok(css.includes(icon+'.svg'));}
 for(const role of ['predator','guardian','defender','soul','weaver','hunter','support','combatant'])
   assert.ok(css.includes('.arcane-role-readout.arcane-role-'+role));
 assert.match(css,/grid-template-columns:17px minmax(0,1fr) 17px/);
});
test('Reduced motion and in-game animation toggle disable effects',()=>{
 assert.match(css,/@media(prefers-reduced-motion:reduce)/);
 assert.match(css,/body.ad-motion-disabled/);
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal(index.split('card-v405-polish.css').length-1,1);
 assert.ok(index.indexOf('card-v405-polish.css')>index.indexOf('card-shell-v404.css'));
});
