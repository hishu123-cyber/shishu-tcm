/**
 * Capture HD screenshots via CDP - 2x resolution for clarity
 */
const WebSocket = require('D:\\deepclaw\\node-win-x64\\node_modules\\openclaw\\node_modules\\ws');
const fs = require('fs');
const path = require('path');

const TARGET_ID = 'A1282E34E5332704E9CECBBC2A0EE49B';
const WS_URL = `ws://127.0.0.1:18800/devtools/page/${TARGET_ID}`;
const OUT_DIR = path.join(__dirname, '营销资料', 'screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = ['home','diary','recipes','solar','profile','constitution','articles','shop','ai'];
let currentIdx = 0;
let msgId = 1000;
let resolveNext = null;

const ws = new WebSocket(WS_URL);

function send(m, p) {
  const id = msgId++;
  ws.send(JSON.stringify({id,method:m,params:p||{}}));
  return id;
}

ws.on('open', () => {
  console.log('Connected');
  send('Page.enable');
  send('Runtime.enable');
  setTimeout(captureNext, 1500);
});

ws.on('message', data => {
  const msg = JSON.parse(data.toString());
  
  // Screenshot result
  if (msg.id && msg.result && msg.result.data) {
    const buf = Buffer.from(msg.result.data, 'base64');
    const pageName = PAGES[currentIdx - 1];
    const filePath = path.join(OUT_DIR, `${pageName}.png`);
    fs.writeFileSync(filePath, buf);
    console.log(`✓ ${pageName}.png  ${(buf.length/1024).toFixed(0)}KB  ${msg.result.data.length}chars base64`);
    
    if (currentIdx < PAGES.length) {
      setTimeout(captureNext, 2000);
    } else {
      console.log('\n✅ ALL DONE');
      ws.close();
    }
  }
  
  // Evaluate result (navigation success)
  if (msg.id && msg.result && msg.result.result) {
    const val = msg.result.result.value;
    if (val === 'navigated') {
      setTimeout(() => {
        send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      }, 2500);
    } else if (val && val.includes('started')) {
      // For AI page - it needs extra time
      setTimeout(() => {
        send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      }, 3500);
    }
  }
});

function captureNext() {
  if (currentIdx >= PAGES.length) return;
  
  const pageName = PAGES[currentIdx];
  currentIdx++;
  
  let navCode;
  if (pageName === 'home') navCode = "navigate('home')";
  else if (pageName === 'diary') navCode = "navigate('diary')";
  else if (pageName === 'recipes') navCode = "navigate('recipes')";
  else if (pageName === 'solar') navCode = "navigate('solar')";
  else if (pageName === 'profile') navCode = "navigate('profile')";
  else if (pageName === 'constitution') navCode = "navigate('constitution')";
  else if (pageName === 'articles') navCode = "navigate('articles')";
  else if (pageName === 'shop') navCode = "navigate('shop')";
  else if (pageName === 'ai') navCode = "navigate('ai')";
  
  console.log(`[${currentIdx}/${PAGES.length}] ${pageName}...`);
  send('Runtime.evaluate', {
    expression: `(function(){try{${navCode};return'navigated'}catch(e){return e.message}})()`,
    returnByValue: true
  });
}

ws.on('error', e => { console.error('Error:', e.message); process.exit(1); });
ws.on('close', () => { console.log('Disconnected'); process.exit(0); });

setTimeout(() => { console.log('Timeout'); process.exit(1); }, 90000);
