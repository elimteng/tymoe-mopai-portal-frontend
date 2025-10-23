import { httpService } from './http'

const API_BASE = (import.meta.env.VITE_ORDER_API_BASE as string | undefined) ?? '/api/order/v1'

// 多语言文本类型
export interface MultiLangText {
  'zh-CN': string
  'en': string
  'zh-TW': string
}

// 样式信息
export interface ReceiptStyle {
  styleId: string
  name: MultiLangText
  description: MultiLangText
  supportedSizes: number[]  // 支持的纸张尺寸
}

// Logo配置
export interface LogoConfig {
  enabled: boolean
  data?: string  // Base64编码的ESC/POS位图指令
  width?: number
  height?: number
  alignment: 'left' | 'center' | 'right'
}

// 二维码配置
export interface QRCodeConfig {
  enabled: boolean
  urlTemplate?: string  // URL模板，如 "https://example.com/order/{orderId}"
  title?: MultiLangText
  sizeRatio?: number  // 占纸张宽度的比例 (0.5-0.8)
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'  // 纠错级别
  alignment?: 'center'
}

// 显示控制
export interface DisplayConfig {
  logo: boolean  // 显示Logo
  storeInfo: boolean  // 显示地址+电话
  customerName: boolean  // 显示取餐名(KIOSK用)
  itemAttributes: boolean  // 显示商品属性(大杯/中杯)
  itemAddons: boolean  // 显示加料
  itemNotes: boolean  // 显示备注
  priceBreakdown: boolean  // 显示小计/折扣/税费
  qrCode: boolean  // 显示二维码
}

// 小票模板配置类型定义（后端API格式）
export interface ReceiptTemplateConfig {
  language: 'zh-CN' | 'en' | 'zh-TW'
  paperWidth: 58 | 76 | 80
  styleId: 'classic' | 'modern' | 'compact' | 'elegant'
  display: DisplayConfig
  orderFields: Array<'orderType' | 'tableNumber' | 'time' | 'customerPhone'>  // 订单信息字段
  logo?: LogoConfig
  qrCode?: QRCodeConfig
  customMessage?: MultiLangText
  printDensity: 'compact' | 'normal' | 'spacious'  // 打印密度
}

// 小票模板
export interface ReceiptTemplate {
  id: string
  tenantId: string
  name: string | MultiLangText  // 支持字符串或多语言对象
  description?: string | MultiLangText  // 支持字符串或多语言对象
  paperWidth: number
  isDefault: boolean
  isActive: boolean
  version: number
  config: ReceiptTemplateConfig
  orderSource?: string  // 订单来源：POS, KIOSK, WEB
  children?: ReceiptTemplate[]  // 子版本（用于前端分组显示）
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// 创建模板请求（从样式创建）
export interface CreateFromStyleRequest {
  styleId: string
  paperWidth: number
  language: 'zh-CN' | 'en' | 'zh-TW'
}

// 创建小票模板请求（传统方式，保留兼容）
export interface CreateReceiptTemplateRequest {
  name: string
  description?: string
  paperWidth: number
  isDefault?: boolean
  config: ReceiptTemplateConfig
}

// 更新小票模板请求
export interface UpdateReceiptTemplateRequest {
  name?: string
  description?: string
  paperWidth?: number
  isDefault?: boolean
  config?: ReceiptTemplateConfig  // 完整配置
}

// 上传Logo请求
export interface UploadLogoRequest {
  logo: File
  alignment: 'left' | 'center' | 'right'
}

// API响应类型
export interface ReceiptTemplateResponse {
  success: boolean
  data: ReceiptTemplate
}

export interface ReceiptTemplateListResponse {
  success: boolean
  data: ReceiptTemplate[]
}

export interface ReceiptStyleListResponse {
  success: boolean
  data: ReceiptStyle[]
}

export interface ReceiptTemplateVersionCheckResponse {
  success: boolean
  data: {
    id: string
    version: number
    needsUpdate: boolean
    template?: ReceiptTemplate
  }
}

export interface DeleteReceiptTemplateResponse {
  success: boolean
  data: {
    message: string
  }
}

export interface SetDefaultResponse {
  success: boolean
  data: {
    message: string
  }
}

export interface ToggleActiveResponse {
  success: boolean
  data: {
    id: string
    isActive: boolean
  }
}

/**
 * 获取样式列表
 */
export async function getReceiptStyles(): Promise<ReceiptStyleListResponse> {
  const response = await httpService.get<ReceiptStyleListResponse>(
    `${API_BASE}/receipt-templates/styles`
  )
  return response.data
}

/**
 * 从样式创建模板（创建POS、KIOSK、WEB三个版本）
 */
export async function createFromStyle(
  data: CreateFromStyleRequest
): Promise<ReceiptTemplateListResponse> {
  const response = await httpService.post<ReceiptTemplateListResponse>(
    `${API_BASE}/receipt-templates/create-all-sources`,
    data
  )
  return response.data
}

/**
 * 创建小票模板（传统方式，保留兼容）
 */
export async function createReceiptTemplate(
  data: CreateReceiptTemplateRequest
): Promise<ReceiptTemplateResponse> {
  const response = await httpService.post<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates`,
    data
  )
  return response.data
}

/**
 * 获取小票模板列表
 */
export async function getReceiptTemplates(
  isActive?: boolean
): Promise<ReceiptTemplateListResponse> {
  const params = new URLSearchParams()
  if (isActive !== undefined) {
    params.append('isActive', String(isActive))
  }
  
  const queryString = params.toString()
  const url = `${API_BASE}/receipt-templates${queryString ? `?${queryString}` : ''}`
  
  const response = await httpService.get<ReceiptTemplateListResponse>(url)
  return response.data
}

/**
 * 获取默认小票模板
 */
export async function getDefaultReceiptTemplate(): Promise<ReceiptTemplateResponse> {
  const response = await httpService.get<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/default`
  )
  return response.data
}

/**
 * 检查模板版本（POS专用）
 */
export async function checkReceiptTemplateVersion(
  version?: number
): Promise<ReceiptTemplateVersionCheckResponse> {
  const params = new URLSearchParams()
  if (version !== undefined) {
    params.append('version', String(version))
  }
  
  const queryString = params.toString()
  const url = `${API_BASE}/receipt-templates/check-version${queryString ? `?${queryString}` : ''}`
  
  const response = await httpService.get<ReceiptTemplateVersionCheckResponse>(url)
  return response.data
}

/**
 * 获取模板详情
 */
export async function getReceiptTemplateDetail(
  templateId: string
): Promise<ReceiptTemplateResponse> {
  const response = await httpService.get<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/${templateId}`
  )
  return response.data
}

/**
 * 更新小票模板
 */
export async function updateReceiptTemplate(
  templateId: string,
  data: UpdateReceiptTemplateRequest
): Promise<ReceiptTemplateResponse> {
  const response = await httpService.put<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/${templateId}`,
    data
  )
  return response.data
}

/**
 * 删除小票模板
 */
export async function deleteReceiptTemplate(
  templateId: string
): Promise<DeleteReceiptTemplateResponse> {
  const response = await httpService.delete<DeleteReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/${templateId}`
  )
  return response.data
}

/**
 * 设置为默认模板
 */
export async function setDefaultReceiptTemplate(
  templateId: string
): Promise<SetDefaultResponse> {
  const response = await httpService.post<SetDefaultResponse>(
    `${API_BASE}/receipt-templates/${templateId}/set-default`
  )
  return response.data
}

/**
 * 启用/禁用模板
 */
export async function toggleReceiptTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<ToggleActiveResponse> {
  const response = await httpService.post<ToggleActiveResponse>(
    `${API_BASE}/receipt-templates/${templateId}/toggle`,
    { isActive }
  )
  return response.data
}

/**
 * 上传Logo
 */
export async function uploadLogo(
  templateId: string,
  data: FormData
): Promise<ReceiptTemplateResponse> {
  const response = await httpService.post<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/${templateId}/logo`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data
}

/**
 * 根据订单来源获取模板
 */
export async function getTemplateBySource(
  orderSource: 'POS' | 'KIOSK' | 'WEB'
): Promise<ReceiptTemplateResponse> {
  const response = await httpService.get<ReceiptTemplateResponse>(
    `${API_BASE}/receipt-templates/by-source/${orderSource}`
  )
  return response.data
}
