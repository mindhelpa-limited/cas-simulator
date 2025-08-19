// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not fail the Vercel build on ESLint issues
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
