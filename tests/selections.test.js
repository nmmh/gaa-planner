// Links open as a preview; saving a copy; saved plans on this phone.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const byName=app=>app.json(`(()=>{const n=id=>{const p=state.panel.players.find(x=>x.id===id);return p?p.name:null};return state.match.plan.lineups.map(lu=>lu.map(n))})()`);

async function linkFrom(setup){const a=loadApp();setupMatch(a,{n:16});a.run(`state.match.opp='Test Rovers';${setup||''}wand()`);return {a,code:await a.run('encodeState()')};}

test('a link opens as a preview and changes nothing until you save a copy',async()=>{
  const {a,code}=await linkFrom();
  const b=loadApp();setupMatch(b,{n:12});b.run('wand()');const mine=b.json('state');
  b.run(`offerImport(${JSON.stringify(code)})`);await sleep(150);
  assert.match(b.d.querySelector('.pvbar').textContent,/Preview/);
  assert.match(b.d.querySelector('main').textContent,/vs Test Rovers/);
  assert.equal(b.d.querySelectorAll('[data-dz]').length,0,'preview must not be editable');
  assert.deepEqual(b.json('state'),mine,'previewing changed this phone');
  b.click('[data-a=pvClose]');assert.equal(b.d.querySelector('.pvbar'),null);
  assert.deepEqual(b.json('state'),mine);
});

test('save a copy: players matched by name, missing ones added, nobody removed',async()=>{
  const {a,code}=await linkFrom();
  const b=loadApp();setupMatch(b,{n:12}); // same first 12 names, different ids on this phone
  b.run(`state.panel.players.push({id:'only-mine',name:'Somebody Else',lines:[2],side:'E'})`);
  const before=b.json('state.panel.players.length');
  b.run(`offerImport(${JSON.stringify(code)})`);await sleep(150);b.click('[data-a=pvSave]');
  assert.equal(b.json('state.panel.players.length'),before+4,'4 players missing from this phone should be added');
  assert.ok(b.json(`state.panel.players.some(p=>p.id==='only-mine')`));
  assert.deepEqual(byName(b),byName(a),'line-ups must be the same people in the same places');
  assert.match(b.json('state.match.selName'),/from link \(vs Test Rovers\)/);
  assert.ok(b.json('loadSaves().some(x=>x.name===state.match.selName)'));
  assert.deepEqual(b.errors,[]);
});

test('a link from before v0.5 previews without a plan',async()=>{
  const a=loadApp();setupMatch(a,{n:16});a.run('delete state.match.plan');const code=await a.run('encodeState()');
  const b=loadApp();b.run(`offerImport(${JSON.stringify(code)})`);await sleep(150);
  assert.match(b.d.querySelector('main').textContent,/No plan in this link/);
});

test('picture from a preview shows the previewed plan',async()=>{
  const {a,code}=await linkFrom();const names=a.json(`derive().starters.filter(Boolean).map(p=>shortName(p.name))`);
  const b=loadApp();setupMatch(b,{n:12});b.run(`state.match.opp='My Own Match';wand()`);
  b.run(`offerImport(${JSON.stringify(code)})`);await sleep(150);
  b.drawn.length=0;await b.run(`buildImage('plan',ui.preview.state)`);
  assert.ok(b.drawn.some(t=>t.includes('Test Rovers')));assert.ok(!b.drawn.some(t=>t.includes('My Own Match')));
  names.forEach(n=>assert.ok(b.drawn.includes(n),n));
});

test('saved plans: save, auto-save before the wand, open again, undo the open, delete',()=>{
  const app=loadApp();setupMatch(app,{n:16});app.run(`ui.tab='plan';render()`);
  app.click('[data-a=wand]');const planA=app.json('state.match.plan.lineups');
  app.click('[data-a=plans]');app.run(`ui.saveName='Plan A'`);app.click('[data-a=saveNew]');
  assert.equal(app.json('state.match.selName'),'Plan A');
  app.click('[data-a=sheetClose]');app.click('[data-a=wand]');
  assert.notDeepEqual(app.json('state.match.plan.lineups'),planA);
  const saves=app.json('loadSaves()');assert.ok(saves.some(x=>x.auto),'wand should auto-save');
  const idA=saves.find(x=>x.name==='Plan A').id;const changed=app.json('state.match.plan.lineups');
  app.click('[data-a=plans]');app.click(`[data-a=openSave][data-v="${idA}"]`);
  assert.deepEqual(app.json('state.match.plan.lineups'),planA);
  app.click('[data-a=undo]');assert.deepEqual(app.json('state.match.plan.lineups'),changed,'undo should go back to before opening');
  for(let k=0;k<8;k++)app.run('wand()');
  assert.ok(app.json('loadSaves().filter(x=>x.auto).length')<=5,'only the last 5 auto-saves are kept');
  app.click('[data-a=plans]');app.click(`[data-a=delSave][data-v="${idA}"]`);app.click(`[data-a=delSaveYes][data-v="${idA}"]`);
  assert.ok(!app.json('loadSaves()').some(x=>x.id===idA));
  assert.deepEqual(app.errors,[]);
});
