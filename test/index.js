let Template = (
    url
) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
           <title>Test session</title>
        </head>
        <body>
           <h1>Running</h1>
           <pre>${url}</pre>
        </body>
      </html>
    `;
}

 
/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
 
exports.testsession = (req, res) => {
    
  const puppeteer = require('puppeteer');
  const escapeHtml = require('escape-html');
  const shortid = require('shortid');
  console.log("asdf");
  
  var wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function addLogging(page){
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
      .on('pageerror', ({ message }) => console.log(message))
      .on('response', response =>
        console.log(`${response.status()} ${response.url()}`))
      .on('requestfailed', request =>
        console.log(`${request.failure().errorText} ${request.url()}`))
  }
  function run (arg) {
      return new Promise(async (resolve, reject) => {
          try {
              console.log("open browser")
              const browser = await puppeteer.launch({args: ['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
              const page = await browser.newPage();
              await page.setViewport({
                  width: 1024,
                  height: 768,
                  deviceScaleFactor: 1,
              });
              
              /*
              console.log("goto page")
              await page.goto('https://echovroom.live/#/' + arg);  
              console.log("wait for login")
              await page.waitFor('#username')
              await page.type('#username', 'user_' + shortid.generate())
              console.log("login")
              await page.click('#login');
              */
              
              console.log("load page")
              await page.goto('https://echovroom.live/#/' + arg); 
              console.log("wait for login")
              await page.click('.enter');
              await page.click('#login');
              await page.waitFor('#username')
              await page.type('#username', shortid.generate() + String.fromCharCode(13))  
              console.log("login")
              
              console.log("wait for publisher/s to appear")
              await page.waitFor('.publisher')
              
              console.log('wait a bit');
              await wait(1000 + Math.random() * 5000);  
              await page.type('.msg_editor input', 'hello')
              await page.click('a[title="send"]');
              
              
              await wait(50000);  
              console.log("close")
              await browser.close();
              resolve("Done");
          } catch (e) {
              return reject(e);
          }
      })
  }

  var arg = escapeHtml(req.query.arg || req.body.arg)
  console.log("arg = "+arg);

  run(arg)
  .then(message => {
    console.log("Ran test " + message);
    res.set('Content-Type', 'text/html');
    res.status(200).send(Template(message));
  })
  .catch(err => {
      console.error(err);
      res.status(500).send("An Error occured" + err);  
    })
  
};


exports.testmodern = (req, res) => {
    
  const puppeteer = require('puppeteer');
  const escapeHtml = require('escape-html');
  const shortid = require('shortid');
  const LoremIpsum = require("lorem-ipsum").LoremIpsum;
  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
  });
  
  console.log("asdf");
  
  var wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function addLogging(page){
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
      .on('pageerror', ({ message }) => console.log(message))
      .on('response', response =>
        console.log(`${response.status()} ${response.url()}`))
      .on('requestfailed', request =>
        console.log(`${request.failure().errorText} ${request.url()}`))
  }
  function run (arg) {
      return new Promise(async (resolve, reject) => {
          try {
              console.log("open browser")
              const browser = await puppeteer.launch({args: ['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
              const page = await browser.newPage();
              await page.setViewport({
                  width: 1024,
                  height: 768,
                  deviceScaleFactor: 1,
              });
              
              /*
              console.log("goto page")
              await page.goto('https://echovroom.live/#/' + arg);  
              console.log("wait for login")
              await page.waitFor('#username')
              await page.type('#username', 'user_' + shortid.generate())
              console.log("login")
              await page.click('#login');
              */
              
              console.log("load page")
              await page.goto('https://echovroom.live/#/text/wienmodern'); 
               
              await page.waitFor('#username')
              await page.type('#username', shortid.generate() + String.fromCharCode(13))  
              console.log("login")
              await page.click('#login');
              
              await page.waitFor('.msg_editor input')
              for(var i=1; i<10; i++) {
                console.log('wait a bit');
                await wait(2000 + Math.random() * 20000);  
                console.log('send a random message');
                await page.type('.msg_editor input', lorem.generateSentences(5))
                await page.click('a[title="send"]');
              }
              
              console.log("lurk around a bit more")
              await wait(30000);  
              
              console.log("close")
              await browser.close();
              resolve("Done");
          } catch (e) {
              return reject(e);
          }
      })
  }

  var arg = escapeHtml(req.query.arg || req.body.arg)
  console.log("arg = "+arg);

  run(arg)
  .then(message => {
    console.log("Ran test " + message);
    res.set('Content-Type', 'text/html');
    res.status(200).send(Template(message));
  })
  .catch(err => {
      console.error(err);
      res.status(500).send("An Error occured" + err);  
    })
  
};

