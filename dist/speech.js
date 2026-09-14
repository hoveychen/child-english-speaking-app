'use strict';
(() => {
 const player=document.querySelector('#narration');
 const catalog=window.PICNIC_AUDIO;
 let sequence=0, settle=null;
 const replay=document.querySelector('#replay');
 function state(value){player.dataset.state=value;replay.classList.toggle('audio-retry',value==='blocked'||value==='error');}
 function stop(){sequence++;player.pause();if(settle){settle(false);settle=null;}state('idle');}
 function play(text){
  stop();const token=sequence,clip=catalog[text];player.dataset.text=text;
  if(!clip){state('error');document.querySelector('#mode').textContent='这句声音未加载 · 请点喇叭重试';return Promise.resolve(false);}
  player.src=clip.url;state('loading');
  return new Promise(resolve=>{
   let finished=false;
   const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);if(token===sequence)settle=null;resolve(ok);};
   const fail=error=>{if(token!==sequence)return;state(error?.name==='NotAllowedError'?'blocked':'error');document.querySelector('#mode').textContent='声音未播放 · 请点喇叭再听一遍';finish(false);};
   settle=finish;
   // Measured clip duration controls the watchdog; it does not substitute for an ended event.
   const timer=setTimeout(()=>fail(new Error('audio timeout')),(clip.duration+10)*1000);
   player.onplaying=()=>{if(token===sequence){state('playing');document.querySelector('#mode').textContent='小熊正在说话';}};
   player.onended=()=>{if(token===sequence){state('ended');document.querySelector('#mode').textContent='看一看 · 动一动 · 说一说';finish(true);}};
   player.onerror=()=>fail(new Error('audio failed'));
   const promise=player.play();if(promise)promise.catch(fail);
  });
 }
 player.src=catalog["I'm hungry. Let's take an apple."].url;
 window.picnicSpeech={play,stop};
})();
