// 产品类型映射工具
// 用于将前端的产品类型转换为后端Prisma期望的枚举值

export type FrontendProductType = 'beauty' | 'fb' | 'beverage'

/**
 * 将前端产品类型转换为后端枚举值
 * 支持多种可能的枚举格式
 */
export function mapProductTypeToEnum(productType: FrontendProductType): string {
  // 常见的枚举值格式映射
  const enumMappings: Record<FrontendProductType, string[]> = {
    beauty: ['beauty', 'BEAUTY', 'Beauty', 'BEAUTY_SERVICE', 'BeautyService'],
    fb: ['fb', 'FB', 'Fb', 'FRANCHISE_BEAUTY', 'FranchiseBeauty'],
    beverage: ['beverage', 'BEVERAGE', 'Beverage', 'BEVERAGE_SERVICE', 'BeverageService']
  }
  
  // 返回第一个可能的枚举值（按优先级排序）
  return enumMappings[productType][0]
}

/**
 * 尝试多个可能的枚举值
 * 如果第一个失败，可以尝试其他格式
 */
export function getProductTypeAlternatives(productType: FrontendProductType): string[] {
  const enumMappings: Record<FrontendProductType, string[]> = {
    beauty: ['beauty', 'BEAUTY', 'Beauty', 'BEAUTY_SERVICE', 'BeautyService'],
    fb: ['fb', 'FB', 'Fb', 'FRANCHISE_BEAUTY', 'FranchiseBeauty'],
    beverage: ['beverage', 'BEVERAGE', 'Beverage', 'BEVERAGE_SERVICE', 'BeverageService']
  }
  
  return enumMappings[productType]
}

/**
 * 根据错误信息推断正确的枚举值
 */
export function inferProductTypeFromError(error: string, originalType: FrontendProductType): string | null {
  // 如果错误信息包含枚举值提示，尝试解析
  const enumMatch = error.match(/Expected\s+(\w+)/i)
  if (enumMatch) {
    return enumMatch[1]
  }
  
  // 根据常见模式推断
  if (error.includes('ProductType')) {
    // 尝试不同的格式
    const alternatives = getProductTypeAlternatives(originalType)
    return alternatives[1] || alternatives[0] // 尝试第二个选项
  }
  
  return null
}
