// Hand edits on the pitch, undo/redo and sub ticks.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');
const benches=app=>app.json(`derive().periods.map(p=>p.off.map(x=>x.id).sort())`);
const lineups=app=>app.json('state.match.plan.lineups');

test('swapping two pitch players only changes positions — who sits out never changes',()=>{
  for(const windows of [null,[10,25,40]]){
    const app=loadApp();setupMatch(app,{n:17,windows});app.run('wand()');
    for(const vi of [0,1,2]){
      const b0=benches(app),L0=lineups(app);
      app.run(`ui.view=${vi};editPlan({slot:1},{slot:5})`);
      assert.deepEqual(benches(app),b0,`bench changed after swap in period ${vi}`);
      const L1=lineups(app);for(let j=0;j<vi;j++)assert.deepEqual(L1[j],L0[j],`earlier period ${j} changed`);
      assert.equal(L1[vi][1],L0[vi][5]);assert.equal(L1[vi][5],L0[vi][1]);
    }
  }
});

test('bringing a bench player on swaps them in from that period on',()=>{
  const app=loadApp();setupMatch(app,{n:17});app.run('wand()');
  const benchId=app.json('derive().periods[2].off[0].id'),out=app.json('state.match.plan.lineups[2][4]');
  app.run(`ui.view=2;editPlan({pid:${JSON.stringify(benchId)}},{slot:4})`);
  const L=lineups(app);assert.equal(L[2][4],benchId);assert.ok(!L[2].includes(out));
  L.forEach(lu=>{const ids=lu.filter(Boolean);assert.equal(new Set(ids).size,ids.length);});
});

test('sub ticks survive an unrelated edit',()=>{
  const app=loadApp();setupMatch(app,{n:17});app.run('wand()');
  const key=app.json(`(()=>{const e=derive().timeline[0],it=e.items.find(i=>i.kind==='sub');return e.t+'-'+it.on.id+'-'+it.off.id})()`);
  app.run(`state.match.done[${JSON.stringify(key)}]=true;ui.view=0;editPlan({slot:0},{slot:0});editPlan({slot:2},{slot:3})`);
  assert.equal(app.json(`state.match.done[${JSON.stringify(key)}]`),true);
});

test('undo and redo through the buttons',()=>{
  const app=loadApp();setupMatch(app,{n:17});app.run(`ui.tab='plan';render()`);
  app.click('[data-a=wand]');const after=lineups(app);
  app.click('[data-slot="1"]');app.click('[data-slot="2"]');
  assert.notDeepEqual(lineups(app),after);
  assert.equal(app.d.querySelector('#undoBtn').disabled,false);
  app.click('[data-a=undo]');assert.deepEqual(lineups(app),after);
  assert.equal(app.d.querySelector('#redoBtn').disabled,false);
  app.click('[data-a=redo]');assert.notDeepEqual(lineups(app),after);
  assert.deepEqual(app.errors,[]);
});
