-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "birth_date" DATE,
    "color" TEXT,
    "avatar_asset_id" UUID,
    "primary_owner_id" UUID NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_owners" (
    "pet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_owners_pkey" PRIMARY KEY ("pet_id","user_id")
);

-- CreateTable
CREATE TABLE "pet_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pet_id" UUID,
    "uploader_user_id" UUID,
    "title" TEXT,
    "description" TEXT,
    "storage_url" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 's3',
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "pixel_width" INTEGER,
    "pixel_height" INTEGER,
    "duration_seconds" DECIMAL(10,3),
    "content_hash" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "moderation_status" TEXT NOT NULL DEFAULT 'pending',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "pet_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pets_primary_owner_id_idx" ON "pets"("primary_owner_id");

-- CreateIndex
CREATE INDEX "pet_owners_user_id_idx" ON "pet_owners"("user_id");

-- CreateIndex
CREATE INDEX "idx_pet_assets_pet_alive" ON "pet_assets"("pet_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_pet_assets_uploader_alive" ON "pet_assets"("uploader_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_pet_assets_content_hash" ON "pet_assets"("content_hash");

-- CreateIndex
CREATE INDEX "idx_pet_assets_mime" ON "pet_assets"("mime_type");

-- AddForeignKey
ALTER TABLE "user_todos" ADD CONSTRAINT "user_todos_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_primary_owner_id_fkey" FOREIGN KEY ("primary_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "pet_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_owners" ADD CONSTRAINT "pet_owners_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_owners" ADD CONSTRAINT "pet_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_assets" ADD CONSTRAINT "pet_assets_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_assets" ADD CONSTRAINT "pet_assets_uploader_user_id_fkey" FOREIGN KEY ("uploader_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
