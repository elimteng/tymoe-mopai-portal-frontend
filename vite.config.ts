import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Item Management 代理 - 指向本地服务 (必须在 /api 之前)
      '/api/item-manage': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      // Order Service 代理 - 小票模板等订单相关API
      '/api/order': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Order API Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Order API Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // API代理 - 只匹配非 item-manage 的请求
      '^/api/(?!item-manage)': {
        target: 'https://tymoe.com',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Sending API Request to Target:', req.method, req.url);
            console.log('🎯 Target URL:', `https://tymoe.com${req.url}`);
            
            // 修改 Origin 头部以通过 CORS 检查
            proxyReq.setHeader('origin', 'https://tymoe.com');
            proxyReq.setHeader('referer', 'https://tymoe.com/');
            
            // 对于注册和登录请求，强制移除 Cookie 头部
            if (req.url?.includes('/identity/register') || req.url?.includes('/identity/login')) {
              const requestType = req.url.includes('/register') ? 'registration' : 'login'
              console.log(`🧹 Proxy: Removing cookies from ${requestType} request`);
              proxyReq.removeHeader('cookie');
              proxyReq.removeHeader('Cookie');
              proxyReq.removeHeader('authorization');
              proxyReq.removeHeader('Authorization');
            }
            
            console.log('📋 Request Headers (after modification):', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Received API Response:', proxyRes.statusCode, req.url);
            if (proxyRes.statusCode >= 400) {
              console.log('❌ Error response detected for:', req.url);
            }
          });
        }
      },
      // OAuth代理
      '/oauth': {
        target: 'https://tymoe.com',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 OAuth Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Sending OAuth Request to Target:', req.method, req.url);
            console.log('🎯 Target URL:', `https://tymoe.com${req.url}`);
            
            // 修改 Origin 头部以通过 CORS 检查
            proxyReq.setHeader('origin', 'https://tymoe.com');
            proxyReq.setHeader('referer', 'https://tymoe.com/');
            
            console.log('📋 OAuth Request Headers:', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Received OAuth Response:', proxyRes.statusCode, req.url);
            if (proxyRes.statusCode >= 400) {
              console.log('❌ OAuth Error response detected for:', req.url);
            }
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    // 直接定义环境变量
    'import.meta.env.VITE_API_BASE': JSON.stringify('/api/auth-service/v1'),
    'import.meta.env.VITE_AUTH_BASE': JSON.stringify(''),
    'import.meta.env.VITE_AUTH_DISABLED': JSON.stringify('false'),
    'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify('0x4AAAAAAB2ATX6Vry7IHSDD'),
    // Item Management 指向代理服务
    'import.meta.env.VITE_ITEM_MANAGE_BASE': JSON.stringify('/api/item-manage/v1'),
    // Order Service 指向代理服务
    'import.meta.env.VITE_ORDER_API_BASE': JSON.stringify('/api/order/v1'),
    // Mapbox API Token - 从环境变量加载
    'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN || ''),
  }
  }
})
