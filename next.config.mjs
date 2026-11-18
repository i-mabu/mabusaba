/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 向けに静的HTMLとして書き出す
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
