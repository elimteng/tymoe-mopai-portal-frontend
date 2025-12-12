import React, { useState, useEffect } from 'react'
import { Card, Typography, Spin, Alert, Space, Button, message, Form, Input, InputNumber, Tag, Table, Popconfirm, Empty, Modal, Radio, Transfer } from 'antd'
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined, ShopOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useAuthContext } from '../../auth/AuthProvider'
import { getOrganization } from '../../services/auth'
import { getTaxClasses, createTenantTaxClass, getItems, batchAssignItemTenantTaxClass, deleteTaxRate, updateTaxRate, getTaxRateItems, batchRemoveItemTaxClass, type CreateTenantTaxClassPayload, type SimpleTaxRate, type Item } from '../../services/item-management'

const { Title, Text, Paragraph } = Typography

/**
 * 从地址解析税务地区
 */
function parseAddressToRegion(address: string): string | null {
  if (!address) return null
  const upperAddress = address.toUpperCase()

  // 加拿大省份
  if (upperAddress.includes('BRITISH COLUMBIA') || upperAddress.includes('VANCOUVER') || upperAddress.includes(', BC')) {
    return 'CA-BC'
  }
  if (upperAddress.includes('ONTARIO') || upperAddress.includes('TORONTO') || upperAddress.includes(', ON')) {
    return 'CA-ON'
  }
  if (upperAddress.includes('QUEBEC') || upperAddress.includes('MONTREAL') || upperAddress.includes(', QC')) {
    return 'CA-QC'
  }
  // 美国州份
  if (upperAddress.includes('CALIFORNIA') || upperAddress.includes('LOS ANGELES') || upperAddress.includes(', CA,')) {
    return 'US-CA'
  }
  if (upperAddress.includes('NEW YORK') || upperAddress.includes('MANHATTAN') || upperAddress.includes(', NY')) {
    return 'US-NY'
  }

  return null
}

/**
 * 获取地区显示名称
 */
function getRegionDisplayName(regionCode: string): string {
  const regionNames: Record<string, string> = {
    'CA-BC': '加拿大 - 不列颠哥伦比亚省',
    'CA-ON': '加拿大 - 安大略省',
    'CA-QC': '加拿大 - 魁北克省',
    'US-CA': '美国 - 加利福尼亚州',
    'US-NY': '美国 - 纽约州',
    'US-TX': '美国 - 德克萨斯州'
  }
  return regionNames[regionCode] || regionCode
}

/**
 * 简化版税务管理页面
 * 核心功能：创建税种、显示已有税种、分配给商品
 */
const TaxManagement: React.FC = () => {
  const { organizations } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [regionCode, setRegionCode] = useState<string>('')

  // 税种列表
  const [taxRates, setTaxRates] = useState<SimpleTaxRate[]>([])
  const [loadingTaxRates, setLoadingTaxRates] = useState(false)

  // 创建表单
  const [form] = Form.useForm()
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // 应用到商品
  const [applying, setApplying] = useState(false)

  // 编辑税种
  const [editForm] = Form.useForm()
  const [editingTaxRate, setEditingTaxRate] = useState<SimpleTaxRate | null>(null)
  const [updating, setUpdating] = useState(false)

  // 删除税种
  const [deleting, setDeleting] = useState(false)

  // 应用范围选择弹窗
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [applyScope, setApplyScope] = useState<'all' | 'selected'>('all')
  const [newTaxRateId, setNewTaxRateId] = useState<string>('')
  const [newTaxRateName, setNewTaxRateName] = useState<string>('')
  const [allItems, setAllItems] = useState<Item[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [applyingScope, setApplyingScope] = useState(false)

  // 管理关联商品弹窗
  const [manageItemsModalVisible, setManageItemsModalVisible] = useState(false)
  const [managingTaxRate, setManagingTaxRate] = useState<SimpleTaxRate | null>(null)
  const [linkedItems, setLinkedItems] = useState<Array<{ id: string; name: string; basePrice: number; isActive: boolean }>>([])
  const [loadingLinkedItems, setLoadingLinkedItems] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [manageSelectedItemIds, setManageSelectedItemIds] = useState<string[]>([])

  // 初始化：检测地区并加载税种
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const orgId = localStorage.getItem('organization_id')
        if (!orgId) {
          message.warning('请先选择一个组织')
          setLoading(false)
          return
        }

        // 获取组织信息
        let location = ''
        const currentOrg = organizations.find(org => org.id === orgId)
        if (currentOrg?.location) {
          location = currentOrg.location
        } else {
          const org = await getOrganization(orgId, 'beverage')
          location = org.location || ''
        }

        // 解析地区
        const region = parseAddressToRegion(location) || 'CA-BC' // 默认BC省
        setRegionCode(region)

        // 加载已有税种
        await loadTaxRates(region)
      } catch (error: any) {
        console.error('初始化失败:', error)
        message.error(`初始化失败: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [organizations])

  // 加载税种列表
  const loadTaxRates = async (region: string) => {
    setLoadingTaxRates(true)
    try {
      const result = await getTaxClasses(region)
      setTaxRates(result || [])
    } catch (error: any) {
      console.error('加载税种失败:', error)
      // 如果没有税种，不显示错误
      setTaxRates([])
    } finally {
      setLoadingTaxRates(false)
    }
  }

  // 加载商品列表
  const loadAllItems = async () => {
    setLoadingItems(true)
    try {
      const response = await getItems({ isActive: true, limit: 1000 })
      setAllItems(response.data || [])
    } catch (error: any) {
      console.error('加载商品失败:', error)
      message.error('加载商品列表失败')
    } finally {
      setLoadingItems(false)
    }
  }

  // 创建税种
  const handleCreateTaxRate = async () => {
    try {
      const values = await form.validateFields()
      setCreating(true)

      const payload: CreateTenantTaxClassPayload = {
        name: values.name,
        regionCode: regionCode,
        rates: [{
          taxType: values.name, // 使用名称作为taxType
          rate: values.rate / 100, // 转换为小数
          applyOrder: 1,
          compoundPrevious: false
        }]
      }

      const result = await createTenantTaxClass(payload)
      message.success('税种创建成功')
      form.resetFields()
      setShowCreateForm(false)

      // 保存新创建的税种信息，打开应用范围选择弹窗
      setNewTaxRateId(result.id)
      setNewTaxRateName(values.name)
      setApplyScope('all')
      setSelectedItemIds([])
      await loadAllItems()
      setApplyModalVisible(true)

      // 重新加载列表
      await loadTaxRates(regionCode)
    } catch (error: any) {
      if (error.errorFields) return
      message.error(`创建失败: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  // 确认应用范围
  const handleApplyScope = async () => {
    if (!newTaxRateId) return

    setApplyingScope(true)
    try {
      if (applyScope === 'all') {
        // 应用到所有商品
        const itemIds = allItems.map(item => item.id)
        if (itemIds.length === 0) {
          message.warning('没有找到商品')
          setApplyModalVisible(false)
          return
        }
        const result = await batchAssignItemTenantTaxClass(itemIds, newTaxRateId)
        message.success(`已将「${newTaxRateName}」应用到 ${result.succeeded} 个商品`)
      } else {
        // 应用到选中的商品
        if (selectedItemIds.length === 0) {
          message.warning('请选择至少一个商品')
          return
        }
        const result = await batchAssignItemTenantTaxClass(selectedItemIds, newTaxRateId)
        message.success(`已将「${newTaxRateName}」应用到 ${result.succeeded} 个商品`)
      }
      setApplyModalVisible(false)
    } catch (error: any) {
      message.error(`应用失败: ${error.message}`)
    } finally {
      setApplyingScope(false)
    }
  }

  // 跳过应用（稍后手动应用）
  const handleSkipApply = () => {
    setApplyModalVisible(false)
    message.info('您可以稍后在税种列表中点击「应用到所有商品」或选择特定商品应用')
  }

  // 打开管理关联商品弹窗
  const handleManageItems = async (taxRate: SimpleTaxRate) => {
    setManagingTaxRate(taxRate)
    setManageItemsModalVisible(true)
    setLoadingLinkedItems(true)

    try {
      // 并行加载已关联商品和所有商品
      const [linked, allItemsResponse] = await Promise.all([
        getTaxRateItems(taxRate.id),
        getItems({ isActive: true, limit: 1000 })
      ])
      setLinkedItems(linked)
      setAllItems(allItemsResponse.data || [])
      // 设置已关联商品为选中状态
      setManageSelectedItemIds(linked.map(item => item.id))
    } catch (error: any) {
      message.error(`加载商品数据失败: ${error.message}`)
    } finally {
      setLoadingLinkedItems(false)
    }
  }

  // 保存关联商品修改
  const handleSaveItemAssignments = async () => {
    if (!managingTaxRate) return

    setSavingItems(true)
    try {
      // 找出需要移除的商品（原来有但现在没有的）
      const originalItemIds = linkedItems.map(item => item.id)
      const itemsToRemove = originalItemIds.filter(id => !manageSelectedItemIds.includes(id))
      const itemsToAdd = manageSelectedItemIds.filter(id => !originalItemIds.includes(id))

      // 批量移除不再关联的商品
      if (itemsToRemove.length > 0) {
        await batchRemoveItemTaxClass(itemsToRemove)
      }

      // 批量添加新关联的商品
      if (itemsToAdd.length > 0) {
        await batchAssignItemTenantTaxClass(itemsToAdd, managingTaxRate.id)
      }

      message.success(`已更新「${managingTaxRate.name}」的商品关联`)
      setManageItemsModalVisible(false)
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`)
    } finally {
      setSavingItems(false)
    }
  }

  // 删除税种
  const handleDeleteTaxRate = async (taxRateId: string, taxRateName: string) => {
    setDeleting(true)
    try {
      await deleteTaxRate(taxRateId)
      message.success(`税种「${taxRateName}」已删除`)
      await loadTaxRates(regionCode)
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // 打开编辑弹窗
  const handleEditTaxRate = (record: SimpleTaxRate) => {
    setEditingTaxRate(record)
    editForm.setFieldsValue({
      name: record.name,
      rate: record.rate * 100 // 转换为百分比显示
    })
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingTaxRate) return
    try {
      const values = await editForm.validateFields()
      setUpdating(true)

      await updateTaxRate(editingTaxRate.id, {
        name: values.name,
        rate: values.rate / 100 // 转换为小数
      })

      message.success('税种更新成功')
      setEditingTaxRate(null)
      editForm.resetFields()
      await loadTaxRates(regionCode)
    } catch (error: any) {
      if (error.errorFields) return
      message.error(`更新失败: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  // 应用税种到所有商品
  const handleApplyToAllItems = async (taxRateId: string, taxRateName: string) => {
    setApplying(true)
    try {
      const response = await getItems({ isActive: true, limit: 1000 })
      const itemIds = response.data.map(item => item.id)

      if (itemIds.length === 0) {
        message.warning('没有找到商品')
        return
      }

      const result = await batchAssignItemTenantTaxClass(itemIds, taxRateId)

      if (result.failed > 0) {
        message.warning(`应用完成: 成功 ${result.succeeded} 个, 失败 ${result.failed} 个`)
      } else {
        message.success(`成功将「${taxRateName}」应用到 ${result.succeeded} 个商品`)
      }
    } catch (error: any) {
      message.error(`应用失败: ${error.message}`)
    } finally {
      setApplying(false)
    }
  }

  // 税种表格列
  const columns = [
    {
      title: '税种名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '税率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate: number) => (
        <Tag color="blue" style={{ fontSize: 14 }}>
          {(rate * 100).toFixed(2)}%
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: SimpleTaxRate) => (
        <Space wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTaxRate(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => handleManageItems(record)}
          >
            管理商品
          </Button>
          <Popconfirm
            title="确认应用"
            description={`将「${record.name}」应用到所有商品?`}
            onConfirm={() => handleApplyToAllItems(record.id, record.name)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<ShopOutlined />} loading={applying}>
              应用到全部
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除"
            description={`确定要删除税种「${record.name}」吗?`}
            onConfirm={() => handleDeleteTaxRate(record.id, record.name)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} loading={deleting}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="正在加载..." />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>税务管理</Title>
            <Text type="secondary">
              当前税务地区: <Tag color="green">{getRegionDisplayName(regionCode)}</Tag>
            </Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadTaxRates(regionCode)}
              loading={loadingTaxRates}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
            >
              添加税种
            </Button>
          </Space>
        </div>

        {/* 已配置的税种列表 */}
        <Card
          title="已配置的税种"
          style={{ marginBottom: 24 }}
          loading={loadingTaxRates}
        >
          {taxRates.length === 0 ? (
            <Empty
              description="暂无税种配置"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => setShowCreateForm(true)}>
                创建第一个税种
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={taxRates}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          )}
        </Card>

        {/* 创建税种表单 */}
        {showCreateForm && (
          <Card
            title="创建新税种"
            extra={
              <Button type="link" onClick={() => setShowCreateForm(false)}>
                取消
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            <Alert
              message="提示"
              description="输入税种名称和税率即可创建。创建后可以将此税种应用到所有商品或特定商品。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" style={{ maxWidth: 400 }}>
              <Form.Item
                label="税种名称"
                name="name"
                rules={[{ required: true, message: '请输入税种名称' }]}
              >
                <Input placeholder="例如: GST, PST, HST" />
              </Form.Item>

              <Form.Item
                label="税率"
                name="rate"
                rules={[
                  { required: true, message: '请输入税率' },
                  { type: 'number', min: 0, max: 100, message: '税率必须在 0-100 之间' }
                ]}
              >
                <InputNumber
                  placeholder="例如: 5"
                  precision={2}
                  min={0}
                  max={100}
                  addonAfter="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleCreateTaxRate}
                    loading={creating}
                  >
                    创建
                  </Button>
                  <Button onClick={() => { form.resetFields(); setShowCreateForm(false) }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* 税率建议 */}
        <Card title="税率参考" size="small">
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            以下是常见地区的税率参考，请根据实际情况配置:
          </Paragraph>
          <Space wrap>
            <Tag>BC省: GST 5% + PST 7%</Tag>
            <Tag>安大略省: HST 13%</Tag>
            <Tag>魁北克省: GST 5% + QST 9.975%</Tag>
            <Tag>加州: 7.25% ~ 10.25%</Tag>
          </Space>
        </Card>
      </Card>

      {/* 编辑税种弹窗 */}
      <Modal
        title="编辑税种"
        open={!!editingTaxRate}
        onOk={handleSaveEdit}
        onCancel={() => { setEditingTaxRate(null); editForm.resetFields() }}
        confirmLoading={updating}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="税种名称"
            name="name"
            rules={[{ required: true, message: '请输入税种名称' }]}
          >
            <Input placeholder="例如: GST, PST, HST" />
          </Form.Item>

          <Form.Item
            label="税率"
            name="rate"
            rules={[
              { required: true, message: '请输入税率' },
              { type: 'number', min: 0, max: 100, message: '税率必须在 0-100 之间' }
            ]}
          >
            <InputNumber
              placeholder="例如: 5"
              precision={2}
              min={0}
              max={100}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 应用范围选择弹窗 */}
      <Modal
        title={`应用税种「${newTaxRateName}」`}
        open={applyModalVisible}
        onCancel={handleSkipApply}
        footer={[
          <Button key="skip" onClick={handleSkipApply}>
            稍后再说
          </Button>,
          <Button
            key="apply"
            type="primary"
            loading={applyingScope}
            onClick={handleApplyScope}
            icon={applyScope === 'all' ? <ShopOutlined /> : <AppstoreOutlined />}
          >
            {applyScope === 'all' ? '应用到全店' : `应用到 ${selectedItemIds.length} 个商品`}
          </Button>
        ]}
        width={700}
      >
        <Alert
          message="选择税种应用范围"
          description="您可以将此税种应用到全店所有商品，或者选择特定商品。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Radio.Group
          value={applyScope}
          onChange={(e) => setApplyScope(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical">
            <Radio value="all">
              <Space>
                <ShopOutlined />
                <span>应用到全店所有商品</span>
                <Tag color="blue">{allItems.length} 个商品</Tag>
              </Space>
            </Radio>
            <Radio value="selected">
              <Space>
                <AppstoreOutlined />
                <span>选择特定商品</span>
              </Space>
            </Radio>
          </Space>
        </Radio.Group>

        {applyScope === 'selected' && (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">选择要应用此税种的商品：</Text>
            </div>
            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin tip="加载商品中..." />
              </div>
            ) : (
              <Transfer
                dataSource={allItems.map(item => ({
                  key: item.id,
                  title: item.name,
                  description: `¥${(item.basePrice / 100).toFixed(2)}`
                }))}
                titles={['可选商品', '已选商品']}
                targetKeys={selectedItemIds}
                onChange={(newTargetKeys) => setSelectedItemIds(newTargetKeys as string[])}
                render={(item) => (
                  <span>
                    {item.title}
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      {item.description}
                    </Text>
                  </span>
                )}
                listStyle={{ width: 280, height: 300 }}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            )}
          </div>
        )}
      </Modal>

      {/* 管理关联商品弹窗 */}
      <Modal
        title={`管理「${managingTaxRate?.name || ''}」关联的商品`}
        open={manageItemsModalVisible}
        onCancel={() => setManageItemsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setManageItemsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={savingItems}
            onClick={handleSaveItemAssignments}
          >
            保存修改
          </Button>
        ]}
        width={800}
      >
        <Alert
          message="管理税种关联的商品"
          description="左侧显示未关联此税种的商品，右侧显示已关联的商品。您可以通过穿梭框调整关联关系。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {loadingLinkedItems ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin tip="加载商品数据中..." />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                当前已关联 <Text strong>{manageSelectedItemIds.length}</Text> 个商品
                （共 {allItems.length} 个商品可选）
              </Text>
            </div>
            <Transfer
              dataSource={allItems.map(item => ({
                key: item.id,
                title: item.name,
                description: `¥${(item.basePrice / 100).toFixed(2)}`
              }))}
              titles={['未关联商品', '已关联商品']}
              targetKeys={manageSelectedItemIds}
              onChange={(newTargetKeys) => setManageSelectedItemIds(newTargetKeys as string[])}
              render={(item) => (
                <span>
                  {item.title}
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {item.description}
                  </Text>
                </span>
              )}
              listStyle={{ width: 340, height: 400 }}
              showSearch
              filterOption={(inputValue, option) =>
                option.title.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </>
        )}
      </Modal>
    </div>
  )
}

export default TaxManagement
