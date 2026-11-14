// The wand's automatic selection must always respect these rules.
const test=require('node:test');const assert=require('node:assert/strict');
const {loadApp,setupMatch}=require('./helpers');

const FORMS={7:[1,2,1,1,1,1],9:[1,2,2,1,2,1],11:[1,2,2,2,2,2],13:[1,3,2,2,2,3],15:[1,3,3,2,3,3]};
const TIMES={quarters:null,custom:[10,25,40],halfOnly:[25],none:[]};

function check(app,label){
  const P=app.json(`(()=>{const P=derive();return {L:state.match.plan.lineups,bounds:P.bounds,mins:P.mins,present:P.present.map(p=>p.id)}})()`);
  const lock=app.json('state.match.lock'),bench=app.json('state.match.benchStart'),late=app.json('state.match.late'),inj=app.json('state.match.injured');
  P.L.forEach((lu,i)=>{
    const ids=lu.filter(Boolean);
    assert.equal(new Set(ids).size,ids.length,`${label}: someone twice in period ${i}`);
    ids.forEach(id=>assert.ok(P.present.includes(id),`${label}: absent player in period ${i}`));
    ids.forEach(id=>{if(late[id])assert.ok(late[id]<=P.bounds[i],`${label}: late player on too early`);});
    ids.forEach(id=>{if(inj[id]!==undefined)assert.ok(inj[id]>P.bounds[i],`${label}: injured player still on`);});
  });
  Object.keys(lock).forEach(id=>{const slots=new Set();P.L.forEach(lu=>{const k=lu.indexOf(id);if(k>=0)slots.add(k);});
    assert.ok(slots.size<=1,`${label}: locked player moved between ${[...slots]}`);});
  const slotsN=P.L[0].length;
  if(P.present.length>slotsN)Object.keys(bench).forEach(id=>{
    const benchN=Object.keys(bench).length;if(benchN<=P.present.length-slotsN)assert.ok(!P.L[0].includes(id),`${label}: B player started`);});
  return P;
}

for(const [size,form] of Object.entries(FORMS)){
  for(const [tname,windows] of Object.entries(TIMES)){
    for(const extra of [0,2,4]){
      test(`wand ${size}-a-side, ${tname}, ${extra} subs`,()=>{
        const app=loadApp();const ids=setupMatch(app,{n:+size+extra,form,windows});
        app.run('wand()');
        const P=check(app,`${size}/${tname}/${extra}`);
        // even minutes: with no B/locks, everyone within one period length of each other
        const lens=P.bounds.slice(1).map((b,i)=>b-P.bounds[i]);const maxLen=Math.max(...lens);
        // goalkeepers are only swapped for another keeper, so leave anyone who kept goal out of the spread
        const keepers=new Set(P.L.map(lu=>lu[0]).filter(Boolean));
        const m=Object.entries(P.mins).filter(([id])=>!keepers.has(id)).map(([,v])=>v);
        assert.ok(Math.max(...m)-Math.min(...m)<=maxLen+0.01,`spread ${Math.max(...m)-Math.min(...m)} > ${maxLen}`);
        assert.deepEqual(app.errors,[]);
      });
    }
  }
}

test('wand respects B, locks, late arrivals and injuries',()=>{
  const app=loadApp();const ids=setupMatch(app,{n:17});
  app.run(`state.match.benchStart[${JSON.stringify(ids[3])}]=true;state.match.benchStart[${JSON.stringify(ids[6])}]=true;
    state.match.lock[${JSON.stringify(ids[1])}]=true;state.match.lock[${JSON.stringify(ids[9])}]=true;
    state.match.late[${JSON.stringify(ids[12])}]=20;state.match.injured[${JSON.stringify(ids[4])}]=30;`);
  for(let k=0;k<5;k++){app.run('wand()');check(app,'press '+k);}
});
