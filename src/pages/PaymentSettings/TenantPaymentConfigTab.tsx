import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Descriptions,
  Empty,
  Tag,
  Modal
} from 'antd'
import {
  SaveOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import {
  getTenantPaymentConfig,
  upsertTenantPaymentConfig,
  deleteTenantPaymentConfig,
  type TenantPaymentConfig,
  type TenantPaymentConfigDTO
} from '@/services/tenant-payment-config'
import {
  getSupportedCurrencies,
  type CurrencyConfig
} from '@/services/currency'

interface TenantPaymentConfigTabProps {
  tenantId: string
}

// 找零方式映射
const ROUNDING_METHOD_MAP: Record<string, string> = {
  'ROUND': '四舍五入',
  'ROUND_UP': '往上舍（对商家有利）',
  'ROUND_DOWN': '往下舍（对顾客有利）'
}

const ROUNDING_METHOD_VALUES = ['ROUND', 'ROUND_UP', 'ROUND_DOWN']

/**
 * 租户级全局支付配置选项卡
 * 用于设置整个租户的全局货币和舍入规则
 */
const TenantPaymentConfigTab: React.FC<TenantPaymentConfigTabProps> = ({
  tenantId
}) => {
  const [form] = Form.useForm<TenantPaymentConfigDTO>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<TenantPaymentConfig | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(false)

  // 初始化
  useEffect(() => {
    loadConfig()
    loadCurrencies()
  }, [tenantId])

  // 加载租户配置
  const loadConfig = async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await getTenantPaymentConfig(tenantId)
      setConfig(data)
      if (data) {
        form.setFieldsValue({
          currency: data.currency,
          roundingUnit: data.roundingUnit,
          roundingMethod: data.roundingMethod || 'ROUND'
        })
      } else {
        form.resetFields()
      }
    } catch (error: any) {
      console.error('加载租户配置失败:', error)
      message.error('加载租户配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载货币列表
  const loadCurrencies = async () => {
    try {
      setCurrenciesLoading(true)
      const data = await getSupportedCurrencies()
      setCurrencies(data)
    } catch (error: any) {
      console.error('加载货币列表失败:', error)
      // 不显示错误提示，使用默认货币
    } finally {
      setCurrenciesLoading(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 验证必需字段
      if (!values.currency) {
        message.error('请选择货币代码')
        return
      }

      setSaving(true)

      const newConfig = await upsertTenantPaymentConfig(tenantId, {
        currency: values.currency,
        roundingUnit: values.roundingUnit,
        roundingMethod: values.roundingMethod || 'ROUND'
      })

      setConfig(newConfig)
      message.success('租户全局支付配置已保存')
    } catch (error: any) {
      console.error('保存配置失败:', error)
      message.error(
        error.response?.data?.message || '保存配置失败，请重试'
      )
    } finally {
      setSaving(false)
    }
  }

  // 删除配置
  const handleDelete = async () => {
    if (!config) {
      message.warning('没有配置可删除')
      return
    }

    Modal.confirm({
      title: '删除租户全局支付配置',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除租户的全局支付配置吗？删除后所有设备将无法使用统一的货币配置。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          setSaving(true)
          await deleteTenantPaymentConfig(tenantId)
          setConfig(null)
          form.resetFields()
          message.success('租户全局支付配置已删除')
        } catch (error: any) {
          console.error('删除配置失败:', error)
          message.error(
            error.response?.data?.message || '删除配置失败，请重试'
          )
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const currencyOptions = currencies.map(c => ({
    label: `${c.name} (${c.code})`,
    value: c.code,
    symbol: c.symbol
  }))

  return (
    <Spin spinning={loading || currenciesLoading}>
      <Card title="租户全局支付配置" style={{ marginBottom: '24px' }}>
        <Alert
          message="全局配置说明"
          description="租户级全局支付配置适用于所有设备和支付方式。这些设置定义了整个组织使用的货币和舍入规则，POS 系统会优先使用这个配置。"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {config && (
          <Descriptions
            title="当前配置"
            column={2}
            style={{ marginBottom: '24px' }}
            items={[
              {
                label: '货币代码',
                children: <Tag color="blue">{config.currency}</Tag>
              },
              {
                label: '舍入单位',
                children: config.roundingUnit ? (
                  `${config.roundingUnit}`
                ) : (
                  <span style={{ color: '#999' }}>未设置</span>
                )
              },
              {
                label: '舍入规则',
                children: config.roundingMethod ? (
                  ROUNDING_METHOD_MAP[config.roundingMethod]
                ) : (
                  <span style={{ color: '#999' }}>未设置</span>
                )
              },
              {
                label: '最后更新',
                children: new Date(config.updatedAt).toLocaleString()
              }
            ]}
          />
        )}

        {!config && (
          <Empty
            description="未找到全局支付配置"
            style={{ marginBottom: '24px' }}
          />
        )}

        <Card type="inner" title="编辑配置">
          <Form<TenantPaymentConfigDTO>
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="币种 *"
              name="currency"
              rules={[
                { required: true, message: '请选择币种' }
              ]}
            >
              <Select
                placeholder="选择币种（如美元、人民币）"
                options={currencyOptions}
                loading={currenciesLoading}
                optionLabelProp="label"
              />
            </Form.Item>

            <Form.Item
              label="最小硬币面额"
              name="roundingUnit"
              tooltip="例如：0.05 表示最小单位为 5 分，用于现金找零时四舍五入"
            >
              <InputNumber
                placeholder="例如：0.05"
                step={0.01}
                min={0}
                precision={4}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="找零方式"
              name="roundingMethod"
              initialValue="ROUND"
              tooltip="选择计算找零金额时的舍入方式"
            >
              <Select
                placeholder="选择找零方式"
                options={ROUNDING_METHOD_VALUES.map(method => ({
                  label: ROUNDING_METHOD_MAP[method],
                  value: method
                }))}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                >
                  保存配置
                </Button>

                {config && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={saving}
                    onClick={handleDelete}
                  >
                    删除配置
                  </Button>
                )}

                <Button onClick={loadConfig} loading={loading}>
                  刷新
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Card>
    </Spin>
  )
}

export default TenantPaymentConfigTab
