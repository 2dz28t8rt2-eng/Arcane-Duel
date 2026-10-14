const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
const nodes=new Map(),document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){},elementFromPoint(){return null}};
const window={localStorage:{getItem(){return null},setItem(){}},crypto:{getRandomValues(a){a[0]=1111;return a}},innerWidth:1200,innerHeight:800};
const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
for(const f of ['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{timeout:15000});
const raw=vm.runInContext('JSON.stringify(OPPONENTS.slice(1).map(o=>({tier:o.id,ace:ACE_CARD_IDS[o.id],name:CARDS[ACE_CARD_IDS[o.id]].name,kind:CARDS[ACE_CARD_IDS[o.id]].kind,element:CARDS[ACE_CARD_IDS[o.id]].element,art:CARDS[ACE_CARD_IDS[o.id]].art})))',ctx);
fs.writeFileSync('/mnt/data/ace-original-svg.json',raw);
console.log(JSON.parse(raw).map(x=>({tier:x.tier,ace:x.ace,name:x.name,kind:x.kind,element:x.element,artLength:x.art.length})));
