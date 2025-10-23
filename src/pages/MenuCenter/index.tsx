import React, { useEffect, useMemo, useState } from 'react'
import './index.css' // 添加样式文件
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  List, 
  Input, 
  Select, 
  Form, 
  Empty, 
  Row, 
  Col, 
  Divider, 
  message,
  Modal,
  Tag,
  Spin,
  InputNumber,
  Popconfirm,
  Switch,
  Tree,
  Dropdown,
  MenuProps,
  Tooltip,
  Table,
  Tabs
} from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../auth/AuthProvider'
import { debugOrganizationIsolation } from '../../utils/debug-org'
import { getJWTInfo, checkJWTOrganizationInfo } from '../../utils/jwt-utils'
import { 
  itemManagementService,
  type Item as APIItem,
  type Category as APICategory,
  type CreateItemPayload,
  type UpdateItemPayload,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  type ItemAttributeType,
  type ItemAttributeOption,
  type ItemAttribute,
  type CreateItemAttributeTypePayload,
  type CreateItemAttributeOptionPayload,
  type Addon,
  type ItemAddon,
  type CreateAddonPayload,
  type UpdateAddonPayload,
  type CreateItemAddonPayload,
  type Combo,
  type ComboItem,
  type CreateComboPayload,
  type UpdateComboPayload,
  type CreateComboItemPayload
} from '../../services/item-management'

// 为了兼容现有的UI，保留本地的接口定义
type ID = string

interface Category extends APICategory {
  // 继承API Category类型
}

// 商品属性值接口（用于前端表单）
interface ItemAttributeValue {
  attributeTypeId: string
  value: any
}

// 商品属性关联配置（用于前端表单）
interface ItemAttributeConfig {
  attributeTypeId: string
  isRequired: boolean
  optionOverrides?: Record<string, { priceModifier: number }>
  allowedOptions?: string[] // 允许的选项ID列表，用于选项过滤
  defaultOptionId?: string // 商品级默认选项
  optionOrder?: string[] // 选项显示顺序
}

interface Item extends APIItem {
  // 继承API Item类型
  attributes?: ItemAttribute[]
  attributeValues?: ItemAttributeValue[] // 用于存储属性值
  attributeConfigs?: ItemAttributeConfig[] // 用于存储属性配置
}

// 层级分类接口
interface HierarchicalCategory extends Category {
  children?: HierarchicalCategory[]
  level?: number
}

// 商品加料配置组件
const ItemAddonConfigInput: React.FC<{
  value?: ItemAddon[];
  onChange?: (value: ItemAddon[]) => void;
  addons: Addon[];
  t: any;
}> = ({ value = [], onChange, addons, t }) => {
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    value.map(item => item.addonId) || []
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    value.reduce((acc, item) => ({ ...acc, [item.addonId]: item.maxQuantity }), {})
  );

  useEffect(() => {
    setSelectedAddonIds(value.map(item => item.addonId) || []);
    setQuantities(value.reduce((acc, item) => ({ ...acc, [item.addonId]: item.maxQuantity }), {}));
  }, [value]);

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    let newSelectedIds: string[];
    let newQuantities = { ...quantities };

    if (checked) {
      newSelectedIds = [...selectedAddonIds, addonId];
      newQuantities[addonId] = 1; // 默认数量为1
    } else {
      newSelectedIds = selectedAddonIds.filter(id => id !== addonId);
      delete newQuantities[addonId];
    }

    setSelectedAddonIds(newSelectedIds);
    setQuantities(newQuantities);

    // 构建新的配置数组
    const newConfigs: ItemAddon[] = newSelectedIds.map(id => {
      const addon = addons.find(a => a.id === id);
      return {
        id: '', // 将在保存时由后端生成
        itemId: '', // 将在保存时设置
        addonId: id,
        maxQuantity: newQuantities[id] || 1,
        addon: addon
      };
    });

    onChange?.(newConfigs);
  };

  const handleQuantityChange = (addonId: string, quantity: number) => {
    const newQuantities = { ...quantities, [addonId]: quantity };
    setQuantities(newQuantities);

    // 更新配置
    const newConfigs: ItemAddon[] = selectedAddonIds.map(id => {
      const addon = addons.find(a => a.id === id);
      return {
        id: '', // 将在保存时由后端生成
        itemId: '', // 将在保存时设置
        addonId: id,
        maxQuantity: newQuantities[id] || 1,
        addon: addon
      };
    });

    onChange?.(newConfigs);
  };

  const activeAddons = addons.filter(addon => addon.isActive);

  return (
    <div>
      <Typography.Text strong style={{ marginBottom: 16, display: 'block' }}>
        {t('pages.menuCenter.selectModifiers')}
      </Typography.Text>
      
      {activeAddons.length === 0 ? (
        <Typography.Text type="secondary">{t('pages.menuCenter.noModifiersAvailable')}</Typography.Text>
      ) : (
        <Row gutter={[12, 12]}>
          {activeAddons.map(addon => {
            const isSelected = selectedAddonIds.includes(addon.id);
            return (
              <Col key={addon.id} xs={24} sm={12} md={8} lg={6}>
                <Card 
                  size="small"
                  style={{ 
                    border: isSelected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                    backgroundColor: isSelected ? '#f6ffed' : '#fff',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        size="small"
                        checked={isSelected}
                        onChange={(checked) => handleAddonToggle(addon.id, checked)}
                      />
                      <Typography.Text strong style={{ fontSize: '14px' }}>
                        {addon.name}
                      </Typography.Text>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ${(Number(addon.price) || 0).toFixed(2)}
                    </div>
                    
                    {addon.description && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#999', 
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {addon.description}
                      </div>
                    )}
                    
                    {isSelected && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        marginTop: 4,
                        paddingTop: 8,
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <Typography.Text style={{ fontSize: '11px', color: '#666' }}>
                          {t('pages.menuCenter.maxQuantity')}
                        </Typography.Text>
                        <InputNumber
                          size="small"
                          min={1}
                          max={10}
                          value={quantities[addon.id] || 1}
                          onChange={(value) => handleQuantityChange(addon.id, value || 1)}
                          style={{ width: 50 }}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

// Combo子商品配置组件
const ComboItemsInput: React.FC<{
  value?: CreateComboItemPayload[];
  onChange?: (value: CreateComboItemPayload[]) => void;
  allItems: Item[];
  onPriceChange?: (totalPrice: number) => void;
  t: any;
}> = ({ value = [], onChange, allItems, onPriceChange, t }) => {
  const [selectedItems, setSelectedItems] = useState<CreateComboItemPayload[]>(value);

  useEffect(() => {
    setSelectedItems(value || []);
  }, [value]);

  // 计算总价
  const calculateTotalPrice = (items: CreateComboItemPayload[]) => {
    let total = 0;
    items.forEach(comboItem => {
      const item = allItems.find(i => i.id === comboItem.itemId);
      if (item) {
        total += (Number(item.basePrice) || 0) * (comboItem.quantity || 1);
      }
    });
    return total;
  };

  // 当商品列表变化时,通知父组件价格变化
  useEffect(() => {
    const totalPrice = calculateTotalPrice(selectedItems);
    onPriceChange?.(totalPrice);
  }, [selectedItems, allItems]);

  const handleAddItem = (itemId: string) => {
    const existingItem = selectedItems.find(item => item.itemId === itemId);
    if (existingItem) {
      message.warning(t('pages.menuCenter.itemAlreadyAdded'));
      return;
    }

    const newItem: CreateComboItemPayload = {
      itemId,
      quantity: 1,
      isRequired: true,
      sortOrder: selectedItems.length
    };

    const newSelectedItems = [...selectedItems, newItem];
    setSelectedItems(newSelectedItems);
    onChange?.(newSelectedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const newSelectedItems = selectedItems.filter(item => item.itemId !== itemId);
    // 重新排序
    const reorderedItems = newSelectedItems.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    setSelectedItems(reorderedItems);
    onChange?.(reorderedItems);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<CreateComboItemPayload>) => {
    const newSelectedItems = selectedItems.map(item =>
      item.itemId === itemId ? { ...item, ...updates } : item
    );
    setSelectedItems(newSelectedItems);
    onChange?.(newSelectedItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSelectedItems = [...selectedItems];
    [newSelectedItems[index], newSelectedItems[index - 1]] = [newSelectedItems[index - 1], newSelectedItems[index]];
    // 更新sortOrder
    const reorderedItems = newSelectedItems.map((item, idx) => ({
      ...item,
      sortOrder: idx
    }));
    setSelectedItems(reorderedItems);
    onChange?.(reorderedItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedItems.length - 1) return;
    const newSelectedItems = [...selectedItems];
    [newSelectedItems[index], newSelectedItems[index + 1]] = [newSelectedItems[index + 1], newSelectedItems[index]];
    // 更新sortOrder
    const reorderedItems = newSelectedItems.map((item, idx) => ({
      ...item,
      sortOrder: idx
    }));
    setSelectedItems(reorderedItems);
    onChange?.(reorderedItems);
  };

  const availableItems = allItems.filter(item => 
    !selectedItems.some(selected => selected.itemId === item.id)
  );

  return (
    <div>
      <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
        {t('pages.menuCenter.selectComboItems')}
      </Typography.Text>

      {/* 添加商品选择器 */}
      <Select
        style={{ width: '100%', marginBottom: 16 }}
        placeholder={t('pages.menuCenter.selectItemToAdd')}
        onSelect={(itemId) => {
          if (itemId) handleAddItem(itemId as string);
        }}
        value={undefined}
        showSearch
        filterOption={(input, option) => {
          const children = option?.children;
          if (typeof children === 'string') {
            return (children as string).toLowerCase().includes(input.toLowerCase());
          }
          return false;
        }}
      >
        {availableItems.map(item => (
          <Select.Option key={item.id} value={item.id}>
            {item.name} - ${(Number(item.basePrice) || 0).toFixed(2)}
          </Select.Option>
        ))}
      </Select>

      {/* 已选商品列表 */}
      {selectedItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#fafafa',
          borderRadius: '6px',
          border: '1px dashed #d9d9d9'
        }}>
          <Typography.Text type="secondary">
            {t('pages.menuCenter.noItemsInCombo')}
          </Typography.Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedItems.map((comboItem, index) => {
            const item = allItems.find(i => i.id === comboItem.itemId);
            if (!item) return null;

            return (
              <Card key={comboItem.itemId} size="small" style={{ border: '1px solid #d9d9d9' }}>
                <Row gutter={16} align="middle">
                  <Col span={8}>
                    <Typography.Text strong>{item.name}</Typography.Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ${(Number(item.basePrice) || 0).toFixed(2)}
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>{t('pages.menuCenter.quantity')}</div>
                    <InputNumber
                      size="small"
                      min={1}
                      max={10}
                      value={comboItem.quantity}
                      onChange={(val) => handleUpdateItem(comboItem.itemId, { quantity: val || 1 })}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={4}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>{t('pages.menuCenter.required')}</div>
                    <Switch
                      size="small"
                      checked={comboItem.isRequired}
                      onChange={(checked) => handleUpdateItem(comboItem.itemId, { isRequired: checked })}
                    />
                  </Col>
                  <Col span={4}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>{t('pages.menuCenter.sortOrder')}</div>
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === selectedItems.length - 1}
                        onClick={() => handleMoveDown(index)}
                      />
                    </Space>
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(comboItem.itemId)}
                    >
                      {t('pages.menuCenter.remove')}
                    </Button>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 商品属性配置组件
const ItemAttributeConfigInput: React.FC<{
  value?: ItemAttributeConfig[];
  onChange?: (value: ItemAttributeConfig[]) => void;
  attributeTypes: ItemAttributeType[];
  attributeOptions: Record<string, ItemAttributeOption[]>;
  t: any;
}> = ({ value = [], onChange, attributeTypes, attributeOptions, t }) => {
  const [configs, setConfigs] = useState<ItemAttributeConfig[]>(value);

  useEffect(() => {
    setConfigs(value || []);
  }, [value]);

  const handleConfigChange = (newConfigs: ItemAttributeConfig[]) => {
    setConfigs(newConfigs);
    onChange?.(newConfigs);
  };

  const addAttributeType = (attributeTypeId: string) => {
    // 获取该属性类型的所有选项
    const allOptions = attributeOptions[attributeTypeId] || [];
    const allOptionIds = allOptions.map(opt => opt.id);
    
    const newConfigs = [...configs, {
      attributeTypeId,
      isRequired: false,
      optionOverrides: {},
      allowedOptions: allOptionIds, // 默认选中所有选项
      defaultOptionId: undefined, // 默认无默认选项
      optionOrder: allOptionIds // 按创建顺序排列
    }];
    handleConfigChange(newConfigs);
  };

  const removeAttributeType = (attributeTypeId: string) => {
    const newConfigs = configs.filter(config => config.attributeTypeId !== attributeTypeId);
    handleConfigChange(newConfigs);
  };

  const updateConfig = (attributeTypeId: string, updates: Partial<ItemAttributeConfig>) => {
    const newConfigs = configs.map(config => 
      config.attributeTypeId === attributeTypeId 
        ? { ...config, ...updates }
        : config
    );
    handleConfigChange(newConfigs);
  };

  const updateOptionOverride = (attributeTypeId: string, optionId: string, priceModifier: number) => {
    const config = configs.find(c => c.attributeTypeId === attributeTypeId);
    if (config) {
      const newOverrides = { ...config.optionOverrides };
      if (priceModifier === 0) {
        delete newOverrides[optionId];
      } else {
        newOverrides[optionId] = { priceModifier };
      }
      updateConfig(attributeTypeId, { optionOverrides: newOverrides });
    }
  };

  const availableTypes = attributeTypes.filter(type => 
    !configs.some(config => config.attributeTypeId === type.id)
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>{t('pages.menuCenter.linkAttributeTypes')}</Typography.Text>
        {availableTypes.length > 0 ? (
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder={t('pages.menuCenter.selectAttributeTypePlaceholder')}
            onSelect={(value: string | undefined) => value && addAttributeType(value)}
            value={undefined}
            size="large"
          >
            {availableTypes.map(type => (
              <Select.Option key={type.id} value={type.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '16px' }}>🏷️</span>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{type.displayName}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        ) : (
          <div style={{ 
            marginTop: 8, 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <Typography.Text type="secondary">
              {t('pages.menuCenter.allAttributeTypesLinked')}
            </Typography.Text>
          </div>
        )}
      </div>

      {configs.map(config => {
        const attributeType = attributeTypes.find(type => type.id === config.attributeTypeId);
        if (!attributeType) return null;

        return (
          <Card 
            key={config.attributeTypeId} 
            size="small" 
            style={{ marginBottom: 12, border: '2px solid #1890ff' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                    🏷️ {attributeType.displayName}
                  </Typography.Title>
                  <Tag color="blue">{t('pages.menuCenter.attributeType')}</Tag>
                </div>
                <Button 
                  type="text" 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeAttributeType(config.attributeTypeId)}
                >
                  {t('pages.menuCenter.remove')}
                </Button>
              </div>
            }
          >
            
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text>{t('pages.menuCenter.isRequired')}</Typography.Text>
                <Switch 
                  checked={config.isRequired}
                  onChange={(checked) => updateConfig(config.attributeTypeId, { isRequired: checked })}
                  checkedChildren={t('pages.menuCenter.required')}
                  unCheckedChildren={t('pages.menuCenter.optional')}
                />
              </Col>
            </Row>

            {/* 选项选择区域 */}
            <div style={{ marginTop: 12 }}>
              <Typography.Text strong>{t('pages.menuCenter.optionSelection')}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                {t('pages.menuCenter.optionSelectionTip')}
              </Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder={t('pages.menuCenter.selectOptionsPlaceholder')}
                  value={config.allowedOptions || []}
                  onChange={(values) => updateConfig(config.attributeTypeId, { allowedOptions: values })}
                  allowClear
                >
                  {(attributeOptions[attributeType.id] || []).map(option => (
                    <Select.Option key={option.id} value={option.id}>
                      {option.displayName}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* 选项配置表格 */}
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>{t('pages.menuCenter.optionConfig')}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                {t('pages.menuCenter.optionConfigTip')}
              </Typography.Text>
                  
                  <Table
                    size="small"
                    style={{ marginTop: 12 }}
                    dataSource={(() => {
                      // 获取过滤后的选项
                      const filteredOptions = (attributeOptions[attributeType.id] || [])
                        .filter(option => 
                          !config.allowedOptions || 
                          config.allowedOptions.length === 0 || 
                          config.allowedOptions.includes(option.id)
                        );
                      
                      // 根据 optionOrder 进行排序
                      if (config.optionOrder && config.optionOrder.length > 0) {
                        const orderMap = new Map(config.optionOrder.map((id, index) => [id, index]));
                        return filteredOptions
                          .sort((a, b) => {
                            const orderA = orderMap.get(a.id) ?? 999;
                            const orderB = orderMap.get(b.id) ?? 999;
                            return orderA - orderB;
                          })
                          .map((option, index) => ({
                            ...option,
                            key: option.id,
                            sortIndex: index
                          }));
                      }
                      
                      // 默认按创建顺序
                      return filteredOptions.map((option, index) => ({
                        ...option,
                        key: option.id,
                        sortIndex: index
                      }));
                    })()}
                    pagination={false}
                    bordered
                    scroll={{ x: 750 }}
                    columns={[
                      {
                        title: t('pages.menuCenter.optionName'),
                        dataIndex: 'displayName',
                        width: 120,
                        render: (text: string) => (
                          <Typography.Text strong>{text}</Typography.Text>
                        )
                      },
                      {
                        title: t('pages.menuCenter.default'),
                        key: 'default',
                        width: 80,
                        render: (_, record: any) => {
                          const isAllowed = !config.allowedOptions || config.allowedOptions.length === 0 || config.allowedOptions.includes(record.id);
                          const isDefault = config.defaultOptionId === record.id;
                          return (
                            <Switch
                              size="small"
                              checked={isDefault}
                              disabled={!isAllowed}
                              onChange={(checked) => {
                                updateConfig(config.attributeTypeId, { 
                                  defaultOptionId: checked ? record.id : undefined 
                                });
                              }}
                            />
                          );
                        }
                      },
                      {
                        title: (
                          <div>
                            <div>{t('pages.menuCenter.sort')}</div>
                            <div style={{ fontSize: '10px', color: '#999', fontWeight: 'normal' }}>
                              {t('pages.menuCenter.sortTip')}
                            </div>
                          </div>
                        ),
                        key: 'sort',
                        width: 100,
                        render: (_, _record: any, index: number) => {
                          const dataSource = (() => {
                            const filteredOptions = (attributeOptions[attributeType.id] || [])
                              .filter(option => 
                                !config.allowedOptions || 
                                config.allowedOptions.length === 0 || 
                                config.allowedOptions.includes(option.id)
                              );
                            
                            if (config.optionOrder && config.optionOrder.length > 0) {
                              const orderMap = new Map(config.optionOrder.map((id, idx) => [id, idx]));
                              return filteredOptions.sort((a, b) => {
                                const orderA = orderMap.get(a.id) ?? 999;
                                const orderB = orderMap.get(b.id) ?? 999;
                                return orderA - orderB;
                              });
                            }
                            return filteredOptions;
                          })();
                          
                          const moveUp = () => {
                            if (index === 0) return;
                            const newOrder = dataSource.map(opt => opt.id);
                            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                            updateConfig(config.attributeTypeId, { optionOrder: newOrder });
                          };
                          
                          const moveDown = () => {
                            if (index === dataSource.length - 1) return;
                            const newOrder = dataSource.map(opt => opt.id);
                            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                            updateConfig(config.attributeTypeId, { optionOrder: newOrder });
                          };
                          
                          return (
                            <Space>
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowUpOutlined />}
                                disabled={index === 0}
                                onClick={moveUp}
                                title={t('pages.menuCenter.moveUp')}
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined />}
                                disabled={index === dataSource.length - 1}
                                onClick={moveDown}
                                title={t('pages.menuCenter.moveDown')}
                              />
                            </Space>
                          );
                        }
                      },
                      {
                        title: t('pages.menuCenter.presetPrice'),
                        key: 'originalPrice',
                        width: 100,
                        render: (_, record: any) => (
                          <Typography.Text type="secondary">
                            ${(Number(record.priceModifier) || 0).toFixed(2)}
                          </Typography.Text>
                        )
                      },
                      {
                        title: t('pages.menuCenter.overridePrice'),
                        key: 'price',
                        width: 120,
                        render: (_, record: any) => {
                          const isAllowed = !config.allowedOptions || config.allowedOptions.length === 0 || config.allowedOptions.includes(record.id);
                          const override = config.optionOverrides?.[record.id];
                          return (
                            <InputNumber
                              size="small"
                              style={{ width: '100%' }}
                              placeholder={t('pages.menuCenter.setPricePlaceholder')}
                              value={override?.priceModifier}
                              onChange={(val) => updateOptionOverride(config.attributeTypeId, record.id, val || 0)}
                              precision={2}
                              disabled={!isAllowed}
                              addonBefore="$"
                            />
                          );
                        }
                      },
                      {
                        title: t('pages.menuCenter.action'),
                        key: 'action',
                        width: 60,
                        render: (_, record: any) => {
                          const currentAllowed = config.allowedOptions || [];
                          const isOnlyOption = currentAllowed.length <= 1;
                          
                          return (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              disabled={isOnlyOption}
                              title={isOnlyOption ? t('pages.menuCenter.minOneOption') : t('pages.menuCenter.removeOption')}
                              onClick={() => {
                                const newAllowed = currentAllowed.filter(id => id !== record.id);
                                const newOrder = (config.optionOrder || []).filter(id => id !== record.id);
                                let updates: Partial<ItemAttributeConfig> = { 
                                  allowedOptions: newAllowed,
                                  optionOrder: newOrder
                                };
                                
                                // 如果删除的是默认选项，则清除默认选项设置
                                if (config.defaultOptionId === record.id) {
                                  updates.defaultOptionId = undefined;
                                }
                                
                                // 如果删除的选项有价格覆盖，则移除该覆盖
                                if (config.optionOverrides?.[record.id]) {
                                  const newOverrides = { ...config.optionOverrides };
                                  delete newOverrides[record.id];
                                  updates.optionOverrides = newOverrides;
                                }
                                
                                updateConfig(config.attributeTypeId, updates);
                              }}
                            />
                          );
                        }
                      }
                    ]}
                  />
                  
                  {/* 空状态提示 */}
                  {(attributeOptions[attributeType.id] || [])
                    .filter(option => 
                      !config.allowedOptions || 
                      config.allowedOptions.length === 0 || 
                      config.allowedOptions.includes(option.id)
                    ).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px',
                      backgroundColor: '#fafafa',
                      borderRadius: '4px',
                      marginTop: 12
                    }}>
                      <Typography.Text type="secondary">
                        {t('pages.menuCenter.noOptionsSelected')}
                      </Typography.Text>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    <Typography.Text type="secondary">
                      {t('pages.menuCenter.optionConfigDetailTip')}
                    </Typography.Text>
                  </div>
            </div>
          </Card>
        );
      })}

      {configs.length === 0 && (
        <Typography.Text type="secondary">
          {t('pages.menuCenter.selectAttributeTypePrompt')}
        </Typography.Text>
      )}
    </div>
  );
};

// 商品属性值输入组件
const ItemAttributeValuesInput: React.FC<{
  value?: ItemAttributeValue[];
  onChange?: (value: ItemAttributeValue[]) => void;
  attributeConfigs: ItemAttributeConfig[];
  attributeTypes: ItemAttributeType[];
  attributeOptions: Record<string, ItemAttributeOption[]>;
  t: any;
}> = ({ value = [], onChange, attributeConfigs, attributeTypes, attributeOptions, t }) => {
  const [selectedAttributes, setSelectedAttributes] = useState<ItemAttributeValue[]>(value);

  useEffect(() => {
    setSelectedAttributes(value || []);
  }, [value]);

  const handleAttributeChange = (attributeTypeId: string, attributeValue: any) => {
    const newAttributes = [...selectedAttributes];
    const existingIndex = newAttributes.findIndex(attr => attr.attributeTypeId === attributeTypeId);
    
    if (existingIndex >= 0) {
      if (attributeValue === undefined || attributeValue === null || attributeValue === '') {
        // 移除属性
        newAttributes.splice(existingIndex, 1);
      } else {
        // 更新属性值
        newAttributes[existingIndex] = {
          attributeTypeId,
          value: attributeValue
        };
      }
    } else if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
      // 添加新属性
      newAttributes.push({
        attributeTypeId,
        value: attributeValue
      });
    }
    
    setSelectedAttributes(newAttributes);
    onChange?.(newAttributes);
  };

  const renderAttributeInput = (attributeType: ItemAttributeType) => {
    const currentValue = selectedAttributes.find(attr => attr.attributeTypeId === attributeType.id)?.value;
    
    // 所有属性类型都是select类型
    const allOptions = attributeOptions[attributeType.id] || [];
    
    // 实现选项过滤逻辑
    const getAvailableOptions = (attributeTypeId: string) => {
      // 查找对应的属性配置
      const config = attributeConfigs.find(c => c.attributeTypeId === attributeTypeId);
      
      // 如果没有设置 allowedOptions 或为空数组，返回所有选项
      if (!config?.allowedOptions || config.allowedOptions.length === 0) {
        return allOptions;
      }
      
      // 只返回允许的选项
      return allOptions.filter(option => 
        config.allowedOptions!.includes(option.id)
      );
    };
    
    const availableOptions = getAvailableOptions(attributeType.id);
    
    return (
      <Select
        style={{ width: '100%' }}
        placeholder={`请选择${attributeType.displayName}`}
        value={currentValue}
        onChange={(val) => handleAttributeChange(attributeType.id, val)}
        allowClear
      >
        {availableOptions.map(option => (
          <Select.Option key={option.id} value={option.value}>
            {option.displayName}
            {(Number(option.priceModifier) || 0) !== 0 && (
              <span style={{ color: '#666', fontSize: '12px' }}>
                {(Number(option.priceModifier) || 0) > 0 ? ' (+' : ' ('}
                ${Math.abs(Number(option.priceModifier) || 0).toFixed(2)})
              </span>
            )}
          </Select.Option>
        ))}
      </Select>
    );
  };

  return (
    <div>
      {attributeTypes.map(attributeType => (
        <Row key={attributeType.id} gutter={8} style={{ marginBottom: 12 }}>
          <Col span={8}>
            <Typography.Text strong>
              {attributeType.displayName}
            </Typography.Text>
          </Col>
          <Col span={16}>
            {renderAttributeInput(attributeType)}
          </Col>
        </Row>
      ))}
      
      {attributeTypes.length === 0 && (
        <Typography.Text type="secondary">
          {t('pages.menuCenter.noAttributesAvailable')}
        </Typography.Text>
      )}
    </div>
  );
};

// 价格计算工具函数
const calculateItemPrice = (item: Item, selections: Record<string, any>): number => {
  let total = item.basePrice;
  
  if (!item.attributes) return total;
  
  item.attributes.forEach(attr => {
    const selectedOptionId = selections[attr.attributeTypeId];
    if (selectedOptionId && attr.attributeType) {
      const option = attr.attributeType.options?.find(o => o.id === selectedOptionId);
      if (option) {
        // 检查是否有价格覆盖
        const override = attr.optionOverrides?.[selectedOptionId];
        const priceModifier = override?.priceModifier ?? option.priceModifier;
        total += Number(priceModifier) || 0;
      }
    }
  });
  
  return total;
};

// 获取商品可用的属性选项
const getAvailableOptions = (attribute: ItemAttribute): ItemAttributeOption[] => {
  const allOptions = attribute.attributeType?.options || [];
  
  // 如果没有设置 allowedOptions，返回所有选项
  if (!attribute.allowedOptions || attribute.allowedOptions.length === 0) {
    return allOptions;
  }
  
  // 只返回允许的选项
  return allOptions.filter(option => 
    attribute.allowedOptions!.includes(option.id)
  );
};

// 构建分类树的工具函数
const buildCategoryTree = (categories: Category[]): HierarchicalCategory[] => {
  const categoryMap = new Map<string, HierarchicalCategory>()
  const roots: HierarchicalCategory[] = []
  
  // 首先创建所有分类的映射
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [], level: 0 })
  })
  
  // 构建树形结构
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id)!
    
    if (category.parentId) {
      // 有父分类，添加到父分类的children中
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        categoryNode.level = (parent.level || 0) + 1
        parent.children = parent.children || []
        parent.children.push(categoryNode)
      } else {
        // 父分类不存在，当作根分类处理
        roots.push(categoryNode)
      }
    } else {
      // 根分类
      roots.push(categoryNode)
    }
  })
  
  return roots
}

// 扁平化分类树，用于渲染
const flattenCategoryTree = (tree: HierarchicalCategory[]): HierarchicalCategory[] => {
  const result: HierarchicalCategory[] = []
  
  const traverse = (nodes: HierarchicalCategory[]) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return result
}


const MenuCenter: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthContext()

  // 自定义加载图标
  const loadingIcon = <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />

  // 状态管理
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [allItems, setAllItems] = useState<Item[]>([]) // 所有商品,用于Combo选择
  const [selectedCategoryId, setSelectedCategoryId] = useState<ID | null>(null)
  const [attributeTypes, setAttributeTypes] = useState<ItemAttributeType[]>([])
  const [attributeOptions, setAttributeOptions] = useState<Record<string, ItemAttributeOption[]>>({})
  const [addons, setAddons] = useState<Addon[]>([])
  const [itemAddons, setItemAddons] = useState<Record<string, ItemAddon[]>>({})
  const [combos, setCombos] = useState<Combo[]>([])
  const [categoryCombos, setCategoryCombos] = useState<Combo[]>([]) // 当前分类下的套餐
  const [loading, setLoading] = useState({
    categories: false,
    items: false,
    creating: false,
    updating: false,
    attributes: false,
    combos: false
  })

  // 模态框状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [itemModalVisible, setItemModalVisible] = useState(false)
  const [attributeTypeModalVisible, setAttributeTypeModalVisible] = useState(false)
  const [attributeOptionModalVisible, setAttributeOptionModalVisible] = useState(false)
  const [addonModalVisible, setAddonModalVisible] = useState(false)
  const [comboModalVisible, setComboModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingAttributeType, setEditingAttributeType] = useState<ItemAttributeType | null>(null)
  const [editingAttributeOption, setEditingAttributeOption] = useState<ItemAttributeOption | null>(null)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [selectedAttributeTypeId, setSelectedAttributeTypeId] = useState<string | null>(null)

  // 表单
  const [catForm] = Form.useForm<{ name: string; parentId?: string }>()
  const [itemForm] = Form.useForm<{ 
    name: string; 
    description?: string; 
    categoryId?: string;
    basePrice: number; 
    cost?: number;
    isActive?: boolean;
    customFields?: any;
    attributeConfigs?: ItemAttributeConfig[];
    itemAddons?: ItemAddon[];
  }>()
  const [attributeTypeForm] = Form.useForm<CreateItemAttributeTypePayload & { options: ItemAttributeOption[] }>()
  const [attributeOptionForm] = Form.useForm<CreateItemAttributeOptionPayload>()
  const [comboForm] = Form.useForm<CreateComboPayload>()

  // 初始化数据
  
  useEffect(() => {
    console.log('🔍 [MENU CENTER] Component mounted, isAuthenticated:', isAuthenticated)
    
    if (isAuthenticated) {
      try {
        // 调试组织隔离
        debugOrganizationIsolation()
        
        // 检查JWT中的组织信息
        getJWTInfo()
        const hasOrgInfo = checkJWTOrganizationInfo()
        
        if (!hasOrgInfo) {
          console.warn('⚠️ [MENU CENTER] JWT中缺少组织信息，可能导致数据隔离失效！')
          console.warn('💡 [MENU CENTER] 建议重新登录以获取正确的JWT')
        }
        
        loadCategories()
        loadAttributeTypes()
        loadAddons()
        loadCombos()
        loadAllItems()
      } catch (error) {
        console.error('❌ [MENU CENTER] Error in useEffect:', error)
      }
    }
  }, [isAuthenticated])

  // 当选择分类时加载该分类下的商品
  useEffect(() => {
    if (selectedCategoryId && isAuthenticated) {
      loadItems()
    }
  }, [selectedCategoryId, isAuthenticated])

  // 监听组织切换事件
  useEffect(() => {
    const handleOrganizationChange = (event: CustomEvent) => {
      console.log('🔄 [MENU CENTER] Organization changed, reloading data...', event.detail)
      // 重新加载所有数据
      loadCategories()
      loadAttributeTypes()
      loadAddons()
      loadCombos()
      loadAllItems()
      if (selectedCategoryId) {
        loadItems()
      }
    }

    window.addEventListener('organizationChanged', handleOrganizationChange as EventListener)
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange as EventListener)
    }
  }, [selectedCategoryId])

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }))
    try {
      const categoryList = await itemManagementService.getCategories()
      const categories = Array.isArray(categoryList) ? categoryList : []
      setCategories(categories)
      
      // 如果有分类且没有选中的分类，默认选中第一个
      if (categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categories[0].id)
      }
      
      // 静默加载分类，不显示成功消息
    } catch (error) {
      console.error('Failed to load categories:', error)
      message.error('加载分类失败')
      setCategories([]) // 确保出错时也设置为空数组
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }

  // 加载属性类型列表
  const loadAttributeTypes = async () => {
    setLoading(prev => ({ ...prev, attributes: true }))
    try {
      const types = await itemManagementService.getAttributeTypes()
      setAttributeTypes(types)
      // 静默加载属性类型，不显示成功消息
    } catch (error) {
      console.error('Failed to load attribute types:', error)
      message.error('加载属性类型失败')
      setAttributeTypes([])
    } finally {
      setLoading(prev => ({ ...prev, attributes: false }))
    }
  }

  // 加载属性选项
  const loadAttributeOptions = async (typeId: string) => {
    try {
      const options = await itemManagementService.getAttributeOptions(typeId)
      setAttributeOptions(prev => ({
        ...prev,
        [typeId]: options
      }))
    } catch (error) {
      console.error('Failed to load attribute options:', error)
      message.error('加载属性选项失败')
    }
  }

  // 加载加料列表
  const loadAddons = async () => {
    try {
      const addonList = await itemManagementService.getAddons()
      setAddons(Array.isArray(addonList) ? addonList : [])
    } catch (error) {
      console.error('Failed to load addons:', error)
      message.error('加载加料失败')
      setAddons([])
    }
  }

  // 加载商品加料关联
  const loadItemAddons = async (itemId: string) => {
    try {
      const itemAddonList = await itemManagementService.getItemAddons(itemId)
      setItemAddons(prev => ({
        ...prev,
        [itemId]: itemAddonList
      }))
    } catch (error) {
      console.error('Failed to load item addons:', error)
      message.error('加载商品加料失败')
    }
  }

  // 加载所有商品(用于Combo选择)
  const loadAllItems = async () => {
    try {
      const response = await itemManagementService.getItems({ limit: 1000 })
      setAllItems(response.data || [])
    } catch (error) {
      console.error('Failed to load all items:', error)
      setAllItems([])
    }
  }

  // 加载Combo列表
  const loadCombos = async () => {
    setLoading(prev => ({ ...prev, combos: true }))
    try {
      const response = await itemManagementService.getCombos({ limit: 100 })
      setCombos(response.data || [])
    } catch (error) {
      console.error('Failed to load combos:', error)
      message.error('加载组合商品失败')
      setCombos([])
    } finally {
      setLoading(prev => ({ ...prev, combos: false }))
    }
  }

  // 创建Combo
  const handleCreateCombo = () => {
    setEditingCombo(null)
    comboForm.resetFields()
    setComboModalVisible(true)
  }

  // 编辑Combo
  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo)
    
    // 转换comboItems为表单需要的格式
    const comboItems: CreateComboItemPayload[] = (combo.comboItems || []).map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      isRequired: item.isRequired,
      sortOrder: item.sortOrder,
      attributeSelections: item.attributeSelections,
      addonSelections: item.addonSelections
    }))
    
    comboForm.setFieldsValue({
      name: combo.name,
      description: combo.description,
      categoryId: combo.categoryId,
      basePrice: combo.basePrice,
      discount: combo.discount,
      discountType: combo.discountType,
      isActive: combo.isActive,
      comboItems: comboItems
    })
    setComboModalVisible(true)
  }

  // 保存Combo
  const handleSaveCombo = async (values: CreateComboPayload) => {
    setLoading(prev => ({ ...prev, creating: true }))
    try {
      if (editingCombo) {
        await itemManagementService.updateCombo(editingCombo.id, values)
        message.success(t('pages.menuCenter.updateComboSuccess'))
      } else {
        await itemManagementService.createCombo(values)
        message.success(t('pages.menuCenter.createComboSuccess'))
      }
      setComboModalVisible(false)
      loadCombos()
    } catch (error) {
      console.error('Failed to save combo:', error)
      message.error(editingCombo ? t('pages.menuCenter.updateComboFailed') : t('pages.menuCenter.createComboFailed'))
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // 删除Combo
  const handleDeleteCombo = async (id: string) => {
    try {
      await itemManagementService.deleteCombo(id)
      message.success(t('pages.menuCenter.deleteComboSuccess'))
      loadCombos()
    } catch (error) {
      console.error('Failed to delete combo:', error)
      message.error(t('pages.menuCenter.deleteComboFailed'))
    }
  }

  // 加载商品列表
  const loadItems = async () => {
    if (!selectedCategoryId) {
      return
    }
    
    if (!isAuthenticated) {
      return
    }
    
    setLoading(prev => ({ ...prev, items: true }))
    try {
      // 同时加载商品和套餐
      const [itemsResponse, combosResponse] = await Promise.all([
        itemManagementService.getItems({
          categoryId: selectedCategoryId,
          limit: 100
        }),
        itemManagementService.getCombos({
          categoryId: selectedCategoryId,
          limit: 100
        })
      ])
      
      const items = itemsResponse.data || []
      const categoryCombos = combosResponse.data || []
      
      setItems(items)
      setCategoryCombos(categoryCombos)
      
      // 收集所有商品中使用的属性类型ID
      const usedAttributeTypeIds = new Set<string>()
      items.forEach(item => {
        const itemWithAttrs = item as Item // 使用本地扩展的Item类型
        if (itemWithAttrs.attributes && Array.isArray(itemWithAttrs.attributes)) {
          itemWithAttrs.attributes.forEach((attr: ItemAttribute) => {
            if (attr.attributeTypeId) {
              usedAttributeTypeIds.add(attr.attributeTypeId)
            }
          })
        }
      })
      
      // 为所有使用的属性类型加载选项数据（如果还没有加载）
      for (const typeId of usedAttributeTypeIds) {
        if (!attributeOptions[typeId]) {
          try {
            await loadAttributeOptions(typeId)
          } catch (error) {
            console.warn(`Failed to load options for attribute type ${typeId}:`, error)
          }
        }
      }
      
      // 静默加载商品，不显示加载消息
    } catch (error) {
      console.error('Failed to load items:', error)
      message.error('加载商品失败')
      setItems([]) // 确保出错时也设置为空数组
    } finally {
      setLoading(prev => ({ ...prev, items: false }))
    }
  }

  // 创建分类
  const handleCreateCategory = () => {
    setEditingCategory(null)
    catForm.resetFields()
    setCategoryModalVisible(true)
  }

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    catForm.setFieldsValue({
      name: category.name,
      parentId: category.parentId
    })
    setCategoryModalVisible(true)
  }
  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await itemManagementService.deleteCategory(categoryId)
      message.success(t('pages.menuCenter.deleteCategorySuccess'))
      
      // 如果删除的是当前选中的分类，清空选择
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null)
      }
      
      loadCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      message.error(t('pages.menuCenter.deleteCategoryFailed'))
    }
  }

  // 提交分类表单
  const handleCategorySubmit = async (values: any) => {
    setLoading(prev => ({ ...prev, creating: true }))
    try {
      if (editingCategory) {
        // 更新分类 - 不传递 tenant_id，由后端从JWT自动提取
        const updatePayload: UpdateCategoryPayload = {
          name: values.name,
          parentId: values.parentId || undefined
        }
        await itemManagementService.updateCategory(editingCategory.id, updatePayload)
        message.success('分类更新成功')
      } else {
        // 创建分类 - 不传递 tenant_id，由后端从JWT自动提取
        const createPayload: CreateCategoryPayload = {
          name: values.name,
          parentId: values.parentId || undefined // 确保空值转为 undefined
        }
        const newCategory = await itemManagementService.createCategory(createPayload)
        message.success('分类创建成功')
        setSelectedCategoryId(newCategory.id)
      }
      
      setCategoryModalVisible(false)
      loadCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      message.error(editingCategory ? '更新分类失败' : '创建分类失败')
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // 创建商品
  const handleCreateItem = async () => {
    if (!selectedCategoryId) {
      message.warning('请先选择一个分类')
      return
    }
    
    // 加载所有select类型属性的选项
    for (const attributeType of attributeTypes) {
      if (attributeType.inputType === 'select' && !attributeOptions[attributeType.id]) {
        await loadAttributeOptions(attributeType.id)
      }
    }
    
    setEditingItem(null)
    itemForm.resetFields()
    itemForm.setFieldsValue({ 
      isActive: true,
      categoryId: selectedCategoryId 
    })
    setItemModalVisible(true)
  }

  // 编辑商品
  const handleEditItem = async (item: Item) => {
    setEditingItem(item)
    
    // 加载所有select类型属性的选项
    for (const attributeType of attributeTypes) {
      if (attributeType.inputType === 'select' && !attributeOptions[attributeType.id]) {
        await loadAttributeOptions(attributeType.id)
      }
    }
    
    // 转换API返回的attributes为前端表单需要的attributeConfigs格式
    const attributeConfigsData = item.attributes?.map(attr => ({
      attributeTypeId: attr.attributeTypeId,
      isRequired: attr.isRequired,
      optionOverrides: attr.optionOverrides || {},
      allowedOptions: attr.allowedOptions || [],
      defaultOptionId: attr.defaultOptionId,
      optionOrder: attr.optionOrder || []
    })) || []
    
    // 加载商品的附加项关联数据
    let itemAddonsData: ItemAddon[] = []
    try {
      itemAddonsData = await itemManagementService.getItemAddons(item.id)
    } catch (error) {
      console.error('Failed to load item addons:', error)
      // 不阻塞编辑流程，只是记录错误
    }
    
    itemForm.setFieldsValue({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      basePrice: item.basePrice,
      cost: item.cost,
      isActive: item.isActive,
      customFields: item.customFields,
      attributeConfigs: attributeConfigsData,
      itemAddons: itemAddonsData
    })
    setItemModalVisible(true)
  }

  // 删除商品
  const handleDeleteItem = async (itemId: string) => {
    try {
      await itemManagementService.deleteItem(itemId)
      message.success(t('pages.menuCenter.deleteItemSuccess'))
      loadItems()
    } catch (error) {
      console.error('Failed to delete item:', error)
      message.error(t('pages.menuCenter.deleteItemFailed'))
    }
  }

  // 提交商品表单
  // UUID验证函数
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const handleItemSubmit = async (values: any) => {
    setLoading(prev => ({ ...prev, creating: true }))
    
    try {
      // 验证必要字段
      if (!values.name?.trim()) {
        message.error('商品名称不能为空')
        return
      }

      if (typeof values.basePrice !== 'number' || isNaN(values.basePrice)) {
        message.error('请输入有效的商品售价')
        return
      }

      // 确定使用的分类ID
      const categoryId = values.categoryId || selectedCategoryId
      if (!categoryId) {
        message.error('请选择商品分类')
        return
      }

      // 验证分类ID是有效的UUID
      if (!isValidUUID(categoryId)) {
        message.error('分类ID格式无效')
        return
      }

      // 验证分类是否存在
      const categoryExists = categories.some(cat => cat.id === categoryId)
      if (!categoryExists) {
        message.error('所选分类不存在，请重新选择')
        return
      }

      // 验证成本价格（可选，但如果填写了必须是有效数字）
      if (values.cost !== undefined && values.cost !== null && values.cost !== '') {
        const costNumber = Number(values.cost)
        if (isNaN(costNumber) || costNumber < 0) {
          message.error('成本价格必须是有效的非负数字')
          return
        }
      }

      // 转换attributeConfigs为API期望的attributes格式
      const attributes = values.attributeConfigs?.map((config: ItemAttributeConfig) => ({
        attributeTypeId: config.attributeTypeId,
        isRequired: config.isRequired,
        optionOverrides: config.optionOverrides || {},
        allowedOptions: config.allowedOptions && config.allowedOptions.length > 0 ? config.allowedOptions : undefined,
        defaultOptionId: config.defaultOptionId,
        optionOrder: config.optionOrder && config.optionOrder.length > 0 ? config.optionOrder : undefined
      })) || []

      if (editingItem) {
        // 更新商品
        const updatePayload: UpdateItemPayload = {
          name: values.name.trim(),
          description: values.description?.trim(),
          categoryId: categoryId,
          basePrice: Number(values.basePrice), // 确保是数字类型
          cost: (values.cost !== undefined && values.cost !== null && values.cost !== '') ? Number(values.cost) : undefined, // 成本可选
          isActive: Boolean(values.isActive), // 确保是布尔类型
          customFields: values.customFields,
          attributes: attributes
        }
        
        await itemManagementService.updateItem(editingItem.id, updatePayload)
        
        // 处理附加项关联
        if (values.itemAddons && Array.isArray(values.itemAddons)) {
          // 先清除现有的附加项关联（简化处理，实际中可能需要更精细的对比）
          const existingAddons = await itemManagementService.getItemAddons(editingItem.id)
          for (const existingAddon of existingAddons) {
            await itemManagementService.removeItemAddon(editingItem.id, existingAddon.addonId)
          }
          
          // 添加新的附加项关联
          for (const itemAddon of values.itemAddons) {
            const payload: CreateItemAddonPayload = {
              addonId: itemAddon.addonId,
              maxQuantity: itemAddon.maxQuantity
            }
            await itemManagementService.addItemAddon(editingItem.id, payload)
          }
        }
        
        message.success('商品更新成功')
      } else {
        // 创建商品
        const createPayload: CreateItemPayload = {
          name: values.name.trim(),
          description: values.description?.trim(),
          categoryId: categoryId,
          basePrice: Number(values.basePrice), // 确保是数字类型
          cost: (values.cost !== undefined && values.cost !== null && values.cost !== '') ? Number(values.cost) : undefined, // 成本可选
          isActive: values.isActive !== false, // 默认为true，确保是布尔类型
          customFields: values.customFields,
          attributes: attributes
        }
        
        const createdItem = await itemManagementService.createItem(createPayload)
        
        // 处理附加项关联
        if (values.itemAddons && Array.isArray(values.itemAddons) && createdItem.id) {
          for (const itemAddon of values.itemAddons) {
            const payload: CreateItemAddonPayload = {
              addonId: itemAddon.addonId,
              maxQuantity: itemAddon.maxQuantity
            }
            await itemManagementService.addItemAddon(createdItem.id, payload)
          }
        }
        
        message.success('商品创建成功')
      }
      
      setItemModalVisible(false)
      loadItems()
    } catch (error) {
      console.error('Failed to save item:', error)
      message.error(editingItem ? '更新商品失败' : '创建商品失败')
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // ==================== 属性管理处理函数 ====================

  // 创建属性类型
  const handleCreateAttributeType = () => {
    setEditingAttributeType(null)
    attributeTypeForm.resetFields()
    setAttributeTypeModalVisible(true)
  }

  // 编辑属性类型
  const handleEditAttributeType = async (attributeType: ItemAttributeType) => {
    setEditingAttributeType(attributeType)
    
    // 加载属性选项
    await loadAttributeOptions(attributeType.id)
    const options = attributeOptions[attributeType.id] || []
    
    attributeTypeForm.setFieldsValue({
      name: attributeType.name,
      displayName: attributeType.displayName,
      inputType: attributeType.inputType,
      options: options
    })
    setAttributeTypeModalVisible(true)
  }

  // 删除属性类型
  const handleDeleteAttributeType = async (id: string) => {
    try {
      await itemManagementService.deleteAttributeType(id)
      message.success(t('pages.menuCenter.deleteAttributeTypeSuccess'))
      loadAttributeTypes()
    } catch (error) {
      console.error('Failed to delete attribute type:', error)
      message.error(t('pages.menuCenter.deleteAttributeTypeFailed'))
    }
  }

  // 提交属性类型表单
  const handleAttributeTypeSubmit = async (values: CreateItemAttributeTypePayload & { options: ItemAttributeOption[] }) => {
    setLoading(prev => ({ ...prev, creating: true }))
    try {
      // 验证至少有一个选项
      if (!values.options || values.options.length === 0) {
        message.error(t('pages.menuCenter.atLeastOneOption'))
        return
      }
      
      // 验证选项值唯一性
      const optionValues = values.options.map(opt => opt.value)
      const uniqueValues = new Set(optionValues)
      if (optionValues.length !== uniqueValues.size) {
        message.error(t('pages.menuCenter.optionValueDuplicate'))
        return
      }
      
      // 创建属性类型
      const attributeTypePayload = {
        name: values.name,
        displayName: values.displayName,
        inputType: values.inputType
      }
      
      let attributeTypeId: string
      
      if (editingAttributeType) {
        await itemManagementService.updateAttributeType(editingAttributeType.id, attributeTypePayload)
        attributeTypeId = editingAttributeType.id
        message.success('属性类型更新成功')
      } else {
        const createdType = await itemManagementService.createAttributeType(attributeTypePayload)
        attributeTypeId = createdType.id
        message.success('属性类型创建成功')
      }
      
      // 创建或更新选项
      for (const option of values.options) {
        const optionPayload = {
          value: option.value,
          displayName: option.displayName,
          priceModifier: option.priceModifier || 0
        }
        
        if (option.id && !option.id.startsWith('temp_')) {
          // 更新已存在的选项
          await itemManagementService.updateAttributeOption(option.id, optionPayload)
        } else {
          // 创建新选项
          await itemManagementService.createAttributeOption(attributeTypeId, optionPayload)
        }
      }
      
      setAttributeTypeModalVisible(false)
      loadAttributeTypes()
      // 重新加载选项数据
      await loadAttributeOptions(attributeTypeId)
    } catch (error) {
      console.error('Failed to save attribute type:', error)
      message.error(editingAttributeType ? t('pages.menuCenter.updateAttributeTypeFailed') : t('pages.menuCenter.createAttributeTypeFailed'))
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // 创建属性选项
  const handleCreateAttributeOption = (typeId: string) => {
    setSelectedAttributeTypeId(typeId)
    setEditingAttributeOption(null)
    attributeOptionForm.resetFields()
    attributeOptionForm.setFieldsValue({ priceModifier: 0 })
    setAttributeOptionModalVisible(true)
  }

  // 编辑属性选项
  const handleEditAttributeOption = (option: ItemAttributeOption, typeId: string) => {
    setSelectedAttributeTypeId(typeId)
    setEditingAttributeOption(option)
    attributeOptionForm.setFieldsValue({
      value: option.value,
      displayName: option.displayName,
      priceModifier: option.priceModifier || 0
    })
    setAttributeOptionModalVisible(true)
  }

  // 删除属性选项
  const handleDeleteAttributeOption = async (optionId: string, typeId: string) => {
    try {
      await itemManagementService.deleteAttributeOption(optionId)
      message.success(t('pages.menuCenter.deleteAttributeOptionSuccess'))
      loadAttributeOptions(typeId)
    } catch (error) {
      console.error('Failed to delete attribute option:', error)
      message.error(t('pages.menuCenter.deleteAttributeOptionFailed'))
    }
  }

  // 提交属性选项表单
  const handleAttributeOptionSubmit = async (values: CreateItemAttributeOptionPayload) => {
    if (!selectedAttributeTypeId) {
      message.error(t('pages.menuCenter.selectAttributeTypeFirst'))
      return
    }

    setLoading(prev => ({ ...prev, creating: true }))
    try {
      if (editingAttributeOption) {
        await itemManagementService.updateAttributeOption(editingAttributeOption.id, values)
        message.success(t('pages.menuCenter.updateAttributeOptionSuccess'))
      } else {
        await itemManagementService.createAttributeOption(selectedAttributeTypeId, values)
        message.success(t('pages.menuCenter.createAttributeOptionSuccess'))
      }
      setAttributeOptionModalVisible(false)
      loadAttributeOptions(selectedAttributeTypeId)
    } catch (error) {
      console.error('Failed to save attribute option:', error)
      message.error(editingAttributeOption ? t('pages.menuCenter.updateAttributeOptionFailed') : t('pages.menuCenter.createAttributeOptionFailed'))
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // ==================== 加料管理 ====================

  // 删除加料
  const handleDeleteAddon = async (id: string) => {
    try {
      await itemManagementService.deleteAddon(id)
      message.success(t('pages.menuCenter.deleteModifierSuccess'))
      loadAddons()
    } catch (error) {
      console.error('Failed to delete addon:', error)
      message.error(t('pages.menuCenter.deleteModifierFailed'))
    }
  }

  // 保存加料（创建或更新）
  const handleSaveAddon = async (values: any) => {
    setLoading(prev => ({ ...prev, creating: true }))
    try {
      if (editingAddon) {
        await itemManagementService.updateAddon(editingAddon.id, values)
        message.success(t('pages.menuCenter.updateModifierSuccess'))
      } else {
        await itemManagementService.createAddon(values)
        message.success(t('pages.menuCenter.createModifierSuccess'))
      }
      setAddonModalVisible(false)
      loadAddons()
    } catch (error) {
      console.error('Failed to save addon:', error)
      message.error(editingAddon ? t('pages.menuCenter.updateModifierFailed') : t('pages.menuCenter.createModifierFailed'))
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // 添加商品加料关联
  const handleAddItemAddon = async (itemId: string, payload: CreateItemAddonPayload) => {
    try {
      await itemManagementService.addItemAddon(itemId, payload)
      message.success('添加加料成功')
      loadItemAddons(itemId)
    } catch (error) {
      console.error('Failed to add item addon:', error)
      message.error('添加加料失败')
    }
  }

  // 移除商品加料关联
  const handleRemoveItemAddon = async (itemId: string, addonId: string) => {
    try {
      await itemManagementService.removeItemAddon(itemId, addonId)
      message.success('移除加料成功')
      loadItemAddons(itemId)
    } catch (error) {
      console.error('Failed to remove item addon:', error)
      message.error('移除加料失败')
    }
  }

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  )

  // 构建层级分类树
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  
  // 扁平化的分类列表（用于渲染）
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree])


  // 生成Tree组件数据
  const treeData = useMemo(() => {
    const convertToTreeData = (categories: HierarchicalCategory[]): any[] => {
      return categories.map(category => ({
        key: category.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space style={{ flex: 1 }}>
              <span style={{ 
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: category.level === 0 ? '#1890ff' : '#52c41a',
                display: 'inline-block',
                marginRight: '4px'
              }} />
              <span style={{ 
                fontWeight: category.level === 0 ? 600 : 400,
                color: selectedCategoryId === category.id ? '#1890ff' : '#000'
              }}>
                {category.name}
              </span>
            </Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: t('pages.menuCenter.edit'),
                    icon: <EditOutlined />,
                    onClick: () => handleEditCategory(category)
                  },
                  {
                    key: 'delete',
                    label: t('pages.menuCenter.delete'),
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      Modal.confirm({
                        title: t('pages.menuCenter.deleteCategoryConfirm'),
                        content: t('pages.menuCenter.deleteCategoryContent', { name: category.name }),
                        okText: t('pages.menuCenter.delete'),
                        cancelText: t('pages.menuCenter.cancel'),
                        onOk: () => handleDeleteCategory(category.id)
                      })
                    }
                  }
                ]
              }}
              trigger={['click']}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                type="text" 
                size="small" 
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
                style={{ opacity: 0.6 }}
              />
            </Dropdown>
          </div>
        ),
        icon: null, // 不显示文件夹图标
        children: category.children && category.children.length > 0 ? convertToTreeData(category.children) : undefined,
        selectable: true
      }))
    }
    
    return convertToTreeData(categoryTree)
  }, [categoryTree, selectedCategoryId])

  const categoryItems = useMemo(
    () => {
      if (!items || !Array.isArray(items)) return []
      return items.filter(i => i.categoryId === selectedCategoryId)
    },
    [items, selectedCategoryId]
  )

  // 如果未认证，显示提示
  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Typography.Text>{t('pages.menuCenter.loginRequired')}</Typography.Text>
      </div>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ display: 'block' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>{t('pages.menuCenter.title')}</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
        {t('pages.menuCenter.systemDescription')}
      </Typography.Paragraph>

      <Tabs
        defaultActiveKey="products"
        items={[
          {
            key: 'products',
            label: t('pages.menuCenter.menuManagement'),
            children: (
              <Tabs
                defaultActiveKey="items"
                items={[
                  {
                    key: 'items',
                    label: t('pages.menuCenter.itemList'),
                    children: (
              <Row gutter={16}>
        <Col xs={24} md={10} lg={8}>
          <Card 
            size="small" 
            title={
              <Space>
                {t('pages.menuCenter.categoriesTitle')}
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateCategory}
                >
                  {t('pages.menuCenter.addCategory')}
                </Button>
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={loadCategories}
                  loading={loading.categories}
                >
                  {t('pages.menuCenter.refresh')}
                </Button>
              </Space>
            }
          >
            <Spin spinning={loading.categories} indicator={loadingIcon} tip={t('pages.menuCenter.loadingCategories')}>
              {categories.length === 0 ? (
                <Empty description={t('pages.menuCenter.emptyCategories')}>
                  <Button type="primary" onClick={handleCreateCategory}>
                    {t('pages.menuCenter.createFirstCategoryCTA')}
                  </Button>
                </Empty>
              ) : (
                <Tree
                  treeData={treeData}
                  selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
                  defaultExpandAll
                  showIcon={false}
                  showLine={false}
                  switcherIcon={() => null} // 隐藏默认的switcher
                  onSelect={(selectedKeys) => {
                    if (selectedKeys.length > 0) {
                      setSelectedCategoryId(selectedKeys[0] as string)
                    }
                  }}
                  style={{
                    background: 'transparent',
                    fontSize: '14px'
                  }}
                  className="category-tree"
                />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={14} lg={16}>
          <Card 
            size="small" 
            title={
              <Space>
                {t('pages.menuCenter.itemsTitle')}
                {selectedCategory && (
                  <>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={handleCreateItem}
                    >
                      {t('pages.menuCenter.addItem')}
                    </Button>
                    <Button 
                      size="small" 
                      icon={<ReloadOutlined />}
                      onClick={loadItems}
                      loading={loading.items}
                    >
                      {t('pages.menuCenter.refresh')}
                    </Button>
                  </>
                )}
              </Space>
            }
          >
            <Spin spinning={loading.items} indicator={loadingIcon} tip={t('pages.menuCenter.loadingItems')}>
            {!selectedCategory ? (
              <Empty description={t('pages.menuCenter.selectCategoryPlaceholder')} />
            ) : (
              <>
                  <Typography.Text type="secondary">
                    {t('pages.menuCenter.currentCategory', { name: selectedCategory.name })}
                  </Typography.Text>
                  <Divider style={{ margin: '12px 0' }} />

                {categoryItems.length === 0 ? (
                    <Empty description={t('pages.menuCenter.emptyItems')}>
                      <Button type="primary" onClick={handleCreateItem}>
                        创建第一个商品
                      </Button>
                    </Empty>
                ) : (
                  <List
                    dataSource={categoryItems}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button 
                              key="edit"
                              type="link" 
                              size="small" 
                              icon={<EditOutlined />}
                              onClick={() => handleEditItem(item)}
                            >
                              {t('pages.menuCenter.edit')}
                            </Button>,
                            <Popconfirm
                              key="delete"
                              title={t('pages.menuCenter.deleteItemConfirm')}
                              onConfirm={() => handleDeleteItem(item.id)}
                              okText={t('pages.menuCenter.delete')}
                              cancelText={t('pages.menuCenter.cancel')}
                            >
                              <Button 
                                type="link" 
                                size="small" 
                                danger
                                icon={<DeleteOutlined />}
                              >
                                {t('pages.menuCenter.delete')}
                              </Button>
                            </Popconfirm>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                {item.name}
                                <Tag color={item.isActive ? 'green' : 'red'}>
                                  {item.isActive ? t('pages.menuCenter.active') : t('pages.menuCenter.inactive')}
                                </Tag>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={4}>
                                {item.description && (
                                  <Typography.Text type="secondary">
                                    {item.description}
                                  </Typography.Text>
                                )}
                                <Space>
                                  <Typography.Text strong>
                                    {t('pages.menuCenter.salePrice')}: ${item.basePrice.toFixed(2)}
                                  </Typography.Text>
                                  {item.cost && (
                                    <Typography.Text type="secondary">
                                      {t('pages.menuCenter.cost')}: ${item.cost.toFixed(2)}
                                    </Typography.Text>
                                  )}
                                </Space>
                                {item.attributes && item.attributes.length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                      {t('pages.menuCenter.attributeConfig')}: 
                                    </Typography.Text>
                                    {item.attributes.map((attr, index) => {
                                      const attributeType = attr.attributeType || attributeTypes.find(type => type.id === attr.attributeTypeId)
                                      if (!attributeType) return null
                                      
                                      // 获取该属性类型的所有选项
                                      const allOptions = attributeOptions[attributeType.id] || []
                                      
                                      // 获取允许的选项（如果没有设置则显示所有）
                                      const allowedOptions = attr.allowedOptions && attr.allowedOptions.length > 0 
                                        ? allOptions.filter(opt => attr.allowedOptions!.includes(opt.id))
                                        : allOptions
                                      
                                      const optionNames = allowedOptions.map(opt => opt.displayName).join(', ')
                                      
                                      return (
                                        <Tag 
                                          key={index} 
                                          color="purple" 
                                          style={{ 
                                            marginBottom: 2, 
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            padding: '2px 8px'
                                          }}
                                        >
                                          🏷️ {attributeType.displayName}({optionNames})
                                          {attr.isRequired && <span style={{ color: 'red', fontWeight: 'bold' }}> *</span>}
                                        </Tag>
                                      )
                                    })}
                                  </div>
                                )}
                                {/* 显示加料信息 */}
                                {itemAddons[item.id] && itemAddons[item.id].length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                      加料配置: 
                                    </Typography.Text>
                                    {itemAddons[item.id]
                                      .map((itemAddon, index) => {
                                        const addon = itemAddon.addon || addons.find(a => a.id === itemAddon.addonId)
                                        if (!addon) return null
                                        
                                        return (
                                          <Tag 
                                            key={index} 
                                            color="green" 
                                            style={{ 
                                              marginBottom: 2, 
                                              fontWeight: 'bold',
                                              fontSize: '12px',
                                              padding: '2px 8px'
                                            }}
                                          >
                                            {addon.name}
                                            <span style={{ fontSize: '10px', marginLeft: 4 }}>x{itemAddon.maxQuantity}</span>
                                            <span style={{ fontSize: '10px', marginLeft: 4 }}>${(Number(addon.price) || 0).toFixed(2)}</span>
                                          </Tag>
                                        )
                                      })}
                                  </div>
                                )}
                                {item.customFields && Object.keys(item.customFields).length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                      自定义: 
                                    </Typography.Text>
                                    {Object.entries(item.customFields).map(([key, value]) => (
                                      <Tag key={key} color="blue" style={{ marginBottom: 2 }}>
                                        {key}: {String(value)}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Space>
                            }
                          />
                      </List.Item>
                    )}
                  />
                )}

                {/* 套餐列表 */}
                {categoryCombos.length > 0 && (
                  <>
                    <Divider style={{ margin: '16px 0' }}>
                      <Typography.Text type="secondary">{t('pages.menuCenter.combosInCategory')}</Typography.Text>
                    </Divider>
                    <List
                      dataSource={categoryCombos}
                      renderItem={(combo) => {
                        const basePrice = Number(combo.basePrice) || 0
                        const discount = Number(combo.discount) || 0
                        let finalPrice = basePrice
                        
                        if (combo.discountType === 'percentage') {
                          finalPrice = basePrice * (1 - discount / 100)
                        } else {
                          finalPrice = basePrice - discount
                        }
                        finalPrice = Math.max(0, finalPrice)
                        
                        return (
                          <List.Item
                            actions={[
                              <Button 
                                key="edit"
                                type="link" 
                                size="small" 
                                icon={<EditOutlined />}
                                onClick={() => handleEditCombo(combo)}
                              >
                                {t('pages.menuCenter.edit')}
                              </Button>,
                              <Popconfirm
                                key="delete"
                                title={t('pages.menuCenter.deleteComboConfirm')}
                                onConfirm={() => handleDeleteCombo(combo.id)}
                                okText={t('pages.menuCenter.delete')}
                                cancelText={t('pages.menuCenter.cancel')}
                              >
                                <Button 
                                  type="link" 
                                  size="small" 
                                  danger 
                                  icon={<DeleteOutlined />}
                                >
                                  {t('pages.menuCenter.delete')}
                                </Button>
                              </Popconfirm>
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <Space>
                                  <Tag color="orange">{t('pages.menuCenter.comboTag')}</Tag>
                                  <Typography.Text strong>{combo.name}</Typography.Text>
                                  {!combo.isActive && <Tag color="red">{t('pages.menuCenter.deactivated')}</Tag>}
                                </Space>
                              }
                              description={
                                <div>
                                  {combo.description && (
                                    <div style={{ marginBottom: 4 }}>
                                      <Typography.Text type="secondary">{combo.description}</Typography.Text>
                                    </div>
                                  )}
                                  {combo.comboItems && combo.comboItems.length > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                        {t('pages.menuCenter.includedItems')}: 
                                      </Typography.Text>
                                      {combo.comboItems.map((comboItem, index) => (
                                        <Tag key={index} color="blue" style={{ margin: '2px' }}>
                                          {comboItem.item?.name || '未知'} ×{comboItem.quantity}
                                        </Tag>
                                      ))}
                                    </div>
                                  )}
                                  <div style={{ marginTop: 8 }}>
                                    <Space size="large">
                                      <span>
                                        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('pages.menuCenter.originalPrice')}: </Typography.Text>
                                        <Typography.Text style={{ textDecoration: discount > 0 ? 'line-through' : 'none' }}>
                                          ${basePrice.toFixed(2)}
                                        </Typography.Text>
                                      </span>
                                      {discount > 0 && (
                                        <>
                                          <span>
                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('pages.menuCenter.discount')}: </Typography.Text>
                                            <Typography.Text type="danger">
                                              {combo.discountType === 'percentage' ? `-${discount}%` : `-$${discount.toFixed(2)}`}
                                            </Typography.Text>
                                          </span>
                                          <span>
                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('pages.menuCenter.finalPrice')}: </Typography.Text>
                                            <Typography.Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                                              ${finalPrice.toFixed(2)}
                                            </Typography.Text>
                                          </span>
                                        </>
                                      )}
                                    </Space>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )
                      }}
                    />
                  </>
                )}
              </>
            )}
            </Spin>
          </Card>
        </Col>
              </Row>
                    )
                  },
                  {
                    key: 'attributes',
                    label: t('pages.menuCenter.attributeManagement'),
                    children: (
              <Row gutter={16}>
                <Col span={24}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        {t('pages.menuCenter.attributeTypeManagement')}
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={handleCreateAttributeType}
                        >
                          {t('pages.menuCenter.createAttributeType')}
                        </Button>
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={loadAttributeTypes}
                          loading={loading.attributes}
                        >
                          {t('pages.menuCenter.refresh')}
                        </Button>
                      </Space>
                    }
                  >
                    <Spin spinning={loading.attributes} indicator={loadingIcon} tip={t('pages.menuCenter.loadingAttributes')}>
                      {attributeTypes.length === 0 ? (
                        <Empty description="暂无属性类型">
                          <Button type="primary" onClick={handleCreateAttributeType}>
                            创建第一个属性类型
                          </Button>
                        </Empty>
                      ) : (
                        <Table
                          dataSource={attributeTypes}
                          rowKey="id"
                          pagination={false}
                          columns={[
                            {
                              title: t('pages.menuCenter.attributeName'),
                              dataIndex: 'name',
                              key: 'name'
                            },
                            {
                              title: t('pages.menuCenter.displayName'),
                              dataIndex: 'displayName',
                              key: 'displayName'
                            },
                            {
                              title: t('pages.menuCenter.optionCount'),
                              key: 'optionCount',
                              render: (_, record: ItemAttributeType) => {
                                const count = (attributeOptions[record.id] || []).length;
                                return (
                                  <Tag color={count > 0 ? 'green' : 'orange'}>
                                    {count} {t('pages.menuCenter.optionsUnit')}
                                  </Tag>
                                )
                              }
                            },
                            {
                              title: t('pages.menuCenter.action'),
                              key: 'actions',
                              render: (_, record: ItemAttributeType) => (
                                <Space>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditAttributeType(record)}
                                  >
                                    {t('pages.menuCenter.edit')}
                                  </Button>
                                  <Button
                                      type="link"
                                      size="small"
                                      onClick={async () => {
                                        setSelectedAttributeTypeId(record.id)
                                        await loadAttributeOptions(record.id)
                                        
                                        // 显示属性选项管理界面
                                        const optionsData = attributeOptions[record.id] || []
                                        
                                        const modal = Modal.info({
                                          title: (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <span>{t('pages.menuCenter.manageAttributeOptions')} - {record.displayName}</span>
                                              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                                {t('pages.menuCenter.optionDetailTip')}
                                              </Typography.Text>
                                            </div>
                                          ),
                                          width: 900,
                                          content: (
                                            <div>
                                              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6f8fa', borderRadius: 6 }}>
                                                <Typography.Text strong>{t('pages.menuCenter.optionGuideTitle')}</Typography.Text>
                                                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                                                  <li><Typography.Text>{t('pages.menuCenter.optionValueGuide')}</Typography.Text></li>
                                                  <li><Typography.Text>{t('pages.menuCenter.displayNameGuide')}</Typography.Text></li>
                                                  <li><Typography.Text>{t('pages.menuCenter.priceModifierGuide')}</Typography.Text></li>
                                                </ul>
                                              </div>
                                              
                                              <div style={{ marginBottom: 16 }}>
                                                <Button
                                                  type="primary"
                                                  icon={<PlusOutlined />}
                                                  onClick={() => {
                                                    modal.destroy()
                                                    handleCreateAttributeOption(record.id)
                                                  }}
                                                >
                                                  {t('pages.menuCenter.addNewOption')}
                                                </Button>
                                              </div>
                                              
                                              {optionsData.length === 0 ? (
                                                <Empty 
                                                  description={
                                                    <div>
                                                      <Typography.Text>{t('pages.menuCenter.noAttributeOptions')}</Typography.Text>
                                                      <br />
                                                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {t('pages.menuCenter.noAttributeOptionsExample')}
                                                      </Typography.Text>
                                                    </div>
                                                  }
                                                >
                                                  <Button 
                                                    type="primary" 
                                                    onClick={() => {
                                                      modal.destroy()
                                                      handleCreateAttributeOption(record.id)
                                                    }}
                                                  >
                                                    {t('pages.menuCenter.createFirstOption')}
                                                  </Button>
                                                </Empty>
                                              ) : (
                                                <Table
                                                  dataSource={optionsData}
                                                  rowKey="id"
                                                  pagination={false}
                                                  size="small"
                                                  columns={[
                                                    {
                                                      title: t('pages.menuCenter.optionValueSystem'),
                                                      dataIndex: 'value',
                                                      key: 'value',
                                                      render: (value: string) => (
                                                        <Typography.Text code>{value}</Typography.Text>
                                                      )
                                                    },
                                                    {
                                                      title: t('pages.menuCenter.displayNameUser'),
                                                      dataIndex: 'displayName',
                                                      key: 'displayName',
                                                      render: (name: string) => (
                                                        <Tag color="blue">{name}</Tag>
                                                      )
                                                    },
                                                    {
                                                      title: t('pages.menuCenter.priceModifier'),
                                                      dataIndex: 'priceModifier',
                                                      key: 'priceModifier',
                                                      render: (value: any) => {
                                                        const numValue = Number(value) || 0;
                                                        return (
                                                          <Typography.Text 
                                                            style={{ 
                                                              color: numValue > 0 ? '#52c41a' : numValue < 0 ? '#ff4d4f' : '#666'
                                                            }}
                                                          >
                                                            {numValue > 0 ? '+' : ''}${numValue.toFixed(2)}
                                                          </Typography.Text>
                                                        )
                                                      }
                                                    },
                                                    {
                                                      title: t('pages.menuCenter.action'),
                                                      key: 'actions',
                                                      render: (_, option: ItemAttributeOption) => (
                                                        <Space>
                                                          <Button
                                                            type="link"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            onClick={() => {
                                                              modal.destroy()
                                                              handleEditAttributeOption(option, record.id)
                                                            }}
                                                          >
                                                            {t('pages.menuCenter.edit')}
                                                          </Button>
                                                          <Popconfirm
                                                            title={t('pages.menuCenter.deleteOptionConfirm')}
                                                            onConfirm={() => handleDeleteAttributeOption(option.id, record.id)}
                                                            okText={t('pages.menuCenter.delete')}
                                                            cancelText={t('pages.menuCenter.cancel')}
                                                          >
                                                            <Button
                                                              type="link"
                                                              size="small"
                                                              danger
                                                              icon={<DeleteOutlined />}
                                                            >
                                                              {t('pages.menuCenter.delete')}
                                                            </Button>
                                                          </Popconfirm>
                                                        </Space>
                                                      )
                                                    }
                                                  ]}
                                                />
                                              )}
                                            </div>
                                          ),
                                          okText: t('pages.menuCenter.close')
                                        })
                                      }}
                                    >
                                      {t('pages.menuCenter.manageOptions')} ({(attributeOptions[record.id] || []).length})
                                    </Button>
                                  <Popconfirm
                                    title={t('pages.menuCenter.deleteAttributeConfirm')}
                                    onConfirm={() => handleDeleteAttributeType(record.id)}
                                    okText={t('pages.menuCenter.delete')}
                                    cancelText={t('pages.menuCenter.cancel')}
                                  >
                                    <Button
                                      type="link"
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                    >
                                      {t('pages.menuCenter.delete')}
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              )
                            }
                          ]}
                        />
                      )}
                    </Spin>
                  </Card>
                </Col>
              </Row>
                    )
                  },
                  {
                    key: 'addons',
                    label: t('pages.menuCenter.modifierManagement'),
                    children: (
              <Card 
                size="small"
                title={
                  <Space>
                    {t('pages.menuCenter.modifierManagement')}
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingAddon(null)
                        setAddonModalVisible(true)
                      }}
                    >
                      {t('pages.menuCenter.createModifier')}
                    </Button>
                    <Button 
                      size="small" 
                      icon={<ReloadOutlined />}
                      onClick={loadAddons}
                    >
                      {t('pages.menuCenter.refresh')}
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={Array.isArray(addons) ? addons : []}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: t('pages.menuCenter.name'),
                      dataIndex: 'name',
                      key: 'name',
                      render: (text: string) => (
                        <Typography.Text strong>{text}</Typography.Text>
                      )
                    },
                    {
                      title: t('pages.menuCenter.description'),
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true
                    },
                    {
                      title: t('pages.menuCenter.price'),
                      dataIndex: 'price',
                      key: 'price',
                      render: (price: any) => {
                        const numPrice = Number(price) || 0
                        return `$${numPrice.toFixed(2)}`
                      }
                    },
                    {
                      title: t('pages.menuCenter.cost'),
                      dataIndex: 'cost',
                      key: 'cost',
                      render: (cost: any) => {
                        const numCost = Number(cost) || 0
                        return `$${numCost.toFixed(2)}`
                      }
                    },
                    {
                      title: t('pages.menuCenter.inventoryManagement'),
                      dataIndex: 'trackInventory',
                      key: 'trackInventory',
                      render: (trackInventory: boolean) => (
                        <Tag color={trackInventory ? 'green' : 'default'}>
                          {trackInventory ? t('pages.menuCenter.enabled') : t('pages.menuCenter.disabled')}
                        </Tag>
                      )
                    },
                    {
                      title: t('pages.menuCenter.currentStock'),
                      dataIndex: 'currentStock',
                      key: 'currentStock',
                      render: (stock: number, record: Addon) => 
                        record.trackInventory ? stock : '-'
                    },
                    {
                      title: t('pages.menuCenter.status'),
                      dataIndex: 'isActive',
                      key: 'isActive',
                      render: (isActive: boolean) => (
                        <Tag color={isActive ? 'green' : 'red'}>
                          {isActive ? t('pages.menuCenter.activated') : t('pages.menuCenter.deactivated')}
                        </Tag>
                      )
                    },
                    {
                      title: t('pages.menuCenter.action'),
                      key: 'actions',
                      render: (_, record: Addon) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingAddon(record)
                              setAddonModalVisible(true)
                            }}
                          >
                            {t('pages.menuCenter.edit')}
                          </Button>
                          <Popconfirm
                            title={t('pages.menuCenter.deleteModifierConfirm')}
                            onConfirm={() => handleDeleteAddon(record.id)}
                            okText={t('pages.menuCenter.confirm')}
                            cancelText={t('pages.menuCenter.cancel')}
                          >
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              {t('pages.menuCenter.delete')}
                            </Button>
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]}
                />
              </Card>
                    )
                  }
                ]}
              />
            )
          },
          {
            key: 'combos',
            label: t('pages.menuCenter.comboManagement'),
            children: (
              <Card 
                size="small" 
                title={
                  <Space>
                    {t('pages.menuCenter.comboList')}
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={handleCreateCombo}
                    >
                      {t('pages.menuCenter.createCombo')}
                    </Button>
                    <Button 
                      size="small" 
                      icon={<ReloadOutlined />}
                      onClick={loadCombos}
                      loading={loading.combos}
                    >
                      {t('pages.menuCenter.refresh')}
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={combos}
                  rowKey="id"
                  loading={{spinning: loading.combos, indicator: loadingIcon}}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: t('pages.menuCenter.comboName'),
                      dataIndex: 'name',
                      key: 'name',
                      width: 150,
                      render: (text: string) => (
                        <Typography.Text strong>{text}</Typography.Text>
                      )
                    },
                    {
                      title: t('pages.menuCenter.includedItems'),
                      key: 'items',
                      width: 250,
                      render: (_, record: Combo) => {
                        const items = record.comboItems || []
                        if (items.length === 0) {
                          return <Typography.Text type="secondary">暂无商品</Typography.Text>
                        }
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {items.map((comboItem, index) => {
                              const itemName = comboItem.item?.name || '未知商品'
                              const quantity = comboItem.quantity || 1
                              return (
                                <Tag key={index} color="blue" style={{ margin: 0 }}>
                                  {itemName} ×{quantity}
                                </Tag>
                              )
                            })}
                          </div>
                        )
                      }
                    },
                    {
                      title: '分类',
                      dataIndex: 'category',
                      key: 'category',
                      width: 100,
                      render: (category: Category) => category?.name || '-'
                    },
                    {
                      title: '原价',
                      dataIndex: 'basePrice',
                      key: 'basePrice',
                      width: 100,
                      render: (price: any) => {
                        const numPrice = Number(price) || 0
                        return (
                          <Typography.Text style={{ fontSize: '14px' }}>
                            ${numPrice.toFixed(2)}
                          </Typography.Text>
                        )
                      }
                    },
                    {
                      title: '折扣',
                      key: 'discount',
                      width: 100,
                      render: (_, record: Combo) => {
                        const discount = Number(record.discount) || 0
                        if (discount === 0) return <Typography.Text type="secondary">无</Typography.Text>
                        return (
                          <Typography.Text type="danger">
                            {record.discountType === 'percentage' 
                              ? `-${discount}%` 
                              : `-$${discount.toFixed(2)}`}
                          </Typography.Text>
                        )
                      }
                    },
                    {
                      title: '售价',
                      key: 'finalPrice',
                      width: 100,
                      render: (_, record: Combo) => {
                        const basePrice = Number(record.basePrice) || 0
                        const discount = Number(record.discount) || 0
                        let discountAmount = 0
                        
                        if (record.discountType === 'percentage') {
                          discountAmount = basePrice * (discount / 100)
                        } else {
                          discountAmount = discount
                        }
                        
                        const finalPrice = Math.max(0, basePrice - discountAmount)
                        
                        return (
                          <Typography.Text strong style={{ color: '#52c41a', fontSize: '15px' }}>
                            ${finalPrice.toFixed(2)}
                          </Typography.Text>
                        )
                      }
                    },
                    {
                      title: t('pages.menuCenter.status'),
                      dataIndex: 'isActive',
                      key: 'isActive',
                      render: (isActive: boolean) => (
                        <Tag color={isActive ? 'green' : 'red'}>
                          {isActive ? t('pages.menuCenter.activated') : t('pages.menuCenter.deactivated')}
                        </Tag>
                      )
                    },
                    {
                      title: t('pages.menuCenter.action'),
                      key: 'actions',
                      render: (_, record: Combo) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCombo(record)}
                          >
                            {t('pages.menuCenter.edit')}
                          </Button>
                          <Popconfirm
                            title={t('pages.menuCenter.deleteComboConfirm')}
                            onConfirm={() => handleDeleteCombo(record.id)}
                            okText={t('pages.menuCenter.confirm')}
                            cancelText={t('pages.menuCenter.cancel')}
                          >
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              {t('pages.menuCenter.delete')}
                            </Button>
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]}
                />
              </Card>
            )
          }
        ]}
      />

      {/* 分类创建/编辑模态框 */}
      <Modal
        title={editingCategory ? t('pages.menuCenter.editCategory') : t('pages.menuCenter.createCategory')}
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={catForm}
          layout="vertical"
          onFinish={handleCategorySubmit}
        >
          <Form.Item
            name="name"
            label={t('pages.menuCenter.categoryName')}
            rules={[{ required: true, message: t('pages.menuCenter.categoryNameRequired') }]}
          >
            <Input placeholder={t('pages.menuCenter.categoryNamePlaceholder')} maxLength={50} />
          </Form.Item>

          <Form.Item
            name="parentId"
            label={t('pages.menuCenter.parentCategory')}
            tooltip={t('pages.menuCenter.parentCategoryTooltip')}
          >
            <Select placeholder={t('pages.menuCenter.parentCategoryPlaceholder')} allowClear>
              {flatCategories
                .filter(cat => (cat.level || 0) === 0) // 只显示根分类
                .map(cat => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          
          {flatCategories.filter(cat => (cat.level || 0) === 0).length === 0 && (
            <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: -16, marginBottom: 16 }}>
              {t('pages.menuCenter.noParentCategoryHint')}
            </Typography.Text>
          )}

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCategoryModalVisible(false)}>
                {t('pages.menuCenter.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingCategory ? t('pages.menuCenter.update') : t('pages.menuCenter.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 商品创建/编辑模态框 */}
      <Modal
        title={editingItem ? t('pages.menuCenter.editItem') : t('pages.menuCenter.createItem')}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleItemSubmit}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: t('pages.menuCenter.basicInfo'),
                children: (
                  <div>
                    {/* 紧凑的商品基本信息 */}
                    <Card size="small" title={t('pages.menuCenter.itemBasicInfo')} style={{ marginBottom: 16 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="name"
                            label={t('pages.menuCenter.itemNameLabel')}
                            rules={[
                              { required: true, message: t('pages.menuCenter.itemNameRequired') },
                              { max: 255, message: t('pages.menuCenter.itemNameMaxLength') },
                              { whitespace: true, message: t('pages.menuCenter.itemNameNoWhitespace') }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <Input placeholder={t('pages.menuCenter.itemNamePlaceholder')} maxLength={100} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            name="categoryId"
                            label={t('pages.menuCenter.itemCategory')}
                            rules={[
                              { required: true, message: t('pages.menuCenter.selectCategoryRequired') }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <Select placeholder={t('pages.menuCenter.selectCategory')} allowClear>
                              {flatCategories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>
                                  {cat.level && cat.level > 0 ? (
                                    <span style={{ color: '#666' }}>
                                      　└─ {cat.name}
                                    </span>
                                  ) : (
                                    <span style={{ fontWeight: 500 }}>
                                      {cat.name}
                                    </span>
                                  )}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name="basePrice"
                            label={t('pages.menuCenter.basePrice')}
                            rules={[
                              { required: true, message: t('pages.menuCenter.basePriceRequired') },
                              { type: 'number', message: t('pages.menuCenter.validNumber') }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="0.00"
                              precision={2}
                              addonBefore="$"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name="cost"
                            label={t('pages.menuCenter.cost')}
                            rules={[
                              { type: 'number', message: t('pages.menuCenter.validNumber') },
                              { 
                                validator: (_, value) => {
                                  if (value !== undefined && value !== null && value !== '' && value < 0) {
                                    return Promise.reject(new Error(t('pages.menuCenter.costCannotBeNegative')))
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder="0.00"
                              precision={2}
                              addonBefore="$"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item
                            name="isActive"
                            label={t('pages.menuCenter.status')}
                            valuePropName="checked"
                            style={{ marginBottom: 16 }}
                          >
                            <Switch size="small" checkedChildren={t('pages.menuCenter.active')} unCheckedChildren={t('pages.menuCenter.inactive')} />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item
                        name="description"
                        label={t('pages.menuCenter.itemDescription')}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea rows={2} placeholder={t('pages.menuCenter.itemDescriptionPlaceholder')} maxLength={500} />
                      </Form.Item>
                    </Card>
                  </div>
                )
              },
              {
                key: 'attributes',
                label: t('pages.menuCenter.attributeConfig'),
                children: (
                  <Form.Item
                    name="attributeConfigs"
                    label={
                      <Space>
                        {t('pages.menuCenter.itemAttributeConfig')}
                        <Tooltip title={t('pages.menuCenter.itemAttributeConfigTooltip')}>
                          <Button type="link" size="small" style={{ padding: 0 }}>
                            ?
                          </Button>
                        </Tooltip>
                      </Space>
                    }
                  >
                    <ItemAttributeConfigInput
                      attributeTypes={attributeTypes}
                      attributeOptions={attributeOptions}
                      t={t}
                    />
                  </Form.Item>
                )
              },
              {
                key: 'addons',
                label: t('pages.menuCenter.modifierConfig'),
                children: (
                  <Form.Item
                    name="itemAddons"
                    label={
                      <Space>
                        {t('pages.menuCenter.modifierConfig')}
                        <Tooltip title={t('pages.menuCenter.modifierConfigTooltip')}>
                          <Button type="link" size="small" style={{ padding: 0 }}>
                            ?
                          </Button>
                        </Tooltip>
                      </Space>
                    }
                  >
                    <ItemAddonConfigInput
                      addons={addons}
                      t={t}
                    />
                  </Form.Item>
                )
              }
            ]}
          />

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => setItemModalVisible(false)}>
                {t('pages.menuCenter.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingItem ? t('pages.menuCenter.update') : t('pages.menuCenter.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 属性类型创建/编辑模态框 */}
      <Modal
        title={editingAttributeType ? t('pages.menuCenter.editAttributeType') : t('pages.menuCenter.createAttributeType')}
        open={attributeTypeModalVisible}
        onCancel={() => setAttributeTypeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={attributeTypeForm}
          layout="vertical"
          onFinish={handleAttributeTypeSubmit}
        >
          <Form.Item
            name="name"
            label={t('pages.menuCenter.attributeTypeName')}
            rules={[
              { required: true, message: t('pages.menuCenter.attributeTypeNameRequired') },
              { whitespace: true, message: t('pages.menuCenter.attributeTypeNameNoWhitespace') }
            ]}
          >
            <Input placeholder={t('pages.menuCenter.attributeTypeNamePlaceholder')} maxLength={255} />
          </Form.Item>

          <Form.Item
            name="displayName"
            label={t('pages.menuCenter.displayName')}
            rules={[
              { required: true, message: t('pages.menuCenter.displayNameRequired') }
            ]}
          >
            <Input placeholder={t('pages.menuCenter.displayNamePlaceholder')} maxLength={255} />
          </Form.Item>

          <Form.Item
            name="inputType"
            initialValue="select"
            hidden
          >
            <Input value="select" />
          </Form.Item>

          <Divider>{t('pages.menuCenter.optionSettings')}</Divider>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Typography.Text strong>{t('pages.menuCenter.optionList')}</Typography.Text>
              <Button 
                type="dashed" 
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const currentOptions = attributeTypeForm.getFieldValue('options') || [];
                  const newOptions = [...currentOptions, {
                    id: `temp_${Date.now()}`,
                    value: '',
                    displayName: '',
                    priceModifier: 0
                  }];
                  attributeTypeForm.setFieldValue('options', newOptions);
                }}
              >
                {t('pages.menuCenter.addOption')}
              </Button>
            </div>
            
            <Form.Item name="options" initialValue={[]}>
              <Form.List name="options">
                {(fields, { remove }) => (
                  <div>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={8} align="middle">
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              label={t('pages.menuCenter.optionValue')}
                              rules={[
                                { required: true, message: t('pages.menuCenter.optionValueRequired') },
                                { whitespace: true, message: t('pages.menuCenter.optionValueNoWhitespace') }
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder={t('pages.menuCenter.optionValuePlaceholder')} size="small" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'displayName']}
                              label={t('pages.menuCenter.displayName')}
                              rules={[
                                { required: true, message: t('pages.menuCenter.displayNameRequired') }
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder={t('pages.menuCenter.displayNameOptionPlaceholder')} size="small" />
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              {...restField}
                              name={[name, 'priceModifier']}
                              label={t('pages.menuCenter.priceModifier')}
                              initialValue={0}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber 
                                placeholder="0.00" 
                                precision={2}
                                size="small"
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              height: '100%', 
                              paddingTop: '24px',
                              color: '#666',
                              fontSize: '12px'
                            }}>
                              {t('pages.menuCenter.sortByCreateOrder')}
                            </div>
                          </Col>
                          <Col span={3}>
                            <Button 
                              type="text" 
                              danger 
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              style={{ marginTop: 24 }}
                            />
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    
                    {fields.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        backgroundColor: '#fafafa', 
                        borderRadius: '6px',
                        border: '1px dashed #d9d9d9'
                      }}>
                        <Typography.Text type="secondary">
                          {t('pages.menuCenter.noOptionsYet')}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                )}
              </Form.List>
            </Form.Item>
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAttributeTypeModalVisible(false)}>
                {t('pages.menuCenter.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingAttributeType ? t('pages.menuCenter.update') : t('pages.menuCenter.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 属性选项创建/编辑模态框 */}
      <Modal
        title={editingAttributeOption ? t('pages.menuCenter.editAttributeOption') : t('pages.menuCenter.createAttributeOption')}
        open={attributeOptionModalVisible}
        onCancel={() => setAttributeOptionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={attributeOptionForm}
          layout="vertical"
          onFinish={handleAttributeOptionSubmit}
        >
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6 }}>
            <Typography.Text strong style={{ color: '#0369a1' }}>{t('pages.menuCenter.fillExample')}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Typography.Text>{t('pages.menuCenter.iceOptionExample')}</Typography.Text>
              <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: '12px' }}>
                <li>选项值: <Typography.Text code>normal_ice</Typography.Text> → 显示名称: 正常冰</li>
                <li>选项值: <Typography.Text code>light_ice</Typography.Text> → 显示名称: 少冰</li>
                <li>选项值: <Typography.Text code>more_ice</Typography.Text> → 显示名称: 多冰</li>
                <li>选项值: <Typography.Text code>no_ice</Typography.Text> → 显示名称: 去冰</li>
              </ul>
            </div>
          </div>

          <Form.Item
            name="value"
            label={
              <Space>
                {t('pages.menuCenter.optionValue')}
                <Tooltip title={t('pages.menuCenter.optionValueTooltip')}>
                  <Button type="link" size="small" style={{ padding: 0 }}>?</Button>
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: t('pages.menuCenter.optionValueRequired') },
              { whitespace: true, message: t('pages.menuCenter.optionValueNoWhitespace') }
            ]}
          >
            <Input 
              placeholder={t('pages.menuCenter.optionValueExamplePlaceholder')} 
              maxLength={255}
              addonBefore={t('pages.menuCenter.systemStorage')}
            />
          </Form.Item>

          <Form.Item
            name="displayName"
            label={
              <Space>
                {t('pages.menuCenter.displayName')}
                <Tooltip title={t('pages.menuCenter.displayNameTooltip')}>
                  <Button type="link" size="small" style={{ padding: 0 }}>?</Button>
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: t('pages.menuCenter.displayNameRequired') }
            ]}
          >
            <Input 
              placeholder={t('pages.menuCenter.displayNameExamplePlaceholder')} 
              maxLength={255}
              addonBefore={t('pages.menuCenter.userDisplay')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priceModifier"
                label={t('pages.menuCenter.priceModifier')}
                rules={[
                  { type: 'number', message: t('pages.menuCenter.validNumberRequired') }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value?.replace(/$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>


          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAttributeOptionModalVisible(false)}>
                {t('pages.menuCenter.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingAttributeOption ? t('pages.menuCenter.update') : t('pages.menuCenter.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 加料创建/编辑模态框 */}
      <Modal
        title={editingAddon ? t('pages.menuCenter.editModifier') : t('pages.menuCenter.createModifier')}
        open={addonModalVisible}
        onCancel={() => setAddonModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleSaveAddon}
          initialValues={editingAddon || {
            name: '',
            description: '',
            price: 0,
            cost: 0,
            trackInventory: false,
            currentStock: 0,
            isActive: true
          }}
        >
          <Form.Item
            name="name"
            label={t('pages.menuCenter.modifierName')}
            rules={[{ required: true, message: t('pages.menuCenter.modifierNameRequired') }]}
          >
            <Input placeholder={t('pages.menuCenter.modifierNamePlaceholder')} maxLength={50} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('pages.menuCenter.description')}
            rules={[{ required: true, message: t('pages.menuCenter.descriptionRequired') }]}
          >
            <Input.TextArea 
              placeholder={t('pages.menuCenter.descriptionPlaceholder')} 
              rows={3} 
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label={t('pages.menuCenter.priceLabel')}
                rules={[
                  { required: true, message: t('pages.menuCenter.priceRequired') },
                  { type: 'number', min: 0, message: t('pages.menuCenter.priceCannotBeNegative') }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder={t('pages.menuCenter.pricePlaceholder')}
                  precision={2}
                  min={0}
                  addonBefore="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cost"
                label={t('pages.menuCenter.costLabel')}
                rules={[
                  { required: true, message: t('pages.menuCenter.costRequired') },
                  { type: 'number', min: 0, message: t('pages.menuCenter.costCannotBeNegative') }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder={t('pages.menuCenter.costPlaceholder')}
                  precision={2}
                  min={0}
                  addonBefore="$"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="trackInventory" valuePropName="checked">
            <Space>
              <Switch />
              <span>{t('pages.menuCenter.enableInventory')}</span>
            </Space>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.trackInventory !== currentValues.trackInventory
            }
          >
            {({ getFieldValue }) => {
              const trackInventory = getFieldValue('trackInventory')
              return trackInventory ? (
                <Form.Item
                  name="currentStock"
                  label={t('pages.menuCenter.currentStock')}
                  rules={[
                    { required: true, message: t('pages.menuCenter.currentStockRequired') },
                    { type: 'number', min: 0, message: t('pages.menuCenter.stockCannotBeNegative') }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={t('pages.menuCenter.currentStockPlaceholder')}
                    min={0}
                    precision={0}
                  />
                </Form.Item>
              ) : null
            }}
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Space>
              <Switch defaultChecked />
              <span>{t('pages.menuCenter.activeStatus')}</span>
            </Space>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAddonModalVisible(false)}>
                {t('pages.menuCenter.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingAddon ? t('pages.menuCenter.update') : t('pages.menuCenter.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 套餐创建/编辑模态框 */}
      <Modal
        title={editingCombo ? t('pages.menuCenter.editCombo') : t('pages.menuCenter.createCombo')}
        open={comboModalVisible}
        onCancel={() => setComboModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={comboForm}
          layout="vertical"
          onFinish={handleSaveCombo}
          initialValues={{
            name: '',
            description: '',
            categoryId: undefined,
            basePrice: 0,
            discount: 0,
            discountType: 'fixed',
            isActive: true,
            comboItems: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('pages.menuCenter.comboName')}
                rules={[{ required: true, message: t('pages.menuCenter.comboNameRequired') }]}
              >
                <Input placeholder={t('pages.menuCenter.comboNamePlaceholder')} maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="所属分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {flatCategories.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>
                      <span style={{ 
                        paddingLeft: (cat.level || 0) * 16,
                        color: cat.level === 0 ? '#000' : '#666'
                      }}>
                        {cat.level && cat.level > 0 && '└─ '.repeat(cat.level)}
                        {cat.name}
                      </span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea 
              placeholder={t('pages.menuCenter.comboDescriptionPlaceholder')} 
              rows={3} 
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Space>
              <Switch defaultChecked />
              <span>{t('pages.menuCenter.activeStatus')}</span>
            </Space>
          </Form.Item>

          <Divider>{t('pages.menuCenter.comboItemsConfig')}</Divider>

          <Form.Item
            name="comboItems"
            label=""
          >
            <ComboItemsInput 
              allItems={allItems} 
              onPriceChange={(totalPrice) => {
                comboForm.setFieldsValue({ basePrice: totalPrice });
              }}
              t={t}
            />
          </Form.Item>

          <Divider>价格与折扣</Divider>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues.basePrice !== currentValues.basePrice || 
            prevValues.discount !== currentValues.discount ||
            prevValues.discountType !== currentValues.discountType
          }>
            {({ getFieldValue }) => {
              const basePrice = Number(getFieldValue('basePrice')) || 0;
              const discount = Number(getFieldValue('discount')) || 0;
              const discountType = getFieldValue('discountType') || 'fixed';
              
              let discountAmount = 0;
              if (discountType === 'fixed') {
                discountAmount = discount;
              } else {
                discountAmount = basePrice * (discount / 100);
              }
              
              const finalPrice = Math.max(0, basePrice - discountAmount);
              
              return (
                <div>
                  {/* 商品总价显示 */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                    marginBottom: 16
                  }}>
                    <Row align="middle">
                      <Col span={12}>
                        <Typography.Text type="secondary">商品总价（自动计算）</Typography.Text>
                      </Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Typography.Text strong style={{ fontSize: '18px', color: '#0369a1' }}>
                          ${basePrice.toFixed(2)}
                        </Typography.Text>
                      </Col>
                    </Row>
                  </div>

                  {/* 折扣编辑区域 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="discountType"
                        label="折扣类型"
                      >
                        <Select>
                          <Select.Option value="fixed">固定金额</Select.Option>
                          <Select.Option value="percentage">百分比</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="discount"
                        label="折扣"
                        rules={[
                          { type: 'number', min: 0, message: '折扣不能为负数' }
                        ]}
                      >
                        {discountType === 'percentage' ? (
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="0"
                            precision={2}
                            min={0}
                            max={100}
                            addonAfter="%"
                          />
                        ) : (
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="0.00"
                            precision={2}
                            min={0}
                            addonBefore="$"
                          />
                        )}
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 最终售价显示 */}
                  {basePrice > 0 && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f6ffed',
                      border: '2px solid #52c41a',
                      borderRadius: '6px',
                      marginTop: 8
                    }}>
                      <Row align="middle">
                        <Col span={12}>
                          <Typography.Text strong style={{ fontSize: '16px' }}>最终售价</Typography.Text>
                          {discountAmount > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                              原价 ${basePrice.toFixed(2)} - 折扣 {discountType === 'percentage' 
                                ? `${discount}%` 
                                : `$${discount.toFixed(2)}`}
                            </div>
                          )}
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                          <Typography.Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                            ${finalPrice.toFixed(2)}
                          </Typography.Text>
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>

          {/* 隐藏的basePrice字段,用于存储自动计算的价格 */}
          <Form.Item name="basePrice" hidden>
            <InputNumber />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button onClick={() => setComboModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading.creating}>
                {editingCombo ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default MenuCenter
