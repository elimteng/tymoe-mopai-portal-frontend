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
  Tooltip,
  Table,
  Tabs,
  Upload,
  Image
} from 'antd'
import type { RcFile } from 'antd/es/upload/interface'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
  PictureOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../auth/AuthProvider'
import { debugOrganizationIsolation } from '../../utils/debug-org'
import { getJWTInfo, checkJWTOrganizationInfo } from '../../utils/jwt-utils'
import { formatPrice, fromMinorUnit } from '../../utils/priceConverter'
import ModifierGroupManager from './ModifierGroupManager'
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
  // 已废弃的 Addon 类型 - 迁移到 Modifier v2.0
  type Addon,
  type ItemAddon,
  // 新的 Modifier v2.0 类型
  type ModifierGroup,
  type ModifierOption,
  type CreateModifierGroupPayload,
  type CreateModifierOptionPayload,
  type AddModifierGroupToItemPayload,
  type Combo,
  type CreateComboPayload,
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
                      {formatPrice(addon.price)}
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

// 新的商品修饰符配置组件（基于 Modifier v2.0 API）
interface ItemModifierConfig {
  groupId: string
  isRequired: boolean
  minSelections: number
  maxSelections: number
  sortOrder: number
  enabledOptions: string[] // 启用的选项ID列表
  defaultOptionId?: string // 默认选项ID
  optionPrices: Record<string, number> // 选项价格覆盖
}

const ItemModifierConfigInput: React.FC<{
  value?: ItemModifierConfig[];
  onChange?: (value: ItemModifierConfig[]) => void;
  modifierGroups: ModifierGroup[];
  t: any;
}> = ({ value = [], onChange, modifierGroups, t }) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    value.map(config => config.groupId) || []
  );

  const [configs, setConfigs] = useState<Record<string, ItemModifierConfig>>(
    value.reduce((acc, config) => ({ ...acc, [config.groupId]: config }), {})
  );

  // 使用 JSON.stringify 创建稳定的依赖值，避免无限循环
  const valueJsonString = useMemo(() => JSON.stringify(value || []), [value]);

  useEffect(() => {
    setSelectedGroupIds(value.map(config => config.groupId) || []);
    setConfigs(value.reduce((acc, config) => ({ ...acc, [config.groupId]: config }), {}));
  }, [valueJsonString]);

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    let newSelectedIds: string[];
    let newConfigs = { ...configs };

    if (checked) {
      newSelectedIds = [...selectedGroupIds, groupId];
      const group = modifierGroups.find(g => g.id === groupId);
      const allOptionIds = group?.options?.map(opt => opt.id) || [];
      newConfigs[groupId] = {
        groupId,
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: newSelectedIds.length,
        enabledOptions: allOptionIds,
        optionPrices: {}
      };
    } else {
      newSelectedIds = selectedGroupIds.filter(id => id !== groupId);
      delete newConfigs[groupId];
    }

    setSelectedGroupIds(newSelectedIds);
    setConfigs(newConfigs);
    onChange?.(Object.values(newConfigs));
  };

  const handleConfigChange = (groupId: string, updates: Partial<ItemModifierConfig>) => {
    const newConfigs = {
      ...configs,
      [groupId]: { ...configs[groupId], ...updates }
    };
    setConfigs(newConfigs);
    onChange?.(Object.values(newConfigs));
  };

  const handleOptionToggle = (groupId: string, optionId: string, checked: boolean) => {
    const config = configs[groupId];
    const enabledOptions = checked
      ? [...config.enabledOptions, optionId]
      : config.enabledOptions.filter(id => id !== optionId);
    
    handleConfigChange(groupId, { enabledOptions });
  };

  const handleOptionPriceChange = (groupId: string, optionId: string, price: number | null) => {
    const config = configs[groupId];
    const newPrices = { ...config.optionPrices };
    
    if (price === null) {
      delete newPrices[optionId];
    } else {
      newPrices[optionId] = price;
    }
    
    handleConfigChange(groupId, { optionPrices: newPrices });
  };

  const activeGroups = modifierGroups.filter(group => group.isActive);

  return (
    <div>
      <Typography.Text strong style={{ marginBottom: 16, display: 'block' }}>
        选择自定义选项组
      </Typography.Text>
      
      {activeGroups.length === 0 ? (
        <Empty description="暂无可用的自定义选项组">
          <Typography.Text type="secondary">
            请先在「自定义选项组管理」中创建自定义选项组
          </Typography.Text>
        </Empty>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {activeGroups.map(group => {
            const isSelected = selectedGroupIds.includes(group.id);
            const config = configs[group.id];
            const options = group.options || [];
            
            return (
              <Card
                key={group.id}
                size="small"
                style={{
                  border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: isSelected ? '#f0f5ff' : '#fff'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* 组头部 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        checked={isSelected}
                        onChange={(checked) => handleGroupToggle(group.id, checked)}
                      />
                      <div>
                        <Typography.Text strong>{group.displayName}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                          ({group.name})
                        </Typography.Text>
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {group.groupType === 'property' ? '属性' : group.groupType === 'addon' ? '加料' : '自定义'}
                        </Tag>
                      </div>
                    </div>
                    {isSelected && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {options.length} 个选项
                      </Typography.Text>
                    )}
                  </div>

                  {/* 选择规则配置 */}
                  {isSelected && config && (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <Row gutter={16}>
                        <Col span={6}>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text style={{ fontSize: 12 }}>是否必选</Typography.Text>
                          </div>
                          <Switch
                            checked={config.isRequired}
                            onChange={(checked) => {
                              // 如果切换到必选，且最少选择为0，自动设为1
                              // 如果切换到非必选，自动设置最少选择为0
                              const updates: Partial<ItemModifierConfig> = { isRequired: checked }
                              if (checked && config.minSelections === 0) {
                                updates.minSelections = 1
                              } else if (!checked) {
                                updates.minSelections = 0
                              }
                              handleConfigChange(group.id, updates)
                            }}
                            checkedChildren="必选"
                            unCheckedChildren="可选"
                          />
                        </Col>
                        <Col span={9}>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text style={{ fontSize: 12 }}>
                              最少选择
                              {config.isRequired && (
                                <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                                  (必选时≥1)
                                </Typography.Text>
                              )}
                            </Typography.Text>
                          </div>
                          <InputNumber
                            size="small"
                            min={config.isRequired ? 1 : 0}
                            max={config.maxSelections}
                            value={config.minSelections}
                            onChange={(value) => {
                              // 确保必选时最少选择≥1
                              const minValue = config.isRequired ? Math.max(1, value || 1) : (value || 0)
                              handleConfigChange(group.id, { minSelections: minValue })
                            }}
                            style={{ width: '100%' }}
                            disabled={!config.isRequired}
                          />
                        </Col>
                        <Col span={9}>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text style={{ fontSize: 12 }}>最多选择</Typography.Text>
                          </div>
                          <InputNumber
                            size="small"
                            min={config.minSelections}
                            value={config.maxSelections}
                            onChange={(value) => handleConfigChange(group.id, { maxSelections: value || 1 })}
                            style={{ width: '100%' }}
                          />
                        </Col>
                      </Row>

                      {/* 选项配置 - 网格卡片布局 */}
                      {options.length > 0 && (
                        <>
                          <Divider style={{ margin: '8px 0' }}>选项配置</Divider>
                          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            <Row gutter={[8, 8]}>
                              {options.map(option => {
                                const isEnabled = config.enabledOptions.includes(option.id);
                                const isDefault = config.defaultOptionId === option.id;
                                const hasCustomPrice = option.id in config.optionPrices;
                                const customPrice = hasCustomPrice ? config.optionPrices[option.id] : undefined;
                                const defaultPrice = typeof option.defaultPrice === 'string' 
                                  ? parseFloat(option.defaultPrice) 
                                  : option.defaultPrice;
                                
                                return (
                                  <Col span={12} key={option.id}>
                                    <Card
                                      size="small"
                                      style={{
                                        backgroundColor: isEnabled ? '#fff' : '#fafafa',
                                        border: isDefault ? '2px solid #1890ff' : '1px solid #e8e8e8',
                                        height: '100%'
                                      }}
                                      bodyStyle={{ padding: 8 }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Switch
                                            size="small"
                                            checked={isEnabled}
                                            onChange={(checked) => handleOptionToggle(group.id, option.id, checked)}
                                          />
                                          <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 500, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {option.displayName}
                                            </div>
                                            <div style={{ color: '#999', fontSize: 10 }}>
                                              {option.name}
                                            </div>
                                          </div>
                                          {isDefault && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>默认</Tag>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                          <span style={{ color: '#666', flexShrink: 0 }}>¥{defaultPrice.toFixed(2)}</span>
                                          <InputNumber
                                            size="small"
                                            min={0}
                                            precision={2}
                                            value={customPrice}
                                            placeholder="商品价"
                                            onChange={(value) => handleOptionPriceChange(group.id, option.id, value)}
                                            style={{ flex: 1, minWidth: 0 }}
                                            disabled={!isEnabled}
                                          />
                                          {hasCustomPrice ? (
                                            <Button
                                              size="small"
                                              type="text"
                                              danger
                                              onClick={() => handleOptionPriceChange(group.id, option.id, null)}
                                              disabled={!isEnabled}
                                              style={{ padding: '0 4px', minWidth: 24, fontSize: 14 }}
                                              title="清除"
                                            >
                                              ×
                                            </Button>
                                          ) : (
                                            <Button
                                              size="small"
                                              onClick={() => {
                                                if (isEnabled && !isDefault) {
                                                  handleConfigChange(group.id, {
                                                    defaultOptionId: option.id
                                                  });
                                                }
                                              }}
                                              disabled={!isEnabled || isDefault}
                                              style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                                            >
                                              设默认
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  </Col>
                                );
                              })}
                            </Row>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
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
            {item.name} - {formatPrice(item.basePrice)}
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
                      {formatPrice(item.basePrice)}
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
                            {formatPrice(record.priceModifier || 0)}
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
                {fromMinorUnit(Math.abs(Number(option.priceModifier) || 0)).toFixed(2)})
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
  // Modifier v2.0: 使用 ModifierGroup 替代 Addon
  // 为了兼容现有 UI，我们将 ModifierGroup 强制转换为 Addon 类型
  const [addons, setAddons] = useState<Addon[]>([])
  const [itemAddons, setItemAddons] = useState<Record<string, ItemAddon[]>>({})
  // 自定义选项组（统一的 ModifierGroup 管理）
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [modifierGroupOptions, setModifierGroupOptions] = useState<Record<string, ModifierOption[]>>({})
  const [combos, setCombos] = useState<Combo[]>([])
  const [categoryCombos, setCategoryCombos] = useState<Combo[]>([]) // 当前分类下的套餐
  const [loading, setLoading] = useState({
    categories: false,
    items: false,
    creating: false,
    updating: false,
    attributes: false,
    modifiers: false,
    combos: false
  })

  // 模态框状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [itemModalVisible, setItemModalVisible] = useState(false)
  const [attributeTypeModalVisible, setAttributeTypeModalVisible] = useState(false)
  const [attributeOptionModalVisible, setAttributeOptionModalVisible] = useState(false)
  const [addonModalVisible, setAddonModalVisible] = useState(false)
  const [modifierGroupModalVisible, setModifierGroupModalVisible] = useState(false)
  const [modifierOptionModalVisible, setModifierOptionModalVisible] = useState(false)
  const [comboModalVisible, setComboModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingAttributeType, setEditingAttributeType] = useState<ItemAttributeType | null>(null)
  const [editingAttributeOption, setEditingAttributeOption] = useState<ItemAttributeOption | null>(null)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null)
  const [editingModifierOption, setEditingModifierOption] = useState<ModifierOption | null>(null)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [selectedAttributeTypeId, setSelectedAttributeTypeId] = useState<string | null>(null)
  const [selectedModifierGroupId, setSelectedModifierGroupId] = useState<string | null>(null)
  const [modifierGroupTypeFilter, setModifierGroupTypeFilter] = useState<'all' | 'property' | 'addon' | 'custom'>('all')

  // 图片上传状态
  const [imageUploading, setImageUploading] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined)

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
  const [modifierGroupForm] = Form.useForm<CreateModifierGroupPayload & { options: ModifierOption[] }>()
  const [modifierOptionForm] = Form.useForm<CreateModifierOptionPayload>()
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
        loadModifierGroups()
        loadCombos()
        loadAllItems()
      } catch (error) {
        console.error('❌ [MENU CENTER] Error in useEffect:', error)
      }
    }
  }, [isAuthenticated, modifierGroupTypeFilter])

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
      loadModifierGroups()
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
  // Modifier v2.0: 使用 getModifierGroups 代替 getAddons
  const loadAddons = async () => {
    try {
      // 从 Modifier API 获取 groupType === 'addon' 的修饰符组
      const modifierGroups = await itemManagementService.getModifierGroups({ groupType: 'addon', isActive: true })
      // 将 ModifierGroup 适配为 Addon 类型供 UI 使用
      const adaptedAddons = modifierGroups.map(group => ({
        id: group.id,
        name: group.displayName,
        description: group.name,
        price: 0, // Modifier 中价格在 ItemModifierPrice 中定义
        cost: 0,
        trackInventory: false,
        currentStock: 0,
        isActive: group.isActive
      })) as Addon[]
      setAddons(adaptedAddons)
    } catch (error) {
      console.error('Failed to load addons:', error)
      message.error('加载加料失败')
      setAddons([])
    }
  }

  // 加载商品加料关联
  // Modifier v2.0: 使用 getItemModifiers 代替 getItemAddons
  const loadItemAddons = async (itemId: string) => {
    try {
      const itemModifiers = await itemManagementService.getItemModifiers(itemId)
      // 将 ItemModifierGroup 适配为 ItemAddon 类型供 UI 使用
      const adaptedItemAddons = itemModifiers
        .filter(im => im.group?.groupType === 'addon') // 只获取类型为 'addon' 的修饰符
        .map(im => ({
          id: im.id,
          itemId: im.itemId,
          addonId: im.modifierGroupId,
          maxQuantity: im.maxSelections || 1,
          addon: {
            id: im.modifierGroupId,
            name: im.group?.displayName || '',
            description: im.group?.name || '',
            price: 0,
            cost: 0,
            trackInventory: false,
            currentStock: 0,
            isActive: im.group?.isActive || false
          }
        })) as ItemAddon[]
      setItemAddons(prev => ({
        ...prev,
        [itemId]: adaptedItemAddons
      }))
    } catch (error) {
      console.error('Failed to load item addons:', error)
      message.error('加载商品加料失败')
    }
  }

  // 加载自定义选项组（ModifierGroups）
  const loadModifierGroups = async () => {
    setLoading(prev => ({ ...prev, modifiers: true }))
    try {
      // 根据过滤器加载 ModifierGroups
      const params = modifierGroupTypeFilter !== 'all' ? { groupType: modifierGroupTypeFilter as any } : {}
      const groups = await itemManagementService.getModifierGroups({ isActive: true, ...params })
      setModifierGroups(groups)
      console.log('✅ Loaded modifier groups:', groups)
    } catch (error) {
      console.error('Failed to load modifier groups:', error)
      message.error('加载自定义选项组失败')
      setModifierGroups([])
    } finally {
      setLoading(prev => ({ ...prev, modifiers: false }))
    }
  }

  // 加载自定义选项（ModifierOptions）
  const loadModifierGroupOptions = async (groupId: string) => {
    try {
      // 从 ModifierGroup 中直接获取 options（如果后端支持详细查询）
      // 这里暂时假设 getModifierGroups 返回完整的 options 信息
      const groups = await itemManagementService.getModifierGroups()
      const group = groups.find(g => g.id === groupId)
      if (group && group.options) {
        setModifierGroupOptions(prev => ({ ...prev, [groupId]: group.options || [] }))
      }
    } catch (error) {
      console.error('Failed to load modifier options:', error)
      message.error('加载自定义选项失败')
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
    
    // 将价格从分转换为元（后端存储的是分，表单显示的是元）
    comboForm.setFieldsValue({
      name: combo.name,
      description: combo.description,
      categoryId: combo.categoryId,
      basePrice: fromMinorUnit(combo.basePrice),
      discount: combo.discount !== undefined && combo.discount !== null ? fromMinorUnit(combo.discount) : undefined,
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
    setPreviewImageUrl(undefined)
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
    
    // 加载商品的修饰符配置（Modifier v2.0）
    let itemModifiersData: ItemModifierConfig[] = []
    try {
      // 获取商品的修饰符组关联
      const itemModifierGroups = await itemManagementService.getItemModifiers(item.id)
      
      // 转换为表单需要的格式
      itemModifiersData = itemModifierGroups.map(itemModGroup => {
        const group = itemModGroup.group
        const options = group?.options || []
        
        // 提取启用的选项、默认选项和价格覆盖
        const enabledOptions: string[] = []
        let defaultOptionId: string | undefined = undefined
        const optionPrices: Record<string, number> = {}
        
        options.forEach(option => {
          // 检查选项的 itemOptions 配置
          if (option.itemOptions && option.itemOptions.length > 0) {
            const itemOption = option.itemOptions[0]

            // 如果选项已启用，添加到 enabledOptions
            if (itemOption.isEnabled) {
              enabledOptions.push(option.id)
            }

            // 如果是默认选项，记录
            if (itemOption.isDefault) {
              defaultOptionId = option.id
            }
          }
          // 🔑 修改：如果没有 itemOptions 配置，不默认启用
          // 这样新增的选项不会自动关联到已有商品
          
          // 检查是否有商品级价格覆盖
          // 服务层 getItemModifiers() 已经将价格从分转换为元
          if (option.itemPrice !== null && option.itemPrice !== undefined) {
            optionPrices[option.id] = typeof option.itemPrice === 'string'
              ? parseFloat(option.itemPrice)
              : option.itemPrice
          }
        })
        
        return {
          groupId: itemModGroup.modifierGroupId,
          isRequired: itemModGroup.isRequired,
          minSelections: itemModGroup.minSelections,
          maxSelections: itemModGroup.maxSelections,
          sortOrder: itemModGroup.sortOrder,
          enabledOptions,
          defaultOptionId,
          optionPrices
        }
      })
    } catch (error) {
      console.error('Failed to load item modifiers:', error)
      // 不阻塞编辑流程，只是记录错误
    }
    
    // 将价格从分转换为元（后端存储的是分，表单显示的是元）
    itemForm.setFieldsValue({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      basePrice: fromMinorUnit(item.basePrice),
      cost: item.cost !== undefined && item.cost !== null ? fromMinorUnit(item.cost) : undefined,
      isActive: item.isActive,
      customFields: item.customFields,
      attributeConfigs: attributeConfigsData,
      itemModifiers: itemModifiersData
    } as any)
    setPreviewImageUrl(item.imageUrl)
    setItemModalVisible(true)
  }

  // 图片上传前验证
  const beforeImageUpload = (file: RcFile): boolean | string => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!isValidType) {
      message.error('只支持 JPG、PNG、WebP 格式的图片')
      return Upload.LIST_IGNORE
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  // 上传图片
  const handleImageUpload = async (file: RcFile) => {
    if (!editingItem) {
      message.warning('请先保存商品，然后再上传图片')
      return false
    }

    setImageUploading(true)
    try {
      const result = await itemManagementService.uploadItemImage(editingItem.id, file)
      setPreviewImageUrl(result.image.url)
      setEditingItem({ ...editingItem, imageUrl: result.image.url })
      message.success('图片上传成功')
      loadItems() // 刷新列表
      loadAllItems() // 刷新全部商品
    } catch (error: any) {
      console.error('Image upload failed:', error)
      message.error(error?.response?.data?.error || '图片上传失败')
    } finally {
      setImageUploading(false)
    }
    return false
  }

  // 删除图片
  const handleImageDelete = async () => {
    if (!editingItem) return

    Modal.confirm({
      title: '确认删除图片',
      content: '确定要删除这张商品图片吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await itemManagementService.deleteItemImage(editingItem.id)
          setPreviewImageUrl(undefined)
          setEditingItem({ ...editingItem, imageUrl: undefined })
          message.success('图片删除成功')
          loadItems()
          loadAllItems()
        } catch (error: any) {
          console.error('Image delete failed:', error)
          message.error(error?.response?.data?.error || '图片删除失败')
        }
      }
    })
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

      // 注：属性管理已迁移到修饰符系统 (Modifier v2.0)
      // 属性现在通过以下 API 单独管理:
      //   - POST /items/{itemId}/modifier-groups (关联修饰符组)
      //   - POST /items/{itemId}/modifier-options (配置选项行为)

//       // 转换attributeConfigs为API期望的attributes格式
//       const attributes = values.attributeConfigs?.map((config: ItemAttributeConfig) => ({
//         attributeTypeId: config.attributeTypeId,
//         isRequired: config.isRequired,
//         optionOverrides: config.optionOverrides || {},
//         allowedOptions: config.allowedOptions && config.allowedOptions.length > 0 ? config.allowedOptions : undefined,
//         defaultOptionId: config.defaultOptionId,
//         optionOrder: config.optionOrder && config.optionOrder.length > 0 ? config.optionOrder : undefined
//       })) || []

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
        }
        
        await itemManagementService.updateItem(editingItem.id, updatePayload)
        
        // 处理修饰符配置（Modifier v2.0）
        if (values.itemModifiers && Array.isArray(values.itemModifiers)) {
          // 1. 先清除现有的修饰符组关联
          const existingModifiers = await itemManagementService.getItemModifiers(editingItem.id)
          for (const existingModifier of existingModifiers) {
            await itemManagementService.removeModifierGroupFromItem(editingItem.id, existingModifier.modifierGroupId)
          }
          
          // 2. 添加新的修饰符组关联并配置选项
          for (const modifierConfig of values.itemModifiers as ItemModifierConfig[]) {
            // 2.1 关联修饰符组（定义选择规则）
            const groupPayload: AddModifierGroupToItemPayload = {
              modifierGroupId: modifierConfig.groupId,
              isRequired: modifierConfig.isRequired,
              minSelections: modifierConfig.minSelections,
              maxSelections: modifierConfig.maxSelections,
              sortOrder: modifierConfig.sortOrder
            }
            await itemManagementService.addModifierGroupToItem(editingItem.id, groupPayload)
            
            // 2.2 配置选项行为（isDefault, isEnabled, displayOrder）
            const group = modifierGroups.find(g => g.id === modifierConfig.groupId)
            if (group && group.options) {
              const optionConfigs = group.options.map((option, index) => ({
                modifierOptionId: option.id,
                isDefault: modifierConfig.defaultOptionId === option.id,
                isEnabled: modifierConfig.enabledOptions.includes(option.id),
                displayOrder: index
              }))
              
              if (optionConfigs.length > 0) {
                await itemManagementService.configureItemModifierOptions(editingItem.id, {
                  options: optionConfigs
                })
              }
            }
            
            // 2.3 设置商品级修饰符价格（如果有覆盖）
            if (Object.keys(modifierConfig.optionPrices).length > 0) {
              const priceOverrides = Object.entries(modifierConfig.optionPrices).map(([optionId, price]) => ({
                modifierOptionId: optionId,
                price: price
              }))
              await itemManagementService.setItemModifierPrices(editingItem.id, {
                prices: priceOverrides
              })
            }
          }
        }
        
        message.success('商品更新成功')
      } else {
        // 创建商品
        // 注：属性现在通过修饰符系统管理，不在创建时发送
        const createPayload: CreateItemPayload = {
          name: values.name.trim(),
          description: values.description?.trim(),
          categoryId: categoryId,
          basePrice: Number(values.basePrice), // 确保是数字类型
          cost: (values.cost !== undefined && values.cost !== null && values.cost !== '') ? Number(values.cost) : undefined, // 成本可选
          isActive: values.isActive !== false, // 默认为true，确保是布尔类型
          customFields: values.customFields
          // attributes 字段已移除 - 属性现在通过修饰符管理 API 单独处理
        }
        
        const createdItem = await itemManagementService.createItem(createPayload)
        
        // 处理修饰符配置（Modifier v2.0）
        if (values.itemModifiers && Array.isArray(values.itemModifiers) && createdItem.id) {
          for (const modifierConfig of values.itemModifiers as ItemModifierConfig[]) {
            // 1. 关联修饰符组（定义选择规则）
            const groupPayload: AddModifierGroupToItemPayload = {
              modifierGroupId: modifierConfig.groupId,
              isRequired: modifierConfig.isRequired,
              minSelections: modifierConfig.minSelections,
              maxSelections: modifierConfig.maxSelections,
              sortOrder: modifierConfig.sortOrder
            }
            await itemManagementService.addModifierGroupToItem(createdItem.id, groupPayload)
            
            // 2. 配置选项行为（isDefault, isEnabled, displayOrder）
            const group = modifierGroups.find(g => g.id === modifierConfig.groupId)
            if (group && group.options) {
              const optionConfigs = group.options.map((option, index) => ({
                modifierOptionId: option.id,
                isDefault: modifierConfig.defaultOptionId === option.id,
                isEnabled: modifierConfig.enabledOptions.includes(option.id),
                displayOrder: index
              }))
              
              if (optionConfigs.length > 0) {
                await itemManagementService.configureItemModifierOptions(createdItem.id, {
                  options: optionConfigs
                })
              }
            }
            
            // 3. 设置商品级修饰符价格（如果有覆盖）
            if (Object.keys(modifierConfig.optionPrices).length > 0) {
              const priceOverrides = Object.entries(modifierConfig.optionPrices).map(([optionId, price]) => ({
                modifierOptionId: optionId,
                price: price
              }))
              await itemManagementService.setItemModifierPrices(createdItem.id, {
                prices: priceOverrides
              })
            }
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
  // Modifier v2.0: 使用删除 ModifierGroup
  const handleDeleteAddon = async (id: string) => {
    try {
      // 注意：后端可能没有 deleteModifierGroup 端点，这里需要确认后端实现
      // 暂时使用旧的 API，如果失败则提示迁移进度
      await itemManagementService.deleteAddon(id)
      message.success(t('pages.menuCenter.deleteModifierSuccess'))
      loadAddons()
    } catch (error) {
      console.error('Failed to delete addon:', error)
      message.error(t('pages.menuCenter.deleteModifierFailed'))
    }
  }

  // 保存加料（创建或更新）
  // Modifier v2.0: 迁移到使用 createModifierGroup/updateModifierGroup
  const handleSaveAddon = async (values: any) => {
    setLoading(prev => ({ ...prev, creating: true }))
    try {
      const payload: CreateModifierGroupPayload = {
        name: values.description || values.name, // 在 Modifier 中使用 name
        displayName: values.name, // 在 Modifier 中使用 displayName 作为显示名称
        groupType: 'addon',
      }

      if (editingAddon) {
        // 更新现有 ModifierGroup - 目前还没有 updateModifierGroup API
        // 暂时使用旧的 updateAddon API
        await itemManagementService.updateAddon(editingAddon.id, values)
        message.success(t('pages.menuCenter.updateModifierSuccess'))
      } else {
        // 创建新的 ModifierGroup
        await itemManagementService.createModifierGroup(payload)
        message.success(t('pages.menuCenter.createModifierSuccess'))
      }
      setAddonModalVisible(false)
      setEditingAddon(null)
      loadAddons()
    } catch (error) {
      console.error('Failed to save addon:', error)
      message.error(editingAddon ? t('pages.menuCenter.updateModifierFailed') : t('pages.menuCenter.createModifierFailed'))
    } finally {
      setLoading(prev => ({ ...prev, creating: false }))
    }
  }

  // 添加商品加料关联
  // Modifier v2.0: 使用 addModifierGroupToItem
  const handleAddItemAddon = async (itemId: string, payload: { addonId: string; maxQuantity: number }) => {
    try {
      // 适配 ItemAddon 到 ItemModifierGroup
      const addonId = payload.addonId // 这在新架构中是 modifierGroupId
      const modifierPayload: AddModifierGroupToItemPayload = {
        modifierGroupId: addonId,
        isRequired: false,
        minSelections: 0,
        maxSelections: payload.maxQuantity || 1
      }
      await itemManagementService.addModifierGroupToItem(itemId, modifierPayload)
      message.success('添加加料成功')
      loadItemAddons(itemId)
    } catch (error) {
      console.error('Failed to add item addon:', error)
      message.error('添加加料失败')
    }
  }

  // 移除商品加料关联
  // Modifier v2.0: 使用 removeModifierGroupFromItem
  const handleRemoveItemAddon = async (itemId: string, addonId: string) => {
    try {
      // addonId 实际上是 modifierGroupId
      await itemManagementService.removeModifierGroupFromItem(itemId, addonId)
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
      console.log('🔍 [MENU CENTER] Filtering items for category:', selectedCategoryId)
      console.log('📦 [MENU CENTER] All loaded items:', items)
      
      if (!items || !Array.isArray(items)) return []
      
      // 移除严格的分类ID过滤，因为:
      // 1. API已经根据categoryId过滤了返回的数据
      // 2. 某些情况下(如子分类) items中的categoryId可能与selectedCategoryId不完全匹配
      // 3. 调试显示后端返回了数据，但前端过滤导致显示为空
      return items
    },
    [items, selectedCategoryId]
  )

  // 初始化数据加载
  React.useEffect(() => {
    if (isAuthenticated) {
      loadCategories()
      loadAttributeTypes()
      loadModifierGroups() // 加载修饰符组
    }
  }, [isAuthenticated])

  // 当选中分类变化时，加载商品和套餐
  React.useEffect(() => {
    if (selectedCategoryId) {
      loadItems()
    }
  }, [selectedCategoryId])

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
                                    {t('pages.menuCenter.salePrice')}: {formatPrice(item.basePrice)}
                                  </Typography.Text>
                                  {item.cost && (
                                    <Typography.Text type="secondary">
                                      {t('pages.menuCenter.cost')}: {formatPrice(item.cost)}
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
                                            <span style={{ fontSize: '10px', marginLeft: 4 }}>{formatPrice(addon.price)}</span>
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
                        // 价格以分为单位
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
                                          {formatPrice(basePrice)}
                                        </Typography.Text>
                                      </span>
                                      {discount > 0 && (
                                        <>
                                          <span>
                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('pages.menuCenter.discount')}: </Typography.Text>
                                            <Typography.Text type="danger">
                                              {combo.discountType === 'percentage' ? `-${discount}%` : `-${formatPrice(discount)}`}
                                            </Typography.Text>
                                          </span>
                                          <span>
                                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{t('pages.menuCenter.finalPrice')}: </Typography.Text>
                                            <Typography.Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                                              {formatPrice(finalPrice)}
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
                    key: 'modifiers',
                    label: '自定义选项组',
                    children: (
                      <ModifierGroupManager />
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
                        return (
                          <Typography.Text style={{ fontSize: '14px' }}>
                            {formatPrice(price)}
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
                              : `-${formatPrice(discount)}`}
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
                            {formatPrice(finalPrice)}
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
                        style={{ marginBottom: editingItem ? 16 : 0 }}
                      >
                        <Input.TextArea rows={2} placeholder={t('pages.menuCenter.itemDescriptionPlaceholder')} maxLength={500} />
                      </Form.Item>

                      {/* 图片上传 - 仅在编辑模式显示 */}
                      {editingItem ? (
                        <Form.Item label="商品图片" style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            {previewImageUrl ? (
                              <div style={{ position: 'relative' }}>
                                <Image
                                  src={previewImageUrl}
                                  alt="商品图片"
                                  width={120}
                                  height={120}
                                  style={{ objectFit: 'cover', borderRadius: 8 }}
                                />
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  loading={imageUploading}
                                  onClick={handleImageDelete}
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    background: 'rgba(255,255,255,0.9)',
                                    borderRadius: '50%',
                                    padding: 4,
                                    minWidth: 24,
                                    height: 24,
                                  }}
                                />
                              </div>
                            ) : (
                              <Upload
                                accept=".jpg,.jpeg,.png,.webp"
                                showUploadList={false}
                                beforeUpload={beforeImageUpload}
                                customRequest={({ file }) => handleImageUpload(file as RcFile)}
                                disabled={imageUploading}
                              >
                                <div
                                  style={{
                                    width: 120,
                                    height: 120,
                                    border: '1px dashed #d9d9d9',
                                    borderRadius: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                  }}
                                >
                                  {imageUploading ? (
                                    <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                  ) : (
                                    <>
                                      <PictureOutlined style={{ fontSize: 24, color: '#999' }} />
                                      <span style={{ marginTop: 8, color: '#666', fontSize: 12 }}>上传图片</span>
                                    </>
                                  )}
                                </div>
                              </Upload>
                            )}
                            <div style={{ color: '#999', fontSize: 12 }}>
                              <div>支持 JPG、PNG、WebP 格式</div>
                              <div>最大 5MB</div>
                            </div>
                          </div>
                        </Form.Item>
                      ) : (
                        <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                          <PictureOutlined style={{ marginRight: 4 }} />
                          请先保存商品，然后再上传图片
                        </div>
                      )}
                    </Card>
                  </div>
                )
              },
              {
                key: 'modifiers',
                label: '自定义选项配置',
                children: (
                  <Form.Item
                    name="itemModifiers"
                    label={
                      <Space>
                        <span>自定义选项配置</span>
                        <Tooltip title="为商品配置自定义选项组，包括选择规则、默认选项和价格">
                          <Button type="link" size="small" style={{ padding: 0 }}>
                            ?
                          </Button>
                        </Tooltip>
                      </Space>
                    }
                  >
                    <ItemModifierConfigInput
                      modifierGroups={modifierGroups}
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
                          {formatPrice(basePrice)}
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
                              原价 {formatPrice(basePrice)} - 折扣 {discountType === 'percentage'
                                ? `${discount}%`
                                : formatPrice(discount)}
                            </div>
                          )}
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                          <Typography.Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                            {formatPrice(finalPrice)}
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
