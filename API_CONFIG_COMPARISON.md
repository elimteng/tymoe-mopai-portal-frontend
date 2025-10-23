# 配置结构对比说明

## 两种配置方式

### 方式一：详细配置（之前实现）

**特点**：前端完全控制所有细节

```typescript
{
  language: 'zh-CN',
  header: {
    logo: { enabled, imageUrl, alignment },
    storeName: { enabled, text, fontSize, bold, spacing },
    separator: { enabled, char, spacing },
    storeInfo: { enabled, showAddress, showPhone, fontSize, spacing }
  },
  body: {
    orderNumber: { enabled, label, fontSize, bold, spacing },
    customerName: { enabled, label, fontSize, bold, spacing },
    orderInfo: { enabled, fields: [...], spacing },
    items: { enabled, showHeader, headerText, showAttributes, showAddons, showNotes, fontSize, spacing }
  },
  footer: {
    summary: { enabled, showSubtotal, showDiscount, showTax, showTotal, fontSize, spacing },
    qrcode: { enabled, title, size, spacing },
    customMessage: { 'zh-CN': '...' },
    spacing: number
  },
  style: {
    lineSpacing: number,
    feedLines: number,
    cutPaper: boolean
  }
}
```

**优点**：
- ✅ 灵活性极高
- ✅ 可精确控制每个细节
- ✅ 适合高级用户

**缺点**：
- ❌ 配置复杂
- ❌ 用户容易配置错误
- ❌ 需要大量UI表单

---

### 方式二：样式预设 + 开关（后端API）

**特点**：后端提供样式预设，前端只控制显示开关

```typescript
{
  language: 'zh-CN',
  paperWidth: 80,
  styleId: 'classic',  // ← 样式由后端预设
  display: {           // ← 简单的开关
    logo: boolean,
    storeInfo: boolean,
    customerName: boolean,
    itemAttributes: boolean,
    itemAddons: boolean,
    itemNotes: boolean,
    priceBreakdown: boolean,
    qrCode: boolean
  },
  orderFields: ['tableNumber', 'orderType', 'time'],  // ← 简单数组
  logo: { enabled, data, width, height, alignment },  // ← Base64位图
  qrCode: { enabled, urlTemplate, title, sizeRatio, errorCorrection },
  customMessage: { 'zh-CN': '...' },
  printDensity: 'normal'  // ← 替代了 style 配置
}
```

**优点**：
- ✅ 配置简单
- ✅ 不易出错
- ✅ UI简洁
- ✅ 后端控制样式一致性

**缺点**：
- ❌ 灵活性较低
- ❌ 需要后端提供样式预设

---

## 配置映射对照

| 详细配置 | 简化配置 | 说明 |
|---------|---------|------|
| `header.storeName.fontSize` | `styleId` | 字体大小由样式决定 |
| `header.separator.char` | `styleId` | 分隔符由样式决定 |
| `body.orderNumber.fontSize` | `styleId` | 订单号字体由样式决定 |
| `body.orderInfo.fields[].label` | `orderFields` | 简化为字段名数组 |
| `footer.summary.fontSize` | `styleId` | 金额字体由样式决定 |
| `footer.qrcode.size` | `qrCode.sizeRatio` | 改为比例而非像素 |
| `style.lineSpacing` | `printDensity` | 行间距由密度决定 |
| `style.feedLines` | `printDensity` | 走纸行数由密度决定 |

---

## 样式预设说明

### classic（经典传统）
```
特点：
- 分隔符：等号 (=)
- 字体：标准大小
- 间距：标准间距
- 适用：POS收银台
```

### modern（现代简约）
```
特点：
- 分隔符：破折号 (- - - - -)
- 字体：超大字体
- 间距：大量留白
- 适用：KIOSK自助机
```

### compact（紧凑节省）
```
特点：
- 分隔符：无
- 字体：小字体
- 间距：最小间距
- 适用：节省纸张场景
```

### elegant（精致优雅）
```
特点：
- 分隔符：Unicode装饰线 (╌╌╌╌╌╌╌)
- 字体：优雅字体
- 间距：优雅间距
- 适用：高端餐厅
```

---

## 打印密度说明

| 密度 | 行间距 | 走纸行数 | 适用场景 |
|------|--------|----------|----------|
| `compact` | ×0.8 | 2行 | 节省纸张 |
| `normal` | ×1.0 | 3行 | 标准打印 |
| `spacious` | ×1.5 | 5行 | 宽松舒适 |

---

## 前端实现建议

### 推荐方案：两种方式并存

1. **默认使用简化配置**
   - 适合大部分用户
   - UI简洁易用
   - 调用 `/create-all-sources` API

2. **高级模式使用详细配置**
   - 提供"高级配置"开关
   - 适合有特殊需求的用户
   - 调用传统 `/receipt-templates` API

### UI设计

```
┌─────────────────────────────────────┐
│ 创建模板                             │
├─────────────────────────────────────┤
│                                     │
│ ○ 快速创建（推荐）                   │
│   - 选择样式预设                     │
│   - 简单开关配置                     │
│                                     │
│ ○ 高级创建                           │
│   - 完全自定义                       │
│   - 详细配置所有选项                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 迁移方案

### 如果要迁移到简化配置

1. **保留旧表单**：`TemplateConfigForm.tsx`
2. **创建新表单**：`SimpleConfigForm.tsx`
3. **在主页面中切换**：
   ```tsx
   {useSimpleMode ? (
     <SimpleConfigForm form={form} />
   ) : (
     <TemplateConfigForm form={form} />
   )}
   ```

### 配置转换函数

```typescript
// 详细配置 → 简化配置
function toSimpleConfig(detailedConfig): SimpleConfig {
  return {
    language: detailedConfig.language || 'zh-CN',
    paperWidth: detailedConfig.paperWidth || 80,
    styleId: guessStyle(detailedConfig),  // 根据配置猜测样式
    display: {
      logo: detailedConfig.header?.logo?.enabled ?? true,
      storeInfo: detailedConfig.header?.storeInfo?.enabled ?? true,
      customerName: detailedConfig.body?.customerName?.enabled ?? false,
      itemAttributes: detailedConfig.body?.items?.showAttributes ?? true,
      itemAddons: detailedConfig.body?.items?.showAddons ?? true,
      itemNotes: detailedConfig.body?.items?.showNotes ?? true,
      priceBreakdown: detailedConfig.footer?.summary?.enabled ?? true,
      qrCode: detailedConfig.footer?.qrcode?.enabled ?? true
    },
    orderFields: extractOrderFields(detailedConfig),
    printDensity: guessDensity(detailedConfig)
  }
}

// 简化配置 → 详细配置（用于预览）
function toDetailedConfig(simpleConfig): DetailedConfig {
  const stylePreset = getStylePreset(simpleConfig.styleId)
  return {
    ...stylePreset,  // 应用样式预设
    // 覆盖显示开关
    header: {
      ...stylePreset.header,
      logo: { ...stylePreset.header.logo, enabled: simpleConfig.display.logo },
      storeInfo: { ...stylePreset.header.storeInfo, enabled: simpleConfig.display.storeInfo }
    },
    // ...
  }
}
```

---

## 总结

| 方面 | 详细配置 | 简化配置 |
|------|---------|---------|
| 复杂度 | 高 | 低 |
| 灵活性 | 高 | 中 |
| 易用性 | 低 | 高 |
| 维护成本 | 高 | 低 |
| 适用用户 | 高级用户 | 普通用户 |
| 推荐场景 | 特殊需求 | 日常使用 |

**建议**：
- 默认使用简化配置
- 提供"高级模式"选项
- 两种方式可以互相转换
