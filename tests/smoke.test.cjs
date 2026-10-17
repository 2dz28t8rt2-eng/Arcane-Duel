'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
function boot(){
 const data=new Map(),els=new Map();
 function el(id=''){return {id,innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},value:'',classList:{add(){},remove(){},toggle(){},contains(k){return k==='hidden'}},append(){},remove(){},addEventListener(){},click(){},getBoundingClientRect(){return {left:1,top:1,width:100,height:40}}};}
 const document={body:el('body'),getElementById(id){if(!els.has(id))els.set(id,el(id));return els.get(id)},querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))},window={localStorage,crypto:{getRandomValues(a){a[0]=123456;return a}}};
 const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(source,ctx,{timeout:8000});return {run:s=>vm.runInContext(s,ctx,{timeout:8000}),data};
}
test('Assets sind extern eingebunden',()=>{const h=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(h,/assets\/game\.js/);assert.match(h,/assets\/styles\.css/)});
test('Ein frisches Profil ist speicherbar und das Startdeck hat 40 Karten',()=>{const b=boot();assert.ok(b.data.has('arcane-duel-rpg-profile-v4-reborn'));assert.equal(b.run('profile.activeDeck.length'),40)});
test('LP und Handgrößen',()=>{const b=boot();for(const [mode,difficulty,lp] of [['pve','easy',4000],['pve','hard',8000],['pvp','easy',8000]]){const v=b.run(`(()=>{const g=createGame({mode:'${mode}',difficulty:'${difficulty}',starter:0});return [g.maxLP,g.players[0].hand.length]})()`);assert.deepEqual([...v],[lp,5])}});
test('Handfusion verbraucht eine Kopie und beschwört das Ergebnis',()=>{const b=boot(),r=b.run(`(()=>{const g=createGame({mode:'pve',seed:13,starter:0}),p=g.players[0],before=p.remainingFusion.length,ids=p.hand.slice(0,2).map(c=>c.uid),ok=prepareHandFusion(g,ids,RPG_START_FUSIONS[0]),placed=placePending(g,0);return [ok,!!placed,p.hand.length,p.remainingFusion.length,before,!!p.field[0]]})()`);assert.deepEqual([...r],[true,true,3,2,3,true])});
test('Keine Fusionskopie: konkrete Diagnose',()=>{const b=boot(),x=b.run(`(()=>{const g=createGame({mode:'pve',starter:0});g.players[0].remainingFusion=[];return fusionFailureReason(g,[1,1])})()`);assert.match(x,/Fusionsdeck/)});
test('Ein laufendes Duell übersteht die Snapshot-Validierung',()=>{const b=boot(),r=b.run(`(()=>{const g=createGame({mode:'pve',starter:0});const c=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));return [c.rulesVersion,c.maxLP,c.players[0].hand.length]})()`);assert.deepEqual([...r],[5,4000,5])});
test('30 vollständige Duelle laufen ohne Ausnahme durch',()=>{const b=boot(),r=b.run(`(()=>{const a=[];for(let i=1;i<=30;i++){const g=createGame({mode:'pve',starter:i%2,seed:i});simulateGame(g);a.push([g.winner,g.turn])}return a})()`);assert.equal(r.length,30);for(const [winner,turn] of r){assert.ok(winner===0||winner===1);assert.ok(turn>0&&turn<=32)}});
