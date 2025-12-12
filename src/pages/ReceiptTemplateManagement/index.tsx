import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Tag,
  Popconfirm,
  Tooltip,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  PrinterOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { httpService } from '@/services/http'
import type { ColumnsType } from 'antd/es/table'
import {
  getReceiptTemplates,
  createReceiptTemplate,
  updateReceiptTemplate,
  deleteReceiptTemplate,
  setDefaultReceiptTemplate,
  toggleReceiptTemplateActive,
  generateTestPrint,
  type ReceiptTemplate,
  type CreateReceiptTemplateRequest,
  type UpdateReceiptTemplateRequest
} from '@/services/receipt-template'
import SimpleTemplatePreview from './SimpleTemplatePreview'
import ModernMinimalConfigForm from './ModernMinimalConfigForm'

const { TextArea } = Input

// 辅助函数：获取多语言文本
const getLocalizedText = (text: string | { 'zh-CN': string; 'en': string; 'zh-TW': string } | undefined, language: string): string => {
  if (!text) return ''
  if (typeof text === 'string') return text
  const lang = language as 'zh-CN' | 'en' | 'zh-TW'
  return text[lang] || text['zh-CN'] || ''
}

const ReceiptTemplateManagement: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReceiptTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ReceiptTemplate | null>(null)
  const [form] = Form.useForm()

  // 稳定的 config 更新回调（防止 ModernMinimalConfigForm 重复触发）
  const handleConfigChange = useCallback((config: any) => {
    form.setFieldValue('config', config)
  }, [form])

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await getReceiptTemplates()
      console.log('📋 Loaded templates:', response.data)
      
      // 分组显示：主模板 + 3个子版本
      // 1. 找出所有主模板（不包含订单来源标识）
      const mainTemplates = response.data.filter(template => {
        const name = typeof template.name === 'string' ? template.name : template.name['zh-CN']
        return !name.includes('(POS)') && !name.includes('(Kiosk)') && !name.includes('(Web)') &&
               !name.includes('- POS') && !name.includes('- KIOSK') && !name.includes('- WEB')
      })

      // 2. 如果有主模板,则分组显示;否则直接显示所有模板
      let templatesWithChildren
      if (mainTemplates.length > 0) {
        // 为每个主模板找到对应的子版本
        templatesWithChildren = mainTemplates.map(mainTemplate => {
          const mainName = typeof mainTemplate.name === 'string' ? mainTemplate.name : mainTemplate.name['zh-CN']

          // 查找对应的 POS/KIOSK/WEB 版本
          const children = response.data.filter(template => {
            const name = typeof template.name === 'string' ? template.name : template.name['zh-CN']
            // 匹配 "主模板名 (POS)" 或 "主模板名 - POS" 格式
            return (name.includes(mainName) && template.id !== mainTemplate.id) &&
                   (name.includes('(POS)') || name.includes('(Kiosk)') || name.includes('(Web)') ||
                    name.includes('- POS') || name.includes('- KIOSK') || name.includes('- WEB'))
          })

          return {
            ...mainTemplate,
            children: children.length > 0 ? children : undefined
          }
        })
      } else {
        // 没有主模板,直接显示所有模板
        console.log('ℹ️ 没有找到主模板,直接显示所有模板')
        templatesWithChildren = response.data
      }

      setTemplates(templatesWithChildren)
      message.success(t('pages.receiptTemplate.loadSuccess', { count: templatesWithChildren.length }))
    } catch (error: any) {
      console.error('加载小票模板失败:', error)
      
      // 检查具体错误类型
      if (error.message?.includes('未授权访问')) {
        message.error('订单服务认证失败 (401)，请检查：\n1. 后端订单服务是否已启动 (localhost:3002)\n2. 服务是否需要认证配置\n3. Token是否有效', 8)
      } else if (error.message?.includes('Network Error') || error.message?.includes('ERR_FAILED')) {
        message.error('订单服务暂时不可用，请确保后端服务已启动 (localhost:3002)')
      } else {
        message.error(t('pages.receiptTemplate.loadFailed') + ': ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  // 打开创建/编辑对话框
  const handleOpenModal = (template?: ReceiptTemplate) => {
    setEditingTemplate(template || null)

    // 默认配置
    const defaultConfig = {
      styleId: 'modern-minimal',
      language: i18n.language || 'zh-CN',
      printDensity: 'compact',
      merchant: {
        showAddress: true,
        showPhone: true,
        showTaxNumber: false,
        showWebsite: false,
      },
      orderInfo: {
        fields: ['orderNumber'],
      },
      items: {
        showAttributes: true,
        showAddons: true,
        showNotes: true,
      },
      amounts: {
        showSubtotal: true,
        showDiscount: true,
        showTax: false,
        showTotal: true,
      },
      payment: {
        showPaymentMethod: true,
        showPaymentTime: true,
        showPaymentStatus: true,
      },
      customMessage: {
        'zh-CN': '感谢您的光临',
        'en': 'Thank you!',
        'zh-TW': '感謝您的光臨',
      },
      qrCode: {
        enabled: false,
        urlTemplate: 'https://example.com/order/{orderId}',
        sizeRatio: 0.7,
        errorCorrection: 'M',
        alignment: 'center',
      },
    }

    if (template) {
      // 编辑模式：直接进入配置步骤
      form.setFieldsValue({
        name: getLocalizedText(template.name, i18n.language),
        description: getLocalizedText(template.description, i18n.language),
        paperWidth: template.paperWidth,
        isDefault: template.isDefault,
        config: template.config || defaultConfig
      })
    } else {
      // 创建模式：直接进入配置步骤（默认使用现代简约模板）
      form.resetFields()
      form.setFieldsValue({
        paperWidth: 58,
        isDefault: false,
        config: defaultConfig
      })
    }
    setIsModalVisible(true)
  }

  // 关闭对话框
  const handleCloseModal = () => {
    setIsModalVisible(false)
    setEditingTemplate(null)
    form.resetFields()
  }

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      console.log('📋 Form values:', JSON.stringify(values, null, 2))

      // 确保 config 字段存在
      if (!values.config) {
        message.error('模板配置不完整，请检查表单')
        return
      }

      if (editingTemplate) {
        // 更新模板
        const updateData: UpdateReceiptTemplateRequest = {
          name: values.name,
          description: values.description,
          paperWidth: values.paperWidth,
          isDefault: values.isDefault,
          config: values.config
        }
        console.log('📤 Updating template:', JSON.stringify(updateData, null, 2))
        await updateReceiptTemplate(editingTemplate.id, updateData)
        message.success(t('pages.receiptTemplate.updateSuccess'))
      } else {
        // 创建单个模板（现代简约模板工作流）
        const createData: CreateReceiptTemplateRequest = {
          name: values.name,
          description: values.description,
          paperWidth: values.paperWidth,
          isDefault: values.isDefault || false,
          config: values.config
        }
        console.log('📤 Creating template:', JSON.stringify(createData, null, 2))
        console.log('✅ Sending to API - only once')
        await createReceiptTemplate(createData)
        message.success(t('pages.receiptTemplate.createSuccess'))
      }

      handleCloseModal()
      loadTemplates()
    } catch (error: any) {
      console.error('❌ Save error:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error response full:', JSON.stringify(error.response?.data, null, 2))
      
      if (error.errorFields) {
        message.error(t('pages.receiptTemplate.formValidationError'))
      } else {
        const errorData = error.response?.data
        let errorMsg = error.message
        
        // 尝试从不同的错误格式中提取信息
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMsg = errorData
          } else if (errorData.error) {
            // 处理嵌套的error对象
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            } else if (errorData.error.message) {
              errorMsg = errorData.error.message
            } else if (errorData.error.detail) {
              errorMsg = errorData.error.detail
            } else {
              errorMsg = JSON.stringify(errorData.error)
            }
          } else if (errorData.detail) {
            errorMsg = errorData.detail
          } else if (errorData.message) {
            errorMsg = errorData.message
          } else {
            errorMsg = JSON.stringify(errorData)
          }
        }
        
        console.error('❌ Final error message:', errorMsg)
        
        // 对于500错误，提供更友好的提示
        if (error.response?.status === 500) {
          message.error(
            editingTemplate
              ? t('pages.receiptTemplate.updateFailed') + ': 服务器内部错误，请检查后端日志'
              : t('pages.receiptTemplate.createFailed') + ': 服务器内部错误，请检查后端日志。可能是数据库连接问题或后端代码错误。',
            10
          )
        } else {
          message.error(
            editingTemplate
              ? t('pages.receiptTemplate.updateFailed') + ': ' + errorMsg
              : t('pages.receiptTemplate.createFailed') + ': ' + errorMsg,
            10  // 显示10秒，方便查看完整错误
          )
        }
      }
    }
  }

  // 删除模板
  const handleDelete = async (templateId: string) => {
    try {
      await deleteReceiptTemplate(templateId)
      message.success(t('pages.receiptTemplate.deleteSuccess'))
      loadTemplates()
    } catch (error: any) {
      message.error(t('pages.receiptTemplate.deleteFailed') + ': ' + error.message)
    }
  }

  // 设置为默认
  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultReceiptTemplate(templateId)
      message.success(t('pages.receiptTemplate.setDefaultSuccess'))
      loadTemplates()
    } catch (error: any) {
      message.error(t('pages.receiptTemplate.setDefaultFailed') + ': ' + error.message)
    }
  }

  // 切换启用状态
  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      await toggleReceiptTemplateActive(templateId, !isActive)
      message.success(
        isActive ? t('pages.receiptTemplate.disableSuccess') : t('pages.receiptTemplate.enableSuccess')
      )
      loadTemplates()
    } catch (error: any) {
      message.error(t('pages.receiptTemplate.toggleFailed') + ': ' + error.message)
    }
  }

  // 预览模板
  const handlePreview = (template: ReceiptTemplate) => {
    console.log('🔍 Preview template:', JSON.stringify(template, null, 2))
    console.log('🔍 Template config:', template.config)
    setPreviewTemplate(template)
    setIsPreviewVisible(true)
  }

  // 测试打印 - 生成并下载 ESC/POS 文件
  const handleTestPrint = async (templateId: string) => {
    try {
      message.loading({ content: t('pages.receiptTemplate.generatingPrint'), key: 'testPrint' })
      await generateTestPrint(templateId)
      message.success({ content: t('pages.receiptTemplate.printGenerated'), key: 'testPrint', duration: 2 })
    } catch (error: any) {
      message.error({ content: t('pages.receiptTemplate.printFailed') + ': ' + error.message, key: 'testPrint' })
    }
  }

  // 表格列定义
  const columns: ColumnsType<ReceiptTemplate> = [
    {
      title: t('pages.receiptTemplate.templateName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          {getLocalizedText(text, i18n.language)}
          {record.isDefault && (
            <Tooltip title={t('pages.receiptTemplate.defaultTemplate')}>
              <StarFilled style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: t('pages.receiptTemplate.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => getLocalizedText(text, i18n.language)
    },
    {
      title: t('pages.receiptTemplate.paperWidth'),
      dataIndex: 'paperWidth',
      key: 'paperWidth',
      width: 100,
      render: (width) => `${width}mm`
    },
    {
      title: t('pages.receiptTemplate.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => `v${version}`
    },
    {
      title: t('pages.receiptTemplate.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? t('pages.receiptTemplate.active') : t('pages.receiptTemplate.inactive')}
        </Tag>
      )
    },
    {
      title: t('pages.receiptTemplate.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: t('pages.receiptTemplate.actions'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('pages.receiptTemplate.preview')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title={t('pages.receiptTemplate.testPrint')}>
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => handleTestPrint(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('pages.receiptTemplate.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Tooltip title={t('pages.receiptTemplate.setAsDefault')}>
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => handleSetDefault(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title={record.isActive ? t('pages.receiptTemplate.disable') : t('pages.receiptTemplate.enable')}>
            <Switch
              size="small"
              checked={record.isActive}
              onChange={() => handleToggleActive(record.id, record.isActive)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Popconfirm
              title={t('pages.receiptTemplate.deleteConfirm')}
              description={t('pages.receiptTemplate.deleteWarning')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('pages.receiptTemplate.confirm')}
              cancelText={t('pages.receiptTemplate.cancel')}
            >
              <Tooltip title={t('pages.receiptTemplate.delete')}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={t('pages.receiptTemplate.title')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTemplates}>
              {t('pages.receiptTemplate.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              {t('pages.receiptTemplate.create')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => t('pages.receiptTemplate.total', { count: total })
          }}
          expandable={{
            expandedRowRender: (record) => {
              if (!record.children || record.children.length === 0) {
                return null
              }
              return (
                <div style={{ margin: 0, padding: '8px 24px', backgroundColor: '#fafafa' }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>
                    订单来源版本：
                  </div>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {record.children.map((child: ReceiptTemplate) => (
                      <div
                        key={child.id}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Space>
                          <Tag color="blue">
                            {child.orderSource || '未知来源'}
                          </Tag>
                          <span>{getLocalizedText(child.name, i18n.language)}</span>
                          <Tag color={child.isActive ? 'success' : 'default'}>
                            {child.isActive ? '启用' : '禁用'}
                          </Tag>
                        </Space>
                        <Space size="small">
                          <Tooltip title="预览">
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handlePreview(child)}
                            />
                          </Tooltip>
                          <Tooltip title="编辑">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleOpenModal(child)}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    ))}
                  </Space>
                </div>
              )
            },
            rowExpandable: (record) => !!record.children && record.children.length > 0,
            defaultExpandAllRows: false
          }}
        />
      </Card>

      {/* 创建/编辑对话框 */}
      <Modal
        title={editingTemplate ? t('pages.receiptTemplate.edit') : t('pages.receiptTemplate.create')}
        open={isModalVisible}
        onCancel={handleCloseModal}
        width={1200}
        footer={
          <Space>
            <Button onClick={handleCloseModal}>{t('pages.receiptTemplate.cancel')}</Button>
            <Button type="primary" onClick={handleSave}>
              {t('pages.receiptTemplate.save')}
            </Button>
          </Space>
        }
      >
        {/* 直接显示配置表单（跳过选择步骤） */}
        <div style={{ display: 'flex', gap: '24px' }}>
            {/* 左侧：配置表单 */}
            <div style={{ flex: 1 }}>
              <Form form={form} layout="vertical">
                {/* 模板名称和描述 */}
                <Form.Item
                  name="name"
                  label={t('pages.receiptTemplate.templateName')}
                  rules={[{ required: true, message: t('pages.receiptTemplate.nameRequired') }]}
                >
                  <Input placeholder={t('pages.receiptTemplate.namePlaceholder')} />
                </Form.Item>

                <Form.Item name="description" label={t('pages.receiptTemplate.description')}>
                  <TextArea
                    rows={2}
                    placeholder={t('pages.receiptTemplate.descriptionPlaceholder')}
                  />
                </Form.Item>

                {/* 隐藏纸张宽度字段，但保留在表单中（使用默认值58） */}
                <Form.Item name="paperWidth" style={{ display: 'none' }}>
                  <InputNumber />
                </Form.Item>

                {/* 隐藏配置字段，通过 ModernMinimalConfigForm 更新 */}
                <Form.Item name="config" style={{ display: 'none' }}>
                  <div />
                </Form.Item>

                <Form.Item name="isDefault" label={t('pages.receiptTemplate.setAsDefault')} valuePropName="checked">
                  <Switch />
                </Form.Item>

                {/* 现代简约模板配置 */}
                <Divider orientation="left">现代简约模板配置</Divider>
                <ModernMinimalConfigForm
                  initialConfig={editingTemplate?.config || form.getFieldValue('config')}
                  onChange={handleConfigChange}
                />
              </Form>
            </div>

            {/* 右侧：实时预览 */}
            <div style={{ width: '350px', borderLeft: '1px solid #f0f0f0', paddingLeft: '24px' }}>
              <div style={{ position: 'sticky', top: 0 }}>
                <h4 style={{ marginBottom: '16px' }}>实时预览</h4>
                <div style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '16px',
                  backgroundColor: '#fafafa'
                }}>
                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      const formValues = form.getFieldsValue()
                      if (formValues.config && formValues.paperWidth) {
                        const previewData: ReceiptTemplate = {
                          id: editingTemplate?.id || 'preview',
                          tenantId: localStorage.getItem('organization_id') || '',
                          name: formValues.name || '预览',
                          description: formValues.description,
                          paperWidth: formValues.paperWidth,
                          isDefault: formValues.isDefault || false,
                          isActive: true,
                          config: formValues.config,
                          version: 1,
                          createdBy: '',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }
                        return <SimpleTemplatePreview template={previewData} />
                      }
                      return <div style={{ textAlign: 'center', color: '#999' }}>配置模板以查看预览</div>
                    }}
                  </Form.Item>
                </div>
              </div>
            </div>
        </div>
      </Modal>

      {/* 预览对话框 */}
      <Modal
        title={t('pages.receiptTemplate.preview')}
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={null}
        width={600}
      >
        {previewTemplate && <SimpleTemplatePreview template={previewTemplate} />}
      </Modal>

    </div>
  )
}

export default ReceiptTemplateManagement
