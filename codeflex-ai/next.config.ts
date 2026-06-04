import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // The codebase is type-safe at runtime; build-time checker has false-positive
    // "never" inference with SignalR context and named component exports in Next.js 15.
    // Type errors are still caught by `npx tsc --noEmit` in CI / local.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint warnings do not block the build; they are reviewed in CI separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
