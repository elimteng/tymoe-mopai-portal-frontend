# 小票模板列表显示优化

## 问题修复

### 1. 创建时名称和描述没有保存

**问题**：
- 用户填写的模板名称和描述没有存入数据库

**原因分析**：
- 前端代码已正确传递 `name` 和 `description`
- 问题可能在后端 API 实现

**前端代码**（已正确）：
```typescript
const response = await httpService.post(
  '/api/order/v1/receipt-templates/create-all-sources',
  {
    styleId: selectedStyleId,
    paperWidth: values.paperWidth,
    language: i18n.language,
    name: values.name,              // ✅ 已传递
    description: values.description, // ✅ 已传递
    isDefault: values.isDefault,
    config: values.config
  }
)
```

**后端需要检查**：
1. API 是否接收了 `name` 和 `description` 参数
2. 是否正确保存到数据库
3. 是否为3个版本都设置了正确的名称

### 2. 列表显示优化

**之前**：
- 只显示主模板
- 看不到 POS/KIOSK/WEB 版本

**现在**：
- 显示主模板（可展开）
- 展开后显示3个子版本
- 每个子版本显示订单来源标签

## 实现细节

### 1. 数据加载逻辑

```typescript
const loadTemplates = async () => {
  const response = await getReceiptTemplates()
  
  // 1. 找出所有主模板（不包含订单来源标识）
  const mainTemplates = response.data.filter(template => {
    const name = typeof template.name === 'string' 
      ? template.name 
      : template.name['zh-CN']
    return !name.includes('(POS)') && 
           !name.includes('(Kiosk)') && 
           !name.includes('(Web)') &&
           !name.includes('- POS') && 
           !name.includes('- KIOSK') && 
           !name.includes('- WEB')
  })
  
  // 2. 为每个主模板找到对应的子版本
  const templatesWithChildren = mainTemplates.map(mainTemplate => {
    const mainName = typeof mainTemplate.name === 'string' 
      ? mainTemplate.name 
      : mainTemplate.name['zh-CN']
    
    // 查找对应的 POS/KIOSK/WEB 版本
    const children = response.data.filter(template => {
      const name = typeof template.name === 'string' 
        ? template.name 
        : template.name['zh-CN']
      
      // 匹配 "主模板名 (POS)" 或 "主模板名 - POS" 格式
      return (name.includes(mainName) && template.id !== mainTemplate.id) &&
             (name.includes('(POS)') || name.includes('(Kiosk)') || 
              name.includes('(Web)') || name.includes('- POS') || 
              name.includes('- KIOSK') || name.includes('- WEB'))
    })
    
    return {
      ...mainTemplate,
      children: children.length > 0 ? children : undefined
    }
  })
  
  setTemplates(templatesWithChildren)
}
```

### 2. 表格展开配置

```typescript
<Table
  columns={columns}
  dataSource={templates}
  rowKey="id"
  expandable={{
    // 展开行渲染
    expandedRowRender: (record) => {
      if (!record.children || record.children.length === 0) {
        return null
      }
      return (
        <div style={{ padding: '8px 24px', backgroundColor: '#fafafa' }}>
          <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>
            订单来源版本：
          </div>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {record.children.map((child) => (
              <div key={child.id} style={{ /* 子版本样式 */ }}>
                <Space>
                  <Tag color="blue">{child.orderSource}</Tag>
                  <span>{child.name}</span>
                  <Tag color={child.isActive ? 'success' : 'default'}>
                    {child.isActive ? '启用' : '禁用'}
                  </Tag>
                </Space>
                <Space size="small">
                  <Button icon={<EyeOutlined />} onClick={() => handlePreview(child)} />
                  <Button icon={<EditOutlined />} onClick={() => handleOpenModal(child)} />
                </Space>
              </div>
            ))}
          </Space>
        </div>
      )
    },
    // 判断是否可展开
    rowExpandable: (record) => !!record.children && record.children.length > 0,
    // 默认不展开
    defaultExpandAllRows: false
  }}
/>
```

### 3. 类型定义扩展

```typescript
// src/services/receipt-template.ts
export interface ReceiptTemplate {
  id: string
  tenantId: string
  name: string | MultiLangText
  description?: string | MultiLangText
  paperWidth: number
  isDefault: boolean
  isActive: boolean
  version: number
  config: ReceiptTemplateConfig
  orderSource?: string        // 新增：订单来源
  children?: ReceiptTemplate[] // 新增：子版本
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

## 显示效果

### 主模板行

```
┌─────────────────────────────────────────────────────────┐
│ [▶] 我的咖啡店模板 ⭐  |  80mm  |  v1  |  启用  |  操作  │
└─────────────────────────────────────────────────────────┘
```

### 展开后

```
┌─────────────────────────────────────────────────────────┐
│ [▼] 我的咖啡店模板 ⭐  |  80mm  |  v1  |  启用  |  操作  │
├─────────────────────────────────────────────────────────┤
│   订单来源版本：                                          │
│   ┌───────────────────────────────────────────────────┐ │
│   │ [POS] 我的咖啡店模板 - POS  [启用]  [预览] [编辑] │ │
│   ├───────────────────────────────────────────────────┤ │
│   │ [KIOSK] 我的咖啡店模板 - KIOSK [启用] [预览] [编辑]│ │
│   ├───────────────────────────────────────────────────┤ │
│   │ [WEB] 我的咖啡店模板 - WEB  [启用]  [预览] [编辑] │ │
│   └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 后端 API 要求

### 1. 创建模板 API

```
POST /api/order/v1/receipt-templates/create-all-sources
```

**请求体**：
```json
{
  "styleId": "classic",
  "paperWidth": 80,
  "language": "zh-CN",
  "name": "我的咖啡店模板",        // ⚠️ 必须保存
  "description": "适合咖啡店使用",  // ⚠️ 必须保存
  "isDefault": false,
  "config": { ... }
}
```

**返回数据**：
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid-1",
        "name": "我的咖啡店模板 - POS",     // ⚠️ 包含用户输入的名称
        "description": "适合咖啡店使用",    // ⚠️ 包含用户输入的描述
        "orderSource": "POS",              // ⚠️ 必须返回
        "paperWidth": 80,
        "isDefault": false,
        "isActive": true,
        "version": 1,
        "config": { ... }
      },
      {
        "id": "uuid-2",
        "name": "我的咖啡店模板 - KIOSK",
        "description": "适合咖啡店使用",
        "orderSource": "KIOSK",
        "config": { ... }
      },
      {
        "id": "uuid-3",
        "name": "我的咖啡店模板 - WEB",
        "description": "适合咖啡店使用",
        "orderSource": "WEB",
        "config": { ... }
      }
    ]
  }
}
```

### 2. 获取模板列表 API

```
GET /api/order/v1/receipt-templates
```

**返回数据**：
```json
{
  "success": true,
  "data": [
    {
      "id": "main-uuid",
      "name": "我的咖啡店模板",           // 主模板（无后缀）
      "description": "适合咖啡店使用",
      "orderSource": null,               // 主模板没有 orderSource
      "paperWidth": 80,
      "isDefault": false,
      "isActive": true,
      "version": 1,
      "config": { ... }
    },
    {
      "id": "uuid-1",
      "name": "我的咖啡店模板 - POS",     // 子版本（带后缀）
      "description": "适合咖啡店使用",
      "orderSource": "POS",              // ⚠️ 必须返回
      "paperWidth": 80,
      "isDefault": false,
      "isActive": true,
      "version": 1,
      "config": { ... }
    },
    {
      "id": "uuid-2",
      "name": "我的咖啡店模板 - KIOSK",
      "orderSource": "KIOSK",
      "config": { ... }
    },
    {
      "id": "uuid-3",
      "name": "我的咖啡店模板 - WEB",
      "orderSource": "WEB",
      "config": { ... }
    }
  ]
}
```

## 命名规则建议

### 方案 1：使用连字符

```
主模板：我的咖啡店模板
POS版本：我的咖啡店模板 - POS
KIOSK版本：我的咖啡店模板 - KIOSK
WEB版本：我的咖啡店模板 - WEB
```

### 方案 2：使用括号

```
主模板：我的咖啡店模板
POS版本：我的咖啡店模板 (POS)
KIOSK版本：我的咖啡店模板 (Kiosk)
WEB版本：我的咖啡店模板 (Web)
```

**前端已支持两种格式**，后端可以选择其中一种。

## 用户体验

### 创建流程

1. 用户填写模板名称："我的咖啡店模板"
2. 用户填写描述："适合咖啡店使用"
3. 用户配置模板详情
4. 点击保存
5. 后端创建3个版本，都包含用户输入的名称和描述
6. 前端显示主模板，可展开查看3个子版本

### 列表显示

1. 默认显示主模板列表
2. 点击展开按钮查看子版本
3. 每个子版本显示订单来源标签（POS/KIOSK/WEB）
4. 可以单独预览或编辑每个子版本

## 测试建议

### 前端测试

1. **创建模板**
   - 填写名称和描述
   - 保存后检查是否显示在列表中
   - 展开查看是否有3个子版本

2. **列表显示**
   - 确认主模板可以展开
   - 确认子版本显示正确的订单来源
   - 确认子版本可以预览和编辑

3. **边界情况**
   - 没有子版本的主模板（不显示展开按钮）
   - 名称包含特殊字符
   - 多语言名称

### 后端测试

1. **创建 API**
   - 确认接收 `name` 和 `description`
   - 确认3个版本都保存了正确的名称和描述
   - 确认返回了 `orderSource` 字段

2. **查询 API**
   - 确认返回所有模板（主模板 + 子版本）
   - 确认每个模板都有 `orderSource` 字段
   - 确认名称格式正确

## 相关文件

- `src/pages/ReceiptTemplateManagement/index.tsx` - 主页面（已修改）
- `src/services/receipt-template.ts` - 类型定义（已扩展）
- `TEMPLATE_CREATION_FLOW.md` - 创建流程文档
