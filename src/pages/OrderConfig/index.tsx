import React from 'react'
import { Card, Row, Col, Typography } from 'antd'
import { ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

interface OrderConfigModule {
  key: string
  icon: React.ReactNode
  title: string
  description: string
  path: string
}

const OrderConfig: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const modules: OrderConfigModule[] = [
    {
      key: 'channel-management',
      icon: <ShoppingCartOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: t('pages.orderConfig.channelManagementTitle'),
      description: t('pages.orderConfig.channelManagementDesc'),
      path: '/order-config/channels'
    },
    {
      key: 'pricing-management',
      icon: <DollarOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      title: t('pages.orderConfig.pricingManagementTitle'),
      description: t('pages.orderConfig.pricingManagementDesc'),
      path: '/order-config/pricing'
    }
    // 未来可以在这里添加更多订单配置模块
  ]

  return (
    <div>
      <Title level={2}>{t('nav.orderConfig')}</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t('pages.orderConfig.description')}
      </Paragraph>

      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} md={8} lg={6} key={module.key}>
            <Card
              hoverable
              style={{ height: '100%', textAlign: 'center' }}
              onClick={() => navigate(module.path)}
            >
              <div style={{ marginBottom: 16 }}>{module.icon}</div>
              <Title level={4}>{module.title}</Title>
              <Paragraph type="secondary">{module.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default OrderConfig
