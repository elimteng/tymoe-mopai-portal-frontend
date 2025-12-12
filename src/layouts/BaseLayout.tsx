import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, theme, Select, Space, Dropdown, Avatar, Typography } from 'antd'
import { DashboardOutlined, AppstoreOutlined, UserOutlined, LogoutOutlined, SettingOutlined, ShopOutlined, TeamOutlined, MobileOutlined, PrinterOutlined, StarOutlined, ShoppingCartOutlined, DollarOutlined, CreditCardOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../auth/AuthProvider'
import uberLogo from '../../uber_eats_logo.svg'

const { Header, Sider, Content, Footer } = Layout
const { Text } = Typography

const BaseLayout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { token: { colorBgContainer } } = theme.useToken()
  const { user, logout, organizations } = useAuthContext()
  const [collapsed, setCollapsed] = React.useState(false)
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>(
    localStorage.getItem('organization_id') || ''
  )

  // 确定菜单选中的key - 支持子路由高亮父菜单
  const getSelectedKeys = () => {
    // 子路由映射到父路由（包括特色功能下的子功能）
    const routeMapping: Record<string, string> = {
      // 订单配置子页面
      '/order-config/channels': '/order-config',
      '/order-config/pricing': '/order-config',
      // 菜单中心子页面
      '/menu-center/categories': '/menu-center',
      '/menu-center/items': '/menu-center',
      // 特色功能下的子功能
      '/recipe-guide': '/features',
      // 集成页面
      '/settings/integrations/uber': '/settings/integrations/uber',
      // Uber 订单页面
      '/uber-orders': '/uber-orders',
      // 支付相关页面
      '/payment-settings': '/payment-settings',
      // 其他功能可在此添加
      // '/feature-module/sub-page': '/feature-module'
    }

    // 如果当前路径在映射中，返回父路由key
    if (routeMapping[pathname]) {
      return [routeMapping[pathname]]
    }

    // 否则返回当前路径
    return [pathname]
  }

  const selectedKeys = getSelectedKeys()
  
  const handleOrganizationChange = (value: string) => {
    setSelectedOrgId(value)
    localStorage.setItem('organization_id', value)
    window.location.reload() // 刷新页面以应用新的组织上下文
  }

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    localStorage.setItem('app.lng', value)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth="80"
        theme="light"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{
          height: 64,
          margin: collapsed ? '16px 0' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: collapsed ? 0 : 8,
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 600,
          letterSpacing: collapsed ? 0 : 1,
          transition: 'all 0.3s',
          padding: collapsed ? '0 8px' : '0 16px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          {collapsed ? 'T' : t('app.title')}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          items={[
            {
              key: '/dashboard',
              icon: <DashboardOutlined />,
              label: <Link to="/dashboard">{t('nav.dashboard')}</Link>,
              onClick: () => navigate('/dashboard')
            },
            {
              key: '/menu-center',
              icon: <AppstoreOutlined />,
              label: <Link to="/menu-center">{t('nav.menuCenter')}</Link>,
              onClick: () => navigate('/menu-center')
            },
            {
              key: '/organizations',
              icon: <ShopOutlined />,
              label: <Link to="/organizations">{t('nav.organizations')}</Link>,
              onClick: () => navigate('/organizations')
            },
            {
              key: '/accounts',
              icon: <TeamOutlined />,
              label: <Link to="/accounts">{t('nav.accounts')}</Link>,
              onClick: () => navigate('/accounts')
            },
            {
              key: '/devices',
              icon: <MobileOutlined />,
              label: <Link to="/devices">{t('nav.devices')}</Link>,
              onClick: () => navigate('/devices')
            },
            {
              key: '/receipt-templates',
              icon: <PrinterOutlined />,
              label: <Link to="/receipt-templates">{t('nav.receiptTemplate')}</Link>,
              onClick: () => navigate('/receipt-templates')
            },
            {
              key: '/order-config',
              icon: <ShoppingCartOutlined />,
              label: <Link to="/order-config">{t('nav.orderConfig')}</Link>,
              onClick: () => navigate('/order-config')
            },
            {
              key: '/tax-management',
              icon: <DollarOutlined />,
              label: <Link to="/tax-management">税务管理</Link>,
              onClick: () => navigate('/tax-management')
            },
            {
              key: '/payment-settings',
              icon: <CreditCardOutlined />,
              label: <Link to="/payment-settings">支付方式设置</Link>,
              onClick: () => navigate('/payment-settings')
            },
            {
              key: '/features',
              icon: <StarOutlined style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '16px',
                filter: 'drop-shadow(0 0 2px rgba(245, 87, 108, 0.3))'
              }} />,
              label: <Link to="/features" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 600,
                filter: 'drop-shadow(0 0 2px rgba(245, 87, 108, 0.3))'
              }}>{t('nav.features')}</Link>,
              onClick: () => navigate('/features')
            },
            {
              key: '/uber-orders',
              icon: <img src={uberLogo} alt="Uber" style={{ width: '2em', height: '1.5em', display: 'inline-block' }} />,
              label: <Link to="/uber-orders">🛵 Uber 订单</Link>,
              onClick: () => navigate('/uber-orders')
            },
            {
              key: '/settings/integrations/uber',
              icon: <SettingOutlined />,
              label: <Link to="/settings/integrations/uber">Uber 集成</Link>,
              onClick: () => navigate('/settings/integrations/uber')
            }
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          background: colorBgContainer, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#000' }}>
            {/* 可以在这里添加面包屑或页面标题 */}
          </div>
          <Space size="large">
            {organizations && organizations.length > 0 && (
              <Select
                value={selectedOrgId}
                onChange={handleOrganizationChange}
                style={{ width: 200 }}
                placeholder={t('organization.selectOrg')}
                options={organizations.map(org => ({
                  value: org.id,
                  label: org.orgName
                }))}
              />
            )}
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{ width: 120 }}
              options={[
                { value: 'zh-CN', label: '简体中文' },
                { value: 'zh-TW', label: '繁體中文' },
                { value: 'en', label: 'English' }
              ]}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserOutlined />}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: 14 }}>{user?.name || 'User'}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user?.email || ''}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: colorBgContainer, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Portal Admin ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  )
}

export default BaseLayout
