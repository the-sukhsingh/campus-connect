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
};

export default nextConfig;
