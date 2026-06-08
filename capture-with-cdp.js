/**
 * Capture screenshots from the browser via CDP and save as PNG
 * Uses the page WebSocket URL
 */
const WebSocket = require('D:\\deepclaw\\node-win-x64\\node_modules\\openclaw\\node_modules\\ws');
const fs = require('fs');
const path = require('path');

const TARGET_ID = '10414E6672322CE57F2A5C28DE850F3E';
const WS_URL = `ws://127.0.0.1:18800/devtools/page/${TARGET_ID}`;
const OUT_DIR = path.join(__dirname, '营销资料', 'screenshots');

// Ensure output dir exists
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGE_NAVIGATIONS = {
  home:    "navigate('home')",
  diary:   "navigate('diary')",
  recipes: "navigate('recipes')",
  solar:   "navigate('solar')",
  profile: "navigate('profile')",
  constitution: "navigate('constitution')",
  articles: "navigate('articles')",
  shop:    "navigate('shop')",
  ai:      "navigate('ai')",
};

const pages = Object.keys(PAGE_NAVIGATIONS);
let currentPageIdx = 0;
let msgId = 100;

const ws = new WebSocket(WS_URL);

function send(method, params) {
  const id = msgId++;
  ws.send(JSON.stringify({ id, method, params }));
  return id;
}

// Command queue to handle async CDP communication
let pendingResolve = null;
let pendingId = null;

ws.on('open', async () => {
  console.log('Connected to page CDP');
  
  // First, enable Page domain
  send('Page.enable');
  send('Runtime.enable');
  
  // Wait a moment then start capturing
  setTimeout(captureNext, 1000);
});

ws.on('message', async (data) => {
  const msg = JSON.parse(data.toString());
  
  // Handle screenshot result
  if (msg.id && msg.result && msg.result.data) {
    const pageName = pages[currentPageIdx - 1];
    const buf = Buffer.from(msg.result.data, 'base64');
    const filePath = path.join(OUT_DIR, `${pageName}.png`);
    fs.writeFileSync(filePath, buf);
    console.log(`✓ Captured ${pageName}.png (${(buf.length/1024).toFixed(0)}KB)`);
    
    // Navigate to next page
    setTimeout(captureNext, 1500);
  }
  
  // Handle evaluate result
  if (msg.id && msg.result && msg.result.result) {
    const val = msg.result.result.value;
    if (val === 'navigated') {
      // Wait for page to render, then screenshot
      setTimeout(() => {
        send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      }, 2500 - 500); // shorter wait since we waited before
    }
  }
});

function captureNext() {
  if (currentPageIdx >= pages.length) {
    console.log('\n✅ All screenshots captured!');
    ws.close();
    return;
  }
  
  const pageName = pages[currentPageIdx];
  const navCode = PAGE_NAVIGATIONS[pageName];
  console.log(`\n[${currentPageIdx + 1}/${pages.length}] Capturing ${pageName}...`);
  
  currentPageIdx++;
  
  // Execute navigation via Runtime.evaluate
  const expr = `(function(){ try { ${navCode}; return 'navigated'; } catch(e) { return e.message; } })()`;
  send('Runtime.evaluate', { expression: expr, returnByValue: true });
}

ws.on('error', (e) => {
  console.error('WebSocket error:', e.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('Disconnected');
  process.exit(0);
});

// Timeout fallback
setTimeout(() => {
  console.log('Timeout - exiting');
  process.exit(1);
}, 60000);
