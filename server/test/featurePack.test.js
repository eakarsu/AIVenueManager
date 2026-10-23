// No-provider guard: unset keys before importing app code.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test=require('node:test'); const assert=require('node:assert');
const fp=require('../routes/featurePack');
test('filter + csv preserve 0/false',()=>{
  const rows=[{name:'Alpha',score:0,active:false,status:'active'},{name:'Beta',score:5,active:true,status:'paused'}];
  assert.strictEqual(fp.filterRecords(rows,{q:'alpha'}).length,1);
  assert.strictEqual(fp.filterRecords(rows,{status:'paused'}).length,1);
  const csv=fp.toCsv(rows); assert.match(csv,/Alpha,0,false/); assert.strictEqual(fp.displayValue(false),'false'); assert.strictEqual(fp.displayValue(0),'0'); assert.strictEqual(fp.displayValue(''),'(empty)');
});
test('tasks create/update preserve false/0',()=>{
  const s=fp.createTaskStore(); const t=s.create({title:'Check',progress:0,done:false}); assert.strictEqual(t.done,false); assert.strictEqual(t.progress,0);
  const u=s.update(t.id,{status:'done'}); assert.strictEqual(u.status,'done'); assert.strictEqual(s.list({status:'done'}).length,1);
});
test('AI fallback aiGenerated:false with empty records',()=>{
  for(const [name,fn] of Object.entries(fp.aiFeatures())){ const r=fn([]); assert.strictEqual(r.aiGenerated,false,name); assert.strictEqual(r.result.count,0,name); assert.ok(r.sections.some(s=>s.label==='count'&&s.value===0),name); }
});
test('tasks router requires title and lists after create',async()=>{
  const express=require('express'); const http=require('http');
  const {router}=fp.createFeaturePackRouter({getRecords:async()=>[],aiFeatures:fp.aiFeatures(),resourceName:'events'});
  const app=express(); app.use(express.json()); app.use('/fp',router);
  const srv=app.listen(0); const base='http://127.0.0.1:'+srv.address().port;
  try{ const bad=await fetch(base+'/fp/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({})}); assert.strictEqual(bad.status,400);
    const ok=await fetch(base+'/fp/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'T1'})}); assert.strictEqual(ok.status,201);
    const list=await (await fetch(base+'/fp/tasks')).json(); assert.strictEqual(list.total,1);
    const ai=await (await fetch(base+'/fp/ai/'+Object.keys(fp.aiFeatures())[0],{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({records:[]})})).json(); assert.strictEqual(ai.aiGenerated,false);
    const exp=await fetch(base+'/fp/export?format=csv'); assert.match(exp.headers.get('content-type'),/text\/csv/);
  } finally{ srv.close(); }
});
