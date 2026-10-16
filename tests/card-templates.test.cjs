'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/card-templates-v1.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/card-templates-v1.css'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
function start(){
 const context={
  window:{},
  frameClassForCard:()=> 'native-frame',
  dataOf:c=>c,
  isFateCard:c=>Boolean(c?.fate),
  console
 };
 vm.createContext(context);
 vm.runInContext(js,context,{filename:'card-templates-v1.js'});
 return context;
}
test('All 20 named layouts are distinct, represented and backed by transparent SVG',()=>{
 const {window:w}=start();
 assert.equal(w.ArcaneCardTemplates.definitions.length,20);
 assert.equal(new Set(w.ArcaneCardTemplates.definitions.map(x=>x.id)).size,20);
 for(const family of w.ArcaneCardTemplates.families){
  const group=w.ArcaneCardTemplates.definitions.filter(x=>x.family===family);
  assert.deepEqual(Array.from(group,x=>x.tier),[1,2,3,4,5]);
  for(const item of group){
   const svg=fs.readFileSync(path.join(root,item.frame),'utf8');
   assert.match(svg,/<svg[^>]*viewBox="0 0 256 408"/);
   assert.doesNotMatch(svg,/<rect[^>]+fill=/,'The artwork viewport must stay transparent');
   assert.ok(svg.includes('fill="none"'),'Transparent ornamental lines required');
   assert.ok(css.includes('.ad-template-'+item.id+'{'),'Template has a concrete CSS palette');
  }
 }
});
test('Template selection follows authoritative card family and level',()=>{
 const {window:w}=start(),choose=w.ArcaneCardTemplates.choose;
 assert.equal(choose({id:1,level:1}).id,'normal-01');
 assert.equal(choose({id:2,level:4,fusionOnly:true}).id,'fusion-02');
 assert.equal(choose({id:3,level:6,ace:true,fusionOnly:true}).id,'ace-03');
 assert.equal(choose({id:4,level:9,essenceMonster:true}).id,'essence-05');
 assert.equal(choose({id:5,level:10,ace:true}).id,'ace-05');
 assert.equal(choose({id:6,level:11}).id,'normal-05');
 assert.equal(choose({id:7,level:2}, {fusion:true}).id,'fusion-01');
});
test('Renderer changes ONLY CSS classes, never card data, values or Fate frames',()=>{
 const ctx=start(),base={id:123,level:7,name:'Testmonster',atk:1830,def:970,role:'guardian',art:'old.webp'};
 const initial=JSON.stringify(base);
 assert.match(ctx.frameClassForCard(base),/ad-template-normal-04/);
 assert.equal(JSON.stringify(base),initial);
 assert.equal(ctx.frameClassForCard({...base,fate:true}),'native-frame');
});
test('Templates appear after existing styles and scripts, without duplicating card data',()=>{
 assert.ok(index.includes('assets/card-templates-v1.css'));
 assert.ok(index.includes('assets/card-templates-v1.js'));
 assert.ok(index.indexOf('card-templates-v1.css')>index.indexOf('arcane-luxe-ui.css'));
 assert.ok(index.indexOf('card-templates-v1.js')>index.indexOf('artwork-revamp-v4.js'));
 assert.ok(css.includes('var(--ad-tpl-frame)'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(!js.includes('CARDS.push('));
});
test('Browsable gallery contains 20 individual examples and all frame links',()=>{
 const html=fs.readFileSync(path.join(root,'docs/kartenlayout-galerie.html'),'utf8');
 assert.equal((html.match(/class="demo-cell"/g)||[]).length,20);
 for(const d of start().window.ArcaneCardTemplates.definitions){
  assert.ok(html.includes('id="'+d.id+'"'),'Gallery missing '+d.id);
  assert.ok(html.includes('../'+d.frame),'Gallery frame link missing '+d.id);
 }
});
