# 商品管理服务 API 完整参考 (v2.4)

## 🌐 访问方式

### 本地开发环境
```
http://localhost:3001
```

### 测试服务器（通过域名）
```
https://tymoe.com/api/item-manage/v1
```

**公开端点（无需认证）:**
- `GET https://tymoe.com/api/item-manage/v1/health` - 健康检查（API 路径）
- `GET https://tymoe.com/health` - 健康检查（根路径）
- `GET https://tymoe.com/info` - 服务信息（根路径）
- `GET https://tymoe.com/docs` - Swagger API 文档（根路径）

**需要认证的 API 端点:**
- `GET https://tymoe.com/api/item-manage/v1/items` - 商品管理
- `GET https://tymoe.com/api/item-manage/v1/categories` - 分类管理
- `GET https://tymoe.com/api/item-manage/v1/combos` - 套餐管理
- `GET https://tymoe.com/api/item-manage/v1/recipes` - 配方管理
- `GET https://tymoe.com/api/item-manage/v1/modifier-groups` - 修饰符管理
- 其他所有 API 端点见下方详细文档

---

## 📌 基础信息

- **API 前缀**: `/api/item-manage/v1`
- **服务地址**: `https://tymoe.com/api/item-manage/v1` (生产环境)
- **本地地址**: `http://localhost:3001` (开发环境)
- **认证**: 所有请求需要 `Authorization: Bearer {token}` header (公开端点除外)
- **租户隔离**: 自动通过 JWT token 中的 tenantId
- **更新日期**: 2025-11-07
- **版本**: v2.4 (添加域名 API 访问说明)

---

## 📑 目录

1. [分类管理 (Categories)](#1-分类管理)
2. [商品管理 (Items)](#2-商品管理)
3. [套餐管理 (Combos)](#3-套餐管理)
4. [修饰符管理 (Modifiers)](#4-修饰符管理)
5. [制作指引管理 (Recipes)](#5-制作指引管理)
6. [步骤类型管理 (Step Types)](#6-步骤类型管理)
7. [价格管理 (Pricing & Channels)](#7-价格管理)

---

## 1️⃣ 分类管理

### 获取分类树
```http
GET /categories/tree
```

**响应:**
```json
{
  "categories": [
    {
      "id": "cat-001",
      "name": "热饮",
      "displayName": "热饮",
      "description": "各类热饮",
      "parentId": null,
      "children": [
        {
          "id": "cat-002",
          "name": "奶茶",
          "parentId": "cat-001",
          "children": []
        }
      ]
    }
  ]
}
```

### 获取分类列表
```http
GET /categories?parentId={parentId}
```

### 创建分类
```http
POST /categories
Content-Type: application/json

{
  "name": "热饮",
  "displayName": "热饮",
  "description": "各类热饮",
  "parentId": null
}
```

### 更新分类
```http
PUT /categories/{categoryId}
Content-Type: application/json

{
  "name": "热饮",
  "displayName": "热饮",
  "description": "更新的描述"
}
```

### 删除分类
```http
DELETE /categories/{categoryId}
```

---

## 2️⃣ 商品管理

### 获取商品列表
```http
GET /items?limit=20&offset=0
```

### 搜索商品
```http
GET /items/search/{keyword}
```

### 获取商品详情
```http
GET /items/{itemId}
```

### 创建商品
```http
POST /items
Content-Type: application/json

{
  "name": "奶茶",
  "displayName": "招牌奶茶",
  "description": "经典奶茶",
  "categoryId": "cat-001",
  "basePrice": 8.00,
  "cost": 2.50,
  "isActive": true,
  "sku": "ITEM-001"
}
```

### 更新商品
```http
PUT /items/{itemId}
Content-Type: application/json

{
  "name": "奶茶",
  "displayName": "招牌奶茶",
  "description": "经典奶茶",
  "basePrice": 8.50,
  "cost": 2.50,
  "isActive": true
}
```

### 删除商品
```http
DELETE /items/{itemId}
```

### 批量操作商品
```http
POST /items/batch
Content-Type: application/json

{
  "action": "activate",  // 或 deactivate, delete
  "itemIds": ["item-001", "item-002"]
}
```

---

## 3️⃣ 套餐管理

### 获取套餐列表
```http
GET /combos?limit=20&offset=0
```

### 获取套餐详情
```http
GET /combos/{comboId}

# 响应包含：
{
  "id": "combo-001",
  "name": "双杯套餐",
  "displayName": "双杯套餐",
  "description": "两杯饮品",
  "basePrice": 15.00,
  "comboItems": [
    {
      "id": "combo-item-001",
      "itemId": "item-001",
      "item": { "name": "奶茶", ... },
      "quantity": 1,
      "inheritedModifiers": [
        {
          "groupId": "group-001",
          "groupName": "杯型",
          "options": [...]
        }
      ]
    }
  ]
}
```

### 创建套餐
```http
POST /combos
Content-Type: application/json

{
  "name": "双杯套餐",
  "displayName": "双杯套餐",
  "description": "两杯饮品",
  "basePrice": 15.00
}
```

### 更新套餐
```http
PUT /combos/{comboId}
Content-Type: application/json

{
  "name": "双杯套餐",
  "displayName": "双杯套餐",
  "basePrice": 16.00
}
```

### 删除套餐
```http
DELETE /combos/{comboId}
```

### 获取套餐内商品
```http
GET /combos/{comboId}/items
```

### 添加商品到套餐
```http
POST /combos/{comboId}/items
Content-Type: application/json

{
  "itemId": "item-001",
  "quantity": 1
}
```

### 更新套餐内商品
```http
PUT /combos/{comboId}/items/{itemId}
Content-Type: application/json

{
  "quantity": 2
}
```

### 删除套餐内商品
```http
DELETE /combos/{comboId}/items/{itemId}
```

---

## 4️⃣ 修饰符管理

## 🎯 核心设计原则

### ✅ 修饰符配置的三层结构

```
1️⃣ 修饰符组级 (ModifierGroup)
   └─ 定义什么是修饰符组 (如"杯型"、"加料")

2️⃣ 修饰符选项级 (ModifierOption)
   └─ 定义选项本身 (如"大杯"、"中杯")
   └─ 定义属性: 名称、显示名称、默认价格、成本
   └─ ❌ 不定义: 是否默认选中、启用状态、排序顺序

3️⃣ 商品关联级 (ItemModifierOption) ⭐ NEW
   └─ 定义选项在【特定商品】中的配置
   └─ 定义属性: 是否默认、是否启用、显示顺序
```

### 商品和套餐的修饰符

- **商品 (Item)**: 有自己的修饰符配置
- **套餐 (Combo)**: ❌ 不需要自己的修饰符
  - ComboItem 通过关联 Item 来动态继承 Item 的修饰符配置
  - 用户为每个 ComboItem 分别选择修饰符

---

## 📚 API 端点详解

### 1️⃣ 修饰符组管理

#### 🔍 获取修饰符组列表
```http
GET /modifier-groups?groupType=property&isActive=true&nocache=1
```

**查询参数:**
- `groupType`: `property` | `addon` | `custom` (可选)
- `isActive`: `true` | `false` (默认: true)
- `nocache`: 传递任意值 (清除缓存重新查询，用于调试，可选)

**响应:**
```json
{
  "groups": [
    {
      "id": "group-001",
      "name": "cup_size",
      "displayName": "杯型",
      "groupType": "property",
      "isActive": true,
      "options": [
        {
          "id": "option-001",
          "name": "small",
          "displayName": "小杯",
          "defaultPrice": 0.00,
          "cost": 0.00,
          "isActive": true
        },
        {
          "id": "option-002",
          "name": "large",
          "displayName": "大杯",
          "defaultPrice": 2.00,
          "cost": 0.50,
          "isActive": true
        }
      ]
    }
  ],
  "count": 1,
  "timestamp": "2025-10-29T..."
}
```

**常见问题：options 数组为空？**
- ✅ 使用 `?nocache=1` 清除缓存重新查询
- ✅ 使用诊断端点检查数据：`GET /modifier-groups/diagnose?nocache=1`
- ✅ 确保选项的 `is_active` 字段为 `true`

---

#### ➕ 创建修饰符组
```http
POST /modifier-groups
Content-Type: application/json

{
  "name": "cup_size",
  "displayName": "杯型",
  "groupType": "property",
  "description": "商品杯型选择"
}
```

**字段说明:**
- `name`: 内部名称 (必填, 同租户内唯一)
- `displayName`: 显示名称 (必填)
- `groupType`: `property` 属性 | `addon` 加料 | `custom` 自定义
- `description`: 描述 (可选)

**注意:** 修饰符组本身不定义选择规则，规则在 ItemModifierGroup 中定义

---

#### ✏️ 更新修饰符组
```http
PUT /modifier-groups/{groupId}
Content-Type: application/json

{
  "displayName": "杯型（升级版）",
  "description": "商品杯型选择 - 已更新",
  "groupType": "property",
  "isActive": true
}
```

**可更新字段:**
- `displayName`: 显示名称
- `description`: 描述
- `groupType`: 修饰符类型
- `isActive`: 是否启用

**⚠️ 不可修改字段:**
- ❌ `name`: 系统内部唯一标识符，创建后不可修改

**注意:** 至少需要提供一个字段用于更新

---

#### ❌ 删除修饰符组
```http
DELETE /modifier-groups/{groupId}
```

**说明：**
- 删除整个修饰符组及其所有关联的选项
- 会级联删除该组包含的所有选项
- 注意：删除前应确保没有商品关联该组

---

#### 🎨 添加修饰符选项
```http
POST /modifier-groups/{groupId}/options
Content-Type: application/json

{
  "name": "large",
  "displayName": "大杯",
  "defaultPrice": 2.00,
  "cost": 0.50
}
```

**字段说明:**
- `name`: 选项内部名称 (必填)
- `displayName`: 显示名称 (必填)
- `defaultPrice`: 默认价格 (可选, 默认: 0)
- `cost`: 成本 (可选)

**重要:** 这里只定义选项本身的属性，不定义：
- ❌ 是否默认选中 (由商品决定)
- ❌ 是否启用 (由商品决定)
- ❌ 显示顺序 (由商品决定)

---

#### ✏️ 更新修饰符选项
```http
PUT /modifier-groups/{groupId}/options/{optionId}
Content-Type: application/json

{
  "displayName": "特大杯",
  "defaultPrice": 3.00,
  "cost": 0.75,
  "displayOrder": 2,
  "isActive": true
}
```

**可更新字段:**
- `displayName`: 显示名称
- `defaultPrice`: 默认价格
- `cost`: 成本
- `displayOrder`: 显示顺序 (用于全局排序)
- `isActive`: 是否激活

**⚠️ 不可修改字段:**
- ❌ `name`: 系统内部唯一标识符，创建后不可修改

**注意:** 至少需要提供一个字段用于更新

---

#### 🗑️ 删除修饰符选项
```http
DELETE /modifier-groups/{groupId}/options/{optionId}
```

**说明：**
- 删除特定的修饰符选项
- 会自动清除该选项的所有价格配置和关联信息

---

### 商品修饰符配置

#### 📖 获取商品的修饰符配置（包含价格）
```http
GET /items/{itemId}/modifiers
```

**响应:**
```json
{
  "itemId": "item-001",
  "groups": [
    {
      "id": "item-group-relation-001",
      "group": {
        "id": "group-001",
        "name": "cup_size",
        "displayName": "杯型",
        "isRequired": true,
        "minSelections": 1,
        "maxSelections": 1,
        "options": [
          {
            "id": "option-001",
            "name": "small",
            "displayName": "小杯",
            "defaultPrice": 0.00,
            "itemPrice": null,
            "finalPrice": 0.00,
            "itemOptions": [
              {
                "isDefault": true,
                "isEnabled": true,
                "displayOrder": 0
              }
            ]
          },
          {
            "id": "option-002",
            "name": "large",
            "displayName": "大杯",
            "defaultPrice": 2.00,
            "itemPrice": 2.50,
            "finalPrice": 2.50,
            "itemOptions": [
              {
                "isDefault": false,
                "isEnabled": true,
                "displayOrder": 1
              }
            ]
          }
        ]
      }
    }
  ],
  "count": 1
}
```

**字段说明:**
- `defaultPrice`: 修饰符选项本身的默认价格
- `itemPrice`: 该商品对该选项的商品级定价 (null = 未覆盖，使用 defaultPrice)
- `finalPrice`: 最终价格 (优先级: itemPrice > defaultPrice)

**前端渲染说明:**
- 遍历 `groups[].group.options[]`
- 使用 `itemOptions[0]` 中的配置来决定：
  - 是否默认选中
  - 是否显示/启用
  - 显示顺序
- 使用 `finalPrice` 作为展示价格（自动处理了价格优先级）

---

#### 🔗 为商品关联修饰符组
```http
POST /items/{itemId}/modifier-groups
Content-Type: application/json

{
  "modifierGroupId": "group-001",
  "isRequired": true,
  "minSelections": 1,
  "maxSelections": 1
}
```

**字段说明:**
- `modifierGroupId`: 修饰符组ID (必填)
- `isRequired`: 该组是否必选 (可选, 默认: false)
- `minSelections`: 最少选几个 (可选)
- `maxSelections`: 最多选几个 (可选)

**示例场景:**
- 杯型修饰符: `isRequired: true, minSelections: 1, maxSelections: 1`
- 加料修饰符: `isRequired: false, minSelections: 0, maxSelections: 3`

---

#### ✏️ 更新商品的修饰符组关联配置
```http
PUT /items/{itemId}/modifier-groups/{groupId}
Content-Type: application/json

{
  "isRequired": true,
  "minSelections": 1,
  "maxSelections": 1,
  "displayOrder": 0
}
```

**可更新字段:**
- `isRequired`: 该组是否必选
- `minSelections`: 最少选几个
- `maxSelections`: 最多选几个
- `displayOrder`: 显示顺序

**说明:**
- 这些是商品级别的选择规则，控制用户在该商品中如何选择修饰符
- 同一商品中多个修饰符组可以通过 displayOrder 来控制显示顺序

**注意:** 至少需要提供一个字段用于更新

---

#### ❌ 移除商品的修饰符组
```http
DELETE /items/{itemId}/modifier-groups/{groupId}
```

**说明:**
- 删除该商品和修饰符组的关联
- **级联删除**该商品对该组所有选项的：
  - 配置信息 (ItemModifierOption) - 如 isDefault、isEnabled、displayOrder
  - 价格覆盖 (ItemModifierPrice) - 如商品级定价
- 清空缓存，下次查询时重新加载

**注意:** 这个操作会完全清除该修饰符组相关的所有商品级配置和价格

---

#### 💰 设置商品的修饰符价格
```http
POST /items/{itemId}/modifier-prices
Content-Type: application/json

{
  "prices": [
    { "modifierOptionId": "option-001", "price": 0.00 },
    { "modifierOptionId": "option-002", "price": 2.50 }
  ]
}
```

**说明:**
- 为该商品上特定选项设置商品级定价
- 会覆盖选项的 `defaultPrice`
- 仍可被渠道价格（SourceModifierPrice）覆盖

**获取价格方式:**
- 使用 `GET /items/{itemId}/modifiers` 获取，响应中包含：
  - `defaultPrice`: 选项的默认价格
  - `itemPrice`: 商品对该选项的定价覆盖 (null = 未设置)
  - `finalPrice`: 最终价格（自动处理优先级）

---

#### 🗑️ 删除商品的修饰符价格
```http
DELETE /items/{itemId}/modifier-prices/{optionId}
```

**说明:**
- 删除该商品对该选项的商品级定价
- 之后该选项会使用修饰符的 `defaultPrice`

---

#### 🔧 为商品配置修饰符选项 ⭐ NEW
```http
POST /items/{itemId}/modifier-options
Content-Type: application/json

{
  "options": [
    {
      "modifierOptionId": "option-001",
      "isDefault": true,
      "isEnabled": true,
      "displayOrder": 0
    },
    {
      "modifierOptionId": "option-002",
      "isDefault": false,
      "isEnabled": true,
      "displayOrder": 1
    }
  ]
}
```

**字段说明:**
- `modifierOptionId`: 选项ID (必填)
- `isDefault`: 在该商品中是否默认选中 (可选, 默认: false)
- `isEnabled`: 在该商品中是否启用 (可选, 默认: true)
- `displayOrder`: 在该商品中的显示顺序 (可选)

**重要:**
- 🎯 这才是定义"默认选项"的正确位置！
- 同一个修饰符组内，最多一个选项可以 `isDefault: true`
- 通过 `isEnabled: false` 可以在特定商品中隐藏某些选项
- `displayOrder` 用来调整选项的显示顺序

---

#### 🗑️ 删除商品的修饰符选项配置
```http
DELETE /items/{itemId}/modifier-options/{optionId}
```

---

### 套餐修饰符说明 (Combo)

**⚠️ 重要提示：Combo 不需要自己的修饰符配置！**

#### 原理：
- ComboItem 通过关联 Item 来动态继承该 Item 的修饰符
- 每个 ComboItem 会自动获得其 Item 的所有修饰符配置

#### 前端业务流程：

```
1. 获取 Combo 详情
   GET /combos/{comboId}

2. 返回的 comboItems 中，每个 item 都包含:
   {
     "itemId": "tea-001",
     "item": { "name": "奶茶", ... },
     "inheritedModifiers": [  // ← 继承的修饰符
       {
         "groupName": "杯型",
         "options": [...]
       }
     ]
   }

3. 为每个 ComboItem 渲染其继承的修饰符
   (使用与单品相同的逻辑)

4. 订单提交时包含:
   {
     "comboId": "combo-001",
     "items": [
       {
         "itemId": "tea-001",
         "modifierSelections": [
           { "groupId": "size", "optionId": "large" }
         ]
       }
     ]
   }
```

---

## 5️⃣ 配方管理（Recipe Management）

### 🎯 核心设计理念

**简化架构**：每个修饰符组合对应一个独立的配方
- 用户先选择商品和修饰符组合
- 系统自动生成所有可能的组合列表
- 用户为每个组合创建一个配方（包含唯一的printCode和步骤）
- 订单下单时，根据选中的修饰符选项精确匹配到对应的配方

---

### 🔄 生成修饰符组合列表
```http
POST /items/{itemId}/recipes/generate-combinations
Content-Type: application/json

{
  "modifierGroupIds": ["group-001", "group-002"]
}

# 响应示例：大杯/中杯 × 冰/热 = 4种组合
{
  "combinations": [
    {
      "id": "combo-1",
      "options": [
        { "modifierGroupId": "group-001", "modifierOptionId": "opt-large", "displayName": "大杯" },
        { "modifierGroupId": "group-002", "modifierOptionId": "opt-ice", "displayName": "冰" }
      ],
      "hasRecipe": false
    },
    {
      "id": "combo-2",
      "options": [
        { "modifierGroupId": "group-001", "modifierOptionId": "opt-large", "displayName": "大杯" },
        { "modifierGroupId": "group-002", "modifierOptionId": "opt-hot", "displayName": "热" }
      ],
      "hasRecipe": true
    }
    // ... 更多组合
  ]
}
```

**说明：**
- 返回笛卡尔积的所有可能组合
- `hasRecipe` 标记该组合是否已有配方
- 前端可用于显示"已有配方"和"待创建配方"的组合

---

### ➕ 创建配方
```http
POST /recipes
Content-Type: application/json

{
  "itemId": "item-001",
  "printCode": "LICE",
  "displayCodeString": "L-ICE",
  "description": "大杯冰咖啡",
  "conditions": [
    {
      "modifierGroupId": "group-001",
      "modifierOptionId": "opt-large"
    },
    {
      "modifierGroupId": "group-002",
      "modifierOptionId": "opt-ice"
    }
  ],
  "steps": [
    {
      "stepTypeId": "type-001",
      "displayOrder": 1,
      "instruction": "200ml",  // 统一字段：可以是数量(200ml)、操作(加热)、快捷键(2)等
      "metadata": {             // 步骤元数据：包含关系、原料信息等
        "containedStepIndices": [0, 1, 2]  // 如果是设备步骤，记录包含的子步骤索引
      }
    },
    {
      "stepTypeId": "type-002",
      "displayOrder": 2,
      "instruction": "加热"
    }
  ]
}

# 响应
{
  "id": "recipe-001",
  "itemId": "item-001",
  "name": "大杯冰咖啡",      // 自动生成，基于选项displayName
  "printCode": "LICE",
  "displayCodeString": "L-ICE",
  "description": "大杯冰咖啡",
  "isActive": true,
  "priority": 0,
  "steps": [...]
}
```

**字段说明：**
- `printCode`: **必填** - 订单打印代码（如：LICE、MHOT）
- `displayCodeString`: 可选 - 显示代码（如：L-ICE、M-HOT）
- `conditions`: **必填** - 修饰符条件数组，每个组最多一个
- `steps`: 可选 - 配方步骤数组

---

### 📋 获取商品的所有配方
```http
GET /items/{itemId}/recipes

# 响应
{
  "itemId": "item-001",
  "recipes": [
    {
      "id": "recipe-001",
      "name": "大杯冰咖啡",
      "printCode": "LICE",
      "displayCodeString": "L-ICE",
      "description": "大杯冰咖啡",
      "isActive": true,
      "priority": 0,
      "modifierConditions": [
        { "modifierGroupId": "group-001", "modifierOptionId": "opt-large" },
        { "modifierGroupId": "group-002", "modifierOptionId": "opt-ice" }
      ],
      "steps": [...]
    }
    // ... 更多配方
  ],
  "totalRecipes": 4
}
```

---

### 🔍 获取配方详情
```http
GET /recipes/{recipeId}

# 响应
{
  "id": "recipe-001",
  "itemId": "item-001",
  "name": "大杯冰咖啡",
  "printCode": "[MK200GT350ICE320SGR2]2",
  "displayCodeString": "L-ICE",
  "description": "大杯冰咖啡",
  "isActive": true,
  "priority": 0,
  "modifierConditions": [
    {
      "id": "cond-001",
      "modifierGroupId": "group-001",
      "modifierOptionId": "opt-large"
    }
  ],
  "steps": [
    {
      "id": "step-001",
      "stepNumber": 1,
      "stepTypeId": "type-milk",
      "stepTypeName": "Milk",
      "instruction": "200",
      "metadata": {
        "items": [
          { "name": "牛奶", "amount": "200", "unit": "ml" }
        ]
      },
      "containedSteps": []
    },
    {
      "id": "step-002",
      "stepNumber": 2,
      "stepTypeId": "type-glass",
      "stepTypeName": "Glass",
      "instruction": "倒入",
      "metadata": null,
      "containedSteps": []
    },
    {
      "id": "step-003",
      "stepNumber": 3,
      "stepTypeId": "type-ice",
      "stepTypeName": "Ice",
      "instruction": "320",
      "metadata": null,
      "containedSteps": []
    },
    {
      "id": "step-004",
      "stepNumber": 4,
      "stepTypeId": "type-blender",
      "stepTypeName": "Blender",
      "instruction": "2",
      "metadata": {
        "containedStepIndices": [0, 1, 2]
      },
      "containedSteps": [
        {
          "id": "step-001",
          "stepNumber": 1,
          "stepTypeName": "Milk",
          "instruction": "200"
        },
        {
          "id": "step-002",
          "stepNumber": 2,
          "stepTypeName": "Glass",
          "instruction": "倒入"
        },
        {
          "id": "step-003",
          "stepNumber": 3,
          "stepTypeName": "Ice",
          "instruction": "320"
        }
      ]
    }
  ],
  "totalSteps": 4,
  "totalDuration": 0,
  "createdAt": "2025-10-30T...",
  "updatedAt": "2025-10-30T..."
}
```

**步骤字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 步骤唯一标识 |
| `stepNumber` | number | 步骤序号（1-based） |
| `stepTypeId` | string | 步骤类型ID（如 Milk、Blender） |
| `stepTypeName` | string | 步骤类型名称 |
| `instruction` | string | 操作指令：数量(200)、操作(加热)、快捷键(2)等 |
| `metadata` | object \| null | 步骤元数据（见下表） |
| `containedSteps` | array | **重要**: 该步骤包含的子步骤（仅设备步骤有值） |

**metadata 字段说明：**
| 用途 | 格式 | 说明 |
|------|------|------|
| 原料步骤 | `{ "items": [...] }` | 存储原料信息列表，每项含 name、amount、unit |
| 设备步骤 | `{ "containedStepIndices": [0,1,2] }` | 存储被包含的子步骤索引（相对于当前配方的步骤数组） |
| 无额外数据 | `null` | 简单操作步骤，如"倒入"、"搅拌" |

**containedSteps 计算逻辑：**
- 当 `metadata.containedStepIndices` 存在时，后端自动查找对应的步骤对象
- 返回的 `containedSteps` 数组包含完整的步骤信息（id、stepNumber、stepTypeName、instruction）
- 若无包含关系，`containedSteps` 为空数组 `[]`

---

### ✏️ 更新配方
```http
PUT /recipes/{recipeId}
Content-Type: application/json

{
  "printCode": "LICE",
  "displayCodeString": "L-ICE",
  "description": "大杯冰咖啡（升级版）",
  "isActive": true,
  "priority": 1
}
```

**可更新字段：**
- `printCode`: 打印代码
- `displayCodeString`: 显示代码
- `description`: 描述
- `isActive`: 是否启用
- `priority`: 优先级（用于匹配时的排序）

**注意：** 条件（conditions）不能通过此接口更新，需删除后重建

---

### 🔄 更新配方步骤
```http
PUT /recipes/{recipeId}/steps
Content-Type: application/json

{
  "steps": [
    {
      "stepTypeId": "type-001",
      "displayOrder": 1,
      "instruction": "200ml",  // 统一字段：数量、操作、快捷键等
      "metadata": {
        "items": [               // 原料信息（可选）
          { "name": "牛奶", "amount": "200", "unit": "ml" }
        ]
      }
    },
    {
      "stepTypeId": "type-002",
      "displayOrder": 2,
      "instruction": "加热"
    },
    {
      "stepTypeId": "type-003",
      "displayOrder": 3,
      "instruction": "2",
      "metadata": {
        "containedStepIndices": [0, 1]  // 设备步骤：包含的子步骤索引
      }
    }
  ]
}
```

**说明：** 完全替换配方的步骤列表

**`instruction` 字段用途示例：**
- 原料数量：`"200"`, `"2"`, `"50ml"`
- 操作命令：`"加热"`, `"搅拌"`, `"倒入"`
- 快捷键：`"2"`, `"长按3秒"`
- 其他指令：任意简短文本，员工通过打印可快速理解

**`metadata` 字段用途：**
- 原料步骤：`{ "items": [{ "name": "牛奶", "amount": "200", "unit": "ml" }] }`
- 设备步骤：`{ "containedStepIndices": [0, 1, 2] }` （包含的子步骤索引）
- 自定义数据：任意 JSON 结构

---

### 📋 复制配方到其他组合
```http
POST /recipes/{recipeId}/copy
Content-Type: application/json

{
  "targetCombinations": [
    {
      "conditions": [
        { "modifierGroupId": "group-001", "modifierOptionId": "opt-medium" },
        { "modifierGroupId": "group-002", "modifierOptionId": "opt-ice" }
      ],
      "printCode": "MICE",
      "displayCodeString": "M-ICE"
    },
    {
      "conditions": [
        { "modifierGroupId": "group-001", "modifierOptionId": "opt-medium" },
        { "modifierGroupId": "group-002", "modifierOptionId": "opt-hot" }
      ],
      "printCode": "MHOT",
      "displayCodeString": "M-HOT"
    }
  ]
}

# 响应
{
  "sourceRecipeId": "recipe-001",
  "createdCount": 2,
  "failedCount": 0,
  "recipes": [...]
}
```

**用途：** 快速创建多个类似配方，步骤相同但printCode和条件不同

---

### ❌ 删除配方
```http
DELETE /recipes/{recipeId}
```

---

### 🎯 匹配配方（订单核心功能）⭐
```http
POST /recipes/match
Content-Type: application/json

{
  "itemId": "item-001",
  "selectedOptions": ["opt-large", "opt-ice"]
}

# 响应
{
  "matched": true,
  "recipe": {
    "id": "recipe-001",
    "name": "大杯冰咖啡",
    "printCode": "LICE",
    "displayCodeString": "L-ICE",
    "description": "大杯冰咖啡",
    "steps": [...]
  },
  "printCode": "LICE"
}

# 未匹配
{
  "matched": false,
  "message": "未找到匹配的配方",
  "selectedOptions": ["opt-large", "opt-ice"]
}
```

**说明：**
- 用户下单时调用此接口
- 根据选中的修饰符选项精确匹配配方
- 返回的 `printCode` 用于POS打印

---

### 📊 配方设计完整流程示例

**场景：创建"咖啡"商品的4个配方（大/中 × 冰/热）**

#### Step 1: 生成组合列表
```bash
POST /items/item-001/recipes/generate-combinations
{
  "modifierGroupIds": ["size", "temperature"]
}
# 返回4个可能的组合
```

#### Step 2: 为第一个组合创建配方
```bash
POST /recipes
{
  "itemId": "item-001",
  "printCode": "LICE",
  "displayCodeString": "L-ICE",
  "description": "大杯冰咖啡",
  "conditions": [
    { "modifierGroupId": "size", "modifierOptionId": "large" },
    { "modifierGroupId": "temperature", "modifierOptionId": "ice" }
  ],
  "steps": [...]
}
# 返回: recipe-001
```

#### Step 3: 复制到其他3个组合
```bash
POST /recipes/recipe-001/copy
{
  "targetCombinations": [
    { "conditions": [...], "printCode": "LHOT" },
    { "conditions": [...], "printCode": "MICE" },
    { "conditions": [...], "printCode": "MHOT" }
  ]
}
# 快速创建3个配方，步骤相同
```

#### Step 4: 订单时匹配配方
```bash
POST /recipes/match
{
  "itemId": "item-001",
  "selectedOptions": ["large", "ice"]
}
# 返回: recipe-001（LICE）
```

---

## 6️⃣ 步骤类型管理

### 获取设备符号列表
```http
GET /step-types/equipment/symbols

# 响应
{
  "symbols": [
    { "code": "mixer", "name": "搅拌机", "icon": "🥄" },
    { "code": "oven", "name": "烤箱", "icon": "🔥" }
  ]
}
```

### 获取步骤类型列表
```http
GET /step-types
```

### 获取步骤类型详情
```http
GET /step-types/{typeId}
```

### 创建步骤类型
```http
POST /step-types
Content-Type: application/json

{
  "name": "烧水",
  "code": "HEAT_WATER",
  "equipment": "奶茶机",
  "description": "加热水至目标温度"
}
```

### 更新步骤类型
```http
PUT /step-types/{typeId}
Content-Type: application/json

{
  "name": "烧水升级版",
  "description": "加热水至目标温度并确保纯度"
}
```

### 删除步骤类型
```http
DELETE /step-types/{typeId}
```

### 代码建议
```http
POST /step-types/suggest
Content-Type: application/json

{
  "context": "烧水"
}

# 返回建议的代码和步骤
{
  "suggestions": [...]
}
```

---

## 7️⃣ 价格管理

## 🎯 核心概念

### 渠道定价（Source Pricing）
系统使用 **"来源定价"（Source Pricing）** 来实现多渠道差异化定价：
- **sourceCode** = 渠道标识（如 `"meituan"`、`"eleme"`、`"dianping"` 等）
- 支持对 **商品、套餐、修饰符** 三个维度进行渠道价格覆盖
- 前端计算最终价格，后端专注于数据存储

---

## 7.1 数据库表结构

### 📊 三层价格表设计

系统通过三张独立的价格表实现渠道定价：

#### 1️⃣ 商品渠道价格表 (`source_item_prices`)

```sql
CREATE TABLE source_item_prices (
  id          VARCHAR(36) PRIMARY KEY,
  tenant_id   VARCHAR(36) NOT NULL,
  source_code VARCHAR(100) NOT NULL,  -- 渠道代码
  item_id     VARCHAR(36) NOT NULL,   -- 商品ID
  price       DECIMAL(10,2) NOT NULL, -- 渠道价格
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY (tenant_id, source_code, item_id),
  INDEX (tenant_id, source_code)
);
```

**用途**: 覆盖商品的基础价格（`Item.basePrice`）

---

#### 2️⃣ 套餐渠道价格表 (`source_combo_prices`)

```sql
CREATE TABLE source_combo_prices (
  id          VARCHAR(36) PRIMARY KEY,
  tenant_id   VARCHAR(36) NOT NULL,
  source_code VARCHAR(100) NOT NULL,  -- 渠道代码
  combo_id    VARCHAR(36) NOT NULL,   -- 套餐ID
  price       DECIMAL(10,2) NOT NULL, -- 渠道价格
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY (tenant_id, source_code, combo_id),
  INDEX (tenant_id, source_code)
);
```

**用途**: 覆盖套餐的基础价格（`Combo.basePrice`）

---

#### 3️⃣ 修饰符渠道价格表 (`source_modifier_prices`) ⭐ 核心

```sql
CREATE TABLE source_modifier_prices (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  source_code         VARCHAR(100) NOT NULL,      -- 渠道代码
  item_id             VARCHAR(36) NOT NULL,       -- 商品ID（精确到商品）
  modifier_option_id  VARCHAR(36) NOT NULL,       -- 修饰符选项ID
  price               DECIMAL(10,2) NOT NULL,     -- 渠道价格
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY (tenant_id, source_code, item_id, modifier_option_id),
  INDEX (tenant_id, source_code, item_id),
  FOREIGN KEY (modifier_option_id) REFERENCES modifier_options(id)
);
```

**用途**: 在特定渠道和商品上，覆盖修饰符选项的价格（优先级最高）

---

### 🎯 价格优先级机制

#### 商品基础价格计算
```
渠道商品价格 (source_item_prices)
   ↓ 不存在则使用
商品基础价格 (items.base_price)
```

#### 修饰符价格计算（三级优先级）⭐
```
1️⃣ 渠道修饰符价格 (source_modifier_prices)        [最高优先级]
   ↓ 不存在则使用
2️⃣ 商品级修饰符价格 (item_modifier_prices)         [中等优先级]
   ↓ 不存在则使用
3️⃣ 修饰符默认价格 (modifier_options.default_price) [最低优先级]
```

**价格计算伪代码**:
```typescript
async function calculateModifierPrice(
  itemId: string,
  modifierOptionId: string,
  sourceCode: string = 'default'
): Promise<number> {
  // 优先级 1: 渠道覆盖价格
  const sourcePrice = await db.sourceModifierPrice.findFirst({
    where: { sourceCode, itemId, modifierOptionId }
  });
  if (sourcePrice) return sourcePrice.price;

  // 优先级 2: 商品级定价
  const itemPrice = await db.itemModifierPrice.findFirst({
    where: { itemId, modifierOptionId }
  });
  if (itemPrice) return itemPrice.price;

  // 优先级 3: 默认价格
  const option = await db.modifierOption.findFirst({
    where: { id: modifierOptionId }
  });
  return option.defaultPrice;
}
```

---

## 7.2 商品渠道价格 API

### 批量设置商品渠道价格
```http
POST /source-prices/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "prices": [
    { "sourceCode": "meituan", "itemId": "item-001", "price": 25.00 },
    { "sourceCode": "eleme", "itemId": "item-001", "price": 24.50 },
    { "sourceCode": "meituan", "itemId": "item-002", "price": 30.00 }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "count": 3,
  "prices": [
    {
      "id": "price-001",
      "sourceCode": "meituan",
      "itemId": "item-001",
      "price": 25.00,
      "updatedAt": "2025-11-05T..."
    }
  ]
}
```

**说明:**
- 如果价格已存在，会自动更新
- 使用 upsert 策略（存在则更新，不存在则创建）
- 支持一次设置多个商品和多个渠道的价格

---

### 查询商品渠道价格
```http
POST /source-prices/query
Content-Type: application/json
Authorization: Bearer {token}

{
  "sourceCode": "meituan",
  "itemIds": ["item-001", "item-002"]
}
```

**响应:**
```json
{
  "sourceCode": "meituan",
  "prices": [
    {
      "id": "price-001",
      "itemId": "item-001",
      "itemName": "奶茶",
      "price": 25.00,
      "basePrice": 18.00,
      "updatedAt": "2025-11-05T..."
    },
    {
      "id": "price-002",
      "itemId": "item-002",
      "itemName": "咖啡",
      "price": 30.00,
      "basePrice": 25.00,
      "updatedAt": "2025-11-05T..."
    }
  ],
  "count": 2
}
```

**字段说明:**
- `price`: 渠道覆盖价格
- `basePrice`: 商品基础价格（用于对比）
- `itemName`: 商品名称（方便前端展示）

---

### 删除单个商品的渠道价格
```http
DELETE /source-prices/{sourceCode}/{itemId}
Authorization: Bearer {token}
```

**示例:**
```bash
DELETE /source-prices/meituan/item-001
```

**响应:**
```json
{
  "success": true,
  "message": "渠道商品价格已删除"
}
```

**说明:** 删除后，该商品在该渠道会回退到使用基础价格

---

### 删除整个渠道的所有商品价格
```http
DELETE /source-prices/source/{sourceCode}
Authorization: Bearer {token}
```

**示例:**
```bash
DELETE /source-prices/source/meituan
```

**响应:**
```json
{
  "success": true,
  "deletedCount": 15,
  "message": "已删除该渠道的所有商品价格"
}
```

**说明:** 批量删除该渠道的所有商品价格配置

---

## 7.3 套餐渠道价格 API

### 批量设置套餐渠道价格
```http
POST /source-combo-prices/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "prices": [
    { "sourceCode": "meituan", "comboId": "combo-001", "price": 35.00 },
    { "sourceCode": "eleme", "comboId": "combo-001", "price": 34.50 }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "count": 2,
  "prices": [
    {
      "id": "combo-price-001",
      "sourceCode": "meituan",
      "comboId": "combo-001",
      "price": 35.00,
      "updatedAt": "2025-11-05T..."
    }
  ]
}
```

---

### 查询套餐渠道价格
```http
POST /source-combo-prices/query
Content-Type: application/json
Authorization: Bearer {token}

{
  "sourceCode": "meituan",
  "comboIds": ["combo-001", "combo-002"]
}
```

**响应:**
```json
{
  "sourceCode": "meituan",
  "prices": [
    {
      "id": "combo-price-001",
      "comboId": "combo-001",
      "comboName": "双杯套餐",
      "price": 35.00,
      "basePrice": 30.00,
      "updatedAt": "2025-11-05T..."
    }
  ],
  "count": 1
}
```

---

### 删除单个套餐的渠道价格
```http
DELETE /source-combo-prices/{sourceCode}/{comboId}
Authorization: Bearer {token}
```

**示例:**
```bash
DELETE /source-combo-prices/meituan/combo-001
```

---

### 删除整个渠道的所有套餐价格
```http
DELETE /source-combo-prices/source/{sourceCode}
Authorization: Bearer {token}
```

**示例:**
```bash
DELETE /source-combo-prices/source/meituan
```

---

## 7.4 修饰符渠道价格 API

### 💵 计算商品最终价格
```http
POST /pricing/calculate
Content-Type: application/json

{
  "itemId": "item-001",
  "sourceCode": "meituan",
  "modifiers": [
    { "optionId": "option-001", "quantity": 1 },
    { "optionId": "option-002", "quantity": 2 }
  ]
}
```

**响应:**
```json
{
  "itemId": "item-001",
  "itemName": "奶茶",
  "basePrice": 8.00,
  "sourceCode": "meituan",
  "modifiers": [
    {
      "optionId": "option-001",
      "optionName": "大杯",
      "unitPrice": 2.50,
      "quantity": 1,
      "subtotal": 2.50,
      "priceSource": "source"  // source | item | default
    },
    {
      "optionId": "option-002",
      "optionName": "布丁",
      "unitPrice": 0.50,
      "quantity": 2,
      "subtotal": 1.00,
      "priceSource": "item"
    }
  ],
  "totalPrice": 11.50,
  "currency": "CNY"
}
```

**priceSource 字段说明:**
- `"source"`: 使用渠道覆盖价格（`source_modifier_prices`）
- `"item"`: 使用商品级定价（`item_modifier_prices`）
- `"default"`: 使用修饰符默认价格（`modifier_options.default_price`）

---

## 7.5 渠道定义和管理

### 🎨 渠道代码定义

系统采用 **字符串代码** 方式定义渠道，无需预先在数据库中配置渠道表。

**常见渠道代码示例:**
- `"meituan"` - 美团外卖
- `"eleme"` - 饿了么
- `"dianping"` - 大众点评
- `"douyin"` - 抖音外卖
- `"pos"` - 线下POS系统
- `"wechat"` - 微信小程序
- `"default"` - 默认渠道（基础价格）

**使用方式:**
```typescript
// 前端下单时指定渠道
const order = {
  itemId: "item-001",
  sourceCode: "meituan",  // 指定渠道代码
  modifiers: [...]
};

// 计算价格时自动应用渠道定价
POST /pricing/calculate
{
  "itemId": "item-001",
  "sourceCode": "meituan"
}
```

---

### 🔒 多租户隔离机制

所有定价表都包含 `tenant_id` 字段，实现租户间的完全隔离：

**自动提取租户ID:**
```typescript
// 从 JWT token 自动提取租户ID
const { tenantId } = req.user;

// 所有查询自动添加租户过滤
await prisma.sourceItemPrice.findMany({
  where: {
    tenantId,      // 自动过滤
    sourceCode: "meituan"
  }
});
```

**唯一性约束:**
```sql
-- 确保每个租户的每个渠道每个商品只有一条价格记录
UNIQUE KEY (tenant_id, source_code, item_id)
```

---

### 📊 完整业务流程示例

#### 场景：为"奶茶"商品在美团渠道设置差异化价格

**Step 1: 设置商品基础价格（在美团渠道）**
```bash
POST /source-prices/batch
{
  "prices": [
    { "sourceCode": "meituan", "itemId": "tea-001", "price": 20.00 }
  ]
}
# 原基础价格: 18.00，美团渠道覆盖为: 20.00
```

**Step 2: 设置修饰符渠道价格**
```bash
POST /source-prices/modifiers
{
  "sourceCode": "meituan",
  "prices": [
    { "itemId": "tea-001", "modifierOptionId": "large", "price": 3.00 },
    { "itemId": "tea-001", "modifierOptionId": "pearl", "price": 1.50 }
  ]
}
# 大杯在美团: 3.00（原默认价格可能是2.00）
# 珍珠在美团: 1.50（原默认价格可能是1.00）
```

**Step 3: 前端下单时计算价格**
```bash
POST /pricing/calculate
{
  "itemId": "tea-001",
  "sourceCode": "meituan",
  "modifiers": [
    { "optionId": "large", "quantity": 1 },
    { "optionId": "pearl", "quantity": 2 }
  ]
}

# 返回计算结果:
# basePrice: 20.00 (使用美团渠道价格)
# 大杯: 3.00 × 1 = 3.00 (使用美团渠道价格, priceSource: "source")
# 珍珠: 1.50 × 2 = 3.00 (使用美团渠道价格, priceSource: "source")
# totalPrice: 20.00 + 3.00 + 3.00 = 26.00
```

**Step 4: 对比其他渠道（未设置渠道价格）**
```bash
POST /pricing/calculate
{
  "itemId": "tea-001",
  "sourceCode": "eleme",  # 饿了么渠道（未设置专属价格）
  "modifiers": [
    { "optionId": "large", "quantity": 1 },
    { "optionId": "pearl", "quantity": 2 }
  ]
}

# 返回计算结果:
# basePrice: 18.00 (回退到基础价格)
# 大杯: 2.00 × 1 = 2.00 (回退到默认价格, priceSource: "default")
# 珍珠: 1.00 × 2 = 2.00 (回退到默认价格, priceSource: "default")
# totalPrice: 18.00 + 2.00 + 2.00 = 22.00
```

---

### 设置渠道的修饰符价格
```http
POST /source-prices/modifiers
Content-Type: application/json
Authorization: Bearer {token}

{
  "sourceCode": "meituan",
  "prices": [
    {
      "itemId": "item-001",
      "modifierOptionId": "option-001",
      "price": 3.00
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "count": 1,
  "prices": [
    {
      "id": "mod-price-001",
      "sourceCode": "meituan",
      "itemId": "item-001",
      "modifierOptionId": "option-001",
      "price": 3.00,
      "updatedAt": "2025-11-05T..."
    }
  ]
}
```

---

### 查询渠道的修饰符价格
```http
POST /source-prices/modifiers/query
Content-Type: application/json

{
  "sourceCode": "meituan",
  "itemIds": ["item-001", "item-002"],
  "optionIds": ["option-001"]
}
```

#### 🗑️ 删除渠道修饰符价格
```http
DELETE /source-prices/modifiers/{sourceCode}/{itemId}/{optionId}

DELETE /source-prices/modifiers/by-source/{sourceCode}  # 删除整个渠道
```

---

## 🚀 完整业务流程示例

### 场景：创建"奶茶"商品的修饰符体系

#### 第 1 步：创建修饰符组
```bash
POST /modifier-groups
{
  "name": "cup_size",
  "displayName": "杯型",
  "groupType": "property"
}
# 返回: group-001
```

#### 第 2 步：为修饰符组添加选项
```bash
POST /modifier-groups/group-001/options
{
  "name": "small",
  "displayName": "小杯",
  "defaultPrice": 0.00
}
# 返回: option-001

POST /modifier-groups/group-001/options
{
  "name": "large",
  "displayName": "大杯",
  "defaultPrice": 2.00
}
# 返回: option-002
```

#### 第 3 步：为商品关联修饰符组
```bash
POST /items/item-001/modifier-groups
{
  "modifierGroupId": "group-001",
  "isRequired": true,
  "minSelections": 1,
  "maxSelections": 1
}
```

#### 第 4 步：配置选项在该商品中的行为
```bash
POST /items/item-001/modifier-options
{
  "options": [
    {
      "modifierOptionId": "option-001",
      "isDefault": true,      # 小杯是默认选项
      "isEnabled": true,
      "displayOrder": 0
    },
    {
      "modifierOptionId": "option-002",
      "isDefault": false,
      "isEnabled": true,
      "displayOrder": 1
    }
  ]
}
```

#### 第 5 步：（可选）设置商品级价格
```bash
POST /items/item-001/modifier-prices
{
  "prices": [
    { "modifierOptionId": "option-002", "price": 2.50 }
  ]
}
```

#### 第 6 步：（可选）为美团设置特殊价格
```bash
POST /source-prices/modifiers
{
  "sourceCode": "meituan",
  "prices": [
    {
      "itemId": "item-001",
      "modifierOptionId": "option-002",
      "price": 3.00
    }
  ]
}
```

#### 第 7 步：前端获取并显示
```bash
GET /items/item-001/modifiers

# 前端根据 isDefault/isEnabled/displayOrder 来渲染
```

---

## 📊 HTTP 状态码

| 状态码 | 含义 | 示例 |
|--------|------|------|
| 200 | OK | 查询/更新成功 |
| 201 | Created | 创建资源成功 |
| 400 | Bad Request | 参数错误或缺少必填字段 |
| 404 | Not Found | 资源不存在 |
| 500 | Server Error | 服务器错误 |

---

## 📌 关键设计原则

### Name 字段不可修改

**为什么 `name` 字段不能修改？**

1. **系统唯一标识符** - `name` 是修饰符组和选项的内部唯一标识符（同租户内）
2. **引用完整性** - 其他系统模块可能通过 `name` 来引用这些修饰符
3. **API 稳定性** - 如果允许修改 `name`，会导致依赖于旧 `name` 的集成出现问题
4. **审计追溯** - `name` 作为不变的标识符，便于系统审计和日志追踪

**修改策略：**
- 如果需要改变显示名称 → 修改 `displayName` 字段
- 如果需要改变描述信息 → 修改 `description` 字段
- 如果需要改变类型 → 修改 `groupType` 字段（针对修饰符组）
- 如果需要彻底重新命名 → 删除旧的，创建新的（保持 name 唯一性）

**前端应用：**
- 在编辑界面中，`name` 字段应该是**只读**或**隐藏**的
- 只允许编辑其他可修改的字段
- 如果用户想要改变 name，应该提示删除后重新创建

---

## 🔧 诊断和故障排除

### 问题：GET /modifier-groups 返回的 options 数组为空

**原因分析：**
1. **缓存问题** - 旧数据被缓存
2. **选项未激活** - 选项的 `is_active` 字段为 `false`
3. **选项没有关联** - 选项没有正确创建或关联到组

**解决方法：**

#### 1️⃣ 清除缓存并重新查询
```bash
# 方法 1：使用 nocache 参数
curl -X GET "http://localhost:3001/api/item-manage/v1/modifier-groups?nocache=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 方法 2：使用诊断端点（完整信息）
curl -X GET "http://localhost:3001/api/item-manage/v1/modifier-groups/diagnose" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2️⃣ 诊断端点返回示例
```json
{
  "diagnosis": {
    "tenantId": "tenant-001",
    "timestamp": "2025-10-29T...",
    "groupCount": 2,
    "groups": [
      {
        "id": "group-001",
        "name": "cup_size",
        "displayName": "杯型",
        "groupType": "property",
        "isActive": true,
        "optionCount": 2,
        "options": [
          {
            "id": "option-001",
            "name": "small",
            "displayName": "小杯",
            "isActive": true,
            "defaultPrice": "0.00"
          },
          {
            "id": "option-002",
            "name": "large",
            "displayName": "大杯",
            "isActive": true,
            "defaultPrice": "2.00"
          }
        ]
      }
    ]
  }
}
```

#### 3️⃣ 检查清单
- [ ] 修饰符组的 `is_active` 为 `true`
- [ ] 修饰符选项的 `is_active` 为 `true`
- [ ] 清除缓存后重新查询：`?nocache=1`
- [ ] 检查诊断端点输出
- [ ] 查看应用日志中的调试信息

---

## 🧪 测试 cURL 命令

### 创建修饰符组
```bash
curl -X POST http://localhost:3001/api/item-manage/v1/modifier-groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sugar_level",
    "displayName": "糖度",
    "groupType": "property",
    "description": "饮品糖度选择"
  }'
```

### 添加修饰符选项
```bash
curl -X POST http://localhost:3001/api/item-manage/v1/modifier-groups/group-001/options \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "half_sugar",
    "displayName": "半糖",
    "defaultPrice": 0,
    "cost": 0
  }'
```

### 删除修饰符选项
```bash
curl -X DELETE http://localhost:3001/api/item-manage/v1/modifier-groups/group-001/options/opt-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 删除修饰符组
```bash
curl -X DELETE http://localhost:3001/api/item-manage/v1/modifier-groups/group-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 为商品配置选项
```bash
curl -X POST http://localhost:3001/api/item-manage/v1/items/item-001/modifier-options \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {
        "modifierOptionId": "opt-001",
        "isDefault": true,
        "isEnabled": true,
        "displayOrder": 0
      }
    ]
  }'
```

### 计算价格
```bash
curl -X POST http://localhost:3001/api/item-manage/v1/pricing/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-001",
    "sourceCode": "meituan",
    "modifiers": [
      { "optionId": "opt-001", "quantity": 1 }
    ]
  }'
```

### 分类管理
```bash
# 获取分类树
curl -X GET http://localhost:3001/api/item-manage/v1/categories/tree

# 创建分类
curl -X POST http://localhost:3001/api/item-manage/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "热饮",
    "displayName": "热饮",
    "parentId": null
  }'
```

### 商品管理
```bash
# 获取商品列表
curl -X GET "http://localhost:3001/api/item-manage/v1/items?limit=20&offset=0"

# 搜索商品
curl -X GET "http://localhost:3001/api/item-manage/v1/items/search/奶茶"

# 创建商品
curl -X POST http://localhost:3001/api/item-manage/v1/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "奶茶",
    "displayName": "招牌奶茶",
    "categoryId": "cat-001",
    "basePrice": 8.00,
    "cost": 2.50
  }'
```

### 套餐管理
```bash
# 创建套餐
curl -X POST http://localhost:3001/api/item-manage/v1/combos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "双杯套餐",
    "displayName": "双杯套餐",
    "basePrice": 15.00
  }'

# 添加商品到套餐
curl -X POST http://localhost:3001/api/item-manage/v1/combos/combo-001/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-001",
    "quantity": 1
  }'
```

### 制作指引
```bash
# 创建配方
curl -X POST http://localhost:3001/api/item-manage/v1/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "奶茶配方",
    "itemId": "item-001",
    "description": "招牌奶茶制作流程"
  }'

# 添加配方步骤
curl -X POST http://localhost:3001/api/item-manage/v1/recipes/recipe-001/steps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stepTypeId": "type-001",
    "sequence": 1,
    "duration": 30,
    "instructions": "加水烧热"
  }'
```

### 步骤类型
```bash
# 获取步骤类型列表
curl -X GET http://localhost:3001/api/item-manage/v1/step-types

# 创建步骤类型
curl -X POST http://localhost:3001/api/item-manage/v1/step-types \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "烧水",
    "code": "HEAT_WATER",
    "equipment": "奶茶机",
    "description": "加热水至目标温度"
  }'
```

### 渠道价格
```bash
# 设置渠道修饰符价格
curl -X POST http://localhost:3001/api/item-manage/v1/source-prices/modifiers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "meituan",
    "prices": [
      {
        "itemId": "item-001",
        "modifierOptionId": "opt-001",
        "price": 3.00
      }
    ]
  }'
```

---

## ⚡ 前端集成检查清单

### 修饰符组管理
- [ ] 创建修饰符组时，不定义 `selectionRequired`/`minSelections`/`maxSelections`
- [ ] **编辑模式下，禁用 `name` 字段** - name 是系统唯一标识符，创建后不可修改
- [ ] 编辑时只允许修改：displayName、description、groupType、isActive

### 修饰符选项管理
- [ ] 添加修饰符选项时，不定义 `isDefault`
- [ ] **编辑模式下，禁用 `name` 字段** - name 是系统唯一标识符，创建后不可修改
- [ ] 编辑时只允许修改：displayName、defaultPrice、cost、displayOrder、isActive

### 商品修饰符配置
- [ ] 关联商品和修饰符组时，定义选择规则 (`isRequired`, `min/maxSelections`)
- [ ] 配置选项行为时，定义 `isDefault`/`isEnabled`/`displayOrder`
- [ ] 获取商品修饰符时，检查 `itemOptions` 数组来获取配置

### 其他
- [ ] Combo 中不创建自己的修饰符，直接使用 Item 的修饰符
- [ ] 价格计算时，使用 `sourceCode` 参数来获得正确的渠道价格
- [ ] 错误处理时，检查返回的 `error` 字段

---

**版本:** v2.4.0 | **最后更新:** 2025-11-07 | **支持域名 HTTPS 访问** ✅

---

## 🚀 部署和访问指南

### 部署状态
- ✅ Docker 容器运行正常 (item-management-service)
- ✅ Nginx 反向代理已配置
- ✅ HTTPS 支持已启用
- ✅ 域名 API 可访问

### 实际测试
```bash
# 健康检查 - 成功 ✅
curl https://tymoe.com/api/item-manage/v1/health
{
  "status": "healthy",
  "service": "product-management-service",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-11-07T00:54:03.581Z",
  "uptime": 53.898550087
}

# 服务列表（需认证）
curl https://tymoe.com/api/item-manage/v1/items -H "Authorization: Bearer {token}"
```

### Nginx 配置
Nginx 配置位置: `/opt/auth-service-deploy/nginx/conf.d/default.conf`

**关键配置:**
```nginx
upstream item_management_service {
    server item-management-service:3001;
}

location /api/item-manage/ {
    proxy_pass http://item_management_service;
    # ... 其他代理设置
}
```

---

## 📝 版本更新历史

### v2.4.0 (2025-11-07)
- ✅ 添加域名 HTTPS 访问方式说明
- ✅ 补充部署状态和实际测试结果
- ✅ 添加 Nginx 配置说明
- ✅ 更新访问地址示例

### v2.3.0 (2025-11-05)
- ✅ 补充完整的渠道定价架构文档
- ✅ 新增 7.1 数据库表结构说明（三层价格表设计）
- ✅ 新增 7.2 商品渠道价格 API（批量设置、查询、删除）
- ✅ 新增 7.3 套餐渠道价格 API（批量设置、查询、删除）
- ✅ 新增 7.5 渠道定义和管理说明
- ✅ 补充价格优先级机制的详细伪代码
- ✅ 补充完整的业务流程示例（含渠道对比）
- ✅ 优化第 7 章结构，分为清晰的子章节

### v2.2.1 (2025-10-30)
- ✅ RecipeStep 字段统一：`amount` 和 `operation` 合并为 `instruction`
- ✅ `instruction` 字段支持任意简短文本（数量、操作、快捷键等）
- ✅ 简化了 step 结构，更易维护扩展

### v2.2.0 (2025-10-30)
- ✅ 新增简化配方系统（Plan A设计）
- ✅ 每个修饰符组合对应独立配方
- ✅ RecipeModifierCondition关联表存储条件
- ✅ SQL精确匹配配方功能
- ✅ 删除了复杂的RecipeModifierVariant和RecipeStepOverride
- ✅ printCode设为必填，name自动生成
