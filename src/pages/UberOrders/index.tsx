import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  List,
  Empty,
  Space,
  Tag,
  Spin,
  message,
  Divider,
  Typography,
  Row,
  Col,
  Select,
  Segmented,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { orderService, Order } from '@/services/orderService'

type OrderView = 'all' | 'pending'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED'

const UberOrders: React.FC = () => {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [merchantId, setMerchantId] = useState<string>('')
  const [viewMode, setViewMode] = useState<OrderView>('pending')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

  // 初始化商家 ID
  useEffect(() => {
    // 尝试从不同位置获取 merchantId
    const id =
      localStorage.getItem('merchant_id') ||
      localStorage.getItem('merchantId') ||
      localStorage.getItem('organization_id') ||
      'unknown'

    setMerchantId(id)
    console.log('📝 设置 merchantId:', id)
  }, [])

  // 获取订单
  const fetchOrders = async () => {
    if (!merchantId || merchantId === 'unknown') {
      console.warn('⚠️ merchantId 未设置，跳过获取订单')
      return
    }

    try {
      setRefreshing(true)
      if (viewMode === 'pending') {
        const data = await orderService.getPendingOrders(merchantId)
        setOrders(data || [])
      } else {
        const statusToFilter = statusFilter !== 'ALL' ? statusFilter : undefined
        const data = await orderService.getAllOrders(merchantId, statusToFilter)
        setAllOrders(data || [])
        setOrders(data || [])
      }
    } catch (error) {
      console.error('获取订单失败:', error)
      message.error('获取订单失败，请稍后重试')
    } finally {
      setRefreshing(false)
    }
  }

  // 初始加载和轮询
  useEffect(() => {
    if (!merchantId || merchantId === 'unknown') {
      return
    }

    fetchOrders()

    // 每 5 秒轮询一次
    const interval = setInterval(() => {
      fetchOrders()
    }, 5000)

    return () => clearInterval(interval)
  }, [merchantId, viewMode, statusFilter])

  // 处理接受订单
  const handleAccept = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId)
      setLoading(true)
      await orderService.acceptOrder(orderId)
      message.success('订单已接受')

      // 移除已接受的订单
      setOrders(orders.filter(o => o.id !== orderId))
    } catch (error) {
      console.error('接受订单失败:', error)
      message.error('接受订单失败，请稍后重试')
    } finally {
      setLoading(false)
      setProcessingOrderId(null)
    }
  }

  // 处理拒绝订单
  const handleReject = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId)
      setLoading(true)
      await orderService.rejectOrder(orderId, 'Restaurant rejected')
      message.success('订单已拒绝')

      // 移除已拒绝的订单
      setOrders(orders.filter(o => o.id !== orderId))
    } catch (error) {
      console.error('拒绝订单失败:', error)
      message.error('拒绝订单失败，请稍后重试')
    } finally {
      setLoading(false)
      setProcessingOrderId(null)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {merchantId === 'unknown' && (
        <Card
          style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#ffc069' }}
          title="⚠️ 配置提示"
        >
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <strong>merchantId</strong> 未正确设置。请确保：
            <ul>
              <li>已正确登录系统</li>
              <li>组织已被选中</li>
              <li>或在 localStorage 中设置 <code>merchant_id</code> 或 <code>merchantId</code></li>
            </ul>
            当前 merchantId: <code>{merchantId}</code>
          </Typography.Paragraph>
        </Card>
      )}

      <Card
        title={
          <Space>
            <span>🛵 Uber 订单管理</span>
            <Tag color={viewMode === 'pending' ? 'red' : 'blue'}>{orders.length}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as OrderView)}
              options={[
                { label: '待处理', value: 'pending' },
                { label: '全部订单', value: 'all' }
              ]}
            />
            {viewMode === 'all' && (
              <Select
                style={{ width: 120 }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}
                options={[
                  { label: '全部状态', value: 'ALL' },
                  { label: '待处理', value: 'PENDING' },
                  { label: '已确认', value: 'CONFIRMED' },
                  { label: '准备中', value: 'PREPARING' },
                  { label: '已就绪', value: 'READY' },
                  { label: '已取货', value: 'PICKED_UP' },
                  { label: '已完成', value: 'COMPLETED' },
                  { label: '已取消', value: 'CANCELLED' }
                ]}
              />
            )}
            <Button
              type="primary"
              loading={refreshing}
              onClick={fetchOrders}
            >
              🔄 刷新
            </Button>
          </Space>
        }
      >
        {orders.length === 0 ? (
          <Empty
            description={refreshing ? '加载中...' : viewMode === 'pending' ? '暂无待处理订单' : '暂无订单'}
            style={{ marginTop: 50, marginBottom: 50 }}
          />
        ) : (
          <Spin spinning={loading}>
            <List
              dataSource={orders}
              renderItem={(order) => (
                <Card
                  key={order.id}
                  size="small"
                  style={{
                    marginBottom: 16,
                    borderLeft: '4px solid #ff7875',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* 订单基本信息 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Space>
                          <Typography.Title level={5} style={{ margin: 0 }}>
                            订单 #{order.displayId}
                          </Typography.Title>
                          <Tag color={order.status === 'PENDING' ? 'orange' : order.status === 'CONFIRMED' ? 'blue' : order.status === 'PREPARING' ? 'cyan' : order.status === 'READY' ? 'green' : order.status === 'COMPLETED' ? 'success' : 'error'}>
                            {order.status}
                          </Tag>
                        </Space>
                      </div>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        ${order.totalAmount.toFixed(2)}
                      </Typography.Title>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  {/* 顾客信息 */}
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    <Col span={12}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, minWidth: 60, color: '#666' }}>顾客:</span>
                        <span style={{ color: '#333', flex: 1 }}>{order.consumerName}</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, minWidth: 60, color: '#666' }}>电话:</span>
                        <span style={{ color: '#333', flex: 1 }}>{order.consumerPhone}</span>
                      </div>
                    </Col>
                  </Row>

                  {/* 订单备注 */}
                  {order.specialInstructions && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontWeight: 500, minWidth: 60, color: '#666' }}>备注:</span>
                      <span style={{ color: '#333', flex: 1 }}>{order.specialInstructions}</span>
                    </div>
                  )}

                  {/* 商品列表 */}
                  <div style={{ marginBottom: 12 }}>
                    <Typography.Text strong>商品：</Typography.Text>
                    <ul style={{ marginTop: 8, paddingLeft: 20, listStyle: 'none' }}>
                      {order.items.map((item) => (
                        <li key={item.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                          {/* 商品基本信息 */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>
                              {item.name} <span style={{ color: '#999', fontSize: 12 }}>x{item.quantity}</span>
                            </span>
                            <span style={{ color: '#1890ff', fontWeight: 500 }}>
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* 自定义选项（修改器）*/}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div style={{ marginLeft: 12, marginTop: 8, marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid #52c41a' }}>
                              <Typography.Text type="success" style={{ fontSize: 12, fontWeight: 500 }}>
                                🎯 自定义选项：
                              </Typography.Text>
                              {item.modifiers.map((group, groupIndex) => (
                                <div key={groupIndex} style={{ marginTop: 4, fontSize: 12 }}>
                                  <div style={{ color: '#666', fontWeight: 500 }}>
                                    {group.title}:
                                  </div>
                                  <ul style={{ marginTop: 2, marginBottom: 4, paddingLeft: 16, color: '#333' }}>
                                    {group.selectedItems.map((selectedItem, itemIndex) => (
                                      <li key={itemIndex} style={{ listStyle: 'disc' }}>
                                        {selectedItem.title} x{selectedItem.quantity}
                                        {selectedItem.price > 0 && (
                                          <span style={{ color: '#ff7a45', marginLeft: 4 }}>
                                            +${selectedItem.price.toFixed(2)}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 特殊说明 */}
                          {item.specialInstructions && (
                            <div style={{ color: '#ff7875', fontSize: 12, marginTop: 4 }}>
                              📝 特殊说明: {item.specialInstructions}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  {/* 操作按钮 */}
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    {order.status === 'PENDING' && (
                      <>
                        <Button
                          danger
                          onClick={() => handleReject(order.id)}
                          loading={processingOrderId === order.id && loading}
                          disabled={processingOrderId !== null && processingOrderId !== order.id}
                        >
                          ❌ 拒绝
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => handleAccept(order.id)}
                          loading={processingOrderId === order.id && loading}
                          disabled={processingOrderId !== null && processingOrderId !== order.id}
                        >
                          ✅ 接受
                        </Button>
                      </>
                    )}
                    {order.status !== 'PENDING' && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        状态：{order.status}
                      </Typography.Text>
                    )}
                  </Space>
                </Card>
              )}
            />
          </Spin>
        )}
      </Card>

      {/* 说明文字 */}
      <Card
        title="ℹ️ 说明"
        style={{ marginTop: 16 }}
        size="small"
      >
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>待处理模式</strong>：显示所有待处理的订单，需要及时接受或拒绝
          </li>
          <li>
            <strong>全部订单模式</strong>：显示所有订单，可按状态筛选（待处理、已确认、准备中、已就绪、已取货、已完成、已取消）
          </li>
          <li>页面每 5 秒自动刷新一次订单列表</li>
          <li>超过 11.5 分钟的待处理订单将自动拒绝</li>
          <li>只有待处理的订单可以进行接受或拒绝操作</li>
        </ul>
      </Card>
    </div>
  )
}

export default UberOrders
