import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@prisma/client", "pg"],
};

export default nextConfig;
