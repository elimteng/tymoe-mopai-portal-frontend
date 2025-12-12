import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, message, Space, Tag, Select } from 'antd'
import { getStepTypes, createRecipe, updateRecipe, updateRecipeSteps } from '@/services/recipe'
import type { Recipe, StepType, RecipeCondition } from '@/services/recipe/types'
import type { ItemModifierGroup } from '@/services/item-management'
import RecipeStepEditor from './RecipeStepEditor'

interface RecipeFormWithStepsProps {
  visible: boolean
  itemId: string
  itemName?: string  // 新增：商品名称
  recipe?: Recipe  // 如果提供，则为编辑模式
  initialModifierConditions?: Array<{
    modifierGroupId: string
    modifierOptionId: string
  }>
  modifierGroups?: ItemModifierGroup[]  // 新增：自定义选项组列表，用于显示名称
  onClose: () => void
  onSuccess: () => void
}

/**
 * 配方创建/编辑表单（带步骤编辑器）
 * 
 * 新建流程：
 * 1. 输入商品打印代码（如：LICE）
 * 2. 选择步骤并输入instruction
 * 3. 设备步骤可以包含其他步骤
 * 4. 自动生成完整的recipe打印代码
 * 5. 保存到数据库
 */
const RecipeFormWithSteps: React.FC<RecipeFormWithStepsProps> = ({
  visible,
  itemId,
  itemName,
  recipe,
  initialModifierConditions,
  modifierGroups = [],
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  const [steps, setSteps] = useState<Array<{
    stepTypeId: string
    instruction?: string
    containedSteps?: number[]
  }>>([])
  const [generatedPrintCode, setGeneratedPrintCode] = useState<string>('')  // 自动生成的打印代码
  const [selectedModifierGroupId, setSelectedModifierGroupId] = useState<string>('')  // 选择的自定义选项组
  const [selectedModifierOptionId, setSelectedModifierOptionId] = useState<string>('')  // 选择的自定义选项

  useEffect(() => {
    if (visible) {
      loadStepTypes()
      if (recipe) {
        // 编辑模式：加载现有数据
        console.log('📝 编辑模式 - 加载配方数据:', recipe)

        form.setFieldsValue({
          description: recipe.description
        })

        // 从现有的修饰符条件中提取选项（如果有多个则只显示第一个）
        if (recipe.modifierConditions && recipe.modifierConditions.length > 0) {
          const firstCondition = recipe.modifierConditions[0]
          setSelectedModifierGroupId(firstCondition.modifierGroupId)
          setSelectedModifierOptionId(firstCondition.modifierOptionId)
          console.log('📝 从配方加载自定义选项:', firstCondition)
        }

        // 加载现有步骤
        if (recipe.steps && recipe.steps.length > 0) {
          console.log('📝 加载配方步骤 - 原始数据:', recipe.steps)

          // 创建步骤ID到索引的映射
          const stepIdToIndex = new Map<string, number>()
          recipe.steps.forEach((step, index) => {
            if (step.id) {
              stepIdToIndex.set(step.id, index)
              console.log(`  🔗 步骤映射: ID ${step.id} → 索引 ${index}`)
            }
          })

          console.log('📝 完整的ID到索引映射:', Array.from(stepIdToIndex.entries()))

          // 转换步骤格式：后端 RecipeStep → 前端编辑器格式
          const editorSteps = recipe.steps.map((step: any, stepIndex) => {
            console.log(`\n  📦 处理步骤 ${stepIndex + 1}:`, {
              id: step.id,
              stepTypeId: step.stepTypeId,
              instruction: step.instruction,
              containedSteps: step.containedSteps,
              ingredients: step.ingredients,
              stepNumber: step.stepNumber
            })

            // 转换包含关系数据 → 前端编辑器格式（索引数组）
            let containedStepsIndices: number[] | undefined = undefined

            // 方式1：从 containedSteps 字段获取（后端返回的完整步骤对象数组）
            if (step.containedSteps && Array.isArray(step.containedSteps) && step.containedSteps.length > 0) {
              console.log(`    🔍 从 containedSteps 获取包含关系:`, step.containedSteps)

              // containedSteps 是完整步骤对象数组，需要提取 stepNumber 并转换为索引
              containedStepsIndices = step.containedSteps
                .map((containedStep: any) => {
                  // stepNumber 从 1 开始，索引从 0 开始
                  const index = containedStep.stepNumber - 1
                  console.log(`      - 步骤 ${containedStep.stepNumber} (${containedStep.stepTypeName}) → 索引 ${index}`)
                  return index
                })
                .filter((index: number) => index >= 0)

              console.log(`    ✅ 转换后的索引数组: [${containedStepsIndices}]`)
            }
            // 方式2：从 metadata.containedStepIndices 获取（直接存储的索引）
            else if (step.metadata?.containedStepIndices && Array.isArray(step.metadata.containedStepIndices)) {
              console.log(`    🔍 从 metadata.containedStepIndices 获取:`, step.metadata.containedStepIndices)
              containedStepsIndices = step.metadata.containedStepIndices
              console.log(`    ✅ 使用存储的索引数组: [${containedStepsIndices}]`)
            }
            // 方式3：从 ingredients 字段获取（旧格式兼容）
            else if (step.ingredients) {
              console.log(`    🔍 从 ingredients 获取包含关系（旧格式）:`, step.ingredients)

              let ingredientStepNumbers: number[] = []

              if (Array.isArray(step.ingredients)) {
                ingredientStepNumbers = step.ingredients
                  .map((ing: any) => ing.stepNumber)
                  .filter((num: any) => typeof num === 'number')
              } else if (typeof step.ingredients === 'string') {
                const matches = step.ingredients.match(/步骤(\d+):/g)
                if (matches) {
                  ingredientStepNumbers = matches
                    .map((match: string) => {
                      const num = match.match(/\d+/)
                      return num ? parseInt(num[0]) : 0
                    })
                    .filter((n: number) => n > 0)
                }
              }

              containedStepsIndices = ingredientStepNumbers.map(num => num - 1)
              console.log(`    ✅ 从 stepNumber 转换为索引: [${containedStepsIndices}]`)
            }

            const result = {
              stepTypeId: step.stepTypeId,
              instruction: step.instruction,
              containedSteps: containedStepsIndices
            }

            console.log(`    ✅ 最终步骤数据:`, result)
            return result
          })

          console.log('\n📝 所有转换后的步骤:', editorSteps)
          setSteps(editorSteps)
        } else {
          console.log('⚠️ 配方没有步骤数据')
          setSteps([])
        }

        // 设置初始的打印代码
        if (recipe.printCode) {
          setGeneratedPrintCode(recipe.printCode)
        }
      } else {
        // 创建模式
        form.resetFields()
        setSteps([])
        setGeneratedPrintCode('')
        setSelectedModifierGroupId('')
        setSelectedModifierOptionId('')

        // 如果提供了初始的修饰符条件，使用第一个
        if (initialModifierConditions && initialModifierConditions.length > 0) {
          const firstCondition = initialModifierConditions[0]
          setSelectedModifierGroupId(firstCondition.modifierGroupId)
          setSelectedModifierOptionId(firstCondition.modifierOptionId)
        }
      }
    }
  }, [visible, recipe, initialModifierConditions])

  const loadStepTypes = async () => {
    try {
      const types = await getStepTypes()
      console.log('🔧 加载的步骤类型:', types)
      
      // 为设备类型自动添加容器属性（如果后端没有返回）
      const processedTypes = types.map(type => {
        if (type.category === 'equipment') {
          console.log(`⚙️ 处理设备步骤: ${type.name}`, {
            code: type.code,
            isContainer: type.isContainer,
            containerPrefix: type.containerPrefix,
            containerSuffix: type.containerSuffix
          })
          
          // 如果没有设置 isContainer，自动设置为容器步骤
          // 但保留原有的 containerPrefix 和 containerSuffix（可能为空字符串，表示自定义符号）
          if (type.isContainer === undefined) {
            console.log(`  → 自动设置为容器步骤`)
            return {
              ...type,
              isContainer: true
              // 不设置默认的 containerPrefix 和 containerSuffix
              // 如果后端返回空字符串，表示使用自定义符号（code本身）
            }
          }
        }
        return type
      })
      
      console.log('✅ 处理后的步骤类型:', processedTypes)
      setStepTypes(processedTypes)
    } catch (error: any) {
      message.error('加载步骤类型失败: ' + error.message)
    }
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()

      // 验证步骤
      if (steps.length === 0) {
        message.error('请至少添加一个制作步骤')
        return
      }

      // 验证每个步骤都选择了步骤类型
      const hasEmptyStepType = steps.some(step => !step.stepTypeId)
      if (hasEmptyStepType) {
        message.error('请为所有步骤选择步骤类型')
        return
      }

      // 验证打印代码已生成
      if (!generatedPrintCode) {
        message.error('打印代码生成失败，请检查步骤配置')
        return
      }

      setLoading(true)

      if (recipe) {
        // 编辑模式
        await updateRecipe(recipe.id, {
          printCode: generatedPrintCode,  // 使用自动生成的打印代码
          description: values.description
        })

        // 更新步骤
        if (steps.length > 0) {
          await updateRecipeSteps(recipe.id, {
            steps: steps.map((step, index) => ({
              stepTypeId: step.stepTypeId,
              displayOrder: index + 1,
              instruction: step.instruction,
              // 后端期望 metadata 格式，而不是 containedSteps
              metadata: step.containedSteps && step.containedSteps.length > 0
                ? { containedStepIndices: step.containedSteps }
                : null
            }))
          })
        }

        message.success('更新配方成功')
      } else {
        // 创建模式
        // 构建条件数组：使用用户选择的修饰符选项，如果没有选择则允许空数组（默认配方）
        const conditions: RecipeCondition[] = []
        if (selectedModifierGroupId && selectedModifierOptionId) {
          conditions.push({
            modifierGroupId: selectedModifierGroupId,
            modifierOptionId: selectedModifierOptionId
          })
        }

        // 如果有初始条件但用户没有选择，也可以使用初始条件
        // 但优先使用用户选择的条件
        if (conditions.length === 0 && initialModifierConditions && initialModifierConditions.length > 0) {
          conditions.push(...initialModifierConditions)
        }

        await createRecipe({
          itemId,
          printCode: generatedPrintCode,  // 使用自动生成的打印代码
          description: values.description,
          conditions,
          steps: steps.map((step, index) => ({
            stepTypeId: step.stepTypeId,
            displayOrder: index + 1,
            instruction: step.instruction,
            // 后端期望 metadata 格式，而不是 containedSteps
            metadata: step.containedSteps && step.containedSteps.length > 0
              ? { containedStepIndices: step.containedSteps }
              : null
          }))
        })

        message.success('创建配方成功')
      }

      onSuccess()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
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
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* 自定义选项选择器 - 仅在创建模式下允许修改 */}
        {!recipe && modifierGroups && modifierGroups.length > 0 && (
          <>
            {/* 选择自定义选项组 */}
            <Form.Item
              label="自定义选项组"
              tooltip="选择一个自定义选项组，此配方将应用于该选项"
            >
              <Select
                placeholder="选择自定义选项组（可选）"
                value={selectedModifierGroupId || undefined}
                onChange={setSelectedModifierGroupId}
                allowClear
                options={modifierGroups.map(mg => ({
                  label: mg.group?.displayName || mg.group?.name,
                  value: mg.group!.id
                }))}
              />
            </Form.Item>

            {/* 选择自定义选项 */}
            {selectedModifierGroupId && (
              <Form.Item
                label="自定义选项"
                tooltip="选择该组中的具体选项"
              >
                <Select
                  placeholder="选择自定义选项"
                  value={selectedModifierOptionId || undefined}
                  onChange={setSelectedModifierOptionId}
                  allowClear
                  options={
                    modifierGroups
                      .find(mg => mg.group?.id === selectedModifierGroupId)
                      ?.group?.options?.map(opt => ({
                        label: `${opt.displayName || opt.name}${opt.code ? ` (${opt.code})` : ''}`,
                        value: opt.id
                      })) || []
                  }
                />
              </Form.Item>
            )}
          </>
        )}

        {/* 显示当前选择的自定义选项 */}
        {(selectedModifierGroupId || recipe?.modifierConditions?.length || initialModifierConditions?.length) && (
          <Form.Item label={recipe ? '当前配置的自定义选项' : '配置的自定义选项'}>
            <Space wrap>
              {selectedModifierGroupId && selectedModifierOptionId ? (
                (() => {
                  const group = modifierGroups.find(mg => mg.group?.id === selectedModifierGroupId)
                  const option = group?.group?.options?.find(opt => opt.id === selectedModifierOptionId)
                  return (
                    <Tag color="blue">
                      {group?.group?.displayName || group?.group?.name}: {option?.displayName || option?.name}
                      {option?.code && <span> ({option.code})</span>}
                    </Tag>
                  )
                })()
              ) : recipe?.modifierConditions && recipe.modifierConditions.length > 0 ? (
                recipe.modifierConditions.map((cond, i) => {
                  const group = modifierGroups.find(mg => mg.group?.id === cond.modifierGroupId)
                  const option = group?.group?.options?.find(opt => opt.id === cond.modifierOptionId)
                  return (
                    <Tag key={i} color="blue">
                      {group?.group?.displayName || group?.group?.name || cond.modifierGroupId}: {option?.displayName || option?.name || cond.modifierOptionId}
                      {option?.code && <span> ({option.code})</span>}
                    </Tag>
                  )
                })
              ) : initialModifierConditions && initialModifierConditions.length > 0 ? (
                initialModifierConditions.map((cond, i) => {
                  const group = modifierGroups.find(mg => mg.group?.id === cond.modifierGroupId)
                  const option = group?.group?.options?.find(opt => opt.id === cond.modifierOptionId)
                  return (
                    <Tag key={i} color="blue">
                      {group?.group?.displayName || group?.group?.name || cond.modifierGroupId}: {option?.displayName || option?.name || cond.modifierOptionId}
                      {option?.code && <span> ({option.code})</span>}
                    </Tag>
                  )
                })
              ) : (
                <Tag color="default">默认配方（无自定义选项）</Tag>
              )}
            </Space>
          </Form.Item>
        )}

        {/* 编辑模式提示 */}
        {recipe && recipe.modifierConditions && recipe.modifierConditions.length > 0 && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
            <strong>注意：</strong>如需修改自定义选项，请删除此配方后重新创建新配方。编辑模式只支持修改打印代码、描述和制作步骤。
          </div>
        )}

        {/* 自动生成的打印代码显示 */}
        {generatedPrintCode && (
          <Form.Item label="商品打印代码">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color="green" style={{ fontSize: 16, padding: '8px 16px', fontFamily: 'monospace' }}>
                {generatedPrintCode}
              </Tag>
              <div style={{ color: '#666', fontSize: 12 }}>
                此代码由制作步骤自动生成，可供后续打印
              </div>
            </Space>
          </Form.Item>
        )}

        {/* 描述 */}
        <Form.Item
          label="描述"
          name="description"
        >
          <Input.TextArea rows={2} placeholder="配方描述（可选）" />
        </Form.Item>

        {/* 步骤编辑器 */}
        <Form.Item
          label="制作步骤"
          required
          tooltip="添加制作步骤，系统会自动生成打印代码"
        >
          <RecipeStepEditor
            value={steps}
            onChange={setSteps}
            onPrintCodeChange={setGeneratedPrintCode}
            stepTypes={stepTypes}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default RecipeFormWithSteps

