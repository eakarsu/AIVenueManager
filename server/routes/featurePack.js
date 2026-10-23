
// Feature pack: authenticated tasks, main-list search/filter + export helpers,
// and domain AI with labelled deterministic fallback (aiGenerated:false).
// Never calls a provider: deterministic over the caller's own records.
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
function filterRecords(records, query = {}) {
  const q = String(query.q || query.search || '').trim().toLowerCase();
  const skip = new Set(['q','search','format','page','limit']);
  return (records||[]).filter(r => {
    if (q && !Object.values(r||{}).some(v => v!==null && v!==undefined && String(v).toLowerCase().includes(q))) return false;
    for (const [k,v] of Object.entries(query)) {
      if (skip.has(k) || v===undefined || v==='' || !(k in (r||{}))) continue;
      if (String(r[k]).toLowerCase() !== String(v).toLowerCase()) return false;
    }
    return true;
  });
}
function toCsv(records) {
  const rows = records||[];
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap(r=>Object.keys(r||{})))];
  const esc = v => { if (v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return [headers.join(','), ...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');
}
function displayValue(v){ if(v===false) return 'false'; if(v===0) return '0'; if(v===''||v===null||v===undefined) return '(empty)'; if(typeof v==='object') return JSON.stringify(v); return String(v); }
function toSections(obj){ return Object.entries(obj||{}).map(([label,value])=>({label,value})); }
function createTaskStore(){
  let next=1; const tasks=[];
  return {
    list:(query={})=>filterRecords(tasks.map(t=>({...t})), query),
    create:(input={})=>{ if(!input.title || !String(input.title).trim()) throw Object.assign(new Error('title is required'),{status:400});
      const t={id:next++, title:String(input.title), description:input.description??'', status:input.status??'todo', priority:input.priority??'medium', assignee:input.assignee??'', dueDate:input.dueDate??input.due_date??'', done: input.done===undefined?false:Boolean(input.done), progress: input.progress===undefined?0:Number(input.progress)||0, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()};
      tasks.push(t); return {...t}; },
    update:(id,patch={})=>{ const t=tasks.find(x=>String(x.id)===String(id)); if(!t) return null;
      for(const k of ['title','description','status','priority','assignee','dueDate','done','progress']) if(k in patch) t[k]=patch[k];
      t.updatedAt=new Date().toISOString(); return {...t}; },
    _all:tasks,
  };
}
function fallback(feature, summary, result){
  return { aiGenerated:false, provider:'none', label:'Deterministic fallback — no provider call', feature, summary, sections: toSections(result), result };
}
function createTasksRouter(store, authenticate){
  const express=require('express'); const r=express.Router(); const auth=authenticate||((_q,_s,n)=>n());
  r.get('/',auth,(req,res)=>res.json({tasks:store.list(req.query), total:store.list(req.query).length}));
  r.post('/',auth,(req,res)=>{ try{ res.status(201).json(store.create(req.body||{})); }catch(e){ res.status(e.status||400).json({error:e.message}); }});
  const upd=(req,res)=>{ const t=store.update(req.params.id,req.body||{}); if(!t) return res.status(404).json({error:'task not found'}); res.json(t); };
  r.put('/:id',auth,upd); r.patch('/:id',auth,upd);
  return r;
}
function createFeaturePackRouter({authenticate, getRecords, aiFeatures, resourceName='records'}={}){
  const express=require('express'); const r=express.Router(); const auth=authenticate||((_q,_s,n)=>n());
  const store=createTaskStore();
  r.use('/tasks', createTasksRouter(store, authenticate));
  r.get('/search',auth,async(req,res)=>{ try{ const rows=await getRecords(req); const f=filterRecords(rows,req.query); res.json({resource:resourceName,total:f.length,items:f}); }catch(e){ res.status(503).json({error:e.message}); }});
  r.get('/export',auth,async(req,res)=>{ try{ const rows=filterRecords(await getRecords(req),req.query); const fmt=String(req.query.format||'json').toLowerCase();
    if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition',`attachment; filename="${resourceName}.csv"`); return res.send(toCsv(rows)); }
    if(fmt!=='json') return res.status(400).json({error:'format must be csv or json'});
    res.setHeader('Content-Disposition',`attachment; filename="${resourceName}.json"`); return res.json({resource:resourceName,total:rows.length,items:rows}); }catch(e){ res.status(503).json({error:e.message}); }});
  r.post('/ai/:feature',auth,async(req,res)=>{ const fn=(aiFeatures||{})[req.params.feature]; if(!fn) return res.status(404).json({error:'unknown AI feature'});
    try{ const records=Array.isArray(req.body?.records)?req.body.records:await getRecords(req); res.json(fn(records||[], req.body||{})); }catch(e){ res.status(503).json({error:e.message}); }});
  r.get('/ai/features',auth,(_req,res)=>res.json({features:Object.keys(aiFeatures||{}), aiGenerated:false, label:'Deterministic fallback — no provider call'}));
  return {router:r, store};
}


function aiFeatures(){
 return {
  'event-demand': (records)=>{ const upcoming=records.filter(e=>e.status==='upcoming').length; const cap=records.reduce((s,e)=>s+(Number(e.capacity)||0),0);
    return fallback('event-demand', upcoming?`${upcoming} upcoming event(s), capacity ${cap}.`:'No upcoming events.', {count:records.length, upcoming, totalCapacity:cap, expectedAttendance:records.reduce((s,e)=>s+(Number(e.expectedAttendance)||0),0)}); },
  'pricing-opportunity': (records)=>{ const under=records.filter(e=>(Number(e.expectedAttendance)||0) < (Number(e.capacity)||0)*0.5); return fallback('pricing-opportunity', under.length?`${under.length} event(s) below 50% expected fill.`:'No under-filled events.', {count:records.length, underFilled:under.length, opportunityFlag: under.length>0}); },
  'schedule-conflict': (records)=>{ const seen={}, dup=[]; for(const e of records){ const k=`${e.venue||''}|${e.date||''}`; if(seen[k]) dup.push(e.name??''); seen[k]=1; } return fallback('schedule-conflict', dup.length?`${dup.length} possible conflict(s).`:'No schedule conflicts detected.', {count:records.length, conflicts:dup.length, conflictEvents:dup}); },
 };}
module.exports={filterRecords,toCsv,displayValue,toSections,createTaskStore,createTasksRouter,createFeaturePackRouter,fallback,aiFeatures};
