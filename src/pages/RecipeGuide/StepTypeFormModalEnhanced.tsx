import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, Space, message, Radio, Tag, Alert } from 'antd'
import { useTranslation } from 'react-i18next'
import { createStepType, updateStepType, getStepTypes, getCodeSuggestions } from '@/services/recipe'
import type { StepType, CodeSuggestion } from '@/services/recipe'

interface StepTypeFormModalProps {
  visible: boolean
  stepType?: StepType
  existingStepTypes?: StepType[]
  onClose: () => void
  onSuccess: () => void
}

// 预设容器符号 - 在组件内获取翻译
const getPresetBrackets = (t: any) => [
  { value: '[]', label: t('pages.recipeGuide.presetBracketSquare'), prefix: '[', suffix: ']' },
  { value: '()', label: t('pages.recipeGuide.presetBracketRound'), prefix: '(', suffix: ')' },
  { value: '{}', label: t('pages.recipeGuide.presetBracketCurly'), prefix: '{', suffix: '}' },
  { value: '<>', label: t('pages.recipeGuide.presetBracketAngle'), prefix: '<', suffix: '>' },
  { value: '//', label: 'Slash //  ', prefix: '/', suffix: '/' },
  { value: '\\\\', label: 'Backslash \\\\  ', prefix: '\\', suffix: '\\' },
  { value: '**', label: 'Asterisk **', prefix: '*', suffix: '*' },
  { value: '--', label: 'Dash --', prefix: '-', suffix: '-' },
  { value: '||', label: 'Pipe ||', prefix: '|', suffix: '|' },
  { value: '``', label: 'Backtick ``', prefix: '`', suffix: '`' },
]

const StepTypeFormModalEnhanced: React.FC<StepTypeFormModalProps> = ({
  visible,
  stepType,
  existingStepTypes = [],
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<'ingredient' | 'equipment' | 'action'>('ingredient')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null) // null表示自定义
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null)

  useEffect(() => {
    if (visible) {
      if (stepType) {
        // 编辑模式
        form.setFieldsValue({
          name: stepType.name,
          code: stepType.code,
          category: stepType.category,
          description: stepType.description,
          isContainer: stepType.isContainer
        })
        setCategory(stepType.category)
        
        // 判断是预设还是自定义符号
        if (stepType.isContainer && stepType.containerPrefix && stepType.containerSuffix) {
          const presetBrackets = getPresetBrackets(t)
          const preset = presetBrackets.find(
            b => b.prefix === stepType.containerPrefix && b.suffix === stepType.containerSuffix
          )
          setSelectedPreset(preset ? preset.value : null)
        } else {
          setSelectedPreset(null)
        }
      } else {
        // 创建模式
        form.resetFields()
        setCategory('ingredient')
        setSelectedPreset(null)
      }
    }
  }, [visible, stepType, form])

  const handleCategoryChange = (value: 'ingredient' | 'equipment' | 'action') => {
    setCategory(value)
    setSuggestions([]) // 清空建议
    if (value === 'equipment') {
      form.setFieldValue('isContainer', true)
    } else {
      form.setFieldValue('isContainer', false)
    }
  }

  // 名称输入变化时获取代码建议
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

  // 点击建议的代码
  const handleSuggestionClick = (code: string) => {
    form.setFieldValue('code', code)
    setSelectedPreset(null) // 清除预设选择
  }

  // 点击预设符号 - 清空code字段，让用户输入其他信息（比如按键）
  const handlePresetClick = (bracketValue: string) => {
    setSelectedPreset(bracketValue)
    // 清空code字段，用于用户输入其他信息（如按键、指令等）
    form.setFieldValue('code', '')
  }

  // 用户手动输入code时，取消预设选择
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 如果用户输入了内容，取消预设选择
    if (value) {
      setSelectedPreset(null)
    }
  }

  // 验证Code唯一性
  const validateCodeUniqueness = (_: any, value: string) => {
    if (!value) return Promise.resolve()

    // 编辑模式：允许使用自己原来的code
    if (stepType && value === stepType.code) {
      return Promise.resolve()
    }

    // 检查是否与其他步骤类型重复
    const isDuplicate = existingStepTypes.some(
      st => st.code.toLowerCase() === value.toLowerCase() && st.id !== stepType?.id
    )

    if (isDuplicate) {
      // 返回拒绝且使用翻译的错误消息
      return Promise.reject(t('pages.recipeGuide.codeDuplicateError'))
    }

    return Promise.resolve()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 构建提交数据
      const submitData: any = {
        name: values.name,
        code: values.code,
        category: values.category,
        description: values.description,
      }

      // 如果是设备类型，处理容器属性
      if (values.category === 'equipment') {
        submitData.isContainer = true

        if (selectedPreset) {
          // 使用预设括号
          const presetBrackets = getPresetBrackets(t)
          const preset = presetBrackets.find(b => b.value === selectedPreset)
          if (preset) {
            submitData.containerPrefix = preset.prefix
            submitData.containerSuffix = preset.suffix
          }
        } else {
          // 自定义符号：code本身就是容器标记，不需要额外的prefix和suffix
          submitData.containerPrefix = ''
          submitData.containerSuffix = ''
        }
      } else {
        submitData.isContainer = false
      }

      if (stepType) {
        await updateStepType(stepType.id, submitData)
        message.success(t('pages.recipeGuide.updateSuccess'))
      } else {
        await createStepType(submitData)
        message.success(t('pages.recipeGuide.createSuccess'))
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || t('pages.recipeGuide.operationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const presetBrackets = getPresetBrackets(t)

  return (
    <Modal
      title={stepType ? t('pages.recipeGuide.editStepType') : t('pages.recipeGuide.createStepType')}
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {t('common.save')}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="category"
          label={t('pages.recipeGuide.categoryLabel')}
          rules={[{ required: true, message: t('pages.recipeGuide.categoryRequired') }]}
          initialValue="ingredient"
        >
          <Radio.Group onChange={(e) => handleCategoryChange(e.target.value)}>
            <Radio.Button value="ingredient">{t('pages.recipeGuide.categoryIngredient')}</Radio.Button>
            <Radio.Button value="equipment">{t('pages.recipeGuide.categoryEquipment')}</Radio.Button>
            <Radio.Button value="action">{t('pages.recipeGuide.categoryAction')}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label={t('pages.recipeGuide.nameLabel')}
          rules={[{ required: true, message: t('pages.recipeGuide.nameRequired') }]}
        >
          <Input
            placeholder={t('pages.recipeGuide.namePlaceholder')}
            onChange={handleNameChange}
            disabled={!!stepType}
          />
        </Form.Item>

        {/* 加载提示 */}
        {!stepType && loadingSuggestions && (
          <div style={{ marginBottom: 16, color: '#1890ff', fontSize: '12px' }}>
            {t('pages.recipeGuide.loadingSuggestions')}
          </div>
        )}

        {/* 设备类型：容器符号配置 - 在代码输入框上方 */}
        {category === 'equipment' && (
          <>
            <Alert
              message={t('pages.recipeGuide.containerAlert')}
              description={t('pages.recipeGuide.containerAlertDesc')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item label={t('pages.recipeGuide.containerSymbolLabel')}>
              <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                {t('pages.recipeGuide.containerSymbolTip')}
              </div>
              <Space wrap>
                {presetBrackets.map(bracket => (
                  <Tag
                    key={bracket.value}
                    color={selectedPreset === bracket.value ? 'blue' : 'default'}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 16px',
                      fontSize: '14px',
                      border: selectedPreset === bracket.value ? '2px solid #1890ff' : undefined
                    }}
                    onClick={() => handlePresetClick(bracket.value)}
                  >
                    {bracket.label}
                  </Tag>
                ))}
              </Space>

              {selectedPreset ? (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0f5ff', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                    {t('pages.recipeGuide.containerSelected')}<strong>{presetBrackets.find(b => b.value === selectedPreset)?.label}</strong>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#1890ff' }}>
                    {t('pages.recipeGuide.containerExample')}{selectedPreset[0]}MK200BT350{selectedPreset[1]}2
                  </div>
                </div>
              ) : (
                <Alert
                  message={t('pages.recipeGuide.containerCustomMode')}
                  description={
                    <div>
                      <div>{t('pages.recipeGuide.containerCustomDesc')}</div>
                      <div style={{ marginTop: 8, fontFamily: 'monospace' }}>
                        {t('pages.recipeGuide.containerCustomExample')} <Tag>*</Tag>{t('pages.recipeGuide.containerCustomExampleGenerated')} <Tag color="green">*MK200BT350*2</Tag>
                      </div>
                      <div style={{ marginTop: 4, fontSize: '11px', color: '#999' }}>
                        {t('pages.recipeGuide.containerCustomNote')}
                      </div>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </Form.Item>
          </>
        )}

        {/* 代码建议 */}
        {!stepType && !loadingSuggestions && suggestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
              {t('pages.recipeGuide.suggestionsLabel')}
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

        <Form.Item
          name="code"
          label={t('pages.recipeGuide.codeLabel')}
          rules={[
            {
              required: !selectedPreset || category !== 'equipment',
              message: t('pages.recipeGuide.codeRequired')
            },
            { validator: validateCodeUniqueness }
          ]}
          tooltip={t('pages.recipeGuide.codeTooltip')}
        >
          <Input
            placeholder={
              selectedPreset && category === 'equipment'
                ? `${t('pages.recipeGuide.codePlaceholderEquipment')} (${t('pages.recipeGuide.descriptionOptional')})`
                : category === 'ingredient' ? t('pages.recipeGuide.codePlaceholderIngredient') :
                category === 'equipment' ? t('pages.recipeGuide.codePlaceholderEquipment') :
                t('pages.recipeGuide.codePlaceholderAction')
            }
            style={{ fontFamily: 'monospace', fontSize: '16px', textTransform: 'uppercase' }}
            onChange={handleCodeChange}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('pages.recipeGuide.descriptionOptional')}
        >
          <Input.TextArea rows={2} placeholder={t('pages.recipeGuide.descriptionPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default StepTypeFormModalEnhanced

