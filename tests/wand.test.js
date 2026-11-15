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
  // B rotation: when more players are marked B than there are bench places, only B players ever sit out
  const avail=P.present.filter(id=>inj[id]===undefined);const benchN=avail.length-P.L[0].length;
  const bIds=Object.keys(bench).filter(id=>avail.includes(id));
  if(benchN>0&&bIds.length>benchN)P.L.forEach((lu,i)=>{
    avail.forEach(id=>{const arrived=!late[id]||late[id]<=P.bounds[i];
      if(arrived&&!bench[id])assert.ok(lu.includes(id),`${label}: unmarked player off in period ${i}`);});
  });
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
  app.run(`[3,6,10,13,15].forEach(i=>state.match.benchStart[${JSON.stringify(ids)}[i]]=true);
    state.match.lock[${JSON.stringify(ids[1])}]=true;state.match.lock[${JSON.stringify(ids[9])}]=true;
    state.match.late[${JSON.stringify(ids[12])}]=20;state.match.injured[${JSON.stringify(ids[4])}]=30;`);
  for(let k=0;k<5;k++){app.run('wand()');check(app,'press '+k);}
});

// his scenario: 13-a-side, 14 here (one sub), quarters, no sub limit
function scenario(marks){
  const app=loadApp();const ids=setupMatch(app,{n:14});
  marks.forEach(i=>app.run(`state.match.benchStart[${JSON.stringify(ids[i])}]=true`));app.run('wand()');
  return {app,ids,P:app.json(`(()=>{const P=derive();return {off:P.periods.map(p=>p.off.map(x=>x.id)),mins:P.mins,warn:P.warnings}})()`)};
}
const minsOf=(P,ids,idx)=>idx.map(i=>P.mins[ids[i]]).sort((a,b)=>a-b);
test('scenario 14 for 13, 4 marked B: each B sits one quarter, everyone else plays it all',()=>{
  const {P,ids}=scenario([13,5,9,11]);
  P.off.forEach(o=>{assert.equal(o.length,1);assert.ok([13,5,9,11].map(i=>ids[i]).includes(o[0]));});
  assert.deepEqual(minsOf(P,ids,[13,5,9,11]),[37.5,37.5,37.5,37.5]);
  ids.forEach((id,i)=>{if(![13,5,9,11].includes(i))assert.equal(P.mins[id],50);});
});
test('scenario 14 for 13, 3 marked B: one of them sits twice',()=>{
  const {P,ids}=scenario([13,5,9]);assert.deepEqual(minsOf(P,ids,[13,5,9]),[25,37.5,37.5]);
});
test('scenario 14 for 13, 2 marked B: half a match each',()=>{
  const {P,ids}=scenario([13,5]);assert.deepEqual(minsOf(P,ids,[13,5]),[25,25]);
  assert.ok(P.warn.some(w=>/under half/.test(w))===false,'exactly half is not under half');
});
test('scenario 14 for 13, 1 marked B: falls back to everyone rotating, with a warning',()=>{
  const {P,ids}=scenario([13]);
  assert.ok(P.mins[ids[13]]>0,'the B player must get on');
  assert.ok(P.warn.some(w=>/everyone rotates/.test(w)));
  assert.ok(P.off[0].includes(ids[13]),'B starts on the bench in the fallback');
});
test('scenario 14 for 13, no B: everyone rotates as before',()=>{
  const {P}=scenario([]);const m=Object.values(P.mins).sort((a,b)=>a-b);
  assert.deepEqual(m.slice(0,4),[37.5,37.5,37.5,37.5]);
});
