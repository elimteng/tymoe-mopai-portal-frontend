#!/bin/bash

echo "🔍 检查后端服务状态..."
echo ""

# 检查订单服务 (localhost:3002)
echo "📦 订单服务 (localhost:3002):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null | grep -q "200\|404"; then
    echo "✅ 服务运行中"
else
    echo "❌ 服务未运行或无法访问"
    echo "   请启动订单服务: cd ../order-service && npm run dev"
fi
echo ""

# 检查商品管理服务 (localhost:3001)
echo "📦 商品管理服务 (localhost:3001):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null | grep -q "200\|404"; then
    echo "✅ 服务运行中"
else
    echo "❌ 服务未运行或无法访问"
    echo "   请启动商品管理服务: cd ../item-manage && npm run dev"
fi
echo ""

# 检查认证token
echo "🔑 认证状态:"
if [ -f ~/.local/share/tymoe/access_token ] || grep -q "access_token" ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/leveldb/*.log 2>/dev/null; then
    echo "✅ 已登录（检测到token）"
else
    echo "⚠️  未检测到token，请先登录系统"
fi
echo ""

echo "💡 提示："
echo "   - 如果订单服务未运行，401错误是正常的"
echo "   - 确保所有后端服务都已启动并配置正确"
echo "   - 检查浏览器控制台的详细错误信息"
