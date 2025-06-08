import type { NextConfig } from "next";
import { join } from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [],

  experimental: {
    esmExternals: true,
    swcPlugins: [],
  },

  webpack: (config, { isServer, dev }) => {
    // Add alias for @/
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': join(__dirname, 'src'),
    };

    // Standard Webpack experiments for WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (isServer) {
      // Define how WASM modules are named in the output (server-side)
      // This helps ensure a consistent path for emitted WASM files.
      config.output.webassemblyModuleFilename = dev
        ? 'static/wasm/[modulehash].wasm' // More detailed name during dev for debugging
        : 'static/wasm/[id].[modulehash].wasm'; // More robust naming for production

      // Explicitly tell Webpack how to handle .wasm files for server builds
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource', // Treat .wasm as a file to be emitted
        generator: {
          // Define where these emitted .wasm files should go in the build output
          filename: 'static/wasm/[name][ext]'
        }
      });

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
