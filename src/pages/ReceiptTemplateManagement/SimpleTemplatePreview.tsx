import React from 'react'
import { Descriptions, Tag, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ReceiptTemplate } from '@/services/receipt-template'

interface SimpleTemplatePreviewProps {
  template: ReceiptTemplate
}

/**
 * 简化的模板预览组件
 * 显示配置摘要而不是完整的小票渲染
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
  const isSimpleConfig = 'display' in config && 'styleId' in config
  
  if (!isSimpleConfig) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>⚠️ 旧版配置格式</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          此模板使用旧版详细配置格式，<br/>
          预览功能暂不支持。<br/>
          请使用新的样式创建功能。
        </p>
      </div>
    )
  }
  
  // 样式名称映射
  const styleNames: Record<string, string> = {
    classic: '经典传统',
    modern: '现代简约',
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
    orderType: '订单类型',
    tableNumber: '桌号',
    time: '时间',
    customerPhone: '客户电话'
  }
  
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
            {config.display.logo && <Tag>Logo</Tag>}
            {config.display.storeInfo && <Tag>店铺信息</Tag>}
            {config.display.customerName && <Tag>客户姓名</Tag>}
            {config.display.itemAttributes && <Tag>商品属性</Tag>}
            {config.display.itemAddons && <Tag>加料</Tag>}
            {config.display.itemNotes && <Tag>备注</Tag>}
            {config.display.priceBreakdown && <Tag>价格明细</Tag>}
            {config.display.qrCode && <Tag>二维码</Tag>}
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="订单信息字段">
          <Space wrap>
            {config.orderFields && config.orderFields.length > 0 ? (
              config.orderFields.map(field => (
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
      
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
        💡 提示：完整的小票预览功能正在开发中。当前显示的是配置摘要。
      </div>
    </div>
  )
}

export default SimpleTemplatePreview
