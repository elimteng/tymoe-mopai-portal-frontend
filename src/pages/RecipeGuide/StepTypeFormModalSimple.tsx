import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, Space, message, Radio, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { createStepType, updateStepType, getCodeSuggestions, getEquipmentSymbols } from '@/services/recipe'
import type { StepType, CodeSuggestion, EquipmentSymbol } from '@/services/recipe'

interface StepTypeFormModalProps {
  visible: boolean
  stepType?: StepType
  onClose: () => void
  onSuccess: () => void
}

const StepTypeFormModalSimple: React.FC<StepTypeFormModalProps> = ({
  visible,
  stepType,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<'ingredient' | 'equipment' | 'action'>('ingredient')
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([])
  const [symbols, setSymbols] = useState<EquipmentSymbol[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null)

  useEffect(() => {
    if (visible) {
      if (stepType) {
        // 编辑模式
        form.setFieldsValue(stepType)
        setCategory(stepType.category)
      } else {
        // 创建模式
        form.resetFields()
        setCategory('ingredient')
        setSuggestions([])
      }
      
      // 加载设备符号列表
      if (category === 'equipment') {
        loadEquipmentSymbols()
      }
    }
  }, [visible, stepType, form])

  const loadEquipmentSymbols = async () => {
    try {
      const data = await getEquipmentSymbols()
      setSymbols(data)
    } catch (error: any) {
      console.warn('加载设备符号失败:', error.message)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value.trim()
    
    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // 清空之前的建议
    if (!name) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }
    
    if (stepType) return // 编辑模式不自动获取建议

    // 防抖: 500ms后才发送请求
    setLoadingSuggestions(true)
    const timer = setTimeout(async () => {
      console.log('获取代码建议:', { name, category })
      try {
        const result = await getCodeSuggestions({ name, category })
        console.log('代码建议结果:', result)
        setSuggestions(result.suggestions)
      } catch (error: any) {
        console.error('获取代码建议失败:', error)
        message.warning('获取代码建议失败: ' + error.message)
        setSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }, 500)
    
    setDebounceTimer(timer)
  }

  const handleCategoryChange = (value: 'ingredient' | 'equipment' | 'action') => {
    setCategory(value)
    setSuggestions([])
    form.setFieldValue('code', undefined)
    
    if (value === 'equipment') {
      loadEquipmentSymbols()
    }
  }

  const handleSuggestionClick = (code: string) => {
    form.setFieldValue('code', code)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (stepType) {
        await updateStepType(stepType.id, values)
        message.success(t('pages.recipeGuide.updateSuccess'))
      } else {
        await createStepType(values)
        message.success(t('pages.recipeGuide.createSuccess'))
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || t('pages.recipeGuide.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={stepType ? t('pages.recipeGuide.editStepType') : t('pages.recipeGuide.createStepType')}
      open={visible}
      onCancel={onClose}
      width={600}
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
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
          initialValue="ingredient"
        >
          <Radio.Group onChange={(e) => handleCategoryChange(e.target.value)} disabled={!!stepType}>
            <Radio.Button value="ingredient">原料</Radio.Button>
            <Radio.Button value="equipment">设备</Radio.Button>
            <Radio.Button value="action">动作</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input
            placeholder="例如: 牛奶、搅拌机、加热"
            onChange={handleNameChange}
            disabled={!!stepType}
          />
        </Form.Item>

        {/* 加载提示 */}
        {!stepType && loadingSuggestions && (
          <div style={{ marginBottom: 16, color: '#1890ff', fontSize: '12px' }}>
            正在获取代码建议...
          </div>
        )}

        {/* 代码建议 */}
        {!stepType && !loadingSuggestions && suggestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
              推荐代码 (点击选择):
            </div>
            <Space wrap>
              {suggestions.map((suggestion) => (
                <Tag
                  key={suggestion.code}
                  color="blue"
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => handleSuggestionClick(suggestion.code)}
                >
                  <strong>{suggestion.code}</strong>
                  <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                    {suggestion.description}
                  </span>
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 设备符号列表 */}
        {!stepType && category === 'equipment' && symbols.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
              常用设备符号 (点击选择):
            </div>
            <Space wrap>
              {symbols.map((symbol) => (
                <Tag
                  key={symbol.symbol}
                  color="green"
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => handleSuggestionClick(symbol.symbol)}
                >
                  <strong style={{ fontSize: '16px' }}>{symbol.symbol}</strong>
                  <span style={{ marginLeft: 8, fontSize: '12px' }}>
                    {symbol.name}
                  </span>
                </Tag>
              ))}
            </Space>
            <div style={{ marginTop: 4, fontSize: '11px', color: '#999' }}>
              提示: 设备符号会包裹内容，如 [M200] 表示搅拌机混合牛奶200ml
            </div>
          </div>
        )}

        <Form.Item
          name="code"
          label="代码"
          rules={[{ required: true, message: '请输入或选择代码' }]}
          tooltip="用于打印在杯贴上的简短代码"
        >
          <Input
            placeholder={
              category === 'ingredient' ? '例如: M, T, S' :
              category === 'equipment' ? '例如: [], (), {}' :
              '例如: +, -, *'
            }
            style={{ fontFamily: 'monospace', fontSize: '16px' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default StepTypeFormModalSimple
