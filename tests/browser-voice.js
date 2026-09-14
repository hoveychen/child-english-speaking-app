async page => {
 await page.addInitScript(()=>{class FakeRecognition{start(){this.onstart?.();setTimeout(()=>{this.onresult?.({results:[[{transcript:document.body.dataset.testSpeech||'apple'}]]});this.onend?.();},20);}abort(){this.onend?.();}}Object.defineProperty(window,'SpeechRecognition',{value:FakeRecognition,configurable:true});});
 await page.reload();await page.locator('#start').click();
 await page.evaluate(()=>document.body.dataset.testSpeech='umbrella');await page.locator('#mic').click();
 await page.waitForFunction(()=>!document.querySelector('#mic').disabled);
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('wrong spoken item advanced');
 await page.evaluate(()=>document.body.dataset.testSpeech='apple');await page.locator('#mic').click();
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='blanket');
 await page.route('**/api/turn',route=>route.abort());await page.locator('#mic').click();
 await page.waitForFunction(()=>document.querySelector('#mode').textContent.includes('连接未完成'));
 await page.getByRole('button',{name:'blanket',exact:true}).click();await page.locator('#destination').click();
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='umbrella');
 await page.locator('#parent').click();
 if(!(await page.locator('#report').textContent()).includes('1 次'))throw Error('speech count incorrect');
 await page.locator('#close-parent').click();await page.unroute('**/api/turn');
 return {simulatedRecognition:'passed',wrongSpeechBlocked:'passed',apiFailureRecovery:'passed',speechCount:'passed',realMicrophone:'not tested'};
}
