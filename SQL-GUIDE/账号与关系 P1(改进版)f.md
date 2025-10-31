# 账号与关系 P2（改进版）

> 数据库：PostgreSQL 13+
> 
> 
> **依赖扩展**：`pgcrypto`（UUID）、`citext`（不区分大小写邮箱/用户名）
> 

## 0. 准备

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

```

## 1. 通用工具与触发器

```sql
-- 1.1 统一的 updated_at 自动更新时间触发器
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 1.2 统一软删除视图辅助（可选）
-- 约定：所有支持软删除的表包含 deleted_at TIMESTAMPTZ NULL

```

## 2. 账号主体

```sql
-- 2.1 用户主表
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT UNIQUE,             -- 允许 NULL，便于三方登录；如邮箱即账号见下方“二选一”
  username          CITEXT UNIQUE,             -- 可选用户名，便于 @mention 与检索
  phone_e164        TEXT,                      -- 规范化手机号（含国家码）
  password_hash     TEXT,                      -- 如果采用本地登录
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 偏好设置（语言、通知开关等）
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 性能/过滤索引（常用 JSONB 热点键）
CREATE INDEX IF NOT EXISTS idx_users_settings_lang
  ON users ((settings->>'lang'));

-- 如“邮箱即账号、必须存在”，可切换为 NOT NULL（上线需谨慎迁移）：
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- 2.2 第三方身份（OAuth / Apple / WeChat 等）
CREATE TABLE IF NOT EXISTS user_identities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,      -- 'google' | 'apple' | 'wechat' | ...
  provider_uid  TEXT NOT NULL,      -- 身份在提供方的唯一ID
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_uid)
);

-- 2.3 用户档案（与认证解耦，便于隐私与展示分层）
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name   TEXT,
  bio            TEXT,
  avatar_url     TEXT,
  banner_url     TEXT,
  location_text  TEXT,
  birthday       DATE,
  visibility     TEXT NOT NULL DEFAULT 'public', -- 'public'|'friends'|'private'（用 CHECK 约束取代 ENUM）
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  CHECK (visibility IN ('public','friends','private'))
);

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

```

## 3. 关系网络：关注 & 屏蔽

```sql
-- 3.1 关注关系（单向）
CREATE TABLE IF NOT EXISTS user_follows (
  follower_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, followee_user_id),
  CHECK (follower_user_id <> followee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followee
  ON user_follows (followee_user_id);

-- 3.2 屏蔽关系（单向）
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON user_blocks (blocked_user_id);

```

## 4. 通知中心（可扩展 payload）

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,               -- 例如 'system','follow','like','comment','reminder'
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);

-- 常见检索：未读数量/最近列表
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

```

## 5. 用户待办（新）——支持与宠物记录解耦又能选择性关联宠物

> 采用 TEXT + CHECK 代替 ENUM，便于迭代；包含统一软删除字段。
> 
> 
> `pet_id` 为 **可选** 外键（若你在“宠物主数据”使用 `pets(id)`，此处将自动跨域关联）。
> 

```sql
CREATE TABLE IF NOT EXISTS user_todos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          UUID,  -- 可选：如关联到宠物（需要 pets 表存在）
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium',   -- 'low'|'medium'|'high'|'urgent'
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'done'|'archived'
  tags            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],  -- 轻量标签
  scheduled_at    TIMESTAMPTZ,       -- 计划时间（可用于提醒/日历）
  due_at          TIMESTAMPTZ,       -- 截止时间
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_user_todos_priority CHECK (priority IN ('low','medium','high','urgent')),
  CONSTRAINT chk_user_todos_status   CHECK (status   IN ('pending','done','archived'))
);

-- 如需关联宠物（public.pets），请打开外键（避免启动期跨域失败，可在宠物域建完后再执行）：
-- ALTER TABLE user_todos
--   ADD CONSTRAINT fk_user_todos_pet
--   FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL;

CREATE TRIGGER trg_user_todos_updated_at
BEFORE UPDATE ON user_todos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 常用索引：时间线+未删除筛选（部分索引）
CREATE INDEX IF NOT EXISTS idx_user_todos_user_scheduled_alive
  ON user_todos (user_id, scheduled_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_todos_user_status_alive
  ON user_todos (user_id, status)
  WHERE deleted_at IS NULL;

-- 标签检索（数组包含）
CREATE INDEX IF NOT EXISTS idx_user_todos_tags_gin
  ON user_todos USING GIN (tags);

```

## 6. 统一“日程/提醒/待办”视图（跨域聚合）

> 把“账号的 todo”与“宠物域的 reminders（或 events）”汇总为一个可供前端直接拉取的源。
> 
> 
> 其中 `is_pet_visible_to_user()` 作为占位函数，用于基于共享/主人关系做可见性控制（待在宠物域实现）。
> 

```sql
-- 6.1 可见性判定函数占位（请在宠物域补齐真实逻辑后替换）
CREATE OR REPLACE FUNCTION is_pet_visible_to_user(p_user UUID, p_pet UUID)
RETURNS BOOLEAN AS $$
  -- TODO：在宠物域实现：
  -- 1) 若 p_pet 的 primary_owner 或在 pet_owners 中包含 p_user => TRUE
  -- 2) 若宠物被设为公开或与 p_user 共享 => TRUE
  -- 3) 否则 FALSE
  SELECT TRUE;  -- 先放行，避免视图报错；上线前请替换为真实实现
$$ LANGUAGE sql STABLE;

-- 6.2 聚合视图（命名与字段尽量稳定，便于前端消费）
CREATE OR REPLACE VIEW calendar_items_v AS
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
  t.created_at,
  t.updated_at
FROM user_todos t
WHERE t.deleted_at IS NULL

UNION ALL

-- 下面这段依赖宠物域的 reminders 表。若尚未创建，请延后创建视图。
SELECT
  r.id                 AS item_id,
  'pet_reminder'       AS item_kind,
  r.user_id,           -- 或者 assigned_user_id（以实际表为准）
  r.pet_id,
  r.title,
  r.description,
  r.priority,
  r.status,
  ARRAY[]::TEXT[]      AS tags,
  r.scheduled_at,
  r.due_at,
  r.created_at,
  r.updated_at
FROM reminders r
WHERE r.deleted_at IS NULL
  AND is_pet_visible_to_user(r.user_id, r.pet_id) = TRUE;

```

> 注意：如果宠物域采用了不同的列名（如 reminder_status/reminder_priority），请相应调整上面的字段映射。
> 
> 
> 视图可作为“统一来源”，前端只需按 `item_kind` 切换 UI。
> 

## 7. RLS（行级安全）落地样例（可按需启用）

> RLS 能把访问控制“下沉到数据库”。以下给出两个可直接复用的样例。
> 
> 
> 启用前，后端需在会话中设置：`SET app.current_user_id = '<uuid>';`
> 

```sql
-- 7.1 限制只读自身 TODO
ALTER TABLE user_todos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT current_setting('app.current_user_id', true)::uuid
$$ LANGUAGE sql STABLE;

CREATE POLICY user_todos_select_own
  ON user_todos FOR SELECT
  USING (user_id = current_user_id() AND deleted_at IS NULL);

CREATE POLICY user_todos_modify_own
  ON user_todos FOR ALL
  USING (user_id = current_user_id());

-- 7.2 用户档案按可见性控制（示意）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_public
  ON user_profiles FOR SELECT
  USING (
    visibility = 'public' AND deleted_at IS NULL
  );

-- 好友可见与本人可见策略，可在有了“互相关注判定函数”后再追加：
-- CREATE POLICY user_profiles_friends ...
-- CREATE POLICY user_profiles_self ...

```

## 8. 约定与数据治理建议

- **邮箱策略（二选一）**
    1. **三方登录优先**：`users.email` 可空；使用 `user_identities` 记录外部身份。
    2. **邮箱即账号**：迁移后 `users.email SET NOT NULL`，并在注册链路完成唯一性与有效性校验。
- **软删除统一**：所有支持软删除的表均含 `deleted_at`，查询端默认 `WHERE deleted_at IS NULL`；为主要查询路径建立**部分索引**。
- **字典/枚举演进**：优先使用 `TEXT + CHECK`，当类型稳定后再考虑沉淀为字典表或生成码表。
- **阻断脏关系**：`user_blocks` 与业务查询应在上层统一过滤（如 feed、评论、私信等均需尊重阻断关系）。
- **可观测性**：关键表（登录、改密、敏感字段变更）建议加审计表或触发器（append-only），满足合规回溯。