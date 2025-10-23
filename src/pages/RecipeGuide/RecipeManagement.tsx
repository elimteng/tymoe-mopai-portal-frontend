import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Tag, Popconfirm, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getRecipes, deleteRecipe } from '@/services/recipe'
import type { Recipe } from '@/services/recipe'
import type { ColumnsType } from 'antd/es/table'
import RecipeFormModal from './RecipeFormModal'

interface RecipeManagementProps {
  itemId?: string
}

const RecipeManagement: React.FC<RecipeManagementProps> = ({ itemId }) => {
  const { t } = useTranslation()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>()

  useEffect(() => {
    if (itemId) {
      loadRecipes()
    } else {
      setRecipes([])
    }
  }, [itemId])

  const loadRecipes = async () => {
    if (!itemId) {
      console.log('⚠️ itemId为空，跳过加载')
      return
    }
    
    console.log('📋 加载配方列表, itemId:', itemId)
    setLoading(true)
    try {
      const data = await getRecipes(itemId)
      console.log('📋 获取到的配方数据:', data)
      console.log('📋 配方数量:', data?.length)
      console.log('📋 配方详情:', JSON.stringify(data, null, 2))
      setRecipes(data || [])
      console.log('✅ 配方列表已更新到state')
    } catch (error: any) {
      console.error('❌ 加载配方失败:', error)
      message.error(error.message || t('pages.recipeGuide.loadFailed'))
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecipe(id)
      message.success(t('pages.recipeGuide.deleteSuccess'))
      loadRecipes()
    } catch (error: any) {
      message.error(error.message || t('pages.recipeGuide.deleteFailed'))
    }
  }

  const handleCreate = () => {
    setEditingRecipe(undefined)
    setModalVisible(true)
  }

  const handleEdit = (record: Recipe) => {
    setEditingRecipe(record)
    setModalVisible(true)
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setEditingRecipe(undefined)
  }

  const handleModalSuccess = () => {
    loadRecipes()
  }

  const columns: ColumnsType<Recipe> = [
    {
      title: t('pages.recipeGuide.recipeName'),
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: t('pages.recipeGuide.recipeVersion'),
      dataIndex: 'version',
      key: 'version',
      width: 100
    },
    {
      title: t('pages.recipeGuide.isDefault'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 120,
      render: (isDefault: boolean) =>
        isDefault ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('pages.recipeGuide.isDefault')}
          </Tag>
        ) : null
    },
    {
      title: t('pages.recipeGuide.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success">{t('pages.recipeGuide.isActive')}</Tag>
        ) : (
          <Tag color="default">{t('pages.menuCenter.inactive')}</Tag>
        )
    },
    {
      title: t('pages.recipeGuide.stepCount'),
      key: 'stepCount',
      width: 100,
      render: (_, record) => record.steps?.length || 0
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
            title={t('pages.recipeGuide.deleteRecipeConfirm')}
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

  if (!itemId) {
    return (
      <Empty
        description={t('pages.recipeGuide.noItemSelected')}
        style={{ padding: '60px 0' }}
      />
    )
  }

  console.log('🎨 RecipeManagement 渲染, recipes:', recipes)
  console.log('🎨 recipes.length:', recipes.length)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('pages.recipeGuide.createRecipe')}
          </Button>
          <span style={{ color: '#999' }}>
            当前配方数量: {recipes.length}
          </span>
        </Space>
      </div>

      <RecipeFormModal
        visible={modalVisible}
        recipe={editingRecipe}
        itemId={itemId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <Table
        columns={columns}
        dataSource={recipes}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `${t('pages.menuCenter.total')} ${total} ${t('pages.menuCenter.items')}`
        }}
        locale={{
          emptyText: (
            <Empty
              description={t('pages.recipeGuide.noRecipes')}
              style={{ padding: '40px 0' }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                {t('pages.recipeGuide.createFirstRecipe')}
              </Button>
            </Empty>
          )
        }}
      />
    </div>
  )
}

export default RecipeManagement
