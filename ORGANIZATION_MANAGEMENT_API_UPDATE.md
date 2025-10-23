# 组织管理模块API实现总结

## 概述
根据提供的API文档，我们已经完成了2️⃣组织管理模块的完整实现，包括创建组织和获取用户组织的功能。

## 主要修改内容

### 1. 认证服务更新 (`src/services/auth.ts`)

#### 新增/更新的接口类型：
- `Organization`: 更新组织接口，包含完整的组织字段
- `CreateOrganizationPayload`: 创建组织的请求参数
- `CreateOrganizationResponse`: 创建组织的响应格式
- `GetOrganizationsResponse`: 获取组织列表的响应格式
- `GetOrganizationsParams`: 获取组织列表的查询参数

#### 新增/更新的API函数：
- `getOrganizations()`: 获取用户的所有组织，支持按类型和状态筛选
- `createOrganization()`: 创建新组织，支持MAIN/BRANCH/FRANCHISE类型
- `getOrganization()`: 获取单个组织详情
- `updateOrganization()`: 更新组织信息
- `deleteOrganization()`: 删除组织

### 2. 组织管理页面 (`src/pages/OrganizationManagement/index.tsx`)

#### 主要功能：
- **组织列表展示**: 显示用户的所有组织，支持搜索和筛选
- **创建组织**: 支持创建主店、分店、加盟店
- **组织类型管理**: 根据组织类型显示不同的图标和标签
- **父组织关系**: 分店和加盟店需要选择父主店
- **表单验证**: 完整的表单验证和错误处理

#### 页面特性：
- 响应式设计，支持不同屏幕尺寸
- 实时搜索和筛选功能
- 组织类型图标和状态标签
- 详细的组织信息展示
- 用户友好的操作界面

### 3. API测试页面更新 (`src/pages/ApiTest.tsx`)

#### 新增功能：
- **组织管理测试**: 添加了获取组织列表和创建组织的测试功能
- **测试数据输入**: 支持输入组织名称和选择组织类型
- **错误处理**: 完整的错误信息显示和调试功能

### 4. Vite配置修复 (`vite.config.ts`)

#### 主要修复：
- **OAuth代理配置**: 添加了`/oauth`路径的代理配置
- **请求头处理**: 正确处理OAuth请求的CORS问题
- **调试日志**: 添加了详细的代理请求和响应日志

## API端点映射

### 组织管理流程
1. **获取组织列表**: `GET /api/auth-service/v1/organizations`
   - 请求头: `Authorization: Bearer <token>`, `X-Product-Type: beauty`
   - 查询参数: `orgType`, `status`
   - 响应: 组织列表，包含父组织名称

2. **创建组织**: `POST /api/auth-service/v1/organizations`
   - 请求头: `Authorization: Bearer <token>`, `X-Product-Type: beauty`
   - 请求体: 组织信息（名称、类型、父组织等）
   - 响应: 创建的组织详情

## 业务规则实现

### 组织所有权
- 所有组织的`userId`都是老板（当前登录用户）
- User（老板）拥有所有组织，但不直接管理店铺业务
- 店铺业务通过Account账号管理（在第三部分设计）

### 组织类型
- **MAIN（主店）**: 老板的第一个店铺，`parentOrgId = null`
- **BRANCH（分店）**: 分店，`parentOrgId = 主店ID`
- **FRANCHISE（加盟店）**: 加盟店，`parentOrgId = 主店ID`

### 组织类型区别
- 主店和分店：只能分配MANAGER, STAFF账号
- 加盟店：可以分配OWNER（加盟商）, MANAGER, STAFF账号
- 区别主要体现在Account权限，组织层面只通过orgType区分

### 数据隔离
- 通过orgId隔离不同店铺的业务数据
- 所有请求需要携带`X-Product-Type`请求头
- User在beauty前端只能看到productType=beauty的组织

## 关键设计特点

### 1. 产品类型隔离
- 所有API调用都包含`X-Product-Type`请求头（beauty/fb）
- 支持多产品线的组织管理

### 2. 组织层级关系
- 主店可以创建分店和加盟店
- 分店和加盟店必须关联到主店
- 支持显示父组织名称

### 3. 用户界面优化
- 直观的组织类型图标（皇冠、树枝、商店）
- 清晰的状态标签（活跃、暂停、已删除）
- 实时搜索和筛选功能

### 4. 表单验证
- 组织名称：2-100字符
- 电话号码：国际格式验证
- 邮箱：格式验证
- 父组织：根据组织类型动态验证

## 测试建议

1. 使用`/api-test`页面测试组织管理API
2. 测试创建不同类型的组织（主店、分店、加盟店）
3. 测试组织列表的搜索和筛选功能
4. 测试父组织关系的验证
5. 测试错误处理（无效父组织、重复名称等）

## 注意事项

1. 用户登录后如果没有组织，应该引导创建第一个主店
2. 主店不能被删除，分店和加盟店可以删除
3. 创建分店或加盟店时必须选择有效的主店作为父组织
4. 所有组织操作都需要有效的访问令牌

## 兼容性

- 保持了与现有认证系统的兼容性
- 支持渐进式功能扩展
- 为后续的Account管理模块预留了接口

## 后续扩展

这个组织管理模块为第三部分的Account管理模块奠定了基础：
- 组织创建完成后，可以为其分配Account账号
- 不同组织类型支持不同的Account角色
- 为多租户业务数据隔离提供支持


