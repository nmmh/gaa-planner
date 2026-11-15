// Throw-in / meet-up times, blocked empty saves and tapping a sub row.
// Skips on a page that doesn't have these features yet (the live page until it's promoted).
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');
const has=app=>app.run("typeof addMins==='function'");
const change=(app,sel,val)=>{const el=app.d.querySelector(sel);el.value=val;el.dispatchEvent(new app.w.Event('change',{bubbles:true}));};

test('meet-up defaults to half an hour before throw-in until you set it',t=>{
  const app=loadApp();if(!has(app))return t.skip('not in this version');
  setupMatch(app,{n:14});app.run(`ui.tab='match';render()`);
  change(app,'[data-f=throwIn]','10:15');assert.equal(app.json('state.match.meetUp'),'09:45');
  change(app,'[data-f=throwIn]','00:10');assert.equal(app.json('state.match.meetUp'),'23:40');
  change(app,'[data-f=meetUp]','09:00');change(app,'[data-f=throwIn]','11:00');
  assert.equal(app.json('state.match.meetUp'),'09:00','a meet-up you set is kept');
  change(app,'[data-f=meetUp]','');assert.equal(app.json('state.match.meetUp'),'10:30','clearing it goes back to the default');
});

test('times appear on the Plan tab, the picture and the WhatsApp text',async t=>{
  const app=loadApp();if(!has(app))return t.skip('not in this version');
  setupMatch(app,{n:14});app.run(`state.match.throwIn='10:00';state.match.meetUp='09:30';wand();ui.tab='plan';render()`);
  assert.match(app.d.querySelector('main').textContent,/Throw-in 10:00 · Meet 09:30/);
  app.drawn.length=0;await app.run('buildImage()');assert.equal(app.drawn[2],'Throw-in 10:00 · Meet 09:30');
  assert.match(app.run('whatsappText()'),/Throw-in 10:00 · Meet 09:30/);
});

test('ClubZap start time fills throw-in',t=>{
  const app=loadApp();if(!has(app))return t.skip('not in this version');
  const CSV='Event,Home v Test Rovers\nStart,"November 21, 2026 09:50"\n\nName,Response,Type\nDarragh Walsh,Attending,Player\n';
  app.run(`applyRSVP(parseRSVP(${JSON.stringify(CSV)}),true)`);
  assert.equal(app.json('state.match.throwIn'),'09:50');assert.equal(app.json('state.match.meetUp'),'09:20');
});

test('nothing to save: save buttons disabled and nothing stored',t=>{
  const app=loadApp();if(!has(app))return t.skip('not in this version');
  app.run(`state.panel.players=parseBulk(SAMPLE).slice(0,5);render()`);
  app.click('[data-a=plans]');
  assert.ok(app.d.querySelector('[data-a=saveNew]').disabled);
  app.run(`act('saveNew',document.body)`);assert.equal(app.json('loadSaves().length'),0);
});

test('tapping anywhere on a substitution row ticks it',t=>{
  const app=loadApp();if(!has(app))return t.skip('not in this version');
  setupMatch(app,{n:16});app.run(`wand();ui.tab='plan';render()`);
  const row=app.d.querySelector('.tickrow .txt');row.dispatchEvent(new app.w.MouseEvent('click',{bubbles:true}));
  assert.equal(app.json('Object.keys(state.match.done).length'),1);
});
