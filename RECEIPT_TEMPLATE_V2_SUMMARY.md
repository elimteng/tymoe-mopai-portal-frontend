# 小票模板系统 V2 - 前端更新总结

## ✅ 已完成的更新

### 1. PresetSelector 组件更新

**文件**: `src/pages/ReceiptTemplateManagement/PresetSelector.tsx`

**新增功能**:
- ✅ 支持 V2 API (`/api/order/v1/receipt-templates/presets-v2`)
- ✅ 多语言支持 (中文/英文/繁体)
- ✅ 订单来源筛选 (POS/KIOSK/WEB)
- ✅ 纸张宽度筛选 (58mm/76mm/80mm)
- ✅ 动态显示模板名称和描述
- ✅ 订单来源标签和颜色区分

**接口变更**:
```typescript
// 旧版本
interface TemplatePreset {
  id: string
  name: string
  description: string
  paperWidth: 58 | 80
}

// V2版本
interface TemplatePreset {
  id: string
  name: {
    'zh-CN': string
    'en': string
    'zh-TW': string
  }
  description: {
    'zh-CN': string
    'en': string
    'zh-TW': string
  }
  orderSource: 'POS' | 'KIOSK' | 'WEB'
  paperWidth: 58 | 76 | 80
  config: ReceiptTemplateConfig
}
```

### 2. 主页面更新

**文件**: `src/pages/ReceiptTemplateManagement/index.tsx`

**更新内容**:
- ✅ 支持多语言模板名称和描述
- ✅ 自动根据当前语言填充表单
- ✅ 保持实时预览功能
- ✅ 保持两步创建流程

### 3. UI 改进

**筛选器**:
- 订单来源下拉框 (全部/POS/KIOSK/WEB)
- 纸张宽度下拉框 (全部/58mm/76mm/80mm)

**模板卡片**:
- 显示订单来源标签 (蓝色=POS, 绿色=KIOSK, 橙色=WEB)
- 显示纸张宽度标签
- 多语言名称和描述

## 🎯 使用流程

### 创建模板流程

1. **点击"创建模板"按钮**
   - 进入预设模板选择页面

2. **筛选模板** (可选)
   - 选择订单来源 (POS/KIOSK/WEB)
   - 选择纸张宽度 (58mm/76mm/80mm)

3. **选择预设模板**
   - 查看9种预设模板
   - 根据场景选择合适的模板
   - 模板名称和描述会根据当前语言显示

4. **点击"下一步"**
   - 进入配置详情页面
   - 左侧：配置表单
   - 右侧：实时预览

5. **自定义配置** (可选)
   - 修改模板名称
   - 调整配置选项
   - 实时查看预览效果

6. **保存模板**
   - 点击"保存"按钮
   - 模板创建完成

## 📊 9种预设模板

### POS点单模板 (3个)
- `pos-standard-80mm` - 80mm标准模板
- `pos-compact-58mm` - 58mm紧凑模板
- `pos-standard-3inch` - 76mm标准模板

### Kiosk点单模板 (3个)
- `kiosk-pickup-80mm` - 80mm取餐模板
- `kiosk-pickup-58mm` - 58mm取餐模板
- `kiosk-pickup-3inch` - 76mm取餐模板

### Web自助点单模板 (3个)
- `web-selforder-80mm` - 80mm自助模板
- `web-selforder-58mm` - 58mm自助模板
- `web-selforder-3inch` - 76mm自助模板

## 🌍 多语言支持

系统会自动根据用户当前选择的语言显示：
- 简体中文 (zh-CN)
- English (en)
- 繁體中文 (zh-TW)

语言检测优先级：
1. `i18n.language` (react-i18next)
2. `localStorage.getItem('i18nextLng')`
3. 默认: `zh-CN`

## 🔧 技术细节

### API调用

**获取预设模板**:
```typescript
// 获取所有模板
GET /api/order/v1/receipt-templates/presets-v2

// 筛选POS模板
GET /api/order/v1/receipt-templates/presets-v2?orderSource=POS

// 筛选80mm模板
GET /api/order/v1/receipt-templates/presets-v2?paperWidth=80

// 组合筛选
GET /api/order/v1/receipt-templates/presets-v2?orderSource=POS&paperWidth=80
```

**创建模板**:
```typescript
POST /api/order/v1/receipt-templates/from-preset
Headers:
  - Authorization: Bearer <token>
  - x-organization-id: <orgId>
Body:
  {
    "presetId": "kiosk-pickup-80mm",
    "name": "自定义名称",
    "language": "zh-CN"
  }
```

### 状态管理

```typescript
const [selectedPreset, setSelectedPreset] = useState<TemplatePreset | null>(null)
const [currentStep, setCurrentStep] = useState(0) // 0: 选择预设, 1: 配置详情
const [orderSource, setOrderSource] = useState<'POS' | 'KIOSK' | 'WEB' | 'ALL'>('ALL')
const [paperWidth, setPaperWidth] = useState<58 | 76 | 80 | 'ALL'>('ALL')
```

## 🎨 样式特点

### 订单来源颜色
- POS: 蓝色 (#1890ff)
- KIOSK: 绿色 (#52c41a)
- WEB: 橙色 (#fa8c16)

### 纸张宽度颜色
- 58mm: 绿色
- 76mm: 青色
- 80mm: 蓝色

## 📝 注意事项

1. **后端依赖**: 需要后端实现 V2 API
2. **向后兼容**: 保留了原有的创建和编辑功能
3. **实时预览**: 配置修改会立即反映在预览中
4. **自动填充**: 店铺名称会自动填入当前组织名称

## 🚀 测试步骤

1. 启动开发服务器
2. 登录系统
3. 进入"小票模板管理"页面
4. 点击"创建模板"
5. 测试筛选功能
6. 选择不同的预设模板
7. 查看实时预览
8. 保存模板

## ✨ 下一步优化建议

1. 添加模板预览大图
2. 支持模板收藏功能
3. 添加模板使用统计
4. 支持模板导入导出
5. 添加模板版本管理

---

**更新完成时间**: 2025-10-16
**版本**: V2.0
