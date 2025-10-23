// 地址搜索服务
// 使用 Mapbox Geocoding API 进行地址搜索
// Mapbox 提供每月 100,000 次免费请求额度

export interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: string
  type: string
  importance: number
  // Mapbox 额外字段
  place_name?: string
  context?: Array<{ id: string; text: string }>
  address?: string
  text?: string
}

export interface AddressSearchResponse {
  success: boolean
  suggestions: AddressSuggestion[]
  error?: string
}

// Mapbox API 配置
// 从环境变量获取 API token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

/**
 * 搜索地址建议
 * @param query 搜索关键词
 * @param limit 返回结果数量限制
 * @returns 地址建议列表
 */
export async function searchAddressSuggestions(
  query: string, 
  limit: number = 10
): Promise<AddressSearchResponse> {
  if (!query || query.trim().length < 2) {
    return { success: true, suggestions: [] }
  }

  // 检查是否配置了 Mapbox token
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured. Please add VITE_MAPBOX_TOKEN to your environment variables.')
    return {
      success: false,
      suggestions: [],
      error: 'Mapbox API 未配置，请联系管理员'
    }
  }

  try {
    // 使用 Mapbox Geocoding API 进行地址搜索
    const encodedQuery = encodeURIComponent(query.trim())
    
    // Mapbox API URL
    // proximity=-123.1207,49.2827 设置为温哥华附近，优先显示加拿大BC省的结果
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
      `access_token=${MAPBOX_TOKEN}` +
      `&country=ca,us` + // 限制在加拿大和美国
      `&limit=${Math.min(limit, 10)}` + // Mapbox 最多返回10条
      `&language=en` + // 只返回英文地址
      `&types=address,poi,place,locality,neighborhood` + // 包含地址、POI、地点等
      `&proximity=-123.1207,49.2827` + // 优先温哥华附近的结果
      `&autocomplete=true` // 启用自动补全

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // 转换 Mapbox 格式到统一格式
    const suggestions: AddressSuggestion[] = (data.features || [])
      .map((feature: any) => {
        const [lon, lat] = feature.center
        
        return {
          display_name: feature.place_name,
          lat: lat.toString(),
          lon: lon.toString(),
          place_id: feature.id,
          type: feature.place_type?.[0] || 'unknown',
          importance: feature.relevance || 0,
          // Mapbox 特有字段
          place_name: feature.place_name,
          text: feature.text,
          address: feature.address,
          context: feature.context
        }
      })
      // 按相关性排序（Mapbox 已经排序好了，但我们可以微调）
      .sort((a: AddressSuggestion, b: AddressSuggestion) => {
        // 优先显示 address 和 poi 类型
        const typeScoreA = ['address', 'poi'].includes(a.type) ? 2 : 0
        const typeScoreB = ['address', 'poi'].includes(b.type) ? 2 : 0
        
        const scoreA = typeScoreA + a.importance
        const scoreB = typeScoreB + b.importance
        
        return scoreB - scoreA
      })

    return {
      success: true,
      suggestions
    }
  } catch (error) {
    console.error('Mapbox geocoding error:', error)
    return {
      success: false,
      suggestions: [],
      error: error instanceof Error ? error.message : '地址搜索失败'
    }
  }
}

/**
 * 根据经纬度获取详细地址信息（反向地理编码）
 * @param lat 纬度
 * @param lon 经度
 * @returns 详细地址信息
 */
export async function getAddressByCoordinates(
  lat: string, 
  lon: string
): Promise<AddressSearchResponse> {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured.')
    return {
      success: false,
      suggestions: [],
      error: 'Mapbox API 未配置'
    }
  }

  try {
    // Mapbox 反向地理编码 API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?` +
      `access_token=${MAPBOX_TOKEN}` +
      `&language=en` + // 只返回英文地址
      `&types=address,poi`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lon, lat] = feature.center
      
      return {
        success: true,
        suggestions: [{
          display_name: feature.place_name,
          lat: lat.toString(),
          lon: lon.toString(),
          place_id: feature.id,
          type: feature.place_type?.[0] || 'unknown',
          importance: feature.relevance || 0,
          place_name: feature.place_name,
          text: feature.text,
          address: feature.address
        }]
      }
    }

    return {
      success: true,
      suggestions: []
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      success: false,
      suggestions: [],
      error: error instanceof Error ? error.message : '地址查询失败'
    }
  }
}


