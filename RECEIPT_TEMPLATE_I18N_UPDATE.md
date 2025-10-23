# 小票模板页面翻译完善

## 问题
小票模板预览组件中存在硬编码的中文文本，未使用i18n翻译系统。

## 修复内容

### 1. 添加翻译键 (`src/i18n/locales/zh-CN.ts`)

在 `receiptTemplate` 部分添加了以下翻译键：

#### 预览相关
- `previewStoreName`: '店铺名称'
- `previewAddress`: '地址: 示例街道123号'
- `previewPhone`: '电话: +1 604 123 4567'
- `previewItemsHeader`: '商品明细'
- `previewSubtotal`: '小计:'
- `previewDiscount`: '折扣:'
- `previewTax`: '税费:'
- `previewTotal`: '合计:'
- `previewQRCode`: '二维码'
- `previewWiFi`: 'WiFi:'
- `previewPassword`: '密码:'
- `previewWiFiName`: 'WiFi-Name'
- `previewWiFiPassword`: '********'
- `previewCutLine`: '✂ ---- 裁切线 ----'

#### 模拟订单数据
- `mockOrderNumber`: 'ORD20241016001'
- `mockOrderType`: '堂食'
- `mockOrderSource`: 'POS'
- `mockTableNumber`: '8'
- `mockItemCoffee`: '美式咖啡'
- `mockItemLatte`: '拿铁咖啡'
- `mockAttrTemperature`: '温度'
- `mockAttrHot`: '热'
- `mockAttrCold`: '冰'
- `mockAttrSugar`: '糖度'
- `mockAttrLessSugar`: '少糖'
- `mockAddonMilk`: '加奶'

### 2. 更新预览组件 (`src/pages/ReceiptTemplateManagement/TemplatePreview.tsx`)

#### 主要修改：

1. **导入翻译钩子**
```typescript
import { useTranslation } from 'react-i18next'
```

2. **使用翻译钩子**
```typescript
const { t } = useTranslation()
```

3. **替换所有硬编码文本**
   - 模拟订单数据中的所有文本
   - 预览显示中的所有文本
   - 默认值文本

#### 示例修改：

**之前：**
```typescript
name: '美式咖啡'
```

**之后：**
```typescript
name: t('receiptTemplate.mockItemCoffee')
```

**之前：**
```html
<span>小计:</span>
```

**之后：**
```html
<span>{t('receiptTemplate.previewSubtotal')}</span>
```

## 影响范围

- ✅ 小票模板预览功能正常
- ✅ 支持国际化（未来可添加英文等其他语言）
- ✅ 代码更规范，遵循项目i18n标准
- ✅ 无功能性变更，仅重构

## 测试建议

1. 访问小票模板管理页面
2. 创建或编辑模板
3. 点击预览按钮
4. 确认所有文本正确显示
5. 检查模拟订单数据显示正常

## 后续工作

如需支持其他语言（如英文），只需：
1. 在 `src/i18n/locales/en-US.ts` 中添加对应的英文翻译
2. 无需修改任何组件代码

## 相关文件

- `src/i18n/locales/zh-CN.ts` - 中文翻译文件
- `src/pages/ReceiptTemplateManagement/TemplatePreview.tsx` - 预览组件
- `src/pages/ReceiptTemplateManagement/index.tsx` - 主页面（已使用翻译）
- `src/pages/ReceiptTemplateManagement/TemplateConfigForm.tsx` - 配置表单（已使用翻译）
