import { httpService } from './http'

const API_BASE = (import.meta.env.VITE_ORDER_API_BASE as string | undefined) ?? '/api/order/v1'

// 订单渠道类型
export type OrderSourceType = 'POS' | 'ONLINE' | 'DELIVERY' | 'SELF_SERVICE' | 'CUSTOM'

// 订单渠道配置
export interface OrderSource {
  id: string
  tenantId: string
  sourceType: string
  sourceName: string
  description?: string
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// 创建订单渠道请求
export interface CreateOrderSourceRequest {
  channelType: string
  channelName: string
  description?: string
  isActive?: boolean
  displayOrder?: number
}

// 更新订单渠道请求
export interface UpdateOrderSourceRequest {
  channelName?: string
  description?: string
  isActive?: boolean
  displayOrder?: number
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface ListResponse<T> {
  success: boolean
  message: string
  data: {
    items: T[]
    total: number
    page?: number
    pageSize?: number
  }
}

// 获取订单渠道列表
export async function getOrderSources(): Promise<OrderSource[]> {
  try {
    const response = await httpService.get<any>(
      `${API_BASE}/order-sources`
    )
    // httpService 返回的 data 实际上是完整的 API 响应 { success, data: [...] }
    // 需要提取内层的 data 字段
    const apiResponse = response.data
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data
    }
    // 如果直接返回数组（某些情况下）
    if (Array.isArray(apiResponse)) {
      return apiResponse
    }
    return []
  } catch (error) {
    console.error('Failed to fetch order channels:', error)
    throw error
  }
}

// 初始化默认订单渠道
export async function initializeDefaultOrderSources(): Promise<OrderSource[]> {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/order-sources/init-defaults`,
      {}
    )
    const apiResponse = response.data
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data
    }
    if (Array.isArray(apiResponse)) {
      return apiResponse
    }
    return []
  } catch (error) {
    console.error('Failed to initialize default order channels:', error)
    throw error
  }
}

// 创建订单渠道
export async function createOrderSource(request: CreateOrderSourceRequest): Promise<OrderSource> {
  try {
    const response = await httpService.post<any>(
      `${API_BASE}/order-sources`,
      request
    )
    const apiResponse = response.data
    if (apiResponse && apiResponse.data) {
      return apiResponse.data as OrderSource
    }
    return apiResponse as OrderSource
  } catch (error) {
    console.error('Failed to create order channel:', error)
    throw error
  }
}

// 更新订单渠道
export async function updateOrderSource(id: string, request: UpdateOrderSourceRequest): Promise<OrderSource> {
  try {
    const response = await httpService.put<any>(
      `${API_BASE}/order-sources/${id}`,
      request
    )
    const apiResponse = response.data
    if (apiResponse && apiResponse.data) {
      return apiResponse.data as OrderSource
    }
    return apiResponse as OrderSource
  } catch (error) {
    console.error('Failed to update order channel:', error)
    throw error
  }
}

// 删除订单渠道
export async function deleteOrderSource(id: string): Promise<void> {
  try {
    await httpService.delete(
      `${API_BASE}/order-sources/${id}`
    )
  } catch (error) {
    console.error('Failed to delete order channel:', error)
    throw error
  }
}
