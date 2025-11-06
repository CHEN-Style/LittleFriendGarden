-- Add CHECK constraints for pets table (with IF NOT EXISTS logic)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pets_species') THEN
    ALTER TABLE pets ADD CONSTRAINT chk_pets_species 
      CHECK (species IN ('cat','dog','bird','rabbit','reptile','fish','other'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pets_sex') THEN
    ALTER TABLE pets ADD CONSTRAINT chk_pets_sex 
      CHECK (sex IN ('male','female','unknown'));
  END IF;
END $$;

-- Add CHECK constraints for pet_owners table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pet_owners_role') THEN
    ALTER TABLE pet_owners ADD CONSTRAINT chk_pet_owners_role 
      CHECK (role IN ('owner','family','viewer'));
  END IF;
END $$;

-- Add CHECK constraints for pet_assets table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pet_assets_visibility') THEN
    ALTER TABLE pet_assets ADD CONSTRAINT chk_pet_assets_visibility 
      CHECK (visibility IN ('public','shared','private'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pet_assets_moderation_status') THEN
    ALTER TABLE pet_assets ADD CONSTRAINT chk_pet_assets_moderation_status 
      CHECK (moderation_status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- Trigger function to ensure primary_owner_id is in pet_owners
CREATE OR REPLACE FUNCTION ensure_primary_owner_in_pet_owners()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.primary_owner_id IS NOT NULL THEN
    INSERT INTO pet_owners (pet_id, user_id, role)
    VALUES (NEW.id, NEW.primary_owner_id, 'owner')
    ON CONFLICT (pet_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger to maintain primary owner consistency
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pets_primary_owner_consistency'
  ) THEN
    CREATE TRIGGER trg_pets_primary_owner_consistency
    AFTER INSERT OR UPDATE OF primary_owner_id ON pets
    FOR EACH ROW EXECUTE FUNCTION ensure_primary_owner_in_pet_owners();
  END IF;
END $$;

-- Create view for pet cover assets
CREATE OR REPLACE VIEW pet_cover_asset_v AS
WITH ranked AS (
  SELECT
    a.*,
    (a.meta->>'isCover') = 'true' AS is_cover_mark,
    ROW_NUMBER() OVER (
      PARTITION BY a.pet_id
      ORDER BY
        ((a.meta->>'isCover') = 'true') DESC,
        (CASE WHEN a.mime_type ILIKE 'image/%' THEN 1 ELSE 2 END),
        a.created_at DESC
    ) AS rn
  FROM pet_assets a
  WHERE a.deleted_at IS NULL AND a.pet_id IS NOT NULL
)
SELECT * FROM ranked WHERE rn = 1;

