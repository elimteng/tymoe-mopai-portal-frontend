# Cloudflare Tunnel 远程访问指南

本指南介绍如何使用 Cloudflare Tunnel 在其他设备上访问本地开发环境。

## 功能说明

使用 Cloudflare Tunnel,你可以:
- ✅ 在任何设备(手机、平板、其他电脑)上访问本地前端
- ✅ 前端通过公网访问本地 Order Service
- ✅ 其他服务(认证、商品管理)使用生产环境
- ✅ 一键启动和停止所有隧道

## 前置条件

1. **安装 cloudflared**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared

   # 其他系统请参考: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **启动 Order Service**
   ```bash
   cd /Users/meng/Desktop/CODE/Tymoe/tymoe-order-service
   npm run dev
   ```
   确保 Order Service 运行在 `http://localhost:3002`

## 使用方法

### 方式 1: 使用 npm 命令(推荐)

#### 启动隧道
```bash
npm run dev:tunnel
```

这个命令会自动:
1. 🔍 检查 Order Service 是否运行
2. 🚀 创建 Order Service 的 Cloudflare Tunnel
3. ⚙️ 更新前端环境变量
4. 🎨 启动前端服务
5. 🌐 创建前端的 Cloudflare Tunnel
6. 📋 显示所有访问地址

#### 停止隧道
```bash
npm run stop:tunnel
```
或者在运行中的终端按 `Ctrl+C`

### 方式 2: 直接运行脚本

#### 启动
```bash
./scripts/start-cloudflare-proxy.sh
```

#### 停止
```bash
./scripts/stop-cloudflare-proxy.sh
```

## 输出示例

启动成功后,你会看到类似输出:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 所有服务已成功启动!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 访问地址:
   • 前端公网地址: https://xxx-xxx-xxx.trycloudflare.com
   • 前端本地地址: http://localhost:5173

🔗 API 端点:
   • Order Service: https://yyy-yyy-yyy.trycloudflare.com/api/order/v1
   • 认证服务: https://tymoe.com/api/auth-service/v1
   • 商品管理: https://tymoe.com/api/item-manage/v1

📝 管理命令:
   • 查看日志: tail -f /tmp/frontend-dev.log
   • 停止所有服务: 按 Ctrl+C
```

## 访问测试

1. **在本地访问**
   ```
   http://localhost:5173
   ```

2. **在其他设备访问**
   - 复制 "前端公网地址" (例如: `https://xxx-xxx-xxx.trycloudflare.com`)
   - 在手机、平板或其他电脑的浏览器中打开这个地址
   - 前端会自动通过 Cloudflare Tunnel 访问本地 Order Service

## 架构说明

```
[其他设备]
    ↓
[Cloudflare Tunnel - 前端]
    ↓
[本地前端服务:5173]
    ↓
[Cloudflare Tunnel - Order Service]
    ↓
[本地 Order Service:3002]
```

**其他服务**:
- 认证服务 → `https://tymoe.com`
- 商品管理 → `https://tymoe.com`

## 常见问题

### 1. Order Service 未运行
**错误**: `❌ Order Service 未运行在 3002 端口`

**解决**: 先启动 Order Service
```bash
cd /Users/meng/Desktop/CODE/Tymoe/tymoe-order-service
npm run dev
```

### 2. Cloudflare Tunnel URL 获取失败
**错误**: `❌ 无法获取 Tunnel URL`

**解决**:
- 检查网络连接
- 确认 cloudflared 已正确安装: `cloudflared --version`
- 查看日志: `cat /tmp/cloudflare-tunnels/order-service-tunnel.log`

### 3. 前端启动失败
**错误**: `❌ 前端服务启动失败`

**解决**:
- 检查 5173 端口是否被占用: `lsof -i:5173`
- 查看前端日志: `tail -50 /tmp/frontend-dev.log`
- 手动关闭占用端口: `lsof -ti:5173 | xargs kill -9`

### 4. 停止后端口仍被占用
**解决**: 运行停止脚本
```bash
npm run stop:tunnel
```

如果还有问题,手动清理:
```bash
# 关闭所有 cloudflared
pkill -f cloudflared

# 关闭前端服务
lsof -ti:5173 | xargs kill -9
```

## 环境变量管理

### 自动备份
启动脚本会自动备份 `.env.local-dev` 为 `.env.local-dev.backup`

### 停止后恢复
停止脚本会自动恢复环境变量为本地开发配置

### 手动恢复
如果需要手动恢复:
```bash
# 如果存在备份
mv .env.local-dev.backup .env.local-dev

# 或运行停止脚本
npm run stop:tunnel
```

## 安全提示

⚠️ **注意事项**:
1. Cloudflare Tunnel 的免费版本没有 uptime 保证
2. 生成的 URL 是临时的,每次启动都会变化
3. 不要在生产环境使用免费的 quick tunnel
4. 任何人访问你的 tunnel URL 都能看到你的应用

## 生产环境建议

如果需要在生产环境使用,建议:
1. 注册 Cloudflare 账号
2. 创建命名隧道(named tunnel)
3. 配置访问策略和认证
4. 使用自定义域名

参考: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

## 文件说明

- `scripts/start-cloudflare-proxy.sh` - 启动脚本
- `scripts/stop-cloudflare-proxy.sh` - 停止脚本
- `/tmp/cloudflare-tunnels/` - 临时文件目录
- `/tmp/frontend-dev.log` - 前端服务日志

## 支持

如有问题,请检查:
1. Order Service 是否正常运行
2. cloudflared 是否正确安装
3. 网络连接是否正常
4. 查看相关日志文件
