import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/export/**": ["./node_modules/@fontsource/cairo/files/*.woff"],
  },
};

export default nextConfig;
