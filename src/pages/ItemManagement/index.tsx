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
  TreeSelect,
  Upload,
  Image
} from 'antd'
import type { RcFile } from 'antd/es/upload/interface'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  PictureOutlined
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
import { formatPrice, fromMinorUnit } from '../../utils/priceConverter'
import { getCurrencySymbol } from '../../config/currencyConfig'

const { Title, Text } = Typography
const { Option } = Select

interface ItemFormData {
  name: string
  description?: string
  basePrice: number
  categoryId?: string
  isActive: boolean
}

// 图片上传前验证
const beforeUpload = (file: RcFile): boolean | string => {
  const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!isValidType) {
    message.error('只支持 JPG、PNG、WebP 格式的图片')
    return Upload.LIST_IGNORE
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB')
    return Upload.LIST_IGNORE
  }
  return true
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

  // 图片上传状态
  const [imageUploading, setImageUploading] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined)

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
    form.setFieldsValue({ isActive: true })
    setPreviewImageUrl(undefined)
    setModalVisible(true)
  }

  // 编辑商品
  const handleEdit = (item: Item) => {
    setEditingItem(item)
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      basePrice: fromMinorUnit(item.basePrice), // 分 → 元
      categoryId: item.categoryId,
      isActive: item.isActive
    })
    setPreviewImageUrl(item.imageUrl)
    setModalVisible(true)
  }

  // 上传图片
  const handleImageUpload = async (file: RcFile) => {
    if (!editingItem) {
      message.warning('请先保存商品，然后再上传图片')
      return false
    }

    setImageUploading(true)
    try {
      const result = await itemManagementService.uploadItemImage(editingItem.id, file)
      setPreviewImageUrl(result.image.url)
      setEditingItem({ ...editingItem, imageUrl: result.image.url })
      message.success('图片上传成功')
      loadItems() // 刷新列表
    } catch (error: any) {
      console.error('Image upload failed:', error)
      message.error(error?.response?.data?.error || '图片上传失败')
    } finally {
      setImageUploading(false)
    }
    return false // 阻止默认上传行为
  }

  // 删除图片
  const handleImageDelete = async () => {
    if (!editingItem) return

    Modal.confirm({
      title: '确认删除图片',
      content: '确定要删除这张商品图片吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await itemManagementService.deleteItemImage(editingItem.id)
          setPreviewImageUrl(undefined)
          setEditingItem({ ...editingItem, imageUrl: undefined })
          message.success('图片删除成功')
          loadItems() // 刷新列表
        } catch (error: any) {
          console.error('Image delete failed:', error)
          message.error(error?.response?.data?.error || '图片删除失败')
        }
      }
    })
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
          basePrice: values.basePrice,
          categoryId: values.categoryId || undefined,
          isActive: values.isActive
        }
        await itemManagementService.updateItem(editingItem.id, updatePayload)
        message.success('商品更新成功')
      } else {
        // 创建商品
        const createPayload: CreateItemPayload = {
          name: values.name,
          description: values.description,
          basePrice: values.basePrice,
          categoryId: values.categoryId || '',
          isActive: values.isActive
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
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string) => imageUrl ? (
        <Image
          src={imageUrl}
          alt="商品图片"
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAfUlEQVR4nO3XsQ2AMAwAQPb/dGbAZSBQJJI7qT3xDwAA/KPVdl/l3DKz12q7r3JuGSIA"
        />
      ) : (
        <div style={{
          width: 50,
          height: 50,
          background: '#f5f5f5',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <PictureOutlined style={{ color: '#bbb', fontSize: 20 }} />
        </div>
      )
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
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 120,
      render: (basePrice: number) => formatPrice(basePrice)
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
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '停用'}
        </Tag>
      )
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
                name="basePrice"
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
                  prefix={getCurrencySymbol()}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="状态"
                rules={[{ required: true, message: '请选择商品状态' }]}
                valuePropName="checked"
              >
                <Select placeholder="请选择状态">
                  <Option value={true}>活跃</Option>
                  <Option value={false}>停用</Option>
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

          {/* 图片上传 - 仅在编辑模式显示 */}
          {editingItem && (
            <Form.Item label="商品图片">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {previewImageUrl ? (
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={previewImageUrl}
                      alt="商品图片"
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleImageDelete}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4
                      }}
                    />
                  </div>
                ) : (
                  <Upload
                    accept=".jpg,.jpeg,.png,.webp"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    customRequest={({ file }) => handleImageUpload(file as RcFile)}
                    disabled={imageUploading}
                  >
                    <div style={{
                      width: 120,
                      height: 120,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: '#fafafa'
                    }}>
                      {imageUploading ? <LoadingOutlined /> : <PlusOutlined />}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        {imageUploading ? '上传中...' : '上传图片'}
                      </div>
                    </div>
                  </Upload>
                )}
                <div style={{ fontSize: 12, color: '#999' }}>
                  <div>支持 JPG、PNG、WebP 格式</div>
                  <div>图片大小不超过 5MB</div>
                  <div>建议尺寸 800x800 像素</div>
                </div>
              </div>
            </Form.Item>
          )}

          {!editingItem && (
            <div style={{
              padding: '12px 16px',
              background: '#f6f6f6',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 13,
              color: '#666'
            }}>
              💡 提示：保存商品后可以上传图片
            </div>
          )}

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
