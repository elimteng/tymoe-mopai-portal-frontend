# 模板配置表单更新总结

## 完成的修改

根据后端API文档，已完成以下表单字段的更新：

### 1. Header (头部配置)

#### ✅ 店铺名称
- **字体大小**：改为 `large`, `xlarge`, `xxlarge`（之前是 small/medium/large）
- **新增**：`spacing` 字段（上下间距 0-5）

#### ✅ 分隔符（新增）
- `enabled`: 是否启用
- `char`: 分隔符字符（等号/破折号/装饰线/无）
- `spacing`: 间距（0-5）

#### ✅ 店铺信息
- **新增**：`fontSize` 字段（small/medium）
- **新增**：`spacing` 字段（0-5）

### 2. Body (主体配置)

#### ✅ 订单号（新增完整配置）
- `enabled`: 是否启用
- `label`: 多语言标签（zh-CN/en/zh-TW）
- `fontSize`: 字体大小（xlarge/xxlarge/xxxlarge）
- `bold`: 是否加粗
- `spacing`: 间距（0-5）

#### ✅ 客户姓名（新增）
- `enabled`: 是否启用
- `label`: 多语言标签（zh-CN/en/zh-TW）
- `fontSize`: 字体大小（large/xlarge）
- `bold`: 是否加粗
- `spacing`: 间距（0-5）

#### ✅ 订单信息字段
- **改为多语言**：`label` 改为 `{ 'zh-CN', 'en', 'zh-TW' }`
- **新增**：`enabled` 字段（每个字段可单独启用/禁用）
- **新增**：`fontSize` 字段（small/medium/large）
- **优化UI**：使用卡片式布局，更清晰

#### ✅ 商品列表
- **新增**：`headerText` 多语言（zh-CN/en/zh-TW）
- **新增**：`fontSize` 字段（medium/large）
- **新增**：`spacing` 字段（0-5）

### 3. Footer (底部配置)

#### ✅ 金额汇总
- **新增**：`fontSize` 字段（large/xlarge）
- **新增**：`spacing` 字段（0-5）

#### ✅ 二维码
- **改为多语言**：`title` 改为 `{ 'zh-CN', 'en', 'zh-TW' }`
- **改为像素值**：`size` 改为 120/160/200（之前是 4-10）
- **新增**：`spacing` 字段（0-5）

#### ✅ 自定义消息
- **改为多语言**：改为 `{ 'zh-CN', 'en', 'zh-TW' }` 三个独立字段

#### ✅ 底部间距（新增）
- `spacing`: 底部整体间距（0-5）

#### ❌ WiFi信息（删除）
- 根据API文档，WiFi配置不在标准配置中，已删除

### 4. Style (样式配置)

#### ✅ 行间距
- **调整范围**：0.8 ~ 2.5（之前是 0 ~ 3）
- **调整步长**：0.1（之前是 0.5）

#### ✅ 走纸行数
- **调整范围**：2 ~ 5（之前是 0 ~ 10）

## 表单字段路径对照表

| 配置项 | 表单路径 | 类型 | 可选值 |
|--------|---------|------|--------|
| **Header** |
| Logo启用 | `['config', 'header', 'logo', 'enabled']` | boolean | - |
| Logo对齐 | `['config', 'header', 'logo', 'alignment']` | string | left/center/right |
| 店铺名称启用 | `['config', 'header', 'storeName', 'enabled']` | boolean | - |
| 店铺名称文本 | `['config', 'header', 'storeName', 'text']` | string | - |
| 店铺名称字体 | `['config', 'header', 'storeName', 'fontSize']` | string | large/xlarge/xxlarge |
| 店铺名称间距 | `['config', 'header', 'storeName', 'spacing']` | number | 0-5 |
| 分隔符启用 | `['config', 'header', 'separator', 'enabled']` | boolean | - |
| 分隔符字符 | `['config', 'header', 'separator', 'char']` | string | =/- - - - -/╌╌╌╌╌╌╌ |
| 分隔符间距 | `['config', 'header', 'separator', 'spacing']` | number | 0-5 |
| **Body** |
| 订单号启用 | `['config', 'body', 'orderNumber', 'enabled']` | boolean | - |
| 订单号标签中文 | `['config', 'body', 'orderNumber', 'label', 'zh-CN']` | string | - |
| 订单号字体 | `['config', 'body', 'orderNumber', 'fontSize']` | string | xlarge/xxlarge/xxxlarge |
| 订单号间距 | `['config', 'body', 'orderNumber', 'spacing']` | number | 0-5 |
| 客户姓名启用 | `['config', 'body', 'customerName', 'enabled']` | boolean | - |
| 客户姓名标签中文 | `['config', 'body', 'customerName', 'label', 'zh-CN']` | string | - |
| 订单信息字段 | `['config', 'body', 'orderInfo', 'fields']` | array | - |
| 商品列表标题中文 | `['config', 'body', 'items', 'headerText', 'zh-CN']` | string | - |
| 商品列表字体 | `['config', 'body', 'items', 'fontSize']` | string | medium/large |
| **Footer** |
| 金额汇总字体 | `['config', 'footer', 'summary', 'fontSize']` | string | large/xlarge |
| 金额汇总间距 | `['config', 'footer', 'summary', 'spacing']` | number | 0-5 |
| 二维码标题中文 | `['config', 'footer', 'qrcode', 'title', 'zh-CN']` | string | - |
| 二维码尺寸 | `['config', 'footer', 'qrcode', 'size']` | number | 120/160/200 |
| 自定义消息中文 | `['config', 'footer', 'customMessage', 'zh-CN']` | string | - |
| 底部间距 | `['config', 'footer', 'spacing']` | number | 0-5 |
| **Style** |
| 行间距 | `['config', 'style', 'lineSpacing']` | number | 0.8-2.5 |
| 走纸行数 | `['config', 'style', 'feedLines']` | number | 2-5 |

## 完整配置示例

```json
{
  "language": "zh-CN",
  "header": {
    "logo": {
      "enabled": false,
      "alignment": "center"
    },
    "storeName": {
      "enabled": true,
      "text": "",
      "fontSize": "xlarge",
      "bold": true,
      "alignment": "center",
      "spacing": 1
    },
    "separator": {
      "enabled": true,
      "char": "=",
      "spacing": 1
    },
    "storeInfo": {
      "enabled": true,
      "showAddress": true,
      "showPhone": true,
      "fontSize": "small",
      "spacing": 1
    }
  },
  "body": {
    "orderNumber": {
      "enabled": true,
      "label": {
        "zh-CN": "订单号",
        "en": "Order #",
        "zh-TW": "訂單號"
      },
      "fontSize": "xxlarge",
      "bold": true,
      "alignment": "center",
      "spacing": 2
    },
    "customerName": {
      "enabled": false,
      "label": {
        "zh-CN": "取餐名",
        "en": "Name",
        "zh-TW": "取餐名"
      },
      "fontSize": "xlarge",
      "bold": true,
      "alignment": "center",
      "spacing": 2
    },
    "orderInfo": {
      "enabled": true,
      "fields": [
        {
          "label": {
            "zh-CN": "桌号",
            "en": "Table",
            "zh-TW": "桌號"
          },
          "field": "tableNumber",
          "enabled": true,
          "fontSize": "medium"
        }
      ],
      "spacing": 1
    },
    "items": {
      "enabled": true,
      "showHeader": true,
      "headerText": {
        "zh-CN": "商品明细",
        "en": "Items",
        "zh-TW": "商品明細"
      },
      "showAttributes": true,
      "showAddons": true,
      "showNotes": true,
      "fontSize": "medium",
      "spacing": 1
    }
  },
  "footer": {
    "summary": {
      "enabled": true,
      "showSubtotal": true,
      "showDiscount": true,
      "showTax": true,
      "showTotal": true,
      "fontSize": "large",
      "spacing": 1
    },
    "qrcode": {
      "enabled": true,
      "title": {
        "zh-CN": "扫码查看订单",
        "en": "Scan for Order",
        "zh-TW": "掃碼查看訂單"
      },
      "size": 120,
      "alignment": "center",
      "spacing": 2
    },
    "customMessage": {
      "zh-CN": "感谢惠顾，欢迎再次光临",
      "en": "Thank you, welcome back",
      "zh-TW": "感謝惠顧，歡迎再次光臨"
    },
    "spacing": 2
  },
  "style": {
    "lineSpacing": 1.2,
    "feedLines": 3,
    "cutPaper": true
  }
}
```

## 注意事项

1. **多语言字段**：所有用户可见的文本都改为多语言对象
2. **间距统一**：所有 spacing 字段范围都是 0-5
3. **字体大小**：根据不同位置有不同的可选值
4. **必填字段**：`showTotal` 在金额汇总中是必须的
5. **对齐方式**：订单号和客户姓名固定为 center

## 相关文件

- `src/pages/ReceiptTemplateManagement/TemplateConfigForm.tsx` - 配置表单（已更新）
- `CONFIG_FIELDS.md` - 字段定义文档
- `TEMPLATE_API_INTEGRATION.md` - API集成说明
