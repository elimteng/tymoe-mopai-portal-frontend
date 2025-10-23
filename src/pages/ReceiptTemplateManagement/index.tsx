import React, { useState, useEffect } from 'react'
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
  Tabs
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined
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
  type ReceiptTemplate,
  type CreateReceiptTemplateRequest,
  type UpdateReceiptTemplateRequest
} from '@/services/receipt-template'
import TemplateConfigForm from './TemplateConfigForm'
import SimpleConfigForm from './SimpleConfigForm'
import SimpleTemplatePreview from './SimpleTemplatePreview'
import PresetSelector, { type TemplatePreset } from './PresetSelector'
import StyleSelector from './StyleSelector'

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
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset | null>(null)
  const [currentStep, setCurrentStep] = useState(0) // 0: 选择预设, 1: 配置详情
  const [isStyleSelectorVisible, setIsStyleSelectorVisible] = useState(false)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [selectedPaperWidth, setSelectedPaperWidth] = useState<number | null>(null)
  const [form] = Form.useForm()

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
      
      // 2. 为每个主模板找到对应的子版本
      const templatesWithChildren = mainTemplates.map(mainTemplate => {
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
      
      setTemplates(templatesWithChildren)
      message.success(t('pages.receiptTemplate.loadSuccess', { count: mainTemplates.length }))
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
    if (template) {
      // 编辑模式：直接进入配置步骤
      setCurrentStep(1)
      
      form.setFieldsValue({
        name: getLocalizedText(template.name, i18n.language),
        description: getLocalizedText(template.description, i18n.language),
        paperWidth: template.paperWidth,
        isDefault: template.isDefault,
        config: template.config
      })
    } else {
      // 创建模式：从选择预设开始
      setCurrentStep(0)
      setSelectedPreset(null)
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  // 选择预设模板
  const handleSelectPreset = (preset: TemplatePreset) => {
    setSelectedPreset(preset)
    
    // 将预设配置填入表单
    form.setFieldsValue({
      name: getLocalizedText(preset.name, i18n.language),
      description: getLocalizedText(preset.description, i18n.language),
      paperWidth: preset.paperWidth,
      isDefault: false,
      config: preset.config
    })
  }

  // 下一步：从预设选择到配置详情
  const handleNextStep = () => {
    if (!selectedPreset) {
      message.warning('请先选择一个预设模板')
      return
    }
    setCurrentStep(1)
  }

  // 上一步：返回预设选择或样式选择
  const handlePrevStep = () => {
    if (selectedStyleId) {
      // 从样式创建：关闭配置对话框，重新打开样式选择器
      setIsModalVisible(false)
      setSelectedStyleId(null)
      setSelectedPaperWidth(null)
      form.resetFields()
      setIsStyleSelectorVisible(true)
    } else {
      // 从预设创建：返回预设选择
      setCurrentStep(0)
    }
  }

  // 关闭对话框
  const handleCloseModal = () => {
    setIsModalVisible(false)
    setEditingTemplate(null)
    setSelectedPreset(null)
    setSelectedStyleId('')
    setSelectedPaperWidth(80)
    setCurrentStep(0)
    form.resetFields()
  }

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      console.log('📋 Form values:', JSON.stringify(values, null, 2))
      
      if (editingTemplate) {
        // 更新模板（会同步更新所有3个版本）
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
      } else if (selectedStyleId) {
        // 从样式创建模板（后端创建3个版本）
        // 注意：名称和描述由后端根据样式自动生成，不需要传递
        const response = await httpService.post<{
          success: boolean
          data: any[]
          message?: string
        }>(
          '/api/order/v1/receipt-templates/create-all-sources',
          {
            styleId: selectedStyleId,
            paperWidth: values.paperWidth || selectedPaperWidth,
            language: i18n.language || 'zh-CN'
          }
        )
        
        if (response.data.success) {
          const templateCount = response.data.data.length
          message.success(`成功创建模板！共 ${templateCount} 个版本`)
        } else {
          throw new Error(response.data.message || '创建模板失败')
        }
      } else {
        // 直接创建单个模板（旧方式，保留兼容）
        const createData: CreateReceiptTemplateRequest = {
          name: values.name,
          description: values.description,
          paperWidth: values.paperWidth,
          isDefault: values.isDefault || false,
          config: values.config
        }
        console.log('📤 Creating template:', JSON.stringify(createData, null, 2))
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsStyleSelectorVisible(true)}>
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
          editingTemplate || currentStep === 1 ? (
            <Space>
              {!editingTemplate && (
                <Button onClick={handlePrevStep}>上一步</Button>
              )}
              <Button onClick={handleCloseModal}>{t('pages.receiptTemplate.cancel')}</Button>
              <Button type="primary" onClick={handleSave}>
                {t('pages.receiptTemplate.save')}
              </Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={handleCloseModal}>{t('pages.receiptTemplate.cancel')}</Button>
              <Button type="primary" onClick={handleNextStep}>
                下一步
              </Button>
            </Space>
          )
        }
      >
        {!editingTemplate && currentStep === 0 ? (
          /* 步骤1: 选择预设模板 */
          <PresetSelector
            onSelect={handleSelectPreset}
            selectedPresetId={selectedPreset?.id}
          />
        ) : (
          /* 步骤2: 配置详情和预览 */
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* 左侧：配置表单 */}
            <div style={{ flex: 1 }}>
              <Form form={form} layout="vertical">
                {/* 从样式创建时显示提示，编辑时显示名称和描述 */}
                {selectedStyleId && !editingTemplate ? (
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#e6f7ff', 
                    border: '1px solid #91d5ff',
                    borderRadius: '4px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>📋 模板信息</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      模板名称和描述将根据所选样式自动生成，创建后会生成 POS、KIOSK、WEB 三个版本
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

                <Form.Item
                  name="paperWidth"
                  label={t('pages.receiptTemplate.paperWidth')}
                  rules={[{ required: true, message: t('pages.receiptTemplate.paperWidthRequired') }]}
                >
                  <InputNumber
                    min={58}
                    max={80}
                    addonAfter="mm"
                    style={{ width: '100%' }}
                    disabled={!!selectedStyleId && !editingTemplate}
                  />
                </Form.Item>

                {!selectedStyleId && (
                  <Form.Item name="isDefault" label={t('pages.receiptTemplate.setAsDefault')} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                )}

                <Tabs
                  items={[
                    {
                      key: 'config',
                      label: t('pages.receiptTemplate.templateConfig'),
                      children: selectedStyleId && !editingTemplate ? (
                        <SimpleConfigForm form={form} />
                      ) : (
                        <TemplateConfigForm form={form} />
                      )
                    }
                  ]}
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
        )}
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

      {/* 样式选择器对话框 */}
      <Modal
        title="创建小票模板"
        open={isStyleSelectorVisible}
        onCancel={() => setIsStyleSelectorVisible(false)}
        footer={null}
        width={1000}
      >
        <StyleSelector
          onComplete={() => {
            setIsStyleSelectorVisible(false)
            loadTemplates()
          }}
          onStyleSelected={(styleId, paperWidth) => {
            // 保存选择的样式信息
            setSelectedStyleId(styleId)
            setSelectedPaperWidth(paperWidth)
            // 关闭样式选择器
            setIsStyleSelectorVisible(false)
            // 初始化表单（设置纸张宽度）
            form.setFieldsValue({
              paperWidth: paperWidth,
              isDefault: false
            })
            // 打开配置表单
            setIsModalVisible(true)
            setEditingTemplate(null) // 新建模式
            setCurrentStep(1) // 跳过预设选择，直接进入配置
          }}
        />
      </Modal>
    </div>
  )
}

export default ReceiptTemplateManagement
