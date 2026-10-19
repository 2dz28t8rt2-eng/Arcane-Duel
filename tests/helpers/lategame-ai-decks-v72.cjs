/* Arcane Duel 7.2 – actual source-gated late-monster CONSTRUCTED training decks.
 *
 * These decks DO NOT represent owned cards, obtained drops, actual inventories
 * or attainable average player economy. Use them as tactical stress tests,
 * never as evidence that a new player already owns a full collection.
 * Every card is already in game; source must be starter or a PREVIOUSLY
 * defeated ordinary opponent's loot (not the current opponent).
 */
'use strict';
const crypto=require('node:crypto');
const STYLES=['predator','guardian','soul','fusion','allrounder','tempo','hybrid'];
const VARIANTS=['starter-heavy','balanced','specialist','veteran'];
function hash(tier,seed,id,style,variant){
 let x=(Math.imul(tier+113,2246822519)^Math.imul(seed+1,3266489917)^
  Math.imul(id+1,668265263)^Math.imul(style+1,374761393)^
  Math.imul(variant+1,2654435761))>>>0;
 x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;
 return ((x>>>0)/4294967296);
}
function isNormal(c){return c&&!c.fusionOnly;}
function roster(data,tier){
 if(!Number.isInteger(tier)||tier<1||tier>10)throw Error('Invalid tournament tier');
 if(!Array.isArray(data.cards)||!Array.isArray(data.defaultDeck)||
  !Array.isArray(data.startFusions)||!Array.isArray(data.opponents))
  throw Error('Incomplete actual game catalogue');
 const starters=new Set([...data.defaultDeck,...data.startFusions]);
 // To fight VII, I–VI have already been defeated (indices 1..6).
 // Previous v7.0 test accidentally excluded the immediate previous boss
 // by using slice(0,tier-1), hiding rewards needed in the endgame.
 const earlier=new Set(data.opponents.slice(0,tier)
  .flatMap(o=>Array.isArray(o.loot)?o.loot:[]));
 // The former NPC-level cap also discarded actual high-level drops now
 // available after VI. Bound by the strongest NORMAL card legitimately
 // unlocked from earlier bosses, never by a future opponent's deck.
 const accessible=[...new Set([...starters,...earlier])].map(id=>data.cards[id])
  .filter(c=>c&&!c.fusionOnly&&(c.requiredTier==null||c.requiredTier<tier));
 const cap=Math.min(10,Math.max(1,...accessible.map(c=>c.level)));
 const exclude=c=>!c||!Number.isInteger(c.id)||!Number.isInteger(c.level)||
  c.level<1||c.level>cap||c.retired||c.hard||c.ace||c.enemyOnly||
  c.essenceMonster||c.lv1Exclusive||c.workshopOnly||c.fateOnly||
  c.milestoneOnly||c.eventOnly||c.questOnly||c.legendaryOnly||
  c.manifestOf!==null&&c.manifestOf!==undefined||c.fate;
 const allowed=c=>!exclude(c)&&(starters.has(c.id)||
   (earlier.has(c.id)&&Number.isInteger(c.source)&&
    c.source>=0&&c.source<tier))&&
    (c.requiredTier==null||c.requiredTier<tier);
 const cards=data.cards.filter(allowed);
 return {tier,cap,starters,earlier,cards,allowed,
  normals:cards.filter(isNormal),
  fusions:cards.filter(c=>c.fusionOnly)};
}
function baseScore(c,style){
 const atk=Number(c.atk)||0,def=Number(c.def)||0,
  lv=c.level||1,role=(c.role||c.roleOverride||'').toLowerCase();
 const predator=role==='predator',guardian=role==='guardian'||role==='defender',
  soul=role==='soul'||role==='souldrainer',allround=role==='allrounder',
  resonator=role==='resonator';
 const offensive=atk*1.65+def*.32+lv*100+(predator?480:0);
 const defense=def*1.57+atk*.30+lv*90+(guardian?490:0)+(soul?180:0);
 const drain=def*1.33+atk*.57+lv*88+(soul?720:0)+(guardian?290:0);
 const fusion=atk*.83+def*.78+lv*225+(allround?350:0)+(resonator?420:0);
 const all=atk*.97+def*.95+lv*140+(allround?650:0);
 const tempo=atk*1.28+def*.45+lv*60+(predator?300:0);
 const hybrid=(offensive+defense+fusion)/3;
 return {predator:offensive,guardian:defense,soul:drain,
  fusion,allrounder:all,tempo,hybrid}[style];
}
function copies(cards){
 const m=new Map();for(const id of cards)m.set(id,(m.get(id)||0)+1);return m;
}
function makeBenchmarkDeck(data,tier,style,variant='balanced',seed=0){
 if(!STYLES.includes(style)||!VARIANTS.includes(variant)||
  !Number.isInteger(seed)||seed<0||seed>9999)
  throw Error('Unknown archetype, investment variant or seed');
 const a=roster(data,tier),idx=VARIANTS.indexOf(variant),
  styleIndex=STYLES.indexOf(style);
 if(a.normals.length<14||a.fusions.length<2)
  throw Error('Insufficient legitimate source catalogue at tier '+tier);
 const starters=a.normals.filter(c=>a.starters.has(c.id));
 const advanced=a.normals.filter(c=>!a.starters.has(c.id));
 const counts=new Map(),deck=[];
 const rank=(c)=>{
  const jitter=(hash(tier,seed,c.id,styleIndex,idx)*2-1)*(
   variant==='starter-heavy'?230:variant==='veteran'?120:195);
  return baseScore(c,style)+jitter;
 };
 // Choose ALL copies using real deck max-three rules. Theoretical copies
 // are permitted as stress tests only; NEVER mutate actual inventory.
 const add=pool=>{
  const possibilities=pool.filter(c=>(counts.get(c.id)||0)<3);
  if(!possibilities.length)return false;
  const chosen=possibilities.map(c=>({c,v:rank(c)-
   (counts.get(c.id)||0)*180}))
   .sort((a,b)=>b.v-a.v||a.c.id-b.c.id)[0].c;
  deck.push(chosen.id);counts.set(chosen.id,(counts.get(chosen.id)||0)+1);
  return true;
 };
 const requiredStarter=[23,16,8,2][idx];
 const requiredAdvanced=[7,14,23,30][idx];
 while(deck.length<requiredStarter&&add(starters)){}
 while(deck.length<requiredStarter+requiredAdvanced&&add(advanced)){}
 while(deck.length<40&&add(a.normals)){}
 if(deck.length!==40)throw Error('Cannot build a 40-card benchmark deck');
 const levels=deck.map(id=>data.cards[id].level);
 function reach(c){
  let combinations=0;
  for(let i=0;i<levels.length;i++)for(let j=i+1;j<levels.length;j++){
   if(Math.min(12,levels[i]+levels[j],
    Math.max(levels[i],levels[j])+2)>=c.level)combinations++;
  }
  return combinations;
 }
 const fusionRank=a.fusions.map(c=>({c,ways:reach(c),
  power:baseScore(c,style)+(reach(c)>0?800:-1500)+
   Math.log1p(reach(c))*150+
   (hash(tier,seed,c.id,styleIndex,idx)-.5)*80}))
  .sort((x,y)=>y.power-x.power||x.c.id-y.c.id);
 const reachable=fusionRank.filter(x=>x.ways>0);
 if(reachable.length<2)throw Error('Not enough reachable owned-source fusion recipes');
 const fusionDeck=reachable.slice(0,Math.min(12,reachable.length)).map(x=>x.c.id);
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify({
  main:[...deck].sort((x,y)=>x-y),
  fusion:[...fusionDeck].sort((x,y)=>x-y)})).digest('hex');
 const all=[...deck,...fusionDeck];
 if(all.some(id=>!a.allowed(data.cards[id])))throw Error('Illegal card included');
 if([...copies(deck).values()].some(n=>n>3))throw Error('Over three main copies');
 return {id:`t${tier}-${style}-${variant}-${seed}`,
  kind:'CONSTRUCTED_BENCHMARK_NOT_EARNED',
  tier,style,variant,seed,deck,fusionDeck,
  fingerprint,meta:{levelCap:a.cap,
   normalPool:a.normals.length,fusionPool:a.fusions.length,
   distinctMain:new Set(deck).size,
   distinctFusion:new Set(fusionDeck).size,
   starterCopies:deck.filter(id=>a.starters.has(id)).length,
   priorLootCopies:deck.filter(id=>!a.starters.has(id)).length,
   meanLevel:Math.round(levels.reduce((v,n)=>v+n,0)/40*100)/100,
   maxLevel:Math.max(...levels),
   reachableFusionTemplates:reachable.length,
   provenance:'theoretical copies of starter and PREVIOUS opponent drops, not earned inventory'}};
}
module.exports={STYLES,VARIANTS,roster,makeBenchmarkDeck};
