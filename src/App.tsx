import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ConfigProvider, theme } from 'antd'
import { AuthProvider } from '@/auth/AuthProvider'

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { borderRadius: 6 }
      }}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
