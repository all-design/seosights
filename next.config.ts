import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  allowedDevOrigins: ["127.0.0.1", "seosights.com", "21.0.21.85"],
};

export default nextConfig;
