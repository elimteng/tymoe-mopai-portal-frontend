import React, { useState, useEffect } from 'react'
import { Table, Button, message, Space, Tag, Typography, Alert, Card } from 'antd'
import { CalculatorOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getItems,
  calculateBatchItemTax,
  type Item,
  type TaxCalculationResult
} from '../../services/item-management'

const { Title, Text } = Typography

interface BatchTaxCalculationProps {
  regionCode: string
}

interface ItemWithTax extends Item {
  taxResult?: TaxCalculationResult
}

/**
 * 批量税费计算组件
 * 批量计算多个商品的税后价格
 */
const BatchTaxCalculation: React.FC<BatchTaxCalculationProps> = ({ regionCode }) => {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [items, setItems] = useState<ItemWithTax[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 加载商品列表
  const loadItems = async () => {
    setLoading(true)
    try {
      const response = await getItems({ isActive: true, limit: 100 })
      setItems(response.data)
    } catch (error: any) {
      message.error(`加载商品失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // 批量计算税费
  const handleBatchCalculate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要计算的商品')
      return
    }

    setCalculating(true)
    try {
      const itemIds = selectedRowKeys as string[]
      const results = await calculateBatchItemTax(itemIds, regionCode)

      // 更新商品列表，添加税费计算结果
      const updatedItems = items.map(item => {
        const taxResult = results.find(r => r.itemId === item.id)
        return taxResult ? { ...item, taxResult } : item
      })

      setItems(updatedItems)
      message.success(`成功计算 ${results.length} 个商品的税费`)
    } catch (error: any) {
      message.error(`批量计算失败: ${error.message}`)
    } finally {
      setCalculating(false)
    }
  }

  // 表格列定义
  const columns: ColumnsType<ItemWithTax> = [
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
      render: (price: number) => (
        <Text strong>${(price / 100).toFixed(2)}</Text>
      )
    },
    {
      title: '税费',
      key: 'tax',
      width: 120,
      render: (_, record: ItemWithTax) => {
        if (!record.taxResult) {
          return <Tag>未计算</Tag>
        }
        return (
          <Text type="danger" strong>
            {record.taxResult.totalTaxDisplay}
          </Text>
        )
      }
    },
    {
      title: '含税价格',
      key: 'finalPrice',
      width: 120,
      render: (_, record: ItemWithTax) => {
        if (!record.taxResult) {
          return <Tag>未计算</Tag>
        }
        return (
          <Text type="success" strong style={{ fontSize: '16px' }}>
            {record.taxResult.finalPriceDisplay}
          </Text>
        )
      }
    },
    {
      title: '税率明细',
      key: 'taxDetails',
      render: (_, record: ItemWithTax) => {
        if (!record.taxResult) {
          return <Tag>未计算</Tag>
        }
        return (
          <Space direction="vertical" size="small">
            {record.taxResult.taxes.map((tax, idx) => (
              <div key={idx}>
                <Tag color="blue">{tax.taxType}</Tag>
                <Text>{tax.taxName}: </Text>
                <Text strong>{tax.amountDisplay}</Text>
                <Text type="secondary"> ({(tax.rate * 100).toFixed(2)}%)</Text>
              </div>
            ))}
          </Space>
        )
      }
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    }
  }

  return (
    <div>
      <Alert
        message="批量税费计算说明"
        description="选择多个商品后，可以一次性计算它们在指定地区的税后价格。计算结果会显示每个商品的税费明细和最终价格。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<CalculatorOutlined />}
          onClick={handleBatchCalculate}
          loading={calculating}
          disabled={selectedRowKeys.length === 0}
        >
          批量计算税费 ({selectedRowKeys.length} 个商品)
        </Button>
        <Button
          icon={<SearchOutlined />}
          onClick={loadItems}
        >
          刷新商品列表
        </Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={items}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 个商品`
        }}
      />

      {/* 统计信息 */}
      {items.some(item => item.taxResult) && (
        <Card style={{ marginTop: 16 }}>
          <Title level={5}>计算统计</Title>
          <Space direction="vertical" size="small">
            <Text>
              已计算商品数: <Text strong>{items.filter(item => item.taxResult).length}</Text>
            </Text>
            <Text>
              总税费: <Text strong type="danger">
                ${(items
                  .filter(item => item.taxResult)
                  .reduce((sum, item) => sum + (item.taxResult?.totalTax || 0), 0) / 100).toFixed(2)}
              </Text>
            </Text>
            <Text>
              总含税价格: <Text strong type="success">
                ${(items
                  .filter(item => item.taxResult)
                  .reduce((sum, item) => sum + (item.taxResult?.finalPrice || 0), 0) / 100).toFixed(2)}
              </Text>
            </Text>
          </Space>
        </Card>
      )}
    </div>
  )
}

export default BatchTaxCalculation
