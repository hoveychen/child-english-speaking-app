async page => {
 await page.reload();
 const results=await page.evaluate(async()=>{
  const catalog=await fetch('/audio/catalog.json').then(r=>r.json());const ctx=new AudioContext();const result=[];
  for(const [text,clip] of Object.entries(catalog)){const res=await fetch(clip.url);if(!res.ok)throw Error('missing '+clip.url);const audio=await ctx.decodeAudioData(await res.arrayBuffer());const data=audio.getChannelData(0);let energy=0;for(const n of data)energy+=n*n;const rms=Math.sqrt(energy/data.length);if(rms<.001)throw Error('silent '+text);result.push({text,duration:audio.duration,rms});}
  await ctx.close();return result;
 });
 await page.locator('#start').click();
 await page.waitForFunction(()=>{const a=document.querySelector('#narration');return a.dataset.state==='playing'&&a.currentTime>.35&&!a.muted&&a.volume>0;});
 await page.waitForFunction(()=>document.querySelector('#narration').dataset.state==='ended');
 await page.locator('#replay').click();await page.waitForFunction(()=>document.querySelector('#narration').dataset.state==='playing');
 await page.locator('#parent').click();await page.locator('#assist').click();
 await page.waitForFunction(()=>document.querySelector('#narration').dataset.text==='Yum! The apple is in the basket.'&&document.querySelector('#narration').currentTime>.5);
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('advanced before feedback ended');
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='blanket');
 await page.waitForFunction(()=>document.querySelector('#narration').dataset.state==='playing');
 return {decodedNonSilentClips:results.length,startPlayback:'passed',replay:'passed',feedbackNotTruncated:'passed',nextStagePlayback:'passed',hardwareSpeaker:'not measured'};
}
