'use strict';
const $ = selector => document.querySelector(selector);
const icon = name => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;
const levels = [
  {id:'apple', choices:['ball','apple','boot'], target:'basket'},
  {id:'blanket', choices:['umbrella','boot','blanket'], target:'blanket'},
  {id:'umbrella', choices:['umbrella','ball','apple'], target:'umbrella'},
  {id:'recall', choices:['blanket','umbrella','apple'], target:'basket'}
];
const words={apple:'Apple.',blanket:'Blanket.',umbrella:'Umbrella.',ball:'A ball.',boot:'A boot.'};
let phase=-1, recall=0, selected=null, busy=false, modelling=false, modelled=false;
let turnId=0, generation=0, recognition=null, hintTimer=null, promptId=0;
let attempts=[];
const scene=$('#scene'), choices=$('#choices'), destination=$('#destination');
const active=()=>phase>=0&&phase<4;
const expectedItem=()=>phase===3?['apple','blanket','umbrella'][recall]:levels[phase]?.id;
function say(text){$('#caption').textContent=text;return window.picnicSpeech.play(text);}
function setTurn(value){scene.dataset.turn=value;$('#turn-cue').dataset.turn=value;$('#mic').classList.toggle('your-turn',value==='child');}
function controls(){
  $('#mic').disabled=!active()||busy||modelling;
  $('#replay').disabled=$('#help').disabled=!active()||busy;
  $('#assist').disabled=!active()||busy;
}
function stopListening(){const old=recognition;recognition=null;if(old)old.abort();$('#mic').classList.remove('listening');}
function stopPrompt(){promptId++;modelling=false;window.picnicSpeech.stop();}
function report(){
  const echo=attempts.filter(a=>a.kind==='echo').length;
  const picture=attempts.filter(a=>a.kind==='picture').length;
  const assisted=attempts.filter(a=>a.kind==='assisted').length;
  return `跟读 ${echo} 次 · 看图说 ${picture} 次 · 家长协助 ${assisted} 次`;
}
function render(){
  turnId++;stopPrompt();stopListening();clearTimeout(hintTimer);modelled=false;selected=null;
  scene.dataset.phase=phase<0?'intro':phase>3?'complete':levels[phase].id;
  $('#chapters').innerHTML=['apple','blanket','umbrella','sun'].map((id,i)=>`<span class="${i<phase?'done':i===phase?'active':''}" aria-label="第${i+1}步${i<phase?'已完成':i===phase?'进行中':''}">${icon(id)}</span>`).join('');
  choices.innerHTML='';destination.classList.remove('ready');controls();
  $('#turn-cue').hidden=!active();destination.classList.toggle('waiting-for-voice',active());
  if(!active()){setTurn('idle');return;}
  $('#thought-icon use').setAttribute('href','#'+expectedItem());
  destination.firstElementChild.innerHTML=`<use href="#${levels[phase].target}"/>`;
  destination.setAttribute('aria-label','听小熊示范，开口后物品才会移动');
  for(const id of levels[phase].choices){
    const b=document.createElement('button');b.className='choice';b.dataset.item=id;b.setAttribute('aria-label',id);b.innerHTML=icon(id);
    if(phase===3&&['apple','blanket','umbrella'].indexOf(id)<recall){b.disabled=true;b.classList.add('recalled');}
    b.onclick=()=>select(id,b);
    let origin=null;
    b.onpointerdown=e=>{if(busy||recognition)return;origin={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
    b.onpointerup=e=>{if(!origin)return;const moved=Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>15;origin=null;if(moved)select(id,b);};
    b.onpointercancel=()=>origin=null;choices.appendChild(b);
  }
  scene.classList.toggle('raining',phase===2);
  // First encounters are one-word echo turns. The final revisit only supplies a picture.
  if(phase<3)showModel();
  else{setTurn('child');say('Your turn!');$('#mode').textContent='看图说一个词 · 喇叭可以听示范';hintTimer=setTimeout(demo,1800);}
}
async function showModel(){
  if(!active()||busy)return;
  stopListening();const current=turnId,request=++promptId;modelled=true;modelling=true;setTurn('bear');controls();
  await say(words[expectedItem()]);
  if(current!==turnId||request!==promptId)return;
  modelling=false;setTurn('child');controls();$('#caption').textContent='Your turn!';$('#mode').textContent='轮到你啦 · 说一个词就可以';demo();
}
function select(id,b){
  if(!active()||busy||recognition)return;
  selected=id;choices.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));
  if(id===expectedItem()){destination.classList.add('ready');showModel();}
  else{say(words[id]);$('#thought').animate([{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0)'}],{duration:400});}
}
function demo(){
  if(!active()||busy||recognition)return;
  const b=choices.querySelector(`[data-item="${expectedItem()}"]`);if(!b)return;
  const a=b.getBoundingClientRect(),z=$('#mic').getBoundingClientRect(),hand=$('#demo-hand');
  hand.getAnimations().forEach(animation=>animation.cancel());hand.style.left=(a.left+a.width/2)+'px';hand.style.top=(a.top+a.height/2)+'px';
  hand.animate([{opacity:0,transform:'translate(0,0)'},{opacity:1,transform:'translate(0,0)',offset:.2},{opacity:1,transform:`translate(${z.left-a.left}px,${z.top-a.top}px)`,offset:.8},{opacity:0,transform:`translate(${z.left-a.left}px,${z.top-a.top}px)`}],{duration:1800,iterations:2});
}
async function fly(id,b){
  const a=b.getBoundingClientRect(),z=destination.getBoundingClientRect(),el=document.createElement('div');el.className='flying';el.innerHTML=icon(id);el.style.left=a.left+'px';el.style.top=a.top+'px';document.body.appendChild(el);
  await el.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${z.left-a.left+20}px,${z.top-a.top+20}px) scale(.7)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650,easing:'ease-in-out',fill:'forwards'}).finished;
  el.remove();
}
async function advance(id,kind,text=''){
  if(!active()||busy||id!==expectedItem()||!['echo','picture','assisted'].includes(kind))return;
  busy=true;stopPrompt();stopListening();clearTimeout(hintTimer);setTurn('reward');controls();const g=generation;
  attempts.push({item:id,kind,text:text.slice(0,120)});destination.classList.remove('waiting-for-voice');
  const b=choices.querySelector(`[data-item="${id}"]`);if(b)await fly(id,b);if(g!==generation)return;
  $('.friend').classList.remove('happy');void $('.friend').offsetWidth;$('.friend').classList.add('happy');
  if(phase===0)$('#packed').innerHTML=icon('apple');
  if(phase===1)scene.classList.add('blanket-out');
  if(phase===2)scene.classList.add('umbrella-out');
  if(phase===3){recall++;if(recall<3){busy=false;render();return;}}
  await say(phase===0?'Yum! The apple is in the basket.':phase===1?'A soft blanket!':phase===2?'Now we are dry. Thank you!':'We did it! Our lovely picnic.');
  if(g!==generation)return;
  phase++;busy=false;
  if(phase===4){scene.classList.remove('raining');$('#celebration').hidden=false;$('#thought').hidden=true;destination.classList.add('hidden');$('#mode').textContent=report();}
  render();
}
function showSupport(message){
  busy=false;stopListening();stopPrompt();setTurn('child');controls();$('#caption').textContent=message;$('#mode').textContent='点喇叭再听一个词 · 或请家长帮忙';demo();
}
$('#start').onclick=()=>{phase=0;$('#intro').hidden=true;$('#intro').style.display='none';render();};
destination.onclick=()=>{if(active()&&!busy)showModel();};
$('#replay').onclick=$('#thought').onclick=showModel;
$('#help').onclick=showModel;
$('#restart').onclick=()=>{
  generation++;stopListening();stopPrompt();clearTimeout(hintTimer);phase=0;recall=0;attempts=[];busy=false;
  $('#packed').innerHTML='';$('#celebration').hidden=true;$('#thought').hidden=false;destination.classList.remove('hidden');scene.classList.remove('blanket-out','umbrella-out','raining');render();
};
$('#mic').onclick=()=>{
  if(!active()||busy||modelling)return;
  if(recognition){stopListening();setTurn('child');return;}
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R){$('#mic').classList.add('unavailable');showSupport('麦克风识别在此浏览器不可用，请家长帮忙换浏览器。');return;}
  stopPrompt();const r=new R(),current=turnId,g=generation;recognition=r;
  r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
  r.onstart=()=>{if(recognition!==r)return;$('#mic').classList.add('listening');setTurn('listening');$('#caption').textContent="I'm listening…";$('#mode').textContent='小熊在听 · 再点麦克风可停止';};
  r.onend=()=>{if(recognition!==r)return;recognition=null;$('#mic').classList.remove('listening');if(!busy&&!modelling)setTurn('child');};
  r.onerror=()=>{if(current===turnId&&recognition===r)showSupport('没听清也没关系，我们再说一个词。');};
  r.onnomatch=()=>{if(current===turnId)showSupport('没听清也没关系，我们再说一个词。');};
  r.onresult=async e=>{
    if(current!==turnId||g!==generation||busy)return;
    const text=e.results?.[0]?.[0]?.transcript||'';if(!text.trim()){showSupport('没听清也没关系，我们再说一个词。');return;}
    const kind=modelled?'echo':'picture';busy=true;setTurn('checking');controls();$('#caption').textContent=text;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
    try{
      const response=await fetch('/api/turn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,stage:levels[phase].id,expected:expectedItem()}),signal:controller.signal});
      if(!response.ok)throw Error('turn failed');const out=await response.json();
      if(current!==turnId||g!==generation)return;
      busy=false;
      if(out.accepted&&out.item===expectedItem())await advance(out.item,kind,text);
      else{showSupport('再听小熊说一个词，然后轮到你。');await showModel();}
    }catch{if(current===turnId&&g===generation)showSupport('刚才连接没成功，点麦克风再试一次。');}
    finally{clearTimeout(timer);if(g===generation)controls();}
  };
  try{r.start();}catch{showSupport('麦克风还没准备好，请家长帮忙。');}
};
$('#parent').onclick=()=>{
  $('#report').textContent=report()+`。${phase===4?'本次故事已完成。':'故事尚未完成。'} 看图说仅表示本步没有播放示范，不代表已经掌握。`;
  $('#evidence').textContent=attempts.filter(a=>a.kind!=='assisted').map(a=>`${a.kind==='echo'?'跟读':'看图说'}：${a.text}`).join(' / ')||'尚未获得有效的语音回应。';
  controls();$('#parent-dialog').showModal();
};
$('#assist').onclick=()=>{if(!active()||busy)return;$('#parent-dialog').close();advance(expectedItem(),'assisted');};
$('#close-parent').onclick=()=>$('#parent-dialog').close();
render();
