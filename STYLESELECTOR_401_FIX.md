# StyleSelector 401 错误修复

## 问题描述

在 `StyleSelector.tsx` 中调用 `/api/order/v1/receipt-templates/create-all-sources` 接口时，出现 401 Unauthorized 错误，后端日志显示 "jwt malformed"。

## 根本原因

`StyleSelector.tsx` 使用了原生的 `fetch` API 并手动添加认证头部，而不是使用项目中已经封装好的 `httpService`。这导致：

1. **Token 格式问题**：手动从 localStorage 获取 token 并添加到 headers 中，可能存在格式问题
2. **缺少统一的请求拦截器**：`httpService` 中配置了完整的请求拦截器，会自动处理：
   - Authorization header
   - X-Organization-Id header
   - X-Tenant-Id header
   - 错误处理和重试逻辑

## 修复方案

### 1. 添加 httpService 导入

```typescript
import { httpService } from '@/services/http'
```

### 2. 修改获取样式列表的代码

**修改前：**
```typescript
const response = await fetch('/api/order/v1/receipt-templates/styles')
const data = await response.json()
```

**修改后：**
```typescript
const response = await httpService.get<{ success: boolean; data: Style[] }>(
  '/api/order/v1/receipt-templates/styles'
)
```

### 3. 修改创建模板的代码

**修改前：**
```typescript
const token = localStorage.getItem('access_token')
const orgId = localStorage.getItem('organization_id')

const response = await fetch('/api/order/v1/receipt-templates/create-all-sources', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-organization-id': orgId,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    styleId: selectedStyle,
    paperWidth,
    language: i18n.language || 'zh-CN',
  }),
})
```

**修改后：**
```typescript
const response = await httpService.post<{
  success: boolean
  data: { templates: any[] }
  message?: string
}>(
  '/api/order/v1/receipt-templates/create-all-sources',
  {
    styleId: selectedStyle,
    paperWidth,
    language: i18n.language || 'zh-CN',
  }
)
```

## 修改的关键点

1. **移除手动 token 处理**：不再需要从 localStorage 获取 token，httpService 会自动处理
2. **移除手动 header 设置**：httpService 的请求拦截器会自动添加所有必要的 headers
3. **统一错误处理**：使用 httpService 可以获得统一的错误处理和日志记录
4. **类型安全**：使用 TypeScript 泛型定义响应类型

## httpService 的优势

`httpService` 在 `src/services/http.ts` 中配置了完整的请求/响应拦截器：

1. **自动添加认证头部**：
   - Authorization: Bearer {token}
   - X-Organization-Id: {orgId}
   - X-Tenant-Id: {orgId}

2. **智能路由判断**：
   - 自动判断哪些 API 需要组织上下文
   - 排除认证相关的 API（login, register 等）

3. **统一错误处理**：
   - 401 错误自动跳转登录
   - 详细的错误日志记录
   - 友好的错误提示

4. **调试支持**：
   - 详细的请求/响应日志
   - 特殊请求的额外日志记录

## 测试建议

修复后，请测试以下场景：

1. ✅ 获取样式列表
2. ✅ 选择样式和纸张尺寸
3. ✅ 创建模板（应该成功返回 200）
4. ✅ 检查后端日志，确认不再出现 "jwt malformed" 错误

## 相关文件

- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx` - 修复的文件
- `src/services/http.ts` - HTTP 服务封装
- `src/services/receipt-template.ts` - 小票模板服务（参考实现）

## 最佳实践

在整个项目中，**始终使用 `httpService` 而不是原生 `fetch` API**，以确保：

1. 统一的认证处理
2. 统一的错误处理
3. 统一的日志记录
4. 更好的类型安全
5. 更容易的维护和调试
