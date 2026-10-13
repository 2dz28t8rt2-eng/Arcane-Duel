'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/art-engine.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx=vm.createContext({window:{}});
vm.runInContext(js,ctx,{timeout:3000});
const engine=ctx.window.ArcaneArt;
const kinds=['bird','knight','mage','dragon','wolf','golem','insect','serpent','stag','goblin','ray','spirit'];
const elements=['FEUER','ERDE','WASSER','WIND','LICHT','DUNKEL'];

test('Artwork-Modul wird vor dem Spielcode geladen',()=>{
 assert.ok(html.indexOf('assets/art-engine.js')>=0);
 assert.ok(html.indexOf('assets/art-engine.js')<html.indexOf('assets/game.js'));
 assert.equal(engine.speciesCount,12);
 assert.equal(engine.variantsPerSpecies,3);
});
test('Alle Monsterarten erzeugen gültig abgeschlossene SVG-Datenbilder',()=>{
 for(const [i,kind] of kinds.entries()){
  const uri=engine.makeArt({id:i,kind,color:'#a1b2c3',element:elements[i%elements.length],level:4,fusionOnly:false});
  assert.match(uri,/^data:image\/svg\+xml;charset=utf-8,/);
  const svg=decodeURIComponent(uri.split(',')[1]);
  assert.ok(svg.startsWith('<svg '),kind);
  assert.ok(svg.endsWith('</svg>'),kind);
  assert.match(svg,/viewBox="0 0 240 184"/);
  assert.ok((svg.match(/<path /g)||[]).length>2,kind);
  assert.ok(!svg.includes('undefined')&&!svg.includes('NaN'),kind);
 }
});
test('293 Karten erhalten reproduzierbare und individuelle Artworks',()=>{
 const imgs=new Set();
 for(let id=0;id<293;id++){
  const spec={id,kind:kinds[id%12],color:'#a1b2c3',element:elements[id%6],level:3,fusionOnly:id%9===0};
  const a=engine.makeArt(spec),b=engine.makeArt(spec);
  assert.equal(a,b,'Artwork muss nach Neuladen gleich bleiben');
  imgs.add(a);
 }
 assert.equal(imgs.size,293);
});
test('Jede Spezies besitzt drei unterschiedliche Silhouetten',()=>{
 for(const kind of kinds){
  const shapes=new Set();
  // Variieren nur die Kartennummer, aber denselben Element- und Farbraum halten.
  for(let i=0;i<200&&shapes.size<3;i++){
   const svg=decodeURIComponent(engine.makeArt({id:i,kind,level:3,element:'WIND',color:'#a1b2c3',fusionOnly:false}).split(',')[1]);
   const g=svg.match(/<g transform="[^"]+">([\s\S]+?)<\/g>/);
   assert.ok(g,'Kreaturengruppe fehlt: '+kind);
   const body=g[1].split('</g>')[0];
   const shapeKey=body.slice(0,450).replace(/\d+/g,'N');
   shapes.add(shapeKey);
  }
  assert.equal(shapes.size,3,kind+' darf nicht nur dieselbe Grundfigur spiegeln');
 }
});
