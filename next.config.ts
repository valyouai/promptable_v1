import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Explicitly define pdfjs-dist as a commonjs external
      // Keep canvas as a simple external string as it's often a native addon
      config.externals = [
        ...config.externals,
        { 'pdfjs-dist': 'commonjs pdfjs-dist' },
        '@napi-rs/canvas'
      ];
    }
    return config;
  },
};

export default nextConfig;
