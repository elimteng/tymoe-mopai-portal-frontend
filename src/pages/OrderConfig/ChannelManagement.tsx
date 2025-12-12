import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  Table,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tooltip,
  Empty,
  Popconfirm,
  Divider,
  InputNumber,
  Switch,
  Tabs,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../auth/AuthProvider'
import {
  getOrderSources,
  createOrderSource,
  updateOrderSource,
  deleteOrderSource,
  type OrderSource,
  type OrderSourceType,
  type CreateOrderSourceRequest,
  type UpdateOrderSourceRequest
} from '../../services/order-config'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface OrderSourceFormData {
  sourceName: string
  description?: string
  isActive: boolean
  displayOrder: number
}

// 系统预设的订单渠道（不可编辑删除）
const SYSTEM_SOURCE_TYPES = ['POS', 'ONLINE', 'DELIVERY', 'SELF_SERVICE']

// 自定义订单渠道类型（用户可创建）
const CUSTOM_SOURCE_TYPE = 'CUSTOM'

const ChannelManagement: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 翻译键前缀
  const tk = (key: string) => t(`pages.orderConfig.${key}`)
  const { isAuthenticated } = useAuthContext()
  const [form] = Form.useForm<OrderSourceFormData>()
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    localStorage.getItem('organization_id') || ''
  )

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [orderSources, setOrderSources] = useState<OrderSource[]>([])
  const [filteredSources, setFilteredSources] = useState<OrderSource[]>([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingSource, setEditingSource] = useState<OrderSource | null>(null)

  // 加载订单渠道列表
  const loadOrderSources = async () => {
    if (!isAuthenticated) {
      return
    }

    setLoading(true)
    try {
      const sources = await getOrderSources()
      // 确保sources是数组
      const sourceArray = Array.isArray(sources) ? sources : []
      setOrderSources(sourceArray)
      setFilteredSources(sourceArray)
    } catch (error) {
      console.error('Error loading order channels:', error)
      message.error(tk('loadFailed'))
      // 错误时设置为空数组
      setOrderSources([])
      setFilteredSources([])
    } finally {
      setLoading(false)
    }
  }

  // 监听 localStorage 中的组织选择变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organization_id') {
        const newOrgId = e.newValue || ''
        setSelectedOrgId(newOrgId)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 初始化加载
  useEffect(() => {
    loadOrderSources()
  }, [isAuthenticated])

  // 搜索过滤
  useEffect(() => {
    const filtered = orderSources.filter(
      source =>
        source.sourceName.toLowerCase().includes(searchText.toLowerCase()) ||
        source.sourceType.toLowerCase().includes(searchText.toLowerCase())
    )
    setFilteredSources(filtered)
  }, [searchText, orderSources])

  // 打开创建/编辑模态框
  const openModal = (source?: OrderSource) => {
    if (source) {
      setEditingSource(source)
      form.setFieldsValue({
        sourceName: source.sourceName,
        description: source.description,
        isActive: source.isActive,
        displayOrder: source.displayOrder
      })
    } else {
      setEditingSource(null)
      form.resetFields()
      form.setFieldsValue({
        isActive: true,
        displayOrder: orderSources.length + 1
      })
    }
    setIsModalVisible(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setIsModalVisible(false)
    setEditingSource(null)
    form.resetFields()
  }

  // 处理保存
  const handleSave = async (values: OrderSourceFormData) => {
    try {
      setLoading(true)

      if (editingSource) {
        // 更新
        const request: UpdateOrderSourceRequest = {
          channelName: values.sourceName,
          description: values.description,
          isActive: values.isActive,
          displayOrder: values.displayOrder
        }
        await updateOrderSource(editingSource.id, request)
        message.success(tk('updateSuccess'))
      } else {
        // 创建 - 自动设置渠道类型为自定义
        const request: any = {
          channelType: CUSTOM_SOURCE_TYPE,
          channelName: values.sourceName,
          description: values.description,
          isActive: values.isActive,
          displayOrder: values.displayOrder
        }
        await createOrderSource(request)
        message.success(tk('createSuccess'))
      }

      closeModal()
      await loadOrderSources()
    } catch (error) {
      console.error('Error saving order channel:', error)
      message.error(editingSource ? tk('updateFailed') : tk('createFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 处理删除
  const handleDelete = async (source: OrderSource) => {
    try {
      setLoading(true)
      await deleteOrderSource(source.id)
      message.success(tk('deleteSuccess'))
      await loadOrderSources()
    } catch (error) {
      console.error('Error deleting order channel:', error)
      message.error(tk('deleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 表格列定义
  const columns: ColumnsType<OrderSource> = [
    {
      title: tk('sourceType'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 120,
      render: (text: OrderSourceType) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: tk('sourceName'),
      dataIndex: 'sourceName',
      key: 'sourceName',
      width: 200,
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: tk('descriptionColumn'),
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (text: string) => text || '-'
    },
    {
      title: tk('displayOrder'),
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
      render: (text: number) => <Text>{text}</Text>
    },
    {
      title: tk('status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? tk('active') : tk('inactive')}
        </Tag>
      )
    },
    {
      title: tk('createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: tk('actions'),
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => {
        const isSystem = SYSTEM_SOURCE_TYPES.includes(record.sourceType)

        return (
          <Space size="small">
            {/* 管理定价按钮 - 所有渠道都可用 */}
            <Tooltip title={tk('managePricing')}>
              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={() => navigate(`/order-config/pricing?source=${record.sourceType}`)}
              >
                {tk('managePricing')}
              </Button>
            </Tooltip>

            {/* 系统预设渠道只显示标签 */}
            {isSystem ? (
              <Tag color="blue">{tk('systemPreset')}</Tag>
            ) : (
              <>
                <Divider type="vertical" />
                <Tooltip title={tk('edit')}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openModal(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title={tk('deleteConfirm')}
                  description={tk('deleteWarning')}
                  onConfirm={() => handleDelete(record)}
                  okText={tk('confirm')}
                  cancelText={tk('cancel')}
                >
                  <Tooltip title={tk('delete')}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <Title level={3} style={{ margin: 0 }}>
              {tk('channelManagementTitle')}
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title={tk('refresh')}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadOrderSources}
                loading={loading}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              {tk('createSource')}
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Paragraph>{tk('channelManagementDesc')}</Paragraph>
      </Card>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={tk('search')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </Space.Compact>
      </Card>

      {/* 订单渠道列表 */}
      <Card
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        {filteredSources.length === 0 && !loading ? (
          <Empty
            description={tk('empty')}
            style={{ marginTop: 48, marginBottom: 48 }}
          >
            <Button type="primary" onClick={() => openModal()}>
              {tk('createSource')}
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredSources}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `${tk('total')} ${total} ${tk('items')}`
            }}
            scroll={{ x: true }}
          />
        )}
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingSource ? tk('editSource') : tk('createSource')}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          autoComplete="off"
        >
          <Form.Item
            label={tk('sourceName')}
            name="sourceName"
            rules={[
              {
                required: true,
                message: tk('sourceNameRequired')
              },
              {
                min: 2,
                message: tk('sourceNameMinLength')
              },
              {
                max: 100,
                message: tk('sourceNameMaxLength')
              }
            ]}
          >
            <Input
              placeholder={tk('sourceNamePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={tk('descriptionLabel')}
            name="description"
          >
            <Input.TextArea
              placeholder={tk('descriptionPlaceholder')}
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={tk('displayOrder')}
            name="displayOrder"
            rules={[
              {
                required: true,
                message: tk('displayOrderRequired')
              }
            ]}
          >
            <InputNumber
              min={1}
              max={1000}
              placeholder={tk('displayOrderPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label={tk('status')}
            name="isActive"
            valuePropName="checked"
          >
            <Switch
              checkedChildren={tk('active')}
              unCheckedChildren={tk('inactive')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ChannelManagement
