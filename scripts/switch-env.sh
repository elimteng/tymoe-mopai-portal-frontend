#!/bin/bash
# 环境切换脚本 (Unix/Linux/Mac)
# 使用方法:
#   ./scripts/switch-env.sh local  - 切换到本地环境
#   ./scripts/switch-env.sh prod   - 切换到生产环境

set -e

ENV_MODE=${1:-local}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_LOCAL_PATH="${PROJECT_ROOT}/.env.local"
ENV_LOCAL_DEV_PATH="${PROJECT_ROOT}/.env.local-dev"
ENV_LOCAL_PROD_PATH="${PROJECT_ROOT}/.env.local-prod"

# 选择要复制的源文件
if [ "$ENV_MODE" = "local" ]; then
    SOURCE_FILE="$ENV_LOCAL_DEV_PATH"
    ENV_NAME="本地开发"
else
    SOURCE_FILE="$ENV_LOCAL_PROD_PATH"
    ENV_NAME="生产"
fi

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ 错误: 找不到 $SOURCE_FILE"
    exit 1
fi

# 复制配置文件
cp "$SOURCE_FILE" "$ENV_LOCAL_PATH"

# 提取 API 地址
API_BASE=$(grep "^VITE_API_BASE=" "$ENV_LOCAL_PATH" | cut -d'=' -f2 | tr -d '"')
ITEM_MANAGE_BASE=$(grep "^VITE_ITEM_MANAGE_BASE=" "$ENV_LOCAL_PATH" | cut -d'=' -f2 | tr -d '"')
ORDER_API_BASE=$(grep "^VITE_ORDER_API_BASE=" "$ENV_LOCAL_PATH" | cut -d'=' -f2 | tr -d '"')

echo ""
echo "============================================================"
echo "✅ 已切换到 ${ENV_NAME} 环境"
echo "============================================================"
echo ""
echo "📌 API 服务地址:"
echo "  • 认证服务:  ${API_BASE}"
echo "  • 商品管理:  ${ITEM_MANAGE_BASE}"
echo "  • 订单服务:  ${ORDER_API_BASE}"
echo ""
echo "💡 确保相关的本地服务已启动！"
echo "============================================================"
echo ""
