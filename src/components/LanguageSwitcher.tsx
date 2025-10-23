import React from 'react'
import { Select } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface LanguageSwitcherProps {
  size?: 'small' | 'middle' | 'large'
  style?: React.CSSProperties
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  size = 'middle', 
  style 
}) => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    try { 
      localStorage.setItem('app.lng', lng) 
    } catch {}
    i18n.changeLanguage(lng)
  }

  return (
    <Select
      size={size}
      style={{ minWidth: 140, ...style }}
      value={i18n.language}
      onChange={handleLanguageChange}
      suffixIcon={<GlobalOutlined />}
      options={[
        { label: '中文（简体）', value: 'zh-CN' },
        { label: '中文（繁體）', value: 'zh-TW' },
        { label: 'English', value: 'en' }
      ]}
    />
  )
}

export default LanguageSwitcher




