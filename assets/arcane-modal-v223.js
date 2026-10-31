/* Shared presentation for solo and online confirmations. */
'use strict';
((root)=>{
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(kicker,title,icon,text,extra,buttons){
  return '<div class="modal-icon">'+icon+'</div><div class="modal-kicker">'+kicker+
   '</div><h2>'+title+'</h2><p>'+text+'</p>'+(extra||'')+
   '<div class="modal-actions">'+buttons+'</div>';
 }
 function confirm({kicker,title,icon,text,cancelLabel,confirmLabel}){
  const doc=root.document;
  if(!doc||doc.getElementById('duoSharedDialog'))return Promise.resolve(false);
  return new Promise(resolve=>{
   const oldFocus=doc.activeElement,overlay=doc.createElement('div'),modal=doc.createElement('div');
   overlay.id='duoSharedDialog';overlay.className='overlay';overlay.style.zIndex='12050';
   overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
   overlay.setAttribute('aria-label',title);modal.className='modal';
   modal.innerHTML=html(safe(kicker),safe(title),safe(icon),safe(text),'',
    '<button type="button" class="btn" data-dialog-cancel>'+safe(cancelLabel)+'</button>'+
    '<button type="button" class="btn primary" data-dialog-confirm>'+safe(confirmLabel)+'</button>');
   overlay.append(modal);doc.body.append(overlay);
   const cancel=modal.querySelector('[data-dialog-cancel]'),accept=modal.querySelector('[data-dialog-confirm]');
   const close=value=>{doc.removeEventListener('keydown',key,true);overlay.remove();
    if(oldFocus?.isConnected)oldFocus.focus();resolve(value);};
   const key=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(false);}
    else if(event.key==='Tab'){
     if(event.shiftKey&&doc.activeElement===cancel){event.preventDefault();accept.focus();}
     else if(!event.shiftKey&&doc.activeElement===accept){event.preventDefault();cancel.focus();}
    }
   };
   cancel.onclick=()=>close(false);accept.onclick=()=>close(true);
   doc.addEventListener('keydown',key,true);cancel.focus();
  });
 }
 root.ArcaneModal223=Object.freeze({html,confirm});
})(typeof window==='undefined'?globalThis:window);
