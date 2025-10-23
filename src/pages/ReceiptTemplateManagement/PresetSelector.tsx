import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Spin, message, Tag, Select, Space } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ReceiptTemplateConfig } from '@/services/receipt-template'

export interface TemplatePreset {
  id: string
  name: {
    'zh-CN': string
    'en': string
    'zh-TW': string
  }
  description: {
    'zh-CN': string
    'en': string
    'zh-TW': string
  }
  orderSource: 'POS' | 'KIOSK' | 'WEB'
  paperWidth: 58 | 76 | 80
  config: ReceiptTemplateConfig
}

interface PresetSelectorProps {
  onSelect: (preset: TemplatePreset) => void
  selectedPresetId?: string
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect, selectedPresetId }) => {
  const { t, i18n } = useTranslation()
  const [presets, setPresets] = useState<TemplatePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [orderSource, setOrderSource] = useState<'POS' | 'KIOSK' | 'WEB' | 'ALL'>('ALL')
  const [paperWidth, setPaperWidth] = useState<58 | 76 | 80 | 'ALL'>('ALL')

  useEffect(() => {
    fetchPresets()
  }, [orderSource, paperWidth])

  const fetchPresets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (orderSource !== 'ALL') params.append('orderSource', orderSource)
      if (paperWidth !== 'ALL') params.append('paperWidth', paperWidth.toString())
      
      const url = `/api/order/v1/receipt-templates/presets-v2${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setPresets(data.data)
      } else {
        message.error('获取预设模板失败')
      }
    } catch (error) {
      console.error('获取预设模板失败:', error)
      message.error('获取预设模板失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 辅助函数：安全地获取多语言文本
  const getLocalizedText = (text: { 'zh-CN': string; 'en': string; 'zh-TW': string }): string => {
    const lang = i18n.language || 'zh-CN'
    // 尝试精确匹配
    if (lang in text) return text[lang as 'zh-CN' | 'en' | 'zh-TW']
    // 尝试语言前缀匹配（如 zh 匹配 zh-CN）
    if (lang.startsWith('zh')) return text['zh-CN']
    if (lang.startsWith('en')) return text['en']
    // 默认返回中文
    return text['zh-CN']
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载预设模板...</div>
      </div>
    )
  }

  // 订单来源标签映射
  const orderSourceLabels = {
    POS: 'POS点单',
    KIOSK: 'Kiosk自助',
    WEB: 'Web在线'
  }

  // 订单来源颜色映射
  const orderSourceColors = {
    POS: 'blue',
    KIOSK: 'green',
    WEB: 'orange'
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', color: '#666' }}>
        选择一个预设模板作为起点，您可以在后续步骤中自定义配置
      </div>
      
      {/* 筛选器 */}
      <Space style={{ marginBottom: '16px' }}>
        <Select
          value={orderSource}
          onChange={setOrderSource}
          style={{ width: 150 }}
          placeholder="订单来源"
        >
          <Select.Option value="ALL">全部来源</Select.Option>
          <Select.Option value="POS">POS点单</Select.Option>
          <Select.Option value="KIOSK">Kiosk自助</Select.Option>
          <Select.Option value="WEB">Web在线</Select.Option>
        </Select>
        
        <Select
          value={paperWidth}
          onChange={setPaperWidth}
          style={{ width: 150 }}
          placeholder="纸张宽度"
        >
          <Select.Option value="ALL">全部尺寸</Select.Option>
          <Select.Option value={58}>58mm</Select.Option>
          <Select.Option value={76}>3英寸 (76mm)</Select.Option>
          <Select.Option value={80}>80mm</Select.Option>
        </Select>
      </Space>
      
      <Row gutter={[16, 16]}>
        {presets.map((preset) => (
          <Col xs={24} sm={12} md={8} key={preset.id}>
            <Card
              hoverable
              className={selectedPresetId === preset.id ? 'preset-card-selected' : ''}
              style={{
                height: '100%',
                border: selectedPresetId === preset.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                position: 'relative'
              }}
              onClick={() => onSelect(preset)}
            >
              {selectedPresetId === preset.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#1890ff',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckOutlined />
                </div>
              )}
              
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                  {getLocalizedText(preset.name)}
                </h3>
              </div>
              
              <div style={{ marginBottom: '12px', color: '#666', fontSize: '13px' }}>
                {getLocalizedText(preset.description)}
              </div>
              
              <Space>
                <Tag color={orderSourceColors[preset.orderSource]}>
                  {orderSourceLabels[preset.orderSource]}
                </Tag>
                <Tag color={preset.paperWidth === 80 ? 'blue' : preset.paperWidth === 76 ? 'cyan' : 'green'}>
                  {preset.paperWidth}mm
                </Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default PresetSelector
