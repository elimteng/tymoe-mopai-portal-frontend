import { httpService } from '../http'
import type {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  AddStepRequest,
  UpdateStepRequest,
  AttributeVariant,
  CreateVariantRequest,
  AddOverrideRequest,
  CalculateRecipeRequest,
  CalculateRecipeResponse,
  StepType,
  CreateStepTypeRequest,
  CodeSuggestionRequest,
  CodeSuggestionResponse,
  EquipmentSymbol,
  GenerateCodeRequest,
  GenerateCodeResponse,
  ApiResponse
} from './types'

// API Base URLs
// 注意：根据实际后端部署情况，配方API可能在以下两个路径之一：
// - 新路径（API文档）: '/api/recipes'
// - 旧路径（当前部署）: '/api/item-manage/v1/recipes'
const RECIPE_API_BASE = '/api/item-manage/v1/recipes'  // 使用当前部署的路径
const STEP_TYPE_API_BASE = '/api/item-manage/v1/step-types'

// ==================== 步骤类型辅助功能 ====================

/**
 * 获取代码建议
 */
export const getCodeSuggestions = async (data: CodeSuggestionRequest): Promise<CodeSuggestionResponse> => {
  const response = await httpService.post<ApiResponse<CodeSuggestionResponse>>(`${STEP_TYPE_API_BASE}/suggest`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '获取代码建议失败')
  }
  return response.data.data
}

/**
 * 获取设备符号列表
 */
export const getEquipmentSymbols = async (): Promise<EquipmentSymbol[]> => {
  const response = await httpService.get<ApiResponse<EquipmentSymbol[]>>(`${STEP_TYPE_API_BASE}/equipment/symbols`)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '获取设备符号列表失败')
  }
  return response.data.data
}

// ==================== 配方管理 ====================

/**
 * 创建配方
 */
export const createRecipe = async (data: CreateRecipeRequest): Promise<Recipe> => {
  const response = await httpService.post<ApiResponse<Recipe>>(RECIPE_API_BASE, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '创建配方失败')
  }
  return response.data.data
}

/**
 * 获取配方列表
 */
export const getRecipes = async (itemId?: string): Promise<Recipe[]> => {
  const url = itemId ? `${RECIPE_API_BASE}?itemId=${itemId}` : RECIPE_API_BASE
  const response = await httpService.get<ApiResponse<Recipe[]>>(url)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '获取配方列表失败')
  }
  return response.data.data
}

/**
 * 获取配方详情
 */
export const getRecipeById = async (id: string): Promise<Recipe> => {
  const response = await httpService.get<ApiResponse<Recipe>>(`${RECIPE_API_BASE}/${id}`)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '获取配方详情失败')
  }
  return response.data.data
}

/**
 * 更新配方
 */
export const updateRecipe = async (id: string, data: UpdateRecipeRequest): Promise<Recipe> => {
  const response = await httpService.put<ApiResponse<Recipe>>(`${RECIPE_API_BASE}/${id}`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '更新配方失败')
  }
  return response.data.data
}

/**
 * 删除配方
 */
export const deleteRecipe = async (id: string): Promise<void> => {
  const response = await httpService.delete<ApiResponse<void>>(`${RECIPE_API_BASE}/${id}`)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '删除配方失败')
  }
}

// ==================== 配方步骤管理 ====================

/**
 * 添加步骤
 */
export const addStep = async (recipeId: string, data: AddStepRequest): Promise<void> => {
  const response = await httpService.post<ApiResponse<void>>(`${RECIPE_API_BASE}/${recipeId}/steps`, data)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '添加步骤失败')
  }
}

/**
 * 更新步骤
 */
export const updateStep = async (stepId: string, data: UpdateStepRequest): Promise<void> => {
  const response = await httpService.put<ApiResponse<void>>(`${RECIPE_API_BASE}/steps/${stepId}`, data)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '更新步骤失败')
  }
}

/**
 * 删除步骤
 */
export const deleteStep = async (stepId: string): Promise<void> => {
  const response = await httpService.delete<ApiResponse<void>>(`${RECIPE_API_BASE}/steps/${stepId}`)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '删除步骤失败')
  }
}

// ==================== 配方计算 ====================

/**
 * 计算配方
 */
export const calculateRecipe = async (data: CalculateRecipeRequest): Promise<CalculateRecipeResponse> => {
  const response = await httpService.post<ApiResponse<CalculateRecipeResponse>>(`${RECIPE_API_BASE}/calculate`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '计算配方失败')
  }
  return response.data.data
}

// ==================== 属性变体管理 ====================

/**
 * 创建属性变体
 */
export const createVariant = async (recipeId: string, data: CreateVariantRequest): Promise<AttributeVariant> => {
  const response = await httpService.post<ApiResponse<AttributeVariant>>(`${RECIPE_API_BASE}/${recipeId}/variants`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '创建变体失败')
  }
  return response.data.data
}

/**
 * 更新属性变体
 */
export const updateVariant = async (variantId: string, data: Partial<CreateVariantRequest>): Promise<AttributeVariant> => {
  const response = await httpService.put<ApiResponse<AttributeVariant>>(`${RECIPE_API_BASE}/variants/${variantId}`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '更新变体失败')
  }
  return response.data.data
}

/**
 * 删除属性变体
 */
export const deleteVariant = async (variantId: string): Promise<void> => {
  const response = await httpService.delete<ApiResponse<void>>(`${RECIPE_API_BASE}/variants/${variantId}`)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '删除变体失败')
  }
}

/**
 * 添加步骤覆盖
 */
export const addOverride = async (variantId: string, data: AddOverrideRequest): Promise<void> => {
  const response = await httpService.post<ApiResponse<void>>(`${RECIPE_API_BASE}/variants/${variantId}/overrides`, data)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '添加步骤覆盖失败')
  }
}

// ==================== 步骤类型管理 ====================

/**
 * 创建步骤类型
 */
export const createStepType = async (data: CreateStepTypeRequest): Promise<StepType> => {
  const response = await httpService.post<ApiResponse<StepType>>(STEP_TYPE_API_BASE, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '创建步骤类型失败')
  }
  return response.data.data
}

/**
 * 获取步骤类型列表
 */
export const getStepTypes = async (): Promise<StepType[]> => {
  const response = await httpService.get<ApiResponse<StepType[]>>(STEP_TYPE_API_BASE)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '获取步骤类型列表失败')
  }
  return response.data.data
}

/**
 * 更新步骤类型
 */
export const updateStepType = async (id: string, data: Partial<CreateStepTypeRequest>): Promise<StepType> => {
  const response = await httpService.put<ApiResponse<StepType>>(`${STEP_TYPE_API_BASE}/${id}`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '更新步骤类型失败')
  }
  return response.data.data
}

/**
 * 删除步骤类型
 */
export const deleteStepType = async (id: string): Promise<void> => {
  const response = await httpService.delete<ApiResponse<void>>(`${STEP_TYPE_API_BASE}/${id}`)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || '删除步骤类型失败')
  }
}

// ==================== 智能代码生成 ====================

/**
 * 生成代码
 */
export const generateCode = async (data: GenerateCodeRequest): Promise<GenerateCodeResponse[]> => {
  const response = await httpService.post<ApiResponse<GenerateCodeResponse[]>>(`${RECIPE_API_BASE}/code/generate`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || '生成代码失败')
  }
  return response.data.data
}
