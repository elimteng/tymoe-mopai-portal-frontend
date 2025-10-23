// 制作指引相关类型定义

// 步骤材料引用
export interface StepIngredient {
  stepNumber: number              // 引用的步骤编号
  amount?: number                 // 可选：覆盖用量
}

// 配方步骤（根据API文档）
export interface RecipeStep {
  id?: string
  recipeId?: string
  stepNumber?: number
  stepTypeId: string              // 必填：步骤类型ID
  amount?: number | string        // 数量（数字或文本，如: 200, "200ml", "1杯"）
  ingredients?: StepIngredient[] | string  // 原料信息（对象数组或字符串）
  operation?: string              // 操作说明
  printCode?: string              // 打印代码
  duration?: number               // 持续时间(秒)
  sortOrder?: number              // 排序
  stepType?: StepType             // 关联的步骤类型
  createdAt?: string
  updatedAt?: string
}

// 配方（根据API文档）
export interface Recipe {
  id: string
  tenantId?: string
  itemId: string
  name: string
  description?: string
  version?: string
  attributeConditions?: Record<string, string> | null  // 属性匹配条件
  priority?: number                                     // 优先级
  isDefault?: boolean
  isActive?: boolean
  printCodeString?: string                              // 打印代码字符串
  displayCodeString?: string                            // 显示代码字符串
  steps?: RecipeStep[]
  item?: {
    id: string
    name: string
    code?: string
  }
  createdAt?: string
  updatedAt?: string
}

// 创建配方请求(简化版)
export interface CreateRecipeRequest {
  itemId: string
  name?: string                                         // 可选: 不填自动生成
  description?: string
  attributeConditions?: Record<string, string> | null   // 属性匹配条件
  priority?: number                                     // 优先级,默认0
  steps?: Omit<RecipeStep, 'id'>[]
}

// 更新配方请求
export interface UpdateRecipeRequest {
  itemId?: string
  name?: string
  description?: string
  version?: string
  attributeConditions?: Record<string, string> | null
  priority?: number
  isDefault?: boolean
  isActive?: boolean
  steps?: Omit<RecipeStep, 'id'>[]
}

// 添加步骤请求
export interface AddStepRequest {
  stepTypeId?: string
  title: string
  description?: string
  printCode?: string
  displayCode?: string
  fields: Record<string, any>
  duration?: number
  sortOrder?: number
  isCritical?: boolean
  isOptional?: boolean
  tags?: string[]
}

// 更新步骤请求
export interface UpdateStepRequest {
  title?: string
  description?: string
  printCode?: string
  displayCode?: string
  fields?: Record<string, any>
  duration?: number
  sortOrder?: number
  isCritical?: boolean
  isOptional?: boolean
  tags?: string[]
}

// 属性变体
export interface AttributeVariant {
  id: string
  recipeId: string
  name: string
  description?: string
  attributeConditions: Record<string, string>
  priority: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// 创建属性变体请求
export interface CreateVariantRequest {
  name: string
  description?: string
  attributeConditions: Record<string, string>
  priority: number
  isActive?: boolean
}

// 步骤覆盖
export interface StepOverride {
  id?: string
  variantId: string
  stepNumber: number
  action: 'modify' | 'replace' | 'remove' | 'add' | 'insert_before' | 'insert_after'
  printCode?: string
  displayCode?: string
  fields?: Record<string, any>
}

// 添加步骤覆盖请求
export interface AddOverrideRequest {
  stepNumber: number
  action: 'modify' | 'replace' | 'remove' | 'add' | 'insert_before' | 'insert_after'
  printCode?: string
  displayCode?: string
  fields?: Record<string, any>
}

// 配方计算请求
export interface CalculateRecipeRequest {
  itemId: string
  attributes: Record<string, string>
}

// 计算后的步骤
export interface CalculatedStep {
  stepNumber: number
  title: string
  printCode?: string
  displayCode?: string
  fields: Record<string, any>
  duration?: number
  isCritical?: boolean
}

// 配方计算响应
export interface CalculateRecipeResponse {
  recipe: {
    id: string
    name: string
    version: string
  }
  appliedVariants: Array<{
    id: string
    name: string
    priority: number
    attributeConditions: Record<string, string>
  }>
  finalSteps: CalculatedStep[]
  printCodeString: string
  displayCodeString: string
  totalDuration: number
}

// 步骤类型(简化版)
export interface StepType {
  id: string
  tenantId?: string
  code: string
  name: string
  category: 'ingredient' | 'equipment' | 'action'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// 创建步骤类型请求(简化版)
export interface CreateStepTypeRequest {
  name: string
  code: string
  category: 'ingredient' | 'equipment' | 'action'
}

// 代码建议请求
export interface CodeSuggestionRequest {
  name: string
  category: 'ingredient' | 'equipment' | 'action'
}

// 代码建议响应
export interface CodeSuggestion {
  code: string
  rule: string
  description: string
}

// 代码建议响应包装
export interface CodeSuggestionResponse {
  name: string
  category: string
  suggestions: CodeSuggestion[]
}

// 设备符号
export interface EquipmentSymbol {
  symbol: string
  name: string
  description: string
}

// 代码生成请求
export interface GenerateCodeRequest {
  input: string
  category: 'ingredient' | 'equipment' | 'action'
}

// 代码生成响应
export interface GenerateCodeResponse {
  code: string
  rule: string
  description: string
}

// API响应包装
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
