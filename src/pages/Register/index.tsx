import React, { useState } from 'react'
import { Button, Card, Typography, Layout, Form, Input, Alert, Space, Divider, Row, Col } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, ShopOutlined, SafetyOutlined } from '@ant-design/icons'
import { Turnstile } from '@marsidev/react-turnstile'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import '../../styles/phone-input.css'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register, verifyEmail, resendVerificationCode, type RegisterPayload, type RegisterResponse, type EmailVerificationResponse } from '../../services/auth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import AuthBackground from '../../components/AuthBackground'

const { Content } = Layout
const { Title, Text } = Typography

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
}

interface VerifyFormData {
  verificationCode: string
}

type RegistrationStep = 'register' | 'verify'

const Register: React.FC = () => {
  const [form] = Form.useForm<RegisterFormData>()
  const [verifyForm] = Form.useForm<VerifyFormData>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [step, setStep] = useState<RegistrationStep>('register')
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  const [resendLoading, setResendLoading] = useState(false)

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

  const handleRegister = async (values: RegisterFormData) => {
    if (values.password !== values.confirmPassword) {
      setError(t('auth.register.confirmPasswordMismatch'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload: RegisterPayload = {
        email: values.email,
        password: values.password,
        name: values.name,
        phone: values.phone
      }

      console.log('Sending registration payload:', payload)
      const response: RegisterResponse = await register(payload, 'beauty')
      console.log('Registration response:', response)
      
      if (response.success) {
        console.log('✅ Registration successful, switching to verify step')
        setSuccess(response.message || t('auth.register.registrationSuccess'))
        setRegisteredEmail(values.email)
        setStep('verify')
        setError('')
      } else {
        setError('注册失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error?.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('注册失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (values: VerifyFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response: EmailVerificationResponse = await verifyEmail(registeredEmail, values.verificationCode)
      console.log('Verification response:', response)
      
      if (response.success) {
        setSuccess(response.message || t('auth.verify.verifySuccess'))
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: t('auth.verify.loginMessage'),
              email: registeredEmail 
            } 
          })
        }, 2000)
      } else {
        setError(t('auth.verify.verifyFailed'))
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      if (error?.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('验证失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToRegister = () => {
    setStep('register')
    setError('')
    setSuccess('')
    setRegisteredEmail('')
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await resendVerificationCode(registeredEmail, 'signup')
      console.log('Resend code response:', response)
      
      if (response.success) {
        setSuccess(response.message || '验证码已重新发送，请检查您的邮箱')
      } else {
        setError('重新发送失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Resend code error:', error)
      if (error?.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('重新发送失败，请稍后重试')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token)
  }

  const handleCaptchaError = () => {
    setCaptchaToken('')
    setError(t('auth.register.captchaFailed'))
  }

  const getCardTitle = () => {
    switch (step) {
      case 'register':
        return t('auth.register.title')
      case 'verify':
        return t('auth.verify.title')
      default:
        return t('auth.register.title')
    }
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
          padding: '20px 16px'
        }}>
          <Card 
            style={{ 
              width: step === 'register' ? 500 : 400, 
              maxWidth: '95vw',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: step === 'register' ? 24 : 32 }}>
              <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                {getCardTitle()}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {step === 'register' ? t('auth.register.subtitle') : t('auth.verify.subtitle')}
              </Text>
            </div>

            {step === 'register' ? (
              <Form
                form={form}
                onFinish={handleRegister}
                layout="vertical"
                requiredMark={false}
                size="large"
              >
                {/* 第一行：邮箱和姓名 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label={t('auth.register.email')}
                      rules={[
                        { required: true, message: t('auth.register.emailRequired') },
                        { type: 'email', message: t('auth.register.emailInvalid') }
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                        placeholder={t('auth.register.emailPlaceholder')}
                        style={{ borderRadius: '8px', height: '40px' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label={t('auth.register.name')}
                      rules={[
                        { required: true, message: t('auth.register.nameRequired') },
                        { min: 2, message: t('auth.register.nameMinLength') }
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                        placeholder={t('auth.register.namePlaceholder')}
                        style={{ borderRadius: '8px', height: '40px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第二行：手机号码 */}
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="phone"
                      label={t('auth.register.phone')}
                      rules={[
                        { max: 32, message: t('auth.register.phoneMaxLength') }
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <div 
                        className="phone-input-wrapper"
                        style={{ 
                          border: '1px solid #d9d9d9', 
                          borderRadius: '8px', 
                          overflow: 'hidden',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor: '#ffffff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#40a9ff'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
                        onFocusCapture={(e) => {
                          e.currentTarget.style.borderColor = '#40a9ff'
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
                          placeholder={t('auth.register.phonePlaceholder')}
                          className="PhoneInput"
                          style={{
                            border: 'none',
                            width: '100%',
                            height: '38px'
                          }}
                          onChange={(value) => {
                            form.setFieldsValue({ phone: value || '' })
                          }}
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 第三行：密码 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="password"
                      label={t('auth.register.password')}
                      rules={[
                        { required: true, message: t('auth.register.passwordRequired') },
                        { min: 8, message: t('auth.register.passwordMinLength') },
                        {
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: t('auth.register.passwordPattern')
                        }
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                        placeholder={t('auth.register.passwordPlaceholder')}
                        style={{ borderRadius: '8px', height: '40px' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="confirmPassword"
                      label={t('auth.register.confirmPassword')}
                      rules={[
                        { required: true, message: t('auth.register.confirmPasswordRequired') },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error(t('auth.register.confirmPasswordMismatch')))
                          },
                        })
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                        placeholder={t('auth.register.confirmPasswordPlaceholder')}
                        style={{ borderRadius: '8px', height: '40px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 验证码 */}
                {turnstileSiteKey && (
                  <Form.Item style={{ marginBottom: 16 }}>
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
                  <Form.Item style={{ marginBottom: 16 }}>
                    {error && <Alert message={error} type="error" showIcon style={{ borderRadius: '8px' }} />}
                    {success && <Alert message={success} type="success" showIcon style={{ borderRadius: '8px' }} />}
                  </Form.Item>
                )}

                <Form.Item style={{ marginBottom: 16 }}>
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
                    {t('auth.register.registerButton')}
                  </Button>
                </Form.Item>

                {/* 临时测试按钮 */}
                <Form.Item style={{ marginBottom: 16 }}>
                  <Button
                    type="dashed"
                    block
                    onClick={() => {
                      const testEmail = form.getFieldValue('email') || 'test@example.com'
                      setRegisteredEmail(testEmail)
                      setStep('verify')
                      setSuccess('测试模式：跳转到验证步骤')
                    }}
                    style={{ 
                      height: '36px',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    🧪 测试验证界面
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ marginRight: 8 }}>
                    {t('auth.register.hasAccount')}
                  </Text>
                  <Button
                    type="link"
                    onClick={() => navigate('/login')}
                    style={{ 
                      padding: 0,
                      color: '#4f46e5',
                      fontWeight: 500
                    }}
                  >
                    {t('auth.register.backToLogin')}
                  </Button>
                </div>
              </Form>
            ) : (
              // 验证码验证页面
              <div>
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <SafetyOutlined style={{ fontSize: 48, color: '#4f46e5', marginBottom: 16 }} />
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '16px' }}>{t('auth.verify.description')}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>{registeredEmail}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '14px' }}>{t('auth.verify.instruction')}</Text>
                </div>

                <Form
                  form={verifyForm}
                  onFinish={handleVerify}
                  layout="vertical"
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="verificationCode"
                    label={t('auth.verify.code')}
                    rules={[
                      { required: true, message: t('auth.verify.codeRequired') },
                      { len: 6, message: t('auth.verify.codeLength') },
                      { pattern: /^\d{6}$/, message: t('auth.verify.codePattern') }
                    ]}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      placeholder={t('auth.verify.codePlaceholder')}
                      maxLength={6}
                      style={{ 
                        textAlign: 'center', 
                        fontSize: '18px', 
                        letterSpacing: '4px',
                        borderRadius: '8px',
                        height: '50px'
                      }}
                    />
                  </Form.Item>

                  {(error || success) && (
                    <Form.Item style={{ marginBottom: 20 }}>
                      {error && <Alert message={error} type="error" showIcon style={{ borderRadius: '8px' }} />}
                      {success && <Alert message={success} type="success" showIcon style={{ borderRadius: '8px' }} />}
                    </Form.Item>
                  )}

                  <Form.Item style={{ marginBottom: 16 }}>
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
                      {t('auth.verify.verifyButton')}
                    </Button>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      block
                      loading={resendLoading}
                      onClick={handleResendCode}
                      disabled={loading}
                      style={{ 
                        height: '36px',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      重新发送验证码
                    </Button>
                  </Form.Item>
                  
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="link"
                      onClick={handleBackToRegister}
                      disabled={loading}
                      style={{ 
                        color: '#6b7280',
                        padding: 0
                      }}
                    >
                      {t('auth.verify.backToRegister')}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </Card>
        </Content>
      </Layout>
    </>
  )
}

export default Register