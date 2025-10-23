# 后端代码更新检查清单

## 🔍 需要检查和更新的文件

### 1. 数据模型 (Models/Entities)
- [ ] `ItemAttributeOption` 模型
  - [ ] 移除 `isDefault` 字段
  - [ ] 添加 `displayOrder` 字段
- [ ] `ItemAttribute` 模型
  - [ ] 添加 `defaultOptionId` 字段

### 2. 数据库查询 (Repositories/DAOs)
- [ ] 检查所有包含 `is_default` 的 SQL 查询
- [ ] 更新 CREATE/INSERT 语句
- [ ] 更新 SELECT 语句
- [ ] 更新 UPDATE 语句

### 3. API 控制器 (Controllers)
- [ ] 属性选项创建接口
- [ ] 属性选项更新接口
- [ ] 属性选项查询接口
- [ ] 商品属性关联接口

### 4. 服务层 (Services)
- [ ] 属性选项服务
- [ ] 商品属性服务
- [ ] 数据转换逻辑

## 🛠️ 具体修改示例

### Java/Spring Boot 示例

```java
// 修改前
@Entity
public class ItemAttributeOption {
    @Column(name = "is_default")
    private Boolean isDefault;
    
    // getters and setters
}

// 修改后
@Entity
public class ItemAttributeOption {
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    // getters and setters
}

@Entity
public class ItemAttribute {
    @Column(name = "default_option_id")
    private String defaultOptionId;
    
    // getters and setters
}
```

### Node.js/TypeScript 示例

```typescript
// 修改前
interface ItemAttributeOption {
  id: string;
  value: string;
  displayName: string;
  priceModifier: number;
  isDefault: boolean; // 移除这个字段
}

// 修改后
interface ItemAttributeOption {
  id: string;
  value: string;
  displayName: string;
  priceModifier: number;
  displayOrder: number; // 添加这个字段
}

interface ItemAttribute {
  id: string;
  itemId: string;
  attributeTypeId: string;
  isRequired: boolean;
  optionOverrides?: Record<string, { priceModifier: number }>;
  allowedOptions?: string[];
  defaultOptionId?: string; // 添加这个字段
}
```

## 🔍 需要搜索的关键词

在后端代码中搜索以下关键词：
- `is_default`
- `isDefault`
- `IsDefault`
- `default_option`
- `defaultOption`

## ⚠️ 常见错误位置

1. **ORM 映射文件**
   - Hibernate/JPA 注解
   - MyBatis XML 文件
   - Sequelize 模型定义

2. **SQL 查询文件**
   - 原生 SQL 查询
   - 存储过程
   - 视图定义

3. **API 响应格式**
   - DTO 类
   - 序列化配置
   - API 文档

## 🧪 测试检查点

- [ ] 创建属性类型和选项
- [ ] 更新属性选项
- [ ] 查询属性选项列表
- [ ] 创建商品时设置默认选项
- [ ] 更新商品属性配置
- [ ] API 响应格式正确

## 🚀 部署步骤

1. **数据库迁移**
   ```sql
   -- 执行 quick-fix.sql 或 database-migration.sql
   ```

2. **后端代码更新**
   - 更新模型定义
   - 更新查询语句
   - 更新 API 接口

3. **重启服务**
   - 重启应用服务器
   - 清除缓存

4. **验证功能**
   - 测试属性管理
   - 测试商品配置
   - 检查 API 响应
