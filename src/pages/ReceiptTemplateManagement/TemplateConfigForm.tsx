import React from 'react'
import { Form, Input, Switch, Select, InputNumber, Space, Button, Divider } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { FormInstance } from 'antd'

interface TemplateConfigFormProps {
  form: FormInstance
}

const TemplateConfigForm: React.FC<TemplateConfigFormProps> = () => {
  const { t } = useTranslation()

  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0 8px' }}>
      {/* 头部配置 */}
      <Divider orientation="left">{t('pages.receiptTemplate.headerConfig')}</Divider>

      {/* Logo */}
      <Form.Item label={t('pages.receiptTemplate.logo')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'header', 'logo', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.header?.logo?.enabled !== currentValues.config?.header?.logo?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'header', 'logo', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'header', 'logo', 'imageUrl']} label={t('pages.receiptTemplate.logoUrl')}>
                    <Input placeholder="https://example.com/logo.png" />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'logo', 'alignment']} label={t('pages.receiptTemplate.alignment')}>
                    <Select>
                      <Select.Option value="left">{t('pages.receiptTemplate.left')}</Select.Option>
                      <Select.Option value="center">{t('pages.receiptTemplate.center')}</Select.Option>
                      <Select.Option value="right">{t('pages.receiptTemplate.right')}</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 店铺名称 */}
      <Form.Item label={t('pages.receiptTemplate.storeName')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'header', 'storeName', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.header?.storeName?.enabled !== currentValues.config?.header?.storeName?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'header', 'storeName', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'header', 'storeName', 'text']} label={t('pages.receiptTemplate.storeNameText')}>
                    <Input placeholder={t('pages.receiptTemplate.storeNamePlaceholder')} />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeName', 'fontSize']} label={t('pages.receiptTemplate.fontSize')}>
                    <Select>
                      <Select.Option value="large">大</Select.Option>
                      <Select.Option value="xlarge">特大</Select.Option>
                      <Select.Option value="xxlarge">超大</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeName', 'spacing']} label="上下间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeName', 'bold']} valuePropName="checked" label={t('pages.receiptTemplate.bold')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeName', 'alignment']} label={t('pages.receiptTemplate.alignment')}>
                    <Select>
                      <Select.Option value="left">{t('pages.receiptTemplate.left')}</Select.Option>
                      <Select.Option value="center">{t('pages.receiptTemplate.center')}</Select.Option>
                      <Select.Option value="right">{t('pages.receiptTemplate.right')}</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 分隔符 */}
      <Form.Item label="分隔符" style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'header', 'separator', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.header?.separator?.enabled !== currentValues.config?.header?.separator?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'header', 'separator', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'header', 'separator', 'char']} label="分隔符字符">
                    <Select>
                      <Select.Option value="=">等号 (=)</Select.Option>
                      <Select.Option value="- - - - -">破折号 (- - - - -)</Select.Option>
                      <Select.Option value="╌╌╌╌╌╌╌">装饰线 (╌╌╌╌╌╌╌)</Select.Option>
                      <Select.Option value="">无</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'separator', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 店铺信息 */}
      <Form.Item label={t('pages.receiptTemplate.storeInfo')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'header', 'storeInfo', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.header?.storeInfo?.enabled !== currentValues.config?.header?.storeInfo?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'header', 'storeInfo', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'header', 'storeInfo', 'showAddress']} valuePropName="checked" label={t('pages.receiptTemplate.showAddress')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeInfo', 'showPhone']} valuePropName="checked" label={t('pages.receiptTemplate.showPhone')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeInfo', 'fontSize']} label="字体大小">
                    <Select>
                      <Select.Option value="small">小</Select.Option>
                      <Select.Option value="medium">中</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'header', 'storeInfo', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 正文配置 */}
      <Divider orientation="left">{t('pages.receiptTemplate.bodyConfig')}</Divider>

      {/* 订单号 */}
      <Form.Item label="订单号" style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'body', 'orderNumber', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.body?.orderNumber?.enabled !== currentValues.config?.body?.orderNumber?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'body', 'orderNumber', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'body', 'orderNumber', 'label', 'zh-CN']} label="标签(中文)">
                    <Input placeholder="订单号" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'orderNumber', 'label', 'en']} label="标签(英文)">
                    <Input placeholder="Order #" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'orderNumber', 'label', 'zh-TW']} label="标签(繁体)">
                    <Input placeholder="訂單號" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'orderNumber', 'fontSize']} label="字体大小">
                    <Select>
                      <Select.Option value="xlarge">特大</Select.Option>
                      <Select.Option value="xxlarge">超大</Select.Option>
                      <Select.Option value="xxxlarge">巨大</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'orderNumber', 'bold']} valuePropName="checked" label="加粗">
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'orderNumber', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 客户姓名 */}
      <Form.Item label="客户姓名" style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'body', 'customerName', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.body?.customerName?.enabled !== currentValues.config?.body?.customerName?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'body', 'customerName', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'body', 'customerName', 'label', 'zh-CN']} label="标签(中文)">
                    <Input placeholder="取餐名" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'customerName', 'label', 'en']} label="标签(英文)">
                    <Input placeholder="Name" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'customerName', 'label', 'zh-TW']} label="标签(繁体)">
                    <Input placeholder="取餐名" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'customerName', 'fontSize']} label="字体大小">
                    <Select>
                      <Select.Option value="large">大</Select.Option>
                      <Select.Option value="xlarge">特大</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'customerName', 'bold']} valuePropName="checked" label="加粗">
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'customerName', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 订单信息 */}
      <Form.Item label={t('pages.receiptTemplate.orderInfo')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'body', 'orderInfo', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.body?.orderInfo?.enabled !== currentValues.config?.body?.orderInfo?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'body', 'orderInfo', 'enabled']) ? (
                <Form.List name={['config', 'body', 'orderInfo', 'fields']}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div key={field.key} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Form.Item {...field} name={[field.name, 'field']} label="字段名">
                              <Select>
                                <Select.Option value="orderType">订单类型</Select.Option>
                                <Select.Option value="tableNumber">桌号</Select.Option>
                                <Select.Option value="createdAt">时间</Select.Option>
                                <Select.Option value="customerPhone">客户电话</Select.Option>
                              </Select>
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'label', 'zh-CN']} label="标签(中文)">
                              <Input placeholder="桌号" />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'label', 'en']} label="标签(英文)">
                              <Input placeholder="Table" />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'label', 'zh-TW']} label="标签(繁体)">
                              <Input placeholder="桌號" />
                            </Form.Item>
                            <Space>
                              <Form.Item {...field} name={[field.name, 'enabled']} valuePropName="checked" label="启用">
                                <Switch />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, 'fontSize']} label="字体">
                                <Select style={{ width: 100 }}>
                                  <Select.Option value="small">小</Select.Option>
                                  <Select.Option value="medium">中</Select.Option>
                                  <Select.Option value="large">大</Select.Option>
                                </Select>
                              </Form.Item>
                              <Button danger size="small" onClick={() => remove(field.name)} icon={<MinusCircleOutlined />}>
                                删除
                              </Button>
                            </Space>
                          </Space>
                        </div>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          {t('pages.receiptTemplate.addField')}
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 商品明细 */}
      <Form.Item label={t('pages.receiptTemplate.items')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'body', 'items', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.body?.items?.enabled !== currentValues.config?.body?.items?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'body', 'items', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'body', 'items', 'showHeader']} valuePropName="checked" label={t('pages.receiptTemplate.showHeader')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'headerText']} label={t('pages.receiptTemplate.headerText')}>
                    <Input placeholder={t('pages.receiptTemplate.headerTextPlaceholder')} />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'showAttributes']} valuePropName="checked" label={t('pages.receiptTemplate.showAttributes')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'showAddons']} valuePropName="checked" label={t('pages.receiptTemplate.showAddons')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'showNotes']} valuePropName="checked" label={t('pages.receiptTemplate.showNotes')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'headerText', 'zh-CN']} label="标题(中文)">
                    <Input placeholder="商品明细" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'headerText', 'en']} label="标题(英文)">
                    <Input placeholder="Items" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'headerText', 'zh-TW']} label="标题(繁体)">
                    <Input placeholder="商品明細" />
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'fontSize']} label="字体大小">
                    <Select>
                      <Select.Option value="medium">中</Select.Option>
                      <Select.Option value="large">大</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'body', 'items', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 底部配置 */}
      <Divider orientation="left">{t('pages.receiptTemplate.footerConfig')}</Divider>

      {/* 汇总信息 */}
      <Form.Item label={t('pages.receiptTemplate.summary')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'footer', 'summary', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.footer?.summary?.enabled !== currentValues.config?.footer?.summary?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'footer', 'summary', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'footer', 'summary', 'showSubtotal']} valuePropName="checked" label={t('pages.receiptTemplate.showSubtotal')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'summary', 'showDiscount']} valuePropName="checked" label={t('pages.receiptTemplate.showDiscount')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'summary', 'showTax']} valuePropName="checked" label={t('pages.receiptTemplate.showTax')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'summary', 'showTotal']} valuePropName="checked" label={t('pages.receiptTemplate.showTotal')}>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'summary', 'fontSize']} label="字体大小">
                    <Select>
                      <Select.Option value="large">大</Select.Option>
                      <Select.Option value="xlarge">特大</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'summary', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 二维码 */}
      <Form.Item label={t('pages.receiptTemplate.qrcode')} style={{ marginBottom: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={['config', 'footer', 'qrcode', 'enabled']} valuePropName="checked" noStyle>
            <Switch checkedChildren={t('pages.receiptTemplate.enabled')} unCheckedChildren={t('pages.receiptTemplate.disabled')} />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.config?.footer?.qrcode?.enabled !== currentValues.config?.footer?.qrcode?.enabled
            }
          >
            {({ getFieldValue }) =>
              getFieldValue(['config', 'footer', 'qrcode', 'enabled']) ? (
                <>
                  <Form.Item name={['config', 'footer', 'qrcode', 'title', 'zh-CN']} label="标题(中文)">
                    <Input placeholder="扫码查看订单" />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'qrcode', 'title', 'en']} label="标题(英文)">
                    <Input placeholder="Scan for Order" />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'qrcode', 'title', 'zh-TW']} label="标题(繁体)">
                    <Input placeholder="掃碼查看訂單" />
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'qrcode', 'size']} label="尺寸(像素)">
                    <Select>
                      <Select.Option value={120}>120px</Select.Option>
                      <Select.Option value={160}>160px</Select.Option>
                      <Select.Option value={200}>200px</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name={['config', 'footer', 'qrcode', 'spacing']} label="间距">
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Space>
      </Form.Item>

      {/* 自定义消息 */}
      <Form.Item name={['config', 'footer', 'customMessage', 'zh-CN']} label="自定义消息(中文)">
        <Input.TextArea rows={2} placeholder="感谢惠顾，欢迎再次光临" />
      </Form.Item>
      <Form.Item name={['config', 'footer', 'customMessage', 'en']} label="自定义消息(英文)">
        <Input.TextArea rows={2} placeholder="Thank you, welcome back" />
      </Form.Item>
      <Form.Item name={['config', 'footer', 'customMessage', 'zh-TW']} label="自定义消息(繁体)">
        <Input.TextArea rows={2} placeholder="感謝惠顧，歡迎再次光臨" />
      </Form.Item>
      <Form.Item name={['config', 'footer', 'spacing']} label="底部间距">
        <InputNumber min={0} max={5} style={{ width: '100%' }} />
      </Form.Item>

      {/* 样式配置 */}
      <Divider orientation="left">{t('pages.receiptTemplate.styleConfig')}</Divider>

      <Form.Item name={['config', 'style', 'lineSpacing']} label="行间距倍数">
        <InputNumber min={0.8} max={2.5} step={0.1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['config', 'style', 'feedLines']} label="走纸行数">
        <InputNumber min={2} max={5} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['config', 'style', 'cutPaper']} valuePropName="checked" label={t('pages.receiptTemplate.cutPaper')}>
        <Switch />
      </Form.Item>
    </div>
  )
}

export default TemplateConfigForm
