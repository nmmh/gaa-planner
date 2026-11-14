// What the Plan tab and the picture show.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');

test('pitch boxes label later changes by minute when the change times are not quarters',()=>{
  const app=loadApp();setupMatch(app,{n:17,windows:[10,25,40]});app.run(`wand();ui.tab='plan';ui.view=0;render()`);
  const labels=[...app.d.querySelectorAll('.slot .chg')].map(e=>e.textContent);
  assert.ok(labels.length>0);
  labels.forEach(l=>assert.match(l,/^(↔ )?(10'|HT|40') /,l));
});

test('changing formation after the wand never loses or duplicates a player',()=>{
  for(const to of [[1,2,3,2,3,2],[1,3,3,2,3,3],[1,2,2,2,2,2]]){
    const app=loadApp();setupMatch(app,{n:17});app.run('wand()');
    const before=app.json('state.match.plan.lineups').map(lu=>lu.filter(Boolean).length);
    app.run(`state.match.form=${JSON.stringify(to)};state.match.size=sumForm(state.match.form)`);
    const L=app.json('remapPlan(state.match.plan,state.match).lineups');
    L.forEach((lu,i)=>{const ids=lu.filter(Boolean);assert.equal(new Set(ids).size,ids.length);
      assert.equal(ids.length,Math.min(before[i],lu.length),`period ${i} lost players going to ${to.join('-')}`);});
  }
});

test('whole-plan picture shows the starting team, subs and every change with its minute',async()=>{
  for(const windows of [null,[10,25,40],[]]){
    const app=loadApp();setupMatch(app,{n:15,windows});
    app.run(`state.match.opp='Test Rovers';state.match.late[state.panel.players[14].id]=20;wand()`);
    app.drawn.length=0;await app.run(`buildImage('plan')`);
    const text=app.drawn.join('\n');
    assert.match(text,/vs Test Rovers/);
    const starters=app.json(`derive().starters.filter(Boolean).map(p=>shortName(p.name))`);
    starters.forEach(n=>assert.ok(text.includes(n),`starter ${n} missing`));
    const changes=app.json(`changeList(derive(),state.match)`);
    changes.forEach(c=>{assert.ok(text.includes(c.head),`heading ${c.head} missing`);
      c.items.forEach(it=>assert.ok(app.drawn.some(d=>d.startsWith(it.t.slice(0,12))),`change "${it.t}" missing`));});
    // every sub on the Plan tab is in the picture
    const subs=app.json(`derive().timeline.flatMap(e=>e.items.filter(i=>i.kind==='sub').map(i=>i.on.name+' on for '+i.off.name))`);
    subs.forEach(s=>assert.ok(app.drawn.some(d=>d.startsWith(s.slice(0,12))),`sub "${s}" missing`));
    if(!windows||windows.length)assert.ok(subs.length>0);else assert.match(text,/No changes planned/);
  }
});

test('per-period and all-period pictures still work',async()=>{
  const app=loadApp();setupMatch(app,{n:17});app.run('wand()');
  for(const w of ['one','all']){app.drawn.length=0;await app.run(`buildImage('${w}')`);assert.ok(app.drawn.some(t=>/^Q1/.test(t)));}
});
