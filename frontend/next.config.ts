import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@solana/wallet-adapter-react-ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gateway.irys.xyz' },
      { protocol: 'https', hostname: 'arweave.net' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;