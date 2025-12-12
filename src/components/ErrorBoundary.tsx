import React, { ReactNode, ReactElement } from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: { componentStack: string } | null
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // 记录错误到控制台和错误追踪服务
    console.error('❌ ErrorBoundary caught an error:', error)
    console.error('📍 Component Stack:', errorInfo.componentStack)

    this.setState({
      error,
      errorInfo,
    })

    // 可以在这里集成错误追踪服务（如 Sentry）
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px 20px' }}>
          <Result
            status="500"
            title="应用发生错误"
            subTitle={
              <>
                <p>抱歉，应用遇到了一个意外错误，请尝试刷新页面或返回重试。</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details
                    style={{
                      marginTop: '20px',
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      textAlign: 'left',
                      maxHeight: '300px',
                      overflow: 'auto',
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
                      }}
                    >
                      <strong>错误信息：</strong>
                      {this.state.error.toString()}
                      {'\n\n'}
                      <strong>堆栈跟踪：</strong>
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </>
            }
            extra={[
              <Button
                key="reset"
                type="primary"
                onClick={this.handleReset}
                style={{ marginRight: '10px' }}
              >
                返回并重试
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
            ]}
          />
        </div>
      )
    }

    return this.props.children as ReactElement
  }
}

export default ErrorBoundary
