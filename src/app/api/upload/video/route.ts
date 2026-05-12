import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminFromRequest } from "@/lib/auth";

/**
 * Client-direct upload endpoint for product videos.
 *
 * Why a separate route from /api/upload?
 *   Vercel serverless functions cap the request body at ~4.5 MB on the
 *   Hobby plan. Streaming a video through the function would fail for
 *   anything beyond a few seconds. Instead, this route only issues a
 *   short-lived token; the browser then uploads the file directly to
 *   Vercel Blob storage and reports back the public URL.
 *
 * Auth: admin only.
 */
export async function POST(req: Request): Promise<NextResponse> {
  // handleUpload makes two round-trips:
  //   1) generateToken (browser asks for upload permission) — auth here
  //   2) uploadCompleted (Blob notifies us after upload) — auth-skipped
  // Both come into the same route, so we check admin once on the initial
  // token request and trust the signed callback on completion.
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async () => {
        // Verified admin session is required to mint an upload token.
        const admin = await getAdminFromRequest(req as any);
        if (!admin) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime", // .mov from iPhones
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB cap on the token itself
          // tokenPayload travels back to onUploadCompleted; nothing extra to track for now
          tokenPayload: JSON.stringify({ admin: admin.id }),
        };
      },
      onUploadCompleted: async () => {
        // Hook for later (e.g. transcode, virus scan). No-op for now.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json(
      { error: e?.message ?? "Upload failed" },
      { status }
    );
  }
}
