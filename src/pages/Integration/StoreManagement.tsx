import React, { useState, useEffect } from 'react'
import { Card, Button, Spin, Row, Col, Form, Modal, Space, DatePicker, Tag, Radio } from 'antd'
import { useTranslation } from 'react-i18next'
import { LoadingOutlined, PoweroffOutlined } from '@ant-design/icons'
import { uberStoreStatusService, StoreInfo, StoreStatus } from '@/services/uberStoreStatus'
import dayjs from 'dayjs'

interface StoreManagementProps {
  merchantId: string
  storeId: string
  storeName: string
}

interface DetailedStoreStatus {
  status: 'ONLINE' | 'OFFLINE'
  isOfflineUntil?: string
  offlineReason?: string
  offlineReasonMetadata?: string
}

/**
 * 店铺管理组件
 * 展示店铺基本信息和管理店铺状态
 */
const StoreManagement: React.FC<StoreManagementProps> = ({ merchantId, storeId, storeName }) => {
  const { t } = useTranslation()
  const [busyModeForm] = Form.useForm()
  const [pauseOrdersForm] = Form.useForm()

  // 店铺状态
  const [loading, setLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null)
  const [detailedStatus, setDetailedStatus] = useState<DetailedStoreStatus | null>(null)

  // 暂停接单
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [pauseLoading, setPauseLoading] = useState(false)

  // 忙碌模式
  const [showBusyModeModal, setShowBusyModeModal] = useState(false)
  const [busyModeLoading, setBusyModeLoading] = useState(false)

  // 消息
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * 加载店铺信息和状态
   */
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true)
        const info = await uberStoreStatusService.getStoreInfo(merchantId, storeId)
        setStoreInfo(info)

        const status = await uberStoreStatusService.getStoreStatus(merchantId, storeId)
        setStoreStatus(status)

        // 获取详细状态
        const detailedSt = await uberStoreStatusService.getStoreStatusDetailed(merchantId, storeId)
        setDetailedStatus(detailedSt)
      } catch (error: any) {
        setErrorMessage(error.message || '加载店铺信息失败')
      } finally {
        setLoading(false)
      }
    }

    if (merchantId && storeId) {
      loadStoreData()
    }
  }, [merchantId, storeId])

  /**
   * 暂停接单
   */
  const handlePauseOrders = async () => {
    try {
      setPauseLoading(true)
      const formValues = await pauseOrdersForm.validateFields()

      // 计算暂停时间：当前时间 + 选择的分钟数
      const pauseUntil = dayjs().add(formValues.pauseMinutes, 'minute')

      await uberStoreStatusService.pauseOrders(
        merchantId,
        storeId,
        pauseUntil.toISOString()
      )

      setSuccessMessage(`✅ 接单已暂停 ${formValues.pauseMinutes} 分钟`)
      setShowPauseModal(false)
      pauseOrdersForm.resetFields()

      // 重新加载状态
      const newDetailedStatus = await uberStoreStatusService.getStoreStatusDetailed(
        merchantId,
        storeId
      )
      setDetailedStatus(newDetailedStatus)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || '暂停接单失败')
    } finally {
      setPauseLoading(false)
    }
  }

  /**
   * 恢复接单
   */
  const handleResumeOrders = async () => {
    try {
      setLoading(true)
      await uberStoreStatusService.resumeOrders(merchantId, storeId)
      setSuccessMessage('✅ 接单已恢复')

      // 重新加载状态
      const newDetailedStatus = await uberStoreStatusService.getStoreStatusDetailed(
        merchantId,
        storeId
      )
      setDetailedStatus(newDetailedStatus)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || '恢复接单失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 设置忙碌模式
   */
  const handleSetBusyMode = async () => {
    try {
      setBusyModeLoading(true)
      const formValues = await busyModeForm.validateFields()

      // 计算忙碌模式的截止时间
      const delayUntil = dayjs().add(formValues.busyModeDuration, 'minute')

      await uberStoreStatusService.setBusyMode(
        merchantId,
        storeId,
        delayUntil.toISOString(),
        formValues.delayDuration
      )

      setSuccessMessage(`✅ 已设置 ${formValues.busyModeDuration} 分钟的高需求模式，额外准备时间 ${formValues.delayDuration} 秒`)
      setShowBusyModeModal(false)
      busyModeForm.resetFields()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || '设置忙碌模式失败')
    } finally {
      setBusyModeLoading(false)
    }
  }

  /**
   * 清除忙碌模式
   */
  const handleClearBusyMode = async () => {
    try {
      setLoading(true)
      await uberStoreStatusService.clearBusyMode(merchantId, storeId)
      setSuccessMessage('✅ 忙碌模式已清除，已恢复正常准备时间')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || '清除忙碌模式失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          tip="加载店铺信息..."
        />
      </div>
    )
  }

  return (
    <div className="store-management">
      {/* 成功消息 */}
      {successMessage && (
        <div style={{ marginBottom: '20px' }}>
          <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
            {successMessage}
          </Card>
        </div>
      )}

      {/* 错误消息 */}
      {errorMessage && (
        <div style={{ marginBottom: '20px' }}>
          <Card style={{ backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}>
            {errorMessage}
          </Card>
        </div>
      )}

      {/* 店铺状态管理 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PoweroffOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>店铺状态管理</span>
          </div>
        }
        variant="filled"
        style={{ marginBottom: '20px' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>当前状态</label>
              <Tag color={detailedStatus?.status === 'ONLINE' ? 'green' : 'red'}>
                {detailedStatus?.status === 'ONLINE' ? '在线' : '离线'}
              </Tag>
            </div>
          </Col>

          {detailedStatus?.isOfflineUntil && (
            <Col span={24}>
              <div className="status-item">
                <label>离线直到</label>
                <span>{detailedStatus.isOfflineUntil}</span>
              </div>
            </Col>
          )}

          {detailedStatus?.offlineReason && (
            <Col span={24}>
              <div className="status-item">
                <label>离线原因</label>
                <span>{detailedStatus.offlineReason}</span>
              </div>
            </Col>
          )}

          <Col span={24}>
            <Space wrap>
              <Button
                onClick={() => setShowPauseModal(true)}
                loading={pauseLoading}
              >
                暂停接单
              </Button>

              {detailedStatus?.status === 'OFFLINE' && detailedStatus?.isOfflineUntil && (
                <Button
                  onClick={handleResumeOrders}
                  loading={loading}
                >
                  恢复接单
                </Button>
              )}

              <Button
                onClick={() => setShowBusyModeModal(true)}
                loading={busyModeLoading}
              >
                忙碌模式
              </Button>

              <Button
                onClick={handleClearBusyMode}
                loading={loading}
              >
                清除忙碌
              </Button>
            </Space>
          </Col>

          <Col span={24}>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: 0 }}>
              <strong>暂停接单：</strong>指定时间内暂停接收订单。<br/>
              <strong>恢复接单：</strong>从暂停状态恢复。<br/>
              <strong>忙碌模式：</strong>临时增加订单准备时间。<br/>
              <strong>清除忙碌：</strong>恢复默认准备时间。
            </p>
          </Col>
        </Row>
      </Card>

      {/* 暂停接单模态框 */}
      <Modal
        title="暂停接单"
        open={showPauseModal}
        onCancel={() => {
          setShowPauseModal(false)
          pauseOrdersForm.resetFields()
        }}
        onOk={handlePauseOrders}
        loading={pauseLoading}
      >
        <Form form={pauseOrdersForm} layout="vertical">
          <Form.Item
            label="选择暂停时长"
            name="pauseMinutes"
            rules={[
              { required: true, message: '请选择暂停时间' },
            ]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={10}>10分钟</Radio>
                <Radio value={15}>15分钟</Radio>
                <Radio value={20}>20分钟</Radio>
                <Radio value={25}>25分钟</Radio>
                <Radio value={1440} style={{ marginTop: '10px' }}>今天不再接单</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '15px' }}>
            选择暂停时间后，店铺将停止接收新订单，直到指定时间后恢复。
          </p>
        </Form>
      </Modal>

      {/* 忙碌模式模态框 */}
      <Modal
        title="设置忙碌模式"
        open={showBusyModeModal}
        onCancel={() => {
          setShowBusyModeModal(false)
          busyModeForm.resetFields()
        }}
        onOk={handleSetBusyMode}
        loading={busyModeLoading}
      >
        <Form form={busyModeForm} layout="vertical">
          <Form.Item
            label="忙碌模式持续时间"
            name="busyModeDuration"
            rules={[
              { required: true, message: '请选择忙碌模式持续时间' },
            ]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={15}>15分钟</Radio>
                <Radio value={30}>30分钟</Radio>
                <Radio value={45}>45分钟</Radio>
                <Radio value={60}>60分钟</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="额外准备时间"
            name="delayDuration"
            rules={[
              { required: true, message: '请选择额外准备时间' },
            ]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={300}>5分钟（300秒）</Radio>
                <Radio value={600}>10分钟（600秒）</Radio>
                <Radio value={900}>15分钟（900秒）</Radio>
                <Radio value={1200}>20分钟（1200秒）</Radio>
                <Radio value={1800}>30分钟（1800秒）</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <p style={{ color: '#999', fontSize: '12px' }}>
            选择高需求模式的持续时间和额外准备时间。在此期间内每个新订单都会增加指定的准备时间。
          </p>
        </Form>
      </Modal>

    </div>
  )
}

export default StoreManagement
