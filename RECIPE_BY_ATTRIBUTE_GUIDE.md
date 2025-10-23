# 按属性组合管理配方 - 使用指南

## 📋 业务逻辑

### 核心概念
1. **商品有多个属性**
   - 例如：奶茶有 size(小/中/大) × temperature(冷/热) = 6种组合

2. **每个属性组合一个配方**
   - 数据库存储：每个组合一条配方记录
   - 前端展示：按商品分组显示所有组合

3. **配方创建流程**
   - 用户选择一个商品
   - 系统显示该商品的所有属性组合
   - 用户为第一个组合创建配方（作为模板）
   - 可选：一键复制到其他组合
   - 用户可以单独修改每个组合的配方

---

## 🎯 使用场景示例

### 场景：奶茶商品配方管理

**商品信息**:
- 商品名称：经典奶茶
- 属性1：size (小杯/中杯/大杯)
- 属性2：temperature (冷饮/热饮)
- 总组合数：3 × 2 = 6种

**属性组合列表**:
1. 小杯 + 冷饮
2. 小杯 + 热饮
3. 中杯 + 冷饮
4. 中杯 + 热饮
5. 大杯 + 冷饮
6. 大杯 + 热饮

---

## 🔧 组件使用

### RecipeByAttributeManager

#### Props
```typescript
interface RecipeByAttributeManagerProps {
  itemId: string                    // 商品ID
  itemName: string                  // 商品名称
  itemAttributes: Array<{           // 商品属性定义
    name: string                    // 属性名（如 "size"）
    label: string                   // 属性标签（如 "杯型"）
    options: Array<{                // 属性选项
      value: string                 // 选项值（如 "small"）
      label: string                 // 选项标签（如 "小杯"）
    }>
  }>
}
```

#### 使用示例
```tsx
import RecipeByAttributeManager from './RecipeByAttributeManager'

function ItemRecipePage() {
  const item = {
    id: "milk-tea-uuid",
    name: "经典奶茶",
    attributes: [
      {
        name: "size",
        label: "杯型",
        options: [
          { value: "small", label: "小杯" },
          { value: "medium", label: "中杯" },
          { value: "large", label: "大杯" }
        ]
      },
      {
        name: "temperature",
        label: "温度",
        options: [
          { value: "cold", label: "冷饮" },
          { value: "hot", label: "热饮" }
        ]
      }
    ]
  }

  return (
    <RecipeByAttributeManager
      itemId={item.id}
      itemName={item.name}
      itemAttributes={item.attributes}
    />
  )
}
```

---

## 📊 界面功能

### 1. 属性组合列表
显示所有可能的属性组合，包括：
- ✅ 组合标签（如"小杯 + 冷饮"）
- ✅ 配置状态（已配置/未配置）
- ✅ 配方名称
- ✅ 步骤数量
- ✅ 优先级

### 2. 创建第一个配方
**操作流程**:
1. 点击任意组合的"创建配方"按钮
2. 填写配方信息（步骤会自动填充属性条件）
3. 添加制作步骤
4. 保存后询问：是否复制到其他组合？
   - 选择"是"：自动为所有未配置的组合创建相同配方
   - 选择"否"：只创建当前组合的配方

### 3. 编辑配方
- 点击"编辑"按钮修改已有配方
- 修改只影响当前组合

### 4. 复制配方
**一键复制到全部**:
- 将当前配方复制到所有未配置的组合
- 适用场景：大部分组合使用相同配方

**从已有复制**:
- 从任意已配置的组合复制到当前组合
- 适用场景：个别组合需要配方

---

## 💾 数据结构

### 数据库存储
```json
// 每个属性组合一条配方记录
[
  {
    "id": "recipe-1",
    "itemId": "milk-tea-uuid",
    "name": "经典奶茶 - 小杯 + 冷饮",
    "attributeConditions": {
      "size": "small",
      "temperature": "cold"
    },
    "priority": 10,
    "steps": [...]
  },
  {
    "id": "recipe-2",
    "itemId": "milk-tea-uuid",
    "name": "经典奶茶 - 小杯 + 热饮",
    "attributeConditions": {
      "size": "small",
      "temperature": "hot"
    },
    "priority": 10,
    "steps": [...]
  }
  // ... 其他4个组合
]
```

### 前端展示
```typescript
// 组合状态
interface AttributeCombination {
  key: string                          // 唯一标识
  label: string                        // 显示标签
  attributes: Record<string, string>   // 属性键值对
  recipe?: Recipe                      // 关联的配方
  hasRecipe: boolean                   // 是否已配置
}

// 示例
{
  key: "size:small|temperature:cold",
  label: "小杯 + 冷饮",
  attributes: {
    size: "small",
    temperature: "cold"
  },
  recipe: { /* 配方数据 */ },
  hasRecipe: true
}
```

---

## 🔄 工作流程

### 流程1：首次创建配方
```
1. 用户选择商品
   ↓
2. 系统生成所有属性组合（6个）
   ↓
3. 用户为"小杯 + 冷饮"创建配方
   ↓
4. 系统询问：是否复制到其他组合？
   ├─ 是 → 自动创建5个相同配方
   └─ 否 → 只创建1个配方
```

### 流程2：修改个别配方
```
1. 用户点击"大杯 + 冷饮"的编辑按钮
   ↓
2. 修改步骤（增加冰块数量）
   ↓
3. 保存
   ↓
4. 只更新"大杯 + 冷饮"的配方
```

### 流程3：批量复制
```
1. 已配置：小杯冷饮、小杯热饮
2. 未配置：中杯冷饮、中杯热饮、大杯冷饮、大杯热饮
   ↓
3. 用户点击"一键复制到全部"
   ↓
4. 系统将"小杯冷饮"的配方复制到4个未配置的组合
   ↓
5. 用户可以单独修改每个组合的配方
```

---

## 🎨 UI展示

### 表格列
| 属性组合 | 配方名称 | 步骤数 | 优先级 | 操作 |
|---------|---------|--------|--------|------|
| 小杯 + 冷饮 ✅ | 经典奶茶 - 小杯冷饮 | 5 | 10 | 编辑 / 复制到全部 |
| 小杯 + 热饮 | - | 0 | 0 | 创建配方 / 从已有复制 |
| 中杯 + 冷饮 | - | 0 | 0 | 创建配方 / 从已有复制 |
| 中杯 + 热饮 | - | 0 | 0 | 创建配方 / 从已有复制 |
| 大杯 + 冷饮 | - | 0 | 0 | 创建配方 / 从已有复制 |
| 大杯 + 热饮 | - | 0 | 0 | 创建配方 / 从已有复制 |

### 顶部统计
```
经典奶茶 - 配方管理  [1 / 6 已配置]  [一键复制到全部]
```

---

## 🔌 API调用

### 1. 加载配方列表
```typescript
const recipes = await getRecipes(itemId)
// 返回该商品的所有配方
```

### 2. 创建配方
```typescript
await createRecipe({
  itemId: "milk-tea-uuid",
  name: "经典奶茶 - 小杯 + 冷饮",
  attributeConditions: {
    size: "small",
    temperature: "cold"
  },
  priority: 10,
  steps: [...]
})
```

### 3. 批量复制
```typescript
// 遍历未配置的组合
for (const combo of unsetCombinations) {
  await createRecipe({
    itemId,
    name: `${itemName} - ${combo.label}`,
    attributeConditions: combo.attributes,
    priority: 10,
    steps: templateRecipe.steps  // 复制步骤
  })
}
```

---

## ⚙️ 配置建议

### 属性定义
```typescript
// 建议在商品管理中定义属性
const itemAttributes = [
  {
    name: "size",           // 属性名（用于数据库）
    label: "杯型",          // 显示标签
    options: [
      { value: "small", label: "小杯" },
      { value: "medium", label: "中杯" },
      { value: "large", label: "大杯" }
    ]
  },
  {
    name: "temperature",
    label: "温度",
    options: [
      { value: "cold", label: "冷饮" },
      { value: "hot", label: "热饮" }
    ]
  },
  {
    name: "sugar",
    label: "糖度",
    options: [
      { value: "none", label: "无糖" },
      { value: "less", label: "少糖" },
      { value: "normal", label: "正常" },
      { value: "extra", label: "多糖" }
    ]
  }
]
```

### 优先级设置
- 完全匹配的配方：`priority: 10-20`
- 部分匹配的配方：`priority: 5-10`
- 默认配方：`priority: 0`

---

## 🎯 最佳实践

### 1. 创建配方顺序
1. 先创建最常见的组合（如"中杯 + 冷饮"）
2. 一键复制到其他组合
3. 单独调整特殊组合（如"大杯"增加用量）

### 2. 命名规范
- 自动生成：`{商品名} - {属性组合}`
- 例如：`经典奶茶 - 大杯 + 冷饮`

### 3. 步骤复用
- 大部分步骤相同，只调整用量
- 使用 `amount` 字段区分不同规格

### 4. 优先级管理
- 所有属性组合配方使用相同优先级
- 确保精确匹配

---

## 🚀 集成到现有系统

### 在商品详情页集成
```tsx
import { Tabs } from 'antd'
import RecipeByAttributeManager from './RecipeByAttributeManager'

function ItemDetailPage({ item }) {
  return (
    <Tabs>
      <Tabs.TabPane tab="基本信息" key="basic">
        {/* 商品基本信息 */}
      </Tabs.TabPane>
      
      <Tabs.TabPane tab="配方管理" key="recipes">
        <RecipeByAttributeManager
          itemId={item.id}
          itemName={item.name}
          itemAttributes={item.attributes}
        />
      </Tabs.TabPane>
    </Tabs>
  )
}
```

---

## 📝 总结

这个组件实现了：
- ✅ 自动生成所有属性组合
- ✅ 可视化配置状态
- ✅ 一键复制配方
- ✅ 单独编辑每个组合
- ✅ 数据库存储每个组合的独立配方
- ✅ 前端按商品分组展示

完美支持"每个属性组合一个配方"的业务逻辑！
