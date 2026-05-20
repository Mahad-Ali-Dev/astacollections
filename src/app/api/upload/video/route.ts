import { NextResponse } from "next/server";
import {
  getImageKit,
  isImageKitConfigured,
  getImageKitPublicKey,
} from "@/lib/imagekit";
import { getAdminFromRequest } from "@/lib/auth";

/**
 * Auth endpoint for ImageKit client-direct video uploads.
 *
 * Why a separate endpoint from /api/upload?
 *   Videos are typically larger than 4.5 MB, which is the Vercel Hobby
 *   function body limit. Streaming them through this function would fail.
 *   Instead the browser uploads directly to ImageKit using a short-lived
 *   signature minted here.
 *
 * Flow:
 *   1. Admin clicks "Upload video" in the product form
 *   2. Browser GETs this endpoint → receives { token, expire, signature, publicKey, urlEndpoint }
 *   3. Browser calls ImageKit's upload() with those auth params + the file
 *   4. Browser receives the uploaded URL back from ImageKit
 *   5. Browser posts the URL to /api/products as part of the form save
 *
 * Auth: admin session required to mint a signature.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isImageKitConfigured()) {
    return NextResponse.json(
      { error: "Video upload is not configured. Set IMAGEKIT_* env vars." },
      { status: 503 }
    );
  }

  const admin = await getAdminFromRequest(req as any);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Signed for ~10 minutes — long enough to finish even a slow upload.
  const expire = Math.floor(Date.now() / 1000) + 600;
  // getAuthenticationParameters auto-generates a fresh token if omitted, and
  // signs (token + expire) with the private key. Browser SDK validates this.
  const params = getImageKit().getAuthenticationParameters(undefined, expire);

  return NextResponse.json({
    token: params.token,
    expire: params.expire,
    signature: params.signature,
    publicKey: getImageKitPublicKey(),
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  });
}

// POST is kept for backwards-compat in case any old client still calls it.
// New clients should GET this endpoint and upload directly to ImageKit.
export async function POST(req: Request) {
  return GET(req);
}
