/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Bypass Vercel's `/_next/image` optimizer.
    //
    // Why: the Vercel Hobby plan caps image-optimization transformations at
    // ~1,000/month. Once exhausted, Vercel returns HTTP 402 for every
    // `/_next/image` request and the site looks broken (no images load).
    //
    // The images we serve are already on Vercel Blob storage — a global CDN
    // with on-the-fly caching — so further optimization is a nice-to-have, not
    // a necessity. Setting `unoptimized: true` makes <Image> render the source
    // URL directly via a plain <img> under the hood. We lose responsive
    // resizing and AVIF/WebP conversion, but every image renders again.
    //
    // To restore optimization later: upgrade to Vercel Pro (5,000/month free)
    // and flip this back to `false`.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
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
