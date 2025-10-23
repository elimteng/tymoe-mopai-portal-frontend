import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Tag, Popconfirm, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getStepTypes, deleteStepType } from '@/services/recipe'
import type { StepType } from '@/services/recipe'
import type { ColumnsType } from 'antd/es/table'
import StepTypeFormModalSimple from './StepTypeFormModalSimple'

const StepTypeManagement: React.FC = () => {
  const { t } = useTranslation()
  const [stepTypes, setStepTypes] = useState<StepType[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingStepType, setEditingStepType] = useState<StepType | undefined>()

  useEffect(() => {
    loadStepTypes()
  }, [])

  const loadStepTypes = async () => {
    setLoading(true)
    try {
      const data = await getStepTypes()
      setStepTypes(data)
    } catch (error: any) {
      message.error(error.message || t('pages.recipeGuide.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteStepType(id)
      message.success(t('pages.recipeGuide.deleteSuccess'))
      loadStepTypes()
    } catch (error: any) {
      message.error(error.message || t('pages.recipeGuide.deleteFailed'))
    }
  }

  const handleCreate = () => {
    setEditingStepType(undefined)
    setModalVisible(true)
  }

  const handleEdit = (record: StepType) => {
    setEditingStepType(record)
    setModalVisible(true)
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setEditingStepType(undefined)
  }

  const handleModalSuccess = () => {
    loadStepTypes()
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ingredient: 'blue',
      equipment: 'green',
      manual: 'orange',
      timing: 'purple'
    }
    return colors[category] || 'default'
  }

  const columns: ColumnsType<StepType> = [
    {
      title: t('pages.recipeGuide.stepTypeCode'),
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: t('pages.recipeGuide.stepTypeName'),
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: t('pages.recipeGuide.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>
          {t(`pages.recipeGuide.category${category.charAt(0).toUpperCase() + category.slice(1)}`)}
        </Tag>
      )
    },
    {
      title: t('pages.recipeGuide.symbol'),
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100
    },
    {
      title: t('pages.recipeGuide.color'),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) =>
        color ? (
          <Space>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: color,
                border: '1px solid #d9d9d9',
                borderRadius: 4
              }}
            />
            <span>{color}</span>
          </Space>
        ) : null
    },
    {
      title: t('pages.recipeGuide.isSystem'),
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (isSystem: boolean) =>
        isSystem ? <Tag color="default">{t('pages.recipeGuide.isSystem')}</Tag> : null
    },
    {
      title: t('pages.recipeGuide.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('pages.recipeGuide.edit')}
          </Button>
          <Popconfirm
            title={t('pages.recipeGuide.deleteStepTypeConfirm')}
            description={t('pages.recipeGuide.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('pages.recipeGuide.confirm')}
            cancelText={t('pages.recipeGuide.cancel')}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              {t('pages.recipeGuide.delete')}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          {t('pages.recipeGuide.createStepType')}
        </Button>
      </div>

      <StepTypeFormModalSimple
        visible={modalVisible}
        stepType={editingStepType}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <Table
        columns={columns}
        dataSource={stepTypes}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `${t('pages.menuCenter.total')} ${total} ${t('pages.menuCenter.items')}`
        }}
        locale={{
          emptyText: (
            <Empty
              description={t('pages.recipeGuide.noStepTypes')}
              style={{ padding: '40px 0' }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                {t('pages.recipeGuide.createFirstStepType')}
              </Button>
            </Empty>
          )
        }}
      />
    </div>
  )
}

export default StepTypeManagement
