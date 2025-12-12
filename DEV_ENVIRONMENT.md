# 开发环境切换指南

## 概述

此项目支持快速切换**本地开发环境**和**生产环境** API。使用提供的脚本，可以一键切换所有 API 配置。

## 快速开始

### 🔴 切换到本地开发环境

使用本地 localhost API (推荐用于本地开发):

```bash
npm run dev:local
```

**API 地址:**
- 认证服务: `http://localhost:3000/api/auth-service/v1`
- 商品管理: `http://localhost:3001/api/item-manage/v1`
- 订单服务: `http://localhost:3002/api/order/v1`
- Uber 服务: `http://localhost:3004`

### 🟢 切换到生产环境

使用生产域名 API:

```bash
npm run dev:prod
```

**API 地址:**
- 认证服务: `https://tymoe.com/api/auth-service/v1`
- 商品管理: `https://tymoe.com/api/item-manage/v1`
- 订单服务: `https://tymoe.com/api/order/v1`

## 默认启动方式

```bash
npm run dev
```

使用 `.env.development` 中的配置（默认为本地开发环境）。

## 环境文件说明

| 文件 | 用途 |
|-----|------|
| `.env.development` | 开发环境默认配置（指向本地） |
| `.env.local-dev` | 本地环境配置快照 |
| `.env.local-prod` | 生产环境配置快照 |
| `.env.local` | 当前活跃配置（由脚本生成） |

## 支持的脚本

### npm 命令

```bash
# 本地开发环境启动
npm run dev:local

# 生产环境启动
npm run dev:prod

# 默认启动（使用 .env.development）
npm run dev

# 构建
npm build
```

### Shell 脚本（仅切换环境，不启动）

```bash
# Mac/Linux 切换到本地环境
./scripts/switch-env.sh local

# Mac/Linux 切换到生产环境
./scripts/switch-env.sh prod

# Windows 使用 Node.js 脚本
node scripts/switch-env.js local
node scripts/switch-env.js prod
```

## 关键配置

### 认证服务 (auth.ts)
- 环境变量: `VITE_API_BASE`, `VITE_AUTH_BASE`

### 商品管理 (item-management.ts)
- 环境变量: `VITE_ITEM_MANAGE_BASE`
- 默认值: `http://localhost:3001/api/item-manage/v1`

### 频道定价 (channel-pricing.ts)
- 环境变量: `VITE_ITEM_MANAGE_BASE`
- 默认值: `http://localhost:3001/api/item-manage/v1`

### 菜谱服务 (recipe/recipeService.ts)
- 环境变量: `VITE_ITEM_MANAGE_BASE`
- 默认值: `http://localhost:3001/api/item-manage/v1`

### 订单配置 (order-config.ts)
- 环境变量: `VITE_ORDER_API_BASE`
- 默认值: `http://localhost:3002/api/order/v1`

### Uber 集成 (uber.ts)
- 环境变量: `REACT_APP_UBER_SERVICE_URL`
- 默认值: `http://localhost:3004`

## 开发流程示例

### 场景 1: 本地开发

```bash
# 1. 切换到本地环境并启动
npm run dev:local

# 2. 确保本地服务已启动:
#    - Auth Service (port 3000)
#    - Item Management (port 3001)
#    - Order Service (port 3002)
#    - Uber Service (port 3004)

# 3. 访问 http://localhost:5173 (Vite 默认端口)
```

### 场景 2: 测试生产 API

```bash
# 1. 切换到生产环境并启动
npm run dev:prod

# 2. 访问 http://localhost:5173
# 3. 所有请求将发送到 tymoe.com
```

## 故障排查

### API 连接失败

1. **检查当前环境配置:**
   ```bash
   cat .env.local
   ```

2. **确保本地服务正在运行:**
   ```bash
   # 示例: 检查 Item Management 服务
   curl http://localhost:3001/health
   ```

3. **检查浏览器控制台日志:**
   - 打开开发者工具 (F12)
   - 查看 Network 标签，确认请求URL
   - 查看 Console 标签，确认错误消息

### 环境切换不生效

1. **重新启动 Vite:**
   ```bash
   # 停止现有进程 (Ctrl+C)
   npm run dev:local
   ```

2. **清除缓存:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev:local
   ```

3. **手动编辑 .env.local:**
   ```bash
   # 直接编辑文件
   cat .env.local-dev > .env.local
   ```

## 常见问题 (FAQ)

**Q: 如何知道当前使用的是哪个环境？**

A: 检查 `.env.local` 文件，或在浏览器控制台查看 Network 标签中的请求 URL。

**Q: 可以同时运行多个端口的应用吗？**

A: 可以，每个微服务独立运行在不同端口（3000, 3001, 3002, 3004 等），前端应用运行在 5173。

**Q: 如何创建新的环境配置？**

A: 创建新的 `.env.local-xxx` 文件，然后修改 `scripts/switch-env.js` 中的逻辑。

**Q: .env.local 为什么不提交到 Git？**

A: `.env.local` 文件在 `.gitignore` 中，因为它包含敏感信息且会频繁变化。应该使用 `.env.local-dev` 或 `.env.local-prod`。

## 更新 API 配置

如需新增或更改 API 地址，需要同时更新：

1. `.env.development` - 默认开发配置
2. `.env.local-dev` - 本地环境快照
3. `.env.local-prod` - 生产环境快照

然后所有使用对应环境变量的服务都会自动应用新配置。

## 相关文件

- 主配置: `.env.development`, `.env.local-dev`, `.env.local-prod`
- 切换脚本: `scripts/switch-env.js`, `scripts/switch-env.sh`
- API 服务:
  - `src/services/auth.ts`
  - `src/services/item-management.ts`
  - `src/services/channel-pricing.ts`
  - `src/services/recipe/recipeService.ts`
  - `src/services/order-config.ts`
  - `src/services/uber.ts`
