
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com', // Added this entry
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    "https://9000-firebase-studio-1749202241482.cluster-ys234awlzbhwoxmkkse6qo3fz6.cloudworkstations.dev",
    // 你开发时用的本地地址也可以加
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
};

export default nextConfig;
