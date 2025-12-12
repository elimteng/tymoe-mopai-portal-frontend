import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Tag,
  message,
  InputNumber,
  Typography,
  Spin,
  Tooltip,
  Space,
  Alert,
  Statistic,
  Row,
  Col,
  Badge
} from 'antd'
import {
  DownOutlined,
  UpOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { getCurrencySymbol } from '../../config/currencyConfig'
import {
  batchSaveCustomOptionSourcePrices,
  deleteCustomOptionSourcePrice,
  calculatePrice,
  type CustomOptionPriceData
} from '../../services/channel-pricing'
import { itemManagementService } from '../../services/item-management'

const { Text } = Typography

interface CustomOptionPricingRowProps {
  itemId: string
  itemName: string
  sourceCode: string
}

interface CustomOptionPriceRow extends CustomOptionPriceData {
  key: string
  modified?: boolean
  newSourcePrice?: number
  groupDisplayName?: string
  optionDisplayName?: string
}

/**
 * 自定义选项定价表格组件 V2 (优化版)
 * 
 * 优化内容：
 * 1. 使用表格布局替代卡片列表，信息密度更高
 * 2. 支持内联编辑，操作更流畅
 * 3. 批量价格计算API调用，性能更好
 * 4. 添加统计信息和价格对比功能
 * 5. 优化加载状态和空状态展示
 */
const CustomOptionPricingRowV2: React.FC<CustomOptionPricingRowProps> = ({
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
  const [hasModifiers, setHasModifiers] = useState<boolean | null>(null)
  const [editingKey, setEditingKey] = useState<string>('')

  // 展开时加载数据
  useEffect(() => {
    if (expanded && itemId && sourceCode) {
      loadCustomOptionPrices()
    }
  }, [expanded, itemId, sourceCode])

  /**
   * 加载自定义选项价格数据
   * 优化：批量调用价格计算API
   */
  const loadCustomOptionPrices = async () => {
    try {
      setLoading(true)
      
      // 获取商品关联的修饰符组
      const itemModifiers = await itemManagementService.getItemModifiers(itemId)
      console.log(`📦 [V2] 商品 ${itemName} 的修饰符组:`, itemModifiers)
      
      if (!itemModifiers || itemModifiers.length === 0) {
        console.warn(`⚠️ [V2] 商品 ${itemName} 没有修饰符组`)
        setHasModifiers(false)
        setCustomOptionPrices([])
        setLoading(false)
        return
      }
      
      setHasModifiers(true)
      
      // 收集所有修饰符选项
      const allOptions: Array<{
        optionId: string
        quantity: number
        groupId: string
        groupName: string
        groupDisplayName: string
        optionName: string
        optionDisplayName: string
      }> = []
      
      for (const modifierGroup of itemModifiers) {
        if (modifierGroup.group && modifierGroup.group.options) {
          for (const option of modifierGroup.group.options) {
            allOptions.push({
              optionId: option.id,
              quantity: 1,
              groupId: modifierGroup.group.id,
              groupName: modifierGroup.group.name,
              groupDisplayName: modifierGroup.group.displayName || modifierGroup.group.name,
              optionName: option.name,
              optionDisplayName: option.displayName || option.name
            })
          }
        }
      }
      
      console.log(`🔍 [V2] 收集到 ${allOptions.length} 个修饰符选项`)
      
      if (allOptions.length === 0) {
        console.warn(`⚠️ [V2] 修饰符组没有选项`)
        setCustomOptionPrices([])
        setLoading(false)
        return
      }
      
      // 🚀 优化：批量调用价格计算API（一次调用获取所有选项的价格）
      try {
        const result = await calculatePrice({
          itemId,
          sourceCode,
          customOptions: allOptions.map(opt => ({
            optionId: opt.optionId,
            quantity: 1
          }))
        })
        
        console.log(`💰 [V2] 批量价格计算结果:`, result)
        
        // 构建价格数据表格
        const rows: CustomOptionPriceRow[] = result.customOptions.map((priceData, index) => {
          // 查找对应的选项信息
          const optionInfo = allOptions.find(opt => opt.optionId === priceData.optionId)
          
          // 根据 priceSource 确定各层级价格
          let defaultPrice = priceData.unitPrice
          let itemPrice: number | undefined
          let sourcePrice: number | undefined
          
          if (priceData.priceSource === 'item') {
            itemPrice = priceData.unitPrice
          } else if (priceData.priceSource === 'source') {
            sourcePrice = priceData.unitPrice
          }
          
          return {
            itemId,
            itemName,
            customOptionId: priceData.optionId,
            optionName: priceData.optionName,
            groupName: optionInfo?.groupDisplayName || '',
            groupDisplayName: optionInfo?.groupDisplayName || '',
            optionDisplayName: optionInfo?.optionDisplayName || priceData.optionName,
            defaultPrice,
            itemPrice,
            sourcePrice,
            finalPrice: priceData.unitPrice,
            priceSource: priceData.priceSource,
            key: `${itemId}-${priceData.optionId}-${index}`,
            modified: false
          }
        })
        
        setCustomOptionPrices(rows)
      } catch (error) {
        console.error('❌ [V2] 批量价格计算失败:', error)
        message.error(tk('loadCustomOptionPricesFailed'))
        setCustomOptionPrices([])
      }
    } catch (error) {
      message.error(tk('loadCustomOptionPricesFailed'))
      console.error('❌ [V2] 加载失败:', error)
      setCustomOptionPrices([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理内联编辑
   */
  const handleEdit = (record: CustomOptionPriceRow) => {
    setEditingKey(record.key)
  }

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setEditingKey('')
    // 重置修改状态
    setCustomOptionPrices(prev => prev.map(item => ({
      ...item,
      modified: false,
      newSourcePrice: undefined
    })))
  }

  /**
   * 保存单行编辑
   */
  const handleSaveEdit = (record: CustomOptionPriceRow) => {
    setEditingKey('')
  }

  /**
   * 更新价格值
   */
  const handlePriceChange = (record: CustomOptionPriceRow, value: number | null) => {
    setCustomOptionPrices(prev => prev.map(item => {
      if (item.key === record.key) {
        return {
          ...item,
          newSourcePrice: value ?? undefined,
          modified: true
        }
      }
      return item
    }))
  }

  /**
   * 删除渠道价格
   */
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

  /**
   * 批量保存所有修改
   */
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
      setEditingKey('')
    } catch (error) {
      message.error(tk('saveCustomOptionPricesFailed'))
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * 计算统计信息
   */
  const getStatistics = () => {
    const total = customOptionPrices.length
    const withSourcePrice = customOptionPrices.filter(p => p.priceSource === 'source').length
    const withItemPrice = customOptionPrices.filter(p => p.priceSource === 'item').length
    const withDefaultPrice = customOptionPrices.filter(p => p.priceSource === 'default').length
    const modified = customOptionPrices.filter(p => p.modified).length
    
    return { total, withSourcePrice, withItemPrice, withDefaultPrice, modified }
  }

  /**
   * 获取价格来源标签
   */
  const getPriceSourceTag = (source: string) => {
    const colorMap = {
      source: 'green',
      item: 'orange',
      default: 'default'
    }
    
    const textMap = {
      source: tk('priceSourceChannel'),
      item: tk('priceSourceItem'),
      default: tk('priceSourceDefault')
    }
    
    return (
      <Tag color={colorMap[source as keyof typeof colorMap]}>
        {textMap[source as keyof typeof textMap] || source}
      </Tag>
    )
  }

  /**
   * 表格列定义
   */
  const columns: ColumnsType<CustomOptionPriceRow> = [
    {
      title: tk('optionGroup'),
      dataIndex: 'groupDisplayName',
      key: 'groupDisplayName',
      width: 120,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: tk('optionName'),
      dataIndex: 'optionDisplayName',
      key: 'optionDisplayName',
      width: 150,
      fixed: 'left'
    },
    {
      title: (
        <Tooltip title={tk('customOptionPricingTip')}>
          <Space>
            {tk('defaultPrice')}
            <InfoCircleOutlined style={{ color: '#999' }} />
          </Space>
        </Tooltip>
      ),
      dataIndex: 'defaultPrice',
      key: 'defaultPrice',
      width: 100,
      align: 'right',
      render: (price) => (
        <Text type="secondary">¥{price?.toFixed(2) || '0.00'}</Text>
      )
    },
    {
      title: tk('itemLevelPrice'),
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      width: 100,
      align: 'right',
      render: (price) => (
        price !== undefined && price !== null 
          ? <Text style={{ color: '#fa8c16' }}>¥{price.toFixed(2)}</Text>
          : <Text type="secondary">-</Text>
      )
    },
    {
      title: tk('channelPrice'),
      dataIndex: 'newSourcePrice',
      key: 'channelPrice',
      width: 150,
      align: 'right',
      render: (_, record) => {
        const isEditing = editingKey === record.key
        const displayPrice = record.modified && record.newSourcePrice !== undefined 
          ? record.newSourcePrice 
          : record.sourcePrice

        if (isEditing) {
          return (
            <InputNumber
              value={record.newSourcePrice ?? record.sourcePrice}
              onChange={(value) => handlePriceChange(record, value)}
              min={0}
              precision={2}
              prefix={getCurrencySymbol()}
              style={{ width: '100%' }}
              autoFocus
            />
          )
        }

        return displayPrice !== undefined && displayPrice !== null ? (
          <Space>
            <Text style={{ color: '#52c41a', fontWeight: 500 }}>
              ¥{displayPrice.toFixed(2)}
            </Text>
            {record.modified && <Badge status="processing" />}
          </Space>
        ) : (
          <Text type="secondary">{tk('notSet')}</Text>
        )
      }
    },
    {
      title: tk('finalPrice'),
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 120,
      align: 'right',
      render: (price, record) => {
        const displayPrice = record.modified && record.newSourcePrice !== undefined
          ? record.newSourcePrice
          : price
        
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontSize: 16 }}>
              ¥{displayPrice?.toFixed(2) || '0.00'}
            </Text>
            {!record.modified && getPriceSourceTag(record.priceSource)}
          </Space>
        )
      }
    },
    {
      title: tk('actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const isEditing = editingKey === record.key

        if (isEditing) {
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleSaveEdit(record)}
              >
                {t('common.confirm')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCancelEdit}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          )
        }

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              {tk('setChannelPrice')}
            </Button>
            {record.sourcePrice !== undefined && record.sourcePrice !== null && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeletePrice(record)}
              >
                {t('common.delete')}
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  const stats = getStatistics()

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
        {!expanded && customOptionPrices.length > 0 && (
          <Badge 
            count={customOptionPrices.length} 
            style={{ marginLeft: 8, backgroundColor: '#52c41a' }} 
          />
        )}
      </Button>

      {/* 展开内容 */}
      {expanded && (
        <div style={{ marginTop: 12, padding: 16, background: '#fafafa', borderRadius: 4 }}>
          {hasModifiers === false ? (
            // 状态1：未配置修饰符
            <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
              <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 16 }}>
                  {tk('noModifiersConfigured')}
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {tk('pleaseConfigureModifiersFirst')}
                </Text>
              </div>
            </div>
          ) : (
            <>
              {/* 统计信息栏 */}
              {customOptionPrices.length > 0 && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Statistic 
                      title={t('common.total')} 
                      value={stats.total} 
                      suffix={t('common.items')}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('priceSourceChannel')} 
                      value={stats.withSourcePrice}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('priceSourceItem')} 
                      value={stats.withItemPrice}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('priceSourceDefault')} 
                      value={stats.withDefaultPrice}
                      valueStyle={{ color: '#999' }}
                    />
                  </Col>
                </Row>
              )}

              {/* 操作栏 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                  <Text strong style={{ fontSize: 14 }}>{tk('customOptionPricing')}</Text>
                  <Tooltip title={tk('customOptionPricingTip')}>
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadCustomOptionPrices}
                    disabled={loading}
                  >
                    {t('common.refresh')}
                  </Button>
                  {stats.modified > 0 && (
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={handleSaveAll}
                    >
                      {tk('saveOptionPrices')} ({stats.modified})
                    </Button>
                  )}
                </Space>
              </div>

              {/* 提示信息 */}
              {stats.modified > 0 && (
                <Alert
                  message={`${tk('modified')}: ${stats.modified} ${t('common.items')}`}
                  type="warning"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* 价格表格 */}
              <Spin spinning={loading} tip={t('common.loading')}>
                {customOptionPrices.length > 0 ? (
                  <Table
                    columns={columns}
                    dataSource={customOptionPrices}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    size="small"
                    bordered
                    rowClassName={(record) => record.modified ? 'ant-table-row-modified' : ''}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 4 }}>
                    <Text type="secondary">{tk('noCustomOptionsData')}</Text>
                  </div>
                )}
              </Spin>
            </>
          )}
        </div>
      )}

      <style>{`
        .ant-table-row-modified {
          background-color: #fff7e6;
        }
        .ant-table-row-modified:hover > td {
          background-color: #ffe7ba !important;
        }
      `}</style>
    </div>
  )
}

export default CustomOptionPricingRowV2

