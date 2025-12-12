import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  message,
  Space,
  Empty,
  Tag,
  Select,
  Spin,
  Drawer,
  List
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { uberService, MenuCategory, MenuCategoryItem } from '@/services/uber'
import { itemManagementService } from '@/services/item-management'

interface MenuCategoryManagementProps {
  integrationId: string
  tenantId: string
}

interface POSItem {
  id: string
  name: string
  categoryId?: string
  categoryName?: string
}

/**
 * 菜单分类管理组件（简化版）
 * 允许用户为 Uber 创建分类并配置商品
 */
const MenuCategoryManagement: React.FC<MenuCategoryManagementProps> = ({
  integrationId,
  tenantId: propTenantId
}) => {
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [categoryItems, setCategoryItems] = useState<MenuCategoryItem[]>([])
  const [posItems, setPosItems] = useState<POSItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // 获取租户 ID
  const tenantId = propTenantId || localStorage.getItem('organization_id') || ''

  // 加载分类列表
  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await uberService.getMenuCategories(integrationId)
      setCategories(data)
    } catch (error: any) {
      message.error(error.message || '加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载 POS 商品
  const loadPosItems = async () => {
    try {
      setItemsLoading(true)
      const items = await itemManagementService.getItems(tenantId)
      setPosItems(items || [])
    } catch (error: any) {
      message.error(error.message || '加载商品失败')
    } finally {
      setItemsLoading(false)
    }
  }

  // 加载分类商品
  const loadCategoryItems = async (categoryId: string) => {
    try {
      setItemsLoading(true)
      const items = await uberService.getMenuCategoryItems(categoryId)
      setCategoryItems(items)
      setSelectedItems(items.map(item => item.posItemId))
    } catch (error: any) {
      message.error(error.message || '加载分类商品失败')
    } finally {
      setItemsLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    loadCategories()
    loadPosItems()
  }, [integrationId])

  // 打开分类编辑模态框
  const handleOpenModal = (category?: MenuCategory) => {
    setEditingCategory(category || null)
    if (category) {
      form.setFieldsValue({
        name: category.name,
        displayOrder: category.displayOrder
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields()

      if (editingCategory) {
        // 更新
        await uberService.updateMenuCategory(
          editingCategory.id,
          values.name,
          values.displayOrder
        )
        message.success('更新成功')
      } else {
        // 创建
        await uberService.createMenuCategory(
          integrationId,
          values.name,
          values.displayOrder
        )
        message.success('创建成功')
      }

      setModalVisible(false)
      loadCategories()
    } catch (error: any) {
      message.error(error.message || '保存失败')
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await uberService.deleteMenuCategory(categoryId)
      message.success('删除成功')
      loadCategories()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 打开分类商品管理抽屉
  const handleOpenItemsDrawer = async (category: MenuCategory) => {
    setSelectedCategory(category)
    await loadCategoryItems(category.id)
    setDrawerVisible(true)
  }

  // 添加商品到分类
  const handleAddItems = async () => {
    if (!selectedCategory || selectedItems.length === 0) {
      message.warning('请选择商品')
      return
    }

    try {
      // 添加新的商品（排除已有的）
      const existingItemIds = categoryItems.map(item => item.posItemId)
      const newItemIds = selectedItems.filter(id => !existingItemIds.includes(id))

      for (const itemId of newItemIds) {
        const item = posItems.find(p => p.id === itemId)
        await uberService.addItemToMenuCategory(
          selectedCategory.id,
          itemId,
          item?.name,
          categoryItems.length + newItemIds.indexOf(itemId)
        )
      }

      message.success(`添加了 ${newItemIds.length} 个商品`)
      await loadCategoryItems(selectedCategory.id)
      setSelectedItems([])
    } catch (error: any) {
      message.error(error.message || '添加失败')
    }
  }

  // 移除商品
  const handleRemoveItem = async (itemId: string) => {
    try {
      await uberService.removeItemFromMenuCategory(itemId)
      message.success('移除成功')
      await loadCategoryItems(selectedCategory!.id)
    } catch (error: any) {
      message.error(error.message || '移除失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '商品数',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>
    },
    {
      title: '显示顺序',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: MenuCategory) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => handleOpenItemsDrawer(record)}
          >
            配置商品
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="菜单分类管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            创建分类
          </Button>
        }
      >
        {categories.length === 0 ? (
          <Empty description="还没有创建任何分类。点击「创建分类」按钮开始。" />
        ) : (
          <Table
            columns={columns}
            dataSource={categories}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: total => `共 ${total} 个分类`
            }}
          />
        )}
      </Card>

      {/* 分类编辑模态框 */}
      <Modal
        title={editingCategory ? '编辑分类' : '创建分类'}
        open={modalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：热销商品、新品上市" />
          </Form.Item>

          <Form.Item
            label="显示顺序"
            name="displayOrder"
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分类商品管理抽屉 */}
      <Drawer
        title={selectedCategory ? `管理分类：${selectedCategory.name}` : '管理分类商品'}
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedCategory && (
          <div>
            {/* 已添加的商品列表 */}
            <div style={{ marginBottom: 24 }}>
              <h4>已添加的商品 ({categoryItems.length})</h4>
              {categoryItems.length === 0 ? (
                <Empty description="暂无商品" style={{ marginTop: 16 }} />
              ) : (
                <List
                  size="small"
                  dataSource={categoryItems}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          移除
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={item.posItemName || item.posItemId}
                        description={`显示顺序: ${item.displayOrder}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            {/* 添加商品 */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <h4>添加商品</h4>
              <Spin spinning={itemsLoading}>
                <Select
                  mode="multiple"
                  placeholder="选择要添加的商品"
                  style={{ width: '100%', marginBottom: 16 }}
                  value={selectedItems}
                  onChange={setSelectedItems}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={posItems
                    .filter(item => !categoryItems.find(ci => ci.posItemId === item.id))
                    .map(item => ({
                      label: item.name,
                      value: item.id
                    }))}
                />
              </Spin>
              <Button
                type="primary"
                block
                onClick={handleAddItems}
                disabled={selectedItems.length === 0}
              >
                添加选中的商品
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default MenuCategoryManagement
