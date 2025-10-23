import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber, Switch, Button, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { createStepType, updateStepType } from '@/services/recipe'
import type { StepType } from '@/services/recipe'

interface StepTypeFormModalProps {
  visible: boolean
  stepType?: StepType
  onClose: () => void
  onSuccess: () => void
}

const StepTypeFormModal: React.FC<StepTypeFormModalProps> = ({
  visible,
  stepType,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      if (stepType) {
        // 编辑模式
        form.setFieldsValue({
          ...stepType,
          fieldSchema: JSON.stringify(stepType.field_schema, null, 2),
          defaultFields: stepType.defaultFields ? JSON.stringify(stepType.defaultFields, null, 2) : undefined
        })
      } else {
        // 创建模式
        form.resetFields()
      }
    }
  }, [visible, stepType, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 解析JSON字段
      const payload = {
        ...values,
        fieldSchema: JSON.parse(values.fieldSchema),
        defaultFields: values.defaultFields ? JSON.parse(values.defaultFields) : undefined
      }

      if (stepType) {
        await updateStepType(stepType.id, payload)
        message.success(t('pages.recipeGuide.updateSuccess'))
      } else {
        await createStepType(payload)
        message.success(t('pages.recipeGuide.createSuccess'))
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

  return (
    <Modal
      title={stepType ? t('pages.recipeGuide.editStepType') : t('pages.recipeGuide.createStepType')}
      open={visible}
      onCancel={onClose}
      width={700}
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
          name="code"
          label={t('pages.recipeGuide.stepTypeCode')}
          rules={[{ required: true, message: t('pages.recipeGuide.stepTypeCodeRequired') }]}
        >
          <Input 
            placeholder={t('pages.recipeGuide.stepTypeCodePlaceholder')}
            disabled={!!stepType}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label={t('pages.recipeGuide.stepTypeName')}
          rules={[{ required: true, message: t('pages.recipeGuide.stepTypeNameRequired') }]}
        >
          <Input placeholder={t('pages.recipeGuide.stepTypeNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="category"
          label={t('pages.recipeGuide.category')}
          rules={[{ required: true, message: t('pages.recipeGuide.stepTypeNameRequired') }]}
        >
          <Select
            options={[
              { label: t('pages.recipeGuide.categoryIngredient'), value: 'ingredient' },
              { label: t('pages.recipeGuide.categoryEquipment'), value: 'equipment' },
              { label: t('pages.recipeGuide.categoryManual'), value: 'manual' },
              { label: t('pages.recipeGuide.categoryTiming'), value: 'timing' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('pages.recipeGuide.recipeDescription')}
        >
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item
          name="icon"
          label={t('pages.recipeGuide.icon')}
        >
          <Input placeholder={t('pages.recipeGuide.iconPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="color"
          label={t('pages.recipeGuide.color')}
        >
          <Input placeholder={t('pages.recipeGuide.colorPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="symbol"
          label={t('pages.recipeGuide.symbol')}
        >
          <Input placeholder={t('pages.recipeGuide.symbolPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="symbolPosition"
          label={t('pages.recipeGuide.symbolPosition')}
        >
          <Select
            options={[
              { label: t('pages.recipeGuide.positionWrap'), value: 'wrap' },
              { label: t('pages.recipeGuide.positionPrefix'), value: 'prefix' },
              { label: t('pages.recipeGuide.positionSuffix'), value: 'suffix' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="fieldSchema"
          label={t('pages.recipeGuide.fieldSchema')}
          rules={[
            { required: true, message: t('pages.recipeGuide.stepTypeNameRequired') },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                try {
                  JSON.parse(value)
                  return Promise.resolve()
                } catch {
                  return Promise.reject(new Error('请输入有效的JSON格式'))
                }
              }
            }
          ]}
        >
          <Input.TextArea
            placeholder={t('pages.recipeGuide.fieldSchemaPlaceholder')}
            rows={6}
          />
        </Form.Item>

        <Form.Item
          name="codeTemplate"
          label={t('pages.recipeGuide.codeTemplate')}
        >
          <Input placeholder={t('pages.recipeGuide.codeTemplatePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="defaultFields"
          label={t('pages.recipeGuide.defaultFields')}
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                try {
                  JSON.parse(value)
                  return Promise.resolve()
                } catch {
                  return Promise.reject(new Error('请输入有效的JSON格式'))
                }
              }
            }
          ]}
        >
          <Input.TextArea
            placeholder={t('pages.recipeGuide.defaultFieldsPlaceholder')}
            rows={4}
          />
        </Form.Item>

        <Form.Item
          name="displayOrder"
          label={t('pages.recipeGuide.displayOrder')}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="isSystem"
          label={t('pages.recipeGuide.isSystem')}
          valuePropName="checked"
        >
          <Switch disabled={!!stepType} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default StepTypeFormModal
