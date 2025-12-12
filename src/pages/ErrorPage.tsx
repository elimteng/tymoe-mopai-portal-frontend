import React from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

interface RouteError {
  status?: number
  statusText?: string
  data?: any
  message?: string
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError
  const navigate = useNavigate()

  let errorStatus = 500
  let errorTitle = '应用发生错误'
  let errorSubtitle = '抱歉，应用遇到了一个意外错误'
  let errorDetails = ''

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status
    errorTitle = error.statusText || '错误'

    switch (error.status) {
      case 404:
        errorTitle = '页面未找到'
        errorSubtitle = '抱歉，您访问的页面不存在'
        break
      case 401:
        errorTitle = '未授权'
        errorSubtitle = '您需要登录才能访问此页面'
        break
      case 403:
        errorTitle = '禁止访问'
        errorSubtitle = '您没有权限访问此页面'
        break
      case 500:
        errorTitle = '服务器错误'
        errorSubtitle = '服务器遇到了一个错误'
        break
      default:
        errorSubtitle = `错误代码: ${error.status}`
    }

    if (error.data?.message) {
      errorDetails = error.data.message
    }
  } else if (error instanceof Error) {
    errorDetails = error.message
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div style={{ padding: '50px 20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status={errorStatus === 404 ? '404' : errorStatus === 403 ? '403' : errorStatus === 401 ? '401' : '500'}
        title={errorTitle}
        subTitle={
          <>
            <p>{errorSubtitle}</p>
            {errorDetails && process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  marginTop: '20px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  textAlign: 'left',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  错误详情（仅开发环境显示）
                </summary>
                <pre
                  style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {errorDetails}
                </pre>
              </details>
            )}
          </>
        }
        extra={[
          <Button
            key="back"
            onClick={handleGoBack}
            style={{ marginRight: '10px' }}
          >
            返回上一页
          </Button>,
          <Button
            key="home"
            type="primary"
            onClick={handleGoHome}
            style={{ marginRight: '10px' }}
          >
            返回首页
          </Button>,
          <Button key="reload" onClick={handleReload}>
            刷新页面
          </Button>,
        ]}
      />
    </div>
  )
}

export default ErrorPage
