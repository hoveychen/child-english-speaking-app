'use strict';
const $ = s => document.querySelector(s);
const icon = name => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;
const levels = [
  {id:'apple', say:"I'm hungry. Let's take an apple.", choices:['ball','apple','boot'], target:'basket'},
  {id:'blanket', say:"Let's put the blanket on the grass.", choices:['umbrella','boot','blanket'], target:'blanket'},
  {id:'umbrella', say:"Oh! It's raining. We need an umbrella.", choices:['umbrella','ball','apple'], target:'umbrella'},
  {id:'recall', say:'First, the apple. Then, the blanket. Last, the umbrella.', choices:['blanket','umbrella','apple'], target:'basket'}
];
let phase=-1, selected=null, busy=false, recall=0, generation=0, voiceCount=0, recognition=null, hintTimer=null;
const scene=$('#scene'), choices=$('#choices'), destination=$('#destination');
function say(text){$('#caption').textContent=text;if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.8;speechSynthesis.speak(u);}}
function stopListening(){if(recognition){recognition.abort();recognition=null;}$('#mic').classList.remove('listening');}
function controls(){['#mic','#replay','#help'].forEach(s=>$(s).disabled=phase<0||phase>3||busy);}
function render(){scene.dataset.phase=phase<0?'intro':phase>3?'complete':levels[phase].id;
  $('#chapters').innerHTML=['apple','blanket','umbrella','sun'].map((id,i)=>`<span class="${i<phase?'done':i===phase?'active':''}" aria-label="第${i+1}步${i<phase?'已完成':i===phase?'进行中':''}">${icon(id)}</span>`).join('');
  choices.innerHTML='';selected=null;destination.classList.remove('ready');controls();
  if(phase<0||phase>3)return;
  const level=levels[phase];$('#thought-icon use').setAttribute('href','#'+(phase===3?['apple','blanket','umbrella'][recall]:level.id));
  destination.firstElementChild.innerHTML=`<use href="#${level.target}"/>`;
  destination.setAttribute('aria-label',phase===3?'回顾图片':phase===0?'把物品放进篮子':phase===1?'把毯子铺在草地上':'为小熊撑开雨伞');
  level.choices.forEach(id=>{const b=document.createElement('button');b.className='choice';b.dataset.item=id;b.setAttribute('aria-label',id);b.innerHTML=icon(id);if(phase===3&&['apple','blanket','umbrella'].indexOf(id)<recall){b.disabled=true;b.classList.add('recalled');}
    b.onclick=()=>select(id,b);let origin=null;
    b.onpointerdown=e=>{if(busy)return;origin={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);};
    b.onpointerup=e=>{if(!origin)return;const moved=Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>15;origin=null;if(moved){const box=destination.getBoundingClientRect();if(e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom){accept(id,b,false);} }};
    b.onpointercancel=()=>origin=null;choices.appendChild(b);});
  scene.classList.toggle('raining',phase===2);say(level.say);clearTimeout(hintTimer);hintTimer=setTimeout(demo,2200);
}
function select(id,b){if(busy||phase>3)return;if(phase===3){accept(id,b,false);return;}selected=id;choices.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));destination.classList.add('ready');say(id==='apple'?'Apple.':id==='blanket'?'Blanket.':id==='umbrella'?'Umbrella.':id==='ball'?'A ball.':'A boot.');}
async function fly(id,b){const a=b.getBoundingClientRect(),z=destination.getBoundingClientRect();const el=document.createElement('div');el.className='flying';el.innerHTML=icon(id);el.style.left=a.left+'px';el.style.top=a.top+'px';document.body.appendChild(el);const animation=el.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${z.left-a.left+20}px,${z.top-a.top+20}px) scale(.7)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650,easing:'ease-in-out',fill:'forwards'});await animation.finished;el.remove();}
async function accept(id,b,spoken){if(busy||phase<0||phase>3)return;const expected=phase===3?['apple','blanket','umbrella'][recall]:levels[phase].id;
  if(id!==expected){b?.classList.remove('wrong');void b?.offsetWidth;b?.classList.add('wrong');say('Watch me. '+(phase===3?'First, the apple. Then, the blanket. Last, the umbrella.':levels[phase].say));demo();return;}
  busy=true;controls();clearTimeout(hintTimer);stopListening();if(spoken)voiceCount++;const g=generation;
  if(b)await fly(id,b);if(g!==generation)return;
  $('.friend').classList.remove('happy');void $('.friend').offsetWidth;$('.friend').classList.add('happy');
  if(phase===0)$('#packed').innerHTML=icon('apple');
  if(phase===1)scene.classList.add('blanket-out');
  if(phase===2)scene.classList.add('umbrella-out');
  if(phase===3){recall++;if(recall<3){busy=false;render();say(recall===1?'Then, the blanket.':'Last, the umbrella.');return;}}
  say(phase===0?'Yum! The apple is in the basket.':phase===1?'A soft blanket!':phase===2?'Now we are dry. Thank you!':'We did it! Our lovely picnic.');
  setTimeout(()=>{if(g!==generation)return;phase++;busy=false;if(phase===4){scene.classList.remove('raining');$('#celebration').hidden=false;$('#thought').hidden=true;destination.classList.add('hidden');$('#mode').textContent=voiceCount?`语音参与 ${voiceCount} 次 · 不作能力评分`:'图片互动完成 · 尚未练习语音';}render();},1100);
}
function demo(){if(busy||phase<0||phase>3)return;const id=phase===3?['apple','blanket','umbrella'][recall]:levels[phase].id;const b=choices.querySelector(`[data-item="${id}"]`);if(!b)return;const a=b.getBoundingClientRect(),z=destination.getBoundingClientRect();const hand=$('#demo-hand');hand.getAnimations().forEach(a=>a.cancel());hand.style.left=(a.left+a.width/2)+'px';hand.style.top=(a.top+a.height/2)+'px';hand.animate([{opacity:0,transform:'translate(0,0)'},{opacity:1,transform:'translate(0,0)',offset:.2},{opacity:1,transform:phase===3?'translate(0,-12px)':`translate(${z.left-a.left}px,${z.top-a.top}px)`,offset:.8},{opacity:0,transform:phase===3?'translate(0,0)':`translate(${z.left-a.left}px,${z.top-a.top}px)`}],{duration:1800,iterations:2});}
$('#start').onclick=()=>{phase=0;$('#intro').hidden=true;$('#intro').style.display='none';render();};
destination.onclick=()=>{if(selected)accept(selected,choices.querySelector(`[data-item="${selected}"]`),false);else demo();};
$('#replay').onclick=$('#thought').onclick=()=>{if(phase>=0&&phase<4&&!busy){say(levels[phase].say);demo();}};
$('#help').onclick=()=>{demo();if(phase>=0&&phase<4)say(levels[phase].say);};
$('#restart').onclick=()=>{generation++;stopListening();clearTimeout(hintTimer);phase=0;recall=0;voiceCount=0;busy=false;$('#packed').innerHTML='';$('#celebration').hidden=true;$('#thought').hidden=false;destination.classList.remove('hidden');scene.classList.remove('blanket-out','umbrella-out','raining');$('#mode').textContent='看一看 · 动一动 · 说一说';render();};
$('#mic').onclick=()=>{if(busy||phase<0||phase>3)return;if(recognition){stopListening();return;}const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){$('#mic').classList.add('unavailable');say('Watch me. You can use the pictures.');$('#mode').textContent='本浏览器没有语音识别 · 可用图片完成';demo();return;}speechSynthesis?.cancel();const r=new R();recognition=r;const g=generation,p=phase;r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
  r.onstart=()=>{$('#mic').classList.add('listening');$('#caption').textContent="I'm listening…";};
  r.onend=()=>{if(recognition===r)recognition=null;$('#mic').classList.remove('listening');};
  r.onerror=()=>{say('Let’s use the pictures. Or try speaking again.');$('#mode').textContent='语音未完成 · 可重试或使用图片';demo();};
  r.onresult=async e=>{if(g!==generation||p!==phase||busy)return;busy=true;controls();const text=e.results[0][0].transcript;$('#caption').textContent=text;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4500);
    try{const res=await fetch('/api/turn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,stage:levels[phase].id,expected:phase===3?['apple','blanket','umbrella'][recall]:levels[phase].id}),signal:controller.signal});if(!res.ok)throw Error('turn');const out=await res.json();if(g!==generation||p!==phase)return;busy=false;if(out.accepted&&['apple','blanket','umbrella'].includes(out.item)){await accept(out.item,choices.querySelector(`[data-item="${out.item}"]`),true);}else{say(levels[phase].say);demo();}}
    catch{if(g===generation&&p===phase){busy=false;say('Let’s use the pictures.');$('#mode').textContent='连接未完成 · 可用图片继续';demo();}}
    finally{clearTimeout(timer);if(g===generation){busy=false;controls();}}
  };try{r.start();}catch{recognition=null;say('Let’s use the pictures.');demo();}};
$('#parent').onclick=()=>{$('#report').textContent=`本次获得认可的语音回答：${voiceCount} 次。${phase===4?'图片故事已完成。':'故事尚未完成。'}`;$('#parent-dialog').showModal();};$('#close-parent').onclick=()=>$('#parent-dialog').close();
render();
