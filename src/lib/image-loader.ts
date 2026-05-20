/**
 * Custom Next.js Image loader → routes Vercel Blob images through ImageKit
 * when configured, falls back to direct URLs otherwise.
 *
 * Why we need this:
 *   Vercel's built-in `/_next/image` optimizer is capped at ~1,000 transformations
 *   per month on the Hobby plan. Once exhausted, every request returns HTTP 402
 *   and the site looks broken. A custom loader bypasses `/_next/image` entirely
 *   so quota is no longer an issue.
 *
 * How it works:
 *   • Read `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` (e.g. https://ik.imagekit.io/abcd1234)
 *   • When set: Vercel Blob URLs are rewritten through ImageKit with width + quality
 *     transformations baked into the URL (`?tr=w-800,q-75`). The browser fetches
 *     from ImageKit directly, ImageKit fetches once from Blob and caches the result.
 *   • When unset: returns the source URL unchanged. Browser still fetches the
 *     full-size image, but at least nothing 402s — useful in local dev or when
 *     ImageKit isn't set up yet.
 *   • Unsplash, ImageKit-already URLs, and local /uploads paths pass through with
 *     minimal transformation (or none) — they're either already optimized or
 *     served by Next's static handler.
 *
 * Setup:
 *   1. Sign up at https://imagekit.io (free: 20 GB bandwidth/month, unlimited
 *      transformations).
 *   2. Dashboard → "URL endpoints" → copy your default endpoint URL.
 *   3. Dashboard → "External storage" → "Add new origin" → "Web folder" →
 *      paste your Vercel Blob public URL prefix
 *      (e.g. https://9u9xmtyhzp5u7ht8.public.blob.vercel-storage.com).
 *      Attach this origin to your URL endpoint.
 *   4. In Vercel → Project Settings → Environment Variables, add:
 *        NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = https://ik.imagekit.io/abcd1234
 *      (use YOUR endpoint URL). Redeploy.
 *
 * Note: `NEXT_PUBLIC_*` env vars are inlined at build time, so adding/removing
 * the var requires a redeploy — not just a server restart.
 */

const IMAGEKIT_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(
  /\/$/,
  ""
);

// Matches https://<id>.public.blob.vercel-storage.com/...
const BLOB_HOSTNAME_RE = /\.public\.blob\.vercel-storage\.com$/i;

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const q = quality ?? 75;

  // Already on ImageKit — just append the transformation, don't double-wrap
  if (IMAGEKIT_ENDPOINT && src.startsWith(IMAGEKIT_ENDPOINT)) {
    return appendTransform(src, width, q);
  }

  // Vercel Blob — rewrite through ImageKit if configured
  if (IMAGEKIT_ENDPOINT && isVercelBlobUrl(src)) {
    try {
      const url = new URL(src);
      return `${IMAGEKIT_ENDPOINT}${url.pathname}?tr=w-${width},q-${q},f-auto`;
    } catch {
      return src; // malformed URL, fall through
    }
  }

  // Unsplash supports native URL transformations — keep them lightweight
  if (src.includes("images.unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(q));
      url.searchParams.set("auto", "format");
      return url.toString();
    } catch {
      return src;
    }
  }

  // Everything else (local /uploads, http://localhost dev, unknown CDNs): pass through
  return src;
}

function isVercelBlobUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return BLOB_HOSTNAME_RE.test(url.hostname);
  } catch {
    return false;
  }
}

/** Add or merge ImageKit `tr` transformation params on an already-IK URL. */
function appendTransform(src: string, width: number, quality: number): string {
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}tr=w-${width},q-${quality},f-auto`;
}
