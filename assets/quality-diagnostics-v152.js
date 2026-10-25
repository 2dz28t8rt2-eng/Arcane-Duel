/* Arcane Duel v15.2 – opt-in browser load diagnostics and inexpensive menu image decoding.
 * No reporting to external services, no modifications to gameplay or profile.
 */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const esc=v=>escapeHtml(String(v??''));
  const ms=v=>Number.isFinite(v)?Math.round(v).toLocaleString('de-AT')+' ms':'nicht verfügbar';
  function report(){
    const api=typeof performance!=='undefined'?performance:null;
    const navigation=api?.getEntriesByType?.('navigation')?.[0]||null;
    const entries=api?.getEntriesByType?.('resource')||[];
    const resources=entries.filter(x=>x&&typeof x.name==='string');
    const kind=t=>resources.filter(x=>x.initiatorType===t).length;
    const slow=[...resources].filter(x=>Number.isFinite(x.duration)&&x.duration>0)
      .sort((a,b)=>b.duration-a.duration).slice(0,6)
      .map(e=>({name:String(e.name).split(/[?#]/)[0].split('/').filter(Boolean).slice(-1)[0]||'Ressource',duration:e.duration}));
    return {
      navigationDuration:navigation?.duration,
      domReady:navigation?.domContentLoadedEventEnd,
      firstByte:navigation?.responseStart,
      resourceCount:resources.length,
      stylesheets:kind('link'),
      scripts:kind('script'),
      images:kind('img'),
      thumbnails:document.querySelectorAll?.('#ad119Grid img, #menuContent img')?.length||0,
      slow
    };
  }
  function showReport(){
    if(uiMode!=='menu')return;
    const m=report();
    openModal('<section class="ad152-diagnostics"><div class="modal-kicker">TECHNIK · DEIN BROWSER</div>'+
      '<h2>Performance-Diagnose</h2><p>Lokale Messung dieser Seitenladung. Keine Datenübertragung und kein Eingriff in die Duelle.</p>'+
      '<div class="ad152-numbers">'+
      '<div><small>DOM bereit</small><b>'+ms(m.domReady)+'</b></div>'+
      '<div><small>Navigation</small><b>'+ms(m.navigationDuration)+'</b></div>'+
      '<div><small>Erste Serverantwort</small><b>'+ms(m.firstByte)+'</b></div>'+
      '<div><small>Erfasste Ressourcen</small><b>'+m.resourceCount+'</b></div></div>'+
      '<p>Erfasst: '+m.scripts+' Skripte, '+m.stylesheets+' Stylesheets und '+m.images+' Bildanforderungen. '+
      'Im Lexikon aktuell '+m.thumbnails+' Bildknoten.</p>'+
      '<details><summary>Langsamste erfasste Dateien</summary><ol>'+m.slow.map(x=>'<li>'+esc(x.name)+
        ' <span>'+ms(x.duration)+'</span></li>').join('')+'</ol></details>'+
      '<small>Die Browser-Messung hängt von Cache, Gerät, Verbindung und Ressourcen-Timing-Freigaben ab. '+
      'Sie ist kein Vergleich zwischen verschiedenen Nutzern. Grafik- und Animations-FPS werden hier noch nicht gemessen.</small>'+
      '<div class="modal-actions"><button type="button" class="btn primary" id="ad152-perf-close">Schließen</button></div></section>');
    $id('ad152-perf-close').onclick=hideModal;
  }
  function decorateMenu(){
    if(uiMode!=='menu')return;
    // Images in scrollable bestiary lists do not need synchronous main-thread decode.
    document.querySelectorAll?.('#ad119Grid img, #menuContent .ad119-card img').forEach(img=>{
      img.decoding='async';img.loading='lazy';
    });
    const tools=$id('ad120-menu-tools');
    if(!tools||tools.querySelector('#ad152-perf-open'))return;
    const button=document.createElement('button');
    button.type='button';button.className='btn';button.id='ad152-perf-open';
    button.textContent='◷ Performance prüfen';button.onclick=showReport;tools.appendChild(button);
  }
  const previous=renderMenu;
  renderMenu=function(){const result=previous.apply(this,arguments);decorateMenu();return result;};
  if(uiMode==='menu')decorateMenu();
  window.ArcaneQualityDiagnostics152=Object.freeze({report,showReport});
})();
