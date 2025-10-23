import React, { useState } from 'react'
import { Card, Button, Space, Typography, Alert, Collapse, Tag } from 'antd'
import { PlayCircleOutlined, ClearOutlined } from '@ant-design/icons'
import { useAuthContext } from '../../auth/AuthProvider'
import { 
  runAllExamples, 
  cleanupTestData,
  itemManagementExamples,
  categoryManagementExamples,
  addonManagementExamples,
  attributeManagementExamples
} from '../../examples/item-management-examples'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const ItemApiTest: React.FC = () => {
  const { isAuthenticated } = useAuthContext()
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(testName)
    setResults(null)
    
    try {
      const result = await testFunction()
      setResults({ success: true, data: result })
    } catch (error) {
      setResults({ success: false, error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="需要登录"
          description="请先登录以测试商品管理服务API"
          type="warning"
          showIcon
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>商品管理服务 API 测试</Title>
        <Paragraph>
          这个页面用于测试商品管理服务的各种API功能。点击下面的按钮来执行不同的测试。
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 测试按钮 */}
          <Card title="API 测试" size="small">
            <Space wrap>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={loading === 'items'}
                onClick={() => runTest('items', itemManagementExamples)}
              >
                测试商品管理
              </Button>
              
              <Button
                icon={<PlayCircleOutlined />}
                loading={loading === 'categories'}
                onClick={() => runTest('categories', categoryManagementExamples)}
              >
                测试分类管理
              </Button>
              
              <Button
                icon={<PlayCircleOutlined />}
                loading={loading === 'addons'}
                onClick={() => runTest('addons', addonManagementExamples)}
              >
                测试Add-on管理
              </Button>
              
              <Button
                icon={<PlayCircleOutlined />}
                loading={loading === 'attributes'}
                onClick={() => runTest('attributes', attributeManagementExamples)}
              >
                测试属性管理
              </Button>
              
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={loading === 'all'}
                onClick={() => runTest('all', runAllExamples)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                运行所有测试
              </Button>
              
              <Button
                danger
                icon={<ClearOutlined />}
                loading={loading === 'cleanup'}
                onClick={() => runTest('cleanup', cleanupTestData)}
              >
                清理测试数据
              </Button>
            </Space>
          </Card>

          {/* 测试结果 */}
          {results && (
            <Card title="测试结果" size="small">
              {results.success ? (
                <Alert
                  message="测试成功"
                  description="API调用成功完成"
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Alert
                  message="测试失败"
                  description={results.error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <Collapse>
                <Panel header="详细结果" key="1">
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 400
                  }}>
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                </Panel>
              </Collapse>
            </Card>
          )}

          {/* API 信息 */}
          <Card title="API 服务信息" size="small">
            <Space direction="vertical">
              <div>
                <Text strong>服务端点: </Text>
                <Tag color="blue">{import.meta.env.VITE_ITEM_MANAGE_BASE || 'https://tymoe.com/api/item-manage/v1'}</Tag>
              </div>
              
              <div>
                <Text strong>认证状态: </Text>
                <Tag color="green">已认证</Tag>
              </div>
              
              <div>
                <Text strong>支持的功能: </Text>
                <Space wrap>
                  <Tag>商品CRUD</Tag>
                  <Tag>分类管理</Tag>
                  <Tag>属性管理</Tag>
                  <Tag>Add-on管理</Tag>
                  <Tag>批量操作</Tag>
                  <Tag>搜索</Tag>
                </Space>
              </div>
            </Space>
          </Card>

          {/* 使用说明 */}
          <Card title="使用说明" size="small">
            <Collapse>
              <Panel header="API 使用示例" key="1">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 4,
                  overflow: 'auto'
                }}>
{`// 导入服务
import { itemManagementService } from '@/services/item-management'

// 获取商品列表
const items = await itemManagementService.getItems({
  page: 1,
  limit: 10,
  status: 'ACTIVE'
})

// 创建商品
const newItem = await itemManagementService.createItem({
  name: '商品名称',
  price: 99.99,
  status: 'ACTIVE'
})

// 搜索商品
const searchResults = await itemManagementService.searchItems('关键词')

// 获取分类树
const categoryTree = await itemManagementService.getCategoryTree()`}
                </pre>
              </Panel>
              
              <Panel header="错误处理" key="2">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 4,
                  overflow: 'auto'
                }}>
{`try {
  const items = await itemManagementService.getItems()
  console.log('获取商品成功:', items)
} catch (error) {
  console.error('获取商品失败:', error)
  // 处理错误...
}`}
                </pre>
              </Panel>
            </Collapse>
          </Card>
        </Space>
      </Card>
    </div>
  )
}

export default ItemApiTest
