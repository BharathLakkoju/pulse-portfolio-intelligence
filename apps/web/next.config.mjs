/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pulse/calc-engine", "@pulse/shared-types"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "exceljs"],
  },
};

export default nextConfig;
