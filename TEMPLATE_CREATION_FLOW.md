# 小票模板创建流程优化

## 优化内容

### 1. 创建流程改进

**之前**：
```
选择样式 → 直接创建3个模板 → 完成
```

**现在**：
```
选择样式 → 配置模板详情 → 保存（后端创建3个版本）
```

### 2. 显示逻辑优化

**前端显示**：
- 只显示主样式模板（不带 POS/KIOSK/WEB 后缀）
- 用户看到的是一个模板，实际后端有3个版本

**后端存储**：
- 实际创建3个模板：POS、KIOSK、WEB
- 每个订单来源有独立的配置

### 3. 编辑逻辑

**编辑主样式时**：
- 前端只编辑主样式
- 后端同步更新所有3个版本
- 保持不同订单来源的差异化配置

## 实现细节

### 1. StyleSelector 组件修改

```typescript
interface StyleSelectorProps {
  onComplete: () => void
  onStyleSelected: (styleId: string, paperWidth: number) => void  // 新增
}

// 按钮改为"下一步"
<Button onClick={handleNext}>
  下一步：配置模板
</Button>

// 回调返回样式信息
const handleNext = () => {
  onStyleSelected(selectedStyle, paperWidth)
}
```

### 2. 主页面流程控制

```typescript
// 状态管理
const [selectedStyleId, setSelectedStyleId] = useState<string>('')
const [selectedPaperWidth, setSelectedPaperWidth] = useState<number>(80)

// 样式选择回调
onStyleSelected={(styleId, paperWidth) => {
  setSelectedStyleId(styleId)
  setSelectedPaperWidth(paperWidth)
  
  // 初始化表单
  form.setFieldsValue({
    paperWidth: paperWidth,
    isDefault: false
  })
  
  // 打开配置表单
  setIsModalVisible(true)
  setCurrentStep(1) // 跳过预设选择
}}
```

### 3. 保存逻辑优化

```typescript
const handleSave = async () => {
  const values = await form.validateFields()
  
  if (editingTemplate) {
    // 更新模板（后端同步更新所有3个版本）
    await updateReceiptTemplate(editingTemplate.id, updateData)
  } else if (selectedStyleId) {
    // 从样式创建（后端创建3个版本）
    await httpService.post('/api/order/v1/receipt-templates/create-all-sources', {
      styleId: selectedStyleId,
      paperWidth: values.paperWidth,
      language: i18n.language,
      name: values.name,
      description: values.description,
      isDefault: values.isDefault,
      config: values.config
    })
  } else {
    // 直接创建单个模板（旧方式，保留兼容）
    await createReceiptTemplate(createData)
  }
}
```

### 4. 模板列表过滤

```typescript
const loadTemplates = async () => {
  const response = await getReceiptTemplates()
  
  // 只显示主样式模板
  const mainTemplates = response.data.filter(template => {
    const name = typeof template.name === 'string' 
      ? template.name 
      : template.name['zh-CN']
    
    // 排除包含订单来源标识的模板
    return !name.includes('(POS)') && 
           !name.includes('(Kiosk)') && 
           !name.includes('(Web)')
  })
  
  setTemplates(mainTemplates)
}
```

## 后端 API 要求

### 1. 创建模板 API

```
POST /api/order/v1/receipt-templates/create-all-sources
```

**请求参数**：
```json
{
  "styleId": "classic",
  "paperWidth": 80,
  "language": "zh-CN",
  "name": "我的模板",           // 用户自定义名称
  "description": "描述",        // 用户自定义描述
  "isDefault": false,
  "config": {                   // 用户自定义配置
    "header": { ... },
    "body": { ... },
    "footer": { ... }
  }
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
        "name": "我的模板 - POS",
        "orderSource": "POS",
        "config": { ... }
      },
      {
        "id": "uuid-2",
        "name": "我的模板 - KIOSK",
        "orderSource": "KIOSK",
        "config": { ... }
      },
      {
        "id": "uuid-3",
        "name": "我的模板 - WEB",
        "orderSource": "WEB",
        "config": { ... }
      }
    ]
  }
}
```

### 2. 更新模板 API

```
PUT /api/order/v1/receipt-templates/:id
```

**行为**：
- 更新指定的主模板
- 同步更新对应的 POS/KIOSK/WEB 版本
- 保持各版本的差异化配置

### 3. 获取模板列表 API

```
GET /api/order/v1/receipt-templates
```

**返回**：
- 返回所有模板（包括主模板和3个版本）
- 前端通过名称过滤，只显示主模板

## 用户体验

### 创建流程

1. **点击"创建模板"**
   - 打开样式选择器

2. **选择样式和纸张宽度**
   - 查看样式预览
   - 选择纸张宽度（58/76/80mm）
   - 点击"下一步：配置模板"

3. **配置模板详情**
   - 填写模板名称
   - 填写描述
   - 配置头部、主体、底部
   - 实时预览效果

4. **保存**
   - 后端创建3个版本（POS/KIOSK/WEB）
   - 前端只显示主模板
   - 提示：成功创建模板！共 3 个版本

### 编辑流程

1. **点击"编辑"**
   - 打开配置表单
   - 加载主模板配置

2. **修改配置**
   - 修改名称、描述、配置
   - 实时预览

3. **保存**
   - 后端同步更新所有3个版本
   - 前端刷新列表

## 优势

### 1. 用户体验
- ✅ 创建前可以配置详情
- ✅ 列表简洁，不显示重复模板
- ✅ 编辑一次，所有版本同步

### 2. 数据一致性
- ✅ 一个样式对应3个版本
- ✅ 主模板和版本保持关联
- ✅ 编辑时自动同步

### 3. 灵活性
- ✅ 支持用户自定义配置
- ✅ 保留不同订单来源的差异
- ✅ 向后兼容旧的创建方式

## 注意事项

### 前端

1. **状态管理**
   - 记录选中的 styleId 和 paperWidth
   - 关闭对话框时清理状态

2. **表单初始化**
   - 选择样式后设置纸张宽度
   - 跳过预设选择步骤

3. **列表过滤**
   - 通过名称过滤主模板
   - 不显示带订单来源后缀的模板

### 后端

1. **创建逻辑**
   - 根据 styleId 生成基础配置
   - 合并用户自定义配置
   - 为每个订单来源创建版本

2. **更新逻辑**
   - 更新主模板
   - 同步更新所有版本
   - 保持差异化配置

3. **命名规则**
   - 主模板：`{name}`
   - POS 版本：`{name} - POS` 或 `{name} (POS)`
   - KIOSK 版本：`{name} - KIOSK` 或 `{name} (Kiosk)`
   - WEB 版本：`{name} - WEB` 或 `{name} (Web)`

## 测试建议

### 前端测试

1. **创建流程**
   - 选择样式 → 配置 → 保存
   - 检查是否只显示1个主模板

2. **编辑流程**
   - 编辑主模板 → 保存
   - 检查是否正确更新

3. **列表显示**
   - 确认只显示主模板
   - 不显示 POS/KIOSK/WEB 版本

### 后端测试

1. **创建 API**
   - 确认创建3个版本
   - 检查配置是否正确

2. **更新 API**
   - 确认同步更新所有版本
   - 检查差异化配置是否保留

3. **查询 API**
   - 确认返回所有模板
   - 包括主模板和版本

## 相关文件

- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx` - 样式选择器
- `src/pages/ReceiptTemplateManagement/index.tsx` - 主页面
- `src/pages/ReceiptTemplateManagement/TemplateConfigForm.tsx` - 配置表单
