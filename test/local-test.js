const puppeteer = require('puppeteer');
const shortid = require('shortid');
 var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
 
(async () => {
  console.log("open browser")
  const browser = await puppeteer.launch({args: ['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const page = await browser.newPage();
  await page.setViewport({
      width: 1280,
      height: 968,
      deviceScaleFactor: 1,
  });
  console.log("load page")
  await page.goto('http://localhost:8080/#/test');  
  console.log("wait for login")
  await page.waitFor('#username')
  await page.type('#username', shortid.generate())  
  console.log("login")
  await page.click('#login');
  console.log("wait for publisher/s to appear")
  await page.waitFor('.publisher')
  console.log('wait a bit');
  await wait(1000 + Math.random() * 5000);  
  await page.type('.msg_editor input', 'hello')
  await page.click('a[title="send"]');
  console.log("do screenshot")
  await page.screenshot({path: 'example.png'});
  await wait(50000);  
  console.log("close")
  await browser.close();
})();
