import React, { useState, useEffect } from 'react'
import {
  Form,
  Card,
  Checkbox,
  Select,
  Input,
  InputNumber,
  Space,
  Divider,
  Alert,
  Row,
  Col
} from 'antd'
import { useTranslation } from 'react-i18next'

interface ModernMinimalConfigFormProps {
  initialConfig?: any
  onChange?: (config: any) => void
}

/**
 * 现代简约模板配置表单
 * 用户只需要配置关键的显示选项，无需配置复杂的排版细节
 */
const ModernMinimalConfigForm: React.FC<ModernMinimalConfigFormProps> = ({
  initialConfig,
  onChange
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [isInitialized, setIsInitialized] = useState(false)

  // 构建符合后端验证器的配置对象
  const buildConfig = (allValues: any) => {
    // 确保 orderFields 始终有至少一个值
    const orderFields = (allValues.orderFields && allValues.orderFields.length > 0)
      ? allValues.orderFields
      : ['orderNumber']

    return {
      styleId: 'modern-minimal',
      language: allValues.language || 'zh-CN',
      printDensity: allValues.printDensity || 'compact',

      // 第一部分：商户信息
      merchant: {
        showAddress: allValues.showAddress !== false,
        showPhone: allValues.showPhone !== false,
        showTaxNumber: allValues.showTaxNumber || false,
        showWebsite: allValues.showWebsite || false,
      },

      // 第二部分：订单信息 - 选择要显示的字段
      orderInfo: {
        fields: orderFields,
      },

      // 第三部分：订单详情（固定，但可配置显示选项）
      items: {
        showAttributes: allValues.showItemAttributes !== false,
        showAddons: allValues.showItemAddons !== false,
        showNotes: allValues.showItemNotes !== false,
      },

      // 第四部分：订单金额（固定）
      amounts: {
        showSubtotal: allValues.showSubtotal !== false,
        showDiscount: allValues.showDiscount !== false,
        showTax: allValues.showTax || false,
        showTotal: allValues.showTotal !== false,
      },

      // 第五部分：支付信息（固定）
      payment: {
        showPaymentMethod: allValues.showPaymentMethod !== false,
        showPaymentTime: allValues.showPaymentTime !== false,
        showPaymentStatus: allValues.showPaymentStatus !== false,
      },

      // 第六部分：自定义文字
      customMessage: {
        'zh-CN': allValues.customMessageZh || '感谢您的光临',
        'en': allValues.customMessageEn || 'Thank you!',
        'zh-TW': allValues.customMessageTw || '感謝您的光臨',
      },

      // 第七部分：二维码
      qrCode: {
        enabled: allValues.enableQrCode || false,
        urlTemplate: allValues.qrCodeUrl || 'https://example.com/order/{orderId}',
        sizeRatio: allValues.qrCodeSize || 0.7,
        errorCorrection: allValues.qrCodeErrorCorrection || 'M',
        alignment: 'center',
      },
    }
  }

  const handleConfigChange = (changedValues: any, allValues: any) => {
    // 只有在初始化完成后才发送配置更新
    if (!isInitialized) {
      return
    }

    const config = buildConfig(allValues)
    onChange?.(config)
  }

  // 在组件挂载或 initialConfig 变化时，设置初始化标志和发送初始配置
  useEffect(() => {
    // 延迟设置初始化标志，确保表单已完全初始化
    const timer = setTimeout(() => {
      // 先发送初始配置（用于预览）
      const formValues = form.getFieldsValue()
      const config = buildConfig(formValues)
      onChange?.(config)

      // 再设置初始化标志，允许后续的用户修改触发 onChange
      setIsInitialized(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [initialConfig, form])

  // 初始化表单值
  const initialValues = initialConfig ? {
    language: initialConfig.language || 'zh-CN',
    printDensity: initialConfig.printDensity || 'compact',

    // 商户信息
    showAddress: initialConfig.merchant?.showAddress !== false,
    showPhone: initialConfig.merchant?.showPhone !== false,
    showTaxNumber: initialConfig.merchant?.showTaxNumber || false,
    showWebsite: initialConfig.merchant?.showWebsite || false,

    // 订单信息 - 确保至少有一个值
    orderFields: (initialConfig.orderInfo?.fields && initialConfig.orderInfo.fields.length > 0)
      ? initialConfig.orderInfo.fields
      : ['orderNumber'],

    // 订单详情
    showItemAttributes: initialConfig.items?.showAttributes !== false,
    showItemAddons: initialConfig.items?.showAddons !== false,
    showItemNotes: initialConfig.items?.showNotes !== false,

    // 订单金额
    showSubtotal: initialConfig.amounts?.showSubtotal !== false,
    showDiscount: initialConfig.amounts?.showDiscount !== false,
    showTax: initialConfig.amounts?.showTax || false,
    showTotal: initialConfig.amounts?.showTotal !== false,

    // 支付信息
    showPaymentMethod: initialConfig.payment?.showPaymentMethod !== false,
    showPaymentTime: initialConfig.payment?.showPaymentTime !== false,
    showPaymentStatus: initialConfig.payment?.showPaymentStatus !== false,

    // 自定义文字
    customMessageZh: initialConfig.customMessage?.['zh-CN'] || '感谢您的光临',
    customMessageEn: initialConfig.customMessage?.['en'] || 'Thank you!',
    customMessageTw: initialConfig.customMessage?.['zh-TW'] || '感謝您的光臨',

    // 二维码
    enableQrCode: initialConfig.qrCode?.enabled || false,
    qrCodeUrl: initialConfig.qrCode?.urlTemplate || 'https://example.com/order/{orderId}',
    qrCodeSize: initialConfig.qrCode?.sizeRatio || 0.7,
    qrCodeErrorCorrection: initialConfig.qrCode?.errorCorrection || 'M',
  } : {}

  return (
    <div style={{ maxWidth: 800 }}>
      <Alert
        message="现代简约模板"
        description="精简排版，突出关键信息。用户只需配置要显示的内容，排版细节自动优化。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleConfigChange}
      >
        {/* 基础设置 */}
        <Card title="基础设置" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="language"
            label="默认语言"
            rules={[{ required: true }]}
          >
            <Select options={[
              { label: '中文 (简体)', value: 'zh-CN' },
              { label: 'English', value: 'en' },
              { label: '中文 (繁體)', value: 'zh-TW' },
            ]} />
          </Form.Item>

          <Form.Item
            name="printDensity"
            label="排版密度"
          >
            <Select options={[
              { label: '紧凑 (现代简约)', value: 'compact' },
              { label: '标准', value: 'normal' },
              { label: '宽松', value: 'spacious' },
            ]} />
          </Form.Item>
        </Card>

        {/* 第一部分：商户信息 */}
        <Card title="商户信息显示设置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showAddress" valuePropName="checked">
                <Checkbox>显示地址</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showPhone" valuePropName="checked">
                <Checkbox>显示电话</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showTaxNumber" valuePropName="checked">
                <Checkbox>显示税号</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showWebsite" valuePropName="checked">
                <Checkbox>显示网址</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 第二部分：订单信息 */}
        <Card title="订单信息字段" size="small" style={{ marginBottom: 16 }}>
          <Form.Item name="orderFields" label="选择要显示的订单信息字段">
            <Select
              mode="multiple"
              options={[
                { label: '订单号', value: 'orderNumber' },
                { label: '桌号/取餐号', value: 'tableNumber' },
                { label: '顾客名称', value: 'customerName' },
                { label: '收银员/服务员', value: 'cashier' },
              ]}
              placeholder="至少选择一个字段"
            />
          </Form.Item>
        </Card>

        {/* 第三部分：订单详情 */}
        <Card title="订单详情显示" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showItemAttributes" valuePropName="checked">
                <Checkbox>显示商品属性 (大/中/小杯等)</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showItemAddons" valuePropName="checked">
                <Checkbox>显示加料</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showItemNotes" valuePropName="checked">
                <Checkbox>显示备注</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 第四部分：订单金额 */}
        <Card title="订单金额显示" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showSubtotal" valuePropName="checked">
                <Checkbox>显示小计</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showDiscount" valuePropName="checked">
                <Checkbox>显示折扣</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showTax" valuePropName="checked">
                <Checkbox>显示税费</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showTotal" valuePropName="checked">
                <Checkbox>显示总金额</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 第五部分：支付信息 */}
        <Card title="支付信息显示" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showPaymentMethod" valuePropName="checked">
                <Checkbox>显示支付方式</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showPaymentTime" valuePropName="checked">
                <Checkbox>显示支付时间</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="showPaymentStatus" valuePropName="checked">
                <Checkbox>显示支付状态</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 第六部分：自定义文字 */}
        <Card title="自定义文字 (感谢语等)" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="customMessageZh"
            label="中文"
          >
            <Input.TextArea rows={2} maxLength={100} placeholder="感谢您的光临" />
          </Form.Item>

          <Form.Item
            name="customMessageEn"
            label="English"
          >
            <Input.TextArea rows={2} maxLength={100} placeholder="Thank you!" />
          </Form.Item>

          <Form.Item
            name="customMessageTw"
            label="繁體中文"
          >
            <Input.TextArea rows={2} maxLength={100} placeholder="感謝您的光臨" />
          </Form.Item>
        </Card>

        {/* 第七部分：二维码 */}
        <Card title="二维码配置" size="small">
          <Form.Item name="enableQrCode" valuePropName="checked">
            <Checkbox>启用二维码</Checkbox>
          </Form.Item>

          <Form.Item
            name="qrCodeUrl"
            label="二维码 URL 模板"
            tooltip="使用 {orderId} 作为占位符，会被替换为实际的订单 ID"
          >
            <Input placeholder="https://example.com/order/{orderId}" />
          </Form.Item>

          <Form.Item
            name="qrCodeSize"
            label="二维码大小 (占纸张宽度比例)"
          >
            <InputNumber min={0.5} max={0.9} step={0.1} />
          </Form.Item>

          <Form.Item
            name="qrCodeErrorCorrection"
            label="二维码纠错级别"
          >
            <Select options={[
              { label: 'L (7% 纠错)', value: 'L' },
              { label: 'M (15% 纠错)', value: 'M' },
              { label: 'Q (25% 纠错)', value: 'Q' },
              { label: 'H (30% 纠错)', value: 'H' },
            ]} />
          </Form.Item>
        </Card>
      </Form>
    </div>
  )
}

export default ModernMinimalConfigForm
