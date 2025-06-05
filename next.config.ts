import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep canvas as a simple external string as it's often a native addon
      config.externals = [
        ...config.externals,
        '@napi-rs/canvas'
      ];
    }
    return config;
  },
};

export default nextConfig;
