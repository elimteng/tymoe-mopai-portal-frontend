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
  Popconfirm
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthContext } from '../../auth/AuthProvider'
import { 
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type Account,
  type AccountType,
  type ProductType,
  type AccountStatus,
  type CreateAccountRequest,
  type UpdateAccountRequest
} from '../../services/account'
import { getOrganizations, type Organization } from '../../services/auth'

const { Title, Text } = Typography
const { Option } = Select

interface AccountFormData {
  orgId: string
  accountType: AccountType
  productType: ProductType
  username?: string
  password?: string
  employeeNumber: string
  pinCode: string
}

const AccountManagement: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthContext()
  const [form] = Form.useForm<AccountFormData>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string>(localStorage.getItem('organization_id') || '')
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | ''>('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('')

  // 初始化数据
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations()
      // 如果已有选中的组织，立即加载账号
      const currentOrgId = localStorage.getItem('organization_id')
      if (currentOrgId) {
        setSelectedOrgId(currentOrgId)
      }
    }
  }, [isAuthenticated])

  // 当选择组织时加载账号
  useEffect(() => {
    if (selectedOrgId) {
      loadAccounts()
    }
  }, [selectedOrgId])

  // 筛选账号列表
  useEffect(() => {
    let filtered = accounts

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(account =>
        account.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 按账号类型筛选
    if (accountTypeFilter) {
      filtered = filtered.filter(account => account.accountType === accountTypeFilter)
    }

    // 按状态筛选
    if (statusFilter) {
      filtered = filtered.filter(account => account.status === statusFilter)
    }

    setFilteredAccounts(filtered)
  }, [accounts, searchQuery, accountTypeFilter, statusFilter])

  // 监听组织切换事件
  useEffect(() => {
    const handleOrganizationChange = (event: CustomEvent) => {
      console.log('🔄 [ACCOUNT MANAGEMENT] Organization changed, reloading data...', event.detail)
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
      message.error(t('pages.accounts.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 加载账号列表
  const loadAccounts = async () => {
    if (!selectedOrgId) return

    try {
      setLoading(true)
      const response = await getAccounts({ orgId: selectedOrgId })
      setAccounts(response.data || [])
      // 静默加载，不显示成功消息
    } catch (error: any) {
      console.error('Failed to load accounts:', error)
      message.error(t('pages.accounts.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 打开创建/编辑模态框
  const openModal = (account?: Account) => {
    setEditingAccount(account || null)
    if (account) {
      form.setFieldsValue({
        orgId: account.orgId,
        accountType: account.accountType,
        productType: account.productType,
        username: account.username,
        employeeNumber: account.employeeNumber
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
    setEditingAccount(null)
    form.resetFields()
  }

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingAccount) {
        // 更新账号
        const updateData: UpdateAccountRequest = {
          username: values.username,
          status: editingAccount.status
        }
        await updateAccount(editingAccount.id, updateData)
        message.success(t('pages.accounts.updateSuccess'))
      } else {
        // 创建账号
        const createData: CreateAccountRequest = {
          orgId: values.orgId,
          accountType: values.accountType,
          productType: values.productType,
          username: values.username,
          password: values.password,
          employeeNumber: values.employeeNumber,
          pinCode: values.pinCode
        }
        const response = await createAccount(createData)
        message.success(t('pages.accounts.createSuccess'))
        
        // 显示PIN码警告
        if (response.warning) {
          Modal.warning({
            title: t('pages.accounts.pinCodeWarning'),
            content: (
              <div>
                <p>{response.warning}</p>
                <p><strong>PIN: {response.data.pinCode}</strong></p>
              </div>
            )
          })
        }
      }

      closeModal()
      loadAccounts()
    } catch (error: any) {
      console.error('Failed to save account:', error)
      const errorMsg = error.message || (editingAccount ? t('pages.accounts.updateFailed') : t('pages.accounts.createFailed'))
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 处理删除
  const handleDelete = async (account: Account) => {
    try {
      setLoading(true)
      const response = await deleteAccount(account.id)
      
      if (response.deletedCount && response.deletedCount > 1) {
        message.success(t('pages.accounts.deletedCount', { count: response.deletedCount }))
      } else {
        message.success(t('pages.accounts.deleteSuccess'))
      }
      
      loadAccounts()
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      message.error(error.message || t('pages.accounts.deleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 获取账号类型图标
  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'OWNER':
        return <CrownOutlined />
      case 'MANAGER':
        return <TeamOutlined />
      case 'STAFF':
        return <UserOutlined />
      default:
        return <UserOutlined />
    }
  }

  // 获取账号类型标签颜色
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case 'OWNER':
        return 'gold'
      case 'MANAGER':
        return 'blue'
      case 'STAFF':
        return 'green'
      default:
        return 'default'
    }
  }

  // 获取状态标签颜色
  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success'
      case 'SUSPENDED':
        return 'warning'
      case 'DELETED':
        return 'error'
      default:
        return 'default'
    }
  }

  // 表格列定义
  const columns: ColumnsType<Account> = [
    {
      title: t('pages.accounts.employeeNumber'),
      dataIndex: 'employeeNumber',
      key: 'employeeNumber',
      width: 150
    },
    {
      title: t('pages.accounts.username'),
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (username: string) => username || '-'
    },
    {
      title: t('pages.accounts.accountType'),
      dataIndex: 'accountType',
      key: 'accountType',
      width: 120,
      render: (type: AccountType) => (
        <Tag icon={getAccountTypeIcon(type)} color={getAccountTypeColor(type)}>
          {t(`pages.accounts.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
        </Tag>
      )
    },
    {
      title: t('pages.accounts.productType'),
      dataIndex: 'productType',
      key: 'productType',
      width: 120,
      render: (type: ProductType) => (
        <Tag>{t(`pages.accounts.product${type.charAt(0).toUpperCase() + type.slice(1)}`)}</Tag>
      )
    },
    {
      title: t('pages.accounts.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AccountStatus) => (
        <Tag color={getStatusColor(status)}>
          {t(`pages.accounts.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
        </Tag>
      )
    },
    {
      title: t('pages.accounts.lastLoginAt'),
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: t('pages.accounts.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: t('pages.accounts.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: Account) => (
        <Space size="small">
          <Tooltip title={t('pages.accounts.edit')}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('pages.accounts.deleteConfirm')}
            description={
              record.accountType === 'OWNER' 
                ? t('pages.accounts.deleteCascadeWarning')
                : t('pages.accounts.deleteWarning')
            }
            onConfirm={() => handleDelete(record)}
            okText={t('pages.accounts.confirm')}
            cancelText={t('pages.accounts.cancel')}
          >
            <Tooltip title={t('pages.accounts.delete')}>
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

  // 根据账号类型判断是否需要用户名和密码
  const needsCredentials = (accountType?: AccountType) => {
    return accountType === 'OWNER' || accountType === 'MANAGER'
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              {t('pages.accounts.title')}
            </Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAccounts}
                disabled={!selectedOrgId}
              >
                {t('pages.accounts.refresh')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                disabled={!selectedOrgId}
              >
                {t('pages.accounts.create')}
              </Button>
            </Space>
          </div>

          {/* 权限说明 */}
          <Alert
            message={t('pages.accounts.permissionTitle')}
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>{t('pages.accounts.permissionUser')}</li>
                <li>{t('pages.accounts.permissionOwner')}</li>
                <li>{t('pages.accounts.permissionManager')}</li>
                <li>{t('pages.accounts.permissionStaff')}</li>
              </ul>
            }
            type="info"
            showIcon
          />

          {/* 筛选栏 */}
          <Space wrap>
            <Select
              style={{ width: 300 }}
              placeholder={t('pages.accounts.selectOrgPlaceholder')}
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
              placeholder={t('pages.accounts.search')}
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              style={{ width: 150 }}
              placeholder={t('pages.accounts.accountType')}
              value={accountTypeFilter || undefined}
              onChange={setAccountTypeFilter}
              allowClear
            >
              <Option value="OWNER">{t('pages.accounts.typeOwner')}</Option>
              <Option value="MANAGER">{t('pages.accounts.typeManager')}</Option>
              <Option value="STAFF">{t('pages.accounts.typeStaff')}</Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder={t('pages.accounts.status')}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="ACTIVE">{t('pages.accounts.statusActive')}</Option>
              <Option value="SUSPENDED">{t('pages.accounts.statusSuspended')}</Option>
            </Select>
          </Space>

          {/* 表格 */}
          {!selectedOrgId ? (
            <Empty
              description={t('pages.accounts.selectOrgPlaceholder')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredAccounts}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `${t('pages.accounts.loadSuccess', { count: total })}`
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchQuery || accountTypeFilter || statusFilter
                        ? t('pages.accounts.noResultsDescription')
                        : t('pages.accounts.emptyDescription')
                    }
                  >
                    {!searchQuery && !accountTypeFilter && !statusFilter && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        {t('pages.accounts.emptyButton')}
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
        title={editingAccount ? t('pages.accounts.edit') : t('pages.accounts.create')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={loading}
        width={600}
        okText={t('pages.accounts.save')}
        cancelText={t('pages.accounts.cancel')}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            productType: 'beauty'
          }}
        >
          <Form.Item
            name="orgId"
            label={t('pages.accounts.selectOrg')}
            rules={[{ required: true, message: t('pages.accounts.selectOrgRequired') }]}
          >
            <Select
              placeholder={t('pages.accounts.selectOrgPlaceholder')}
              disabled={!!editingAccount}
            >
              {organizations.map(org => (
                <Option key={org.id} value={org.id}>
                  {org.orgName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="accountType"
            label={t('pages.accounts.selectAccountType')}
            rules={[{ required: true, message: t('pages.accounts.accountTypeRequired') }]}
          >
            <Select
              placeholder={t('pages.accounts.selectAccountTypePlaceholder')}
              disabled={!!editingAccount}
            >
              <Option value="OWNER">{t('pages.accounts.typeOwner')}</Option>
              <Option value="MANAGER">{t('pages.accounts.typeManager')}</Option>
              <Option value="STAFF">{t('pages.accounts.typeStaff')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productType"
            label={t('pages.accounts.selectProductType')}
            rules={[{ required: true, message: t('pages.accounts.productTypeRequired') }]}
          >
            <Select
              placeholder={t('pages.accounts.selectProductTypePlaceholder')}
              disabled={!!editingAccount}
            >
              <Option value="beauty">{t('pages.accounts.productBeauty')}</Option>
              <Option value="fb">{t('pages.accounts.productFb')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.accountType !== currentValues.accountType
            }
          >
            {({ getFieldValue }) => {
              const accountType = getFieldValue('accountType')
              const needsCreds = needsCredentials(accountType)
              
              return (
                <>
                  {needsCreds && (
                    <>
                      <Form.Item
                        name="username"
                        label={t('pages.accounts.username')}
                        rules={[
                          { required: true, message: t('pages.accounts.usernameRequired') },
                          { min: 4, max: 50, message: t('pages.accounts.usernameLength') },
                          { 
                            pattern: /^[^@]+$/, 
                            message: t('pages.accounts.usernameNoAt') 
                          }
                        ]}
                        tooltip={t('pages.accounts.usernameTooltip')}
                      >
                        <Input 
                          placeholder={t('pages.accounts.usernamePlaceholder')}
                          disabled={!!editingAccount}
                        />
                      </Form.Item>

                      {!editingAccount && (
                        <Form.Item
                          name="password"
                          label={t('pages.accounts.passwordPlaceholder').split('（')[0]}
                          rules={[
                            { required: true, message: t('pages.accounts.passwordRequired') },
                            { min: 8, message: t('pages.accounts.passwordMinLength') },
                            { 
                              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 
                              message: t('pages.accounts.passwordPattern') 
                            }
                          ]}
                          tooltip={t('pages.accounts.passwordTooltip')}
                        >
                          <Input.Password 
                            placeholder={t('pages.accounts.passwordPlaceholder')}
                          />
                        </Form.Item>
                      )}
                    </>
                  )}
                </>
              )
            }}
          </Form.Item>

          <Form.Item
            name="employeeNumber"
            label={t('pages.accounts.employeeNumber')}
            rules={[{ required: true, message: t('pages.accounts.employeeNumberRequired') }]}
            tooltip={t('pages.accounts.employeeNumberTooltip')}
          >
            <Input 
              placeholder={t('pages.accounts.employeeNumberPlaceholder')}
              disabled={!!editingAccount}
            />
          </Form.Item>

          {!editingAccount && (
            <Form.Item
              name="pinCode"
              label={t('pages.accounts.pinCode')}
              rules={[
                { required: true, message: t('pages.accounts.pinCodeRequired') },
                { len: 4, message: t('pages.accounts.pinCodeLength') },
                { pattern: /^\d+$/, message: t('pages.accounts.pinCodePattern') }
              ]}
              tooltip={t('pages.accounts.pinCodeTooltip')}
              extra={
                <Text type="warning">
                  <InfoCircleOutlined /> {t('pages.accounts.pinCodeWarning')}
                </Text>
              }
            >
              <Input 
                placeholder={t('pages.accounts.pinCodePlaceholder')}
                maxLength={4}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default AccountManagement
