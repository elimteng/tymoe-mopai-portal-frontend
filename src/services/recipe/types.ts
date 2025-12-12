// 制作指引相关类型定义 (v2.2 - 简化配方系统)

// ==================== v2.2 配方核心类型 ====================

// 配方修饰符条件（v2.2 新架构）
export interface RecipeCondition {
  modifierGroupId: string   // 修饰符组ID
  modifierOptionId: string  // 修饰符选项ID
}

// 配方步骤（v2.2）
export interface RecipeStep {
  id?: string
  stepTypeId: string              // 必填：步骤类型ID
  displayOrder: number            // 显示顺序
  instruction?: string            // instruction输入（如：200、2键、加热等）
  containedSteps?: string[]       // 包含的其他步骤ID（用于设备步骤）
  stepType?: StepType             // 关联的步骤类型
  generatedPrintCode?: string     // 生成的打印代码（步骤code + instruction）
  createdAt?: string
  updatedAt?: string
}

// 配方（v2.2）
export interface Recipe {
  id: string
  itemId: string
  name: string                    // 自动生成，基于选项displayName
  printCode: string               // 必填：商品打印代码（如：LICE、MHOT）
  recipePrintCode?: string        // 自动生成：完整制作打印代码（包含所有步骤）
  displayCodeString?: string      // 可选：显示代码（如：L-ICE、M-HOT）
  description?: string
  isActive?: boolean
  priority?: number               // 优先级（用于匹配时的排序）
  modifierConditions?: RecipeCondition[]  // 修饰符条件数组
  steps?: RecipeStep[]
  createdAt?: string
  updatedAt?: string
}

// 创建配方请求 (v2.2)
export interface CreateRecipeRequest {
  itemId: string
  printCode: string                       // 必填：商品打印代码
  displayCodeString?: string              // 可选：显示代码
  description?: string
  conditions: RecipeCondition[]           // 必填：修饰符条件数组
  steps?: Array<{
    stepTypeId: string
    displayOrder: number
    instruction?: string                  // instruction输入
    containedSteps?: number[]             // 包含的步骤索引（用于设备步骤）
  }>
}

// 更新配方请求 (v2.2)
export interface UpdateRecipeRequest {
  printCode?: string
  displayCodeString?: string
  description?: string
  isActive?: boolean
  priority?: number
  // 注意：conditions 不能通过此接口更新，需删除后重建
}

// 更新配方步骤请求 (v2.2)
export interface UpdateRecipeStepsRequest {
  steps: Array<{
    stepTypeId: string
    displayOrder: number
    instruction?: string
    containedSteps?: number[]             // 包含的步骤索引（用于设备步骤）
  }>
}

// ==================== v2.2 新增 API 类型 ====================

// 生成修饰符组合列表的请求
export interface GenerateCombinationsRequest {
  modifierGroupIds: string[]
}

// 修饰符组合选项
export interface CombinationOption {
  modifierGroupId: string
  modifierOptionId: string
  displayName: string
}

// 修饰符组合
export interface ModifierCombination {
  id: string
  options: CombinationOption[]
  hasRecipe: boolean
}

// 生成修饰符组合列表的响应
export interface GenerateCombinationsResponse {
  combinations: ModifierCombination[]
}

// 复制配方的目标组合
export interface CopyRecipeTarget {
  conditions: RecipeCondition[]
  printCode: string
  displayCodeString?: string
}

// 复制配方请求
export interface CopyRecipeRequest {
  targetCombinations: CopyRecipeTarget[]
}

// 复制配方响应
export interface CopyRecipeResponse {
  sourceRecipeId: string
  createdCount: number
  failedCount: number
  recipes: Recipe[]
}

// 匹配配方请求
export interface MatchRecipeRequest {
  itemId: string
  selectedOptions: string[]  // modifier option IDs
}

// 匹配配方响应
export interface MatchRecipeResponse {
  matched: boolean
  recipe?: {
    id: string
    name: string
    printCode: string
    displayCodeString?: string
    description?: string
    steps: RecipeStep[]
  }
  printCode?: string
  message?: string
  selectedOptions?: string[]
}

// ==================== 步骤类型管理 ====================

// 步骤类型
export interface StepType {
  id: string
  tenantId?: string
  code: string                              // 打印代码（如：mk、[]等）
  name: string
  category: 'ingredient' | 'equipment' | 'action'
  equipment?: string
  description?: string
  isContainer?: boolean                     // 是否是容器步骤（设备步骤）
  containerPrefix?: string                  // 容器前缀（如：[）
  containerSuffix?: string                  // 容器后缀（如：]）
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// 创建步骤类型请求
export interface CreateStepTypeRequest {
  name: string
  code: string
  category?: 'ingredient' | 'equipment' | 'action'
  equipment?: string
  description?: string
}

// 代码建议请求
export interface CodeSuggestionRequest {
  context: string
}

// 代码建议响应
export interface CodeSuggestion {
  code: string
  rule: string
  description: string
}

// 代码建议响应包装
export interface CodeSuggestionResponse {
  suggestions: CodeSuggestion[]
}

// 设备符号
export interface EquipmentSymbol {
  code: string
  name: string
  icon: string
}

// ==================== API 响应包装 ====================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
