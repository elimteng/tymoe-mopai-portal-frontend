import React, { useState } from 'react'
import { Button, Card, Typography, Space, Alert, Input, Form } from 'antd'
import { httpService } from '../services/http'
import { register, verifyEmail, resendVerificationCode, login, getOAuthToken, getOrganizations, createOrganization, type RegisterPayload, type UserTokenRequest, type CreateOrganizationPayload } from '../services/auth'

const { Title, Text } = Typography

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [testEmail, setTestEmail] = useState<string>('')
  const [testPassword, setTestPassword] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [orgName, setOrgName] = useState<string>('')
  const [orgType, setOrgType] = useState<string>('MAIN')

  const testServiceInfo = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 测试服务根路径信息 - 这会通过代理访问 https://tymoe.com/
      console.log('Testing service root via proxy...')
      const response = await httpService.get('/')
      console.log('Service info response:', response)
      setResult(response.data)
    } catch (err) {
      console.error('Service info error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // 获取详细错误信息
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any
        console.log('Detailed error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
        setResult({
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          note: "这可能是因为根路径 / 不在代理配置中"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const testHealthCheck = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 测试健康检查端点
      const response = await httpService.get('/healthz')
      console.log('Health check response:', response)
      setResult(response.data)
    } catch (err) {
      console.error('Health check error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testRegisterEndpoint = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 测试注册端点 - 使用唯一邮箱避免重复注册
      const timestamp = Date.now()
      const testData = {
        email: `test${timestamp}@gmail.com`, // 使用唯一邮箱
        password: "Password123!",
        name: "张三",
        phone: "+8613812345678",
        organizationName: "我的公司"
      }
      
      console.log('Sending test registration data:', testData)
      const response = await httpService.post('/api/auth-service/v1/identity/register', testData)
      console.log('Register test response:', response)
      setResult(response.data)
    } catch (err) {
      console.error('Register test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // 获取详细错误信息
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any
        console.log('Detailed error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
        setResult({
          status: axiosError.response?.status,
          error_data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const testDirectAPI = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 直接测试目标 API，不通过代理
      const testData = {
        email: "test@example.com",
        password: "TestPassword123!",
        name: "Test User",
        phone: "+8613800000000",
        organizationName: "Test Organization"
      }
      
      console.log('Direct API test - sending data to: https://tymoe.com/api/auth-service/v1/identity/register')
      console.log('Data:', testData)
      
      const response = await fetch('https://tymoe.com/api/auth-service/v1/identity/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      const responseText = await response.text()
      console.log('Direct API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      })
      
    } catch (err) {
      console.error('Direct API test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult({ error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testCaptchaStatus = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 测试验证码状态端点 - 这个端点应该不需要POST数据
      const testEmail = "test@example.com"
      const response = await httpService.get(`/api/auth-service/v1/identity/captcha-status?email=${encodeURIComponent(testEmail)}`)
      console.log('Captcha status response:', response)
      setResult(response.data)
    } catch (err) {
      console.error('Captcha status test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // 获取详细错误信息
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any
        console.log('Detailed error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
        setResult({
          status: axiosError.response?.status,
          error_data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const testNewRegisterAPI = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      // 测试新的注册API
      const timestamp = Date.now()
      const payload: RegisterPayload = {
        email: `newapi${timestamp}@gmail.com`,
        password: "Password123!",
        name: "新API测试用户",
        phone: "+8613812345678"
      }
      
      console.log('Testing new register API:', payload)
      const response = await register(payload, 'beauty')
      console.log('New register API response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('New register API test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testEmailVerification = async () => {
    if (!testEmail || !verificationCode) {
      setError('请先填写邮箱和验证码')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log('Testing email verification:', { testEmail, verificationCode })
      const response = await verifyEmail(testEmail, verificationCode)
      console.log('Email verification response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Email verification test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testResendCode = async () => {
    if (!testEmail) {
      setError('请先填写邮箱')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log('Testing resend verification code:', testEmail)
      const response = await resendVerificationCode(testEmail, 'signup')
      console.log('Resend code response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Resend code test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testLoginAPI = async () => {
    if (!testEmail || !testPassword) {
      setError('请先填写邮箱和密码')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log('Testing new login API:', { testEmail, testPassword })
      const response = await login({ email: testEmail, password: testPassword }, 'beauty')
      console.log('Login API response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Login API test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testOAuthToken = async () => {
    if (!testEmail || !testPassword) {
      setError('请先填写邮箱和密码')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const tokenRequest: UserTokenRequest = {
        grant_type: 'password',
        username: testEmail,
        password: testPassword,
        client_id: 'tymoe-web'
      }

      console.log('Testing OAuth token API:', tokenRequest)
      const response = await getOAuthToken(tokenRequest, 'beauty')
      console.log('OAuth token response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('OAuth token test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testGetOrganizations = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log('Testing get organizations API')
      const response = await getOrganizations({}, 'beauty')
      console.log('Get organizations response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Get organizations test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testCreateOrganization = async () => {
    if (!orgName) {
      setError('请先填写组织名称')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const payload: CreateOrganizationPayload = {
        orgName: orgName,
        orgType: orgType as 'MAIN' | 'BRANCH' | 'FRANCHISE',
        description: `测试${orgType === 'MAIN' ? '主店' : orgType === 'BRANCH' ? '分店' : '加盟店'}`,
        location: '测试地址',
        phone: '+1234567890',
        email: 'test@example.com'
      }

      console.log('Testing create organization API:', payload)
      const response = await createOrganization(payload, 'beauty')
      console.log('Create organization response:', response)
      setResult(response)
    } catch (err: any) {
      console.error('Create organization test error:', err)
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
      setResult({
        error: err?.response?.data?.detail || err.message || 'Unknown error',
        status: err?.response?.status,
        data: err?.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const clearAuthState = () => {
    // 清除所有认证相关的存储
    localStorage.clear()
    sessionStorage.clear()
    
    // 更彻底地清除 Cookie
    const cookies = document.cookie.split(";");
    cookies.forEach(function(cookie) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // 清除多个域和路径的 Cookie
      const domains = ['', '.tymoe.com', '.localhost', 'localhost', 'tymoe.com'];
      const paths = ['/', '/api', '/auth'];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
        });
      });
    });
    
    // 特别清除已知的认证 Cookie
    const authCookies = [
      'fusionauth.at', 'fusionauth.rt', 'fusionauth.sso', 'fusionauth.remember-device',
      'account.at', 'account.rt', 'refreshToken', 'accessToken'
    ];
    
    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=tymoe.com`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.tymoe.com`;
    });
    
    setResult({ 
      message: '✅ 认证状态已彻底清除！请重新测试注册。如果仍有问题，请刷新页面。',
      clearedCookies: cookies.length 
    })
    setError('')
    
    console.log('🧹 Authentication state thoroughly cleared, cookies removed:', cookies.length)
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Card title="新版用户管理API测试">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>新版API端点测试</Title>
            <Space wrap>
              <Button 
                onClick={clearAuthState} 
                loading={loading}
                style={{ backgroundColor: '#f50', borderColor: '#f50' }}
                type="primary"
              >
                🧹 清除认证状态
              </Button>
              <Button 
                onClick={testNewRegisterAPI} 
                loading={loading}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                type="primary"
              >
                🆕 测试新版注册API
              </Button>
              <Button 
                onClick={testLoginAPI} 
                loading={loading}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                type="primary"
              >
                🔑 测试登录API
              </Button>
              <Button 
                onClick={testOAuthToken} 
                loading={loading}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                type="primary"
              >
                🎫 测试OAuth Token
              </Button>
            </Space>
            <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 6 }}>
              <Text type="secondary">
                💡 新版API测试：包含X-Product-Type请求头，支持完整的用户注册和登录流程
              </Text>
            </div>
          </div>

          <div>
            <Title level={4}>测试数据输入</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>测试邮箱:</Text>
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="输入测试邮箱"
                  style={{ marginLeft: 8, width: 300 }}
                />
              </div>
              <div>
                <Text strong>测试密码:</Text>
                <Input.Password
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="输入测试密码"
                  style={{ marginLeft: 8, width: 300 }}
                />
              </div>
              <div>
                <Text strong>验证码:</Text>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="输入6位验证码"
                  maxLength={6}
                  style={{ marginLeft: 8, width: 150 }}
                />
              </div>
            </Space>
          </div>

          <div>
            <Title level={4}>组织管理测试</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>组织名称:</Text>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="输入组织名称"
                  style={{ marginLeft: 8, width: 200 }}
                />
              </div>
              <div>
                <Text strong>组织类型:</Text>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  style={{ marginLeft: 8, padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                >
                  <option value="MAIN">主店</option>
                  <option value="BRANCH">分店</option>
                  <option value="FRANCHISE">加盟店</option>
                </select>
              </div>
            </Space>
          </div>

          <div>
            <Title level={4}>组织管理测试</Title>
            <Space wrap>
              <Button 
                onClick={testGetOrganizations} 
                loading={loading}
                style={{ backgroundColor: '#fa541c', borderColor: '#fa541c' }}
                type="primary"
              >
                🏢 获取组织列表
              </Button>
              <Button 
                onClick={testCreateOrganization} 
                loading={loading}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                type="primary"
              >
                ➕ 创建组织
              </Button>
            </Space>
          </div>

          <div>
            <Title level={4}>验证码相关测试</Title>
            <Space wrap>
              <Button 
                onClick={testEmailVerification} 
                loading={loading}
                style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
                type="primary"
              >
                📧 测试邮箱验证
              </Button>
              <Button 
                onClick={testResendCode} 
                loading={loading}
                style={{ backgroundColor: '#eb2f96', borderColor: '#eb2f96' }}
                type="primary"
              >
                🔄 重新发送验证码
              </Button>
            </Space>
          </div>

          <div>
            <Title level={4}>旧版API测试（对比用）</Title>
            <Space wrap>
              <Button 
                onClick={testCaptchaStatus} 
                loading={loading}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                type="primary"
              >
                ✅ 测试验证码状态
              </Button>
              <Button 
                onClick={testRegisterEndpoint} 
                loading={loading}
                danger
              >
                🔴 测试旧版注册API
              </Button>
            </Space>
          </div>

          {error && (
            <Alert 
              message="错误信息" 
              description={error} 
              type="error" 
              showIcon 
            />
          )}

          {result && (
            <div>
              <Title level={5}>响应结果:</Title>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 400
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <Title level={5}>当前环境变量:</Title>
            <Space direction="vertical">
              <Text><strong>VITE_API_BASE:</strong> {import.meta.env.VITE_API_BASE}</Text>
              <Text><strong>VITE_AUTH_BASE:</strong> {import.meta.env.VITE_AUTH_BASE}</Text>
              <Text><strong>VITE_AUTH_DISABLED:</strong> {import.meta.env.VITE_AUTH_DISABLED}</Text>
              <Text><strong>VITE_TURNSTILE_SITE_KEY:</strong> {import.meta.env.VITE_TURNSTILE_SITE_KEY}</Text>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default ApiTest
