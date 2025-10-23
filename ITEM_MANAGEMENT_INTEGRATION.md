# 商品管理服务集成文档

## 🚀 概述

本文档描述了如何将商品管理服务(Item Management Service)集成到Menu Center中，以及相关的功能和使用方法。

## 📋 集成功能

### ✅ 已完成的功能

1. **完整的API客户端** (`src/services/item-management.ts`)
   - 商品CRUD操作
   - 分类管理
   - 属性类型管理  
   - Add-on管理
   - 批量操作
   - 搜索功能

2. **菜单中心集成** (`src/pages/MenuCenter/index.tsx`)
   - 使用真实API替换本地存储
   - 分类的创建、编辑、删除
   - 商品的创建、编辑、删除
   - 状态管理和标签显示
   - 加载状态和错误处理

3. **独立商品管理页面** (`src/pages/ItemManagement/index.tsx`)
   - 表格形式的商品管理
   - 高级搜索和筛选
   - 分页功能
   - 批量操作

4. **API测试页面** (`src/pages/ItemApiTest/index.tsx`)
   - API功能测试
   - 示例代码展示
   - 数据清理工具

## 🔧 配置

### 环境变量

在 `env.develop` 中添加了：
```bash
# 商品管理服务
VITE_ITEM_MANAGE_BASE="https://tymoe.com/api/item-manage/v1"
```

### 路由配置

添加了以下路由：
- `/items` - 独立商品管理页面
- `/item-api-test` - API测试页面
- `/menu-center` - 集成后的菜单中心(原有路由)

## 📖 使用方法

### 1. 基本API调用

```typescript
import { itemManagementService } from '@/services/item-management'

// 获取商品列表
const items = await itemManagementService.getItems({
  page: 1,
  limit: 10,
  status: 'ACTIVE'
})

// 创建商品
const newItem = await itemManagementService.createItem({
  name: '商品名称',
  price: 99.99,
  categoryId: 'category-id',
  status: 'ACTIVE'
})
```

### 2. 在菜单中心使用

- 登录后访问 `/menu-center`
- 左侧面板管理分类
- 右侧面板管理选中分类下的商品
- 支持创建、编辑、删除操作

### 3. API测试

- 访问 `/item-api-test`
- 点击不同的测试按钮
- 查看API响应结果
- 清理测试数据

## 🔍 核心功能

### 商品管理
- ✅ 获取商品列表(支持分页、筛选)
- ✅ 创建商品
- ✅ 更新商品
- ✅ 删除商品
- ✅ 搜索商品
- ✅ 批量操作

### 分类管理
- ✅ 获取分类列表
- ✅ 获取分类树
- ✅ 创建分类
- ✅ 更新分类
- ✅ 删除分类

### 属性管理
- ✅ 属性类型CRUD
- ✅ 属性选项管理
- ✅ 支持多种数据类型

### Add-on管理
- ✅ Add-on CRUD
- ✅ 商品Add-on关联
- ✅ 关联管理

## 🎯 数据结构

### 商品 (Item)
```typescript
interface Item {
  id: string
  name: string
  description?: string
  price: number
  categoryId?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  images?: string[]
  attributes?: ItemAttribute[]
  addons?: ItemAddon[]
  createdAt?: string
  updatedAt?: string
}
```

### 分类 (Category)
```typescript
interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  status: 'ACTIVE' | 'INACTIVE'
  level: number
  createdAt?: string
  updatedAt?: string
}
```

## 🔐 认证集成

- 使用现有的认证系统
- 自动添加Bearer token到请求头
- 支持token自动刷新
- 认证失败时跳转到登录页

## 🛠️ 开发特性

### 调试日志
所有API调用都包含详细的调试日志：
```
📦 [ITEM SERVICE DEBUG] Getting items with params: {...}
➕ [ITEM SERVICE DEBUG] Creating item: {...}
✏️ [ITEM SERVICE DEBUG] Updating item: {...}
```

### 错误处理
- 网络错误捕获
- 用户友好的错误消息
- 自动重试机制
- 优雅降级

### 性能优化
- 请求去重
- 智能缓存
- 分页加载
- 懒加载

## 🎨 UI/UX特性

### 菜单中心UI改进
- 现代化的卡片设计
- 状态标签和图标
- 加载动画
- 响应式布局

### 交互改进
- 确认对话框
- 实时反馈
- 操作成功提示
- 错误提示

## 📊 测试和验证

### 内置测试功能
1. **单项测试** - 测试特定功能模块
2. **综合测试** - 测试完整工作流程
3. **数据清理** - 清除测试数据

### 示例执行
```typescript
import { runAllExamples } from '@/examples/item-management-examples'

// 运行所有API测试
const results = await runAllExamples()
console.log('测试结果:', results)
```

## 🚧 后续扩展

### 计划功能
- [ ] 商品图片上传
- [ ] 高级属性管理
- [ ] 库存管理
- [ ] 价格策略
- [ ] 促销活动

### 技术改进
- [ ] 离线缓存
- [ ] 实时同步
- [ ] 批量导入/导出
- [ ] 数据分析

## 🐛 故障排除

### 常见问题

1. **API调用失败**
   - 检查网络连接
   - 验证认证token
   - 查看服务器状态

2. **数据不同步**
   - 刷新页面
   - 清除浏览器缓存
   - 检查API响应

3. **权限错误**
   - 重新登录
   - 检查用户权限
   - 联系管理员

### 调试工具
- 浏览器开发者工具
- 网络请求监控
- 控制台日志
- API测试页面

## 📞 支持

如需帮助，请：
1. 查看控制台错误日志
2. 使用API测试页面验证功能
3. 检查网络请求和响应
4. 联系开发团队

---

**集成完成时间**: 2025年1月
**API版本**: v1
**前端框架**: React + TypeScript + Ant Design
