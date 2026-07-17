import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 阶段一底图/截图均为本地自制静态资源(占位 SVG,后续替换为 WebP 实拍图),
    // 不涉及用户上传内容,允许 next/image 处理 SVG。
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
