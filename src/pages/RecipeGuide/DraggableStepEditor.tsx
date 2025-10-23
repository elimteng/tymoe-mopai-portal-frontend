import React from 'react'
import { Card, Input, InputNumber, Switch, Button, Space, Empty, Tag, Divider } from 'antd'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { HolderOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { RecipeStep, StepType } from '@/services/recipe'

interface DraggableStepEditorProps {
  steps: RecipeStep[]
  stepTypes: StepType[]
  onChange: (steps: RecipeStep[]) => void
}

const DraggableStepEditor: React.FC<DraggableStepEditorProps> = ({
  steps,
  stepTypes,
  onChange
}) => {
  const { t } = useTranslation()
  
  // 直接使用传入的stepTypes，不需要state
  // 如果没有数据，显示提示信息
  const availableStepTypes = stepTypes

  // 调试日志
  console.log('🎨 DraggableStepEditor 接收到的 stepTypes:', stepTypes)
  console.log('🎨 availableStepTypes 数量:', availableStepTypes.length)
  
  if (!availableStepTypes || availableStepTypes.length === 0) {
    console.warn('⚠️ 步骤类型库为空！请先在"步骤类型管理"中创建步骤类型。')
  }

  // 拖拽结束处理
  const handleDragEnd = (result: DropResult) => {
    console.log('🎯 拖拽结束:', result)
    
    if (!result.destination) {
      console.log('❌ 没有目标位置')
      return
    }

    const { source, destination } = result
    console.log('📍 源:', source.droppableId, source.index)
    console.log('📍 目标:', destination.droppableId, destination.index)

    // 从步骤类型库拖到步骤列表
    if (source.droppableId === 'stepTypes' && destination.droppableId === 'steps') {
      console.log('✅ 从步骤类型库拖到步骤列表')
      const stepType = availableStepTypes[source.index]
      console.log('📦 选中的步骤类型:', stepType)
      
      const newStep: RecipeStep = {
        stepTypeId: stepType.id,
        title: stepType.name,
        amount: '',
        duration: undefined,
        isCritical: false,
        isOptional: false
      }
      
      const newSteps = Array.from(steps)
      newSteps.splice(destination.index, 0, newStep)
      console.log('📝 新的步骤列表:', newSteps)
      onChange(newSteps)
      return
    }

    // 在步骤列表内重新排序
    if (source.droppableId === 'steps' && destination.droppableId === 'steps') {
      console.log('✅ 在步骤列表内重新排序')
      const newSteps = Array.from(steps)
      const [removed] = newSteps.splice(source.index, 1)
      newSteps.splice(destination.index, 0, removed)
      onChange(newSteps)
      return
    }
  }

  // 更新步骤
  const updateStep = (index: number, field: keyof RecipeStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    onChange(newSteps)
  }

  // 删除步骤
  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    onChange(newSteps)
  }

  // 添加空白步骤
  const addBlankStep = () => {
    const newStep: RecipeStep = {
      title: '',
      amount: '',
      isCritical: false,
      isOptional: false
    }
    onChange([...steps, newStep])
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* 左侧：步骤类型库 */}
        <Card
          title="步骤类型库"
          size="small"
          style={{ width: '280px', flexShrink: 0 }}
          bodyStyle={{ padding: '8px', maxHeight: '500px', overflowY: 'auto' }}
        >
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#999' }}>
            💡 拖拽到右侧添加步骤
          </div>
          
          <Droppable droppableId="stepTypes" isDropDisabled={true}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {availableStepTypes.map((stepType, index) => (
                  <Draggable
                    key={stepType.id}
                    draggableId={`stepType-${stepType.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          marginBottom: '8px',
                          padding: '8px 12px',
                          background: snapshot.isDragging ? '#e6f7ff' : '#fafafa',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <HolderOutlined style={{ color: '#999' }} />
                        <Tag color="blue" style={{ margin: 0 }}>
                          {stepType.code}
                        </Tag>
                        <span style={{ flex: 1 }}>{stepType.name}</span>
                        <Tag color={
                          stepType.category === 'ingredient' ? 'green' :
                          stepType.category === 'equipment' ? 'orange' : 'purple'
                        }>
                          {stepType.category === 'ingredient' ? '原料' :
                           stepType.category === 'equipment' ? '设备' : '动作'}
                        </Tag>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </Card>

        {/* 右侧：步骤列表 */}
        <Card
          title={
            <Space>
              <span>制作步骤</span>
              <Tag color="blue">{steps.length} 个步骤</Tag>
            </Space>
          }
          size="small"
          style={{ flex: 1 }}
          extra={
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={addBlankStep}
            >
              添加空白步骤
            </Button>
          }
        >
          <Droppable droppableId="steps">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minHeight: '400px',
                  background: snapshot.isDraggingOver ? '#f0f5ff' : 'transparent',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                {steps.length === 0 ? (
                  <Empty
                    description="从左侧拖拽步骤类型到这里，或点击上方按钮添加空白步骤"
                    style={{ padding: '60px 0' }}
                  />
                ) : (
                  steps.map((step, index) => (
                    <Draggable
                      key={`step-${index}`}
                      draggableId={`step-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          size="small"
                          style={{
                            marginBottom: '12px',
                            background: snapshot.isDragging ? '#e6f7ff' : '#fff',
                            border: snapshot.isDragging ? '2px solid #1890ff' : '1px solid #d9d9d9'
                          }}
                          title={
                            <Space>
                              <div {...provided.dragHandleProps} style={{ cursor: 'grab' }}>
                                <HolderOutlined style={{ fontSize: '16px', color: '#999' }} />
                              </div>
                              <Tag color="blue">步骤 {index + 1}</Tag>
                              {step.stepTypeId && (
                                <Tag color="green">
                                  {stepTypes.find(t => t.id === step.stepTypeId)?.code}
                                </Tag>
                              )}
                            </Space>
                          }
                          extra={
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => removeStep(index)}
                            />
                          }
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {/* 步骤标题 */}
                            <Input
                              placeholder="步骤标题"
                              value={step.title}
                              onChange={(e) => updateStep(index, 'title', e.target.value)}
                              style={{ fontWeight: 500 }}
                            />

                            {/* 用量和耗时 */}
                            <Space style={{ width: '100%' }}>
                              <Input
                                placeholder="数量/用量 (如: 200ml, 8块)"
                                value={step.amount}
                                onChange={(e) => updateStep(index, 'amount', e.target.value)}
                                style={{ width: '200px' }}
                              />
                              <InputNumber
                                placeholder="耗时"
                                value={step.duration}
                                onChange={(value) => updateStep(index, 'duration', value)}
                                min={0}
                                addonAfter="秒"
                                style={{ width: '120px' }}
                              />
                            </Space>

                            {/* 打印代码预览 */}
                            {step.printCode && (
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                打印代码: <code style={{ color: '#1890ff' }}>{step.printCode}</code>
                              </div>
                            )}

                            <Divider style={{ margin: '8px 0' }} />

                            {/* 选项 */}
                            <Space>
                              <span>
                                <Switch
                                  checked={step.isCritical}
                                  onChange={(checked) => updateStep(index, 'isCritical', checked)}
                                  size="small"
                                />
                                {' '}关键步骤
                              </span>
                              <span>
                                <Switch
                                  checked={step.isOptional}
                                  onChange={(checked) => updateStep(index, 'isOptional', checked)}
                                  size="small"
                                />
                                {' '}可选步骤
                              </span>
                            </Space>
                          </Space>
                        </Card>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </Card>
      </div>
    </DragDropContext>
  )
}

export default DraggableStepEditor
