/**
 * Server-only ImageKit client (lazy singleton).
 *
 * Why lazy: the SDK throws at construction if any of publicKey, privateKey, or
 * urlEndpoint are missing or empty. That trips Next.js's "collect page data"
 * phase at build time, even for routes that would never be called without keys.
 * We defer creation to first use so the build succeeds without env vars.
 *
 * Required env vars (set on Vercel):
 *   - NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT  e.g. https://ik.imagekit.io/y9rpe3s0k
 *   - IMAGEKIT_PUBLIC_KEY                public_xxx (from ImageKit Developer Options)
 *   - IMAGEKIT_PRIVATE_KEY               private_xxx (KEEP SECRET — server only)
 *
 * Do NOT import this from client components — the private key would leak.
 */
import ImageKit from "imagekit";

let cached: ImageKit | null = null;

function getEnv() {
  return {
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  };
}

export function isImageKitConfigured(): boolean {
  const { urlEndpoint, publicKey, privateKey } = getEnv();
  return !!(urlEndpoint && publicKey && privateKey);
}

export function getImageKit(): ImageKit {
  if (cached) return cached;
  const { urlEndpoint, publicKey, privateKey } = getEnv();
  if (!urlEndpoint || !publicKey || !privateKey) {
    const missing = [
      urlEndpoint ? null : "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
      publicKey ? null : "IMAGEKIT_PUBLIC_KEY",
      privateKey ? null : "IMAGEKIT_PRIVATE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`ImageKit env vars missing: ${missing}`);
  }
  cached = new ImageKit({ urlEndpoint, publicKey, privateKey });
  return cached;
}

export function getImageKitPublicKey(): string {
  return process.env.IMAGEKIT_PUBLIC_KEY ?? "";
}
