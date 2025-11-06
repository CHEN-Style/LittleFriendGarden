-- ============================================================================
-- 补充约束、触发器和视图
-- 基于设计文档：宠物记录(健康 喂养 体重等)P1(改进版).md
-- ============================================================================

-- 0. 确保 set_updated_at 函数存在
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1) pet_weights 约束和触发器
-- ============================================================================

-- CHECK 约束：体重必须为正
ALTER TABLE pet_weights
  ADD CONSTRAINT chk_weight_positive CHECK (weight_kg > 0);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_pet_weights_updated_at ON pet_weights;
CREATE TRIGGER trg_pet_weights_updated_at
  BEFORE UPDATE ON pet_weights
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 最新体重视图
CREATE OR REPLACE VIEW pet_latest_weight_v AS
SELECT DISTINCT ON (pet_id)
  pet_id,
  id AS weight_id,
  measured_at,
  weight_kg,
  source,
  note,
  created_at
FROM pet_weights
WHERE deleted_at IS NULL
ORDER BY pet_id, measured_at DESC;

-- ============================================================================
-- 2) pet_feedings 约束和触发器
-- ============================================================================

-- CHECK 约束
ALTER TABLE pet_feedings
  ADD CONSTRAINT chk_amount_nonneg CHECK (amount_g IS NULL OR amount_g >= 0);

ALTER TABLE pet_feedings
  ADD CONSTRAINT chk_moisture_range CHECK (moisture_pct IS NULL OR (moisture_pct >= 0 AND moisture_pct <= 100));

ALTER TABLE pet_feedings
  ADD CONSTRAINT chk_calorie_nonneg CHECK (calories_kcal IS NULL OR calories_kcal >= 0);

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_pet_feedings_updated_at ON pet_feedings;
CREATE TRIGGER trg_pet_feedings_updated_at
  BEFORE UPDATE ON pet_feedings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 日喂养汇总视图
CREATE OR REPLACE VIEW pet_daily_feed_summary_v AS
SELECT
  pet_id,
  date_trunc('day', fed_at AT TIME ZONE 'UTC')::date AS d_utc,
  COUNT(*)                        AS feed_count,
  SUM(COALESCE(amount_g, 0))     AS total_amount_g,
  SUM(COALESCE(calories_kcal,0)) AS total_kcal
FROM pet_feedings
WHERE deleted_at IS NULL
GROUP BY pet_id, date_trunc('day', fed_at AT TIME ZONE 'UTC')::date;

-- ============================================================================
-- 3) pet_medical_records 约束和触发器
-- ============================================================================

-- CHECK 约束：kind 枚举
ALTER TABLE pet_medical_records
  ADD CONSTRAINT chk_medical_kind CHECK (
    kind IN ('vaccine','deworm','exam','surgery','medication','allergy','other')
  );

-- CHECK 约束：status 枚举
ALTER TABLE pet_medical_records
  ADD CONSTRAINT chk_medical_status CHECK (
    status IN ('planned','done','cancelled')
  );

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_pet_medical_records_updated_at ON pet_medical_records;
CREATE TRIGGER trg_pet_medical_records_updated_at
  BEFORE UPDATE ON pet_medical_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 4) reminders 约束和触发器
-- ============================================================================

-- CHECK 约束：priority 枚举
ALTER TABLE reminders
  ADD CONSTRAINT chk_rem_priority CHECK (
    priority IN ('low','medium','high','urgent')
  );

-- CHECK 约束：status 枚举
ALTER TABLE reminders
  ADD CONSTRAINT chk_rem_status CHECK (
    status IN ('pending','done','archived')
  );

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_reminders_updated_at ON reminders;
CREATE TRIGGER trg_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 5) pet_events 约束和触发器
-- ============================================================================

-- CHECK 约束：event_type 枚举
ALTER TABLE pet_events
  ADD CONSTRAINT chk_event_type CHECK (
    event_type IN ('weight','feeding','vaccination','deworm','vet_visit','bath','groom','walk','medication','note','other')
  );

-- CHECK 约束：确保 weight_id/feeding_id/medical_id 三选一或无
ALTER TABLE pet_events
  ADD CONSTRAINT chk_event_reference_exclusivity CHECK (
    (weight_id  IS NOT NULL)::int +
    (feeding_id IS NOT NULL)::int +
    (medical_id IS NOT NULL)::int
    IN (0,1)  -- 允许无绑定（纯日志），或仅一种绑定
  );

-- 更新时间触发器
DROP TRIGGER IF EXISTS trg_pet_events_updated_at ON pet_events;
CREATE TRIGGER trg_pet_events_updated_at
  BEFORE UPDATE ON pet_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 6) 统一健康时间线视图（基于 pet_events 的版本）
-- ============================================================================

CREATE OR REPLACE VIEW pet_health_timeline_v AS
SELECT
  e.pet_id,
  e.id           AS event_id,
  e.event_type,
  e.occurred_at,
  e.weight_id,
  e.feeding_id,
  e.medical_id,
  e.payload,
  e.created_at
FROM pet_events e
WHERE e.deleted_at IS NULL
ORDER BY e.occurred_at DESC;

-- ============================================================================
-- 完成
-- ============================================================================

