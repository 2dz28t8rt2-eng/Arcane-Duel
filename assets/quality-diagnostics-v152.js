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
  function analyzeFrames(times){
    if(!Array.isArray(times)||times.length<5)return null;
    const deltas=[];
    for(let i=1;i<times.length;i++){
      const delta=times[i]-times[i-1];
      if(Number.isFinite(delta)&&delta>0)deltas.push(delta);
    }
    if(deltas.length<4)return null;
    const sorted=[...deltas].sort((a,b)=>a-b);
    const typical=sorted[Math.floor(sorted.length/2)];
    return {fps:Math.round(1000*deltas.length/deltas.reduce((sum,n)=>sum+n,0)),
      medianMs:Math.round(typical),p95Ms:Math.round(sorted[Math.ceil(sorted.length*.95)-1]),
      stalls:deltas.filter(n=>n>50).length,frames:deltas.length};
  }
  function sampleFrames(){
    if(typeof requestAnimationFrame!=='function'||document.hidden)return Promise.resolve(null);
    return new Promise(resolve=>{
      const times=[];let started=null,finished=false,timeout=null;
      const finish=value=>{
        if(finished)return;
        finished=true;clearTimeout(timeout);
        document.removeEventListener?.('visibilitychange',onVisibility);
        resolve(value);
      };
      const onVisibility=()=>{if(document.hidden)finish(null);};
      // Background tabs often pause requestAnimationFrame altogether.
      timeout=setTimeout(()=>finish(null),5000);
      document.addEventListener?.('visibilitychange',onVisibility);
      const frame=now=>{
        if(finished)return;
        if(document.hidden){finish(null);return;}
        if(started===null)started=now;
        times.push(now);
        if(now-started>=2400||times.length>=180){finish(analyzeFrames(times));return;}
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
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
      'Sie ist kein Vergleich zwischen verschiedenen Nutzern. Die optionale Bildratenprobe misst ausschließlich diese Menüansicht, nicht die Duellanimation.</small>'+
      '<div class="ad152-frame-check"><button type="button" class="btn" id="ad152-perf-sample">Bildrate 2,4 Sekunden prüfen</button>'+
      '<p id="ad152-perf-result" role="status">Noch keine Bildratenprobe gestartet.</p></div>'+
      '<div class="modal-actions"><button type="button" class="btn primary" id="ad152-perf-close">Schließen</button></div></section>');
    $id('ad152-perf-close').onclick=hideModal;
    $id('ad152-perf-sample').onclick=async()=>{
      const button=$id('ad152-perf-sample');
      if(!button||button.disabled)return;
      button.disabled=true;
      const result=$id('ad152-perf-result');
      if(result)result.textContent='Messung läuft … Bitte die Seite im Vordergrund lassen.';
      const measured=await sampleFrames();
      const target=$id('ad152-perf-result');
      if(target)target.textContent=measured?
        'Menüansicht: ca. '+measured.fps+' Bilder/s, typisch '+measured.medianMs+' ms, 95 % bis '+
        measured.p95Ms+' ms, Verzögerungen über 50 ms: '+measured.stalls+' von '+measured.frames+' Bildern.':
        'Die Messung war im Hintergrund oder ist in diesem Browser nicht verfügbar.';
      if(button.isConnected)button.disabled=false;
    };
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
  window.ArcaneQualityDiagnostics152=Object.freeze({report,showReport,analyzeFrames,sampleFrames});
})();
