import { httpService, ApiResponse } from './http'

/**
 * 店铺信息接口
 */
export interface StoreInfo {
  id: string
  name: string
  address?: string
  phone?: string
  status?: string
}

export interface StoreInfoResponse extends ApiResponse<StoreInfo> {}

/**
 * 店铺状态接口
 */
export interface StoreStatus {
  status: 'ONLINE' | 'OFFLINE'
  offlineReason?: string
}

export interface StoreStatusResponse extends ApiResponse<StoreStatus> {}

/**
 * 集成状态接口（integration_enabled）
 */
export interface IntegrationStatus {
  integrationEnabled: boolean
  message?: string
}

export interface IntegrationStatusResponse extends ApiResponse<IntegrationStatus> {}

/**
 * 假期时间接口
 */
export interface HolidayHour {
  date: string // YYYY-MM-DD
  hours: Array<{
    start_time: string // HH:mm
    end_time: string // HH:mm
  }>
}

export interface HolidayHoursResponse extends ApiResponse<{
  holidays: HolidayHour[]
  total: number
}> {}

/**
 * 店铺状态管理服务
 */
class UberStoreStatusService {
  // Vite 需要使用 VITE_ 前缀的环境变量
  private baseUrl = (import.meta.env as any).REACT_APP_UBER_SERVICE_URL ||
                    'http://localhost:3004'

  /**
   * 获取店铺信息
   */
  async getStoreInfo(merchantId: string, storeId: string): Promise<StoreInfo> {
    try {
      const response = await httpService.post<StoreInfoResponse>(
        `${this.baseUrl}/api/uber/v1/store/${storeId}`,
        { merchantId }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('未获得店铺信息')
    } catch (error: any) {
      console.error('获取店铺信息失败:', error)
      throw new Error(
        error?.response?.data?.error ||
        error?.message ||
        '获取店铺信息失败'
      )
    }
  }

  /**
   * 获取所有店铺
   */
  async getAllStores(merchantId: string): Promise<StoreInfo[]> {
    try {
      const response = await httpService.post<
        ApiResponse<{
          stores: StoreInfo[]
          total: number
        }>
      >(`${this.baseUrl}/api/uber/v1/stores/list`, { merchantId })

      const responseData = response.data as any

      if (responseData?.data?.stores) {
        return responseData.data.stores
      }

      throw new Error('未获得店铺列表')
    } catch (error: any) {
      console.error('获取所有店铺失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '获取店铺列表失败'
      )
    }
  }

  /**
   * 设置店铺状态
   * @param status - 'ONLINE' 或 'OFFLINE'
   * @param offlineReason - 离线原因（可选），如 'OUT_OF_MENU_HOURS'
   */
  async setStoreStatus(
    merchantId: string,
    storeId: string,
    status: 'ONLINE' | 'OFFLINE',
    offlineReason?: string
  ): Promise<{
    success: boolean
    message: string
    status: string
  }> {
    try {
      const response = await httpService.post<
        ApiResponse<{
          success: boolean
          message: string
          status: string
        }>
      >(`${this.baseUrl}/api/uber/v1/store/status`, {
        merchantId,
        storeId,
        status,
        ...(offlineReason && { offlineReason }),
      })

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('设置店铺状态失败')
    } catch (error: any) {
      console.error('设置店铺状态失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '设置店铺状态失败'
      )
    }
  }

  /**
   * 获取店铺状态
   */
  async getStoreStatus(
    merchantId: string,
    storeId: string
  ): Promise<StoreStatus> {
    try {
      const response = await httpService.post<StoreStatusResponse>(
        `${this.baseUrl}/api/uber/v1/store/status/get`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      if (responseData?.data?.status) {
        return responseData.data
      }

      throw new Error('未获得店铺状态')
    } catch (error: any) {
      console.error('获取店铺状态失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '获取店铺状态失败'
      )
    }
  }

  /**
   * 设置假期时间
   */
  async setHolidayHours(
    merchantId: string,
    storeId: string,
    holidayHours: HolidayHour[]
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await httpService.post<
        ApiResponse<{
          success: boolean
          message: string
        }>
      >(`${this.baseUrl}/api/uber/v1/store/holiday-hours`, {
        merchantId,
        storeId,
        holidayHours,
      })

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('设置假期时间失败')
    } catch (error: any) {
      console.error('设置假期时间失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '设置假期时间失败'
      )
    }
  }

  /**
   * 获取假期时间
   */
  async getHolidayHours(
    merchantId: string,
    storeId: string
  ): Promise<HolidayHour[]> {
    try {
      const response = await httpService.post<HolidayHoursResponse>(
        `${this.baseUrl}/api/uber/v1/store/holiday-hours/get`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      // 处理直接返回数组的情况
      if (Array.isArray(responseData?.data)) {
        return responseData.data
      }

      // 处理返回对象内包含数组的情况
      if (responseData?.data?.holidays) {
        return responseData.data.holidays
      }

      throw new Error('未获得假期时间')
    } catch (error: any) {
      console.error('获取假期时间失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '获取假期时间失败'
      )
    }
  }

  /**
   * 获取店铺详细状态（包括离线原因）
   */
  async getStoreStatusDetailed(
    merchantId: string,
    storeId: string
  ): Promise<{
    status: 'ONLINE' | 'OFFLINE'
    isOfflineUntil?: string
    offlineReason?: string
    offlineReasonMetadata?: string
  }> {
    try {
      const response = await httpService.post(
        `${this.baseUrl}/api/uber/v1/store/status/detailed`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('未获得店铺详细状态')
    } catch (error: any) {
      console.error('获取店铺详细状态失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '获取店铺详细状态失败'
      )
    }
  }

  /**
   * 暂停接单（离线直到指定时间）
   */
  async pauseOrders(
    merchantId: string,
    storeId: string,
    isOfflineUntil: string
  ): Promise<{
    success: boolean
    message: string
    status: 'ONLINE' | 'OFFLINE'
    isOfflineUntil: string
  }> {
    try {
      const response = await httpService.post(
        `${this.baseUrl}/api/uber/v1/store/pause-orders`,
        { merchantId, storeId, isOfflineUntil }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('暂停接单失败')
    } catch (error: any) {
      console.error('暂停接单失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '暂停接单失败'
      )
    }
  }

  /**
   * 恢复接单
   */
  async resumeOrders(
    merchantId: string,
    storeId: string
  ): Promise<{
    success: boolean
    message: string
    status: 'ONLINE' | 'OFFLINE'
  }> {
    try {
      const response = await httpService.post(
        `${this.baseUrl}/api/uber/v1/store/resume-orders`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('恢复接单失败')
    } catch (error: any) {
      console.error('恢复接单失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '恢复接单失败'
      )
    }
  }

  /**
   * 设置忙碌模式（临时增加准备时间）
   */
  async setBusyMode(
    merchantId: string,
    storeId: string,
    delayUntil: string,
    delayDuration: number
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await httpService.post(
        `${this.baseUrl}/api/uber/v1/store/busy-mode`,
        { merchantId, storeId, delayUntil, delayDuration }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('设置忙碌模式失败')
    } catch (error: any) {
      console.error('设置忙碌模式失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '设置忙碌模式失败'
      )
    }
  }

  /**
   * 清除忙碌模式（恢复正常准备时间）
   */
  async clearBusyMode(
    merchantId: string,
    storeId: string,
    defaultPrepTime?: number
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await httpService.post(
        `${this.baseUrl}/api/uber/v1/store/clear-busy-mode`,
        { merchantId, storeId, defaultPrepTime }
      )

      const responseData = response.data as any

      if (responseData?.data) {
        return responseData.data
      }

      throw new Error('清除忙碌模式失败')
    } catch (error: any) {
      console.error('清除忙碌模式失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '清除忙碌模式失败'
      )
    }
  }

  /**
   * 启用集成（开始接收订单 webhook）
   */
  async enableIntegration(
    merchantId: string,
    storeId: string
  ): Promise<IntegrationStatus> {
    try {
      const response = await httpService.post<IntegrationStatusResponse>(
        `${this.baseUrl}/api/uber/v1/integration/enable`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      if (responseData?.data?.success !== undefined || responseData?.data?.integrationEnabled !== undefined) {
        return {
          integrationEnabled: true,
          message: responseData?.data?.message || '集成已启用'
        }
      }

      throw new Error('启用集成失败')
    } catch (error: any) {
      console.error('启用集成失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '启用集成失败'
      )
    }
  }

  /**
   * 禁用集成（停止接收订单 webhook）
   */
  async disableIntegration(
    merchantId: string,
    storeId: string
  ): Promise<IntegrationStatus> {
    try {
      const response = await httpService.post<IntegrationStatusResponse>(
        `${this.baseUrl}/api/uber/v1/integration/disable`,
        { merchantId, storeId }
      )

      const responseData = response.data as any

      if (responseData?.data?.success !== undefined || responseData?.data?.integrationEnabled !== undefined) {
        return {
          integrationEnabled: false,
          message: responseData?.data?.message || '集成已禁用'
        }
      }

      throw new Error('禁用集成失败')
    } catch (error: any) {
      console.error('禁用集成失败:', error)
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        '禁用集成失败'
      )
    }
  }
}

export const uberStoreStatusService = new UberStoreStatusService()
