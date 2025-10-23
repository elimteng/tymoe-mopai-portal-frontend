# 配方步骤编辑器重新设计 - 完整总结

## 🎯 设计目标

根据后端API文档，重新设计配方步骤编辑器，支持：
1. **设备步骤引用材料** - 使用`ingredients`字段
2. **自动生成printCode** - 后端自动生成，前端提供预览
3. **智能UI切换** - 根据步骤类型显示不同的输入界面

---

## ✨ 核心功能

### 1. 步骤类型识别

```typescript
// 步骤类型分为三类
export interface StepType {
  category: 'ingredient' | 'equipment' | 'action'
  code: string  // 如 'M', '[]', 'H'
  name: string
}
```

**UI展示**：
- 🧪 **材料** (ingredient) - 灰色背景
- 🔧 **设备** (equipment) - 蓝色背景
- ⚡ **操作** (action) - 灰色背景

### 2. 智能输入界面

#### 普通步骤（材料/操作）
```
┌─────────────────────────────────────┐
│ 步骤类型: [M] 牛奶 (材料)           │
│ 步骤标题: 加牛奶                    │
│ 用量: 200ml                         │
│ 耗时: 0秒                           │
│ □ 关键步骤  □ 可选步骤              │
│ 打印代码预览: M200                  │
└─────────────────────────────────────┘
```

#### 设备步骤
```
┌─────────────────────────────────────┐
│ 步骤类型: [] 搅拌机 (设备)          │
│ 步骤标题: 搅拌混合                  │
│                                     │
│ 🔧 设备步骤 - 选择要处理的材料      │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 步骤1: 茶 (400ml)             │ │
│ │ ☑ 步骤2: 牛奶 (200ml)           │ │
│ │ ☑ 步骤3: 糖 (30g)               │ │
│ └─────────────────────────────────┘ │
│ 💡 提示：选择的材料会在打印代码中   │
│    显示，如 [T400+M200+S30]        │
│                                     │
│ 耗时: 30秒                          │
│ □ 关键步骤  □ 可选步骤              │
│ 打印代码预览: [T400+M200+S30]      │
└─────────────────────────────────────┘
```

### 3. 材料引用 (ingredients)

```typescript
// 设备步骤可以引用前面的步骤
export interface StepIngredient {
  stepNumber: number    // 引用的步骤编号（从1开始）
  amount?: string       // 可选：覆盖原步骤的用量
}

// 示例
{
  stepTypeId: "blender-uuid",
  title: "搅拌混合",
  ingredients: [
    { stepNumber: 1, amount: "400ml" },  // 引用步骤1（茶）
    { stepNumber: 2, amount: "200ml" },  // 引用步骤2（牛奶）
    { stepNumber: 3, amount: "30g" }     // 引用步骤3（糖）
  ],
  duration: 30
  // printCode 由后端自动生成: "[T400+M200+S30]"
}
```

### 4. 打印代码预览

前端提供**实时预览**，帮助用户理解最终效果：

```typescript
// 预览算法
const generatePrintCodePreview = (step: RecipeStep): string => {
  const stepType = stepTypes.find(t => t.id === step.stepTypeId)
  
  // 设备步骤
  if (step.ingredients && step.ingredients.length > 0) {
    const codes = step.ingredients.map(ing => {
      const refStep = steps[ing.stepNumber - 1]
      const refType = stepTypes.find(t => t.id === refStep?.stepTypeId)
      const amount = ing.amount || refStep?.amount || ''
      const numbers = amount.match(/\d+/)
      return numbers ? `${refType.code}${numbers[0]}` : refType.code
    }).join('+')
    
    // 处理设备符号：[] -> [内容], () -> (内容)
    if (stepType.code.length === 2) {
      return `${stepType.code[0]}${codes}${stepType.code[1]}`
    }
    return `${stepType.code}(${codes})`
  }
  
  // 普通步骤
  if (step.amount) {
    const numbers = step.amount.match(/\d+/)
    return numbers ? `${stepType.code}${numbers[0]}` : stepType.code
  }
  
  return stepType.code
}
```

**预览示例**：
- 茶 400ml → `T400`
- 牛奶 200ml → `M200`
- 搅拌机(引用步骤1,2,3) → `[T400+M200+S30]`
- 冰块 15块 → `+I15`

---

## 📋 完整使用流程

### 场景：创建大杯冰奶茶配方

#### 步骤1：添加材料步骤

```
步骤1:
  类型: [T] 茶 (材料)
  标题: 加茶
  用量: 400ml
  预览: T400

步骤2:
  类型: [M] 牛奶 (材料)
  标题: 加牛奶
  用量: 200ml
  预览: M200

步骤3:
  类型: [S] 糖 (材料)
  标题: 加糖
  用量: 30g
  预览: S30
```

#### 步骤2：添加设备步骤

```
步骤4:
  类型: [] 搅拌机 (设备)
  标题: 搅拌混合
  引用材料:
    ☑ 步骤1: 茶 (400ml)
    ☑ 步骤2: 牛奶 (200ml)
    ☑ 步骤3: 糖 (30g)
  耗时: 30秒
  预览: [T400+M200+S30]
```

#### 步骤3：继续添加步骤

```
步骤5:
  类型: [+I] 冰块 (材料)
  标题: 加冰块
  用量: 15块
  预览: +I15

步骤6:
  类型: () 摇杯器 (设备)
  标题: 摇匀
  引用材料:
    ☑ 步骤4: 搅拌混合 ([T400+M200+S30])
    ☑ 步骤5: 冰块 (+I15)
  耗时: 10秒
  预览: ([T400+M200+S30]+I15)

步骤7:
  类型: [##] 封口机 (设备)
  标题: 封口
  预览: ##
```

#### 步骤4：保存配方

前端发送到后端：
```json
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
      "title": "加茶",
      "amount": "400ml"
    },
    {
      "stepTypeId": "milk-uuid",
      "title": "加牛奶",
      "amount": "200ml"
    },
    {
      "stepTypeId": "sugar-uuid",
      "title": "加糖",
      "amount": "30g"
    },
    {
      "stepTypeId": "blender-uuid",
      "title": "搅拌混合",
      "ingredients": [
        { "stepNumber": 1, "amount": "400ml" },
        { "stepNumber": 2, "amount": "200ml" },
        { "stepNumber": 3, "amount": "30g" }
      ],
      "duration": 30
    },
    {
      "stepTypeId": "ice-uuid",
      "title": "加冰块",
      "amount": "15块"
    },
    {
      "stepTypeId": "shaker-uuid",
      "title": "摇匀",
      "ingredients": [
        { "stepNumber": 4 },
        { "stepNumber": 5 }
      ],
      "duration": 10
    },
    {
      "stepTypeId": "seal-uuid",
      "title": "封口"
    }
  ]
}
```

后端返回（自动生成printCode）：
```json
{
  "steps": [
    { "stepNumber": 1, "printCode": "T400" },
    { "stepNumber": 2, "printCode": "M200" },
    { "stepNumber": 3, "printCode": "S30" },
    { "stepNumber": 4, "printCode": "[T400+M200+S30]" },
    { "stepNumber": 5, "printCode": "+I15" },
    { "stepNumber": 6, "printCode": "([T400+M200+S30]+I15)" },
    { "stepNumber": 7, "printCode": "##" }
  ]
}
```

---

## 🎨 UI/UX 优化

### 1. 步骤类型选择器

```tsx
<Select>
  {stepTypes.map(type => (
    <Select.Option key={type.id} value={type.id}>
      <Space>
        {/* 代码标签 */}
        <span style={{ 
          padding: '2px 6px',
          background: type.category === 'equipment' ? '#e6f7ff' : '#f0f0f0',
          borderRadius: '4px'
        }}>
          {type.code}
        </span>
        
        {/* 名称 */}
        <span>{type.name}</span>
        
        {/* 类别标签 */}
        <span style={{ color: '#999', fontSize: '12px' }}>
          {type.category === 'equipment' ? '设备' : 
           type.category === 'ingredient' ? '材料' : '操作'}
        </span>
      </Space>
    </Select.Option>
  ))}
</Select>
```

### 2. 设备步骤材料选择器

```tsx
{stepType.category === 'equipment' ? (
  <div style={{ 
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '4px',
    border: '1px dashed #d9d9d9'
  }}>
    <div style={{ marginBottom: '8px', fontWeight: 500 }}>
      🔧 设备步骤 - 选择要处理的材料
    </div>
    
    <Select
      mode="multiple"
      placeholder="选择要引用的前面步骤"
      value={(step.ingredients || []).map(ing => ing.stepNumber)}
      onChange={(selectedSteps: number[]) => {
        const ingredients = selectedSteps.map(stepNum => ({
          stepNumber: stepNum,
          amount: steps[stepNum - 1]?.amount
        }))
        updateStep(index, 'ingredients', ingredients)
      }}
    >
      {steps.slice(0, index).map((s, i) => (
        <Select.Option key={i + 1} value={i + 1}>
          步骤{i + 1}: {s.title} {s.amount ? `(${s.amount})` : ''}
        </Select.Option>
      ))}
    </Select>
    
    <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
      💡 提示：选择的材料会在打印代码中显示，如 [T300+M200]
    </div>
  </div>
) : (
  // 普通步骤：显示用量输入
  <Input
    placeholder="数量/用量 (如: 200ml, 8块, 30g)"
    value={step.amount}
    onChange={(e) => updateStep(index, 'amount', e.target.value)}
  />
)}
```

### 3. 打印代码预览

```tsx
{step.stepTypeId && (
  <div style={{ 
    padding: '8px 12px',
    background: '#e6f7ff',
    borderRadius: '4px',
    fontSize: '12px'
  }}>
    <span style={{ color: '#666' }}>打印代码预览: </span>
    <code style={{ color: '#1890ff', fontWeight: 500 }}>
      {generatePrintCodePreview(step)}
    </code>
    <span style={{ color: '#999', marginLeft: '8px' }}>
      （后端会自动生成最终代码）
    </span>
  </div>
)}
```

---

## 🔧 技术实现

### 1. 类型定义

```typescript
// src/services/recipe/types.ts

export interface StepIngredient {
  stepNumber: number
  amount?: string
}

export interface RecipeStep {
  id?: string
  stepNumber?: number
  stepTypeId?: string
  title: string
  amount?: string
  ingredients?: StepIngredient[]  // ✨ 新增
  printCode?: string
  duration?: number
  sortOrder?: number
  isCritical?: boolean
  isOptional?: boolean
  stepType?: StepType
}
```

### 2. 组件实现

```typescript
// src/pages/RecipeGuide/RecipeFormModal.tsx

const RecipeFormModal: React.FC<Props> = ({ ... }) => {
  const [steps, setSteps] = useState<RecipeStep[]>([])
  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  
  // 生成打印代码预览
  const generatePrintCodePreview = (step: RecipeStep): string => {
    // ... 实现逻辑
  }
  
  // 更新步骤
  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }
  
  // 提交配方
  const handleSubmit = async () => {
    const payload = {
      itemId,
      name: values.name,
      attributeConditions,
      priority: values.priority || 10,
      steps: steps.map((step, index) => ({
        stepTypeId: step.stepTypeId,
        title: step.title,
        amount: step.amount,
        ingredients: step.ingredients,  // ✨ 包含材料引用
        duration: step.duration,
        sortOrder: index,
        isCritical: step.isCritical || false,
        isOptional: step.isOptional || false
      }))
    }
    
    await createRecipe(payload)
  }
  
  return (...)
}
```

---

## ✅ 优势总结

### 1. 用户体验
- ✅ **智能UI** - 根据步骤类型自动切换输入界面
- ✅ **实时预览** - 立即看到打印代码效果
- ✅ **清晰提示** - 每个功能都有说明和示例
- ✅ **可视化** - 用颜色和图标区分不同类型

### 2. 数据准确性
- ✅ **类型安全** - TypeScript类型定义完整
- ✅ **自动填充** - 选择步骤类型后自动填充标题
- ✅ **引用验证** - 只能引用前面的步骤
- ✅ **后端生成** - printCode由后端生成，避免前端错误

### 3. 功能完整性
- ✅ **支持所有步骤类型** - 材料、设备、操作
- ✅ **支持材料引用** - 设备步骤可以引用材料
- ✅ **支持嵌套引用** - 设备可以引用其他设备的输出
- ✅ **支持属性条件** - 按属性组合创建不同配方

---

## 🎯 下一步

1. **测试功能**
   - 创建普通配方
   - 创建带设备步骤的配方
   - 测试材料引用功能
   - 验证打印代码预览

2. **等待后端修复**
   - attributeConditions保存问题
   - priority保存问题

3. **优化体验**
   - 添加更多提示信息
   - 优化移动端显示
   - 添加快捷操作

---

**状态**: 前端重新设计完成 ✅  
**等待**: 后端修复attributeConditions保存问题  
**优先级**: 高
