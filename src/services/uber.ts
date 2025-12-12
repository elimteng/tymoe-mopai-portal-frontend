import { httpService, ApiResponse } from './http'

/**
 * Uber 集成服务接口定义
 */
export interface UberAuthorizationData {
  authorizationUrl: string
  state: string
}

export interface UberAuthorizationResponse extends ApiResponse<UberAuthorizationData> {}

export interface UberIntegrationStatus {
  isConnected: boolean
  storeName?: string
  uberMerchantId?: string
  connectedAt?: string
  lastUsedAt?: string
}

export interface UberStatusResponse extends ApiResponse<UberIntegrationStatus> {}

export interface UberDisconnectResponse extends ApiResponse {
  message?: string
}

/**
 * 店铺信息接口
 */
export interface UberStore {
  id: string
  name: string
  email?: string
  address?: string
  cuisines?: string[]
}

export interface UberStoresResponse extends ApiResponse<{
  stores: UberStore[]
  total: number
}> {}

/**
 * 店铺激活接口
 */
export interface UberStoreActivationResponse extends ApiResponse<{
  success: boolean
  message: string
  storeId: string
  storeName: string
}> {}

/**
 * 已激活店铺接口
 */
export interface UberActivatedStore {
  integrationId: string
  storeId: string
  storeName: string
  storeEmail?: string
  storeAddress?: string
  cuisines?: string[]
}

export interface UberActivatedStoreResponse extends ApiResponse<UberActivatedStore> {}

/**
 * 店铺解绑接口
 */
export interface UberUnbindResponse extends ApiResponse<{
  success: boolean
  message: string
}> {}

/**
 * 菜单分类接口（简化版）
 */
export interface MenuCategory {
  id: string
  integrationId: string
  name: string
  displayOrder: number
  itemCount: number
  createdAt?: string
  updatedAt?: string
}

export interface MenuCategoryItem {
  id: string
  categoryId: string
  posItemId: string
  posItemName?: string
  displayOrder: number
}

/**
 * Uber 集成 API 服务
 * 处理与 Uber OAuth 认证相关的所有操作
 */
class UberService {
  private baseUrl = import.meta.env.REACT_APP_UBER_SERVICE_URL || 'http://localhost:3004'

  /**
   * 获取后端服务地址
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * 生成 Uber 授权 URL
   * 返回授权 URL，用户需要访问此 URL 进行授权
   */
  async generateAuthorizationUrl(merchantId: string): Promise<string> {
    try {
      const response = await httpService.post<UberAuthorizationResponse>(
        `${this.baseUrl}/api/uber/v1/auth/authorize`,
        { merchantId }
      )

      // 检查响应结构
      const responseData = response.data as any

      if (responseData?.data?.authorizationUrl) {
        return responseData.data.authorizationUrl
      }

      throw new Error('未获得授权 URL')
    } catch (error: any) {
      console.error('生成授权 URL 失败:', error)
      throw new Error(
        error?.response?.data?.error ||
        error?.message ||
        '生成授权 URL 失败'
      )
    }
  }

  /**
   * 获取集成状态
   * 检查是否已连接 Uber，以及连接的详细信息
   */
  async getIntegrationStatus(merchantId: string): Promise<UberIntegrationStatus> {
    try {
      const response = await httpService.post<UberStatusResponse>(
        `${this.baseUrl}/api/uber/v1/auth/status`,
        { merchantId }
      )

      const responseData = response.data as any
      console.log('✓ 获取集成状态成功:', { responseData, merchantId })

      if (responseData?.data !== undefined) {
        const status = responseData.data as UberIntegrationStatus
        console.log('✓ 返回集成状态:', status)
        return status
      }

      // 如果 data 字段不存在，默认返回未连接状态
      console.warn('⚠️ 响应中缺少 data 字段，返回未连接状态')
      return { isConnected: false }
    } catch (error: any) {
      console.error('❌ 获取集成状态失败:', {
        error: error?.message,
        response: error?.response?.data,
        merchantId
      })
      // 不再抛出错误，而是返回未连接状态（优雅降级）
      return { isConnected: false }
    }
  }

  /**
   * 断开 Uber 连接
   * 撤销之前的授权
   */
  async disconnect(merchantId: string): Promise<void> {
    try {
      const response = await httpService.post<UberDisconnectResponse>(
        `${this.baseUrl}/api/uber/v1/auth/disconnect`,
        { merchantId }
      )

      const responseData = response.data as any

      if (!responseData?.success) {
        throw new Error('断开连接失败')
      }
    } catch (error: any) {
      console.error('断开连接失败:', error)
      throw new Error(
        error?.response?.data?.error ||
        error?.message ||
        '断开连接失败'
      )
    }
  }

  /**
   * 获取可用的店铺列表
   * 调用 Uber API 发现该用户的所有店铺
   */
  async discoverStores(merchantId: string): Promise<UberStore[]> {
    try {
      const response = await httpService.post<UberStoresResponse>(
        `${this.baseUrl}/api/uber/v1/stores`,
        { merchantId }
      )

      const responseData = response.data as any

      if (responseData?.data?.stores) {
        return responseData.data.stores
      }

      console.warn('⚠️  未获得店铺列表，返回空数组')
      return []
    } catch (error: any) {
      console.error('❌ 店铺发现失败:', error)
      // 优雅降级：返回空数组，而不是抛出错误
      return []
    }
  }

  /**
   * 选择并激活店铺
   */
  async selectAndActivateStore(
    merchantId: string,
    storeId: string,
    storeName: string,
    storeData?: UberStore
  ): Promise<{ storeId: string; storeName: string }> {
    try {
      const response = await httpService.post<UberStoreActivationResponse>(
        `${this.baseUrl}/api/uber/v1/stores/activate`,
        {
          merchantId,
          storeId,
          storeName,
          email: storeData?.email,
          address: storeData?.address,
          cuisines: storeData?.cuisines,
        }
      )

      const responseData = response.data as any

      if (responseData?.success && responseData?.data?.storeId) {
        return {
          storeId: responseData.data.storeId,
          storeName: responseData.data.storeName
        }
      }

      throw new Error('店铺激活失败')
    } catch (error: any) {
      console.error('店铺激活失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '店铺激活失败'
      )
    }
  }

  /**
   * 获取已激活的店铺
   */
  async getActivatedStore(merchantId: string): Promise<UberActivatedStore | null> {
    try {
      const response = await httpService.post<UberActivatedStoreResponse>(
        `${this.baseUrl}/api/uber/v1/stores/activated`,
        { merchantId }
      )

      const responseData = response.data as any

      if (responseData?.data?.storeId) {
        return responseData.data
      }

      return null
    } catch (error: any) {
      // 404 或 NO_STORE_ACTIVATED 表示没有激活的店铺，这不是错误状态，直接返回 null
      const errorMessage = error?.message || ''
      const errorCode = error?.response?.data?.error || ''

      if (error?.response?.status === 404 ||
          error?.status === 404 ||
          errorMessage.includes('资源不存在') ||
          errorMessage.includes('NO_STORE_ACTIVATED') ||
          errorCode.includes('NO_STORE_ACTIVATED')) {
        console.log('ℹ️  该商家还未激活任何店铺')
        return null
      }

      console.error('❌ 获取已激活店铺失败:', error)
      // 不再抛出错误，优雅降级：返回 null 表示没有已激活的店铺
      return null
    }
  }

  /**
   * 解绑店铺
   */
  async unbindStore(merchantId: string): Promise<void> {
    try {
      const response = await httpService.post<UberUnbindResponse>(
        `${this.baseUrl}/api/uber/v1/stores/unbind`,
        { merchantId }
      )

      const responseData = response.data as any

      if (!responseData?.success) {
        throw new Error('解绑店铺失败')
      }
    } catch (error: any) {
      console.error('解绑店铺失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '解绑店铺失败'
      )
    }
  }

  // ==================== 菜单分类管理 API ====================

  /**
   * 获取所有菜单分类
   */
  async getMenuCategories(integrationId: string): Promise<MenuCategory[]> {
    try {
      const response = await httpService.get<ApiResponse<MenuCategory[]>>(
        `${this.baseUrl}/api/uber/v1/menu/categories?integrationId=${integrationId}`
      )

      const responseData = response.data as any
      return responseData?.data || []
    } catch (error: any) {
      console.error('获取菜单分类失败:', error)
      throw new Error(
        error?.response?.data?.error ||
        error?.message ||
        '获取菜单分类失败'
      )
    }
  }

  /**
   * 创建菜单分类
   */
  async createMenuCategory(
    integrationId: string,
    name: string,
    displayOrder?: number,
    posSystemCategoryId?: string
  ): Promise<MenuCategory> {
    try {
      const response = await httpService.post<ApiResponse<MenuCategory>>(
        `${this.baseUrl}/api/uber/v1/menu/categories`,
        { integrationId, name, displayOrder, posSystemCategoryId }
      )

      const responseData = response.data as any
      return responseData?.data
    } catch (error: any) {
      console.error('创建菜单分类失败:', error)
      throw new Error(
        error?.response?.data?.error ||
        error?.message ||
        '创建菜单分类失败'
      )
    }
  }

  /**
   * 更新菜单分类
   */
  async updateMenuCategory(
    categoryId: string,
    name?: string,
    displayOrder?: number
  ): Promise<MenuCategory> {
    try {
      const response = await httpService.put<ApiResponse<MenuCategory>>(
        `${this.baseUrl}/api/uber/v1/menu/categories/${categoryId}`,
        { name, displayOrder }
      )

      const responseData = response.data as any
      return responseData?.data
    } catch (error: any) {
      console.error('更新菜单分类失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '更新失败')
    }
  }

  /**
   * 删除菜单分类
   */
  async deleteMenuCategory(categoryId: string): Promise<void> {
    try {
      await httpService.delete(
        `${this.baseUrl}/api/uber/v1/menu/categories/${categoryId}`
      )
    } catch (error: any) {
      console.error('删除菜单分类失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '删除失败')
    }
  }

  /**
   * 获取分类中的商品
   */
  async getMenuCategoryItems(categoryId: string): Promise<MenuCategoryItem[]> {
    try {
      const response = await httpService.get<ApiResponse<MenuCategoryItem[]>>(
        `${this.baseUrl}/api/uber/v1/menu/categories/${categoryId}/items`
      )

      const responseData = response.data as any
      return responseData?.data || []
    } catch (error: any) {
      console.error('获取分类商品失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '获取失败')
    }
  }

  /**
   * 添加商品到分类
   */
  async addItemToMenuCategory(
    categoryId: string,
    posItemId: string,
    posItemName?: string,
    displayOrder?: number
  ): Promise<MenuCategoryItem> {
    try {
      const response = await httpService.post<ApiResponse<MenuCategoryItem>>(
        `${this.baseUrl}/api/uber/v1/menu/categories/${categoryId}/items`,
        { posItemId, posItemName, displayOrder }
      )

      const responseData = response.data as any
      return responseData?.data
    } catch (error: any) {
      console.error('添加商品失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '添加失败')
    }
  }

  /**
   * 从分类中移除商品
   */
  async removeItemFromMenuCategory(itemId: string): Promise<void> {
    try {
      await httpService.delete(
        `${this.baseUrl}/api/uber/v1/menu/categories/items/${itemId}`
      )
    } catch (error: any) {
      console.error('移除商品失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '移除失败')
    }
  }

  /**
   * 更新商品显示顺序
   */
  async updateMenuCategoryItemDisplayOrder(itemId: string, displayOrder: number): Promise<void> {
    try {
      await httpService.put(
        `${this.baseUrl}/api/uber/v1/menu/categories/items/${itemId}/display-order`,
        { displayOrder }
      )
    } catch (error: any) {
      console.error('更新显示顺序失败:', error)
      throw new Error(error?.response?.data?.error || error?.message || '更新失败')
    }
  }
}

export const uberService = new UberService()
