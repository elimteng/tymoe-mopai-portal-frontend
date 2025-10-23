# 模板配置字段定义

## 完整配置结构

```typescript
interface ReceiptTemplateConfig {
  language: 'zh-CN' | 'en' | 'zh-TW'
  header: HeaderConfig
  body: BodyConfig
  footer: FooterConfig
  style: StyleConfig
}
```

## 1. Header (头部配置)

### 1.1 Logo
```typescript
logo?: {
  enabled: boolean              // 是否显示Logo
  imageUrl?: string            // Logo图片URL
  alignment: 'left' | 'center' | 'right'  // 对齐方式
}
```

**表单定义**：
```tsx
<Form.Item name={['config', 'header', 'logo', 'enabled']} valuePropName="checked">
  <Switch />
</Form.Item>
<Form.Item name={['config', 'header', 'logo', 'imageUrl']}>
  <Input placeholder="https://example.com/logo.png" />
</Form.Item>
<Form.Item name={['config', 'header', 'logo', 'alignment']}>
  <Select>
    <Option value="left">左对齐</Option>
    <Option value="center">居中</Option>
    <Option value="right">右对齐</Option>
  </Select>
</Form.Item>
```

### 1.2 店铺名称
```typescript
storeName: {
  enabled: boolean
  text: string                 // 留空使用系统店铺名
  fontSize: 'large' | 'xlarge' | 'xxlarge'
  bold: boolean
  alignment: 'center'          // 固定居中
  spacing: number              // 0-5
}
```

**表单定义**：
```tsx
<Form.Item name={['config', 'header', 'storeName', 'enabled']} valuePropName="checked">
  <Switch />
</Form.Item>
<Form.Item name={['config', 'header', 'storeName', 'text']}>
  <Input placeholder="留空使用系统店铺名" />
</Form.Item>
<Form.Item name={['config', 'header', 'storeName', 'fontSize']}>
  <Select>
    <Option value="large">大</Option>
    <Option value="xlarge">特大</Option>
    <Option value="xxlarge">超大</Option>
  </Select>
</Form.Item>
<Form.Item name={['config', 'header', 'storeName', 'bold']} valuePropName="checked">
  <Switch />
</Form.Item>
<Form.Item name={['config', 'header', 'storeName', 'spacing']}>
  <InputNumber min={0} max={5} />
</Form.Item>
```

### 1.3 店铺信息
```typescript
storeInfo?: {
  enabled: boolean
  showAddress: boolean
  showPhone: boolean
  fontSize: 'small' | 'medium'
  spacing: number
}
```

### 1.4 分隔符
```typescript
separator: {
  enabled: boolean
  char: string                 // "=", "- - - - -", "╌╌╌╌╌╌╌"
  spacing: number
}
```

## 2. Body (主体配置)

### 2.1 订单号
```typescript
orderNumber: {
  enabled: boolean
  label: MultiLangText          // { 'zh-CN': '订单号', 'en': 'Order #', 'zh-TW': '訂單號' }
  fontSize: 'xlarge' | 'xxlarge' | 'xxxlarge'
  bold: boolean
  alignment: 'center'
  spacing: number
}
```

**表单定义**：
```tsx
<Form.Item name={['config', 'body', 'orderNumber', 'enabled']} valuePropName="checked">
  <Switch />
</Form.Item>
<Form.Item name={['config', 'body', 'orderNumber', 'label', 'zh-CN']}>
  <Input placeholder="订单号" />
</Form.Item>
<Form.Item name={['config', 'body', 'orderNumber', 'label', 'en']}>
  <Input placeholder="Order #" />
</Form.Item>
<Form.Item name={['config', 'body', 'orderNumber', 'fontSize']}>
  <Select>
    <Option value="xlarge">特大</Option>
    <Option value="xxlarge">超大</Option>
    <Option value="xxxlarge">巨大</Option>
  </Select>
</Form.Item>
```

### 2.2 客户姓名（可选）
```typescript
customerName?: {
  enabled: boolean
  label: MultiLangText
  fontSize: 'large' | 'xlarge'
  bold: boolean
  alignment: 'center'
  spacing: number
}
```

### 2.3 订单信息
```typescript
orderInfo: {
  enabled: boolean
  fields: Array<{
    label: MultiLangText
    field: string              // 'orderType', 'tableNumber', 'createdAt', 'customerPhone'
    enabled: boolean
    bold?: boolean
    fontSize?: 'small' | 'medium' | 'large'
  }>
  spacing: number
}
```

**表单定义（动态列表）**：
```tsx
<Form.List name={['config', 'body', 'orderInfo', 'fields']}>
  {(fields, { add, remove }) => (
    <>
      {fields.map(field => (
        <Space key={field.key}>
          <Form.Item name={[field.name, 'enabled']} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={[field.name, 'field']}>
            <Select>
              <Option value="orderType">订单类型</Option>
              <Option value="tableNumber">桌号</Option>
              <Option value="createdAt">时间</Option>
              <Option value="customerPhone">客户电话</Option>
            </Select>
          </Form.Item>
          <Form.Item name={[field.name, 'label', 'zh-CN']}>
            <Input placeholder="中文标签" />
          </Form.Item>
          <MinusCircleOutlined onClick={() => remove(field.name)} />
        </Space>
      ))}
      <Button onClick={() => add()} icon={<PlusOutlined />}>
        添加字段
      </Button>
    </>
  )}
</Form.List>
```

### 2.4 商品列表
```typescript
items: {
  enabled: boolean
  showHeader: boolean
  headerText: MultiLangText
  showAttributes: boolean      // 显示属性（大杯/中杯）
  showAddons: boolean          // 显示加料（加珍珠）
  showNotes: boolean           // 显示备注
  fontSize: 'medium' | 'large'
  spacing: number
}
```

## 3. Footer (底部配置)

### 3.1 金额汇总
```typescript
summary: {
  enabled: boolean
  showSubtotal?: boolean
  showDiscount?: boolean
  showTax?: boolean
  showTotal: boolean           // 必须显示
  fontSize: 'large' | 'xlarge'
  spacing: number
}
```

### 3.2 二维码
```typescript
qrcode?: {
  enabled: boolean
  title?: MultiLangText
  size: number                 // 120, 160, 200
  alignment: 'center'
  spacing: number
}
```

### 3.3 自定义消息
```typescript
customMessage?: MultiLangText  // { 'zh-CN': '感谢惠顾', 'en': 'Thank you', 'zh-TW': '感謝惠顧' }
```

### 3.4 底部间距
```typescript
spacing: number                // 0-5
```

## 4. Style (样式配置)

```typescript
style: {
  lineSpacing: number          // 0.8 ~ 2.5
  feedLines: number            // 2 ~ 5
  cutPaper: boolean
}
```

**表单定义**：
```tsx
<Form.Item name={['config', 'style', 'lineSpacing']} label="行间距">
  <InputNumber min={0.8} max={2.5} step={0.1} />
</Form.Item>
<Form.Item name={['config', 'style', 'feedLines']} label="走纸行数">
  <InputNumber min={2} max={5} />
</Form.Item>
<Form.Item name={['config', 'style', 'cutPaper']} valuePropName="checked" label="自动切纸">
  <Switch />
</Form.Item>
```

## 完整表单路径映射

| 配置项 | Form.Item name 路径 | 类型 | 默认值 |
|--------|-------------------|------|--------|
| Logo启用 | `['config', 'header', 'logo', 'enabled']` | boolean | false |
| Logo对齐 | `['config', 'header', 'logo', 'alignment']` | string | 'center' |
| 店铺名称启用 | `['config', 'header', 'storeName', 'enabled']` | boolean | true |
| 店铺名称文本 | `['config', 'header', 'storeName', 'text']` | string | '' |
| 店铺名称字体 | `['config', 'header', 'storeName', 'fontSize']` | string | 'xlarge' |
| 店铺名称加粗 | `['config', 'header', 'storeName', 'bold']` | boolean | true |
| 店铺名称间距 | `['config', 'header', 'storeName', 'spacing']` | number | 1 |
| 分隔符启用 | `['config', 'header', 'separator', 'enabled']` | boolean | true |
| 分隔符字符 | `['config', 'header', 'separator', 'char']` | string | '=' |
| 订单号启用 | `['config', 'body', 'orderNumber', 'enabled']` | boolean | true |
| 订单号标签中文 | `['config', 'body', 'orderNumber', 'label', 'zh-CN']` | string | '订单号' |
| 订单号字体 | `['config', 'body', 'orderNumber', 'fontSize']` | string | 'xxlarge' |
| 商品列表启用 | `['config', 'body', 'items', 'enabled']` | boolean | true |
| 显示属性 | `['config', 'body', 'items', 'showAttributes']` | boolean | true |
| 显示加料 | `['config', 'body', 'items', 'showAddons']` | boolean | true |
| 显示备注 | `['config', 'body', 'items', 'showNotes']` | boolean | true |
| 金额汇总启用 | `['config', 'footer', 'summary', 'enabled']` | boolean | true |
| 显示小计 | `['config', 'footer', 'summary', 'showSubtotal']` | boolean | true |
| 显示折扣 | `['config', 'footer', 'summary', 'showDiscount']` | boolean | true |
| 二维码启用 | `['config', 'footer', 'qrcode', 'enabled']` | boolean | true |
| 二维码尺寸 | `['config', 'footer', 'qrcode', 'size']` | number | 120 |
| 行间距 | `['config', 'style', 'lineSpacing']` | number | 1.2 |
| 走纸行数 | `['config', 'style', 'feedLines']` | number | 3 |
| 自动切纸 | `['config', 'style', 'cutPaper']` | boolean | true |
