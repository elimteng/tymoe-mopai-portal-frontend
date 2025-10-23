import React, { useState, useEffect } from 'react'
import { Button, Card, Typography, Layout, Form, Input, Alert, Space, Divider, Row, Col } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Turnstile } from '@marsidev/react-turnstile'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '../../auth/AuthProvider'
import { login, getCaptchaStatus, forgotPassword, resetPassword, getOAuthToken, type LoginPayload, type CaptchaStatus, type UserTokenRequest } from '../../services/auth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import AuthBackground from '../../components/AuthBackground'

const { Content } = Layout
const { Title, Text } = Typography

interface LoginFormData {
  email: string
  password: string
}

interface ForgotPasswordFormData {
  email: string
}

interface ResetPasswordFormData {
  verificationCode: string
  newPassword: string
  confirmPassword: string
}

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>()
  const [forgotForm] = Form.useForm<ForgotPasswordFormData>()
  const [resetForm] = Form.useForm<ResetPasswordFormData>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuthContext()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [captchaStatus, setCaptchaStatus] = useState<CaptchaStatus | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'reset'>('email')
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string>('')

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

  // 检查来自注册页面的状态消息
  useEffect(() => {
    const state = location.state as { message?: string; email?: string }
    if (state?.message) {
      setSuccess(state.message)
      if (state.email) {
        form.setFieldsValue({ email: state.email })
      }
    }
  }, [location.state, form])

  // 检查是否需要验证码
  const checkCaptchaRequired = async (email: string) => {
    if (!email) return
    
    try {
      const status = await getCaptchaStatus(email)
      setCaptchaStatus(status)
    } catch (error) {
      console.warn('Failed to check captcha status:', error)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    if (email.includes('@')) {
      checkCaptchaRequired(email)
    }
  }

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload: LoginPayload = {
        email: values.email,
        password: values.password
      }

      // 第一步：调用登录API获取用户信息和组织列表
      const loginResponse = await login(payload, 'beverage')
      console.log('Login response:', loginResponse)
      
      if (!loginResponse.success) {
        setError('登录失败，请检查邮箱和密码')
        return
      }

      // 第二步：调用OAuth Token API获取access_token和refresh_token
      const tokenRequest: UserTokenRequest = {
        grant_type: 'password',
        username: values.email, // 使用邮箱作为username
        password: values.password,
        client_id: 'tymoe-web'
      }

      const tokenResponse = await getOAuthToken(tokenRequest, 'beverage')
      console.log('Token response:', tokenResponse)
      
      const { access_token, refresh_token } = tokenResponse
      
      if (access_token) {
        // 保存tokens到localStorage
        localStorage.setItem('access_token', access_token)
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token)
        }
        
        // 调用AuthProvider的login方法设置用户状态，将组织信息合并到用户对象中
        const userWithOrgs = {
          ...loginResponse.user,
          organizations: loginResponse.organizations
        }
        await authLogin(access_token, userWithOrgs)
        
        // 正常跳转，路由保护会自动处理组织检查
        const from = (location.state as any)?.from || '/'
        navigate(from, { replace: true })
      } else {
        console.log('⚠️ No access_token found in token response')
        setError('登录成功但未收到访问令牌，请重试')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error?.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (values: ForgotPasswordFormData) => {
    setForgotPasswordLoading(true)
    setForgotPasswordMessage('')

    try {
      const response = await forgotPassword(values.email)
      console.log('Forgot password response:', response)
      
      if (response.success) {
        setForgotPasswordEmail(values.email)
        setForgotPasswordStep('reset')
        setForgotPasswordMessage(response.message || t('auth.forgotPassword.emailSent'))
      } else {
        setForgotPasswordMessage('发送失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      if (error?.response?.data?.detail) {
        setForgotPasswordMessage(error.response.data.detail)
      } else if (error instanceof Error) {
        setForgotPasswordMessage(error.message)
      } else {
        setForgotPasswordMessage('发送失败，请稍后重试')
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleResetPassword = async (values: ResetPasswordFormData) => {
    if (values.newPassword !== values.confirmPassword) {
      setForgotPasswordMessage('两次输入的密码不一致')
      return
    }

    setForgotPasswordLoading(true)
    setForgotPasswordMessage('')

    try {
      // 使用正确的API参数：email, code, password
      const response = await resetPassword(forgotPasswordEmail, values.verificationCode, values.newPassword)
      console.log('Reset password response:', response)
      
      if (response.success) {
        setForgotPasswordMessage(response.message || '密码重置成功，请使用新密码登录')
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordStep('email')
          setForgotPasswordEmail('')
          setForgotPasswordMessage('')
        }, 2000)
      } else {
        setForgotPasswordMessage('密码重置失败，请重试')
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      if (error?.response?.data?.detail) {
        setForgotPasswordMessage(error.response.data.detail)
      } else if (error instanceof Error) {
        setForgotPasswordMessage(error.message)
      } else {
        setForgotPasswordMessage('密码重置失败，请重试')
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token)
  }

  const handleCaptchaError = () => {
    setCaptchaToken('')
    setError(t('auth.login.captchaFailed'))
  }

  if (showForgotPassword) {
    return (
      <>
        <AuthBackground />
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
          {/* 语言切换器 */}
          <div style={{ 
            position: 'fixed', 
            top: 24, 
            right: 24, 
            zIndex: 1000 
          }}>
            <LanguageSwitcher size="small" />
          </div>
          
          <Content style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 16px'
          }}>
            <Card 
              style={{ 
                width: 400, 
                maxWidth: '90vw',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                  {forgotPasswordStep === 'email' ? t('auth.forgotPassword.title') : '重置密码'}
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {forgotPasswordStep === 'email' 
                    ? t('auth.forgotPassword.description') 
                    : `验证码已发送到 ${forgotPasswordEmail}`
                  }
                </Text>
              </div>
              
              {forgotPasswordStep === 'email' ? (
                <Form
                  form={forgotForm}
                  onFinish={handleForgotPassword}
                  layout="vertical"
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="email"
                    label={t('auth.login.email')}
                    rules={[
                      { required: true, message: t('auth.login.emailRequired') },
                      { type: 'email', message: t('auth.login.emailInvalid') }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                      placeholder={t('auth.login.emailPlaceholder')}
                      style={{ borderRadius: '8px', height: '44px' }}
                    />
                  </Form.Item>

                  {forgotPasswordMessage && (
                    <Alert
                      message={forgotPasswordMessage}
                      type={forgotPasswordMessage.includes('发送') || forgotPasswordMessage.includes('已发送') ? 'success' : 'error'}
                      style={{ marginBottom: 16, borderRadius: '8px' }}
                    />
                  )}

                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={forgotPasswordLoading}
                      style={{ 
                        height: '44px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        border: 'none'
                      }}
                    >
                      {t('auth.forgotPassword.sendButton')}
                    </Button>
                  </Form.Item>

                  <Button
                    type="link"
                    block
                    onClick={() => setShowForgotPassword(false)}
                    style={{ height: '44px' }}
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Button>
                </Form>
              ) : (
                <Form
                  form={resetForm}
                  onFinish={handleResetPassword}
                  layout="vertical"
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="verificationCode"
                    label="验证码"
                    rules={[
                      { required: true, message: '请输入验证码' },
                      { len: 6, message: '验证码为6位数字' }
                    ]}
                  >
                    <Input
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      style={{ borderRadius: '8px', height: '44px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 8, message: '密码至少8位' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="请输入新密码"
                      style={{ borderRadius: '8px', height: '44px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    rules={[
                      { required: true, message: '请确认新密码' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="请再次输入新密码"
                      style={{ borderRadius: '8px', height: '44px' }}
                    />
                  </Form.Item>

                  {forgotPasswordMessage && (
                    <Alert
                      message={forgotPasswordMessage}
                      type={forgotPasswordMessage.includes('成功') ? 'success' : 'error'}
                      style={{ marginBottom: 16, borderRadius: '8px' }}
                    />
                  )}

                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={forgotPasswordLoading}
                      style={{ 
                        height: '44px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        border: 'none'
                      }}
                    >
                      重置密码
                    </Button>
                  </Form.Item>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button
                      type="link"
                      onClick={() => {
                        setForgotPasswordStep('email')
                        setForgotPasswordMessage('')
                      }}
                      style={{ padding: 0 }}
                    >
                      返回上一步
                    </Button>
                    <Button
                      type="link"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordStep('email')
                        setForgotPasswordMessage('')
                      }}
                      style={{ padding: 0 }}
                    >
                      返回登录
                    </Button>
                  </Space>
                </Form>
              )}
            </Card>
          </Content>
        </Layout>
      </>
    )
  }

  return (
    <>
      <AuthBackground />
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        {/* 语言切换器 */}
        <div style={{ 
          position: 'fixed', 
          top: 24, 
          right: 24, 
          zIndex: 1000 
        }}>
          <LanguageSwitcher size="small" />
        </div>
        
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '0 16px'
        }}>
          <Card 
            style={{ 
              width: 400, 
              maxWidth: '90vw',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                {t('auth.login.title')}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {t('auth.login.subtitle')}
              </Text>
            </div>

            <Form
              form={form}
              onFinish={handleLogin}
              layout="vertical"
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="email"
                label={t('auth.login.email')}
                rules={[
                  { required: true, message: t('auth.login.emailRequired') },
                  { type: 'email', message: t('auth.login.emailInvalid') }
                ]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                  placeholder={t('auth.login.emailPlaceholder')}
                  onChange={handleEmailChange}
                  style={{ borderRadius: '8px', height: '44px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('auth.login.password')}
                rules={[
                  { required: true, message: t('auth.login.passwordRequired') }
                ]}
                style={{ marginBottom: 20 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  style={{ borderRadius: '8px', height: '44px' }}
                />
              </Form.Item>

              {/* 验证码组件 - 紧凑显示 */}
              {turnstileSiteKey && (
                <Form.Item style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Turnstile
                      siteKey={turnstileSiteKey}
                      onSuccess={handleCaptchaSuccess}
                      onError={handleCaptchaError}
                      theme="light"
                      size="compact"
                    />
                  </div>
                </Form.Item>
              )}

              {(error || success) && (
                <Form.Item style={{ marginBottom: 20 }}>
                  {error && <Alert message={error} type="error" showIcon style={{ borderRadius: '8px' }} />}
                  {success && <Alert message={success} type="success" showIcon style={{ borderRadius: '8px' }} />}
                </Form.Item>
              )}

              <Form.Item style={{ marginBottom: 20 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{ 
                    height: '44px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 500
                  }}
                >
                  {t('auth.login.loginButton')}
                </Button>
              </Form.Item>

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Button
                    type="link"
                    block
                    onClick={() => setShowForgotPassword(true)}
                    style={{ 
                      height: '36px', 
                      padding: 0,
                      color: '#6b7280'
                    }}
                  >
                    {t('auth.login.forgotPassword')}
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="link"
                    block
                    onClick={() => navigate('/register')}
                    style={{ 
                      height: '36px', 
                      padding: 0,
                      color: '#4f46e5',
                      fontWeight: 500
                    }}
                  >
                    {t('auth.login.registerNow')}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        </Content>
      </Layout>
    </>
  )
}

export default Login