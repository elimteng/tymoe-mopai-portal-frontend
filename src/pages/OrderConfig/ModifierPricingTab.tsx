import React, { useState, useEffect } from 'react'
import {
  Card,
  Select,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  InputNumber,
  Form,
  Typography,
  Empty,
  Spin,
  Tooltip
} from 'antd'
import {
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { getCurrencySymbol } from '../../config/currencyConfig'
import {
  queryModifierSourcePrices,
  batchSaveModifierSourcePrices,
  deleteModifierSourcePrice,
  type ModifierPriceData
} from '../../services/channel-pricing'
import { itemManagementService } from '../../services/item-management'

const { Option } = Select
const { Text, Title } = Typography

interface ModifierPricingTabProps {
  sourceCode: string
  sourceName: string
}

interface ModifierPriceRow extends ModifierPriceData {
  key: string
  modified?: boolean
  newSourcePrice?: number
}

const ModifierPricingTab: React.FC<ModifierPricingTabProps> = ({
  sourceCode,
  sourceName
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [modifierPrices, setModifierPrices] = useState<ModifierPriceRow[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState<ModifierPriceRow | null>(null)
  const [form] = Form.useForm()

  // 加载商品列表
  useEffect(() => {
    loadItems()
  }, [])

  // 当选择商品时，加载该商品的修饰符价格
  useEffect(() => {
    if (selectedItemId && sourceCode) {
      loadModifierPrices()
    }
  }, [selectedItemId, sourceCode])

  const loadItems = async () => {
    try {
      setLoading(true)
      const response = await itemManagementService.getItems({ limit: 1000 })
      setItems(response.data || [])
    } catch (error) {
      message.error('加载商品列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadModifierPrices = async () => {
    try {
      setLoading(true)
      const response = await queryModifierSourcePrices(sourceCode, selectedItemId)

      if (response && response.prices) {
        const rows: ModifierPriceRow[] = response.prices.map((price, index) => ({
          ...price,
          key: `${price.itemId}-${price.modifierOptionId}-${index}`
        }))
        setModifierPrices(rows)
      } else {
        setModifierPrices([])
      }
    } catch (error) {
      message.error('加载修饰符价格失败')
      console.error(error)
      setModifierPrices([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrice = (record: ModifierPriceRow) => {
    setEditingPrice(record)
    form.setFieldsValue({
      sourcePrice: record.sourcePrice ?? record.finalPrice
    })
    setEditModalVisible(true)
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingPrice) {
        const newPrice = values.sourcePrice

        // 更新本地数据
        setModifierPrices(prev => prev.map(item => {
          if (item.key === editingPrice.key) {
            return {
              ...item,
              newSourcePrice: newPrice,
              modified: true
            }
          }
          return item
        }))

        setEditModalVisible(false)
        setEditingPrice(null)
        form.resetFields()
      }
    })
  }

  const handleDeletePrice = async (record: ModifierPriceRow) => {
    try {
      await deleteModifierSourcePrice(
        sourceCode,
        record.itemId,
        record.modifierOptionId
      )
      message.success('删除成功')
      loadModifierPrices()
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  const handleSaveAll = async () => {
    const modifiedPrices = modifierPrices.filter(p => p.modified && p.newSourcePrice !== undefined)

    if (modifiedPrices.length === 0) {
      message.info('没有修改需要保存')
      return
    }

    try {
      setSaving(true)

      const prices = modifiedPrices.map(p => ({
        itemId: p.itemId,
        modifierOptionId: p.modifierOptionId,
        price: p.newSourcePrice!
      }))

      await batchSaveModifierSourcePrices(sourceCode, prices)
      message.success(`成功保存 ${prices.length} 个修饰符价格`)

      // 重新加载数据
      await loadModifierPrices()
    } catch (error) {
      message.error('保存失败')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const getPriceSourceColor = (source: string) => {
    switch (source) {
      case 'source':
        return 'green'
      case 'item':
        return 'orange'
      case 'default':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPriceSourceText = (source: string) => {
    switch (source) {
      case 'source':
        return '渠道定价'
      case 'item':
        return '商品定价'
      case 'default':
        return '默认价格'
      default:
        return source
    }
  }

  const columns: ColumnsType<ModifierPriceRow> = [
    {
      title: '修饰符组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 150,
      render: (text) => <Text strong>{text || '-'}</Text>
    },
    {
      title: '选项名称',
      dataIndex: 'optionName',
      key: 'optionName',
      width: 150,
      render: (text) => <Text>{text || '-'}</Text>
    },
    {
      title: (
        <Space>
          价格优先级
          <Tooltip title="价格计算优先级：渠道价格 > 商品级价格 > 默认价格">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      key: 'prices',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认: ¥{record.defaultPrice?.toFixed(2) || '0.00'}
          </Text>
          {record.itemPrice !== undefined && record.itemPrice !== null && (
            <Text type="warning" style={{ fontSize: 12 }}>
              商品级: ¥{record.itemPrice.toFixed(2)}
            </Text>
          )}
          {(record.sourcePrice !== undefined && record.sourcePrice !== null) || record.modified ? (
            <Text type="success" style={{ fontSize: 12 }}>
              渠道价: ¥{(record.newSourcePrice ?? record.sourcePrice ?? 0).toFixed(2)}
              {record.modified && <Tag color="orange" style={{ marginLeft: 8 }}>已修改</Tag>}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              渠道价: 未设置
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '最终价格',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 120,
      render: (price, record) => {
        const displayPrice = record.modified && record.newSourcePrice !== undefined
          ? record.newSourcePrice
          : price
        return (
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              ¥{displayPrice?.toFixed(2) || '0.00'}
            </Text>
            <Tag color={getPriceSourceColor(record.priceSource)}>
              {getPriceSourceText(record.priceSource)}
            </Tag>
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPrice(record)}
          >
            设置渠道价
          </Button>
          {record.sourcePrice !== undefined && record.sourcePrice !== null && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除此修饰符的渠道价格吗？',
                  onOk: () => handleDeletePrice(record)
                })
              }}
            >
              删除
            </Button>
          )}
        </Space>
      )
    }
  ]

  const modifiedCount = modifierPrices.filter(p => p.modified).length

  return (
    <div>
      <Card
        title={
          <Space>
            <DollarOutlined />
            <Title level={4} style={{ margin: 0 }}>
              修饰符渠道定价
            </Title>
            <Tag color="blue">{sourceName}</Tag>
          </Space>
        }
        extra={
          modifiedCount > 0 && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveAll}
            >
              保存所有修改 ({modifiedCount})
            </Button>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 商品选择 */}
          <Card size="small" title="选择商品">
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="请选择商品以查看其修饰符价格"
              value={selectedItemId || undefined}
              onChange={setSelectedItemId}
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
              loading={loading}
            >
              {items.map(item => (
                <Option key={item.id} value={item.id}>
                  {item.name} (¥{item.basePrice})
                </Option>
              ))}
            </Select>
          </Card>

          {/* 修饰符价格表格 */}
          {selectedItemId ? (
            loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin tip="加载中..." />
              </div>
            ) : modifierPrices.length > 0 ? (
              <Table
                columns={columns}
                dataSource={modifierPrices}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <Empty description="该商品没有关联的修饰符" />
            )
          ) : (
            <Empty description="请先选择一个商品" />
          )}
        </Space>
      </Card>

      {/* 编辑价格模态框 */}
      <Modal
        title="设置修饰符渠道价格"
        open={editModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingPrice(null)
          form.resetFields()
        }}
        okText="确定"
        cancelText="取消"
      >
        {editingPrice && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">修饰符组：</Text>
              <Text strong>{editingPrice.groupName}</Text>
            </div>
            <div>
              <Text type="secondary">选项名称：</Text>
              <Text strong>{editingPrice.optionName}</Text>
            </div>

            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  默认价格: ¥{editingPrice.defaultPrice?.toFixed(2) || '0.00'}
                </Text>
                {editingPrice.itemPrice !== undefined && editingPrice.itemPrice !== null && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    商品级价格: ¥{editingPrice.itemPrice.toFixed(2)}
                  </Text>
                )}
                {editingPrice.sourcePrice !== undefined && editingPrice.sourcePrice !== null && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    当前渠道价: ¥{editingPrice.sourcePrice.toFixed(2)}
                  </Text>
                )}
              </Space>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                label="新的渠道价格"
                name="sourcePrice"
                rules={[
                  { required: true, message: '请输入渠道价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                  prefix={getCurrencySymbol()}
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default ModifierPricingTab
