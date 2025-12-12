/**
 * 商品管理服务使用示例
 * 
 * 这个文件包含了商品管理服务的各种使用示例，
 * 展示如何在实际项目中使用这些API。
 */

import {
  itemManagementService,
  type CreateItemPayload,
  type UpdateItemPayload,
  type CreateCategoryPayload,
  type CreateAddonPayload,
  type CreateItemAddonPayload
} from '../services/item-management'

// ==================== 商品管理示例 ====================

export async function itemManagementExamples() {
  console.log('🚀 开始商品管理服务示例...')

  try {
    // 1. 获取商品列表（带分页和筛选）
    console.log('\n📦 获取商品列表示例:')
    const itemsPage1 = await itemManagementService.getItems({
      page: 1,
      limit: 5,
      isActive: true,
      search: '测试'
    })
    console.log('第一页商品:', itemsPage1)

    // 2. 搜索商品
    console.log('\n🔍 搜索商品示例:')
    const searchResults = await itemManagementService.searchItems('咖啡')
    console.log('搜索结果:', searchResults)

    // 3. 创建新商品
    console.log('\n➕ 创建商品示例:')
    const newItem: CreateItemPayload = {
      name: '示例商品 - 美式咖啡',
      description: '这是一个通过API创建的示例商品',
      categoryId: '',
      basePrice: 25.50,
      isActive: true
    }
    const createdItem = await itemManagementService.createItem(newItem)
    console.log('创建的商品:', createdItem)

    // 4. 获取单个商品详情
    console.log('\n📖 获取商品详情示例:')
    const itemDetails = await itemManagementService.getItem(createdItem.id)
    console.log('商品详情:', itemDetails)

    // 5. 更新商品
    console.log('\n✏️ 更新商品示例:')
    const updateData: UpdateItemPayload = {
      name: '更新后的美式咖啡',
      basePrice: 28.00,
      description: '更新后的商品描述'
    }
    const updatedItem = await itemManagementService.updateItem(createdItem.id, updateData)
    console.log('更新后的商品:', updatedItem)

    // 6. 批量操作示例
    console.log('\n🔄 批量操作示例:')
    const batchResult = await itemManagementService.batchOperations({
      operation: 'CREATE',
      items: [
        {
          name: '批量商品1',
          categoryId: '',
          basePrice: 10.00,
          isActive: true
        },
        {
          name: '批量商品2',
          categoryId: '',
          basePrice: 15.00,
          isActive: true
        }
      ]
    })
    console.log('批量操作结果:', batchResult)

    return { success: true, createdItemId: createdItem.id }
  } catch (error) {
    console.error('❌ 商品管理示例失败:', error)
    return { success: false, error }
  }
}

// ==================== 分类管理示例 ====================

export async function categoryManagementExamples() {
  console.log('\n🌳 开始分类管理示例...')

  try {
    // 1. 获取所有分类
    console.log('\n📁 获取分类列表:')
    const categories = await itemManagementService.getCategories()
    console.log('分类列表:', categories)

    // 2. 获取分类树
    console.log('\n🌳 获取分类树:')
    const categoryTree = await itemManagementService.getCategoryTree()
    console.log('分类树:', categoryTree)

    // 3. 创建分类
    console.log('\n➕ 创建分类示例:')
    const newCategory: CreateCategoryPayload = {
      name: '示例分类 - 饮品'
    }
    const createdCategory = await itemManagementService.createCategory(newCategory)
    console.log('创建的分类:', createdCategory)

    // 4. 创建子分类
    console.log('\n➕ 创建子分类示例:')
    const subCategory: CreateCategoryPayload = {
      name: '咖啡',
      parentId: createdCategory.id
    }
    const createdSubCategory = await itemManagementService.createCategory(subCategory)
    console.log('创建的子分类:', createdSubCategory)

    return { success: true, categoryId: createdCategory.id }
  } catch (error) {
    console.error('❌ 分类管理示例失败:', error)
    return { success: false, error }
  }
}

// ==================== Add-on管理示例 ====================

export async function addonManagementExamples() {
  console.log('\n🧩 开始Add-on管理示例...')

  try {
    // 1. 获取所有Add-ons
    console.log('\n🧩 获取Add-on列表:')
    const addons = await itemManagementService.getAddons()
    console.log('Add-on列表:', addons)

    // 2. 创建Add-on
    console.log('\n➕ 创建Add-on示例:')
    const newAddon: CreateAddonPayload = {
      name: '额外糖浆',
      description: '为饮品添加额外糖浆',
      price: 3.00,
      cost: 1.50,
      trackInventory: false,
      isActive: true
    }
    const createdAddon = await itemManagementService.createAddon(newAddon)
    console.log('创建的Add-on:', createdAddon)

    // 3. 为商品添加Add-on（需要先有商品）
    const items = await itemManagementService.getItems({ limit: 1 })
    if (items.data.length > 0) {
      const itemId = items.data[0].id

      console.log('\n🔗 为商品添加Add-on:')
      const itemAddonData: CreateItemAddonPayload = {
        addonId: createdAddon.id,
        maxQuantity: 5
      }
      const itemAddon = await itemManagementService.addItemAddon(itemId, itemAddonData)
      console.log('商品Add-on关联:', itemAddon)

      // 4. 获取商品的Add-ons
      console.log('\n📋 获取商品Add-ons:')
      const itemAddons = await itemManagementService.getItemAddons(itemId)
      console.log('商品的Add-ons:', itemAddons)
    }

    return { success: true, addonId: createdAddon.id }
  } catch (error) {
    console.error('❌ Add-on管理示例失败:', error)
    return { success: false, error }
  }
}

// ==================== 属性管理示例 ====================

export async function attributeManagementExamples() {
  console.log('\n🏷️ 开始属性管理示例...')

  try {
    // 1. 获取属性类型
    console.log('\n🏷️ 获取属性类型列表:')
    const attributeTypes = await itemManagementService.getAttributeTypes()
    console.log('属性类型列表:', attributeTypes)

    // 2. 创建属性类型
    console.log('\n➕ 创建属性类型示例:')
    const newAttributeType = await itemManagementService.createAttributeType({
      name: 'size',
      displayName: '尺寸',
      inputType: 'select'
    })
    console.log('创建的属性类型:', newAttributeType)

    // 3. 为属性类型添加选项
    console.log('\n➕ 添加属性选项:')
    const sizeOptions = ['小杯', '中杯', '大杯']
    for (let i = 0; i < sizeOptions.length; i++) {
      const option = await itemManagementService.createAttributeOption(newAttributeType.id, {
        value: sizeOptions[i],
        displayName: sizeOptions[i],
        priceModifier: 0
      })
      console.log(`创建选项 ${sizeOptions[i]}:`, option)
    }

    // 4. 获取属性选项
    console.log('\n📋 获取属性选项:')
    const options = await itemManagementService.getAttributeOptions(newAttributeType.id)
    console.log('属性选项列表:', options)

    return { success: true, attributeTypeId: newAttributeType.id }
  } catch (error) {
    console.error('❌ 属性管理示例失败:', error)
    return { success: false, error }
  }
}

// ==================== 综合示例 ====================

export async function comprehensiveExample() {
  console.log('\n🎯 开始综合示例...')

  try {
    // 1. 创建分类
    const categoryResult = await categoryManagementExamples()
    if (!categoryResult.success) {
      throw new Error('分类创建失败')
    }

    // 2. 创建属性类型
    const attributeResult = await attributeManagementExamples()
    if (!attributeResult.success) {
      throw new Error('属性类型创建失败')
    }

    // 3. 创建Add-on
    const addonResult = await addonManagementExamples()
    if (!addonResult.success) {
      throw new Error('Add-on创建失败')
    }

    // 4. 创建完整的商品（包含分类、属性）
    console.log('\n🎯 创建完整商品:')
    const completeItem: CreateItemPayload = {
      name: '综合示例商品 - 特制拿铁',
      description: '包含完整属性和Add-on的示例商品',
      basePrice: 35.00,
      categoryId: categoryResult.categoryId || '',
      isActive: true,
      attributes: [
        {
          attributeTypeId: attributeResult.attributeTypeId || '',
          isRequired: true
        }
      ]
    }

    const finalItem = await itemManagementService.createItem(completeItem)
    console.log('最终创建的完整商品:', finalItem)

    console.log('\n✅ 综合示例完成！')
    return { success: true, item: finalItem }

  } catch (error) {
    console.error('❌ 综合示例失败:', error)
    return { success: false, error }
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🎯 开始运行所有商品管理服务示例...\n')

  const results = {
    items: await itemManagementExamples(),
    categories: await categoryManagementExamples(), 
    addons: await addonManagementExamples(),
    attributes: await attributeManagementExamples(),
    comprehensive: await comprehensiveExample()
  }

  console.log('\n📊 所有示例执行结果:')
  console.log(results)

  return results
}

/**
 * 清理测试数据（删除示例中创建的数据）
 */
export async function cleanupTestData() {
  console.log('🧹 开始清理测试数据...')
  
  try {
    // 获取所有商品并删除名称包含"示例"或"测试"的商品
    const items = await itemManagementService.getItems({ limit: 100 })
    const testItems = items.data.filter(item => 
      item.name.includes('示例') || 
      item.name.includes('测试') || 
      item.name.includes('批量')
    )

    for (const item of testItems) {
      try {
        await itemManagementService.deleteItem(item.id)
        console.log(`删除测试商品: ${item.name}`)
      } catch (error) {
        console.warn(`删除商品失败: ${item.name}`, error)
      }
    }

    console.log('✅ 测试数据清理完成')
    return { success: true, deletedCount: testItems.length }
  } catch (error) {
    console.error('❌ 测试数据清理失败:', error)
    return { success: false, error }
  }
}
