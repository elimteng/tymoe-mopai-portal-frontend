# 配方步骤前端实现指南

## 📋 后端API要求总结

根据后端提供的指南，前端只需要传递**3个核心字段**：

1. **stepTypeId** - 步骤类型ID（必填）
2. **amount** - 用量（可选）
3. **ingredients** - 材料引用（仅设备步骤需要）

其他字段（如`title`、`printCode`、`stepNumber`）都由后端自动生成。

---

## ✅ 前端实现完成

### 1. 步骤数据结构

```typescript
// src/services/recipe/types.ts

export interface StepIngredient {
  stepNumber: number    // 引用的步骤编号（从1开始）
  amount?: string       // 可选：覆盖原步骤的用量
}

export interface RecipeStep {
  stepTypeId?: string           // 必填：步骤类型ID
  title?: string                // 可选：自定义标题（留空使用步骤类型名称）
  amount?: string               // 可选：用量（如 "400ml"）
  ingredients?: StepIngredient[] // 可选：材料引用（设备步骤用）
  duration?: number             // 可选：耗时（秒）
  isCritical?: boolean          // 可选：是否关键步骤
  isOptional?: boolean          // 可选：是否可选步骤
}
```

### 2. 发送到后端的数据

```typescript
// src/pages/RecipeGuide/RecipeFormModal.tsx

const payload = {
  itemId,
  name: values.name,
  attributeConditions,
  priority: values.priority || 10,
  steps: steps.map((step) => {
    // 只传必要字段
    const stepData: any = {
      stepTypeId: step.stepTypeId  // 必填
    }
    
    // 可选字段：只在有值时传递
    if (step.amount) stepData.amount = step.amount
    if (step.ingredients && step.ingredients.length > 0) {
      stepData.ingredients = step.ingredients
    }
    if (step.duration) stepData.duration = step.duration
    if (step.title) stepData.title = step.title
    if (step.isCritical) stepData.isCritical = step.isCritical
    if (step.isOptional) stepData.isOptional = step.isOptional
    
    return stepData
  })
}
```

### 3. UI组件

#### 步骤类型选择器
```tsx
<Select
  placeholder="选择步骤类型"
  value={step.stepTypeId}
  onChange={(value) => {
    const selectedType = stepTypes.find(t => t.id === value)
    updateStep(index, 'stepTypeId', value)
    // 不自动填充title，让后端处理
  }}
>
  {stepTypes.map(type => (
    <Select.Option key={type.id} value={type.id}>
      <Space>
        <span style={{ 
          background: type.category === 'equipment' ? '#e6f7ff' : '#f0f0f0'
        }}>
          {type.code}
        </span>
        <span>{type.name}</span>
        <span style={{ color: '#999' }}>
          {type.category === 'equipment' ? '设备' : '材料'}
        </span>
      </Space>
    </Select.Option>
  ))}
</Select>
```

#### 普通步骤 - 用量输入
```tsx
<Input
  placeholder="数量/用量 (如: 200ml, 8块, 30g)"
  value={step.amount}
  onChange={(e) => updateStep(index, 'amount', e.target.value)}
/>
```

#### 设备步骤 - 材料引用选择器
```tsx
{stepType.category === 'equipment' && (
  <Select
    mode="multiple"
    placeholder="选择要引用的前面步骤"
    value={(step.ingredients || []).map(ing => ing.stepNumber)}
    onChange={(selectedSteps: number[]) => {
      const ingredients = selectedSteps.map(stepNum => ({
        stepNumber: stepNum,
        amount: steps[stepNum - 1]?.amount  // 使用原步骤的用量
      }))
      updateStep(index, 'ingredients', ingredients)
    }}
  >
    {steps.slice(0, index).map((s, i) => (
      <Select.Option key={i + 1} value={i + 1}>
        步骤{i + 1}: {s.title || '未命名'} {s.amount ? `(${s.amount})` : ''}
      </Select.Option>
    ))}
  </Select>
)}
```

---

## 📤 发送示例

### 普通配方（只有材料步骤）

```json
POST /api/item-manage/v1/recipes

{
  "itemId": "milk-tea-uuid",
  "name": "小杯热奶茶",
  "attributeConditions": {
    "size": "small",
    "temperature": "hot"
  },
  "priority": 10,
  "steps": [
    {
      "stepTypeId": "tea-uuid",
      "amount": "200ml"
    },
    {
      "stepTypeId": "milk-uuid",
      "amount": "100ml"
    }
  ]
}
```

### 带设备步骤的配方

```json
POST /api/item-manage/v1/recipes

{
  "itemId": "milk-tea-uuid",
  "name": "大杯冰奶茶",
  "attributeConditions": {
    "size": "large",
    "temperature": "cold"
  },
  "priority": 10,
  "steps": [
    {
      "stepTypeId": "tea-uuid",
      "amount": "400ml"
    },
    {
      "stepTypeId": "milk-uuid",
      "amount": "200ml"
    },
    {
      "stepTypeId": "sugar-uuid",
      "amount": "30g"
    },
    {
      "stepTypeId": "blender-uuid",
      "ingredients": [
        { "stepNumber": 1 },
        { "stepNumber": 2 },
        { "stepNumber": 3 }
      ],
      "duration": 30
    },
    {
      "stepTypeId": "ice-uuid",
      "amount": "15块"
    }
  ]
}
```

---

## 📥 后端返回示例

```json
{
  "success": true,
  "data": {
    "id": "recipe-uuid",
    "name": "大杯冰奶茶",
    "steps": [
      {
        "id": "step-1-uuid",
        "stepNumber": 1,
        "stepTypeId": "tea-uuid",
        "title": "茶",              // ✅ 后端自动生成
        "amount": "400ml",
        "printCode": "T400",        // ✅ 后端自动生成
        "stepType": {
          "id": "tea-uuid",
          "name": "茶",
          "code": "T",
          "category": "ingredient"
        }
      },
      {
        "id": "step-2-uuid",
        "stepNumber": 2,
        "title": "牛奶",            // ✅ 后端自动生成
        "amount": "200ml",
        "printCode": "M200"         // ✅ 后端自动生成
      },
      {
        "id": "step-3-uuid",
        "stepNumber": 3,
        "title": "糖",              // ✅ 后端自动生成
        "amount": "30g",
        "printCode": "S30"          // ✅ 后端自动生成
      },
      {
        "id": "step-4-uuid",
        "stepNumber": 4,
        "title": "搅拌机",          // ✅ 后端自动生成
        "ingredients": [
          { "stepNumber": 1, "amount": "400ml" },
          { "stepNumber": 2, "amount": "200ml" },
          { "stepNumber": 3, "amount": "30g" }
        ],
        "duration": 30,
        "printCode": "[T400+M200+S30]"  // ✅ 后端自动生成，显示混合材料
      },
      {
        "id": "step-5-uuid",
        "stepNumber": 5,
        "title": "冰块",            // ✅ 后端自动生成
        "amount": "15块",
        "printCode": "+I15"         // ✅ 后端自动生成
      }
    ]
  }
}
```

---

## ✅ 前端不需要做的事情

1. ❌ **不要拼接printCode** - 后端自动生成
2. ❌ **不要设置stepNumber** - 后端自动编号
3. ❌ **不要设置title**（除非要自定义）- 后端从步骤类型获取
4. ❌ **不要传sortOrder** - 后端根据数组顺序自动处理

---

## 🎯 前端需要做的事情

1. ✅ **让用户选择步骤类型**
2. ✅ **让用户输入用量**（可选）
3. ✅ **设备步骤：让用户选择引用的材料**
4. ✅ **把数据发送给后端**
5. ✅ **显示后端返回的完整步骤信息**

---

## 🔍 调试日志

前端已添加详细日志：

```typescript
console.log('📤 发送到后端的完整payload:', JSON.stringify(payload, null, 2))
console.log('📥 后端返回的结果:', result)
console.log('⚠️ 检查步骤保存:')
console.log('  发送的步骤数:', payload.steps.length)
console.log('  返回的步骤数:', result.steps?.length || 0)
```

如果步骤未保存，会显示警告：
```
⚠️ 配方更新成功，但步骤未保存。这是后端问题。
```

---

## 📊 测试清单

### 测试1：普通配方
- [ ] 创建只有材料步骤的配方
- [ ] 检查后端返回的steps数组
- [ ] 验证printCode是否正确生成

### 测试2：设备步骤
- [ ] 创建带搅拌机的配方
- [ ] 选择要引用的材料
- [ ] 检查printCode是否显示混合材料（如`[T400+M200]`）

### 测试3：复杂配方
- [ ] 创建多个设备步骤
- [ ] 测试嵌套引用（设备引用其他设备）
- [ ] 验证所有printCode

### 测试4：属性条件
- [ ] 创建不同属性组合的配方
- [ ] 验证attributeConditions正确保存
- [ ] 测试配方匹配逻辑

---

## 🐛 已知问题

### ✅ 已解决
1. **attributeConditions保存** - 已修复
2. **priority保存** - 已修复

### ⚠️ 待确认
1. **steps保存** - 需要后端确认是否正确处理

---

## 📝 代码位置

- **类型定义**: `src/services/recipe/types.ts`
- **表单组件**: `src/pages/RecipeGuide/RecipeFormModal.tsx`
- **API服务**: `src/services/recipe/recipeService.ts`

---

**更新时间**: 2025-10-23  
**状态**: 前端实现完成，等待后端测试确认
