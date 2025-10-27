// Test script để lấy IP của máy bạn
// Chạy: node test-get-ip.js

const https = require('https');

console.log('🔍 Đang lấy IP public của máy bạn...\n');

// Thử nhiều service khác nhau
const services = [
  { name: 'ipify.org', url: 'https://api.ipify.org?format=json' },
  { name: 'ipapi.co', url: 'https://ipapi.co/json/' },
  { name: 'ip-api.com', url: 'http://ip-api.com/json/' }
];

async function getIP(service) {
  return new Promise((resolve) => {
    const protocol = service.url.startsWith('https') ? https : require('http');
    
    protocol.get(service.url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ service: service.name, data: json });
        } catch (e) {
          resolve({ service: service.name, error: 'Parse error' });
        }
      });
    }).on('error', (err) => {
      resolve({ service: service.name, error: err.message });
    });
  });
}

async function main() {
  for (const service of services) {
    const result = await getIP(service);
    
    if (result.error) {
      console.log(`❌ ${result.service}: ${result.error}`);
    } else {
      console.log(`✅ ${result.service}:`);
      console.log(JSON.stringify(result.data, null, 2));
      console.log('');
      
      // Lấy IP từ response
      const ip = result.data.ip || result.data.query;
      if (ip) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 IP CỦA BẠN:', ip);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 COPY IP NÀY VÀ THÊM VÀO allowedIPs:');
        console.log(`    "${ip}",`);
        console.log('');
        break;
      }
    }
  }
}

main();
