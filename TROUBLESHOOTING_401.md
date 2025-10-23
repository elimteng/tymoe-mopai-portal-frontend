# 401 未授权错误排查指南

## 问题描述

访问小票模板管理页面时，出现以下错误：
```
GET http://localhost:5173/api/order/v1/receipt-templates 401 (Unauthorized)
```

## 原因分析

这个错误表示订单服务返回了401未授权响应。可能的原因包括：

### 1. 后端订单服务未启动 ⭐ 最常见
- 订单服务需要在 `localhost:3002` 运行
- 如果服务未启动，代理请求会失败

### 2. 后端服务需要认证配置
- 订单服务可能需要配置认证中间件
- 需要验证JWT token的有效性

### 3. Token过期或无效
- 前端存储的access_token可能已过期
- 需要重新登录获取新token

### 4. 组织上下文缺失
- 某些API需要`X-Organization-Id`头
- 检查localStorage中是否有`organization_id`

## 快速诊断

### 方法1: 使用诊断脚本
```bash
chmod +x check-backend-services.sh
./check-backend-services.sh
```

### 方法2: 手动检查

#### 检查订单服务
```bash
curl http://localhost:3002/health
# 或
curl http://localhost:3002/api/order/v1/receipt-templates
```

#### 检查认证状态
打开浏览器控制台，执行：
```javascript
console.log('Token:', localStorage.getItem('access_token'))
console.log('Org ID:', localStorage.getItem('organization_id'))
```

#### 检查请求头
在浏览器Network标签中查看请求头：
- `Authorization: Bearer <token>` - 应该存在
- `X-Organization-Id: <org-id>` - 应该存在
- `X-Tenant-Id: <org-id>` - 应该存在

## 解决方案

### 方案1: 启动后端订单服务
```bash
# 假设订单服务在同级目录
cd ../order-service
npm install
npm run dev
```

### 方案2: 配置后端认证
如果后端服务需要认证，确保：
1. JWT密钥配置正确
2. 认证中间件已启用
3. Token验证逻辑正确

### 方案3: 重新登录
如果token过期：
1. 退出登录
2. 重新登录系统
3. 刷新页面

### 方案4: 临时禁用认证（仅开发环境）
如果后端服务支持，可以临时禁用认证：
```bash
# 在后端服务的.env文件中
AUTH_DISABLED=true
```

## 前端代码说明

### 自动添加认证头
`src/services/http.ts` 会自动添加：
```typescript
// 第36-38行
const token = localStorage.getItem('access_token')
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```

### 自动添加组织上下文
对于`/api/order`开头的请求（第51-74行）：
```typescript
if (needsOrgContext && !isAuthRequest) {
  config.headers['X-Organization-Id'] = organizationId
  config.headers['X-Tenant-Id'] = organizationId
}
```

### 401错误处理
业务API的401不会触发登出（第178-203行）：
```typescript
if (!isAuthRequest) {
  // 业务API的401，记录日志但不登出
  console.warn('⚠️ [HTTP DEBUG] Business API returned 401:', error.config?.url)
  console.warn('⚠️ This might be a permission issue or the service is not available')
}
```

## 验证修复

修复后，应该看到：
1. ✅ 订单服务正常响应
2. ✅ 请求返回200状态码
3. ✅ 小票模板列表正常加载
4. ✅ 控制台无401错误

## 相关文件

- `src/services/http.ts` - HTTP服务和拦截器
- `src/services/receipt-template.ts` - 小票模板API
- `src/pages/ReceiptTemplateManagement/index.tsx` - 小票模板管理页面
- `vite.config.ts` - 代理配置（第22-36行）

## 联系支持

如果以上方法都无法解决问题，请提供：
1. 浏览器控制台完整错误日志
2. Network标签中的请求详情
3. 后端服务日志
4. 环境配置信息
