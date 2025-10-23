#!/bin/bash

echo "🔍 订单服务诊断工具"
echo "===================="
echo ""

# 检查订单服务是否运行
echo "1️⃣ 检查订单服务是否运行在 localhost:3002..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null | grep -q "200\|404"; then
    echo "   ✅ 订单服务正在运行"
else
    echo "   ❌ 订单服务未运行或无法访问"
    echo "   💡 请启动订单服务: cd ../order-service && npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ 测试订单服务健康检查..."
HEALTH_RESPONSE=$(curl -s http://localhost:3002/health 2>/dev/null)
echo "   响应: $HEALTH_RESPONSE"

echo ""
echo "3️⃣ 检查浏览器中的认证信息..."
echo "   请在浏览器控制台执行以下命令:"
echo "   console.log('Token:', localStorage.getItem('access_token'))"
echo "   console.log('Org ID:', localStorage.getItem('organization_id'))"

echo ""
echo "4️⃣ 测试订单服务API (无认证)..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3002/api/order/v1/receipt-templates 2>/dev/null)
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "   状态码: $STATUS"
if [ "$STATUS" = "401" ]; then
    echo "   ❌ 返回401 - 订单服务需要认证"
    echo "   💡 这是正常的,服务需要JWT token"
elif [ "$STATUS" = "200" ]; then
    echo "   ✅ 返回200 - 服务正常(无需认证)"
else
    echo "   ⚠️  返回 $STATUS"
    echo "   响应体: $BODY"
fi

echo ""
echo "5️⃣ 测试订单服务API (带认证头)..."
echo "   请从浏览器控制台复制 access_token 并运行:"
echo "   TOKEN='your_token_here'"
echo "   curl -H \"Authorization: Bearer \$TOKEN\" \\"
echo "        -H \"X-Organization-Id: your_org_id\" \\"
echo "        http://localhost:3002/api/order/v1/receipt-templates"

echo ""
echo "===================="
echo "📋 诊断完成"
echo ""
echo "常见问题解决方案:"
echo "1. 如果订单服务未运行 → 启动服务"
echo "2. 如果返回401 → 检查后端JWT配置"
echo "3. 如果返回403 → 检查权限配置"
echo "4. 如果返回500 → 检查后端日志"
