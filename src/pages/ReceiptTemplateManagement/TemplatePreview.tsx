import React from 'react'
import { Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ReceiptTemplate, MultiLangText } from '@/services/receipt-template'

interface TemplatePreviewProps {
  template: ReceiptTemplate
}

// 辅助函数：获取多语言文本
const getLocalizedText = (text: string | MultiLangText | undefined, language: string): string => {
  if (!text) return ''
  if (typeof text === 'string') return text
  const lang = language as 'zh-CN' | 'en' | 'zh-TW'
  return text[lang] || text['zh-CN'] || ''
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template }) => {
  const { t, i18n } = useTranslation()
  
  // 确保config存在
  if (!template || !template.config) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>⚠️ 模板配置数据缺失</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          后端返回的模板数据中缺少 config 字段。<br/>
          请检查后端 GET /api/order/v1/receipt-templates 接口，<br/>
          确保返回数据包含完整的 config 字段。
        </p>
      </div>
    )
  }
  
  const { config } = template
  
  // 检测配置类型：新的简化配置 vs 旧的详细配置
  const isSimpleConfig = 'display' in config && 'styleId' in config
  
  // 模拟订单数据
  const mockOrder = {
    orderNumber: t('pages.receiptTemplate.mockOrderNumber'),
    orderType: t('pages.receiptTemplate.mockOrderType'),
    orderSource: t('pages.receiptTemplate.mockOrderSource'),
    tableNumber: t('pages.receiptTemplate.mockTableNumber'),
    createdAt: new Date().toLocaleString('zh-CN'),
    items: [
      {
        name: t('pages.receiptTemplate.mockItemCoffee'),
        quantity: 2,
        price: 25.0,
        attributes: [
          { name: t('pages.receiptTemplate.mockAttrTemperature'), value: t('pages.receiptTemplate.mockAttrHot') },
          { name: t('pages.receiptTemplate.mockAttrSugar'), value: t('pages.receiptTemplate.mockAttrLessSugar') }
        ],
        addons: [{ name: t('pages.receiptTemplate.mockAddonMilk'), price: 3.0 }]
      },
      {
        name: t('pages.receiptTemplate.mockItemLatte'),
        quantity: 1,
        price: 32.0,
        attributes: [{ name: t('pages.receiptTemplate.mockAttrTemperature'), value: t('pages.receiptTemplate.mockAttrCold') }],
        addons: []
      }
    ],
    subtotal: 85.0,
    discount: 5.0,
    tax: 0,
    total: 80.0
  }

  // 真实的小票尺寸：1mm ≈ 3.78px (96 DPI)
  // 80mm ≈ 302px, 58mm ≈ 219px
  const actualWidth = Math.round(template.paperWidth * 3.78)
  
  const receiptStyle: React.CSSProperties = {
    width: `${actualWidth}px`,
    margin: '0 auto',
    padding: '8px',
    backgroundColor: '#fff',
    fontFamily: 'monospace',
    fontSize: '11px',
    lineHeight: config.style?.lineSpacing || 1.4,
    border: '1px dashed #d9d9d9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }

  const boldStyle: React.CSSProperties = {
    fontWeight: 'bold'
  }

  return (
    <div style={receiptStyle}>
      {/* 头部 */}
      {config.header.storeName.enabled && (
        <div style={{ 
          textAlign: config.header.storeName.alignment || 'center',
          fontSize: config.header.storeName.fontSize === 'large' ? '16px' : config.header.storeName.fontSize === 'medium' ? '13px' : '11px',
          fontWeight: config.header.storeName.bold ? 'bold' : 'normal',
          marginBottom: '6px'
        }}>
          {config.header.storeName.text || t('pages.receiptTemplate.previewStoreName')}
        </div>
      )}

      {config.header.storeInfo?.enabled && (
        <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '6px', lineHeight: '1.3' }}>
          {config.header.storeInfo.showAddress && config.header.storeInfo.address && (
            <div>📍 {config.header.storeInfo.address}</div>
          )}
          {config.header.storeInfo.showPhone && config.header.storeInfo.phone && (
            <div>📞 {config.header.storeInfo.phone}</div>
          )}
          {config.header.storeInfo.email && (
            <div>✉️ {config.header.storeInfo.email}</div>
          )}
        </div>
      )}

      {config.header.separator?.enabled && (
        <div style={{ margin: '6px 0', fontSize: '10px' }}>
          {(config.header.separator.char || '=').repeat(template.paperWidth === 80 ? 48 : 32)}
        </div>
      )}

      {/* 订单信息 */}
      {config.body.orderInfo.enabled && (
        <div style={{ marginBottom: '6px', fontSize: '10px' }}>
          {config.body.orderInfo.fields?.map((field, index) => (
            <div key={index} style={field.bold ? boldStyle : {}}>
              {getLocalizedText(field.label, i18n.language)}: {(mockOrder as any)[field.field] || '-'}
            </div>
          ))}
        </div>
      )}

      {/* 商品明细 */}
      {config.body.items.enabled && (
        <>
          {config.body.items.showHeader && (
            <div style={{ ...boldStyle, marginTop: '6px', marginBottom: '3px', fontSize: '10px' }}>
              {getLocalizedText(config.body.items.headerText, i18n.language) || t('pages.receiptTemplate.previewItemsHeader')}
            </div>
          )}
          <Divider style={{ margin: '3px 0' }} />
          {mockOrder.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '6px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.name} x{item.quantity}</span>
                <span>¥{(item.price * item.quantity).toFixed(2)}</span>
              </div>
              {config.body.items.showAttributes && item.attributes.length > 0 && (
                <div style={{ fontSize: '9px', color: '#666', paddingLeft: '6px', lineHeight: '1.2' }}>
                  {item.attributes.map((attr, i) => (
                    <span key={i}>{attr.name}: {attr.value} </span>
                  ))}
                </div>
              )}
              {config.body.items.showAddons && item.addons.length > 0 && (
                <div style={{ fontSize: '9px', color: '#666', paddingLeft: '6px', lineHeight: '1.2' }}>
                  {item.addons.map((addon, i) => (
                    <div key={i}>+ {addon.name} ¥{addon.price.toFixed(2)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* 汇总 */}
      {config.footer.summary.enabled && (
        <>
          <Divider style={{ margin: '6px 0' }} />
          <div style={{ fontSize: '10px' }}>
            {config.footer.summary.showSubtotal && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{t('pages.receiptTemplate.previewSubtotal')}</span>
                <span>¥{mockOrder.subtotal.toFixed(2)}</span>
              </div>
            )}
            {config.footer.summary.showDiscount && mockOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{t('pages.receiptTemplate.previewDiscount')}</span>
                <span>-¥{mockOrder.discount.toFixed(2)}</span>
              </div>
            )}
            {config.footer.summary.showTax && mockOrder.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{t('pages.receiptTemplate.previewTax')}</span>
                <span>¥{mockOrder.tax.toFixed(2)}</span>
              </div>
            )}
            {config.footer.summary.showTotal && (
              <div style={{ ...boldStyle, display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '3px' }}>
                <span>{t('pages.receiptTemplate.previewTotal')}</span>
                <span>¥{mockOrder.total.toFixed(2)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 二维码 */}
      {config.footer.qrcode?.enabled && (
        <div style={{ 
          textAlign: config.footer.qrcode.alignment || 'center',
          margin: '10px 0'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: `${(config.footer.qrcode.size || 6) * 3}px`,
            height: `${(config.footer.qrcode.size || 6) * 3}px`,
            border: '1px solid #d9d9d9',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{ textAlign: 'center', lineHeight: `${(config.footer.qrcode.size || 6) * 3}px`, fontSize: '8px' }}>
              QR
            </div>
          </div>
        </div>
      )}

      {/* 自定义消息 */}
      {config.footer.customMessage && (
        <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '9px' }}>
          {getLocalizedText(config.footer.customMessage, i18n.language)}
        </div>
      )}

      {/* WiFi信息 */}
      {config.footer.wifi?.enabled && (
        <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '9px', lineHeight: '1.3' }}>
          <div>{t('pages.receiptTemplate.previewWiFi')} {config.footer.wifi.ssid || t('pages.receiptTemplate.previewWiFiName')}</div>
          <div>{t('pages.receiptTemplate.previewPassword')} {config.footer.wifi.password || t('pages.receiptTemplate.previewWiFiPassword')}</div>
        </div>
      )}

      {/* 底部空行 */}
      {Array.from({ length: config.style?.feedLines || 3 }).map((_, i) => (
        <div key={i}>&nbsp;</div>
      ))}

      {config.style?.cutPaper && (
        <div style={{ textAlign: 'center', color: '#999', fontSize: '9px' }}>
          {t('pages.receiptTemplate.previewCutLine')}
        </div>
      )}
    </div>
  )
}

export default TemplatePreview
