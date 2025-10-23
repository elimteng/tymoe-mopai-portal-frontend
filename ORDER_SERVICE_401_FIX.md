# 订单服务 401 错误修复指南

## 问题现象

访问小票模板管理页面时出现:
```
GET http://localhost:5173/api/order/v1/receipt-templates 401 (Unauthorized)
```

## 快速诊断

### 方法1: 使用浏览器控制台调试工具

1. 打开浏览器控制台 (F12)
2. 运行以下命令查看认证信息:
```javascript
window.debugOrderApi.auth()
```

3. 测试API连接:
```javascript
await window.debugOrderApi.test()
```

### 方法2: 使用诊断脚本

```bash
chmod +x diagnose-order-service.sh
./diagnose-order-service.sh
```

## 常见原因和解决方案

### ✅ 原因1: 后端订单服务未启动 (最常见)

**检查方法:**
```bash
curl http://localhost:3002/health
```

**解决方案:**
```bash
# 假设订单服务在同级目录
cd ../order-service
npm install
npm run dev
```

服务应该运行在 `localhost:3002`

---

### ✅ 原因2: 后端JWT配置不匹配

**症状:** 
- 认证服务正常 (组织API返回304)
- 订单服务返回401

**检查方法:**
在后端订单服务的配置文件中检查 `JWT_SECRET` 是否与认证服务一致

**解决方案:**
确保所有微服务使用相同的JWT密钥:

```env
# 在订单服务的 .env 文件中
JWT_SECRET=your_shared_secret_key
```

---

### ✅ 原因3: 后端未正确验证Token

**检查方法:**
查看后端订单服务的日志,看是否有JWT验证错误

**解决方案:**
确保订单服务正确配置了JWT中间件:

```typescript
// 示例: Express.js
import jwt from 'jsonwebtoken'

app.use('/api/order', (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})
```

---

### ✅ 原因4: 缺少组织上下文

**检查方法:**
在浏览器控制台运行:
```javascript
console.log('Org ID:', localStorage.getItem('organization_id'))
```

**解决方案:**
如果没有组织ID,需要先选择或创建组织:
1. 访问组织管理页面
2. 创建或选择一个组织
3. 刷新页面

---

### ✅ 原因5: Token过期

**检查方法:**
在浏览器控制台运行:
```javascript
window.debugOrderApi.auth()
// 查看 "是否过期" 字段
```

**解决方案:**
1. 退出登录
2. 重新登录
3. 刷新页面

---

## 前端代码说明

### 自动添加认证头

`src/services/http.ts` 会自动为订单API添加以下头部:

```typescript
// 1. JWT Token (第36-38行)
Authorization: Bearer <token>

// 2. 组织上下文 (第67-74行)
X-Organization-Id: <org-id>
X-Tenant-Id: <org-id>
```

### 401错误处理

业务API的401不会触发自动登出 (第178-203行):
```typescript
if (!isAuthRequest) {
  // 业务API的401,记录日志但不登出
  console.warn('⚠️ [HTTP DEBUG] Business API returned 401:', error.config?.url)
}
```

这是为了避免因为单个服务的问题导致用户被强制登出。

---

## 调试工具使用

### 1. 查看完整的认证信息
```javascript
window.debugOrderApi.auth()
```

输出包括:
- Token是否存在
- Token是否过期
- 组织ID
- 完整的JWT payload

### 2. 测试API连接
```javascript
await window.debugOrderApi.test()
```

会发送一个真实的API请求并显示:
- 请求头
- 响应状态
- 响应数据或错误信息
- 可能的原因分析

---

## 验证修复

修复后应该看到:

1. ✅ 控制台显示: `✅ Order API Response: 200 /api/order/v1/receipt-templates`
2. ✅ 小票模板列表正常加载
3. ✅ 无401错误

---

## 开发环境配置

### Vite代理配置 (vite.config.ts)

```typescript
'/api/order': {
  target: 'http://localhost:3002',  // 订单服务地址
  changeOrigin: true,
  secure: false,
  ws: true
}
```

### 环境变量

```env
VITE_ORDER_API_BASE=/api/order/v1
```

---

## 后端服务要求

订单服务需要:

1. **运行在正确的端口**
   - 默认: `localhost:3002`
   - 可在vite.config.ts中修改

2. **实现JWT认证**
   - 验证 `Authorization: Bearer <token>` 头
   - 使用与认证服务相同的JWT_SECRET

3. **支持组织上下文**
   - 读取 `X-Organization-Id` 头
   - 根据组织ID过滤数据

4. **健康检查端点**
   - 建议实现 `/health` 端点
   - 用于快速诊断服务状态

---

## 相关文件

- `src/services/http.ts` - HTTP拦截器和认证头注入
- `src/services/receipt-template.ts` - 小票模板API
- `src/utils/debug-order-api.ts` - 调试工具
- `vite.config.ts` - 代理配置
- `diagnose-order-service.sh` - 诊断脚本

---

## 获取帮助

如果以上方法都无法解决问题,请提供:

1. 浏览器控制台完整日志
2. `window.debugOrderApi.auth()` 的输出
3. `window.debugOrderApi.test()` 的输出
4. 后端订单服务的日志
5. 后端服务的配置文件 (隐藏敏感信息)
