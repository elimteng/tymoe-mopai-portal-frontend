import axios from 'axios';

// 支付方式类型
export interface PaymentMethodConfig {
  id?: string;
  tenantId?: string;
  paymentMethod: 'clover' | 'stripe' | 'square' | 'cash' | 'alipay' | 'wechat';
  enabled: boolean;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  config?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Finance Service API基础URL（直接连接到后端，绕过Vite代理）
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

// 获取支付方式列表
export const getPaymentMethods = async (tenantId: string): Promise<PaymentMethodConfig[]> => {
  const response = await axios.get(`${FINANCE_API_BASE}/payment-methods`, {
    headers: getHeaders(),
    withCredentials: false
  });
  return response.data.data || [];
};

// 获取单个支付方式配置
export const getPaymentMethod = async (
  tenantId: string,
  methodId: string
): Promise<PaymentMethodConfig> => {
  const response = await axios.get(`${FINANCE_API_BASE}/payment-methods/${methodId}`, {
    headers: getHeaders(),
    withCredentials: false
  });
  return response.data.data;
};

// 启用支付方式
export const enablePaymentMethod = async (
  tenantId: string,
  paymentMethod: string
): Promise<PaymentMethodConfig> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/payment-methods/${paymentMethod}/enable`,
    {},
    { headers: getHeaders(), withCredentials: false }
  );
  return response.data.data;
};

// 禁用支付方式
export const disablePaymentMethod = async (
  tenantId: string,
  paymentMethod: string
): Promise<PaymentMethodConfig> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/payment-methods/${paymentMethod}/disable`,
    {},
    { headers: getHeaders(), withCredentials: false }
  );
  return response.data.data;
};

// 更新支付方式配置
export const updatePaymentMethod = async (
  tenantId: string,
  paymentMethod: string,
  config: Partial<PaymentMethodConfig>
): Promise<PaymentMethodConfig> => {
  const response = await axios.put(
    `${FINANCE_API_BASE}/payment-methods/${paymentMethod}`,
    config,
    { headers: getHeaders(), withCredentials: false }
  );
  return response.data.data;
};

// 设置默认支付方式
export const setDefaultPaymentMethod = async (
  tenantId: string,
  paymentMethod: string
): Promise<PaymentMethodConfig> => {
  const response = await axios.post(
    `${FINANCE_API_BASE}/payment-methods/${paymentMethod}/set-default`,
    {},
    { headers: getHeaders(), withCredentials: false }
  );
  return response.data.data;
};
