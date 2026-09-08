import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
