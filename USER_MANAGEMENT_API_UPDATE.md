# 用户管理模块API更新总结

## 概述
根据提供的API文档，我们已经完成了用户管理模块的完整实现，包括所有1️⃣用户管理相关的API端点。

## 主要修改内容

### 1. 认证服务更新 (`src/services/auth.ts`)

#### 新增/更新的接口类型：
- `RegisterPayload`: 更新为只包含必要字段（移除了organizationName）
- `RegisterResponse`: 新的注册响应格式
- `EmailVerificationResponse`: 邮箱验证响应
- `ResendCodeResponse`: 重新发送验证码响应
- `LoginResponse`: 更新登录响应格式
- `TokenResponse`: OAuth Token响应
- `LogoutResponse`: 登出响应
- `ForgotPasswordResponse`: 忘记密码响应
- `ResetPasswordResponse`: 重置密码响应
- `ChangePasswordResponse`: 修改密码响应
- `ProfileResponse`: 用户资料响应
- `UpdateProfileResponse`: 更新资料响应
- `ChangeEmailResponse`: 修改邮箱响应
- `VerifyEmailChangeResponse`: 邮箱修改验证响应

#### 新增/更新的API函数：
- `register()`: 支持X-Product-Type请求头
- `verifyEmail()`: 使用新的验证端点
- `resendVerificationCode()`: 重新发送验证码
- `login()`: 支持X-Product-Type请求头，返回用户和组织信息
- `getOAuthToken()`: OAuth Token获取，支持多种登录场景
- `refreshOAuthToken()`: Token刷新
- `logout()`: 需要refresh_token参数
- `forgotPassword()`: 忘记密码
- `resetPassword()`: 重置密码
- `changePassword()`: 修改密码
- `getProfile()`: 获取用户资料
- `updateProfile()`: 更新用户资料
- `changeEmail()`: 修改邮箱（第一步）
- `verifyEmailChange()`: 修改邮箱（第二步）

### 2. 注册页面更新 (`src/pages/Register/index.tsx`)

#### 主要变更：
- 移除了`organizationName`字段（根据新API，注册时不创建组织）
- 更新了注册API调用，包含X-Product-Type请求头
- 更新了邮箱验证API调用
- 添加了重新发送验证码功能
- 改进了错误处理，支持新的错误响应格式
- 手机号码字段改为可选

#### 新增功能：
- 重新发送验证码按钮和逻辑
- 更好的错误信息显示
- 支持新的API响应格式

### 3. 登录页面更新 (`src/pages/Login/index.tsx`)

#### 主要变更：
- 更新登录流程：先调用登录API获取用户信息，再调用OAuth Token API获取token
- 支持X-Product-Type请求头
- 更新忘记密码和重置密码的API调用
- 改进了错误处理

#### 新的登录流程：
1. 调用`/api/auth-service/v1/identity/login`获取用户信息和组织列表
2. 调用`/oauth/token`获取access_token和refresh_token
3. 保存token并设置用户状态

### 4. AuthProvider更新 (`src/auth/AuthProvider.tsx`)

#### 主要变更：
- 更新登出逻辑，需要传递refresh_token
- 保持与新的API响应格式兼容

### 5. API测试页面更新 (`src/pages/ApiTest.tsx`)

#### 新增功能：
- 新版注册API测试
- 新版登录API测试
- OAuth Token获取测试
- 邮箱验证测试
- 重新发送验证码测试
- 测试数据输入界面
- 对比旧版API的功能

## API端点映射

### 用户注册流程
1. **注册**: `POST /api/auth-service/v1/identity/register`
   - 请求头: `X-Product-Type: beauty`
   - 响应: 返回邮箱，需要验证

2. **邮箱验证**: `POST /api/auth-service/v1/identity/verification`
   - 请求体: `{ email, code }`
   - 响应: 验证成功后可登录

3. **重新发送验证码**: `POST /api/auth-service/v1/identity/resend`
   - 请求体: `{ email, purpose: "signup" }`
   - 响应: 新的验证码已发送

### 用户登录流程
1. **登录**: `POST /api/auth-service/v1/identity/login`
   - 请求头: `X-Product-Type: beauty`
   - 响应: 用户信息和组织列表

2. **获取Token**: `POST /oauth/token`
   - 请求头: `X-Product-Type: beauty`
   - 请求体: `grant_type=password&username=email&password=xxx&client_id=tymoe-web`
   - 响应: access_token和refresh_token

### 密码管理
- **忘记密码**: `POST /api/auth-service/v1/identity/forgot-password`
- **重置密码**: `POST /api/auth-service/v1/identity/reset-password`
- **修改密码**: `POST /api/auth-service/v1/identity/change-password`

### 用户资料管理
- **获取资料**: `GET /api/auth-service/v1/identity/profile`
- **更新资料**: `PATCH /api/auth-service/v1/identity/profile`
- **修改邮箱**: `POST /api/auth-service/v1/identity/change-email`
- **验证邮箱修改**: `POST /api/auth-service/v1/identity/verification-email-change`

### 登出
- **登出**: `POST /api/auth-service/v1/identity/logout`
  - 请求体: `{ refresh_token }`
  - 响应: 登出成功

## 关键设计特点

### 1. 产品类型隔离
- 所有API调用都包含`X-Product-Type`请求头（beauty/fb）
- 支持多产品线的用户管理

### 2. 安全性增强
- 验证码使用bcrypt哈希存储
- 密码强度验证
- 账户锁定机制
- Token黑名单管理

### 3. 用户体验优化
- 分步注册流程（注册→验证→登录）
- 重新发送验证码功能
- 详细的错误信息
- 统一的响应格式

### 4. OAuth2标准
- 分离登录和Token获取
- 支持多种登录场景（User/Account/POS）
- Refresh Token机制

## 测试建议

1. 使用`/api-test`页面测试所有新的API端点
2. 测试完整的注册→验证→登录流程
3. 测试错误处理（无效邮箱、弱密码等）
4. 测试重新发送验证码功能
5. 测试忘记密码和重置密码流程

## 注意事项

1. 注册时不再创建组织，用户需要在控制台手动创建
2. 登录流程分为两步：获取用户信息 → 获取Token
3. 所有API都包含产品类型请求头
4. 验证码为6位数字，30分钟过期
5. 密码要求：至少8位，包含大小写字母和数字

## 兼容性

- 保持了与现有AuthProvider的兼容性
- 支持渐进式迁移
- 保留了旧版API测试功能用于对比


