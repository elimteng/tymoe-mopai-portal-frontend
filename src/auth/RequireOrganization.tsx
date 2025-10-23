import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from './AuthProvider'

interface RequireOrganizationProps {
  children: React.ReactNode
}

/**
 * 要求用户必须有组织才能访问的路由保护组件
 * 如果用户没有组织，会重定向到组织管理页面
 */
export const RequireOrganization: React.FC<RequireOrganizationProps> = ({ children }) => {
  const { organizations, loading } = useAuthContext()
  const location = useLocation()

  console.log('🔍 [REQUIRE ORG] Checking organization access:', {
    loading,
    organizationsCount: organizations?.length || 0,
    organizations: organizations?.map(org => ({ id: org.id, name: org.orgName }))
  })

  // 如果还在加载中，显示加载状态
  if (loading) {
    console.log('⏳ [REQUIRE ORG] Still loading, showing loading state')
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>加载中...</div>
      </div>
    )
  }

  // 如果没有组织，重定向到组织管理页面
  if (!organizations || organizations.length === 0) {
    console.log('❌ [REQUIRE ORG] No organizations found, redirecting to /organizations')
    return <Navigate to="/organizations" replace />
  }

  console.log('✅ [REQUIRE ORG] Organizations found, rendering children')
  // 如果有组织，渲染子组件
  return <>{children}</>
}

export default RequireOrganization

