import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, message, Spin, Tag } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { httpService } from '@/services/http'

interface Style {
  styleId: string
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
  supportedSizes: number[]
  previewConfig?: {
    header?: {
      separator?: { enabled?: boolean; char?: string; spacing?: number }
      storeName?: { fontSize?: string; spacing?: number }
    }
    body?: {
      orderNumber?: { fontSize?: string; spacing?: number }
      items?: { spacing?: number }
    }
    footer?: {
      qrcode?: { size?: number; spacing?: number }
      summary?: { fontSize?: string; spacing?: number }
    }
    style?: {
      lineSpacing?: number
    }
  }
}

interface StyleSelectorProps {
  onComplete: () => void
  onStyleSelected: (styleId: string, paperWidth: number) => void
}

// 字体大小映射
const fontSizeMap: Record<string, string> = {
  'small': '9px',
  'medium': '11px',
  'large': '13px',
  'xlarge': '16px',
  'xxlarge': '20px'
}

// 根据样式配置渲染预览的组件
const StylePreviewWithConfig: React.FC<{
  style: Style
  paperWidth: number
  language: string
}> = ({ style, paperWidth, language }) => {
  const config = style.previewConfig || {}
  const lang = language as 'zh-CN' | 'en' | 'zh-TW'
  
  // 获取多语言文本
  const getText = (text: { 'zh-CN': string; 'en': string; 'zh-TW': string }): string => {
    return text[lang] || text['zh-CN'] || ''
  }
  
  // 获取字体大小
  const getFontSize = (size?: string): string => {
    return fontSizeMap[size || 'medium'] || '11px'
  }
  
  // 获取间距
  const getSpacing = (spacing?: number): string => {
    return `${(spacing || 1) * 6}px`
  }
  
  // 获取分隔符重复次数
  const getSeparatorRepeat = (char: string): number => {
    const baseRepeat = paperWidth === 80 ? 48 : 32
    // 根据字符宽度调整重复次数
    switch (char) {
      case '=':
        return baseRepeat
      case '-':
        return Math.floor(baseRepeat * 0.8) // 破折号较宽，减少20%
      case '─':
      case '━':
        return Math.floor(baseRepeat * 0.6) // Unicode线条更宽，减少40%
      case '·':
      case '•':
        return Math.floor(baseRepeat * 0.5) // 点号需要更少
      default:
        return baseRepeat
    }
  }

  const actualWidth = Math.round(paperWidth * 3.78)
  const lineSpacing = config.style?.lineSpacing || 1.4

  return (
    <div style={{
      width: `${actualWidth}px`,
      backgroundColor: '#fff',
      padding: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: lineSpacing,
      border: '1px dashed #d9d9d9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* 店铺名称 */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: getFontSize(config.header?.storeName?.fontSize),
        marginBottom: getSpacing(config.header?.storeName?.spacing)
      }}>
        {getText(style.name)}
      </div>
      
      {/* 店铺信息 */}
      <div style={{ textAlign: 'center', fontSize: '9px', color: '#666', marginBottom: '6px' }}>
        📍 123 Main Street, Vancouver
      </div>
      
      {/* 分隔符 */}
      {config.header?.separator?.enabled !== false && (
        <div style={{ 
          margin: `${getSpacing(config.header?.separator?.spacing)} 0`,
          fontSize: '10px',
          lineHeight: '1.0'
        }}>
          {(config.header?.separator?.char || '=').repeat(getSeparatorRepeat(config.header?.separator?.char || '='))}
        </div>
      )}
      
      {/* 订单号 */}
      <div style={{ 
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: getFontSize(config.body?.orderNumber?.fontSize),
        marginTop: getSpacing(config.body?.orderNumber?.spacing),
        marginBottom: getSpacing(config.body?.orderNumber?.spacing)
      }}>
        订单号 #12345
      </div>
      
      {/* 订单信息 */}
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>
        <div>订单类型: 堂食</div>
        <div>下单时间: {new Date().toLocaleString('zh-CN')}</div>
      </div>
      
      {/* 商品明细 */}
      <div style={{ marginTop: getSpacing(config.body?.items?.spacing) }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '3px' }}>
          商品明细
        </div>
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>美式咖啡 x2</span>
            <span>¥50.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>拿铁 x1</span>
            <span>¥32.00</span>
          </div>
        </div>
      </div>
      
      {/* 分隔符 */}
      {config.header?.separator?.enabled !== false && (
        <div style={{ 
          margin: '6px 0', 
          fontSize: '10px',
          lineHeight: '1.0'
        }}>
          {(config.header?.separator?.char || '=').repeat(getSeparatorRepeat(config.header?.separator?.char || '='))}
        </div>
      )}
      
      {/* 价格汇总 */}
      <div style={{ 
        fontSize: getFontSize(config.footer?.summary?.fontSize),
        marginTop: getSpacing(config.footer?.summary?.spacing)
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>小计</span>
          <span>¥82.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>合计</span>
          <span>¥82.00</span>
        </div>
      </div>
      
      {/* 二维码 */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: getSpacing(config.footer?.qrcode?.spacing || 2)
      }}>
        <div style={{ 
          display: 'inline-block',
          width: `${(config.footer?.qrcode?.size || 120) / 6}px`,
          height: `${(config.footer?.qrcode?.size || 120) / 6}px`,
          border: '1px solid #d9d9d9',
          backgroundColor: '#f5f5f5',
          lineHeight: `${(config.footer?.qrcode?.size || 120) / 6}px`,
          fontSize: '8px'
        }}>
          QR
        </div>
      </div>
      
      {/* 感谢语 */}
      <div style={{ textAlign: 'center', fontSize: '9px', color: '#999', marginTop: '6px' }}>
        感谢惠顾，欢迎再次光临！
      </div>
    </div>
  )
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ onComplete, onStyleSelected }) => {
  const { i18n } = useTranslation()
  const [styles, setStyles] = useState<Style[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [paperWidth, setPaperWidth] = useState<number>(80)
  const [loading, setLoading] = useState(false)

  // 辅助函数：获取多语言文本
  const getLocalizedText = (text: { 'zh-CN': string; 'en': string; 'zh-TW': string }): string => {
    const lang = i18n.language || 'zh-CN'
    if (lang in text) return text[lang as 'zh-CN' | 'en' | 'zh-TW']
    if (lang.startsWith('zh')) return text['zh-CN']
    if (lang.startsWith('en')) return text['en']
    return text['zh-CN']
  }

  // 获取样式列表
  useEffect(() => {
    const fetchStyles = async () => {
      setLoading(true)
      try {
        const response = await httpService.get<{ success: boolean; data: Style[] }>(
          '/api/order/v1/receipt-templates/styles'
        )
        
        if (response.data.success) {
          setStyles(response.data.data)
          // 默认选择第一个样式
          if (response.data.data.length > 0) {
            setSelectedStyle(response.data.data[0].styleId)
          }
        } else {
          message.error('获取样式列表失败')
        }
      } catch (error) {
        console.error('获取样式列表失败:', error)
        message.error('获取样式列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchStyles()
  }, [])

  // 进入配置页面
  const handleNext = () => {
    if (!selectedStyle) {
      message.warning('请选择样式')
      return
    }

    // 调用回调，传递选中的样式和纸张宽度
    onStyleSelected(selectedStyle, paperWidth)
  }

  const selectedStyleObj = styles.find(s => s.styleId === selectedStyle)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载样式列表...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '8px' }}>选择小票样式</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          选择一个样式创建主模板，后续可以为不同订单来源自定义配置
        </p>
      </div>

      {/* 样式选择和预览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* 左侧：样式选择 */}
        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            {styles.map((style) => (
              <Col xs={24} sm={12} key={style.styleId}>
                <Card
                  hoverable
                  className={selectedStyle === style.styleId ? 'style-card-selected' : ''}
                  style={{
                    height: '100%',
                    border: selectedStyle === style.styleId ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedStyle(style.styleId)}
                >
                  {selectedStyle === style.styleId && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}
                    >
                      <CheckOutlined />
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      {getLocalizedText(style.name)}
                    </h4>
                  </div>
                  
                  <div style={{ marginBottom: '12px', color: '#666', fontSize: '13px', minHeight: '40px' }}>
                    {getLocalizedText(style.description)}
                  </div>
                  
                  <div>
                    <Tag color="blue">
                      支持: {style.supportedSizes.join('mm, ')}mm
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* 右侧：样式预览 */}
        <Col xs={24} lg={12}>
          {selectedStyleObj && (
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '24px', 
              borderRadius: '8px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflowY: 'auto',
              maxHeight: '600px'
            }}>
              <h4 style={{ marginBottom: '16px', color: '#666' }}>样式预览</h4>
              {selectedStyleObj.previewConfig ? (
                // 使用后端返回的样式配置渲染预览
                <StylePreviewWithConfig 
                  key={`${selectedStyle}-${paperWidth}`}
                  style={selectedStyleObj}
                  paperWidth={paperWidth}
                  language={i18n.language}
                />
              ) : (
                // 如果后端没有返回配置，显示简化预览
                <div style={{
                  width: `${Math.round(paperWidth * 3.78)}px`,
                  backgroundColor: '#fff',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  border: '1px dashed #d9d9d9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                    {getLocalizedText(selectedStyleObj.name)}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '9px', color: '#666', marginBottom: '6px' }}>
                    📍 123 Main Street, Vancouver
                  </div>
                  <div style={{ margin: '6px 0', fontSize: '10px' }}>
                    {'='.repeat(paperWidth === 80 ? 48 : 32)}
                  </div>
                  <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                    <div>订单号: #12345</div>
                    <div>时间: {new Date().toLocaleString('zh-CN')}</div>
                  </div>
                  <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>美式咖啡 x2</span>
                      <span>¥50.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>拿铁 x1</span>
                      <span>¥32.00</span>
                    </div>
                  </div>
                  <div style={{ margin: '6px 0', fontSize: '10px' }}>
                    {'='.repeat(paperWidth === 80 ? 48 : 32)}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>合计</span>
                    <span>¥82.00</span>
                  </div>
                  <div style={{ textAlign: 'center', margin: '10px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '18px',
                      height: '18px',
                      border: '1px solid #d9d9d9',
                      backgroundColor: '#f5f5f5',
                      lineHeight: '18px',
                      fontSize: '8px'
                    }}>
                      QR
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '9px', color: '#999' }}>
                    感谢惠顾，欢迎再次光临！
                  </div>
                </div>
              )}
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                纸张宽度: {paperWidth}mm
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* 纸张尺寸选择 */}
      {selectedStyleObj && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>选择纸张尺寸</h4>
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedStyleObj.supportedSizes.map(size => (
              <Button
                key={size}
                type={paperWidth === size ? 'primary' : 'default'}
                size="large"
                onClick={() => setPaperWidth(size)}
                style={{ minWidth: '100px' }}
              >
                {size}mm
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 下一步按钮 */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          onClick={handleNext}
          disabled={!selectedStyle}
          style={{ minWidth: '200px' }}
        >
          下一步：配置模板
        </Button>
      </div>

      <style>{`
        .style-card-selected {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

export default StyleSelector
