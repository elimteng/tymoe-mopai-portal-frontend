# 小票模板预览和样式选择改进

## 改进内容

### 1. 二维码尺寸优化

**问题**：预览中的二维码太大，不符合实际小票比例

**解决方案**：
- 将二维码缩放比例从 `size * 10` → `size * 6` → `size * 4` → **`size * 3`**
- 默认大小 6 的二维码：60px → 36px → 24px → **18px**
- 简化二维码文字显示为 "QR"

**修改文件**：
- `src/pages/ReceiptTemplateManagement/TemplatePreview.tsx`

### 2. 真实小票尺寸预览

**问题**：预览尺寸不够真实，无法准确反映打印效果

**解决方案**：
- 使用真实的毫米到像素转换：**1mm ≈ 3.78px**（96 DPI标准）
- 80mm 纸张 → 约 302px 宽
- 58mm 纸张 → 约 219px 宽
- 调整所有字体大小和间距，更接近实际打印效果

**具体调整**：
```
基础字体：12px → 11px
店铺名称：18/14/12px → 16/13/11px
店铺信息：10px → 9px
商品明细：保持 10px
属性/加料：10px → 9px
汇总信息：保持 10px
总计：14px → 12px
内边距：16px → 8px
各区块间距：8px → 6px
```

**修改文件**：
- `src/pages/ReceiptTemplateManagement/TemplatePreview.tsx`

### 3. 样式选择时显示预览

**问题**：选择样式时无法预览效果，不知道选择的样式是什么样子

**解决方案**：
- 将样式选择页面改为左右布局
- 左侧：样式卡片选择（2列网格）
- 右侧：实时预览选中的样式效果
- 预览包含：
  - 店铺名称
  - 店铺地址
  - 订单信息
  - 商品明细
  - 价格汇总
  - 二维码
  - 感谢语

**修改文件**：
- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx`

### 4. 只显示主样式模板

**问题**：创建模板后显示3个版本（POS、Kiosk、Web），列表混乱

**解决方案**：

#### 4.1 更新提示文字
- 原文案："系统将自动创建 POS、Kiosk、Web 三种订单来源的模板"
- 新文案："选择一个样式创建主模板，后续可以为不同订单来源自定义配置"

#### 4.2 过滤模板列表
在加载模板列表时，只显示主样式模板：
```typescript
const mainTemplates = response.data.filter(template => {
  const name = typeof template.name === 'string' ? template.name : template.name['zh-CN']
  // 排除包含订单来源标识的模板
  return !name.includes('(POS)') && !name.includes('(Kiosk)') && !name.includes('(Web)')
})
```

#### 4.3 更新成功提示
- 原提示："成功创建3个模板！"
- 新提示："成功创建模板！共 3 个版本"

**修改文件**：
- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx`
- `src/pages/ReceiptTemplateManagement/index.tsx`

## 视觉效果对比

### 预览尺寸对比
| 项目 | 之前 | 现在 |
|------|------|------|
| 80mm 纸张宽度 | 240px | 302px |
| 58mm 纸张宽度 | 174px | 219px |
| 二维码（默认） | 60px → 36px → 24px | **18px** |
| 基础字体 | 12px | 11px |
| 内边距 | 16px | 8px |

### 用户体验改进
1. ✅ 预览更真实，接近实际打印效果
2. ✅ 选择样式时可以实时预览
3. ✅ 模板列表更清晰，只显示主样式
4. ✅ 二维码大小更合理，不会过大

## 技术细节

### 像素转换计算
```typescript
// 真实的小票尺寸：1mm ≈ 3.78px (96 DPI)
const actualWidth = Math.round(template.paperWidth * 3.78)
```

### 模板过滤逻辑
```typescript
// 通过名称判断是否为主样式
const isMainTemplate = !name.includes('(POS)') && 
                       !name.includes('(Kiosk)') && 
                       !name.includes('(Web)')
```

### 响应式布局
- 大屏（lg）：左右两列布局，样式选择和预览并排
- 小屏（xs）：上下布局，样式选择在上，预览在下

## 后续建议

### 1. 后端优化
建议后端在模板数据中添加 `orderSource` 字段：
```typescript
interface ReceiptTemplate {
  // ... 现有字段
  orderSource?: 'main' | 'POS' | 'Kiosk' | 'Web'
}
```

这样前端可以更准确地过滤：
```typescript
const mainTemplates = response.data.filter(t => 
  !t.orderSource || t.orderSource === 'main'
)
```

### 2. 订单来源管理
考虑添加一个独立的页面或标签页来管理不同订单来源的模板配置：
- 主样式模板（当前页面）
- POS 模板配置
- Kiosk 模板配置
- Web 模板配置

### 3. 预览增强
- 添加实际打印预览（调用打印机 API）
- 支持导出为 PDF
- 支持二维码实际生成和扫描测试

## 相关文件

- `src/pages/ReceiptTemplateManagement/TemplatePreview.tsx` - 预览组件
- `src/pages/ReceiptTemplateManagement/StyleSelector.tsx` - 样式选择组件
- `src/pages/ReceiptTemplateManagement/index.tsx` - 主页面
- `src/services/receipt-template.ts` - API 服务
