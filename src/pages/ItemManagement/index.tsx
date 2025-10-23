import React, { useState, useEffect } from 'react'
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
  InputNumber, 
  Select, 
  message,
  Row,
  Col,
  Divider,
  TreeSelect
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined 
} from '@ant-design/icons'
import { useAuthContext } from '../../auth/AuthProvider'
import { 
  itemManagementService,
  type Item,
  type Category,
  type CreateItemPayload,
  type UpdateItemPayload,
  type PaginatedResponse
} from '../../services/item-management'

const { Title, Text } = Typography
const { Option } = Select

interface ItemFormData {
  name: string
  description?: string
  price: number
  categoryId?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
}

const ItemManagement: React.FC = () => {
  const { isAuthenticated } = useAuthContext()
  const [form] = Form.useForm<ItemFormData>()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('')

  // 初始化数据
  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
      loadCategories()
    }
  }, [isAuthenticated, pagination.current, pagination.pageSize])

  // 加载商品列表
  const loadItems = async () => {
    setLoading(true)
    try {
      const response: PaginatedResponse<Item> = await itemManagementService.getItems({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchQuery || undefined
      })
      
      setItems(response.data)
      setPagination(prev => ({
        ...prev,
        total: response.total
      }))
      
      message.success(`加载了 ${response.data.length} 个商品`)
    } catch (error) {
      console.error('Failed to load items:', error)
      message.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const categoryList = await itemManagementService.getCategories()
      setCategories(categoryList)
    } catch (error) {
      console.error('Failed to load categories:', error)
      message.error('加载分类列表失败')
    }
  }

  // 搜索商品
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setLoading(true)
      try {
        const results = await itemManagementService.searchItems(searchQuery)
        setItems(results)
        setPagination(prev => ({
          ...prev,
          total: results.length
        }))
        message.success(`找到 ${results.length} 个匹配的商品`)
      } catch (error) {
        console.error('Failed to search items:', error)
        message.error('搜索商品失败')
      } finally {
        setLoading(false)
      }
    } else {
      loadItems()
    }
  }

  // 创建商品
  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ status: 'ACTIVE' })
    setModalVisible(true)
  }

  // 编辑商品
  const handleEdit = (item: Item) => {
    setEditingItem(item)
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      status: item.status
    })
    setModalVisible(true)
  }

  // 删除商品
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await itemManagementService.deleteItem(id)
          message.success('商品删除成功')
          loadItems()
        } catch (error) {
          console.error('Failed to delete item:', error)
          message.error('删除商品失败')
        }
      }
    })
  }

  // 提交表单
  const handleSubmit = async (values: ItemFormData) => {
    try {
      if (editingItem) {
        // 更新商品
        const updatePayload: UpdateItemPayload = {
          name: values.name,
          description: values.description,
          price: values.price,
          categoryId: values.categoryId,
          status: values.status
        }
        await itemManagementService.updateItem(editingItem.id, updatePayload)
        message.success('商品更新成功')
      } else {
        // 创建商品
        const createPayload: CreateItemPayload = {
          name: values.name,
          description: values.description,
          price: values.price,
          categoryId: values.categoryId,
          status: values.status
        }
        await itemManagementService.createItem(createPayload)
        message.success('商品创建成功')
      }
      
      setModalVisible(false)
      loadItems()
    } catch (error) {
      console.error('Failed to save item:', error)
      message.error(editingItem ? '更新商品失败' : '创建商品失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: Category) => category?.name || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors = {
          ACTIVE: 'green',
          INACTIVE: 'red',
          DRAFT: 'orange'
        }
        const labels = {
          ACTIVE: '活跃',
          INACTIVE: '停用',
          DRAFT: '草稿'
        }
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Item) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 分类树形数据转换
  const categoryTreeData = categories.map(cat => ({
    title: cat.name,
    value: cat.id,
    key: cat.id
  }))

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text>请先登录以使用商品管理功能</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>商品管理</Title>
        
        {/* 搜索和操作栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input.Search
              placeholder="搜索商品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadItems}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                添加商品
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 商品表格 */}
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10
              }))
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建/编辑商品模态框 */}
      <Modal
        title={editingItem ? '编辑商品' : '创建商品'}
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
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="价格"
                rules={[
                  { required: true, message: '请输入商品价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value?.replace(/¥\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择商品状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">活跃</Option>
                  <Option value="INACTIVE">停用</Option>
                  <Option value="DRAFT">草稿</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="categoryId"
            label="商品分类"
          >
            <TreeSelect
              placeholder="请选择分类"
              allowClear
              treeData={categoryTreeData}
              showSearch
              treeDefaultExpandAll
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ItemManagement
