// 测试组织创建API的简化版本
import { httpService } from './http'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'https://tymoe.com/api/auth-service/v1'

/**
 * 测试创建组织 - 最小化请求
 */
export async function testCreateMinimalOrganization(): Promise<any> {
  console.log('🧪 [TEST] Creating minimal organization...')
  
  const minimalPayload = {
    orgName: 'Test Organization',
    orgType: 'MAIN',
    productType: 'beverage'
  }
  
  console.log('🧪 [TEST] Minimal payload:', JSON.stringify(minimalPayload, null, 2))
  
  try {
    const response = await httpService.post(`${API_BASE}/organizations`, minimalPayload, {
      headers: {
        'X-Product-Type': 'beverage',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('🧪 [TEST] Success response:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('🧪 [TEST] Error response:', error)
    throw error
  }
}

/**
 * 测试创建组织 - 带地址信息
 */
export async function testCreateOrganizationWithLocation(): Promise<any> {
  console.log('🧪 [TEST] Creating organization with location...')
  
  const payloadWithLocation = {
    orgName: 'Test Organization with Location',
    orgType: 'MAIN',
    productType: 'beverage',
    location: '123 Test Street, Vancouver, BC, Canada'
  }
  
  console.log('🧪 [TEST] Payload with location:', JSON.stringify(payloadWithLocation, null, 2))
  
  try {
    const response = await httpService.post(`${API_BASE}/organizations`, payloadWithLocation, {
      headers: {
        'X-Product-Type': 'beverage',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('🧪 [TEST] Success response:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('🧪 [TEST] Error response:', error)
    throw error
  }
}

/**
 * 测试创建组织 - 带完整信息
 */
export async function testCreateFullOrganization(): Promise<any> {
  console.log('🧪 [TEST] Creating full organization...')
  
  const fullPayload = {
    orgName: 'Test Full Organization',
    orgType: 'MAIN',
    productType: 'beverage',
    location: '456 Full Street, Vancouver, BC, Canada',
    phone: '+16041234567',
    email: 'test@example.com',
    description: 'This is a test organization'
  }
  
  console.log('🧪 [TEST] Full payload:', JSON.stringify(fullPayload, null, 2))
  
  try {
    const response = await httpService.post(`${API_BASE}/organizations`, fullPayload, {
      headers: {
        'X-Product-Type': 'beverage',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('🧪 [TEST] Success response:', JSON.stringify(response, null, 2))
    return response
  } catch (error) {
    console.error('🧪 [TEST] Error response:', error)
    throw error
  }
}

