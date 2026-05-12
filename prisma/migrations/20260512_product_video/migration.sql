-- Optional product video (mp4/webm hosted on Vercel Blob).
-- videoPoster overrides the default poster (first product image) when set.
ALTER TABLE "Product"
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "videoPoster" TEXT;
