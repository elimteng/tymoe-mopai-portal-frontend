import React from 'react'

const AuthBackground: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
      zIndex: -1
    }}>
      {/* 装饰性几何图形 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '30px',
        transform: 'rotate(45deg)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '20%',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        animation: 'float 4s ease-in-out infinite'
      }} />
      
      {/* 网格背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.5
      }} />
      
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  )
}

export default AuthBackground
