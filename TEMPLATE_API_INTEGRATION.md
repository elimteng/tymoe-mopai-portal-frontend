# 小票模板 API 集成说明

## API 关键信息

### 1. 名称和描述的处理

**重要**：根据后端 API 文档，模板的名称和描述是**从样式定义动态生成**的，不保存在数据库。

**命名规则**：
```
格式：{样式名} {纸张宽度}mm - {订单来源}
示例：
- 经典传统 80mm - POS
- 经典传统 80mm - KIOSK
- 经典传统 80mm - WEB
```

### 2. 创建模板 API

**端点**：`POST /api/order/v1/receipt-templates/create-all-sources`

**请求参数**（只需3个）：
```json
{
  "styleId": "classic",
  "paperWidth": 80,
  "language": "zh-CN"
}
```

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "经典传统 80mm - POS",
      "orderSource": "POS",
      "isDefault": false,
      "version": 1
    },
    {
      "id": "uuid-2",
      "name": "经典传统 80mm - KIOSK",
      "orderSource": "KIOSK",
      "isDefault": false,
      "version": 1
    },
    {
      "id": "uuid-3",
      "name": "经典传统 80mm - WEB",
      "orderSource": "WEB",
      "isDefault": false,
      "version": 1
    }
  ]
}
```

## 前端实现

### 1. 创建流程

```typescript
// 用户选择样式后
onStyleSelected={(styleId, paperWidth) => {
  setSelectedStyleId(styleId)
  setSelectedPaperWidth(paperWidth)
  
  // 初始化表单（只设置纸张宽度）
  form.setFieldsValue({
    paperWidth: paperWidth
  })
  
  // 打开配置表单
  setIsModalVisible(true)
  setCurrentStep(1)
}}

// 保存时
const handleSave = async () => {
  if (selectedStyleId) {
    // 从样式创建（只传3个参数）
    await httpService.post('/api/order/v1/receipt-templates/create-all-sources', {
      styleId: selectedStyleId,
      paperWidth: values.paperWidth,
      language: i18n.language || 'zh-CN'
    })
  }
}
```

### 2. 表单显示逻辑

```typescript
{/* 从样式创建时显示提示 */}
{selectedStyleId && !editingTemplate ? (
  <div style={{ /* 提示样式 */ }}>
    <div>📋 模板信息</div>
    <div>
      模板名称和描述将根据所选样式自动生成，
      创建后会生成 POS、KIOSK、WEB 三个版本
    </div>
  </div>
) : (
  <>
    {/* 编辑时显示名称和描述字段 */}
    <Form.Item name="name" label="模板名称">
      <Input />
    </Form.Item>
    <Form.Item name="description" label="描述">
      <TextArea />
    </Form.Item>
  </>
)}

{/* 纸张宽度（从样式创建时禁用编辑） */}
<Form.Item name="paperWidth" label="纸张宽度">
  <InputNumber disabled={!!selectedStyleId && !editingTemplate} />
</Form.Item>
```

### 3. 列表显示

```typescript
// 加载模板列表
const loadTemplates = async () => {
  const response = await getReceiptTemplates()
  
  // 1. 找出主模板（不包含 - POS/KIOSK/WEB 后缀）
  const mainTemplates = response.data.filter(template => {
    const name = typeof template.name === 'string' 
      ? template.name 
      : template.name['zh-CN']
    return !name.includes('- POS') && 
           !name.includes('- KIOSK') && 
           !name.includes('- WEB')
  })
  
  // 2. 为每个主模板找到对应的子版本
  const templatesWithChildren = mainTemplates.map(mainTemplate => {
    const mainName = getTemplateName(mainTemplate)
    
    const children = response.data.filter(template => {
      const name = getTemplateName(template)
      return name.includes(mainName) && 
             template.id !== mainTemplate.id &&
             (name.includes('- POS') || 
              name.includes('- KIOSK') || 
              name.includes('- WEB'))
    })
    
    return {
      ...mainTemplate,
      children: children.length > 0 ? children : undefined
    }
  })
  
  setTemplates(templatesWithChildren)
}
```

## 样式列表

### 可用样式

根据 API 文档，后端提供以下样式：

1. **classic** - 经典传统
   - 支持纸张：58/76/80mm
   - 特点：使用等号分隔，信息密集

2. **modern** - 现代简约
   - 支持纸张：58/76/80mm
   - 特点：简洁现代

3. **compact** - 紧凑节省
   - 支持纸张：58/76/80mm
   - 特点：节省纸张

4. **elegant** - 精致优雅
   - 支持纸张：76/80mm（不支持58mm）
   - 特点：精致优雅

### 获取样式列表

```typescript
const fetchStyles = async () => {
  const response = await httpService.get('/api/order/v1/receipt-templates/styles')
  
  // response.data 包含：
  // - styleId: 样式ID
  // - name: 多语言名称
  // - description: 多语言描述
  // - supportedSizes: 支持的纸张尺寸
  // - previewConfig: 预览配置
  
  setStyles(response.data)
}
```

## 订单来源差异

后端会根据订单来源自动优化配置：

### POS（收银台）
- ❌ 不显示客户姓名
- ✅ 显示桌号、订单类型
- ✅ 标准配置

### KIOSK（自助点餐机）
- ✅ 超大显示取餐名
- ❌ 不显示店铺地址电话
- ✅ 大二维码

### WEB（线上订单）
- ✅ 显示客户姓名和电话
- ✅ 显示完整信息
- ✅ 标准二维码

## 表格展开显示

```typescript
<Table
  expandable={{
    expandedRowRender: (record) => {
      if (!record.children) return null
      
      return (
        <div style={{ padding: '8px 24px', backgroundColor: '#fafafa' }}>
          <div>订单来源版本：</div>
          {record.children.map(child => (
            <div key={child.id}>
              <Tag color="blue">{child.orderSource}</Tag>
              <span>{child.name}</span>
              <Tag color={child.isActive ? 'success' : 'default'}>
                {child.isActive ? '启用' : '禁用'}
              </Tag>
              <Button icon={<EyeOutlined />} onClick={() => handlePreview(child)} />
              <Button icon={<EditOutlined />} onClick={() => handleOpenModal(child)} />
            </div>
          ))}
        </div>
      )
    },
    rowExpandable: (record) => !!record.children && record.children.length > 0
  }}
/>
```

## 完整流程示例

### 创建模板

```
1. 用户点击"创建模板"
   ↓
2. 打开样式选择器
   - 显示4种样式预览
   - 选择纸张宽度（58/76/80mm）
   ↓
3. 点击"下一步：配置模板"
   - 关闭样式选择器
   - 打开配置表单
   ↓
4. 配置表单显示
   - 📋 提示：名称和描述自动生成
   - 纸张宽度：80mm（禁用编辑）
   - 配置详情：头部、主体、底部
   - 实时预览
   ↓
5. 点击"保存"
   - 发送请求：{ styleId, paperWidth, language }
   - 后端创建3个版本
   - 提示：成功创建模板！共 3 个版本
   ↓
6. 列表显示
   - 主模板：经典传统 80mm
   - 可展开查看：
     - POS 版本
     - KIOSK 版本
     - WEB 版本
```

### 编辑模板

```
1. 点击主模板的"编辑"按钮
   ↓
2. 打开配置表单
   - 显示名称和描述字段（可编辑）
   - 显示纸张宽度（可编辑）
   - 显示配置详情
   ↓
3. 修改配置
   ↓
4. 点击"保存"
   - 调用更新 API
   - 后端同步更新所有3个版本
   ↓
5. 列表刷新
```

## 注意事项

### 1. 创建 vs 编辑

| 操作 | 名称/描述 | 纸张宽度 | 配置 |
|------|----------|---------|------|
| 从样式创建 | 自动生成（不可编辑） | 禁用（已在样式选择时确定） | 可配置 |
| 从预设创建 | 可编辑 | 可编辑 | 可配置 |
| 编辑模板 | 可编辑 | 可编辑 | 可配置 |

### 2. 表单验证

从样式创建时，不需要验证名称和描述字段。

### 3. 响应数据结构

创建模板的响应中，`data` 是数组，不是对象：
```typescript
// ✅ 正确
response.data.data.length

// ❌ 错误
response.data.data.templates.length
```

### 4. orderSource 字段

后端返回的模板必须包含 `orderSource` 字段，用于：
- 前端识别订单来源
- 展开行中显示标签
- 区分主模板和子版本

## 相关文件

- `src/pages/ReceiptTemplateManagement/index.tsx` - 主页面
- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx` - 样式选择器
- `src/services/receipt-template.ts` - API 服务和类型定义
