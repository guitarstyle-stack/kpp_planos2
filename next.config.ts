import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Expose VERCEL_URL to the application (Vercel sets this automatically)
    VERCEL_URL: process.env.VERCEL_URL,
  },
};

export default nextConfig;
