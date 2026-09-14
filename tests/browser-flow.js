async page => {
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const phase=()=>page.locator('#scene').getAttribute('data-phase');
 await page.getByRole('button',{name:'boot',exact:true}).click();
 await page.locator('#destination').click();
 assert(await phase()==='apple','wrong choice advanced');
 for(const [item,next] of [['apple','blanket'],['blanket','umbrella'],['umbrella','recall']]){
  await page.getByRole('button',{name:item,exact:true}).click();
  await page.locator('#destination').dblclick();
  await page.waitForFunction(p=>document.querySelector('#scene').dataset.phase===p,next);
 }
 await page.getByRole('button',{name:'umbrella',exact:true}).click();
 assert(await page.locator('.recalled').count()===0,'wrong recall accepted');
 for(const [i,item] of ['apple','blanket','umbrella'].entries()){
  await page.getByRole('button',{name:item,exact:true}).click();
  if(i<2)await page.waitForFunction(n=>document.querySelectorAll('.recalled').length===n,i+1);
 }
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 assert(await page.locator('#celebration').isVisible(),'no reward');
 assert((await page.locator('#mode').textContent()).includes('尚未练习语音'),'claimed speaking without speaking');
 await page.screenshot({path:'picnic-complete.png'});
 await page.getByRole('button',{name:'再玩一次',exact:true}).click();
 assert(await phase()==='apple','restart failed');
 assert(await page.locator('#packed svg').count()===0,'stale inventory');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'picnic-mobile.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
 return {wrongChoice:'passed',doubleClick:'passed',fourStages:'passed',recallOrder:'passed',honestSpeechReport:'passed',restart:'passed',mobileOverflow:'passed'};
}
