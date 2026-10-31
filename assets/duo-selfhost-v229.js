/* Explicit transfer of an existing online profile to the independent server. */
(()=>{
 if(!window.ArcaneDuoSelfHost229)return;
 const gate=document.querySelector('#duoNameGate>div')||document.getElementById('duoNameGate');if(!gate)return;
 const details=document.createElement('details'),summary=document.createElement('summary');
 summary.textContent='Bestehendes Online-Profil übernehmen';details.append(summary);
 const info=document.createElement('p');info.textContent='Füge deinen privaten 2v2-Profil-Link von der bisherigen Spielseite ein. Dein bestätigtes Deck und dein Fortschritt werden einmalig übernommen. Laufende Duelle werden nicht übertragen.';details.append(info);
 const input=document.createElement('input');input.type='password';input.autocomplete='off';input.placeholder='Privater 2v2-Profil-Link';input.setAttribute('aria-label','Privater 2v2-Profil-Link');details.append(input);
 const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='Profil übernehmen';details.append(button);
 const status=document.createElement('p');status.setAttribute('role','status');details.append(status);gate.append(details);
 button.onclick=async()=>{
  const value=input.value.trim(),token=/^[a-f0-9]{64}$/.test(value)?value:(value.match(/#duoprofile=([a-f0-9]{64})$/)||[])[1];
  if(!token){status.textContent='Bitte den vollständigen privaten 2v2-Profil-Link einfügen.';return;}
  button.disabled=true;status.textContent='Profil wird geprüft und übernommen …';
  try{
   const response=await fetch('/api/duo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'legacyImport',profileToken:token})});
   const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Übernahme fehlgeschlagen.');
   input.value='';location.replace(location.pathname+'#duoprofile='+token);location.reload();
  }catch(e){status.textContent=e.message;button.disabled=false;}
 };
})();
