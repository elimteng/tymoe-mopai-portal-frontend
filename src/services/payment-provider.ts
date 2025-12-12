import axios from 'axios'

export interface PaymentProvider {
  id: string
  tenantId: string
  provider: string
  displayName: string
  description?: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentProviderDTO {
  provider: string
  displayName: string
  description?: string
  config?: Record<string, any>
}

/**
 * 获取租户的所有支付服务提供商
 */
export const getTenantPaymentProviders = async (
  tenantId: string
): Promise<PaymentProvider[]> => {
  const response = await axios.get(
    `/api/finance/v1/payment-providers`,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 获取租户的所有活跃支付服务提供商
 */
export const getActivePaymentProviders = async (
  tenantId: string
): Promise<PaymentProvider[]> => {
  const response = await axios.get(
    `/api/finance/v1/payment-providers/active`,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 获取单个支付服务提供商
 */
export const getPaymentProvider = async (
  tenantId: string,
  provider: string
): Promise<PaymentProvider> => {
  const response = await axios.get(
    `/api/finance/v1/payment-providers/${provider}`,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 创建支付服务提供商
 */
export const createPaymentProvider = async (
  tenantId: string,
  dto: CreatePaymentProviderDTO
): Promise<PaymentProvider> => {
  const response = await axios.post(
    `/api/finance/v1/payment-providers`,
    dto,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 更新支付服务提供商
 */
export const updatePaymentProvider = async (
  tenantId: string,
  provider: string,
  dto: Partial<CreatePaymentProviderDTO>
): Promise<PaymentProvider> => {
  const response = await axios.put(
    `/api/finance/v1/payment-providers/${provider}`,
    dto,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 启用支付服务提供商
 */
export const enablePaymentProvider = async (
  tenantId: string,
  provider: string
): Promise<PaymentProvider> => {
  const response = await axios.post(
    `/api/finance/v1/payment-providers/${provider}/enable`,
    {},
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 禁用支付服务提供商
 */
export const disablePaymentProvider = async (
  tenantId: string,
  provider: string
): Promise<PaymentProvider> => {
  const response = await axios.post(
    `/api/finance/v1/payment-providers/${provider}/disable`,
    {},
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}

/**
 * 删除支付服务提供商
 */
export const deletePaymentProvider = async (
  tenantId: string,
  provider: string
): Promise<PaymentProvider> => {
  const response = await axios.delete(
    `/api/finance/v1/payment-providers/${provider}`,
    {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  )
  return response.data.data
}
