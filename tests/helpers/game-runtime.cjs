'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=process.env.ARCANE_AUDIT_REPO?path.resolve(process.env.ARCANE_AUDIT_REPO):path.resolve(__dirname,'../..');
const index=fs.readFileSync(path.join(repo,'index.html'),'utf8');
const scripts=[...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>m[1].split('?')[0]);
const source=new Map(scripts.map(file=>[file,fs.readFileSync(path.join(repo,file),'utf8')]));
function boot({seed=1,withoutArmor=false,withoutFusionRework=false,withoutRoster118=false,withoutIV123=false,withoutRoster125=false,withoutRoster126=false,x128Mode='full',fusionReworkSides='both',saved=null}={}){
 const nodes=new Map(),storage=new Map(saved?Object.entries(saved):[]);
 function el(id=''){
  const attributes=new Map(),classes=new Set();
  return {id,tagName:'DIV',innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,dataset:{},children:[],style:{setProperty(){},removeProperty(){}},
   classList:{add(...s){s.forEach(x=>classes.add(x));},remove(...s){s.forEach(x=>classes.delete(x));},toggle(s,on){if(on===undefined)on=!classes.has(s);on?classes.add(s):classes.delete(s);return on;},contains(s){return classes.has(s);}},
   append(...c){this.children.push(...c);},prepend(...c){this.children.unshift(...c);},appendChild(c){this.children.push(c);return c;},insertBefore(c){this.children.unshift(c);return c;},replaceChildren(...c){this.children=[...c];},replaceWith(){},remove(){},setAttribute(k,v){attributes.set(k,String(v));},getAttribute(k){return attributes.get(k)||null;},removeAttribute(k){attributes.delete(k);},addEventListener(){},removeEventListener(){},insertAdjacentHTML(){},querySelector(){return null;},querySelectorAll(){return [];},closest(){return null;},contains(){return false;},focus(){},click(){this.onclick?.();},getBoundingClientRect(){return {left:0,top:0,width:100,height:100,right:100,bottom:100};}};
 }
 const document={body:el('body'),documentElement:el('html'),hidden:false,visibilityState:'visible',readyState:'complete',
   getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id);},createElement:el,createElementNS:(ns,t)=>el(t),createTextNode(value){const text=String(value);return {nodeType:3,nodeName:'#text',textContent:text,data:text};},querySelector(){return null;},querySelectorAll(){return [];},createTreeWalker(){return {nextNode(){return null;}};},addEventListener(){},removeEventListener(){},elementFromPoint(){return null;}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 let state=seed>>>0||1,clock=Date.parse('2026-10-17T05:04:03Z');
 const random=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 const auditMath=Object.create(Math);auditMath.random=random;
 class AuditDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 class Observer{observe(){}disconnect(){}unobserve(){}}
 const ctx={document,localStorage,console,Date:AuditDate,Math:auditMath,JSON,Map,Set,Array,Number,Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN,Blob,URL,URLSearchParams,
  navigator:{language:'de-AT',onLine:true},location:{protocol:'https:',hostname:'audit.arcane.test',href:'https://audit.arcane.test/index.html',search:''},
  crypto:{getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=Math.floor(random()*4294967296);return a;}},
  innerWidth:1200,innerHeight:980,devicePixelRatio:1,matchMedia(){return {matches:true,addEventListener(){},removeEventListener(){}};},
  setTimeout(){return 0;},clearTimeout(){},setInterval(){return 0;},clearInterval(){},requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
  addEventListener(){},removeEventListener(){},MutationObserver:Observer,ResizeObserver:Observer,performance:{now(){return clock;}},
  getComputedStyle(){return {getPropertyValue(){return '';}};},alert(){},confirm(){return false;},scrollTo(){},
  atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
  fetch:async url=>{const file=path.join(repo,String(url).split('?')[0]);return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,'utf8')),text:async()=>fs.readFileSync(file,'utf8')};}
 };
 ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;
 // Per-actor fusion rules are a simulation-only audit switch. Production never sets this.
 if(!['both','player','npc'].includes(fusionReworkSides))throw Error('Invalid fusionReworkSides');
 ctx.__arcaneFusionAuditMask={player:fusionReworkSides!=='npc',npc:fusionReworkSides!=='player'};
 if(!['full','off','power-only'].includes(x128Mode))throw Error('Invalid X v12.8 test control');
 ctx.__arcaneX128Mode=x128Mode;
 vm.createContext(ctx);
 for(const file of scripts){
  // Render-only cinematic title has no duel mechanics and needs a real DOM.
  // Keep gameplay identical while running the headless benchmark.
  if(file==='assets/arcane-title-v196.js')continue;
  // Only the offline matched-career control disables the optional v11.8 NPC roster.
  if(withoutRoster118&&file==='assets/opponent-roster-balance-v118.js')continue;
  // Regression-only control retains all other balances while leaving IV unchanged.
  if((withoutIV123||withoutRoster118)&&file==='assets/opponent-iv-balance-v123.js')continue;
  // Dedicated matched experimental control: all older rosters remain active.
  if((withoutRoster125||withoutRoster118)&&file==='assets/opponent-vii-x-roster-v125.js')continue;
  // v12.6 tier VII/VIII overlay is independent; older roster controls skip it.
  if((withoutRoster126||withoutRoster125||withoutRoster118)&&file==='assets/opponent-vii-viii-roster-v126.js')continue;
  // Historical roster-control tests must not receive newer X-specific balance.
  if((withoutRoster118||withoutRoster125)&&file==='assets/opponent-x-balance-v128.js')continue;
  // Control arm uses the same current game and economy, only the v11.3 fusion
  // calculator and its dependent interactive tutorial are switched off.
  if(withoutFusionRework&&['assets/fusion-rework-v113.js','assets/fusion-tutorial-v113.js'].includes(file))continue;
  let code=source.get(file);
  // v17.6 Guardian stat reweighting is injected ONLY into the headless
  // runtime. All real card IDs/art and production JS remain untouched.
  if(file==='assets/game.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176)
   code=require('./research-guardian-stats-v176.cjs').transform(code,process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176);
  // Research-only balance, highest version wins. Never injected into production pages.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_BALANCE_V169)
   code=require('./research-role-balance-v169.cjs').transform(code,process.env.ARCANE_RESEARCH_BALANCE_V169);
  else if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_BALANCE_V168)
   code=require('./research-role-balance-v168.cjs').transform(code,process.env.ARCANE_RESEARCH_BALANCE_V168);
  else if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_BALANCE)
   code=require('./research-role-balance-v167.cjs').transform(code,process.env.ARCANE_RESEARCH_BALANCE);
  // v17.1 role-specific healing overlay is applied AFTER the selected role
  // balance; no production assets are modified by the simulator.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_HEAL)
   code=require('./research-guardian-heal-v171.cjs').transform(code,process.env.ARCANE_RESEARCH_GUARDIAN_HEAL);
  // v17.2 counterstrike baseline and 85% Guardian heal are an offline-only
  // controlled overlay, applied after the fixed 15/90/100/120 role rules.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172){
   if(process.env.ARCANE_RESEARCH_GUARDIAN_HEAL)
    throw Error('Do not combine v17.1 and v17.2 healing overlays');
   code=require('./research-counterstrike-v172.cjs').transform(code,process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172);
  }
  // v17.3 preferred experiment replaces (never stacks with) v17.1/17.2
  // reduced-healing overlays; no production assets are touched.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173){
   if(process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172)
    throw Error('v17.3 healing replaces earlier 85% and counterstrike ablation overlays');
   code=require('./research-guardian-scale-v173.cjs').transform(code,process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173);
  }
  // v17.4 side-specific causal test supersedes 85%-flat and v17.3
  // global scaling. Candidate seat is supplied by actual selfplay scene.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174){
   if(process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||
      process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172||
      process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173)
    throw Error('v17.4 is mutually exclusive with historical healing overlays');
   code=require('./research-guardian-causal-v174.cjs').transform(code,process.env.ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174);
  }
  if(withoutArmor&&file==='assets/essence-combat.js'){
   const needle='const mitigation=isDefender(d)?.35:0;';if(!code.includes(needle))throw Error('Armor control hook changed');
   code=code.replace(needle,'const mitigation=isDefender(d)?(q.id===0?0:.35):0;');
  }
  // v17.7 offline-only observed counterstrike and survival instrumentation.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177){
   if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176||
      process.env.ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174||
      process.env.ARCANE_RESEARCH_GUARDIAN_HEAL||
      process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173)
    throw Error('v17.7 must not stack historical stat/healing overlays');
   code=require('./research-guardian-counter-v177.cjs').transformCombat(code);
  }
  // Final v17.8 Guardian diagnostic, never injected into production assets.
  if(file==='assets/essence-combat.js'&&process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178){
   if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177||
      process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176||
      process.env.ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174||
      process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173||
      process.env.ARCANE_RESEARCH_GUARDIAN_HEAL)
    throw Error('v17.8 Guardian experiment must not stack prior research');
   code=require('./research-guardian-counter-v178.cjs').transformCombat(code);
  }
  vm.runInContext(code,ctx,{filename:file,timeout:30000});
 }
 // All late card/role synchronization scripts must finish BEFORE research
 // changes the stats of actual eligible Guardian cards for live duels.
 if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176 &&
    process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176!=='control'){
  if(typeof ctx.__arcaneResearchGuardianStatsApply!=='function')
   throw Error('Guardian stat research apply function missing after asset load');
  ctx.__arcaneResearchGuardianStatsApply();
 }
 if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178){
  const research=require('./research-guardian-counter-v178.cjs');
  vm.runInContext(research.installScript(research.mode()),ctx,{filename:'v17.8-guardian-diagnostic-runtime.cjs',timeout:30000});
 }
 if(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177){
  const research=require('./research-guardian-counter-v177.cjs');
  vm.runInContext(research.installScript(research.mode()),ctx,{filename:'v17.7-guardian-stats-runtime.cjs',timeout:30000});
 }
 return {ctx,storage,scripts,run(code,timeout=120000){return JSON.parse(vm.runInContext('JSON.stringify(('+code+'))',ctx,{timeout}));},exec(code,timeout=120000){return vm.runInContext(code,ctx,{timeout});},advanceClock(ms=1000){clock+=ms;}};
}
module.exports={boot,repo,scripts};
if(require.main===module){const b=boot();console.log(JSON.stringify({scripts:b.scripts.length,checks:b.run('({cards:CARDS.length,armor:createGame({mode:"pve",opponentId:1}).essenceRules,profileValid:!!validateProfile(JSON.parse(JSON.stringify(profile))),roles:window.ArcaneRoleFusion.version,forge:!!window.ArcaneMonsterForge})')}));}
