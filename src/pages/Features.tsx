import React from 'react'
import { Card, Row, Col, Typography } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

interface FeatureCard {
  key: string
  icon: React.ReactNode
  title: string
  description: string
  path: string
}

const Features: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const features: FeatureCard[] = [
    {
      key: 'recipe-guide',
      icon: <BookOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: t('nav.recipeGuide'),
      description: t('pages.features.recipeGuideDesc'),
      path: '/recipe-guide'
    }
    // 未来可以在这里添加更多特色功能
  ]

  return (
    <div>
      <Title level={2}>{t('pages.features.title')}</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t('pages.features.description')}
      </Paragraph>

      <Row gutter={[16, 16]}>
        {features.map((feature) => (
          <Col xs={24} sm={12} md={8} lg={6} key={feature.key}>
            <Card
              hoverable
              style={{ height: '100%', textAlign: 'center' }}
              onClick={() => navigate(feature.path)}
            >
              <div style={{ marginBottom: 16 }}>{feature.icon}</div>
              <Title level={4}>{feature.title}</Title>
              <Paragraph type="secondary">{feature.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Features
