// 调试组织数据隔离的工具
export const debugOrganizationIsolation = () => {
  console.log('🔍 [ORG DEBUG] ==========================================')
  
  // 检查localStorage中的组织ID
  const organizationId = localStorage.getItem('organization_id')
  console.log('📋 [ORG DEBUG] Organization ID in localStorage:', organizationId)
  
  // 检查环境变量
  const itemManageBase = (import.meta as any)?.env?.VITE_ITEM_MANAGE_BASE
  console.log('🌐 [ORG DEBUG] Item manage base URL:', itemManageBase)
  
  // 检查token
  const accessToken = localStorage.getItem('access_token')
  console.log('🔑 [ORG DEBUG] Access token exists:', !!accessToken)
  
  // 检查所有localStorage项目
  console.log('💾 [ORG DEBUG] All localStorage items:')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      console.log(`  ${key}: ${value}`)
    }
  }
  
  // 检查是否有缓存的菜单数据
  const menuCategories = localStorage.getItem('menuCenter.categories')
  const menuItems = localStorage.getItem('menuCenter.items')
  console.log('🍽️ [ORG DEBUG] Cached menu data:')
  console.log('  Categories:', menuCategories)
  console.log('  Items:', menuItems)
  
  console.log('🔍 [ORG DEBUG] ==========================================')
}

// 检查请求头是否正确设置
export const debugRequestHeaders = (url: string) => {
  console.log('🌐 [REQUEST DEBUG] URL:', url)
  
  const organizationId = localStorage.getItem('organization_id')
  const itemManageBase = (import.meta as any)?.env?.VITE_ITEM_MANAGE_BASE
  
  console.log('📋 [REQUEST DEBUG] Organization ID:', organizationId)
  console.log('🌐 [REQUEST DEBUG] Item manage base:', itemManageBase)
  console.log('🔍 [REQUEST DEBUG] URL starts with base:', url.startsWith(itemManageBase))
  
  if (organizationId && itemManageBase && url.startsWith(itemManageBase)) {
    console.log('✅ [REQUEST DEBUG] Should add headers:', {
      'X-Organization-Id': organizationId,
      'X-Tenant-Id': organizationId
    })
  } else {
    console.log('❌ [REQUEST DEBUG] Will NOT add organization headers')
  }
}
