# 后端问题：attributeConditions 未保存

## 🐛 问题描述

创建配方时，前端正确发送了`attributeConditions`，但后端返回的数据中该字段为`null`。

## 📊 证据

### 前端发送的请求

```json
POST /api/item-manage/v1/recipes

{
  "attributeConditions": {
    "Tempure": "Reg Ice",
    "Sugar": "No Sugar"
  },
  "priority": 10,
  "isActive": true,
  "itemId": "69d0dc14-8794-453a-85aa-1cc7db2750c6",
  "tenantId": "a6aee8e9-fc5f-419a-8504-3d106b1a3534",
  "steps": []
}
```

### 后端返回的响应

```json
{
  "success": true,
  "data": {
    "id": "d1f1241f-6021-44b3-ac4f-3b3f92ce5a7e",
    "attributeConditions": null,  // ❌ 应该是对象，但变成了null
    "priority": 0,                 // ❌ 应该是10，但变成了0
    ...
  }
}
```

## ⚠️ 影响

1. **attributeConditions丢失**
   - 前端发送: `{"Tempure": "Reg Ice", "Sugar": "No Sugar"}`
   - 后端保存: `null`
   - 结果: 无法按属性组合匹配配方

2. **priority丢失**
   - 前端发送: `10`
   - 后端保存: `0`
   - 结果: 优先级不正确

## 🔍 可能的原因

### 1. DTO验证问题

后端可能使用了DTO（Data Transfer Object）进行验证，但没有正确定义`attributeConditions`字段：

```typescript
// 可能的问题代码
class CreateRecipeDto {
  @IsString()
  name?: string;
  
  @IsNumber()
  priority?: number;
  
  // ❌ 缺少 attributeConditions 的定义
  // 或者定义不正确
}
```

**修复方案**:
```typescript
class CreateRecipeDto {
  @IsString()
  name?: string;
  
  @IsNumber()
  priority?: number;
  
  @IsObject()  // ✅ 添加这个
  @IsOptional()
  attributeConditions?: Record<string, string>;
}
```

### 2. 数据库Schema问题

数据库表可能没有正确定义`attributeConditions`字段：

```typescript
// 可能的问题
@Entity()
export class Recipe {
  @Column({ type: 'jsonb', nullable: true })
  attributeConditions: any;  // ❌ 可能没有正确配置
}
```

**修复方案**:
```typescript
@Entity()
export class Recipe {
  @Column({ 
    type: 'jsonb',
    nullable: true,
    default: null
  })
  attributeConditions: Record<string, string> | null;  // ✅ 明确类型
}
```

### 3. Service层过滤问题

Service层可能过滤掉了某些字段：

```typescript
// 可能的问题代码
async createRecipe(dto: CreateRecipeDto) {
  const recipe = this.recipeRepository.create({
    name: dto.name,
    priority: dto.priority,
    // ❌ 没有包含 attributeConditions
  });
  
  return this.recipeRepository.save(recipe);
}
```

**修复方案**:
```typescript
async createRecipe(dto: CreateRecipeDto) {
  const recipe = this.recipeRepository.create({
    name: dto.name,
    priority: dto.priority,
    attributeConditions: dto.attributeConditions,  // ✅ 添加这个
  });
  
  return this.recipeRepository.save(recipe);
}
```

## 🎯 需要后端开发人员检查

1. **CreateRecipeDto** - 是否包含`attributeConditions`字段定义
2. **Recipe Entity** - 数据库字段是否正确配置
3. **RecipeService** - 创建配方时是否包含`attributeConditions`
4. **数据库迁移** - 是否正确创建了`attributeConditions`列

## 📝 测试步骤

1. 在后端添加日志：
```typescript
async createRecipe(dto: CreateRecipeDto) {
  console.log('收到的DTO:', dto);
  console.log('attributeConditions:', dto.attributeConditions);
  
  const recipe = this.recipeRepository.create(dto);
  console.log('创建的entity:', recipe);
  
  const saved = await this.recipeRepository.save(recipe);
  console.log('保存后的数据:', saved);
  
  return saved;
}
```

2. 创建配方并查看日志
3. 检查哪一步丢失了`attributeConditions`

## ✅ 预期行为

创建配方后，后端应该返回：

```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "attributeConditions": {
      "Tempure": "Reg Ice",
      "Sugar": "No Sugar"
    },
    "priority": 10,
    ...
  }
}
```

## 🚨 紧急程度

**高** - 这个问题导致按属性组合管理配方的核心功能无法使用。

---

**报告时间**: 2025-10-23  
**报告人**: 前端开发  
**状态**: 待后端修复
