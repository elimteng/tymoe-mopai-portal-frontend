import React from 'react'
import { Descriptions, Tag, Space, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ReceiptTemplate } from '@/services/receipt-template'

interface SimpleTemplatePreviewProps {
  template: ReceiptTemplate
}

/**
 * 简化的模板预览组件
 * 支持现代简约配置格式和旧版配置格式
 */
const SimpleTemplatePreview: React.FC<SimpleTemplatePreviewProps> = ({ template }) => {
  const { t } = useTranslation()
  
  if (!template || !template.config) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        ⚠️ 模板配置数据缺失
      </div>
    )
  }
  
  const { config } = template
  
  // 检测配置类型
  // 现代简约配置：有 styleId 和 merchant/items/amounts 等字段
  // 旧版配置：有 display 字段
  const isModernMinimalConfig = config.styleId === 'modern-minimal' && 'merchant' in config
  const isLegacyDisplayConfig = 'display' in config && 'styleId' in config
  
  // 样式名称映射
  const styleNames: Record<string, string> = {
    classic: '经典传统',
    modern: '现代简约',
    'modern-minimal': '现代简约',
    compact: '紧凑节省',
    elegant: '精致优雅'
  }
  
  // 密度名称映射
  const densityNames: Record<string, string> = {
    compact: '紧凑',
    normal: '标准',
    spacious: '宽松'
  }
  
  // 订单字段名称映射
  const fieldNames: Record<string, string> = {
    orderNumber: '订单号',
    orderType: '订单类型',
    tableNumber: '桌号/取餐号',
    customerName: '顾客名称',
    cashier: '收银员/服务员',
    time: '时间',
    customerPhone: '客户电话'
  }

  // 渲染现代简约配置格式
  if (isModernMinimalConfig) {
    return (
      <div style={{ padding: '16px' }}>
        {/* 模拟小票预览 */}
        <div style={{
          width: `${Math.round((template.paperWidth || 58) * 3.78)}px`,
          margin: '0 auto',
          padding: '12px',
          backgroundColor: '#fff',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: 1.4,
          border: '1px dashed #d9d9d9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* 店铺名称 */}
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            示例店铺名称
          </div>
          
          {/* 商户信息 */}
          {(config.merchant?.showAddress || config.merchant?.showPhone) && (
            <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '8px', color: '#666' }}>
              {config.merchant?.showAddress && <div>📍 示例地址 123号</div>}
              {config.merchant?.showPhone && <div>📞 123-4567-8900</div>}
              {config.merchant?.showTaxNumber && <div>税号: 12345678</div>}
              {config.merchant?.showWebsite && <div>🌐 www.example.com</div>}
            </div>
          )}
          
          <div style={{ borderTop: '1px dashed #ccc', margin: '6px 0' }} />
          
          {/* 订单信息 */}
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>
            {config.orderInfo?.fields?.includes('orderNumber') && <div>订单号: #12345</div>}
            {config.orderInfo?.fields?.includes('tableNumber') && <div>桌号: A01</div>}
            {config.orderInfo?.fields?.includes('customerName') && <div>顾客: 张三</div>}
            {config.orderInfo?.fields?.includes('cashier') && <div>收银员: 李四</div>}
            <div>时间: {new Date().toLocaleString('zh-CN')}</div>
          </div>
          
          <div style={{ borderTop: '1px dashed #ccc', margin: '6px 0' }} />
          
          {/* 商品列表 */}
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>美式咖啡 x2</span>
              <span>¥50.00</span>
            </div>
            {config.items?.showAttributes && (
              <div style={{ paddingLeft: '8px', color: '#666', fontSize: '9px' }}>
                规格: 大杯 / 冰
              </div>
            )}
            {config.items?.showAddons && (
              <div style={{ paddingLeft: '8px', color: '#666', fontSize: '9px' }}>
                加料: +珍珠 ¥3.00
              </div>
            )}
            {config.items?.showNotes && (
              <div style={{ paddingLeft: '8px', color: '#888', fontSize: '9px', fontStyle: 'italic' }}>
                备注: 少冰
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>拿铁 x1</span>
              <span>¥32.00</span>
            </div>
          </div>
          
          <div style={{ borderTop: '1px dashed #ccc', margin: '6px 0' }} />
          
          {/* 金额信息 */}
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>
            {config.amounts?.showSubtotal && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>小计:</span>
                <span>¥85.00</span>
              </div>
            )}
            {config.amounts?.showDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5222d' }}>
                <span>折扣:</span>
                <span>-¥5.00</span>
              </div>
            )}
            {config.amounts?.showTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>税费:</span>
                <span>¥0.00</span>
              </div>
            )}
            {config.amounts?.showTotal && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
                <span>合计:</span>
                <span>¥80.00</span>
              </div>
            )}
          </div>
          
          {/* 支付信息 */}
          {(config.payment?.showPaymentMethod || config.payment?.showPaymentTime || config.payment?.showPaymentStatus) && (
            <>
              <div style={{ borderTop: '1px dashed #ccc', margin: '6px 0' }} />
              <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                {config.payment?.showPaymentMethod && <div>支付方式: 微信支付</div>}
                {config.payment?.showPaymentTime && <div>支付时间: {new Date().toLocaleTimeString('zh-CN')}</div>}
                {config.payment?.showPaymentStatus && <div>支付状态: <span style={{ color: '#52c41a' }}>已支付</span></div>}
              </div>
            </>
          )}
          
          {/* 自定义消息 */}
          {config.customMessage?.['zh-CN'] && (
            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
              {config.customMessage['zh-CN']}
            </div>
          )}
          
          {/* 二维码占位 */}
          {config.qrCode?.enabled && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto',
                border: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: '#999'
              }}>
                [二维码]
              </div>
            </div>
          )}
        </div>
        
        {/* 配置摘要 */}
        <Divider style={{ margin: '16px 0' }}>配置详情</Divider>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="语言">
            {config.language === 'zh-CN' ? '简体中文' : config.language === 'en' ? 'English' : '繁體中文'}
          </Descriptions.Item>
          
          <Descriptions.Item label="纸张宽度">
            {template.paperWidth}mm
          </Descriptions.Item>
          
          <Descriptions.Item label="样式">
            <Tag color="blue">{styleNames[config.styleId] || config.styleId}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="打印密度">
            <Tag color="green">{densityNames[config.printDensity] || config.printDensity}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="商户信息">
            <Space wrap>
              {config.merchant?.showAddress && <Tag>地址</Tag>}
              {config.merchant?.showPhone && <Tag>电话</Tag>}
              {config.merchant?.showTaxNumber && <Tag>税号</Tag>}
              {config.merchant?.showWebsite && <Tag>网址</Tag>}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="订单信息字段">
            <Space wrap>
              {config.orderInfo?.fields && config.orderInfo.fields.length > 0 ? (
                config.orderInfo.fields.map((field: string) => (
                  <Tag key={field}>{fieldNames[field] || field}</Tag>
                ))
              ) : (
                <span style={{ color: '#999' }}>无</span>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="商品显示">
            <Space wrap>
              {config.items?.showAttributes && <Tag>属性</Tag>}
              {config.items?.showAddons && <Tag>加料</Tag>}
              {config.items?.showNotes && <Tag>备注</Tag>}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="金额显示">
            <Space wrap>
              {config.amounts?.showSubtotal && <Tag>小计</Tag>}
              {config.amounts?.showDiscount && <Tag>折扣</Tag>}
              {config.amounts?.showTax && <Tag>税费</Tag>}
              {config.amounts?.showTotal && <Tag>合计</Tag>}
            </Space>
          </Descriptions.Item>
          
          {config.qrCode?.enabled && (
            <Descriptions.Item label="二维码">
              已启用 ({config.qrCode.sizeRatio ? `${(config.qrCode.sizeRatio * 100).toFixed(0)}%` : '70%'})
            </Descriptions.Item>
          )}
          
          {config.customMessage?.['zh-CN'] && (
            <Descriptions.Item label="自定义消息">
              {config.customMessage['zh-CN']}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    )
  }
  
  // 渲染旧版 display 配置格式
  if (isLegacyDisplayConfig) {
    return (
      <div style={{ padding: '16px' }}>
        <Descriptions title="配置摘要" column={1} size="small" bordered>
          <Descriptions.Item label="语言">
            {config.language === 'zh-CN' ? '简体中文' : config.language === 'en' ? 'English' : '繁體中文'}
          </Descriptions.Item>
          
          <Descriptions.Item label="纸张宽度">
            {template.paperWidth}mm
          </Descriptions.Item>
          
          <Descriptions.Item label="样式">
            <Tag color="blue">{styleNames[config.styleId] || config.styleId}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="打印密度">
            <Tag color="green">{densityNames[config.printDensity] || config.printDensity}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="显示内容">
            <Space wrap>
              {config.display?.logo && <Tag>Logo</Tag>}
              {config.display?.storeInfo && <Tag>店铺信息</Tag>}
              {config.display?.customerName && <Tag>客户姓名</Tag>}
              {config.display?.itemAttributes && <Tag>商品属性</Tag>}
              {config.display?.itemAddons && <Tag>加料</Tag>}
              {config.display?.itemNotes && <Tag>备注</Tag>}
              {config.display?.priceBreakdown && <Tag>价格明细</Tag>}
              {config.display?.qrCode && <Tag>二维码</Tag>}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="订单信息字段">
            <Space wrap>
              {config.orderFields && config.orderFields.length > 0 ? (
                config.orderFields.map((field: string) => (
                  <Tag key={field}>{fieldNames[field] || field}</Tag>
                ))
              ) : (
                <span style={{ color: '#999' }}>无</span>
              )}
            </Space>
          </Descriptions.Item>
          
          {config.qrCode?.enabled && (
            <>
              <Descriptions.Item label="二维码URL">
                {config.qrCode.urlTemplate || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label="二维码尺寸">
                {config.qrCode.sizeRatio ? `${(config.qrCode.sizeRatio * 100).toFixed(0)}%` : '-'}
              </Descriptions.Item>
            </>
          )}
          
          {config.customMessage && (
            <Descriptions.Item label="自定义消息">
              {config.customMessage['zh-CN'] || '-'}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    )
  }
  
  // 未知配置格式
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
      <p>⚠️ 未知的配置格式</p>
      <p style={{ fontSize: '12px', marginTop: '10px' }}>
        无法识别此模板的配置格式。<br/>
        请尝试重新创建模板。
      </p>
    </div>
  )
}

export default SimpleTemplatePreview
