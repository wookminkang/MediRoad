import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 병원 사진 업로드(최대 5장, 원본 폰 사진 다수 MB)를 위해 상향
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" }, // 칼럼 이미지(Storage)
      { protocol: "https", hostname: "picsum.photos" }, // mock 데모 이미지
    ],
  },
};

export default nextConfig;
