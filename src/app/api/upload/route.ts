import { NextResponse } from "next/server";
import { getImageKit, isImageKitConfigured } from "@/lib/imagekit";

// We now upload product/category images directly to ImageKit's Media Library.
// Why: Vercel Blob has a 10 GB/month bandwidth cap on the Hobby plan, and we
// were hitting it. ImageKit's free tier gives us 20 GB storage + 20 GB CDN
// bandwidth with unlimited transformations — and every image now lives at
// the same CDN that serves it, so origin fetches drop to zero.
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    if (!isImageKitConfigured()) {
      return NextResponse.json(
        {
          error:
            "Image upload is not configured on the server. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT in Vercel env vars.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // Keep the same filename shape we used for Blob so any existing
    // assumptions about uploads/{timestamp}-{rand}.ext keep working.
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // ImageKit handles the actual transit; we send the bytes from the function
    // memory. The file is capped at 5MB so this fits well within Vercel's
    // serverless body limit even on the Hobby plan.
    const uploaded = await getImageKit().upload({
      file: buffer,
      fileName: filename,
      folder: "/uploads",
      useUniqueFileName: false,
    });

    // We return `url` to match the previous response shape so the admin form
    // doesn't need code changes.
    return NextResponse.json({ url: uploaded.url });
  } catch (e: any) {
    // ImageKit SDK errors carry a useful `.message`; surface it.
    console.error("upload error", e);
    return NextResponse.json(
      { error: e?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
