async page => {
 await page.addInitScript(()=>{Object.defineProperty(window,'SpeechRecognition',{value:undefined,configurable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});});
 await page.reload();await page.getByRole('button',{name:'开始野餐',exact:true}).click();
 await page.locator('#mic').click();
 if(!(await page.locator('#mode').textContent()).includes('没有语音识别'))throw Error('no speech fallback');
 const a=await page.getByRole('button',{name:'apple',exact:true}).boundingBox(),z=await page.locator('#destination').boundingBox();
 await page.mouse.move(a.x+30,a.y+30);await page.mouse.down();await page.mouse.move(z.x+40,z.y+40,{steps:12});await page.mouse.up();
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='blanket');
 for(const [item,next] of [['blanket','umbrella'],['umbrella','recall']]){await page.getByRole('button',{name:item,exact:true}).click();await page.locator('#destination').click();await page.waitForFunction(p=>document.querySelector('#scene').dataset.phase===p,next);}
 for(const [i,item] of ['apple','blanket','umbrella'].entries()){await page.getByRole('button',{name:item,exact:true}).click();if(i<2)await page.waitForFunction(n=>document.querySelectorAll('.recalled').length===n,i+1);}
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 await page.waitForTimeout(1200);
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'picnic-complete.png'});
 await page.locator('#restart').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1300);await page.screenshot({path:'picnic-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'picnic-desktop.png'});
 return {drag:'passed',mobileComplete:'passed',noSpeechComplete:'passed'};
}
