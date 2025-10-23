import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Button, Space, Card, message, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { createRecipe, updateRecipe, getStepTypes } from '@/services/recipe'
import type { Recipe, RecipeStep, StepType } from '@/services/recipe'

interface RecipeFormModalProps {
  visible: boolean
  recipe?: Recipe
  itemId: string
  initialAttributeConditions?: Record<string, string>  // 新增：初始属性条件
  onClose: () => void
  onSuccess: () => void
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  visible,
  recipe,
  itemId,
  initialAttributeConditions,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  const [steps, setSteps] = useState<RecipeStep[]>([])

  useEffect(() => {
    if (visible) {
      loadStepTypes()
      if (recipe) {
        // 编辑模式
        form.setFieldsValue({
          name: recipe.name,
          description: recipe.description,
          attributeConditions: recipe.attributeConditions ? JSON.stringify(recipe.attributeConditions, null, 2) : '',
          priority: recipe.priority || 0,
          isDefault: recipe.isDefault,
          isActive: recipe.isActive
        })
        // 编辑模式：初始化步骤，添加_selectedSteps临时字段
        const initialSteps = (recipe.steps || []).map(step => {
          // 从ingredients解析出步骤编号
          let selectedSteps: number[] = []
          if (step.ingredients) {
            if (Array.isArray(step.ingredients)) {
              // 如果是对象数组格式
              selectedSteps = step.ingredients.map((ing: any) => ing.stepNumber)
            } else if (typeof step.ingredients === 'string') {
              // 如果是字符串格式，匹配 "步骤1:", "步骤2:" 等模式
              const matches = step.ingredients.match(/步骤(\d+):/g)
              if (matches) {
                selectedSteps = matches.map((match: string) => {
                  const num = match.match(/\d+/)
                  return num ? parseInt(num[0]) : 0
                }).filter((n: number) => n > 0)
              }
            }
          }
          
          return {
            ...step,
            _selectedSteps: selectedSteps
          }
        })
        setSteps(initialSteps as any)
      } else {
        // 创建模式
        form.resetFields()
        // 如果有初始属性条件，设置到表单
        if (initialAttributeConditions) {
          form.setFieldsValue({
            attributeConditions: JSON.stringify(initialAttributeConditions, null, 2),
            priority: 10
          })
        }
        setSteps([])
      }
    }
  }, [visible, recipe, form])

  const loadStepTypes = async () => {
    try {
      const data = await getStepTypes()
      console.log('📦 加载的步骤类型:', data)
      console.log('📦 步骤类型数量:', data?.length)
      setStepTypes(data || [])
    } catch (error: any) {
      console.error('❌ 加载步骤类型失败:', error)
      message.error(error.message || t('pages.recipeGuide.loadFailed'))
      setStepTypes([])
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 处理attributeConditions: 如果是字符串则解析为JSON
      let attributeConditions = values.attributeConditions
      console.log('📝 原始 attributeConditions:', attributeConditions, 'type:', typeof attributeConditions)
      
      if (typeof attributeConditions === 'string') {
        // 如果是字符串
        if (attributeConditions.trim()) {
          try {
            attributeConditions = JSON.parse(attributeConditions)
            console.log('✅ 解析后的 attributeConditions:', attributeConditions)
          } catch (e) {
            message.error('属性条件格式错误，请输入有效的JSON格式')
            setLoading(false)
            return
          }
        } else {
          attributeConditions = null
        }
      } else if (!attributeConditions || Object.keys(attributeConditions).length === 0) {
        // 如果是空对象或null/undefined
        attributeConditions = null
      }
      
      console.log('🎯 最终 attributeConditions:', attributeConditions)

      // 验证步骤：每个步骤必须有stepTypeId
      const invalidSteps = steps.filter(step => !step.stepTypeId)
      if (invalidSteps.length > 0) {
        message.error('请为所有步骤选择步骤类型！')
        console.error('❌ 以下步骤缺少stepTypeId:', invalidSteps)
        setLoading(false)
        return
      }
      
      console.log('✅ 所有步骤都有stepTypeId，准备发送')

      // 构建payload（不包含tenantId，后端从请求头获取）
      const payload = {
        itemId,
        name: values.name,
        description: values.description,
        version: values.version,
        attributeConditions,  // 重要：属性条件
        priority: values.priority || 10,
        isDefault: values.isDefault || false,
        isActive: values.isActive !== false,  // 默认true
        steps: steps.map((step, index) => {
          // 根据API文档构建步骤数据
          const stepData: any = {
            stepTypeId: step.stepTypeId,  // 必填
            sortOrder: index,              // 排序
            stepNumber: index + 1          // 步骤号（从1开始）
          }
          
          // 可选字段：只在有值时传递
          if (step.amount !== undefined && step.amount !== null && step.amount !== '') {
            stepData.amount = step.amount
          }
          if (step.ingredients) {
            stepData.ingredients = step.ingredients
            console.log(`步骤${index + 1} ingredients:`, step.ingredients)
          }
          if (step.operation) stepData.operation = step.operation
          // printCode由后端自动生成，前端不发送
          if (step.duration) stepData.duration = step.duration
          
          // 注意：不传递_selectedSteps临时字段
          
          console.log(`步骤${index + 1}完整数据:`, stepData)
          return stepData
        })
      }

      console.log('📤 发送到后端的完整payload:', JSON.stringify(payload, null, 2))

      let result
      if (recipe) {
        result = await updateRecipe(recipe.id, payload)
        console.log('📥 后端返回的更新结果:', result)
        console.log('⚠️ 检查步骤保存:')
        console.log('  发送的步骤数:', payload.steps.length)
        console.log('  返回的步骤数:', result.steps?.length || 0)
        
        if (payload.steps.length > 0 && (!result.steps || result.steps.length === 0)) {
          message.warning('配方更新成功，但步骤未保存。这是后端问题。')
        } else {
          message.success(t('pages.recipeGuide.updateSuccess'))
        }
      } else {
        result = await createRecipe(payload)
        console.log('📥 后端返回的创建结果:', result)
        console.log('⚠️ 检查数据保存:')
        console.log('  attributeConditions:', result.attributeConditions ? '✅ 已保存' : '❌ 未保存')
        console.log('  发送的步骤数:', payload.steps.length)
        console.log('  返回的步骤数:', result.steps?.length || 0)
        
        const issues = []
        if (!result.attributeConditions && attributeConditions) {
          issues.push('属性条件')
        }
        if (payload.steps.length > 0 && (!result.steps || result.steps.length === 0)) {
          issues.push('步骤')
        }
        
        if (issues.length > 0) {
          message.warning(`配方创建成功，但${issues.join('和')}未保存。这是后端问题。`)
        } else {
          message.success(t('pages.recipeGuide.createSuccess'))
        }
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error(error.message || t('pages.recipeGuide.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    setSteps([
      ...steps,
      {
        stepTypeId: '' as any,     // 用户必须选择
        amount: '',                // 可选：数量（文本或数字）
        ingredients: '',           // 可选：原料信息（字符串）
        operation: '',             // 可选：操作说明
        duration: undefined,       // 可选：耗时
        sortOrder: steps.length,   // 自动设置排序
        _selectedSteps: [] as number[]  // 临时字段：用于UI选择步骤
        // printCode由后端自动生成
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

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  // 根据API文档，printCode由后端自动生成，前端不需要预览

  return (
    <Modal
      title={recipe ? t('pages.recipeGuide.editRecipe') : t('pages.recipeGuide.createRecipe')}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('pages.recipeGuide.cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {t('pages.recipeGuide.save')}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('pages.recipeGuide.recipeName')}
          tooltip="留空将自动生成为「商品名称配方 #序号」"
        >
          <Input placeholder="留空自动生成" />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('pages.recipeGuide.recipeDescription')}
        >
          <Input.TextArea
            placeholder={t('pages.recipeGuide.recipeDescriptionPlaceholder')}
            rows={2}
          />
        </Form.Item>

        <Form.Item
          name="attributeConditions"
          label="属性条件"
          tooltip="指定此配方适用的属性组合，如 size=large, temperature=cold。留空表示默认配方"
        >
          <Input.TextArea
            placeholder='例如: {"size": "large", "temperature": "cold"}'
            rows={2}
          />
        </Form.Item>

        <Space size="large" style={{ width: '100%' }}>
          <Form.Item
            name="priority"
            label="优先级"
            tooltip="数字越大优先级越高，用于多个配方匹配时的排序"
            initialValue={0}
          >
            <InputNumber min={0} max={100} style={{ width: '120px' }} />
          </Form.Item>

          <Form.Item
            name="isDefault"
            label={t('pages.recipeGuide.isDefault')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={t('pages.recipeGuide.isActive')}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Space>

        <Card
          title={t('pages.recipeGuide.stepsConfig')}
          size="small"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addStep}>
              {t('pages.recipeGuide.addStep')}
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          {steps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              {t('pages.recipeGuide.noSteps')}
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {steps.map((step, index) => (
                <Card
                  key={index}
                  size="small"
                  title={`${t('pages.recipeGuide.stepNumber')} ${index + 1}`}
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
                    {/* 步骤类型选择（必填） */}
                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: 'red' }}>* </span>
                        <span style={{ fontWeight: 500 }}>步骤类型</span>
                      </div>
                      <Select
                        placeholder="请选择步骤类型（必填）"
                        value={step.stepTypeId}
                        onChange={(value) => {
                          updateStep(index, 'stepTypeId', value)
                          // 不自动填充title，让后端处理
                        }}
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

                    {/* 判断是否为设备步骤 */}
                    {step.stepTypeId && stepTypes.find(t => t.id === step.stepTypeId)?.category === 'equipment' ? (
                      <>
                        {/* 设备步骤：显示材料引用选择器 */}
                        <div>
                          <div style={{ marginBottom: '4px', fontWeight: 500 }}>
                            🔧 选择要处理的材料
                          </div>
                          <Select
                            mode="multiple"
                            placeholder="选择要引用的前面步骤（可多选）"
                            value={(step as any)._selectedSteps || []}
                            onChange={(selectedSteps: number[]) => {
                              console.log('选择的步骤:', selectedSteps)
                              const newSteps = [...steps]
                              // 更新临时选择字段
                              newSteps[index] = { 
                                ...newSteps[index], 
                                _selectedSteps: selectedSteps 
                              } as any
                              // 生成ingredients对象数组（API格式）
                              const ingredientsArray = selectedSteps.map(stepNum => ({
                                stepNumber: stepNum
                              }))
                              console.log('生成的ingredients数组:', ingredientsArray)
                              newSteps[index] = {
                                ...newSteps[index],
                                ingredients: ingredientsArray as any
                              } as any
                              setSteps(newSteps)
                              console.log('更新后的步骤:', newSteps[index])
                              console.log('ingredients类型:', typeof newSteps[index].ingredients, Array.isArray(newSteps[index].ingredients))
                            }}
                            style={{ width: '100%' }}
                            maxTagCount="responsive"
                          >
                            {steps.slice(0, index).map((s, i) => {
                              const sType = stepTypes.find(t => t.id === s.stepTypeId)
                              return (
                                <Select.Option key={i + 1} value={i + 1}>
                                  步骤{i + 1}: {sType?.name || '未命名'} {s.amount ? `(${s.amount})` : ''}
                                </Select.Option>
                              )
                            })}
                          </Select>
                        </div>

                        {/* 操作（仅设备步骤显示） */}
                        <Input
                          placeholder="操作（如：搅拌、加热、冷却）"
                          value={step.operation}
                          onChange={(e) => updateStep(index, 'operation', e.target.value)}
                        />
                      </>
                    ) : (
                      // 普通步骤：只显示数量输入（支持文本）
                      <Input
                        placeholder="数量（如: 200ml, 8oz, 30g, 1杯）"
                        value={step.amount}
                        onChange={(e) => updateStep(index, 'amount', e.target.value)}
                        style={{ width: '100%' }}
                      />
                    )}

                    {/* 耗时 */}
                    <InputNumber
                      placeholder="耗时"
                      value={step.duration}
                      onChange={(value) => updateStep(index, 'duration', value)}
                      min={0}
                      addonAfter="秒"
                      style={{ width: '150px' }}
                    />

                    {/* 提示信息 */}
                    <div style={{ 
                      padding: '8px 12px',
                      background: '#e6f7ff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      💡 <strong>打印代码</strong>由后端根据步骤类型和原料信息自动生成，保存后可查看
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

export default RecipeFormModal
