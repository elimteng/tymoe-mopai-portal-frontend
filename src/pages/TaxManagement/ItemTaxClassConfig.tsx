import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Select, message, Space, Tag, Typography, Alert, Input } from 'antd'
import { SettingOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getItems,
  getTaxClasses,
  getItemTaxClass,
  assignItemTaxClass,
  calculateItemTax,
  type Item,
  type TaxClass,
  type ItemTaxClass,
  type TaxCalculationResult
} from '../../services/item-management'
import { formatPrice, fromMinorUnit } from '../../utils/priceConverter'

const { Title, Text } = Typography

interface ItemTaxClassConfigProps {
  regionCode: string
}

interface ItemWithTaxInfo extends Item {
  taxClassId?: string
  taxClassName?: string
  calculatedTax?: number
  finalPrice?: number
}

/**
 * 商品税类配置组件
 * 为商品分配税类并计算含税价格
 */
const ItemTaxClassConfig: React.FC<ItemTaxClassConfigProps> = ({ regionCode }) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ItemWithTaxInfo[]>([])
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemWithTaxInfo | null>(null)
  const [selectedTaxClassId, setSelectedTaxClassId] = useState<string>()
  const [searchText, setSearchText] = useState<string>('')
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null)

  // 加载商品列表
  const loadItems = async () => {
    setLoading(true)
    try {
      const response = await getItems({ isActive: true, limit: 100 })
      const itemsWithTax: ItemWithTaxInfo[] = []

      // 为每个商品加载税类信息
      for (const item of response.data) {
        try {
          const taxInfo = await getItemTaxClass(item.id)
          itemsWithTax.push({
            ...item,
            taxClassId: taxInfo.taxClassId,
            taxClassName: taxInfo.taxClassName
          })
        } catch {
          // 如果没有配置税类，直接添加商品
          itemsWithTax.push(item)
        }
      }

      setItems(itemsWithTax)
    } catch (error: any) {
      message.error(`加载商品失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 加载税类列表
  const loadTaxClasses = async () => {
    if (!regionCode) return

    try {
      const classes = await getTaxClasses(regionCode)
      setTaxClasses(classes)
    } catch (error: any) {
      message.error(`加载税类失败: ${error.message}`)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    loadTaxClasses()
  }, [regionCode])

  // 打开配置对话框
  const handleConfigClick = (item: ItemWithTaxInfo) => {
    setSelectedItem(item)
    setSelectedTaxClassId(item.taxClassId)
    setTaxResult(null)
    setModalVisible(true)
  }

  // 计算税费
  const handleCalculateTax = async () => {
    if (!selectedItem) return

    try {
      const result = await calculateItemTax(selectedItem.id, regionCode)
      setTaxResult(result)
    } catch (error: any) {
      message.error(`计算税费失败: ${error.message}`)
    }
  }

  // 保存税类配置
  const handleSave = async () => {
    if (!selectedItem || !selectedTaxClassId) {
      message.warning('请选择税类')
      return
    }

    try {
      await assignItemTaxClass(selectedItem.id, { taxClassId: selectedTaxClassId })
      message.success('税类配置成功')
      setModalVisible(false)
      loadItems() // 重新加载商品列表
    } catch (error: any) {
      message.error(`配置失败: ${error.message}`)
    }
  }

  // 筛选商品
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  )

  // 表格列定义
  const columns: ColumnsType<ItemWithTaxInfo> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '基础价格',
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 120,
      render: (price: number) => <Text strong>{formatPrice(price)}</Text>
    },
    {
      title: '税类',
      dataIndex: 'taxClassName',
      key: 'taxClassName',
      width: 150,
      render: (taxClassName?: string) =>
        taxClassName ? (
          <Tag color="blue">{taxClassName}</Tag>
        ) : (
          <Tag>未配置</Tag>
        )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: ItemWithTaxInfo) => (
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={() => handleConfigClick(record)}
        >
          配置税类
        </Button>
      )
    }
  ]

  return (
    <div>
      {/* 搜索栏 */}
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索商品名称"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={loadItems}>
          刷新
        </Button>
      </Space>

      {/* 商品列表 */}
      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 个商品`
        }}
      />

      {/* 配置对话框 */}
      <Modal
        title={`配置商品税类: ${selectedItem?.name}`}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 商品基本信息 */}
          <div>
            <Text type="secondary">商品基础价格：</Text>
            <Text strong style={{ fontSize: '16px', marginLeft: 8 }}>
              {selectedItem && formatPrice(selectedItem.basePrice)}
            </Text>
          </div>

          {/* 税类选择 */}
          <div>
            <Text strong>选择税类：</Text>
            <Select
              value={selectedTaxClassId}
              onChange={setSelectedTaxClassId}
              style={{ width: '100%', marginTop: 8 }}
              placeholder="请选择税类"
            >
              {taxClasses.map(taxClass => (
                <Select.Option key={taxClass.id} value={taxClass.id}>
                  <div>
                    <Text strong>{taxClass.name}</Text>
                    {taxClass.description && (
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                        ({taxClass.description})
                      </Text>
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {taxClass.rates.map((rate, idx) => (
                      <Tag key={idx} color="blue" style={{ marginRight: 4 }}>
                        {rate.taxType}: {(rate.rate * 100).toFixed(2)}%
                      </Tag>
                    ))}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* 计算税费按钮 */}
          <Button
            type="dashed"
            onClick={handleCalculateTax}
            disabled={!selectedTaxClassId}
            block
          >
            预览税费计算
          </Button>

          {/* 税费计算结果 */}
          {taxResult && (
            <Alert
              message="税费计算结果"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>基础价格：</Text>
                    <Text strong>{taxResult.basePriceDisplay}</Text>
                  </div>

                  {taxResult.taxes.map((tax, idx) => (
                    <div key={idx}>
                      <Text>{tax.taxName} ({tax.taxType})：</Text>
                      <Text strong>{tax.amountDisplay}</Text>
                      <Text type="secondary"> ({(tax.rate * 100).toFixed(2)}%)</Text>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                    <Text>总税费：</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>{taxResult.totalTaxDisplay}</Text>
                  </div>

                  <div>
                    <Text>最终价格：</Text>
                    <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                      {taxResult.finalPriceDisplay}
                    </Text>
                  </div>
                </Space>
              }
              type="success"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  )
}

export default ItemTaxClassConfig
