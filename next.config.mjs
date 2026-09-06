/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local assets are optimized automatically by the Netlify Next.js runtime.
    // Remote sources (e.g. a future CDN media library) must be whitelisted here.
    formats: ["image/avif", "image/webp"],
    // Quality values used anywhere in the app must be declared here — Next 16
    // makes this mandatory. 75 is the next/image default; the rest are the
    // photographic hero/CTA backdrops.
    qualities: [75, 78, 80, 82],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
