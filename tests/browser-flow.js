async page => {
 // Simulated recognition callbacks; real UI, audio playback and /api/turn decisions.
 await page.addInitScript(()=>{
  class Recognition{start(){this.onstart?.();setTimeout(()=>{if(document.body.dataset.testError==='yes')this.onerror?.({error:'no-speech'});else this.onresult?.({results:[[{transcript:document.body.dataset.testSpeech||''}]]});this.onend?.();},50);}abort(){this.onend?.();}}
  Object.defineProperty(window,'SpeechRecognition',{value:Recognition,configurable:true});
 });
 await page.reload();await page.locator('#start').click();
 const waitTurn=()=>page.waitForFunction(()=>!document.querySelector('#mic').disabled);
 const speak=async text=>{await waitTurn();await page.evaluate(t=>document.body.dataset.testSpeech=t,text);await page.locator('#mic').click();};
 await waitTurn();
 await page.getByRole('button',{name:'apple',exact:true}).click();await page.locator('#destination').dblclick();await waitTurn();
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('click bypass');
 await page.evaluate(()=>document.body.dataset.testError='yes');await page.locator('#mic').click();await page.waitForFunction(()=>document.querySelector('#caption').textContent.includes('没听清'));
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('silence bypass');
 await page.evaluate(()=>document.body.dataset.testError='no');
 const rejected=page.waitForResponse(r=>r.url().endsWith('/api/turn'));await speak('umbrella');await rejected;await waitTurn();
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('wrong speech bypass');
 for(const [word,next] of [['apple','blanket'],['blanket','umbrella'],['umbrella','recall']]){
  await speak(word);await page.waitForFunction(p=>document.querySelector('#scene').dataset.phase===p,next);
 }
 for(const [i,word] of ['apple','blanket','umbrella'].entries()){
  await speak(word);if(i<2)await page.waitForFunction(n=>document.querySelectorAll('.recalled').length===n,i+1);
 }
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 await page.locator('#parent').click();const report=await page.locator('#report').textContent();
 if(!report.includes('跟读 3 次')||!report.includes('看图说 3 次')||!report.includes('家长协助 0 次'))throw Error(report);
 await page.locator('#close-parent').click();await page.locator('#restart').click();await waitTurn();
 await page.locator('#parent').click();await page.locator('#assist').click();
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='blanket');
 await page.locator('#parent').click();const assistance=await page.locator('#report').textContent();
 if(!assistance.includes('跟读 0 次')||!assistance.includes('看图说 0 次')||!assistance.includes('家长协助 1 次'))throw Error('assistance counted as speaking');
 await page.locator('#close-parent').click();
 return {clickBypassBlocked:true,silenceBlocked:true,wrongSpeechBlocked:true,spokenStoryActions:true,echo:3,picture:3,assistanceSeparate:true,realMicrophone:'not tested'};
}
