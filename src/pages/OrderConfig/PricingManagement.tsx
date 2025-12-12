import React, { useEffect, useState } from 'react'
import { Card, Select, Button, Input, InputNumber, message, Space, Spin, Alert, Empty, Tabs, Row, Col, Modal } from 'antd'
import { PlusOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatPrice, fromMinorUnit } from '../../utils/priceConverter'
import { getCurrencySymbol } from '../../config/currencyConfig'
import {
  getOrderSources,
  type OrderSource
} from '../../services/order-config'
import {
  queryChannelPrices,
  queryComboprices,
  batchSaveAllPrices,
  type SourcePriceProfile
} from '../../services/channel-pricing'
import {
  itemManagementService
} from '../../services/item-management'
import ItemPricingModal from './ItemPricingModal'

interface PriceItem {
  id: string
  name?: string
  basePrice?: number
  // 现有价格配置
  price?: number           // 绝对价格 (固定价格覆盖模式)
  priceDiff?: number       // 相对差异 (相对调整模式) - 可以是固定金额或百分比
  strategy?: string        // 价格策略: 'absolute', 'fixed', 'percentage'
  // 编辑状态
  modified: boolean
  editMode: 'none' | 'price' | 'fixed' | 'percentage'  // 编辑模式
  editPrice?: number       // 编辑的绝对价格
  editPriceDiff?: number   // 编辑的相对差异 (固定金额)
  editPercentage?: number  // 编辑的百分比折扣 (-100 to 100, 表示百分比)
  editFinalPrice?: number  // 编辑的最终价格 (百分比模式下)
  profilePriceId?: string
}

const PricingManagement: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<OrderSource | null>(null)
  const [channels, setChannels] = useState<OrderSource[]>([])
  const [priceProfile, setPriceProfile] = useState<SourcePriceProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<PriceItem[]>([])
  const [addons, setAddons] = useState<PriceItem[]>([])
  const [combos, setCombos] = useState<PriceItem[]>([])
  const [strategyType, setStrategyType] = useState<'absolute' | 'fixed' | 'percentage'>('absolute')
  
  // 顶部定价器状态
  const [pricingMode, setPricingMode] = useState<'none' | 'percentage' | 'adjustment'>('none')
  const [globalPercentage, setGlobalPercentage] = useState<number | undefined>(undefined)
  const [globalAdjustment, setGlobalAdjustment] = useState<number | undefined>(undefined)
  
  // 商品定价详情模态框
  const [pricingModalVisible, setPricingModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ 
    item: PriceItem
    setter: (items: PriceItem[]) => void
    list: PriceItem[]
  } | null>(null)

  const tenantId = localStorage.getItem('organization_id') || ''

  // 加载渠道列表
  useEffect(() => {
    if (!tenantId) {
      message.error(t('organization.selectOrg'))
      return
    }
    loadChannels()
  }, [tenantId])

  // 从URL参数读取预选渠道并自动选中
  useEffect(() => {
    const sourceParam = searchParams.get('source')
    if (sourceParam && channels.length > 0) {
      // 根据 sourceType 查找渠道
      const channel = channels.find(c => c.sourceType === sourceParam)
      if (channel) {
        console.log('📍 从URL参数自动选中渠道:', channel.sourceName, channel.id)
        handleChannelChange(channel.id)
      }
    }
  }, [searchParams, channels])

  const loadChannels = async () => {
    try {
      setLoading(true)
      const data = await getOrderSources()
      setChannels(data)
    } catch (error) {
      message.error(t('pages.orderConfig.loadChannelsFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 处理渠道选择变化
  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId)
    const channel = channels.find(c => c.id === channelId)
    setSelectedChannel(channel || null)
    if (channel) {
      loadPriceProfile(channelId)
    }
  }

  // 加载渠道的价格配置
  const loadPriceProfile = async (channelId: string) => {
    try {
      setLoading(true)

      // 获取渠道信息
      const channel = channels.find(c => c.id === channelId)
      if (!channel) {
        message.error('渠道信息不完整')
        return
      }

      // 使用 sourceType 作为 sourceCode
      const sourceCode = channel.sourceType || channel.sourceName

      // 并行加载价格配置和所有商品（移除不存在的 addon API）
      const [itemPricesResponse, comboPricesResponse, itemsResponse, combosResponse] = await Promise.all([
        queryChannelPrices(sourceCode),
        queryComboprices(sourceCode),
        itemManagementService.getItems({ limit: 1000 }),
        itemManagementService.getCombos({ limit: 100 })
      ])

      // 从分页响应中提取数据
      const allItemsData = itemsResponse.data || []
      const allCombosData = combosResponse.data || []

      // 创建价格映射表，方便快速查找 (新 API 格式: prices 数组，只返回最终价格和ID)
      const itemPriceMap = new Map(
        (itemPricesResponse?.prices || []).map(item => [item.itemId, { price: item.price, id: item.id }])
      )
      const comboPriceMap = new Map(
        (comboPricesResponse?.prices || []).map(combo => [combo.comboId, { price: combo.price, id: combo.id }])
      )

        // 转换为卡片格式 - 显示所有商品，包括已有和未有定价的
        const itemsList = allItemsData.map(item => {
          const priceData = itemPriceMap.get(item.id)
          const overridePrice = priceData?.price
          const profilePriceId = priceData?.id
          
          // 数据库只保存最终价格，加载时显示为固定价格模式
          // 用户可以重新选择百分比模式进行编辑
          const editMode: 'none' | 'price' | 'fixed' | 'percentage' =
            overridePrice !== undefined ? 'price' : 'none'

          return {
            id: item.id,
            name: item.name,
            basePrice: Number(item.basePrice),
            price: overridePrice,
            priceDiff: undefined,
            strategy: undefined,
            profilePriceId,
            modified: false,
            editMode,
            editPrice: editMode === 'price' ? overridePrice : undefined,
            editPriceDiff: undefined,
            editPercentage: undefined,
            editFinalPrice: undefined
          }
        })

        const combosList = allCombosData.map(combo => {
          const priceData = comboPriceMap.get(combo.id)
          const overridePrice = priceData?.price
          const profilePriceId = priceData?.id
          
          const editMode: 'none' | 'price' | 'fixed' | 'percentage' =
            overridePrice !== undefined ? 'price' : 'none'

          return {
            id: combo.id,
            name: combo.name,
            basePrice: Number(combo.basePrice),
            price: overridePrice,
            priceDiff: undefined,
            strategy: undefined,
            profilePriceId,
            modified: false,
            editMode,
            editPrice: editMode === 'price' ? overridePrice : undefined,
            editPriceDiff: undefined,
            editPercentage: undefined,
            editFinalPrice: undefined
          }
        })

        setItems(itemsList)
        setAddons([]) // Addons API 不存在，设置为空数组
        setCombos(combosList)
        setPriceProfile(null)
        setStrategyType('absolute')
    } catch (error) {
      console.error('Failed to load price profile:', error)
      setPriceProfile(null)
      setItems([])
      setAddons([])
      setCombos([])
      setStrategyType('absolute')
      message.error(t('pages.orderConfig.loadPricesFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 切换编辑模式
  const handleModeChange = (
    list: PriceItem[],
    id: string,
    mode: 'none' | 'price' | 'fixed' | 'percentage',
    setter: (items: PriceItem[]) => void
  ) => {
    const newList = list.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          editMode: mode,
          modified: item.editMode !== mode  // 模式改变就标记为modified
        }

        // 根据新模式保留对应的字段
        if (mode === 'price') {
          updated.editPrice = item.editPrice
          updated.editPercentage = undefined
          updated.strategy = 'absolute'
        } else if (mode === 'percentage') {
          updated.editPrice = undefined
          updated.editPercentage = item.editPercentage
          updated.strategy = 'percentage'
          updated.editFinalPrice = undefined // 初始化百分比模式下的最终价格
        } else {
          // 'none' 模式
          updated.editPrice = undefined
          updated.editPercentage = undefined
          updated.strategy = undefined
        }

        return updated
      }
      return item
    })
    setter(newList)
  }

  // 更新价格值
  const handlePriceValueChange = (
    list: PriceItem[],
    id: string,
    field: 'editPrice',
    value: number | undefined,
    setter: (items: PriceItem[]) => void
  ) => {
    const newList = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [field]: value,
          modified: true
        }
      }
      return item
    })
    setter(newList)
  }

  // 更新百分比值
  const handlePercentageValueChange = (
    list: PriceItem[],
    id: string,
    value: number | undefined,
    setter: (items: PriceItem[]) => void
  ) => {
    const newList = list.map(item => {
      if (item.id === id) {
        // 当百分比改变时，自动计算最终价格
        const finalPrice = item.basePrice !== undefined && value !== undefined
          ? Number(item.basePrice) * (1 + value / 100)
          : undefined
        return {
          ...item,
          editPercentage: value,
          editFinalPrice: finalPrice,
          modified: true
        }
      }
      return item
    })
    setter(newList)
  }

  // 更新最终价格值
  const handleFinalPriceValueChange = (
    list: PriceItem[],
    id: string,
    value: number | undefined,
    setter: (items: PriceItem[]) => void
  ) => {
    const newList = list.map(item => {
      if (item.id === id) {
        // 当最终价格改变时，自动计算百分比
        const percentage = item.basePrice !== undefined && value !== undefined && item.basePrice > 0
          ? ((value - Number(item.basePrice)) / Number(item.basePrice)) * 100
          : undefined
        return {
          ...item,
          editFinalPrice: value,
          editPercentage: percentage,
          modified: true
        }
      }
      return item
    })
    setter(newList)
  }

  // 批量应用定价器到选中的商品
  const applyGlobalPricing = () => {
    if (pricingMode === 'none') {
      message.warning('请先选择定价方式')
      return
    }

    if (pricingMode === 'percentage' && globalPercentage === undefined) {
      message.warning('请输入百分比')
      return
    }

    if (pricingMode === 'adjustment' && globalAdjustment === undefined) {
      message.warning('请输入增减金额')
      return
    }

    // 批量应用到所有商品、加料、套餐
    const updateList = (list: PriceItem[]) => list.map(item => {
      if (item.basePrice === undefined) return item
      
      let finalPrice: number
      if (pricingMode === 'percentage') {
        finalPrice = Number(item.basePrice) * (1 + globalPercentage! / 100)
        return {
          ...item,
          editMode: 'percentage' as const,
          editPrice: undefined,
          editPercentage: globalPercentage,
          editFinalPrice: finalPrice,
          modified: true
        }
      } else {
        // adjustment 模式
        finalPrice = Number(item.basePrice) + globalAdjustment!
        return {
          ...item,
          editMode: 'price' as const,
          editPrice: finalPrice,
          editPercentage: undefined,
          editFinalPrice: undefined,
          modified: true
        }
      }
    })

    setItems(updateList(items))
    setAddons(updateList(addons))
    setCombos(updateList(combos))
    
    if (pricingMode === 'percentage') {
      message.success(`已批量应用 ${globalPercentage! > 0 ? '+' : ''}${globalPercentage}% 定价`)
    } else {
      message.success(`已批量应用 ${globalAdjustment! > 0 ? '+' : ''}${getCurrencySymbol()}${globalAdjustment} 定价`)
    }
  }

  // 重置定价器
  const resetGlobalPricing = () => {
    setPricingMode('none')
    setGlobalPercentage(undefined)
    setGlobalAdjustment(undefined)
  }

  // 处理保存
  const handleSave = async () => {
    if (!selectedChannel) {
      message.error(t('pages.orderConfig.selectChannelFirst'))
      return
    }

    // 使用 sourceType 作为 sourceCode
    const sourceCode = selectedChannel.sourceType || selectedChannel.sourceName
    if (!sourceCode) {
      message.error('渠道代码不完整')
      return
    }

    try {
      setSaving(true)

      // 收集所有修改的项目 - 只保存最终价格
      const itemPrices = items
        .filter(item => item.modified)
        .map(item => {
          let finalPrice: number | undefined = undefined
          
          if (item.editMode === 'percentage') {
            // 百分比模式：保存计算后的最终价格
            finalPrice = item.editFinalPrice
          } else if (item.editMode === 'price') {
            // 固定价格模式：保存固定价格
            finalPrice = item.editPrice
          }
          // 原价模式：finalPrice 为 undefined，表示删除定价

          return {
            itemId: item.id,
            price: finalPrice
          }
        })

      // Addons API 不存在，跳过加料价格处理
      const addonPrices: any[] = []

      const comboPrices = combos
        .filter(combo => combo.modified)
        .map(combo => {
          let finalPrice: number | undefined = undefined
          
          if (combo.editMode === 'percentage') {
            finalPrice = combo.editFinalPrice
          } else if (combo.editMode === 'price') {
            finalPrice = combo.editPrice
          }

          return {
            comboId: combo.id,
            price: finalPrice,
            profilePriceId: combo.profilePriceId  // 传递价格记录ID
          }
        })

      if (itemPrices.length === 0 && comboPrices.length === 0) {
        message.info(t('pages.orderConfig.noChanges') || '没有任何更改')
        setSaving(false)
        return
      }

      // 准备批量保存的数据（移除 addons，因为API不存在）
      const batchData: {
        items?: Array<{ sourceCode: string; itemId: string; price: number }>
        combos?: Array<{ sourceCode: string; comboId: string; price: number }>
      } = {}

      if (itemPrices.length > 0) {
        batchData.items = itemPrices
          .filter(p => p.price !== undefined)
          .map(p => ({
            sourceCode,
            itemId: p.itemId,
            price: p.price!
          }))
      }

      if (comboPrices.length > 0) {
        batchData.combos = comboPrices
          .filter(p => p.price !== undefined)
          .map(p => ({
            sourceCode,
            comboId: p.comboId,
            price: p.price!
          }))
      }

      console.log('批量保存所有价格:', batchData)

      // 使用统一的批量保存接口
      await batchSaveAllPrices(batchData)

      message.success(t('common.success'))
      // 静默重新加载价格配置，不显示加载动画
      loadPriceProfile(selectedChannel.id)
    } catch (error) {
      console.error('保存失败:', error)
      message.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const renderPriceCards = (list: PriceItem[], setter: (items: PriceItem[]) => void, isItemTab: boolean = false) => {
    if (list.length === 0) {
      return <Empty description={t('common.noData')} style={{ margin: '40px 0' }} />
    }

    return (
      <Row gutter={[12, 12]}>
        {list.map(item => {
          // 计算显示的最终价格
          let displayPrice = item.basePrice
          let priceLabel = t('pages.orderConfig.originalPrice')
          let priceColor = '#666'

          if (item.editMode === 'price' && item.editPrice !== undefined) {
            displayPrice = item.editPrice
            priceLabel = t('pages.orderConfig.fixedPriceLabel')
            priceColor = '#1890ff'
          } else if (item.editMode === 'percentage' && item.editFinalPrice !== undefined) {
            displayPrice = item.editFinalPrice
            priceLabel = `${item.editPercentage && item.editPercentage > 0 ? '+' : ''}${item.editPercentage?.toFixed(1)}%`
            priceColor = item.editPercentage && item.editPercentage > 0 ? '#52c41a' : '#ff7a45'
          }

          return (
            <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
              <Card
                hoverable
                style={{
                  borderColor: item.modified ? '#ff7a45' : undefined,
                  borderWidth: item.modified ? 2 : 1,
                  background: item.modified ? '#fff7f1' : undefined,
                }}
                styles={{ body: { padding: 12 } }}
              >
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // 打开定价详情模态框
                    setSelectedItem({ item, setter, list })
                    setPricingModalVisible(true)
                  }}
                >
                  {/* 商品名称 */}
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name || 'N/A'}
                  </div>

                  {/* 价格显示 */}
                  <div style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: priceColor,
                    marginBottom: 4
                  }}>
                    {displayPrice !== undefined ? formatPrice(displayPrice) : 'N/A'}
                  </div>

                  {/* 价格标签 */}
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {priceLabel}
                    {item.modified && <span style={{ color: '#ff7a45', marginLeft: 4 }}>●</span>}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    )
  }

  return (
    <div style={{ padding: '0 24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/order-config')}
          style={{ marginRight: 16 }}
        >
          {t('common.back')}
        </Button>
        <h2 style={{ margin: 0 }}>{t('pages.orderConfig.pricingManagement')}</h2>
      </div>

      <Card>
        {!tenantId && (
          <Alert
            message={t('organization.selectOrg')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            {t('pages.orderConfig.selectChannel')}
          </label>
          <Select
            value={selectedChannelId}
            onChange={handleChannelChange}
            placeholder={t('pages.orderConfig.selectChannelPlaceholder')}
            style={{ width: '100%', maxWidth: 400 }}
            disabled={loading || channels.length === 0}
            options={channels.map(channel => ({
              value: channel.id,
              label: channel.sourceName
            }))}
          />
        </div>

        {selectedChannel && (
          <>
            <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                {t('pages.orderConfig.selectedChannel')}: <strong>{selectedChannel.sourceName}</strong>
              </p>
              <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                {selectedChannel.description && `描述: ${selectedChannel.description}`}
              </p>
            </div>

            {/* 顶部定价器 */}
            <Card 
              title={t('pages.orderConfig.batchPricingTool')}
              style={{ marginBottom: 20 }}
              extra={
                <Button onClick={resetGlobalPricing} size="small">
                  {t('pages.orderConfig.reset')}
                </Button>
              }
            >
              <Row gutter={16} align="bottom">
                <Col xs={24} sm={24} md={6} lg={5}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                    {t('pages.orderConfig.pricingMethod')}
                  </div>
                  <Select
                    value={pricingMode === 'none' ? undefined : pricingMode}
                    onChange={(value) => setPricingMode(value || 'none')}
                    placeholder={t('pages.orderConfig.selectPricingMethod')}
                    style={{ width: '100%' }}
                    size="large"
                    allowClear
                    options={[
                      { value: 'percentage', label: t('pages.orderConfig.percentageDiscount') },
                      { value: 'adjustment', label: t('pages.orderConfig.adjustmentAmount') }
                    ]}
                  />
                </Col>
                
                {pricingMode === 'percentage' && (
                  <>
                    <Col xs={24} sm={12} md={6} lg={5}>
                      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                        {t('pages.orderConfig.discountPercentage')}
                      </div>
                      <InputNumber
                        value={globalPercentage}
                        onChange={setGlobalPercentage}
                        min={-100}
                        max={100}
                        step={1}
                        precision={1}
                        placeholder={t('pages.orderConfig.percentagePlaceholderShort')}
                        style={{ width: '100%' }}
                        size="large"
                        suffix="%"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={7}>
                      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                      {globalPercentage !== undefined && (
                        <Alert
                          message={
                            <span style={{ fontSize: 13 }}>
                              {t('pages.orderConfig.preview')}: {formatPrice(10000)} →
                              <strong style={{
                                color: globalPercentage > 0 ? '#52c41a' : '#ff7a45',
                                marginLeft: 6
                              }}>
                                {formatPrice(Math.round(10000 * (1 + globalPercentage / 100)))}
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
                        onClick={applyGlobalPricing}
                        size="large"
                        block
                        icon={<PlusOutlined />}
                      >
                        {t('pages.orderConfig.applyToAll')}
                      </Button>
                    </Col>
                  </>
                )}

                {pricingMode === 'adjustment' && (
                  <>
                    <Col xs={24} sm={12} md={6} lg={5}>
                      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                        {t('pages.orderConfig.adjustmentAmountLabel')}
                      </div>
                      <InputNumber
                        value={globalAdjustment}
                        onChange={setGlobalAdjustment}
                        step={0.5}
                        precision={2}
                        placeholder={t('pages.orderConfig.adjustmentPlaceholder')}
                        style={{ width: '100%' }}
                        size="large"
                        prefix={getCurrencySymbol()}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={7}>
                      <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13, opacity: 0 }}>.</div>
                      {globalAdjustment !== undefined && (
                        <Alert
                          message={
                            <span style={{ fontSize: 13 }}>
                              {t('pages.orderConfig.preview')}: {formatPrice(10000)} →
                              <strong style={{
                                color: globalAdjustment > 0 ? '#52c41a' : '#ff7a45',
                                marginLeft: 6
                              }}>
                                {formatPrice(10000 + Math.round(globalAdjustment * 100))}
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
                        onClick={applyGlobalPricing}
                        size="large"
                        block
                        icon={<PlusOutlined />}
                      >
                        {t('pages.orderConfig.applyToAll')}
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            <Spin spinning={loading} tip="加载中...">
              <Tabs
                items={[
                  {
                    key: 'items',
                    label: `商品定价 (${items.length})`,
                    children: renderPriceCards(items, setItems, true)  // 商品Tab传递 true
                  },
                  {
                    key: 'combos',
                    label: `套餐定价 (${combos.length})`,
                    children: renderPriceCards(combos, setCombos, false)  // 套餐Tab传递 false
                  }
                ]}
              />
            </Spin>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#999', fontSize: 13 }}>
                {saving && <span><Spin size="small" style={{ marginRight: 8 }} />保存中...</span>}
              </div>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                size="large"
                disabled={loading}
              >
                {t('pages.orderConfig.applyAll')}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* 商品定价详情模态框 */}
      {selectedItem && selectedChannel && (
        <ItemPricingModal
          visible={pricingModalVisible}
          itemId={selectedItem.item.id}
          itemName={selectedItem.item.name || 'N/A'}
          basePrice={selectedItem.item.basePrice || 0}
          currentPrice={selectedItem.item.editPrice}
          sourceCode={selectedChannel.sourceType || selectedChannel.sourceName}
          sourceName={selectedChannel.sourceName}
          onClose={() => {
            setPricingModalVisible(false)
            setSelectedItem(null)
          }}
          onSave={(newPrice) => {
            const { item, setter, list } = selectedItem
            const updated = list.map(i => 
              i.id === item.id 
                ? { ...i, editMode: 'price' as const, editPrice: newPrice, modified: true }
                : i
            )
            setter(updated)
            message.success(t('pages.orderConfig.priceUpdated'))
          }}
        />
      )}
    </div>
  )
}

export default PricingManagement
