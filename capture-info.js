// Screenshot capture script
// Run with: node capture-screenshots.js
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const start = Date.now();

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// Get all page HTML at once - SPA so we need JS execution
// Instead, let's generate the complete video HTML page directly

const pages = [
  { id: 'home', label: '首页' },
  { id: 'diary', label: '健康日记' },
  { id: 'recipes', label: '食疗菜谱' },
  { id: 'solar', label: '二十四节气' },
  { id: 'profile', label: '个人中心' },
  { id: 'constitution', label: '体质测评' },
  { id: 'articles', label: '养生文章' },
  { id: 'shop', label: '商城' },
  { id: 'ai', label: 'AI助手' },
];

console.log('Available pages:', pages.map(p => p.id + '(' + p.label + ')').join(', '));
console.log('Time:', (Date.now() - start) + 'ms');
