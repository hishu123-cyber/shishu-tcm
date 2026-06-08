#!/usr/bin/env node
// 下载并解压 frp Windows 客户端
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORK_DIR = __dirname;
const HOST = '8.209.222.69';

async function main() {
  console.log('=== 下载 frp Windows 客户端 ===\n');
  
  // Download from GitHub release
  var url = 'https://github.com/fatedier/frp/releases/download/v0.60.0/frp_0.60.0_windows_amd64.zip';
  var zipPath = path.join(WORK_DIR, 'frp_win.zip');
  
  console.log('Downloading from GitHub...');
  await new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(zipPath);
    https.get(url, function(resp) {
      resp.pipe(file);
      file.on('finish', function() { file.close(); resolve(); });
    }).on('error', reject);
  });
  console.log('Downloaded (' + fs.statSync(zipPath).size + ' bytes)');
  
  // Extract using built-in Windows tar (Windows 10+ has it)
  console.log('Extracting with tar...');
  try {
    execSync('tar -xf "' + zipPath + '" -C "' + WORK_DIR + '"', { timeout: 10000, shell: 'cmd' });
    console.log('Extracted successfully');
    
    // Find frpc.exe
    var items = fs.readdirSync(WORK_DIR).filter(f => f.startsWith('frp_'));
    if (items.length > 0) {
      var frpDir = items[0];
      var frpcPath = path.join(WORK_DIR, frpDir, 'frpc.exe');
      if (fs.existsSync(frpcPath)) {
        // Copy to root
        fs.copyFileSync(frpcPath, path.join(WORK_DIR, 'frpc.exe'));
        console.log('frpc.exe ready');
        
        // Create config
        var config = `serverAddr = "${HOST}"
serverPort = 7000
auth.token = "wellness-tunnel-2026"

[[proxies]]
name = "wellness-web"
type = "http"
localPort = 8000
customDomains = ["shishu.xn--fiqs8s"]

[[proxies]]
name = "wellness-api"
type = "http"
localPort = 8000
customDomains = ["api.shishu.xn--fiqs8s"]
`;
        fs.writeFileSync(path.join(WORK_DIR, 'frpc.toml'), config);
        console.log('frpc.toml created');
        
        // Create batch file
        var bat = '@echo off\r\ntitle "体质养生 APP - FRP Tunnel"\r\ncd /d ' + WORK_DIR + '\r\necho Starting FRP client...\r\necho Server: ' + HOST + ':7000\r\nfrpc.exe -c frpc.toml\r\npause\r\n';
        fs.writeFileSync(path.join(WORK_DIR, 'start_frp.bat'), bat);
        console.log('start_frp.bat created');
        
        console.log('\n=== 就绪！接下来：===');
        console.log('1. 把 deploy_frp_server.sh 上传到服务器并运行');
        console.log('2. 阿里云安全组打开 7000/8080/7500 端口');
        console.log('3. 阿里云 DNS 添加 A 记录');
        console.log('4. 本机运行 start_frp.bat');
      }
    }
  } catch(e) {
    console.log('tar failed, trying PowerShell...');
    try {
      execSync('powershell -Command "Expand-Archive -Path \'' + zipPath + '\' -DestinationPath \'' + WORK_DIR + '\' -Force"', { timeout: 15000, shell: 'cmd' });
      console.log('Extracted with PowerShell');
    } catch(e2) {
      console.log('Extract failed:', e2.message);
      console.log('Please manually download and extract frp_0.60.0_windows_amd64.zip');
    }
  }
  
  // Cleanup
  try { fs.unlinkSync(zipPath); } catch(e) {}
}

main().catch(console.error);
