import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  allowedDevOrigins: ["127.0.0.1", "seosights.com", "21.0.21.85"],
  env: {
    // Hardcoded fallbacks for Vercel builds where env vars may not be set yet.
    // These NEXT_PUBLIC_ vars get inlined at build time.
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XSHV3B55X1",
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "wX2wY-kyjh6RDjRvDoi31f7iDsFZx2qxDC7OX4vWvK4",
  },
};

export default nextConfig;
