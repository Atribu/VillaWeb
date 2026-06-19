import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 300_000,
    serverActions: {
      bodySizeLimit: "300mb",
    },
  },
};

export default nextConfig;
