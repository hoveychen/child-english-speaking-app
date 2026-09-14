const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('../server');
const server=app.listen(0,'127.0.0.1');
after(()=>server.close());
async function turn(data){const res=await fetch(`http://127.0.0.1:${server.address().port}/api/turn`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});return {status:res.status,body:await res.json()};}
test('same utterance only advances the matching stage, including cache hits',async()=>{
  for(const stage of ['apple','blanket','apple']){const r=await turn({text:'An apple please',stage});assert.equal(r.body.accepted,stage==='apple');}
});
test('negation cannot advance',async()=>{assert.equal((await turn({text:"I do not want an umbrella",stage:'umbrella'})).body.accepted,false);});
test('rain explanation advances the rain scene',async()=>{assert.equal((await turn({text:'It is raining',stage:'umbrella'})).body.accepted,true);});
test('recall has its own expected image',async()=>{assert.equal((await turn({text:'apple',stage:'recall',expected:'blanket'})).body.accepted,false);assert.equal((await turn({text:'blanket',stage:'recall',expected:'blanket'})).body.accepted,true);});
test('invalid requests are rejected',async()=>{for(const data of [{text:'apple'},{text:[],stage:'apple'},{text:'apple',stage:'recall',expected:'toy'}])assert.equal((await turn(data)).status,400);});
test('private project files are not served',async()=>{assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/server.js`)).status,404);});
