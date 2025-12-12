/**
 * 货币配置文件
 * 管理系统使用的货币符号和格式
 */

/**
 * 货币配置接口
 */
export interface CurrencyConfig {
  symbol: string        // 货币符号（如 $, €, ¥, ₹ 等）
  code: string          // 国际代码（如 USD, EUR, CNY, INR）
  decimalPlaces: number // 小数位数（通常为 2）
  decimalSeparator: string // 小数分隔符（如 . 或 ,）
  thousandsSeparator: string // 千位分隔符（如 , 或 .）
}

/**
 * 默认货币配置
 * 可根据实际系统需要修改
 */
export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  symbol: '$',          // 使用美元符号作为默认通用符号
  code: 'USD',
  decimalPlaces: 2,
  decimalSeparator: '.',
  thousandsSeparator: ','
}

/**
 * 常见货币配置预设
 */
export const CURRENCY_PRESETS: Record<string, CurrencyConfig> = {
  USD: {
    symbol: '$',
    code: 'USD',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.'
  },
  CNY: {
    symbol: '¥',
    code: 'CNY',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  JPY: {
    symbol: '¥',
    code: 'JPY',
    decimalPlaces: 0,    // 日元通常不使用小数
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  INR: {
    symbol: '₹',
    code: 'INR',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ','
  }
}

/**
 * 获取当前系统的货币配置
 * @returns 货币配置对象
 */
export function getCurrencyConfig(): CurrencyConfig {
  // 这里可以从以下来源获取配置：
  // 1. 系统环境变量
  // 2. 本地存储
  // 3. 用户设置
  // 4. 从后端 API 获取

  // 暂时返回默认配置
  // TODO: 实现动态获取货币配置的逻辑
  return DEFAULT_CURRENCY_CONFIG
}

/**
 * 获取当前系统的货币符号
 * @returns 货币符号字符串
 */
export function getCurrencySymbol(): string {
  return getCurrencyConfig().symbol
}

/**
 * 获取当前系统的小数位数
 * @returns 小数位数
 */
export function getDecimalPlaces(): number {
  return getCurrencyConfig().decimalPlaces
}
