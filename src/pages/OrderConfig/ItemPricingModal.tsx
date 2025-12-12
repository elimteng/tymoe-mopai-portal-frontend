import React, { useState, useEffect } from 'react'
import {
  Modal,
  InputNumber,
  message,
  Typography,
  Space,
  Divider,
  Alert,
  Spin,
  Table,
  Button,
  Tag,
  Row,
  Col,
  Statistic,
  Tooltip,
  Card,
  Select
} from 'antd'
import {
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { formatPrice, fromMinorUnit } from '../../utils/priceConverter'
import { getCurrencySymbol } from '../../config/currencyConfig'
import {
  calculatePrice,
  batchSaveCustomOptionSourcePrices,
  deleteCustomOptionSourcePrice,
  type CustomOptionPriceData
} from '../../services/channel-pricing'
import { itemManagementService } from '../../services/item-management'

const { Text, Title } = Typography

interface ItemPricingModalProps {
  visible: boolean
  itemId: string
  itemName: string
  basePrice: number
  currentPrice?: number
  sourceCode: string
  sourceName: string
  onClose: () => void
  onSave: (newPrice: number) => void
}

interface CustomOptionPriceRow extends CustomOptionPriceData {
  key: string
  modified?: boolean
  newSourcePrice?: number
  groupDisplayName?: string
  optionDisplayName?: string
}

/**
 * 商品定价详情模态框
 * 整合商品基础价格和自定义选项定价
 */
const ItemPricingModal: React.FC<ItemPricingModalProps> = ({
  visible,
  itemId,
  itemName,
  basePrice,
  currentPrice,
  sourceCode,
  sourceName,
  onClose,
  onSave
}) => {
  const { t } = useTranslation()
  const tk = (key: string) => t(`pages.orderConfig.${key}`)

  // 商品基础价格
  const [itemPrice, setItemPrice] = useState<number | undefined>(currentPrice)
  const [itemPriceModified, setItemPriceModified] = useState(false)

  // 自定义选项
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customOptionPrices, setCustomOptionPrices] = useState<CustomOptionPriceRow[]>([])
  const [hasModifiers, setHasModifiers] = useState<boolean | null>(null)
  const [editingKey, setEditingKey] = useState<string>('')

  // 批量定价工具
  const [batchPricingMode, setBatchPricingMode] = useState<'none' | 'percentage' | 'adjustment'>('none')
  const [batchPercentage, setBatchPercentage] = useState<number | undefined>(undefined)
  const [batchAdjustment, setBatchAdjustment] = useState<number | undefined>(undefined)

  // 初始化
  useEffect(() => {
    if (visible) {
      setItemPrice(currentPrice)
      setItemPriceModified(false)
      loadCustomOptionPrices()
    }
  }, [visible, itemId, sourceCode])

  /**
   * 加载自定义选项价格
   */
  const loadCustomOptionPrices = async () => {
    try {
      setLoading(true)
      
      // 获取商品关联的修饰符组
      const itemModifiers = await itemManagementService.getItemModifiers(itemId)
      console.log(`📦 [Modal] 商品 ${itemName} 的修饰符组:`, itemModifiers)
      
      if (!itemModifiers || itemModifiers.length === 0) {
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
      
      console.log(`🔍 [Modal] 收集到 ${allOptions.length} 个修饰符选项`)
      
      if (allOptions.length === 0) {
        setCustomOptionPrices([])
        setLoading(false)
        return
      }
      
      // 批量调用价格计算API
      try {
        const result = await calculatePrice({
          itemId,
          sourceCode,
          customOptions: allOptions.map(opt => ({
            optionId: opt.optionId,
            quantity: 1
          }))
        })
        
        console.log(`💰 [Modal] 批量价格计算结果:`, result)
        
        // 构建价格数据
        const rows: CustomOptionPriceRow[] = result.customOptions.map((priceData, index) => {
          const optionInfo = allOptions.find(opt => opt.optionId === priceData.optionId)
          
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
        console.error('❌ [Modal] 批量价格计算失败:', error)
        message.error(tk('loadCustomOptionPricesFailed'))
        setCustomOptionPrices([])
      }
    } catch (error) {
      message.error(tk('loadCustomOptionPricesFailed'))
      console.error('❌ [Modal] 加载失败:', error)
      setCustomOptionPrices([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理商品基础价格变化
   */
  const handleItemPriceChange = (value: number | null) => {
    setItemPrice(value ?? undefined)
    setItemPriceModified(true)
  }

  /**
   * 处理自定义选项价格变化
   */
  const handleOptionPriceChange = (record: CustomOptionPriceRow, value: number | null) => {
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
   * 应用批量定价
   */
  const handleApplyBatchPricing = () => {
    if (batchPricingMode === 'none') {
      message.warning(tk('selectPricingMethod'))
      return
    }

    if (batchPricingMode === 'percentage' && batchPercentage === undefined) {
      message.warning(tk('enterPercentage'))
      return
    }

    if (batchPricingMode === 'adjustment' && batchAdjustment === undefined) {
      message.warning(tk('enterAdjustment'))
      return
    }

    setCustomOptionPrices(prev => prev.map(item => {
      let newPrice: number

      if (batchPricingMode === 'percentage') {
        // 基于当前最终价格计算百分比
        newPrice = item.finalPrice * (1 + (batchPercentage! / 100))
      } else {
        // 基于当前最终价格加减固定金额
        newPrice = item.finalPrice + batchAdjustment!
      }

      // 确保价格不为负数
      newPrice = Math.max(0, newPrice)

      return {
        ...item,
        newSourcePrice: newPrice,
        modified: true
      }
    }))

    message.success(tk('batchPricingApplied'))
  }

  /**
   * 重置批量定价工具
   */
  const handleResetBatchPricing = () => {
    setBatchPricingMode('none')
    setBatchPercentage(undefined)
    setBatchAdjustment(undefined)
  }

  /**
   * 删除自定义选项渠道价格
   */
  const handleDeleteOptionPrice = async (record: CustomOptionPriceRow) => {
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
   * 保存所有修改
   */
  const handleSave = async () => {
    try {
      setSaving(true)

      // 保存商品基础价格
      if (itemPriceModified && itemPrice !== undefined) {
        onSave(itemPrice)
      }

      // 保存自定义选项价格
      const modifiedOptions = customOptionPrices.filter(
        p => p.modified && p.newSourcePrice !== undefined
      )

      if (modifiedOptions.length > 0) {
        const prices = modifiedOptions.map(p => ({
          itemId: p.itemId,
          customOptionId: p.customOptionId,
          price: p.newSourcePrice!
        }))

        await batchSaveCustomOptionSourcePrices(sourceCode, prices)
        message.success(
          tk('saveCustomOptionPricesSuccess').replace('{{count}}', prices.length.toString())
        )
      }

      if (itemPriceModified || modifiedOptions.length > 0) {
        message.success(t('common.saveSuccess'))
        // 重新加载数据
        await loadCustomOptionPrices()
        setItemPriceModified(false)
        setEditingKey('')
      } else {
        message.info(tk('noChanges'))
      }
    } catch (error) {
      message.error(t('common.saveFailed'))
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * 获取价格来源标签
   */
  const getPriceSourceTag = (source: string) => {
    const colorMap = { source: 'green', item: 'orange', default: 'default' }
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
   * 计算统计信息
   */
  const getStatistics = () => {
    const total = customOptionPrices.length
    const withSourcePrice = customOptionPrices.filter(p => p.priceSource === 'source').length
    const modified = customOptionPrices.filter(p => p.modified).length
    
    return { total, withSourcePrice, modified }
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
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: tk('optionName'),
      dataIndex: 'optionDisplayName',
      key: 'optionDisplayName',
      width: 150
    },
    {
      title: tk('defaultPrice'),
      dataIndex: 'defaultPrice',
      key: 'defaultPrice',
      width: 100,
      align: 'right',
      render: (price) => (
        <Text type="secondary">{formatPrice(price || 0)}</Text>
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
              onChange={(value) => handleOptionPriceChange(record, value)}
              min={0}
              precision={2}
              prefix={getCurrencySymbol()}
              style={{ width: '100%' }}
              autoFocus
            />
          )
        }

        return displayPrice !== undefined && displayPrice !== null ? (
          <Text style={{ color: '#52c41a', fontWeight: 500 }}>
            {formatPrice(displayPrice)}
          </Text>
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
            <Text strong>{formatPrice(displayPrice || 0)}</Text>
            {!record.modified && getPriceSourceTag(record.priceSource)}
          </Space>
        )
      }
    },
    {
      title: tk('actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => {
        const isEditing = editingKey === record.key

        if (isEditing) {
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => setEditingKey('')}
              />
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setEditingKey('')
                  // 重置修改
                  setCustomOptionPrices(prev => prev.map(item => 
                    item.key === record.key 
                      ? { ...item, modified: false, newSourcePrice: undefined }
                      : item
                  ))
                }}
              />
            </Space>
          )
        }

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingKey(record.key)}
            />
            {record.sourcePrice !== undefined && record.sourcePrice !== null && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteOptionPrice(record)}
              />
            )}
          </Space>
        )
      }
    }
  ]

  const stats = getStatistics()
  const hasChanges = itemPriceModified || stats.modified > 0

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined />
          <span>{tk('itemPricingDetail')} - {itemName}</span>
          <Tag color="blue">{sourceName}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {hasChanges && (
              <Text type="warning">
                <InfoCircleOutlined /> {tk('unsavedChanges')}
              </Text>
            )}
          </Space>
          <Space>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges}
              onClick={handleSave}
            >
              {t('common.save')}
              {hasChanges && ` (${(itemPriceModified ? 1 : 0) + stats.modified})`}
            </Button>
          </Space>
        </div>
      }
      style={{ top: 20 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 商品基础价格区域 */}
        <Card 
          title={
            <Space>
              <DollarOutlined />
              <span>{tk('itemBasePrice')}</span>
            </Space>
          }
          size="small"
          extra={
            itemPriceModified && (
              <Tag color="orange">{tk('modified')}</Tag>
            )
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message={tk('itemBasePriceTip')}
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 8 }}
            />

            <Row gutter={24}>
              <Col span={8}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Statistic
                    title={tk('originalPrice')}
                    value={basePrice}
                    prefix={getCurrencySymbol()}
                    precision={2}
                    valueStyle={{ fontSize: 24 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  {tk('channelPrice')}
                </div>
                <InputNumber
                  value={itemPrice}
                  onChange={handleItemPriceChange}
                  min={0}
                  step={0.01}
                  precision={2}
                  prefix={getCurrencySymbol()}
                  placeholder={tk('enterPrice')}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Col>
              <Col span={8}>
                {itemPrice !== undefined && (
                  <Card 
                    size="small" 
                    style={{ 
                      background: itemPrice - basePrice >= 0 ? '#f6ffed' : '#fff2e8',
                      borderColor: itemPrice - basePrice >= 0 ? '#b7eb8f' : '#ffbb96'
                    }}
                  >
                    <Statistic
                      title={tk('priceChange')}
                      value={Math.abs(itemPrice - basePrice)}
                      prefix={itemPrice - basePrice >= 0 ? `+${getCurrencySymbol()}` : `-${getCurrencySymbol()}`}
                      precision={2}
                      valueStyle={{
                        color: itemPrice - basePrice >= 0 ? '#52c41a' : '#ff7a45',
                        fontSize: 20
                      }}
                    />
                  </Card>
                )}
              </Col>
            </Row>
          </Space>
        </Card>

        <Divider style={{ margin: '12px 0' }} />

        {/* 自定义选项定价区域 */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined />
              <span>{tk('customOptionPricing')}</span>
              {customOptionPrices.length > 0 && (
                <Tag color="blue">{customOptionPrices.length}</Tag>
              )}
            </Space>
          }
          size="small"
          extra={
            <Space>
              {stats.modified > 0 && (
                <Tag color="orange">{tk('modified')}: {stats.modified}</Tag>
              )}
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={loadCustomOptionPrices}
                disabled={loading}
              >
                {t('common.refresh')}
              </Button>
            </Space>
          }
        >
          {hasModifiers === false ? (
            // 未配置修饰符
            <div style={{ textAlign: 'center', padding: 40 }}>
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
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 批量定价工具 */}
              {customOptionPrices.length > 0 && (
                <Card 
                  size="small" 
                  style={{ background: '#f0f7ff', borderColor: '#91caff' }}
                  title={
                    <Space>
                      <DollarOutlined />
                      <Text strong>{tk('batchPricingTool')}</Text>
                    </Space>
                  }
                  extra={
                    <Button 
                      size="small" 
                      onClick={handleResetBatchPricing}
                    >
                      {tk('reset')}
                    </Button>
                  }
                >
                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={24} md={6} lg={5}>
                      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                        {tk('pricingMethod')}
                      </div>
                      <Select
                        value={batchPricingMode === 'none' ? undefined : batchPricingMode}
                        onChange={(value) => setBatchPricingMode(value || 'none')}
                        placeholder={tk('selectPricingMethod')}
                        style={{ width: '100%' }}
                        size="large"
                        allowClear
                        options={[
                          { value: 'percentage', label: tk('percentageDiscount') },
                          { value: 'adjustment', label: tk('adjustmentAmount') }
                        ]}
                      />
                    </Col>
                    
                    {batchPricingMode === 'percentage' && (
                      <>
                        <Col xs={24} sm={12} md={6} lg={5}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                            {tk('discountPercentage')}
                          </div>
                          <InputNumber
                            value={batchPercentage}
                            onChange={setBatchPercentage}
                            min={-100}
                            max={100}
                            step={1}
                            precision={1}
                            placeholder={tk('percentagePlaceholderShort')}
                            style={{ width: '100%' }}
                            size="large"
                            suffix="%"
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6} lg={7}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                          {batchPercentage !== undefined && (
                            <Alert
                              message={
                                <span style={{ fontSize: 13 }}>
                                  {tk('preview')}: {formatPrice(1000)} →
                                  <strong style={{
                                    color: batchPercentage > 0 ? '#52c41a' : '#ff7a45',
                                    marginLeft: 6
                                  }}>
                                    {formatPrice(Math.round(1000 * (1 + batchPercentage / 100)))}
                                  </strong>
                                </span>
                              }
                              type="info"
                              showIcon
                              style={{ padding: '4px 12px' }}
                            />
                          )}
                        </Col>
                        <Col xs={24} sm={24} md={6} lg={4}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                          <Button
                            type="primary"
                            onClick={handleApplyBatchPricing}
                            size="large"
                            block
                            icon={<CheckCircleOutlined />}
                          >
                            {tk('applyToAll')}
                          </Button>
                        </Col>
                      </>
                    )}

                    {batchPricingMode === 'adjustment' && (
                      <>
                        <Col xs={24} sm={12} md={6} lg={5}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                            {tk('adjustmentAmountLabel')}
                          </div>
                          <InputNumber
                            value={batchAdjustment}
                            onChange={setBatchAdjustment}
                            step={0.5}
                            precision={2}
                            placeholder={tk('adjustmentPlaceholder')}
                            style={{ width: '100%' }}
                            size="large"
                            prefix={getCurrencySymbol()}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={6} lg={7}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                          {batchAdjustment !== undefined && (
                            <Alert
                              message={
                                <span style={{ fontSize: 13 }}>
                                  {tk('preview')}: {formatPrice(1000)} →
                                  <strong style={{
                                    color: batchAdjustment > 0 ? '#52c41a' : '#ff7a45',
                                    marginLeft: 6
                                  }}>
                                    {formatPrice(1000 + Math.round(batchAdjustment * 100))}
                                  </strong>
                                </span>
                              }
                              type="info"
                              showIcon
                              style={{ padding: '4px 12px' }}
                            />
                          )}
                        </Col>
                        <Col xs={24} sm={24} md={6} lg={4}>
                          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                          <Button
                            type="primary"
                            onClick={handleApplyBatchPricing}
                            size="large"
                            block
                            icon={<CheckCircleOutlined />}
                          >
                            {tk('applyToAll')}
                          </Button>
                        </Col>
                      </>
                    )}
                  </Row>
                </Card>
              )}

              {/* 统计信息 */}
              {customOptionPrices.length > 0 && (
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <Statistic 
                      title={t('common.total')} 
                      value={stats.total}
                      suffix={t('common.items')}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('priceSourceChannel')} 
                      value={stats.withSourcePrice}
                      valueStyle={{ color: '#52c41a', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('priceSourceDefault')} 
                      value={stats.total - stats.withSourcePrice}
                      valueStyle={{ color: '#999', fontSize: 20 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title={tk('pendingSave')} 
                      value={stats.modified}
                      valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                    />
                  </Col>
                </Row>
              )}

              {/* 价格表格 */}
              <Spin spinning={loading} tip={t('common.loading')}>
                {customOptionPrices.length > 0 ? (
                  <Table
                    columns={columns}
                    dataSource={customOptionPrices}
                    pagination={false}
                    scroll={{ y: 350 }}
                    size="small"
                    bordered
                    rowClassName={(record) => record.modified ? 'row-modified' : ''}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 4 }}>
                    <Text type="secondary">{tk('noCustomOptionsData')}</Text>
                  </div>
                )}
              </Spin>

              {/* 提示信息 */}
              {customOptionPrices.length > 0 && (
                <Alert
                  message={
                    <Space>
                      <InfoCircleOutlined />
                      <Text style={{ fontSize: 12 }}>{tk('customOptionPricingTip')}</Text>
                    </Space>
                  }
                  type="info"
                  showIcon={false}
                  style={{ marginTop: 12 }}
                />
              )}
            </Space>
          )}
        </Card>
      </Space>

      <style>{`
        .row-modified {
          background-color: #fff7e6 !important;
        }
        .row-modified:hover > td {
          background-color: #ffe7ba !important;
        }
      `}</style>
    </Modal>
  )
}

export default ItemPricingModal

