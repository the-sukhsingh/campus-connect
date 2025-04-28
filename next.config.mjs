/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase serverless function timeout
  serverRuntimeConfig: {
    // Will only be available on the server side
    timeoutSeconds: 60,
  },
  // Add any needed rewrites for Netlify
  async rewrites() {
    return [
      // Optional: redirect API calls if needed
      // {
      //   source: '/api/:path*',
      //   destination: '/api/:path*',
      // },
    ];
  },
  // Optimize chunk loading and prevent 404s
  poweredByHeader: false,
  reactStrictMode: true,

  // Add output configuration to stabilize chunk filenames
  output: 'standalone',
  
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smartcampusconnect.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ["pdfkit"],
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
