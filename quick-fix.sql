-- 快速修复脚本 - 解决 is_default 字段不存在的错误

-- 1. 移除 is_default 字段（如果存在）
ALTER TABLE "item_attribute_options" 
DROP COLUMN IF EXISTS "is_default";

-- 2. 添加 display_order 字段
ALTER TABLE "item_attribute_options" 
ADD COLUMN IF NOT EXISTS "display_order" INTEGER DEFAULT 0;

-- 3. 添加商品级默认选项字段
ALTER TABLE "item_attributes" 
ADD COLUMN IF NOT EXISTS "default_option_id" UUID;

-- 4. 为现有选项设置显示顺序
UPDATE "item_attribute_options" 
SET "display_order" = 0 
WHERE "display_order" IS NULL;

COMMIT;

-- 验证修复结果
SELECT 'Migration completed successfully' as status;
