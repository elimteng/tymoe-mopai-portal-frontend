import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Switch,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Empty,
  Badge,
  Tag,
  Spin,
  Row,
  Col,
  Collapse,
  Divider,
  Tooltip,
  Tabs
} from 'antd'
import {
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  RedoOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getDevices,
  type Device
} from '@/services/device'
import {
  getDevicePaymentMethods,
  createDevicePaymentMethod,
  updateDevicePaymentMethod,
  enableDevicePaymentMethod,
  disableDevicePaymentMethod,
  deleteDevicePaymentMethod,
  type PaymentMethodConfigResponse,
  type PaymentMethodConfigDTO
} from '@/services/device-payment-methods'
import {
  getTenantPaymentProviders,
  createPaymentProvider,
  updatePaymentProvider,
  enablePaymentProvider,
  disablePaymentProvider,
  deletePaymentProvider,
  type PaymentProvider
} from '@/services/payment-provider'
import {
  getSupportedCurrencies,
  type CurrencyConfig
} from '@/services/currency'
import {
  getTenantPaymentConfig,
  upsertTenantPaymentConfig
} from '@/services/tenant-payment-config'

interface CreatePaymentMethodFormData {
  paymentMethod: string
  isEnabled: boolean
  posProvider?: string
  posDeviceId?: string
}

// 支付方式到显示名称的映射
const PAYMENT_METHOD_DISPLAY_NAMES: Record<string, string> = {
  clover: 'Clover（银行卡）',
  cash: '现金',
  wechat: '微信支付',
  custom: '自定义（记账）'
}

// 找零方式映射
const ROUNDING_METHOD_MAP: Record<string, string> = {
  'ROUND': '四舍五入',
  'ROUND_UP': '往上舍（对商家有利）',
  'ROUND_DOWN': '往下舍（对顾客有利）',
  'round': '四舍五入',
  'ceil': '往上舍（对商家有利）',
  'floor': '往下舍（对顾客有利）'
}

const ROUNDING_METHOD_VALUES = ['ROUND', 'ROUND_UP', 'ROUND_DOWN'] as const

/**
 * 支付方式设置页面
 * 管理每个设备的支付方式配置
 */
const PaymentSettings: React.FC = () => {
  const [form] = Form.useForm<CreatePaymentMethodFormData>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<(Device & { paymentMethods?: PaymentMethodConfigResponse[] })[]>([])
  const [tenantId, setTenantId] = useState<string>('')

  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<(Device & { paymentMethods?: PaymentMethodConfigResponse[] }) | null>(null)
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfigResponse | null>(null)

  // 支付提供商相关状态
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [providerLoading, setProviderLoading] = useState(false)
  const [providerModalVisible, setProviderModalVisible] = useState(false)
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null)
  const [providerForm] = Form.useForm()

  // 货币配置相关状态
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(false)

  // 租户级全局货币配置状态
  const [tenantConfigLoading, setTenantConfigLoading] = useState(false)
  const [tenantConfigForm] = Form.useForm()

  // POS提供商选项 - 从支付提供商列表动态生成
  const posProviderOptions = providers
    .filter(p => p.isActive && ['clover', 'square'].includes(p.provider))
    .map(p => ({
      label: p.displayName,
      value: p.provider
    }))

  // 货币选项 - 从后端加载
  const currencyOptions = currencies.map(c => ({
    label: `${c.name} (${c.code})`,
    value: c.code,
    symbol: c.symbol
  }))

  // 初始化
  useEffect(() => {
    const orgId = localStorage.getItem('organization_id') || ''
    setTenantId(orgId)
    if (orgId) {
      loadDevices(orgId)
      loadProviders(orgId)
      loadTenantPaymentConfig(orgId)
    }
    loadCurrencies()
  }, [])

  // 加载货币配置
  const loadCurrencies = async () => {
    try {
      setCurrenciesLoading(true)
      const data = await getSupportedCurrencies()
      if (data.length === 0) {
        message.warning('未能从后端获取货币配置，请检查 Finance Service 连接')
      }
      setCurrencies(data)
    } catch (error: any) {
      console.error('加载货币配置失败:', error.message)
      message.error('加载货币配置失败，请确保 Finance Service 正常运行')
      setCurrencies([])
    } finally {
      setCurrenciesLoading(false)
    }
  }

  // 加载租户级全局货币配置
  const loadTenantPaymentConfig = async (tenantId: string) => {
    try {
      setTenantConfigLoading(true)
      const config = await getTenantPaymentConfig(tenantId)
      if (config) {
        tenantConfigForm.setFieldsValue({
          currency: config.currency,
          roundingUnit: config.roundingUnit,
          roundingMethod: config.roundingMethod
        })
      } else {
        tenantConfigForm.resetFields()
      }
    } catch (error: any) {
      console.error('加载租户货币配置失败:', error.message)
    } finally {
      setTenantConfigLoading(false)
    }
  }

  // 保存租户级全局货币配置
  const handleSaveTenantConfig = async (values: any) => {
    try {
      setTenantConfigLoading(true)
      await upsertTenantPaymentConfig(tenantId, {
        currency: values.currency,
        roundingUnit: values.roundingUnit,
        roundingMethod: values.roundingMethod || 'ROUND'
      })
      message.success('租户货币配置已保存')
    } catch (error: any) {
      message.error(error.message || '保存配置失败')
    } finally {
      setTenantConfigLoading(false)
    }
  }

  // 加载支付提供商列表
  const loadProviders = async (tenantId: string) => {
    try {
      setProviderLoading(true)
      const data = await getTenantPaymentProviders(tenantId)
      setProviders(data)
    } catch (error: any) {
      message.error(error.message || '加载支付服务提供商失败')
    } finally {
      setProviderLoading(false)
    }
  }

  // 加载设备列表
  const loadDevices = async (tenantId: string) => {
    try {
      setLoading(true)
      const response = await getDevices({ orgId: tenantId })
      const devicesWithPaymentMethods: (Device & { paymentMethods?: PaymentMethodConfigResponse[] })[] = []

      // 为每个设备加载支付方式
      for (const device of response.data || []) {
        try {
          const methods = await getDevicePaymentMethods(tenantId, device.id || '')
          devicesWithPaymentMethods.push({
            ...device,
            paymentMethods: methods
          })
        } catch (error) {
          // 如果获取支付方式失败，仍然添加设备，但没有支付方式
          devicesWithPaymentMethods.push({
            ...device,
            paymentMethods: []
          })
        }
      }

      setDevices(devicesWithPaymentMethods)
    } catch (error: any) {
      message.error(error.message || '加载设备失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开创建支付方式模态框
  const openCreateModal = (device: Device & { paymentMethods?: PaymentMethodConfigResponse[] }) => {
    setEditingDevice(device)
    setEditingMethod(null)
    form.resetFields()
    setCreateModalVisible(true)
  }

  // 打开编辑支付方式模态框
  const openEditModal = (device: Device & { paymentMethods?: PaymentMethodConfigResponse[] }, method: PaymentMethodConfigResponse) => {
    setEditingDevice(device)
    setEditingMethod(method)

    form.setFieldsValue({
      paymentMethod: method.paymentMethod,
      isEnabled: method.isEnabled,
      posProvider: method.posProvider,
      posDeviceId: method.posDeviceId
    })
    setCreateModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async (values: CreatePaymentMethodFormData) => {
    if (!editingDevice || !editingDevice.id) return

    try {
      setLoading(true)

      // 基础配置
      const config: PaymentMethodConfigDTO = {
        paymentMethod: values.paymentMethod as any,
        displayName: PAYMENT_METHOD_DISPLAY_NAMES[values.paymentMethod] || values.paymentMethod,
        isEnabled: values.isEnabled,
        posProvider: values.posProvider,
        posDeviceId: values.posDeviceId
      }

      if (editingMethod) {
        // 更新
        await updateDevicePaymentMethod(
          tenantId,
          editingDevice.id,
          editingMethod.paymentMethod,
          config
        )
        message.success('支付方式配置已更新')
      } else {
        // 创建
        await createDevicePaymentMethod(tenantId, editingDevice.id, config)
        message.success('支付方式配置已创建')
      }

      setCreateModalVisible(false)
      await loadDevices(tenantId)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换启用状态
  const handleToggleMethod = async (
    device: Device & { paymentMethods?: PaymentMethodConfigResponse[] },
    method: PaymentMethodConfigResponse
  ) => {
    if (!device.id) return

    try {
      setLoading(true)
      if (method.isEnabled) {
        await disableDevicePaymentMethod(tenantId, device.id, method.paymentMethod)
        message.success(`已禁用 ${method.displayName}`)
      } else {
        await enableDevicePaymentMethod(tenantId, device.id, method.paymentMethod)
        message.success(`已启用 ${method.displayName}`)
      }
      await loadDevices(tenantId)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除支付方式
  const handleDeleteMethod = async (
    device: Device & { paymentMethods?: PaymentMethodConfigResponse[] },
    method: PaymentMethodConfigResponse
  ) => {
    if (!device.id) return

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${method.displayName} 吗？`,
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        try {
          setLoading(true)
          if (device.id) {
            await deleteDevicePaymentMethod(tenantId, device.id, method.paymentMethod)
            message.success('支付方式已删除')
            await loadDevices(tenantId)
          }
        } catch (error: any) {
          message.error(error.message || '删除失败')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // 打开创建支付提供商模态框
  const openCreateProviderModal = () => {
    setEditingProvider(null)
    providerForm.resetFields()
    setProviderModalVisible(true)
  }

  // 打开编辑支付提供商模态框
  const openEditProviderModal = (provider: PaymentProvider) => {
    setEditingProvider(provider)
    providerForm.setFieldsValue({
      provider: provider.provider,
      displayName: provider.displayName,
      description: provider.description
    })
    setProviderModalVisible(true)
  }

  // 提交支付提供商表单
  const handleProviderSubmit = async (values: any) => {
    try {
      setProviderLoading(true)
      const dto = {
        provider: values.provider,
        displayName: values.displayName,
        description: values.description
      }

      if (editingProvider) {
        // 更新
        await updatePaymentProvider(tenantId, editingProvider.provider, dto)
        message.success('支付服务提供商已更新')
      } else {
        // 创建
        await createPaymentProvider(tenantId, dto)
        message.success('支付服务提供商已创建')
      }

      setProviderModalVisible(false)
      await loadProviders(tenantId)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setProviderLoading(false)
    }
  }

  // 切换支付提供商启用状态
  const handleToggleProvider = async (provider: PaymentProvider) => {
    try {
      setProviderLoading(true)
      if (provider.isActive) {
        await disablePaymentProvider(tenantId, provider.provider)
        message.success(`已禁用 ${provider.displayName}`)
      } else {
        await enablePaymentProvider(tenantId, provider.provider)
        message.success(`已启用 ${provider.displayName}`)
      }
      await loadProviders(tenantId)
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setProviderLoading(false)
    }
  }

  // 删除支付提供商
  const handleDeleteProvider = async (provider: PaymentProvider) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${provider.displayName} 吗？此操作不可撤销。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          setProviderLoading(true)
          await deletePaymentProvider(tenantId, provider.provider)
          message.success('支付服务提供商已删除')
          await loadProviders(tenantId)
        } catch (error: any) {
          message.error(error.message || '删除失败')
        } finally {
          setProviderLoading(false)
        }
      }
    })
  }

  // 获取支付方式图标
  const getPaymentIcon = (method: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      clover: <CreditCardOutlined style={{ fontSize: 16, color: '#1890ff' }} />,
      stripe: <CreditCardOutlined style={{ fontSize: 16, color: '#635bff' }} />,
      square: <CreditCardOutlined style={{ fontSize: 16, color: '#ff5f00' }} />,
      cash: <CreditCardOutlined style={{ fontSize: 16, color: '#52c41a' }} />,
      alipay: <CreditCardOutlined style={{ fontSize: 16, color: '#1890ff' }} />,
      wechat: <CreditCardOutlined style={{ fontSize: 16, color: '#09b83e' }} />,
      custom: <CreditCardOutlined style={{ fontSize: 16, color: '#faad14' }} />
    }
    return iconMap[method] || <CreditCardOutlined style={{ fontSize: 16 }} />
  }

  // 获取设备类型颜色
  const getDeviceTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      POS: 'blue',
      KIOSK: 'green',
      TABLET: 'orange',
      MOBILE: 'purple',
      WEB: 'cyan'
    }
    return colorMap[type] || 'default'
  }

  // 支付服务提供商表格列配置
  const providerColumns: ColumnsType<PaymentProvider> = [
    {
      title: '提供商',
      key: 'provider',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCardOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.displayName}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.provider.toUpperCase()}
            </div>
          </div>
        </div>
      ),
      width: 180
    },
    {
      title: '描述',
      key: 'description',
      render: (_, record) => (
        <span style={{ color: '#666' }}>{record.description || '-'}</span>
      )
    },
    {
      title: '状态',
      key: 'isActive',
      render: (_, record) => (
        <Badge
          status={record.isActive ? 'success' : 'default'}
          text={record.isActive ? '已启用' : '已禁用'}
        />
      ),
      width: 100
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Switch
              checked={record.isActive}
              onChange={() => handleToggleProvider(record)}
              size="small"
              loading={providerLoading}
            />
          </Tooltip>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditProviderModal(record)}
            disabled={providerLoading}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProvider(record)}
            disabled={providerLoading}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 展开项内容
  const renderDeviceContent = (device: Device & { paymentMethods?: PaymentMethodConfigResponse[] }) => {
    // 局部定义表格列，以访问当前设备信息
    const devicePaymentMethodColumns: ColumnsType<PaymentMethodConfigResponse> = [
      {
        title: '支付方式',
        key: 'displayName',
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getPaymentIcon(record.paymentMethod)}
            <div>
              <div style={{ fontWeight: 500 }}>{record.displayName}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {record.paymentMethod.toUpperCase()}
              </div>
            </div>
          </div>
        ),
        width: 180
      },
      {
        title: '状态',
        key: 'isEnabled',
        render: (_, record) => (
          <Badge
            status={record.isEnabled ? 'success' : 'default'}
            text={record.isEnabled ? '已启用' : '已禁用'}
          />
        ),
        width: 100
      },
      {
        title: 'POS提供商',
        key: 'posProvider',
        render: (_, record) => (
          record.posProvider ? (
            <Tag color="processing">{record.posProvider.toUpperCase()}</Tag>
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )
        ),
        width: 120
      },
      {
        title: '支付配置',
        key: 'currency',
        render: (_, record) => {
          const recordAny = record as any
          // 优先使用新的全局字段，兼容旧的现金专用字段
          const currency = recordAny.currency || recordAny.cashCurrency
          const roundingMethod = recordAny.roundingMethod || recordAny.cashRoundingMethod
          const currencySymbol = recordAny.currencySymbol

          let roundingText = '未配置'
          if (roundingMethod === 'ROUND') {
            roundingText = '四舍五入'
          } else if (roundingMethod === 'ROUND_UP') {
            roundingText = '向上舍入'
          } else if (roundingMethod === 'ROUND_DOWN') {
            roundingText = '向下舍入'
          }

          return (
            <div style={{ fontSize: '12px' }}>
              {currency ? (
                <>
                  <div style={{ fontWeight: 500 }}>
                    {currencySymbol} {currency}
                  </div>
                  <div style={{ color: '#999', marginTop: 4 }}>
                    舍入: {roundingText}
                  </div>
                </>
              ) : (
                <span style={{ color: '#999' }}>未配置</span>
              )}
            </div>
          )
        },
        width: 140
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 200,
        render: (_, record) => (
          <Space size="small">
            <Tooltip title={record.isEnabled ? '禁用' : '启用'}>
              <Switch
                checked={record.isEnabled}
                onChange={() => handleToggleMethod(device, record)}
                size="small"
                loading={loading}
              />
            </Tooltip>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(device, record)}
              disabled={loading}
            >
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMethod(device, record)}
              disabled={loading}
            >
              删除
            </Button>
          </Space>
        )
      }
    ]

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <div>
              <label style={{ color: '#999', fontSize: '12px' }}>设备ID</label>
              <div style={{ marginTop: 4, fontFamily: 'monospace' }}>{device.id}</div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <label style={{ color: '#999', fontSize: '12px' }}>设备类型</label>
              <div style={{ marginTop: 4 }}>{device.deviceType}</div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <span style={{ fontWeight: 500 }}>支付方式配置</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openCreateModal(device)}
              loading={loading}
            >
              添加支付方式
            </Button>
          </div>

          {device.paymentMethods && device.paymentMethods.length > 0 ? (
            <Table
              columns={devicePaymentMethodColumns}
              dataSource={device.paymentMethods.map((m) => ({
                ...m,
                key: m.paymentMethod
              }))}
              pagination={false}
              size="small"
              bordered={false}
            />
          ) : (
            <Empty
              description="暂无支付方式配置"
              style={{ margin: '20px 0' }}
            />
          )}
        </div>
      </div>
    )
  }

  // 设备列表项
  const deviceItems = devices.map((device) => ({
    key: device.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <Tag color={getDeviceTypeColor(device.deviceType)}>
          {device.deviceType}
        </Tag>
        <span style={{ fontWeight: 500 }}>{device.deviceName}</span>
        <Badge
          count={device.paymentMethods?.length || 0}
          style={{ backgroundColor: '#1890ff', marginLeft: 'auto' }}
          title="配置支付方式数"
        />
      </div>
    ),
    children: renderDeviceContent(device),
    extra: (
      <Space onClick={(e) => e.stopPropagation()}>
        <Button
          type="text"
          size="small"
          icon={<RedoOutlined />}
          onClick={() => loadDevices(tenantId)}
        >
          刷新
        </Button>
      </Space>
    )
  }))

  if ((loading || providerLoading) && devices.length === 0 && providers.length === 0) {
    return (
      <Card>
        <Spin tip="加载中..." />
      </Card>
    )
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {devices.length}
              </div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                总设备数
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {devices.reduce((sum, d) => sum + (d.paymentMethods?.length || 0), 0)}
              </div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                总配置数
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {providers.filter((p) => p.isActive).length}
              </div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                活跃提供商
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 标签页容器 */}
      <Tabs
        defaultActiveKey="devices"
        items={[
          {
            key: 'devices',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCardOutlined />
                设备支付方式
              </span>
            ),
            children: (
              <div>
                {/* 租户级全局货币配置卡片 */}
                <Card
                  title="全局货币配置"
                  style={{ marginBottom: 24 }}
                  loading={tenantConfigLoading}
                >
                  <Form
                    form={tenantConfigForm}
                    layout="inline"
                    onFinish={handleSaveTenantConfig}
                    style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                  >
                    <Form.Item
                      label="币种"
                      name="currency"
                      rules={[{ required: true, message: '请选择币种' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder="选择币种（如美元、人民币）"
                        style={{ width: 200 }}
                        options={currencyOptions}
                        loading={currenciesLoading}
                        onChange={(value) => {
                          // 自动填充最小硬币面额
                          const selectedCurrency = currencies.find(c => c.code === value)
                          if (selectedCurrency?.defaultRoundingUnit) {
                            tenantConfigForm.setFieldValue('roundingUnit', selectedCurrency.defaultRoundingUnit)
                          }
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="最小硬币面额"
                      name="roundingUnit"
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="自动填充"
                        type="number"
                        step={0.01}
                        style={{ width: 150 }}
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label="找零方式"
                      name="roundingMethod"
                      initialValue="ROUND"
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        style={{ width: 200 }}
                        options={ROUNDING_METHOD_VALUES.map(method => ({
                          label: ROUNDING_METHOD_MAP[method],
                          value: method
                        }))}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button type="primary" htmlType="submit" loading={tenantConfigLoading}>
                        保存
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                {/* 设备支付方式说明卡片 */}
                <Card
                  type="inner"
                  style={{ marginBottom: 24, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#faad14', fontSize: 20, flexShrink: 0 }}>ℹ️</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <strong>支付方式配置说明：</strong>
                      <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                        <li><strong>Clover（银行卡）：</strong> 信用卡/借记卡支付，需要配置POS提供商和设备ID</li>
                        <li><strong>现金：</strong> 现场现金收款方式</li>
                        <li><strong>微信支付：</strong> 微信钱包支付</li>
                        <li><strong>自定义（记账）：</strong> 用于记账场景，订单将记录在案，稍后可统一结算</li>
                        <li><strong>启用/禁用：</strong> 可随时调整每个支付方式的启用状态</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* 设备列表卡片 */}
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCardOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      <span>设备支付方式配置</span>
                    </div>
                  }
                  extra={
                    <Button
                      type="text"
                      icon={<RedoOutlined />}
                      onClick={() => loadDevices(tenantId)}
                      loading={loading}
                    >
                      刷新
                    </Button>
                  }
                >
                  {devices.length === 0 ? (
                    <Empty description="暂无设备，请先在设备管理中添加设备" />
                  ) : (
                    <Collapse items={deviceItems} />
                  )}
                </Card>

                {/* 设备支付方式创建/编辑模态框 */}
                <Modal
                  title={editingMethod ? '编辑支付方式' : '添加支付方式'}
                  open={createModalVisible}
                  onCancel={() => setCreateModalVisible(false)}
                  onOk={() => form.submit()}
                  confirmLoading={loading}
                  width={600}
                >
                  <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <strong>当前设备：</strong> {editingDevice?.deviceName} ({editingDevice?.deviceType})
                    </div>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                  >
                    <Form.Item
                      label="选择支付方式"
                      name="paymentMethod"
                      rules={[{ required: true, message: '请选择支付方式' }]}
                      initialValue={editingMethod?.paymentMethod}
                    >
                      <Select
                        placeholder="选择支付方式"
                        disabled={!!editingMethod}
                        options={[
                          { label: 'Clover（银行卡）', value: 'clover' },
                          { label: '现金', value: 'cash' },
                          { label: '微信支付', value: 'wechat' },
                          { label: '自定义（记账）', value: 'custom' }
                        ]}
                      />
                    </Form.Item>

                    {/* Clover POS 配置 */}
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.paymentMethod !== currentValues.paymentMethod}>
                      {({ getFieldValue }) => {
                        const paymentMethod = getFieldValue('paymentMethod')
                        const isClover = paymentMethod === 'clover'
                        const isCustom = paymentMethod === 'custom'

                        return (
                          <>
                            {isClover && (
                              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: 12 }}>
                                  Clover POS 配置
                                </div>

                                {posProviderOptions.length === 0 ? (
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff7e6',
                                    borderRadius: '4px',
                                    color: '#ad6800',
                                    fontSize: '12px'
                                  }}>
                                    <strong>⚠️ 提示：</strong> 请先在"支付服务提供商"标签页中添加并启用Clover提供商
                                  </div>
                                ) : (
                                  <>
                                    <Form.Item
                                      label="POS提供商"
                                      name="posProvider"
                                      tooltip="选择已配置的POS提供商（可选，由POS Frontend处理具体配置）"
                                    >
                                      <Select
                                        placeholder="选择POS提供商"
                                        options={posProviderOptions}
                                      />
                                    </Form.Item>

                                    <Form.Item
                                      label="POS设备ID (Mid)"
                                      name="posDeviceId"
                                      tooltip="Clover商户ID (Mid) 或设备序列号（可选，由POS Frontend处理具体配置）"
                                    >
                                      <Input placeholder="例如: MERCHANT123 或 CLV-1234567" />
                                    </Form.Item>
                                  </>
                                )}
                              </Card>
                            )}

                            {isCustom && (
                              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  ℹ️ 自定义支付方式用于记账场景，订单将以此方式记录在案，稍后可统一结算
                                </div>
                              </Card>
                            )}

                            <Form.Item
                              label="启用"
                              name="isEnabled"
                              valuePropName="checked"
                              initialValue={editingMethod?.isEnabled ?? true}
                            >
                              <Switch />
                            </Form.Item>
                          </>
                        )
                      }}
                    </Form.Item>
                  </Form>
                </Modal>
              </div>
            )
          },
          {
            key: 'providers',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCardOutlined />
                支付服务提供商
              </span>
            ),
            children: (
              <div>
                {/* 支付提供商说明卡片 */}
                <Card
                  type="inner"
                  style={{ marginBottom: 24, backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#1890ff', fontSize: 20, flexShrink: 0 }}>ℹ️</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <strong>支付服务提供商说明：</strong>
                      <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                        <li><strong>提供商管理：</strong> 配置系统级别的支付服务提供商（如 Clover、Stripe 等）</li>
                        <li><strong>启用/禁用：</strong> 控制提供商是否可用于设备配置</li>
                        <li><strong>提供商配置：</strong> 配置后可在设备支付方式中选择使用</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* 支付提供商列表卡片 */}
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCardOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                      <span>支付服务提供商列表</span>
                    </div>
                  }
                  extra={
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateProviderModal}
                        loading={providerLoading}
                      >
                        添加提供商
                      </Button>
                      <Button
                        type="text"
                        icon={<RedoOutlined />}
                        onClick={() => loadProviders(tenantId)}
                        loading={providerLoading}
                      >
                        刷新
                      </Button>
                    </Space>
                  }
                >
                  {providers.length === 0 ? (
                    <Empty description="暂无支付服务提供商配置" />
                  ) : (
                    <Table
                      columns={providerColumns}
                      dataSource={providers.map((p) => ({
                        ...p,
                        key: p.provider
                      }))}
                      pagination={false}
                      size="small"
                      bordered={false}
                      loading={providerLoading}
                    />
                  )}
                </Card>

                {/* 支付提供商创建/编辑模态框 */}
                <Modal
                  title={editingProvider ? '编辑支付服务提供商' : '添加支付服务提供商'}
                  open={providerModalVisible}
                  onCancel={() => setProviderModalVisible(false)}
                  onOk={() => providerForm.submit()}
                  confirmLoading={providerLoading}
                  width={600}
                >
                  <Form
                    form={providerForm}
                    layout="vertical"
                    onFinish={handleProviderSubmit}
                  >
                    <Form.Item
                      label="提供商代码"
                      name="provider"
                      rules={[{ required: true, message: '请输入提供商代码' }]}
                    >
                      <Input
                        placeholder="例如: clover, stripe, square"
                        disabled={!!editingProvider}
                      />
                    </Form.Item>

                    <Form.Item
                      label="显示名称"
                      name="displayName"
                      rules={[{ required: true, message: '请输入显示名称' }]}
                    >
                      <Input
                        placeholder="例如: Clover POS, Stripe 支付"
                      />
                    </Form.Item>

                    <Form.Item
                      label="描述"
                      name="description"
                    >
                      <Input.TextArea
                        placeholder="提供商的简要描述（可选）"
                        rows={3}
                      />
                    </Form.Item>
                  </Form>
                </Modal>
              </div>
            )
          },
        ]}
      />
    </div>
  )
}

export default PaymentSettings
