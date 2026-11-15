// Links open as a preview; saving a copy; saved plans on this phone.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const byName=app=>app.json(`(()=>{const n=id=>{const p=state.panel.players.find(x=>x.id===id);return p?p.name:null};return state.match.plan.lineups.map(lu=>lu.map(n))})()`);

async function linkFrom(setup){const a=loadApp();setupMatch(a,{n:16});a.run(`state.match.opp='Test Rovers';${setup||''}wand()`);return {a,code:await a.run('encodeState()')};}

const openLink=async(b,code)=>{b.run(`offerImport(${JSON.stringify(code)})`);await sleep(150);};

test('opening a link asks: Save to Plans, Replace my current plan, or Cancel',async()=>{
  const {code}=await linkFrom();
  const b=loadApp();setupMatch(b,{n:12});b.run('wand()');const mine=b.json('state');
  await openLink(b,code);
  const sheet=b.d.querySelector('.sheet').textContent;
  assert.match(sheet,/vs Test Rovers/);assert.match(sheet,/16 here/);
  ['incSave','incReplace','sheetClose'].forEach(a=>assert.ok(b.d.querySelector(`[data-a=${a}]`),a));
  b.click('[data-a=sheetClose]');
  assert.deepEqual(b.json('state'),mine,'cancel must change nothing');
});

test('Save to Plans keeps my current plan and stores theirs by name',async()=>{
  const {a,code}=await linkFrom();
  const b=loadApp();setupMatch(b,{n:12});b.run(`state.panel.players.push({id:'only-mine',name:'Somebody Else',lines:[2],side:'E'});wand()`);
  const myMatch=b.json('state.match'),n0=b.json('loadSaves().length');
  await openLink(b,code);b.click('[data-a=incSave]');
  assert.deepEqual(b.json('state.match'),myMatch,'current plan must not change');
  assert.equal(b.json('loadSaves().length'),n0+1);
  assert.ok(b.json(`state.panel.players.some(p=>p.id==='only-mine')`),'nobody removed');
  const saved=b.json('loadSaves()[0]');assert.match(saved.name,/from link \(vs Test Rovers\)/);
  b.run(`openSaved(${JSON.stringify(saved.id)})`);
  assert.deepEqual(byName(b),byName(a),'same people in the same places');
});

test('Replace my current plan: auto-saves mine first and ↶ brings it back',async()=>{
  const {a,code}=await linkFrom();
  const b=loadApp();setupMatch(b,{n:12});b.run(`wand();ui.tab='plan';render()`);const myL=b.json('state.match.plan.lineups');
  await openLink(b,code);b.click('[data-a=incReplace]');
  assert.deepEqual(byName(b),byName(a));
  assert.ok(b.json('loadSaves().some(x=>x.auto)'),'my plan should be auto-saved');
  assert.equal(b.json('state.match.selId'),'');
  b.click('[data-a=undo]');assert.deepEqual(b.json('state.match.plan.lineups'),myL);
  assert.deepEqual(b.errors,[]);
});

test('only players in their plan are added to my panel',async()=>{
  const a=loadApp();setupMatch(a,{n:18});a.run(`delete state.match.present[state.panel.players[17].id];wand()`);
  const code=await a.run('encodeState()');
  const b=loadApp();setupMatch(b,{n:5});await openLink(b,code);b.click('[data-a=incSave]');
  assert.equal(b.json('state.panel.players.length'),17,'the unticked 18th player should not be added');
});

test('a link from before v0.5 says it has no line-ups',async()=>{
  const a=loadApp();setupMatch(a,{n:16});a.run('delete state.match.plan');const code=await a.run('encodeState()');
  const b=loadApp();await openLink(b,code);
  assert.match(b.d.querySelector('.sheet').textContent,/no line-ups/);
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

test('no "Saved" message when the phone refuses to store it',()=>{
  const app=loadApp();setupMatch(app,{n:16});app.run(`wand();ui.tab='plan';render()`);
  app.run(`Object.defineProperty(window,'localStorage',{value:{getItem:()=>null,setItem:()=>{throw new Error('full')}},configurable:true})`);
  app.click('[data-a=plans]');app.run(`ui.saveName='Plan A'`);app.click('[data-a=saveNew]');
  assert.doesNotMatch(app.d.querySelector('#toast').textContent,/Saved/);
  assert.ok(!app.run('state.match.selName'),'should not look saved');
});
