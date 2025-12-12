import { httpService } from './http'

// 从环境变量中获取 API 基础 URL，用于直接 CORS 请求
// 支持本地开发环境，默认为本地 localhost:3000
const API_BASE = (import.meta.env.VITE_ITEM_MANAGE_BASE as string | undefined) ?? 'http://localhost:3000/api/item-manage/v1'

// 价格策略类型
export enum PriceStrategy {
  PERCENTAGE = 'percentage',      // 百分比
  FIXED = 'fixed',                // 固定值
  ABSOLUTE = 'absolute'           // 绝对价格
}

// 价格项类型
export enum PriceItemType {
  ITEM = 'item',                  // 菜品
  ADDON = 'addon',                // 加料
  COMBO = 'combo'                 // 套餐
}


// 创建或更新来源价格请求
export interface SourcePriceRequest {
  sourceCode?: string             // 渠道代码 (可选，使用channelId时)
  orderSourceConfigId?: string    // 订单来源配置ID (可选，使用此字段推荐)
  itemId: string                  // 菜品/加料/套餐ID
  itemType: PriceItemType        // 类型: item, addon, combo
  price?: number                  // 绝对价格 (PriceStrategy.ABSOLUTE)
  priceDiff?: number              // 价格差异 (PriceStrategy.FIXED/PERCENTAGE)
  strategy: PriceStrategy         // 价格策略
  tenantId: string                // 租户ID
}

// 查询来源价格请求
export interface QuerySourcePriceRequest {
  sourceCode?: string             // 渠道代码
  orderSourceConfigId?: string    // 订单来源配置ID
  itemIds?: string[]              // 菜品ID列表 (可选)
  tenantId: string                // 租户ID
}

// 来源价格配置项
export interface SourcePriceItem {
  id: string
  sourceProfileId: string
  itemId: string
  itemType: PriceItemType
  price?: number
  priceDiff?: number
  strategy: PriceStrategy
  createdAt: string
  updatedAt: string
}

// 来源价格配置文件
export interface SourcePriceProfile {
  id: string
  tenantId: string
  sourceCode?: string
  orderSourceConfigId?: string
  sourceName?: string
  description?: string
  prices: SourcePriceItem[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 来源价格查询响应
export interface QuerySourcePriceResponse {
  success: boolean
  data: {
    profile: SourcePriceProfile
    prices: SourcePriceItem[]
  }
}

/**
 * 获取指定渠道的价格配置
 */
export const getChannelPriceProfile = async (
  tenantId: string,
  orderSourceConfigId: string
): Promise<SourcePriceProfile | null> => {
  try {
    const response = await httpService.get<any>(
      `${API_BASE}/source-profiles`,
      {
        params: {
          tenantId,
          orderSourceConfigId
        }
      }
    )

    if (response.data?.data?.profile) {
      return response.data.data.profile
    }
    return null
  } catch (error) {
    console.error('Failed to get channel price profile:', error)
    throw error
  }
}

/**
 * 查询指定渠道的所有商品价格 (使用新的简化 API)
 * 只返回最终价格，不返回定价策略
 */
export const queryChannelPrices = async (
  sourceCode: string,
  itemIds?: string[]
): Promise<{ sourceCode: string; prices: Array<{ itemId: string; price: number }> } | null> => {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/source-prices/query`,
      {
        sourceCode,
        ...(itemIds && itemIds.length > 0 && { itemIds })
      }
    )

    console.log('查询商品价格响应:', response.data)

    // 新 API 返回格式：{ sourceCode, prices: [{ itemId, price }, ...] }
    if (response.data?.data) {
      return response.data.data
    }

    if (response.data?.prices) {
      return response.data
    }

    return null
  } catch (error) {
    console.error('Failed to query channel prices:', error)
    if ((error as any)?.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * 查询指定渠道的所有加料价格 (使用新的简化 API)
 * 只返回最终价格，不返回定价策略
 */
export const queryAddonPrices = async (
  sourceCode: string,
  addonIds?: string[]
): Promise<{ sourceCode: string; prices: Array<{ id?: string; addonId: string; price: number }> } | null> => {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/source-addon-prices/query`,
      {
        sourceCode,
        ...(addonIds && addonIds.length > 0 && { addonIds })
      }
    )

    console.log('查询加料价格响应:', response.data)

    if (response.data?.data) {
      return response.data.data
    }

    if (response.data?.prices) {
      return response.data
    }

    return null
  } catch (error) {
    console.error('Failed to query addon prices:', error)
    if ((error as any)?.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * 查询指定渠道的所有套餐价格 (使用新的简化 API)
 * 只返回最终价格，不返回定价策略
 */
export const queryComboprices = async (
  sourceCode: string,
  comboIds?: string[]
): Promise<{ sourceCode: string; prices: Array<{ id?: string; comboId: string; price: number }> } | null> => {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/source-combo-prices/query`,
      {
        sourceCode,
        ...(comboIds && comboIds.length > 0 && { comboIds })
      }
    )

    console.log('查询套餐价格响应:', response.data)

    if (response.data?.data) {
      return response.data.data
    }

    if (response.data?.prices) {
      return response.data
    }

    return null
  } catch (error) {
    console.error('Failed to query combo prices:', error)
    if ((error as any)?.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * 创建或更新单个渠道价格配置
 */
export const saveChannelPrice = async (request: SourcePriceRequest): Promise<SourcePriceItem> => {
  try {
    const response = await httpService.post<SourcePriceItem>(
      `${API_BASE}/source-prices`,
      request
    )

    if (response.data?.data) {
      return response.data.data
    }
    throw new Error('Invalid response format')
  } catch (error) {
    console.error('Failed to save channel price:', error)
    throw error
  }
}

/**
 * 删除渠道价格配置
 */
export const deleteChannelPrice = async (priceId: string): Promise<void> => {
  try {
    await httpService.delete(`/api/item-manage/v1/source-prices/${priceId}`)
  } catch (error) {
    console.error('Failed to delete channel price:', error)
    throw error
  }
}

/**
 * 批量删除渠道价格配置
 */
export const deleteChannelPrices = async (priceIds: string[]): Promise<void> => {
  try {
    await httpService.post(
      `${API_BASE}/source-prices/batch-delete`,
      { priceIds }
    )
  } catch (error) {
    console.error('Failed to delete channel prices:', error)
    throw error
  }
}

// 创建或更新价目档案的请求类型
export interface SavePriceProfileRequest {
  id?: string
  orderSourceConfigId: string
  strategyType: 'percentage' | 'fixed' | 'absolute'
  strategyRate?: number
  items?: Array<{
    itemId: string
    price?: number
    priceDiff?: number
  }>
  addons?: Array<{
    addonId: string
    price?: number
    priceDiff?: number
  }>
  combos?: Array<{
    comboId: string
    price?: number
    priceDiff?: number
  }>
  autoGenerateItems?: boolean
  autoGenerateAddons?: boolean
  autoGenerateCombos?: boolean
}

/**
 * 批量保存所有价格（商品、加料、套餐统一接口）
 * @param data 包含 items, addons, combos 的价格数据
 */
export const batchSaveAllPrices = async (data: {
  items?: Array<{ sourceCode: string; itemId: string; price: number }>
  addons?: Array<{ sourceCode: string; addonId: string; price: number }>
  combos?: Array<{ sourceCode: string; comboId: string; price: number }>
}): Promise<void> => {
  try {
    console.log('批量保存所有价格:', data)
    const response = await httpService.post(
      `${API_BASE}/source-prices/batch`,
      data
    )
    console.log('保存响应:', response.data)
  } catch (error) {
    console.error('Failed to batch save all prices:', error)
    throw error
  }
}

/**
 * 批量保存商品价格（向后兼容）
 * @deprecated 请使用 batchSaveAllPrices
 */
export const batchSaveItemPrices = async (
  sourceCode: string,
  prices: Array<{ sourceCode: string; itemId: string; price?: number }>
): Promise<void> => {
  const validPrices = prices.filter(p => p.price !== undefined) as Array<{ sourceCode: string; itemId: string; price: number }>
  if (validPrices.length > 0) {
    await batchSaveAllPrices({ items: validPrices })
  }
}

/**
 * 批量保存加料价格（向后兼容）
 * @deprecated 请使用 batchSaveAllPrices
 */
export const batchSaveAddonPrices = async (
  sourceCode: string,
  prices: Array<{ sourceCode: string; addonId: string; price?: number; profilePriceId?: string }>
): Promise<void> => {
  const validPrices = prices.filter(p => p.price !== undefined) as Array<{ sourceCode: string; addonId: string; price: number }>
  if (validPrices.length > 0) {
    await batchSaveAllPrices({ addons: validPrices })
  }
}

/**
 * 批量保存套餐价格（向后兼容）
 * @deprecated 请使用 batchSaveAllPrices
 */
export const batchSaveComboPrices = async (
  sourceCode: string,
  prices: Array<{ sourceCode: string; comboId: string; price?: number; profilePriceId?: string }>
): Promise<void> => {
  const validPrices = prices.filter(p => p.price !== undefined) as Array<{ sourceCode: string; comboId: string; price: number }>
  if (validPrices.length > 0) {
    await batchSaveAllPrices({ combos: validPrices })
  }
}

// ============================================
// 自定义选项渠道定价 API (v2.3 新功能)
// ============================================

/**
 * 自定义选项价格数据
 */
export interface CustomOptionPriceData {
  itemId: string
  itemName?: string
  customOptionId: string        // 自定义选项ID（原 modifierOptionId）
  optionName?: string
  groupName?: string
  defaultPrice: number         // 默认价格（优先级3）
  itemPrice?: number           // 商品级价格（优先级2）
  sourcePrice?: number         // 渠道价格（优先级1，最高）
  finalPrice: number           // 最终价格
  priceSource: 'source' | 'item' | 'default'
}

/**
 * 查询自定义选项渠道价格响应
 */
export interface QueryCustomOptionPricesResponse {
  sourceCode: string
  prices: CustomOptionPriceData[]
  count: number
}

/**
 * 查询自定义选项渠道价格
 * @param sourceCode 渠道代码
 * @param itemId 商品ID（可选，用于查询特定商品的自定义选项价格）
 */
export const queryCustomOptionSourcePrices = async (
  sourceCode: string,
  itemId?: string
): Promise<QueryCustomOptionPricesResponse | null> => {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/source-prices/modifiers/query`,
      {
        sourceCode,
        ...(itemId && { itemId })
      }
    )

    console.log('查询自定义选项价格响应:', response.data)

    if (response.data?.data) {
      return response.data.data
    }

    if (response.data?.prices) {
      return response.data
    }

    return null
  } catch (error) {
    console.error('Failed to query custom option prices:', error)
    if ((error as any)?.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * 查询修饰符渠道价格（向后兼容别名）
 * @deprecated 请使用 queryCustomOptionSourcePrices
 */
export const queryModifierSourcePrices = queryCustomOptionSourcePrices

/**
 * 批量设置自定义选项渠道价格
 * @param sourceCode 渠道代码
 * @param prices 自定义选项价格列表
 */
export const batchSaveCustomOptionSourcePrices = async (
  sourceCode: string,
  prices: Array<{
    itemId: string
    customOptionId: string      // 自定义选项ID（后端仍使用 modifierOptionId 字段）
    price: number
  }>
): Promise<void> => {
  try {
    console.log('批量保存自定义选项价格:', { sourceCode, prices })
    // 转换为后端期望的格式
    const backendPrices = prices.map(p => ({
      itemId: p.itemId,
      modifierOptionId: p.customOptionId,  // 后端字段名仍为 modifierOptionId
      price: p.price
    }))
    const response = await httpService.post(
      `${API_BASE}/source-prices/modifiers`,
      {
        sourceCode,
        prices: backendPrices
      }
    )
    console.log('保存自定义选项价格响应:', response.data)
  } catch (error) {
    console.error('Failed to batch save custom option prices:', error)
    throw error
  }
}

/**
 * 批量设置修饰符渠道价格（向后兼容别名）
 * @deprecated 请使用 batchSaveCustomOptionSourcePrices
 */
export const batchSaveModifierSourcePrices = batchSaveCustomOptionSourcePrices

/**
 * 删除单个自定义选项的渠道价格
 * @param sourceCode 渠道代码
 * @param itemId 商品ID
 * @param optionId 自定义选项ID
 */
export const deleteCustomOptionSourcePrice = async (
  sourceCode: string,
  itemId: string,
  optionId: string
): Promise<void> => {
  try {
    await httpService.delete(
      `${API_BASE}/source-prices/modifiers/${sourceCode}/${itemId}/${optionId}`
    )
  } catch (error) {
    console.error('Failed to delete custom option price:', error)
    throw error
  }
}

/**
 * 删除单个修饰符的渠道价格（向后兼容别名）
 * @deprecated 请使用 deleteCustomOptionSourcePrice
 */
export const deleteModifierSourcePrice = deleteCustomOptionSourcePrice

/**
 * 计算商品最终价格（含自定义选项）⭐ 核心功能
 * @param params 价格计算参数
 */
export const calculatePrice = async (params: {
  itemId: string
  sourceCode: string
  customOptions: Array<{    // 前端使用 customOptions
    optionId: string
    quantity: number
  }>
}): Promise<{
  itemId: string
  itemName: string
  basePrice: number
  sourceCode: string
  customOptions: Array<{    // 前端使用 customOptions
    optionId: string
    optionName: string
    unitPrice: number
    quantity: number
    subtotal: number
    priceSource: 'source' | 'item' | 'default'
  }>
  totalPrice: number
  currency: string
}> => {
  try {
    // 转换为后端期望的格式（后端仍使用 modifiers 字段）
    const backendParams = {
      itemId: params.itemId,
      sourceCode: params.sourceCode,
      modifiers: params.customOptions  // 后端字段名仍为 modifiers
    }

    const response = await httpService.post<any>(
      `${API_BASE}/pricing/calculate`,
      backendParams
    )

    console.log('价格计算响应:', response.data)

    let result
    if (response.data?.data) {
      result = response.data.data
    } else if (response.data) {
      result = response.data
    } else {
      throw new Error('Invalid response format')
    }

    // 转换响应为前端格式
    return {
      ...result,
      customOptions: result.modifiers || result.customOptions  // 兼容处理
    }
  } catch (error) {
    console.error('Failed to calculate price:', error)
    throw error
  }
}

