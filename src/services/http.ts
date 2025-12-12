import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
  error?: string
  detail?: string
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
}

class HttpService {
  private api: AxiosInstance
  private isRefreshing = false

  constructor() {
    this.api = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 注入组织上下文（若存在）
        try {
          const organizationId = localStorage.getItem('organization_id')
          
          if (organizationId) {
            // 检查是否需要添加组织ID的请求
            // 包括：商品管理、菜单中心、订单服务、财务服务等业务API
            const needsOrgContext = typeof config.url === 'string' && (
              config.url.includes('/api/item-manage') ||
              config.url.includes('/api/menu-service') ||
              config.url.includes('/api/order') ||
              config.url.includes('/api/finance') ||
              config.url.includes('/menu-center')
            )

            // 排除不需要组织上下文的请求（认证、注册等）
            const isAuthRequest = typeof config.url === 'string' && (
              config.url.includes('/identity/register') ||
              config.url.includes('/identity/login') ||
              config.url.includes('/identity/refresh') ||
              config.url.includes('/auth-service/v1/oauth') ||
              config.url.includes('/auth-service/v1/identity')
            )

            if (needsOrgContext && !isAuthRequest) {
              config.headers['X-Organization-Id'] = organizationId
              config.headers['X-Tenant-Id'] = organizationId
              // 对于Finance API，使用小写的 x-tenant-id
              if (config.url.includes('/api/finance')) {
                config.headers['x-tenant-id'] = organizationId
              }
            }
          }
        } catch (error) {
          console.error('Error injecting organization context:', error)
        }
        
        // 对于注册和登录请求，强制清除所有认证相关的头部和配置
        if (config.url?.includes('/identity/register') || config.url?.includes('/identity/login')) {
          // 删除所有可能的认证头部
          delete config.headers.Cookie
          delete config.headers.cookie
          delete config.headers.Authorization
          delete config.headers.authorization
          // 禁用凭证传递
          config.withCredentials = false
          // 重新设置干净的头部
          config.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...config.headers
          }
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // 响应拦截器
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 只有认证相关的API返回401时才登出
          // 业务API的401可能是权限问题，不应该强制登出
          const isAuthRequest = error.config?.url?.includes('/auth-service') || 
                                error.config?.url?.includes('/oauth') ||
                                error.config?.url?.includes('/identity')
          
          if (isAuthRequest && !this.isRefreshing) {
            this.isRefreshing = true
            
            // 清除所有认证信息
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('organization_id')
            
            // 延迟跳转，避免多个401同时触发
            setTimeout(() => {
              this.isRefreshing = false
              window.location.href = '/login'
            }, 100)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  async get<T = unknown>(url: string): Promise<HttpResponse<T>> {
    try {
      const response = await this.api.get<T>(url)
      return { data: response.data, status: response.status }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T = unknown>(url: string, data?: unknown, config?: any): Promise<HttpResponse<T>> {
    try {
      const response = await this.api.post<T>(url, data, config)
      return { data: response.data, status: response.status }
    } catch (error) {
      // 特殊处理：如果是400但响应中包含数据，可能是后端返回了成功数据但状态码错误
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const responseData = error.response.data
        console.warn('⚠️ 收到400响应但可能包含有效数据:', responseData)
        
        // 如果响应中有 success=true 或包含 id 字段，说明实际是成功的
        if (responseData && typeof responseData === 'object') {
          if ((responseData as any).success === true || (responseData as any).id) {
            console.log('✅ 400响应但数据有效，视为成功')
            return { data: responseData as T, status: 200 }
          }
        }
      }
      throw this.handleError(error)
    }
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    try {
      const response = await this.api.put<T>(url, data)
      return { data: response.data, status: response.status }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    try {
      const response = await this.api.patch<T>(url, data)
      return { data: response.data, status: response.status }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T = unknown>(url: string): Promise<HttpResponse<T>> {
    try {
      const response = await this.api.delete<T>(url)
      return { data: response.data, status: response.status }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiResponse
      
      // 打印详细错误信息用于调试
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url,
        method: error.config?.method
      })
      
      // 对于注册请求的 500 错误，额外记录
      if (error.config?.url?.includes('/identity/register') && error.response?.status === 500) {
        console.error('🚨 Registration 500 Error - Server Response:', {
          responseData: error.response?.data,
          responseText: typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data),
          requestPayload: error.config?.data
        })
      }
      
      // 对于组织创建请求的 500 错误，额外记录
      if (error.config?.url?.includes('/organizations') && error.response?.status === 500) {
        console.error('🚨 Organization Creation 500 Error - Server Response:', {
          responseData: error.response?.data,
          responseText: typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data),
          requestPayload: error.config?.data,
          requestHeaders: error.config?.headers
        })
      }
      
      // 对于设备API请求的 500 错误，额外记录
      if (error.config?.url?.includes('/devices') && error.response?.status === 500) {
        console.error('🚨 Device API 500 Error - Server Response:', {
          responseData: error.response?.data,
          responseText: typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data),
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          requestParams: error.config?.params,
          requestHeaders: error.config?.headers
        })
        
        // 为设备API提供更友好的错误信息
        return new Error('加载设备列表失败，后端服务出现异常。请检查后端日志或联系技术支持。')
      }
      
      if (apiError?.error || apiError?.detail) {
        // 对于通用的 server_error，提供更友好的提示
        if (apiError.error === 'server_error' && !apiError.detail) {
          return new Error('服务器内部错误，请稍后重试或联系技术支持')
        }
        return new Error(apiError.detail || apiError.error || 'Request failed')
      }
      
      // 根据状态码提供更友好的错误信息
      if (error.response?.status === 500) {
        return new Error('服务器内部错误，请稍后重试')
      } else if (error.response?.status === 400) {
        // 对于400错误，尝试提供更详细的错误信息
        const responseData = error.response?.data
        if (responseData && typeof responseData === 'object') {
          const errorMsg = (responseData as any).message || (responseData as any).detail || (responseData as any).error
          if (errorMsg) {
            return new Error(errorMsg)
          }
        }
        return new Error('请求参数错误，请检查输入数据')
      } else if (error.response?.status === 401) {
        return new Error('未授权访问')
      } else if (error.response?.status === 403) {
        return new Error('访问被拒绝')
      } else if (error.response?.status === 404) {
        return new Error('请求的资源不存在')
      }
      
      return new Error(error.message || 'Network error')
    }
    return new Error('Unknown error occurred')
  }
}

export const httpService = new HttpService()

// 兼容性导出
export const httpGet = httpService.get.bind(httpService)
export const httpPost = httpService.post.bind(httpService)
export const httpPut = httpService.put.bind(httpService)
export const httpPatch = httpService.patch.bind(httpService)
export const httpDelete = httpService.delete.bind(httpService)
