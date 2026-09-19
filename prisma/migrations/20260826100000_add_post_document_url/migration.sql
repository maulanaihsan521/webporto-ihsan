-- Add documentUrl to Post: link dokumen asli (Google Drive/PDF) untuk tombol "Lihat Dokumen" di blog
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;
