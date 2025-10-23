import { httpService } from './http'
import { mapProductTypeToEnum } from './productTypeMapper'

export interface LoginPayload {
  email: string
  password: string
  captcha?: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
  phone?: string
}

export interface AuthUser {
  id?: string  // 用户ID可能不存在于profile响应中
  email: string
  name: string
  phone?: string
  emailVerified?: boolean  // 新的API使用boolean而不是timestamp
  emailVerifiedAt?: string  // 保留向后兼容
  createdAt?: string
  updatedAt?: string
  organizations?: Organization[]
}

export interface Organization {
  id: string
  orgName: string
  orgType: 'MAIN' | 'BRANCH' | 'FRANCHISE'
  productType: 'beauty' | 'fb'
  parentOrgId?: string
  parentOrgName?: string
  description?: string
  location?: string
  phone?: string
  email?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationPayload {
  orgName: string
  orgType: 'MAIN' | 'BRANCH' | 'FRANCHISE'
  parentOrgId?: string | null
  description?: string
  location?: string
  phone?: string
  email?: string
  productType?: 'beauty' | 'fb' | 'beverage'
}

export interface CreateOrganizationResponse {
  success: boolean
  message: string
  data: Organization
}

export interface GetOrganizationsResponse {
  success: boolean
  data: Organization[]
  total: number
}

export interface GetOrganizationsParams {
  orgType?: 'MAIN' | 'BRANCH' | 'FRANCHISE'
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
}

export interface LoginResponse {
  success: boolean
  user: AuthUser
  organizations: Organization[]
}

export interface CaptchaStatus {
  captcha_required: boolean
  captcha_site_key?: string
  threshold: number
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

export interface UserTokenRequest {
  grant_type: 'password'
  username: string
  password: string
  client_id: string
}

export interface AccountTokenRequest {
  grant_type: 'password'
  username: string
  password: string
  client_id: string
}

export interface AccountPOSTokenRequest {
  grant_type: 'password'
  pin_code: string
  client_id: string
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'https://tymoe.com/api/auth-service/v1'
const AUTH_BASE = (import.meta.env.VITE_AUTH_BASE as string | undefined) ?? 'https://tymoe.com'

// 身份管理 API
export async function login(payload: LoginPayload, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<LoginResponse> {
  console.log('🔑 [AUTH DEBUG] Login request payload:', JSON.stringify(payload, null, 2))
  
  const response = await httpService.post<LoginResponse>(`${API_BASE}/identity/login`, payload, {
    headers: {
      'X-Product-Type': productType
    }
  })
  
  console.log('🔑 [AUTH DEBUG] Login response - Full response object:', JSON.stringify(response, null, 2))
  console.log('🔑 [AUTH DEBUG] Login response - Response data:', JSON.stringify(response.data, null, 2))
  console.log('🔑 [AUTH DEBUG] Login response - User info:', JSON.stringify(response.data.user, null, 2))
  console.log('🔑 [AUTH DEBUG] Login response - Organizations:', JSON.stringify(response.data.organizations, null, 2))
  
  return response.data
}

export interface RegisterResponse {
  success: boolean
  message: string
  data: {
    email: string
  }
}

export async function register(payload: RegisterPayload, productType: 'beauty' | 'fb' = 'beauty'): Promise<RegisterResponse> {
  console.log('📝 [AUTH DEBUG] Register request payload:', JSON.stringify(payload, null, 2))
  
  const response = await httpService.post<RegisterResponse>(`${API_BASE}/identity/register`, payload, {
    headers: {
      'X-Product-Type': productType
    }
  })
  
  console.log('📝 [AUTH DEBUG] Register response - Full response object:', JSON.stringify(response, null, 2))
  console.log('📝 [AUTH DEBUG] Register response - Response data:', JSON.stringify(response.data, null, 2))
  
  return response.data
}

export interface EmailVerificationResponse {
  success: boolean
  message: string
  data: {
    email: string
    emailVerified: boolean
  }
}

export async function verifyEmail(email: string, code: string): Promise<EmailVerificationResponse> {
  const response = await httpService.post<EmailVerificationResponse>(`${API_BASE}/identity/verification`, { 
    email, 
    code 
  })
  return response.data
}

export interface ResendCodeResponse {
  success: boolean
  message: string
  data: {
    email: string
    expiresIn: number
  }
}

export async function resendVerificationCode(email: string, purpose: 'signup' | 'password_reset' | 'email_change' = 'signup'): Promise<ResendCodeResponse> {
  const response = await httpService.post<ResendCodeResponse>(`${API_BASE}/identity/resend`, {
    email,
    purpose
  })
  return response.data
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export async function logout(refreshToken: string): Promise<LogoutResponse> {
  try {
    const response = await httpService.post<LogoutResponse>(`${API_BASE}/identity/logout`, {
      refresh_token: refreshToken
    })
    return response.data
  } finally {
    // 清除本地存储的 token
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export interface ProfileResponse {
  success: boolean
  data: AuthUser
}

export async function getProfile(): Promise<AuthUser | null> {
  try {
    console.log('👤 [AUTH DEBUG] Getting user profile...')
    const response = await httpService.get<ProfileResponse>(`${API_BASE}/identity/profile`)
    
    console.log('👤 [AUTH DEBUG] Profile response - Full response object:', JSON.stringify(response, null, 2))
    console.log('👤 [AUTH DEBUG] Profile response - User data:', JSON.stringify(response.data.data, null, 2))
    
    return response.data.data
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Failed to get profile:', error)
    return null
  }
}

// 注意：getCompleteProfile函数已移除，现在应该分别调用getProfile()和getOrganizations()
// 这样可以更好地处理用户信息和组织信息的获取，符合新的API设计

export interface UpdateProfileResponse {
  success: boolean
  message: string
  data: AuthUser
}

export async function updateProfile(data: Partial<Pick<AuthUser, 'name'>> & { phone?: string }): Promise<AuthUser> {
  const response = await httpService.patch<UpdateProfileResponse>(`${API_BASE}/identity/profile`, data)
  return response.data.data
}

export async function getCaptchaStatus(email: string): Promise<CaptchaStatus> {
  const response = await httpService.get<CaptchaStatus>(`${API_BASE}/identity/captcha-status?email=${encodeURIComponent(email)}`)
  return response.data
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await httpService.post<ForgotPasswordResponse>(`${API_BASE}/identity/forgot-password`, { email })
  return response.data
}

export async function resetPassword(email: string, code: string, password: string): Promise<ResetPasswordResponse> {
  const response = await httpService.post<ResetPasswordResponse>(`${API_BASE}/identity/reset-password`, {
    email,
    code,
    password
  })
  return response.data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
  const response = await httpService.post<ChangePasswordResponse>(`${API_BASE}/identity/change-password`, {
    currentPassword,
    newPassword
  })
  return response.data
}

// 修改邮箱相关API
export interface ChangeEmailResponse {
  success: boolean
  message: string
  data: {
    newEmail: string
    expiresIn?: number
  }
}

export interface VerifyEmailChangeResponse {
  success: boolean
  message: string
  data: {
    newEmail: string
  }
}

export async function changeEmail(newEmail: string, password: string): Promise<ChangeEmailResponse> {
  const response = await httpService.post<ChangeEmailResponse>(`${API_BASE}/identity/change-email`, {
    newEmail,
    password
  })
  return response.data
}

export async function verifyEmailChange(code: string): Promise<VerifyEmailChangeResponse> {
  const response = await httpService.post<VerifyEmailChangeResponse>(`${API_BASE}/identity/verification-email-change`, {
    code
  })
  return response.data
}

// OAuth2 Token 获取
export async function getOAuthToken(
  request: UserTokenRequest | AccountTokenRequest | AccountPOSTokenRequest,
  productType: 'beauty' | 'fb' | 'beverage' = 'beauty',
  deviceId?: string
): Promise<TokenResponse> {
  console.log('🎫 [AUTH DEBUG] OAuth token request:', {
    grant_type: request.grant_type,
    client_id: request.client_id,
    productType,
    deviceId: deviceId ? '***存在***' : '❌缺失'
  })
  
  const params = new URLSearchParams({
    grant_type: request.grant_type,
    client_id: request.client_id
  })

  // 根据请求类型添加不同参数
  if ('username' in request && 'password' in request) {
    params.append('username', request.username)
    params.append('password', request.password)
  } else if ('pin_code' in request) {
    params.append('pin_code', request.pin_code)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Product-Type': productType
  }

  if (deviceId) {
    headers['X-Device-ID'] = deviceId
  }

  const tokenUrl = `${AUTH_BASE}/oauth/token`
  console.log('🎫 [AUTH DEBUG] OAuth token URL:', tokenUrl)
  const response = await httpService.post<TokenResponse>(tokenUrl, params.toString(), { headers })
  
  console.log('🎫 [AUTH DEBUG] OAuth token response - Full response object:', JSON.stringify(response, null, 2))
  console.log('🎫 [AUTH DEBUG] OAuth token response - Token data:', JSON.stringify(response.data, null, 2))
  console.log('🎫 [AUTH DEBUG] OAuth token response - Token summary:', {
    access_token: response.data.access_token ? '***存在***' : '❌缺失',
    refresh_token: response.data.refresh_token ? '***存在***' : '❌缺失',
    token_type: response.data.token_type,
    expires_in: response.data.expires_in
  })
  
  return response.data
}

// 刷新Token
export interface RefreshTokenRequest {
  grant_type: 'refresh_token'
  refresh_token: string
  client_id: string
}

export async function refreshOAuthToken(request: RefreshTokenRequest, productType: 'beauty' | 'fb' = 'beauty'): Promise<TokenResponse> {
  console.log('🔄 [AUTH DEBUG] Refresh token request:', {
    grant_type: request.grant_type,
    client_id: request.client_id,
    productType
  })
  
  const params = new URLSearchParams({
    grant_type: request.grant_type,
    refresh_token: request.refresh_token,
    client_id: request.client_id
  })

  const tokenUrl = `${AUTH_BASE}/oauth/token`
  console.log('🔄 [AUTH DEBUG] Refresh token URL:', tokenUrl)
  const response = await httpService.post<TokenResponse>(tokenUrl, params.toString(), {
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Product-Type': productType
    }
  })
  
  console.log('🔄 [AUTH DEBUG] Refresh token response - Full response object:', JSON.stringify(response, null, 2))
  console.log('🔄 [AUTH DEBUG] Refresh token response - Token data:', JSON.stringify(response.data, null, 2))
  
  return response.data
}

export async function revokeToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'refresh_token'): Promise<void> {
  const revokeUrl = AUTH_BASE ? `${AUTH_BASE}/oauth/revoke` : '/oauth/revoke'
  await httpService.post(revokeUrl, {
    token,
    token_type_hint: tokenTypeHint
  })
}

export async function getUserInfo(): Promise<AuthUser> {
  console.log('👥 [AUTH DEBUG] Getting user info from OAuth userinfo endpoint...')
  const userinfoUrl = AUTH_BASE ? `${AUTH_BASE}/userinfo` : '/userinfo'
  const response = await httpService.get<AuthUser>(userinfoUrl)
  
  console.log('👥 [AUTH DEBUG] UserInfo response - Full response object:', JSON.stringify(response, null, 2))
  console.log('👥 [AUTH DEBUG] UserInfo response - User data:', JSON.stringify(response.data, null, 2))
  
  return response.data
}

// 组织管理 API
export async function getOrganizations(params?: GetOrganizationsParams, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<Organization[]> {
  console.log('🏢 [AUTH DEBUG] Getting organizations...', params)
  
  const queryParams = new URLSearchParams()
  if (params?.orgType) queryParams.append('orgType', params.orgType)
  if (params?.status) queryParams.append('status', params.status)
  
  const url = `${API_BASE}/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await httpService.get<GetOrganizationsResponse>(url, {
    headers: {
      'X-Product-Type': productType
    }
  })
  
  console.log('🏢 [AUTH DEBUG] Organizations response - Full response object:', JSON.stringify(response, null, 2))
  console.log('🏢 [AUTH DEBUG] Organizations response - Organizations data:', JSON.stringify(response.data.data, null, 2))
  
  return response.data.data
}

export async function createOrganization(payload: CreateOrganizationPayload, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<Organization> {
  console.log('🏢 [AUTH DEBUG] Creating organization...', payload)
  console.log('🏢 [AUTH DEBUG] Product type:', productType)
  
  // 将产品类型转换为Prisma期望的枚举值
  const prismaProductType = mapProductTypeToEnum(productType)
  
  console.log('🏢 [AUTH DEBUG] Converted product type:', prismaProductType)
  
  // 根据API文档创建请求载荷
  const requestPayload: any = {
    orgName: payload.orgName,
    orgType: payload.orgType,
    productType: prismaProductType  // 使用转换后的枚举值
  }
  
  // 根据API文档：parentOrgId 的处理规则
  if (payload.orgType === 'MAIN') {
    // MAIN 类型必须为 null
    requestPayload.parentOrgId = null
  } else if (payload.parentOrgId !== undefined && payload.parentOrgId !== null) {
    // BRANCH/FRANCHISE 类型必须提供有效的 parentOrgId
    requestPayload.parentOrgId = payload.parentOrgId
  }
  
  // 添加可选字段（如果存在且非空）
  if (payload.description && payload.description.trim()) {
    requestPayload.description = payload.description.trim()
  }
  if (payload.location && payload.location.trim()) {
    requestPayload.location = payload.location.trim()
  }
  if (payload.phone && payload.phone.trim()) {
    requestPayload.phone = payload.phone.trim()
  }
  if (payload.email && payload.email.trim()) {
    requestPayload.email = payload.email.trim()
  }
  
  console.log('🏢 [AUTH DEBUG] Final request payload:', JSON.stringify(requestPayload, null, 2))
  
  const response = await httpService.post<CreateOrganizationResponse>(`${API_BASE}/organizations`, requestPayload, {
    headers: {
      'X-Product-Type': productType,
      'Content-Type': 'application/json'
      // Authorization 头部会由 httpService 自动添加
    }
  })
  
  console.log('🏢 [AUTH DEBUG] Create organization response - Full response object:', JSON.stringify(response, null, 2))
  console.log('🏢 [AUTH DEBUG] Create organization response - Organization data:', JSON.stringify(response.data.data, null, 2))
  
  return response.data.data
}

// 更新用户档案信息并保持组织信息同步
export async function updateProfileWithOrganizations(data: Partial<Pick<AuthUser, 'name'>> & { phone?: string }): Promise<AuthUser> {
  console.log('🔄 [AUTH DEBUG] Updating profile...')
  const response = await httpService.patch<UpdateProfileResponse>(`${API_BASE}/identity/profile`, data)
  
  console.log('🔄 [AUTH DEBUG] Profile updated successfully:', JSON.stringify(response.data.data, null, 2))
  return response.data.data
}

export async function getOrganization(id: string, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<Organization> {
  const response = await httpService.get<{ success: boolean; data: Organization }>(`${API_BASE}/organizations/${id}`, {
    headers: {
      'X-Product-Type': productType
    }
  })
  return response.data.data
}

export async function updateOrganization(id: string, data: Partial<Omit<Organization, 'id' | 'orgType' | 'productType' | 'userId' | 'createdAt' | 'updatedAt'>>, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<Organization> {
  const response = await httpService.put<CreateOrganizationResponse>(`${API_BASE}/organizations/${id}`, data, {
    headers: {
      'X-Product-Type': productType
    }
  })
  return response.data.data
}

export async function deleteOrganization(id: string, productType: 'beauty' | 'fb' | 'beverage' = 'beauty'): Promise<void> {
  await httpService.delete(`${API_BASE}/organizations/${id}`, {
    headers: {
      'X-Product-Type': productType
    }
  })
}
