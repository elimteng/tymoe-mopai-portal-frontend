#!/bin/bash

# Cloudflare Tunnel 停止脚本
# 功能: 停止所有 Cloudflare Tunnel 和前端服务,恢复配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 临时文件路径
TMP_DIR="/tmp/cloudflare-tunnels"
ORDER_TUNNEL_PID="$TMP_DIR/order-service-tunnel.pid"
FRONTEND_TUNNEL_PID="$TMP_DIR/frontend-tunnel.pid"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛑 停止 Cloudflare Tunnel 服务${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. 关闭 Order Service Tunnel
if [ -f "$ORDER_TUNNEL_PID" ]; then
    PID=$(cat "$ORDER_TUNNEL_PID")
    if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Order Service Tunnel 已停止 (PID: $PID)${NC}"
    fi
    rm -f "$ORDER_TUNNEL_PID"
else
    echo -e "${YELLOW}⚠️  未找到 Order Service Tunnel PID${NC}"
fi

# 2. 关闭前端 Tunnel
if [ -f "$FRONTEND_TUNNEL_PID" ]; then
    PID=$(cat "$FRONTEND_TUNNEL_PID")
    if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ 前端 Tunnel 已停止 (PID: $PID)${NC}"
    fi
    rm -f "$FRONTEND_TUNNEL_PID"
else
    echo -e "${YELLOW}⚠️  未找到前端 Tunnel PID${NC}"
fi

# 3. 关闭所有 cloudflared 进程
CLOUDFLARED_PIDS=$(pgrep -f "cloudflared tunnel" || true)
if [ ! -z "$CLOUDFLARED_PIDS" ]; then
    echo "$CLOUDFLARED_PIDS" | while read pid; do
        kill $pid 2>/dev/null || true
    done
    echo -e "${GREEN}✅ 所有 cloudflared 进程已停止${NC}"
fi

# 4. 关闭前端服务
FRONTEND_PIDS=$(lsof -ti:5173 || true)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ 前端服务已停止 (5173端口)${NC}"
fi

# 5. 恢复环境变量配置
if [ -f "$PROJECT_ROOT/.env.local-dev.backup" ]; then
    mv "$PROJECT_ROOT/.env.local-dev.backup" "$PROJECT_ROOT/.env.local-dev"
    echo -e "${GREEN}✅ 环境变量配置已恢复${NC}"
else
    # 如果没有备份,手动恢复为本地配置
    sed -i.tmp 's|VITE_API_BASE="https://tymoe.com/api/auth-service/v1"|VITE_API_BASE="http://localhost:3000/api/auth-service/v1"|g' "$PROJECT_ROOT/.env.local-dev"
    sed -i.tmp 's|VITE_AUTH_BASE="https://tymoe.com"|VITE_AUTH_BASE="http://localhost:3000"|g' "$PROJECT_ROOT/.env.local-dev"
    sed -i.tmp 's|VITE_ITEM_MANAGE_BASE="https://tymoe.com/api/item-manage/v1"|VITE_ITEM_MANAGE_BASE="http://localhost:3000/api/item-manage/v1"|g' "$PROJECT_ROOT/.env.local-dev"
    sed -i.tmp 's|VITE_ORDER_API_BASE=https://.*\.trycloudflare\.com/api/order/v1|VITE_ORDER_API_BASE=http://localhost:3002/api/order/v1|g' "$PROJECT_ROOT/.env.local-dev"
    rm -f "$PROJECT_ROOT/.env.local-dev.tmp"
    echo -e "${GREEN}✅ 环境变量已恢复为本地配置${NC}"
fi

# 6. 清理临时文件
rm -rf "$TMP_DIR"
rm -f /tmp/frontend-dev.log
echo -e "${GREEN}✅ 临时文件已清理${NC}"

# 7. 验证清理结果
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 验证清理结果${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CLOUDFLARED_COUNT=$(pgrep -f "cloudflared" | wc -l || echo "0")
PORT_5173=$(lsof -i:5173 2>/dev/null | wc -l || echo "0")

if [ "$CLOUDFLARED_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅ 无 cloudflared 进程运行${NC}"
else
    echo -e "${YELLOW}⚠️  仍有 $CLOUDFLARED_COUNT 个 cloudflared 进程${NC}"
fi

if [ "$PORT_5173" -eq "0" ]; then
    echo -e "${GREEN}✅ 5173 端口未被占用${NC}"
else
    echo -e "${YELLOW}⚠️  5173 端口仍被占用${NC}"
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 清理完成!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${YELLOW}💡 现在可以使用本地开发模式:${NC}"
echo -e "${YELLOW}   cd $PROJECT_ROOT${NC}"
echo -e "${YELLOW}   npm run dev:local${NC}"
echo -e ""
