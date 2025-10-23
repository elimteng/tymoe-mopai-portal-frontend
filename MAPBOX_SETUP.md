# Mapbox 地址搜索集成指南

本项目已集成 Mapbox Geocoding API 用于地址搜索功能，提供高质量的加拿大和美国地址数据。

## 🎯 为什么选择 Mapbox？

- ✅ **每月 100,000 次免费请求**（足够大多数应用使用）
- ✅ **加拿大地址覆盖完整**，质量高
- ✅ **支持中英文**搜索
- ✅ **自动补全**功能
- ✅ **POI（兴趣点）搜索**（餐厅、商店等）
- ✅ **响应速度快**

## 📝 获取 Mapbox API Token

### 步骤 1: 注册 Mapbox 账号

1. 访问 [Mapbox 官网](https://www.mapbox.com/)
2. 点击右上角 **Sign up** 注册账号
3. 使用邮箱注册（免费，无需信用卡）

### 步骤 2: 创建 Access Token

1. 登录后，访问 [Account Dashboard](https://account.mapbox.com/)
2. 在 **Access tokens** 部分，你会看到一个默认的 token
3. 或者点击 **Create a token** 创建新的 token
   - **Token name**: `tymoe-frontend`（任意名称）
   - **Scopes**: 确保勾选了以下权限：
     - ✅ `styles:read`
     - ✅ `fonts:read`
     - ✅ `datasets:read`
     - ✅ `geocoding:read` ⭐ **重要**
4. 点击 **Create token**
5. 复制生成的 token（格式类似：`pk.eyJ1...`）

## ⚙️ 配置项目

### 方法 1: 使用 .env 文件（推荐）

1. 在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
touch .env.local
```

2. 添加你的 Mapbox token：

```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxxxxxxxxxxxxxx
```

3. 重启开发服务器：

```bash
npm run dev
```

### 方法 2: 直接在 vite.config.ts 中配置

在 `vite.config.ts` 中找到这一行：

```typescript
'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(process.env.VITE_MAPBOX_TOKEN || ''),
```

替换为：

```typescript
'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify('pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxxxxxxxxxxxxxx'),
```

> ⚠️ **注意**: 方法 2 会将 token 提交到代码仓库，不推荐用于生产环境。

## 🔒 安全注意事项

### 前端 Token 安全

Mapbox 的公开 token (`pk.`) 设计为可以在前端使用，但需要注意：

1. **URL 限制**: 在 Mapbox Dashboard 中配置允许的域名
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

2. **Token 限制**: 为不同环境创建不同的 token
   - Development token: 用于本地开发
   - Production token: 用于生产环境

3. **监控使用**: 定期检查 Mapbox Dashboard 的使用统计

### 配置 Token 限制

1. 访问 [Mapbox Tokens](https://account.mapbox.com/access-tokens/)
2. 点击你的 token
3. 在 **URL restrictions** 中添加允许的域名：
   ```
   http://localhost:5173/*
   https://your-production-domain.com/*
   ```
4. 保存设置

## 📊 使用额度

### 免费额度
- **每月**: 100,000 次地理编码请求
- **每月**: 100,000 次反向地理编码请求

### 超出免费额度
- **价格**: $0.50 / 1,000 次请求
- 自动计费（需要绑定支付方式）

### 监控使用量
访问 [Mapbox Statistics](https://account.mapbox.com/statistics/) 查看：
- 每日请求数
- 月度使用趋势
- 剩余免费额度

## 🧪 测试配置

配置完成后，测试地址搜索功能：

1. 启动开发服务器
2. 进入**组织管理** → **创建组织**
3. 在**位置**字段输入地址，例如：
   - `3583 Kingsway, Vancouver`
   - `Toronto City Hall`
   - `123 Main Street, Montreal`

如果配置正确，你应该能看到自动补全的地址建议。

## ❓ 常见问题

### Q: 提示 "Mapbox API 未配置"
**A**: 检查环境变量是否正确设置，重启开发服务器。

### Q: 搜索没有结果
**A**: 检查：
1. Token 是否有效
2. Token 是否有 `geocoding:read` 权限
3. 是否设置了 URL 限制（限制了当前域名）

### Q: 如何切换回免费的 OpenStreetMap？
**A**: 在 `src/services/address.ts` 中注释掉 Mapbox 代码，使用之前的 Nominatim 实现。

### Q: 生产环境如何配置？
**A**: 在部署平台（Vercel, Netlify, etc.）的环境变量中添加 `VITE_MAPBOX_TOKEN`。

## 📚 相关链接

- [Mapbox Geocoding API 文档](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox 定价](https://www.mapbox.com/pricing)
- [Mapbox Dashboard](https://account.mapbox.com/)
- [Token 管理](https://account.mapbox.com/access-tokens/)

## 🆘 需要帮助？

如果遇到问题，请检查：
1. 浏览器控制台的错误信息
2. Network 标签中的 API 请求
3. Mapbox Dashboard 的使用统计

---

**最后更新**: 2025-01-15

