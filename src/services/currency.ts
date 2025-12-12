import axios from 'axios';

// 货币配置接口 - 匹配后端返回的数据结构
export interface CurrencyConfig {
  code: string;              // 货币代码（如 USD, CNY）
  name: string;              // 货币名称
  symbol: string;            // 货币符号
  decimalPlaces: number;     // 小数位数
  defaultRoundingUnit: number; // 默认取整单位（最小面额）
  denominations: number[];   // 可选的取整单位列表
  defaultRoundingMethod?: string; // 默认取整方式
  description?: string;      // 货币说明
}

// Finance Service API基础URL
const FINANCE_API_BASE = 'http://localhost:3003/api/finance/v1';

// 货币缓存
let cachedCurrencies: CurrencyConfig[] | null = null;

// 获取授权头
const getHeaders = () => {
  let token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('organization_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

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
 * 获取所有支持的货币列表
 * 优先从后端获取，失败时使用缓存或空列表
 */
export const getSupportedCurrencies = async (): Promise<CurrencyConfig[]> => {
  try {
    const response = await axios.get(
      `${FINANCE_API_BASE}/currencies`,
      {
        headers: getHeaders(),
        withCredentials: false,
        timeout: 5000  // 5秒超时
      }
    );
    const data = response.data.data || [];
    if (data.length > 0) {
      cachedCurrencies = data;  // 缓存成功获取的数据
      return data;
    }
    return [];
  } catch (error) {
    console.warn('从后端获取货币列表失败:', error instanceof Error ? error.message : '未知错误');
    // 如果有缓存就返回缓存，否则返回空数组
    return cachedCurrencies || [];
  }
};

/**
 * 获取单个货币的详细配置
 */
export const getCurrencyRoundingRule = async (
  currency: string
): Promise<CurrencyConfig | null> => {
  try {
    const response = await axios.get(
      `${FINANCE_API_BASE}/currencies/${currency}`,
      {
        headers: getHeaders(),
        withCredentials: false
      }
    );
    return response.data.data || null;
  } catch (error) {
    console.error(`获取货币 ${currency} 配置失败:`, error);
    return getDefaultCurrencyByCode(currency);
  }
};

/**
 * 获取默认货币配置（空列表，表示从后端获取）
 * 这是一个占位符，确保与 PaymentSettings 组件的 loadCurrencies 逻辑兼容
 */
export const getDefaultCurrencies = (): CurrencyConfig[] => {
  // 返回空数组，所有货币配置必须从后端获取
  console.info('使用后端货币配置，未找到本地默认值');
  return [];
};

/**
 * 根据货币代码获取默认配置
 */
export const getDefaultCurrencyByCode = (
  currency: string
): CurrencyConfig | null => {
  console.info(`货币 ${currency} 配置应从后端获取`);
  return null;
};
