const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),text=fs.readFileSync(path.join(root,'assets/collection-v3-data.js'),'utf8'),cards=JSON.parse(text.slice(text.indexOf('['),text.lastIndexOf(']')+1));
const ids=[0,8,10,5,1,4,16,13,18,19];
test('10 new normal monster artworks exist',()=>{for(let i=1;i<=10;i++)assert.ok(fs.statSync(path.join(root,'assets/custom-art/normal-pack-01-'+String(i).padStart(2,'0')+'.webp')).size>1000);});
test('Each new monster family has 4 levels with same artwork, element and name',()=>{for(const id of ids){const a=cards.filter(c=>c.id===id||c.variantOf===id);assert.equal(a.length,4);for(const key of ['art','element','name'])assert.equal(new Set(a.map(c=>c[key])).size,1);}});
