import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Typography, Space, Alert, Row, Col, Divider } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import '../../styles/phone-input.css'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../auth/AuthProvider'
import { updateProfile, type AuthUser } from '../../services/auth'

const { Title, Text } = Typography

interface ProfileFormData {
  name: string
  phone: string
}

const Profile: React.FC = () => {
  const [form] = Form.useForm<ProfileFormData>()
  const { t } = useTranslation()
  const { user, refreshUser } = useAuthContext()
  
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phone: user.phone || ''
      })
    }
  }, [user, form])

  const handleEdit = () => {
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
    setSuccess('')
    // 重置表单为原始值
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phone: user.phone || ''
      })
    }
  }

  const handleSave = async (values: ProfileFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await updateProfile({
        name: values.name,
        phone: values.phone
      })
      
      console.log('Profile updated:', updatedUser)
      
      // 刷新用户信息
      await refreshUser()
      
      setSuccess(t('pages.profile.updateSuccess'))
      setEditing(false)
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(t('pages.profile.updateFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('pages.profile.unknown')
    return new Date(dateString).toLocaleDateString()
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Alert message={t('pages.profile.noUserInfo')} type="error" />
      </div>
    )
  }


  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        {/* 头部信息 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar 
            size={80} 
            style={{ 
              backgroundColor: '#1890ff',
              marginBottom: 16,
              fontSize: '32px'
            }}
            icon={<UserOutlined />}
          >
            {getUserInitials(user.name)}
          </Avatar>
          <Title level={2} style={{ margin: 0 }}>
            {user.name}
          </Title>
          <Text type="secondary">{user.email}</Text>
        </div>

        <Divider />

        {/* 表单区域 */}
        <Form
          form={form}
          onFinish={handleSave}
          layout="vertical"
          size="large"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('pages.profile.name')}
                rules={[
                  { required: true, message: t('pages.profile.nameRequired') },
                  { min: 2, message: t('pages.profile.nameMinLength') }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                  placeholder={t('pages.profile.namePlaceholder')}
                  disabled={!editing}
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('pages.profile.phone')}
                rules={[
                  { pattern: /^\+?[1-9]\d{1,14}$/, message: t('pages.profile.phoneInvalid') }
                ]}
              >
                {editing ? (
                  <div
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'border-color 0.3s, box-shadow 0.3s'
                    }}
                    onFocusCapture={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)'
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="CA"
                      placeholder={t('pages.profile.phonePlaceholder')}
                      className="PhoneInput"
                      value={form.getFieldValue('phone')}
                      onChange={(value) => form.setFieldsValue({ phone: value || '' })}
                      style={{
                        border: 'none',
                        width: '100%',
                        height: '38px'
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                    value={form.getFieldValue('phone')}
                    disabled
                    style={{ borderRadius: '8px', backgroundColor: '#f5f5f5' }}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('pages.profile.email')}>
            <Input
              prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
              value={user.email}
              disabled
              style={{ borderRadius: '8px', backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          {/* 消息提示 */}
          {(error || success) && (
            <Form.Item>
              {error && <Alert message={error} type="error" style={{ borderRadius: '8px' }} />}
              {success && <Alert message={success} type="success" style={{ borderRadius: '8px' }} />}
            </Form.Item>
          )}

          {/* 操作按钮 */}
          <Form.Item>
            {!editing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  border: 'none'
                }}
              >
                {t('pages.profile.editProfile')}
              </Button>
            ) : (
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckOutlined />}
                  style={{ 
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none'
                  }}
                >
                  {t('pages.profile.saveProfile')}
                </Button>
                <Button
                  onClick={handleCancel}
                  icon={<CloseOutlined />}
                  style={{ borderRadius: '8px' }}
                >
                  {t('pages.profile.cancel')}
                </Button>
              </Space>
            )}
          </Form.Item>
        </Form>

        <Divider />

        {/* 账户信息 */}
        <div>
          <Title level={4}>{t('pages.profile.accountInfo')}</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">{t('pages.profile.emailVerification')}</Text>
              <br />
              <Text type={(user.emailVerified || user.emailVerifiedAt) ? 'success' : 'warning'}>
                {(user.emailVerified || user.emailVerifiedAt) ? t('pages.profile.verified') : t('pages.profile.unverified')}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('pages.profile.registerTime')}</Text>
              <br />
              <Text>{formatDate(user.createdAt)}</Text>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  )
}

export default Profile
