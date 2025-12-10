import type { NextConfig } from 'next';

const isElectron = process.env.ELECTRON === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Configure for Electron
  ...(isElectron && {
    distDir: 'out',
    assetPrefix: './',
  }),
};

export default nextConfig;
