# API路径说明

## 📍 当前配置

前端目前使用的API路径：

```typescript
const RECIPE_API_BASE = '/api/item-manage/v1/recipes'
const STEP_TYPE_API_BASE = '/api/item-manage/v1/step-types'
```

## 🔄 API路径变更历史

### 阶段1：当前部署（正在使用）✅

**配方API**: `/api/item-manage/v1/recipes`  
**步骤类型API**: `/api/item-manage/v1/step-types`

**状态**: 已部署，正常工作

### 阶段2：API文档规范（未来）

**配方API**: `/api/recipes`  
**步骤类型API**: 待确认

**状态**: 文档已定义，但后端未部署

## 🎯 何时切换到新路径

当后端完成以下工作后，前端可以切换到新路径：

1. ✅ 部署新的配方API端点 `/api/recipes`
2. ✅ 确保所有功能正常工作
3. ✅ 通知前端可以切换

### 切换步骤

只需修改一行代码：

```typescript
// src/services/recipe/recipeService.ts

// 从
const RECIPE_API_BASE = '/api/item-manage/v1/recipes'

// 改为
const RECIPE_API_BASE = '/api/recipes'
```

## 📋 API端点对照表

### 当前路径（正在使用）

| 功能 | 端点 |
|------|------|
| 创建配方 | `POST /api/item-manage/v1/recipes` |
| 获取配方列表 | `GET /api/item-manage/v1/recipes?itemId={id}` |
| 获取配方详情 | `GET /api/item-manage/v1/recipes/{id}` |
| 更新配方 | `PUT /api/item-manage/v1/recipes/{id}` |
| 删除配方 | `DELETE /api/item-manage/v1/recipes/{id}` |
| 添加步骤 | `POST /api/item-manage/v1/recipes/{id}/steps` |
| 更新步骤 | `PUT /api/item-manage/v1/recipes/steps/{id}` |
| 删除步骤 | `DELETE /api/item-manage/v1/recipes/steps/{id}` |
| 计算配方 | `POST /api/item-manage/v1/recipes/calculate` |

### 未来路径（API文档）

| 功能 | 端点 |
|------|------|
| 创建配方 | `POST /api/recipes` |
| 获取配方列表 | `GET /api/recipes?itemId={id}` |
| 获取配方详情 | `GET /api/recipes/{id}` |
| 更新配方 | `PUT /api/recipes/{id}` |
| 删除配方 | `DELETE /api/recipes/{id}` |
| 添加步骤 | `POST /api/recipes/{id}/steps` |
| 更新步骤 | `PUT /api/recipes/steps/{id}` |
| 删除步骤 | `DELETE /api/recipes/steps/{id}` |
| 计算配方 | `POST /api/recipes/calculate` |

## ⚠️ 重要提示

1. **前端已完全适配新的数据结构**
   - `amount`: `number` 类型
   - `ingredients`: `string` 类型
   - `operation`: 新增字段
   - 移除了 `title`、`isCritical`、`isOptional`

2. **只是API路径暂时使用旧的**
   - 数据格式已更新
   - UI已重新设计
   - 只等后端部署新端点

3. **切换时机**
   - 等待后端通知
   - 一行代码即可切换
   - 无需其他修改

---

**当前状态**: ✅ 使用旧路径，功能正常  
**下一步**: 等待后端部署新API端点
