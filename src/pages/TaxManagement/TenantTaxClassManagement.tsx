import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Tag, Typography, Alert } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getTaxClasses,
  getTaxRates,
  createTenantTaxClass,
  type TaxClass,
  type TaxRate,
  type CreateTenantTaxClassPayload
} from '../../services/item-management'

const { Text } = Typography

interface TenantTaxClassManagementProps {
  regionCode: string
}

/**
 * 租户自定义税类管理组件
 * 允许租户创建和管理自定义税类
 */
const TenantTaxClassManagement: React.FC<TenantTaxClassManagementProps> = ({ regionCode }) => {
  const [loading, setLoading] = useState(false)
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([])
  const [availableTaxRates, setAvailableTaxRates] = useState<TaxRate[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 加载税类和税率数据
  const loadData = async () => {
    if (!regionCode) return

    setLoading(true)
    try {
      const [classes, rates] = await Promise.all([
        getTaxClasses(regionCode),
        getTaxRates(regionCode)
      ])
      setTaxClasses(classes)
      setAvailableTaxRates(rates)
    } catch (error: any) {
      message.error(`加载数据失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [regionCode])

  // 打开创建对话框
  const handleCreateClick = () => {
    form.resetFields()
    setModalVisible(true)
  }

  // 提交创建税类
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 构建税率配置
      const rates = values.rates.map((rateConfig: any, index: number) => ({
        taxType: rateConfig.taxType,
        rate: rateConfig.rate / 100, // 转换为小数
        applyOrder: index + 1,
        compoundPrevious: rateConfig.compoundPrevious || false
      }))

      const payload: CreateTenantTaxClassPayload = {
        name: values.name,
        description: values.description,
        regionCode,
        rates
      }

      await createTenantTaxClass(payload)
      message.success('自定义税类创建成功')
      setModalVisible(false)
      loadData() // 重新加载数据
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error(`创建失败: ${error.message}`)
    }
  }

  // 税类表格列定义
  const columns: ColumnsType<TaxClass> = [
    {
      title: '税类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250
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
    },
    {
      title: '类型',
      key: 'type',
      width: 120,
      render: () => (
        <Tag color="purple">租户自定义</Tag>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          创建自定义税类
        </Button>
      </Space>

      <Alert
        message="租户自定义税类说明"
        description="您可以根据业务需求创建自定义税类组合。自定义税类仅在当前租户下可用，不会影响系统预设税类。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={taxClasses}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      {/* 创建税类对话框 */}
      <Modal
        title="创建自定义税类"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="税类名称"
            name="name"
            rules={[{ required: true, message: '请输入税类名称' }]}
          >
            <Input placeholder="例如: 特殊商品税类" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea
              rows={2}
              placeholder="描述该税类的用途和适用场景"
            />
          </Form.Item>

          <Form.Item label="税率配置">
            <Alert
              message="税率计算顺序"
              description="税率将按照添加顺序依次计算。如果勾选'复合税'，该税率将基于前面税率计算后的金额计算。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.List
              name="rates"
              rules={[
                {
                  validator: async (_, rates) => {
                    if (!rates || rates.length === 0) {
                      return Promise.reject(new Error('至少添加一个税率'))
                    }
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'taxType']}
                        rules={[{ required: true, message: '请选择税种' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="选择税种"
                          style={{ width: 150 }}
                        >
                          {availableTaxRates.map(rate => (
                            <Select.Option key={rate.taxType} value={rate.taxType}>
                              {rate.taxType}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'rate']}
                        rules={[
                          { required: true, message: '请输入税率' },
                          { type: 'number', min: 0, max: 100, message: '税率必须在 0-100 之间' }
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="税率"
                          style={{ width: 120 }}
                          precision={2}
                          min={0}
                          max={100}
                          addonAfter="%"
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'compoundPrevious']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="是否复合税"
                          style={{ width: 120 }}
                        >
                          <Select.Option value={false}>普通税</Select.Option>
                          <Select.Option value={true}>复合税</Select.Option>
                        </Select>
                      </Form.Item>

                      <Button
                        type="link"
                        danger
                        onClick={() => remove(field.name)}
                      >
                        删除
                      </Button>
                    </Space>
                  ))}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加税率
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TenantTaxClassManagement
