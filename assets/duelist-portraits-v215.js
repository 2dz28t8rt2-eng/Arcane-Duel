/* Arcane Duel 2v2 + solo portrait registry v21.5.
 * Visual-only manifest. Missing art shows a safe gradient placeholder.
 * Image replacement: upload the matching .webp under assets/portraits/.
 */
'use strict';
((root)=>{
 const heroIds=Object.freeze(Array.from({length:12},(_,i)=>'hero-'+String(i+1).padStart(2,'0')));
 const soloIds=Object.freeze(Array.from({length:11},(_,i)=>'solo-opponent-'+String(i).padStart(2,'0')));
 const duoIds=Object.freeze(Array.from({length:15},(_,i)=>Object.freeze([
   'duo-chapter-'+String(i+1).padStart(2,'0')+'-a',
   'duo-chapter-'+String(i+1).padStart(2,'0')+'-b'])));
 const specials=Object.freeze(['solo-secret-eiman','solo-wanderer',
  ...Array.from({length:5},(_,i)=>'solo-fanatiker-'+String(i+1).padStart(2,'0'))]);
 const ids=Object.freeze([...heroIds,...soloIds,...duoIds.flat(),...specials]);
 const allowed=new Set(ids);
 const base='assets/portraits/';
 function validHero(id){return heroIds.includes(id);}
 function sanitizeHero(id){return validHero(id)?id:heroIds[0];}
 function soloOpponent(id,secret=false,stage=0,encounter=false){
  if(secret)return specials[0];
  if(Number.isInteger(Number(stage))&&Number(stage)>=1&&Number(stage)<=5)
   return 'solo-fanatiker-'+String(stage).padStart(2,'0');
  if(encounter)return 'solo-wanderer';
  const n=Number(id);
  return Number.isInteger(n)&&n>=0&&n<soloIds.length?soloIds[n]:soloIds[0];
 }
 function duoOpponent(chapter,seat){
  const c=Number(chapter),s=Number(seat);
  return Number.isInteger(c)&&c>=1&&c<=15&&[1,3].includes(s)?
   duoIds[c-1][s===1?0:1]:duoIds[0][s===1?0:1];
 }
 // Visuals only: a seeded shuffle allocates unused player portraits to ordinary NPCs.
 // Fixed story identities never enter the shuffle. Neither NPC stats nor their IDs change.
 function permutation(seed,excluded=[]){
  const taken=new Set((Array.isArray(excluded)?excluded:[]).filter(validHero));
  const pool=heroIds.filter(id=>!taken.has(id));
  if(!pool.length)return [];
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
  if(!Number.isInteger(Number(id))||Number(id)<0||Number(id)>10)return null;
  const list=permutation('solo:'+seed,[sanitizeHero(selected)]);
  return list[Number(id)]||null;
 }
 function normalDuo(chapter,seat,selected=[],seed='duo'){
  const c=Number(chapter),s=Number(seat);
  if(!Number.isInteger(c)||c<1||c>9||![1,3].includes(s))return null;
  const list=permutation('duo:'+seed+':'+c,selected);
  return list[s===1?0:1]||null;
 }
 function visualSolo({id=0,secret=false,stage=0,encounter=false,selected='hero-01',seed='solo'}={}){
  if(secret||Number(stage)>=1&&Number(stage)<=5)return soloOpponent(id,secret,stage,false);
  return normalSolo(id,selected,seed)||normalSolo(id,'hero-01',seed);
 }
 function visualDuo({chapter=1,seat=1,selected=[],seed='duo'}={}){
  const c=Number(chapter);
  if(Number.isInteger(c)&&c>=10&&c<=15)return duoOpponent(c,seat);
  return normalDuo(c,seat,selected,seed);
 }
 function path(id){
  if(!allowed.has(id))return null;
  if(id.startsWith('hero-'))return base+'heroes/'+id+'.webp';
  if(id.startsWith('solo-'))return base+'solo/'+id+'.webp';
  return base+'duo/'+id+'.webp';
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
   button.setAttribute('aria-label','Charakterportrait '+(i+1)+' auswählen');
   button.append(node(id,'Duellant '+(i+1)));
   const txt=document.createElement('span');txt.textContent='Charakter '+String(i+1).padStart(2,'0');
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
 root.ArcanePortraits215=Object.freeze({version:'21.5',heroIds,soloIds,duoIds,specials,ids,
  validHero,sanitizeHero,soloOpponent,duoOpponent,normalSolo,normalDuo,visualSolo,visualDuo,permutation,path,initials,node,replace,chooser});
})(typeof window!=='undefined'?window:globalThis);
