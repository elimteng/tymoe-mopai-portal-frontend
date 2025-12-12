import axios from 'axios'

// Uber Service API 基础 URL
const API_BASE = import.meta.env.VITE_UBER_API_BASE || 'http://localhost:3004/api/uber/v1'

export interface ModifierItem {
  title: string
  quantity: number
  price: number
}

export interface ModifierGroup {
  title: string
  selectedItems: ModifierItem[]
}

export interface OrderItem {
  id: string
  externalItemId: string
  name: string
  quantity: number
  unitPrice: number
  specialInstructions?: string
  modifiers?: ModifierGroup[] | null
}

export interface Order {
  id: string
  externalOrderId: string
  displayId: string
  totalAmount: number
  currency: string
  consumerName: string
  consumerPhone: string
  specialInstructions?: string
  items: OrderItem[]
  createdAt: string
  status: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

class OrderService {
  /**
   * 获取所有订单列表
   */
  async getAllOrders(merchantId: string, status?: string, limit?: number): Promise<Order[]> {
    try {
      const response = await axios.post<ApiResponse<Order[]>>(
        `${API_BASE}/orders/all`,
        { merchantId, status, limit: limit || 50 },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success && response.data.data) {
        console.log('📋 获取到的所有订单:', response.data.data)
        return response.data.data
      }

      return []
    } catch (error) {
      console.error('❌ 获取所有订单失败:', error)
      throw error
    }
  }

  /**
   * 获取待处理订单列表
   */
  async getPendingOrders(merchantId: string): Promise<Order[]> {
    try {
      const response = await axios.post<ApiResponse<Order[]>>(
        `${API_BASE}/orders/pending`,
        { merchantId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success && response.data.data) {
        console.log('📋 获取到的待处理订单:', response.data.data)
        return response.data.data
      }

      return []
    } catch (error) {
      console.error('❌ 获取待处理订单失败:', error)
      throw error
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const response = await axios.get<ApiResponse<Order>>(
        `${API_BASE}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        }
      )

      if (response.data.success && response.data.data) {
        return response.data.data
      }

      return null
    } catch (error) {
      console.error('❌ 获取订单详情失败:', error)
      throw error
    }
  }

  /**
   * 接受订单
   */
  async acceptOrder(orderId: string): Promise<void> {
    try {
      const response = await axios.post<ApiResponse>(
        `${API_BASE}/orders/${orderId}/accept`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        }
      )

      if (response.data.success) {
        console.log('✅ 订单已接受:', orderId)
      } else {
        throw new Error(response.data.message || '接受订单失败')
      }
    } catch (error) {
      console.error('❌ 接受订单失败:', error)
      throw error
    }
  }

  /**
   * 拒绝订单
   */
  async rejectOrder(orderId: string, reason: string = 'Restaurant rejected'): Promise<void> {
    try {
      const response = await axios.post<ApiResponse>(
        `${API_BASE}/orders/${orderId}/reject`,
        { reason },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        }
      )

      if (response.data.success) {
        console.log('✅ 订单已拒绝:', orderId, reason)
      } else {
        throw new Error(response.data.message || '拒绝订单失败')
      }
    } catch (error) {
      console.error('❌ 拒绝订单失败:', error)
      throw error
    }
  }
}

export const orderService = new OrderService()
