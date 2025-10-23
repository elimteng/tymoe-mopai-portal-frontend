# 前端已按API文档正确实现

## ✅ 已完成的实现

### 1. 创建配方的Payload格式

根据API文档，前端现在发送的payload格式：

```json
{
  "itemId": "69d0dc14-8794-453a-85aa-1cc7db2750c6",
  "name": "配方名称",
  "description": "配方描述",
  "version": "1.0",
  "attributeConditions": {
    "Tempure": "Reg Ice",
    "Sugar": "No Sugar"
  },
  "priority": 10,
  "isDefault": false,
  "isActive": true,
  "steps": [
    {
      "stepTypeId": "step-type-uuid",
      "title": "步骤标题",
      "amount": "200ml",
      "duration": null,
      "sortOrder": 0,
      "isCritical": false,
      "isOptional": false
    }
  ]
}
```

### 2. 关键改进

#### 改进1: 移除tenantId
```typescript
// ❌ 之前（错误）
const payload = {
  ...values,
  itemId,
  tenantId,  // 不应该在body中
  attributeConditions
}

// ✅ 现在（正确）
const payload = {
  itemId,
  name: values.name,
  description: values.description,
  attributeConditions,  // 后端从请求头X-Tenant-Id获取
  ...
}
```

#### 改进2: 明确所有字段
```typescript
// ✅ 明确设置所有字段的默认值
const payload = {
  itemId,
  name: values.name,
  description: values.description,
  version: values.version,
  attributeConditions,
  priority: values.priority || 10,      // 默认10
  isDefault: values.isDefault || false, // 默认false
  isActive: values.isActive !== false,  // 默认true
  steps: [...]
}
```

#### 改进3: 正确处理attributeConditions
```typescript
// 支持两种格式
if (typeof attributeConditions === 'string') {
  // 字符串格式（手动输入JSON）
  attributeConditions = JSON.parse(attributeConditions)
} else if (!attributeConditions || Object.keys(attributeConditions).length === 0) {
  // 空对象或null
  attributeConditions = null
}
```

### 3. 测试日志

创建配方时的完整日志：

```javascript
📝 原始 attributeConditions: {"Tempure":"Reg Ice","Sugar":"No Sugar"} type: string
✅ 解析后的 attributeConditions: {Tempure: 'Reg Ice', Sugar: 'No Sugar'}
🎯 最终 attributeConditions: {Tempure: 'Reg Ice', Sugar: 'No Sugar'}

📤 发送到后端的完整payload: {
  "itemId": "69d0dc14-8794-453a-85aa-1cc7db2750c6",
  "name": "Jasmine Mile Tea配方 #2",
  "description": null,
  "version": "1.0",
  "attributeConditions": {
    "Tempure": "Reg Ice",
    "Sugar": "No Sugar"
  },
  "priority": 10,
  "isDefault": false,
  "isActive": true,
  "steps": []
}
```

### 4. 后端问题确认

**前端发送**：
```json
{
  "attributeConditions": {
    "Tempure": "Reg Ice",
    "Sugar": "No Sugar"
  },
  "priority": 10
}
```

**后端返回**：
```json
{
  "attributeConditions": null,  // ❌ 丢失
  "priority": 0                 // ❌ 被重置
}
```

## 🐛 后端需要检查的问题

### 问题1: attributeConditions 未保存

**可能原因**：
1. CreateRecipeDto 没有定义 `attributeConditions` 字段
2. Recipe Entity 的 `attributeConditions` 字段配置不正确
3. Service 层创建时没有包含该字段

**建议修复**：
```typescript
// CreateRecipeDto
export class CreateRecipeDto {
  @IsString()
  itemId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()  // ✅ 添加这个
  @IsOptional()
  attributeConditions?: Record<string, string>;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

// Recipe Entity
@Entity()
export class Recipe {
  @Column({ 
    type: 'jsonb',
    nullable: true 
  })
  attributeConditions: Record<string, string> | null;  // ✅ 确保类型正确
}

// RecipeService
async createRecipe(dto: CreateRecipeDto) {
  const recipe = this.recipeRepository.create({
    ...dto,  // ✅ 包含所有字段
    tenantId: this.getTenantIdFromContext()
  });
  return this.recipeRepository.save(recipe);
}
```

### 问题2: priority 被重置为 0

**可能原因**：
- DTO 中 `priority` 字段没有正确传递
- 数据库默认值覆盖了传入的值

**建议修复**：
```typescript
// 确保 priority 正确传递
const recipe = this.recipeRepository.create({
  ...dto,
  priority: dto.priority ?? 10  // 使用传入的值，或默认10
});
```

## 📋 测试清单

### 前端测试
- ✅ 发送正确的payload格式
- ✅ attributeConditions 正确解析（字符串→对象）
- ✅ 不包含 tenantId（由后端从请求头获取）
- ✅ 所有字段都有默认值
- ✅ 添加详细的调试日志

### 后端需要测试
- ❌ 接收到的 DTO 是否包含 attributeConditions
- ❌ Entity 创建时是否包含 attributeConditions
- ❌ 保存到数据库后 attributeConditions 是否正确
- ❌ priority 是否正确保存

## 🎯 下一步

1. **后端开发人员添加日志**：
   ```typescript
   async createRecipe(dto: CreateRecipeDto) {
     console.log('收到的DTO:', dto);
     console.log('attributeConditions:', dto.attributeConditions);
     
     const recipe = this.recipeRepository.create(dto);
     console.log('创建的entity:', recipe);
     
     const saved = await this.recipeRepository.save(recipe);
     console.log('保存后:', saved);
     
     return saved;
   }
   ```

2. **创建测试配方**，查看后端日志

3. **确定哪一步丢失了数据**

4. **修复后端代码**

5. **重新测试**

---

**状态**: 前端已完成，等待后端修复  
**优先级**: 高  
**影响**: 按属性组合管理配方功能无法使用
