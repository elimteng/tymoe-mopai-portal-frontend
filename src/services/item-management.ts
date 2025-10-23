import { httpService } from './http'

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

// Add-on 相关接口
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
  attributes?: CreateItemAttributePayload[]
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  attributes?: CreateItemAttributePayload[]
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

const API_BASE = (import.meta.env.VITE_ITEM_MANAGE_BASE as string | undefined) ?? 'http://localhost:3001/api/item-manage/v1'

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
    
    // 转换数据类型，确保数字字段是number类型
    const items = rawItems.map(item => ({
      ...item,
      basePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
      cost: item.cost && typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost
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
    
    // 确保数据类型正确
    const validatedPayload = {
      ...cleanPayload,
      basePrice: Number(cleanPayload.basePrice),
      cost: cleanPayload.cost ? Number(cleanPayload.cost) : undefined,
      isActive: Boolean(cleanPayload.isActive)
    }
    
    console.log('✅ [ITEM SERVICE] Final payload (will be sent to server):', JSON.stringify(validatedPayload, null, 2))
    console.log('🌐 [ITEM SERVICE] Target URL:', `${API_BASE}/items`)
    console.log('📊 [ITEM SERVICE] Field types:', {
      name: typeof validatedPayload.name,
      description: typeof validatedPayload.description,
      categoryId: typeof validatedPayload.categoryId,
      basePrice: typeof validatedPayload.basePrice,
      cost: typeof validatedPayload.cost,
      isActive: typeof validatedPayload.isActive,
      customFields: typeof validatedPayload.customFields
    })
    
    const response = await httpService.post<Item>(`${API_BASE}/items`, validatedPayload)
    
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
    
    // 确保数据类型正确
    const validatedPayload = {
      ...cleanPayload,
      basePrice: cleanPayload.basePrice ? Number(cleanPayload.basePrice) : undefined,
      cost: cleanPayload.cost ? Number(cleanPayload.cost) : undefined,
      isActive: cleanPayload.isActive !== undefined ? Boolean(cleanPayload.isActive) : undefined
    }
    
    console.log('✅ [ITEM SERVICE DEBUG] Validated update payload:', JSON.stringify(validatedPayload, null, 2))
    
    const response = await httpService.put<Item>(`${API_BASE}/items/${id}`, validatedPayload)
    
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
    
    const response = await httpService.get<Category[]>(`${API_BASE}/categories`)
    
    console.log('📁 [ITEM SERVICE DEBUG] Raw categories response:', JSON.stringify(response.data, null, 2))
    
    // 添加防护检查，确保返回数组
    let categories: Category[] = []
    
    if (Array.isArray(response.data)) {
      categories = response.data
    } else if (response.data && typeof response.data === 'object') {
      // 如果API返回的是对象格式，检查是否有categories字段
      const data = response.data as any
      if (Array.isArray(data.categories)) {
        categories = data.categories
      } else if (Array.isArray(data.items)) {
        categories = data.items
      }
    }
    
    console.log('📁 [ITEM SERVICE DEBUG] Processed categories:', categories.length)
    return categories
  }

  async getCategoryTree(): Promise<Category[]> {
    console.log('🌳 [ITEM SERVICE DEBUG] Getting category tree...')
    
    const response = await httpService.get<Category[]>(`${API_BASE}/categories/tree`)
    
    console.log('🌳 [ITEM SERVICE DEBUG] Category tree:', JSON.stringify(response.data, null, 2))
    return response.data
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

  async getAttributeTypes(): Promise<ItemAttributeType[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting attribute types...')
    
    const response = await httpService.get<ItemAttributeType[]>(`${API_BASE}/attributes/types`)
    
    console.log('🏷️ [ITEM SERVICE DEBUG] Attribute types:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async createAttributeType(payload: CreateItemAttributeTypePayload): Promise<ItemAttributeType> {
    console.log('➕ [ITEM SERVICE DEBUG] Creating attribute type:', JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<ItemAttributeType>(`${API_BASE}/attributes/types`, payload)
    
    console.log('➕ [ITEM SERVICE DEBUG] Created attribute type:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateAttributeType(id: string, payload: UpdateItemAttributeTypePayload): Promise<ItemAttributeType> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating attribute type:', id, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<ItemAttributeType>(`${API_BASE}/attributes/types/${id}`, payload)
    
    console.log('✏️ [ITEM SERVICE DEBUG] Updated attribute type:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteAttributeType(id: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting attribute type:', id)
    
    await httpService.delete(`${API_BASE}/attributes/types/${id}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Attribute type deleted successfully')
  }

  async getAttributeOptions(typeId: string): Promise<ItemAttributeOption[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting attribute options for type:', typeId)
    
    const response = await httpService.get<ItemAttributeOption[]>(`${API_BASE}/attributes/types/${typeId}/options`)
    
    console.log('🏷️ [ITEM SERVICE DEBUG] Attribute options:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async createAttributeOption(typeId: string, payload: CreateItemAttributeOptionPayload): Promise<ItemAttributeOption> {
    console.log('➕ [ITEM SERVICE DEBUG] Creating attribute option:', typeId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<ItemAttributeOption>(`${API_BASE}/attributes/types/${typeId}/options`, payload)
    
    console.log('➕ [ITEM SERVICE DEBUG] Created attribute option:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateAttributeOption(optionId: string, payload: UpdateItemAttributeOptionPayload): Promise<ItemAttributeOption> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating attribute option:', optionId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<ItemAttributeOption>(`${API_BASE}/attributes/options/${optionId}`, payload)
    
    console.log('✏️ [ITEM SERVICE DEBUG] Updated attribute option:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async deleteAttributeOption(optionId: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Deleting attribute option:', optionId)
    
    await httpService.delete(`${API_BASE}/attributes/options/${optionId}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Attribute option deleted successfully')
  }

  // ==================== 商品属性关联管理 ====================

  async getItemAttributes(itemId: string): Promise<ItemAttribute[]> {
    console.log('🏷️ [ITEM SERVICE DEBUG] Getting item attributes for item:', itemId)
    
    const response = await httpService.get<ItemAttribute[]>(`${API_BASE}/items/${itemId}/attributes`)
    
    console.log('🏷️ [ITEM SERVICE DEBUG] Item attributes:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async addItemAttribute(itemId: string, payload: CreateItemAttributePayload): Promise<ItemAttribute> {
    console.log('➕ [ITEM SERVICE DEBUG] Adding item attribute:', itemId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.post<ItemAttribute>(`${API_BASE}/items/${itemId}/attributes`, payload)
    
    console.log('➕ [ITEM SERVICE DEBUG] Added item attribute:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async updateItemAttribute(itemId: string, attributeId: string, payload: UpdateItemAttributePayload): Promise<ItemAttribute> {
    console.log('✏️ [ITEM SERVICE DEBUG] Updating item attribute:', itemId, attributeId, JSON.stringify(payload, null, 2))
    
    const response = await httpService.put<ItemAttribute>(`${API_BASE}/items/${itemId}/attributes/${attributeId}`, payload)
    
    console.log('✏️ [ITEM SERVICE DEBUG] Updated item attribute:', JSON.stringify(response.data, null, 2))
    return response.data
  }

  async removeItemAttribute(itemId: string, attributeId: string): Promise<void> {
    console.log('🗑️ [ITEM SERVICE DEBUG] Removing item attribute:', itemId, attributeId)
    
    await httpService.delete(`${API_BASE}/items/${itemId}/attributes/${attributeId}`)
    
    console.log('🗑️ [ITEM SERVICE DEBUG] Item attribute removed successfully')
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
      basePrice: Number(payload.basePrice),
      discount: payload.discount ? Number(payload.discount) : 0,
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
    
    const validatedPayload = {
      ...payload,
      basePrice: payload.basePrice ? Number(payload.basePrice) : undefined,
      discount: payload.discount !== undefined ? Number(payload.discount) : undefined,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : undefined
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
  removeComboItem
} = itemManagementService
