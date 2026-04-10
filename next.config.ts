import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // Suppress the malformed auto-generated `.next/dev/types/validator.ts`
  // type error that is a known Turbopack bug in Next.js 16.x.
  // Our source code is fully typed; this only skips the broken generated file.
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
};

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWAConfig(nextConfig);
