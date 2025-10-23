import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import '../../styles/phone-input.css'
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
  Row,
  Col,
  Divider,
  Alert,
  Empty
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  BranchesOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { useAuthContext } from '../../auth/AuthProvider'
import { 
  getOrganizations,
  createOrganization,
  updateOrganization,
  type Organization,
  type CreateOrganizationPayload,
  type GetOrganizationsParams
} from '../../services/auth'
import AddressAutocomplete from '../../components/AddressAutocomplete'
import type { AddressSuggestion } from '../../services/address'
import './OrganizationManagement.css'
import { 
  testCreateMinimalOrganization, 
  testCreateOrganizationWithLocation, 
  testCreateFullOrganization 
} from '../../services/testOrganization'

const { Title, Text } = Typography
const { Option } = Select

interface OrganizationFormData {
  orgName: string
  orgType: 'MAIN' | 'BRANCH' | 'FRANCHISE'
  parentOrgId?: string | null
  description?: string
  location?: string
  phone?: string
  email?: string
}

const OrganizationManagement: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, organizations: userOrganizations, updateOrganizations: updateAuthOrganizations } = useAuthContext()
  const [form] = Form.useForm<OrganizationFormData>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // 地址相关状态
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)

  // 初始化数据
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations()
    }
  }, [isAuthenticated])

  // 筛选组织列表
  useEffect(() => {
    let filtered = organizations

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(org => 
        org.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 按组织类型筛选
    if (orgTypeFilter) {
      filtered = filtered.filter(org => org.orgType === orgTypeFilter)
    }

    // 按状态筛选
    if (statusFilter) {
      filtered = filtered.filter(org => org.status === statusFilter)
    }

    setFilteredOrganizations(filtered)
  }, [organizations, searchQuery, orgTypeFilter, statusFilter])

  // 加载组织列表
  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const params: GetOrganizationsParams = {
        status: 'ACTIVE' // 默认只显示活跃的组织
      }
      
      console.log('🔍 [ORG MANAGEMENT] Loading organizations with params:', params)
      const orgList = await getOrganizations(params, 'beverage')
      console.log('🔍 [ORG MANAGEMENT] Loaded organizations:', orgList)
      setOrganizations(orgList)
      
      // 同步到 AuthProvider
      updateAuthOrganizations(orgList)
      console.log('✅ [ORG MANAGEMENT] Updated AuthProvider organizations:', orgList.length)
      
      if (orgList.length > 0) {
        // 自动设置第一个组织为当前组织
        localStorage.setItem('organization_id', orgList[0].id)
        console.log('✅ [ORG MANAGEMENT] Set organization ID:', orgList[0].id)
      } else {
        console.log('⚠️ [ORG MANAGEMENT] No organizations found')
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
      message.error(t('organization.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 创建组织
  const handleCreate = () => {
    setEditingOrg(null)
    form.resetFields()
    form.setFieldsValue({ orgType: 'MAIN' })
    setSelectedAddress(null)
    setModalVisible(true)
  }

  // 编辑组织
  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    form.setFieldsValue({
      orgName: org.orgName,
      orgType: org.orgType,
      parentOrgId: org.parentOrgId,
      description: org.description,
      location: org.location,
      phone: org.phone,
      email: org.email
    })
    setSelectedAddress(null) // 编辑时重置地址详情
    setModalVisible(true)
  }

  // 删除组织
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: t('organization.delete'),
      content: t('organization.deleteConfirm') + ' ' + t('organization.deleteWarning'),
      okText: t('organization.delete'),
      okType: 'danger',
      cancelText: t('organization.cancel'),
      onOk: async () => {
        try {
          // TODO: 实现删除组织API
          message.success(t('organization.deleteSuccess'))
          loadOrganizations()
        } catch (error) {
          console.error('Failed to delete organization:', error)
          message.error(t('organization.deleteFailed'))
        }
      }
    })
  }

  // 提交表单
  const handleSubmit = async (values: OrganizationFormData) => {
    try {
      if (editingOrg) {
        // 更新组织
        const updatePayload = {
          orgName: values.orgName?.trim(),
          description: values.description?.trim() || undefined,
          location: values.location?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim() || undefined
        }
        
        // 清理undefined值
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key as keyof typeof updatePayload] === undefined) {
            delete updatePayload[key as keyof typeof updatePayload]
          }
        })
        
        console.log('📝 [FORM DEBUG] Update payload:', updatePayload)
        
        await updateOrganization(editingOrg.id, updatePayload, 'beverage')
        message.success(t('organization.updateSuccess'))
      } else {
        // 创建组织
        const createPayload: CreateOrganizationPayload = {
          orgName: values.orgName?.trim(),
          orgType: values.orgType,
          parentOrgId: values.parentOrgId || null,
          description: values.description?.trim() || undefined,
          location: values.location?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim() || undefined
        }
        
        // 清理undefined值
        Object.keys(createPayload).forEach(key => {
          if (createPayload[key as keyof CreateOrganizationPayload] === undefined) {
            delete createPayload[key as keyof CreateOrganizationPayload]
          }
        })
        
        console.log('📝 [FORM DEBUG] Form values:', values)
        console.log('📝 [FORM DEBUG] Cleaned payload:', createPayload)
        
        // 验证必填字段
        if (!createPayload.orgName || !createPayload.orgType) {
          throw new Error('组织名称和组织类型是必填项')
        }
        
        const newOrg = await createOrganization(createPayload, 'beverage')
        message.success(t('organization.createSuccess'))
        
        console.log('✅ [ORG MANAGEMENT] Organization created:', newOrg)
        
        // 设置新创建的组织为当前组织
        localStorage.setItem('organization_id', newOrg.id)
        console.log('✅ [ORG MANAGEMENT] Set new organization ID:', newOrg.id)
        
        // 如果是第一个组织，跳转到仪表板
        if (organizations.length === 0) {
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000) // 延迟1秒让用户看到成功消息
        }
      }
      
      setModalVisible(false)
      loadOrganizations()
    } catch (error: any) {
      console.error('Failed to save organization:', error)
      const errorMessage = error?.response?.data?.detail || error.message || (editingOrg ? t('organization.updateFailed') : t('organization.createFailed'))
      message.error(errorMessage)
    }
  }

  // 获取可选的父组织列表（用于BRANCH和FRANCHISE类型）
  const getAvailableParentOrgs = () => {
    return organizations.filter(org => org.orgType === 'MAIN')
  }

  // 处理地址选择
  const handleAddressSelect = (address: AddressSuggestion) => {
    setSelectedAddress(address)
    console.log('📍 选中地址:', {
      display_name: address.display_name,
      coordinates: `${address.lat}, ${address.lon}`,
      place_id: address.place_id
    })
  }

  // 获取组织类型图标
  const getOrgTypeIcon = (orgType: string) => {
    switch (orgType) {
      case 'MAIN':
        return <CrownOutlined style={{ color: '#faad14' }} />
      case 'BRANCH':
        return <BranchesOutlined style={{ color: '#52c41a' }} />
      case 'FRANCHISE':
        return <ShopOutlined style={{ color: '#1890ff' }} />
      default:
        return <ShopOutlined />
    }
  }

  // 获取组织类型标签
  const getOrgTypeTag = (orgType: string) => {
    const configs = {
      MAIN: { color: 'gold', text: t('organization.typeMain') },
      BRANCH: { color: 'green', text: t('organization.typeBranch') },
      FRANCHISE: { color: 'blue', text: t('organization.typeFranchise') }
    }
    const config = configs[orgType as keyof typeof configs]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 表格列定义
  const columns = [
    {
      title: t('organization.orgName'),
      dataIndex: 'orgName',
      key: 'orgName',
      width: 200,
      render: (name: string, record: Organization) => (
        <Space>
          {getOrgTypeIcon(record.orgType)}
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: t('organization.orgType'),
      dataIndex: 'orgType',
      key: 'orgType',
      width: 100,
      render: (orgType: string) => getOrgTypeTag(orgType)
    },
    {
      title: t('organization.parentOrg'),
      dataIndex: 'parentOrgName',
      key: 'parentOrgName',
      width: 150,
      render: (parentOrgName: string) => parentOrgName || '-'
    },
    {
      title: t('organization.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true
    },
    {
      title: t('organization.location'),
      dataIndex: 'location',
      key: 'location',
      width: 200,
      ellipsis: true
    },
    {
      title: t('organization.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: t('organization.email'),
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true
    },
    {
      title: t('organization.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors = {
          ACTIVE: 'green',
          SUSPENDED: 'orange',
          DELETED: 'red'
        }
        const labels = {
          ACTIVE: t('organization.statusActive'),
          SUSPENDED: t('organization.statusInactive'),
          DELETED: t('organization.statusInactive')
        }
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>
      }
    },
    {
      title: t('organization.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: t('organization.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: Organization) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          >
            {t('organization.edit')}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            size="small"
            disabled={record.orgType === 'MAIN'} // 主店不能删除
          >
            {t('organization.delete')}
          </Button>
        </Space>
      )
    }
  ]

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text>请先登录以使用组织管理功能</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>{t('organization.title')}</Title>
        
        {/* 说明信息 */}
        <Alert
          message={t('organization.infoTitle')}
          description={
            <div>
              <p style={{ marginBottom: 12, fontWeight: 500, color: '#1890ff' }}>
                📍 {t('organization.organizationConcept')}
              </p>
              <p>• <strong>{t('organization.typeMain')}</strong>: {t('organization.infoMain')}</p>
              <p>• <strong>{t('organization.typeBranch')}</strong>: {t('organization.infoBranch')}</p>
              <p>• <strong>{t('organization.typeFranchise')}</strong>: {t('organization.infoFranchise')}</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        {/* 搜索和操作栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input.Search
              placeholder={t('organization.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('organization.orgType')}
              value={orgTypeFilter}
              onChange={setOrgTypeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="MAIN">{t('organization.typeMain')}</Option>
              <Option value="BRANCH">{t('organization.typeBranch')}</Option>
              <Option value="FRANCHISE">{t('organization.typeFranchise')}</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('organization.status')}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="ACTIVE">{t('organization.statusActive')}</Option>
              <Option value="SUSPENDED">{t('organization.statusInactive')}</Option>
              <Option value="DELETED">{t('organization.statusInactive')}</Option>
            </Select>
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadOrganizations}
                loading={loading}
              >
                {t('organization.refresh')}
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                {t('organization.create')}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 组织表格 */}
        {filteredOrganizations.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredOrganizations}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
          />
        ) : organizations.length === 0 ? (
          // 真的没有任何组织
          <Card>
            <Empty 
              description={
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>{t('organization.emptyTitle')}</Title>
                  <Text type="secondary">
                    {t('organization.emptyDescription')}
                  </Text>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Space direction="vertical" size="large">
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  {t('organization.emptyButton')}
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('organization.emptyTip')}
                </Text>
              </Space>
            </Empty>
          </Card>
        ) : (
          // 有组织但筛选后没有结果
          <Card>
            <Empty 
              description={
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>{t('organization.noResultsTitle')}</Title>
                  <Text type="secondary">
                    {t('organization.noResultsDescription')}
                  </Text>
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                      {t('organization.noResultsTotal', { count: organizations.length })}
                    </Text>
                  </div>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Space>
                <Button 
                  onClick={() => {
                    setSearchQuery('')
                    setOrgTypeFilter(undefined)
                    setStatusFilter('ACTIVE')
                  }}
                >
                  {t('organization.clearFilters')}
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  {t('organization.createNew')}
                </Button>
              </Space>
            </Empty>
          </Card>
        )}
      </Card>

      {/* 创建/编辑组织模态框 */}
      <Modal
        title={editingOrg ? t('organization.edit') : t('organization.create')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="orgName"
            label={t('organization.orgName')}
            rules={[
              { required: true, message: t('organization.orgNameRequired') },
              { min: 2, max: 100, message: '组织名称长度为2-100字符' }
            ]}
          >
            <Input placeholder={t('organization.orgNamePlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orgType"
                label={t('organization.orgType')}
                rules={[{ required: true, message: t('organization.orgTypeRequired') }]}
              >
                <Select placeholder={t('organization.orgTypeRequired')} onChange={(value) => {
                  if (value === 'MAIN') {
                    form.setFieldsValue({ parentOrgId: null })
                  }
                }}>
                  <Option value="MAIN">{t('organization.typeMain')}</Option>
                  <Option value="BRANCH">{t('organization.typeBranch')}</Option>
                  <Option value="FRANCHISE">{t('organization.typeFranchise')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.orgType !== currentValues.orgType}
              >
                {({ getFieldValue }) => {
                  const isMainOrg = getFieldValue('orgType') === 'MAIN'
                  return (
                    <Form.Item
                      name="parentOrgId"
                      label={t('organization.parentOrg')}
                      rules={[
                        {
                          required: !isMainOrg,
                          message: t('organization.parentOrgRequired')
                        }
                      ]}
                    >
                      <Select 
                        placeholder={isMainOrg ? t('organization.parentOrgPlaceholderMain') : t('organization.parentOrgPlaceholder')}
                        allowClear
                        disabled={isMainOrg}
                      >
                        {getAvailableParentOrgs().map(org => (
                          <Option key={org.id} value={org.id}>
                            {org.orgName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('organization.description')}
          >
            <Input.TextArea rows={3} placeholder={t('organization.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="location"
            label={t('organization.location')}
            rules={[
              { required: true, message: t('organization.locationRequired') },
              { min: 5, message: t('organization.locationMinLength') }
            ]}
          >
            <AddressAutocomplete
              placeholder={t('organization.locationPlaceholder')}
              onSelect={handleAddressSelect}
            />
          </Form.Item>
          
          {selectedAddress && (
            <div className="address-confirmation">
              <div className="address-text">
                📍 {t('organization.addressSelected', { address: selectedAddress.display_name })}
              </div>
              <div className="coordinates-text">
                {t('organization.coordinates', { lat: selectedAddress.lat, lon: selectedAddress.lon })}
              </div>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('organization.phone')}
                tooltip={t('organization.phoneTooltip')}
                rules={[
                  { required: true, message: t('organization.phoneRequired') },
                  { 
                    pattern: /^\+[1-9]\d{1,14}$/, 
                    message: t('organization.phoneInvalid')
                  }
                ]}
              >
                <div 
                  className="phone-input-wrapper"
                  style={{ 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#40a9ff'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = '#40a9ff'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="CA"
                    placeholder={t('organization.phonePlaceholder')}
                    className="PhoneInput"
                    onChange={(value) => {
                      form.setFieldsValue({ phone: value || '' })
                    }}
                  />
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('organization.email')}
                rules={[
                  { type: 'email', message: t('organization.emailInvalid') }
                ]}
              >
                <Input placeholder={t('organization.emailPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                {t('organization.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('organization.save')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrganizationManagement
