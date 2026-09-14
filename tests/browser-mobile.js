async page => {
 await page.addInitScript(()=>{Object.defineProperty(window,'SpeechRecognition',{value:undefined,configurable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});});
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#start').click();
 await page.waitForFunction(()=>!document.querySelector('#mic').disabled);
 const a=await page.getByRole('button',{name:'apple',exact:true}).boundingBox(),z=await page.locator('#destination').boundingBox();
 await page.mouse.move(a.x+30,a.y+30);await page.mouse.down();await page.mouse.move(z.x+40,z.y+40,{steps:12});await page.mouse.up();
 await page.waitForFunction(()=>!document.querySelector('#mic').disabled);
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('drag bypass');
 await page.locator('#mic').click();
 if(!(await page.locator('#caption').textContent()).includes('不可用'))throw Error('unsupported recognition hidden');
 if(await page.locator('#scene').getAttribute('data-phase')!=='apple')throw Error('unsupported speech bypass');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('overflow');
 await page.screenshot({path:'speaking-mobile.png',fullPage:true});
 return {dragBypassBlocked:true,unsupportedRecognitionVisible:true,noAutomaticAdvance:true,mobileOverflow:false};
}
