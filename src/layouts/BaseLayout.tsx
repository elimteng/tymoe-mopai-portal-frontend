import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, theme, Select, Space, Dropdown, Avatar, Typography } from 'antd'
import { DashboardOutlined, AppstoreOutlined, UserOutlined, LogoutOutlined, SettingOutlined, ShopOutlined, TeamOutlined, MobileOutlined, PrinterOutlined, StarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../auth/AuthProvider'

const { Header, Sider, Content, Footer } = Layout
const { Text } = Typography

const BaseLayout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { token: { colorBgContainer } } = theme.useToken()
  const { user, logout, organizations } = useAuthContext()
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>(
    localStorage.getItem('organization_id') || ''
  )

  const selectedKeys = [pathname]
  
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
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1890ff',
          fontSize: 20,
          fontWeight: 'bold'
        }}>
          {t('app.title')}
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
            }
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header style={{ 
          background: colorBgContainer, 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          padding: '0 24px'
        }}>
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
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.username || 'User'}</Text>
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
