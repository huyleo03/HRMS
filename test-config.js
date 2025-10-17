#!/usr/bin/env node

/**
 * Test script để verify cấu hình Frontend/Backend
 * Chạy: node test-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Kiểm tra cấu hình HRMS...\n');

// Màu sắc cho console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const checkFile = (filePath, checks) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.red}❌ File không tồn tại: ${filePath}${colors.reset}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allPassed = true;

  checks.forEach(check => {
    const found = check.pattern.test(content);
    if (found) {
      console.log(`${colors.green}✅ ${check.name}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ ${check.name}${colors.reset}`);
      if (check.hint) {
        console.log(`   ${colors.yellow}💡 ${check.hint}${colors.reset}`);
      }
      allPassed = false;
    }
  });

  return allPassed;
};

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}📦 FRONTEND CHECKS${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Check Frontend .env
checkFile('Frontend/.env', [
  {
    name: 'REACT_APP_API_BASE_URL tồn tại',
    pattern: /REACT_APP_API_BASE_URL=/
  },
  {
    name: 'Có localhost URL cho development',
    pattern: /REACT_APP_API_BASE_URL=http:\/\/localhost:9999/
  }
]);

console.log('');

// Check Frontend .env.production
checkFile('Frontend/.env.production', [
  {
    name: '.env.production có REACT_APP_API_BASE_URL',
    pattern: /REACT_APP_API_BASE_URL=/
  },
  {
    name: 'Có Render URL cho production',
    pattern: /REACT_APP_API_BASE_URL=https:\/\/hrms-1-2h7w\.onrender\.com/,
    hint: 'Cần có URL Render backend'
  }
]);

console.log('');

// Check api.js
checkFile('Frontend/src/service/api.js', [
  {
    name: 'api.js dùng process.env.REACT_APP_API_BASE_URL',
    pattern: /process\.env\.REACT_APP_API_BASE_URL/
  },
  {
    name: 'Có fallback về localhost',
    pattern: /\|\|\s*["']http:\/\/localhost:9999["']/
  }
]);

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}🔧 BACKEND CHECKS${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Check Backend .env
checkFile('Backend/.env', [
  {
    name: 'CLIENT_URL tồn tại',
    pattern: /CLIENT_URL=/
  },
  {
    name: 'Có localhost và Render URLs',
    pattern: /CLIENT_URL=.*localhost.*hrms.*onrender\.com/,
    hint: 'Nên có cả 2: http://localhost:3000,https://hrms-3-pp3h.onrender.com'
  }
]);

console.log('');

// Check Backend app.js
checkFile('Backend/app.js', [
  {
    name: 'CORS được cấu hình với origin function',
    pattern: /origin:\s*function\s*\(/
  },
  {
    name: 'Có xử lý allowedOrigins',
    pattern: /allowedOrigins/
  },
  {
    name: 'Có app.options cho preflight',
    pattern: /app\.options\(\s*['*"]/
  },
  {
    name: 'Credentials: true',
    pattern: /credentials:\s*true/
  }
]);

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}📝 GIT SECURITY CHECKS${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Check .gitignore
checkFile('.gitignore', [
  {
    name: '.env files được ignore',
    pattern: /^\.env/m
  }
]);

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}✨ Kiểm tra hoàn tất!${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log(`${colors.yellow}📖 Hướng dẫn tiếp theo:${colors.reset}`);
console.log(`   1. Chạy local: npm start (Frontend & Backend)`);
console.log(`   2. Deploy lên Render: Đọc RENDER_DEPLOY_GUIDE.md`);
console.log(`   3. Test production: https://hrms-3-pp3h.onrender.com\n`);
