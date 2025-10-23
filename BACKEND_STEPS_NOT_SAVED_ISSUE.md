# 后端问题：配方步骤未保存

## 🐛 问题描述

创建/更新配方时，前端正确发送了`steps`数组，但后端返回的数据中`steps`为空数组。

## ✅ 已解决的问题

- **attributeConditions** - 现在可以正确保存了！
- **priority** - 现在可以正确保存了！

## ❌ 新问题：steps未保存

### 证据

#### 前端发送的请求

```json
PUT /api/item-manage/v1/recipes/6ee17b83-eb24-4ba3-8dd8-fb6e3a4e7412

{
  "itemId": "69d0dc14-8794-453a-85aa-1cc7db2750c6",
  "name": "Jasmine Mile Tea - Reg Ice + No Sugar",
  "attributeConditions": {
    "Sugar": "No Sugar",
    "Tempure": "Reg Ice"
  },
  "priority": 10,
  "steps": [
    {
      "title": "Blender",
      "amount": "",
      "sortOrder": 0,
      "isCritical": false,
      "isOptional": false
    }
  ]
}
```

#### 后端返回的响应

```json
{
  "success": true,
  "data": {
    "id": "6ee17b83-eb24-4ba3-8dd8-fb6e3a4e7412",
    "name": "Jasmine Mile Tea - Reg Ice + No Sugar",
    "attributeConditions": {
      "Sugar": "No Sugar",
      "Tempure": "Reg Ice"
    },
    "priority": 10,
    "steps": []  // ❌ 应该有1个步骤，但返回空数组
  }
}
```

## 🔍 可能的原因

### 1. 步骤需要单独保存

根据API文档，可能需要使用单独的API来添加步骤：

```http
POST /api/item-manage/v1/recipes/:id/steps
```

而不是在创建/更新配方时一起发送。

### 2. DTO定义问题

后端的`CreateRecipeDto`或`UpdateRecipeDto`可能没有包含`steps`字段：

```typescript
// 可能的问题
export class CreateRecipeDto {
  @IsString()
  itemId: string;
  
  @IsObject()
  @IsOptional()
  attributeConditions?: Record<string, string>;
  
  // ❌ 缺少 steps 字段定义
}
```

**修复方案**：
```typescript
export class CreateRecipeDto {
  @IsString()
  itemId: string;
  
  @IsObject()
  @IsOptional()
  attributeConditions?: Record<string, string>;
  
  @IsArray()  // ✅ 添加这个
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps?: CreateStepDto[];
}
```

### 3. Service层未处理steps

```typescript
// 可能的问题代码
async createRecipe(dto: CreateRecipeDto) {
  const recipe = this.recipeRepository.create({
    itemId: dto.itemId,
    name: dto.name,
    attributeConditions: dto.attributeConditions,
    priority: dto.priority
    // ❌ 没有处理 steps
  });
  
  return this.recipeRepository.save(recipe);
}
```

**修复方案**：
```typescript
async createRecipe(dto: CreateRecipeDto) {
  const recipe = this.recipeRepository.create({
    itemId: dto.itemId,
    name: dto.name,
    attributeConditions: dto.attributeConditions,
    priority: dto.priority
  });
  
  const savedRecipe = await this.recipeRepository.save(recipe);
  
  // ✅ 处理步骤
  if (dto.steps && dto.steps.length > 0) {
    const steps = dto.steps.map((stepDto, index) => 
      this.stepRepository.create({
        recipeId: savedRecipe.id,
        ...stepDto,
        sortOrder: index
      })
    );
    
    await this.stepRepository.save(steps);
    savedRecipe.steps = steps;
  }
  
  return savedRecipe;
}
```

## 📋 需要后端开发人员检查

1. **CreateRecipeDto / UpdateRecipeDto**
   - 是否包含`steps`字段定义
   - 是否有正确的验证装饰器

2. **RecipeService**
   - 创建/更新配方时是否处理了`steps`
   - 是否正确保存了步骤到数据库

3. **数据库关系**
   - Recipe和Step的关系是否正确配置
   - 是否使用了级联保存（cascade）

4. **API设计**
   - 是否需要单独的API来添加步骤
   - 还是应该在创建配方时一起保存

## 🎯 建议的API设计

### 方案1：一起保存（推荐）

```typescript
POST /api/item-manage/v1/recipes
{
  "itemId": "xxx",
  "name": "配方名称",
  "attributeConditions": {...},
  "steps": [
    {
      "stepTypeId": "xxx",
      "title": "步骤1",
      "amount": "200ml",
      "ingredients": [
        { "stepNumber": 1, "amount": "200ml" }
      ]
    }
  ]
}

// 返回
{
  "success": true,
  "data": {
    "id": "recipe-id",
    "steps": [
      {
        "id": "step-id",
        "stepNumber": 1,
        "title": "步骤1",
        "printCode": "M200"  // 后端自动生成
      }
    ]
  }
}
```

### 方案2：分开保存

```typescript
// 1. 创建配方
POST /api/item-manage/v1/recipes
{
  "itemId": "xxx",
  "name": "配方名称"
}

// 2. 添加步骤
POST /api/item-manage/v1/recipes/:id/steps
{
  "steps": [...]
}
```

## 📝 测试步骤

1. 在后端添加日志：
```typescript
async createRecipe(dto: CreateRecipeDto) {
  console.log('收到的DTO:', dto);
  console.log('steps:', dto.steps);
  console.log('steps数量:', dto.steps?.length);
  
  // ... 保存逻辑
  
  console.log('保存后的recipe:', savedRecipe);
  console.log('保存后的steps:', savedRecipe.steps);
}
```

2. 创建配方并查看日志
3. 检查哪一步丢失了steps数据

## ✅ 预期行为

创建/更新配方后，后端应该返回：

```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "name": "配方名称",
    "attributeConditions": {...},
    "priority": 10,
    "steps": [
      {
        "id": "step-id",
        "stepNumber": 1,
        "stepTypeId": "xxx",
        "title": "步骤1",
        "amount": "200ml",
        "ingredients": [...],
        "printCode": "M200",  // 后端自动生成
        "duration": 30,
        "isCritical": false,
        "isOptional": false
      }
    ]
  }
}
```

## 🚨 紧急程度

**高** - 没有步骤的配方是无效的，这个问题阻止了配方功能的正常使用。

---

**报告时间**: 2025-10-23  
**报告人**: 前端开发  
**状态**: 待后端修复

## 📊 问题状态

- ✅ attributeConditions - 已修复
- ✅ priority - 已修复
- ❌ steps - 待修复
