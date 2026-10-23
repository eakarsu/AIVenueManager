// FeaturePackPanel: tasks, search/filter, CSV/JSON export, deterministic AI.
// Labelled sections preserve false / 0 / empty values (never hides falsy).
import React, { useState } from 'react';
export function displayValue(v){ if(v===false) return 'false'; if(v===0) return '0'; if(v===''||v===null||v===undefined) return '(empty)'; if(typeof v==='object') return JSON.stringify(v); return String(v); }
export default function FeaturePackPanel({ baseUrl='/api/feature-pack', resourceLabel='Events' }){
  const [q,setQ]=useState(''); const [items,setItems]=useState([]); const [tasks,setTasks]=useState([]); const [title,setTitle]=useState(''); const [ai,setAi]=useState(null); const [msg,setMsg]=useState('');
  const token = () => localStorage.getItem('token')||localStorage.getItem('accessToken')||'';
  const headers = () => ({ 'Content-Type':'application/json', Authorization:'Bearer '+token() });
  async function search(){ const r=await fetch(baseUrl+'/search?q='+encodeURIComponent(q),{headers:headers()}); const d=await r.json(); setItems(d.items||[]); setMsg('Search: '+displayValue(d.total)); }
  async function loadTasks(){ const r=await fetch(baseUrl.replace('/feature-pack','')+'/tasks',{headers:headers()}); const d=await r.json(); setTasks(d.tasks||[]); }
  async function addTask(){ await fetch(baseUrl.replace('/feature-pack','')+'/tasks',{method:'POST',headers:headers(),body:JSON.stringify({title})}); setTitle(''); loadTasks(); }
  async function runAi(f){ const r=await fetch(baseUrl+'/ai/'+f,{method:'POST',headers:headers(),body:JSON.stringify({records:items})}); setAi(await r.json()); }
  return (<section aria-label="Feature pack"><h2>{resourceLabel}</h2>
    <div><label>Search <input value={q} onChange={e=>setQ(e.target.value)} /></label><button onClick={search}>Search</button>
    <a href={baseUrl+'/export?format=csv'}>Export CSV</a>{' '}<a href={baseUrl+'/export?format=json'}>Export JSON</a><span>{msg}</span></div>
    <h3>Records</h3><ul>{items.map((r,i)=><li key={r.id||i}>{Object.entries(r).map(([k,v])=><span key={k}>{k}: {displayValue(v)}; </span>)}</li>)}</ul>
    <h3>Tasks</h3><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title"/><button onClick={addTask}>Create task</button><button onClick={loadTasks}>Load tasks</button>
    <ul>{tasks.map(t=><li key={t.id}>{displayValue(t.title)} - status: {displayValue(t.status)} - done: {displayValue(t.done)} - progress: {displayValue(t.progress)}</li>)}</ul>
    <h3>AI (deterministic fallback)</h3>{<button onClick={()=>runAi('event-demand')}>event-demand</button><button onClick={()=>runAi('pricing-opportunity')}>pricing-opportunity</button><button onClick={()=>runAi('schedule-conflict')}>schedule-conflict</button>}
    {ai && <div><p>{displayValue(ai.label)} - aiGenerated: {displayValue(ai.aiGenerated)}</p>{(ai.sections||[]).map(s=><div key={s.label}><strong>{s.label}:</strong> {displayValue(s.value)}</div>)}</div>}
  </section>);
}
