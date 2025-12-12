import React, { useState, useEffect } from 'react'
import {
  Space,
  Button,
  Tag,
  message,
  Modal,
  InputNumber,
  Form,
  Typography,
  Spin,
  Tooltip,
  Collapse
} from 'antd'
import {
  DownOutlined,
  UpOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getCurrencySymbol } from '../../config/currencyConfig'
import {
  queryCustomOptionSourcePrices,
  batchSaveCustomOptionSourcePrices,
  deleteCustomOptionSourcePrice,
  type CustomOptionPriceData
} from '../../services/channel-pricing'
import { itemManagementService } from '../../services/item-management'

const { Text } = Typography
const { Panel } = Collapse

interface CustomOptionPricingRowProps {
  itemId: string
  itemName: string
  sourceCode: string
}

interface CustomOptionPriceRow extends CustomOptionPriceData {
  key: string
  modified?: boolean
  newSourcePrice?: number
}

/**
 * 自定义选项定价行组件
 * 集成在商品定价卡片中，可展开/收起显示商品的自定义选项价格
 */
const CustomOptionPricingRow: React.FC<CustomOptionPricingRowProps> = ({
  itemId,
  itemName,
  sourceCode
}) => {
  const { t } = useTranslation()
  const tk = (key: string) => t(`pages.orderConfig.${key}`)

  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customOptionPrices, setCustomOptionPrices] = useState<CustomOptionPriceRow[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState<CustomOptionPriceRow | null>(null)
  const [form] = Form.useForm()
  const [hasModifiers, setHasModifiers] = useState<boolean | null>(null)

  // 展开时加载数据
  useEffect(() => {
    if (expanded && itemId && sourceCode) {
      loadCustomOptionPrices()
    }
  }, [expanded, itemId, sourceCode])

  const loadCustomOptionPrices = async () => {
    try {
      setLoading(true)
      
      // 首先检查商品是否有关联的修饰符组
      const itemModifiers = await itemManagementService.getItemModifiers(itemId)
      console.log(`📦 商品 ${itemName} (${itemId}) 关联的修饰符组:`, itemModifiers)
      
      if (!itemModifiers || itemModifiers.length === 0) {
        console.warn(`⚠️ 商品 ${itemName} 没有关联任何修饰符组`)
        setHasModifiers(false)
        setCustomOptionPrices([])
        setLoading(false)
        return
      }
      
      setHasModifiers(true)
      
      // 🔥 关键修复：使用价格计算API来获取完整的修饰符选项及其价格
      // 构建一个包含所有修饰符选项的请求，用于获取完整的价格信息
      const allOptions: Array<{ optionId: string; quantity: number }> = []
      
      // 遍历所有修饰符组，收集所有选项
      for (const modifierGroup of itemModifiers) {
        if (modifierGroup.group && modifierGroup.group.options) {
          for (const option of modifierGroup.group.options) {
            allOptions.push({
              optionId: option.id,
              quantity: 1
            })
          }
        }
      }
      
      console.log(`🔍 商品 ${itemName} 的所有修饰符选项:`, allOptions)
      
      if (allOptions.length === 0) {
        console.warn(`⚠️ 商品 ${itemName} 的修饰符组没有任何选项`)
        setCustomOptionPrices([])
        setLoading(false)
        return
      }
      
      // 使用价格计算API获取每个选项的详细价格信息（包括默认价、商品价、渠道价）
      const priceCalculations = await Promise.all(
        allOptions.map(async (option) => {
          try {
            // 为每个选项单独调用价格计算API
            const { calculatePrice } = await import('../../services/channel-pricing')
            const result = await calculatePrice({
              itemId,
              sourceCode,
              customOptions: [option]
            })
            return result.customOptions[0]  // 返回该选项的价格信息
          } catch (error) {
            console.error(`❌ 计算选项 ${option.optionId} 价格失败:`, error)
            return null
          }
        })
      )
      
      console.log(`💰 商品 ${itemName} 的价格计算结果:`, priceCalculations)
      
      // 过滤掉失败的计算结果
      const validPrices = priceCalculations.filter(p => p !== null)
      
      if (validPrices.length > 0) {
        // 转换为组件需要的数据格式
        const rows: CustomOptionPriceRow[] = validPrices.map((price, index) => {
          // 从修饰符选项中查找组名
          let groupName = ''
          let optionName = price.optionName || ''
          
          for (const modifierGroup of itemModifiers) {
            if (modifierGroup.group && modifierGroup.group.options) {
              const foundOption = modifierGroup.group.options.find(opt => opt.id === price.optionId)
              if (foundOption) {
                groupName = modifierGroup.group.displayName || modifierGroup.group.name
                optionName = foundOption.displayName || foundOption.name
                break
              }
            }
          }
          
          // 根据 priceSource 确定价格来源
          let defaultPrice = price.unitPrice  // 默认使用 unitPrice
          let itemPrice: number | undefined
          let sourcePrice: number | undefined
          
          if (price.priceSource === 'default') {
            defaultPrice = price.unitPrice
          } else if (price.priceSource === 'item') {
            // 这是商品级价格，需要获取默认价格（但API没有返回，暂时使用unitPrice）
            itemPrice = price.unitPrice
            defaultPrice = price.unitPrice  // 暂时设为相同值
          } else if (price.priceSource === 'source') {
            // 这是渠道价格，需要获取默认价格和商品价格（但API没有返回）
            sourcePrice = price.unitPrice
            defaultPrice = price.unitPrice  // 暂时设为相同值
          }
          
          return {
            itemId,
            itemName,
            customOptionId: price.optionId,
            optionName,
            groupName,
            defaultPrice,
            itemPrice,
            sourcePrice,
            finalPrice: price.unitPrice,
            priceSource: price.priceSource,
            key: `${itemId}-${price.optionId}-${index}`
          }
        })
        
        setCustomOptionPrices(rows)
      } else {
        console.warn(`⚠️ 商品 ${itemName} 的自定义选项价格计算失败`)
        setCustomOptionPrices([])
      }
    } catch (error) {
      message.error(tk('loadCustomOptionPricesFailed'))
      console.error('❌ 加载自定义选项价格失败:', error)
      setCustomOptionPrices([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrice = (record: CustomOptionPriceRow) => {
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
        setCustomOptionPrices(prev => prev.map(item => {
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

  const handleDeletePrice = async (record: CustomOptionPriceRow) => {
    try {
      await deleteCustomOptionSourcePrice(
        sourceCode,
        record.itemId,
        record.customOptionId
      )
      message.success(tk('deleteCustomOptionPriceSuccess'))
      loadCustomOptionPrices()
    } catch (error) {
      message.error(tk('deleteCustomOptionPriceFailed'))
      console.error(error)
    }
  }

  const handleSaveAll = async () => {
    const modifiedPrices = customOptionPrices.filter(p => p.modified && p.newSourcePrice !== undefined)

    if (modifiedPrices.length === 0) {
      message.info(tk('noChanges'))
      return
    }

    try {
      setSaving(true)

      const prices = modifiedPrices.map(p => ({
        itemId: p.itemId,
        customOptionId: p.customOptionId,
        price: p.newSourcePrice!
      }))

      await batchSaveCustomOptionSourcePrices(sourceCode, prices)
      message.success(tk('saveCustomOptionPricesSuccess').replace('{{count}}', prices.length.toString()))

      // 重新加载数据
      await loadCustomOptionPrices()
    } catch (error) {
      message.error(tk('saveCustomOptionPricesFailed'))
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
        return tk('priceSourceChannel')
      case 'item':
        return tk('priceSourceItem')
      case 'default':
        return tk('priceSourceDefault')
      default:
        return source
    }
  }

  const modifiedCount = customOptionPrices.filter(p => p.modified).length

  return (
    <div style={{ marginTop: 12 }}>
      {/* 展开/收起按钮 */}
      <Button
        type="link"
        size="small"
        icon={expanded ? <UpOutlined /> : <DownOutlined />}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? tk('hideCustomOptions') : tk('viewCustomOptions')}
      </Button>

      {/* 展开内容 */}
      {expanded && (
        <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 4 }}>
          {/* 头部：标题和保存按钮 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Space>
              <Text strong>{tk('customOptionPricing')}</Text>
              <Tooltip title={tk('customOptionPricingTip')}>
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
            {modifiedCount > 0 && (
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveAll}
              >
                {tk('saveOptionPrices')} ({modifiedCount})
              </Button>
            )}
          </div>

          {/* 自定义选项列表 */}
          <Spin spinning={loading} tip={t('common.loading')}>
            {hasModifiers === false ? (
              <div style={{ textAlign: 'center', padding: 20, background: 'white', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
                <InfoCircleOutlined style={{ fontSize: 32, color: '#999', marginBottom: 8 }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    {tk('noModifiersConfigured')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tk('pleaseConfigureModifiersFirst')}
                  </Text>
                </div>
              </div>
            ) : customOptionPrices.length > 0 ? (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {customOptionPrices.map(option => (
                  <div
                    key={option.key}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: 'white',
                      borderRadius: 4,
                      border: option.modified ? '1px solid #1890ff' : '1px solid #e8e8e8'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* 左侧：选项信息 */}
                      <div style={{ flex: 1 }}>
                        <Space direction="vertical" size={4}>
                          <Space>
                            <Text strong>{option.groupName || '-'}</Text>
                            <Text type="secondary">|</Text>
                            <Text>{option.optionName || '-'}</Text>
                            {option.modified && <Tag color="orange">{t('pages.orderConfig.modified')}</Tag>}
                          </Space>

                          {/* 价格优先级 */}
                          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
                            <Text type="secondary">
                              {tk('defaultPrice')}: ¥{option.defaultPrice?.toFixed(2) || '0.00'}
                            </Text>
                            {option.itemPrice !== undefined && option.itemPrice !== null && (
                              <Text type="warning">
                                {tk('itemLevelPrice')}: ¥{option.itemPrice.toFixed(2)}
                              </Text>
                            )}
                            {(option.sourcePrice !== undefined && option.sourcePrice !== null) || option.modified ? (
                              <Text type="success">
                                {tk('channelPrice')}: ¥{(option.newSourcePrice ?? option.sourcePrice ?? 0).toFixed(2)}
                              </Text>
                            ) : (
                              <Text type="secondary">
                                {tk('channelPrice')}: {tk('notSet')}
                              </Text>
                            )}
                          </Space>
                        </Space>
                      </div>

                      {/* 右侧：最终价格和操作 */}
                      <div style={{ textAlign: 'right' }}>
                        <Space direction="vertical" size={4} align="end">
                          <Space>
                            <Text strong style={{ fontSize: 16 }}>
                              ¥{(option.modified && option.newSourcePrice !== undefined
                                ? option.newSourcePrice
                                : option.finalPrice
                              )?.toFixed(2) || '0.00'}
                            </Text>
                            <Tag color={getPriceSourceColor(option.priceSource)}>
                              {getPriceSourceText(option.priceSource)}
                            </Tag>
                          </Space>

                          <Space size="small">
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditPrice(option)}
                            >
                              {tk('setChannelPrice')}
                            </Button>
                            {option.sourcePrice !== undefined && option.sourcePrice !== null && (
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  Modal.confirm({
                                    title: tk('deleteConfirmTitle'),
                                    content: tk('deleteCustomOptionPriceConfirm'),
                                    onOk: () => handleDeletePrice(option)
                                  })
                                }}
                              >
                                {tk('deleteChannelPrice')}
                              </Button>
                            )}
                          </Space>
                        </Space>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, background: 'white', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
                <Text type="secondary">{tk('noCustomOptionsData')}</Text>
              </div>
            )}
          </Spin>
        </div>
      )}

      {/* 编辑价格模态框 */}
      <Modal
        title={tk('setChannelPrice')}
        open={editModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingPrice(null)
          form.resetFields()
        }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        {editingPrice && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">{tk('optionGroup')}：</Text>
              <Text strong>{editingPrice.groupName}</Text>
            </div>
            <div>
              <Text type="secondary">{tk('optionName')}：</Text>
              <Text strong>{editingPrice.optionName}</Text>
            </div>

            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tk('defaultPrice')}: ¥{editingPrice.defaultPrice?.toFixed(2) || '0.00'}
                </Text>
                {editingPrice.itemPrice !== undefined && editingPrice.itemPrice !== null && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    {tk('itemLevelPrice')}: ¥{editingPrice.itemPrice.toFixed(2)}
                  </Text>
                )}
                {editingPrice.sourcePrice !== undefined && editingPrice.sourcePrice !== null && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    {tk('currentChannelPrice')}: ¥{editingPrice.sourcePrice.toFixed(2)}
                  </Text>
                )}
              </Space>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                label={tk('newChannelPrice')}
                name="sourcePrice"
                rules={[
                  { required: true, message: tk('enterPrice') },
                  { type: 'number', min: 0, message: '价格不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder={tk('enterPrice')}
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

export default CustomOptionPricingRow
