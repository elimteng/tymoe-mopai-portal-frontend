#!/bin/bash

# Cloudflare Tunnel 自动代理脚本
# 功能: 自动为 Order Service 和前端创建 Cloudflare Tunnel

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ORDER_SERVICE_DIR="/Users/meng/Desktop/CODE/Tymoe/tymoe-order-service"

# 临时文件路径
TMP_DIR="/tmp/cloudflare-tunnels"
ORDER_TUNNEL_LOG="$TMP_DIR/order-service-tunnel.log"
FRONTEND_TUNNEL_LOG="$TMP_DIR/frontend-tunnel.log"
ORDER_TUNNEL_PID="$TMP_DIR/order-service-tunnel.pid"
FRONTEND_TUNNEL_PID="$TMP_DIR/frontend-tunnel.pid"

# 创建临时目录
mkdir -p "$TMP_DIR"

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}🧹 正在清理...${NC}"

    # 关闭 Order Service Tunnel
    if [ -f "$ORDER_TUNNEL_PID" ]; then
        kill $(cat "$ORDER_TUNNEL_PID") 2>/dev/null || true
        rm -f "$ORDER_TUNNEL_PID"
        echo -e "${GREEN}✅ Order Service Tunnel 已关闭${NC}"
    fi

    # 关闭前端 Tunnel
    if [ -f "$FRONTEND_TUNNEL_PID" ]; then
        kill $(cat "$FRONTEND_TUNNEL_PID") 2>/dev/null || true
        rm -f "$FRONTEND_TUNNEL_PID"
        echo -e "${GREEN}✅ 前端 Tunnel 已关闭${NC}"
    fi

    # 关闭前端服务
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ 前端服务已关闭${NC}"

    echo -e "${GREEN}🎉 清理完成${NC}"
}

# 捕获退出信号
trap cleanup EXIT INT TERM

# 提取 Cloudflare Tunnel URL
extract_tunnel_url() {
    local log_file=$1
    local max_wait=30
    local waited=0

    while [ $waited -lt $max_wait ]; do
        if [ -f "$log_file" ]; then
            local url=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$log_file" | head -1)
            if [ ! -z "$url" ]; then
                echo "$url"
                return 0
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done

    echo ""
    return 1
}

# 步骤 1: 启动 Order Service Tunnel
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 步骤 1: 启动 Order Service Tunnel${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查 Order Service 是否运行
if ! lsof -i:3002 > /dev/null 2>&1; then
    echo -e "${RED}❌ Order Service 未运行在 3002 端口${NC}"
    echo -e "${YELLOW}💡 请先启动 Order Service: cd $ORDER_SERVICE_DIR && npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Order Service 正在运行${NC}"
echo -e "${YELLOW}🚀 正在创建 Cloudflare Tunnel...${NC}"

# 启动 Order Service Tunnel
cloudflared tunnel --url http://localhost:3002 > "$ORDER_TUNNEL_LOG" 2>&1 &
echo $! > "$ORDER_TUNNEL_PID"

# 等待并提取 URL
ORDER_TUNNEL_URL=$(extract_tunnel_url "$ORDER_TUNNEL_LOG")

if [ -z "$ORDER_TUNNEL_URL" ]; then
    echo -e "${RED}❌ 无法获取 Order Service Tunnel URL${NC}"
    cat "$ORDER_TUNNEL_LOG"
    exit 1
fi

echo -e "${GREEN}✅ Order Service Tunnel 已启动${NC}"
echo -e "${GREEN}   URL: $ORDER_TUNNEL_URL${NC}"

# 步骤 2: 更新前端环境变量
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚙️  步骤 2: 更新前端环境变量${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 备份原始配置
cp "$PROJECT_ROOT/.env.local-dev" "$PROJECT_ROOT/.env.local-dev.backup"
echo -e "${GREEN}✅ 已备份原始配置${NC}"

# 更新 .env.local-dev
sed -i.tmp "s|VITE_ORDER_API_BASE=.*|VITE_ORDER_API_BASE=${ORDER_TUNNEL_URL}/api/order/v1|g" "$PROJECT_ROOT/.env.local-dev"
rm -f "$PROJECT_ROOT/.env.local-dev.tmp"

# 设置其他服务为生产环境
sed -i.tmp 's|VITE_API_BASE="http://localhost:3000/api/auth-service/v1"|VITE_API_BASE="https://tymoe.com/api/auth-service/v1"|g' "$PROJECT_ROOT/.env.local-dev"
sed -i.tmp 's|VITE_AUTH_BASE="http://localhost:3000"|VITE_AUTH_BASE="https://tymoe.com"|g' "$PROJECT_ROOT/.env.local-dev"
sed -i.tmp 's|VITE_ITEM_MANAGE_BASE="http://localhost:3000/api/item-manage/v1"|VITE_ITEM_MANAGE_BASE="https://tymoe.com/api/item-manage/v1"|g' "$PROJECT_ROOT/.env.local-dev"
rm -f "$PROJECT_ROOT/.env.local-dev.tmp"

echo -e "${GREEN}✅ 环境变量已更新${NC}"
echo -e "${YELLOW}   Order Service: $ORDER_TUNNEL_URL/api/order/v1${NC}"
echo -e "${YELLOW}   其他服务: 使用生产环境 (tymoe.com)${NC}"

# 步骤 3: 启动前端服务
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎨 步骤 3: 启动前端服务${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 关闭已有的前端服务
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 2

cd "$PROJECT_ROOT"
echo -e "${YELLOW}🚀 正在启动前端服务...${NC}"

# 后台启动前端
npm run dev:local > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!

# 等待前端服务启动
sleep 8

if ! lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端服务启动失败${NC}"
    tail -50 /tmp/frontend-dev.log
    exit 1
fi

echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}   本地地址: http://localhost:5173${NC}"

# 步骤 4: 创建前端 Tunnel
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 步骤 4: 创建前端 Cloudflare Tunnel${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}🚀 正在创建前端 Tunnel...${NC}"

# 启动前端 Tunnel
cloudflared tunnel --url http://localhost:5173 > "$FRONTEND_TUNNEL_LOG" 2>&1 &
echo $! > "$FRONTEND_TUNNEL_PID"

# 等待并提取 URL
FRONTEND_TUNNEL_URL=$(extract_tunnel_url "$FRONTEND_TUNNEL_LOG")

if [ -z "$FRONTEND_TUNNEL_URL" ]; then
    echo -e "${RED}❌ 无法获取前端 Tunnel URL${NC}"
    cat "$FRONTEND_TUNNEL_LOG"
    exit 1
fi

echo -e "${GREEN}✅ 前端 Tunnel 已启动${NC}"
echo -e "${GREEN}   URL: $FRONTEND_TUNNEL_URL${NC}"

# 最终总结
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 所有服务已成功启动!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${BLUE}📍 访问地址:${NC}"
echo -e "${GREEN}   • 前端公网地址: ${FRONTEND_TUNNEL_URL}${NC}"
echo -e "${YELLOW}   • 前端本地地址: http://localhost:5173${NC}"
echo -e ""
echo -e "${BLUE}🔗 API 端点:${NC}"
echo -e "${GREEN}   • Order Service: ${ORDER_TUNNEL_URL}/api/order/v1${NC}"
echo -e "${YELLOW}   • 认证服务: https://tymoe.com/api/auth-service/v1${NC}"
echo -e "${YELLOW}   • 商品管理: https://tymoe.com/api/item-manage/v1${NC}"
echo -e ""
echo -e "${BLUE}📝 管理命令:${NC}"
echo -e "${YELLOW}   • 查看日志: tail -f /tmp/frontend-dev.log${NC}"
echo -e "${YELLOW}   • 停止所有服务: 按 Ctrl+C${NC}"
echo -e ""
echo -e "${BLUE}💡 提示:${NC}"
echo -e "${YELLOW}   可以在任何设备上通过公网地址访问前端${NC}"
echo -e "${YELLOW}   前端会通过 Cloudflare Tunnel 调用本地 Order Service${NC}"
echo -e ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 保持脚本运行
echo -e "\n${YELLOW}⏳ 服务正在运行中... 按 Ctrl+C 停止所有服务${NC}\n"

# 等待用户中断
while true; do
    sleep 1
done
