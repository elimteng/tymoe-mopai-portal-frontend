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
  Alert,
  Empty,
  Popconfirm,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthContext } from '../../auth/AuthProvider'
import { 
  getDevices,
  createDevice,
  updateDevice,
  updateActivationCode,
  deleteDevice,
  getDeviceSession,
  type Device,
  type DeviceType,
  type DeviceStatus,
  type CreateDeviceRequest,
  type UpdateDeviceRequest,
  type UpdateActivationCodeRequest,
  type DeviceSessionResponse
} from '../../services/device'
import { getOrganizations, type Organization } from '../../services/auth'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface DeviceFormData {
  orgId: string
  deviceType: DeviceType
  deviceName: string
}

interface UpdateCodeFormData {
  orgId: string
  deviceType: DeviceType
  currentActivationCode: string
  newDeviceName?: string
}

const DeviceManagement: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthContext()
  const [form] = Form.useForm<DeviceFormData>()
  const [updateCodeForm] = Form.useForm<UpdateCodeFormData>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [updateCodeModalVisible, setUpdateCodeModalVisible] = useState(false)
  const [updatingDevice, setUpdatingDevice] = useState<Device | null>(null)
  const [activationInfoModalVisible, setActivationInfoModalVisible] = useState(false)
  const [createdDeviceInfo, setCreatedDeviceInfo] = useState<Device | null>(null)
  const [sessionModalVisible, setSessionModalVisible] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<DeviceSessionResponse['data'] | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string>(localStorage.getItem('organization_id') || '')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<DeviceType | ''>('')
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | ''>('')

  // 复制状态
  const [copiedField, setCopiedField] = useState<string>('')

  // 初始化数据
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations()
      // 如果已有选中的组织，立即加载设备
      const currentOrgId = localStorage.getItem('organization_id')
      if (currentOrgId) {
        setSelectedOrgId(currentOrgId)
      }
    }
  }, [isAuthenticated])

  // 当选择组织时加载设备
  useEffect(() => {
    if (selectedOrgId) {
      loadDevices()
    }
  }, [selectedOrgId])

  // 筛选设备列表
  useEffect(() => {
    let filtered = devices

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(device =>
        device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 按设备类型筛选
    if (deviceTypeFilter) {
      filtered = filtered.filter(device => device.deviceType === deviceTypeFilter)
    }

    // 按状态筛选
    if (statusFilter) {
      filtered = filtered.filter(device => device.status === statusFilter)
    }

    setFilteredDevices(filtered)
  }, [devices, searchQuery, deviceTypeFilter, statusFilter])

  // 监听组织切换事件
  useEffect(() => {
    const handleOrganizationChange = (event: CustomEvent) => {
      console.log('🔄 [DEVICE MANAGEMENT] Organization changed, reloading data...', event.detail)
      const newOrgId = event.detail.orgId
      setSelectedOrgId(newOrgId)
    }

    window.addEventListener('organizationChanged', handleOrganizationChange as EventListener)
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange as EventListener)
    }
  }, [])

  // 加载组织列表
  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const organizations = await getOrganizations({})
      setOrganizations(organizations || [])
      
      // 如果只有一个组织，自动选择
      if (organizations && organizations.length === 1) {
        setSelectedOrgId(organizations[0].id)
      }
    } catch (error: any) {
      console.error('Failed to load organizations:', error)
      message.error(t('pages.devices.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 加载设备列表
  const loadDevices = async () => {
    if (!selectedOrgId) return

    try {
      setLoading(true)
      console.log('🔍 [DEVICE DEBUG] Loading devices for orgId:', selectedOrgId)
      const response = await getDevices({ orgId: selectedOrgId })
      console.log('✅ [DEVICE DEBUG] Devices loaded successfully:', response)
      setDevices(response.data || [])
      // 静默加载，不显示成功消息
    } catch (error: any) {
      console.error('❌ [DEVICE DEBUG] Failed to load devices:', {
        error,
        message: error.message,
        response: error.response,
        orgId: selectedOrgId
      })
      message.error(error.message || t('pages.devices.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 打开创建/编辑模态框
  const openModal = (device?: Device) => {
    setEditingDevice(device || null)
    if (device) {
      form.setFieldsValue({
        orgId: device.orgId,
        deviceType: device.deviceType,
        deviceName: device.deviceName
      })
    } else {
      form.resetFields()
      if (selectedOrgId) {
        form.setFieldValue('orgId', selectedOrgId)
      }
    }
    setModalVisible(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setEditingDevice(null)
    form.resetFields()
  }

  // 打开更新激活码模态框
  const openUpdateCodeModal = (device: Device) => {
    setUpdatingDevice(device)
    updateCodeForm.setFieldsValue({
      orgId: device.orgId,
      deviceType: device.deviceType,
      currentActivationCode: '',
      newDeviceName: device.deviceName
    })
    setUpdateCodeModalVisible(true)
  }

  // 关闭更新激活码模态框
  const closeUpdateCodeModal = () => {
    setUpdateCodeModalVisible(false)
    setUpdatingDevice(null)
    updateCodeForm.resetFields()
  }

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingDevice) {
        // 更新设备
        const updateData: UpdateDeviceRequest = {
          deviceName: values.deviceName
        }
        const deviceId = editingDevice.deviceId || editingDevice.id || ''
        await updateDevice(deviceId, updateData)
        message.success(t('pages.devices.updateSuccess'))
      } else {
        // 创建设备
        const createData: CreateDeviceRequest = {
          orgId: values.orgId,
          deviceType: values.deviceType,
          deviceName: values.deviceName
        }
        const response = await createDevice(createData)
        message.success(t('pages.devices.createSuccess'))
        
        // 显示激活信息
        setCreatedDeviceInfo(response.data)
        setActivationInfoModalVisible(true)
      }

      closeModal()
      loadDevices()
    } catch (error: any) {
      console.error('Failed to save device:', error)
      const errorMsg = error.message || (editingDevice ? t('pages.devices.updateFailed') : t('pages.devices.createFailed'))
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 处理更新激活码
  const handleUpdateCode = async () => {
    if (!updatingDevice) return

    try {
      const values = await updateCodeForm.validateFields()
      setLoading(true)

      const updateData: UpdateActivationCodeRequest = {
        orgId: values.orgId,
        deviceType: values.deviceType,
        currentActivationCode: values.currentActivationCode,
        newDeviceName: values.newDeviceName
      }
      
      const deviceId = updatingDevice.deviceId || updatingDevice.id || ''
      const response = await updateActivationCode(deviceId, updateData)
      message.success(t('pages.devices.updateCodeSuccess'))
      
      // 显示新激活码
      Modal.success({
        title: t('pages.devices.newCodeGenerated'),
        content: (
          <div>
            <Paragraph>
              <Text strong>{t('pages.devices.deviceId')}: </Text>
              <Text copyable>{response.data.deviceId}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>{t('pages.devices.activationCode')}: </Text>
              <Text copyable>{response.data.newActivationCode}</Text>
            </Paragraph>
            <Alert
              message={t('pages.devices.updateCodeWarning')}
              type="warning"
              showIcon
            />
          </div>
        ),
        width: 600
      })

      closeUpdateCodeModal()
      loadDevices()
    } catch (error: any) {
      console.error('Failed to update activation code:', error)
      message.error(error.message || t('pages.devices.updateCodeFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 查看设备会话状态
  const handleViewSession = async (device: Device) => {
    const deviceId = device.deviceId || device.id || ''
    try {
      setSessionLoading(true)
      setSessionModalVisible(true)
      const response = await getDeviceSession(deviceId)
      setSessionInfo(response.data)
    } catch (error: any) {
      console.error('Failed to get device session:', error)
      message.error(error.message || t('pages.devices.getSessionFailed'))
      setSessionModalVisible(false)
    } finally {
      setSessionLoading(false)
    }
  }

  // 处理删除
  const handleDelete = async (device: Device) => {
    try {
      setLoading(true)
      const deviceId = device.deviceId || device.id || ''
      await deleteDevice(deviceId)
      message.success(t('pages.devices.deleteSuccess'))
      loadDevices()
    } catch (error: any) {
      console.error('Failed to delete device:', error)
      message.error(error.message || t('pages.devices.deleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      message.success(t('pages.devices.copySuccess'))
      setTimeout(() => setCopiedField(''), 2000)
    } catch (error) {
      message.error(t('pages.devices.copyFailed'))
    }
  }

  // 获取设备类型图标
  const getDeviceTypeIcon = (type: DeviceType) => {
    switch (type) {
      case 'POS':
        return <DesktopOutlined />
      case 'KIOSK':
        return <MobileOutlined />
      case 'TABLET':
        return <TabletOutlined />
      default:
        return <DesktopOutlined />
    }
  }

  // 获取设备类型标签颜色
  const getDeviceTypeColor = (type: DeviceType) => {
    switch (type) {
      case 'POS':
        return 'blue'
      case 'KIOSK':
        return 'green'
      case 'TABLET':
        return 'purple'
      default:
        return 'default'
    }
  }

  // 获取状态标签颜色
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'DELETED':
        return 'error'
      default:
        return 'default'
    }
  }

  // 表格列定义
  const columns: ColumnsType<Device> = [
    {
      title: t('pages.devices.deviceName'),
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (name: string) => (
        <Tooltip placement="topLeft" title={name}>
          {name || '-'}
        </Tooltip>
      )
    },
    {
      title: t('pages.devices.deviceType'),
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 110,
      render: (type: DeviceType) => (
        <Tag icon={getDeviceTypeIcon(type)} color={getDeviceTypeColor(type)}>
          {t(`pages.devices.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
        </Tag>
      )
    },
    {
      title: t('pages.devices.status'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: DeviceStatus) => (
        <Tag color={getStatusColor(status)}>
          {t(`pages.devices.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
        </Tag>
      )
    },
    {
      title: t('pages.devices.deviceId'),
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (_: any, record: Device) => {
        const deviceId = record.deviceId || record.id || ''
        return (
          <Space size="small">
            <Tooltip title={deviceId}>
              <Text code style={{ fontSize: '11px' }}>{deviceId.substring(0, 8)}...</Text>
            </Tooltip>
            <Tooltip title={copiedField === deviceId ? t('pages.devices.copied') : t('pages.devices.copy')}>
              <Button
                type="text"
                size="small"
                icon={copiedField === deviceId ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copyToClipboard(deviceId, deviceId)}
              />
            </Tooltip>
          </Space>
        )
      }
    },
    {
      title: t('pages.devices.activatedAt'),
      dataIndex: 'activatedAt',
      key: 'activatedAt',
      width: 155,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-'
    },
    {
      title: t('pages.devices.lastActiveAt'),
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 155,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-'
    },
    {
      title: t('pages.devices.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 155,
      render: (date: string) => new Date(date).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      title: t('pages.devices.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: Device) => (
        <Space size="small">
          <Tooltip title={t('pages.devices.edit')}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          {record.status === 'ACTIVE' && (
            <>
              <Tooltip title={t('pages.devices.viewSession')}>
                <Button
                  type="link"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleViewSession(record)}
                />
              </Tooltip>
              <Tooltip title={t('pages.devices.updateCode')}>
                <Button
                  type="link"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => openUpdateCodeModal(record)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title={t('pages.devices.deleteConfirm')}
            description={t('pages.devices.deleteWarning')}
            onConfirm={() => handleDelete(record)}
            okText={t('pages.devices.confirm')}
            cancelText={t('pages.devices.cancel')}
          >
            <Tooltip title={t('pages.devices.delete')}>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              {t('pages.devices.title')}
            </Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDevices}
                disabled={!selectedOrgId}
              >
                {t('pages.devices.refresh')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!selectedOrgId}
              >
                {t('pages.devices.create')}
              </Button>
            </Space>
          </div>

          {/* 设备类型说明 */}
          <Alert
            message={t('pages.devices.deviceTypeTooltip')}
            description={t('pages.devices.validityPeriod')}
            type="info"
            showIcon
          />

          {/* 筛选栏 */}
          <Space wrap>
            <Select
              style={{ width: 300 }}
              placeholder={t('pages.devices.selectOrgPlaceholder')}
              value={selectedOrgId || undefined}
              onChange={setSelectedOrgId}
              allowClear
            >
              {organizations.map(org => (
                <Option key={org.id} value={org.id}>
                  {org.orgName}
                </Option>
              ))}
            </Select>
            <Input
              placeholder={t('pages.devices.search')}
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              style={{ width: 150 }}
              placeholder={t('pages.devices.deviceType')}
              value={deviceTypeFilter || undefined}
              onChange={setDeviceTypeFilter}
              allowClear
            >
              <Option value="POS">{t('pages.devices.typePos')}</Option>
              <Option value="KIOSK">{t('pages.devices.typeKiosk')}</Option>
              <Option value="TABLET">{t('pages.devices.typeTablet')}</Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder={t('pages.devices.status')}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="PENDING">{t('pages.devices.statusPending')}</Option>
              <Option value="ACTIVE">{t('pages.devices.statusActive')}</Option>
            </Select>
          </Space>

          {/* 表格 */}
          {!selectedOrgId ? (
            <Empty
              description={t('pages.devices.selectOrgPlaceholder')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredDevices}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => t('pages.devices.loadSuccess', { count: total })
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchQuery || deviceTypeFilter || statusFilter
                        ? t('pages.devices.noResultsDescription')
                        : t('pages.devices.emptyDescription')
                    }
                  >
                    {!searchQuery && !deviceTypeFilter && !statusFilter && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        {t('pages.devices.emptyButton')}
                      </Button>
                    )}
                  </Empty>
                )
              }}
            />
          )}
        </Space>
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingDevice ? t('pages.devices.edit') : t('pages.devices.create')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={loading}
        width={600}
        okText={t('pages.devices.save')}
        cancelText={t('pages.devices.cancel')}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="orgId"
            label={t('pages.devices.selectOrg')}
            rules={[{ required: true, message: t('pages.devices.selectOrgRequired') }]}
          >
            <Select
              placeholder={t('pages.devices.selectOrgPlaceholder')}
              disabled={!!editingDevice}
            >
              {organizations.map(org => (
                <Option key={org.id} value={org.id}>
                  {org.orgName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="deviceType"
            label={t('pages.devices.selectDeviceType')}
            rules={[{ required: true, message: t('pages.devices.deviceTypeRequired') }]}
            tooltip={t('pages.devices.deviceTypeTooltip')}
          >
            <Select
              placeholder={t('pages.devices.selectDeviceTypePlaceholder')}
              disabled={!!editingDevice}
            >
              <Option value="POS">{t('pages.devices.typePos')}</Option>
              <Option value="KIOSK">{t('pages.devices.typeKiosk')}</Option>
              <Option value="TABLET">{t('pages.devices.typeTablet')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="deviceName"
            label={t('pages.devices.deviceName')}
            rules={[
              { required: true, message: t('pages.devices.deviceNameRequired') },
              { min: 1, max: 100, message: t('pages.devices.deviceNameLength') }
            ]}
          >
            <Input placeholder={t('pages.devices.deviceNamePlaceholder')} />
          </Form.Item>

          {!editingDevice && (
            <Alert
              message={t('pages.devices.activationWarning')}
              type="warning"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          )}
        </Form>
      </Modal>

      {/* 更新激活码模态框 */}
      <Modal
        title={t('pages.devices.updateCode')}
        open={updateCodeModalVisible}
        onOk={handleUpdateCode}
        onCancel={closeUpdateCodeModal}
        confirmLoading={loading}
        width={600}
        okText={t('pages.devices.confirm')}
        cancelText={t('pages.devices.cancel')}
      >
        <Alert
          message={t('pages.devices.updateCodeWarning')}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={updateCodeForm}
          layout="vertical"
        >
          <Form.Item
            name="orgId"
            label={t('pages.devices.selectOrg')}
            rules={[{ required: true, message: t('pages.devices.selectOrgRequired') }]}
          >
            <Select disabled>
              {organizations.map(org => (
                <Option key={org.id} value={org.id}>
                  {org.orgName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="deviceType"
            label={t('pages.devices.selectDeviceType')}
            rules={[{ required: true, message: t('pages.devices.deviceTypeRequired') }]}
          >
            <Select disabled>
              <Option value="POS">{t('pages.devices.typePos')}</Option>
              <Option value="KIOSK">{t('pages.devices.typeKiosk')}</Option>
              <Option value="TABLET">{t('pages.devices.typeTablet')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="currentActivationCode"
            label={t('pages.devices.currentActivationCode')}
            rules={[{ required: true, message: t('pages.devices.currentActivationCodeRequired') }]}
          >
            <Input.Password placeholder={t('pages.devices.currentActivationCodePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="newDeviceName"
            label={t('pages.devices.newDeviceName')}
          >
            <Input placeholder={t('pages.devices.newDeviceNamePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 激活信息模态框 */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#faad14' }} />
            <Text strong>{t('pages.devices.activationInfo')}</Text>
          </Space>
        }
        open={activationInfoModalVisible}
        onOk={() => setActivationInfoModalVisible(false)}
        onCancel={() => setActivationInfoModalVisible(false)}
        width={700}
        closable={false}
        maskClosable={false}
        footer={[
          <Button key="ok" type="primary" size="large" onClick={() => setActivationInfoModalVisible(false)}>
            {t('pages.devices.confirm')}
          </Button>
        ]}
      >
        {createdDeviceInfo && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message={t('pages.devices.deviceCreated')}
              description={
                <div>
                  <Text strong style={{ color: '#ff4d4f' }}>
                    ⚠️ {t('pages.devices.activationCodeOnlyOnce')}
                  </Text>
                </div>
              }
              type="warning"
              showIcon
            />
            
            <div style={{ 
              background: '#fafafa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '2px dashed #faad14'
            }}>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong>{t('pages.devices.deviceId')}: </Text>
                <Text code copyable style={{ fontSize: '14px' }}>
                  {createdDeviceInfo.deviceId || createdDeviceInfo.id}
                </Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong style={{ color: '#ff4d4f' }}>{t('pages.devices.activationCode')}: </Text>
                <Text code copyable style={{ fontSize: '14px', color: '#ff4d4f', fontWeight: 'bold' }}>
                  {createdDeviceInfo.activationCode}
                </Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 8 }}>
                <Text strong>{t('pages.devices.deviceName')}: </Text>
                <Text>{createdDeviceInfo.deviceName}</Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text strong>{t('pages.devices.deviceType')}: </Text>
                <Tag icon={getDeviceTypeIcon(createdDeviceInfo.deviceType)} color={getDeviceTypeColor(createdDeviceInfo.deviceType)}>
                  {t(`pages.devices.type${createdDeviceInfo.deviceType.charAt(0) + createdDeviceInfo.deviceType.slice(1).toLowerCase()}`)}
                </Tag>
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={5}>{t('pages.devices.activationSteps')}</Title>
              <ol style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>{t('pages.devices.step1')}</li>
                <li style={{ marginBottom: 8 }}>{t('pages.devices.step2')}</li>
                <li style={{ marginBottom: 8 }}>{t('pages.devices.step3')}</li>
                <li>{t('pages.devices.step4')}</li>
              </ol>
            </div>

            <Alert
              message={
                <Space direction="vertical" size="small">
                  <Text strong>{t('pages.devices.activationWarning')}</Text>
                  <Text type="danger" strong>
                    🔒 {t('pages.devices.activationCodeSecurityNote')}
                  </Text>
                </Space>
              }
              type="error"
              showIcon
            />
          </Space>
        )}
      </Modal>

      {/* 设备会话状态模态框 */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            <Text strong>{t('pages.devices.sessionStatus')}</Text>
          </Space>
        }
        open={sessionModalVisible}
        onCancel={() => setSessionModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSessionModalVisible(false)}>
            {t('pages.devices.close')}
          </Button>
        ]}
        width={600}
      >
        {sessionLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ReloadOutlined spin style={{ fontSize: '32px', color: '#1890ff' }} />
            <div style={{ marginTop: '16px' }}>{t('pages.devices.loading')}</div>
          </div>
        ) : sessionInfo ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {sessionInfo.sessionExists ? (
              <>
                <Alert
                  message={t('pages.devices.sessionActive')}
                  type="success"
                  showIcon
                />
                <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>{t('pages.devices.deviceId')}: </Text>
                    <Text code>{sessionInfo.deviceId}</Text>
                  </Paragraph>
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>{t('pages.devices.sessionStatus')}: </Text>
                    <Tag color="success">{sessionInfo.sessionStatus || 'ACTIVE'}</Tag>
                  </Paragraph>
                  {sessionInfo.activatedAt && (
                    <Paragraph style={{ marginBottom: 8 }}>
                      <Text strong>{t('pages.devices.activatedAt')}: </Text>
                      <Text>{new Date(sessionInfo.activatedAt).toLocaleString('zh-CN')}</Text>
                    </Paragraph>
                  )}
                  {sessionInfo.lastActiveAt && (
                    <Paragraph style={{ marginBottom: 0 }}>
                      <Text strong>{t('pages.devices.lastActiveAt')}: </Text>
                      <Text>{new Date(sessionInfo.lastActiveAt).toLocaleString('zh-CN')}</Text>
                    </Paragraph>
                  )}
                </div>
              </>
            ) : (
              <>
                <Alert
                  message={t('pages.devices.sessionNotActive')}
                  description={sessionInfo.message || t('pages.devices.deviceNotActivated')}
                  type="warning"
                  showIcon
                />
                <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                  <Paragraph style={{ marginBottom: 0 }}>
                    <Text strong>{t('pages.devices.deviceId')}: </Text>
                    <Text code>{sessionInfo.deviceId}</Text>
                  </Paragraph>
                </div>
              </>
            )}
          </Space>
        ) : null}
      </Modal>
    </div>
  )
}

export default DeviceManagement
