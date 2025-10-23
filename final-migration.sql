-- 最终数据库迁移脚本
-- 根据最新API文档更新数据库结构

-- ==================== 移除不需要的字段 ====================

-- 移除 display_order 字段（选项级别的排序已废弃）
ALTER TABLE "item_attribute_options" 
DROP COLUMN IF EXISTS "display_order";

-- ==================== 添加新字段 ====================

-- 确保商品级默认选项字段存在
ALTER TABLE "item_attributes" 
ADD COLUMN IF NOT EXISTS "default_option_id" UUID;

-- 添加选项排序字段（商品级别的排序）
ALTER TABLE "item_attributes" 
ADD COLUMN IF NOT EXISTS "option_order" JSON;

-- ==================== 添加约束和索引 ====================

-- 添加外键约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_item_attributes_default_option'
    ) THEN
        ALTER TABLE "item_attributes" 
        ADD CONSTRAINT "fk_item_attributes_default_option" 
        FOREIGN KEY ("default_option_id") 
        REFERENCES "item_attribute_options"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 为默认选项创建索引
CREATE INDEX IF NOT EXISTS "idx_item_attributes_default_option" 
ON "item_attributes"("default_option_id");

-- 为选项排序创建索引
CREATE INDEX IF NOT EXISTS "idx_item_attributes_option_order" 
ON "item_attributes" USING GIN ("option_order");

-- ==================== 添加注释 ====================

COMMENT ON COLUMN "item_attributes"."default_option_id" IS '商品级默认选项ID，每个商品可设置不同的默认选项';
COMMENT ON COLUMN "item_attributes"."option_order" IS '商品属性选项的排序数组，存储选项ID的显示顺序，空表示按创建时间排序';

-- ==================== 验证查询 ====================

-- 检查表结构
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('item_attributes', 'item_attribute_options')
ORDER BY table_name, ordinal_position;

-- 检查约束
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('item_attributes', 'item_attribute_options')
ORDER BY table_name, constraint_name;

COMMIT;

-- ==================== 使用示例 ====================

-- 示例：为商品设置默认选项和排序
-- UPDATE item_attributes 
-- SET 
--     default_option_id = 'small-option-uuid',
--     option_order = '["large-option-uuid", "medium-option-uuid", "small-option-uuid"]'
-- WHERE item_id = 'some-item-uuid' AND attribute_type_id = 'size-type-uuid';

-- 示例：查询带有默认选项和排序的商品属性
-- SELECT 
--     ia.*,
--     iao_default.display_name as default_option_name,
--     iat.display_name as attribute_type_name
-- FROM item_attributes ia
-- LEFT JOIN item_attribute_options iao_default ON ia.default_option_id = iao_default.id
-- LEFT JOIN item_attribute_types iat ON ia.attribute_type_id = iat.id
-- WHERE ia.item_id = 'some-item-uuid';
