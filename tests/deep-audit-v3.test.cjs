'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=Object.fromEntries(['game.js','expansion.js','evolution.js'].map(p=>[p,read('assets/'+p)]));
const css=read('assets/card-look-v3.css');

test('No duplicate named function declarations per JavaScript module',()=>{
 for(const [name,s] of Object.entries(scripts)){
  const names=[...s.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(x=>x[1]);
  const repeats=names.filter((x,i)=>names.indexOf(x)!==i);
  assert.deepEqual(repeats,[],`${name}: overlapping function declarations`);
 }
});
test('Deliberate legacy wrappers preserve previous implementation references',()=>{
 assert.match(scripts['expansion.js'],/const stored=\{/);
 assert.match(scripts['evolution.js'],/const previous=\{/);
 assert.match(scripts['expansion.js'],/stored\.renderMenu\(\)/);
 assert.match(scripts['evolution.js'],/previous\.renderMenu\(\)/);
 assert.equal((scripts['game.js'].match(/\$\('manualSaveBtn'\)\.onclick=manualSave;/g)||[]).length,1);
});
test('Deck-card selection updates detail pane without discarding current filters',()=>{
 assert.match(scripts['game.js'],/function updateDeckPreview\(/);
 const method=scripts['game.js'].split('function updateDeckPreview(')[1].split('function deckPreviewCard(')[0];
 assert.match(method,/side\.outerHTML=cardDetailPanel/);
 assert.doesNotMatch(method,/renderMenu\(/);
 assert.match(css,/grid-template-areas:"filters detail" "cards detail"/);
 assert.match(css,/\.deck-editor-layout\s*>\s*\.collection-filters\{grid-area:filters/);
});
test('Small card markup has numeric level, centered element and no body description',()=>{
 const method=scripts['game.js'].split('function fullCardHtml(')[1].split('function ensureEditorPreviewId(')[0];
 assert.match(method,/class="card-level-badge"/);
 assert.match(method,/class="hand-type">\$\{elementLabel\}/);
 assert.doesNotMatch(method,/class="stat-label"/);
 assert.doesNotMatch(method,/class="hand-description"/);
 assert.match(css,/\.deck-preview-desc/);
});
test('All 12 colored level families and fusion/ACE frames remain distinguishable',()=>{
 for(let level=1;level<=12;level++)assert.ok(css.includes(`.hand-card.tc-card.tc-lv-${level}:not(.tc-fusion):not(.tc-ace)`),`level ${level}`);
 assert.match(css,/\.hand-card\.tc-card\.tc-fusion:not\(\.tc-ace\)/);
 assert.match(css,/\.hand-card\.tc-card\.tc-ace/);
 assert.match(css,/ace-sparkle/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('Sale, upgrade, dismantle and pack confirmations are one-shot',()=>{
 const s=scripts['game.js'];
 for(const id of ['sellConfirm','ascendConfirm','salvageConfirm','packConfirm']){
  const pos=s.indexOf(`$('${id}').onclick=()=>`);
  assert.ok(pos>0,`${id} handler`);
  assert.match(s.slice(pos,pos+200),/if\(confirm\.disabled\)return;confirm\.disabled=true;/);
 }
});
test('First tournament win does not promise obsolete free Fusion cards',()=>{
 const s=scripts['expansion.js'],segment=s.split("const html='<section class=\"first-win-box\">")[1]?.split('const modal=')[0];
 assert.ok(segment,'first-win message');
 assert.match(segment,/einmalig im Shop/);
 assert.match(segment,/nicht kostenlos/);
 assert.doesNotMatch(segment,/Du erhältst eine besondere Fusionskarte/);
 const evo=scripts['evolution.js'];
 assert.doesNotMatch(evo,/querySelector\('\.first-win-box'\)/);
});
test('All customized card art assets are shipped in the local build',()=>{
 const art=[...scripts['game.js'].matchAll(/['"]?(?:art|customArt)['"]?\s*:\s*['"](assets\/(?:custom-art|ace)\/[^'"]+)['"]/g)].map(x=>x[1]);
 assert.ok(art.length>=60,'new artwork mappings');
 const missing=art.filter(p=>!fs.existsSync(path.join(root,p)));
 assert.deepEqual(missing,[]);
 const webps=fs.readdirSync(path.join(root,'assets/custom-art')).filter(n=>n.endsWith('.webp'));
 assert.equal(webps.length,74); // four approved Level-1 fusion artworks added in v4.4
});
