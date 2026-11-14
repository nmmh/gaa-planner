// ClubZap import, links between phones, and links made by older versions.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');

// made-up report in ClubZap's export layout
const CSV=`Team, (Group(s): B )
Event,Home v Test Rovers (B)
Start,"November 21, 2026 10:00"

Name,Response,Type,Segment(s)
Darragh Walsh,Attending,Player,B
Cian  BYRNE ,Attending,Player,B
Oisín  Kelly ,Not Responded,Player,B
Fionn Ryan,Not Attending,Player,B
A Parent,Attending,Guardian,B
`;

test('ClubZap RSVP report: names tidied, responses read, opposition and date filled',()=>{
  const app=loadApp();
  const r=app.json(`parseRSVP(${JSON.stringify(CSV)})`);
  assert.deepEqual(r.people.map(p=>p.name),['Darragh Walsh','Cian Byrne','Oisín Kelly','Fionn Ryan']);
  assert.deepEqual(r.people.map(p=>p.resp),['A','A','N','X']);
  assert.equal(r.opp,'Test Rovers (B)');assert.equal(r.date,'2026-11-21');
  app.run(`applyRSVP(parseRSVP(${JSON.stringify(CSV)}),true)`);
  assert.equal(app.json('Object.keys(state.match.present).length'),2);
});

test('links from older versions still open (no stored plan, © and Off picks migrated)',async()=>{
  const a=loadApp();const ids=setupMatch(a,{n:16});
  // shape of a v0.4 setup: core, per-quarter sit-outs and pitch adjustments, no stored line-ups
  a.run(`state.match.anchor={[${JSON.stringify(ids[0])}]:true};state.match.sitOut={[${JSON.stringify(ids[2])}]:{0:true},[${JSON.stringify(ids[3])}]:{2:true}};
    state.match.moves=[{id:'m1',t:0,a:${JSON.stringify(ids[4])},b:${JSON.stringify(ids[5])}}];delete state.match.plan;`);
  const code=await a.run('encodeState()');
  const b=loadApp();const d=await b.run(`decodeState(${JSON.stringify(code)}).then(x=>JSON.stringify(x))`);
  const m=JSON.parse(d).match;
  assert.deepEqual(m.anchor,{});assert.deepEqual(m.sitOut,{});assert.deepEqual(m.moves,[]);assert.equal(m.plan,null);
  assert.deepEqual(m.benchStart,{[ids[2]]:true});
});
