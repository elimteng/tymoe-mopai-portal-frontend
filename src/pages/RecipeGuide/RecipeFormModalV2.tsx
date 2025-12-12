import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Space, Card, message, Select, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { createRecipe, updateRecipe, updateRecipeSteps, getStepTypes } from '@/services/recipe'
import type { Recipe, RecipeCondition, RecipeStep, StepType } from '@/services/recipe/types'
import type { ItemModifierGroup } from '@/services/item-management'

interface RecipeFormModalV2Props {
  visible: boolean
  recipe?: Recipe
  itemId: string
  itemName?: string  // 新增：商品名称
  initialModifierConditions?: RecipeCondition[]  // 新增：初始自定义选项条件
  modifierGroups: ItemModifierGroup[]
  onClose: () => void
  onSuccess: () => void
}

const RecipeFormModalV2: React.FC<RecipeFormModalV2Props> = ({
  visible,
  recipe,
  itemId,
  itemName,
  initialModifierConditions,
  modifierGroups,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  const [steps, setSteps] = useState<Array<RecipeStep & { _tempId?: string }>>([])

  useEffect(() => {
    if (visible) {
      loadStepTypes()
      if (recipe) {
        // 编辑模式
        form.setFieldsValue({
          printCode: recipe.printCode,
          displayCodeString: recipe.displayCodeString,
          description: recipe.description
        })
        setSteps(recipe.steps || [])
      } else {
        // 创建模式
        form.resetFields()
        // 如果有初始自定义选项条件，生成建议的打印代码
        if (initialModifierConditions && initialModifierConditions.length > 0) {
          const suggestedCode = generateSuggestedPrintCode(initialModifierConditions)
          form.setFieldsValue({
            printCode: suggestedCode.code,
            displayCodeString: suggestedCode.display
          })
        }
        setSteps([])
      }
    }
  }, [visible, recipe, initialModifierConditions])

  // 根据自定义选项条件生成建议的打印代码
  const generateSuggestedPrintCode = (conditions: RecipeCondition[]) => {
    const displayParts: string[] = []
    const codeParts: string[] = []

    conditions.forEach(cond => {
      const group = modifierGroups.find(mg => mg.group?.id === cond.modifierGroupId)
      const option = group?.group?.options?.find(opt => opt.id === cond.modifierOptionId)
      
      if (option) {
        displayParts.push(option.displayName || option.name)
        // 取首字母作为代码
        codeParts.push((option.displayName || option.name).charAt(0).toUpperCase())
      }
    })

    return {
      code: codeParts.join(''),
      display: displayParts.join('-')
    }
  }

  const loadStepTypes = async () => {
    try {
      const data = await getStepTypes()
      setStepTypes(data || [])
    } catch (error: any) {
      console.error('加载步骤类型失败:', error)
      message.error(error.message || '加载步骤类型失败')
      setStepTypes([])
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 验证步骤
      if (steps.length > 0) {
        const invalidSteps = steps.filter(step => !step.stepTypeId)
        if (invalidSteps.length > 0) {
          message.error('请为所有步骤选择步骤类型！')
          setLoading(false)
          return
        }
      }

      if (recipe) {
        // 更新模式：分两步操作
        // 1. 更新配方基本信息
        await updateRecipe(recipe.id, {
          printCode: values.printCode,
          displayCodeString: values.displayCodeString,
          description: values.description
        })

        // 2. 如果步骤有变化，更新步骤
        if (steps.length > 0) {
          await updateRecipeSteps(recipe.id, {
            steps: steps.map((step, index) => ({
              stepTypeId: step.stepTypeId,
              displayOrder: index + 1,
              instructions: step.instructions
            }))
          })
        }

        message.success('配方更新成功')
      } else {
        // 创建模式
        if (!initialModifierConditions || initialModifierConditions.length === 0) {
          message.error('缺少自定义选项条件')
          setLoading(false)
          return
        }

        await createRecipe({
          itemId,
          printCode: values.printCode,
          displayCodeString: values.displayCodeString,
          description: values.description,
          conditions: initialModifierConditions,
          steps: steps.map((step, index) => ({
            stepTypeId: step.stepTypeId,
            displayOrder: index + 1,
            instructions: step.instructions
          }))
        })

        message.success('配方创建成功')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    setSteps([
      ...steps,
      {
        stepTypeId: '' as any,
        displayOrder: steps.length + 1,
        instructions: '',
        _tempId: `temp-${Date.now()}`
      } as any
    ])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    setSteps(newSteps)
  }

  const updateStep = (index: number, field: keyof RecipeStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  // 渲染自定义选项条件标签
  const renderConditionTags = () => {
    if (!initialModifierConditions || initialModifierConditions.length === 0) {
      return null
    }

    return (
      <Space wrap>
        {initialModifierConditions.map((cond, index) => {
          const group = modifierGroups.find(mg => mg.group?.id === cond.modifierGroupId)
          const option = group?.group?.options?.find(opt => opt.id === cond.modifierOptionId)
          
          return (
            <Tag key={index} color="blue">
              {group?.group?.displayName || '自定义选项'}: {option?.displayName || option?.name || '未知'}
            </Tag>
          )
        })}
      </Space>
    )
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{recipe ? '编辑配方' : '创建配方'}</span>
          {itemName && (
            <Tag color="blue" style={{ margin: 0 }}>
              {itemName}
            </Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          保存
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        {/* 显示自定义选项条件 */}
        {!recipe && initialModifierConditions && initialModifierConditions.length > 0 && (
          <Form.Item label="适用条件">
            {renderConditionTags()}
          </Form.Item>
        )}

        <Form.Item
          name="printCode"
          label="打印代码"
          rules={[{ required: true, message: '请输入打印代码' }]}
          tooltip="用于订单打印的代码，如 LICE、MHOT"
        >
          <Input placeholder="如: LICE, MHOT" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="displayCodeString"
          label="显示代码"
          tooltip="用于显示的代码，如 L-ICE、M-HOT"
        >
          <Input placeholder="如: L-ICE, M-HOT" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea
            placeholder="配方描述"
            rows={2}
          />
        </Form.Item>

        <Card
          title="制作步骤"
          size="small"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addStep}>
              添加步骤
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          {steps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              暂无步骤，点击上方按钮添加
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {steps.map((step, index) => (
                <Card
                  key={step._tempId || step.id || index}
                  size="small"
                  title={`步骤 ${index + 1}`}
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveStep(index, 'up')}
                      />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === steps.length - 1}
                        onClick={() => moveStep(index, 'down')}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeStep(index)}
                      />
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: 'red' }}>* </span>
                        <span style={{ fontWeight: 500 }}>步骤类型</span>
                      </div>
                      <Select
                        placeholder="请选择步骤类型（必填）"
                        value={step.stepTypeId}
                        onChange={(value) => updateStep(index, 'stepTypeId', value)}
                        allowClear
                        style={{ 
                          width: '100%',
                          borderColor: !step.stepTypeId ? '#ff4d4f' : undefined
                        }}
                        showSearch
                        optionFilterProp="label"
                        status={!step.stepTypeId ? 'error' : undefined}
                      >
                        {stepTypes.map(type => (
                          <Select.Option key={type.id} value={type.id} label={type.name}>
                            <Space>
                              <span style={{ 
                                padding: '2px 6px', 
                                background: type.category === 'equipment' ? '#e6f7ff' : '#f0f0f0',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {type.code}
                              </span>
                              <span>{type.name}</span>
                              <span style={{ color: '#999', fontSize: '12px' }}>
                                {type.category === 'equipment' ? '设备' : type.category === 'ingredient' ? '材料' : '操作'}
                              </span>
                            </Space>
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <div style={{ marginBottom: '4px', fontWeight: 500 }}>
                        操作说明
                      </div>
                      <Input.TextArea
                        placeholder="详细的操作说明（可选）"
                        value={step.instructions}
                        onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </Form>
    </Modal>
  )
}

export default RecipeFormModalV2














