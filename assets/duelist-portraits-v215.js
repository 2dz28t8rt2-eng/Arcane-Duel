/* Arcane Duel 2v2 + solo portrait registry v21.5.
 * Visual-only manifest. Missing art shows a safe gradient placeholder.
 * Image replacement: upload the matching .webp under assets/portraits/.
 */
'use strict';
((root)=>{
 const heroIds=Object.freeze(Array.from({length:16},(_,i)=>'hero-'+String(i+1).padStart(2,'0')));
 const heroNames=Object.freeze(['Runenritter','Sturmschatten-Jägerin','Goldrunen-Erzmagierin',
  'Violettmagier','Löwenwächter','Himmlische Heilerin','Sonnenpaladin','Waldläufer',
  'Runenweise','Wüstenläufer','Frostkönigin','Dämonenfeldherr','Arkanmechanikerin',
  'Piratenkapitän','Tempelkriegerin','Nebelkönigin']);
 const storyIds=Object.freeze(['story-eiman','story-hans',
  ...Array.from({length:5},(_,i)=>'story-fanatiker-a-'+String(i+1).padStart(2,'0')),
  ...Array.from({length:5},(_,i)=>'story-fanatiker-b-'+String(i+1).padStart(2,'0'))]);
 // Exactly 28 upload files, including ONE Eiman picture across solo/duo and
 // ONE five-step appearance series for the main fanatic across solo/duo.
 const ids=Object.freeze([...heroIds,...storyIds]);
 const allowed=new Set(ids),base='assets/portraits/';
 function validHero(id){return heroIds.includes(id);}
 function sanitizeHero(id){return validHero(id)?id:heroIds[0];}
 function storyFanatic(number,stage){
  const n=Number(number),k=Number(stage);
  if(![1,2].includes(n)||!Number.isInteger(k)||k<1||k>5)return null;
  return 'story-fanatiker-'+(n===1?'a':'b')+'-'+String(k).padStart(2,'0');
 }
 // Ordinary NPCs draw only from unselected player images. A seeded shuffle
 // stabilizes visuals across saves, page reloads and each player's view.
 function permutation(seed,excluded=[]){
  const taken=new Set((Array.isArray(excluded)?excluded:[]).filter(validHero));
  const pool=heroIds.filter(id=>!taken.has(id));
  let h=2166136261;
  for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  for(let i=pool.length-1;i>0;i--){
   h^=h<<13;h^=h>>>17;h^=h<<5;
   const j=(h>>>0)%(i+1);
   [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool;
 }
 function normalSolo(id,selected='hero-01',seed='solo'){
  const n=Number(id);if(!Number.isInteger(n)||n<0||n>10)return null;
  return permutation('solo:'+seed,[sanitizeHero(selected)])[n]||null;
 }
 function normalDuo(chapter,seat,selected=[],seed='duo'){
  const c=Number(chapter),s=Number(seat);
  if(!Number.isInteger(c)||c<1||c>9||![1,3].includes(s))return null;
  // Assign the shuffled pool across the entire duo campaign, not anew on
  // every chapter. Every available image is used before any repeat is needed.
  // Eighteen ordinary opponent seats can outnumber the ten unchosen pictures.
  const pool=permutation('duo:'+seed,selected);
  return pool.length?pool[((c-1)*2+(s===1?0:1))%pool.length]:null;
 }
 function soloOpponent(id,secret=false,stage=0,encounter=false){
  if(secret)return 'story-eiman';
  if(Number(stage)>=1&&Number(stage)<=5)return storyFanatic(1,stage);
  return normalSolo(id,'hero-01',encounter?'wanderer':'solo');
 }
 function duoOpponent(chapter,seat){
  const c=Number(chapter),s=Number(seat);
  if(!Number.isInteger(c)||c<1||c>15||![1,3].includes(s))return null;
  if(c===10)return s===1?'story-eiman':'story-hans';
  if(c>=11)return storyFanatic(s===1?1:2,c-10);
  return normalDuo(c,s);
 }
 function visualSolo({id=0,secret=false,stage=0,encounter=false,selected='hero-01',seed='solo'}={}){
  if(secret)return 'story-eiman';
  if(Number(stage)>=1&&Number(stage)<=5)return storyFanatic(1,stage);
  return normalSolo(id,selected,encounter?'wanderer':seed);
 }
 function visualDuo({chapter=1,seat=1,selected=[],seed='duo'}={}){
  const c=Number(chapter);
  return c>=10?duoOpponent(c,seat):normalDuo(c,seat,selected,seed);
 }
 function path(id){
  if(!allowed.has(id))return null;
  return base+(validHero(id)?'heroes/':'story/')+id+'.webp';
 }
 function initials(label){
  return String(label||'Duellant').trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join('').toUpperCase()||'✦';
 }
 function node(id,label='',extraClass=''){
  const box=document.createElement('span');
  box.className='ad215-portrait '+extraClass;
  box.dataset.portrait=id||'';
  box.setAttribute('role','img');
  box.setAttribute('aria-label','Portrait von '+(label||'Duellant'));
  box.style.setProperty('--ad215-seed',String(Math.max(0,ids.indexOf(id))%12));
  const fallback=document.createElement('span');
  fallback.className='ad215-fallback';fallback.textContent=initials(label);
  fallback.setAttribute('aria-hidden','true');
  box.append(fallback);
  const url=path(id);
  if(url){
   const img=document.createElement('img');
   img.alt='';img.loading='lazy';img.decoding='async';
   img.addEventListener('load',()=>{img.classList.add('ad215-loaded');});
   img.addEventListener('error',()=>{
    // Existing character art batches often contain PNGs. No manifest edit needed:
    // WebP takes priority, then PNG. Empty slots fall back to styled initials.
    if(img.dataset.fallbackTried!=='png'){
     img.dataset.fallbackTried='png';img.src=url.replace(/\.webp$/,'.png');
    }else img.remove();
   });
   img.src=url;box.append(img);
  }
  return box;
 }
 function replace(container,id,label,extraClass=''){
  if(!container)return null;
  container.replaceChildren(node(id,label,extraClass));
  return container;
 }
 function chooser(container,{selected,onChange}={}){
  if(!container)return;
  const chosen=sanitizeHero(selected);
  container.replaceChildren();
  for(const [i,id] of heroIds.entries()){
   const button=document.createElement('button');button.type='button';
   button.className='ad215-option'+(id===chosen?' selected':'');
   button.dataset.avatarId=id;
   button.setAttribute('aria-pressed',String(id===chosen));
   button.setAttribute('aria-label',heroNames[i]+' als Charakterportrait auswählen');
   button.append(node(id,heroNames[i]));
   const txt=document.createElement('span');txt.textContent=heroNames[i];
   button.append(txt);
   button.onclick=()=>{
    container.querySelectorAll('.ad215-option').forEach(b=>{
     b.classList.toggle('selected',b===button);
     b.setAttribute('aria-pressed',String(b===button));
    });
    if(typeof onChange==='function')onChange(id);
   };
   container.append(button);
  }
 }
 root.ArcanePortraits215=Object.freeze({version:'21.7',heroIds,heroNames,ids,
  validHero,sanitizeHero,storyIds,storyFanatic,soloOpponent,duoOpponent,normalSolo,normalDuo,visualSolo,visualDuo,permutation,path,initials,node,replace,chooser});
})(typeof window!=='undefined'?window:globalThis);
