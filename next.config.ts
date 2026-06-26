import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" }, // 칼럼 이미지(Storage)
      { protocol: "https", hostname: "picsum.photos" }, // mock 데모 이미지
    ],
  },
};

export default nextConfig;
