import React, { useState, useEffect } from 'react'
import { Table, Tag, Typography, Space, Alert, Spin, Modal, Form, InputNumber, Input, Button, message } from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getTaxRates,
  getTaxClasses,
  createTaxRateOverride,
  type TaxRate,
  type TaxClass
} from '../../services/item-management'

const { Title, Text } = Typography

interface TaxRateListProps {
  regionCode: string
}

/**
 * 税率列表组件
 * 显示某地区的所有税率，包括系统预设和租户覆盖
 */
const TaxRateList: React.FC<TaxRateListProps> = ({ regionCode }) => {
  const [loading, setLoading] = useState(false)
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([])
  const [overrideModalVisible, setOverrideModalVisible] = useState(false)
  const [selectedRate, setSelectedRate] = useState<TaxRate | null>(null)
  const [form] = Form.useForm()

  // 加载税率数据
  const loadTaxRates = async () => {
    if (!regionCode) return

    setLoading(true)
    try {
      const [rates, classes] = await Promise.all([
        getTaxRates(regionCode),
        getTaxClasses(regionCode)
      ])
      setTaxRates(rates)
      setTaxClasses(classes)
    } catch (error: any) {
      message.error(`加载税率失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaxRates()
  }, [regionCode])

  // 打开覆盖税率对话框
  const handleOverrideClick = (rate: TaxRate) => {
    setSelectedRate(rate)
    form.setFieldsValue({
      rate: rate.rate,
      overrideReason: ''
    })
    setOverrideModalVisible(true)
  }

  // 提交税率覆盖
  const handleOverrideSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!selectedRate) return

      await createTaxRateOverride({
        regionCode,
        taxType: selectedRate.taxType,
        rate: values.rate,
        basedOnDefaultId: selectedRate.id,
        overrideReason: values.overrideReason
      })

      message.success('税率覆盖设置成功')
      setOverrideModalVisible(false)
      loadTaxRates() // 重新加载数据
    } catch (error: any) {
      message.error(`设置税率覆盖失败: ${error.message}`)
    }
  }

  // 税率表格列定义
  const taxRateColumns: ColumnsType<TaxRate> = [
    {
      title: '税率名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '税种',
      dataIndex: 'taxType',
      key: 'taxType',
      width: 120,
      render: (taxType: string) => (
        <Tag color="blue">{taxType}</Tag>
      )
    },
    {
      title: '税率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (rate: number) => (
        <Text strong>{(rate * 100).toFixed(2)}%</Text>
      )
    },
    {
      title: '食品免税',
      dataIndex: 'foodExempt',
      key: 'foodExempt',
      width: 100,
      align: 'center',
      render: (foodExempt: boolean) => (
        foodExempt ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        )
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source: string, record: TaxRate) => (
        <Space direction="vertical" size="small">
          <Tag color={source === 'SYSTEM_DEFAULT' ? 'default' : 'orange'}>
            {source === 'SYSTEM_DEFAULT' ? '系统预设' : '租户覆盖'}
          </Tag>
          {record.isOverridden && record.overrideReason && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <InfoCircleOutlined /> {record.overrideReason}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '失效日期',
      dataIndex: 'expiresDate',
      key: 'expiresDate',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: TaxRate) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOverrideClick(record)}
        >
          覆盖
        </Button>
      )
    }
  ]

  // 税类表格列定义
  const taxClassColumns: ColumnsType<TaxClass> = [
    {
      title: '税类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '包含的税率',
      dataIndex: 'rates',
      key: 'rates',
      render: (rates: any[]) => (
        <Space direction="vertical" size="small">
          {rates.map((rate, index) => (
            <div key={index}>
              <Tag color="blue">{rate.taxRate.taxType}</Tag>
              <Text>{rate.taxRate.name}</Text>
              <Text strong> ({(rate.taxRate.rate * 100).toFixed(2)}%)</Text>
              {rate.compoundPrevious && (
                <Tag color="orange" style={{ marginLeft: 8 }}>复合税</Tag>
              )}
            </div>
          ))}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 说明信息 */}
        <Alert
          message="税率说明"
          description={
            <div>
              <p>• <strong>系统预设税率</strong>：由系统维护的标准税率，会随官方税率变化自动更新</p>
              <p>• <strong>租户覆盖</strong>：租户可以自定义税率覆盖系统预设，适用于特殊场景</p>
              <p>• <strong>食品免税</strong>：某些地区的食品类商品享受税率豁免</p>
              <p>• <strong>税类</strong>：预定义的税率组合，可直接应用到商品</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 税率列表 */}
        <div>
          <Title level={4}>税率列表</Title>
          <Table
            columns={taxRateColumns}
            dataSource={taxRates}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>

        {/* 税类列表 */}
        <div style={{ marginTop: 24 }}>
          <Title level={4}>税类列表</Title>
          <Table
            columns={taxClassColumns}
            dataSource={taxClasses}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>

        {/* 税率覆盖对话框 */}
        <Modal
          title={`覆盖税率: ${selectedRate?.name}`}
          open={overrideModalVisible}
          onOk={handleOverrideSubmit}
          onCancel={() => setOverrideModalVisible(false)}
          width={500}
        >
          <Alert
            message="注意"
            description="覆盖系统预设税率后，该地区的此税种将使用您设置的自定义税率，而不是系统维护的标准税率。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item label="原税率">
              <Text strong>{selectedRate ? `${(selectedRate.rate * 100).toFixed(2)}%` : ''}</Text>
            </Form.Item>

            <Form.Item
              label="新税率 (%)"
              name="rate"
              rules={[
                { required: true, message: '请输入税率' },
                { type: 'number', min: 0, max: 100, message: '税率必须在 0-100 之间' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="输入税率 (例如: 13 表示 13%)"
                precision={2}
                min={0}
                max={100}
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item
              label="覆盖原因"
              name="overrideReason"
              rules={[{ required: true, message: '请说明覆盖原因' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="请说明为什么需要覆盖系统预设税率"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Spin>
  )
}

export default TaxRateList
