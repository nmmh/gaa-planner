// Loads index.html in jsdom with a recording canvas, so tests can drive the real page code.
// Uses only the made-up SAMPLE squad — never put real players' names in this repo.
const {JSDOM}=require('jsdom');
const fs=require('fs');const path=require('path');
// PLANNER_FILE=test/index.html runs the same tests against the test version
const HTML=fs.readFileSync(path.join(__dirname,'..',process.env.PLANNER_FILE||'index.html'),'utf8');

function recordingContext(log){
  const noop=()=>{};
  return new Proxy({},{get(t,k){
    if(k==='fillText')return (txt)=>log.push(String(txt));
    if(k==='measureText')return (txt)=>({width:String(txt).length*11});
    if(k==='createLinearGradient')return ()=>({addColorStop:noop});
    if(k in t)return t[k];
    return noop;
  },set(t,k,v){t[k]=v;return true;}});
}

function loadApp({url='https://nmmh.github.io/gaa-planner/'}={}){
  const drawn=[];
  const dom=new JSDOM(HTML,{runScripts:'dangerously',pretendToBeVisual:true,url,beforeParse(w){
    w.scrollTo=()=>{};w.fetch=()=>Promise.reject(new Error('offline'));
    ['CompressionStream','DecompressionStream','Response','Blob','TextEncoder','TextDecoder'].forEach(k=>{if(globalThis[k])w[k]=globalThis[k];});
    w.HTMLCanvasElement.prototype.getContext=function(){return recordingContext(drawn);};
    w.HTMLCanvasElement.prototype.toDataURL=()=>'data:image/png;base64,';
    w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(null);};
  }});
  const w=dom.window;
  const errors=[];w.addEventListener('error',e=>errors.push(e.message));
  const run=code=>w.eval(code);
  const json=code=>JSON.parse(w.eval('JSON.stringify('+code+')'));
  const click=(sel)=>{const el=w.document.querySelector(sel);if(!el)throw new Error('missing '+sel);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
  return {w,d:w.document,run,json,click,drawn,errors};
}

// a match with n sample players ticked in, given formation and change times
function setupMatch(app,{n=17,form=[1,3,2,2,2,3],windows,half=25}={}){
  app.run(`state.panel.players=parseBulk(SAMPLE).slice(0,${n});state.match=defaultMatch();
    state.match.form=${JSON.stringify(form)};state.match.size=sumForm(state.match.form);state.match.half=${half};
    state.match.windows=${JSON.stringify(windows||null)}||quarters(${half*2});
    state.panel.players.forEach(p=>state.match.present[p.id]=true);render();`);
  return app.json('state.panel.players.map(p=>p.id)');
}
module.exports={loadApp,setupMatch};
