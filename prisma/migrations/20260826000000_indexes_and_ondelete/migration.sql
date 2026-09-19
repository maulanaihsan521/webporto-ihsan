-- =============================================================
-- Migration 2026-08-26: Tambah DB Indexes + onDelete Cascade/SetNull
-- =============================================================
-- Jalankan di Supabase SQL Editor (atau psql) terhadap database
-- `postgres.vjijkzlzqksgqsdrgxrm` (production).
--
-- IDEMPOTENT: Aman dijalankan ulang. CREATE INDEX IF NOT EXISTS &
-- DO blocks untuk DROP CONSTRAINT IF EXISTS + ADD hanya jika belum ada.
--
-- Tujuan:
--  1. Tambah 50+ composite/single index untuk optimasi query filter+sort
--     (Post.published+publishedAt, Portfolio.featured, Gallery.featured,
--     Comment.postId+approved, Message.read, ActivityLog.userId+createdAt,
--     Visitor.sessionId+createdAt untuk retention cleanup, dll)
--  2. Tambah onDelete rule pada FK yang belum ada:
--     - Category FK di Post/Portfolio/Certificate/Gallery -> SetNull
--       (cegah error saat Category dihapus; kolom *_categoryId jadi NULL)
--     - Comment.parentId (self-reference) -> Cascade (auto-purge reply orphan)
--     - Comment.userId -> SetNull (cegah error saat User dihapus)
--     - Message.replierId -> SetNull (idem)
--  3. Unique constraint VisitorCount(date, path) - cegah duplikasi entry per day
-- =============================================================

BEGIN;

-- =============================================================
-- SECTION 1: Indexes (idempotent - IF NOT EXISTS)
-- =============================================================
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Category_type_createdAt_idx" ON "Category"("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_published_publishedAt_idx" ON "Post"("published", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_featured_createdAt_idx" ON "Post"("featured", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS "Post_categoryId_idx" ON "Post"("categoryId");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Comment_postId_approved_createdAt_idx" ON "Comment"("postId", "approved", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX IF NOT EXISTS "Comment_approved_createdAt_idx" ON "Comment"("approved", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Comment_email_idx" ON "Comment"("email");
CREATE INDEX IF NOT EXISTS "Portfolio_status_featured_createdAt_idx" ON "Portfolio"("status", "featured", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Portfolio_categoryId_idx" ON "Portfolio"("categoryId");
CREATE INDEX IF NOT EXISTS "Portfolio_featured_createdAt_idx" ON "Portfolio"("featured", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Portfolio_createdAt_idx" ON "Portfolio"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PortfolioImage_portfolioId_order_idx" ON "PortfolioImage"("portfolioId", "order");
CREATE INDEX IF NOT EXISTS "Gallery_featured_order_idx" ON "Gallery"("featured", "order");
CREATE INDEX IF NOT EXISTS "Gallery_categoryId_idx" ON "Gallery"("categoryId");
CREATE INDEX IF NOT EXISTS "Gallery_order_idx" ON "Gallery"("order");
CREATE INDEX IF NOT EXISTS "Gallery_createdAt_idx" ON "Gallery"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Certificate_issueDate_idx" ON "Certificate"("issueDate" DESC);
CREATE INDEX IF NOT EXISTS "Certificate_featured_idx" ON "Certificate"("featured");
CREATE INDEX IF NOT EXISTS "Certificate_categoryId_idx" ON "Certificate"("categoryId");
CREATE INDEX IF NOT EXISTS "Certificate_issuer_idx" ON "Certificate"("issuer");
CREATE INDEX IF NOT EXISTS "Experience_order_startDate_idx" ON "Experience"("order", "startDate" DESC);
CREATE INDEX IF NOT EXISTS "Education_order_startDate_idx" ON "Education"("order", "startDate" DESC);
CREATE INDEX IF NOT EXISTS "Skill_featured_order_idx" ON "Skill"("featured", "order");
CREATE INDEX IF NOT EXISTS "Skill_category_order_idx" ON "Skill"("category", "order");
CREATE INDEX IF NOT EXISTS "Service_order_idx" ON "Service"("order");
CREATE INDEX IF NOT EXISTS "Testimonial_featured_order_idx" ON "Testimonial"("featured", "order");
CREATE INDEX IF NOT EXISTS "Faq_published_order_idx" ON "Faq"("published", "order");
CREATE INDEX IF NOT EXISTS "Message_read_createdAt_idx" ON "Message"("read", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Message_starred_createdAt_idx" ON "Message"("starred", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Message_email_idx" ON "Message"("email");
CREATE INDEX IF NOT EXISTS "Newsletter_active_createdAt_idx" ON "Newsletter"("active", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MarketArticle_published_publishedAt_idx" ON "MarketArticle"("published", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "MarketArticle_featured_publishedAt_idx" ON "MarketArticle"("featured", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "MarketArticle_type_publishedAt_idx" ON "MarketArticle"("type", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "MarketArticle_instrument_idx" ON "MarketArticle"("instrument");
CREATE INDEX IF NOT EXISTS "Watchlist_type_createdAt_idx" ON "Watchlist"("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Watchlist_symbol_idx" ON "Watchlist"("symbol");
CREATE INDEX IF NOT EXISTS "PortfolioHolding_type_createdAt_idx" ON "PortfolioHolding"("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PortfolioHolding_symbol_idx" ON "PortfolioHolding"("symbol");
CREATE INDEX IF NOT EXISTS "Media_folder_createdAt_idx" ON "Media"("folder", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Media_type_createdAt_idx" ON "Media"("type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Setting_group_idx" ON "Setting"("group");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Visitor_sessionId_idx" ON "Visitor"("sessionId");
CREATE INDEX IF NOT EXISTS "Visitor_createdAt_idx" ON "Visitor"("createdAt");
CREATE INDEX IF NOT EXISTS "Visitor_path_createdAt_idx" ON "Visitor"("path", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "VisitorCount_date_path_idx" ON "VisitorCount"("date" DESC, "path");
CREATE INDEX IF NOT EXISTS "_PostToTag_B_index" ON "_PostToTag"("B");

-- =============================================================
-- SECTION 2: FK onDelete changes (idempotent via DO block)
-- =============================================================
-- Comment.parentId (self-reference) -> CASCADE (auto-purge reply orphan)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Comment_parentId_fkey' AND table_name = 'Comment'
  ) THEN
    ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";
  END IF;
END $$;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comment.userId -> SET NULL (cegah error saat User dihapus)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Comment_userId_fkey' AND table_name = 'Comment'
  ) THEN
    ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";
  END IF;
END $$;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Post.categoryId -> SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Post_categoryId_fkey' AND table_name = 'Post'
  ) THEN
    ALTER TABLE "Post" DROP CONSTRAINT "Post_categoryId_fkey";
  END IF;
END $$;
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Portfolio.categoryId -> SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Portfolio_categoryId_fkey' AND table_name = 'Portfolio'
  ) THEN
    ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_categoryId_fkey";
  END IF;
END $$;
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Gallery.categoryId -> SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Gallery_categoryId_fkey' AND table_name = 'Gallery'
  ) THEN
    ALTER TABLE "Gallery" DROP CONSTRAINT "Gallery_categoryId_fkey";
  END IF;
END $$;
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Certificate.categoryId -> SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Certificate_categoryId_fkey' AND table_name = 'Certificate'
  ) THEN
    ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_categoryId_fkey";
  END IF;
END $$;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Message.replierId -> SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Message_replierId_fkey' AND table_name = 'Message'
  ) THEN
    ALTER TABLE "Message" DROP CONSTRAINT "Message_replierId_fkey";
  END IF;
END $$;
ALTER TABLE "Message" ADD CONSTRAINT "Message_replierId_fkey"
  FOREIGN KEY ("replierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
-- SECTION 3: Unique constraint VisitorCount(date, path) - cegah duplikasi
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'VisitorCount_date_path_key' AND table_name = 'VisitorCount'
  ) THEN
    ALTER TABLE "VisitorCount" ADD CONSTRAINT "VisitorCount_date_path_key" UNIQUE ("date", "path");
  END IF;
END $$;

COMMIT;

-- =============================================================
-- Verifikasi setelah migration:
-- SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '%_idx' ORDER BY tablename;
-- SELECT conname, confdelrule FROM pg_constraint WHERE conname LIKE '%_fkey' ORDER BY conname;
-- Expected confdelrule: 'c' = CASCADE, 'n' = SET NULL, 'a' = NO ACTION
-- =============================================================
