/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let the build pass even if ESLint finds issues
  eslint: { ignoreDuringBuilds: true },

  // (Optional) let the build pass even if TS has type errors
  // typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
