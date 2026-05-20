/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Custom loader bypasses Vercel's `/_next/image` (whose Hobby quota is
    // ~1,000 transformations/month — hitting it returns HTTP 402 and the
    // site looks broken). Loader behavior:
    //   • If NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is set → Vercel Blob images
    //     route through ImageKit (free: 20 GB bandwidth + unlimited transforms).
    //   • Otherwise → returns source URLs unchanged (no optimization, but no quota).
    // See src/lib/image-loader.ts for the setup steps + behavior matrix.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Production headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
