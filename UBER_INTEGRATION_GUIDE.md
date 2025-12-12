# Portal Uber 集成配置指南

本文档说明如何在 Portal 前端中访问和使用 Uber 集成功能。

## 快速开始

### 1. 环境配置

编辑 `.env.development` 文件，确保配置了 Uber 服务 URL：

```bash
# Uber 服务
REACT_APP_UBER_SERVICE_URL=http://localhost:3004
```

### 2. 启动服务

#### 2.1 启动后端 Uber 服务

```bash
cd /Users/meng/Desktop/CODE/Tymoe/tymoe-mpoai-uberService

# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env

# 填入必需的环境变量（见下面的环境变量说明）

# 运行数据库迁移
npm run prisma:migrate:dev

# 启动服务（开发模式）
npm run dev
```

#### 2.2 启动前端 Portal

```bash
cd /Users/meng/Desktop/CODE/Tymoe/tymoe-mopai-portal-frontend

# 安装依赖（如果还未安装）
npm install

# 启动开发服务器
npm run dev
```

### 3. 访问 Uber 集成页面

1. 打开浏览器访问 http://localhost:5173（或 Portal 配置的端口）
2. 登录到 Portal
3. 在导航菜单中找到 **集成** 或直接访问 `/integrations/uber`

---

## 环境变量配置

### Uber Service (.env 文件)

| 变量 | 说明 | 示例 |
|------|------|------|
| `UBER_SANDBOX_ENABLED` | 是否使用沙盒环境 | `true` |
| `UBER_SANDBOX_CLIENT_ID` | Uber 沙盒 Client ID | 从 [Uber 开发者后台](https://developer.uber.com) 获取 |
| `UBER_SANDBOX_CLIENT_SECRET` | Uber 沙盒 Secret | 从 [Uber 开发者后台](https://developer.uber.com) 获取 |
| `UBER_DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:password@localhost:5432/tymoe_uber` |
| `ENCRYPTION_KEY` | 32 字节的十六进制加密密钥 | `生成方法见下文` |
| `PORTAL_URL` | Portal 前端地址 | `http://localhost:3000` |
| `OAUTH_REDIRECT_URI` | OAuth 回调地址 | `http://localhost:3004/api/uber/v1/auth/callback` |
| `PORT` | Uber 服务端口 | `3004` |
| `NODE_ENV` | 环境 | `development` |

### 生成加密密钥

```bash
# 使用 Node.js 生成 32 字节的十六进制密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 输出示例: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 页面功能说明

### Uber 集成页面 (`/integrations/uber`)

#### 1. 未连接状态

当您还未连接 Uber 账户时，页面会显示：

```
┌─────────────────────────────────────────┐
│ Uber 集成                               │
│ 连接您的 Uber 账户以启用订单、菜单和    │
│ 商店管理功能                            │
│                                         │
│           [连接 Uber] 按钮               │
└─────────────────────────────────────────┘
```

**操作步骤**:
1. 点击 **连接 Uber** 按钮
2. 您将被重定向到 Uber 的授权页面
3. 使用您的 Uber 商家账户登录
4. 审查并批准应用权限
5. 自动重定向回 Portal，显示连接成功

#### 2. 已连接状态

连接成功后，页面显示：

```
┌────────────────────────────────────────────┐
│ Uber 集成状态                              │
│ ✓ 连接状态: 已连接                        │
│ 门店名称: My Restaurant                   │
│ Uber 商家 ID: uber_1234567890             │
│ 连接时间: 2024-11-10 15:30:00             │
│ 最后使用: 2024-11-10 16:00:00             │
│                                           │
│ [断开连接] [刷新状态]                     │
└────────────────────────────────────────────┘
```

**功能说明**:
- **连接状态**: 显示是否已连接 Uber
- **门店名称**: 从 Uber 获取的您的门店名称
- **Uber 商家 ID**: 唯一标识符
- **连接时间**: 首次建立连接的时间
- **最后使用**: 最后一次使用该连接的时间
- **断开连接**: 撤销对 Uber 的授权
- **刷新状态**: 重新检查连接状态

---

## OAuth 流程说明

### 授权流程 (Authorization Code Flow)

```
用户点击"连接 Uber"
        ↓
Portal 调用 POST /api/uber/v1/auth/authorize
        ↓
后端生成随机 state 值并保存到数据库
        ↓
后端返回 Uber 授权 URL
        ↓
Portal 重定向用户到 Uber 授权页面
        ↓
用户在 Uber 页面登录并授权
        ↓
Uber 重定向回 /api/uber/v1/auth/callback?code=XXX&state=YYY
        ↓
后端验证 state，交换 code 获取 access token
        ↓
后端从 Uber 获取商家信息
        ↓
后端加密并保存 token 和商家信息到数据库
        ↓
后端重定向到 Portal 成功页面
        ↓
Portal 显示连接成功信息和商家详情
```

---

## API 端点调用示例

### 生成授权 URL

```javascript
// 在 UberIntegration 组件中自动调用
const authorizationUrl = await uberService.generateAuthorizationUrl(merchantId);
// 返回类似: https://auth.uber.com/oauth/v2/authorize?client_id=xxx&...
```

### 获取连接状态

```javascript
const status = await uberService.getIntegrationStatus(merchantId);
// 返回:
// {
//   isConnected: true,
//   storeName: "My Restaurant",
//   uberMerchantId: "uber_1234567890",
//   connectedAt: "2024-11-10T15:30:00Z",
//   lastUsedAt: "2024-11-10T16:00:00Z"
// }
```

### 断开连接

```javascript
await uberService.disconnect(merchantId);
// 撤销授权，清除数据库中的 token
```

---

## 故障排除

### 问题 1: 页面加载时显示"无法获取商家 ID"

**原因**: 没有正确获取到 merchantId

**解决方案**:
1. 确保已登录 Portal
2. 确保已选择组织
3. 检查浏览器 LocalStorage 中是否有 `organization_id`
   ```javascript
   // 在浏览器控制台运行
   console.log(localStorage.getItem('organization_id'))
   ```

### 问题 2: 点击"连接 Uber"后无反应

**原因**:
- Uber Service 未运行
- 环境变量配置错误
- 网络连接问题

**解决方案**:
1. 检查 Uber Service 是否运行
   ```bash
   curl http://localhost:3004/health
   ```
2. 检查 `.env.development` 中的 `REACT_APP_UBER_SERVICE_URL`
3. 打开浏览器开发者工具，查看网络请求是否发送
4. 检查浏览器控制台是否有错误信息

### 问题 3: 授权后被重定向到错误页面

**原因**:
- Uber 回调处理失败
- 数据库保存失败
- PORTAL_URL 配置错误

**解决方案**:
1. 查看 URL 中的错误参数
   ```
   /integrations/uber?error=authorization_failed&error_description=...
   ```
2. 检查 Uber Service 的服务器日志
3. 确认 PORTAL_URL 环境变量正确
   ```bash
   # 在 Uber Service 中
   echo $PORTAL_URL
   ```

### 问题 4: 连接状态页面显示为空

**原因**: 获取集成状态 API 调用失败

**解决方案**:
1. 打开浏览器开发者工具的 Network 标签
2. 查看 POST `/api/uber/v1/auth/status` 请求
3. 检查响应状态码和错误信息
4. 查看 Uber Service 日志

### 问题 5: 断开连接后页面未更新

**原因**: 页面状态同步问题

**解决方案**:
1. 点击 "刷新状态" 按钮手动刷新
2. 刷新浏览器页面
3. 检查浏览器控制台是否有 JavaScript 错误

---

## 开发模式

### 启用详细日志

在 Portal 前端的 `UberIntegration` 组件中已配置详细的错误输出。

查看浏览器控制台查看：
- 授权流程的每一步
- API 调用的请求和响应
- 错误堆栈跟踪

### 模拟授权失败

在 Uber 授权页面上点击 "Cancel" 或 "Deny"，会被重定向到：
```
/integrations/uber?error=access_denied&error_description=User%20denied%20access
```

### 测试自动重连

1. 连接 Uber 账户
2. 手动删除数据库中的 token 记录
   ```sql
   -- 在数据库中执行
   DELETE FROM "MerchantUberIntegration" WHERE merchantId = 'your_merchant_id';
   ```
3. 刷新页面，应该显示未连接状态
4. 重新连接，确保流程正常

---

## 生产环境部署

### 1. 环境变量配置

创建 `.env.production` 文件：

```bash
# Uber Service
REACT_APP_UBER_SERVICE_URL=https://api.yourdomain.com/uber
```

### 2. HTTPS 配置

确保：
- Portal 在 HTTPS 上运行
- Uber Service 在 HTTPS 上运行
- OAuth 重定向 URI 使用 HTTPS

```
http://localhost:3004/api/uber/v1/auth/callback  (开发)
↓
https://api.yourdomain.com/api/uber/v1/auth/callback  (生产)
```

### 3. Uber 开发者后台配置

1. 登录 [Uber Developer Portal](https://developer.uber.com)
2. 进入应用设置
3. 更新 Redirect URI：
   ```
   https://api.yourdomain.com/api/uber/v1/auth/callback
   ```
4. 获取生产环境凭证

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/pages/Integration/UberIntegration.tsx` | Uber 集成页面组件 |
| `src/services/uber.ts` | Uber API 服务 |
| `src/router/index.tsx` | 路由配置 |
| `.env.development` | 开发环境变量 |

---

## 更多资源

- [Uber API 文档](https://developer.uber.com/docs)
- [OAuth 2.0 标准](https://tools.ietf.org/html/rfc6749)
- [Uber 后端服务文档](../tymoe-mpoai-uberService/README.md)
- [实现检查清单](../tymoe-mpoai-uberService/IMPLEMENTATION_CHECKLIST.md)

---

**最后更新**: 2024-11-10
**版本**: v1.0.0
**状态**: Ready for Testing (准备就绪，待测试)
