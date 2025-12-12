import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Empty,
  Spin,
  Divider,
  Typography,
  Switch,
  Segmented,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import {
  itemManagementService,
  type ModifierGroup,
  type ModifierOption,
  type CreateModifierGroupPayload,
  type CreateModifierOptionPayload
} from '../../services/item-management'

interface ModifierGroupManagerProps {
  onClose?: () => void
}

export const ModifierGroupManager: React.FC<ModifierGroupManagerProps> = () => {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [modifierGroupOptions, setModifierGroupOptions] = useState<Record<string, ModifierOption[]>>({})
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [optionModalVisible, setOptionModalVisible] = useState(false)
  const [manageOptionsModalVisible, setManageOptionsModalVisible] = useState(false)
  const [managingGroup, setManagingGroup] = useState<ModifierGroup | null>(null)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null)
  const [editingOption, setEditingOption] = useState<ModifierOption | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'property' | 'addon' | 'custom'>('all')
  const [editingValues, setEditingValues] = useState<Record<string, any>>({})  // 追踪编辑中的字段值
  const loadingIcon = <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />

  const [groupForm] = Form.useForm<CreateModifierGroupPayload>()
  const [optionForm] = Form.useForm<CreateModifierOptionPayload>()

  // 获取组类型标签
  const getGroupTypeTag = (groupType: string) => {
    const typeMap: Record<string, { label: string; color: string; tooltip: string }> = {
      'property': { label: '属性', color: 'blue', tooltip: '商品本身的可选配置（如杯型、冰度、糖度）' },
      'addon': { label: '加料', color: 'green', tooltip: '可选的额外配料（如珍珠、椰果、布丁）' },
      'custom': { label: '自定义', color: 'purple', tooltip: '其他自定义分类' }
    }
    const config = typeMap[groupType] || { label: groupType, color: 'default', tooltip: groupType }
    return (
      <Tooltip title={config.tooltip}>
        <Tag color={config.color}>{config.label}</Tag>
      </Tooltip>
    )
  }

  // 加载修饰符组
  const loadModifierGroups = async () => {
    setLoading(true)
    try {
      const params = typeFilter !== 'all' ? { groupType: typeFilter as any } : {}
      
      // 获取激活的组（包含 options）
      const activeGroups = await itemManagementService.getModifierGroups({ ...params, isActive: true })
      console.log('[MODIFIER] 📥 Load groups response:', JSON.stringify(activeGroups, null, 2))
      
      // 🔧 后端 Bug Workaround: 当查询 "全部" 时，API 返回空 options
      // 如果发现有组的 options 为空，按 groupType 再查一次
      let groupsWithOptions = [...activeGroups]
      
      if (typeFilter === 'all') {
        // 检查是否有组缺少 options
        const groupsNeedingOptions = activeGroups.filter(g => !g.options || g.options.length === 0)
        
        if (groupsNeedingOptions.length > 0) {
          console.log('[MODIFIER] ⚠️ Found groups with empty options, fetching by groupType...')
          
          // 按 groupType 分组
          const groupsByType = new Map<string, typeof activeGroups[0][]>()
          groupsNeedingOptions.forEach(g => {
            if (!groupsByType.has(g.groupType)) {
              groupsByType.set(g.groupType, [])
            }
            groupsByType.get(g.groupType)!.push(g)
          })
          
          // 为每个 groupType 单独查询
          const fetchPromises = Array.from(groupsByType.keys()).map(async (groupType) => {
            try {
              return await itemManagementService.getModifierGroups({ 
                isActive: true, 
                groupType: groupType as any
              })
            } catch (error) {
              console.error(`Failed to fetch groups for type ${groupType}:`, error)
              return []
            }
          })
          
          const groupsByTypeResults = await Promise.all(fetchPromises)
          
          // 创建一个 map，用完整数据覆盖空数据
          const fullGroupsMap = new Map<string, typeof activeGroups[0]>()
          groupsByTypeResults.flat().forEach(g => {
            if (g.options && g.options.length > 0) {
              fullGroupsMap.set(g.id, g)
            }
          })
          
          // 合并数据
          groupsWithOptions = activeGroups.map(g => {
            const fullGroup = fullGroupsMap.get(g.id)
            return fullGroup || g
          })
          
          console.log('[MODIFIER] ✅ Merged groups with options')
        }
      }
      
      // 规范化每个组的 options
      const normalizedGroups = groupsWithOptions.map(group => {
        if (group.options && group.options.length > 0) {
          const normalizedOptions = group.options.map(option => ({
            ...option,
            defaultPrice: typeof option.defaultPrice === 'string'
              ? parseFloat(option.defaultPrice) || 0
              : option.defaultPrice || 0,
            displayOrder: option.displayOrder ?? 0,
            cost: option.cost !== null && option.cost !== undefined
              ? (typeof option.cost === 'string' ? parseFloat(option.cost) : option.cost)
              : undefined
          }))
          return { ...group, options: normalizedOptions as any }
        }
        return { ...group, options: [] }
      })
      
      // 一次性更新状态
      setModifierGroups(normalizedGroups)
      
      // 同步更新 options 缓存
      const newOptionsCache: Record<string, ModifierOption[]> = {}
      normalizedGroups.forEach(group => {
        newOptionsCache[group.id] = (group.options || []) as ModifierOption[]
      })
      setModifierGroupOptions(newOptionsCache)
      
    } catch (error) {
      console.error('Failed to load modifier groups:', error)
      message.error('加载自定义选项组失败')
      setModifierGroups([])
    } finally {
      setLoading(false)
    }
  }

  // 加载选项
  const loadOptions = async (groupId: string, forceRefresh = false) => {
    try {
      // 使用当前的过滤器参数，但不限制 isActive，以获取完整的组数据
      // 如果强制刷新，也不使用过滤器
      const params = forceRefresh || typeFilter === 'all' 
        ? {} 
        : { groupType: typeFilter as any }
      
      // 获取所有相关组（包含选项）
      const groups = await itemManagementService.getModifierGroups(params)
      const group = groups.find(g => g.id === groupId)
      
      
      if (group && group.options) {
        // 转换数据格式以匹配前端接口
        const normalizedOptions = group.options.map(option => ({
          ...option,
          // 确保 defaultPrice 是数字
          defaultPrice: typeof option.defaultPrice === 'string'
            ? parseFloat(option.defaultPrice) || 0
            : option.defaultPrice || 0,
          displayOrder: option.displayOrder ?? 0,
          // 确保 cost 是数字或 undefined
          cost: option.cost !== null && option.cost !== undefined
            ? (typeof option.cost === 'string' ? parseFloat(option.cost) : option.cost)
            : undefined
        }))
        
        setModifierGroupOptions(prev => ({ ...prev, [groupId]: normalizedOptions }))
        
        // 如果管理选项模态框是打开的，也更新 managingGroup
        if (managingGroup && managingGroup.id === groupId) {
          setManagingGroup(group)
        }
        
        return normalizedOptions
      } else {
        // 如果组中没有选项，设置为空数组
        setModifierGroupOptions(prev => ({ ...prev, [groupId]: [] }))
        return []
      }
    } catch (error) {
      console.error('Failed to load options:', error)
      message.error('加载选项失败')
      // 出错时也设置为空数组
      setModifierGroupOptions(prev => ({ ...prev, [groupId]: [] }))
      return []
    }
  }

  useEffect(() => {
    loadModifierGroups()
  }, [typeFilter])

  // 创建修饰符组
  const handleCreateGroup = () => {
    setEditingGroup(null)
    groupForm.resetFields()
    setModalVisible(true)
  }

  // 编辑修饰符组
  const handleEditGroup = async (group: ModifierGroup) => {
    setEditingGroup(group)
    await loadOptions(group.id)
    groupForm.setFieldsValue({
      name: group.name,
      displayName: group.displayName,
      groupType: group.groupType,
      description: group.description,
      isActive: group.isActive
    })
    setModalVisible(true)
  }

  // 提交组表单
  const handleGroupSubmit = async (values: CreateModifierGroupPayload) => {
    try {
      if (editingGroup) {
        // 更新修饰符组 - name 字段不可修改，不发送到后端
        const payload: Partial<CreateModifierGroupPayload> = {
          displayName: values.displayName,
          groupType: values.groupType,
          description: values.description,
          isActive: values.isActive
        }
        await itemManagementService.updateModifierGroup(editingGroup.id, payload as any)
        message.success('自定义选项组更新成功')
        setModalVisible(false)
        setEditingGroup(null)
        
        // 重新加载数据
        await loadModifierGroups()
      } else {
        // 创建新的
        // 根据 API 文档，创建修饰符组时只需要：name, displayName, groupType, description
        // isRequired, minSelections, maxSelections 这些是在商品关联时定义的，不是组本身的性质
        const payload: CreateModifierGroupPayload = {
          name: values.name,
          displayName: values.displayName,
          groupType: values.groupType,
          description: values.description,
          isActive: values.isActive
        }
        await itemManagementService.createModifierGroup(payload)
        message.success('自定义选项组创建成功')
        setModalVisible(false)
        loadModifierGroups()
      }
    } catch (error) {
      console.error('Failed to submit group:', error)
      message.error(editingGroup ? '更新自定义选项组失败' : '创建自定义选项组失败')
    }
  }

  // 删除组
  const handleDeleteGroup = async (id: string) => {
    try {
      await itemManagementService.deleteModifierGroup(id)
      message.success('删除自定义选项组成功')
      // 重新加载列表
      loadModifierGroups()
      // 清除相关的选项缓存
      setModifierGroupOptions(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    } catch (error: any) {
      console.error('Failed to delete group:', error)
      const errorMessage = error?.response?.data?.error || error?.message || '删除自定义选项组失败'
      message.error(errorMessage)
    }
  }

  // 创建选项
  const handleCreateOption = async (groupId: string) => {
    setSelectedGroupId(groupId)
    optionForm.resetFields()
    setOptionModalVisible(true)
  }

  // 提交选项表单
  const handleOptionSubmit = async (values: CreateModifierOptionPayload) => {
    if (!selectedGroupId) return
    try {
      if (editingOption) {
        // 更新选项 - name 字段不可修改，不发送到后端
        const payload: Partial<CreateModifierOptionPayload> = {
          displayName: values.displayName,
          defaultPrice: values.defaultPrice,
          cost: values.cost,
        }
        console.log('[MODIFIER] 🔨 Updating option:', editingOption.id, 'payload:', payload)
        await itemManagementService.updateModifierOption(selectedGroupId, editingOption.id, payload)
        console.log('[MODIFIER] ✅ Option updated')
        message.success('选项更新成功')
      } else {
        // 创建选项 - 自动计算 displayOrder（按添加顺序）
        const currentGroup = modifierGroups.find(g => g.id === selectedGroupId)
        const existingOptions = currentGroup?.options || []

        // 找到当前最大的 displayOrder，新选项的 displayOrder = max + 1
        const maxDisplayOrder = existingOptions.reduce((max, opt) => {
          const order = opt.displayOrder ?? 0
          return Math.max(max, order)
        }, -1)

        const nextDisplayOrder = maxDisplayOrder + 1

        const payload: CreateModifierOptionPayload = {
          ...values,
          displayOrder: nextDisplayOrder
        }

        console.log('[MODIFIER] 🔨 Creating option for group:', selectedGroupId, 'payload:', payload, 'calculated displayOrder:', nextDisplayOrder)
        const createdOption = await itemManagementService.createModifierOption(selectedGroupId, payload)
        console.log('[MODIFIER] ✅ Option created, response:', createdOption)
        message.success('选项创建成功')
      }
      
      setOptionModalVisible(false)
      setEditingOption(null)
      
      // 等待一小段时间，确保后端数据已经同步
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 立即重新获取最新的组数据（确保包含新创建/更新的 option）
      // 🔧 避免后端 Bug: 直接用当前组的 groupType 查询，确保返回 options
      const currentGroup = modifierGroups.find(g => g.id === selectedGroupId)
      console.log('[MODIFIER] 🔍 Current group:', currentGroup?.name, 'groupType:', currentGroup?.groupType)
      
      const queryParams = currentGroup 
        ? { isActive: true, groupType: currentGroup.groupType as any }
        : { isActive: true }
      
      console.log('[MODIFIER] 🔄 Fetching fresh groups with params:', queryParams)
      const freshGroups = await itemManagementService.getModifierGroups(queryParams)
      console.log('[MODIFIER] 📥 Fresh groups count:', freshGroups.length)
      
      // 找到刚更新的组
      const updatedGroup = freshGroups.find(g => g.id === selectedGroupId)
      console.log('[MODIFIER] 🎯 Updated group found:', !!updatedGroup, 'options count:', updatedGroup?.options?.length || 0)
      
      if (updatedGroup) {
        console.log('[MODIFIER] 📋 Updated group options:', JSON.stringify(updatedGroup.options, null, 2))
        
        // 规范化 options 数据
        const normalizedOptions = (updatedGroup.options || []).map(option => ({
          ...option,
          defaultPrice: typeof option.defaultPrice === 'string'
            ? parseFloat(option.defaultPrice) || 0
            : (option.defaultPrice || 0),
          displayOrder: option.displayOrder ?? 0,
          cost: option.cost !== null && option.cost !== undefined
            ? (typeof option.cost === 'string' ? parseFloat(option.cost) : option.cost)
            : undefined
        }))
        
        console.log('[MODIFIER] 🔧 Normalized options count:', normalizedOptions.length)
        
        // 更新 modifierGroups 中对应的组（确保 UI 刷新）
        setModifierGroups(prev => {
          const updated = prev.map(g => 
            g.id === selectedGroupId 
              ? { ...updatedGroup, options: normalizedOptions as any }
              : g
          )
          console.log('[MODIFIER] ✨ Updated modifierGroups, group has', 
            updated.find(g => g.id === selectedGroupId)?.options?.length || 0, 'options')
          return updated
        })
        
        // 更新 options 缓存
        setModifierGroupOptions(prev => ({ 
          ...prev, 
          [selectedGroupId]: normalizedOptions 
        }))
        
        // 如果管理选项模态框是打开的，也更新它
        if (managingGroup && managingGroup.id === selectedGroupId) {
          console.log('[MODIFIER] 🔄 Updating managing group modal')
          setManagingGroup({ 
            ...updatedGroup, 
            options: normalizedOptions as any 
          })
        }
      } else {
        console.error('[MODIFIER] ❌ Updated group not found in fresh groups!')
      }
    } catch (error) {
      console.error('[MODIFIER] ❌ Failed to submit option:', error)
      message.error('保存选项失败')
    }
  }

  // 编辑选项
  const handleEditOption = (groupId: string, option: ModifierOption) => {
    setEditingOption(option)
    setSelectedGroupId(groupId)
    optionForm.setFieldsValue({
      name: option.name,
      displayName: option.displayName,
      defaultPrice: typeof option.defaultPrice === 'string' ? parseFloat(option.defaultPrice) : option.defaultPrice,
      cost: option.cost || undefined,
    })
    setOptionModalVisible(true)
  }

  // 打开管理选项模态框
  const handleManageOptions = async (group: ModifierGroup) => {
    // 先显示模态框（用现有数据快速响应）
    const cachedOptions = group.options || modifierGroupOptions[group.id] || []
    setManagingGroup({ ...group, options: cachedOptions as any })
    setManageOptionsModalVisible(true)
    
    // 然后立即获取最新数据
    try {
      // 🔧 避免后端 Bug: 用该组的 groupType 查询，确保返回 options
      const queryParams = { isActive: true, groupType: group.groupType as any }
      const freshGroups = await itemManagementService.getModifierGroups(queryParams)
      console.log('[MODIFIER] 📥 Fresh groups for manage modal:', JSON.stringify(freshGroups, null, 2))
      
      const updatedGroup = freshGroups.find(g => g.id === group.id)
      
      if (updatedGroup) {
        // 规范化 options 数据
        const normalizedOptions = (updatedGroup.options || []).map(option => ({
          ...option,
          defaultPrice: typeof option.defaultPrice === 'string'
            ? parseFloat(option.defaultPrice) || 0
            : (option.defaultPrice || 0),
          displayOrder: option.displayOrder ?? 0,
          cost: option.cost !== null && option.cost !== undefined
            ? (typeof option.cost === 'string' ? parseFloat(option.cost) : option.cost)
            : undefined
        }))
        
        // 更新所有相关状态
        setModifierGroupOptions(prev => ({ 
          ...prev, 
          [group.id]: normalizedOptions 
        }))
        
        setManagingGroup({ 
          ...updatedGroup, 
          options: normalizedOptions as any 
        })
        
        // 同时更新主列表中的这个组
        setModifierGroups(prev => 
          prev.map(g => 
            g.id === group.id 
              ? { ...updatedGroup, options: normalizedOptions as any }
              : g
          )
        )
      }
    } catch (error) {
      console.error('Failed to refresh options:', error)
      // 如果获取失败，继续使用缓存数据
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      ellipsis: true
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 120,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'groupType',
      key: 'groupType',
      width: 50,
      render: (type: string) => getGroupTypeTag(type)
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 65,
      align: 'center' as const,
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '激活' : '禁用'}</Tag>
      )
    },
    {
      title: '选项',
      key: 'options',
      width: 130,
      align: 'center' as const,
      render: (_: any, record: ModifierGroup) => {
        const options = record?.options || []
        const count = Array.isArray(options) ? options.length : 0
        return (
          <Space size={4} direction="vertical" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Tag color="blue">{count} 个</Tag>
            <Button
              type="primary"
              size="small"
              onClick={() => handleManageOptions(record)}
            >
              编辑
            </Button>
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: ModifierGroup) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleEditGroup(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除此自定义选项组吗？"
            onConfirm={() => handleDeleteGroup(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="自定义选项组管理"
        extra={
          <Space>
            <Segmented
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as any)}
              options={[
                { label: '全部', value: 'all' },
                { label: '属性', value: 'property' },
                { label: '加料', value: 'addon' },
                { label: '自定义', value: 'custom' }
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={loadModifierGroups} loading={loading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateGroup}
            >
              创建选项组
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading} indicator={loadingIcon}>
          {modifierGroups.length === 0 ? (
            <Empty description="暂无自定义选项组">
              <Button type="primary" onClick={handleCreateGroup}>
                创建第一个选项组
              </Button>
            </Empty>
          ) : (
            <Table
              dataSource={modifierGroups}
              rowKey="id"
              pagination={false}
              columns={columns}
              size="small"
            />
          )}
        </Spin>
      </Card>

      {/* 修饰符组编辑模态框 */}
      <Modal
        title={editingGroup ? '编辑自定义选项组' : '创建自定义选项组'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleGroupSubmit}
        >
          <Form.Item
            name="displayName"
            label="选项组名称"
            rules={[{ required: true, message: '请输入选项组名称' }]}
            tooltip="客户在选择时看到的名称"
          >
            <Input placeholder="例如：规格、颜色、配置" />
          </Form.Item>

          {editingGroup && (
            <Form.Item
              name="name"
              label="系统标识"
              tooltip="系统内部使用的标识符，创建后不可修改"
            >
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item
            name="groupType"
            label="选项组类型"
            rules={[{ required: true, message: '请选择选项组类型' }]}
            help="选择此选项组的分类"
          >
            <Select placeholder="选择类型">
              <Select.Option value="property">
                属性 - 商品本身的可选配置
              </Select.Option>
              <Select.Option value="addon">
                加料 - 可选的额外配料或附加项
              </Select.Option>
              <Select.Option value="custom">
                自定义 - 其他自定义分类
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述（可选）"
          >
            <Input.TextArea rows={3} placeholder="简要描述此选项组的用途" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="激活状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingGroup ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 管理选项模态框 */}
      <Modal
        title={managingGroup ? `管理选项 - ${managingGroup.displayName}` : '管理选项'}
        open={manageOptionsModalVisible}
        onCancel={() => setManageOptionsModalVisible(false)}
        footer={null}
        width={1000}
        zIndex={1000}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (managingGroup) {
                  handleCreateOption(managingGroup.id)
                }
              }}
            >
              添加选项
            </Button>
          </div>
          {managingGroup && (() => {
            try {
              // 优先使用 managingGroup.options（最新数据），否则使用 modifierGroupOptions
              const options = managingGroup?.options || modifierGroupOptions[managingGroup?.id] || []
              const validOptions = Array.isArray(options) ? options.filter(opt => opt && opt.id) : []
              
              return validOptions.length === 0 ? (
                <Empty description="暂无选项" />
              ) : (
                <Table
                  dataSource={validOptions}
                  rowKey="id"
                  pagination={false}
                  size="small"
                columns={[
                {
                  title: '选项值',
                  dataIndex: 'name',
                  key: 'name',
                  width: 100,
                  render: (val: string) => <Typography.Text code>{val || '-'}</Typography.Text>
                },
                {
                  title: '显示名称',
                  dataIndex: 'displayName',
                  key: 'displayName',
                  width: 150,
                  render: (val: string, record: ModifierOption) => {
                    const editKey = `${record.id}_displayName`
                    const editValue = editingValues[editKey] !== undefined ? editingValues[editKey] : val
                    return (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, [editKey]: e.target.value }))}
                        onBlur={async () => {
                          // 失焦时保存
                          if (editValue !== val && managingGroup) {
                            try {
                              await itemManagementService.updateModifierOption(managingGroup.id, record.id, {
                                displayName: editValue,
                                defaultPrice: record.defaultPrice,
                                cost: record.cost
                              })
                              message.success('选项已更新')
                              // 清除编辑状态
                              setEditingValues(prev => {
                                const newState = { ...prev }
                                delete newState[editKey]
                                return newState
                              })
                              // 更新所有相关状态，保持数据一致性
                              if (managingGroup) {
                                const updatedOptions = (managingGroup.options || []).map(opt =>
                                  opt.id === record.id ? { ...opt, displayName: editValue } : opt
                                )
                                const updatedGroup = { ...managingGroup, options: updatedOptions as any }
                                
                                // 同步更新三个地方的状态
                                setManagingGroup(updatedGroup)
                                setModifierGroupOptions(prev => ({ 
                                  ...prev, 
                                  [managingGroup.id]: updatedOptions 
                                }))
                                setModifierGroups(prev => 
                                  prev.map(g => 
                                    g.id === managingGroup.id 
                                      ? updatedGroup 
                                      : g
                                  )
                                )
                              }
                            } catch (error) {
                              message.error('更新失败')
                              // 恢复原值
                              setEditingValues(prev => {
                                const newState = { ...prev }
                                delete newState[editKey]
                                return newState
                              })
                            }
                          }
                        }}
                        size="small"
                        style={{ width: '100%' }}
                      />
                    )
                  }
                },
                {
                  title: '默认价格',
                  dataIndex: 'defaultPrice',
                  key: 'defaultPrice',
                  width: 120,
                  render: (val: number, record: ModifierOption) => {
                    try {
                      // 服务层 getModifierGroups() 已经将价格从分转换为元，这里直接使用
                      const originalPrice = typeof val === 'number' ? val : 0
                      const editKey = `${record.id}_defaultPrice`
                      const editPrice = editingValues[editKey] !== undefined ? editingValues[editKey] : originalPrice
                      return (
                        <InputNumber
                          value={editPrice}
                          placeholder="请输入元为单位的价格"
                          precision={2}
                          onChange={(newPrice) => setEditingValues(prev => ({ ...prev, [editKey]: newPrice || 0 }))}
                          onBlur={async () => {
                            // 失焦时保存
                            if (editPrice !== originalPrice && managingGroup) {
                              try {
                                // 服务层 updateModifierOption 会自动将元转换为分发送到后端
                                await itemManagementService.updateModifierOption(managingGroup.id, record.id, {
                                  displayName: record.displayName,
                                  defaultPrice: editPrice,
                                  cost: record.cost // 已经是元，服务层会转换
                                })
                                message.success('选项已更新')
                                // 清除编辑状态
                                setEditingValues(prev => {
                                  const newState = { ...prev }
                                  delete newState[editKey]
                                  return newState
                                })
                                // 更新所有相关状态，保持数据一致性
                                if (managingGroup) {
                                  const updatedOptions = (managingGroup.options || []).map(opt =>
                                    opt.id === record.id ? { ...opt, defaultPrice: editPrice } : opt
                                  )
                                  const updatedGroup = { ...managingGroup, options: updatedOptions as any }

                                  // 同步更新三个地方的状态
                                  setManagingGroup(updatedGroup)
                                  setModifierGroupOptions(prev => ({
                                    ...prev,
                                    [managingGroup.id]: updatedOptions
                                  }))
                                  setModifierGroups(prev =>
                                    prev.map(g =>
                                      g.id === managingGroup.id
                                        ? updatedGroup
                                        : g
                                    )
                                  )
                                }
                              } catch (error) {
                                message.error('更新失败')
                                // 恢复原值
                                setEditingValues(prev => {
                                  const newState = { ...prev }
                                  delete newState[editKey]
                                  return newState
                                })
                              }
                            }
                          }}
                          size="small"
                          precision={2}
                          min={0}
                          style={{ width: '100%' }}
                          addonBefore="¥"
                        />
                      )
                    } catch (error) {
                      return '¥0.00'
                    }
                  }
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 80,
                  render: (_: any, option: ModifierOption) => (
                    <Popconfirm
                      title="确认删除"
                      description="确定要删除此选项吗？删除后无法恢复。"
                      onConfirm={async () => {
                        if (managingGroup) {
                          try {
                            await itemManagementService.deleteModifierOption(managingGroup.id, option.id)
                            message.success('删除选项成功')
                            // 重新加载选项
                            await handleManageOptions(managingGroup)
                          } catch (error: any) {
                            console.error('Failed to delete option:', error)
                            const errorMessage = error?.response?.data?.error || error?.message || '删除选项失败'
                            message.error(errorMessage)
                          }
                        }
                      }}
                    >
                      <Button type="link" size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  )
                }
              ]}
              />
              )
            } catch (error) {
              console.error('Error rendering manage options table:', error)
              return <Empty description="加载选项时出错" />
            }
          })()}
        </div>
      </Modal>

      {/* 选项编辑模态框 */}
      <Modal
        title={editingOption ? "编辑选项" : "添加选项"}
        open={optionModalVisible}
        onCancel={() => {
          setOptionModalVisible(false)
          setEditingOption(null)
        }}
        footer={null}
        width={500}
        zIndex={2000}
      >
        <Form
          form={optionForm}
          layout="vertical"
          onFinish={handleOptionSubmit}
        >
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
            tooltip="用户在点单时看到的名称"
          >
            <Input placeholder="例如：小杯、中杯、大杯" />
          </Form.Item>

          <Form.Item
            name="code"
            label="选项代码"
            tooltip="用于制作指引打印，如珍珠用 P、椰果用 C"
          >
            <Input placeholder="例如：P、C、D" maxLength={20} />
          </Form.Item>

          {editingOption && (
            <Form.Item
              name="name"
              label="系统名称"
              tooltip="系统内部使用的标识符，创建后不可修改"
            >
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item
            name="defaultPrice"
            label="默认价格"
            rules={[{ type: 'number', message: '请输入有效的价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              precision={2}
              addonBefore="¥"
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setOptionModalVisible(false)
                setEditingOption(null)
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingOption ? "更新" : "创建"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ModifierGroupManager
