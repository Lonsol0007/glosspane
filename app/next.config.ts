import type { NextConfig } from "next";

// NEXT_PUBLIC_TARGET=android builds static files for the Android wrapper (see scripts/build-android.mjs).
const android = process.env.NEXT_PUBLIC_TARGET === "android";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(android
    ? { output: "export" as const, images: { unoptimized: true } }
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "no-referrer" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
