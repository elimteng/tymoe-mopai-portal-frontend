import React, { useState, useEffect, useMemo } from 'react'
import { Card, Table, Button, Space, message, Tag, Modal, Typography, Select, Checkbox, Alert } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, CheckCircleOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getRecipes, getRecipeById, generateCombinations, createRecipe, updateRecipe, updateRecipeSteps, copyRecipe, deleteRecipe } from '@/services/recipe'
import type { Recipe, ModifierCombination, RecipeCondition, CopyRecipeTarget } from '@/services/recipe/types'
import type { ItemModifierGroup } from '@/services/item-management'
import RecipeFormWithSteps from './RecipeFormWithSteps'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

interface ModifierCombinationWithRecipe extends ModifierCombination {
  recipe?: Recipe
}

interface RecipeByModifierManagerProps {
  itemId: string
  itemName: string
  modifierGroups: ItemModifierGroup[]
}

const RecipeByModifierManager: React.FC<RecipeByModifierManagerProps> = ({
  itemId,
  itemName,
  modifierGroups
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [combinations, setCombinations] = useState<ModifierCombinationWithRecipe[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>()
  const [selectedCombination, setSelectedCombination] = useState<ModifierCombinationWithRecipe | undefined>()
  
  // 用户选择的自定义选项组（根据已有配方智能勾选）
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([])

  // 初始化：根据已有配方智能勾选自定义选项组，如果没有自定义选项则设置空数组
  useEffect(() => {
    if (itemId) {
      if (modifierGroups && modifierGroups.length > 0) {
        // 有自定义选项的情况：加载已有配方并智能勾选
        getRecipes(itemId)
          .then(recipesData => {
            console.log('📥 获取到的配方数据:', recipesData)
            console.log('📥 第一个配方的详细信息:', recipesData.recipes[0])

            // 分析配方中使用的自定义选项组
            const usedGroupIds = new Set<string>()
            recipesData.recipes.forEach(recipe => {
              // 兼容两种字段名：conditions 和 modifierConditions
              const conditions = (recipe as any).conditions || recipe.modifierConditions

              if (conditions && Array.isArray(conditions)) {
                conditions.forEach((condition: any) => {
                  // 兼容两种字段名：groupId 和 modifierGroupId
                  const groupId = condition.groupId || condition.modifierGroupId
                  if (groupId) {
                    usedGroupIds.add(groupId)
                  }
                })
              }
            })

            console.log('📊 所有配方共使用了这些自定义选项组:', Array.from(usedGroupIds))

            // 如果有配方，只勾选使用的组；否则全选
            if (usedGroupIds.size > 0) {
              console.log('📋 根据已有配方智能勾选自定义选项组:', Array.from(usedGroupIds))
              setSelectedModifierGroupIds(Array.from(usedGroupIds))
            } else {
              // 如果没有配方，保持原行为（全选），方便新商品配置
              console.log('📋 没有配方记录，默认全选所有自定义选项组')
              const allIds = modifierGroups.map(mg => mg.group!.id)
              setSelectedModifierGroupIds(allIds)
            }
          })
          .catch(error => {
            // 出错时降级到全选
            console.error('❌ 加载配方失败，降级到全选模式:', error)
            const allIds = modifierGroups.map(mg => mg.group!.id)
            setSelectedModifierGroupIds(allIds)
          })
      } else {
        // 没有自定义选项的情况：设置空数组，后续会生成默认组合
        console.log('📋 商品没有自定义选项，将显示默认配方')
        setSelectedModifierGroupIds([])
      }
    }
  }, [modifierGroups, itemId])

  useEffect(() => {
    if (itemId) {
      loadRecipesAndCombinations()
    }
  }, [itemId, selectedModifierGroupIds])

  const loadRecipesAndCombinations = async () => {
    setLoading(true)
    try {
      // 先加载配方
      console.log('开始加载配方，itemId:', itemId)
      const recipesData = await getRecipes(itemId)
      console.log('配方数据:', recipesData)
      setRecipes(recipesData.recipes || [])

      // 如果没有自定义选项，创建一个默认组合
      if (selectedModifierGroupIds.length === 0) {
        console.log('📋 商品没有自定义选项，创建默认组合')

        // 查找是否已有默认配方
        const defaultRecipe = recipesData.recipes?.find(r => !r.modifierConditions || r.modifierConditions.length === 0)

        const defaultCombination: ModifierCombinationWithRecipe = {
          id: 'default',
          options: [],
          hasRecipe: !!defaultRecipe,
          recipe: defaultRecipe
        }

        setCombinations([defaultCombination])
        return
      }

      // 生成所有可能的自定义选项组合（使用用户选择的自定义选项组）
      console.log('用户选择的自定义选项组IDs:', selectedModifierGroupIds)

      const combinationsData = await generateCombinations(itemId, { modifierGroupIds: selectedModifierGroupIds })
      console.log('组合数据:', combinationsData)
      
      // 检查返回的数据是否有效
      if (!combinationsData || !combinationsData.combinations || !Array.isArray(combinationsData.combinations)) {
        console.error('组合数据格式无效:', combinationsData)
        message.error('组合数据格式无效')
        setCombinations([])
        return
      }
      
      // 将配方和组合匹配
      const combinationsWithRecipes = combinationsData.combinations.map((combo: any, index: number) => {
        console.log(`🔄 处理组合 ${index + 1}:`, combo)
        
        // 后端返回的是 conditions 而不是 options，需要转换
        let options = combo.options || []
        
        // 如果没有 options 但有 conditions，则转换 conditions 为 options
        if ((!options || options.length === 0) && combo.conditions && Array.isArray(combo.conditions)) {
          console.log(`  - 转换 conditions 为 options:`, combo.conditions)
          console.log(`  - modifierGroups 数据:`, modifierGroups)
          
          options = combo.conditions.map((cond: any, condIndex: number) => {
            console.log(`    - 处理 condition ${condIndex + 1}:`, cond)
            
            // 后端返回的字段名是 groupId 和 optionId，不是 modifierGroupId 和 modifierOptionId
            const groupId = cond.groupId || cond.modifierGroupId
            const optionId = cond.optionId || cond.modifierOptionId
            
            console.log(`      - groupId: ${groupId}`)
            console.log(`      - optionId: ${optionId}`)
            
            // 查找对应的自定义选项组和选项，获取 displayName
            const modifierGroup = modifierGroups.find(mg => mg.group?.id === groupId)
            console.log(`      - 找到的自定义选项组:`, modifierGroup?.group?.displayName)
            
            const option = modifierGroup?.group?.options?.find(opt => opt.id === optionId)
            console.log(`      - 找到的选项:`, option?.displayName)
            
            return {
              modifierGroupId: groupId,
              modifierOptionId: optionId,
              displayName: option?.displayName || option?.name || cond.optionName || '未知选项'
            }
          })
          
          console.log(`  - 转换后的 options:`, options)
        }
        
        // 查找匹配的配方
        // 优先使用后端返回的 existingRecipeId
        let recipe: Recipe | undefined = undefined
        if (combo.hasRecipe && combo.existingRecipeId) {
          recipe = (recipesData.recipes || []).find(r => r.id === combo.existingRecipeId)
          console.log(`  🔍 通过ID查找配方: ${combo.existingRecipeId} → ${recipe ? '找到' : '未找到'}`)
        }
        
        // 如果没找到，尝试通过条件匹配
        if (!recipe && options.length > 0) {
          recipe = (recipesData.recipes || []).find(r => {
            if (!r.modifierConditions || r.modifierConditions.length === 0) return false
            // 检查条件是否完全匹配
            return r.modifierConditions.length === options.length &&
              r.modifierConditions.every((cond: any) =>
                options.some((opt: any) =>
                  opt.modifierGroupId === cond.modifierGroupId &&
                  opt.modifierOptionId === cond.modifierOptionId
                )
              )
          })
          console.log(`  🔍 通过条件匹配配方: ${recipe ? '找到' : '未找到'}`)
        }

        const result = {
          id: combo.combinationId || combo.id || '',
          options,
          hasRecipe: combo.hasRecipe || !!recipe,
          recipe
        }
        
        console.log(`  ✅ 最终结果 ${index + 1}:`, result)
        return result
      })

      // 排序组合：按照用户选择的自定义选项组顺序进行排序，相同选项的组合排在一起
      const sortedCombinations = combinationsWithRecipes.sort((a, b) => {
        // 按照 selectedModifierGroupIds 的顺序依次比较每个自定义选项组的选项
        for (const groupId of selectedModifierGroupIds) {
          const aOption = a.options.find(opt => opt.modifierGroupId === groupId)
          const bOption = b.options.find(opt => opt.modifierGroupId === groupId)

          // 如果某个组合没有这个自定义选项组的选项，排在后面
          if (!aOption && !bOption) continue
          if (!aOption) return 1
          if (!bOption) return -1

          // 查找对应的自定义选项组，获取选项的 displayOrder
          const modifierGroup = modifierGroups.find(mg => mg.group?.id === groupId)
          const aModifierOption = modifierGroup?.group?.options?.find(opt => opt.id === aOption.modifierOptionId)
          const bModifierOption = modifierGroup?.group?.options?.find(opt => opt.id === bOption.modifierOptionId)

          // 使用 displayOrder 排序（如果不存在则默认为 999）
          const aOrder = aModifierOption?.displayOrder ?? 999
          const bOrder = bModifierOption?.displayOrder ?? 999

          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }

          // 如果 order 相同，再按 displayName 字母顺序排序
          const nameComparison = (aOption.displayName || '').localeCompare(bOption.displayName || '')
          if (nameComparison !== 0) return nameComparison
        }
        return 0
      })

      console.log('📊 所有组合数据汇总（已排序）:', sortedCombinations)
      setCombinations(sortedCombinations)
    } catch (error: any) {
      message.error(error.message || '加载配方或组合列表失败')
      console.error('加载失败:', error)
      // 确保即使出错也设置空数组，避免undefined
      setCombinations([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecipe = (combination?: ModifierCombinationWithRecipe) => {
    setSelectedCombination(combination)
    setEditingRecipe(undefined)
    setModalVisible(true)
  }

  const handleEditRecipe = async (recipe: Recipe) => {
    if (!recipe) {
      console.error('❌ 尝试编辑空配方对象')
      message.error('配方数据加载失败，请刷新页面重试')
      return
    }

    try {
      console.log('🔧 编辑配方 - 基础数据:', recipe)

      // 如果配方没有步骤数据，从详情API获取完整数据
      if (!recipe.steps || recipe.steps.length === 0) {
        console.log('📡 配方缺少步骤数据，正在从API获取完整详情...')
        const fullRecipe = await getRecipeById(recipe.id)
        console.log('📥 获取到完整配方数据:', fullRecipe)
        console.log('📥 配方步骤:', fullRecipe.steps)
        console.log('📥 配方修饰符条件:', fullRecipe.modifierConditions)
        setEditingRecipe(fullRecipe)
      } else {
        console.log('✅ 配方已有步骤数据:', recipe.steps)
        setEditingRecipe(recipe)
      }

      // 不需要设置selectedCombination，让用户可以在表单中修改自定义选项
      setSelectedCombination(undefined)
      setModalVisible(true)
    } catch (error: any) {
      console.error('❌ 获取配方详情失败:', error)
      message.error(error.message || '加载配方详情失败')
    }
  }

  const handleCopyToAll = async (sourceRecipe: Recipe) => {
    try {
      // 如果没有自定义选项，不支持复制到其他组合
      if (selectedModifierGroupIds.length === 0) {
        message.info('该商品没有自定义选项，无需复制')
        return
      }

      // 🔥 先获取完整的配方数据（包括步骤）
      console.log('🔍 开始复制配方，先获取完整数据...')
      const fullRecipe = await getRecipeById(sourceRecipe.id)
      console.log('📥 获取到完整配方:', fullRecipe)
      console.log('📦 配方步骤:', fullRecipe.steps)

      if (!fullRecipe.steps || fullRecipe.steps.length === 0) {
        message.error('配方没有步骤数据，无法复制')
        return
      }

      // 找到所有其他组合（排除当前配方的组合）
      const targetCombinations = combinations.filter(c => {
        // 排除当前配方本身
        if (c.recipe?.id === sourceRecipe.id) {
          return false
        }
        return true
      })

      if (targetCombinations.length === 0) {
        message.info('没有其他组合可以复制')
        return
      }

      // 统计未配置和已配置的数量
      const unconfiguredCount = targetCombinations.filter(c => !c.hasRecipe).length
      const configuredCount = targetCombinations.filter(c => c.hasRecipe).length

      Modal.confirm({
        title: '批量复制配方',
        content: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>确定要将此配方复制到其他 <strong>{targetCombinations.length}</strong> 个组合吗？</div>
            {unconfiguredCount > 0 && (
              <div style={{ color: '#52c41a', fontSize: 12 }}>
                • {unconfiguredCount} 个未配置组合（将创建新配方）
              </div>
            )}
            {configuredCount > 0 && (
              <div style={{ color: '#faad14', fontSize: 12 }}>
                • {configuredCount} 个已配置组合（将覆盖现有配方）
              </div>
            )}
            <div style={{ color: '#1890ff', fontSize: 12, marginTop: 8 }}>
              📋 将复制 {fullRecipe.steps.length} 个制作步骤
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              提示：每个组合的步骤配置将被完整复制，打印代码保持一致。
            </div>
          </Space>
        ),
        width: 600,
        okText: '确定复制',
        okButtonProps: { danger: configuredCount > 0 },
        onOk: async () => {
          let successCount = 0
          let updateCount = 0
          let createCount = 0
          let errorCount = 0
          
          for (const combo of targetCombinations) {
            try {
              console.log(`\n🔄 处理组合: ${combo.options.map(o => o.displayName).join(' + ')}`)
              
              const conditions = combo.options.map(opt => ({
                modifierGroupId: opt.modifierGroupId,
                modifierOptionId: opt.modifierOptionId
              }))

              // 🔥 使用完整配方的步骤数据，并转换为正确的格式
              const steps = fullRecipe.steps.map((step, index) => {
                const stepData: any = {
                  stepTypeId: step.stepTypeId,
                  displayOrder: index + 1,
                  instruction: step.instruction || step.instructions || ''
                }
                
                // 🔥 正确处理 containedSteps（包含关系）
                if (step.containedSteps && Array.isArray(step.containedSteps) && step.containedSteps.length > 0) {
                  // 如果是完整的步骤对象数组，提取 stepNumber 并转换为索引
                  const containedIndices = step.containedSteps
                    .map((s: any) => {
                      if (typeof s === 'number') return s // 已经是索引
                      if (s.stepNumber) return s.stepNumber - 1 // stepNumber 转索引
                      return null
                    })
                    .filter((idx: any) => idx !== null && idx >= 0)
                  
                  if (containedIndices.length > 0) {
                    stepData.metadata = { containedStepIndices: containedIndices }
                    console.log(`  📦 步骤 ${index + 1} 包含关系:`, containedIndices)
                  }
                } else if (step.metadata?.containedStepIndices) {
                  // 直接使用 metadata 中的索引
                  stepData.metadata = { containedStepIndices: step.metadata.containedStepIndices }
                  console.log(`  📦 步骤 ${index + 1} 包含关系 (metadata):`, step.metadata.containedStepIndices)
                }
                
                return stepData
              })

              console.log(`  📋 准备复制 ${steps.length} 个步骤`)

              if (combo.hasRecipe && combo.recipe) {
                // 更新现有配方
                console.log(`  ✏️ 更新现有配方: ${combo.recipe.id}`)
                await updateRecipe(combo.recipe.id, {
                  name: fullRecipe.name,
                  description: fullRecipe.description,
                  printCode: fullRecipe.printCode
                })
                
                // 更新步骤
                if (steps && steps.length > 0) {
                  console.log(`  📝 更新步骤数据...`)
                  await updateRecipeSteps(combo.recipe.id, { steps })
                }
                
                updateCount++
                console.log(`  ✅ 更新成功`)
              } else {
                // 创建新配方
                console.log(`  ➕ 创建新配方`)
                await createRecipe({
                  itemId,
                  name: combo.options.map(opt => opt.displayName).join(' '),
                  printCode: fullRecipe.printCode,
                  description: fullRecipe.description,
                  conditions,
                  steps
                })
                createCount++
                console.log(`  ✅ 创建成功`)
              }
              
              successCount++
            } catch (error: any) {
              console.error('❌ 复制失败:', error)
              errorCount++
            }
          }

          const messages = []
          if (createCount > 0) messages.push(`创建 ${createCount} 个`)
          if (updateCount > 0) messages.push(`更新 ${updateCount} 个`)
          
          if (successCount > 0) {
            message.success(`成功${messages.join('，')}配方${errorCount > 0 ? `，失败 ${errorCount} 个` : ''}`)
          } else {
            message.error('所有配方复制都失败了')
          }
          
          loadRecipesAndCombinations()
        }
      })
    } catch (error: any) {
      console.error('❌ 获取配方详情失败:', error)
      message.error(error.message || '获取配方详情失败')
    }
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    Modal.confirm({
      title: t('pages.recipeGuide.deleteRecipe'),
      content: '确定要删除这个配方吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await deleteRecipe(recipe.id)
          message.success('删除成功')
          loadRecipesAndCombinations()
        } catch (error: any) {
          message.error(error.message || '删除失败')
        }
      }
    })
  }

  const handleModalSuccess = () => {
    setModalVisible(false)
    loadRecipesAndCombinations()
  }

  // 生成表格列
  const columns: ColumnsType<ModifierCombinationWithRecipe> = useMemo(() => {
    // 按照 selectedModifierGroupIds 的顺序创建列
    const selectedGroups = selectedModifierGroupIds
      .map(groupId => modifierGroups.find(mg => mg.group!.id === groupId))
      .filter(mg => mg !== undefined) as ItemModifierGroup[]
    
    const modifierColumns = selectedGroups.map(mg => ({
      title: mg.group?.displayName || mg.group?.name || '自定义选项',
      key: mg.group!.id,
      render: (_: any, record: ModifierCombinationWithRecipe) => {
        // 添加防御性检查
        if (!record.options || !Array.isArray(record.options)) {
          return <Text type="secondary">-</Text>
        }
        const option = record.options.find(opt => opt.modifierGroupId === mg.group!.id)
        return option ? (
          <Tag color="blue">{option.displayName}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      }
    }))

    return [
      ...modifierColumns,
      {
        title: t('pages.recipeGuide.printCode'),
        key: 'printCode',
        render: (_: any, record: ModifierCombinationWithRecipe) => (
          record.hasRecipe && record.recipe?.printCode ? (
            <Space direction="vertical" size={0}>
              <Text code style={{ fontSize: 12 }}>{record.recipe.printCode}</Text>
              {record.recipe.displayCodeString && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {record.recipe.displayCodeString}
                </Text>
              )}
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          )
        )
      },
      {
        title: t('pages.recipeGuide.status'),
        key: 'status',
        render: (_: any, record: ModifierCombinationWithRecipe) => (
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
        fixed: 'right',
        render: (_: any, record: ModifierCombinationWithRecipe) => (
          <Space size="small">
            {record.hasRecipe ? (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditRecipe(record.recipe!)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyToAll(record.recipe!)}
                  title="复制到所有其他组合"
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteRecipe(record.recipe!)}
                  title="删除配方"
                />
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
    ]
  }, [t, modifierGroups, selectedModifierGroupIds, combinations])

  const hasRecipeCount = combinations.filter(c => c.hasRecipe).length
  const totalCount = combinations.length

  // 处理自定义选项组选择变化
  const handleModifierGroupChange = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedModifierGroupIds([...selectedModifierGroupIds, groupId])
    } else {
      setSelectedModifierGroupIds(selectedModifierGroupIds.filter(id => id !== groupId))
    }
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = modifierGroups.map(mg => mg.group!.id)
      setSelectedModifierGroupIds(allIds)
    } else {
      setSelectedModifierGroupIds([])
    }
  }

  // 计算可能的组合数量（笛卡尔积）
  const estimatedCombinations = useMemo(() => {
    const selectedGroups = modifierGroups.filter(mg => 
      selectedModifierGroupIds.includes(mg.group!.id)
    )
    if (selectedGroups.length === 0) return 0
    
    return selectedGroups.reduce((total, mg) => {
      const optionCount = mg.group?.options?.length || 0
      return total * (optionCount > 0 ? optionCount : 1)
    }, 1)
  }, [modifierGroups, selectedModifierGroupIds])

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* 自定义选项组选择器 - 仅当有自定义选项时显示 */}
      {modifierGroups && modifierGroups.length > 0 && (
        <Card
          title="步骤 1: 选择需要的自定义选项组"
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Checkbox
                checked={selectedModifierGroupIds.length === modifierGroups.length}
                indeterminate={selectedModifierGroupIds.length > 0 && selectedModifierGroupIds.length < modifierGroups.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选/取消全选
              </Checkbox>
            </div>

            <Space wrap size="middle">
              {modifierGroups.map(mg => (
                <Checkbox
                  key={mg.group!.id}
                  checked={selectedModifierGroupIds.includes(mg.group!.id)}
                  onChange={(e) => handleModifierGroupChange(mg.group!.id, e.target.checked)}
                >
                  <Space>
                    <Text strong>{mg.group?.displayName || mg.group?.name}</Text>
                    <Tag color="blue">{mg.group?.options?.length || 0} 个选项</Tag>
                  </Space>
                </Checkbox>
              ))}
            </Space>

            {selectedModifierGroupIds.length > 0 && (
              <Alert
                message={
                  <Space>
                    <Text>预计生成 <Text strong type="warning">{estimatedCombinations}</Text> 种组合</Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={loadRecipesAndCombinations}
                      loading={loading}
                    >
                      重新生成组合
                    </Button>
                  </Space>
                }
                type="info"
                showIcon
              />
            )}

          </Space>
        </Card>
      )}

      {/* 配方组合表格 */}
      <Card
        title={
          <Space>
            <span>{modifierGroups && modifierGroups.length > 0 ? '步骤 2: ' : ''}{itemName} - {modifierGroups && modifierGroups.length > 0 ? '配方' : '制作指引'}管理</span>
            <Tag color="blue">
              {hasRecipeCount} / {totalCount} {t('pages.recipeGuide.configured')}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary">{modifierGroups && modifierGroups.length > 0 ? `共 ${totalCount} 种自定义选项组合` : '共 1 个配方'}</Text>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={combinations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          size="small"
          scroll={{ x: 'max-content' }}
          tableLayout="auto"
        />
      </Card>

      {/* 配方创建/编辑模态框（带步骤编辑器） */}
      {modalVisible && (() => {
        // 编辑模式：使用配方的自定义选项条件
        // 创建模式：使用选中组合的选项
        const modifierConditions = editingRecipe?.modifierConditions 
          ? editingRecipe.modifierConditions.map(cond => ({
              modifierGroupId: cond.modifierGroupId,
              modifierOptionId: cond.modifierOptionId
            }))
          : selectedCombination?.options.map(opt => ({
              modifierGroupId: opt.modifierGroupId,
              modifierOptionId: opt.modifierOptionId
            }))
        
        console.log('🎨 渲染模态框:', {
          visible: modalVisible,
          editMode: !!editingRecipe,
          recipe: editingRecipe,
          modifierConditions
        })
        
        return (
          <RecipeFormWithSteps
            visible={modalVisible}
            itemId={itemId}
            itemName={itemName}
            recipe={editingRecipe}
            initialModifierConditions={modifierConditions}
            modifierGroups={modifierGroups}
            onClose={() => setModalVisible(false)}
            onSuccess={handleModalSuccess}
          />
        )
      })()}
    </Space>
  )
}

export default RecipeByModifierManager

