/**
 * Capture HD screenshot of home page with full data loaded
 * Uses longer wait time for API data
 */
const WebSocket = require('D:\\deepclaw\\node-win-x64\\node_modules\\openclaw\\node_modules\\ws');
const fs = require('fs');
const path = require('path');
const TARGET_ID = 'E97FCBE140800E3988FDB6AFA3733EC8';
const WS_URL = `ws://127.0.0.1:18800/devtools/page/${TARGET_ID}`;
const OUT_DIR = path.join(__dirname, '营销资料', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = ['home']; // Just capture home for now to test quality
let currentIdx = 0;
let msgId = 5000;
const ws = new WebSocket(WS_URL);

function send(m, p) { const id = msgId++; ws.send(JSON.stringify({id,method:m,params:p||{}})); return id; }

ws.on('open', () => {
  console.log('Connected');
  send('Page.enable');
  // Set viewport to mobile phone dimensions
  send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true
  });
  setTimeout(() => {
    // Navigate to home
    send('Runtime.evaluate', {
      expression: "(function(){try{navigate('home');return'ok'}catch(e){return e.message}})()",
      returnByValue: true
    });
  }, 1000);
});

ws.on('message', data => {
  const msg = JSON.parse(data.toString());
  
  if (msg.id && msg.result && msg.result.data) {
    const buf = Buffer.from(msg.result.data, 'base64');
    const filePath = path.join(OUT_DIR, 'home-hd.png');
    fs.writeFileSync(filePath, buf);
    console.log(`✅ Home HD: ${(buf.length/1024).toFixed(0)}KB (${buf.length} bytes)`);
    ws.close();
  }
  
  if (msg.id && msg.result && msg.result.result && msg.result.result.value === 'ok') {
    console.log('Navigated to home, waiting for data...');
    // Wait even longer for all API data to load
    setTimeout(() => {
      send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    }, 5000);
  }
});

ws.on('error', e => console.error('Error:', e.message));
ws.on('close', () => process.exit(0));
setTimeout(() => process.exit(1), 30000);
