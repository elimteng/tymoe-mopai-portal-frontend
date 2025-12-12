import { httpService } from './http'
import { toMinorUnit, fromMinorUnit } from '@/utils/priceConverter'

// ==================== 类型定义 ====================

export interface Item {
  id: string
  tenantId: string
  categoryId?: string
  name: string
  description?: string
  customFields?: any // jsonb
  basePrice: number
  cost?: number
  aiTags?: any // jsonb
  imageUrl?: string // Cloudinary 图片 URL
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  tenantId: string
  name: string
  parentId?: string
  createdAt?: string
  // 后端返回的关联数据
  _count?: { items: number }
  children?: Category[]  // 子分类
  parent?: Category      // 父分类
}

export interface ItemAttributeType {
  id: string
  name: string
  displayName: string
  inputType: 'select' // 所有属性类型都是选择类型
  options: ItemAttributeOption[] // 必须有选项
}

export interface ItemAttributeOption {
  id: string
  value: string
  displayName: string
  priceModifier: number
}

// Add-on 相关接口 (已废弃，请使用 Modifier)
export interface Addon {
  id: string
  name: string
  description: string
  price: number
  cost: number
  trackInventory: boolean
  currentStock: number
  isActive: boolean
}

export interface ItemAddon {
  id: string
  itemId: string
  addonId: string
  maxQuantity: number
  addon?: Addon // 可选的关联Addon对象
}

// ==================== Modifier v2.0 架构 ====================
// 统一的修饰符系统，替代旧的 Attribute 和 Addon

/**
 * 修饰符组类型
 * - 'property': 属性类型（如杯型、冰度、糖度）- 商品本身的可选配置
 * - 'addon': 加料类型（如珍珠、椰果、布丁）- 可选的额外配料
 * - 'custom': 自定义类型 - 其他自定义分类
 */
export type ModifierGroupType = 'property' | 'addon' | 'custom'

/**
 * 修饰符组
 * 选择规则（最小/最大选择数、是否必选）在商品关联时定义，见 ItemModifierGroup
 */
export interface ModifierGroup {
  id: string
  tenantId: string
  name: string
  displayName: string
  groupType: ModifierGroupType
  description?: string
  displayOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  options?: ModifierOption[]
}

/**
 * 修饰符选项
 */
export interface ModifierOption {
  id: string
  modifierGroupId: string
  name: string
  displayName: string
  code?: string              // 选项代码，用于打印
  defaultPrice: number | string
  cost?: number | null
  displayOrder?: number
  isActive: boolean
  isDefault?: boolean
  trackInventory?: boolean
  currentStock?: number
  createdAt?: string
  updatedAt?: string
  group?: ModifierGroup
  // 商品关联的选项配置（仅在获取商品修饰符时返回）
  itemOptions?: Array<{
    isDefault: boolean
    isEnabled: boolean
    displayOrder: number
  }>
  // 商品级价格覆盖（仅在获取商品修饰符时返回）
  itemPrice?: number | null  // null表示未设置商品级价格
  finalPrice?: number        // 最终价格（已处理优先级）
}

/**
 * 商品修饰符组关联
 */
export interface ItemModifierGroup {
  id: string
  itemId: string
  modifierGroupId: string
  isRequired: boolean
  minSelections: number
  maxSelections: number
  sortOrder: number
  createdAt?: string
  group?: ModifierGroup
}

/**
 * 商品修饰符价格
 */
export interface ItemModifierPrice {
  id: string
  itemId: string
  modifierOptionId: string
  price: number
  createdAt?: string
  updatedAt?: string
  option?: ModifierOption
}

/**
 * 创建修饰符组请求
 */
export interface CreateModifierGroupPayload {
  name?: string  // 可选，如果不提供则后端自动生成
  displayName: string
  groupType: ModifierGroupType
  description?: string
  isActive?: boolean
}

/**
 * 更新修饰符组请求
 */
export interface UpdateModifierGroupPayload extends Partial<CreateModifierGroupPayload> {}

/**
 * 创建修饰符选项请求
 */
export interface CreateModifierOptionPayload {
  name?: string  // 可选，如果不提供则后端自动生成
  displayName: string
  code?: string  // 选项代码，用于打印
  defaultPrice?: number
  cost?: number
  displayOrder?: number
}

/**
 * 更新修饰符选项请求
 */
export interface UpdateModifierOptionPayload extends Partial<CreateModifierOptionPayload> {}

/**
 * 商品关联修饰符组请求
 */
export interface AddModifierGroupToItemPayload {
  modifierGroupId: string
  isRequired?: boolean
  minSelections?: number
  maxSelections?: number
  sortOrder?: number
}

/**
 * 设置商品修饰符价格请求
 */
export interface SetItemModifierPricesPayload {
  prices: Array<{
    modifierOptionId: string
    price: number
  }>
}

/**
 * 配置商品修饰符选项请求（设置选项在特定商品中的行为）
 */
export interface ConfigureItemModifierOptionsPayload {
  options: Array<{
    modifierOptionId: string
    isDefault?: boolean
    isEnabled?: boolean
    displayOrder?: number
  }>
}

export interface CreateAddonPayload {
  name: string
  description: string
  price: number
  cost: number
  trackInventory: boolean
  currentStock?: number
  isActive: boolean
}

export interface UpdateAddonPayload extends Partial<CreateAddonPayload> {}

export interface CreateItemAddonPayload {
  addonId: string
  maxQuantity: number
}

export interface ItemAttribute {
  id: string
  itemId: string
  attributeTypeId: string
  isRequired: boolean
  optionOverrides?: Record<string, { priceModifier: number }>
  allowedOptions?: string[] // 允许的选项ID列表，用于选项过滤
  defaultOptionId?: string // 商品级默认选项
  optionOrder?: string[] // 选项显示顺序
  attributeType?: ItemAttributeType // API返回时包含完整的属性类型信息
}

// ==================== 税务相关接口 ====================

/**
 * 税率接口
 */
export interface TaxRate {
  id: string
  name: string
  taxType: string
  rate: number
  foodExempt: boolean
  effectiveDate?: string
  expiresDate?: string
  isOverridden: boolean
  overrideReason?: string
  source: 'SYSTEM_DEFAULT' | 'TENANT_OVERRIDE'
  notes?: string
}

/**
 * 税类接口（简化版 - 仅租户自定义）
 */
export interface TaxClass {
  id: string
  name: string
  description?: string
  isCustom?: boolean
  rates: Array<{
    id: string
    taxType: string
    rate: number
    displayOrder: number
  }>
}

/**
 * 简化版税种接口（后端返回的格式）
 */
export interface SimpleTaxRate {
  id: string
  name: string
  rate: number
  regionCode?: string
  createdAt?: string
}

/**
 * 商品税类信息
 */
export interface ItemTaxClass {
  itemId: string
  itemName: string
  taxClassId?: string
  taxClassName?: string
  taxClassType: 'DEFAULT' | 'TENANT_CUSTOM'
  effectiveTaxRates?: Array<{
    taxType: string
    rate: number
    name: string
  }>
}

/**
 * 税费计算结果
 */
export interface TaxCalculationResult {
  itemId: string
  itemName: string
  basePrice: number
  basePriceDisplay: string
  taxes: Array<{
    taxType: string
    taxName: string
    rate: number
    amount: number
    amountDisplay: string
  }>
  totalTax: number
  totalTaxDisplay: string
  finalPrice: number
  finalPriceDisplay: string
  region: string
}

/**
 * 分配税类请求
 */
export interface AssignTaxClassPayload {
  taxClassId: string
}

/**
 * 税率覆盖请求
 */
export interface TaxRateOverridePayload {
  regionCode: string
  taxType: string
  rate: number
  basedOnDefaultId?: string
  overrideReason?: string
}

/**
 * 创建租户自定义税类请求
 */
export interface CreateTenantTaxClassPayload {
  name: string
  description?: string
  regionCode: string
  rates: Array<{
    taxType: string
    rate: number
    applyOrder: number
    compoundPrevious: boolean
  }>
}

const MOCK_TAX_RATES: Record<string, TaxRate[]> = {
  'CA-ON': [
    {
      id: 'mock-hst-ca-on',
      name: 'HST',
      taxType: 'HST',
      rate: 0.13,
      foodExempt: false,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    },
    {
      id: 'mock-food-ca-on',
      name: 'Food Essentials Exempt',
      taxType: 'FOOD_EXEMPT',
      rate: 0,
      foodExempt: true,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    }
  ],
  'CA-BC': [
    {
      id: 'mock-gst-ca-bc',
      name: 'GST',
      taxType: 'GST',
      rate: 0.05,
      foodExempt: false,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    },
    {
      id: 'mock-pst-ca-bc',
      name: 'PST',
      taxType: 'PST',
      rate: 0.07,
      foodExempt: false,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    }
  ],
  'US-CA': [
    {
      id: 'mock-ca-sales',
      name: 'California State Tax',
      taxType: 'STATE',
      rate: 0.0725,
      foodExempt: false,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    },
    {
      id: 'mock-ca-city',
      name: 'City Tax',
      taxType: 'CITY',
      rate: 0.0125,
      foodExempt: false,
      effectiveDate: '2024-01-01',
      isOverridden: false,
      source: 'SYSTEM_DEFAULT'
    }
  ]
}


// Combo 组合商品相关接口
export interface Combo {
  id: string
  tenantId: string
  categoryId?: string
  name: string
  description?: string
  basePrice: number
  discount: number
  discountType: 'fixed' | 'percentage'
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  category?: Category
  comboItems?: ComboItem[]
}

export interface ComboItem {
  id: string
  comboId: string
  itemId: string
  quantity: number
  isRequired: boolean
  sortOrder: number
  createdAt?: string
  attributeSelections?: Record<string, string> // { attributeTypeId: optionId }
  addonSelections?: Array<{ addonId: string; quantity: number }>
  item?: Item & { attributes?: ItemAttribute[]; itemAddons?: ItemAddon[] }
}

export interface CreateComboPayload {
  name: string
  description?: string
  categoryId?: string
  basePrice: number
  discount?: number
  discountType?: 'fixed' | 'percentage'
  isActive?: boolean
  comboItems?: CreateComboItemPayload[]
}

export interface UpdateComboPayload extends Partial<CreateComboPayload> {}

export interface CreateComboItemPayload {
  itemId: string
  quantity?: number
  isRequired?: boolean
  sortOrder?: number
  attributeSelections?: Record<string, string>
  addonSelections?: Array<{ addonId: string; quantity: number }>
}

export interface UpdateComboItemPayload extends Partial<CreateComboItemPayload> {}

export interface ComboListParams extends PaginationParams {
  categoryId?: string
  isActive?: boolean
  search?: string
}

// 移除重复的Addon定义，使用上面的API文档版本
// ==================== 请求/响应类型 ====================

export interface CreateItemPayload {
  name: string
  description?: string
  categoryId: string
  basePrice: number
  cost?: number
  isActive?: boolean
  customFields?: any
  // 注：属性现在通过 ModifierGroup 系统管理
  // 在创建商品后，通过 POST /items/{itemId}/modifier-groups 来关联
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  // 更新时也不支持直接更新 attributes，使用专门的修饰符管理 API
}

export interface CreateCategoryPayload {
  name: string
  parentId?: string
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {}

export interface CreateItemAttributeTypePayload {
  name: string
  displayName: string
  inputType: 'select' // 固定为select类型
}

export interface UpdateItemAttributeTypePayload extends Partial<CreateItemAttributeTypePayload> {}

export interface CreateItemAttributeOptionPayload {
  value: string
  displayName: string
  priceModifier?: number
}

export interface UpdateItemAttributeOptionPayload extends Partial<CreateItemAttributeOptionPayload> {}

// 商品属性关联相关接口
export interface CreateItemAttributePayload {
  attributeTypeId: string
  isRequired: boolean
  optionOverrides?: Record<string, { priceModifier: number }>
  allowedOptions?: string[] // 允许的选项ID列表
  defaultOptionId?: string // 商品级默认选项
  optionOrder?: string[] // 选项显示顺序
}

export interface UpdateItemAttributePayload extends Partial<CreateItemAttributePayload> {}

// 更新为API文档版本
export interface CreateAddonPayload {
  name: string
  description: string
  price: number
  cost: number
  trackInventory: boolean
  currentStock?: number
  isActive: boolean
}

export interface UpdateAddonPayload extends Partial<CreateAddonPayload> {}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface ItemListParams extends PaginationParams {
  categoryId?: string
  isActive?: boolean
  search?: string
}

// API实际返回的格式
export interface ApiPaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// 前端内部使用的格式
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BatchOperationPayload {
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  items: Array<CreateItemPayload | (UpdateItemPayload & { id: string }) | { id: string }>
}

export interface BatchOperationResponse {
  success: number
  failed: number
  errors: Array<{
    index: number
    error: string
  }>
  results: Item[]
}

// ==================== API服务类 ====================

const API_BASE = (import.meta.env.VITE_ITEM_MANAGE_BASE as string | undefined) ?? 'http://localhost:3000/api/item-manage/v1'

// 调试：打印环境变量
console.log('🔍 [ITEM-MANAGEMENT] import.meta.env.VITE_ITEM_MANAGE_BASE:', import.meta.env.VITE_ITEM_MANAGE_BASE)
console.log('🔍 [ITEM-MANAGEMENT] API_BASE:', API_BASE)

class ItemManagementService {
  // ==================== 商品管理 ====================

  async getItems(params: ItemListParams = {}): Promise<PaginatedResponse<Item>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    const url = `/items${queryString ? '?' + queryString : ''}`
    
    const response = await httpService.get<ApiPaginatedResponse<Item>>(`${API_BASE}${url}`)
    
    // 转换API响应格式为前端期待的格式
    const apiData = response.data
    
    if (!apiData) {
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    }
    
    // 处理实际的API响应格式
    const rawItems = Array.isArray(apiData.items) ? apiData.items : []

    // 转换字段名从 snake_case 到 camelCase，并确保数字字段是number类型
    const items = rawItems.map((item: any) => ({
      id: item.id,
      tenantId: item.tenant_id || item.tenantId,
      categoryId: item.category_id || item.categoryId,
      name: item.name,
      description: item.description,
      customFields: item.custom_fields || item.customFields,
      basePrice: typeof (item.base_price ?? item.basePrice) === 'string'
        ? parseFloat(item.base_price ?? item.basePrice)
        : (item.base_price ?? item.basePrice ?? 0),
      cost: (item.cost !== undefined && item.cost !== null)
        ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost)
        : undefined,
      aiTags: item.ai_tags || item.aiTags,
      imageUrl: item.image_url || item.imageUrl, // 图片 URL
      isActive: item.is_active ?? item.isActive ?? true,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      // 保留关联数据
      categories: item.categories,
      item_modifier_groups: item.item_modifier_groups,
      itemModifierGroups: item.item_modifier_groups || item.itemModifierGroups
    }))
    
    const pagination = apiData.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
    
    const result: PaginatedResponse<Item> = {
      data: items,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.pages
    }
    
    return result
  }

  async getItem(id: string): Promise<Item> {
    console.log('📦 [ITEM SERVICE DEBUG] Getting item:', id)
    
    const response = await httpService.get<Item>(`${API_BASE}/items/${id}`)
    
    console.log('📦 [ITEM SERVICE DEBUG] Item details:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async searchItems(query: string): Promise<Item[]> {
    console.log('🔍 [ITEM SERVICE DEBUG] Searching items:', query)
    
    const response = await httpService.get<Item[]>(`${API_BASE}/items/search/${encodeURIComponent(query)}`)
    
    console.log('🔍 [ITEM SERVICE DEBUG] Search results:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async createItem(payload: CreateItemPayload): Promise<Item> {
    console.log('🚀 [CREATE ITEM] ==========================================')
    console.log('📥 Original payload from UI:', JSON.stringify(payload, null, 2))

    // 验证payload不包含无效字段
    const { tenant_id, status, ...cleanPayload } = payload as any
    if (tenant_id || status) {
      console.warn('⚠️ [ITEM SERVICE] Removed invalid fields:', { tenant_id, status })
    }

    // 后端已修复字段转换，前端只需发送驼峰格式 + 价格转换（元 → 分）
    const backendPayload: any = {
      name: cleanPayload.name,
      basePrice: toMinorUnit(Number(cleanPayload.basePrice)),
      isActive: Boolean(cleanPayload.isActive)
    }
    
    if (cleanPayload.description !== undefined) backendPayload.description = cleanPayload.description
    if (cleanPayload.categoryId !== undefined) backendPayload.categoryId = cleanPayload.categoryId
    if (cleanPayload.cost !== undefined) backendPayload.cost = toMinorUnit(Number(cleanPayload.cost))
    if (cleanPayload.customFields !== undefined) backendPayload.customFields = cleanPayload.customFields

    console.log('✅ [ITEM SERVICE] Final payload (will be sent to server):', JSON.stringify(backendPayload, null, 2))
    console.log('🌐 [ITEM SERVICE] Target URL:', `${API_BASE}/items`)
    console.log('📊 [ITEM SERVICE] Field types:', {
      name: typeof backendPayload.name,
      description: typeof backendPayload.description,
      categoryId: typeof backendPayload.categoryId,
      basePrice: `${typeof backendPayload.basePrice} (转换后的分)`,
      cost: `${typeof backendPayload.cost} (转换后的分)`,
      isActive: typeof backendPayload.isActive,
      customFields: typeof backendPayload.customFields
    })

    const response = await httpService.post<Item>(`${API_BASE}/items`, backendPayload)

    console.log('✅ [CREATE ITEM] Server response:', JSON.stringify(response.data, null, 2))
    console.log('🏁 [CREATE ITEM] ==========================================')
    return response.data
  }

  async updateItem(id: string, payload: UpdateItemPayload): Promise<Item> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating item:', id, JSON.stringify(payload, null, 2))

    // 验证payload不包含无效字段
    const { tenant_id, status, ...cleanPayload } = payload as any
    if (tenant_id || status) {
      console.warn('⚠️ [ITEM SERVICE] Removed invalid fields from update:', { tenant_id, status })
    }

    // 后端已修复字段转换，前端只需发送驼峰格式 + 价格转换（元 → 分）
    const backendPayload: any = {}
    
    if (cleanPayload.name !== undefined) backendPayload.name = cleanPayload.name
    if (cleanPayload.description !== undefined) backendPayload.description = cleanPayload.description
    if (cleanPayload.categoryId !== undefined) backendPayload.categoryId = cleanPayload.categoryId
    if (cleanPayload.basePrice !== undefined) backendPayload.basePrice = toMinorUnit(Number(cleanPayload.basePrice))
    if (cleanPayload.cost !== undefined) backendPayload.cost = toMinorUnit(Number(cleanPayload.cost))
    if (cleanPayload.isActive !== undefined) backendPayload.isActive = Boolean(cleanPayload.isActive)
    if (cleanPayload.customFields !== undefined) backendPayload.customFields = cleanPayload.customFields

    console.log('✅ [ITEM SERVICE DEBUG] Converted to backend payload:', JSON.stringify(backendPayload, null, 2))

    const response = await httpService.put<Item>(`${API_BASE}/items/${id}`, backendPayload)

    console.log('✏️ [ITEM SERVICE DEBUG] Updated item response:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteItem(id: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting item:', id)
    
    await httpService.delete(`${API_BASE}/items/${id}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Item deleted successfully')
  }

  async batchOperations(payload: BatchOperationPayload): Promise<BatchOperationResponse> {
    console.log('🔄 [ITEM SERVICE DEBUG] Batch operation:', JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<BatchOperationResponse>(`${API_BASE}/items/batch`, payload)
    
    console.log('🔄 [ITEM SERVICE DEBUG] Batch operation result:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  // ==================== 分类管理 ====================

  async getCategories(): Promise<Category[]> {
    console.log('📁 [ITEM SERVICE DEBUG] Getting categories...')

    const response = await httpService.get<any[]>(`${API_BASE}/categories`)

    console.log('📁 [ITEM SERVICE DEBUG] Raw categories response:', JSON.stringify(response.data, null, 2))

    // 添加防护检查，确保返回数组
    let rawCategories: any[] = []

    if (Array.isArray(response.data)) {
      rawCategories = response.data
    } else if (response.data && typeof response.data === 'object') {
      // 如果API返回的是对象格式，检查是否有categories字段
      const data = response.data as any
      if (Array.isArray(data.categories)) {
        rawCategories = data.categories
      } else if (Array.isArray(data.items)) {
        rawCategories = data.items
      }
    }

    // 转换字段名从 snake_case 到 camelCase
    const categories: Category[] = rawCategories.map((cat: any) => ({
      id: cat.id,
      tenantId: cat.tenant_id || cat.tenantId,
      name: cat.name,
      parentId: cat.parent_id || cat.parentId,
      createdAt: cat.created_at || cat.createdAt,
      // 保留子分类和商品数量
      _count: cat._count,
      children: cat.other_categories || cat.children,
      parent: cat.categories || cat.parent
    }))

    console.log('📁 [ITEM SERVICE DEBUG] Processed categories:', categories.length)
    return categories
  }

  async getCategoryTree(): Promise<Category[]> {
    console.log('🌳 [ITEM SERVICE DEBUG] Getting category tree...')

    const response = await httpService.get<any[]>(`${API_BASE}/categories/tree`)

    console.log('🌳 [ITEM SERVICE DEBUG] Category tree:', JSON.stringify(response.data, null, 2))

    // 递归转换分类树的字段名
    const transformCategory = (cat: any): Category => ({
      id: cat.id,
      tenantId: cat.tenant_id || cat.tenantId,
      name: cat.name,
      parentId: cat.parent_id || cat.parentId,
      createdAt: cat.created_at || cat.createdAt,
      _count: cat._count,
      children: (cat.other_categories || cat.children)?.map(transformCategory),
      parent: cat.categories || cat.parent
    })

    const categories = Array.isArray(response.data)
      ? response.data.map(transformCategory)
      : []

    return categories
  }

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    console.log('🚀 [CREATE CATEGORY] ==========================================')
    console.log('📥 Original payload from UI:', JSON.stringify(payload, null, 2))
    console.log('🌐 [CATEGORY SERVICE] Target URL:', `${API_BASE}/categories`)
    console.log('📊 [CATEGORY SERVICE] Field types:', {
      name: typeof payload.name,
      parentId: typeof payload.parentId
    })
    
    const response = await httpService.post<Category>(`${API_BASE}/categories`, payload)
    
    console.log('✅ [CREATE CATEGORY] Server response:', JSON.stringify(response.data, null, 2))
    console.log('🏁 [CREATE CATEGORY] ==========================================')
    return response.data
  }

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating category:', id, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<Category>(`${API_BASE}/categories/${id}`, payload)
    
    console.log('✏️ [ITEM SERVICE DEBUG] Updated category:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteCategory(id: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting category:', id)
    
    await httpService.delete(`${API_BASE}/categories/${id}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Category deleted successfully')
  }

  // ==================== 属性管理 ====================

  // ==================== Attribute 管理 (已迁移到 Modifier v2.0) ====================
  // Attribute 现在通过 ModifierGroup (groupType='property') 实现
  // 本方法为适配层，自动使用 Modifier API

  async getAttributeTypes(): Promise<ItemAttributeType[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting attribute types (via Modifier API)...')

    try {
      // 使用 Modifier API 获取 groupType === 'property' 的修饰符组
      const groups = await this.getModifierGroups({ groupType: 'property', isActive: true })

      // 将 ModifierGroup 适配为 ItemAttributeType
      const attributeTypes = groups.map(group => ({
        id: group.id,
        name: group.name,
        displayName: group.displayName,
        inputType: 'select' as const,
        options: group.options?.map(opt => ({
          id: opt.id,
          value: opt.name,
          displayName: opt.displayName,
          priceModifier: 0 // Modifier 中价格在 ItemModifierPrice 中定义
        })) || []
      }))

      console.log('🏷️ [ITEM SERVICE DEBUG] Attribute types (adapted):', JSON.stringify(attributeTypes, null, 2))
      return attributeTypes
    } catch (error) {
      console.error('Failed to get attribute types from Modifier API:', error)
      return []
    }
  }

  async createAttributeType(payload: CreateItemAttributeTypePayload): Promise<ItemAttributeType> {
    console.log('➕ [ITEM SERVICE DEBUG] Creating attribute type (via Modifier API):', JSON.stringify(payload, null, 2))

    try {
      // 将 ItemAttributeType 适配为 ModifierGroup
      const modifierPayload: CreateModifierGroupPayload = {
        name: payload.name,
        displayName: payload.displayName,
        groupType: 'property',
        isActive: true
      }

      const group = await this.createModifierGroup(modifierPayload)

      // 适配回 ItemAttributeType
      const result: ItemAttributeType = {
        id: group.id,
        name: group.name,
        displayName: group.displayName,
        inputType: 'select',
        options: []
      }

      console.log('➕ [ITEM SERVICE DEBUG] Created attribute type:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to create attribute type:', error)
      throw error
    }
  }

  async updateAttributeType(id: string, payload: UpdateItemAttributeTypePayload): Promise<ItemAttributeType> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating attribute type (via Modifier API):', id, JSON.stringify(payload, null, 2))

    try {
      // 获取现有的 ModifierGroup
      const groups = await this.getModifierGroups({ groupType: 'property' })
      const group = groups.find(g => g.id === id)

      if (!group) {
        throw new Error(`Attribute type not found: ${id}`)
      }

      // 由于 Modifier API 还没有 updateModifierGroup，这里暂时无法实现
      console.warn('⚠️ [ITEM SERVICE] updateModifierGroup not yet implemented in Modifier API')

      const result: ItemAttributeType = {
        id: group.id,
        name: payload.name || group.name,
        displayName: payload.displayName || group.displayName,
        inputType: 'select',
        options: group.options?.map(opt => ({
          id: opt.id,
          value: opt.name,
          displayName: opt.displayName,
          priceModifier: 0
        })) || []
      }

      console.log('✏️ [ITEM SERVICE DEBUG] Updated attribute type:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to update attribute type:', error)
      throw error
    }
  }

  async deleteAttributeType(id: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting attribute type (via Modifier API):', id)

    try {
      // 由于 Modifier API 还没有 deleteModifierGroup，这里暂时无法实现
      console.warn('⚠️ [ITEM SERVICE] deleteModifierGroup not yet implemented in Modifier API')
    } catch (error) {
      console.error('Failed to delete attribute type:', error)
      throw error
    }
  }

  async getAttributeOptions(typeId: string): Promise<ItemAttributeOption[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting attribute options for type (via Modifier API):', typeId)

    try {
      // 获取 ModifierGroup 及其 options
      const groups = await this.getModifierGroups({ groupType: 'property' })
      const group = groups.find(g => g.id === typeId)

      if (!group || !group.options) {
        return []
      }

      // 将 ModifierOption 适配为 ItemAttributeOption
      const options = group.options.map(opt => ({
        id: opt.id,
        value: opt.name,
        displayName: opt.displayName,
        priceModifier: 0
      }))

      console.log('🏷️ [ITEM SERVICE DEBUG] Attribute options:', JSON.stringify(options, null, 2))
      return options
    } catch (error) {
      console.error('Failed to get attribute options:', error)
      return []
    }
  }

  async createAttributeOption(typeId: string, payload: CreateItemAttributeOptionPayload): Promise<ItemAttributeOption> {
    console.log('➕ [ITEM SERVICE DEBUG] Creating attribute option (via Modifier API):', typeId, JSON.stringify(payload, null, 2))

    try {
      // 将 ItemAttributeOption 适配为 ModifierOption
      const modifierPayload: CreateModifierOptionPayload = {
        name: payload.value,
        displayName: payload.displayName,
        defaultPrice: 0,
        cost: 0
      }

      const option = await this.createModifierOption(typeId, modifierPayload)

      // 适配回 ItemAttributeOption
      const result: ItemAttributeOption = {
        id: option.id,
        value: option.name,
        displayName: option.displayName,
        priceModifier: 0
      }

      console.log('➕ [ITEM SERVICE DEBUG] Created attribute option:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to create attribute option:', error)
      throw error
    }
  }

  async updateAttributeOption(optionId: string, payload: UpdateItemAttributeOptionPayload): Promise<ItemAttributeOption> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating attribute option (via Modifier API):', optionId, JSON.stringify(payload, null, 2))

    try {
      // 由于 Modifier API 还没有 updateModifierOption，这里暂时无法实现
      console.warn('⚠️ [ITEM SERVICE] updateModifierOption not yet implemented in Modifier API')

      // 返回一个占位符对象
      const result: ItemAttributeOption = {
        id: optionId,
        value: payload.value || '',
        displayName: payload.displayName || '',
        priceModifier: 0
      }

      console.log('✏️ [ITEM SERVICE DEBUG] Updated attribute option:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to update attribute option:', error)
      throw error
    }
  }

  async deleteAttributeOption(optionId: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting attribute option (via Modifier API):', optionId)

    try {
      // 由于 Modifier API 还没有 deleteModifierOption，这里暂时无法实现
      console.warn('⚠️ [ITEM SERVICE] deleteModifierOption not yet implemented in Modifier API')
    } catch (error) {
      console.error('Failed to delete attribute option:', error)
      throw error
    }
  }

  // ==================== 商品属性关联管理 (已迁移到 Modifier v2.0) ====================
  // ItemAttribute 现在通过 ItemModifierGroup (groupType='property') 实现

  async getItemAttributes(itemId: string): Promise<ItemAttribute[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting item attributes for item (via Modifier API):', itemId)

    try {
      // 使用 Modifier API 获取商品的修饰符关联
      const itemModifiers = await this.getItemModifiers(itemId)

      // 过滤出 groupType === 'property' 的修饰符
      const attributeModifiers = itemModifiers.filter(im => im.group?.groupType === 'property')

      // 将 ItemModifierGroup 适配为 ItemAttribute
      const attributes = attributeModifiers.map(im => ({
        id: im.id,
        itemId: im.itemId,
        attributeTypeId: im.modifierGroupId,
        isRequired: im.isRequired,
        optionOverrides: undefined,
        allowedOptions: undefined,
        defaultOptionId: undefined,
        optionOrder: undefined,
        attributeType: im.group ? {
          id: im.group.id,
          name: im.group.name,
          displayName: im.group.displayName,
          inputType: 'select' as const,
          options: im.group.options?.map(opt => ({
            id: opt.id,
            value: opt.name,
            displayName: opt.displayName,
            priceModifier: 0
          })) || []
        } : undefined
      })) as ItemAttribute[]

      console.log('🏷️ [ITEM SERVICE DEBUG] Item attributes (adapted):', JSON.stringify(attributes, null, 2))
      return attributes
    } catch (error) {
      console.error('Failed to get item attributes:', error)
      return []
    }
  }

  async addItemAttribute(itemId: string, payload: CreateItemAttributePayload): Promise<ItemAttribute> {
    console.log('➕ [ITEM SERVICE DEBUG] Adding item attribute (via Modifier API):', itemId, JSON.stringify(payload, null, 2))

    try {
      // 将 CreateItemAttributePayload 适配为 AddModifierGroupToItemPayload
      const modifierPayload: AddModifierGroupToItemPayload = {
        modifierGroupId: payload.attributeTypeId,
        isRequired: payload.isRequired,
        minSelections: 0,
        maxSelections: 1
      }

      const itemModifier = await this.addModifierGroupToItem(itemId, modifierPayload)

      // 适配回 ItemAttribute
      const result: ItemAttribute = {
        id: itemModifier.id,
        itemId: itemModifier.itemId,
        attributeTypeId: itemModifier.modifierGroupId,
        isRequired: itemModifier.isRequired,
        optionOverrides: payload.optionOverrides,
        allowedOptions: payload.allowedOptions,
        defaultOptionId: payload.defaultOptionId,
        optionOrder: payload.optionOrder,
        attributeType: itemModifier.group ? {
          id: itemModifier.group.id,
          name: itemModifier.group.name,
          displayName: itemModifier.group.displayName,
          inputType: 'select',
          options: itemModifier.group.options?.map(opt => ({
            id: opt.id,
            value: opt.name,
            displayName: opt.displayName,
            priceModifier: 0
          })) || []
        } : undefined
      }

      console.log('➕ [ITEM SERVICE DEBUG] Added item attribute:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to add item attribute:', error)
      throw error
    }
  }

  async updateItemAttribute(itemId: string, attributeId: string, payload: UpdateItemAttributePayload): Promise<ItemAttribute> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating item attribute (via Modifier API):', itemId, attributeId, JSON.stringify(payload, null, 2))

    try {
      // 由于 Modifier API 还没有更新方法，这里暂时无法实现
      console.warn('⚠️ [ITEM SERVICE] updateItemModifier not yet implemented in Modifier API')

      // 返回一个占位符对象
      const result: ItemAttribute = {
        id: attributeId,
        itemId,
        attributeTypeId: payload.attributeTypeId || '',
        isRequired: payload.isRequired !== undefined ? payload.isRequired : false,
        optionOverrides: payload.optionOverrides,
        allowedOptions: payload.allowedOptions,
        defaultOptionId: payload.defaultOptionId,
        optionOrder: payload.optionOrder
      }

      console.log('✏️ [ITEM SERVICE DEBUG] Updated item attribute:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Failed to update item attribute:', error)
      throw error
    }
  }

  async removeItemAttribute(itemId: string, attributeId: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Removing item attribute (via Modifier API):', itemId, attributeId)

    try {
      // attributeId 实际上是 ItemModifierGroup 的 modifierGroupId
      // 我们需要先获取 ItemModifierGroup 找到 modifierGroupId
      const itemModifiers = await this.getItemModifiers(itemId)
      const itemModifier = itemModifiers.find(im => im.id === attributeId)

      if (!itemModifier) {
        throw new Error(`Item attribute not found: ${attributeId}`)
      }

      await this.removeModifierGroupFromItem(itemId, itemModifier.modifierGroupId)

      console.log('🗑️ [ITEM SERVICE DEBUG] Item attribute removed successfully')
    } catch (error) {
      console.error('Failed to remove item attribute:', error)
      throw error
    }
  }

  // ==================== Add-on管理 ====================

  async getAddons(params?: { page?: number; limit?: number; isActive?: boolean }): Promise<Addon[]> {
    console.log('🧩 [ITEM SERVICE DEBUG] Getting addons...')
    
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    
    const url = `${API_BASE}/addons${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await httpService.get<{ addons: Addon[] } | Addon[]>(url)
    
    console.log('🧩 [ITEM SERVICE DEBUG] Addons response:', JSON.stringify(response.data, null, 2))
    
    // 处理不同的响应格式
    if (Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object' && 'addons' in response.data) {
      return (response.data as { addons: Addon[] }).addons || []
    } else {
      console.warn('🧩 [ITEM SERVICE DEBUG] Unexpected response format, returning empty array')
      return []
    }
  }

  async getAddon(id: string): Promise<Addon> {
    console.log('🧩 [ITEM SERVICE DEBUG] Getting addon:', id)
    
    const response = await httpService.get<Addon>(`${API_BASE}/addons/${id}`)
    
    console.log('🧩 [ITEM SERVICE DEBUG] Addon details:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async createAddon(payload: CreateAddonPayload): Promise<Addon> {
    console.log('➕ [ITEM SERVICE DEBUG] Creating addon:', JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<Addon>(`${API_BASE}/addons`, payload)
    
    console.log('➕ [ITEM SERVICE DEBUG] Created addon:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateAddon(id: string, payload: UpdateAddonPayload): Promise<Addon> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating addon:', id, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<Addon>(`${API_BASE}/addons/${id}`, payload)
    
    console.log('✏️ [ITEM SERVICE DEBUG] Updated addon:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteAddon(id: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting addon:', id)
    
    await httpService.delete(`${API_BASE}/addons/${id}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Addon deleted successfully')
  }

  async getItemAddons(itemId: string): Promise<ItemAddon[]> {
    console.log('🧩 [ITEM SERVICE DEBUG] Getting item addons for:', itemId)
    
    const response = await httpService.get<ItemAddon[]>(`${API_BASE}/addons/item/${itemId}`)
    
    console.log('🧩 [ITEM SERVICE DEBUG] Item addons:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async addItemAddon(itemId: string, payload: CreateItemAddonPayload): Promise<ItemAddon> {
    console.log('➕ [ITEM SERVICE DEBUG] Adding addon to item:', itemId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<ItemAddon>(`${API_BASE}/addons/item/${itemId}`, payload)
    
    console.log('➕ [ITEM SERVICE DEBUG] Added item addon:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async removeItemAddon(itemId: string, addonId: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Removing addon from item:', itemId, addonId)
    
    await httpService.delete(`${API_BASE}/addons/item/${itemId}/${addonId}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Item addon removed successfully')
  }

  // ==================== Combo管理 ====================

  async getCombos(params: ComboListParams = {}): Promise<PaginatedResponse<Combo>> {
    console.log('🎁 [ITEM SERVICE DEBUG] Getting combos...')
    
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    const url = `/combos${queryString ? '?' + queryString : ''}`
    
    const response = await httpService.get<ApiPaginatedResponse<Combo>>(`${API_BASE}${url}`)
    
    console.log('🎁 [ITEM SERVICE DEBUG] Combos response:', JSON.stringify(response.data, null, 2))
    
    const apiData = response.data
    
    if (!apiData) {
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    }
    
    // 处理API响应格式
    const rawCombos = Array.isArray(apiData.items) ? apiData.items : (apiData as any).combos || []
    
    // 转换数据类型
    const combos = rawCombos.map((combo: any) => ({
      ...combo,
      basePrice: typeof combo.basePrice === 'string' ? parseFloat(combo.basePrice) : combo.basePrice,
      discount: typeof combo.discount === 'string' ? parseFloat(combo.discount) : combo.discount
    }))
    
    const pagination = apiData.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
    
    return {
      data: combos,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.pages
    }
  }

  async getCombo(id: string): Promise<Combo> {
    console.log('🎁 [ITEM SERVICE DEBUG] Getting combo:', id)
    
    const response = await httpService.get<Combo>(`${API_BASE}/combos/${id}`)
    
    console.log('🎁 [ITEM SERVICE DEBUG] Combo details:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async createCombo(payload: CreateComboPayload): Promise<Combo> {
    console.log('🚀 [CREATE COMBO] ==========================================')
    console.log('📥 Original payload from UI:', JSON.stringify(payload, null, 2))

    const validatedPayload = {
      ...payload,
      basePrice: toMinorUnit(Number(payload.basePrice)), // 元 → 分
      discount: payload.discount ? toMinorUnit(Number(payload.discount)) : 0, // 元 → 分
      discountType: payload.discountType || 'fixed',
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true
    }

    console.log('✅ [COMBO SERVICE] Final payload:', JSON.stringify(validatedPayload, null, 2))
    console.log('🌐 [COMBO SERVICE] Target URL:', `${API_BASE}/combos`)

    const response = await httpService.post<Combo>(`${API_BASE}/combos`, validatedPayload)

    console.log('✅ [CREATE COMBO] Server response:', JSON.stringify(response.data, null, 2))
    console.log('🏁 [CREATE COMBO] ==========================================')
    return response.data
  }

  async updateCombo(id: string, payload: UpdateComboPayload): Promise<Combo> {
    console.log('✏️ [COMBO SERVICE DEBUG] Updating combo:', id, JSON.stringify(payload, null, 2))

    const validatedPayload: any = {
      ...payload
    }

    // 转换价格: 元 → 分
    if (payload.basePrice !== undefined) {
      validatedPayload.basePrice = toMinorUnit(Number(payload.basePrice))
    }
    if (payload.discount !== undefined) {
      validatedPayload.discount = toMinorUnit(Number(payload.discount))
    }
    if (payload.isActive !== undefined) {
      validatedPayload.isActive = Boolean(payload.isActive)
    }

    console.log('✅ [COMBO SERVICE DEBUG] Validated update payload:', JSON.stringify(validatedPayload, null, 2))

    const response = await httpService.put<Combo>(`${API_BASE}/combos/${id}`, validatedPayload)

    console.log('✏️ [COMBO SERVICE DEBUG] Updated combo response:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteCombo(id: string): Promise<void> {
    console.log('🗑️ [COMBO SERVICE DEBUG] Deleting combo:', id)
    
    await httpService.delete(`${API_BASE}/combos/${id}`)
    
    console.log('🗑️ [COMBO SERVICE DEBUG] Combo deleted successfully')
  }

  // ==================== ComboItem管理 ====================

  async getComboItems(comboId: string): Promise<ComboItem[]> {
    console.log('🎁 [COMBO SERVICE DEBUG] Getting combo items for:', comboId)
    
    const response = await httpService.get<ComboItem[]>(`${API_BASE}/combos/${comboId}/items`)
    
    console.log('🎁 [COMBO SERVICE DEBUG] Combo items:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async addComboItem(comboId: string, payload: CreateComboItemPayload): Promise<ComboItem> {
    console.log('➕ [COMBO SERVICE DEBUG] Adding item to combo:', comboId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<ComboItem>(`${API_BASE}/combos/${comboId}/items`, payload)
    
    console.log('➕ [COMBO SERVICE DEBUG] Added combo item:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateComboItem(comboId: string, itemId: string, payload: UpdateComboItemPayload): Promise<ComboItem> {
    console.log('✏️ [COMBO SERVICE DEBUG] Updating combo item:', comboId, itemId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<ComboItem>(`${API_BASE}/combos/${comboId}/items/${itemId}`, payload)
    
    console.log('✏️ [COMBO SERVICE DEBUG] Updated combo item:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async removeComboItem(comboId: string, itemId: string): Promise<void> {
    console.log('🗑️ [COMBO SERVICE DEBUG] Removing item from combo:', comboId, itemId)

    await httpService.delete(`${API_BASE}/combos/${comboId}/items/${itemId}`)

    console.log('🗑️ [COMBO SERVICE DEBUG] Combo item removed successfully')
  }

  // ==================== Modifier v2.0 管理 ====================

  /**
   * 获取修饰符组列表
   */
  async getModifierGroups(params?: { groupType?: ModifierGroupType; isActive?: boolean; nocache?: number }): Promise<ModifierGroup[]> {
    const queryParams = new URLSearchParams()
    if (params?.groupType) queryParams.append('groupType', params.groupType)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.nocache !== undefined) queryParams.append('nocache', params.nocache.toString())

    const url = `${API_BASE}/modifier-groups${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await httpService.get<{ groups: any[] }>(url)

    // 转换后端的下划线字段为前端的驼峰字段
    const groups = (response.data.groups || []).map((group: any) => ({
      id: group.id,
      tenantId: group.tenant_id,
      name: group.name,
      displayName: group.display_name,
      groupType: group.group_type,
      description: group.description,
      displayOrder: group.display_order,
      isActive: group.is_active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      options: (group.modifier_options || []).map((option: any) => ({
        id: option.id,
        modifierGroupId: option.modifier_group_id,
        name: option.name,
        displayName: option.display_name,
        // 价格从分转换为元
        defaultPrice: option.default_price !== null && option.default_price !== undefined
          ? fromMinorUnit(Number(option.default_price))
          : 0,
        cost: option.cost !== null && option.cost !== undefined
          ? fromMinorUnit(Number(option.cost))
          : undefined,
        displayOrder: option.display_order,
        isActive: option.is_active,
        isDefault: option.is_default,
        trackInventory: option.track_inventory,
        currentStock: option.current_stock,
        createdAt: option.created_at,
        updatedAt: option.updated_at
      }))
    }))

    return groups
  }

  /**
   * 创建修饰符组
   */
  async createModifierGroup(payload: CreateModifierGroupPayload): Promise<ModifierGroup> {
    const response = await httpService.post<{ group: any }>(`${API_BASE}/modifier-groups`, payload)
    const group = response.data.group
    
    // 转换后端的下划线字段为前端的驼峰字段
    return {
      id: group.id,
      tenantId: group.tenant_id,
      name: group.name,
      displayName: group.display_name,
      groupType: group.group_type,
      description: group.description,
      displayOrder: group.display_order,
      isActive: group.is_active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      options: []
    }
  }

  /**
   * 创建修饰符选项
   */
  async createModifierOption(groupId: string, payload: CreateModifierOptionPayload): Promise<ModifierOption> {
    console.log('[MODIFIER] ➕ Create option request:', JSON.stringify({ groupId, payload }, null, 2))

    // 价格转换（元 → 分）
    const convertedPayload = {
      ...payload,
      defaultPrice: payload.defaultPrice ? toMinorUnit(Number(payload.defaultPrice)) : 0, // 元 → 分
      cost: payload.cost ? toMinorUnit(Number(payload.cost)) : undefined // 元 → 分
    }

    const response = await httpService.post<{ option: any }>(`${API_BASE}/modifier-groups/${groupId}/options`, convertedPayload)
    const option = response.data.option

    console.log('[MODIFIER] ➕ Create option response:', JSON.stringify(option, null, 2))

    // 转换后端的下划线字段为前端的驼峰字段，价格从分转换为元
    return {
      id: option.id,
      modifierGroupId: option.modifier_group_id,
      name: option.name,
      displayName: option.display_name,
      defaultPrice: option.default_price !== null && option.default_price !== undefined
        ? fromMinorUnit(Number(option.default_price))
        : 0,
      cost: option.cost !== null && option.cost !== undefined
        ? fromMinorUnit(Number(option.cost))
        : undefined,
      displayOrder: option.display_order,
      isActive: option.is_active,
      isDefault: option.is_default,
      trackInventory: option.track_inventory,
      currentStock: option.current_stock,
      createdAt: option.created_at,
      updatedAt: option.updated_at
    }
  }

  /**
   * 更新修饰符选项
   */
  async updateModifierOption(groupId: string, optionId: string, payload: Partial<CreateModifierOptionPayload>): Promise<ModifierOption> {
    // 价格转换（元 → 分）
    const convertedPayload: any = { ...payload }
    if (payload.defaultPrice !== undefined) {
      convertedPayload.defaultPrice = toMinorUnit(Number(payload.defaultPrice)) // 元 → 分
    }
    if (payload.cost !== undefined) {
      convertedPayload.cost = toMinorUnit(Number(payload.cost)) // 元 → 分
    }

    const response = await httpService.put<{ option: any }>(`${API_BASE}/modifier-groups/${groupId}/options/${optionId}`, convertedPayload)
    const option = response.data.option

    // 转换后端的下划线字段为前端的驼峰字段，价格从分转换为元
    return {
      id: option.id,
      modifierGroupId: option.modifier_group_id,
      name: option.name,
      displayName: option.display_name,
      defaultPrice: option.default_price !== null && option.default_price !== undefined
        ? fromMinorUnit(Number(option.default_price))
        : 0,
      cost: option.cost !== null && option.cost !== undefined
        ? fromMinorUnit(Number(option.cost))
        : undefined,
      displayOrder: option.display_order,
      isActive: option.is_active,
      isDefault: option.is_default,
      trackInventory: option.track_inventory,
      currentStock: option.current_stock,
      createdAt: option.created_at,
      updatedAt: option.updated_at
    }
  }

  /**
   * 删除修饰符选项
   * 注意：根据 API 文档，后端可能还未实现此端点
   * 如果返回 404，说明后端还未支持此功能
   */
  async deleteModifierOption(groupId: string, optionId: string): Promise<void> {
    try {
      await httpService.delete(`${API_BASE}/modifier-groups/${groupId}/options/${optionId}`)
    } catch (error: any) {
      // 如果返回 404，说明后端还未实现此端点
      if (error?.response?.status === 404) {
        throw new Error('后端 API 还未实现删除修饰符选项功能，请稍后再试')
      }
      throw error
    }
  }

  /**
   * 更新修饰符组
   */
  async updateModifierGroup(groupId: string, payload: UpdateModifierGroupPayload): Promise<ModifierGroup> {
    const response = await httpService.put<{ group: any }>(`${API_BASE}/modifier-groups/${groupId}`, payload)
    const group = response.data.group

    // 转换后端的下划线字段为前端的驼峰字段，价格从分转换为元
    return {
      id: group.id,
      tenantId: group.tenant_id,
      name: group.name,
      displayName: group.display_name,
      groupType: group.group_type,
      description: group.description,
      displayOrder: group.display_order,
      isActive: group.is_active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      options: (group.modifier_options || []).map((option: any) => ({
        id: option.id,
        modifierGroupId: option.modifier_group_id,
        name: option.name,
        displayName: option.display_name,
        // 价格从分转换为元
        defaultPrice: option.default_price !== null && option.default_price !== undefined
          ? fromMinorUnit(Number(option.default_price))
          : 0,
        cost: option.cost !== null && option.cost !== undefined
          ? fromMinorUnit(Number(option.cost))
          : undefined,
        displayOrder: option.display_order,
        isActive: option.is_active,
        isDefault: option.is_default,
        trackInventory: option.track_inventory,
        currentStock: option.current_stock,
        createdAt: option.created_at,
        updatedAt: option.updated_at
      }))
    }
  }

  /**
   * 删除修饰符组
   * 注意：根据 API 文档，后端可能还未实现此端点
   * 如果返回 404，说明后端还未支持此功能
   */
  async deleteModifierGroup(groupId: string): Promise<void> {
    try {
      await httpService.delete(`${API_BASE}/modifier-groups/${groupId}`)
    } catch (error: any) {
      // 如果返回 404，说明后端还未实现此端点
      if (error?.response?.status === 404) {
        throw new Error('后端 API 还未实现删除修饰符组功能，请稍后再试')
      }
      throw error
    }
  }

  /**
   * 获取商品的修饰符配置
   */
  async getItemModifiers(itemId: string): Promise<ItemModifierGroup[]> {
    const response = await httpService.get<{ groups: any[] }>(`${API_BASE}/items/${itemId}/modifiers`)
    
    // 转换后端的下划线字段为前端的驼峰字段
    const groups = (response.data.groups || []).map((relation: any) => ({
      id: relation.id,
      itemId: relation.item_id,
      modifierGroupId: relation.modifier_group_id,
      isRequired: relation.is_required,
      minSelections: relation.min_selections,
      maxSelections: relation.max_selections,
      sortOrder: relation.sort_order || relation.display_order,
      createdAt: relation.created_at,
      // 转换嵌套的 group 数据
      group: relation.group || relation.modifier_groups ? {
        id: (relation.group || relation.modifier_groups).id,
        tenantId: (relation.group || relation.modifier_groups).tenant_id,
        name: (relation.group || relation.modifier_groups).name,
        displayName: (relation.group || relation.modifier_groups).display_name,
        groupType: (relation.group || relation.modifier_groups).group_type,
        description: (relation.group || relation.modifier_groups).description,
        displayOrder: (relation.group || relation.modifier_groups).display_order,
        isActive: (relation.group || relation.modifier_groups).is_active,
        createdAt: (relation.group || relation.modifier_groups).created_at,
        updatedAt: (relation.group || relation.modifier_groups).updated_at,
        // 转换嵌套的 options 数据
        options: ((relation.group || relation.modifier_groups).modifier_options || []).map((option: any) => {
          const defaultPriceCents = option.default_price
          const itemPriceCents = option.item_modifier_prices?.[0]?.price
          return {
            id: option.id,
            modifierGroupId: option.modifier_group_id,
            name: option.name,
            displayName: option.display_name,
            // 价格从分转换为元
            defaultPrice: defaultPriceCents !== null && defaultPriceCents !== undefined
              ? fromMinorUnit(Number(defaultPriceCents))
              : 0,
            cost: option.cost !== null && option.cost !== undefined
              ? fromMinorUnit(Number(option.cost))
              : undefined,
            displayOrder: option.display_order,
            isActive: option.is_active,
            isDefault: option.is_default,
            trackInventory: option.track_inventory,
            currentStock: option.current_stock,
            createdAt: option.created_at,
            updatedAt: option.updated_at,
            // 转换商品级选项配置（item_modifier_options）
            itemOptions: (option.item_modifier_options || []).map((itemOpt: any) => ({
              isDefault: itemOpt.is_default,
              isEnabled: itemOpt.is_enabled,
              displayOrder: itemOpt.display_order
            })),
            // 价格从分转换为元
            itemPrice: itemPriceCents !== null && itemPriceCents !== undefined
              ? fromMinorUnit(Number(itemPriceCents))
              : null,
            finalPrice: itemPriceCents !== null && itemPriceCents !== undefined
              ? fromMinorUnit(Number(itemPriceCents))
              : (defaultPriceCents !== null && defaultPriceCents !== undefined ? fromMinorUnit(Number(defaultPriceCents)) : 0)
          }
        })
      } : undefined
    }))
    
    return groups
  }

  /**
   * 为商品关联修饰符组
   */
  async addModifierGroupToItem(itemId: string, payload: AddModifierGroupToItemPayload): Promise<ItemModifierGroup> {
    const response = await httpService.post<{ relation: any }>(`${API_BASE}/items/${itemId}/modifier-groups`, payload)
    const relation = response.data.relation
    
    // 转换后端的下划线字段为前端的驼峰字段
    return {
      id: relation.id,
      itemId: relation.item_id,
      modifierGroupId: relation.modifier_group_id,
      isRequired: relation.is_required,
      minSelections: relation.min_selections,
      maxSelections: relation.max_selections,
      sortOrder: relation.sort_order || relation.display_order,
      createdAt: relation.created_at,
      group: relation.group || relation.modifier_groups ? {
        id: (relation.group || relation.modifier_groups).id,
        tenantId: (relation.group || relation.modifier_groups).tenant_id,
        name: (relation.group || relation.modifier_groups).name,
        displayName: (relation.group || relation.modifier_groups).display_name,
        groupType: (relation.group || relation.modifier_groups).group_type,
        description: (relation.group || relation.modifier_groups).description,
        displayOrder: (relation.group || relation.modifier_groups).display_order,
        isActive: (relation.group || relation.modifier_groups).is_active,
        createdAt: (relation.group || relation.modifier_groups).created_at,
        updatedAt: (relation.group || relation.modifier_groups).updated_at,
        options: ((relation.group || relation.modifier_groups).modifier_options || []).map((option: any) => {
          const defaultPriceCents = option.default_price
          const itemPriceCents = option.item_modifier_prices?.[0]?.price
          return {
            id: option.id,
            modifierGroupId: option.modifier_group_id,
            name: option.name,
            displayName: option.display_name,
            // 价格从分转换为元
            defaultPrice: defaultPriceCents !== null && defaultPriceCents !== undefined
              ? fromMinorUnit(Number(defaultPriceCents))
              : 0,
            cost: option.cost !== null && option.cost !== undefined
              ? fromMinorUnit(Number(option.cost))
              : undefined,
            displayOrder: option.display_order,
            isActive: option.is_active,
            isDefault: option.is_default,
            trackInventory: option.track_inventory,
            currentStock: option.current_stock,
            createdAt: option.created_at,
            updatedAt: option.updated_at,
            // 转换商品级选项配置
            itemOptions: (option.item_modifier_options || []).map((itemOpt: any) => ({
              isDefault: itemOpt.is_default,
              isEnabled: itemOpt.is_enabled,
              displayOrder: itemOpt.display_order
            })),
            // 价格从分转换为元
            itemPrice: itemPriceCents !== null && itemPriceCents !== undefined
              ? fromMinorUnit(Number(itemPriceCents))
              : null,
            finalPrice: itemPriceCents !== null && itemPriceCents !== undefined
              ? fromMinorUnit(Number(itemPriceCents))
              : (defaultPriceCents !== null && defaultPriceCents !== undefined ? fromMinorUnit(Number(defaultPriceCents)) : 0)
          }
        })
      } : undefined
    }
  }

  /**
   * 移除商品的修饰符组
   */
  async removeModifierGroupFromItem(itemId: string, groupId: string): Promise<void> {
    await httpService.delete(`${API_BASE}/items/${itemId}/modifier-groups/${groupId}`)
  }

  /**
   * 设置商品的修饰符价格
   */
  async setItemModifierPrices(itemId: string, payload: SetItemModifierPricesPayload): Promise<void> {
    // 转换价格: 元 → 分
    const convertedPayload = {
      prices: payload.prices.map(p => ({
        modifierOptionId: p.modifierOptionId,
        price: toMinorUnit(Number(p.price))
      }))
    }
    await httpService.post(`${API_BASE}/items/${itemId}/modifier-prices`, convertedPayload)
  }

  /**
   * 删除商品的修饰符价格
   */
  async removeItemModifierPrice(itemId: string, optionId: string): Promise<void> {
    await httpService.delete(`${API_BASE}/items/${itemId}/modifier-prices/${optionId}`)
  }

  /**
   * 配置商品修饰符选项（设置选项在特定商品中的行为）
   */
  async configureItemModifierOptions(itemId: string, payload: ConfigureItemModifierOptionsPayload): Promise<void> {
    await httpService.post(`${API_BASE}/items/${itemId}/modifier-options`, payload)
  }

  /**
   * 删除商品的修饰符选项配置
   */
  async removeItemModifierOption(itemId: string, optionId: string): Promise<void> {
    await httpService.delete(`${API_BASE}/items/${itemId}/modifier-options/${optionId}`)
  }

  // ==================== 商品图片管理 ====================

  /**
   * 上传或更新商品图片
   * 使用覆盖策略：同一商品上传新图片会自动替换旧图片
   * @param itemId 商品 ID
   * @param file 图片文件 (支持 JPG, PNG, WebP，最大 5MB)
   */
  async uploadItemImage(itemId: string, file: File): Promise<{ item: Item; image: { url: string; publicId: string } }> {
    console.log('📸 [ITEM SERVICE] Uploading image for item:', itemId, {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type
    })

    const formData = new FormData()
    formData.append('image', file)

    const response = await httpService.post<{ item: any; image: { url: string; publicId: string } }>(
      `${API_BASE}/items/${itemId}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    console.log('📸 [ITEM SERVICE] Image upload response:', response.data)

    // 转换返回的 item 字段名
    const item = response.data.item
    return {
      item: {
        id: item.id,
        tenantId: item.tenant_id || item.tenantId,
        categoryId: item.category_id || item.categoryId,
        name: item.name,
        description: item.description,
        customFields: item.custom_fields || item.customFields,
        basePrice: typeof (item.base_price ?? item.basePrice) === 'string'
          ? parseFloat(item.base_price ?? item.basePrice)
          : (item.base_price ?? item.basePrice ?? 0),
        cost: item.cost !== undefined && item.cost !== null
          ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost)
          : undefined,
        aiTags: item.ai_tags || item.aiTags,
        imageUrl: item.image_url || item.imageUrl,
        isActive: item.is_active ?? item.isActive ?? true,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt
      },
      image: response.data.image
    }
  }

  /**
   * 删除商品图片
   * @param itemId 商品 ID
   */
  async deleteItemImage(itemId: string): Promise<{ item: Item }> {
    console.log('🗑️ [ITEM SERVICE] Deleting image for item:', itemId)

    const response = await httpService.delete<{ item: any }>(
      `${API_BASE}/items/${itemId}/image`
    )

    console.log('🗑️ [ITEM SERVICE] Image delete response:', response.data)

    // 转换返回的 item 字段名
    const item = response.data.item
    return {
      item: {
        id: item.id,
        tenantId: item.tenant_id || item.tenantId,
        categoryId: item.category_id || item.categoryId,
        name: item.name,
        description: item.description,
        customFields: item.custom_fields || item.customFields,
        basePrice: typeof (item.base_price ?? item.basePrice) === 'string'
          ? parseFloat(item.base_price ?? item.basePrice)
          : (item.base_price ?? item.basePrice ?? 0),
        cost: item.cost !== undefined && item.cost !== null
          ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost)
          : undefined,
        aiTags: item.ai_tags || item.aiTags,
        imageUrl: item.image_url || item.imageUrl,
        isActive: item.is_active ?? item.isActive ?? true,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt
      }
    }
  }

  // ==================== 税务相关方法 ====================

  /**
   * 获取某地区的所有税率
   */
  async getTaxRates(regionCode: string): Promise<TaxRate[]> {
    try {
      const response = await httpService.get<{ data: { rates: TaxRate[] } }>(
        `${API_BASE}/taxes/tax-rates?region=${regionCode}`
      )
      return response.data?.data?.rates || []
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn('[ITEM SERVICE] tax-rates API 未实现，返回本地 mock 数据')
        return MOCK_TAX_RATES[regionCode] || []
      }
      throw error
    }
  }

  /**
   * 获取某地区的所有税类（简化版）
   * 后端返回的是简化格式：{ id, name, rate, regionCode, createdAt }
   */
  async getTaxClasses(regionCode: string): Promise<SimpleTaxRate[]> {
    try {
      const response = await httpService.get<{ data: { taxClasses: SimpleTaxRate[] } }>(
        `${API_BASE}/taxes/tax-classes?region=${regionCode}`
      )
      return response.data?.data?.taxClasses || []
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn('[ITEM SERVICE] tax-classes API 未实现，返回空数组')
        return []
      }
      throw error
    }
  }

  /**
   * 获取商品的税类信息
   */
  async getItemTaxClass(itemId: string): Promise<ItemTaxClass> {
    const response = await httpService.get<{ data: ItemTaxClass }>(
      `${API_BASE}/taxes/items/${itemId}/tax-class`
    )
    return response.data?.data as ItemTaxClass
  }

  /**
   * 为商品分配系统预设税类
   */
  async assignItemTaxClass(itemId: string, payload: AssignTaxClassPayload): Promise<void> {
    await httpService.post(`${API_BASE}/taxes/items/${itemId}/assign-tax-class`, payload)
  }

  /**
   * 为商品分配租户自定义税类
   */
  async assignItemTenantTaxClass(itemId: string, payload: AssignTaxClassPayload): Promise<void> {
    await httpService.post(`${API_BASE}/taxes/items/${itemId}/assign-tenant-tax-class`, payload)
  }

  /**
   * 计算单个商品的税后价格
   */
  async calculateItemTax(itemId: string, region: string): Promise<TaxCalculationResult> {
    const response = await httpService.post<{ data: TaxCalculationResult }>(
      `${API_BASE}/taxes/items/${itemId}/calculate-tax`,
      { region }
    )
    return response.data?.data as TaxCalculationResult
  }

  /**
   * 批量计算商品的税后价格
   */
  async calculateBatchItemTax(
    itemIds: string[],
    region: string
  ): Promise<TaxCalculationResult[]> {
    const response = await httpService.post<{ data: { results: TaxCalculationResult[] } }>(
      `${API_BASE}/taxes/items/calculate-batch-tax`,
      {
        items: itemIds.map(id => ({ itemId: id })),
        region
      }
    )
    return response.data?.data?.results || []
  }

  /**
   * 创建或更新税率覆盖
   */
  async createTaxRateOverride(payload: TaxRateOverridePayload): Promise<void> {
    await httpService.post(`${API_BASE}/taxes/tax-rates-override`, payload)
  }

  /**
   * 创建租户自定义税类
   */
  async createTenantTaxClass(payload: CreateTenantTaxClassPayload): Promise<SimpleTaxRate> {
    const response = await httpService.post<{ data: SimpleTaxRate }>(
      `${API_BASE}/taxes/tenant-tax-classes`,
      payload
    )
    return response.data?.data as SimpleTaxRate
  }

  /**
   * 删除税种
   */
  async deleteTaxRate(taxRateId: string): Promise<void> {
    await httpService.delete(`${API_BASE}/taxes/tax-rates/${taxRateId}`)
  }

  /**
   * 更新税种
   */
  async updateTaxRate(taxRateId: string, payload: { name?: string; rate?: number }): Promise<SimpleTaxRate> {
    const response = await httpService.put<{ data: SimpleTaxRate }>(
      `${API_BASE}/taxes/tax-rates/${taxRateId}`,
      payload
    )
    return response.data?.data as SimpleTaxRate
  }

  /**
   * 批量为商品分配系统预设税类
   */
  async batchAssignItemTaxClass(itemIds: string[], taxClassId: string): Promise<{ total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> }> {
    const response = await httpService.post<{ data: { total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> } }>(
      `${API_BASE}/taxes/items/batch-assign-tax-class`,
      { itemIds, taxClassId }
    )
    return response.data?.data as { total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> }
  }

  /**
   * 批量为商品分配租户自定义税类
   */
  async batchAssignItemTenantTaxClass(itemIds: string[], tenantTaxClassId: string): Promise<{ total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> }> {
    const response = await httpService.post<{ data: { total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> } }>(
      `${API_BASE}/taxes/items/batch-assign-tenant-tax-class`,
      { itemIds, tenantTaxClassId }
    )
    return response.data?.data as { total: number; succeeded: number; failed: number; failedItems: Array<{ itemId: string; error: string }> }
  }

  /**
   * 获取税种关联的商品列表
   */
  async getTaxRateItems(taxRateId: string): Promise<Array<{ id: string; name: string; basePrice: number; isActive: boolean }>> {
    const response = await httpService.get<{ data: { items: Array<{ id: string; name: string; basePrice: number; isActive: boolean }> } }>(
      `${API_BASE}/taxes/tax-rates/${taxRateId}/items`
    )
    return response.data?.data?.items || []
  }

  /**
   * 移除商品的税种关联
   */
  async removeItemTaxClass(itemId: string): Promise<void> {
    await httpService.delete(`${API_BASE}/taxes/items/${itemId}/tax-class`)
  }

  /**
   * 批量移除商品的税种关联
   */
  async batchRemoveItemTaxClass(itemIds: string[]): Promise<{ total: number; removed: number }> {
    const response = await httpService.post<{ data: { total: number; removed: number } }>(
      `${API_BASE}/taxes/items/batch-remove-tax-class`,
      { itemIds }
    )
    return response.data?.data as { total: number; removed: number }
  }
}

// 导出服务实例
export const itemManagementService = new ItemManagementService()

// 导出便捷的函数接口
export const {
  getItems,
  getItem,
  searchItems,
  createItem,
  updateItem,
  deleteItem,
  batchOperations,
  // 图片管理
  uploadItemImage,
  deleteItemImage,
  getCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getAttributeTypes,
  createAttributeType,
  updateAttributeType,
  deleteAttributeType,
  getAttributeOptions,
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
  getItemAttributes,
  addItemAttribute,
  updateItemAttribute,
  removeItemAttribute,
  getAddons,
  getAddon,
  createAddon,
  updateAddon,
  deleteAddon,
  getItemAddons,
  addItemAddon,
  removeItemAddon,
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  getComboItems,
  addComboItem,
  updateComboItem,
  removeComboItem,
  // Modifier v2.0 方法
  getModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  createModifierOption,
  updateModifierOption,
  deleteModifierOption,
  getItemModifiers,
  addModifierGroupToItem,
  removeModifierGroupFromItem,
  setItemModifierPrices,
  removeItemModifierPrice,
  configureItemModifierOptions,
  removeItemModifierOption,
  // 税务相关方法
  getTaxRates,
  getTaxClasses,
  getItemTaxClass,
  assignItemTaxClass,
  assignItemTenantTaxClass,
  batchAssignItemTaxClass,
  batchAssignItemTenantTaxClass,
  calculateItemTax,
  calculateBatchItemTax,
  createTaxRateOverride,
  createTenantTaxClass,
  deleteTaxRate,
  updateTaxRate,
  getTaxRateItems,
  removeItemTaxClass,
  batchRemoveItemTaxClass
} = itemManagementService
