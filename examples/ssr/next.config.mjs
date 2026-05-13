/** @type {import('next').NextConfig} */
const nextConfig = {
  // The library exports both ESM and CJS; transpilePackages keeps Next happy
  // when consuming the local workspace build.
  transpilePackages: [
    '@effector-tanstack-query/core',
    '@effector-tanstack-query/react',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
}

export default nextConfig
