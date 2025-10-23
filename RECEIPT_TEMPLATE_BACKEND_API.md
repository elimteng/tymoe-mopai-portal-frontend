# 小票模板样式 API 规范

## API 端点

### GET /api/order/v1/receipt-templates/styles

获取所有可用的小票样式列表，包含预览配置。

## 请求

```http
GET /api/order/v1/receipt-templates/styles
Authorization: Bearer {token}
X-Organization-Id: {orgId}
```

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "styleId": "classic",
      "name": {
        "zh-CN": "经典样式",
        "en": "Classic Style",
        "zh-TW": "經典樣式"
      },
      "description": {
        "zh-CN": "简洁清晰的传统小票样式",
        "en": "Clean and clear traditional receipt style",
        "zh-TW": "簡潔清晰的傳統小票樣式"
      },
      "supportedSizes": [58, 80],
      "previewConfig": {
        "id": "preview-classic",
        "tenantId": "preview",
        "name": {
          "zh-CN": "经典样式",
          "en": "Classic Style",
          "zh-TW": "經典樣式"
        },
        "description": {
          "zh-CN": "预览模板",
          "en": "Preview Template",
          "zh-TW": "預覽模板"
        },
        "paperWidth": 80,
        "isDefault": false,
        "isActive": true,
        "version": 1,
        "config": {
          "header": {
            "logo": {
              "enabled": false
            },
            "storeName": {
              "enabled": true,
              "text": "示例咖啡店",
              "fontSize": "large",
              "bold": true,
              "alignment": "center"
            },
            "storeInfo": {
              "enabled": true,
              "showAddress": true,
              "showPhone": true,
              "address": "123 Main Street, Vancouver, BC",
              "phone": "+1 (604) 123-4567",
              "email": "info@example.com",
              "fontSize": "small"
            },
            "separator": {
              "enabled": true,
              "char": "="
            }
          },
          "body": {
            "orderInfo": {
              "enabled": true,
              "fields": [
                {
                  "label": {
                    "zh-CN": "订单号",
                    "en": "Order No.",
                    "zh-TW": "訂單號"
                  },
                  "field": "orderNumber",
                  "bold": true
                },
                {
                  "label": {
                    "zh-CN": "订单类型",
                    "en": "Order Type",
                    "zh-TW": "訂單類型"
                  },
                  "field": "orderType",
                  "bold": false
                },
                {
                  "label": {
                    "zh-CN": "下单时间",
                    "en": "Order Time",
                    "zh-TW": "下單時間"
                  },
                  "field": "createdAt",
                  "bold": false
                }
              ]
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
              "showNotes": false
            }
          },
          "footer": {
            "summary": {
              "enabled": true,
              "showSubtotal": true,
              "showDiscount": true,
              "showTax": true,
              "showTotal": true
            },
            "qrcode": {
              "enabled": true,
              "size": 6,
              "alignment": "center"
            },
            "customMessage": {
              "zh-CN": "感谢惠顾，欢迎再次光临！",
              "en": "Thank you for your visit!",
              "zh-TW": "感謝惠顧，歡迎再次光臨！"
            },
            "wifi": {
              "enabled": false
            }
          },
          "style": {
            "lineSpacing": 1.4,
            "feedLines": 3,
            "cutPaper": true
          }
        },
        "createdAt": "2025-10-21T00:00:00Z",
        "updatedAt": "2025-10-21T00:00:00Z"
      }
    },
    {
      "styleId": "modern",
      "name": {
        "zh-CN": "现代样式",
        "en": "Modern Style",
        "zh-TW": "現代樣式"
      },
      "description": {
        "zh-CN": "简约时尚的现代小票样式",
        "en": "Minimalist and modern receipt style",
        "zh-TW": "簡約時尚的現代小票樣式"
      },
      "supportedSizes": [58, 80],
      "previewConfig": {
        "id": "preview-modern",
        "tenantId": "preview",
        "name": {
          "zh-CN": "现代样式",
          "en": "Modern Style",
          "zh-TW": "現代樣式"
        },
        "paperWidth": 80,
        "isDefault": false,
        "isActive": true,
        "version": 1,
        "config": {
          "header": {
            "logo": {
              "enabled": false
            },
            "storeName": {
              "enabled": true,
              "text": "Modern Cafe",
              "fontSize": "large",
              "bold": true,
              "alignment": "center"
            },
            "storeInfo": {
              "enabled": true,
              "showAddress": true,
              "showPhone": false,
              "address": "123 Modern Street",
              "fontSize": "small"
            },
            "separator": {
              "enabled": true,
              "char": "-"
            }
          },
          "body": {
            "orderInfo": {
              "enabled": true,
              "fields": [
                {
                  "label": {
                    "zh-CN": "订单",
                    "en": "Order",
                    "zh-TW": "訂單"
                  },
                  "field": "orderNumber",
                  "bold": true
                }
              ]
            },
            "items": {
              "enabled": true,
              "showHeader": false,
              "showAttributes": true,
              "showAddons": true,
              "showNotes": false
            }
          },
          "footer": {
            "summary": {
              "enabled": true,
              "showSubtotal": false,
              "showDiscount": true,
              "showTax": false,
              "showTotal": true
            },
            "qrcode": {
              "enabled": true,
              "size": 5,
              "alignment": "center"
            },
            "customMessage": {
              "zh-CN": "谢谢！",
              "en": "Thank you!",
              "zh-TW": "謝謝！"
            },
            "wifi": {
              "enabled": false
            }
          },
          "style": {
            "lineSpacing": 1.3,
            "feedLines": 2,
            "cutPaper": true
          }
        },
        "createdAt": "2025-10-21T00:00:00Z",
        "updatedAt": "2025-10-21T00:00:00Z"
      }
    }
  ]
}
```

## 数据结构说明

### Style 对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| styleId | string | 是 | 样式唯一标识符 |
| name | MultiLangText | 是 | 样式名称（多语言） |
| description | MultiLangText | 是 | 样式描述（多语言） |
| supportedSizes | number[] | 是 | 支持的纸张宽度（mm），如 [58, 80] |
| previewConfig | ReceiptTemplate | 否 | **预览配置（重要）** |

### previewConfig 说明

`previewConfig` 字段包含一个完整的 `ReceiptTemplate` 对象，用于在前端渲染真实的预览效果。

**重要字段**：
- `config`: 完整的模板配置对象，定义了小票的所有显示规则
- `paperWidth`: 纸张宽度（会被用户选择的宽度覆盖）
- 其他字段（id, tenantId, name 等）用于预览显示

### config 配置结构

详细的 config 结构请参考 `src/services/receipt-template.ts` 中的 `ReceiptTemplateConfig` 接口。

主要包含：
- **header**: 头部配置（logo、店铺名称、店铺信息、分隔线）
- **body**: 主体配置（订单信息、商品明细）
- **footer**: 底部配置（价格汇总、二维码、自定义消息、WiFi 信息）
- **style**: 样式配置（行间距、底部空行、切纸）

## 前端使用方式

### 1. 获取样式列表

```typescript
const response = await httpService.get<{ success: boolean; data: Style[] }>(
  '/api/order/v1/receipt-templates/styles'
)
const styles = response.data.data
```

### 2. 渲染预览

如果后端返回了 `previewConfig`，前端会使用 `TemplatePreview` 组件渲染真实预览：

```typescript
{selectedStyleObj.previewConfig ? (
  <TemplatePreview 
    template={{
      ...selectedStyleObj.previewConfig,
      paperWidth,  // 使用用户选择的纸张宽度
      name: selectedStyleObj.name,
      description: selectedStyleObj.description
    } as ReceiptTemplate}
  />
) : (
  // 降级方案：显示简化预览
  <SimplifiedPreview />
)}
```

### 3. 创建模板

用户选择样式和纸张宽度后，调用创建接口：

```typescript
POST /api/order/v1/receipt-templates/create-all-sources
{
  "styleId": "classic",
  "paperWidth": 80,
  "language": "zh-CN"
}
```

## 后端实现建议

### 1. 样式预设管理

建议在后端维护一个样式预设库：

```typescript
const stylePresets = {
  classic: {
    styleId: 'classic',
    name: { 'zh-CN': '经典样式', ... },
    description: { ... },
    supportedSizes: [58, 80],
    defaultConfig: { /* 完整的 config 对象 */ }
  },
  modern: { ... },
  minimal: { ... }
}
```

### 2. 生成 previewConfig

在返回样式列表时，为每个样式生成 `previewConfig`：

```typescript
function generatePreviewConfig(style, paperWidth = 80) {
  return {
    id: `preview-${style.styleId}`,
    tenantId: 'preview',
    name: style.name,
    description: style.description,
    paperWidth,
    isDefault: false,
    isActive: true,
    version: 1,
    config: style.defaultConfig,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}
```

### 3. 创建模板时使用预设

当用户选择样式创建模板时，使用对应的 `defaultConfig`：

```typescript
async function createTemplatesFromStyle(styleId, paperWidth, language) {
  const style = stylePresets[styleId]
  const config = style.defaultConfig
  
  // 创建主模板
  const mainTemplate = await createTemplate({
    name: style.name,
    description: style.description,
    paperWidth,
    config,
    isDefault: true
  })
  
  // 创建订单来源特定模板（可选）
  const posTemplate = await createTemplate({
    name: { ...style.name, 'zh-CN': style.name['zh-CN'] + ' (POS)' },
    paperWidth,
    config,
    orderSource: 'POS'
  })
  
  // ... 创建其他来源的模板
  
  return [mainTemplate, posTemplate, ...]
}
```

## 注意事项

1. **previewConfig 是可选的**：如果后端不返回 `previewConfig`，前端会显示简化的预览
2. **多语言支持**：所有文本字段都应该支持多语言
3. **纸张宽度**：用户选择的纸张宽度会覆盖 `previewConfig` 中的 `paperWidth`
4. **配置完整性**：`previewConfig.config` 应该是一个完整的、可用的配置对象
5. **性能考虑**：如果样式很多，可以考虑按需加载预览配置

## 示例样式配置

参考 `src/pages/ReceiptTemplateManagement/PresetSelector.tsx` 中的预设配置，了解完整的 config 结构示例。
