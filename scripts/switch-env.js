#!/usr/bin/env node
/**
 * 环境切换脚本 (ES Module)
 * 用途：快速切换开发环境和生产环境的 API 配置
 *
 * 使用方法：
 *   npm run dev:local   - 使用本地 localhost API (3000, 3001, 3002, 3004)
 *   npm run dev:prod    - 使用生产域名 API (tymoe.com)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envMode = process.argv[2] || 'local';
const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envLocalDevPath = path.join(projectRoot, '.env.local-dev');
const envLocalProdPath = path.join(projectRoot, '.env.local-prod');

try {
  const envContent = envMode === 'local'
    ? fs.readFileSync(envLocalDevPath, 'utf8')
    : fs.readFileSync(envLocalProdPath, 'utf8');

  // 写入 .env.local
  fs.writeFileSync(envLocalPath, envContent);

  // 获取 API 基础 URL
  const apiBase = envContent
    .split('\n')
    .find(line => line.startsWith('VITE_API_BASE='))
    ?.split('=')[1]
    ?.replace(/"/g, '') || 'unknown';

  const itemManageBase = envContent
    .split('\n')
    .find(line => line.startsWith('VITE_ITEM_MANAGE_BASE='))
    ?.split('=')[1]
    ?.replace(/"/g, '') || 'unknown';

  const orderApiBase = envContent
    .split('\n')
    .find(line => line.startsWith('VITE_ORDER_API_BASE='))
    ?.split('=')[1]
    ?.replace(/"/g, '') || 'unknown';

  console.log('\n' + '='.repeat(60));
  console.log(`✅ 已切换到 ${envMode === 'local' ? '本地开发' : '生产'} 环境`);
  console.log('='.repeat(60));
  console.log('\n📌 API 服务地址:');
  console.log(`  • 认证服务:  ${apiBase}`);
  console.log(`  • 商品管理:  ${itemManageBase}`);
  console.log(`  • 订单服务:  ${orderApiBase}`);
  console.log('\n💡 确保相关的本地服务已启动！');
  console.log('='.repeat(60) + '\n');
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
