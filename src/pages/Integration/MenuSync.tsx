import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Row,
  Col,
  Table,
  Checkbox,
  InputNumber,
  Tabs,
  message,
  Tooltip,
  Badge,
  Empty,
  Drawer,
  List,
  Select,
  Spin,
  Input,
  Popconfirm,
  TimePicker,
  Alert
} from 'antd'
import dayjs from 'dayjs'
import {
  UploadOutlined,
  SyncOutlined,
  SettingOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import {
  uberMenuSyncService,
  MenuConfigItem,
  ModifierConfigItem,
  MenuGroup
} from '@/services/uberMenuSync'
import { uberService } from '@/services/uber'
import { itemManagementService } from '@/services/item-management'

interface MenuSyncProps {
  merchantId: string
  storeId: string
  storeName: string
  integrationId?: string
}

/**
 * 菜单同步组件
 * 支持：选择性同步、价格覆盖、同步历史
 */
const MenuSync: React.FC<MenuSyncProps> = ({
  merchantId,
  storeId,
  integrationId
}) => {
  const { t } = useTranslation()

  // 基础状态
  const [posSyncing, setPOSSyncing] = useState(false)

  // 配置管理状态
  const [configItems, setConfigItems] = useState<MenuConfigItem[]>([])
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [modifiedItems, setModifiedItems] = useState<Map<string, { enabled?: boolean; uberPrice?: number | null }>>(new Map())

  // 修饰符配置状态
  const [modifierModalVisible, setModifierModalVisible] = useState(false)
  const [modifierSaving, setModifierSaving] = useState(false)
  const [currentModifierItem, setCurrentModifierItem] = useState<MenuConfigItem | null>(null)
  const [modifierConfigs, setModifierConfigs] = useState<Map<string, ModifierConfigItem[]>>(new Map()) // posItemId -> ModifierConfigItem[]
  const [modifiedModifiers, setModifiedModifiers] = useState<Map<string, { enabled?: boolean; uberPrice?: number | null; posItemId?: string; modifierOptionId?: string }>>(new Map())

  // 当前 Tab
  const [activeTab, setActiveTab] = useState('')

  // 统一调价工具状态
  const [priceAdjustmentModalVisible, setPriceAdjustmentModalVisible] = useState(false)
  const [priceAdjustmentPercent, setPriceAdjustmentPercent] = useState<number | null>(null)

  // 清理菜单状态
  const [clearingMenu, setClearingMenu] = useState(false)

  // 菜单组管理状态
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([])
  const [selectedMenuGroupId, setSelectedMenuGroupId] = useState<string>('')
  const [menuGroupLoading, setMenuGroupLoading] = useState(false)
  const [menuGroupModalVisible, setMenuGroupModalVisible] = useState(false)
  const [editingMenuGroup, setEditingMenuGroup] = useState<MenuGroup | null>(null)

  // 菜单配置状态（名称、营业时间）
  const [menuConfigModalVisible, setMenuConfigModalVisible] = useState(false)
  const [menuName, setMenuName] = useState('Menu')
  const [serviceAvailability, setServiceAvailability] = useState<Map<string, Array<{ startTime: string; endTime: string }>>>(
    new Map([
      ['monday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['tuesday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['wednesday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['thursday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['friday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['saturday', [{ startTime: '00:00', endTime: '23:59' }]],
      ['sunday', [{ startTime: '00:00', endTime: '23:59' }]]
    ])
  )

  // 菜单分类管理状态
  const [systemCategories, setSystemCategories] = useState<any[]>([]) // 系统中的 POS 分类
  const [uberCategories, setUberCategories] = useState<any[]>([]) // 用户创建的 Uber 分类
  const [selectedSystemCategories, setSelectedSystemCategories] = useState<any[]>([]) // 选中的系统分类（用于配置）
  const [systemToUberCategoryMap, setSystemToUberCategoryMap] = useState<Map<string, string>>(new Map()) // 系统分类 ID -> Uber 分类 ID 映射
  const [categoryLoading, setcategoryLoading] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('') // 新建自定义分类的名称
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
  const [categoryItems, setCategoryItems] = useState<any[]>([])
  const [posItems, setPosItems] = useState<any[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // 菜单特定分类管理状态
  const [menuCategories, setMenuCategories] = useState<any[]>([]) // 当前菜单的分类列表
  const [menuCategoriesLoading, setMenuCategoriesLoading] = useState(false)
  const [availableCategoriesForMenu, setAvailableCategoriesForMenu] = useState<any[]>([]) // 可以添加到菜单的分类（全局分类 - 菜单已有分类）

  // 获取租户 ID
  const getTenantId = (): string => {
    return localStorage.getItem('organization_id') || ''
  }

  // 加载菜单配置
  const loadMenuConfig = async (menuGroupId?: string) => {
    if (!integrationId) return

    const tenantId = getTenantId()
    if (!tenantId) {
      message.error('无法获取租户信息')
      return
    }

    try {
      setConfigLoading(true)
      const result = await uberMenuSyncService.getMenuConfig(integrationId, tenantId, menuGroupId)
      setConfigItems(result.items)
      setModifiedItems(new Map())

      // 预加载所有商品的修饰符配置
      const allModifierConfigs = new Map<string, ModifierConfigItem[]>()

      // 并行加载所有商品的修饰符
      await Promise.all(
        result.items.map(async (item) => {
          try {
            const modifierResult = await uberMenuSyncService.getModifierConfig(
              integrationId,
              tenantId,
              item.posItemId,
              menuGroupId
            )
            allModifierConfigs.set(item.posItemId, modifierResult.modifiers)
          } catch (error) {
            console.warn(`加载商品 ${item.posItemId} 的修饰符失败:`, error)
            // 即使某个商品的修饰符加载失败，也继续加载其他商品
            allModifierConfigs.set(item.posItemId, [])
          }
        })
      )

      setModifierConfigs(allModifierConfigs)

      // 调试信息：显示加载的modifier数量
      const totalModifiers = Array.from(allModifierConfigs.values()).reduce((sum, mods) => sum + mods.length, 0)
      console.log('加载的商品数:', result.items.length)
      console.log('加载的modifier总数:', totalModifiers)
      console.log('modifierConfigs详情:', Array.from(allModifierConfigs.entries()).map(([id, mods]) => ({ itemId: id, count: mods.length })))
    } catch (error: any) {
      message.error(error.message || '加载配置失败')
    } finally {
      setConfigLoading(false)
    }
  }

  // 加载系统中的 POS 分类及其商品
  const loadSystemCategories = async () => {
    try {
      console.log('🔍 开始加载系统分类...')
      const categories = await itemManagementService.getCategories()
      console.log('📦 获取到的分类数据:', categories)
      console.log('📦 分类数量:', categories?.length || 0)

      // 为每个分类加载其商品
      const categoriesWithItems = await Promise.all(
        (categories || []).map(async (cat: any) => {
          try {
            console.log(`🔍 加载分类 ${cat.name} (${cat.id}) 的商品...`)
            const itemsResponse = await itemManagementService.getItems({ categoryId: cat.id })
            console.log(`📦 分类 ${cat.name} 的商品数量:`, itemsResponse.data?.length || 0)
            return {
              ...cat,
              items: itemsResponse.data || [],
              itemCount: itemsResponse.data?.length || 0
            }
          } catch (error) {
            console.error(`❌ 加载分类 ${cat.id} 的商品失败:`, error)
            return {
              ...cat,
              items: [],
              itemCount: 0
            }
          }
        })
      )

      console.log('✅ 系统分类加载完成，总数:', categoriesWithItems.length)
      setSystemCategories(categoriesWithItems)
    } catch (error: any) {
      console.error('❌ 加载系统分类失败:', error)
      console.error('错误详情:', error.response || error.message || error)
    }
  }

  // 加载用户创建的 Uber 分类
  const loadUberCategories = async () => {
    if (!integrationId) return
    try {
      setcategoryLoading(true)
      const data = await uberService.getMenuCategories(integrationId)
      setUberCategories(data)
    } catch (error: any) {
      message.error(error.message || '加载 Uber 分类失败')
    } finally {
      setcategoryLoading(false)
    }
  }

  // 加载 POS 商品
  const loadPosItems = async () => {
    if (!integrationId) return
    try {
      setItemsLoading(true)
      // 获取所有商品，不按分类过滤
      const response = await itemManagementService.getItems({})
      // response 可能是数组或对象，处理两种情况
      const items = Array.isArray(response) ? response : (response?.data || [])
      setPosItems(items || [])
    } catch (error: any) {
      console.error('加载商品失败:', error)
      message.error(error.message || '加载商品失败')
    } finally {
      setItemsLoading(false)
    }
  }

  // 加载分类商品
  const loadCategoryItems = async (categoryId: string) => {
    try {
      setItemsLoading(true)
      const items = await uberService.getMenuCategoryItems(categoryId)
      setCategoryItems(items)
      // 重置选择，防止上一个分类的选择干扰新分类
      setSelectedItems([])
    } catch (error: any) {
      message.error(error.message || '加载分类商品失败')
    } finally {
      setItemsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (integrationId) {
      loadSystemCategories() // 加载系统分类
      loadUberCategories() // 加载用户创建的 Uber 分类
      loadPosItems()
      loadMenuGroups() // 加载菜单组
    }
  }, [integrationId])

  // 当 Tab 切换时，重新加载对应菜单的配置和分类
  useEffect(() => {
    if (activeTab && integrationId) {
      loadMenuConfig(activeTab)
      loadMenuCategoriesForCurrentMenu(activeTab)
    }
  }, [activeTab])

  // 当菜单组加载完成后，设置默认激活的Tab
  useEffect(() => {
    if (menuGroups.length > 0 && !activeTab) {
      // 默认显示第一个菜单 Tab
      setActiveTab(menuGroups[0].id)
    }
  }, [menuGroups, activeTab])

  // 处理配置变更
  const handleConfigChange = (posItemId: string, field: 'enabled' | 'uberPrice', value: any) => {
    const newModified = new Map(modifiedItems)
    const existing = newModified.get(posItemId) || {}
    newModified.set(posItemId, { ...existing, [field]: value })
    setModifiedItems(newModified)
  }

  // 获取商品的有效值
  const getEffectiveValue = (item: MenuConfigItem, field: 'enabled' | 'uberPrice') => {
    const modified = modifiedItems.get(item.posItemId)
    if (modified && modified[field] !== undefined) {
      return modified[field]
    }
    return item[field]
  }

  // 获取商品名称，优先从POS商品列表中查找，其次使用已保存的名称
  const getItemName = (categoryItem: any): string => {
    if (categoryItem.posItemName) {
      return categoryItem.posItemName
    }
    // 从POS商品列表中查找
    const posItem = posItems.find(item => item.id === categoryItem.posItemId)
    return posItem?.name || categoryItem.posItemId
  }

  // 加载菜单组列表
  const loadMenuGroups = async () => {
    if (!integrationId) return
    try {
      setMenuGroupLoading(true)
      const groups = await uberMenuSyncService.getMenuGroups(storeId, integrationId)
      setMenuGroups(groups)
      if (groups.length > 0 && !selectedMenuGroupId) {
        setSelectedMenuGroupId(groups[0].id)
      }
      return groups
    } catch (error: any) {
      console.error('加载菜单组失败:', error)
      message.error(error.message || '加载菜单组失败')
      return []
    } finally {
      setMenuGroupLoading(false)
    }
  }

  // 加载菜单的分类列表
  const loadMenuCategoriesForCurrentMenu = async (menuGroupId: string) => {
    if (!menuGroupId || !integrationId) return
    try {
      setMenuCategoriesLoading(true)
      const response = await uberMenuSyncService.getMenuGroupCategories(storeId, menuGroupId)
      setMenuCategories(response || [])

      // 计算可以添加到菜单的分类（已创建的 Uber 分类 - 菜单已有的分类）
      const menuCategoryIds = new Set((response || []).map((c: any) => c.id))
      const available = (uberCategories || []).filter((cat: any) => !menuCategoryIds.has(cat.id))
      setAvailableCategoriesForMenu(available)
    } catch (error: any) {
      console.error('加载菜单分类失败:', error)
      message.error(error.message || '加载菜单分类失败')
    } finally {
      setMenuCategoriesLoading(false)
    }
  }

  // 添加分类到菜单
  const handleAddCategoryToMenu = async (categoryId: string) => {
    const menuGroupId = activeTab
    if (!menuGroupId || !integrationId) {
      message.error('请先选择菜单')
      return
    }

    try {
      setMenuCategoriesLoading(true)
      await uberMenuSyncService.addCategoryToMenuGroup(
        storeId,
        menuGroupId,
        categoryId,
        integrationId
      )
      message.success('分类已添加到菜单')
      await loadMenuCategoriesForCurrentMenu(menuGroupId)
    } catch (error: any) {
      message.error(error.message || '添加分类失败')
    } finally {
      setMenuCategoriesLoading(false)
    }
  }

  // 从菜单删除分类
  const handleRemoveCategoryFromMenu = async (categoryId: string, categoryName: string, isSystemCategory: boolean) => {
    const menuGroupId = activeTab
    if (!menuGroupId) {
      message.error('请先选择菜单')
      return
    }

    try {
      setMenuCategoriesLoading(true)

      if (isSystemCategory) {
        // 系统分类：只移除关联,保留分类本身
        await uberMenuSyncService.removeCategoryFromMenuGroup(storeId, menuGroupId, categoryId)
        message.success(`系统分类「${categoryName}」已从菜单中移除(分类本身保留)`)
      } else {
        // 自定义分类：先移除关联,再彻底删除分类
        await uberMenuSyncService.removeCategoryFromMenuGroup(storeId, menuGroupId, categoryId)
        await uberService.deleteMenuCategory(categoryId)
        message.success(`自定义分类「${categoryName}」已彻底删除`)
      }

      // 重新加载数据：先加载全局分类列表,确保删除操作已生效,然后再加载菜单分类
      await loadUberCategories()
      await loadMenuCategoriesForCurrentMenu(menuGroupId)
    } catch (error: any) {
      message.error(error.message || '删除分类失败')
    } finally {
      setMenuCategoriesLoading(false)
    }
  }

  // 重新排序菜单分类
  const handleReorderMenuCategories = async (categoryIds: string[]) => {
    const menuGroupId = activeTab
    if (!menuGroupId) {
      message.error('请先选择菜单')
      return
    }

    try {
      await uberMenuSyncService.reorderMenuGroupCategories(storeId, menuGroupId, categoryIds)
      message.success('分类顺序已更新')
      await loadMenuCategoriesForCurrentMenu(menuGroupId)
    } catch (error: any) {
      message.error(error.message || '重新排序失败')
    }
  }

  // 创建菜单组（只需要名称和营业时间，分类在菜单Tab中配置）
  const handleCreateMenuGroup = async (name: string, availability: any) => {
    if (!integrationId) return
    try {
      setMenuGroupLoading(true)
      await uberMenuSyncService.createMenuGroup(storeId, integrationId, {
        name,
        displayOrder: menuGroups.length,
        serviceAvailability: availability
      })
      message.success('菜单创建成功')
      setMenuGroupModalVisible(false)
      const groups = await loadMenuGroups()
      // 自动切换到新创建的菜单
      if (groups && groups.length > 0) {
        setActiveTab(groups[groups.length - 1].id)
      }
    } catch (error: any) {
      message.error(error.message || '创建菜单失败')
    } finally {
      setMenuGroupLoading(false)
    }
  }

  // 更新菜单组（只更新名称和营业时间，分类在菜单Tab中配置）
  const handleUpdateMenuGroup = async (groupId: string, name: string, availability: any) => {
    try {
      setMenuGroupLoading(true)
      await uberMenuSyncService.updateMenuGroup(storeId, groupId, {
        name,
        serviceAvailability: availability
      })
      message.success('菜单更新成功')
      setMenuGroupModalVisible(false)
      await loadMenuGroups()
    } catch (error: any) {
      message.error(error.message || '更新菜单失败')
    } finally {
      setMenuGroupLoading(false)
    }
  }

  // 删除菜单组（仅删除数据库配置）
  const handleDeleteMenuGroup = async (groupId: string) => {
    try {
      setMenuGroupLoading(true)
      
      // 删除数据库中的菜单配置
      await uberMenuSyncService.deleteMenuGroup(storeId, groupId)
      message.success('菜单配置已删除')
      
      // 更新选中状态
      if (selectedMenuGroupId === groupId) {
        setSelectedMenuGroupId('')
      }
      
      // 重新加载菜单列表
      const groups = await loadMenuGroups()
      
      // 如果还有其他菜单，切换到第一个；否则清空activeTab
      if (groups && groups.length > 0) {
        setActiveTab(groups[0].id)
      } else {
        setActiveTab('')
      }
      
    } catch (error: any) {
      message.error(error.message || '删除菜单失败')
    } finally {
      setMenuGroupLoading(false)
    }
  }

  // 保存配置（同时保存商品价格和自定义选项价格）
  const handleSaveConfig = async () => {
    if (!integrationId || (modifiedItems.size === 0 && modifiedModifiers.size === 0)) return

    const tenantId = getTenantId()
    if (!tenantId) {
      message.error('无法获取租户信息')
      return
    }

    try {
      setConfigSaving(true)
      setModifierSaving(true)

      // 获取当前菜单组ID
      const menuGroupId = activeTab

      const savePromises = []

      // 保存商品价格配置
      if (modifiedItems.size > 0) {
        const itemsToSave = configItems.map((item) => {
          const modified = modifiedItems.get(item.posItemId)
          return {
            posItemId: item.posItemId,
            enabled: modified?.enabled ?? item.enabled,
            uberPrice: modified?.uberPrice !== undefined ? modified.uberPrice : item.uberPrice
          }
        })
        savePromises.push(
          uberMenuSyncService.saveMenuConfig(integrationId, tenantId, itemsToSave, menuGroupId)
        )
      }

      // 保存自定义选项价格配置
      if (modifiedModifiers.size > 0) {
        console.log('=== 开始保存修饰符配置 ===')
        console.log('modifiedModifiers 总数:', modifiedModifiers.size)
        console.log('modifiedModifiers 内容:')
        modifiedModifiers.forEach((data, key) => {
          console.log(`  key: ${key}`)
          console.log(`  data:`, data)
        })

        // 收集所有需要保存的修饰符
        const allModifiersToSave: any[] = []

        // 遍历 modifiedModifiers，直接获取需要保存的修饰符
        modifiedModifiers.forEach((modifiedData: any, key: string) => {
          const posItemId = modifiedData.posItemId
          const modifierOptionId = modifiedData.modifierOptionId

          console.log(`\n处理 key: ${key}`)
          console.log(`  posItemId: ${posItemId}`)
          console.log(`  modifierOptionId: ${modifierOptionId}`)

          // 从 modifierConfigs 中找到对应的完整数据
          const modifiers = modifierConfigs.get(posItemId) || []
          console.log(`  该商品的所有修饰符数量: ${modifiers.length}`)

          const mod = modifiers.find(m => m.modifierOptionId === modifierOptionId)

          if (mod) {
            console.log(`  找到修饰符:`, {
              posItemName: configItems.find(i => i.posItemId === posItemId)?.posItemName,
              modifierOptionName: mod.modifierOptionName,
              modifierOptionId: mod.modifierOptionId,
              posPrice: mod.posPrice,
              originalUberPrice: mod.uberPrice,
              newUberPrice: modifiedData.uberPrice !== undefined ? modifiedData.uberPrice : mod.uberPrice
            })

            const toSave = {
              posItemId: mod.posItemId,
              modifierGroupId: mod.modifierGroupId,
              modifierOptionId: mod.modifierOptionId,
              modifierOptionName: mod.modifierOptionName,
              enabled: modifiedData.enabled !== undefined ? modifiedData.enabled : mod.enabled,
              uberPrice: modifiedData.uberPrice !== undefined ? modifiedData.uberPrice : mod.uberPrice
            }
            allModifiersToSave.push(toSave)
            console.log(`  将要保存的数据:`, toSave)
          } else {
            console.log(`  ⚠️ 未找到对应的修饰符！`)
          }
        })

        console.log('\n=== 最终要保存的所有修饰符 ===')
        console.log(`总数: ${allModifiersToSave.length}`)
        allModifiersToSave.forEach((mod, index) => {
          const itemName = configItems.find(i => i.posItemId === mod.posItemId)?.posItemName
          console.log(`${index + 1}. 商品: ${itemName}, 选项: ${mod.modifierOptionName}, 价格: ${mod.uberPrice}`)
        })

        if (allModifiersToSave.length > 0) {
          savePromises.push(
            uberMenuSyncService.saveModifierConfig(integrationId, allModifiersToSave, menuGroupId)
          )
        }
      }

      // 并行保存所有配置
      await Promise.all(savePromises)

      const savedCount = modifiedItems.size + modifiedModifiers.size
      message.success(`配置保存成功（共 ${savedCount} 项更改），请点击"菜单同步"按钮来应用更改`)

      // 清空修改状态
      setModifiedItems(new Map())
      setModifiedModifiers(new Map())

      // 重新加载配置
      loadMenuConfig(menuGroupId)
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setConfigSaving(false)
      setModifierSaving(false)
    }
  }

  // 基于配置同步
  const handleSyncWithConfig = async () => {
    if (!integrationId) {
      message.error('缺少集成信息')
      return
    }

    // 检查是否已有菜单
    if (menuGroups.length === 0) {
      message.error('请先创建至少一个菜单')
      return
    }

    // 检查是否选择了菜单
    if (!activeTab) {
      message.warning('请先选择要同步的菜单')
      return
    }

    // 打开菜单配置模态框来确认同步
    setMenuConfigModalVisible(true)
  }

  // 处理菜单配置确认 - 同步所有菜单到 Uber
  const handleConfirmMenuConfig = async () => {
    if (!integrationId) {
      message.error('缺少集成信息')
      return
    }

    const tenantId = getTenantId()
    if (!tenantId) {
      message.error('无法获取租户信息')
      return
    }

    // 如果有未保存的更改，先保存
    if (modifiedItems.size > 0) {
      await handleSaveConfig()
    }

    try {
      setPOSSyncing(true)

      // 同步所有菜单组到 Uber
      // 调用后端的菜单组同步接口
      await uberMenuSyncService.syncMenuGroupsToUber(
        storeId,
        merchantId,
        integrationId
      )

      message.success('✓ 菜单已成功同步到 Uber')
      setMenuConfigModalVisible(false)

      // 重新加载菜单组
      await loadMenuGroups()
    } catch (error: any) {
      message.error(error.message || '同步失败')
    } finally {
      setPOSSyncing(false)
    }
  }

  // 统一调价功能
  const handleApplyPriceAdjustment = () => {
    if (priceAdjustmentPercent === null) {
      message.warning('请输入调价百分比')
      return
    }

    // 调整商品价格（基于原价POS价格）
    const newModified = new Map(modifiedItems)
    configItems.forEach((item) => {
      // 调价始终基于原价，0% 表示恢复为原价
      const adjustedPrice = Math.round(item.posPrice * (1 + priceAdjustmentPercent / 100))
      const existing = newModified.get(item.posItemId) || {}
      newModified.set(item.posItemId, { ...existing, uberPrice: adjustedPrice })
    })
    setModifiedItems(newModified)

    // 调整自定义选项价格
    const newModifierConfigs = new Map(modifierConfigs)
    const newModifiedModifiers = new Map(modifiedModifiers)

    modifierConfigs.forEach((modifiers, itemId) => {
      const newModifiers = modifiers.map((mod) => {
        // 调价始终基于原价，0% 表示恢复为原价
        const adjustedPrice = Math.round(mod.posPrice * (1 + priceAdjustmentPercent / 100))
        // 使用 itemId-modifierOptionId 组合作为 key
        const key = `${itemId}-${mod.modifierOptionId}`
        const modified = newModifiedModifiers.get(key) || {}
        newModifiedModifiers.set(key, {
          ...modified,
          uberPrice: adjustedPrice,
          posItemId: itemId,
          modifierOptionId: mod.modifierOptionId
        })
        return {
          ...mod,
          uberPrice: adjustedPrice
        }
      })
      newModifierConfigs.set(itemId, newModifiers)
    })

    setModifierConfigs(newModifierConfigs)
    setModifiedModifiers(newModifiedModifiers)

    setPriceAdjustmentModalVisible(false)
    setPriceAdjustmentPercent(null)
    message.success(`已应用 ${priceAdjustmentPercent > 0 ? '+' : ''}${priceAdjustmentPercent}% 的调价`)
  }

  const handleOpenItemsDrawer = async (category: any) => {
    setSelectedCategory(category)
    setDrawerVisible(true)
    // 并行加载分类商品和所有POS商品
    await Promise.all([
      loadCategoryItems(category.id),
      posItems.length === 0 ? loadPosItems() : Promise.resolve()
    ])
  }

  const handleAddItems = async () => {
    if (!selectedCategory || selectedItems.length === 0) {
      message.warning('请选择商品')
      return
    }

    try {
      // 添加新的商品（排除已有的）
      const existingItemIds = categoryItems.map(item => item.posItemId)
      const newItemIds = selectedItems.filter(id => !existingItemIds.includes(id))

      for (const itemId of newItemIds) {
        const item = posItems.find(p => p.id === itemId)
        await uberService.addItemToMenuCategory(
          selectedCategory.id,
          itemId,
          item?.name,
          categoryItems.length + newItemIds.indexOf(itemId)
        )
      }

      message.success(`添加了 ${newItemIds.length} 个商品`)
      // 更新分类商品列表、全局分类和当前菜单分类
      await Promise.all([
        loadCategoryItems(selectedCategory.id),
        loadUberCategories(),
        activeTab ? loadMenuCategoriesForCurrentMenu(activeTab) : Promise.resolve()
      ])
      setSelectedItems([])
    } catch (error: any) {
      message.error(error.message || '添加失败')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await uberService.removeItemFromMenuCategory(itemId)
      message.success('移除成功')
      // 更新分类商品列表、全局分类和当前菜单分类
      await Promise.all([
        loadCategoryItems(selectedCategory!.id),
        loadUberCategories(),
        activeTab ? loadMenuCategoriesForCurrentMenu(activeTab) : Promise.resolve()
      ])
    } catch (error: any) {
      message.error(error.message || '移除失败')
    }
  }

  // 打开修饰符配置模态框
  // 直接修改表格中的修饰符价格
  const handleModifierPriceChange = (itemId: string, modifierOptionId: string, price: number | null) => {
    const itemName = configItems.find(i => i.posItemId === itemId)?.posItemName || itemId
    const currentModifiers = modifierConfigs.get(itemId) || []
    const modifier = currentModifiers.find(m => m.modifierOptionId === modifierOptionId)

    console.log(`\n=== handleModifierPriceChange ===`)
    console.log(`商品: ${itemName} (${itemId})`)
    console.log(`修饰符: ${modifier?.modifierOptionName} (${modifierOptionId})`)
    console.log(`输入价格: $${price}`)
    console.log(`保存价格（分）: ${price !== null ? Math.round(price * 100) : null}`)

    const newModifiers = currentModifiers.map(m => {
      if (m.modifierOptionId === modifierOptionId) {
        return {
          ...m,
          uberPrice: price !== null ? Math.round(price * 100) : m.posPrice
        }
      }
      return m
    })

    const newModifierConfigs = new Map(modifierConfigs)
    newModifierConfigs.set(itemId, newModifiers)
    setModifierConfigs(newModifierConfigs)

    // 标记为已修改，以便后续保存
    // 使用 itemId-modifierOptionId 组合作为 key
    const newModified = new Map(modifiedModifiers)
    const key = `${itemId}-${modifierOptionId}`
    const existing = newModified.get(key) || {}
    const dataToSave = {
      ...existing,
      uberPrice: price !== null ? Math.round(price * 100) : null,
      posItemId: itemId,
      modifierOptionId: modifierOptionId
    }
    newModified.set(key, dataToSave)

    console.log(`组合 key: ${key}`)
    console.log(`保存到 modifiedModifiers:`, dataToSave)
    console.log(`modifiedModifiers 当前大小: ${newModified.size}`)

    setModifiedModifiers(newModified)
  }

  // 处理修饰符配置变更
  const handleModifierChange = (posItemId: string, optionId: string, field: 'enabled' | 'uberPrice', value: any) => {
    const newModified = new Map(modifiedModifiers)
    // 使用 posItemId-optionId 组合作为 key，以区分不同商品的相同修饰符选项
    const key = `${posItemId}-${optionId}`
    const existing = newModified.get(key) || {}
    newModified.set(key, { ...existing, [field]: value, posItemId, modifierOptionId: optionId })
    setModifiedModifiers(newModified)
    console.log(`handleModifierChange: posItemId=${posItemId}, optionId=${optionId}, field=${field}, value=${value}, newSize=${newModified.size}`)
  }

  // 获取修饰符的有效值
  const getModifierEffectiveValue = (modifier: ModifierConfigItem, field: 'enabled' | 'uberPrice') => {
    const key = `${modifier.posItemId}-${modifier.modifierOptionId}`
    const modified = modifiedModifiers.get(key)
    if (modified && modified[field] !== undefined) {
      return modified[field]
    }
    return modifier[field]
  }

  // 保存修饰符配置
  const handleSaveModifierConfig = async () => {
    if (!integrationId || !currentModifierItem || modifiedModifiers.size === 0) return

    try {
      setModifierSaving(true)

      const currentModifiers = modifierConfigs.get(currentModifierItem.posItemId) || []
      const modifiersToSave = currentModifiers.map((m) => {
        const modified = modifiedModifiers.get(m.modifierOptionId)
        const result = {
          posItemId: m.posItemId,
          modifierGroupId: m.modifierGroupId,
          modifierOptionId: m.modifierOptionId,
          modifierOptionName: m.modifierOptionName,
          enabled: modified?.enabled !== undefined ? modified.enabled : m.enabled,
          uberPrice: modified?.uberPrice !== undefined ? modified.uberPrice : m.uberPrice
        }
        console.log(`修饰符 ${m.modifierOptionId}:`, {
          modified: !!modified,
          enabled: result.enabled,
          uberPrice: result.uberPrice,
          isModified: modified
        })
        return result
      })

      console.log('准备保存的修饰符配置:', modifiersToSave)
      await uberMenuSyncService.saveModifierConfig(integrationId, modifiersToSave)
      message.success('修饰符配置保存成功，请点击"菜单同步"按钮来应用更改')
      setModifiedModifiers(new Map())

      // 重新加载
      const tenantId = getTenantId()
      if (tenantId) {
        const result = await uberMenuSyncService.getModifierConfig(integrationId, tenantId, currentModifierItem.posItemId)
        const newModifierConfigs = new Map(modifierConfigs)
        newModifierConfigs.set(currentModifierItem.posItemId, result.modifiers)
        setModifierConfigs(newModifierConfigs)
      }
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setModifierSaving(false)
    }
  }

  // 计算统计数据
  const stats = useMemo(() => {
    let enabledCount = 0
    let customPriceCount = 0

    configItems.forEach((item) => {
      const enabled = getEffectiveValue(item, 'enabled')
      const uberPrice = getEffectiveValue(item, 'uberPrice')
      if (enabled) enabledCount++
      if (uberPrice !== undefined && uberPrice !== null) customPriceCount++
    })

    return {
      total: configItems.length,
      enabled: enabledCount,
      customPrice: customPriceCount
    }
  }, [configItems, modifiedItems])

  // 渲染配置管理 Tab
  const renderConfigTab = () => (
    <div>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
              <div style={{ color: '#999' }}>总商品数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.enabled}</div>
              <div style={{ color: '#999' }}>已启用</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{stats.customPrice}</div>
              <div style={{ color: '#999' }}>自定义价格</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>{modifiedItems.size}</div>
              <div style={{ color: '#999' }}>待保存更改</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                const menuGroupId = activeTab
                loadMenuConfig(menuGroupId)
              }}
              loading={configLoading}
            >
              刷新配置
            </Button>
            <Button
              onClick={() => setPriceAdjustmentModalVisible(true)}
            >
              统一调价
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveConfig}
              loading={configSaving || modifierSaving}
              disabled={modifiedItems.size === 0 && modifiedModifiers.size === 0}
            >
              保存配置 {(modifiedItems.size + modifiedModifiers.size) > 0 && `(${modifiedItems.size + modifiedModifiers.size})`}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 统一调价模态框 */}
      <Modal
        title="统一调价工具"
        open={priceAdjustmentModalVisible}
        onCancel={() => {
          setPriceAdjustmentModalVisible(false)
          setPriceAdjustmentPercent(null)
        }}
        width={500}
        footer={[
          <Button key="cancel" onClick={() => {
            setPriceAdjustmentModalVisible(false)
            setPriceAdjustmentPercent(null)
          }}>
            取消
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={handleApplyPriceAdjustment}
          >
            应用调价
          </Button>
        ]}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            输入调价百分比，系统将对所有商品进行统一调价。正数为涨价，负数为降价。
          </p>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>调价百分比 (%)</label>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="例如：10 表示涨价 10%，-5 表示降价 5%"
              value={priceAdjustmentPercent}
              onChange={setPriceAdjustmentPercent}
              step={0.1}
              min={-100}
              max={100}
              precision={1}
            />
          </div>
          {priceAdjustmentPercent !== null && (
            <div style={{
              padding: 12,
              backgroundColor: '#f0f5ff',
              borderRadius: 4,
              marginTop: 16,
              borderLeft: '3px solid #1890ff'
            }}>
              <div style={{ fontSize: 13, color: '#262626', marginBottom: 8 }}>调价示例：</div>
              {configItems.slice(0, 2).map(item => {
                const posPrice = item.posPrice / 100
                const adjustedPrice = posPrice * (1 + priceAdjustmentPercent / 100)
                const modifiers = modifierConfigs.get(item.posItemId) || []
                return (
                  <div key={item.posItemId} style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>{item.posItemName}</strong>: ${posPrice.toFixed(2)} → ${adjustedPrice.toFixed(2)}
                    </div>
                    {modifiers.length > 0 && (
                      <div style={{ marginLeft: 12, color: '#999' }}>
                        {modifiers.slice(0, 2).map(mod => {
                          const modPrice = (mod.uberPrice !== undefined && mod.uberPrice !== null ? mod.uberPrice : mod.posPrice) / 100
                          const modAdjusted = modPrice * (1 + priceAdjustmentPercent / 100)
                          return (
                            <div key={mod.modifierOptionId} style={{ fontSize: 11, marginBottom: 2 }}>
                              └ {mod.modifierOptionName}: ${modPrice.toFixed(2)} → ${modAdjusted.toFixed(2)}
                            </div>
                          )
                        })}
                        {modifiers.length > 2 && (
                          <div style={{ fontSize: 11, marginBottom: 2 }}>
                            └ ... 还有 {modifiers.length - 2} 个选项
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {configItems.length > 2 && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  ... 共 {configItems.length} 个商品
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 商品配置表格 - 每个商品的自定义选项直接显示在商品下一行 */}
      <div style={{ overflowX: 'auto' }}>
        {configItems.map((item, itemIndex) => (
          <div key={item.posItemId} style={{ marginBottom: 16 }}>
            {/* 商品主行 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 100px 150px 100px',
              gap: 16,
              padding: 14,
              border: '1px solid #e8e8e8',
              borderBottom: (modifierConfigs.get(item.posItemId) || []).length > 0 ? 'none' : '1px solid #e8e8e8',
              backgroundColor: itemIndex % 2 === 0 ? '#f0f8ff' : '#e6f7ff',
              alignItems: 'center',
              borderRadius: '4px 4px 0 0'
            }}>
              {/* 启用复选框 */}
              <div style={{ textAlign: 'center' }}>
                <Checkbox
                  checked={getEffectiveValue(item, 'enabled') as boolean}
                  onChange={(e) => handleConfigChange(item.posItemId, 'enabled', e.target.checked)}
                />
              </div>

              {/* 商品名称 - 高亮显示 */}
              <div style={{ paddingLeft: 8, borderLeft: '3px solid #1890ff' }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: 6,
                  fontSize: 15,
                  color: '#1890ff'
                }}>
                  {item.posItemName}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {item.posCategoryName && (
                    <Tag color="blue" style={{ fontSize: 11 }}>{item.posCategoryName}</Tag>
                  )}
                  {(modifierConfigs.get(item.posItemId) || []).length > 0 && (
                    <Tag color="green" style={{ fontSize: 11 }}>
                      {(modifierConfigs.get(item.posItemId) || []).length} 个自定义选项
                    </Tag>
                  )}
                </div>
              </div>

              {/* POS 价格 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>POS 价格</div>
                <div style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>
                  ${(item.posPrice / 100).toFixed(2)}
                </div>
              </div>

              {/* Uber 价格输入 */}
              <div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Uber 价格</div>
                <InputNumber
                  size="small"
                  placeholder="使用 POS 价格"
                  value={(getEffectiveValue(item, 'uberPrice') as number | undefined) ? (getEffectiveValue(item, 'uberPrice') as number) / 100 : undefined}
                  onChange={(val) => handleConfigChange(
                    item.posItemId,
                    'uberPrice',
                    val !== null ? Math.round(val * 100) : null
                  )}
                  min={0}
                  max={375}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="$"
                />
              </div>

              {/* 同步状态 */}
              <div style={{ textAlign: 'center' }}>
                {!item.syncStatus && <Tag>未同步</Tag>}
                {item.syncStatus === 'success' && (
                  <Tooltip title={item.lastSyncedAt ? `最后同步: ${new Date(item.lastSyncedAt).toLocaleString()}` : ''}>
                    <Tag color="success" icon={<CheckCircleOutlined />}>已同步</Tag>
                  </Tooltip>
                )}
                {item.syncStatus === 'error' && (
                  <Tooltip title={item.syncError}>
                    <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* 自定义选项行 */}
            {(() => {
              const modifiers = modifierConfigs.get(item.posItemId) || []
              console.log(`商品 ${item.posItemName} (${item.posItemId}) 的modifier数量:`, modifiers.length)
              if (modifiers.length > 0) {
                console.log(`商品 ${item.posItemName} 的modifiers:`, modifiers)
              }
              return modifiers.length > 0
            })() && (
              <div style={{
                padding: 14,
                border: '1px solid #e8e8e8',
                borderTop: 'none',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'flex-start',
                borderRadius: '0 0 4px 4px'
              }}>
                <div style={{ width: '100%', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>
                    自定义选项 ({(modifierConfigs.get(item.posItemId) || []).length})
                  </span>
                </div>
                {(modifierConfigs.get(item.posItemId) || []).map((mod) => {
                  const currentUberPrice = mod.uberPrice !== undefined && mod.uberPrice !== null ? mod.uberPrice : mod.posPrice
                  return (
                    <div key={mod.modifierOptionId} style={{
                      padding: 8,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      backgroundColor: '#fff',
                      minWidth: 180,
                      flex: '0 0 auto',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {/* 第一行：选项名和选项组名 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 11, color: '#262626', flex: 1, wordBreak: 'break-word' }}>
                          {mod.modifierOptionName}
                        </span>
                        <span style={{ fontSize: 9, color: '#999', marginLeft: 4, flexShrink: 0, textAlign: 'right' }}>
                          {mod.modifierGroupName}
                        </span>
                      </div>

                      {/* 启用状态 */}
                      {!mod.enabled && (
                        <div style={{ marginBottom: 4 }}>
                          <Tag color="red" style={{ fontSize: 8, padding: '0 3px' }}>禁用</Tag>
                        </div>
                      )}

                      {/* POS 价格显示 */}
                      <div style={{ fontSize: 9, color: '#999', marginBottom: 4 }}>
                        POS: ${(mod.posPrice / 100).toFixed(2)}
                      </div>

                      {/* Uber 价格输入 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 10, color: '#666', minWidth: 32, flexShrink: 0 }}>Uber:</span>
                        <InputNumber
                          size="small"
                          value={currentUberPrice / 100}
                          onChange={(val) => handleModifierPriceChange(item.posItemId, mod.modifierOptionId, val)}
                          min={0}
                          max={375}
                          step={0.01}
                          precision={2}
                          style={{ width: 90 }}
                          addonBefore="$"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // 添加系统分类到配置列表
  const handleAddSystemCategory = async (sysCategory: any) => {
    try {
      setcategoryLoading(true)
      const categoryName = sysCategory.name || sysCategory.displayName

      // 创建同名的 Uber 分类
      const createdCategory = await uberService.createMenuCategory(
        integrationId!,
        categoryName,
        selectedSystemCategories.length // 显示顺序为当前列表长度
      )

      // 保存映射关系：系统分类 ID -> Uber 分类 ID
      const newMap = new Map(systemToUberCategoryMap)
      newMap.set(sysCategory.id, createdCategory.id)
      setSystemToUberCategoryMap(newMap)

      // 如果系统分类中有商品，自动将这些商品添加到 Uber 分类中
      if (sysCategory.items && sysCategory.items.length > 0) {
        try {
          const itemsToAdd = sysCategory.items
          for (let i = 0; i < itemsToAdd.length; i++) {
            const item = itemsToAdd[i]
            await uberService.addItemToMenuCategory(
              createdCategory.id,
              item.id,
              item.name,
              i // displayOrder
            )
          }
          message.success(`已添加「${categoryName}」及其 ${itemsToAdd.length} 个商品到配置列表`)
        } catch (error: any) {
          console.error('自动添加商品失败:', error)
          message.warning(`已添加分类，但自动添加商品失败: ${error.message}`)
        }
      } else {
        message.success(`已添加「${categoryName}」到配置列表`)
      }

      // 添加到选中列表
      setSelectedSystemCategories([...selectedSystemCategories, sysCategory])
      await loadUberCategories()
    } catch (error: any) {
      message.error(error.message || '添加分类失败')
    } finally {
      setcategoryLoading(false)
    }
  }

  // 删除分类配置
  const handleRemoveCategory = async (categoryId: string, categoryName: string) => {
    try {
      setcategoryLoading(true)
      await uberService.deleteMenuCategory(categoryId)

      // 从选中列表中删除系统分类（根据系统分类 ID 或 Uber 分类 ID）
      const filteredCategories = selectedSystemCategories.filter(cat => {
        // 检查是否是该系统分类对应的 Uber 分类
        const uberCategoryId = systemToUberCategoryMap.get(cat.id)
        return uberCategoryId !== categoryId
      })
      setSelectedSystemCategories(filteredCategories)

      // 清除映射关系
      const newMap = new Map(systemToUberCategoryMap)
      // 找到对应的系统分类 ID 并删除映射
      for (const [sysCatId, uberCatId] of newMap.entries()) {
        if (uberCatId === categoryId) {
          newMap.delete(sysCatId)
        }
      }
      setSystemToUberCategoryMap(newMap)

      message.success(`已删除「${categoryName}」`)
      await loadUberCategories()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    } finally {
      setcategoryLoading(false)
    }
  }

  // 上移分类
  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    // 直接操作 uberCategories（数据库中的分类）
    const newList = [...uberCategories]
    const [item] = newList.splice(index, 1)
    newList.splice(index - 1, 0, item)

    // 更新显示顺序
    try {
      for (let i = 0; i < newList.length; i++) {
        await uberService.updateMenuCategory(newList[i].id, undefined, i)
      }
      await loadUberCategories()
    } catch (error: any) {
      message.error('更新顺序失败')
    }
  }

  // 下移分类
  const handleMoveDown = async (index: number) => {
    if (index === uberCategories.length - 1) return

    // 直接操作 uberCategories（数据库中的分类）
    const newList = [...uberCategories]
    const [item] = newList.splice(index, 1)
    newList.splice(index + 1, 0, item)

    // 更新显示顺序
    try {
      for (let i = 0; i < newList.length; i++) {
        await uberService.updateMenuCategory(newList[i].id, undefined, i)
      }
      await loadUberCategories()
    } catch (error: any) {
      message.error('更新顺序失败')
    }
  }

  // 添加自定义分类
  const handleAddCustomCategory = async () => {
    if (!customCategoryName.trim()) {
      message.warning('请输入分类名称')
      return
    }

    try {
      setcategoryLoading(true)
      const newCategory = await uberService.createMenuCategory(
        integrationId!,
        customCategoryName,
        selectedSystemCategories.length
      )

      message.success(`已创建自定义分类「${customCategoryName}」`)
      setCustomCategoryName('')

      // 先重新加载全局分类列表,确保新分类已经存在
      await loadUberCategories()

      // 如果有活动的菜单,自动添加新分类到当前菜单
      if (activeTab && newCategory?.id) {
        try {
          setMenuCategoriesLoading(true)
          await uberMenuSyncService.addCategoryToMenuGroup(
            storeId,
            activeTab,
            newCategory.id,
            integrationId!
          )
          // 添加成功后重新加载菜单分类列表
          await loadMenuCategoriesForCurrentMenu(activeTab)
          message.success('新分类已自动添加到当前菜单')
        } catch (error: any) {
          console.warn('自动添加分类到菜单失败:', error)
          // 即使添加失败也要加载菜单分类,确保UI状态正确
          if (activeTab) {
            await loadMenuCategoriesForCurrentMenu(activeTab)
          }
        } finally {
          setMenuCategoriesLoading(false)
        }
      } else if (activeTab) {
        // 没有新分类ID时,仍然要刷新菜单分类列表
        await loadMenuCategoriesForCurrentMenu(activeTab)
      }
    } catch (error: any) {
      message.error(error.message || '创建分类失败')
    } finally {
      setcategoryLoading(false)
    }
  }

  // 清理菜单处理函数
  const handleClearMenu = async () => {
    if (!integrationId) {
      message.error('缺少集成ID')
      return
    }

    Modal.confirm({
      title: '清理菜单',
      content: (
        <div>
          <div>确定要清理菜单中的所有商品、分类和自定义选项吗？</div>
          <div style={{ fontSize: 12, marginTop: 12, color: '#666', lineHeight: '1.6' }}>
            <div style={{ marginBottom: 8 }}>注意：</div>
            <div>• 菜单内容将被完全删除</div>
            <div>• 由于 Uber API 限制，菜单本身无法通过 API 删除</div>
            <div>• 如需完全移除菜单，请联系 Uber</div>
          </div>
        </div>
      ),
      okText: '确认清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setClearingMenu(true)
          message.loading('正在清理菜单...')

          const result = await uberMenuSyncService.clearMenuItems(
            merchantId,
            storeId,
            integrationId,
            'MENU_TYPE_FULFILLMENT_DELIVERY'
          )

          await loadMenuConfig()

          if (result.success) {
            message.success('✓ 菜单已清理')
          } else {
            message.warning(result.message || '菜单清理完成但可能有错误')
          }
        } catch (error: any) {
          message.error(error.message || '清理菜单失败，请重试')
          console.error('清理菜单错误:', error)
        } finally {
          setClearingMenu(false)
        }
      }
    })
  }

  // 渲染分类配置 Tab
  // 菜单特定的分类管理（在菜单 Tab 中显示）
  const renderMenuCategoriesManagement = (menuGroupId: string) => {
    return (
      <div>
        {/* 分类管理提示 */}
        <Alert
          message={t('pages.menuSync.categoryManagement')}
          description={t('pages.menuSync.categoryManagementTip')}
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        {/* 已添加的分类 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{t('pages.menuSync.categoriesOfMenu')}</span>
              <Tag color="blue">{menuCategories.length}</Tag>
            </div>
          }
          style={{ marginBottom: 24 }}
        >
          {menuCategories.length === 0 ? (
            <Empty description={t('pages.menuSync.noCategoriesAdded')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {menuCategories.map((cat: any, index: number) => (
                <div
                  key={cat.id}
                  style={{
                    padding: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 4,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                      fontWeight: 600,
                      color: '#666'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {cat.name}
                        {/* 判断是否是系统分类 */}
                        {systemCategories.some((sys: any) =>
                          sys.name === cat.name || sys.displayName === cat.name
                        ) && (
                          <Tag color="blue">系统分类</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        已配置 <strong>{cat.itemCount || 0}</strong> 个商品
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tooltip title="向上移动">
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={() => {
                          const newOrder = menuCategories.map(c => c.id)
                          const current = newOrder[index]
                          newOrder[index] = newOrder[index - 1]
                          newOrder[index - 1] = current
                          handleReorderMenuCategories(newOrder)
                        }}
                        disabled={index === 0}
                        loading={menuCategoriesLoading}
                      />
                    </Tooltip>

                    <Tooltip title="向下移动">
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => {
                          const newOrder = menuCategories.map(c => c.id)
                          const current = newOrder[index]
                          newOrder[index] = newOrder[index + 1]
                          newOrder[index + 1] = current
                          handleReorderMenuCategories(newOrder)
                        }}
                        disabled={index === menuCategories.length - 1}
                        loading={menuCategoriesLoading}
                      />
                    </Tooltip>

                    {/* 配置商品按钮 */}
                    <Button
                      size="small"
                      icon={<AppstoreOutlined />}
                      onClick={() => handleOpenItemsDrawer(cat)}
                      type="primary"
                      ghost
                    >
                      配置商品
                    </Button>

                    <Popconfirm
                      title="删除分类"
                      description={
                        systemCategories.some((sys: any) =>
                          sys.name === cat.name || sys.displayName === cat.name
                        )
                          ? `确定要从菜单中移除「${cat.name}」吗？系统分类将保留，可以再次添加。`
                          : `确定要彻底删除「${cat.name}」吗？删除后无法恢复。`
                      }
                      onConfirm={() =>
                        handleRemoveCategoryFromMenu(
                          cat.id,
                          cat.name,
                          systemCategories.some((sys: any) =>
                            sys.name === cat.name || sys.displayName === cat.name
                          )
                        )
                      }
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={menuCategoriesLoading}
                      />
                    </Popconfirm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 从系统分类添加 */}
        {systemCategories.length > 0 && (
          <Card
            title="从 POS 系统分类添加"
            style={{ marginBottom: 24 }}
          >
            <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>
              点击下方分类可将其添加到当前菜单
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {systemCategories
                .filter((sysCategory: any) => {
                  // 过滤掉已经添加到当前菜单的分类
                  return !menuCategories.some((menuCat: any) =>
                    menuCat.name === sysCategory.name || menuCat.name === sysCategory.displayName
                  )
                })
                .map((sysCategory: any) => {
                  const categoryName = sysCategory.name || sysCategory.displayName
                  const totalItemCount = sysCategory.itemCount || 0

                  return (
                    <Button
                      key={sysCategory.id}
                      onClick={async () => {
                        try {
                          setMenuCategoriesLoading(true)

                          // 按 POS 分类 ID 查找是否已关联
                          let targetCategory = uberCategories.find(
                            (cat: any) => cat.posSystemCategoryId === sysCategory.id
                          )

                          if (!targetCategory) {
                            // POS 分类还未关联,创建或更新 Uber 分类
                            targetCategory = await uberService.createMenuCategory(
                              integrationId,
                              categoryName,
                              uberCategories.length,
                              sysCategory.id || undefined  // 传递 POS 系统分类 ID
                            )
                          }

                          // 将分类添加到当前菜单(如果还没添加)
                          const alreadyInMenu = menuCategories.some((mc: any) => mc.id === targetCategory.id)
                          if (!alreadyInMenu) {
                            await handleAddCategoryToMenu(targetCategory.id)
                          }

                          // 将 POS 分类下的所有商品添加到 Uber 分类中
                          const categoryItems = sysCategory.items || []
                          if (categoryItems.length > 0) {
                            // 批量添加商品,忽略已存在的商品
                            const addPromises = categoryItems.map((item: any, index: number) =>
                              uberService.addItemToMenuCategory(
                                targetCategory.id,
                                item.id,
                                item.name,
                                index
                              ).catch((err: any) => {
                                // 忽略"商品已存在"的错误
                                if (!err.message?.includes('已在此分类中')) {
                                  throw err
                                }
                              })
                            )
                            await Promise.all(addPromises)
                            message.success(`已添加分类 "${categoryName}" 及其 ${categoryItems.length} 个商品到当前菜单`)
                          } else {
                            message.success(`已添加分类 "${categoryName}" 到当前菜单`)
                          }

                          // 重新加载 Uber 分类列表
                          await loadUberCategories()
                        } catch (error: any) {
                          message.error(error.message || '添加分类失败')
                        } finally {
                          setMenuCategoriesLoading(false)
                        }
                      }}
                      loading={menuCategoriesLoading}
                      style={{
                        padding: '8px 16px',
                        height: 'auto',
                        minWidth: 120
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 500 }}>+ {categoryName}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {totalItemCount} 个商品
                        </div>
                      </div>
                    </Button>
                  )
                })}
            </div>
          </Card>
        )}

        {/* 添加分类 */}
        {availableCategoriesForMenu.length > 0 && (
          <Card
            title="从全局分类添加"
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {availableCategoriesForMenu.map((cat: any) => (
                <Button
                  key={cat.id}
                  onClick={() => handleAddCategoryToMenu(cat.id)}
                  loading={menuCategoriesLoading}
                  style={{
                    padding: '8px 16px',
                    height: 'auto',
                    minWidth: 120
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500 }}>+ {cat.name}</div>
                    {cat.itemCount > 0 && (
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {cat.itemCount} 个商品
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* 创建新分类 */}
        <Card
          title="创建新分类"
          style={{ marginBottom: 24 }}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入分类名称，如「早餐」、「限时优惠」"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              onPressEnter={handleAddCustomCategory}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomCategory}
              loading={categoryLoading}
              style={{ width: 140 }}
            >
              创建分类
            </Button>
          </Space.Compact>
        </Card>

        {/* 分类商品管理抽屉 */}
        <Drawer
          title={selectedCategory ? `为「${selectedCategory.name}」配置商品` : '配置分类商品'}
          placement="right"
          width={600}
          onClose={() => {
            setDrawerVisible(false)
            setSelectedCategory(null)
          }}
          open={drawerVisible}
        >
          {selectedCategory && (
            <div>
              {/* 已添加的商品列表 */}
              <div style={{ marginBottom: 24 }}>
                <h4>已配置的商品 ({categoryItems.length})</h4>
                {categoryItems.length === 0 ? (
                  <Empty description="该分类还没有配置任何商品。从下方添加。" style={{ marginTop: 16 }} />
                ) : (
                  <List
                    size="small"
                    dataSource={categoryItems}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            移除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={getItemName(item)}
                          description={`顺序: ${item.displayOrder}`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>

              {/* 添加商品 */}
              <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <h4>添加商品</h4>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                  从下方选择要添加到该分类的商品。选中后点击「确认添加」。
                </p>
                <Spin spinning={itemsLoading}>
                  <Select
                    mode="multiple"
                    placeholder="搜索并选择商品..."
                    style={{ width: '100%', marginBottom: 16 }}
                    value={selectedItems}
                    onChange={setSelectedItems}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={Array.isArray(posItems)
                      ? posItems
                          .filter(item => !categoryItems.find(ci => ci.posItemId === item.id))
                          .map(item => ({
                            label: item.name,
                            value: item.id
                          }))
                      : []}
                  />
                </Spin>
                <Button
                  type="primary"
                  block
                  onClick={handleAddItems}
                  disabled={selectedItems.length === 0}
                >
                  确认添加 ({selectedItems.length} 个)
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    )
  }

  const renderCategoriesTab = () => {
    // 直接从数据库读取的 Uber 分类，进行分类：系统分类 vs 自定义分类
    const allConfiguredCategories = uberCategories.map((uberCat: any) => {
      // 判断这个 Uber 分类是否来自系统分类
      const matchedSystemCategory = systemCategories.find(
        (sys: any) => sys.name === uberCat.name || sys.displayName === uberCat.name
      )

      return {
        ...uberCat,
        type: matchedSystemCategory ? 'system' : 'custom',
        systemCategory: matchedSystemCategory // 如果是系统分类，保存原始的系统分类对象
      }
    })

    // 同步更新前端状态：确保 selectedSystemCategories 和 systemToUberCategoryMap 与数据库一致
    // 这样用户刷新页面时，前端状态能自动恢复
    const loadedSystemCategories = allConfiguredCategories
      .filter((cat: any) => cat.type === 'system')
      .map((cat: any) => cat.systemCategory)

    if (JSON.stringify(loadedSystemCategories) !== JSON.stringify(selectedSystemCategories)) {
      setSelectedSystemCategories(loadedSystemCategories)
    }

    // 同步映射关系
    const newMap = new Map<string, string>()
    allConfiguredCategories.forEach((cat: any) => {
      if (cat.systemCategory) {
        newMap.set(cat.systemCategory.id, cat.id)
      }
    })
    if (newMap.size !== systemToUberCategoryMap.size) {
      setSystemToUberCategoryMap(newMap)
    }

    return (
      <div>
        {/* 系统分类选择区 */}
        <Card
          title="1. 选择系统分类"
          style={{ marginBottom: 24 }}
        >
          {systemCategories.length === 0 ? (
            <Empty description="系统中没有分类。请先在 POS 系统中创建分类。" />
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: 16, fontSize: 12 }}>
                点击下方的分类卡片可将其添加到下方的配置列表中进行排序和商品配置。
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {systemCategories.map((sysCategory: any) => {
                  const categoryName = sysCategory.name || sysCategory.displayName
                  const isSelected = selectedSystemCategories.some(cat => cat.id === sysCategory.id)

                  // 获取该系统分类对应的 Uber 分类
                  const correspondingUberCategory = allConfiguredCategories.find(
                    cat => cat.type === 'system' && cat.systemCategory?.id === sysCategory.id
                  )

                  // 显示已配置的商品数量（从 Uber 分类的 itemCount）
                  const configuredItemCount = correspondingUberCategory?.itemCount || 0
                  // 显示 POS 系统中该分类的总商品数
                  const totalItemCount = sysCategory.itemCount || 0

                  return (
                    <Button
                      key={sysCategory.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSystemCategories(
                            selectedSystemCategories.filter(cat => cat.id !== sysCategory.id)
                          )
                        } else {
                          handleAddSystemCategory(sysCategory)
                        }
                      }}
                      type={isSelected ? 'primary' : 'default'}
                      loading={categoryLoading}
                      style={{
                        padding: '8px 16px',
                        height: 'auto',
                        minWidth: 120
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 500 }}>{categoryName}</div>
                        <div style={{ fontSize: 12, color: 'inherit', marginTop: 4 }}>
                          {isSelected ? (
                            <>
                              已配置 <strong>{configuredItemCount}</strong> 个商品
                              {configuredItemCount < totalItemCount && (
                                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>
                                  (共 {totalItemCount} 个)
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {totalItemCount} 个商品
                            </>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* 配置列表和自定义分类 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>2. 配置菜单分类</span>
              <Tag color="blue">{allConfiguredCategories.length}</Tag>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          {allConfiguredCategories.length === 0 ? (
            <Empty description="还没有配置任何菜单分类。请从上方选择系统分类或创建自定义分类。" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allConfiguredCategories.map((uberCategory: any, index: number) => {
                const categoryName = uberCategory.name
                const isSystemCategory = uberCategory.type === 'system'
                const itemCount = uberCategory.itemCount || 0

                // 安全检查：确保 Uber 分类有有效的 ID
                if (!uberCategory || !uberCategory.id) {
                  console.warn('Warning: uberCategory missing', categoryName)
                  return null
                }

                return (
                  <div
                    key={`uber-${uberCategory.id}`}
                    style={{
                      padding: 16,
                      border: '1px solid #e8e8e8',
                      borderRadius: 4,
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* 左侧：序号和分类信息 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 4,
                        fontWeight: 600,
                        color: '#666'
                      }}>
                        {index + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                          {categoryName}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {isSystemCategory ? (
                            <>
                              <Tag color="blue" style={{ marginRight: 8 }}>系统分类</Tag>
                            </>
                          ) : (
                            <Tag color="orange">自定义分类</Tag>
                          )}
                          <span style={{ marginLeft: 8 }}>
                            已配置 <strong>{itemCount}</strong> 个商品
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* 排序按钮 */}
                      <Tooltip title="向上移动">
                        <Button
                          size="small"
                          icon={<ArrowUpOutlined />}
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        />
                      </Tooltip>

                      <Tooltip title="向下移动">
                        <Button
                          size="small"
                          icon={<ArrowDownOutlined />}
                          onClick={() => handleMoveDown(index)}
                          disabled={index === allConfiguredCategories.length - 1}
                        />
                      </Tooltip>

                      {/* 配置商品按钮 */}
                      <Button
                        size="small"
                        icon={<AppstoreOutlined />}
                        onClick={() => handleOpenItemsDrawer(uberCategory)}
                        type="primary"
                        ghost
                      >
                        配置商品
                      </Button>

                      {/* 删除按钮 */}
                      <Popconfirm
                        title="确定删除？"
                        description={isSystemCategory ? '删除此分类配置后，已配置的商品映射将被清除。系统分类本身不会被删除。' : '删除后无法恢复。'}
                        onConfirm={() => handleRemoveCategory(uberCategory.id, categoryName)}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 创建自定义分类区 */}
        <Card
          title="3. 创建自定义分类（可选）"
          style={{ marginBottom: 16 }}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入自定义分类名称，如「限时优惠」、「新品推荐」"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              onPressEnter={handleAddCustomCategory}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomCategory}
              loading={categoryLoading}
              style={{ width: 140 }}
            >
              创建分类
            </Button>
          </Space.Compact>
        </Card>

        {/* 分类商品管理抽屉 */}
        <Drawer
          title={selectedCategory ? `为「${selectedCategory.name || selectedCategory.displayName}」配置商品` : '配置分类商品'}
          placement="right"
          width={600}
          onClose={() => {
            setDrawerVisible(false)
            setSelectedCategory(null)
          }}
          open={drawerVisible}
        >
          {selectedCategory && (
            <div>
              {/* 已添加的商品列表 */}
              <div style={{ marginBottom: 24 }}>
                <h4>已配置的商品 ({categoryItems.length})</h4>
                {categoryItems.length === 0 ? (
                  <Empty description="该分类还没有配置任何商品。从下方添加。" style={{ marginTop: 16 }} />
                ) : (
                  <List
                    size="small"
                    dataSource={categoryItems}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            移除
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={getItemName(item)}
                          description={`顺序: ${item.displayOrder}`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>

              {/* 添加商品 */}
              <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <h4>添加商品</h4>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                  从下方选择要添加到该分类的商品。选中后点击「确认添加」。
                </p>
                <Spin spinning={itemsLoading}>
                  <Select
                    mode="multiple"
                    placeholder="搜索并选择商品..."
                    style={{ width: '100%', marginBottom: 16 }}
                    value={selectedItems}
                    onChange={setSelectedItems}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={Array.isArray(posItems)
                      ? posItems
                          .filter(item => !categoryItems.find(ci => ci.posItemId === item.id))
                          .map(item => ({
                            label: item.name,
                            value: item.id
                          }))
                      : []}
                  />
                </Spin>
                <Button
                  type="primary"
                  block
                  onClick={handleAddItems}
                  disabled={selectedItems.length === 0}
                >
                  确认添加 ({selectedItems.length} 个)
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    )
  }

  // 渲染营业时间编辑器
  const renderServiceAvailabilityEditor = (menuGroup: MenuGroup) => {
    const currentAvailability = menuGroup.serviceAvailability || {}
    const availabilityMap = new Map(Object.entries(currentAvailability))

    return (
      <Card
        title="营业时间设置"
        size="small"
        style={{ marginBottom: 24 }}
        extra={
          <Space size="small">
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setEditingMenuGroup(menuGroup)
                setMenuName(menuGroup.name || 'Menu')
                setServiceAvailability(availabilityMap as any)
                setMenuGroupModalVisible(true)
              }}
            >
              编辑菜单信息
            </Button>
            <Popconfirm
              title="删除菜单配置"
              description={
                <div>
                  <div>确定要删除「{menuGroup.name}」菜单配置吗？</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    注意：此操作只删除数据库中的菜单配置，不会自动同步到Uber。
                    <br />
                    如需同步删除，请在删除后手动点击"同步到Uber"按钮。
                  </div>
                </div>
              }
              onConfirm={() => handleDeleteMenuGroup(menuGroup.id)}
              okText="确定删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                删除菜单
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
            const times = currentAvailability[day] || []
            const dayNames: Record<string, string> = {
              monday: '周一',
              tuesday: '周二',
              wednesday: '周三',
              thursday: '周四',
              friday: '周五',
              saturday: '周六',
              sunday: '周日'
            }
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#262626', minWidth: 30 }}>
                  {dayNames[day]}
                </span>
                <span style={{ color: '#666', minWidth: 'fit-content' }}>
                  {Array.isArray(times) && times.length > 0 ? (
                    times.map((time: any) => `${time.startTime}-${time.endTime}`).join(',')
                  ) : (
                    <span style={{ color: '#999' }}>休</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  return (
    <div className="menu-sync">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UploadOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <span>菜单同步</span>
              <Badge
                count={modifiedItems.size}
                style={{ backgroundColor: '#faad14' }}
                title="待保存的更改"
              />
            </div>
            {integrationId && (
              <Space>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={handleSyncWithConfig}
                  loading={posSyncing}
                  disabled={stats.enabled === 0}
                  style={{
                    backgroundColor: stats.enabled === 0 ? '#d9d9d9' : '#000000',
                    borderColor: stats.enabled === 0 ? '#d9d9d9' : '#000000',
                    color: stats.enabled === 0 ? '#666666' : '#ffffff'
                  }}
                >
                  同步到 Uber
                </Button>
                <Popconfirm
                  title="清理菜单"
                  description={
                    <div>
                      <div>确定要清理菜单中的所有商品、分类和自定义选项吗？</div>
                      <div style={{ fontSize: 12, marginTop: 12, color: '#666', lineHeight: '1.6' }}>
                        <div style={{ marginBottom: 8 }}>注意：</div>
                        <div>• 菜单内容将被完全删除</div>
                        <div>• 由于 Uber API 限制，菜单本身无法通过 API 删除</div>
                        <div>• 如需完全移除菜单，请联系 Uber</div>
                      </div>
                    </div>
                  }
                  okText="确认清理"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleClearMenu}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={clearingMenu}
                  >
                    清理菜单
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </div>
        }
      >
        {integrationId ? (
          <>
            {/* 顶部同步按钮 - 已移到标题栏 */}

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabBarExtraContent={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingMenuGroup(null)
                    setMenuName('Menu')
                    setServiceAvailability(
                      new Map([
                        ['monday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['tuesday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['wednesday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['thursday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['friday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['saturday', [{ startTime: '00:00', endTime: '23:59' }]],
                        ['sunday', [{ startTime: '00:00', endTime: '23:59' }]]
                      ])
                    )
                    setMenuGroupModalVisible(true)
                  }}
                  style={{ marginRight: 16 }}
                >
                  新建菜单
                </Button>
              }
              items={menuGroups.length > 0 ? menuGroups.map(group => ({
                  key: group.id,
                  label: (
                    <span>
                      <SettingOutlined />
                      {group.name}
                    </span>
                  ),
                  children: (
                    <div>
                      {/* 营业时间设置 */}
                      {renderServiceAvailabilityEditor(group)}

                      {/* 菜单内容 Tabs */}
                      <Tabs
                        style={{ marginTop: 24 }}
                        items={[
                          {
                            key: 'categories',
                            label: (
                              <span>
                                <AppstoreOutlined />
                                分类管理
                              </span>
                            ),
                            children: renderMenuCategoriesManagement(group.id)
                          },
                          {
                            key: 'items',
                            label: (
                              <span>
                                <SettingOutlined />
                                商品配置
                              </span>
                            ),
                            children: renderConfigTab()
                          }
                        ]}
                      />
                    </div>
                  )
                })) : [{
                  key: 'empty',
                  label: '暂无菜单',
                  children: (
                    <Empty
                      description="还没有创建菜单，点击右上角的「新建菜单」按钮创建一个"
                      style={{ padding: 40 }}
                    />
                  )
                }]}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>请先完成 Uber 店铺绑定后再配置菜单同步</p>
          </div>
        )}
      </Card>

      {/* 菜单创建/编辑模态框 */}
      <Modal
        title={
          <span>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            {editingMenuGroup ? '编辑菜单' : '新建菜单'}
          </span>
        }
        open={menuGroupModalVisible}
        onCancel={() => {
          setMenuGroupModalVisible(false)
          setEditingMenuGroup(null)
          setMenuName('Menu')
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setMenuGroupModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={menuGroupLoading}
            onClick={() => {
              if (!menuName.trim()) {
                message.error('菜单名称不能为空')
                return
              }

              const availabilityObj = Object.fromEntries(serviceAvailability)

              if (editingMenuGroup) {
                handleUpdateMenuGroup(editingMenuGroup.id, menuName, availabilityObj)
              } else {
                handleCreateMenuGroup(menuName, availabilityObj)
              }
            }}
          >
            {editingMenuGroup ? '保存更新' : '创建菜单'}
          </Button>
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 菜单名称 */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>菜单名称</label>
            <Input
              placeholder="例如: 早餐菜单、午餐菜单、晚餐菜单"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
            />
          </div>

          {/* 营业时间 - 紧凑横向展示 */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>营业时间（周一至周日）</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const times = serviceAvailability.get(day) || []
                const dayNames: Record<string, string> = {
                  monday: '周一',
                  tuesday: '周二',
                  wednesday: '周三',
                  thursday: '周四',
                  friday: '周五',
                  saturday: '周六',
                  sunday: '周日'
                }
                return (
                  <div key={day} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#262626', minWidth: 32, marginTop: 6 }}>
                      {dayNames[day]}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                      {times.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#999', marginTop: 6 }}>休息</span>
                      ) : (
                        times.map((time, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 2, alignItems: 'center', fontSize: 12 }}>
                            <TimePicker
                              value={time.startTime ? dayjs(time.startTime, 'HH:mm') : null}
                              onChange={(timeValue) => {
                                const newTimes = [...times]
                                newTimes[idx].startTime = timeValue ? timeValue.format('HH:mm') : '00:00'
                                const newAvailability = new Map(serviceAvailability)
                                newAvailability.set(day, newTimes)
                                setServiceAvailability(newAvailability)
                              }}
                              format="HH:mm"
                              size="small"
                              style={{ width: 80 }}
                              placeholder="开始"
                            />
                            <span style={{ fontSize: 11, color: '#999' }}>-</span>
                            <TimePicker
                              value={time.endTime ? dayjs(time.endTime, 'HH:mm') : null}
                              onChange={(timeValue) => {
                                const newTimes = [...times]
                                newTimes[idx].endTime = timeValue ? timeValue.format('HH:mm') : '00:00'
                                const newAvailability = new Map(serviceAvailability)
                                newAvailability.set(day, newTimes)
                                setServiceAvailability(newAvailability)
                              }}
                              format="HH:mm"
                              size="small"
                              style={{ width: 80 }}
                              placeholder="结束"
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const newTimes = times.filter((_, i) => i !== idx)
                                const newAvailability = new Map(serviceAvailability)
                                newAvailability.set(day, newTimes)
                                setServiceAvailability(newAvailability)
                              }}
                              style={{ padding: '0 2px', minWidth: 'auto', height: 22 }}
                            />
                            {idx < times.length - 1 && <span style={{ color: '#ddd' }}>|</span>}
                          </div>
                        ))
                      )}
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const newTimes = [...times, { startTime: '09:00', endTime: '17:00' }]
                          const newAvailability = new Map(serviceAvailability)
                          newAvailability.set(day, newTimes)
                          setServiceAvailability(newAvailability)
                        }}
                        style={{ padding: '0 4px', minWidth: 'auto', color: '#1890ff', height: 22 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </Modal>

      {/* 修饰符配置模态框 */}
      <Modal
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            修饰符配置 - {currentModifierItem?.posItemName}
            <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>
              (已修改: {modifiedModifiers.size})
            </span>
          </span>
        }
        open={modifierModalVisible}
        onCancel={() => {
          setModifierModalVisible(false)
          setCurrentModifierItem(null)
        }}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setModifierModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="sync-price"
            onClick={() => {
              if (!currentModifierItem) return

              const currentModifiers = modifierConfigs.get(currentModifierItem.posItemId) || []
              const newModifiers = currentModifiers.map(m => ({
                ...m,
                uberPrice: m.posPrice
              }))

              // 更新 modifierConfigs Map
              const newModifierConfigs = new Map(modifierConfigs)
              newModifierConfigs.set(currentModifierItem.posItemId, newModifiers)
              setModifierConfigs(newModifierConfigs)

              // 更新 modifiedModifiers
              const newModified = new Map(modifiedModifiers)
              newModifiers.forEach(m => {
                // 使用 posItemId-modifierOptionId 组合作为 key
                const key = `${currentModifierItem.posItemId}-${m.modifierOptionId}`
                const existing = newModified.get(key) || {}
                newModified.set(key, {
                  ...existing,
                  uberPrice: m.posPrice,
                  posItemId: currentModifierItem.posItemId,
                  modifierOptionId: m.modifierOptionId
                })
              })
              setModifiedModifiers(newModified)
              message.success('已将所有 POS 价格应用到 Uber 价格')
            }}
          >
            应用 POS 价格
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveModifierConfig}
            loading={modifierSaving}
            disabled={modifiedModifiers.size === 0}
          >
            保存配置 {modifiedModifiers.size > 0 && `(${modifiedModifiers.size})`}
          </Button>
        ]}
      >
        {!currentModifierItem ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            未选择商品
          </div>
        ) : (modifierConfigs.get(currentModifierItem.posItemId) || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            该商品没有修饰符选项
          </div>
        ) : (
          <Table
            dataSource={modifierConfigs.get(currentModifierItem.posItemId) || []}
            rowKey="modifierOptionId"
            size="small"
            pagination={false}
            columns={[
              {
                title: '启用',
                dataIndex: 'enabled',
                width: 60,
                render: (_: any, record: ModifierConfigItem) => (
                  <Checkbox
                    checked={getModifierEffectiveValue(record, 'enabled') as boolean}
                    onChange={(e) => handleModifierChange(record.posItemId, record.modifierOptionId, 'enabled', e.target.checked)}
                  />
                )
              },
              {
                title: '自定义选项',
                dataIndex: 'modifierGroupName',
                width: 120,
                render: (name: string) => <Tag color="blue">{name}</Tag>
              },
              {
                title: '选项名称',
                dataIndex: 'modifierOptionName',
                width: 150
              },
              {
                title: 'POS 价格',
                dataIndex: 'posPrice',
                width: 100,
                render: (price: number) => `$${(price / 100).toFixed(2)}`
              },
              {
                title: 'Uber 价格',
                dataIndex: 'uberPrice',
                width: 150,
                render: (_: any, record: ModifierConfigItem) => {
                  const currentValue = getModifierEffectiveValue(record, 'uberPrice') as number | undefined

                  return (
                    <InputNumber
                      size="small"
                      placeholder="使用 POS"
                      value={currentValue !== undefined ? currentValue / 100 : undefined}
                      onChange={(val) => handleModifierChange(
                        record.posItemId,
                        record.modifierOptionId,
                        'uberPrice',
                        val !== null ? Math.round(val * 100) : null
                      )}
                      min={0}
                      max={375}
                      step={0.01}
                      precision={2}
                      style={{ width: 90 }}
                      addonBefore="$"
                    />
                  )
                }
              },
              {
                title: '实际价格',
                key: 'effectivePrice',
                width: 100,
                render: (_: any, record: ModifierConfigItem) => {
                  const uberPrice = getModifierEffectiveValue(record, 'uberPrice') as number | undefined
                  const price = uberPrice ?? record.effectivePrice
                  return <strong>${(price / 100).toFixed(2)}</strong>
                }
              }
            ]}
          />
        )}
      </Modal>

      {/* 菜单同步确认模态框 */}
      <Modal
        title="确认同步所有菜单到 Uber"
        open={menuConfigModalVisible}
        onCancel={() => setMenuConfigModalVisible(false)}
        onOk={handleConfirmMenuConfig}
        width={500}
        okText="确认同步"
        cancelText="取消"
        confirmLoading={posSyncing}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            将同步所有已配置的菜单到 Uber
          </p>

          <div style={{
            backgroundColor: '#f5f7fa',
            padding: 16,
            borderRadius: 4,
            marginBottom: 16
          }}>
            <div style={{ marginBottom: 12 }}>
              <strong>待同步菜单数：</strong>
              <span style={{ fontSize: 18, color: '#1890ff', marginLeft: 8 }}>
                {menuGroups.length}
              </span>
            </div>

            {menuGroups.length > 0 && (
              <div style={{ textAlign: 'left', borderTop: '1px solid #e8e8e8', paddingTop: 12 }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>菜单列表：</strong>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {menuGroups.map((menu) => (
                    <div
                      key={menu.id}
                      style={{
                        padding: 8,
                        marginBottom: 4,
                        backgroundColor: '#fff',
                        borderRadius: 3,
                        fontSize: 12
                      }}
                    >
                      📋 {menu.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#f0f5ff',
            borderRadius: 4,
            border: '1px solid #adc6ff'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              📌 将同时同步配送菜单和自取菜单到 Uber Eats
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              如需禁用自取功能，请在 Uber Eats 后台进行设置
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
            同步过程中请勿关闭页面，这可能需要几秒钟
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default MenuSync
