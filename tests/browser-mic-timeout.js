async page => {
 await page.addInitScript(()=>{class SilentRecognition{start(){this.onstart?.()}abort(){this.onend?.()}}Object.defineProperty(window,'SpeechRecognition',{value:SilentRecognition,configurable:true})});
 await page.goto('https://child-english.muveeai.com');await page.locator('#start').click();
 await page.waitForFunction(()=>!document.querySelector('#mic').disabled);await page.locator('#mic').click();
 await page.waitForFunction(()=>document.querySelector('#caption').textContent.includes('小熊还在等你说'),{timeout:10000});
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('silent recognition advanced');
 return {timeoutVisible:true,noAdvance:true,recoveryModel:'scheduled'};
}
