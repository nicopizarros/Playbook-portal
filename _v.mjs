import { chromium } from 'playwright';
const b=await chromium.launch();
for(const [n,w,h] of [['desk',1440,1000],['mob',390,844]]){
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2});
  const p=await c.newPage();
  await p.goto('http://localhost:3100/coberturas/lfa',{waitUntil:'networkidle'});
  await p.evaluate(()=>{for(const el of document.querySelectorAll('div,section,aside')){if(/Usamos cookies/.test(el.textContent||'')&&el.children.length<8)el.remove();}});
  await p.waitForTimeout(900);
  await p.screenshot({path:`/tmp/shots/K-${n}.png`,fullPage:true});
  await c.close();
}
await b.close(); console.log('shots done');
