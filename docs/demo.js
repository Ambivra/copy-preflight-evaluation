'use strict';
const el=id=>document.getElementById(id);
const status=(message,kind='')=>{el('status').textContent=message;el('status').className='status '+kind;};
const reset=()=>{el('diagnostics').replaceChildren();status('Input changed; run the check again.');};
async function sample(name) {
  const [csv,profile]=await Promise.all([fetch('./'+name+'.csv').then(r=>r.text()),fetch('./default.profile.json').then(r=>r.text())]);
  el('csv').value=csv;el('profile').value=profile;reset();
}
el('failure').onclick=()=>sample('fail').catch(()=>status('Sample unavailable.','incomplete'));
el('success').onclick=()=>sample('pass').catch(()=>status('Sample unavailable.','incomplete'));
el('clear').onclick=()=>{el('csv').value='';el('profile').value='';el('csv-file').value='';el('profile-file').value='';reset();};
for(const id of ['csv','profile']) {
  el(id).oninput=reset;
  el(id+'-file').onchange=async event=>{
    reset();
    const file=event.target.files[0];if(!file)return;
    const max=id==='csv'?CopyPreflight.LIMITS.inputBytes:CopyPreflight.LIMITS.profileBytes;
    if(file.size>max){el(id).value='';status('Selected file exceeds the local limit.','incomplete');return;}
    try{el(id).value=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());}
    catch{el(id).value='';status('Selected file is not valid UTF-8.','incomplete');}
  };
}
el('check').onclick=()=>{
  el('diagnostics').replaceChildren();
  let profile;
  if(el('profile').value.length>CopyPreflight.LIMITS.profileBytes || new TextEncoder().encode(el('profile').value).byteLength>CopyPreflight.LIMITS.profileBytes){status('Profile exceeds the local limit.','incomplete');return;}
  try{profile=JSON.parse(el('profile').value);}catch{status('Profile is not valid JSON.','incomplete');return;}
  const report=CopyPreflight.validate(el('csv').value,profile);
  status(`${report.status.toUpperCase()} · ${report.records} record(s) processed · ${report.diagnostics.length} diagnostic(s) · ${report.complete?'Supported checks completed':'Stopped; remaining input unchecked'}`,report.status);
  for(const d of report.diagnostics){const tr=document.createElement('tr');for(const item of [d.line,d.column,d.field??'—',d.code,d.message]){const td=document.createElement('td');td.textContent=item;tr.append(td);}el('diagnostics').append(tr);}
};
