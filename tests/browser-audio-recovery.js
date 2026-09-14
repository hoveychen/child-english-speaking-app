async page => {
 await page.addInitScript(()=>{const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(document.body.dataset.blockAudio==='yes')return Promise.reject(new DOMException('blocked for test','NotAllowedError'));return original.call(this);};});
 await page.goto('http://127.0.0.1:3187');
 await page.evaluate(()=>document.body.dataset.blockAudio='yes');await page.locator('#start').click();
 await page.waitForFunction(()=>document.querySelector('#narration').dataset.state==='blocked');
 if(!await page.locator('#replay').evaluate(e=>e.classList.contains('audio-retry')))throw Error('failure hidden');
 await page.evaluate(()=>document.body.dataset.blockAudio='no');await page.locator('#replay').click();
 await page.waitForFunction(()=>document.querySelector('#narration').dataset.state==='playing'&&document.querySelector('#narration').currentTime>.3);
 return {blockedPlaybackVisible:'passed',retryPlaysRealAudio:'passed'};
}
