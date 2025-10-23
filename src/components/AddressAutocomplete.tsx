import React, { useState, useEffect, useRef } from 'react'
import { Input, List, Typography, Spin, Alert } from 'antd'
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { searchAddressSuggestions, type AddressSuggestion } from '../services/address'
import './AddressAutocomplete.css'

const { Text } = Typography

interface AddressAutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onSelect?: (address: AddressSuggestion) => void
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value = '',
  onChange,
  placeholder = '请输入地址',
  disabled = false,
  onSelect
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.trim().length >= 2) {
        await searchAddress(inputValue.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // 300ms 防抖

    return () => clearTimeout(timer)
  }, [inputValue])

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddress = async (query: string) => {
    if (!query) return

    setLoading(true)
    setError(null)

    try {
      const response = await searchAddressSuggestions(query, 15)
      
      if (response.success) {
        setSuggestions(response.suggestions)
        setShowSuggestions(response.suggestions.length > 0)
        
        // 如果没有结果，显示提示
        if (response.suggestions.length === 0) {
          setError('未找到匹配的地址，请尝试输入更详细的信息（如：街道名称、门牌号、城市）')
        }
      } else {
        setError(response.error || '搜索失败')
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (err) {
      console.error('Address search error:', err)
      setError('搜索服务暂时不可用，请稍后重试')
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)
    
    if (newValue.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    onChange?.(suggestion.display_name)
    onSelect?.(suggestion)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="address-autocomplete">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        prefix={<EnvironmentOutlined />}
        suffix={loading ? <Spin size="small" /> : <SearchOutlined />}
        className="address-input"
      />
      
      {showSuggestions && (
        <div ref={suggestionsRef} className="suggestions-container">
          {error && (
            <Alert
              message="搜索失败"
              description={error}
              type="warning"
              size="small"
              style={{ margin: '8px' }}
            />
          )}
          
          {suggestions.length > 0 && (
            <List
              size="small"
              dataSource={suggestions}
              renderItem={(suggestion) => (
                <List.Item
                  className="suggestion-item"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  style={{ cursor: 'pointer', padding: '8px 12px' }}
                >
                  <List.Item.Meta
                    avatar={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                    title={
                      <Text strong style={{ fontSize: '14px' }}>
                        {suggestion.display_name.split(',')[0]}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {suggestion.display_name}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
          
          {suggestions.length === 0 && !loading && inputValue.length >= 2 && (
            <div className="no-suggestions">
              <Text type="secondary" style={{ padding: '16px', display: 'block', textAlign: 'center' }}>
                未找到相关地址，请尝试其他关键词
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete


