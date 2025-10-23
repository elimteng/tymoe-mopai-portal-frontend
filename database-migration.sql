-- 商品属性管理系统数据库迁移脚本
-- 根据新的API文档更新数据库结构

-- ==================== 第一步：备份现有数据 ====================

-- 备份 item_attribute_options 表的 is_default 数据（如果需要的话）
-- CREATE TABLE item_attribute_options_backup AS 
-- SELECT * FROM item_attribute_options WHERE is_default = true;

-- ==================== 第二步：修改 item_attribute_options 表 ====================

-- 1. 移除全局默认选项字段
ALTER TABLE "item_attribute_options" 
DROP COLUMN IF EXISTS "is_default";

-- 2. 添加显示顺序字段
ALTER TABLE "item_attribute_options" 
ADD COLUMN IF NOT EXISTS "display_order" INTEGER DEFAULT 0;

-- 3. 为现有数据设置默认的显示顺序
UPDATE "item_attribute_options" 
SET "display_order" = 
  (SELECT ROW_NUMBER() OVER (PARTITION BY attribute_type_id ORDER BY created_at) - 1 
   FROM "item_attribute_options" AS sub 
   WHERE sub.id = "item_attribute_options".id);

-- ==================== 第三步：修改 item_attributes 表 ====================

-- 添加商品级默认选项字段
ALTER TABLE "item_attributes" 
ADD COLUMN IF NOT EXISTS "default_option_id" UUID;

-- 添加外键约束（可选，但推荐）
ALTER TABLE "item_attributes" 
ADD CONSTRAINT "fk_item_attributes_default_option" 
FOREIGN KEY ("default_option_id") 
REFERENCES "item_attribute_options"("id") 
ON DELETE SET NULL;

-- ==================== 第四步：创建索引优化性能 ====================

-- 为显示顺序创建索引
CREATE INDEX IF NOT EXISTS "idx_item_attribute_options_display_order" 
ON "item_attribute_options"("attribute_type_id", "display_order");

-- 为默认选项创建索引
CREATE INDEX IF NOT EXISTS "idx_item_attributes_default_option" 
ON "item_attributes"("default_option_id");

-- ==================== 第五步：数据验证查询 ====================

-- 验证迁移是否成功
-- 1. 检查 item_attribute_options 表结构
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'item_attribute_options' 
-- ORDER BY ordinal_position;

-- 2. 检查 item_attributes 表结构
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'item_attributes' 
-- ORDER BY ordinal_position;

-- 3. 检查显示顺序是否正确设置
-- SELECT attribute_type_id, id, display_name, display_order 
-- FROM item_attribute_options 
-- ORDER BY attribute_type_id, display_order;

-- ==================== 可选：回滚脚本 ====================

-- 如果需要回滚，可以执行以下命令：
-- ALTER TABLE "item_attributes" DROP COLUMN IF EXISTS "default_option_id";
-- ALTER TABLE "item_attribute_options" DROP COLUMN IF EXISTS "display_order";
-- ALTER TABLE "item_attribute_options" ADD COLUMN "is_default" BOOLEAN DEFAULT false;

-- ==================== 迁移完成提示 ====================

-- 迁移完成后，请确保：
-- 1. 重启应用服务器
-- 2. 清除应用缓存
-- 3. 测试属性创建和编辑功能
-- 4. 验证商品属性配置功能

COMMIT;
