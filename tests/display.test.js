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

// every piece of text in the green pitch on screen (not the wand bar) — in reading order
function pitchTexts(app){
  const out=[];const pitch=app.d.querySelector('.pitch');
  const walk=el=>{if(el.classList&&el.classList.contains('pitchbar'))return;
    if(el.matches&&el.matches('.lineTag,.num,.slot b,.pos,.chg,.bchip,.nobody')){out.push(el.textContent.replace(/\s+/g,' ').trim());return;}
    [...el.children].forEach(walk);};
  walk(pitch);return out;
}
test('the picture is the heading plus exactly the text of the pitch on screen',async()=>{
  for(const windows of [null,[10,25,40]]){
    for(const vi of [0,2]){
      const app=loadApp();const ids=setupMatch(app,{n:16,windows});
      app.run(`state.match.opp='Test Rovers';state.match.date='2026-11-21';state.match.lock[${JSON.stringify(ids[2])}]=true;state.match.late[${JSON.stringify(ids[15])}]=40;wand();ui.tab='plan';ui.view=${vi};render()`);
      const screen=pitchTexts(app);
      app.drawn.length=0;await app.run('buildImage()');
      const drawn=app.drawn.map(t=>t.trim());
      assert.equal(drawn[0],'vs Test Rovers');
      assert.match(drawn[1],/13-a-side · 2×25 mins/);
      // drawn order differs (badge after name), so compare as multisets, case-insensitive for line names
      const norm=a=>a.map(t=>t.toLowerCase()).sort();
      const pitchDrawn=drawn.slice(2,-1);
      assert.deepEqual(norm(pitchDrawn),norm(screen),`period ${vi}, times ${windows}`);
    }
  }
});

test('Q1 boxes carry every later sub, as on screen',async()=>{
  const app=loadApp();setupMatch(app,{n:16});app.run(`wand();ui.tab='plan';ui.view=0;render()`);
  const subs=app.json(`derive().timeline.reduce((n,e)=>n+e.items.filter(i=>i.kind==='sub'||i.kind==='fill'||i.kind==='move').length,0)`);
  app.drawn.length=0;await app.run('buildImage()');
  assert.equal(app.drawn.filter(t=>/^(↔ )?(Q[2-4]|HT|\d+½?') /.test(t)).length,subs);
});
