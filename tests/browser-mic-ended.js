async page => {
 await page.addInitScript(()=>{class EndedRecognition{start(){this.onstart?.();setTimeout(()=>this.onend?.(),30)}abort(){this.onend?.()}}Object.defineProperty(window,'SpeechRecognition',{value:EndedRecognition,configurable:true})});
 await page.goto('https://child-english.muveeai.com');await page.locator('#start').click();await page.waitForFunction(()=>!document.querySelector('#mic').disabled);await page.locator('#mic').click();
 await page.waitForFunction(()=>document.querySelector('#caption').textContent.includes('小熊还在等你说'),{timeout:4000});
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('ended without result advanced');
 return {endedWithoutResultVisible:true,noAdvance:true,retryModelScheduled:true};
}
