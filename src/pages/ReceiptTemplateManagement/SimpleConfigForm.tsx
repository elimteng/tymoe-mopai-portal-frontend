import React, { useEffect } from 'react'
import { Form, Switch, Select, Input, Divider, Space, Checkbox } from 'antd'
import { useTranslation } from 'react-i18next'
import type { FormInstance } from 'antd'

const { TextArea } = Input

interface SimpleConfigFormProps {
  form: FormInstance
}

/**
 * 简化的模板配置表单
 * 根据后端API设计：样式预设 + 简单开关
 */
const SimpleConfigForm: React.FC<SimpleConfigFormProps> = ({ form }) => {
  const { i18n } = useTranslation()
  
  // 初始化默认配置
  useEffect(() => {
    const currentConfig = form.getFieldValue('config')
    if (!currentConfig) {
      form.setFieldsValue({
        config: {
          language: i18n.language || 'zh-CN',
          styleId: 'classic',
          printDensity: 'normal',
          display: {
            logo: true,
            storeInfo: true,
            customerName: false,
            itemAttributes: true,
            itemAddons: true,
            itemNotes: true,
            priceBreakdown: true,
            qrCode: true
          },
          orderFields: ['tableNumber', 'orderType', 'time'],
          qrCode: {
            enabled: true,
            urlTemplate: 'https://example.com/order/{orderId}',
            title: {
              'zh-CN': '扫码查看订单',
              'en': 'Scan for Order',
              'zh-TW': '掃碼查看訂單'
            },
            sizeRatio: 0.6,
            errorCorrection: 'M'
          },
          customMessage: {
            'zh-CN': '感谢惠顾，欢迎再次光临',
            'en': 'Thank you, welcome back',
            'zh-TW': '感謝惠顧，歡迎再次光臨'
          }
        }
      })
    }
  }, [])

  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0 8px' }}>
      {/* 基础配置 */}
      <Divider orientation="left">基础配置</Divider>

      <Form.Item name={['config', 'language']} label="语言">
        <Select>
          <Select.Option value="zh-CN">简体中文</Select.Option>
          <Select.Option value="en">English</Select.Option>
          <Select.Option value="zh-TW">繁體中文</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name={['config', 'styleId']} label="样式">
        <Select>
          <Select.Option value="classic">经典传统</Select.Option>
          <Select.Option value="modern">现代简约</Select.Option>
          <Select.Option value="compact">紧凑节省</Select.Option>
          <Select.Option value="elegant">精致优雅</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name={['config', 'printDensity']} label="打印密度">
        <Select>
          <Select.Option value="compact">紧凑 (节省纸张)</Select.Option>
          <Select.Option value="normal">标准</Select.Option>
          <Select.Option value="spacious">宽松 (舒适阅读)</Select.Option>
        </Select>
      </Form.Item>

      {/* 显示控制 */}
      <Divider orientation="left">显示控制</Divider>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Form.Item name={['config', 'display', 'logo']} valuePropName="checked" label="显示Logo">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'storeInfo']} valuePropName="checked" label="显示店铺信息">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'customerName']} valuePropName="checked" label="显示客户姓名">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'itemAttributes']} valuePropName="checked" label="显示商品属性">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'itemAddons']} valuePropName="checked" label="显示加料">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'itemNotes']} valuePropName="checked" label="显示备注">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'priceBreakdown']} valuePropName="checked" label="显示价格明细">
          <Switch />
        </Form.Item>

        <Form.Item name={['config', 'display', 'qrCode']} valuePropName="checked" label="显示二维码">
          <Switch />
        </Form.Item>
      </Space>

      {/* 订单信息字段 */}
      <Divider orientation="left">订单信息字段</Divider>

      <Form.Item name={['config', 'orderFields']} label="显示字段">
        <Checkbox.Group>
          <Space direction="vertical">
            <Checkbox value="orderType">订单类型</Checkbox>
            <Checkbox value="tableNumber">桌号</Checkbox>
            <Checkbox value="time">时间</Checkbox>
            <Checkbox value="customerPhone">客户电话</Checkbox>
          </Space>
        </Checkbox.Group>
      </Form.Item>

      {/* 二维码配置 */}
      <Divider orientation="left">二维码配置</Divider>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.config?.display?.qrCode !== currentValues.config?.display?.qrCode
        }
      >
        {({ getFieldValue }) =>
          getFieldValue(['config', 'display', 'qrCode']) ? (
            <>
              <Form.Item name={['config', 'qrCode', 'enabled']} valuePropName="checked" label="启用二维码">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'urlTemplate']} label="URL模板">
                <Input placeholder="https://example.com/order/{orderId}" />
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'title', 'zh-CN']} label="标题(中文)">
                <Input placeholder="扫码查看订单" />
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'title', 'en']} label="标题(英文)">
                <Input placeholder="Scan for Order" />
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'title', 'zh-TW']} label="标题(繁体)">
                <Input placeholder="掃碼查看訂單" />
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'sizeRatio']} label="尺寸比例">
                <Select>
                  <Select.Option value={0.5}>0.5 (小)</Select.Option>
                  <Select.Option value={0.6}>0.6 (标准)</Select.Option>
                  <Select.Option value={0.7}>0.7 (大)</Select.Option>
                  <Select.Option value={0.8}>0.8 (超大)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name={['config', 'qrCode', 'errorCorrection']} label="纠错级别">
                <Select>
                  <Select.Option value="L">L (7%容错)</Select.Option>
                  <Select.Option value="M">M (15%容错，推荐)</Select.Option>
                  <Select.Option value="Q">Q (25%容错)</Select.Option>
                  <Select.Option value="H">H (30%容错)</Select.Option>
                </Select>
              </Form.Item>
            </>
          ) : null
        }
      </Form.Item>

      {/* 自定义消息 */}
      <Divider orientation="left">自定义消息</Divider>

      <Form.Item name={['config', 'customMessage', 'zh-CN']} label="消息(中文)">
        <TextArea rows={2} placeholder="感谢惠顾，欢迎再次光临" />
      </Form.Item>

      <Form.Item name={['config', 'customMessage', 'en']} label="消息(英文)">
        <TextArea rows={2} placeholder="Thank you, welcome back" />
      </Form.Item>

      <Form.Item name={['config', 'customMessage', 'zh-TW']} label="消息(繁体)">
        <TextArea rows={2} placeholder="感謝惠顧，歡迎再次光臨" />
      </Form.Item>
    </div>
  )
}

export default SimpleConfigForm
