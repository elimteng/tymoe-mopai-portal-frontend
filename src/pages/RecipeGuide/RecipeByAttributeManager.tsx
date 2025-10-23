import React, { useState, useEffect, useMemo } from 'react'
import { Card, Table, Button, Space, message, Tag, Modal, Typography } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '@/services/recipe'
import type { Recipe } from '@/services/recipe'
import RecipeFormModal from './RecipeFormModal'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

interface ItemAttribute {
  name: string
  label: string
  options: Array<{ value: string; label: string }>
}

interface AttributeCombination {
  key: string
  attributes: Record<string, string>
  attributeLabels: Record<string, string>
  hasRecipe: boolean
  recipe?: Recipe
}

interface RecipeByAttributeManagerProps {
  itemId: string
  itemName: string
  itemAttributes: ItemAttribute[]
}

const RecipeByAttributeManager: React.FC<RecipeByAttributeManagerProps> = ({
  itemId,
  itemName,
  itemAttributes
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [combinations, setCombinations] = useState<AttributeCombination[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>()
  const [selectedCombination, setSelectedCombination] = useState<AttributeCombination | undefined>()

  useEffect(() => {
    if (itemId) {
      loadRecipes()
      generateCombinations()
    }
  }, [itemId, itemAttributes])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const data = await getRecipes(itemId)
      setRecipes(data)
    } catch (error: any) {
      message.error(error.message || '加载配方失败')
    } finally {
      setLoading(false)
    }
  }

  const generateCombinations = () => {
    if (!itemAttributes || itemAttributes.length === 0) {
      setCombinations([])
      return
    }

    const generate = (attrs: ItemAttribute[], index: number, current: Record<string, string>): Record<string, string>[] => {
      if (index >= attrs.length) {
        return [{ ...current }]
      }

      const attr = attrs[index]
      const results: Record<string, string>[] = []

      for (const option of attr.options) {
        const next = { ...current, [attr.name]: option.value }
        results.push(...generate(attrs, index + 1, next))
      }

      return results
    }

    const allCombinations = generate(itemAttributes, 0, {})
    const combinationsWithRecipes = allCombinations.map((combo) => {
      const key = Object.values(combo).join('-')
      const attributeLabels: Record<string, string> = {}
      Object.keys(combo).forEach((attrName) => {
        const attr = itemAttributes.find((a) => a.name === attrName)
        const option = attr?.options.find((o) => o.value === combo[attrName])
        attributeLabels[attrName] = option?.label || combo[attrName]
      })

      const recipe = recipes.find((r) => {
        const recipeAttrs = r.attributeConditions || {}
        return Object.keys(combo).every((k) => recipeAttrs[k] === combo[k])
      })

      return {
        key,
        attributes: combo,
        attributeLabels,
        hasRecipe: !!recipe,
        recipe
      }
    })

    setCombinations(combinationsWithRecipes)
  }

  useEffect(() => {
    generateCombinations()
  }, [recipes])

  const handleCreateRecipe = (combination?: AttributeCombination) => {
    setSelectedCombination(combination)
    setEditingRecipe(undefined)
    setModalVisible(true)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setSelectedCombination(undefined)
    setModalVisible(true)
  }

  const handleCopyToAll = async (sourceRecipe: Recipe) => {
    const targetCombinations = combinations.filter((c) => {
      // 排除源配方自己
      const sourceAttrs = sourceRecipe.attributeConditions || {}
      return JSON.stringify(c.attributes) !== JSON.stringify(sourceAttrs)
    })

    Modal.confirm({
      title: '批量复制配方',
      content: `确定要将此配方复制到其他 ${targetCombinations.length} 个属性组合吗？已存在的配方将被覆盖。`,
      onOk: async () => {
        let successCount = 0
        let updateCount = 0

        for (const combo of targetCombinations) {
          try {
            if (combo.hasRecipe && combo.recipe?.id) {
              // 如果已有配方，使用 updateRecipe 更新
              await updateRecipe(combo.recipe.id, {
                itemId: sourceRecipe.itemId,
                name: sourceRecipe.name,
                description: sourceRecipe.description,
                attributeConditions: combo.attributes,
                priority: sourceRecipe.priority,
                isDefault: sourceRecipe.isDefault,
                isActive: sourceRecipe.isActive,
                steps: sourceRecipe.steps
              })
              updateCount++
            } else {
              // 如果没有配方，创建新配方
              await createRecipe({
                itemId: sourceRecipe.itemId,
                name: sourceRecipe.name,
                description: sourceRecipe.description,
                attributeConditions: combo.attributes,
                priority: sourceRecipe.priority,
                steps: sourceRecipe.steps
              })
              successCount++
            }
          } catch (error) {
            console.error('复制失败:', error)
          }
        }

        message.success(`成功创建 ${successCount} 个配方，更新 ${updateCount} 个配方`)
        loadRecipes()
      }
    })
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    Modal.confirm({
      title: t('pages.recipeGuide.deleteRecipe'),
      content: '确定要删除这个配方吗？',
      onOk: async () => {
        try {
          await deleteRecipe(recipe.id!)
          message.success('删除成功')
          loadRecipes()
        } catch (error: any) {
          message.error(error.message || '删除失败')
        }
      }
    })
  }

  const handleModalSuccess = () => {
    setModalVisible(false)
    loadRecipes()
  }

  const columns: ColumnsType<AttributeCombination> = useMemo(() => [
    ...itemAttributes.map((attr) => ({
      title: attr.label,
      dataIndex: ['attributeLabels', attr.name],
      key: attr.name,
      width: 120
    })),
    {
      title: t('pages.recipeGuide.printCode'),
      key: 'printCode',
      width: 150,
      render: (_: any, record: AttributeCombination) => (
        record.hasRecipe && record.recipe?.printCodeString ? (
          <Text code style={{ fontSize: 12 }}>{record.recipe.printCodeString}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: t('pages.recipeGuide.status'),
      key: 'status',
      width: 100,
      render: (_: any, record: AttributeCombination) => (
        record.hasRecipe ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('pages.recipeGuide.configured')}
          </Tag>
        ) : (
          <Tag color="default">{t('pages.recipeGuide.unconfigured')}</Tag>
        )
      )
    },
    {
      title: t('pages.recipeGuide.actions'),
      key: 'actions',
      width: 280,
      render: (_: any, record: AttributeCombination) => (
        <Space>
          {record.hasRecipe ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditRecipe(record.recipe!)}
              >
                {t('pages.recipeGuide.editRecipe')}
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyToAll(record.recipe!)}
              >
                {t('pages.recipeGuide.batchCopyToUnconfigured')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRecipe(record.recipe!)}
              >
                {t('pages.recipeGuide.deleteRecipe')}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleCreateRecipe(record)}
            >
              {t('pages.recipeGuide.createRecipe')}
            </Button>
          )}
        </Space>
      )
    }
  ], [t, recipes])

  const hasRecipeCount = combinations.filter((c) => c.hasRecipe).length
  const totalCount = combinations.length

  return (
    <Card
      title={
        <Space>
          <span>{itemName} - {t('pages.recipeGuide.recipeManagement')}</span>
          <Tag color="blue">
            {hasRecipeCount} / {totalCount} {t('pages.recipeGuide.configured')}
          </Tag>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={combinations}
        loading={loading}
        pagination={false}
        size="small"
      />

      {modalVisible && (
        <RecipeFormModal
          visible={modalVisible}
          itemId={itemId}
          recipe={editingRecipe}
          initialAttributeConditions={selectedCombination?.attributes}
          onClose={() => setModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </Card>
  )
}

export default RecipeByAttributeManager
