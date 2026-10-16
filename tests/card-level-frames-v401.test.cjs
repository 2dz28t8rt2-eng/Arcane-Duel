'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/card-level-frames-v401.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/card-level-frames-v401.css'),'utf8');
function init(){
  const window={ArcaneCardTemplates:{
    choose(c,instance){let family=c.ace?'ace':c.essenceMonster?'essence':c.fusionOnly||instance?.fusion?'fusion':'normal';
      let tier=c.level<=2?1:c.level<=4?2:c.level<=6?3:c.level<=8?4:5;
      return {family,tier,id:family+'-0'+tier,frame:'assets/card-templates/'+family+'-0'+tier+'.svg'};
    }
  }};
  const ctx={window,console,frameClassForCard:c=>'base ad-template',dataOf:c=>c,isFateCard:c=>!!c.fate};
  vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
}
test('Original 20 templates remain and each Level 1–10 has a distinct overlay for all 4 families',()=>{
  const c=init(),seen=new Set();
  for(const family of ['normal','fusion','ace','essence'])for(let level=1;level<=10;level++){
    const card={id:level,level,ace:family==='ace',essenceMonster:family==='essence',fusionOnly:family==='fusion',atk:750,def:540};
    const layout=c.window.ArcaneLevelFrames.resolve(card),classes=c.frameClassForCard(card);
    assert.ok(layout);assert.equal(layout.level,level);
    assert.match(classes,new RegExp('ad-level-'+family+'-'+String(level).padStart(2,'0')));
    const full=path.join(root,layout.overlay);assert.ok(fs.existsSync(full),layout.overlay);
    const svg=fs.readFileSync(full,'utf8');assert.match(svg,/viewBox="0 0 256 408"/);
    assert.ok(svg.includes('Level '+level));seen.add(layout.overlay);
    assert.equal(card.atk,750);assert.equal(card.def,540);
  }
  assert.equal(seen.size,40);
});
test('Five base frame tiers per family are preserved, no gameplay data is mutated',()=>{
  const c=init();const inputs=[1,2,3,4,5,6,7,8,9,10];
  const tiers=inputs.map(level=>c.window.ArcaneLevelFrames.resolve({level}).tier);
  assert.deepEqual(tiers,[1,1,2,2,3,3,4,4,5,5]);
  assert.equal(c.frameClassForCard({id:1,level:2,fate:true}),'base ad-template');
  assert.equal(c.window.ArcaneLevelFrames.resolve({id:2,level:11}),null);
  assert.equal(c.window.ArcaneLevelFrames.resolve({id:2,level:12}),null);
});
test('High-contrast element labels and CSS overlay paths provided for all variants',()=>{
  for(const k of ['FEUER','WASSER','WIND','ERDE','LICHT','DUNKEL'])assert.ok(css.includes('data-element="'+k+'"'));
  assert.match(css,/\.ad-card-element/);assert.match(css,/color:#fff8eb!important/);
  assert.match(css,/\.hand-type:not\(\.ad-card-traits\)/);
  for(const fam of ['normal','fusion','ace','essence'])for(let i=1;i<=10;i++){
    assert.ok(css.includes('.ad-level-'+fam+'-'+String(i).padStart(2,'0')));
  }
});
test('Game entrypoint wires level decoration after official modular templates',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.indexOf('card-level-frames-v401.css')>html.indexOf('card-templates-v1.css'));
 assert.ok(html.indexOf('card-level-frames-v401.js')>html.indexOf('card-templates-v1.js'));
 const renderer=fs.readFileSync(path.join(root,'tools/finished-card-renderer.html'),'utf8');
 assert.match(renderer,/ArcaneLevelFrames\?\.resolve\(c\)/);
 assert.match(renderer,/if\(levelTrim\)ctx\.drawImage/);
});
