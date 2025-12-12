import React, { useState, useEffect } from 'react'
import { Form, Select, Input, Button, Space, Card, Tag, Alert, Divider, Checkbox } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { StepType } from '@/services/recipe/types'
import { generateStepPreviews, type StepPreview } from '@/utils/printCodeGenerator'

interface RecipeStepEditorProps {
  value?: Array<{
    stepTypeId: string
    instruction?: string
    containedSteps?: number[]
  }>
  onChange?: (steps: Array<{
    stepTypeId: string
    instruction?: string
    containedSteps?: number[]
  }>) => void
  onPrintCodeChange?: (printCode: string) => void  // 新增：打印代码变化回调
  stepTypes: StepType[]
}

/**
 * 配方步骤编辑器
 * 
 * 功能：
 * 1. 选择步骤类型
 * 2. 输入instruction
 * 3. 设备步骤可以包含其他步骤
 * 4. 实时显示生成的打印代码
 */
const RecipeStepEditor: React.FC<RecipeStepEditorProps> = ({
  value = [],
  onChange,
  onPrintCodeChange,
  stepTypes
}) => {
  const [steps, setSteps] = useState(value)

  useEffect(() => {
    setSteps(value)
  }, [value])

  // 创建步骤类型映射
  const stepTypeMap = new Map<string, StepType>()
  stepTypes.forEach(st => stepTypeMap.set(st.id, st))

  // 生成预览
  const previews = generateStepPreviews(steps, stepTypeMap)

  // 计算最终的recipe打印代码
  const recipePrintCode = previews
    .filter(p => !p.isContained)
    .map(p => p.generatedCode)
    .join(' ')

  // 当打印代码变化时，通知父组件
  useEffect(() => {
    onPrintCodeChange?.(recipePrintCode)
  }, [recipePrintCode, onPrintCodeChange])

  const handleAddStep = () => {
    const newSteps = [...steps, { stepTypeId: '', instruction: '' }]
    setSteps(newSteps)
    onChange?.(newSteps)
  }

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // 更新其他步骤中的containedSteps索引
    const updatedSteps = newSteps.map(step => {
      if (step.containedSteps) {
        return {
          ...step,
          containedSteps: step.containedSteps
            .map(i => (i > index ? i - 1 : i))
            .filter(i => i !== index)
        }
      }
      return step
    })
    setSteps(updatedSteps)
    onChange?.(updatedSteps)
  }

  const handleStepChange = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
    onChange?.(newSteps)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return

    const newSteps = [...steps]
    ;[newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]

    // 更新containedSteps中的索引
    const updatedSteps = newSteps.map(step => {
      if (step.containedSteps) {
        return {
          ...step,
          containedSteps: step.containedSteps.map(i => {
            if (i === index) return newIndex
            if (i === newIndex) return index
            return i
          })
        }
      }
      return step
    })

    setSteps(updatedSteps)
    onChange?.(updatedSteps)
  }

  const handleContainedStepsChange = (index: number, containedIndices: number[]) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], containedSteps: containedIndices }
    setSteps(newSteps)
    onChange?.(newSteps)
  }

  return (
    <div>
      {/* 步骤列表 */}
      {steps.map((step, index) => {
        const stepType = stepTypeMap.get(step.stepTypeId)
        const preview = previews[index]
        const isContained = preview?.isContained

        return (
          <Card
            key={index}
            size="small"
            style={{
              marginBottom: 8,
              border: isContained ? '1px dashed #91d5ff' : undefined,
              backgroundColor: isContained ? '#f0f5ff' : undefined,
              padding: '12px'
            }}
            bodyStyle={{ padding: '8px 12px' }}
            title={
              <Space size="small" style={{ fontSize: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>步骤 {index + 1}</span>
                {stepType?.isContainer && (
                  <Tag color="orange">⚙️ 设备</Tag>
                )}
                {isContained && <Tag color="warning" style={{ fontSize: '11px' }}>被包含</Tag>}
                {preview && (
                  <Tag color="green" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {preview.generatedCode}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => handleMoveStep(index, 'up')}
                  style={{ padding: '0 4px' }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={index === steps.length - 1}
                  onClick={() => handleMoveStep(index, 'down')}
                  style={{ padding: '0 4px' }}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveStep(index)}
                  style={{ padding: '0 4px' }}
                />
              </Space>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* 步骤类型选择 */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  步骤类型
                </label>
                <Select
                  value={step.stepTypeId}
                  onChange={(value) => handleStepChange(index, 'stepTypeId', value)}
                  placeholder="选择"
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                  size="small"
                >
                  {stepTypes.map(st => (
                    <Select.Option key={st.id} value={st.id}>
                      <Space size="small">
                        <Tag style={{ fontSize: '11px' }}>{st.code}</Tag>
                        <span style={{ fontSize: '12px' }}>{st.name}</span>
                        <span style={{ color: '#999', fontSize: '11px' }}>
                          {st.category === 'equipment' ? '设备' : st.category === 'ingredient' ? '材料' : '操作'}
                        </span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Instruction输入 */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  操作说明 (Instruction)
                </label>
                <Input
                  value={step.instruction}
                  onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                  placeholder={stepType?.isContainer ? "按键" : "数量"}
                  size="small"
                />
              </div>
            </div>

            {/* 任何步骤都可以包含其他步骤 */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                包含其他步骤 (可选)
              </div>
              {steps.filter((_, i) => i !== index).length > 0 ? (
                <>
                  <Checkbox.Group
                    value={step.containedSteps || []}
                    onChange={(checkedValues) =>
                      handleContainedStepsChange(index, checkedValues as number[])
                    }
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%', gap: '4px' }}>
                      {steps.map((s, i) => {
                        if (i === index) return null
                        const sType = stepTypeMap.get(s.stepTypeId)
                        if (!sType) return null

                        return (
                          <Checkbox key={i} value={i} style={{ fontSize: '12px' }}>
                            <span style={{ marginRight: '4px' }}>步{i + 1}</span>
                            <Tag style={{ fontSize: '11px' }}>{sType.code}</Tag>
                            {s.instruction && (
                              <Tag style={{ fontSize: '11px' }}>{sType.code}{s.instruction}</Tag>
                            )}
                          </Checkbox>
                        )
                      })}
                    </Space>
                  </Checkbox.Group>
                  {step.containedSteps && step.containedSteps.length > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#1890ff' }}>
                      ✓ 已选择 {step.containedSteps.length} 个步骤
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '11px', color: '#999' }}>
                  暂无其他步骤
                </div>
              )}
            </div>

            {/* 代码预览说明 */}
            {stepType && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
                <span style={{ marginRight: '4px' }}>代码:</span>
                <Tag color="blue" style={{ fontSize: '11px' }}>{stepType.code}</Tag>
                {step.instruction && (
                  <>
                    <span style={{ margin: '0 2px' }}>+</span>
                    <Tag color="green" style={{ fontSize: '11px' }}>{step.instruction}</Tag>
                    <span style={{ margin: '0 2px' }}>=</span>
                    <Tag color="purple" style={{ fontSize: '11px' }}>{stepType.code}{step.instruction}</Tag>
                  </>
                )}
              </div>
            )}
          </Card>
        )
      })}

      {/* 添加步骤按钮 */}
      <Button
        type="dashed"
        onClick={handleAddStep}
        icon={<PlusOutlined />}
        block
      >
        添加步骤
      </Button>

      <Divider />

      {/* 打印代码说明 */}
      <Alert
        message="打印代码规则"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20, fontSize: '12px' }}>
            <li>步骤代码 = 步骤类型代码 + 操作说明</li>
            <li>例：A (代码) + 5 (操作说明) = A5</li>
            <li>步骤包含其他步骤：步骤代码(被包含步骤)操作说明</li>
            <li>例：B(A5 C3) - B包含A5和C3，无操作说明</li>
            <li>例：D(A5 C3)2 - D包含A5和C3，操作说明为2</li>
            <li>被包含的步骤不会单独出现在最终代码中</li>
            <li>最终代码：所有顶层步骤用空格分隔</li>
            <li>例：A5 C3 D(A5 C3)2</li>
          </ul>
        }
        type="info"
        style={{ fontSize: '12px' }}
      />
    </div>
  )
}

export default RecipeStepEditor

