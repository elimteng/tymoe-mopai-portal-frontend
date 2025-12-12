import React, { useState, useEffect } from 'react'
import { Empty, Spin, Alert } from 'antd'
import { useTranslation } from 'react-i18next'
import RecipeByModifierManager from './RecipeByModifierManager'
import { getItem, itemManagementService, type Item, type ItemModifierGroup } from '@/services/item-management'

interface RecipeManagementByModifiersProps {
  itemId?: string
}

const RecipeManagementByModifiers: React.FC<RecipeManagementByModifiersProps> = ({ itemId }) => {
  const { t } = useTranslation()
  const [item, setItem] = useState<Item | null>(null)
  const [modifierGroups, setModifierGroups] = useState<ItemModifierGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (itemId) {
      loadItemAndModifiers()
    } else {
      setItem(null)
      setModifierGroups([])
    }
  }, [itemId])

  const loadItemAndModifiers = async () => {
    if (!itemId) return

    setLoading(true)
    try {
      // 获取商品基本信息
      const itemData = await getItem(itemId)
      console.log('📦 加载的商品数据:', itemData)
      setItem(itemData)
      
      // 使用专门的 API 获取商品的自定义选项组
      // getItem 返回的数据可能没有完整的 modifierGroups，需要单独调用
      const modifiers = await itemManagementService.getItemModifiers(itemId)
      console.log('📦 商品的自定义选项组:', modifiers)
      setModifierGroups(modifiers)
    } catch (error: any) {
      console.error('加载商品失败:', error)
      setItem(null)
      setModifierGroups([])
    } finally {
      setLoading(false)
    }
  }

  if (!itemId) {
    return (
      <Empty
        description={t('pages.recipeGuide.selectItemFirst')}
        style={{ padding: '60px 0' }}
      />
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="加载商品信息..." />
      </div>
    )
  }

  if (!item) {
    return (
      <Alert
        message="商品不存在"
        description="无法加载商品信息，请重新选择"
        type="error"
        showIcon
      />
    )
  }

  // 无论是否有自定义选项，都允许创建配方指引
  // 如果没有自定义选项，将显示"默认配方"供用户配置
  return (
    <RecipeByModifierManager
      itemId={item.id}
      itemName={item.name || '未命名商品'}
      modifierGroups={modifierGroups}
    />
  )
}

export default RecipeManagementByModifiers

