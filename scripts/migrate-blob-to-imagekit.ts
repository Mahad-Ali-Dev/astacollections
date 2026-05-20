/**
 * One-time migration: copy every Vercel-Blob-hosted asset into ImageKit Media
 * Library and rewrite the DB to point at the new ImageKit URLs.
 *
 * Run with:
 *   npm run migrate:images
 *
 * What it touches:
 *   - ProductImage.url             (every product photo)
 *   - Category.image               (category banner / collection cover)
 *   - Product.videoUrl             (product videos)
 *   - Product.videoPoster          (video poster frames)
 *   - Setting.value                (hero1Image, hero2Image, etc.)
 *
 * What it does NOT touch:
 *   - Unsplash URLs                (already external, no migration needed)
 *   - URLs already on ImageKit     (idempotent — skipped on re-run)
 *   - Local /uploads/* paths       (dev only, no production data)
 *
 * Why it's safe to re-run:
 *   • Each row is updated in its own transaction
 *   • ImageKit upload uses useUniqueFileName:false + overwriteFile:true so the
 *     same filename always maps to the same Media Library entry — no duplicates
 *   • Rows that already point at ImageKit are skipped on subsequent runs
 *
 * Required env vars (read from .env / .env.local automatically):
 *   - DATABASE_URL
 *   - IMAGEKIT_PUBLIC_KEY
 *   - IMAGEKIT_PRIVATE_KEY
 *   - NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
 */
import "dotenv/config";
import ImageKit from "imagekit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

if (!urlEndpoint || !publicKey || !privateKey) {
  console.error(
    "Missing env vars. Make sure these are set in .env / .env.local:"
  );
  console.error(
    "  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY"
  );
  process.exit(1);
}

const imagekit = new ImageKit({ urlEndpoint, publicKey, privateKey });

const BLOB_HOSTNAME_RE = /\.public\.blob\.vercel-storage\.com$/i;
const IMAGEKIT_ENDPOINT_TRIM = urlEndpoint.replace(/\/$/, "");

interface Stats {
  scanned: number;
  migrated: number;
  skipped: number;
  failed: number;
}

const stats: Stats = { scanned: 0, migrated: 0, skipped: 0, failed: 0 };

/** True if url is hosted on Vercel Blob (the host we want to migrate away from). */
function isBlobUrl(url: string): boolean {
  try {
    return BLOB_HOSTNAME_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** True if url is already on our ImageKit endpoint. */
function isImageKitUrl(url: string): boolean {
  return url.startsWith(IMAGEKIT_ENDPOINT_TRIM);
}

/** Extract just the file name from a Vercel Blob URL, preserving the extension. */
function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.split("/").pop() ?? `import-${Date.now()}.bin`;
  } catch {
    return `import-${Date.now()}.bin`;
  }
}

/** Pick a folder based on what kind of asset this is (heuristic by URL pathname). */
function folderFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    // Vercel Blob URLs have pathnames like /uploads/foo.png or /products/videos/bar.mp4
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length > 1) return `/${parts.slice(0, -1).join("/")}`;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Upload a single Blob URL to ImageKit and return the new URL.
 * ImageKit fetches the source URL itself — no bytes flow through our machine.
 * If the same fileName already exists in ImageKit (idempotent re-runs),
 * overwriteFile:true replaces it with the same URL.
 */
async function migrateOne(
  blobUrl: string,
  defaultFolder: string
): Promise<string> {
  const fileName = filenameFromUrl(blobUrl);
  const folder = folderFromUrl(blobUrl, defaultFolder);

  const uploaded = await imagekit.upload({
    file: blobUrl, // SDK accepts URL string — ImageKit servers fetch it
    fileName,
    folder,
    useUniqueFileName: false,
    overwriteFile: true,
  });

  return uploaded.url;
}

/** Generic helper: migrate a single URL column on a model. */
async function migrateUrl(
  url: string | null | undefined,
  defaultFolder: string,
  label: string
): Promise<string | null> {
  if (!url) return null;
  stats.scanned += 1;

  if (isImageKitUrl(url)) {
    stats.skipped += 1;
    return url; // already migrated
  }
  if (!isBlobUrl(url)) {
    stats.skipped += 1;
    return url; // Unsplash / local / unknown — leave alone
  }

  try {
    const next = await migrateOne(url, defaultFolder);
    stats.migrated += 1;
    console.log(`  ✓ ${label}: ${url} → ${next}`);
    return next;
  } catch (e: any) {
    stats.failed += 1;
    console.error(`  ✗ ${label}: ${url} — ${e?.message ?? e}`);
    return url; // leave row as-is so it can be retried later
  }
}

async function migrateProductImages() {
  console.log("\n→ Migrating product images…");
  const images = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true },
  });
  for (const img of images) {
    const next = await migrateUrl(img.url, "/uploads", `Image ${img.id}`);
    if (next && next !== img.url) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: next },
      });
    }
  }
}

async function migrateProductVideos() {
  console.log("\n→ Migrating product videos + posters…");
  const products = await prisma.product.findMany({
    where: { OR: [{ videoUrl: { not: null } }, { videoPoster: { not: null } }] },
    select: { id: true, name: true, videoUrl: true, videoPoster: true },
  });
  for (const p of products) {
    const nextVideo = await migrateUrl(p.videoUrl, "/products/videos", `Video ${p.id}`);
    const nextPoster = await migrateUrl(
      p.videoPoster,
      "/products/videos",
      `Poster ${p.id}`
    );
    if (nextVideo !== p.videoUrl || nextPoster !== p.videoPoster) {
      await prisma.product.update({
        where: { id: p.id },
        data: { videoUrl: nextVideo, videoPoster: nextPoster },
      });
    }
  }
}

async function migrateCategoryImages() {
  console.log("\n→ Migrating category images…");
  const cats = await prisma.category.findMany({
    where: { image: { not: null } },
    select: { id: true, name: true, image: true },
  });
  for (const c of cats) {
    const next = await migrateUrl(c.image, "/uploads", `Category ${c.id}`);
    if (next !== c.image) {
      await prisma.category.update({
        where: { id: c.id },
        data: { image: next },
      });
    }
  }
}

async function migrateSettings() {
  console.log("\n→ Migrating settings (hero + banner images)…");
  // Settings is a key-value store; image keys live in `value`. We only migrate
  // ones whose value looks like a Vercel Blob URL.
  const rows = await prisma.setting.findMany();
  for (const row of rows) {
    if (typeof row.value !== "string") continue;
    if (!isBlobUrl(row.value)) continue;
    const next = await migrateUrl(row.value, "/uploads", `Setting ${row.key}`);
    if (next && next !== row.value) {
      await prisma.setting.update({
        where: { key: row.key },
        data: { value: next },
      });
    }
  }
}

async function main() {
  console.log("Starting Vercel Blob → ImageKit migration…");
  console.log(`Endpoint: ${urlEndpoint}\n`);

  await migrateProductImages();
  await migrateProductVideos();
  await migrateCategoryImages();
  await migrateSettings();

  console.log("\n──── Done ────");
  console.log(`  Scanned:  ${stats.scanned}`);
  console.log(`  Migrated: ${stats.migrated}`);
  console.log(`  Skipped:  ${stats.skipped} (Unsplash / already on ImageKit / local)`);
  console.log(`  Failed:   ${stats.failed}`);

  if (stats.failed > 0) {
    console.log(
      "\nFailures are usually because the source URL is unreachable (deleted from Blob, or Blob bandwidth quota hit). Re-run later to retry the failures — successful rows are now idempotent."
    );
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
