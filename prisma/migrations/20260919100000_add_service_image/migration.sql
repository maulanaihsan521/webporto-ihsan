-- Task 9: foto service card bisa di-edit dari dashboard admin.
-- Kolom baru di tabel Service untuk menyimpan URL/path foto tema kartu.
-- Null/empty = frontend fallback ke foto default per slug
-- (public/images/services/*.jpg) sehingga tampilan lama tetap aman.

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Seed foto default per slug (idempotent — hanya isi yang masih NULL).
UPDATE "Service" SET "image" = '/images/services/digital-marketing.jpg'
WHERE "slug" = 'digital-marketing' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/social-media-management.jpg'
WHERE "slug" = 'social-media-management' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/photography.jpg'
WHERE "slug" = 'photography' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/videography.jpg'
WHERE "slug" = 'videography' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/video-editing.jpg'
WHERE "slug" = 'video-editing' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/website-development.jpg'
WHERE "slug" = 'website-development' AND "image" IS NULL;
UPDATE "Service" SET "image" = '/images/services/financial-market-research.jpg'
WHERE "slug" = 'financial-market-research' AND "image" IS NULL;
