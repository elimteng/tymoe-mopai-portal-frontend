import React, { useState, useEffect } from 'react'
import { Card, Tabs, Select, Space, Typography, message, Spin, Collapse } from 'antd'
import { BookOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import RecipeManagementByModifiers from './RecipeManagementByModifiers'
import StepTypeManagement from './StepTypeManagement'
import { getItems, type Item } from '@/services/item-management'

const { Title, Text } = Typography

const RecipeGuide: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('recipesByModifier')
  const [items, setItems] = useState<Item[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>()
  const [loading, setLoading] = useState(false)

  // 加载商品列表
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const orgId = localStorage.getItem('organization_id')
      if (!orgId) {
        message.warning(t('organization.selectOrg'))
        return
      }
      const response = await getItems({ limit: 1000 })
      setItems(response.data)
    } catch (error: any) {
      message.error(error.message || t('pages.recipeGuide.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'recipesByModifier',
      label: (
        <span>
          <BookOutlined />
          {t('pages.recipeGuide.recipeManagement')}
        </span>
      ),
      children: <RecipeManagementByModifiers itemId={selectedItemId} />
    },
    {
      key: 'stepTypes',
      label: (
        <span>
          <SettingOutlined />
          {t('pages.recipeGuide.stepTypeManagement')}
        </span>
      ),
      children: <StepTypeManagement />
    }
  ]

  return (
    <div>
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>
              {t('pages.recipeGuide.title')}
            </Title>
            <Text type="secondary">{t('pages.recipeGuide.description')}</Text>
          </Space>
        }
        extra={
          activeTab === 'recipesByModifier' && (
            <Space>
              <Text>{t('pages.recipeGuide.selectItem')}:</Text>
              <Select
                style={{ width: 250 }}
                placeholder={t('pages.recipeGuide.selectItemPlaceholder')}
                value={selectedItemId}
                onChange={setSelectedItemId}
                loading={loading}
                allowClear
                showSearch
                optionFilterProp="label"
                options={items.map(item => ({
                  label: item.name,
                  value: item.id
                }))}
              />
            </Space>
          )
        }
      >
        <Collapse
          ghost
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'guide',
              label: (
                <Space>
                  <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{t('pages.recipeGuide.guideTitle')}</Text>
                </Space>
              ),
              children: (
                <div style={{ paddingLeft: 24 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">{t('pages.recipeGuide.guideIntro')}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>📋 {t('pages.recipeGuide.guideStep1Title')}</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>{t('pages.recipeGuide.guideStep1Desc')}</Text>
                      <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 13 }}>
                        <li><Text type="secondary">{t('pages.recipeGuide.guideStep1Example1')}</Text></li>
                        <li><Text type="secondary">{t('pages.recipeGuide.guideStep1Example2')}</Text></li>
                        <li><Text type="secondary">{t('pages.recipeGuide.guideStep1Example3')}</Text></li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>📝 {t('pages.recipeGuide.guideStep2Title')}</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>{t('pages.recipeGuide.guideStep2Desc')}</Text>
                      <div style={{ marginTop: 4, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
                        <Text code style={{ fontSize: 12 }}>{t('pages.recipeGuide.guideStep2Example')}</Text>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
                    <Text type="warning" style={{ fontSize: 13 }}>💡 {t('pages.recipeGuide.guideTip')}</Text>
                  </div>
                </div>
              )
            }
          ]}
        />
        <Spin spinning={loading && items.length === 0}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default RecipeGuide
