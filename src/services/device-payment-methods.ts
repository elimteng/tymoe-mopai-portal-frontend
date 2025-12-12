import axios from 'axios';

// 支付方式配置类型
export interface PaymentMethodConfigDTO {
  paymentMethod: 'clover' | 'stripe' | 'square' | 'cash' | 'alipay' | 'wechat';
  displayName: string;
  isEnabled: boolean;
  posProvider?: string; // clover | square
  posDeviceId?: string; // POS机设备ID
  posConfig?: Record<string, any>;
  // 全局支付配置（适用于所有支付方式）
  currency?: string; // 收款货币代码（如 USD, EUR, CNY）
  currencySymbol?: string; // 货币符号（如 $, €, ¥）
  roundingUnit?: number; // 取整单位
  roundingRule?: 'round' | 'ceil' | 'floor'; // 舍入规则
}

export interface PaymentMethodConfigResponse extends PaymentMethodConfigDTO {
  id: string;
  tenantId: string;
  deviceId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceWithPaymentMethods {
  id: string;
  tenantId: string;
  deviceType: string;
  deviceName: string;
  deviceIdentifier: string;
  locationId?: string;
  locationName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  paymentMethods: PaymentMethodConfigResponse[];
}

// Finance Service API基础URL
const FINANCE_API_BASE = 'http://localhost:3003/api/finance/v1';

// 获取授权头
const getHeaders = () => {
  let token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('organization_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // 如果没有token，使用开发环境下的测试token
  if (!token) {
    token = 'test-token';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }
  return headers;
};

/**
 * 获取租户所有设备及其支付方式配置
 */
export const getTenantDevicesWithPaymentMethods = async (
  tenantId: string
): Promise<DeviceWithPaymentMethods[]> => {
  const response = await axios.get(`${FINANCE_API_BASE}/payment-methods`, {
    headers: getHeaders(),
    withCredentials: false
  });
  return response.data.data || [];
};

/**
 * 获取特定设备的支付方式配置
 */
export const getDevicePaymentMethods = async (
  tenantId: string,
  deviceId: string
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.get(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods`,
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};

/**
 * 为设备创建支付方式配置
 */
export const createDevicePaymentMethod = async (
  tenantId: string,
  deviceId: string,
  config: PaymentMethodConfigDTO
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods`,
    config,
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};

/**
 * 更新设备的支付方式配置
 */
export const updateDevicePaymentMethod = async (
  tenantId: string,
  deviceId: string,
  paymentMethod: string,
  config: Partial<PaymentMethodConfigDTO>
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.put(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods/${paymentMethod}`,
    config,
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};

/**
 * 启用设备的支付方式
 */
export const enableDevicePaymentMethod = async (
  tenantId: string,
  deviceId: string,
  paymentMethod: string
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods/${paymentMethod}/enable`,
    {},
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};

/**
 * 禁用设备的支付方式
 */
export const disableDevicePaymentMethod = async (
  tenantId: string,
  deviceId: string,
  paymentMethod: string
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods/${paymentMethod}/disable`,
    {},
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};

/**
 * 删除设备的支付方式配置
 */
export const deleteDevicePaymentMethod = async (
  tenantId: string,
  deviceId: string,
  paymentMethod: string
): Promise<PaymentMethodConfigResponse[]> => {
  const response = await axios.delete(
    `${FINANCE_API_BASE}/devices/${deviceId}/payment-methods/${paymentMethod}`,
    {
      headers: getHeaders(),
      withCredentials: false
    }
  );
  return response.data.data || [];
};
