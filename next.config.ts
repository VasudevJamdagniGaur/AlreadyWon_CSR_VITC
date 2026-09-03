import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  transpilePackages: ["firebase", "@firebase/auth", "@firebase/app"],
};

export default nextConfig;
