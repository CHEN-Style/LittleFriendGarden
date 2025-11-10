-- This is an empty migration.-- ============================================
-- 日历聚合支持迁移脚本
-- 作用：添加数据库层面的视图、函数和约束
-- 日期：2025-11-07
-- ============================================

-- 1. 为 user_todos 添加 pet_id 外键约束（如果尚未存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_todos_pet_id_fkey'
  ) THEN
    ALTER TABLE user_todos
      ADD CONSTRAINT user_todos_pet_id_fkey
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 2. 创建或替换 updated_at 触发器函数（如果尚未存在）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 3. 为 user_todos 添加 updated_at 触发器
DROP TRIGGER IF EXISTS trg_user_todos_updated_at ON user_todos;
CREATE TRIGGER trg_user_todos_updated_at
BEFORE UPDATE ON user_todos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. 创建宠物可见性判定函数
-- 判断用户是否可以访问指定宠物
CREATE OR REPLACE FUNCTION is_pet_visible_to_user(p_user UUID, p_pet UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 如果宠物为 NULL，返回 TRUE
  IF p_pet IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 检查用户是否是宠物的所有者（主要所有者或共享所有者）
  RETURN EXISTS (
    SELECT 1 FROM pets
    WHERE id = p_pet
      AND deleted_at IS NULL
      AND (
        primary_owner_id = p_user
        OR EXISTS (
          SELECT 1 FROM pet_owners
          WHERE pet_id = p_pet
            AND user_id = p_user
        )
      )
  );
END
$$ LANGUAGE plpgsql STABLE;

-- 5. 创建日历聚合视图
-- 统一展示用户的待办和提醒
CREATE OR REPLACE VIEW calendar_items_v AS
-- 用户待办
SELECT
  t.id                 AS item_id,
  'user_todo'          AS item_kind,
  t.user_id,
  t.pet_id,
  t.title,
  t.description,
  t.priority,
  t.status,
  t.tags,
  COALESCE(t.scheduled_at, t.due_at) AS scheduled_at,
  t.due_at,
  t.completed_at,
  t.created_at,
  t.updated_at
FROM user_todos t
WHERE t.deleted_at IS NULL

UNION ALL

-- 宠物提醒
SELECT
  r.id                 AS item_id,
  'pet_reminder'       AS item_kind,
  r.user_id,
  r.pet_id,
  r.title,
  r.description,
  r.priority,
  r.status,
  ARRAY[]::TEXT[]      AS tags,
  r.scheduled_at,
  r.due_at,
  NULL::TIMESTAMPTZ    AS completed_at,
  r.created_at,
  r.updated_at
FROM reminders r
WHERE r.deleted_at IS NULL
  AND (r.pet_id IS NULL OR is_pet_visible_to_user(r.user_id, r.pet_id) = TRUE);

-- 6. 创建视图索引的建议注释
-- 注意：PostgreSQL 不支持直接在视图上创建索引
-- 但可以创建物化视图（如果需要性能优化）
-- 当前使用普通视图，查询性能依赖于底层表的索引

COMMENT ON VIEW calendar_items_v IS '
日历聚合视图：统一展示用户的待办（user_todos）和提醒（reminders）
- item_kind: user_todo | pet_reminder
- 自动过滤已删除的记录
- 自动验证宠物可见性权限
';

-- 7. 验证脚本执行成功
DO $$
BEGIN
  RAISE NOTICE '✅ Calendar support migration completed successfully!';
  RAISE NOTICE '   - Added foreign key constraint for user_todos.pet_id';
  RAISE NOTICE '   - Created set_updated_at() trigger function';
  RAISE NOTICE '   - Added trigger for user_todos.updated_at';
  RAISE NOTICE '   - Created is_pet_visible_to_user() function';
  RAISE NOTICE '   - Created calendar_items_v view';
END$$;

